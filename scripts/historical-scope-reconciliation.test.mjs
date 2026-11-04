import fs from 'node:fs';import assert from 'node:assert/strict';import test from 'node:test';
import {assertSuccessor,replayCatalogue,assertReproducibleCorpus} from './historical-scope-reconciliation.mjs';
const root=process.cwd(),read=p=>fs.readFileSync(p),baseline=JSON.parse(read('docs/projects-redesign/evidence/BASELINE.json'));
test('published source successors reject any additional byte and preserve their historical baseline',()=>{
 const receipt=JSON.parse(read('docs/seo-growth/evidence/2026-10-28-stonefloor-retirement/BASELINE.json'));
 for(const file of ['assets/site.css','assets/site.js','assets/contact-config.js','contact.html','contact/index.html','projects.html','projects/index.html']){
  const expected=receipt.protectedFiles.find(x=>x.file===file).sha256;
  assertSuccessor(root,file,expected);
  assert.throws(()=>assertSuccessor(root,file,expected,Buffer.concat([read(file),Buffer.from('UNAPPROVED')])));
 }
});
test('each explained successor rejects one additional unrelated byte',()=>{
 for(const file of ['_redirects','assets/flooring-assistant.js','data/product-catalogue.json','sitemap.xml']){
  const expected=baseline.protectedFiles.find(x=>x.file===file).sha256;
  assertSuccessor(root,file,expected);
  let bad=Buffer.concat([read(file),Buffer.from('UNAPPROVED')]);
  assert.throws(()=>assertSuccessor(root,file,expected,bad));
 }
 assert.throws(()=>assertSuccessor(root,'projects.html','40063508fe8bbe8e1824774a36d48212cfe4053198a719b1943499d062ecc027',Buffer.concat([read('projects.html'),Buffer.from('changed')])));
});
test('a changed generated corpus cannot pass by retaining its approval identifiers',()=>{
 const bytes=read('assistant/generated/corpus.json'),changed=JSON.parse(bytes);
 changed.documents[0].facts[0].value='Unapproved fact';
 assert.throws(()=>assertReproducibleCorpus(root,Buffer.from(JSON.stringify(changed))),/differs from fresh source-derived rebuild/);
});
test('catalogue replay rejects changed stock, extra records, retired copy and dimensions',()=>{
 const original=JSON.parse(read('data/product-catalogue.json')),expected=baseline.protectedFiles.find(x=>x.file==='data/product-catalogue.json').sha256;
 for(const mutate of [c=>c.products[0].stockStatusLabel='In stock',c=>c.products.push({...c.products[0],id:'invented'}),c=>c.products.find(p=>p.id==='stone-floor-stone-oak').shortDescription='Active colour',c=>c.products[0].boardSize='999mm']){
  const changed=structuredClone(original);mutate(changed);assert.throws(()=>assertSuccessor(root,'data/product-catalogue.json',expected,Buffer.from(JSON.stringify(changed))));
 }
 const before=JSON.parse(read('docs/seo-growth/evidence/2026-10-28-stonefloor-retirement/before/data/product-catalogue.json'));
 before.products.find(p=>p.id==='swish-laminate-blackbutt-light').packSizeM2='999';assert.throws(()=>replayCatalogue(root,before));
});
