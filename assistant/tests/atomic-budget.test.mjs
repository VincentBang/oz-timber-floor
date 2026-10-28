import test from 'node:test';
import assert from 'node:assert/strict';
import {AtomicBlobBudgetStore} from '../lib/atomic-budget.mjs';
import {hash} from '../lib/security.mjs';
import policy from '../config/policy.json' with {type:'json'};
import {ConditionalBlobFixture} from './fixtures/conditional-blob.mjs';
const input=(patch={})=>({key:'request-a',bodyHash:hash('body'),session:'session-a',ip:hash('not-a-real-ip'),limits:{...policy.limits,dayBudgetUsd:1,monthBudgetUsd:1},reservedUsd:.6,now:100000,...patch});

test('independent CAS instances cannot overspend; settlement is idempotent',async()=>{
 const backend=new ConditionalBlobFixture(),a=new AtomicBlobBudgetStore(backend),b=new AtomicBlobBudgetStore(backend);
 const results=await Promise.allSettled([a.reserve(input()),b.reserve(input({key:'request-b'}))]);assert.equal(results.filter(r=>r.status==='fulfilled').length,1);assert.match(results.find(r=>r.status==='rejected').reason.message,/budget_exhausted/);
 const winner=results[0].status==='fulfilled'?'request-a':'request-b';await a.settle(winner,.2);await a.settle(winner,.1);
 await b.reserve(input({key:'next'}));assert.equal(backend.data.counters['bd:1970-01-01'].value,800000000);
 assert(backend.writes.some(w=>w.onlyIfNew));assert(backend.writes.some(w=>w.onlyIfMatch));assert(backend.writes.every(w=>w.onlyIfNew===true||typeof w.onlyIfMatch==='string'));
});
test('duplicates and changed-body replays do not reserve another call',async()=>{
 const backend=new ConditionalBlobFixture(),a=new AtomicBlobBudgetStore(backend),b=new AtomicBlobBudgetStore(backend);await a.reserve(input());
 await assert.rejects(b.reserve(input()),/duplicate/);await assert.rejects(b.reserve(input({bodyHash:hash('other')})),/idempotency_conflict/);assert.equal(backend.data.counters['gd:1970-01-01'].value,1);
});
test('rate, concurrency and evaluation ceilings survive new store instances',async()=>{
 const backend=new ConditionalBlobFixture(),limits={...policy.limits,evaluationCalls:2,evaluationBudgetUsd:1};
 const first=new AtomicBlobBudgetStore(backend);await first.reserve(input({limits,reservedUsd:.1}));await first.settle('request-a',.01);
 const next=new AtomicBlobBudgetStore(backend);await next.reserve(input({key:'b',limits,reservedUsd:.1}));await next.settle('b',.01);
 await assert.rejects(new AtomicBlobBudgetStore(backend).reserve(input({key:'c',limits,reservedUsd:.1})),/budget_exhausted/);
 const rates=new AtomicBlobBudgetStore(new ConditionalBlobFixture());for(let i=0;i<6;i++){await rates.reserve(input({key:'rate-'+i,reservedUsd:0}));await rates.settle('rate-'+i,0);}await assert.rejects(rates.reserve(input({key:'seventh',reservedUsd:0})),/rate_limit/);
 const slots=new AtomicBlobBudgetStore(new ConditionalBlobFixture());await slots.reserve(input({key:'one',reservedUsd:0}));await slots.reserve(input({key:'two',reservedUsd:0}));await assert.rejects(slots.reserve(input({key:'three',reservedUsd:0})),/busy/);
});
test('crashed reservations keep money charged after slot recovery',async()=>{
 const backend=new ConditionalBlobFixture(),store=new AtomicBlobBudgetStore(backend);await store.reserve(input());
 await assert.rejects(new AtomicBlobBudgetStore(backend).reserve(input({key:'after-crash',now:121000})),/budget_exhausted/);assert.equal(backend.data.counters['bd:1970-01-01'].value,600000000);
 await assert.rejects(store.settle('request-a',.7),/budget_store_unavailable/);assert.equal(backend.data.counters['bd:1970-01-01'].value,600000000);
});
test('calendar rollover never refunds old spending into a new month',async()=>{
 const backend=new ConditionalBlobFixture(),store=new AtomicBlobBudgetStore(backend),before=Date.UTC(2026,9,31,23,59,59);
 await store.reserve(input({now:before}));await store.reserve(input({key:'new-month',now:before+2000,session:'new-session'}));await store.settle('request-a',.2);
 assert.equal(backend.data.counters['bm:2026-10'].value,200000000);assert.equal(backend.data.counters['bm:2026-11'].value,600000000);
});
test('outage, corrupt state, ignored conditional response and contention fail closed',async()=>{
 for(const backend of [{getWithMetadata(){throw Error('secret private provider details');},setJSON(){}},{getWithMetadata:async()=>({etag:'a',data:{version:2}}),setJSON(){}},{getWithMetadata:async()=>null,setJSON:async()=>({})},{getWithMetadata:async()=>null,setJSON:async()=>({modified:false})}])await assert.rejects(new AtomicBlobBudgetStore(backend).reserve(input()),{message:'budget_store_unavailable'});
});
test('stored data excludes raw session, IP, token and question',async()=>{
 const backend=new ConditionalBlobFixture(),store=new AtomicBlobBudgetStore(backend);await store.reserve(input());const raw=JSON.stringify(backend.data);assert(!raw.includes('session-a'));assert(!raw.includes('not-a-real-ip'));assert(!raw.includes('request-a'));assert(!raw.includes('sessionToken'));assert(!raw.includes('visitorQuestion'));
});
