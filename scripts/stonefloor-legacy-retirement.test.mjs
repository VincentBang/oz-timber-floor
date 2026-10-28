import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {stonefloorRetirementIssues,approvedStonefloorSource,STONEFLOOR_RETIRED_IDS} from './approved-stonefloor-legacy-retirement.mjs';
import {createPublicationInventory} from './publication-inventory.mjs';
const root=new URL('../',import.meta.url).pathname;
const read=f=>fs.readFileSync(root+f);
const json=f=>JSON.parse(read(f));
const dir='docs/seo-growth/evidence/2026-10-28-stonefloor-retirement/';
const approvalBytes=read('config/stonefloor-legacy-retirement-2026-10-28.json');
const inventory=createPublicationInventory({root,domain:'https://oztimberfloor.com.au'});
const catalogue=json('data/product-catalogue.json'),controls=json('data/catalogue-quality-overrides.json');
for(const id of STONEFLOOR_RETIRED_IDS){
 const source=`/product/${id}/`,held=`/products/${id}/`;
 const state={source,approvalBytes,rule:{status:301,destination:'/ranges/stone-floor/',force:false,conditions:[]},product:catalogue.products.find(p=>p.id===id),control:controls.pages[held],html:read(held.slice(1)+'index.html').toString(),sitemapRoutes:inventory.sitemapRoutes,publicationRoutes:inventory.publicationRoutes};
 test(id+' exact retirement contract',()=>{assert.deepEqual(stonefloorRetirementIssues(state),[]);assert.equal((state.html.match(/<h1\b/g)||[]).length,1);});
 for(const [name,change]of Object.entries({approval:s=>s.approvalBytes=Buffer.from('altered'),target:s=>s.rule.destination='/ranges/stone-floor-tile/',force:s=>s.rule.force=true,conditions:s=>s.rule.conditions=['Country=au'],record:s=>s.product.publicCatalogueStatus='active',indexation:s=>s.sitemapRoutes.push(held),canonical:s=>s.html=s.html.replace('href="https://oztimberfloor.com.au'+held+'"','href="https://example.com/"'),activeCTA:s=>s.html=s.html.replace('</main>','<a>Check stock</a></main>')})){
  test(id+' rejects '+name,()=>{const changed=structuredClone(state);changed.approvalBytes=approvalBytes;change(changed);assert(stonefloorRetirementIssues(changed).length>0);});
 }
 test(id+' keeps generic footer stock link',()=>assert.deepEqual(stonefloorRetirementIssues({...state,html:state.html+'<footer>Check stock</footer>'}),[]));
}
test('only two catalogue records and redirect lines changed',()=>{
 const before=json(dir+'before/data/product-catalogue.json');
 assert.deepEqual(catalogue.products.filter(p=>!STONEFLOOR_RETIRED_IDS.includes(p.id)),before.products.filter(p=>!STONEFLOOR_RETIRED_IDS.includes(p.id)));
 const old=read(dir+'before/_redirects').toString();
 const expected=STONEFLOOR_RETIRED_IDS.reduce((s,id)=>s.replace(`/product/${id}/ /ranges/stone-floor-tile/ 301`,`/product/${id}/ /ranges/stone-floor/ 301`),old);
 assert.equal(read('_redirects').toString(),expected);
});
test('protected files unchanged and publication count retained',()=>{
 for(const f of json(dir+'BASELINE.json').protectedFiles)assert.equal(crypto.createHash('sha256').update(read(f.file)).digest('hex'),f.sha256,f.file);
 assert.equal(inventory.sitemapRoutes.length,773);
 assert.equal(approvedStonefloorSource('/product/stone-floor-washed-oak/',approvalBytes),false);
});
