import {preAudienceHTML} from './audience-discovery-contract.mjs';
import {supplierHistoryHTML} from './supplier-history-scope.mjs';
import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import os from 'node:os';import path from 'node:path';import {execFileSync} from 'node:child_process';import {parse} from 'parse5';
import manifest from '../data/supplier-gap-refresh-20261103.json' with {type:'json'};
import catalogue from '../data/product-catalogue.json' with {type:'json'};
import {refreshHTML,exactImageMatch,applyRefresh,effectiveSupplierImages} from './supplier-gap-refresh.mjs';
import {walk,attr,text,digest,evidenceDirectory} from './supplier-gap-capture.mjs';
import {approvedProductionPolicy} from '../assistant/lib/production.mjs';
import {hash} from '../assistant/lib/security.mjs';
const root=path.resolve(import.meta.dirname,'..'),before=JSON.parse(execFileSync('git',['show','98624d3e:data/product-catalogue.json'],{cwd:root,encoding:'utf8',maxBuffer:20e6}));
const baseline=f=>execFileSync('git',['show','98624d3e:'+f],{cwd:root,encoding:'utf8',maxBuffer:10e6});
const nov4IDs=['-select-blackbutt','aspire-twilight-mist','aspire-warm-spring'];
const oakleafIDs=['oakleaf-hd-plus-bellmore-oak','oakleaf-hd-plus-hampton-oak','oakleaf-hd-plus-windsor'];
const effective={...manifest,images:effectiveSupplierImages(root,manifest)};
const imageFields=e=>({primaryImage:e.localFile,imageGallery:[e.localFile],altText:e.alt,galleryStatus:'single-image'});
function webpSize(bytes) {
 assert.equal(bytes.toString('ascii',0,4),'RIFF');assert.equal(bytes.toString('ascii',8,12),'WEBP');
 for(let i=12;i+8<=bytes.length;){const kind=bytes.toString('ascii',i,i+4),n=bytes.readUInt32LE(i+4),p=i+8;
  if(kind==='VP8X')return [1+bytes.readUIntLE(p+4,3),1+bytes.readUIntLE(p+7,3)];
  if(kind==='VP8 ')return [bytes.readUInt16LE(p+6)&0x3fff,bytes.readUInt16LE(p+8)&0x3fff];
  if(kind==='VP8L'){const d=bytes.readUInt32LE(p+1);return [(d&0x3fff)+1,((d>>>14)&0x3fff)+1];}
  i=p+n+(n%2);
 }
 throw Error('Cannot verify intrinsic WebP dimensions');
}
function november3Product(original) {
 const image=manifest.images.find(e=>e.id===original.id);
 return image?{...original,...imageFields(image)}:original;
}
function expectedContract(html,file) {
 const c=contract(architecturalHTML(html,file));
 if(oakleafIDs.some(id=>file==='products/'+id+'/index.html')) {
  const descriptions=c.meta.filter(attrs=>attrs.some(a=>(a.name==='name'&&a.value==='description')||(a.name==='property'&&a.value==='og:description')));
  assert.equal(descriptions.length,2,file);
  for(const attrs of descriptions){const content=attrs.find(a=>a.name==='content');assert.match(content.value,/12mm ARRIVING SOON/);content.value=content.value.replace('12mm ARRIVING SOON','12mm');}
 }
 return c;
}
function contract(html,file){if(file)html=preAudienceHTML(html,file,root);const n=walk(parse(html));return{title:n.filter(x=>x.tagName==='title').map(text),h1:n.filter(x=>x.tagName==='h1').map(text),meta:n.filter(x=>x.tagName==='meta').map(x=>x.attrs),canonical:n.filter(x=>x.tagName==='link'&&attr(x,'rel')==='canonical').map(x=>x.attrs),schema:n.filter(x=>x.tagName==='script'&&attr(x,'type')==='application/ld+json').map(text),hrefs:n.filter(x=>x.tagName==='a').map(x=>attr(x,'href')),forms:n.filter(x=>['form','input','select','textarea','button'].includes(x.tagName)).map(x=>x.attrs)};}
test('26 exact image identities retain separate plank and herringbone references and hold both unresolved names',()=>{
 assert.equal(manifest.images.length,26);assert.equal(new Set(manifest.images.map(i=>i.id)).size,26);assert.equal(manifest.images.filter(i=>i.rangeSlug==='aspire').length,8);assert.equal(manifest.images.filter(i=>i.rangeSlug==='pronto').length,11);assert.equal(manifest.images.filter(i=>i.rangeSlug==='oakleaf').length,3);assert.equal(manifest.images.filter(i=>i.rangeSlug==='-select-australian-timber').length,4);
 for(const e of manifest.images)exactImageMatch(catalogue.products.find(p=>p.id===e.id),e);
 assert.deepEqual(manifest.remaining.map(r=>r.id).sort(),['aspire-warm-spring','pronto-portofino']);for(const p of manifest.remaining)assert(!manifest.images.some(i=>i.id===p.id));
});
test('same colour in another range and wrong parquet format cannot inherit identity',()=>{
 const e=manifest.images.find(i=>i.id==='pronto-herringbone-chesterfield'),p=catalogue.products.find(p=>p.id===e.id);assert.throws(()=>exactImageMatch({...p,rangeSlug:'hardwood-collection'},e));assert.throws(()=>exactImageMatch(p,{...e,evidence:{...e.evidence,format:'Wide plank'}}));assert.throws(()=>exactImageMatch({...p,colour:'Portofino'},e));
});
test('November 4 supersedes precisely two swatches, adds the singular Aspire colour and retains Portofino unchanged',()=>{
 const reviewed=effective.images.filter(e=>e.evidence.kind==='confirmed-archive-supplier-colour');
 assert.equal(effective.images.length,27);assert.equal(new Set(effective.images.map(e=>e.id)).size,27);
 assert.deepEqual(reviewed.map(e=>e.id).sort(),nov4IDs);
 for(const old of manifest.images)if(!nov4IDs.includes(old.id))assert.deepEqual(effective.images.find(e=>e.id===old.id),old,old.id);
 for(const e of reviewed){
  const original=before.products.find(p=>p.id===e.id),previous=november3Product(original);
  for(const k of ['primaryImage','imageGallery','altText','galleryStatus'])assert.deepEqual(e.before[k],previous[k],e.id+' '+k);
  assert.equal(e.route,original.url);assert.equal(e.rangeSlug,original.rangeSlug);assert.equal(e.colour,original.colour);
  assert.equal(e.evidence.availabilityConfirmed,false);assert.equal(e.evidence.skuEquivalenceConfirmed,false);
  exactImageMatch(catalogue.products.find(p=>p.id===e.id),e);
  assert.throws(()=>exactImageMatch({...original,rangeSlug:'hardwood-collection'},e),'alternate range must not match');
 }
 for(const id of ['pronto-portofino','hardwood-collection-warm-springs']){
  const original=before.products.find(p=>p.id===id);assert.ok(original,id);
  assert(!effective.images.some(e=>e.id===id));assert.deepEqual(catalogue.products.find(p=>p.id===id),original,id);
 }
});
test('three verified archive and supplier JPEG identities, intrinsic sizes, and local compressed bytes are bound independently of the release',()=>{
 const proofs={
  'aspire-warm-spring':[1000,1000,'d27c70c688e077007c37d911f4e98e71904726b6796cf895fc9c20c16787f795','332f9ea4a6be939817e1d9ed0a4495b821e2bd36d6130f4a0b10a790c3039ffe'],
  'aspire-twilight-mist':[585,533,'01d356cc7057c7c21659dc7b00e9132dfabc9a7141a9e0b5db08e27edec71e10','01d356cc7057c7c21659dc7b00e9132dfabc9a7141a9e0b5db08e27edec71e10'],
  '-select-blackbutt':[1000,1000,'cb00ca0e0fe4e57ed01034bb950c8ae45a867e92d61bafe3416fbfa5ead26fc2','fb694e8979b462e04a29864cf5c949f5b69bed8c2af18444cb765b482d36b9d1'],
 };
 for(const [id,[w,h,archived,supplier]]of Object.entries(proofs)){
  const e=effective.images.find(e=>e.id===id);assert.equal(e.width,w);assert.equal(e.height,h);
  const file=root+e.localFile,webp=fs.readFileSync(file);assert.deepEqual(webpSize(webp),[w,h]);assert.equal(digest(webp),e.sha256);
  assert.equal(e.evidence.archiveSha256,archived);assert.equal(e.evidence.supplierSha256,supplier);
  assert.equal(e.evidence.comparison,archived===supplier?'byte-identical':'matching-board-seams-and-grain');
  assert.equal(new URL(e.evidence.archiveUrl).hostname,'oztimberfloor.com.au');assert.equal(new URL(e.evidence.supplierUrl).hostname,'preferencefloors.com.au');
  for(const sha of [archived,supplier])assert.equal(digest(fs.readFileSync(path.join(root,'docs/seo-growth/evidence/2026-11-04-preference-swatches/raw',sha+'.jpg'))),sha);
 }
});
test('catalogue delta from the sealed baseline is limited to four image fields, seven verified range values and the three precise Oakleaf wording edits',()=>{
 assert.equal(catalogue.products.length,before.products.length);assert.equal(catalogue.ranges.length,before.ranges.length);
 for(const [i,p]of catalogue.products.entries()){
  const old=before.products[i],e=effective.images.find(e=>e.id===p.id),expected=structuredClone(old);
  if(e)Object.assign(expected,imageFields(e));
  if(oakleafIDs.includes(p.id)){assert.equal(expected.thickness,'12mm ARRIVING SOON');expected.thickness='12mm';assert.match(expected.shortDescription,/12mm ARRIVING SOON/);expected.shortDescription=expected.shortDescription.replace('12mm ARRIVING SOON','12mm');}
  assert.deepEqual(p,expected,p.id);
 }
 for(const [i,r]of catalogue.ranges.entries()){const old=before.ranges[i],e=manifest.ranges.find(e=>e.id===r.id);assert.deepEqual(r,e?{...old,...e.fields}:old,r.id);}
});
test('original supplier bytes, embedded object identity, captions and exact product-list membership support every image',()=>{
 const pdfs=JSON.parse(fs.readFileSync(evidenceDirectory+'/PDF_REVIEW.json')),captures=JSON.parse(fs.readFileSync(evidenceDirectory+'/CAPTURE.json')),index=JSON.parse(fs.readFileSync(evidenceDirectory+'/PREFERENCE_INDEX.json'));
 for(const e of manifest.images){assert.equal(digest(fs.readFileSync(root+e.localFile)),e.sha256);const proof=e.evidence;if(['labelled-historical-supplier-brochure','exact-supplier-media-and-labelled-brochure'].includes(proof.kind)){const source=pdfs.find(d=>d.sha256===proof.sourceSha256);assert.equal(source.source,proof.sourceUrl);assert.equal(digest(fs.readFileSync(evidenceDirectory+'/raw/'+source.sha256+'.pdf')),source.sha256);const page=source.pages[proof.pdfPage-1],image=page.images.find(i=>i.objectId===proof.pdfObjectId);assert.equal(image.sha256,proof.embeddedSha256);assert.equal(digest(fs.readFileSync(image.file)),image.sha256);assert(fs.readFileSync(page.textFile,'utf8').includes(proof.caption));assert(page.imageLayout.some(l=>l.objectId===proof.pdfObjectId));}else{const detail=captures.records.find(r=>r.url===proof.sourceUrl);assert.equal(detail.sha256,proof.sourceSha256);assert.equal(digest(fs.readFileSync(detail.file)),detail.sha256);assert.equal(detail.title,proof.supplierTitle);assert.equal(detail.fields.Brand,proof.supplierBrand);assert(index.all__floor.some(p=>p.title===e.colour&&p.brand===proof.supplierBrand&&p.permalink===detail.url&&p.image===proof.imageUrl));}}
});
test('all changed HTML retains exact title metadata H1 canonical schema destinations and form contracts except the three authorised descriptions and OG mirrors',()=>{
 const changed=supplierHistoryHTML(root);assert(changed.length>26);for(const file of changed)assert.deepEqual(contract(fs.readFileSync(file,'utf8'),file),expectedContract(baseline(file),file),file);
});
test('every repaired product has an exact local eager primary image with intrinsic dimensions',()=>{
 for(const e of effective.images){const html=fs.readFileSync(e.route.slice(1)+'index.html','utf8'),nodes=walk(parse(html)),g=nodes.find(n=>attr(n,'class')==='catalogue-gallery'),images=walk(g).filter(n=>n.tagName==='img');assert.equal(images.length,1,e.id);const img=images[0];assert.equal(attr(img,'src'),e.localFile);assert.equal(attr(img,'alt'),e.alt);assert.equal(Number(attr(img,'width')),e.width);assert.equal(Number(attr(img,'height')),e.height);assert.equal(attr(img,'loading'),'eager');assert.equal(attr(img,'fetchpriority'),'high');}
});
test('all repaired cards use the matching product reference rather than a shared range substitute',()=>{
 const files=supplierHistoryHTML(root);let checked=0;const seen=new Set();for(const file of files){const nodes=walk(parse(fs.readFileSync(file,'utf8')));for(const card of nodes.filter(n=>n.tagName==='article'&&/product-card|catalogue-card/.test(attr(n,'class')))){const ns=walk(card),entry=effective.images.find(e=>ns.some(n=>n.tagName==='a'&&attr(n,'href')===e.route));if(!entry)continue;const imgs=ns.filter(n=>n.tagName==='img');assert.equal(imgs.length,1);for(const [key,value] of Object.entries({src:entry.localFile,width:String(entry.width),height:String(entry.height),alt:entry.alt}))assert.equal(attr(imgs[0],key),value,file+' '+entry.id+' '+key);checked++;seen.add(entry.id);}}assert(checked>=27);for(const id of nov4IDs)assert(seen.has(id),id);
});
test('range data is bound to complete exact Swish and Elk Falls documents, not a different Swish family',()=>{
 assert.deepEqual(manifest.ranges.map(r=>r.id),['swish','elk-falls']);for(const r of manifest.ranges){const file=evidenceDirectory+'/raw/'+r.sourceSha256+'.pdf';assert.equal(digest(fs.readFileSync(file)),r.sourceSha256);}assert.equal(manifest.ranges[0].fields.thickness,'14mm');assert.match(manifest.ranges[0].fields.boardSize,/136 or 189/);assert.equal(manifest.ranges[1].fields.packSizeM2,'2.155');assert.equal(catalogue.ranges.find(r=>r.id==='swish').category,'Engineered timber');
});
test('repair is idempotent and the normal package workflow invokes the bounded repair',()=>{
 const files=supplierHistoryHTML(root);for(const file of files){const h=fs.readFileSync(file,'utf8');assert.equal(refreshHTML(h,effective).html,h,file);}assert.match(fs.readFileSync('scripts/build-public-package.mjs','utf8'),/applySupplierGapRefresh\(root,\{apply:true\}\)/);
});
test('unknown routes remain untouched and later catalogue evidence cannot be silently overwritten',()=>{
 const html='<html><head><link rel="canonical" href="https://oztimberfloor.com.au/unknown/"></head><body><main><p>Unreviewed content</p></main></body></html>';assert.equal(refreshHTML(html,manifest).html,html);
 const fixture=fs.mkdtempSync(path.join(os.tmpdir(),'oz-supplier-negative-'));fs.mkdirSync(fixture+'/data');fs.writeFileSync(fixture+'/data/supplier-gap-refresh-20261103.json',JSON.stringify(manifest));fs.copyFileSync(root+'/data/preference-swatches-20261104.json',fixture+'/data/preference-swatches-20261104.json');const modified=structuredClone(catalogue);modified.products.find(p=>p.id===manifest.images[0].id).primaryImage='/assets/later-reviewed-image.webp';fs.writeFileSync(fixture+'/data/product-catalogue.json',JSON.stringify(modified));for(const e of [...manifest.images,...effective.images]){fs.mkdirSync(path.dirname(fixture+e.localFile),{recursive:true});fs.copyFileSync(root+e.localFile,fixture+e.localFile);}assert.throws(()=>applyRefresh(fixture),/Do not overwrite later image evidence/);
});
test('sealed November 3 plan had eight media upgrades, two quality holds and two unmatched identities before the later review',()=>{
 assert.deepEqual(manifest.images.filter(e=>e.resolutionNote).map(e=>e.id),['aspire-twilight-mist','-select-blackbutt']);assert.equal(manifest.images.filter(e=>e.evidence.kind==='exact-supplier-media-and-labelled-brochure').length,8);for(const e of manifest.images)assert.equal(e.evidence.availabilityConfirmed,false);for(const p of manifest.remaining){const old=before.products.find(r=>r.id===p.id);assert(old);assert.deepEqual(november3Product(old),old);}
});
test('full-resolution media must corroborate the labelled brochure identity and exact supplier asset hash',()=>{
 for(const e of manifest.images.filter(e=>e.evidence.kind==='exact-supplier-media-and-labelled-brochure')){const proof=e.evidence,bytes=fs.readFileSync(evidenceDirectory+'/raw/'+proof.mediaIndexSha256+'.json');assert.equal(digest(bytes),proof.mediaIndexSha256);const item=JSON.parse(bytes).find(i=>i.id===proof.mediaId);assert(item);assert.equal(item.source_url,proof.imageUrl);assert(item.media_details.width>=500&&item.media_details.height>=500);assert.equal(digest(fs.readFileSync(evidenceDirectory+'/raw/'+proof.imageSourceSha256+'.image')),proof.imageSourceSha256);exactImageMatch(catalogue.products.find(p=>p.id===e.id),e);}
});
test('rebuilt supplier knowledge cannot inherit the live production approval or change spending ceilings',()=>{
 const current=JSON.parse(fs.readFileSync('assistant/generated/corpus.json')),profile=JSON.parse(fs.readFileSync('assistant/releases/2026-11-03/production-profile.json')),policy=JSON.parse(fs.readFileSync('assistant/config/policy.json'));assert.equal(hash(profile),'aea81d6c51b9760592830e453bd1dab94705a6034b563a0d7b6e08d64cc70579');assert.notEqual(current.corpusVersion,profile.boundCorpusVersion);assert.throws(()=>approvedProductionPolicy(profile,policy,current,{OZ_ASSISTANT_PRODUCTION_CONFIG_HASH:hash(profile)}),/production_not_approved/);assert.equal(profile.allowance.monthBudgetUsd,30);assert.equal(profile.allowance.dayBudgetUsd,1);assert.equal(JSON.parse(fs.readFileSync('assistant/config/production.json')).activationApproved,false);
});
import {architecturalHTML} from './architectural-design.mjs';
