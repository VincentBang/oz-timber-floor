import test from 'node:test';
import assert from 'node:assert/strict';
import {atomicBlobFetch} from '../lib/blob-transport.mjs';
test('real409 CAS conflict becomes412, never SDK modified=true',async()=>{
 const events=[],wrapped=atomicBlobFetch(async()=>new Response('conflict',{status:409}),{onResponse:e=>events.push(e)});
 const r=await wrapped('https://synthetic.invalid',{method:'PUT',headers:{'if-match':'synthetic-version'}});
 assert.equal(r.status,412);assert.equal(events[0].status,409);
 // Exact11.1.6 SDK interpretation: only412 is modified:false.
 assert.equal(r.status===412?false:true,false);
});
test('conditional create conflict is not counted as a successful reservation',async()=>{
 const wrapped=atomicBlobFetch(async()=>new Response(null,{status:409}));
 assert.equal((await wrapped('https://synthetic.invalid',{method:'PUT',headers:{'if-none-match':'*'}})).status,412);
});
test('unexpected write failures throw instead of the SDK false-success path',async()=>{
 for(const status of [400,401,403,404,429,500,502,503])await assert.rejects(atomicBlobFetch(async()=>new Response(null,{status}))('https://synthetic.invalid',{method:'PUT',headers:{'if-match':'synthetic-version'}}),{message:'budget_store_unavailable'});
 await assert.rejects(atomicBlobFetch(async()=>new Response(null,{status:409}))('https://synthetic.invalid',{method:'PUT'}),{message:'budget_store_unavailable'});
});
test('successful responses, stale412 and absent-ledger404 retain their meaning',async()=>{
 for(const [method,status,headers]of [['PUT',200,{'if-match':'synthetic-version'}],['PUT',412,{'if-match':'synthetic-version'}],['GET',404,{}],['HEAD',404,{}]]){
  assert.equal((await atomicBlobFetch(async()=>new Response(null,{status}))('https://synthetic.invalid',{method,headers})).status,status);
 }
});
