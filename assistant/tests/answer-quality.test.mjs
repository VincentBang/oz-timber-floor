import test from 'node:test';
import assert from 'node:assert/strict';
import * as parse5 from 'parse5';
import corpus from '../generated/corpus.json' with {type:'json'};
import {extractFaqPairs,isFaqSection} from '../lib/knowledge-extraction.mjs';
import {buildIndex,retrieve,comparisonMaterials} from '../lib/retrieval.mjs';
import {renderPlan} from '../lib/answers.mjs';
const index=buildIndex(corpus),plan=facts=>({status:'answered',reason:'supported',factIds:facts.slice(0,6).map(f=>f.id)});
test('FAQ extraction keeps complete question/answers and excludes hidden/script/template ancestors',()=>{
 const tree=parse5.parseFragment('<details class="faq-item"><summary>Is every floor the same?<span hidden>Hidden question suffix.</span></summary><p>No. Check the selected product.<span hidden>Hidden nested answer.</span></p><p>Confirm the method with the team.</p><p hidden>Injected hidden answer.</p><script>Injected script.</script></details><div hidden><details class="faq-item"><summary>Hidden question?</summary><p>Hidden answer.</p></details></div>');
 const text=n=>n.nodeName==='#text'?n.value:(n.childNodes||[]).map(text).join(' ').replace(/\s+/g,' ').trim();
 const pairs=extractFaqPairs(tree,text);assert.deepEqual(pairs,[{question:'Is every floor the same?',answer:'No. Check the selected product. Confirm the method with the team.',value:'Is every floor the same? No. Check the selected product. Confirm the method with the team.'}]);assert(isFaqSection(tree.childNodes[0]));assert(!isFaqSection({tagName:'details',attrs:[{name:'class',value:'mobile-disclosure'}]}));
});
test('every generated FAQ has its question and is not also a guidance blob',()=>{
 let checked=0;for(const doc of corpus.documents)for(const f of doc.facts.filter(f=>f.field==='faq')){assert(f.question);assert(f.value.startsWith(f.question+' '));const answer=f.value.slice(f.question.length).trim();assert(!doc.facts.some(g=>g.field==='guidance'&&g.value.includes(answer)),doc.canonicalPath);checked++;}assert(checked>10);
});
test('material comparisons admit only requested owners and no third-material text',()=>{
 for(const q of ['Compare engineered timber and hybrid','Hybrid versus engineered wood','Difference between engineered timber and hybrid, not laminate']){
  const r=retrieve(index,q);assert.equal(r.status,'answered');assert.deepEqual(new Set(r.facts.map(f=>f.canonicalPath)),new Set(['/engineered-timber-flooring/','/hybrid/']));assert(r.facts.every(f=>!/(?:laminate|vinyl|solid timber)/i.test(f.value)));const answer=renderPlan(plan(r.facts),r,corpus);assert.equal(answer.sources.length,2);assert(!/(?:laminate|vinyl|solid timber)/i.test(answer.segments.map(s=>s.text).join(' ')));
 }
 const basic=retrieve(index,'Compare engineered timber and hybrid');assert(basic.facts.slice(0,2).every(f=>!/^Can .*uneven|^Does .*levelling/i.test(f.value)));
});
test('explicit laminate/vinyl and three-way comparisons remain available, not globally banned',()=>{
 for(const [q,paths]of [['Compare laminate and vinyl',['/laminate/','/vinyl/']],['Compare engineered timber, hybrid and laminate',['/engineered-timber-flooring/','/hybrid/','/laminate/']]]){
  const r=retrieve(index,q);assert.deepEqual(new Set(r.facts.map(f=>f.canonicalPath)),new Set(paths));assert.deepEqual(new Set(renderPlan(plan(r.facts),r,corpus).sources.map(s=>s.href)),new Set(paths));
 }assert.equal(comparisonMaterials('Tell me about hybrid').length,0);
});
test('a one-sided model plan for a two-material comparison fails closed',()=>{
 const r=retrieve(index,'Compare engineered timber and hybrid');const one=r.facts.filter(f=>f.canonicalPath==='/hybrid/');assert.throws(()=>renderPlan(plan(one),r,corpus),/invalid_plan/);
});
test('floor levelling evidence contains no concatenated FAQ block or questionless No',()=>{
 const r=retrieve(index,'How do I plan floor levelling?');assert.equal(r.status,'answered');assert(r.facts.every(f=>f.value.length<=800));assert(!r.facts.some(f=>/These answers help/.test(f.value)));assert(!r.facts.some(f=>/\. No\. The selected/.test(f.value)));const answer=renderPlan(plan(r.facts),r,corpus);assert(answer.segments.length<=4);assert(answer.segments.map(s=>s.text).join(' ').length<=1400);assert(answer.sources.some(s=>s.href==='/floor-levelling/'));assert(answer.segments.every(s=>!/^(?:No|Yes)\./.test(s.text)));
});
test('renderer removes duplicate FAQ answers and enforces complete-unit length bounds',()=>{
 const doc=corpus.documents.find(d=>d.canonicalPath==='/floor-levelling/'),base={entityId:doc.entityId,entityType:doc.entityType,canonicalPath:doc.canonicalPath,title:doc.title,field:'faq'};
 const facts=[{...base,id:'first',question:'First question?',value:'First question? The same complete answer.'},{...base,id:'second',question:'Second question?',value:'Second question? The same complete answer.'},...Array.from({length:4},(_,i)=>({...base,id:'long-'+i,question:'Question '+i+'?',value:'Question '+i+'? '+('Distinct '+i+' ').repeat(40)}))];
 const answer=renderPlan(plan(facts),{facts},corpus);assert.equal(answer.segments.filter(s=>s.text.includes('same complete answer')).length,1);assert(answer.segments.length<=4);assert(answer.segments.map(s=>s.text).join('').length<=1400);assert(answer.segments.every(s=>facts.some(f=>f.value===s.text)));
});
test('exact product facts and multi-product comparisons retain entity boundaries',()=>{
 const r=retrieve(index,'Compare Avala Blackbutt and Avala Jarrah');assert.equal(r.exactEntities.length,2);assert.equal(r.comparisonOwners.length,0);assert(r.facts.every(f=>f.entityType==='product'));assert(r.facts.some(f=>f.value==='6.5mm'));
});
