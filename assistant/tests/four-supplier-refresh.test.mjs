import fs from 'node:fs';import test from 'node:test';import assert from 'node:assert/strict';
const root=new URL('../../',import.meta.url).pathname,load=f=>JSON.parse(fs.readFileSync(root+f)),dir='docs/seo-growth/evidence/2026-10-28-four-suppliers/',plan=load(dir+'REVIEWED_PLAN.json'),capture=load(dir+'CAPTURE_PARSED.json'),data=load('data/product-catalogue.json');
test('four-supplier repairs have exact captured source receipts and current record values',()=>{
 for(const p of plan.proposals){const source=capture.records.find(e=>e.url===p.source&&e.sha256===p.sourceSha256);assert(source);assert.equal(source.status,200);assert(['basstimber.com.au','ecoflooring.com.au','topdeckflooring.com.au','stonefloor.com.au'].includes(new URL(p.source).hostname));const record=data.products[p.recordIndex];assert.equal(record.id,p.id);assert.equal(record.url,p.route);for(const c of p.changes){assert(['thickness','boardSize','packSizeM2','finish'].includes(c.field));assert(!c.before||/^to confirm$/i.test(c.before));assert.equal(record[c.field],c.after);}}
});
test('retirement decisions, Bamboo restriction and multi-width pack uncertainty are preserved',()=>{
 assert(!plan.proposals.some(p=>/artisan-oak|bamboo|stone-floor-oak-beige|stone-floor-stone-oak|stone-floor-white-wash/.test(p.id)));assert(!plan.proposals.some(p=>p.range==='Avala'&&p.changes.some(c=>c.field==='packSizeM2')));
 for(const id of ['stone-floor-oak-beige','stone-floor-stone-oak','stone-floor-white-wash'])assert.equal(data.products.find(p=>p.id===id).publicCatalogueStatus,'retired');
});
test('new specifications do not introduce warranty, acoustic or medical guarantees',()=>{
 for(const p of plan.proposals)for(const c of p.changes){assert(!/warranty|waterproof|bathroom|commercial.rat|anti.bacter|VOC|AAAC|scratch.proof|guarantee/i.test(c.after));if(c.field==='packSizeM2')assert(/^\d+(?:\.\d+)?$/.test(c.after));}
});
