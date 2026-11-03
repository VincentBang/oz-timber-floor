import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import profile from '../assistant/releases/2026-11-03/production-profile.json' with {type:'json'};
import authority from '../assistant/releases/2026-11-03/RELEASE_AUTHORITY.json' with {type:'json'};
import corpus from '../assistant/generated/corpus.json' with {type:'json'};
import policy from '../assistant/config/policy.json' with {type:'json'};
import sourceDefault from '../assistant/config/production.json' with {type:'json'};
import previous from '../assistant/releases/2026-10-29-flooring-guide/production-profile.json' with {type:'json'};
import {hash} from '../assistant/lib/security.mjs';
import {approvedProductionPolicy} from '../assistant/lib/production.mjs';
const approve=(p=profile,c=corpus)=>approvedProductionPolicy(p,policy,c,{OZ_ASSISTANT_PRODUCTION_CONFIG_HASH:hash(p)});
test('exact November release has independent owner authority, current corpus/privacy and retained spending ceilings',()=>{
 assert.equal(hash(profile),authority.profileHash);assert.equal(profile.boundCorpusVersion,corpus.corpusVersion);assert.equal(profile.privacyDocumentSha256,corpus.documents.find(d=>d.canonicalPath==='/privacy/').sourceHash);
 assert.equal(authority.gitPushAuthorized,true);assert.equal(authority.activationAuthorized,true);assert.equal(authority.oneProductionDeployment,true);
 const approved=approve();assert.equal(approved.limits.monthBudgetUsd,30);assert.equal(approved.limits.dayBudgetUsd,1);assert.equal(approved.limits.evaluationBudgetUsd,undefined);assert.equal(approved.limits.evaluationCalls,undefined);
 assert.equal(profile.budgetStoreName,previous.budgetStoreName);assert.equal(profile.apiKeyVariable,previous.apiKeyVariable);assert.deepEqual(profile.requestSettings,previous.requestSettings);assert.deepEqual(profile.rateTable,previous.rateTable);assert.equal(sourceDefault.activationApproved,false);
});
test('old production authority cannot authorize rebuilt corpus and new authority cannot authorize altered facts',()=>{
 assert.throws(()=>approve(previous));const changed=structuredClone(corpus);changed.documents[0].candidateHash=hash('unapproved-change');changed.corpusVersion=hash(changed.documents);assert.throws(()=>approve(profile,changed));
 for(const key of ['knowledge','privacy','spending','launch'])assert.throws(()=>approve({...profile,ownerApprovals:{...profile.ownerApprovals,[key]:false}}));
});
test('release does not relabel preview-key proof as a fresh production-key test or reset the native ledger',()=>{
 assert.equal(profile.modelAccess.reportSha256,previous.modelAccess.reportSha256);assert.match(authority.historicalModelAccessScope,/Historical|historical/);assert.match(authority.historicalModelAccessScope,/No new production paid response/);assert.match(authority.budgetProof.scope,/isolated-prefix/);assert.match(authority.providerWrites,/preserve state-v1/);assert.equal(authority.noNewPaidTestOrFormSubmission,true);
 for(const item of authority.budgetProof.adapterFiles)assert.equal(hash(fs.readFileSync(new URL('../'+item.file,import.meta.url))),item.sha256);
});
test('approved uploads retain three static binary inputs and existing Netlify form identity',()=>{
 const html=fs.readFileSync(new URL('../contact/index.html',import.meta.url),'utf8');assert.match(html,/name="oz-flooring-enquiry"/);assert.match(html,/action="\/thank-you\/"/);assert.equal((html.match(/type="file"/g)||[]).length,3);assert.match(html,/enquiry-attachments\.js/);assert.match(authority.uploadsAccessLimitation,/without login/);
});
