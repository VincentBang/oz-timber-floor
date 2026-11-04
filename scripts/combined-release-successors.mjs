// Local regression accounting only: retain the October baseline and bind its
// later state to the already published November release plus reviewed deltas.
// This does not approve a new assistant corpus or publication.
import fs from 'node:fs';import assert from 'node:assert/strict';import {execFileSync} from 'node:child_process';
import {effectiveSupplierImages,exactImageMatch} from './supplier-gap-refresh.mjs';
const receiptFile='assistant/releases/2026-11-03/VERIFIED_RELEASE.json';
export function publishedBytes(root,file){
 const git=f=>execFileSync('git',['show',f],{cwd:root,maxBuffer:32e6});
 const bytes=fs.readFileSync(root+'/'+receiptFile);
 assert.deepEqual(bytes,git('98624d3e:'+receiptFile),'Published release receipt changed');
 const receipt=JSON.parse(bytes);assert.equal(receipt.releaseCommit,'8730788666f1e6d5199bbc91b3a38d09f05b4cca');assert.equal(receipt.status,'RELEASED_AND_LIVE_SMOKE_VERIFIED');
 return git(receipt.releaseCommit+':'+file);
}
export function reviewedCatalogue(root){
 const catalogue=JSON.parse(publishedBytes(root,'data/product-catalogue.json'));
 const manifest=JSON.parse(fs.readFileSync(root+'/data/supplier-gap-refresh-20261103.json'));
 for(const image of effectiveSupplierImages(root,manifest)){
  const matches=catalogue.products.filter(p=>p.id===image.id);assert.equal(matches.length,1);exactImageMatch(matches[0],image);
  Object.assign(matches[0],{primaryImage:image.localFile,imageGallery:[image.localFile],altText:image.alt,galleryStatus:'single-image'});
 }
 assert.deepEqual(manifest.ranges.map(r=>r.id),['swish','elk-falls']);
 for(const row of manifest.ranges){const range=catalogue.ranges.find(r=>r.id===row.id);for(const [key,value]of Object.entries(row.fields)){assert(['thickness','boardSize','packSizeM2','installationMethod'].includes(key));assert.equal(range[key],row.before[key]);range[key]=value;}}
 for(const id of ['oakleaf-hd-plus-bellmore-oak','oakleaf-hd-plus-hampton-oak','oakleaf-hd-plus-windsor']){const product=catalogue.products.find(p=>p.id===id);assert.equal(product.thickness,'12mm ARRIVING SOON');assert.match(product.shortDescription,/12mm ARRIVING SOON/);product.thickness='12mm';product.shortDescription=product.shortDescription.replace('12mm ARRIVING SOON','12mm');}
 return catalogue;
}
