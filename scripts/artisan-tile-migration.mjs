// Exact, supplier-evidenced Artisan Tile repair; never applies to Artisan Oak.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {routing} from './october-route-fixture.mjs';
const apply=process.argv.includes('--apply');
const evidence=JSON.parse(fs.readFileSync('config/artisan-tile-supplier-evidence.json'));
const file='data/product-catalogue.json',data=JSON.parse(fs.readFileSync(file));
const changes=[];
function update(file,after){const before=fs.readFileSync(file,'utf8');if(before!==after){changes.push(file);if(apply)fs.writeFileSync(file,after);}}
const products=data.products.filter(p=>p.rangeSlug==='artisan-tile');
assert.equal(products.length,12);
const range=data.ranges.find(r=>r.id==='artisan-tile');
assert.equal(range.category,'Hybrid');assert.equal(range.colourCount,12);
range.packSizeM2=evidence.packSizeM2;
range.lastCatalogueReview=evidence.verifiedAt;
range.catalogueNote='Artisan Tile supplier range, 12 colour codes, dimensions and pack coverage verified against Topdeck on 2026-10-07. Artisan Oak is separate; no Oz stock claim is inferred.';
const correctedDescriptions={grigio:'A grey stone-look tile-style hybrid option for modern interiors.',madison:'A dark tile-style hybrid option with a richly textured appearance.'};
function spec(label,value){return `<div class="spec-item"><span>${label}</span><strong>${value}</strong></div>`;}
for(const p of products){
 const colour=p.id.replace(/^artisan-tile-/,''),code=evidence.colours[colour];assert.ok(code);
 assert.equal(p.category,'Hybrid');assert.equal(p.thickness,'9mm');assert.equal(p.boardSize,evidence.dimensions);
 p.productCode=code;p.packSizeM2=evidence.packSizeM2;p.plankOrTileFormat=evidence.format;
 p.sourceUrl=evidence.rangeSource;p.supplierSourceUrl=evidence.rangeSource;
 if(correctedDescriptions[colour])p.shortDescription=correctedDescriptions[colour];
 const f=`products/${p.id}/index.html`;let html=fs.readFileSync(f,'utf8');
 if(correctedDescriptions[colour])html=html.replaceAll('A timber-look tile-style hybrid option for modern homes, apartments and commercial-style interiors.',p.shortDescription);
 html=html.replace(/<div class="spec-item"><span>Pack size m²<\/span><strong>[^<]*<\/strong><\/div>/,spec('Pack size m²',p.packSizeM2));
 if(!html.includes('<span>Product code</span>'))html=html.replace(spec('Colour',p.colour),spec('Colour',p.colour)+spec('Product code',code));
 html=html.replace(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g,(tag,json)=>{
  const schema=JSON.parse(json);let changed=false;
  function visit(x){if(!x||typeof x!=='object')return;if(x['@type']==='Product'){
   for(const [name,value] of [['Product code',code],['Pack size m²',p.packSizeM2]]){
    x.additionalProperty ||= [];let prop=x.additionalProperty.find(v=>v.name===name);
    if(!prop){x.additionalProperty.push({'@type':'PropertyValue',name,value});changed=true;}
    else if(prop.value!==value){prop.value=value;changed=true;}
   }
  }Object.values(x).forEach(visit);}visit(schema);return changed?`<script type="application/ld+json">${JSON.stringify(schema)}</script>`:tag;
 });
 update(f,html);
}
update(file,JSON.stringify(data,null,2)+'\n');
let redirects=fs.readFileSync('_redirects','utf8');
for(const colour of evidence.correctGenericRedirects){
 const before=`/product/artisan-${colour}/ /hybrid/ 301`,after=`/product/artisan-${colour}/ /products/artisan-tile-${colour}/ 301`;
 assert.ok(redirects.split('\n').includes(before)||redirects.split('\n').includes(after));
 redirects=redirects.replace(before,after);
}
update('_redirects',redirects);
if(!changes.length){
 const router=routing('.');let variants=0;
 for(const [colour,code] of Object.entries(evidence.colours)){
  for(const from of [`/product/artisan-${colour}/`,`/product/artisan-${colour}`]){
   const r=router.resolve(from);assert.equal(r.status,200,from);assert.equal(r.hops,1,from);assert.equal(r.destination,`/products/artisan-tile-${colour}/`,from);variants++;
  }
  const html=fs.readFileSync(`products/artisan-tile-${colour}/index.html`,'utf8');
  assert.ok(html.includes(spec('Product code',code)));assert.ok(html.includes(spec('Pack size m²',evidence.packSizeM2)));
  assert.ok(!/<meta[^>]*name="robots"[^>]*content="[^"]*noindex/.test(html));
 }
 console.log(JSON.stringify({success:true,products:12,exactLegacyVariants:variants,correctedRules:10,range:'Artisan Tile',oakChanged:false}));
}else{console.log(JSON.stringify({apply,changes},null,2));if(!apply)process.exitCode=1;}
