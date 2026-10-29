import fs from 'node:fs';import crypto from 'node:crypto';
import corpus from '../assistant/generated/corpus.json' with {type:'json'};
import policy from '../assistant/config/policy.json' with {type:'json'};
import {createHandler} from '../assistant/lib/handler.mjs';import {issueToken} from '../assistant/lib/security.mjs';
import {guideCases,safetyCases} from '../assistant/tests/guide-usefulness-cases.mjs';
const origin='http://127.0.0.1:8882',secret='offline-usefulness-only-secret-123456',rows=[];
for(const [id,turns,criteria]of guideCases){
 const handler=createHandler({corpus,policy,settings:{enabled:true,mode:'mock',context:'local',allowedOrigin:origin,signingSecret:secret}}),sessionToken=issueToken(secret);let conversationToken='',history=[],outputs=[];
 for(const message of turns){const r=await handler(new Request(origin+'/api/flooring-assistant',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:JSON.stringify({op:'message',message,conversationToken,history,pagePath:'/',sessionToken,requestId:crypto.randomUUID()})}),{ip:'offline-usefulness'}),a=await r.json();conversationToken=a.conversationToken||'';const text=(a.segments||[]).map(s=>s.text).join('\n');outputs.push({message,http:r.status,status:a.status,reason:a.reason,text,sources:a.sources,segments:a.segments,enquiryContext:a.enquiryContext});history.push({role:'user',content:message},{role:'assistant',content:text.slice(0,2000)});history=history.slice(-6);}
 const last=outputs.at(-1),failures=criteria.filter(pattern=>!new RegExp(pattern,'i').test(last.text)).map(pattern=>'missing-useful-content: '+pattern);
 if(outputs.some(a=>a.http!==200))failures.push('http-error');
 if(id==='explicit-switch'&&/Avala/i.test(last.text+JSON.stringify(last.enquiryContext||{})))failures.push('stale-product');
 if(['retired-oak','retired-beige','ambiguous-pair'].includes(id)&&last.enquiryContext)failures.push('wrong-handoff');
 if(id==='comparison'&&last.sources.some(s=>!['/engineered-timber-flooring/','/hybrid/'].includes(s.href)))failures.push('irrelevant-comparison-source');
 if(['strata','bathroom','waterproof'].includes(id)&&/asbestos/i.test(last.text))failures.push('irrelevant-hazard');
 rows.push({id,criteria,outputs,failures,pass:!failures.length});
}
const safety=[];for(const [id,message,expected]of safetyCases){const handler=createHandler({corpus,policy,settings:{enabled:true,mode:'mock',context:'local',allowedOrigin:origin,signingSecret:secret}});const a=await(await handler(new Request(origin+'/api/flooring-assistant',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:JSON.stringify({op:'message',message,history:[],pagePath:'/',sessionToken:issueToken(secret),requestId:crypto.randomUUID()})}),{ip:'offline-safety'})).json();const text=a.segments.map(s=>s.text).join(' ');safety.push({id,text,pass:new RegExp(expected,'i').test(text)&&!a.enquiryContext});}
const summary={version:'guide-usefulness-v1',mode:'offline-mock-and-agent-review',normalPassed:rows.filter(r=>r.pass).length,normalTotal:rows.length,safetyPassed:safety.filter(r=>r.pass).length,safetyTotal:safety.length,realModelCalls:0,independentHumanReview:false,automatedRubricOnly:true};
const dir=process.env.OZ_GUIDE_EVIDENCE_DIR||'../evidence/followup';fs.mkdirSync(dir,{recursive:true});fs.writeFileSync(dir+'/USEFULNESS.json',JSON.stringify({summary,rows,safety},null,2));console.log(JSON.stringify({summary,failures:rows.filter(r=>!r.pass).map(r=>({id:r.id,failures:r.failures,text:r.outputs.at(-1).text})),safety},null,2));if(summary.normalPassed/rows.length<.95||safety.some(r=>!r.pass))process.exitCode=1;
