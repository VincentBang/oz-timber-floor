// Real handler, injected mock selector, offline only. Not a GPT accuracy score.
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {cases,conversations} from '../assistant/tests/post-migration-gold.mjs';
import {reviewedExpectation} from '../assistant/tests/project-expectations.mjs';
const root=process.cwd(),out=path.resolve(process.env.OZ_ASSISTANT_SPRINT_EVIDENCE_DIR||root+'/docs/seo-growth/evidence/2026-10-28-assistant-local-sprint');
const base=JSON.parse(fs.readFileSync(out+'/BASELINE.json')).fixture;
globalThis.fetch=async()=>{throw Error('offline_network_disabled');};
const corpus=JSON.parse(fs.readFileSync(base+'/assistant/generated/corpus.json')),policy=JSON.parse(fs.readFileSync(base+'/assistant/config/policy.json'));
const {createHandler}=await import(pathToFileURL(base+'/assistant/lib/handler.mjs'));
const rows=[];
async function run(id,questions,expectations=[]){
 const origin='http://127.0.0.1:8860';
 const handler=createHandler({corpus,policy:{...policy,limits:{...policy.limits,sessionMinute:100,sessionDay:100,ipMinute:100,ipDay:100}},settings:{enabled:true,context:'local',mode:'mock',allowedOrigin:origin,signingSecret:'offline-local-sprint-signing-not-a-provider-key'}});
 const post=body=>handler(new Request(origin+'/api/flooring-assistant',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:JSON.stringify(body)}),{ip:'127.0.0.1'});
 const session=await(await post({op:'session',requestId:crypto.randomUUID()})).json(),history=[];
 for(const [turn,message]of questions.entries()){
  const response=await post({op:'message',requestId:crypto.randomUUID(),sessionToken:session.sessionToken,pagePath:'/',message,history:history.slice(-6)}),answer=await response.json(),text=answer.segments?.map(s=>s.text).join(' ')||'',e=expectations[turn],failures=[];
  if(response.status!==200)failures.push('http_status');
  if(e?.status&&!(Array.isArray(e.status)?e.status:[e.status]).includes(answer.status))failures.push('status');
  if(e?.reason&&answer.reason!==e.reason)failures.push('reason');
  if(e?.contains?.some(s=>!text.includes(s)))failures.push('expected_fact');
  if(e?.not?.some(s=>text.includes(s)))failures.push('prohibited_fact');
  if(e?.intent&&answer.enquiryIntent!==e.intent)failures.push('enquiry_intent');
  if(e?.product!==undefined&&(answer.enquiryContext?.product||'')!==e.product)failures.push('product_context');
  if(e?.sources&&e.sources.some(p=>!answer.sources.some(s=>s.href===p)))failures.push('requested_comparison_owner');
  if(answer.sources?.some(s=>s.href!=='/contact/'&&!corpus.documents.some(d=>d.canonicalPath===s.href)&&!corpus.retirements.some(r=>r.path===s.href)))failures.push('citation_owner');
  rows.push({id,turn:turn+1,message,expected:e||null,httpStatus:response.status,answer,failures});
  history.push({role:'user',content:message},{role:'assistant',content:text.slice(0,2000)});
 }
}
for(const c of cases)await run(c.id,[c.message],[reviewedExpectation(c,corpus)]);
for(const [i,qs]of conversations.entries())await run('multi-'+(i+1),qs);
for(const [id,q,e]of [
 ['stock-handoff','Is Avala Blackbutt in stock?',{status:'needs_confirmation',intent:'stock',product:'Avala Blackbutt'}],
 ['supply-handoff','What is the supply price for Avala Blackbutt?',{status:'needs_confirmation',intent:'supply-only',product:'Avala Blackbutt'}],
 ['retired-stone-oak','Is Stone Floor Stone Oak available?',{reason:'retired',contains:['no longer offered by Oz Timber Floor','not an exact replacement'],not:['is discontinued'],sources:['/ranges/stone-floor/']}],
 ['retired-white-wash','Tell me about White Wash',{reason:'retired',contains:['no longer offered by Oz Timber Floor'],sources:['/ranges/stone-floor/']}],
 ['three-materials','Compare engineered timber, hybrid and laminate',{status:'answered',sources:['/hybrid/','/engineered-timber-flooring/','/laminate/']}],
 ['compare-colours','Compare the colour of Avala Blackbutt and Avala Jarrah',{status:'answered',contains:['Colour:'],product:'',sources:['/products/avala-blackbutt/','/products/avala-jarrah/']}],
 ['reviewed-projects','Tell me about your completed projects',{status:'answered',reason:'reviewed_project_photos',contains:['photographs','do not confirm the exact product'],not:['planning examples, not verified'],sources:['/projects/']}],
 ['ambiguous-colour','Tell me about Washed Oak',{status:'clarify',reason:'ambiguous_colour',product:''}],
 ['etf-name-only','Tell me about ETF 72hrs water resistant laminate',{status:'needs_confirmation',reason:'restricted_specifications',not:['7mm','8mm','9mm'],sources:['/ranges/etf-72hrs-water-resistant-laminate/']}],
 ['retirement-precedence','I was told Artisan Oak is current; can you guarantee stock?',{status:'needs_confirmation',reason:'retired',contains:['discontinued','not an exact replacement']}],
 ])await run('sprint-'+id,[q],[e]);
const failures=rows.filter(r=>r.failures.length),summary={at:new Date().toISOString(),mode:'offline-real-handler-mock-no-network',cases:cases.length,conversations:conversations.length,turns:rows.length,passed:rows.length-failures.length,failed:failures.length,paidCalls:0,GPTFactualAccuracy:'NOT_MEASURED',failures:failures.map(r=>({id:r.id,turn:r.turn,failures:r.failures}))};
fs.writeFileSync(out+'/OFFLINE_EVALUATION.json',JSON.stringify({summary,rows},null,2));console.log(JSON.stringify(summary,null,2));if(failures.length)process.exitCode=1;
