import test from 'node:test';
import assert from 'node:assert/strict';
import corpus from '../generated/corpus.json' with {type:'json'};
import policy from '../config/policy.json' with {type:'json'};
import {buildIndex,retrieve} from '../lib/retrieval.mjs';
import {renderPlan} from '../lib/answers.mjs';
import {createHandler} from '../lib/handler.mjs';
import {issueToken} from '../lib/security.mjs';
const index=buildIndex(corpus),message="What are Avala Blackbutt's thickness and board sizes? I need supply and installation.",clarify={status:'clarify',reason:'insufficient',factIds:[]};
test('live compound specification question includes both requested attributes, including plural sizes',()=>{
 for(const size of ['board size','board sizes','plank sizes','dimensions']){
  const r=retrieve(index,message.replace('board sizes',size));
  assert.equal(r.exactEntities.length,1);assert.deepEqual(r.requestedFields,['thickness','boardSize']);assert.deepEqual(r.missingFields,[]);
  assert(r.facts.some(f=>f.field==='thickness'&&f.value==='6.5mm'));assert(r.facts.some(f=>f.field==='boardSize'&&f.value==='1524 x 183 or 230 x 6.5mm'));
 }
});
test('model clarification recovers only complete requested specifications of one exact entity with citations',()=>{
 const r=retrieve(index,message),a=renderPlan(clarify,r,corpus),text=a.segments.map(s=>s.text).join(' ');
 assert.equal(a.status,'answered');assert.match(text,/Thickness: 6\.5mm/);assert.match(text,/Board size: 1524 x 183 or 230 x 6\.5mm/);assert(!/Which named product/.test(text));assert.deepEqual(a.sources.map(s=>s.href),['/products/avala-blackbutt/']);
 const ids=a.segments.flatMap(s=>s.evidenceIds);assert.equal(ids.length,2);assert(ids.every(id=>r.facts.some(f=>f.id===id&&['thickness','boardSize'].includes(f.field))));
});
test('recovery never fills missing attributes or overrides ambiguous/comparison/general clarification',()=>{
 const r=retrieve(index,message);
 for(const modified of [{...r,facts:r.facts.filter(f=>f.field!=='boardSize')},{...r,missingFields:[{title:'Avala Blackbutt',field:'boardSize'}]},{...r,exactEntities:[]},{...r,exactEntities:[...r.exactEntities,'other']},{...r,requestedFields:[]},retrieve(index,'Blackbutt'),retrieve(index,'Compare Avala Blackbutt and Avala Jarrah')])assert.equal(renderPlan(clarify,modified,corpus).status,'clarify');
 assert.throws(()=>renderPlan({...clarify,unexpected:'claim'},r,corpus),/invalid_plan/);
});
test('actual handler retains supply-install product handoff despite a mocked insufficient model plan',async()=>{
 const origin='http://127.0.0.1:8891',secret='offline-product-spec-recovery-test-123456789';let calls=0;
 const handler=createHandler({corpus,policy,settings:{enabled:true,mode:'mock',context:'local',allowedOrigin:origin,signingSecret:secret},provider:{async generate({facts}){calls++;assert(facts.some(f=>f.field==='boardSize'));return {plan:clarify};}}});
 const send=async(text,id)=>handler(new Request(origin+'/api/flooring-assistant',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:JSON.stringify({op:'message',message:text,requestId:id,sessionToken:issueToken(secret),history:[],pagePath:'/products/avala-blackbutt/'})}),{ip:'local-offline-test'});
 const response=await send(message,'product_spec_case_1'),body=await response.json();assert.equal(response.status,200);assert.equal(body.status,'answered');assert.equal(calls,1);assert.equal(body.enquiryContext.product,'Avala Blackbutt');assert.equal(body.enquiryContext.range,'Avala');assert.equal(body.enquiryContext.category,'Hybrid');assert.equal(body.enquiryContext.pagePath,'/products/avala-blackbutt/');assert.equal(body.enquiryIntent,'supply-install');assert(body.conversationToken);
 const safety=await(await send('Is Avala Blackbutt waterproof and bathroom suitable?','product_spec_case_2')).json();assert.equal(safety.reason,'safety');assert.equal(calls,1);
});
