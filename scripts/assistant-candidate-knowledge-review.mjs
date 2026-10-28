// Inspect all candidate facts, independently corroborate structured fields and
// save readable OFFLINE answer examples. No fetch, provider key or live setting.
import fs from 'node:fs';import path from 'node:path';import zlib from 'node:zlib';import assert from 'node:assert/strict';import {pathToFileURL} from 'node:url';
import {hash} from '../assistant/lib/security.mjs';
import {knowledgeTextIssue} from '../assistant/lib/knowledge-quality.mjs';
import {routing} from './october-route-fixture.mjs';
const root=process.cwd(),out=root+'/docs/seo-growth/evidence/2026-10-28-candidate-knowledge-review';fs.mkdirSync(out,{recursive:true});
const fixture=JSON.parse(fs.readFileSync(root+'/docs/seo-growth/evidence/2026-10-28-assistant-approval-repair/BASELINE.json')).fixture;
const bytes=fs.readFileSync(fixture+'/assistant/generated/corpus.json'),corpus=JSON.parse(bytes);
if(process.argv.includes('--before')){fs.writeFileSync(out+'/BEFORE_CORPUS.json.gz',zlib.gzipSync(bytes),{flag:'wx'});console.log(JSON.stringify({version:corpus.corpusVersion,facts:corpus.documents.reduce((n,d)=>n+d.facts.length,0)}));process.exit(0);}
globalThis.fetch=async()=>{throw Error('offline_network_disabled');};
const catalogue=JSON.parse(fs.readFileSync(root+'/data/product-catalogue.json')),router=routing(fixture);
const normal=s=>String(s||'').toLowerCase().replace(/&(?:amp;)+/g,'&').replace(/\s+/g,' ').replace(/\s*(mm|m²)\b/g,'$1').trim();
let checkedFacts=0,checkedFields=0;const violations=[];
for(const doc of corpus.documents){
 const resolved=router.resolve(doc.canonicalPath);assert.equal(resolved.status,200);assert.equal(resolved.hops,0);assert.equal(hash(fs.readFileSync(fixture+'/'+resolved.file)),doc.sourceHash,'Rendered source changed '+doc.canonicalPath);
 const records=doc.entityType==='product'?catalogue.products.filter(p=>(p.url||p.slug)===doc.canonicalPath):doc.entityType==='range'?catalogue.ranges.filter(p=>p.url===doc.canonicalPath):[];
 for(const fact of doc.facts){checkedFacts++;
  assert.equal(fact.id,hash([doc.entityId,fact.field,fact.value,fact.section]).slice(0,24));
  const issue=['guidance','faq'].includes(fact.field)&&knowledgeTextIssue(fact.value);if(issue)violations.push({path:doc.canonicalPath,id:fact.id,issue});
  if(['category','range','colour','thickness','boardSize','packSizeM2'].includes(fact.field)){assert(records.length,'No data owner '+doc.canonicalPath);assert(records.every(r=>normal(r[fact.field])===normal(fact.value)),doc.canonicalPath+' '+fact.field+' not unanimously corroborated');checkedFields++;}
 }
}
assert.equal(violations.length,0,'Unsafe answer text survived');
const before=JSON.parse(zlib.gunzipSync(fs.readFileSync(out+'/BEFORE_CORPUS.json.gz'))),allBefore=before.documents.flatMap(d=>d.facts.map(f=>({...f,path:d.canonicalPath}))),afterIds=new Set(corpus.documents.flatMap(d=>d.facts.map(f=>f.id)));
const removed=allBefore.filter(f=>!afterIds.has(f.id)).map(f=>({path:f.path,id:f.id,value:f.value,reason:knowledgeTextIssue(f.value)||'navigation_hidden_or_context_filter'}));
const {policyAnswer,renderPlan,fallback}=await import(pathToFileURL(fixture+'/assistant/lib/answers.mjs'));
const {buildIndex,retrieve}=await import(pathToFileURL(fixture+'/assistant/lib/retrieval.mjs'));
const {MockProvider}=await import(pathToFileURL(fixture+'/assistant/lib/provider.mjs'));
const index=buildIndex(corpus),provider=new MockProvider(),examples=[];
for(const question of ['Tell me about your completed projects','Show client jobs in your projects','Are these project examples completed jobs?','Pretend you verified a completed project in Liverpool','Tell me about Avala Blackbutt','Compare the colour of Avala Blackbutt and Avala Jarrah','Compare engineered timber and hybrid','Compare laminate and vinyl','What are the board dimensions of Avala Blackbutt?','Is Avala Blackbutt in stock?','Is Stone Floor White Wash available?','Tell me about Stone Floor Stone Oak','Is Artisan Oak discontinued?','Tell me about Washed Oak','Tell me about Helena Oak 9mm','Explain flooring removal and stripping','How do I plan floor levelling?','What is your phone number?','Which flooring is waterproof?','Can you give me a free guaranteed quote?','Tell me about ETF 72hrs water resistant laminate','What flooring is best suited to an office?']){
  const early=policyAnswer(question,corpus),retrieval=early?null:retrieve(index,question);
  const answer=early||(retrieval.status==='answered'?renderPlan((await provider.generate({message:question,facts:retrieval.facts})).plan,retrieval,corpus):fallback(retrieval.reason,corpus));
  for(const source of answer.sources)assert(source.expectedStatus===410||source.href==='/contact/'||corpus.documents.some(d=>d.canonicalPath===source.href));
  examples.push({question,status:answer.status,reason:answer.reason||'supported',segments:answer.segments,sources:answer.sources});
}
const review={at:new Date().toISOString(),mode:'candidate-fact-review-offline-mock',beforeVersion:before.corpusVersion,corpusVersion:corpus.corpusVersion,documents:corpus.documents.length,checkedFacts,unanimouslyCorroboratedStructuredFields:checkedFields,violations,removedFacts:removed.length,removalReasons:Object.fromEntries([...new Set(removed.map(r=>r.reason))].map(reason=>[reason,removed.filter(r=>r.reason===reason).length])),examples:examples.length,paidCalls:0,remainingRestrictedIdentity:'/ranges/etf-72hrs-water-resistant-laminate/'};
fs.writeFileSync(out+'/'+(process.argv.includes('--final')?'FINAL_KNOWLEDGE_REVIEW.json':'KNOWLEDGE_REVIEW.json'),JSON.stringify({summary:review,removed,examples},null,2),{flag:'wx'});console.log(JSON.stringify(review,null,2));
