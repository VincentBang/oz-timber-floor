// Exact current-source review and INACTIVE payload only. No historical source
// projection, provider access, ledger writes or production activation.
import assert from 'node:assert/strict';
import {parse} from 'parse5';
import {hash} from '../assistant/lib/security.mjs';
import {visibleKnowledgeText} from '../assistant/lib/knowledge-quality.mjs';
export const CANDIDATE='e15e64b25fd01798e0430c8af886b7bdd37961d3607a061a0dba7941bd318358';
export const PREVIOUS='a26ef1108a47eba7e29017b2b49b02ac5f3af3d8b85270b42b26ddb598f163e9';
export const PARENT_PROFILE='a87c40db17e2cd4cccfe2e89907be89f459b5d3e28686d117579a016d2a368dd';
const RETIREMENTS='ae31ec19094f1920d23a98cf399dd66c82ebf67636f098c559cbb646cfe7a278';
const CORPUS_SHA256='d882ec2693f0c72b1199cdca4fcee0e946018e02cb5832a69eb976451738acae';
const semantic=f=>JSON.stringify([f.field,f.value,f.qualifier,f.reviewState]);
const all=n=>[n,...(n.childNodes||[]).flatMap(all)];
const additions=[['/contact/','Showroom: 24/24-32 Hughes Street, Cabramatta NSW 2166'],['/contact/','Oz Timber Floor uses your product, service and project details to respond to your enquiry.']];
const obsolete='If you have photos or a floor plan, mention it in your message and we can request them after your enquiry.';
const removals=[['/','24/24–32 Hughes Street, Cabramatta NSW 2166'],['/contact/','Phone: 0435 496 975 Second phone: 0434 882 699 Email: info@oztimberfloor.com.au Showroom: 24/24-32 Hughes Street, Cabramatta NSW 2166'],['/contact/','Oz Timber Floor uses your details to respond to product, service and project enquiries. Hidden source and attribution fields stay in place so the team can understand where the enquiry came from.'],...['engineered-timber','laminate','solid-timber','timber','vinyl'].map(s=>['/'+s+'-flooring-supplier-sydney/',obsolete]),['/hybrid-flooring-supplier-sydney/','If you have them, mention it in your message and we can request them after your enquiry.']];
export function checkAuthority(a){
 assert.equal(a.scope,'LOCAL_PRODUCTION_BINDING_PREPARATION_ONLY');assert.equal(a.corpusVersion,CANDIDATE);assert.equal(a.parentProfileHash,PARENT_PROFILE);assert.equal(a.prepareProductionPayload,true);
 for(const k of ['publicActivationAuthorized','providerWritesAuthorized','gitPushAuthorized','deploymentAuthorized','paidCallsAuthorized','realSubmissionsAuthorized'])assert.equal(a[k],false,k);
 assert.equal(a.monthlyUsd,30);assert.equal(a.dailyUsd,1);
}
export function reviewKnowledge({previous,corpus,sourceManifest,read,parent,authority}){
 checkAuthority(authority);assert.equal(hash(parent),PARENT_PROFILE);
 assert.equal(hash(previous.documents),PREVIOUS);assert.equal(previous.corpusVersion,PREVIOUS);
 assert.equal(hash(corpus.documents),CANDIDATE);assert.equal(corpus.corpusVersion,CANDIDATE);
 assert.equal(corpus.documents.length,775);assert.equal(corpus.documents.reduce((n,d)=>n+d.facts.length,0),6814);
 assert.equal(sourceManifest.candidateHash,corpus.candidateHash);
 assert.equal(Object.keys(sourceManifest.files).length,881);
 for(const [f,h] of Object.entries(sourceManifest.files))assert.equal(hash(read(f)),h,'Current source drift: '+f);
 assert.deepEqual(corpus.documents.map(d=>d.canonicalPath),previous.documents.map(d=>d.canonicalPath));
 assert.deepEqual(corpus.retirements,previous.retirements);
 const added=[],removed=[],citationRemaps=[];
 for(const d of corpus.documents){const old=previous.documents.find(p=>p.canonicalPath===d.canonicalPath),a=new Set(old.facts.map(semantic)),b=new Set(d.facts.map(semantic));
  if(['product','range'].includes(d.entityType))assert.deepEqual(d.facts.map(semantic),old.facts.map(semantic),d.canonicalPath);
  for(const f of d.facts){if(!a.has(semantic(f)))added.push({route:d.canonicalPath,fact:f});else{const p=old.facts.find(p=>semantic(p)===semantic(f));if(p.id!==f.id||p.section!==f.section)citationRemaps.push({route:d.canonicalPath,oldId:p.id,id:f.id,oldSection:p.section,section:f.section});}}
  for(const f of old.facts)if(!b.has(semantic(f)))removed.push({route:d.canonicalPath,fact:f});
 }
 const shape=rows=>rows.map(r=>[r.route,r.fact.value]).sort((a,b)=>JSON.stringify(a).localeCompare(JSON.stringify(b)));
 assert(added.concat(removed).every(r=>r.fact.field==='guidance'));assert.deepEqual(shape(added),[...additions].sort((a,b)=>JSON.stringify(a).localeCompare(JSON.stringify(b))));assert.deepEqual(shape(removed),[...removals].sort((a,b)=>JSON.stringify(a).localeCompare(JSON.stringify(b))));
 for(const r of added){const d=corpus.documents.find(d=>d.canonicalPath===r.route),file=Object.keys(sourceManifest.files).find(f=>f.endsWith('.html')&&sourceManifest.files[f]===d.sourceHash);assert(file);const main=all(parse(read(file).toString())).find(n=>n.tagName==='main');assert(visibleKnowledgeText(main).replace(/\s+/g,' ').includes(r.fact.value),'Missing visible support');}
 assert(!JSON.stringify(corpus.documents).includes('7 MB combined'));
 return {status:'EXACT_LOCAL_KNOWLEDGE_REVIEW_PASS',corpusVersion:CANDIDATE,publicationOwners:775,facts:6814,sourceInputs:881,added,removed,citationRemaps,productRangeFactsUnchanged:true,retirementsUnchanged:true,showroomAvailability:'NOT_VERIFIED; retained contact text is not new availability approval',hostedCandidateVerification:'NOT_RUN'};
}
export function pendingProfile(parent,corpus){return {...structuredClone(parent),activationApproved:false,ownerApprovals:{...parent.ownerApprovals,knowledge:false,launch:false},boundCorpusVersion:corpus.corpusVersion,privacyDocumentSha256:corpus.documents.find(d=>d.canonicalPath==='/privacy/').sourceHash,approvalReference:'6 November 2026: owner authorised exact production binding preparation and final local checks only. This pending profile does not authorise launch, provider writes, deployment, push, paid calls or real submissions. Historical proof receipts are retained as historical, not current candidate verification.'};}
export function checkPending({profile,parent,corpus,authority}){
 assert.equal(hash(corpus),CORPUS_SHA256,'Exact full corpus payload changed');
 assert.equal(hash(corpus.retirements),RETIREMENTS,'Exact retirement set changed outside document hash');
 checkAuthority(authority);assert.equal(hash(parent),PARENT_PROFILE);assert.equal(hash(corpus.documents),CANDIDATE);assert.equal(corpus.corpusVersion,CANDIDATE);assert.deepEqual(profile,pendingProfile(parent,corpus));
 assert.equal(profile.allowance.dayBudgetUsd,1);assert.equal(profile.allowance.monthBudgetUsd,30);
 assert.deepEqual(profile.allowance,parent.allowance);assert.equal(profile.budgetStoreName,'oz-assistant-production-budget-v1');assert.equal(profile.budgetStoreRegion,'us-east-2');assert.equal(profile.atomicStoreAdapter,'netlify-blobs-strong-cas-v1');
 return {profileHash:hash(profile),corpusVersion:CANDIDATE,activationApproved:false,dailyUsd:1,monthlyUsd:30};
}
