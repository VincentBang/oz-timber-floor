import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {parseMigrationRules,indexLiteralRules,stoneFloorFamilyCandidates,supersededHistoricalTarget} from './migration-rule-evidence.mjs';

const normalize=r=>r.replace(/\/index\.html$/, '/').replace(/\.html$/, '/');
test('literal variants retain order, rewrite, force and conditions; real duplicates remain',()=>{
 const rules=parseMigrationRules('/oak.html /oak/ 301!\n/oak/index.html /oak/ 301!\n/oak/ /oak.html 200!\n/x/ /a/ 301 Country=au\n/x/ /b/ 301',normalize), index=indexLiteralRules(rules);
 assert.equal(index.get('/oak/').length,1);assert.equal(rules[2].status,200);assert.equal(rules[2].force,true);assert.equal(rules[2].rawDestination,'/oak.html');assert.deepEqual(rules[3].conditions,['Country=au']);assert.equal(index.get('/x/').length,2);assert.deepEqual(rules.map(r=>r.line),[1,2,3,4,5]);
});
test('family evidence requires exact identity, source, date, category and listing',()=>{
 const old={slug:'stone-floor-bianco-white',rangeSlug:'stone-floor',colour:'Bianco White',category:'Hybrid'};
 const product={id:'stone-floor-tile-bianco-white',rangeSlug:'stone-floor-tile',colour:'Bianco White',category:'Hybrid',sourceUrl:'https://stonefloor.com.au/products/',supplierListingStatus:'listed',lastSupplierListingCheck:'2026-10-08'};
 assert.deepEqual(stoneFloorFamilyCandidates(old,[product]),['stone-floor-tile']);
 for(const patch of [{sourceUrl:''},{supplierListingStatus:'unknown'},{lastSupplierListingCheck:''},{category:'Laminate'},{publicCatalogueStatus:'retired'},{colour:'Other'},{id:'unrelated'}])assert.deepEqual(stoneFloorFamilyCandidates(old,[{...product,...patch}]),[]);
 assert.deepEqual(stoneFloorFamilyCandidates({...old,slug:'stone-floor-white-wash',colour:'White Wash'},[{...product,id:'stone-floor-timber-washed-oak',colour:'Washed Oak',rangeSlug:'stone-floor-timber'}]),[]);
 assert.deepEqual(stoneFloorFamilyCandidates({...old,slug:'stone-floor-stone-oak',colour:'Stone Oak'},[product]),[]);
});
test('only the unchanged historical archive and three exact successor pairs are allowed',()=>{
 const bytes=fs.readFileSync('docs/release/OZ-RELEASE-CLOSEOUT/generated/migration/gsc-equity-map-2026-09-01.csv');
 const input={bytes,source:'/product/stone-floor-oak-beige/',csvTarget:'/ranges/stone-floor-tile/',actualTarget:'/ranges/stone-floor/'};
 assert.equal(supersededHistoricalTarget(input),true);
 assert.equal(supersededHistoricalTarget({...input,source:'/product/stone-floor-blackbutt/',actualTarget:'/ranges/stone-floor-timber/'}),true);
 assert.equal(supersededHistoricalTarget({...input,source:'/oak-flooring-sydney/',csvTarget:'/engineered-timber-flooring/',actualTarget:'/oak-flooring-sydney/'}),true);
 for(const patch of [{bytes:Buffer.concat([bytes,Buffer.from(' ')])},{source:'/product/stone-floor-white-wash/'},{actualTarget:'/hybrid/'},{csvTarget:'/hybrid/'}])assert.equal(supersededHistoricalTarget({...input,...patch}),false);
});
