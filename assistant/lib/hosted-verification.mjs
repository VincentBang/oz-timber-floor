// Temporary protected-draft verifier. Not imported by the normal function.
// No model generation, arbitrary network target, administrative credential,
// transcript storage or modification of the live state-v1 ledger is allowed.
import assert from 'node:assert/strict';
import {getStore} from '@netlify/blobs';
import {AtomicBlobBudgetStore} from './atomic-budget.mjs';
import {deploymentSettings} from './deployment.mjs';
import {hash} from './security.mjs';
import policy from '../config/policy.json' with {type:'json'};
import {atomicBlobFetch} from './blob-transport.mjs';

export function verificationHandler(runId,model='gpt-4.1-mini-2025-04-14'){
 if(!/^oz-gpt-verify-[a-f0-9]{12}$/.test(runId))throw Error('invalid_verification_id');
 if(!['gpt-4.1-mini-2025-04-14','gpt-6-luna'].includes(model))throw Error('invalid_verification_model');
 return async(request,context)=>{
  const reply=(value,status=200)=>new Response(JSON.stringify(value),{status,headers:{'Content-Type':'application/json','Cache-Control':'no-store','X-Robots-Tag':'noindex, nofollow'}});
  const settings=deploymentSettings(process.env,context,request.url);
  if(!settings.enabled||settings.context!=='deploy-preview'||!settings.previewApproved||request.method!=='POST'||new URL(request.url).origin!==settings.allowedOrigin||request.headers.get('origin')!==settings.allowedOrigin||process.env.OZ_ASSISTANT_PAID_CALLS_ENABLED==='true')return reply({status:'REFUSED',guards:{enabled:settings.enabled,context:settings.context,previewApproved:settings.previewApproved,requestOriginMatches:new URL(request.url).origin===settings.allowedOrigin,headerOriginMatches:request.headers.get('origin')===settings.allowedOrigin,paidCallsOff:process.env.OZ_ASSISTANT_PAID_CALLS_ENABLED!=='true',siteIdMatches:context.site?.id==='fd68e39e-7863-4012-8a97-40bec59b23d9',siteNameMatches:context.site?.name==='oztimberfloor',unpublished:context.deploy?.published===false,deployContext:context.deploy?.context||null,teamUserPresent:typeof context.user?.id==='string'}},403);
  let phase='request',diagnostic;const transport=[];
  try{
   const raw=await request.text();if(raw.length>1000)return reply({status:'REFUSED'},400);
   const {op}=JSON.parse(raw);
   if(op==='model'){
    phase='model_access';const key=process.env.OZ_ASSISTANT_OPENAI_API_KEY||'';
    if(!/^sk-/.test(key))return reply({status:'FAIL',phase,keyAvailable:false,generationCalls:0},503);
    const r=await fetch('https://api.openai.com/v1/models/'+model,{headers:{Authorization:'Bearer '+key},signal:AbortSignal.timeout(15000)});
    const body=await r.json();const ok=r.ok&&body.id===model;
    return reply({status:ok?'PASS':'FAIL',phase,model,httpStatus:r.status,keyAvailable:true,accessible:ok,shutdownDate:body.shutdown_date||null,errorCode:!ok&&/^[a-z_]+$/.test(body.error?.code||'')?body.error.code:null,generationCalls:0},ok?200:503);
   }
   const blob=getStore({name:'oz-assistant-paid-preview-budget-v1',region:'us-east-2',consistency:'strong',fetch:atomicBlobFetch(fetch,{timeoutMs:6000,onResponse:event=>{if(transport.length<80)transport.push(event);}})});
   const prefix='verification/'+runId+'/';
   if(op==='ledger'){
    const state=await blob.get('state-v1',{type:'json',consistency:'strong'}),c=state?.counters||{};
    return reply({status:'PASS',model,evaluationCalls:c['ge:internal-evaluation']?.value||0,evaluationReservedUsd:(c['be:internal-evaluation']?.value||0)/1e9,maxCalls:20,maxUsd:1,generationCalls:0,liveLedgerModified:false});
   }
   if(op==='receipt'){
    phase='cross_invocation_read';const saved=await blob.get(prefix+'receipt',{type:'json',consistency:'strong'});
    assert.equal(saved?.status,'PASS');assert.equal(saved.runId,runId);
    const productionState=await blob.get('state-v1',{type:'json',consistency:'strong'});
    return reply({status:'PASS',phase,runId,storedChecks:saved.checks,liveLedgerExists:productionState!==null,generationCalls:0});
   }
   if(op!=='suite')return reply({status:'REFUSED'},400);
   // Unique fixture keys never alias state-v1 and never reset the paid ledger.
   const nonce=crypto.randomUUID(),checks=[];
   const record=(name)=>checks.push(name);
   phase='native_cas';const casKey=prefix+nonce+'/cas';
   const first=await blob.setJSON(casKey,{n:1},{onlyIfNew:true});diagnostic={step:'create',modified:first.modified,hasEtag:!!first.etag};assert.equal(first.modified,true);
   const duplicate=await blob.setJSON(casKey,{n:9},{onlyIfNew:true});diagnostic={step:'duplicate_create',modified:duplicate.modified};assert.equal(duplicate.modified,false);
   const old=await blob.getWithMetadata(casKey,{type:'json',consistency:'strong'});diagnostic={step:'strong_read',value:old?.data?.n,hasEtag:!!old?.etag};assert.equal(old.data.n,1);assert(old.etag);
   const race=await Promise.all([2,3].map(n=>blob.setJSON(casKey,{n},{onlyIfMatch:old.etag})));
   diagnostic={step:'same_etag_race',successfulWrites:race.filter(v=>v.modified).length};assert.equal(race.filter(v=>v.modified).length,1);
   const stale=await blob.setJSON(casKey,{n:99},{onlyIfMatch:old.etag});diagnostic={step:'stale_etag',modified:stale.modified};assert.equal(stale.modified,false);record('native_create_and_stale_etag_race');
   const fixture=name=>{
    const key=prefix+nonce+'/'+name;
    const wrapped={getWithMetadata:(_k,o)=>blob.getWithMetadata(key,o),setJSON:(_k,v,o)=>blob.setJSON(key,v,o)};
    return {store:()=>new AtomicBlobBudgetStore(wrapped),read:()=>blob.get(key,{type:'json',consistency:'strong'})};
   };
   const limits={...policy.limits,evaluationCalls:2,evaluationBudgetUsd:.02,dayBudgetUsd:.02,monthBudgetUsd:.02};
   const input=(patch={})=>({key:'synthetic-a',bodyHash:hash('synthetic-public-test'),session:'synthetic-session',ip:hash('synthetic-ip'),limits,reservedUsd:.01,now:100000,...patch});
   phase='atomic_contention';const contention=fixture('contention');
   const attempts=await Promise.allSettled(Array.from({length:8},(_,i)=>contention.store().reserve(input({key:'race-'+i,session:'synthetic-'+i}))));
   const cs=await contention.read();diagnostic={fulfilled:attempts.filter(v=>v.status==='fulfilled').length,rejections:attempts.filter(v=>v.status==='rejected').map(v=>['budget_exhausted','budget_store_unavailable','busy','rate_limit'].includes(v.reason.message)?v.reason.message:'other'),evaluationNanodollars:cs?.counters?.['be:internal-evaluation']?.value??null,evaluationCalls:cs?.counters?.['ge:internal-evaluation']?.value??null};
   assert.equal(attempts.filter(v=>v.status==='fulfilled').length,2);
   assert.equal(cs.counters['be:internal-evaluation'].value,20000000);assert.equal(cs.counters['ge:internal-evaluation'].value,2);
   assert(attempts.filter(v=>v.status==='rejected').every(v=>['budget_exhausted','budget_store_unavailable'].includes(v.reason.message)));record('concurrent_reservations_cannot_overspend');
   phase='idempotency';const replay=fixture('replay');await replay.store().reserve(input());
   await assert.rejects(replay.store().reserve(input()),{message:'duplicate'});
   await assert.rejects(replay.store().reserve(input({bodyHash:hash('changed')})),{message:'idempotency_conflict'});
   await replay.store().settle('synthetic-a',.002);await replay.store().settle('synthetic-a',.001);
   assert.equal((await replay.read()).counters['be:internal-evaluation'].value,2000000);record('replay_and_idempotent_usage_settlement');
   phase='crash';const crash=fixture('crash'),one={...limits,evaluationBudgetUsd:.01};await crash.store().reserve(input({limits:one}));
   await assert.rejects(crash.store().reserve(input({limits:one,key:'after-crash',now:121000})),{message:'budget_exhausted'});
   await assert.rejects(crash.store().settle('synthetic-a',.02),{message:'budget_store_unavailable'});record('crash_retains_reservation_after_slot_expiry');
   phase='month_rollover';const rollover=fixture('rollover'),before=Date.UTC(2026,9,31,23,59,59);
   await rollover.store().reserve(input({now:before}));await rollover.store().settle('synthetic-a',.002);
   await rollover.store().reserve(input({key:'next-month',now:before+2000}));await rollover.store().settle('next-month',.002);
   await assert.rejects(rollover.store().reserve(input({key:'third',now:before+3000})),{message:'budget_exhausted'});record('evaluation_ceiling_survives_month_and_new_instances');
   phase='rate_and_concurrency';const rate=fixture('rate');const rl={...limits,sessionMinute:1};await rate.store().reserve(input({limits:rl,reservedUsd:0}));await rate.store().settle('synthetic-a',0);
   await assert.rejects(rate.store().reserve(input({limits:rl,key:'second',reservedUsd:0})),{message:'rate_limit'});
   const slots=fixture('slots'),sl={...limits,sessionConcurrent:1};await slots.store().reserve(input({limits:sl,reservedUsd:0}));
   await assert.rejects(slots.store().reserve(input({limits:sl,key:'second',reservedUsd:0})),{message:'busy'});record('rate_and_concurrency_fail_closed');
   phase='receipt';const saved={status:'PASS',runId,checks,at:new Date().toISOString(),generationCalls:0,namespace:'oz-assistant-paid-preview-budget-v1',region:'us-east-2',liveLedgerModified:false};
   await blob.setJSON(prefix+'receipt',saved);return reply(saved);
  }catch(error){const name=String(error?.name||'Error'),code=String(error?.code||'');return reply({status:'FAIL',phase,diagnostic,transport,errorClass:/^[A-Za-z]+$/.test(name)?name:'Error',errorCode:/^[A-Z_]+$/.test(code)?code:null,httpError:String(error?.message).match(/\b(400|401|403|404|409|412|429|500|502|503|504)\b/)?.[1]||null,generationCalls:0},503);}
 };
}
