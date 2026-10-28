import {hash} from './security.mjs';
export const PRODUCTION_ORIGIN='https://oztimberfloor.com.au';
export const PRODUCTION_STORE='oz-assistant-production-budget-v1';
export const PRODUCTION_REGION='us-east-2';
export async function productionControlEnabled(blob,profileHash){
 const control=await blob.get('control-v1',{type:'json',consistency:'strong'});
 return control?.enabled===true&&control.profileSha256===profileHash;
}
// Preparation only: no defaults grant spending, data-use or launch authority.
export function approvedProductionPolicy(profile,basePolicy,corpus,env){
 if(profile?.apiKeyVariable!=='OZ_ASSISTANT_OPENAI_API_KEY')throw Error('production_key_not_approved');
 if(profile?.schemaVersion!==1||profile.purpose!=='public-production-launch'||profile.activationApproved!==true||profile.dataUseApproved!==true||!profile.approvalReference||['knowledge','privacy','spending','launch'].some(k=>profile.ownerApprovals?.[k]!==true)||profile.boundCorpusVersion!==corpus.corpusVersion||env.OZ_ASSISTANT_PRODUCTION_CONFIG_HASH!==hash(profile))throw Error('production_not_approved');
 const privacy=corpus.documents.find(d=>d.canonicalPath==='/privacy/');if(!privacy||profile.privacyDocumentSha256!==privacy.sourceHash||!/^[a-f0-9]{64}$/.test(profile.privacyDocumentSha256))throw Error('privacy_not_approved');
 const rates={inputUsdPerMillion:.1,outputUsdPerMillion:.5,cachedInputUsdPerMillion:.01,cacheWrite30mUsdPerMillion:.125,cacheWrite12hUsdPerMillion:.25};
 if(profile.candidateModelId!=='gpt-6-luna'||profile.rateTable?.modelId!=='gpt-6-luna'||Object.entries(rates).some(([k,v])=>profile.rateTable[k]!==v)||!/^\d{4}-\d{2}-\d{2}$/.test(profile.rateTable.verifiedAt))throw Error('rates_unavailable');
 if(profile.requestSettings?.reasoningEffort!=='none'||profile.requestSettings.cacheMode!=='explicit'||profile.requestSettings.cacheTtl!=='30m'||profile.requestSettings.cacheBreakpoints!==0)throw Error('production_not_approved');
 if(profile.budgetStoreName!==PRODUCTION_STORE||profile.budgetStoreRegion!==PRODUCTION_REGION||profile.atomicStoreAdapter!=='netlify-blobs-strong-cas-v1'||profile.budgetVerification?.storeName!==PRODUCTION_STORE||profile.budgetVerification.status!=='HOSTED_PASS'||!/^[a-f0-9]{64}$/.test(profile.budgetVerification.reportSha256||''))throw Error('budget_store_unavailable');
 if(profile.modelAccess?.status!=='PRODUCTION_KEY_PASS'||!/^[a-f0-9]{64}$/.test(profile.modelAccess.reportSha256||''))throw Error('production_model_unverified');
 const ceilings={sessionMinute:6,sessionDay:30,ipMinute:12,ipDay:100,sessionConcurrent:2,globalConcurrent:4,globalDayCalls:200,globalMonthCalls:1000,dayBudgetUsd:5,monthBudgetUsd:30};
 for(const [k,max]of Object.entries(ceilings))if(!Number.isFinite(profile.allowance?.[k])||profile.allowance[k]<=0||profile.allowance[k]>max||!k.endsWith('Usd')&&!Number.isInteger(profile.allowance[k]))throw Error('production_budget_not_approved');
 // Ongoing production quotas are NOT a reset/extension of the private trial.
 const limits={...basePolicy.limits,...profile.allowance};delete limits.evaluationCalls;delete limits.evaluationBudgetUsd;
 return {...basePolicy,paidActivationApproved:true,reviewedModelId:profile.candidateModelId,rateTable:profile.rateTable,atomicStoreAdapter:profile.atomicStoreAdapter,limits};
}
