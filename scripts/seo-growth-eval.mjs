// Exercises real handler/retrieval/rendering OFFLINE with injected mock provider.
// No factual-accuracy percentage for GPT may be inferred from this runner.
import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';import {pathToFileURL} from 'node:url';
import {cases,conversations} from '../assistant/tests/post-migration-gold.mjs';
const root=process.cwd(),evidence=root+'/docs/seo-growth/evidence/2026-10-28',baseline=JSON.parse(fs.readFileSync(evidence+'/RECONCILIATION.json'));
const rows=[];for(const [label,base]of [['deployed-build-source',baseline.sourceFixture],['local-working-source',root]]){
 const corpus=JSON.parse(fs.readFileSync(base+'/assistant/generated/corpus.json')),policy=JSON.parse(fs.readFileSync(base+'/assistant/config/policy.json'));
 const {createHandler}=await import(pathToFileURL(base+'/assistant/lib/handler.mjs'));const {MockProvider}=await import(pathToFileURL(base+'/assistant/lib/provider.mjs'));
 async function run(id,questions,expectations){
  const provider=new MockProvider(),limits={sessionMinute:100,sessionDay:100,ipMinute:100,ipDay:100,globalDayCalls:1000,globalMonthCalls:1000,globalConcurrent:4,sessionConcurrent:2,dayBudgetUsd:1,monthBudgetUsd:30};
  const handler=createHandler({corpus,policy:{...policy,limits},provider,settings:{enabled:true,context:'local',mode:'mock',allowedOrigin:'http://127.0.0.1:8848',signingSecret:'isolated-test-secret-not-a-live-credential'}});
  const post=body=>handler(new Request('http://127.0.0.1:8848/api/flooring-assistant',{method:'POST',headers:{Origin:'http://127.0.0.1:8848','Content-Type':'application/json'},body:JSON.stringify(body)}),{ip:'127.0.0.1'});
  const session=await (await post({op:'session',requestId:crypto.randomUUID()})).json(),history=[];
  for(const [turn,message]of questions.entries()){
   const response=await post({op:'message',requestId:crypto.randomUUID(),sessionToken:session.sessionToken,pagePath:'/',history:history.slice(-6),message}),answer=await response.json(),text=answer.segments?.map(s=>s.text).join(' ')||'',exp=expectations?.[turn],failures=[];
   if(response.status!==200)failures.push('http_status');if(exp?.status&&!(Array.isArray(exp.status)?exp.status:[exp.status]).includes(answer.status))failures.push('status');if(exp?.reason&&exp.reason!==answer.reason)failures.push('reason');
   if(exp?.contains?.some(s=>!text.includes(s)))failures.push('expected_fact');if(exp?.not?.some(s=>text.includes(s)))failures.push('prohibited_fact');
   const sources=answer.sources||[];if(sources.some(s=>s.expectedStatus!==410&&s.href!=='/contact/'&&!corpus.documents.some(d=>d.canonicalPath===s.href)))failures.push('citation_not_current_owner');
   if(/sk-(?:proj-)?[A-Za-z0-9]{15,}|Bearer [A-Za-z0-9_-]{20,}/.test(text))failures.push('credential_pattern');
   rows.push({implementation:label,id,turn:turn+1,message,expected:exp||{manualReview:'PENDING'},httpStatus:response.status,status:answer.status,reason:answer.reason,text,sources,failures,automatedContractPass:!failures.length,mockProvider:true});
   history.push({role:'user',content:message},{role:'assistant',content:text.slice(0,2000)});
  }
 }
 for(const c of cases)await run(c.id,[c.message],[c]);
 for(const [i,qs]of conversations.entries())await run('multi-'+(i+1),qs);
}
const summary={at:new Date().toISOString(),mode:'offline-real-handler-injected-mock-no-GPT',singleTurnCasesPerImplementation:cases.length,multiTurnConversationsPerImplementation:conversations.length,rows:rows.length,contractPassed:rows.filter(r=>r.automatedContractPass).length,contractFailed:rows.filter(r=>!r.automatedContractPass).length,paidCalls:0,GPTFactualAccuracy:'NOT_MEASURED',independentHumanReview:'PENDING',failures:rows.filter(r=>!r.automatedContractPass).map(r=>({implementation:r.implementation,id:r.id,turn:r.turn,failures:r.failures}))};
const output=process.argv[2]||'AI_OFFLINE_EVALUATION.json';if(!/^[A-Z_]+\.json$/.test(output))throw Error('Use a simple new evidence filename');fs.writeFileSync(evidence+'/'+output,JSON.stringify({summary,rows},null,2),{flag:'wx'});console.log(JSON.stringify(summary,null,2));if(summary.contractFailed)process.exitCode=1;
