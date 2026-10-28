// Owner-authorised, expiring, team-authenticated candidate test only.
// Never imported by the normal production function.
import assert from 'node:assert/strict';
import {getStore} from '@netlify/blobs';
import {atomicBlobFetch} from './blob-transport.mjs';
import {AtomicBlobBudgetStore} from './atomic-budget.mjs';
import {approvedPreviewPolicy} from './runtime.mjs';
import {createHandler} from './handler.mjs';
import {hash} from './security.mjs';
export function candidateEvaluation({corpus,policy,profile,origin,deadline,runId}){
 assert.equal(hash(corpus.documents),corpus.corpusVersion);
 assert.equal(profile.boundCorpusVersion,corpus.corpusVersion);
 assert.equal(profile.evaluation.maxCalls,15);assert.equal(profile.evaluation.maxUsd,1);
 assert(/^candidate-[a-f0-9]{16}$/.test(runId));
 return async(request,context)=>{
  const reply=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json','Cache-Control':'no-store','X-Robots-Tag':'noindex, nofollow'}});
  if(Date.now()>deadline||context.site?.id!=='fd68e39e-7863-4012-8a97-40bec59b23d9'||context.site?.name!=='oztimberfloor'||context.deploy?.published!==false||!['dev','deploy-preview'].includes(context.deploy?.context)||typeof context.user?.id!=='string'||new URL(request.url).origin!==origin||request.headers.get('origin')!==origin||request.method!=='POST')return reply({status:'REFUSED'},403);
  try{
   const raw=await request.clone().text();if(raw.length>12288)return reply({status:'REFUSED'},400);
   const body=JSON.parse(raw),blob=getStore({name:'oz-assistant-paid-preview-budget-v1',region:'us-east-2',consistency:'strong',fetch:atomicBlobFetch()}),prefix='candidate-tests/'+runId+'/';
   const scoped=key=>({getWithMetadata:(_k,o)=>blob.getWithMetadata(prefix+key,o),setJSON:(_k,v,o)=>blob.setJSON(prefix+key,v,o)});
   const stateKey='state-v1',store=new AtomicBlobBudgetStore(scoped(stateKey));
   if(body.op==='preflight'){
    const key=process.env.OZ_ASSISTANT_OPENAI_API_KEY||'';if(!key.startsWith('sk-'))return reply({status:'FAIL',phase:'key_unavailable',paidCalls:0},503);
    const response=await fetch('https://api.openai.com/v1/models/gpt-6-luna',{headers:{Authorization:'Bearer '+key},signal:AbortSignal.timeout(15000)}),model=await response.json();
    if(!response.ok||model.id!=='gpt-6-luna')return reply({status:'FAIL',phase:'model_access',httpStatus:response.status,paidCalls:0},503);
    // Isolated synthetic keys exercise native CAS and cap enforcement, not live balances.
    const nonce=crypto.randomUUID(),cas=prefix+'proof/'+nonce;
    assert.equal((await blob.setJSON(cas,{n:1},{onlyIfNew:true})).modified,true);
    const previous=await blob.getWithMetadata(cas,{type:'json',consistency:'strong'});
    const writes=await Promise.all([2,3].map(n=>blob.setJSON(cas,{n},{onlyIfMatch:previous.etag})));
    assert.equal(writes.filter(r=>r.modified).length,1);
    const limits={...policy.limits,evaluationCalls:2,evaluationBudgetUsd:.02,dayBudgetUsd:.02,monthBudgetUsd:.02};
    const sample=i=>({key:'case-'+i,bodyHash:hash('public-synthetic'),session:'session-'+i,ip:hash('synthetic-ip'),limits,reservedUsd:.01,now:Date.now()});
    const testStore=()=>new AtomicBlobBudgetStore(scoped('proof-state/'+nonce));
    const race=await Promise.allSettled([0,1,2,3].map(i=>testStore().reserve(sample(i))));assert.equal(race.filter(r=>r.status==='fulfilled').length,2);
    const proofState=await blob.get(prefix+'proof-state/'+nonce,{type:'json',consistency:'strong'});assert.equal(proofState.counters['ge:internal-evaluation'].value,2);assert.equal(proofState.counters['be:internal-evaluation'].value,20000000);
    const receipt={status:'PASS',model:'gpt-6-luna',corpusVersion:corpus.corpusVersion,profileHash:hash(profile),checks:['model_access','native_CAS_single_winner','concurrent_call_and_dollar_caps'],at:new Date().toISOString(),paidCalls:0};
    await blob.setJSON(prefix+'proof',receipt);return reply(receipt);
   }
   if(body.op==='budget'){
    const state=await blob.get(prefix+stateKey,{type:'json',consistency:'strong'}),c=state?.counters||{};
    return reply({status:'PASS',calls:c['ge:internal-evaluation']?.value||0,reservedUsd:(c['be:internal-evaluation']?.value||0)/1e9,maxCalls:15,maxUsd:1,deadline,corpusVersion:corpus.corpusVersion});
   }
   const proof=await blob.get(prefix+'proof',{type:'json',consistency:'strong'});
   if(proof?.status!=='PASS'||proof.corpusVersion!==corpus.corpusVersion||proof.profileHash!==hash(profile))return reply({status:'REFUSED',reason:'preflight_required'},503);
   const paidPolicy=approvedPreviewPolicy(profile,policy,corpus,{OZ_ASSISTANT_PAID_CONFIG_HASH:hash(profile)}),secret=process.env.OZ_ASSISTANT_SIGNING_SECRET||'';
   if(secret.length<32)return reply({status:'FAIL',phase:'signing_secret_unavailable'},503);
   let metadata;
   const handler=createHandler({corpus,policy:paidPolicy,store,settings:{enabled:true,context:'deploy-preview',mode:'preview',previewApproved:true,paidPreviewApproved:true,paidCallsEnabled:true,allowedOrigin:origin,signingSecret:secret},paid:{key:process.env.OZ_ASSISTANT_OPENAI_API_KEY||'',model:'gpt-6-luna'},metadata:m=>{metadata=m;}});
   const response=await handler(request,{ip:context.ip});
   if(metadata)for(const [k,v]of Object.entries({model:metadata.modelVersion,input:metadata.inputTokens,output:metadata.outputTokens,cost:metadata.estimatedCostUsd}))response.headers.set('X-Oz-Evaluation-'+k,String(v));
   return response;
  }catch{return reply({status:'FAIL',reason:'candidate_test_failed_closed'},503);}
 };
}
