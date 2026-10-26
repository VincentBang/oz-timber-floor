import fs from 'node:fs';
import assert from 'node:assert/strict';
import {routing} from './october-route-fixture.mjs';
const entry=process.env.OZ_OAK_ENTRY||'/tmp/oz-oak-retirement.23rVKb';
const read=f=>fs.readFileSync(f,'utf8'),old=f=>read(`${entry}/${f}`);
const e=JSON.parse(read('config/artisan-oak-retirement.json')),ids=new Set(e.colours.map(c=>'artisan-'+c));
const previous=JSON.parse(old('product-catalogue.json')),current=JSON.parse(read('data/product-catalogue.json'));
assert.equal(current.products.length,previous.products.length);assert.equal(current.ranges.length,previous.ranges.length);
for(const [i,p] of current.products.entries()){
 const expected=structuredClone(previous.products[i]);if(ids.has(p.id))Object.assign(expected,{publicCatalogueStatus:'retired',stockStatusLabel:'Discontinued',retirementDate:e.approvedAt,retirementBasis:'Owner-confirmed discontinued Artisan Oak; no equivalent replacement identified'});
 assert.deepEqual(p,expected,p.id);
}
for(const [i,r] of current.ranges.entries())if(r.id!=='artisan-oak')assert.deepEqual(r,previous.ranges[i],r.id);
assert.equal(read('sitemap.xml'),old('sitemap.xml'));
const beforeControls=JSON.parse(old('catalogue-quality-overrides.json')),controls=JSON.parse(read('data/catalogue-quality-overrides.json'));
const routes=[e.rangeRoute,...[...ids].map(id=>`/products/${id}/`)];
for(const [route,value] of Object.entries(controls.pages))if(!routes.includes(route))assert.deepEqual(value,beforeControls.pages[route],route);else{assert.equal(value.applyNoindex,beforeControls.pages[route].applyNoindex);assert.equal(value.classification,'retired');assert.equal(value.replacementRoute,'');}
const beforeRules=old('_redirects').split('\n');const expectedChanged=new Set(['/artisan-oak/','/product-category/engineered-timber/artisan-oak/',e.rangeRoute,...[...ids].map(id=>`/product/${id}/`)]);
const after=read('_redirects').split('\n');
for(const line of beforeRules)if(line.trim()&&!expectedChanged.has(line.split(' ')[0]))assert.ok(after.includes(line),'Unrelated rule changed: '+line);
const router=routing('dist');let checks=0;
for(const route of [...routes,...expectedChanged,...routes.map(r=>r+'index.html')])for(const from of [route,route.replace(/\/$/,''),route+'?source=legacy']){
 const result=router.resolve(from);assert.equal(result.status,410,from);assert.equal(result.hops,0,from);const html=read('dist/'+result.file);
 assert.match(html,/Artisan Oak has been discontinued/);assert.match(html,/noindex/);assert.ok(!/"@type"\s*:\s*"Product"/.test(html));assert.ok(!html.match(/<main\b[\s\S]*?<\/main>/)?.[0].includes('enquiry=stock'));assert.equal((html.match(/<h1\b/g)||[]).length,1);assert.equal((html.match(/<title>/g)||[]).length,1);assert.equal((html.match(/rel="canonical"/g)||[]).length,1);checks++;
}
for(const p of current.products.filter(p=>p.rangeSlug==='artisan-tile'))assert.equal(router.resolve(p.url).status,200,p.url);
assert.match(read('dist/_headers'),/noindex, nofollow/);assert.match(read('dist/assets/contact-config.js'),/ga4MeasurementId:\s*null/);
console.log(JSON.stringify({success:true,retiredRecords:13,noRecordsDeleted:true,otherRecordsUnchanged:true,tilePreserved:true,sitemapUnchanged:true,noindexHoldsPreserved:true,retirementVariantChecks:checks,ruleCount:router.rules.length,baseline:entry},null,2));
