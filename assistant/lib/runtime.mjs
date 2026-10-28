import {deploymentSettings} from './deployment.mjs';
import {AtomicBlobBudgetStore} from './atomic-budget.mjs';
import {hash} from './security.mjs';
import {atomicBlobFetch} from './blob-transport.mjs';
import {approvedProductionPolicy,productionControlEnabled,PRODUCTION_STORE,PRODUCTION_REGION} from './production.mjs';

export const PAID_STORE_NAME='oz-assistant-paid-preview-budget-v1';
export const PAID_STORE_REGION='us-east-2';
export const CANDIDATE_MODEL='gpt-6-luna';
// Explicitly approved profiles only; retaining the historical model supports
// regression tests/rollback, never automatic model selection or fallback.
const reviewedRates={
 'gpt-4.1-mini-2025-04-14':{inputUsdPerMillion:.4,outputUsdPerMillion:1.6},
 'gpt-6-luna':{inputUsdPerMillion:.1,outputUsdPerMillion:.5,cachedInputUsdPerMillion:.01,cacheWrite30mUsdPerMillion:.125,cacheWrite12hUsdPerMillion:.25}
};

export function approvedPreviewPolicy(profile,basePolicy,corpus,env){
 if(profile?.schemaVersion!==1||profile.purpose!=='protected-internal-evaluation-only'||profile.activationApproved!==true||profile.dataUseApproved!==true||!profile.approvalReference||profile.boundCorpusVersion!==corpus.corpusVersion||env.OZ_ASSISTANT_PAID_CONFIG_HASH!==hash(profile))throw Error('paid_not_approved');
 const expected=reviewedRates[profile.candidateModelId];
 if(!expected||profile.rateTable?.modelId!==profile.candidateModelId||Object.entries(expected).some(([k,v])=>profile.rateTable[k]!==v)||!/^\d{4}-\d{2}-\d{2}$/.test(profile.rateTable.verifiedAt))throw Error('rates_unavailable');
 if(profile.candidateModelId==='gpt-6-luna'&&(profile.requestSettings?.reasoningEffort!=='none'||profile.requestSettings?.cacheMode!=='explicit'||profile.requestSettings?.cacheTtl!=='30m'||profile.requestSettings?.cacheBreakpoints!==0))throw Error('paid_not_approved');
 if(profile.atomicStoreAdapter!=='netlify-blobs-strong-cas-v1'||profile.budgetStoreName!==PAID_STORE_NAME||profile.budgetStoreRegion!==PAID_STORE_REGION)throw Error('budget_store_unavailable');
 const ceilings={sessionMinute:6,sessionDay:30,ipMinute:12,ipDay:100,sessionConcurrent:2,globalConcurrent:4,globalDayCalls:200,globalMonthCalls:1000,dayBudgetUsd:5,monthBudgetUsd:25};
 for(const [name,max]of Object.entries(ceilings))if(!Number.isFinite(profile.allowance?.[name])||profile.allowance[name]<=0||profile.allowance[name]>max||!name.endsWith('Usd')&&!Number.isInteger(profile.allowance[name]))throw Error('paid_not_approved');
 if(!Number.isInteger(profile.evaluation?.maxCalls)||profile.evaluation.maxCalls<1||profile.evaluation.maxCalls>20||!Number.isFinite(profile.evaluation.maxUsd)||profile.evaluation.maxUsd<=0||profile.evaluation.maxUsd>1)throw Error('paid_not_approved');
 return {...basePolicy,paidActivationApproved:true,reviewedModelId:profile.candidateModelId,rateTable:profile.rateTable,atomicStoreAdapter:profile.atomicStoreAdapter,limits:{...basePolicy.limits,...profile.allowance,evaluationCalls:profile.evaluation.maxCalls,evaluationBudgetUsd:profile.evaluation.maxUsd}};
}

// No external operation at module load. Preview keeps its existing guards;
// an approved production invocation additionally strongly reads live control.
export async function runtimeOptions({env,context,url,policy,profile,productionProfile,corpus,loadBlobs=()=>import('@netlify/blobs')}){
 const settings=deploymentSettings(env,context,url);
 const base={settings,policy};
 if(settings.mode==='production'){
  try{
   if(!settings.enabled||settings.context!=='production'||!settings.productionApproved||!settings.paidCallsEnabled||settings.signingSecret.length<32||productionProfile?.apiKeyVariable!=='OZ_ASSISTANT_OPENAI_API_KEY'||!env.OZ_ASSISTANT_OPENAI_API_KEY)throw Error('production_not_approved');
   const productionPolicy=approvedProductionPolicy(productionProfile,policy,corpus,env),{getStore}=await loadBlobs();
   const blob=getStore({name:PRODUCTION_STORE,region:PRODUCTION_REGION,consistency:'strong',fetch:atomicBlobFetch()});
   if(!await productionControlEnabled(blob,hash(productionProfile)))throw Error('feature_off');
   return {settings,policy:productionPolicy,store:new AtomicBlobBudgetStore(blob),paid:{key:env.OZ_ASSISTANT_OPENAI_API_KEY,model:productionPolicy.reviewedModelId}};
  }catch{return {...base,settings:{...settings,enabled:false}};}
 }
 if(settings.mode!=='preview')return base;
 if(!settings.enabled||settings.context!=='deploy-preview'||!settings.previewApproved||!settings.paidPreviewApproved||new URL(url).origin!==settings.allowedOrigin)return {...base,settings:{...settings,enabled:false}};
 try{
  const paidPolicy=approvedPreviewPolicy(profile,policy,corpus,env);
  // A key, profile approval and env switch still cannot skip the actual hosted
  // atomic-store verification or account-specific model availability check.
  const paidCallsEnabled=settings.paidCallsEnabled&&profile.accountModelAvailable===true&&profile.budgetVerification?.status==='HOSTED_PASS'&&/^[a-f0-9]{64}$/.test(profile.budgetVerification.reportSha256||'');
  const {getStore}=await loadBlobs();
  const blob=getStore({name:PAID_STORE_NAME,region:PAID_STORE_REGION,consistency:'strong',fetch:atomicBlobFetch()});
  return {settings:{...settings,paidCallsEnabled},policy:paidPolicy,store:new AtomicBlobBudgetStore(blob),paid:{key:env.OZ_ASSISTANT_OPENAI_API_KEY||'',model:paidPolicy.reviewedModelId}};
 }catch{
  return {...base,settings:{...settings,enabled:false}};
 }
}
