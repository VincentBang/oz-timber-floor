import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
const root=new URL('../../',import.meta.url).pathname,load=f=>JSON.parse(fs.readFileSync(root+f)),base='docs/seo-growth/evidence/2026-10-28-supplier-refresh/',plan=load(base+'REVIEWED_PLAN.json'),capture=load(base+'CAPTURE_VERIFIED.json'),data=load('data/product-catalogue.json');
test('fresh specifications remain exact captured product evidence, not cross-brand guesses',()=>{
 for(const p of plan.proposals){const source=capture.records.find(r=>r.url===p.source&&r.sha256===p.sourceSha256);assert(source);assert.equal(source.status,200);assert.equal(source.title,p.supplierTitle);assert.equal(source.fields.Brand,p.supplierBrand);assert(data.products.some(r=>r.id===p.id&&r.url===p.route&&p.changes.every(c=>r[c.field]===c.after)));for(const c of p.changes){assert(['thickness','boardSize','packSizeM2','finish'].includes(c.field));assert(!c.before||c.before==='To confirm');if(c.field==='finish')assert.equal(c.after,source.fields.Finish);if(c.field==='packSizeM2')assert.equal(c.after,source.fields.Pack.match(/^\d+(?:\.\d+)?/)[0]);}}
});
test('ETF five colours take explicit product dimensions, not the category URL number',()=>{
 for(const colour of ['arctic-marble','barnwood-oak','country-oak','frosty-pine','havana']){const p=data.products.find(p=>p.id==='etf-72hrs-water-resistant-laminate-'+colour);assert.equal(p.thickness,'12.3 mm');assert.equal(p.boardSize,'1810 mm x 196mm');assert(!p.packSizeM2);assert(!p.waterResistance);assert(!p.commercialSuitability);}
});
test('ambiguous formats and suspect supplier dimensions never enter reviewed blank fills',()=>{
 for(const p of plan.proposals)for(const c of p.changes){if(c.field==='boardSize')assert(!/AVAILABLE IN|Pack Qty|Kgs|1518 x 26|190 x 190 x|Wear Layer|Underlay/.test(c.after));if(c.field==='finish')assert(!/AC\d|waterproof|warranty|realistic/i.test(c.after));}
 const colour=p=>p.id==='easi-plank-herringbone-classic-spotted-gum';assert(!plan.proposals.some(colour));
});
