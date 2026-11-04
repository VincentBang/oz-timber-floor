import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import {parse} from 'parse5';
import {walk,attr,text,digest} from './supplier-gap-capture.mjs';
const escape=s=>String(s).replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;').replaceAll('>','&gt;');
const hasClass=(n,c)=>attr(n,'class').split(/\s+/).includes(c);
const swatchRoutes = new Map([
 ['aspire-warm-spring', ['aspire-warm-spring','aspire','Warm Spring']],
 ['aspire-twilight-mist', ['aspire-twilight-mist','aspire','Twilight Mist']],
 ['-select-blackbutt', ['select-blackbutt','-select-australian-timber','Select Blackbutt']],
]);
const evidenceDirectory = 'docs/seo-growth/evidence/2026-11-04-preference-swatches';
const imageFields = e => ({primaryImage:e.localFile,imageGallery:[e.localFile],altText:e.alt,galleryStatus:'single-image'});

function verifyArchiveProof(e) {
 const [slug,range,colour] = swatchRoutes.get(e.id) || [];
 assert(slug && e.route === '/products/'+slug+'/' && e.rangeSlug === range && e.colour === colour, 'Unreviewed archive product');
 assert.equal(e.localFile, '/assets/products/supplier-reviewed-20261104/'+slug+'.webp');
 const p=e.evidence;
 assert.equal(p.kind,'confirmed-archive-supplier-colour');
 assert.equal(p.availabilityConfirmed,false);
 assert.equal(p.skuEquivalenceConfirmed,false);
 assert.equal(new URL(p.supplierUrl).hostname,'preferencefloors.com.au');
 assert.equal(new URL(p.archiveUrl).hostname,'oztimberfloor.com.au');
 for (const hash of [p.archiveSha256,p.supplierSha256]) assert.match(hash,/^[a-f0-9]{64}$/);
 if (e.id === 'aspire-twilight-mist') assert.equal(p.archiveSha256,p.supplierSha256);
}
// Preserve the November 3 evidence; only these three reviewed colour images can supersede it.
export function effectiveSupplierImages(root,baseline) {
 const previous=Array.isArray(baseline)?baseline:baseline.images;
 const {images}=JSON.parse(fs.readFileSync(path.join(root,'data/preference-swatches-20261104.json'),'utf8'));
 assert.deepEqual(images.map(e=>e.id).sort(),[...swatchRoutes.keys()].sort());
 const result=new Map(previous.map(e=>[e.id,e]));
 for(const e of images){
  verifyArchiveProof(e);
  const old=result.get(e.id);
  if(old) assert.deepEqual(e.before,imageFields(old),'Previous swatch state does not match reviewed baseline');
  result.set(e.id,e);
 }
 return [...result.values()];
}
export function exactImageMatch(product,entry){
 assert.equal(product.id,entry.id);assert.equal(product.url,entry.route);assert.equal(product.rangeSlug,entry.rangeSlug);assert.equal(product.colour,entry.colour);if(entry.evidence.kind==='confirmed-archive-supplier-colour')verifyArchiveProof(entry);else assert(entry.localFile.startsWith('/assets/products/supplier-reviewed-20261103/'));assert(Number.isInteger(entry.width)&&entry.width>=120);assert(Number.isInteger(entry.height)&&entry.height>=120);assert.match(entry.sha256,/^[a-f0-9]{64}$/);assert.equal(entry.evidence.availabilityConfirmed,false);
 if(['labelled-historical-supplier-brochure','exact-supplier-media-and-labelled-brochure'].includes(entry.evidence.kind)){assert([3,4,5].includes(entry.evidence.pdfPage));assert(Number.isInteger(entry.evidence.pdfObjectId));const herringbone=product.colour.startsWith('Herringbone ');if(product.rangeSlug==='pronto')assert.equal(entry.evidence.format,herringbone?'Herringbone':'Wide plank');const local=product.colour.replace(/^Herringbone |^Select /g,'');assert.equal(local,entry.evidence.caption);if(entry.evidence.kind==='exact-supplier-media-and-labelled-brochure'){assert(Number.isInteger(entry.evidence.mediaId));assert.equal(entry.evidence.mediaTitle,product.rangeSlug==='aspire'?local+' – Contemporary Decors [Aspire]':local+' [Preference Select]');assert(entry.width>=500&&entry.height>=500);assert.match(entry.evidence.mediaIndexSha256,/^[a-f0-9]{64}$/);assert.match(entry.evidence.imageSourceSha256,/^[a-f0-9]{64}$/);}}
 else if(entry.evidence.kind!=='confirmed-archive-supplier-colour'){assert.equal(entry.evidence.kind,'exact-supplier-filter-and-product-detail');assert.equal(entry.colour,entry.evidence.supplierTitle);assert(['Aspire RCB','Oakleaf HD PLUS'].includes(entry.evidence.supplierBrand));}
 return entry;
}
function replaceAttribute(tag,name,value){const pattern=new RegExp('\\s'+name+'=(?:"[^"]*"|\x27[^\x27]*\x27)');const next=' '+name+'="'+escape(value)+'"';return pattern.test(tag)?tag.replace(pattern,next):tag.replace(/\s*\/?>$/,end=>next+end);}
function imageTag(tag,entry){for(const[name,value]of Object.entries({src:entry.localFile,alt:entry.alt,width:entry.width,height:entry.height}))tag=replaceAttribute(tag,name,value);for(const name of ['srcset','data-srcset','data-src','data-lazy-src','data-lazy-srcset'])tag=tag.replace(new RegExp('\\s'+name+'=(?:"[^"]*"|\x27[^\x27]*\x27)','g'),'');return tag;}
export function refreshHTML(html,manifest){
 const nodes=walk(parse(html,{sourceCodeLocationInfo:true})),canonical=attr(nodes.find(n=>n.tagName==='link'&&attr(n,'rel')==='canonical')||{},'href'),edits=[],changedImages=[];
 for(const card of nodes.filter(n=>n.tagName==='article'&&(hasClass(n,'product-card')||hasClass(n,'catalogue-card')))){
  const descendants=walk(card),entry=manifest.images.find(p=>descendants.some(n=>n.tagName==='a'&&attr(n,'href')===p.route));if(!entry)continue;
  const images=descendants.filter(n=>n.tagName==='img');assert(images.length<=1,'Do not replace a multi-image card');
  if(images.length===0){const placeholders=descendants.filter(n=>hasClass(n,'missing-image-state'));assert.equal(placeholders.length,1,'Only the explicit missing-colour placeholder may become an image');assert.equal(attr(placeholders[0],'role'),'img');const l=placeholders[0].sourceCodeLocation;assert(l);edits.push({start:l.startOffset,end:l.endOffset,value:'<img src="'+entry.localFile+'" alt="'+escape(entry.alt)+'" width="'+entry.width+'" height="'+entry.height+'" loading="lazy" decoding="async">'});changedImages.push(entry.id);}
  else {const image=images[0];assert.notEqual(image.parentNode.tagName,'picture','Review picture source identity before changing');const l=image.sourceCodeLocation;if(!l)throw Error('Missing image source location');const before=html.slice(l.startOffset,l.endOffset),after=imageTag(before,entry);if(before!==after){edits.push({start:l.startOffset,end:l.endOffset,value:after});changedImages.push(entry.id);}}
 }
 const entry=manifest.images.find(p=>canonical==='https://oztimberfloor.com.au'+p.route);if(entry){const galleries=nodes.filter(n=>hasClass(n,'catalogue-gallery'));assert.equal(galleries.length,1,'Exact product gallery required');const g=galleries[0],loc=g.sourceCodeLocation;assert(loc?.endTag);const before=html.slice(loc.startTag.endOffset,loc.endTag.startOffset),after='<figure class="catalogue-gallery-item primary"><img src="'+entry.localFile+'" alt="'+escape(entry.alt)+'" width="'+entry.width+'" height="'+entry.height+'" loading="eager" fetchpriority="high" decoding="async" data-lcp-image=""></figure>';if(before!==after){assert(walk(g).filter(n=>n.tagName==='img').length<=1,'Do not discard a multi-image gallery');edits.push({start:loc.startTag.endOffset,end:loc.endTag.startOffset,value:after});changedImages.push(entry.id);}}
 const range=manifest.ranges.find(r=>canonical==='https://oztimberfloor.com.au/ranges/'+r.id+'/');if(range){const labels={thickness:'Thickness',boardSize:'Board size',packSizeM2:'Pack size m²',installationMethod:'Installation method'},grids=nodes.filter(n=>hasClass(n,'spec-grid'));assert.equal(grids.length,1,'Exact range specification grid required');const grid=grids[0];for(const[field,value]of Object.entries(range.fields)){const items=walk(grid).filter(n=>hasClass(n,'spec-item')).filter(n=>{const label=text(walk(n).find(n=>n.tagName==='span')||{});return label===labels[field]||field==='packSizeM2'&&label==='Pack size'||field==='installationMethod'&&label==='Installation profile';});assert(items.length<=1);if(items.length){const strong=walk(items[0]).find(n=>n.tagName==='strong'),l=strong?.sourceCodeLocation;assert(l?.endTag);if(text(strong)!==value)edits.push({start:l.startTag.endOffset,end:l.endTag.startOffset,value:escape(value)});}else{assert(labels[field]);edits.push({start:grid.sourceCodeLocation.endTag.startOffset,end:grid.sourceCodeLocation.endTag.startOffset,value:'<div class="spec-item"><span>'+labels[field]+'</span><strong>'+escape(value)+'</strong></div>'});}}}
 let result=html;const ordered=edits.sort((a,b)=>b.start-a.start);for(let i=1;i<ordered.length;i++)assert(ordered[i].end<=ordered[i-1].start,'Overlapping edits require review');for(const e of ordered)result=result.slice(0,e.start)+e.value+result.slice(e.end);return{html:result,changedImages};
}
export function applyRefresh(root=process.cwd(),{apply=false}={}){
 const read=f=>fs.readFileSync(path.join(root,f),'utf8'),manifest=JSON.parse(read('data/supplier-gap-refresh-20261103.json')),catalogue=JSON.parse(read('data/product-catalogue.json')),before=JSON.parse(JSON.stringify(catalogue));
 const historical=manifest.images;
 assert.equal(historical.length,26);
 manifest.images=effectiveSupplierImages(root,historical);
 assert.equal(manifest.images.length,27);
 for(const entry of manifest.images){const products=catalogue.products.filter(p=>p.id===entry.id);assert(products.length>0);assert.equal(digest(fs.readFileSync(root+entry.localFile)),entry.sha256);for(const product of products){exactImageMatch(product,entry);const fields=imageFields(entry),earlier=historical.find(e=>e.id===entry.id);
  const allowed=[entry.before,fields,...(earlier?[earlier.before]:[])];
  assert(allowed.some(state=>Object.keys(fields).every(k=>JSON.stringify(product[k])===JSON.stringify(state[k]))),'Do not overwrite later image evidence: '+entry.id);
  Object.assign(product,fields);}}
 for(const entry of manifest.ranges){const records=catalogue.ranges.filter(r=>r.id===entry.id);assert.equal(records.length,1);for(const[field,value]of Object.entries(entry.fields))assert([entry.before[field],value].includes(records[0][field]),'Do not overwrite later range evidence: '+entry.id+' '+field);Object.assign(records[0],entry.fields);}
 const changes=[];function scan(dir){for(const e of fs.readdirSync(dir,{withFileTypes:true})){if(e.name.startsWith('.')||['docs','data','assistant','dist','node_modules','scripts','migration','config','netlify'].includes(e.name))continue;const file=path.join(dir,e.name);if(e.isDirectory())scan(file);else if(e.name.endsWith('.html')){const relative=path.relative(root,file),html=fs.readFileSync(file,'utf8'),result=refreshHTML(html,manifest);if(result.html!==html){changes.push({file:relative,before:digest(html),after:digest(result.html),imageIds:[...new Set(result.changedImages)]});if(apply){const backup=path.join(root,evidenceDirectory,'before',relative);fs.mkdirSync(path.dirname(backup),{recursive:true});if(!fs.existsSync(backup))fs.writeFileSync(backup,html,{flag:'wx'});fs.writeFileSync(file,result.html);}}}}}scan(root);
 if(JSON.stringify(before)!==JSON.stringify(catalogue)&&apply)fs.writeFileSync(path.join(root,'data/product-catalogue.json'),JSON.stringify(catalogue,null,2)+'\n');
 return{localOnly:true,pages:changes.length,images:manifest.images.length,ranges:manifest.ranges.length,catalogueChanged:JSON.stringify(before)!==JSON.stringify(catalogue),changes};
}
if(process.argv[1]===new URL(import.meta.url).pathname){const apply=process.argv.includes('--apply'),result=applyRefresh(process.cwd(),{apply});console.log({...result,changes:undefined});if(!apply)assert.equal(result.pages,0,'Pending reviewed HTML updates');}
