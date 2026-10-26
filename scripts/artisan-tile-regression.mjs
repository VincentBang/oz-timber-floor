import fs from 'node:fs';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {routing} from './october-route-fixture.mjs';
const base='5fecd58f1cfce728047cf27c7659fd6fbee4e2d0';
const before=f=>execFileSync('git',['show',`${base}:${f}`],{maxBuffer:20*1024*1024}).toString();
const read=f=>fs.readFileSync(f,'utf8'),e=JSON.parse(read('config/artisan-tile-supplier-evidence.json'));
const old=JSON.parse(before('data/product-catalogue.json')),now=JSON.parse(read('data/product-catalogue.json'));
const allowed=['productCode','packSizeM2','plankOrTileFormat','sourceUrl','supplierSourceUrl','shortDescription'];
// Compare by preserved array position: inherited catalogue data contains duplicate IDs.
for(const [index,p] of now.products.entries()){const prior=old.products[index];assert.ok(prior);const copy=structuredClone(p);if(p.rangeSlug==='artisan-tile')for(const k of allowed)copy[k]=prior[k];assert.deepEqual(copy,prior,p.id);}
assert.equal(now.products.length,old.products.length);
for(const [index,r] of now.ranges.entries()){const prior=old.ranges[index],copy=structuredClone(r);if(r.id==='artisan-tile')for(const k of ['packSizeM2','catalogueNote','lastCatalogueReview'])copy[k]=prior[k];assert.deepEqual(copy,prior,r.id);}
assert.equal(now.ranges.length,old.ranges.length);
let expected=before('_redirects');
for(const colour of e.correctGenericRedirects)expected=expected.replace(`/product/artisan-${colour}/ /hybrid/ 301`,`/product/artisan-${colour}/ /products/artisan-tile-${colour}/ 301`);
assert.equal(read('_redirects'),expected,'Only ten exact destinations may change; preserve order, force and conditions');
for(const f of ['sitemap.xml','data/catalogue-quality-overrides.json','netlify.toml','robots.txt','assets/contact-config.js','assets/site.js','assets/site.css','contact/index.html','thank-you/index.html'])assert.equal(read(f),before(f),f);
const router=routing('dist');let aliases=0,unchangedPhysicalShadows=0;
for(const colour of Object.keys(e.colours)){
 const file=`products/artisan-tile-${colour}/index.html`,html=read(file),previous=before(file);
 for(const regex of [/<title>[^<]*<\/title>/g,/<h1\b[^>]*>[\s\S]*?<\/h1>/g,/<link\b[^>]*canonical[^>]*>/g,/<meta\b[^>]*name="robots"[^>]*>/g,/href="[^"]*"/g])assert.deepEqual(html.match(regex),previous.match(regex),file);
 assert.equal((html.match(/<h1\b/g)||[]).length,1);
 for(const rule of router.rules.filter(r=>r.to===`/products/artisan-tile-${colour}/`))for(const source of [rule.from,rule.from.replace(/\/$/,'')]){const r=router.resolve(source);assert.equal(r.status,200,source);const physical=router.physical(source);if(physical&&!rule.force){assert.equal(read(physical),before(physical),'Existing shadow must stay byte-identical');assert.equal(r.hops,0);unchangedPhysicalShadows++;}else{assert.equal(r.hops,1,source);assert.equal(r.destination,rule.to,source);aliases++;}}
 for(const match of html.matchAll(/(?:src|href)="(\/[^"?#]*)(?:[?#][^"]*)?"/g)){const p=match[1];if(p.startsWith('//'))continue;assert.ok(router.physical(p)||router.resolve(p).status===200,`${file}: ${p}`);}
}
assert.equal([...read('sitemap.xml').matchAll(/<loc>/g)].length,775);
assert.match(read('dist/_headers'),/X-Robots-Tag: noindex, nofollow/);
assert.match(read('dist/assets/contact-config.js'),/ga4MeasurementId:\s*null/);
console.log(JSON.stringify({success:true,products:12,aliasVariants:aliases,unchangedPhysicalShadowVariants:unchangedPhysicalShadows,unchangedSitemap:775,onlyDestinationChanges:10,allOtherRecordsUnchanged:true,protectedFilesUnchanged:10,baseline:base},null,2));
