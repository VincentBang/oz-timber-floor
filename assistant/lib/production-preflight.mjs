// Protected non-production component verification only. Never import from the
// public entry. No OpenAI calls, credentials, state-v1 or control-v1 writes.
import assert from 'node:assert/strict';
import {getStore} from '@netlify/blobs';
import {AtomicBlobBudgetStore} from './atomic-budget.mjs';
import {atomicBlobFetch} from './blob-transport.mjs';
import {deploymentSettings} from './deployment.mjs';
import {productionControlEnabled,PRODUCTION_STORE,PRODUCTION_REGION} from './production.mjs';
import {hash} from './security.mjs';
import profile from '../config/production.json' with {type:'json'};
import policy from '../config/policy.json' with {type:'json'};
export function productionPreflight(runId){
 assert.match(runId,/^oz-prod-check-[a-f0-9]{12}$/);
 return async(request,context)=>{
  const reply=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json','Cache-Control':'no-store','X-Robots-Tag':'noindex, nofollow'}});
  const settings=deploymentSettings(process.env,context,request.url);
  if(!settings.enabled||settings.context!=='deploy-preview'||!settings.previewApproved||settings.mode!=='mock'||!context.user?.id||request.method!=='POST'||request.headers.get('origin')!==settings.allowedOrigin||new URL(request.url).origin!==settings.allowedOrigin||process.env.OZ_ASSISTANT_PAID_CALLS_ENABLED!=='false')return reply({status:'REFUSED'},403);
  let phase='request';
  try{
   const raw=await request.text();assert(raw.length<500);const body=JSON.parse(raw);assert.deepEqual(Object.keys(body),['op']);assert(['suite','receipt','status'].includes(body.op));
   assert.equal(profile.activationApproved,false);assert.equal(profile.ownerApprovals.launch,false);assert.equal(profile.allowance.monthBudgetUsd,30);assert.equal(profile.allowance.dayBudgetUsd,1);
   const blob=getStore({name:PRODUCTION_STORE,region:PRODUCTION_REGION,consistency:'strong',fetch:atomicBlobFetch(fetch,{timeoutMs:6000})});
   const preview=getStore({name:'oz-assistant-paid-preview-budget-v1',region:PRODUCTION_REGION,consistency:'strong',fetch:atomicBlobFetch(fetch,{timeoutMs:6000})});
   const snapshot=async()=>({productionState:await blob.get('state-v1',{type:'json',consistency:'strong'}),productionControl:await blob.get('control-v1',{type:'json',consistency:'strong'}),previewState:await preview.get('state-v1',{type:'json',consistency:'strong'})});
   const before=await snapshot();assert.notEqual(before.productionControl?.enabled,true,'Public control unexpectedly enabled');
   const describe=s=>({productionStateHash:hash(s.productionState),productionControlHash:hash(s.productionControl),productionControlEnabled:s.productionControl?.enabled===true,previewLedgerHash:hash(s.previewState),previewCalls:s.previewState?.counters?.['ge:internal-evaluation']?.value||0,previewEstimatedUsd:(s.previewState?.counters?.['be:internal-evaluation']?.value||0)/1e9});
   const prefix='verification/'+runId+'/';
   if(body.op==='status')return reply({status:'PASS',generationCalls:0,productionProfileHash:hash(profile),snapshot:describe(before),configured:{dayUsd:profile.allowance.dayBudgetUsd,monthUsd:profile.allowance.monthBudgetUsd},modelAccess:'NOT_RUN',publishedRuntime:'NOT_RUN'});
   if(body.op==='receipt'){
    phase='cross_invocation';const saved=await blob.get(prefix+'receipt',{type:'json',consistency:'strong'});assert.equal(saved?.status,'PASS');assert.equal(saved.runId,runId);assert.deepEqual(describe(before),saved.after);
    return reply({status:'PASS',phase,runId,saved,generationCalls:0});
   }
   phase='cas';const checks=[],nonce=crypto.randomUUID(),key=prefix+nonce+'/cas';
   assert.equal((await blob.setJSON(key,{n:1},{onlyIfNew:true})).modified,true);
   assert.equal((await blob.setJSON(key,{n:9},{onlyIfNew:true})).modified,false);
   const old=await blob.getWithMetadata(key,{type:'json',consistency:'strong'});assert.equal(old.data.n,1);assert(old.etag);
   const race=await Promise.all([2,3].map(n=>blob.setJSON(key,{n},{onlyIfMatch:old.etag})));assert.equal(race.filter(r=>r.modified).length,1);
   assert.equal((await blob.setJSON(key,{n:99},{onlyIfMatch:old.etag})).modified,false);checks.push('native_strong_read_CAS_race_and_stale_write');
   const fixture=name=>{const key=prefix+nonce+'/'+name;return {store:()=>new AtomicBlobBudgetStore({getWithMetadata:(_k,o)=>blob.getWithMetadata(key,o),setJSON:(_k,v,o)=>blob.setJSON(key,v,o)}),read:()=>blob.get(key,{type:'json',consistency:'strong'})};};
   const limits={...policy.limits,...profile.allowance,dayBudgetUsd:.02,monthBudgetUsd:.02};
   const input=(patch={})=>({key:'synthetic-a',bodyHash:hash('synthetic-public-test'),session:'synthetic-session',ip:hash('synthetic-ip'),limits,reservedUsd:.01,now:Date.UTC(2026,9,27,1),...patch});
   phase='contention';const contention=fixture('contention'),attempts=await Promise.allSettled(Array.from({length:8},(_,i)=>contention.store().reserve(input({key:'race-'+i,session:'session-'+i}))));
   assert.equal(attempts.filter(r=>r.status==='fulfilled').length,2);assert(attempts.filter(r=>r.status==='rejected').every(r=>['budget_exhausted','budget_store_unavailable'].includes(r.reason.message)));checks.push('atomic_shared_monthly_budget_cannot_double_reserve');
   phase='idempotency';const replay=fixture('replay');await replay.store().reserve(input());await assert.rejects(replay.store().reserve(input()),{message:'duplicate'});await assert.rejects(replay.store().reserve(input({bodyHash:hash('changed')})),{message:'idempotency_conflict'});await replay.store().settle('synthetic-a',.002);await replay.store().settle('synthetic-a',.001);checks.push('replay_rejected_and_usage_settlement_idempotent');
   phase='crash';const crash=fixture('crash');await crash.store().reserve(input({limits:{...limits,monthBudgetUsd:.01}}));await assert.rejects(crash.store().reserve(input({limits:{...limits,monthBudgetUsd:.01},key:'after-crash',now:input().now+21000})),{message:'budget_exhausted'});checks.push('crash_reservation_retained_after_slot_expiry');
   phase='daily_monthly';const boundaries=fixture('boundaries'),start=Date.UTC(2026,9,27,1),l={...limits,dayBudgetUsd:1,monthBudgetUsd:30};
   await boundaries.store().reserve(input({limits:l,reservedUsd:.75,now:start}));await boundaries.store().settle('synthetic-a',.75);await assert.rejects(boundaries.store().reserve(input({limits:l,reservedUsd:.5,key:'over-day',now:start+1000})),{message:'budget_exhausted'});
   const monthly=fixture('monthly');await monthly.store().reserve(input({limits:{...l,dayBudgetUsd:30},reservedUsd:29.75,now:start}));await monthly.store().settle('synthetic-a',29.75);await assert.rejects(monthly.store().reserve(input({limits:l,reservedUsd:.5,key:'next-day-over-month',now:start+86400000})),{message:'budget_exhausted'});checks.push('approved_one_dollar_day_and_thirty_dollar_month_boundaries');
   phase='control';const controlKey=prefix+nonce+'/control',control={get:(_key,o)=>blob.get(controlKey,o)},profileHash=hash(profile);
   assert.equal(await productionControlEnabled(control,profileHash),false);
   await blob.setJSON(controlKey,{enabled:true,profileSha256:profileHash});assert.equal(await productionControlEnabled(control,profileHash),true);assert.equal(await productionControlEnabled(control,'mismatch'),false);
   await blob.setJSON(controlKey,{enabled:false,profileSha256:profileHash});assert.equal(await productionControlEnabled(control,profileHash),false);checks.push('strong_control_enable_mismatch_disable_on_isolated_key');
   assert.equal(await productionControlEnabled(blob,profileHash),false);checks.push('actual_public_control_remains_closed');
   const after=await snapshot();assert.deepEqual(after,before);checks.push('actual_production_state_control_and_private_lifetime_ledger_unchanged');
   const receipt={status:'PASS',scope:'Native production-store COMPONENT preflight only; NOT public runtime or production-key proof',runId,profileHash,checks,before:describe(before),after:describe(after),generationCalls:0,modelAccess:'NOT_RUN',publishedRuntime:'NOT_RUN',at:new Date().toISOString()};await blob.setJSON(prefix+'receipt',receipt);return reply(receipt);
  }catch{return reply({status:'FAIL',phase,generationCalls:0},503);}
 };
}
