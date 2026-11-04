// Replay dated, reviewed successors. Historical baselines remain immutable.
// This is local regression accounting, never a production/corpus approval.
import fs from 'node:fs';import path from 'node:path';import os from 'node:os';
import crypto from 'node:crypto';import assert from 'node:assert/strict';import {execFileSync} from 'node:child_process';
import {STONEFLOOR_RETIREMENT_SHA256} from './approved-stonefloor-legacy-retirement.mjs';
import {restorePreAudienceSitemap} from './audience-publication-contract.mjs';
import {publishedBytes,reviewedCatalogue} from './combined-release-successors.mjs';
export const sha = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const d='docs/seo-growth/evidence/2026-10-28-';
const seals={
 'local-spec-recovery/RECOVERY_RESULT.json':'54a6e8433634c61f1a443a9ce52c6eb2a8828eedc8b93a970ed62af551611111',
 'supplier-refresh/REVIEWED_PLAN.json':'806a6dc47b43e434b3ce85d0c1d4867a2545e392b7d98846e4273e15a1c1a0dd',
 'four-suppliers/REVIEWED_PLAN.json':'aac8f34bd9d52c1e1258dd1bdc5b3a32931daa25860f90ec50328960d86b820d',
 'exact-formats/PLAN.json':'23790053edab8041c2d67c321514b19e9bffe514faad305b0b7349e41b18c94e',
 'assistant-local-sprint/VALIDATION.json':'90596bb812bc174017e749665296fbd03c9e4fb480be62ff78d8d87e5999c731',
};
function evidence(root,name){const bytes=fs.readFileSync(path.join(root,d+name));assert.equal(sha(bytes),seals[name],'Historical successor evidence changed: '+name);return JSON.parse(bytes);}
export function replayCatalogue(root,before){
 const expected=structuredClone(before);
 const plans=[evidence(root,'local-spec-recovery/RECOVERY_RESULT.json').changes.map(c=>({id:c.id,changes:[c]})),
 evidence(root,'supplier-refresh/REVIEWED_PLAN.json').proposals,evidence(root,'four-suppliers/REVIEWED_PLAN.json').proposals,
 evidence(root,'exact-formats/PLAN.json').rows.map(r=>({id:r.id,changes:Object.entries(r.after).map(([field,after])=>({field,after}))}))];
 for(const rows of plans)for(const row of rows){
  const candidates=expected.products.filter(p=>p.id===row.id);
  const p=candidates.find(p=>row.changes.every(c=>c.before===undefined||(p[c.field]||'')===c.before))||candidates.find(p=>row.changes.every(c=>JSON.stringify(p[c.field])===JSON.stringify(c.after)));
  assert(p,'Unexplained catalogue transition '+row.id);
  for(const c of row.changes)p[c.field]=c.after;
 }
 return expected;
}
export function assertSuccessor(root,file,expected,bytes=fs.readFileSync(path.join(root,file))){
 if(sha(bytes)===expected)return;
 const publishedSuccessors={
  "assets/site.css": "0412e5ce234f92ebef249429445f1faf970c0392b8be695812796ec556a5573b",
  "assets/site.js": "be4fb562483a6aa89caab556689f14b0178dcae127d103e3fc08f62d1cf4f2e9",
  "assets/contact-config.js": "4674202754c9e5b927ef69c83c504b94bfa0cbd65fa2ef754eb17ff58f168774",
  "contact.html": "fd1fb2ccd00cbb90c3d2779c383c3f05636a0b2efb7be9c617442d86bc3f96c9",
  "contact/index.html": "fc38e44a4a4ec8c285040281cfc364d2be3d67e1c0450a0b929c7710f7a11951",
  "projects.html": "40063508fe8bbe8e1824774a36d48212cfe4053198a719b1943499d062ecc027",
  "projects/index.html": "40063508fe8bbe8e1824774a36d48212cfe4053198a719b1943499d062ecc027"
};
 if(publishedSuccessors[file]===expected){assert(bytes.equals(publishedBytes(root,file)),'Unreviewed change beyond the verified published release: '+file);return;}
 const read=f=>fs.readFileSync(path.join(root,f));
 if(file==='sitemap.xml'&&expected==='f64eda0b83b20ad48390003cd7017b8d7d06c335b2288373ea2d6ccba37c2a14'){
  assert.equal(sha(restorePreAudienceSitemap(bytes.toString())),expected,'Unrelated sitemap drift');return;
 }
 if(file==='_redirects'&&expected==='8b26b53018285071700c2e28e5093f015b49c4dd68e1cfa75f522f485e1cd953'){
  let original=bytes.toString();for(const id of ['stone-floor-stone-oak','stone-floor-white-wash'])original=original.replace(`/product/${id}/ /ranges/stone-floor/ 301`,`/product/${id}/ /ranges/stone-floor-tile/ 301`);
  assert.equal(sha(original),expected,'Unrelated redirect drift');return;
 }
 if(file==='assets/flooring-assistant.js'&&expected==='cfcfdde54b45b4c215fdb089839be0a0ed802520ddf9d52f9feafc0264f657b9'){
  if(bytes.equals(publishedBytes(root,file)))return;
  const reviewed=evidence(root,'assistant-local-sprint/VALIDATION.json').sourceFiles.find(x=>x.file===file);
  assert.equal(sha(bytes),reviewed.sha256,'Unreviewed assistant UI drift');return;
 }
 if(file==='projects.html'&&expected==='40063508fe8bbe8e1824774a36d48212cfe4053198a719b1943499d062ecc027'){
  // Oct 30 performance repair adds one marker, without altering copy or URLs.
  const original=bytes.toString().replace('decoding="async" data-lcp-image','decoding="async"');assert.equal(sha(original),expected,'Unrelated projects drift');return;
 }
 if(file==='data/product-catalogue.json'&&expected==='21c9ab9f207ac0412b19bb4d94e671123e72f952532f4b61a69fa269bcdd2fed'){
  const before=read(d+'stonefloor-retirement/before/data/product-catalogue.json');assert.equal(sha(before),expected);
  const projected=replayCatalogue(root,JSON.parse(before)),actual=JSON.parse(bytes);
  const receipt=read('config/stonefloor-legacy-retirement-2026-10-28.json');assert.equal(sha(receipt),STONEFLOOR_RETIREMENT_SHA256);
  for(const {id} of JSON.parse(receipt).products){const p=projected.products.find(p=>p.id===id);Object.assign(p,{publicCatalogueStatus:'retired',stockStatusLabel:'No longer offered by Oz Timber Floor',retirementDate:'2026-10-28',retirementBasis:'Owner business retirement; not a manufacturer discontinuation claim',lastCatalogueReview:'2026-10-28',catalogueNote:"Owner retired this legacy colour from Oz Timber Floor's offer on 2026-10-28. Manufacturer discontinuation is not independently confirmed. General Stone Floor options are alternatives, not an exact replacement.",shortDescription:`Oz Timber Floor no longer offers ${p.name}. Browse current Stone Floor alternatives or contact our team for help.`});}
  // Keep both dated states valid, but no unreviewed intermediate mutation.
  if(JSON.stringify(actual)===JSON.stringify(projected))return;
  assert(JSON.stringify(actual)===JSON.stringify(reviewedCatalogue(root)),'Catalogue differs from the published release plus exact reviewed supplier changes');return;
 }
 assert.equal(sha(bytes),expected,'Unreconciled protected source '+file);
}

