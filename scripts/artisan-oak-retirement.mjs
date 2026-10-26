import fs from 'node:fs';
import assert from 'node:assert/strict';
import {routing} from './october-route-fixture.mjs';
const e=JSON.parse(fs.readFileSync('config/artisan-oak-retirement.json'));
const apply=process.argv.includes('--apply'),changes=[];
const read=f=>fs.readFileSync(f,'utf8');
function update(f,s){if(read(f)!==s){changes.push(f);if(apply)fs.writeFileSync(f,s);}}
const d=JSON.parse(read('data/product-catalogue.json')),overrides=JSON.parse(read('data/catalogue-quality-overrides.json'));
const controls=overrides.routes||overrides.pages||overrides;
assert.ok(controls['/ranges/artisan-oak/'],'Locate exact existing override map');
const range=d.ranges.find(r=>r.id==='artisan-oak');assert.ok(range);
Object.assign(range,{publicCatalogueStatus:'retired',status:'retired',visibleInRangeLibrary:false,preferredRangeSlug:'',canonicalName:'Artisan Oak',canonicalSlug:'artisan-oak',relatedRanges:[],catalogueNote:'Owner confirmed Artisan Oak discontinued on 2026-10-07. Not Artisan Tile. Retained as a private historical record; public URLs return 410.',lastCatalogueReview:e.approvedAt});
const routes=[e.rangeRoute];
for(const colour of e.colours){const p=d.products.find(p=>p.id===`artisan-${colour}`);assert.ok(p);Object.assign(p,{publicCatalogueStatus:'retired',stockStatusLabel:'Discontinued',retirementDate:e.approvedAt,retirementBasis:'Owner-confirmed discontinued Artisan Oak; no equivalent replacement identified'});routes.push(`/products/artisan-${colour}/`);}
for(const route of routes){const c=controls[route];assert.ok(c,route);assert.equal(c.applyNoindex,true,'Do not silently change indexation');Object.assign(c,{classification:'retired',replacementRoute:'',replacementBasis:'owner-confirmed-discontinued-no-replacement',directRedirect:false,reason:'Owner approved Artisan Oak retirement on 2026-10-07. Return 410 with discontinued notice; no replacement-product claim.'});
 const f=route.slice(1)+'index.html',old=read(f);
 const title=route===e.rangeRoute?'Artisan Oak discontinued':`Artisan Oak ${d.products.find(p=>p.url===route)?.colour||''} discontinued`;
 let html=old.replace(/<title>[\s\S]*?<\/title>/,`<title>${title} | Oz Timber Floor</title>`)
 .replace(/<meta\b[^>]*name="description"[^>]*>/,'<meta name="description" content="Artisan Oak has been discontinued. Browse current engineered timber flooring alternatives from Oz Timber Floor.">')
 .replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/g,'')
 .replace(/<main\b[^>]*>[\s\S]*?<\/main>/,`<main id="main-content"><section class="section"><div class="shell"><p class="eyebrow">Discontinued range</p><h1>${title}</h1><p>Artisan Oak has been discontinued and is no longer available to order.</p><p>Artisan Tile is a separate hybrid flooring range. It is not a replacement for Artisan Oak.</p><p>You can browse our current engineered timber options below. These are alternatives, not the same product.</p><div class="button-row"><a class="button" href="/engineered-timber-flooring/">Browse engineered timber</a><a class="button-secondary" href="/contact/">Contact us</a></div></div></section></main>`);
 assert.ok(/noindex/.test(html));assert.ok(!/"@type"\s*:\s*"Product"/.test(html));update(f,html);
}
update('data/product-catalogue.json',JSON.stringify(d,null,2)+'\n');update('data/catalogue-quality-overrides.json',JSON.stringify(overrides,null,2)+'\n');
let redirects=read('_redirects');
const existing=[['/artisan-oak/',e.rangeRoute],['/product-category/engineered-timber/artisan-oak/',e.rangeRoute],[e.rangeRoute,e.rangeRoute],...e.colours.map(c=>[`/product/artisan-${c}/`,`/products/artisan-${c}/`])];
for(const [from,to] of existing){const lines=redirects.split('\n'),i=lines.findIndex(l=>l.startsWith(from+' '));assert.ok(i>=0,from);lines[i]=`${from} ${to}index.html 410!`;redirects=lines.join('\n');}
const marker='# Owner-approved Artisan Oak retirement — exact URLs only';
const extra=routes.flatMap(route=>[...(route===e.rangeRoute?[]:[`${route} ${route}index.html 410!`]),`${route}index.html ${route}index.html 410!`]);
if(!redirects.includes(marker))redirects=marker+'\n'+extra.join('\n')+'\n'+redirects;
update('_redirects',redirects);
if(changes.length){console.log(JSON.stringify({apply,changes},null,2));if(!apply)process.exitCode=1;}
else{const r=routing('.');let checked=0;for(const route of [...existing.map(v=>v[0]),...routes,...routes.map(v=>v+'index.html')])for(const from of [route,route.replace(/\/$/,'')]){const x=r.resolve(from);assert.equal(x.status,410,from);assert.equal(x.hops,0,from);assert.ok(x.file);checked++;}console.log(JSON.stringify({success:true,retiredProducts:12,retiredRanges:1,status:410,routeVariants:checked,deletedRecords:0}));}
