import fs from 'node:fs';
import assert from 'node:assert/strict';
import {routing} from './october-route-fixture.mjs';
const read=f=>fs.readFileSync(f,'utf8'),m=JSON.parse(read('docs/demarque-consolidation/implementation.json')),pairs=m.pairs;
const before=JSON.parse(read(m.entry+'/data/product-catalogue.json')),after=JSON.parse(read('data/product-catalogue.json'));
assert.deepEqual(after.products,before.products.filter(p=>!pairs.some(x=>x.id===p.id)));
assert.deepEqual(after.ranges,before.ranges);
for(const pair of pairs){const old=before.products.find(p=>p.id===pair.id),archived=after.productAliases.find(p=>p.id===pair.id);assert.deepEqual(archived,{...old,publicCatalogueStatus:'legacy-alias',canonicalUrl:'https://oztimberfloor.com.au'+pair.owner,replacementRoute:pair.owner,aliasApprovedAt:'2026-10-07'});}
const oldControls=JSON.parse(read(m.entry+'/data/catalogue-quality-overrides.json')),newControls=JSON.parse(read('data/catalogue-quality-overrides.json'));
for(const [route,c] of Object.entries(newControls.pages))if(!pairs.some(p=>p.old===route))assert.deepEqual(c,oldControls.pages[route],route);
const locs=s=>[...s.matchAll(/<loc>([^<]+)<\/loc>/g)].map(x=>x[1]);
assert.deepEqual(locs(read('sitemap.xml')),locs(read(m.entry+'/sitemap.xml')).filter(u=>!pairs.some(p=>u==='https://oztimberfloor.com.au'+p.old)));assert.equal(locs(read('sitemap.xml')).length,771);
const r=routing('dist');let variants=0,shadows=0;
for(const p of pairs){for(const url of [p.old,p.old.slice(0,-1),p.old+'index.html',p.old+'?enquiry=stock']){const x=r.resolve(url);assert.equal(x.status,200);assert.equal(x.hops,1);assert.equal(x.destination,p.owner);assert.equal(x.trail[0].status,301);assert.equal(x.trail[0].force,true);variants++;}assert.equal(r.resolve(p.owner).hops,0);const h=read('dist'+p.old+'index.html');assert.match(h,/noindex,follow/);assert.ok(h.includes('rel="canonical" href="https://oztimberfloor.com.au'+p.owner+'"'));assert.ok(!h.includes('"@type":"Product"'));}
const oldRules=read(m.entry+'/_redirects').split('\n').filter(l=>l.trim()&&!l.startsWith('#'));
assert.equal(oldRules.length,1963);assert.equal(r.rules.length,1971);
for(const line of oldRules){const [from,to,code]=line.trim().split(/\s+/);const intended=m.ruleChanges.find(x=>x.before===line)?.after||line;assert.ok(read('_redirects').split('\n').includes(intended));if(!code.endsWith('!')&&r.physical(from)&&!from.includes('*')){assert.equal(r.step(from).status,200,from);shadows++;}}
for(const x of m.ruleChanges){const [from,to,code]=x.after.split(/\s+/);assert.equal(code,x.before.split(/\s+/)[2]);if(!r.physical(from)){assert.equal(r.resolve(from).hops,1);assert.equal(r.resolve(from).destination,to);variants++;}}
for(const {file} of m.changes.filter(x=>x.file.endsWith('.html'))){const h=read(file),old=read(m.entry+'/'+file);for(const re of [/<header\b[\s\S]*?<\/header>/,/<footer\b[\s\S]*?<\/footer>/])assert.equal(h.match(re)?.[0],old.match(re)?.[0]);if(!pairs.some(p=>file===p.old.slice(1)+'index.html'))for(const re of [/<link rel="canonical"[^>]*>/,/<meta name="robots"[^>]*>/])assert.equal(h.match(re)?.[0],old.match(re)?.[0]);for(const re of [/<h1\b/g,/<title>/g,/rel="canonical"/g])assert.equal([...h.matchAll(re)].length,1);for(const [,url] of h.matchAll(/href="(\/[^"#]*)"/g))assert.equal(r.resolve(url.replaceAll('&amp;','&')).status,200,file+url);}
assert.equal(after.ranges.find(r=>r.id==='wide-plank-water-resistant-laminate').colourCount,14);assert.match(read('dist/_headers'),/noindex, nofollow/);assert.match(read('dist/assets/contact-config.js'),/ga4MeasurementId:\s*null/);
const result={success:true,pairs:4,archivedRecords:4,unrelatedRecordsAndControlsPreserved:true,sitemap:771,redirectEntries:1971,variants,existingPhysicalShadowRulesPreserved:shadows,previewProtected:true};fs.writeFileSync('docs/demarque-consolidation/regression.json',JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result,null,2));
