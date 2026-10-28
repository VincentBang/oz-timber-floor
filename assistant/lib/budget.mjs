// Adapter contract: reserve/settle must be single durable atomic transactions.
// This mock is TEST/LOOPBACK ONLY, never proof of distributed enforcement.
export class MockAtomicStore {
  constructor(shared={counters:new Map(),reservations:new Map()}){this.shared=shared;this.mockOnly=true;}
  async reserve({key,bodyHash,session,ip,limits,reservedUsd=0,now=Date.now()}){
    const s=this.shared,day=new Date(now).toISOString().slice(0,10),month=day.slice(0,7),minute=Math.floor(now/60000);
    for(const [id,r]of s.reservations)if(r.expires<=now)s.reservations.delete(id);
    for(const [id,r]of s.counters)if(r.expires<=now)s.counters.delete(id);
    if(s.reservations.has(key))throw Error(s.reservations.get(key).bodyHash===bodyHash?'duplicate':'idempotency_conflict');
    const entries=[['sm:'+session+minute,limits.sessionMinute,60000],['sd:'+session+day,limits.sessionDay,86400000],['im:'+ip+minute,limits.ipMinute,60000],['id:'+ip+day,limits.ipDay,86400000],['gd:'+day,limits.globalDayCalls,86400000],['gm:'+month,limits.globalMonthCalls,2678400000]];
    if(entries.some(([k,max])=>(s.counters.get(k)?.value||0)>=max))throw Error('rate_limit');
    const active=[...s.reservations.values()].filter(r=>r.pending&&r.slotExpires>now);
    if(active.length>=limits.globalConcurrent||active.filter(r=>r.session===session).length>=limits.sessionConcurrent)throw Error('busy');
    for(const [k,max]of [['bd:'+day,limits.dayBudgetUsd],['bm:'+month,limits.monthBudgetUsd]])if((s.counters.get(k)?.value||0)+reservedUsd>max)throw Error('budget_exhausted');
    for(const [k,,ttl]of entries)s.counters.set(k,{value:(s.counters.get(k)?.value||0)+1,expires:now+ttl});
    const spendKeys=['bd:'+day,'bm:'+month];for(const k of spendKeys)s.counters.set(k,{value:(s.counters.get(k)?.value||0)+reservedUsd,expires:now+2678400000});
    s.reservations.set(key,{bodyHash,session,reservedUsd,spendKeys,pending:true,slotExpires:now+20000,expires:now+900000});return key;
  }
  async settle(key,actualUsd){const r=this.shared.reservations.get(key);if(!r||!r.pending)return;if(Number.isFinite(actualUsd)&&actualUsd>=0&&actualUsd<=r.reservedUsd)for(const k of r.spendKeys)this.shared.counters.get(k).value-=r.reservedUsd-actualUsd;r.pending=false;}
}
export function reservationCost(rate,inputTokens=20000,outputTokens=800){
  if(!rate||!Number.isFinite(rate.inputUsdPerMillion)||!Number.isFinite(rate.outputUsdPerMillion)||rate.inputUsdPerMillion<0||rate.outputUsdPerMillion<0||!rate.verifiedAt||!rate.modelId)throw Error('rates_unavailable');
  // Reserve the worst documented cache-write input rate even though the Luna
  // request disables caching. Unexpected usage retains this full reservation.
  const inputRate=arguments.length===1?Math.max(rate.inputUsdPerMillion,rate.cacheWrite30mUsdPerMillion||0,rate.cacheWrite12hUsdPerMillion||0):rate.inputUsdPerMillion;
  return (inputTokens*inputRate+outputTokens*rate.outputUsdPerMillion)/1000000;
}
