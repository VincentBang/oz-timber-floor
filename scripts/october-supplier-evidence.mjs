// Read-only public supplier evidence. No supplier forms or downloads are submitted.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
const out=path.resolve('docs/migration-october-2026-followup/supplier');fs.mkdirSync(out,{recursive:true});
const catalogue=JSON.parse(fs.readFileSync('data/product-catalogue.json'));
const clean=s=>s.replace(/<[^>]+>/g,' ').replace(/&amp;/g,'&').replace(/&nbsp;/g,' ').replace(/\s+/g,' ').trim();
const normalize=s=>s.toLowerCase().replace(/[^a-z0-9]/g,'');
const results=[];
for(const [range,url] of [
 ['swish-oak-contemporary','https://ecoflooring.com.au/product-category/oak/swish-oak-contemporary/'],
 ['swish-oak-natura-handcrafted','https://ecoflooring.com.au/product-category/oak/swish-oak-natura-handcrafted/'],
 ['swish-laminate','https://ecoflooring.com.au/product-category/laminate/swish-laminate/']
]) {
 const listing=await fetch(url,{signal:AbortSignal.timeout(30000)}),html=await listing.text();
 const links=[...new Set([...html.matchAll(/href="(https:\/\/ecoflooring.com.au\/product\/[^"?#]+)"/g)].map(m=>m[1]))];
 for(const link of links) {
  const r=await fetch(link,{signal:AbortSignal.timeout(30000)}),body=await r.text();
  const title=clean(body.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i)?.[1]||'');
  const product=catalogue.products.find(p=>p.rangeSlug===range&&normalize(p.colour)===normalize(title));
  if(!product)continue;
  const technical=body.match(/id="tab-technical"[^>]*>([\s\S]*?)<\/div>/)?.[1]||'';
  const fields=Object.fromEntries([...technical.matchAll(/<li\b[^>]*>([\s\S]*?)<\/li>/g)].map(m=>{const text=clean(m[1]),i=text.indexOf(':');return [text.slice(0,i),text.slice(i+1).trim()];}));
  results.push({record:product.id,range,url:link,status:r.status,title,fields,sha256:crypto.createHash('sha256').update(body).digest('hex'),checkedAt:new Date().toISOString()});
  console.log(JSON.stringify(results.at(-1)));
 }
}
fs.writeFileSync(path.join(out,'product-specifications.json'),JSON.stringify(results,null,2)+'\n');
