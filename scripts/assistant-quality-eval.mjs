// Deterministic relevance/format tests, not a paid/model-quality score.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import corpus from '../assistant/generated/corpus.json' with {type:'json'};
import {buildIndex,retrieve} from '../assistant/lib/retrieval.mjs';
import {renderPlan} from '../assistant/lib/answers.mjs';
const index=buildIndex(corpus),rows=[];
const comparisons=[['Compare engineered timber and hybrid',['/engineered-timber-flooring/','/hybrid/']],['Hybrid versus engineered wood',['/engineered-timber-flooring/','/hybrid/']],['Difference between engineered timber and hybrid, not laminate',['/engineered-timber-flooring/','/hybrid/']],['Compare laminate and vinyl',['/laminate/','/vinyl/']],['Compare hybrid and laminate',['/hybrid/','/laminate/']],['Compare engineered timber, hybrid and laminate',['/engineered-timber-flooring/','/hybrid/','/laminate/']]];
for(const [question,expected]of [...comparisons,['How do I plan floor levelling?',null],['How do I plan floor leveling?',null]]){
 const r=retrieve(index,question),answer=renderPlan({status:'answered',reason:'supported',factIds:r.facts.slice(0,6).map(f=>f.id)},r,corpus),text=answer.segments.map(s=>s.text).join(' ');
 assert.equal(answer.status,'answered');assert(answer.segments.length<=4);assert(text.length<=1400);assert(!/These answers help|\. No\. The selected/.test(text));if(expected)assert.deepEqual(new Set(answer.sources.map(s=>s.href)),new Set(expected));
 rows.push({question,expectedOwners:expected,retrievedFacts:r.facts.map(f=>({id:f.id,path:f.canonicalPath,field:f.field,value:f.value})),answer,pass:true});
}
const result={at:new Date().toISOString(),mode:'deterministic-offline-not-model-evaluation',cases:rows.length,passed:rows.length,paidCalls:0,corpusVersion:corpus.corpusVersion,rows};fs.mkdirSync('docs/flooring-assistant/evidence',{recursive:true});fs.writeFileSync('docs/flooring-assistant/evidence/ANSWER_QUALITY.json',JSON.stringify(result,null,2));console.log(JSON.stringify({...result,rows:undefined},null,2));
