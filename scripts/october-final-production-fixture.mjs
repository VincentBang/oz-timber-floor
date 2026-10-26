import fs from 'node:fs';
import http from 'node:http';
import assert from 'node:assert/strict';
import path from 'node:path';
import {routing} from './october-route-fixture.mjs';
import {createPublicationInventory} from './publication-inventory.mjs';
const out='docs/migration-october-2026-final-repairs',r=routing('dist'),inv=createPublicationInventory({root:path.resolve('dist'),domain:'https://oztimberfloor.com.au'}),results=[];
for(const production of [false,true]){
 const template=fs.readFileSync(production?'config/netlify-headers/production':'dist/_headers','utf8'),headers={};
 for(const line of template.split('\n')){const m=line.match(/^\s+([^:]+):\s*(.*)$/);if(m)headers[m[1]]=m[2];}
 const server=http.createServer((req,res)=>{if(!['GET','HEAD'].includes(req.method)){res.writeHead(405);res.end();return;}const a=r.step(req.url);res.writeHead(a.status,{...headers,...(a.status===301?{Location:a.destination}:{})});res.end(a.file?fs.readFileSync('dist/'+a.file):'');});await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
 let count=0;const failures=[];
 try{for(const route of [...inv.publicationRoutes,...inv.noindexRoutes,'/sitemap_index.xml']){
  const response=await fetch(`http://127.0.0.1:${server.address().port}${route}`,{redirect:'manual'}),body=await response.text();count++;
  assert.equal(response.headers.has('x-robots-tag'),!production,route);
  assert.equal(response.status,r.step(route).status,route);
  if(response.status===200){const tags=body.match(/<meta\b[^>]*>/g)||[],held=tags.some(t=>/name="robots"/.test(t)&&/content="[^"]*noindex/.test(t));assert.equal(held,inv.noindexRoutes.includes(route),route);}
 }}catch(e){failures.push(e.stack);}finally{await new Promise(ok=>server.close(ok));}
 results.push({mode:production?'isolated-production-headers':'protected-preview',count,failures});
}
fs.writeFileSync(out+'/header-fixtures.json',JSON.stringify({scope:'Local HTTP header templates and current page policy only; not future Netlify custom-domain TLS/indexing',results},null,2)+'\n');console.log(JSON.stringify(results));if(results.some(x=>x.failures.length))process.exitCode=1;
