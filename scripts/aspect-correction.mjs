// Supplier-bound specification repair. No URL ownership, robots, sitemap or redirect changes.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
const apply=process.argv.includes('--apply');
const dataFile='data/product-catalogue.json';
const data=JSON.parse(fs.readFileSync(dataFile));
const evidence=JSON.parse(fs.readFileSync('docs/aspect-correction/supplier-evidence.json'));
assert.equal(evidence.length,18);
const prefix='wide-plank-water-resistant-laminate',oldName='Wide Plank Water Resistant Laminate',rangeName='ASPECT Laminate';
const alias={'blackbutt-3':'blackbutt','spotted-gum-2':'spotted-gum'};
const laminate=evidence.filter(e=>e.brand==='Aspect');
assert.equal(laminate.length,14);
const realIds=laminate.map(e=>`${prefix}-${alias[e.slug]||e.slug}`);
const wrongIds=['parchment',...['ash-grey','copper-brown','dusk-grey','latte','matterhorn','parana','polar-ice'].map(c=>'wide-plank-'+c)].map(s=>`${prefix}-${s}`);
const selected=new Map();
const changes=[];
const esc=s=>String(s).replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;').replaceAll('>','&gt;');
function update(file,after){const before=fs.readFileSync(file,'utf8');if(before===after)return;changes.push(file);if(apply){const backup=path.join('/tmp/oz-aspect.E7QOGG/files',file);if(!fs.existsSync(backup)){fs.mkdirSync(path.dirname(backup),{recursive:true});fs.writeFileSync(backup,before);}fs.writeFileSync(file,after);}}
for(const e of evidence){
 assert.equal(e.status,200);assert.match(e.sha256,/^[0-9a-f]{64}$/);
 const timber=e.brand==='De Marque Oak';
 const ids=timber?[`${prefix}-${e.slug}`,`de-marque-oak-${e.slug}`]:[`${prefix}-${alias[e.slug]||e.slug}`];
 for(const id of ids){
  const p=data.products.find(p=>p.id===id)||data.productAliases?.find(p=>p.id===id);assert.ok(p,id);
  if(p.publicCatalogueStatus==='legacy-alias'){
   assert.equal(p.replacementRoute,`/products/de-marque-oak-${e.slug}/`);
   assert.equal(p.supplierSourceUrl,e.url);assert.equal(p.thickness,'15mm');
   continue; // Archived URL alias is validated by the exact consolidation guard.
  }
  p.brand=timber?'De Marque Oak':'Aspect';p.range=timber?'De Marque Oak':rangeName;p.rangeSlug=timber?'de-marque-oak':prefix;
  p.category=timber?'Engineered timber':'Laminate';
  if(timber)p.name=`De Marque Oak ${p.colour}`;
  p.thickness=timber?'15mm':'12mm';p.totalThickness=p.thickness;
  p.boardSize=timber?'2200 x 240 x 15mm (nested shorts)':e.slug==='wattleseed'?'':e.dimension;
  p.plankSize=p.boardSize;p.packSizeM2=e.pack.match(/^[\d.]+/)[0];
  p.sourceUrl=e.url;p.supplierSourceUrl=e.url;p.supplierPermalink=e.url;
  p.shortDescription=`${p.colour} ${p.thickness} ${p.category.toLowerCase()} flooring in the ${p.range} range. Confirm stock, quantity and installation requirements before ordering.`;
  p.altText=`${p.range} ${p.colour} ${p.category.toLowerCase()} colour swatch`;
  p.lastCatalogueReview='2026-10-07';
  if(timber){p.wearLayer='';p.installationMethod='Confirm installation requirements before order.';}
  if(e.slug==='wattleseed')p.cautionNotes='Confirm board dimensions before order: supplier width information is inconsistent. Stock, batch and installation suitability also require confirmation.';
  selected.set(id,p);
 }
}
const range=data.ranges.find(r=>r.id===prefix);assert.ok(range);
Object.assign(range,{name:rangeName,rangeName,canonicalName:rangeName,thickness:'12mm',colourCount:14,productSlugs:realIds,products:realIds,
 shortDescription:'ASPECT 12mm laminate flooring in a selection of colours and board formats. Compare individual product dimensions and confirm stock before ordering.',
 installationMethod:'Confirm installation requirements before order.',lastCatalogueReview:'2026-10-07',
 catalogueNote:'ASPECT products verified against exact Preference Floors product pages on 2026-10-07. Eight unrelated timber entries removed from this range listing; existing held pages and URL ownership preserved. Wattleseed width requires supplier clarification.'});
