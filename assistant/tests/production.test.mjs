import test from 'node:test';
import assert from 'node:assert/strict';
import currentCorpus from '../generated/corpus.json' with {type:'json'};
import corpus from './fixtures/bound-approval-corpus.mjs';
import policy from '../config/policy.json' with {type:'json'};
import candidate from '../config/production.json' with {type:'json'};
import preview from '../config/paid-preview.json' with {type:'json'};
import {approvedProductionPolicy,PRODUCTION_STORE} from '../lib/production.mjs';
import {runtimeOptions} from '../lib/runtime.mjs';
import {createHandler} from '../lib/handler.mjs';
import {hash,issueToken} from '../lib/security.mjs';
import {ConditionalBlobFixture} from './fixtures/conditional-blob.mjs';
import {buildIndex,retrieve} from '../lib/retrieval.mjs';
const origin='https://oztimberfloor.com.au',secret='offline-production-fixture-signing-secret-12345';
const profile={...candidate,activationApproved:true,dataUseApproved:true,ownerApprovals:{knowledge:true,privacy:true,spending:true,launch:true},approvalReference:'OFFLINE-FIXTURE-NOT-LIVE-AUTHORITY',privacyDocumentSha256:corpus.documents.find(d=>d.canonicalPath==='/privacy/').sourceHash,modelAccess:{status:'PRODUCTION_KEY_PASS',reportSha256:hash('offline-model')},budgetVerification:{status:'HOSTED_PASS',storeName:PRODUCTION_STORE,reportSha256:hash('offline-budget')},allowance:{...candidate.allowance,dayBudgetUsd:1,monthBudgetUsd:10}};
const env=p=>({OZ_ASSISTANT_ENABLED:'true',OZ_ASSISTANT_MODE:'production',OZ_ASSISTANT_ORIGIN:origin,OZ_ASSISTANT_PRODUCTION_APPROVED:'true',OZ_ASSISTANT_PAID_CALLS_ENABLED:'true',OZ_ASSISTANT_PRODUCTION_CONFIG_HASH:hash(p),OZ_ASSISTANT_OPENAI_API_KEY:'offline-only-approved-oz-key',OZ_ASSISTANT_PRODUCTION_SIGNING_SECRET:secret});
const context={site:{id:'fd68e39e-7863-4012-8a97-40bec59b23d9',name:'oztimberfloor'},deploy:{published:true,context:'production'}};
const approve=p=>approvedProductionPolicy(p,policy,corpus,env(p));
function backend(p=profile){const ledger=new ConditionalBlobFixture(),control={enabled:true,profileSha256:hash(p)};return {ledger,control,blob:{get:async(key,options)=>{assert.equal(key,'control-v1');assert.equal(options.consistency,'strong');return {...control};},getWithMetadata:(...a)=>ledger.getWithMetadata(...a),setJSON:(...a)=>ledger.setJSON(...a)}};}
const options=(p=profile,e=env(p),c=context,b=backend(p),url=origin+'/api/flooring-assistant')=>runtimeOptions({env:e,context:c,url,policy,profile:preview,productionProfile:p,corpus,loadBlobs:async()=>({getStore:config=>{assert.equal(config.name,PRODUCTION_STORE);assert.equal(config.region,'us-east-2');assert(!config.token&&!config.siteID);return b.blob;}})});
const request=(patch={})=>new Request(origin+'/api/flooring-assistant',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:JSON.stringify({op:'message',message:'Avala Blackbutt',history:[],pagePath:'/',sessionToken:issueToken(secret),requestId:crypto.randomUUID(),...patch})});
test('approved spending/privacy do not grant launch authority or permit spending with any key',async()=>{
 assert.equal(candidate.activationApproved,false);assert.equal(candidate.dataUseApproved,true);assert.equal(candidate.ownerApprovals.launch,true);assert.equal(candidate.ownerApprovals.privacy,true);assert.equal(candidate.ownerApprovals.spending,true);assert.equal(candidate.apiKeyVariable,'OZ_ASSISTANT_OPENAI_API_KEY');assert.equal(candidate.allowance.dayBudgetUsd,1);assert.equal(candidate.allowance.monthBudgetUsd,30);
 let opens=0;const result=await runtimeOptions({env:env(candidate),context,url:origin+'/api/flooring-assistant',policy,profile:preview,productionProfile:candidate,corpus,loadBlobs:async()=>{opens++;throw Error('must not open');}});assert.equal(result.settings.enabled,false);assert.equal(opens,0);
});
test('every owner approval, corpus/privacy binding and distinct model/store proof is required',()=>{
 assert.equal(approve(profile).reviewedModelId,'gpt-6-luna');
 assert.equal(approve({...profile,allowance:{...profile.allowance,monthBudgetUsd:30}}).limits.monthBudgetUsd,30);
 const invalid=[...['knowledge','privacy','spending','launch'].map(k=>({...profile,ownerApprovals:{...profile.ownerApprovals,[k]:false}})),{...profile,boundCorpusVersion:'stale'},{...profile,privacyDocumentSha256:hash('stale')},{...profile,budgetStoreName:'oz-assistant-paid-preview-budget-v1'},{...profile,modelAccess:{...profile.modelAccess,status:'PASS'}},{...profile,budgetVerification:{...profile.budgetVerification,storeName:'other'}},{...profile,candidateModelId:'unreviewed'},{...profile,allowance:{...profile.allowance,dayBudgetUsd:0}},{...profile,allowance:{...profile.allowance,monthBudgetUsd:30.01}}];
 for(const p of invalid)assert.throws(()=>approve(p));assert.throws(()=>approvedProductionPolicy(profile,policy,corpus,{...env(profile),OZ_ASSISTANT_PRODUCTION_CONFIG_HASH:'stale'}));
});
test('rebuilt knowledge cannot inherit production approval or open the budget store',async()=>{
 const documents=structuredClone(corpus.documents);documents[0].candidateHash=hash('unapproved-offline-test-input');
 const changed={...corpus,documents,corpusVersion:hash(documents)};
 for(const next of [changed,...(currentCorpus.corpusVersion!==corpus.corpusVersion?[currentCorpus]:[])]){
  assert.throws(()=>approvedProductionPolicy(profile,policy,next,env(profile)),/production_not_approved/);
  let opens=0;
  const result=await runtimeOptions({env:env(profile),context,url:origin+'/api/flooring-assistant',policy,profile:preview,productionProfile:profile,corpus:next,loadBlobs:async()=>{opens++;throw Error('must not open');}});
  assert.equal(result.settings.enabled,false);assert.equal(opens,0);
 }
});
test('only exact trusted published Oz production context works; public visitors need no team login',async()=>{
 assert.equal((await options()).settings.context,'production');assert.equal((await options()).settings.enabled,true);
 for(const c of [{...context,site:{id:'other',name:'oztimberfloor'}},{...context,deploy:{published:false,context:'deploy-preview'}},{...context,deploy:{published:true,context:'branch-deploy'}},{}])assert.equal((await options(profile,env(profile),c)).settings.enabled,false);
 for(const url of ['https://www.oztimberfloor.com.au/api/flooring-assistant','https://oztimberfloor.netlify.app/api/flooring-assistant','http://oztimberfloor.com.au/api/flooring-assistant'])assert.equal((await options(profile,env(profile),context,backend(),url)).settings.enabled,false);
});
test('existing approved key never bypasses independent switches, proofs or strong control',async()=>{
 for(const patch of [{OZ_ASSISTANT_ENABLED:'false'},{OZ_ASSISTANT_PAID_CALLS_ENABLED:'false'},{OZ_ASSISTANT_PRODUCTION_APPROVED:'false'},{OZ_ASSISTANT_PRODUCTION_SIGNING_SECRET:''},{OZ_ASSISTANT_OPENAI_API_KEY:'',OZ_ASSISTANT_PRODUCTION_OPENAI_API_KEY:'unapproved-fallback'}])assert.equal((await options(profile,{...env(profile),...patch})).settings.enabled,false);
 assert.throws(()=>approve({...profile,apiKeyVariable:'ARBITRARY_SECRET'}));
 const b=backend();assert.equal((await options(profile,env(profile),context,b)).settings.enabled,true);b.control.enabled=false;assert.equal((await options(profile,env(profile),context,b)).settings.enabled,false);b.control.enabled=true;b.control.profileSha256='stale';assert.equal((await options(profile,env(profile),context,b)).settings.enabled,false);b.blob.get=async()=>{throw Error('store outage');};assert.equal((await options(profile,env(profile),context,b)).settings.enabled,false);
});
test('explicit AI acknowledgement is required before session/message storage or model use',async()=>{
 const b=backend(),opts=await options(profile,env(profile),context,b);let calls=0;const h=createHandler({corpus,...opts,paid:{...opts.paid,fetchImpl:async()=>{calls++;throw Error('must not call');}}});
 for(const patch of [{},{aiUseAcknowledged:false},{op:'session',message:undefined,history:undefined,pagePath:undefined,sessionToken:undefined}]){const r=await h(request(patch),{ip:'192.0.2.4'});assert.equal(r.status,400);assert.equal((await r.json()).reason,'consent_required');}assert.equal(calls,0);assert.equal(b.ledger.data,null);
});
test('public metered call uses native store, exact fact IDs, monthly budget and no trial reset',async()=>{
 const b=backend(),opts=await options(profile,env(profile),context,b);let calls=0;
 const h=createHandler({corpus,...opts,paid:{...opts.paid,fetchImpl:async()=>{calls++;return new Response(JSON.stringify({status:'completed',model:'gpt-6-luna',usage:{input_tokens:1000,output_tokens:80,input_tokens_details:{cached_tokens:0,cache_write_tokens:0},output_tokens_details:{reasoning_tokens:0}},output:[{content:[{type:'output_text',text:JSON.stringify({status:'answered',reason:'supported',factIds:retrieve(buildIndex(corpus),'Avala Blackbutt').facts.slice(0,6).map(f=>f.id)})}]}]}));}}});
 const r=await h(request({aiUseAcknowledged:true}),{ip:'192.0.2.4'}),body=await r.json();assert.equal(r.status,200);assert.equal(body.mode,'production');assert.match(JSON.stringify(body),/6.5mm/);assert.equal(calls,1);assert.equal(b.ledger.data.counters['be:internal-evaluation'],undefined);assert.equal(opts.policy.limits.evaluationCalls,undefined);assert.equal(Object.values(b.ledger.data.counters).some(c=>c.value===140000),true);
});
test('a production budget failure prevents provider fetch; deterministic confirmation stays zero-token',async()=>{
 const b=backend(),opts=await options(profile,env(profile),context,b);let calls=0;const paid={...opts.paid,fetchImpl:async()=>{calls++;throw Error('must not call');}};
 const tight={...opts.policy,limits:{...opts.policy.limits,dayBudgetUsd:.001}};assert.equal((await createHandler({corpus,...opts,policy:tight,paid})(request({aiUseAcknowledged:true}),{ip:'192.0.2.4'})).status,503);assert.equal(calls,0);
 const response=await createHandler({corpus,...opts,paid})(request({aiUseAcknowledged:true,message:'Do you have stock?'}),{ip:'192.0.2.4'});assert.equal(response.status,200);assert.equal((await response.json()).reason,'confirmation');assert.equal(calls,0);
});
