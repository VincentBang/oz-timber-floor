import assert from 'node:assert/strict';
import {hash} from '../assistant/lib/security.mjs';
import {approvedProductionPolicy} from '../assistant/lib/production.mjs';
export function checkProductionBinding({profile,corpus,policy,authority,modelProofBytes,storeProofBytes}){
 assert.equal(authority.scope,'LOCAL_PRODUCTION_BINDING_PREPARATION_ONLY');
 assert.equal(authority.prepareProductionPayload,true);
 for(const key of ['publicActivationAuthorized','providerWritesAuthorized','gitPushAuthorized','deploymentAuthorized','paidCallsAuthorized'])assert.equal(authority[key],false,key);
 assert.equal(corpus.corpusVersion,authority.productionCorpus);assert.equal(hash(corpus.documents),corpus.corpusVersion);
 assert.equal(corpus.documents.reduce((n,d)=>n+d.facts.length,0),authority.facts);assert.equal(authority.facts,6744);assert.equal(authority.unchangedReviewedFacts,6743);
 assert.equal(profile.boundCorpusVersion,corpus.corpusVersion);
 assert.equal(profile.privacyDocumentSha256,corpus.documents.find(d=>d.canonicalPath==='/privacy/').sourceHash);
 assert.equal(profile.allowance.monthBudgetUsd,30);assert.equal(profile.allowance.dayBudgetUsd,1);
 assert.equal(authority.monthlyUsd,30);assert.equal(authority.dailyUsd,1);
 assert.equal(hash(modelProofBytes),profile.modelAccess.reportSha256);
 const m=JSON.parse(modelProofBytes);assert.equal(m.httpStatus,200);assert.equal(m.body.status,'PASS');assert.equal(m.body.model,'gpt-6-luna');assert.equal(m.body.providerRequests,1);assert.equal(m.body.completed,true);assert.equal(m.body.allFactIdsGrounded,true);
 assert.equal(hash(storeProofBytes),profile.budgetVerification.reportSha256);
 const s=JSON.parse(storeProofBytes);assert.equal(s.status,'PASS');assert.match(s.scope,/COMPONENT/);assert.equal(s.generationCalls,0);assert.equal(s.checks.length,8);assert(s.checks.includes('approved_one_dollar_day_and_thirty_dollar_month_boundaries'));assert.deepEqual(s.before,s.after);
 const env={OZ_ASSISTANT_PRODUCTION_CONFIG_HASH:hash(profile)};
 const approved=approvedProductionPolicy(profile,policy,corpus,env);
 assert.equal(approved.limits.monthBudgetUsd,30);assert.equal(approved.limits.dayBudgetUsd,1);assert.equal(approved.limits.evaluationCalls,undefined);
 return {profileHash:hash(profile),corpusVersion:corpus.corpusVersion,monthlyUsd:30,dailyUsd:1,proofScope:'Historical actual production-key generation plus unchanged native-store component evidence; NOT a fresh hosted test of this release',publicActivationAuthorized:false};
}
