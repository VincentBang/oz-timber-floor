import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import assert from 'node:assert/strict';
import {createPublicationInventory, publicationBlockingIssues} from './publication-inventory.mjs';
const root=process.cwd(), publish=path.join(root,'dist'), domain='https://oztimberfloor.com.au';
const output=path.join(root,'docs/migration-october-2026');
fs.mkdirSync(output,{recursive:true});
const rules=fs.readFileSync(publish+'/_redirects','utf8').split(/\r?\n/).flatMap((line,i)=>{
  if(!line.trim()||line.trim().startsWith('#'))return[];
  const [from,to,code='301',...conditions]=line.trim().split(/\s+/);
  assert.equal(conditions.length,0,'Conditions require explicit audit support');
  return [{from,to,status:parseInt(code),force:code.endsWith('!'),line:i+1}];
});
function physical(route) {
  const rel=decodeURIComponent(new URL(route,domain).pathname).replace(/^\//,'');
  return [rel||'index.html',rel.replace(/\/$/,'')+'/index.html',rel.replace(/\/$/,'')+'.html'].find(f=>{
    const target=path.resolve(publish,f);return target.startsWith(publish+'/')&&fs.existsSync(target)&&fs.statSync(target).isFile();
  });
}
function ruleMatch(from,pathname) {
  if(from.includes('*')) return pathname.startsWith(from.slice(0,from.indexOf('*')));
  return from.replace(/\/$/,'')===pathname.replace(/\/$/,'');
}
function step(route) {
  const url=new URL(route,domain), file=physical(url.href);
  const rule=rules.find(r=>ruleMatch(r.from,url.pathname));
  if(rule&&(!file||rule.force)) {
    const tail=rule.from.includes('*')?url.pathname.slice(rule.from.indexOf('*')):'';
    const destination=rule.to.replace(':splat',tail);
    return {...rule,destination,file:rule.status>=300&&rule.status<400?null:physical(destination)};
  }
  return {status:file?200:404,file,destination:url.pathname};
}
function resolve(route) {
  let current=route;const seen=new Set(),trail=[];
  for(let i=0;i<20;i++) {
    if(seen.has(current))return {status:0,hops:trail.length,loop:true,destination:current,trail};
    seen.add(current);const r=step(current);
    if(r.status>=300&&r.status<400){trail.push(r);current=r.destination;continue;}
    return {...r,hops:trail.length,loop:false,destination:new URL(current,domain).pathname,trail};
  }
  return {status:0,hops:trail.length,loop:true,destination:current,trail};
}
const attrs=tag=>Object.fromEntries([...tag.matchAll(/([\w:-]+)\s*=\s*"([^"]*)"/g)].map(m=>[m[1],m[2]]));
const state=file=>{
  const html=fs.readFileSync(publish+'/'+file,'utf8'),tags=[...html.matchAll(/<(?:meta|link)\b[^>]*>/g)].map(m=>attrs(m[0]));
  return {html,canonical:tags.find(x=>x.rel==='canonical')?.href,noindex:tags.some(x=>x.name==='robots'&&/noindex/.test(x.content)),description:tags.find(x=>x.name==='description')?.content};
};
const legacy=[...new Set(['post','page','product','product_cat'].flatMap(name=>[...fs.readFileSync(output+`/source/${name}-sitemap.xml`,'utf8').matchAll(/<loc>(.*?)<\/loc>/g)].map(m=>m[1])))];
const broad=new Set(['/hybrid/','/laminate/','/engineered-timber-flooring/','/solid-timber/','/vinyl/','/products/']);
const articleRoutes=JSON.parse(fs.readFileSync('config/october-article-routes.json'));
const rows=legacy.map(old_url=>{
  const route=new URL(old_url).pathname, first=step(route), final=resolve(route);
  const questionable=route.startsWith('/product/')&&broad.has(final.destination);
  const artisan=/^\/product\/artisan-(cotton-wood|biarritz|chanterelle|chantilly|naturalle|oxford-grey|provence|woodlands|natural-classic|romandie|montreux|brittany-grey)\/$/.test(route);
  return {old_url,current_status:first.status,destination:final.destination,final_status:final.status,destination_type:final.destination.startsWith('/products/')?'product':final.destination.startsWith('/guides/')?'guide':broad.has(final.destination)?'category':'page',relevant_mapping:artisan&&final.destination==='/hybrid/'?'NO_WRONG_FAMILY':questionable?'NEEDS_EVIDENCE':'NOT_INDEPENDENTLY_ADJUDICATED',action_taken:Object.hasOwn(articleRoutes,route.slice(1,-1))?'article_repaired':'preserved',notes:artisan?'Engineered Artisan Oak; current availability and correct final owner unresolved':questionable?'Broad product consolidation requires product status and GSC evidence; absence of data is not evidence of no equity':'',hops:final.hops,loop:final.loop};
});
const columns=Object.keys(rows[0]),csv=v=>'"'+String(v??'').replace(/"/g,'""')+'"';
fs.writeFileSync(output+'/migration-url-review.csv',columns.join(',')+'\n'+rows.map(r=>columns.map(c=>csv(r[c])).join(',')).join('\n')+'\n');
const failures=[], checks=[];
const check=(name,ok,detail)=>{checks.push({name,ok,detail});if(!ok)failures.push(name);};
for(const [slug,target] of Object.entries(articleRoutes)){const r=resolve('/'+slug+'/');check('article:'+slug,r.status===200&&r.hops===(target?1:0)&&r.destination===(target||'/'+slug+'/'),r);}
const allRuleResults=rules.map(r=>({from:r.from,...resolve(r.from.includes('*')?r.from.replace('*','october-audit-missing'):r.from)}));
check('no-effective-rule-loops',!allRuleResults.some(r=>r.loop));
check('no-effective-permanent-chains',!allRuleResults.some(r=>r.hops>1),allRuleResults.filter(r=>r.hops>1).map(r=>r.from));
const inventory=createPublicationInventory({root:publish,domain});
for(const issue of publicationBlockingIssues(inventory))failures.push('publication:'+JSON.stringify(issue));
const sitemap=[...fs.readFileSync(publish+'/sitemap.xml','utf8').matchAll(/<loc>(.*?)<\/loc>/g)].map(m=>m[1]);
let canonicalFailures=0,invalid=0,redirecting=0,blocked=0;
const brokenLinks=[],brokenAssets=[];
for(const url of sitemap){
  const r=resolve(url);if(r.status!==200){invalid++;continue;}if(r.hops)redirecting++;
  const s=state(r.file);if(s.noindex)blocked++;
  if(s.canonical!==url||!url.startsWith(domain+'/')||(s.html.match(/<h1\b/g)||[]).length!==1||!/<title>[^<]+<\/title>/.test(s.html)||!s.description)canonicalFailures++;
  for(const m of s.html.matchAll(/\b(href|src)="([^"]*)"/g)) {
    const raw=m[2].replace(/&amp;/g,'&');if(!raw||/^(mailto:|tel:|data:|#|javascript:)/.test(raw))continue;
    const u=new URL(raw,url);if(u.origin!==domain)continue;
    const dest=resolve(u.pathname);if(dest.status!==200)(m[1]==='src'?brokenAssets:brokenLinks).push({page:url,target:u.pathname,status:dest.status});
  }
}
check('sitemap-canonical-contract',!invalid&&!redirecting&&!blocked&&!canonicalFailures&&new Set(sitemap).size===sitemap.length,{count:sitemap.length,invalid,redirecting,blocked,duplicates:sitemap.length-new Set(sitemap).size,canonicalFailures});
check('internal-links',brokenLinks.length===0,brokenLinks);
check('assets',brokenAssets.length===0,brokenAssets);
check('staging-noindex',/X-Robots-Tag: noindex, nofollow/.test(fs.readFileSync(publish+'/_headers','utf8')));
check('staging-analytics-off',/ga4MeasurementId:\s*null/.test(fs.readFileSync(publish+'/assets/contact-config.js','utf8')));
check('verification-file',fs.readFileSync(publish+'/googlea11728cf4d174049.html','utf8').trim()==='google-site-verification: googlea11728cf4d174049.html');
check('verification-meta',fs.readFileSync(publish+'/index.html','utf8').includes('QaPyqRWcckOb0jkUyaeeRYh6E49kBUF6CySJBpnXYGk'));
const r1=JSON.parse(fs.readFileSync('docs/seo-migration/OZ-MIG-004/revisions/R1/DECISION_PLAN_R1.json'));
for(const route of r1.frozenDecisions.exact172HoldRoutes){const r=resolve(route);check('hold:'+route,r.status===200&&r.hops===0&&state(r.file).noindex);}
for(const op of r1.ruleOperations.filter(x=>x.sourceShadowedByExistingControlledPage)){const r=resolve(op.from);check('shadow:'+op.id,r.hops===0&&r.status===200&&state(r.file).noindex);}
for(const route of ['/hybrid/','/laminate/','/engineered-timber-flooring/','/floor-levelling/','/commercial-flooring/','/office-flooring/','/timber-floor-installation/']){const r=resolve(route);check('service:'+route,r.status===200&&r.hops===0&&state(r.file).canonical===domain+route&&!state(r.file).noindex);}
// Exercise the packaged routes over HTTP, not just filesystem existence.
const server=http.createServer((req,res)=>{const r=step(req.url);if(!['GET','HEAD'].includes(req.method)){res.writeHead(405);return res.end();}res.writeHead(r.status,r.status>=300&&r.status<400?{Location:r.destination}:{'X-Robots-Tag':'noindex, nofollow'});res.end(r.file?fs.readFileSync(publish+'/'+r.file):'');});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
let httpChecks=0;const httpFailures=[];
try {for(const url of [...new Set([...legacy,...sitemap])]){const route=new URL(url).pathname;const expected=step(route).status;const response=await fetch(`http://127.0.0.1:${server.address().port}${route}`,{redirect:'manual'});await response.arrayBuffer();httpChecks++;if(response.status!==expected)httpFailures.push({route,expected,actual:response.status});}}
finally{server.close();}
check('local-http-crawl',httpFailures.length===0,{httpChecks,httpFailures});
const summary={generatedAt:new Date().toISOString(),legacyUrls:legacy.length,direct200:rows.filter(r=>r.current_status===200).length,permanentRedirects:rows.filter(r=>[301,308].includes(r.current_status)).length,notFound:rows.filter(r=>r.final_status===404).length,gone:rows.filter(r=>r.final_status===410).length,chains:rows.filter(r=>r.hops>1).length,loops:rows.filter(r=>r.loop).length,knownIrrelevant:rows.filter(r=>r.relevant_mapping==='NO_WRONG_FAMILY').length,needsRelevanceEvidence:rows.filter(r=>r.relevant_mapping==='NEEDS_EVIDENCE').length,sitemap:{count:sitemap.length,invalid,redirecting,blocked,canonicalFailures,duplicates:sitemap.length-new Set(sitemap).size},ruleEntries:rules.length,checks,failures};
fs.writeFileSync(output+'/validation.json',JSON.stringify(summary,null,2)+'\n');
console.log(JSON.stringify({...summary,checks:checks.length},null,2));
if(failures.length||summary.notFound||summary.knownIrrelevant)process.exitCode=1;
