// Loopback mock harness only. All form POSTs are denied; no external delivery.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
import corpus from '../assistant/generated/corpus.json' with {type:'json'};
import policy from '../assistant/config/policy.json' with {type:'json'};
import {routing} from './october-route-fixture.mjs';
import {createHandler} from '../assistant/lib/handler.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),router=routing(root),port=Number(process.env.OZ_ASSISTANT_LOCAL_PORT||8840),origin='http://127.0.0.1:'+port;
const handle=createHandler({corpus,policy,settings:{enabled:true,mode:'mock',context:'local',allowedOrigin:origin,signingSecret:crypto.randomBytes(32).toString('hex')}});
const qa=process.env.OZ_GUIDE_QA==='true',qaDir=path.resolve(root,'../qa');
http.createServer(async(req,res)=>{
 const url=new URL(req.url,origin);res.setHeader('X-Robots-Tag','noindex, nofollow');res.setHeader('Cache-Control','no-store');
 if(qa&&['/__guideqa/harness.js','/__guideqa/axe.min.js'].includes(url.pathname)){const file=url.pathname.endsWith('axe.min.js')?path.resolve(root,'../qa-tools/node_modules/axe-core/axe.min.js'):qaDir+'/harness.js';res.setHeader('Content-Type','text/javascript');fs.createReadStream(file).pipe(res);return;}
 if(url.pathname==='/api/flooring-assistant'){
  const request=new Request(url,{method:req.method,headers:req.headers,...(req.method==='POST'?{body:req,duplex:'half'}:{})});const result=await handle(request,{ip:req.socket.remoteAddress});res.writeHead(result.status,Object.fromEntries(result.headers));res.end(await result.text());return;
 }
 if(!['GET','HEAD'].includes(req.method)){res.writeHead(405);res.end('Local mock: form submissions are disabled.');return;}
 if(url.pathname==='/assets/flooring-assistant-config.js'&&!url.searchParams.has('off')){res.setHeader('Content-Type','text/javascript');res.end('window.OZ_FLOORING_ASSISTANT=Object.freeze('+JSON.stringify({enabled:true,mode:'mock',productionUiReview:process.env.OZ_ASSISTANT_PRODUCTION_UI_REVIEW==='true'})+');');return;}
 let result=router.resolve(url.pathname),rel=result.file;
 if(result.hops){res.writeHead(301,{Location:result.destination});res.end();return;}
 if(!rel||!(/^(?:assets\/|products\/|ranges\/|guides\/)/.test(rel)||!rel.includes('/')&&/\.(html|txt|xml)$/.test(rel)||/^(contact|hybrid|floor-levelling|engineered-timber-flooring|thank-you)\//.test(rel))){res.writeHead(404);res.end();return;}
 const file=process.env.OZ_ASSISTANT_BASELINE==='true'&&rel==='assets/site.js'?root+'/docs/flooring-assistant/entry-site.js':path.resolve(root,rel);if(!file.startsWith(root+'/')||!fs.existsSync(file)){res.writeHead(404);res.end();return;}
 const types={'.js':'text/javascript','.css':'text/css','.html':'text/html','.webp':'image/webp','.png':'image/png','.jpg':'image/jpeg','.svg':'image/svg+xml','.woff2':'font/woff2'};
 res.writeHead(result.status,{'Content-Type':types[path.extname(file)]||'text/plain'});if(req.method==='HEAD')res.end();else if(qa&&file.endsWith('.html'))res.end(fs.readFileSync(file,'utf8').replace('</head>','<script src="/__guideqa/harness.js"></script><script src="/__guideqa/axe.min.js" defer></script></head>'));else fs.createReadStream(file).pipe(res);
}).listen(port,'127.0.0.1',()=>console.log('Mock assistant only: '+origin+' — forms/remote AI disabled'));
