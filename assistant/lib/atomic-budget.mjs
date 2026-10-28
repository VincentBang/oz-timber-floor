import {hash,isObject} from './security.mjs';

const MONEY_SCALE=1_000_000_000;
const units=value=>{if(!Number.isFinite(value)||value<0)throw Error('budget_store_unavailable');const n=Math.ceil(value*MONEY_SCALE);if(!Number.isSafeInteger(n))throw Error('budget_store_unavailable');return n;};
const emptyState=()=>({version:1,counters:{},reservations:{}});
const validNumber=n=>Number.isSafeInteger(n)&&n>=0;
function validate(state){
 if(!isObject(state)||state.version!==1||!isObject(state.counters)||!isObject(state.reservations))throw Error('budget_store_unavailable');
 for(const value of Object.values(state.counters))if(!isObject(value)||!validNumber(value.value)||!validNumber(value.expires))throw Error('budget_store_unavailable');
 for(const r of Object.values(state.reservations))if(!isObject(r)||!validNumber(r.reserved)||!validNumber(r.expires)||!validNumber(r.slotExpires)||typeof r.pending!=='boolean'||!/^[a-f0-9]{64}$/.test(r.bodyHash)||!/^[a-f0-9]{64}$/.test(r.session)||!Array.isArray(r.spendKeys)||![2,3].includes(r.spendKeys.length)||!r.spendKeys.every(k=>/^b[dm]:\d{4}-\d{2}(?:-\d{2})?$/.test(k)||k==='be:internal-evaluation'))throw Error('budget_store_unavailable');
 return state;
}

