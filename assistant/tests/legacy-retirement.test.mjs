import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import corpus from '../generated/corpus.json' with {type:'json'};
import policy from '../config/policy.json' with {type:'json'};
import {reviewedOakBeigeRetirement,OAK_BEIGE_ROUTE} from '../lib/legacy-retirement.mjs';
import {policyAnswer} from '../lib/answers.mjs';
import {createHandler} from '../lib/handler.mjs';
import {issueToken} from '../lib/security.mjs';
const root=new URL('../../',import.meta.url),read=f=>JSON.parse(fs.readFileSync(new URL(f,root)));
const control=read('data/catalogue-quality-overrides.json').pages[OAK_BEIGE_ROUTE];
const product=read('data/product-catalogue.json').products.find(p=>p.id==='stone-floor-oak-beige');
const retirement=reviewedOakBeigeRetirement({control,product});
const candidate={...corpus,retirements:[...(corpus.retirements||[]).filter(r=>r.path!==OAK_BEIGE_ROUTE),retirement]};
test('Oak Beige retirement requires the preserved exact owner record and product identity',()=>{
 assert.throws(()=>reviewedOakBeigeRetirement({control:{...control,reason:'Not in supplier list'},product}));
 assert.throws(()=>reviewedOakBeigeRetirement({control,product:{...product,name:'Another Oak Beige'}}));
 assert.equal(retirement.alternativesPath,'/ranges/stone-floor/');
});
test('Oak Beige states retirement and alternatives while preserving the legacy response-code contract',()=>{
 for(const q of ['Is Stone Floor Oak Beige available?','Stone Floor Oak Beige colour','Stone Floor Oak Beige stock']){
  const a=policyAnswer(q,candidate);assert.equal(a.reason,'confirmation');assert.equal(a.status,'needs_confirmation');
  assert.equal(a.retirementStatus,'retired');assert.match(a.segments[0].text,/no longer offered by Oz Timber Floor/);
  assert.match(a.segments[0].text,/alternatives, not an exact replacement/);assert.equal(a.sources[0].href,'/ranges/stone-floor/');
  assert(!a.segments[0].text.includes('Stock, prices, pack quantities'));assert.deepEqual(a.entityIds,[]);
 }
});
test('privacy, safety, similarly named colours and unconfirmed historical corpus remain protected',()=>{
 assert.equal(policyAnswer('Stone Floor Oak Beige bathroom safe?',candidate).reason,'safety');
 assert.equal(policyAnswer('Stone Floor Oak Beige supplier keys',candidate).reason,'private_request');
 for(const q of ['Hardwood Collection Artisan Oak Beige','Stone Floor Oak Beigewood','Oak Beige'])assert.notEqual(policyAnswer(q,candidate)?.retirementStatus,'retired');
 const historical={...candidate,retirements:[]};assert.notEqual(policyAnswer('Stone Floor Oak Beige colour',historical).retirementStatus,'retired');
});
test('retired Oak Beige cannot become a current stock/product prefill or a provider call',async()=>{
 let calls=0;const secret='offline-retirement-test-secret-only',origin='http://127.0.0.1:8860';
 const handler=createHandler({corpus:candidate,policy,provider:{generate(){calls++;throw Error('Unexpected generation');}},settings:{enabled:true,context:'local',mode:'mock',allowedOrigin:origin,signingSecret:secret}});
 const response=await handler(new Request(origin+'/api/flooring-assistant',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:JSON.stringify({op:'message',requestId:crypto.randomUUID(),sessionToken:issueToken(secret),pagePath:'/',history:[],message:'Is Stone Floor Oak Beige available?'})}),{ip:'127.0.0.1'});
 const answer=await response.json();assert.equal(response.status,200);assert.equal(answer.retirementStatus,'retired');assert.equal(answer.enquiryIntent,'product');assert.equal(answer.enquiryContext,undefined);assert.equal(calls,0);
});
