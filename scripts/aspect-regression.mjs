import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {routing} from './october-route-fixture.mjs';
const entry='/tmp/oz-aspect.E7QOGG',read=f=>fs.readFileSync(f,'utf8');
const evidence=JSON.parse(read('docs/aspect-correction/supplier-evidence.json'));
const prefix='wide-plank-water-resistant-laminate',alias={'blackbutt-3':'blackbutt','spotted-gum-2':'spotted-gum'};
const ids=evidence.flatMap(e=>e.brand==='Aspect'?[`${prefix}-${alias[e.slug]||e.slug}`]:[`${prefix}-${e.slug}`,`de-marque-oak-${e.slug}`]);
const before=JSON.parse(read(`${entry}/product-catalogue.json`)),data=JSON.parse(read('data/product-catalogue.json'));
assert.equal(before.products.length,data.products.length);assert.equal(before.ranges.length,data.ranges.length);
for(const [i,p] of data.products.entries())if(!ids.includes(p.id))assert.deepEqual(p,before.products[i],p.id);
for(const [i,r] of data.ranges.entries())if(r.id!==prefix)assert.deepEqual(r,before.ranges[i],r.id);
for(const f of ['_redirects','sitemap.xml'])assert.equal(read(f),read(`${entry}/${f}`));
assert.equal(read('data/catalogue-quality-overrides.json'),read(`${entry}/catalogue-quality-overrides.json`));
const router=routing('dist');let links=0,images=0,protectedPages=0;
function walk(dir){return fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(dir,e.name)):[path.join(dir,e.name)]);}
const changedHtml=walk(`${entry}/files`).filter(f=>f.endsWith('.html')).map(f=>path.relative(`${entry}/files`,f));
for(const file of changedHtml){
 const html=read(file),old=read(`${entry}/files/${file}`);
 for(const pattern of [/<link rel="canonical"[^>]*>/,/<meta name="robots"[^>]*>/,/<header\b[\s\S]*?<\/header>/,/<footer\b[\s\S]*?<\/footer>/])assert.equal(html.match(pattern)?.[0],old.match(pattern)?.[0],file+pattern);
 for(const pattern of [/<h1\b/g,/<title>/g,/rel="canonical"/g,/<meta name="description"/g])assert.equal([...html.matchAll(pattern)].length,1,file+pattern);
 for(const [,src] of html.matchAll(/<img\b[^>]*src="([^"]+)"/g)){assert.ok(fs.existsSync('dist'+src),file+': '+src);images++;}
 for(const [,href] of html.matchAll(/href="(\/[^"#]*)"/g)){const result=router.resolve(href.replaceAll('&amp;','&'));assert.equal(result.status,200,file+': '+href);links++;}
 for(const [,raw] of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g))JSON.parse(raw);
 protectedPages++;
}
for(const id of ids){
 const p=data.products.find(p=>p.id===id),h=read(`products/${id}/index.html`);assert.ok(h.includes(`<strong>${p.thickness}</strong>`));assert.ok(h.includes(`<strong>${p.packSizeM2}</strong>`));
 for(const [,href] of h.matchAll(/href="(\/contact\/\?[^\"]+)"/g)){const u=new URL(href.replaceAll('&amp;','&'),'https://oztimberfloor.com.au');if(u.searchParams.get('productSlug')!==id)continue;assert.equal(u.searchParams.get('range'),p.range);assert.equal(u.searchParams.get('category'),p.category);assert.equal(u.searchParams.get('product'),p.name);}
}
const range=data.ranges.find(r=>r.id===prefix),html=read(`ranges/${prefix}/index.html`);
assert.equal(range.productSlugs.length,14);assert.equal(range.colourCount,14);
const section=html.match(/<section[^>]*id="colours"[\s\S]*?<\/section>/)[0];assert.equal((section.match(/<article\b/g)||[]).length,14);
for(const id of range.productSlugs)assert.ok(section.includes(`href="/products/${id}/"`));
assert.equal(data.products.find(p=>p.id===prefix+'-wattleseed').boardSize,'');
assert.match(read('dist/_headers'),/noindex, nofollow/);assert.match(read('dist/assets/contact-config.js'),/ga4MeasurementId:\s*null/);
const result={success:true,products:22,rangeOptions:14,protectedPages,links,images,unrelatedRecordsUnchanged:true,routingIndexationSitemapUnchanged:true,previewProtected:true,duplicateOwnerDecisionPending:true};
fs.writeFileSync('docs/aspect-correction/regression.json',JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result,null,2));