// A single strong-read + ETag compare-and-swap covers ALL quotas and money.
// Never split counters across independently written blobs or use a deploy store:
// previews/redeploys must share the same durable allowance, not reset it.
export class AtomicBlobBudgetStore {
 constructor(blob,{key='state-v1',attempts=8}={}){
  if(!blob||typeof blob.getWithMetadata!=='function'||typeof blob.setJSON!=='function'||key!=='state-v1'||!Number.isInteger(attempts)||attempts<1||attempts>16)throw Error('budget_store_unavailable');
  this.blob=blob;this.key=key;this.attempts=attempts;this.mockOnly=false;this.durable=true;this.adapter='netlify-blobs-strong-cas-v1';
 }
 async transaction(change){
  try{
   for(let attempt=0;attempt<this.attempts;attempt++){
    const entry=await this.blob.getWithMetadata(this.key,{type:'json',consistency:'strong'});
    if(entry&&(!entry.etag||!entry.data))throw Error('budget_store_unavailable');
    const state=validate(entry?structuredClone(entry.data):emptyState());
    const result=change(state);
    if(Buffer.byteLength(JSON.stringify(state))>1_000_000)throw Error('budget_store_unavailable');
    const options=entry?{onlyIfMatch:entry.etag}:{onlyIfNew:true};
    const written=await this.blob.setJSON(this.key,state,options);
    if(written?.modified===true&&typeof written.etag==='string')return result;
    if(written?.modified!==false)throw Error('budget_store_unavailable');
   }
  }catch(error){
   if(['duplicate','idempotency_conflict','rate_limit','busy','budget_exhausted'].includes(error.message))throw error;
   // Do not expose provider errors, credentials, ETags or private counter data.
   throw Error('budget_store_unavailable');
  }
  throw Error('budget_store_unavailable');
 }
 async reserve({key,bodyHash,session,ip,limits,reservedUsd=0,now=Date.now()}){
  if(typeof key!=='string'||key.length>256||typeof session!=='string'||session.length>256||!/^[a-f0-9]{64}$/.test(bodyHash)||!/^[a-f0-9]{64}$/.test(ip)||!validNumber(now))throw Error('budget_store_unavailable');
  for(const name of ['sessionMinute','sessionDay','ipMinute','ipDay','globalDayCalls','globalMonthCalls','globalConcurrent','sessionConcurrent'])if(!Number.isInteger(limits?.[name])||limits[name]<1)throw Error('budget_store_unavailable');
  const reserved=units(reservedUsd),dayCap=units(limits.dayBudgetUsd),monthCap=units(limits.monthBudgetUsd),id=hash(key),sessionId=hash(session),date=new Date(now),day=date.toISOString().slice(0,10),month=day.slice(0,7),minute=Math.floor(now/60000);
  const evaluation=limits.evaluationCalls!==undefined||limits.evaluationBudgetUsd!==undefined;
  if(evaluation&&(!Number.isInteger(limits.evaluationCalls)||limits.evaluationCalls<1))throw Error('budget_store_unavailable');
  const evaluationCap=evaluation?units(limits.evaluationBudgetUsd):null;
  const dayEnd=Date.UTC(date.getUTCFullYear(),date.getUTCMonth(),date.getUTCDate()+1),monthEnd=Date.UTC(date.getUTCFullYear(),date.getUTCMonth()+1,1);
  const entries=[['sm:'+sessionId+':'+minute,limits.sessionMinute,(minute+1)*60000],['sd:'+sessionId+':'+day,limits.sessionDay,dayEnd],['im:'+ip+':'+minute,limits.ipMinute,(minute+1)*60000],['id:'+ip+':'+day,limits.ipDay,dayEnd],['gd:'+day,limits.globalDayCalls,dayEnd],['gm:'+month,limits.globalMonthCalls,monthEnd]];
  return this.transaction(state=>{
   // Logical expiry is enforced inside the atomic transaction. Netlify does not
   // supply physical TTL deletion: expired pseudonymous records are pruned on
   // the next transaction. No transcripts, contacts, raw IPs or tokens stored.
   for(const [k,v]of Object.entries(state.counters))if(v.expires<=now)delete state.counters[k];
   for(const [k,v]of Object.entries(state.reservations))if(v.expires<=now)delete state.reservations[k];
   const existing=state.reservations[id];if(existing)throw Error(existing.bodyHash===bodyHash?'duplicate':'idempotency_conflict');
   if(entries.some(([k,max])=>(state.counters[k]?.value||0)>=max))throw Error('rate_limit');
   if(evaluation&&reserved>0&&(state.counters['ge:internal-evaluation']?.value||0)>=limits.evaluationCalls)throw Error('budget_exhausted');
   const active=Object.values(state.reservations).filter(r=>r.pending&&r.slotExpires>now);
   if(active.length>=limits.globalConcurrent||active.filter(r=>r.session===sessionId).length>=limits.sessionConcurrent)throw Error('busy');
   const spendKeys=['bd:'+day,'bm:'+month,...(evaluation?['be:internal-evaluation']:[])];
   for(const [k,max]of [[spendKeys[0],dayCap],[spendKeys[1],monthCap],...(evaluation?[[spendKeys[2],evaluationCap]]:[])])if((state.counters[k]?.value||0)+reserved>max)throw Error('budget_exhausted');
   for(const [k,,expires]of entries)state.counters[k]={value:(state.counters[k]?.value||0)+1,expires};
   if(evaluation&&reserved>0)state.counters['ge:internal-evaluation']={value:(state.counters['ge:internal-evaluation']?.value||0)+1,expires:Number.MAX_SAFE_INTEGER};
   for(const [i,k]of spendKeys.entries())state.counters[k]={value:(state.counters[k]?.value||0)+reserved,expires:i===0?dayEnd+900000:i===1?monthEnd+900000:Number.MAX_SAFE_INTEGER};
   state.reservations[id]={bodyHash,session:sessionId,reserved,spendKeys,pending:true,slotExpires:now+20000,expires:now+900000};
   return key;
  });
 }
 async settle(key,actualUsd){
  const actual=units(actualUsd),id=hash(key);
  return this.transaction(state=>{
   const r=state.reservations[id];if(!r||!r.pending)return;
   if(actual>r.reserved)throw Error('budget_store_unavailable');
   for(const k of r.spendKeys){const c=state.counters[k];if(!c||c.value<r.reserved-actual)throw Error('budget_store_unavailable');c.value-=r.reserved-actual;}
   r.pending=false;
  });
 }
}
