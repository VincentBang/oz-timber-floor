import fs from 'node:fs';
import assert from 'node:assert/strict';
import {artisanRetirementIssues} from './approved-artisan-retirement-check.mjs';
const input={source:'/product-category/engineered-timber/artisan-oak/',rule:{status:410,statusText:'410!',destination:'/ranges/artisan-oak/'},approvalBytes:fs.readFileSync('config/artisan-oak-retirement.json'),range:JSON.parse(fs.readFileSync('data/product-catalogue.json')).ranges.find(x=>x.id==='artisan-oak'),html:fs.readFileSync('ranges/artisan-oak/index.html','utf8'),sitemapRoutes:[],publicationRoutes:[]};
assert.deepEqual(artisanRetirementIssues(input),[]);
for(const mutation of [
 {rule:{...input.rule,status:301,statusText:'301!'}},
 {rule:{...input.rule,status:404,statusText:'404!'}},
 {rule:{...input.rule,statusText:'410'}},
 {rule:{...input.rule,destination:'/hybrid/'}},
 {approvalBytes:Buffer.from('{}')},
 {range:{...input.range,status:'active'}},
 {html:input.html.replace('noindex,follow','index,follow')},
 {sitemapRoutes:['/ranges/artisan-oak/']},
 {publicationRoutes:['/ranges/artisan-oak/']}
])assert.ok(artisanRetirementIssues({...input,...mutation}).length);
assert.equal(artisanRetirementIssues({...input,source:'/product-category/hybrid/artisan-tile/'}),null);
console.log('PASS exact retirement plus nine negative mutations and unrelated-route exclusion');
