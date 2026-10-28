import fs from 'node:fs';
import corpus from '../assistant/generated/corpus.json' with {type:'json'};
import {holdout} from '../assistant/tests/holdout.mjs';
import {retrieve,buildIndex} from '../assistant/lib/retrieval.mjs';
import {renderPlan,policyAnswer,fallback} from '../assistant/lib/answers.mjs';
import {MockProvider} from '../assistant/lib/provider.mjs';
const index=buildIndex(corpus),provider=new MockProvider(),rows=[];
for(const [question,status,contains]of holdout){const early=policyAnswer(question,corpus),r=early?null:retrieve(index,question);let answer=early||fallback(r.reason,corpus);if(r?.status==='answered'){const constants=r.facts.filter(f=>['phone','email','showroom'].includes(f.field));const plan=constants.length&&/phone|call|number|showroom|address/.test(question)?{status:'answered',factIds:constants.slice(0,3).map(f=>f.id),reason:'supported'}:(await provider.generate({message:question,facts:r.facts})).plan;answer=renderPlan(plan,r,corpus);}const text=answer.segments.map(s=>s.text).join(' ');rows.push({question,expectedStatuses:status,expectedText:contains,actualStatus:answer.status,answer:text,pass:status.includes(answer.status)&&contains.every(c=>text.includes(c))});}
const result={mode:'mock-only',cases:rows.length,passed:rows.filter(r=>r.pass).length,tuning:'additional prompts not used in retrieval tuning',independentHumanReview:'NOT_RUN',rows};fs.writeFileSync('docs/flooring-assistant/evidence/HOLDOUT.json',JSON.stringify(result,null,2));console.log(JSON.stringify({...result,rows:rows.filter(r=>!r.pass)},null,2));if(result.passed!==result.cases)process.exitCode=1;