const hero=selected.get(`${prefix}-acacia`).primaryImage;
for(const field of ['heroImage','primaryImage','thumbnailImage'])range[field]=hero;
function specs(p){return [['Range',p.range],['Colour',p.colour],['Category',p.category],['Thickness',p.thickness],['Board size',p.boardSize||'Confirm board dimensions before order'],['Pack size m²',p.packSizeM2],['Installation method',p.installationMethod||'Confirm installation requirements before order']].map(([k,v])=>`<div class="spec-item"><span>${esc(k)}</span><strong>${esc(v)}</strong></div>`).join('');}
function contactLinks(html){return html.replace(/href="(\/contact\/\?[^\"]*)"/g,(tag,raw)=>{const u=new URL(raw.replaceAll('&amp;','&'),'https://oztimberfloor.com.au');const p=selected.get(u.searchParams.get('productSlug'));if(p){for(const key of ['range','category'])u.searchParams.set(key,p[key]);u.searchParams.set('product',p.name);}else if(u.searchParams.get('range')===oldName)u.searchParams.set('range',rangeName);else return tag;return `href="${esc(u.pathname+u.search)}"`;});}
function removeWrongCards(html){return html.replace(/<article\b[^>]*>[\s\S]*?<\/article>/g,tag=>wrongIds.some(id=>tag.includes(`href="/products/${id}/"`))?'':tag);}
for(const [id,p] of selected){
 const file=`products/${id}/index.html`;let html=fs.readFileSync(file,'utf8');const timber=p.category==='Engineered timber',duplicate=timber&&id.startsWith(prefix);
 // Edit the product body only, retaining the global navigation and footer.
 html=html.replace(/<main>[\s\S]*?<\/main>/,main=>{
  if(duplicate){
   const related='<section class="section"><div class="shell"><div class="section-head"><div><p class="eyebrow">Related colours</p><h2>More colours in De Marque Oak</h2></div></div><a class="button-inline" href="/ranges/de-marque-oak/">Explore De Marque Oak colours</a></div></section>';
   main=main.replace(/<section\b[^>]*>(?:(?!<section)[\s\S])*?<p class="eyebrow">Related colours<\/p>[\s\S]*?<\/section>/,related);
   main=main.replaceAll(oldName,'De Marque Oak').replaceAll('href="/ranges/'+prefix+'/"','href="/ranges/de-marque-oak/"').replaceAll('href="/laminate/"','href="/engineered-timber-flooring/"').replace(/\bLaminate\b/g,'Engineered timber').replace(/\blaminate\b(?!-)/g,'engineered timber');
  }else if(!timber)main=removeWrongCards(main).replaceAll(oldName,rangeName);
  main=main.replace(/<p class="lead">[\s\S]*?<\/p>/,`<p class="lead">${esc(p.shortDescription)}</p>`);
  main=main.replace(/<div class="spec-grid">(?:<div class="spec-item">[\s\S]*?<\/div>)+<\/div>/,`<div class="spec-grid">${specs(p)}</div>`);
  if(id.endsWith('-wattleseed')&&!main.includes(p.cautionNotes))main=main.replace('</section>',`</section><section class="section"><div class="shell"><p>${esc(p.cautionNotes)}</p></div></section>`);
  return main;
 });
 const title=`${p.range} ${p.colour} ${p.thickness} | Oz Timber Floor`,desc=p.shortDescription;
 html=html.replace(/<title>[^<]*<\/title>/,`<title>${esc(title)}</title>`).replace(/(<meta (?:name="description"|property="og:description") content=")[^"]*(")/g,`$1${esc(desc)}$2`).replace(/(<meta property="og:title" content=")[^"]*(")/,`$1${esc(title)}$2`);
 html=html.replace(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g,(tag,raw)=>{let schema=JSON.parse(raw);function visit(x){if(!x||typeof x!=='object')return;if(x['@type']==='Product'){x.name=`${p.range} ${p.colour}`;x.category=p.category;x.description=p.shortDescription;x.additionalProperty=[['Range',p.range],['Colour',p.colour],['Thickness',p.thickness],['Board size',p.boardSize],['Pack size m²',p.packSizeM2]].filter(([,v])=>v).map(([name,value])=>({'@type':'PropertyValue',name,value}));}if(x['@type']==='ListItem'&&x.item===`https://oztimberfloor.com.au/ranges/${prefix}/`){x.name=p.range;if(timber)x.item='https://oztimberfloor.com.au/ranges/de-marque-oak/';}Object.values(x).forEach(visit);}visit(schema);return `<script type="application/ld+json">${JSON.stringify(schema)}</script>`;});
 if(timber)html=html.replace('"name":"Laminate","item":"https://oztimberfloor.com.au/laminate/"','"name":"Engineered timber","item":"https://oztimberfloor.com.au/engineered-timber-flooring/"');
 html=contactLinks(html);update(file,html);
}
const rangeFile=`ranges/${prefix}/index.html`;let html=removeWrongCards(fs.readFileSync(rangeFile,'utf8')).replaceAll(oldName,rangeName).replaceAll('22 colours','14 colours').replaceAll('>22<','>14<').replaceAll('/assets/products/engineered-timber/hardwood-collection/parchment/parchment-swatch.webp',hero);
html=html.replace(/<p class="lead">[^<]*<\/p>/,`<p class="lead">${range.shortDescription}</p>`).replace('<span>Confirm dimensions</span>','<span>12mm laminate</span>');
html=html.replace(/<div class="spec-item"><span>Installation profile<\/span><strong>[^<]*<\/strong><\/div>/,'<div class="spec-item"><span>Thickness</span><strong>12mm</strong></div>');
html=html.replace(/(<div class="hero-media"><img\b[^>]*?)loading="lazy"/,'$1loading="eager"');
update(rangeFile,contactLinks(html));
// Only the exact range-card component is updated on other pages.
const files=execFileSync('git',['ls-files','*.html'],{encoding:'utf8'}).trim().split('\n');
for(const f of files){if(f===rangeFile||selected.has(f.split('/')[1]))continue;let h=fs.readFileSync(f,'utf8');h=h.replace(/<a\b[^>]*href="\/ranges\/wide-plank-water-resistant-laminate\/"[^>]*>[\s\S]*?<\/a>/g,card=>{if(!card.includes('<h3>'))return card;return card.replaceAll(oldName,rangeName).replaceAll('wide plank water resistant laminate laminate','aspect laminate').replaceAll('22 colours','14 colours').replaceAll('/assets/products/engineered-timber/hardwood-collection/parchment/parchment-swatch.webp',hero);});update(f,h);}
update(dataFile,JSON.stringify(data,null,2)+'\n');
console.log(JSON.stringify({apply,products:selected.size,laminateProducts:14,rangeColours:14,changes},null,2));
if(changes.length&&!apply)process.exitCode=1;
