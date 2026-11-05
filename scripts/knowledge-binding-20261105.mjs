// Local-only, exact-version review. This module contains no provider writes.
import assert from 'node:assert/strict';
import {hash} from '../assistant/lib/security.mjs';
import {sourceForHistoricalDigest} from './homepage-search-source-delta.mjs';
export const CANDIDATE='a26ef1108a47eba7e29017b2b49b02ac5f3af3d8b85270b42b26ddb598f163e9';
export const PARENT='733295f767b7dbb2893a0d0d89ea978c3bd1b718c7c1956fe1868666518cc77c';
export const PARENT_PROFILE='a87c40db17e2cd4cccfe2e89907be89f459b5d3e28686d117579a016d2a368dd';
export const ADDITIONS=[
 'Flooring supply, installation and preparation across Sydney.',
 'Herringbone kitchen and living area',
 '24/24–32 Hughes Street, Cabramatta NSW 2166',
];
const semantic=f=>JSON.stringify([f.field,f.value,f.qualifier,f.reviewState]);
export function reviewKnowledge({baseline,corpus,sourceManifest,read,parentProfile,authority}){
 assert.equal(hash(baseline.documents),PARENT);assert.equal(baseline.corpusVersion,PARENT);
 assert.equal(hash(corpus.documents),CANDIDATE);assert.equal(corpus.corpusVersion,CANDIDATE);
 assert.equal(hash(parentProfile),PARENT_PROFILE);assert.equal(parentProfile.boundCorpusVersion,PARENT);
 assert.equal(corpus.documents.length,775);assert.equal(corpus.documents.reduce((n,d)=>n+d.facts.length,0),6821);
 assert.equal(baseline.documents.reduce((n,d)=>n+d.facts.length,0),6818);
 assert.equal(sourceManifest.candidateHash,corpus.candidateHash);
 for(const [file,digest]of Object.entries(sourceManifest.files))assert.equal(hash(sourceForHistoricalDigest(file,read(file),digest)),digest,'Stale knowledge source '+file);
 assert.equal(authority.scope,'LOCAL_PRODUCTION_BINDING_PREPARATION_ONLY');
 for(const k of ['publicActivationAuthorized','providerWritesAuthorized','gitPushAuthorized','deploymentAuthorized','paidCallsAuthorized'])assert.equal(authority[k],false,k);
 assert.equal(authority.corpusVersion,CANDIDATE);assert.equal(authority.parentProfileHash,PARENT_PROFILE);
 assert.equal(authority.monthlyUsd,30);assert.equal(authority.dailyUsd,1);
 const old=new Map(baseline.documents.map(d=>[d.canonicalPath,d]));
 assert.deepEqual(corpus.documents.map(d=>d.canonicalPath),baseline.documents.map(d=>d.canonicalPath));
 const added=[],removed=[],citationRemaps=[];
 for(const d of corpus.documents){const prev=old.get(d.canonicalPath),a=new Set(prev.facts.map(semantic)),b=new Set(d.facts.map(semantic));
  added.push(...d.facts.filter(f=>!a.has(semantic(f))).map(f=>({route:d.canonicalPath,fact:f})));
  removed.push(...prev.facts.filter(f=>!b.has(semantic(f))).map(f=>({route:d.canonicalPath,fact:f})));
  for(const f of d.facts){const before=prev.facts.find(p=>semantic(p)===semantic(f));if(before&&(before.id!==f.id||before.section!==f.section))citationRemaps.push({route:d.canonicalPath,value:f.value,oldId:before.id,id:f.id,oldSection:before.section,section:f.section});}
 }
 assert.deepEqual(removed,[]);assert.equal(added.length,3);assert(added.every(a=>a.route==='/'));
 assert.deepEqual(added.map(a=>a.fact.value).sort(),[...ADDITIONS].sort());
 // This is the dated candidate's bound source, not approval of a new corpus.
 // The exact footer transition preserves the configured showroom address while
 // moving it out of the duplicated main CTA and formatting it over two lines.
 const boundHome=sourceForHistoricalDigest('index.html',read('index.html'),sourceManifest.files['index.html']);
 for(const value of ADDITIONS)assert(boundHome.toString().includes(value),'Missing bound homepage support '+value);
 const projects=JSON.parse(read('data/projects.json'));assert(projects.projects.some(p=>p.publicApproved&&p.photos.some(x=>x.caption===ADDITIONS[1])),'Caption lacks approved project-photo evidence');
 assert.deepEqual(corpus.retirements,baseline.retirements);
 return{added,citationRemaps,removed,publicationPages:775,facts:6821,productRangeFactValuesUnchanged:true};
}
export function pendingProfile(parent,corpus){return{...structuredClone(parent),activationApproved:false,ownerApprovals:{...parent.ownerApprovals,knowledge:false,launch:false},boundCorpusVersion:corpus.corpusVersion,privacyDocumentSha256:corpus.documents.find(d=>d.canonicalPath==='/privacy/').sourceHash,approvalReference:'5 November 2026: owner authorised exact local binding preparation and local checks only. Knowledge delta reviewed against current public source. Hosted verification, paid calls, provider writes and production activation remain unauthorised. Prior proof receipts remain historical, not fresh candidate evidence.'};}
export function checkPending({profile,parent,corpus,authority}){
 assert.equal(hash(parent),PARENT_PROFILE);assert.equal(corpus.corpusVersion,CANDIDATE);assert.equal(hash(corpus.documents),CANDIDATE);
 assert.equal(authority.scope,'LOCAL_PRODUCTION_BINDING_PREPARATION_ONLY');assert.equal(authority.corpusVersion,CANDIDATE);assert.equal(authority.parentProfileHash,PARENT_PROFILE);
 for(const key of ['publicActivationAuthorized','providerWritesAuthorized','gitPushAuthorized','deploymentAuthorized','paidCallsAuthorized'])assert.equal(authority[key],false,key);
 assert.equal(authority.monthlyUsd,30);assert.equal(authority.dailyUsd,1);
 assert.deepEqual(profile,pendingProfile(parent,corpus),'Pending payload changed beyond reviewed corpus/privacy/approval fields');
 assert.equal(profile.allowance.monthBudgetUsd,30);assert.equal(profile.allowance.dayBudgetUsd,1);
 assert.equal(profile.budgetStoreName,parent.budgetStoreName);assert.equal(profile.budgetStoreRegion,parent.budgetStoreRegion);assert.equal(profile.atomicStoreAdapter,parent.atomicStoreAdapter);
 assert.equal(authority.publicActivationAuthorized,false);assert.equal(authority.providerWritesAuthorized,false);
 return{profileHash:hash(profile),corpusVersion:corpus.corpusVersion,monthlyUsd:30,dailyUsd:1,activationApproved:false};
}