// Generated knowledge is not frozen at the pre-supplier catalogue forever.
// Rebuild in a separate copy and require byte identity, rather than blessing
// an arbitrary current hash or weakening the approval-bound assistant tests.
export function assertReproducibleCorpus(root,bytes){
 const temp=fs.mkdtempSync(path.join(os.tmpdir(),'oz-corpus-replay-'));
 try{
  const copy=path.join(temp,'source');fs.mkdirSync(copy);
  for(const entry of fs.readdirSync(root)){if(['.git','.netlify','dist','node_modules'].includes(entry)||/^\.env(?:\.|$)/.test(entry))continue;fs.cpSync(path.join(root,entry),path.join(copy,entry),{recursive:true});}
  fs.symlinkSync(path.join(root,'node_modules'),path.join(copy,'node_modules'),'dir');
  execFileSync(process.execPath,['scripts/assistant-build-knowledge.mjs'],{cwd:copy,env:{PATH:process.env.PATH,HOME:process.env.HOME,NODE_OPTIONS:process.env.NODE_OPTIONS||'',OZ_ASSISTANT_EVIDENCE_DIR:path.join(temp,'evidence')},stdio:'pipe'});
  assert(bytes.equals(fs.readFileSync(path.join(copy,'assistant/generated/corpus.json'))),'Generated corpus differs from fresh source-derived rebuild');
 }finally{fs.rmSync(temp,{recursive:true,force:true});}
}
