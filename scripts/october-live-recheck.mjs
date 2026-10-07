import fs from 'node:fs';
import path from 'node:path';
const out=path.resolve('docs/migration-october-2026-followup');fs.mkdirSync(out,{recursive:true});
const routes=new Set(['/', '//checkout/','/assets/contact-config.js','/googlea11728cf4d174049.html','/floor-levelling/','/hybrid/','/laminate/','/commercial-flooring/','/engineered-timber-flooring/','/timber-floor-installation/','/office-flooring/','/innovakitchens/']);
for(const s of Object.keys(JSON.parse(fs.readFileSync('config/october-article-routes.json'))))routes.add('/'+s+'/');
for(const x of JSON.parse(fs.readFileSync('docs/migration-october-2026/artisan-pending.json')))routes.add(x.legacy);
for(const x of JSON.parse(fs.readFileSync(out+'/route-summary.json')).unresolved404s)routes.add(x.path);
for(const rule of fs.readFileSync('_redirects','utf8').split('\n')){const p=rule.split(/\s+/)[0];if(/^\/product(?:-category)?\//.test(p)&&/natural-oak-brown-8mm|interlaken|stone-floor-oak-beige|stone-floor-marble|stonewood-bamboo|verdura-french|etf-hybrid-spc-9mm/.test(p))routes.add(p);}
const todo=[...routes].flatMap(route=>['https://oztimberfloor.com.au','https://oztimberfloor.netlify.app'].map(base=>base+route));
todo.push('http://oztimberfloor.com.au/','http://www.oztimberfloor.com.au/','https://www.oztimberfloor.com.au/');
const results=[];
async function check(url){
 const chain=[];let current=url;
 try{for(let i=0;i<8;i++){
  const r=await fetch(current,{redirect:'manual',signal:AbortSignal.timeout(25000)});const body=await r.text();
  chain.push({url:current,status:r.status,location:r.headers.get('location'),robots:r.headers.get('x-robots-tag')});
  if(r.status>=300&&r.status<400&&r.headers.get('location')){current=new URL(r.headers.get('location'),current).href;continue;}
  return {url,checkedAt:new Date().toISOString(),chain,finalUrl:current,status:r.status,title:body.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1],h1:body.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1]?.replace(/<[^>]*>/g,''),canonical:body.match(/<link[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)/i)?.[1],ga4Ids:[...new Set(body.match(/G-[A-Z0-9]{8,}/g)||[])],ga4Null:/ga4MeasurementId:\s*null/.test(body),googleVerification:body.match(/name=["']google-site-verification["'][^>]*content=["']([^"']+)/i)?.[1]};
 }return {url,chain,error:'too many redirects'};}catch(e){return {url,chain,error:e.message};}
}
await Promise.all(Array.from({length:5},async()=>{while(todo.length){const url=todo.shift();results.push(await check(url));if(results.length%10===0)console.log('Read-only checks completed: '+results.length);}}));
results.sort((a,b)=>a.url.localeCompare(b.url));fs.writeFileSync(out+'/live-observations.json',JSON.stringify(results,null,2)+'\n');console.log(JSON.stringify({checks:results.length,errors:results.filter(x=>x.error)},null,2));
