// Deterministic, evidence-bound rendering. Never changes indexation or product membership.
import fs from 'node:fs';
import assert from 'node:assert/strict';
const apply=process.argv.includes('--apply'),file='data/product-catalogue.json';
const data=JSON.parse(fs.readFileSync(file)),evidence=JSON.parse(fs.readFileSync('docs/migration-october-2026-followup/supplier/product-specifications.json'));
const changes=[],htmlChanges=[],slug=s=>s.replace(/^\/products\//,'').replace(/\/$/,'');
const norm=s=>s.toLowerCase().replace(/[^a-z0-9]/g,'');
const verified=new Map();
assert.equal(evidence.length,21,'Review a changed supplier evidence set before applying');
for(const e of evidence){
 const p=data.products.find(p=>p.id===e.record);assert.ok(p);assert.equal(norm(p.colour),norm(e.title));assert.equal(e.status,200);
 assert.equal(new URL(e.url).hostname,'ecoflooring.com.au');assert.match(e.fields.Thickness,/^\d+(?:\/\d+)?mm$/);
 assert.equal(e.fields.Thickness,e.range==='swish-laminate'?'12mm':e.range==='swish-oak-contemporary'?'14/2mm':'14/3mm');
 verified.set(slug(p.slug),e.fields.Thickness);
 for(const [key,value] of [['thickness',e.fields.Thickness],['totalThickness',e.fields.Thickness.split('/')[0].replace(/mm$/,'')+'mm']]){
  if(p[key]!==value){changes.push({record:p.id,key,before:p[key],after:value,source:e.url});p[key]=value;}
 }
}
for(const r of data.ranges.filter(r=>['swish-laminate','swish-oak-contemporary','swish-oak-natura-handcrafted'].includes(r.slug))){
 assert.ok(r.productSlugs.every(s=>verified.has(slug(s))));const values=new Set(r.productSlugs.map(s=>verified.get(slug(s))));assert.equal(values.size,1);
 const value=[...values][0];if(r.thickness!==value){changes.push({record:r.slug,key:'thickness',before:r.thickness,after:value});r.thickness=value;}
}
function update(file,transform){const before=fs.readFileSync(file,'utf8'),after=transform(before);if(before!==after){htmlChanges.push(file);if(apply)fs.writeFileSync(file,after);}}
function specs(html,value){
 const item=`<div class="spec-item"><span>Thickness</span><strong>${value}</strong></div>`;
 if(/<div class="spec-item"><span>Thickness<\/span><strong>[^<]*<\/strong><\/div>/.test(html))return html.replace(/<div class="spec-item"><span>Thickness<\/span><strong>[^<]*<\/strong><\/div>/,item);
 return html.replace(/(<div class="spec-item"><span>Category<\/span><strong>[^<]*<\/strong><\/div>)/,'$1'+item);
}
for(const [s,thickness] of verified){
 update(`products/${s}/index.html`,html=>specs(html,thickness).replace(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g,(tag,json)=>{
  const schema=JSON.parse(json);let changed=false;
  function visit(x){if(Array.isArray(x))return x.forEach(visit);if(!x||typeof x!=='object')return;if(x['@type']==='Product'){
   x.additionalProperty=x.additionalProperty||[];const property=x.additionalProperty.find(p=>p.name==='Thickness');
   if(property){if(property.value!==thickness){property.value=thickness;changed=true;}}else{x.additionalProperty.push({'@type':'PropertyValue',name:'Thickness',value:thickness});changed=true;}
  }Object.values(x).forEach(visit);}visit(schema);return changed?`<script type="application/ld+json">${JSON.stringify(schema)}</script>`:tag;
 }));
}
for(const r of data.ranges.filter(r=>['swish-laminate','swish-oak-contemporary','swish-oak-natura-handcrafted'].includes(r.slug))){
 update(`ranges/${r.slug}/index.html`,html=>specs(html,r.thickness).replace(/(<div class="hero-badge"><span>[^<]*<\/span>)<span>[^<]*<\/span>/,`$1<span>${r.thickness}</span>`).replace(/<article\b[\s\S]*?<\/article>/g,card=>{
  const s=card.match(/href="\/products\/([^/]+)\//)?.[1],v=verified.get(s);if(!v)return card;
  return card.replace(/(<p class="product-meta"><span class="pill">[^<]*<\/span>)(?:<span class="pill">(?:\d+(?:\/\d+)?mm|Confirm thickness)<\/span>)?/,'$1'+`<span class="pill">${v}</span>`);
 }));
}
if(apply)fs.writeFileSync(file,JSON.stringify(data,null,2)+'\n');
console.log(JSON.stringify({apply,records:verified.size,changes,htmlChanges},null,2));if(!apply&&(changes.length||htmlChanges.length))process.exitCode=1;
