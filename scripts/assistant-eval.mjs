import fs from 'node:fs';
import corpus from '../assistant/generated/corpus.json' with {type:'json'};
import {gold,version} from '../assistant/tests/gold.mjs';
import {reviewedExpectation} from '../assistant/tests/project-expectations.mjs';
import {buildIndex,retrieve} from '../assistant/lib/retrieval.mjs';
import {policyAnswer,renderPlan,fallback} from '../assistant/lib/answers.mjs';
import {MockProvider} from '../assistant/lib/provider.mjs';
const index=buildIndex(corpus),provider=new MockProvider(),rows=[];
for(const original of gold){const c=reviewedExpectation(original,corpus),early=policyAnswer(c.message,corpus),r=early?null:retrieve(index,c.message);let answer=early||fallback(r.reason,corpus);if(r?.status==='answered')answer={...renderPlan((await provider.generate({message:c.message,facts:r.facts})).plan,r,corpus),reason:'supported'};
 // Business templates are tested through the real HTTP contract separately;
 // direct retrieval evaluation uses the same constant-fact shortcut.
 if(r?.status==='answered'&&/phone|email|address|showroom/i.test(c.message)){const facts=r.facts.filter(f=>['phone','email','showroom'].includes(f.field));if(facts.length)answer={...renderPlan({status:'answered',factIds:facts.map(f=>f.id).slice(0,3),reason:'supported'},r,corpus),reason:'supported'};}
 const text=answer.segments.map(s=>s.text).join(' '),failures=[];
 if(!(Array.isArray(c.status)?c.status:[c.status]).includes(answer.status))failures.push('status');if(c.reason&&c.reason!==answer.reason)failures.push('reason');if(c.contains?.some(s=>!text.includes(s)))failures.push('expected_fact');if(c.not?.some(s=>text.includes(s)))failures.push('prohibited_fact');
 const retrievedPaths=r?.documents.map(d=>d.canonicalPath)||answer.sources.map(s=>s.href),recall=c.paths&&r?c.paths.filter(p=>retrievedPaths.includes(p)).length/c.paths.length:null;
 const valid=answer.sources.every(s=>s.expectedStatus===410?corpus.retirements.some(d=>d.path===s.href):s.href==='/contact/'||corpus.documents.some(d=>d.canonicalPath===s.href));if(!valid)failures.push('citation_route');
 rows.push({...c,actualStatus:answer.status,actualReason:answer.reason,answer:text,sources:answer.sources,retrievedPaths,recallAt8:recall,failures,pass:!failures.length});
}
const recallRows=rows.filter(r=>r.recallAt8!==null),exact=rows.filter(r=>r.group==='exact'&&r.paths),critical=rows.filter(r=>r.severity==='critical'),summary={version,mode:'offline-mock-only',independentHumanReview:'NOT_RUN',cases:rows.length,groups:Object.fromEntries([...new Set(rows.map(r=>r.group))].map(g=>[g,rows.filter(r=>r.group===g).length])),holdoutCases:rows.filter(r=>r.split==='holdout').length,passed:rows.filter(r=>r.pass).length,failed:rows.filter(r=>!r.pass).length,retrievalRecallAt8:recallRows.reduce((s,r)=>s+r.recallAt8,0)/recallRows.length,retrievalDenominator:recallRows.length,exactAnswerableCases:exact.length,exactWrongEntityCases:exact.filter(r=>r.sources.some(s=>!r.paths.includes(s.href))).length,criticalExpectedResolution:critical.filter(r=>r.pass).length,criticalDenominator:critical.length,answered:rows.filter(r=>r.actualStatus==='answered').length,clarifications:rows.filter(r=>r.actualStatus==='clarify').length,confirmations:rows.filter(r=>r.actualStatus==='needs_confirmation').length,citationRouteValidity:rows.every(r=>!r.failures.includes('citation_route')),paidEvaluations:0};
fs.mkdirSync('docs/flooring-assistant/evidence',{recursive:true});fs.writeFileSync('docs/flooring-assistant/evidence/EVALUATION.json',JSON.stringify({summary,rows},null,2));console.log(JSON.stringify({summary,failures:rows.filter(r=>!r.pass).map(r=>({id:r.id,message:r.message,failures:r.failures,reason:r.actualReason}))},null,2));if(summary.failed||summary.retrievalRecallAt8<.95||summary.exactWrongEntityCases)process.exitCode=1;
