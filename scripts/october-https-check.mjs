import fs from 'node:fs';
import path from 'node:path';
const base=process.argv[2];
if(!/^https:\/\/[a-f0-9]{24}--oztimberfloor\.netlify\.app$/.test(base||''))throw new Error('Only an immutable Oz draft URL is permitted');
const out='docs/migration-october-2026',domain='https://oztimberfloor.com.au';
const sitemap=[...fs.readFileSync('dist/sitemap.xml','utf8').matchAll(/<loc>(.*?)<\/loc>/g)].map(m=>new URL(m[1]).pathname);
const legacy=[...new Set(['post','page','product','product_cat'].flatMap(name=>[...fs.readFileSync(`${out}/source/${name}-sitemap.xml`,'utf8').matchAll(/<loc>(.*?)<\/loc>/g)].map(m=>new URL(m[1]).pathname)))];
const routes=[...new Set([...legacy,...sitemap,'/googlea11728cf4d174049.html','/assets/contact-config.js'])];
const cache=new Map();
function get(route){if(!cache.has(route))cache.set(route,(async()=>{for(let attempt=0;attempt<3;attempt++){try{const r=await fetch(base+route,{redirect:'manual',signal:AbortSignal.timeout(30000)});return{status:r.status,location:r.headers.get('location'),robots:r.headers.get('x-robots-tag'),body:await r.text()};}catch(e){if(attempt===2)throw e;}}})());return cache.get(route);}
const results=[];let next=0;
async function worker(){while(next<routes.length){const route=routes[next++];try{let current=route,r,hops=0;const seen=new Set();for(;hops<10;hops++){if(seen.has(current))throw new Error('redirect loop');seen.add(current);r=await get(current);if(r.status<300||r.status>=400)break;const target=new URL(r.location,base);if(target.origin!==base)throw new Error('Draft redirects outside its own origin');current=target.pathname+target.search;}
const errors=[];if(hops>1)errors.push('redirect chain');if(![200,410].includes(r.status))errors.push('unexpected status '+r.status);if(!/noindex/i.test(r.robots||''))errors.push('missing noindex');
if(sitemap.includes(route)){if(hops)errors.push('sitemap redirects');if(!r.body.includes(`rel="canonical" href="${domain}${route}"`)&&!r.body.includes(`href="${domain}${route}" rel="canonical"`))errors.push('canonical mismatch');if(/<meta[^>]*name="robots"[^>]*content="[^"]*noindex/.test(r.body))errors.push('publication meta noindex');}
if(route==='/assets/contact-config.js'&&!/ga4MeasurementId:\s*null/.test(r.body))errors.push('preview analytics configured');
if(route==='/googlea11728cf4d174049.html'&&r.body.trim()!=='google-site-verification: googlea11728cf4d174049.html')errors.push('verification mismatch');
results.push({route,status:r.status,finalRoute:current,hops,robots:r.robots,errors});
}catch(e){results.push({route,errors:[e.message]});}}}
await Promise.all(Array.from({length:8},worker));
results.sort((a,b)=>a.route.localeCompare(b.route));
const report={verifiedAt:new Date().toISOString(),base,method:'GET only; no form submissions',routeChecks:results.length,httpRequests:cache.size,passed:results.filter(r=>!r.errors.length).length,failures:results.filter(r=>r.errors.length),results};
fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,'https-validation.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({...report,results:undefined},null,2));if(report.failures.length)process.exitCode=1;
