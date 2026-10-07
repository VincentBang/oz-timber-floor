import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import assert from 'node:assert/strict';
import {routing} from './october-route-fixture.mjs';
import {createPublicationInventory} from './publication-inventory.mjs';
const publish=path.resolve(process.argv[2]||'dist'),production=process.argv.includes('--production'),r=routing(publish);
const out=path.resolve(process.env.OZ_FOLLOWUP_OUTPUT||'docs/migration-october-2026-followup');fs.mkdirSync(out,{recursive:true});
const template=fs.readFileSync(publish+'/_headers','utf8'),headers={};
for(const line of template.split('\n'))if(line.trim()&&line.trim()!=='/*'){const m=line.match(/^\s+([^:]+):\s*(.*)$/);assert.ok(m,'Only the observed wildcard header template is supported');headers[m[1]]=m[2];}
assert.equal(Object.keys(headers).filter(k=>/x-robots-tag/i.test(k)).length,production?0:1);
const server=http.createServer((req,res)=>{if(!['GET','HEAD'].includes(req.method)){res.writeHead(405);return res.end();}const result=r.step(req.url);res.writeHead(result.status,{...headers,...(result.status>=300&&result.status<400?{Location:result.destination}:{})});res.end(result.file?fs.readFileSync(path.join(publish,result.file)):'');});
await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
const inv=createPublicationInventory({root:publish,domain:'https://oztimberfloor.com.au'}),failures=[],redirectedPhysicalNoindex=[];let checks=0;
try{
 for(const route of [...inv.publicationRoutes,...inv.noindexRoutes]){
  const result=r.resolve(route),response=await fetch(`http://127.0.0.1:${server.address().port}${route}`,{redirect:'manual'}),body=await response.text();checks++;
  if(result.hops){
   assert.ok(inv.noindexRoutes.includes(route),'Publication URL must not redirect: '+route);
   assert.ok([301,308].includes(response.status),route);redirectedPhysicalNoindex.push(route);
  }else assert.equal(response.status,200,route);
  assert.equal(response.headers.has('x-robots-tag'),!production,route+' response header policy');
  if(!result.hops)assert.equal(/name="robots"[^>]*content="[^\"]*noindex/.test(body),inv.noindexRoutes.includes(route),route+' page-level hold');
 }
 assert.equal(inv.publicationRoutes.length,775);assert.equal(inv.noindexRoutes.length,1400);assert.deepEqual(inv.sitemapRoutes,inv.publicationRoutes);
 for(const file of ['config/october-followup-routes.json','config/october-article-routes.json']){
  const routes=JSON.parse(fs.readFileSync(file));
  for(const [key,target] of Object.entries(routes)){
   const route=key.startsWith('/')?key:'/'+key+'/';
   for(const variant of [...new Set([route,route.endsWith('/')?route.slice(0,-1):route])]){
    const response=await fetch(`http://127.0.0.1:${server.address().port}${variant}`,{redirect:'manual'});await response.arrayBuffer();checks++;
    assert.equal(response.status,target?301:200,variant);if(target)assert.equal(response.headers.get('location'),target);
    assert.equal(response.headers.has('x-robots-tag'),!production,variant+' redirect response headers');
   }
  }
 }
 const config=fs.readFileSync(publish+'/assets/contact-config.js','utf8');assert.equal(config.includes('ga4MeasurementId: "G-EWSMKKM9N8"'),production);
}catch(e){failures.push(e.stack);}finally{await new Promise(ok=>server.close(ok));}
const report={checkedAt:new Date().toISOString(),mode:production?'isolated-production':'protected-preview',scope:'HTTP responses from local fixture applying actual package _headers. Does not prove future Netlify custom-domain/TLS behaviour. Physical noindex aliases with existing forced redirects are reported separately, not claimed as served holds.',publication:inv.publicationRoutes.length,physicalNoindex:inv.noindexRoutes.length,redirectedPhysicalNoindex,httpChecks:checks,failures,success:!failures.length};
fs.writeFileSync(out+`/headers-${production?'production':'preview'}.json`,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));if(failures.length)process.exitCode=1;
