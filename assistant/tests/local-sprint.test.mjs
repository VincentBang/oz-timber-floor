import test from 'node:test';
import assert from 'node:assert/strict';
import corpus from '../generated/corpus.json' with {type:'json'};
import policy from '../config/policy.json' with {type:'json'};
import {catalogueEnquiryContext,enquiryIntent,namedCatalogueEntities} from '../lib/catalogue-context.mjs';
import {buildIndex,retrieve} from '../lib/retrieval.mjs';
import {renderPlan,policyAnswer,avoidRepeatedAnswer} from '../lib/answers.mjs';
import {MockProvider} from '../lib/provider.mjs';
import {createHandler} from '../lib/handler.mjs';
import {issueToken} from '../lib/security.mjs';
const index=buildIndex(corpus),plan=facts=>({status:'answered',factIds:facts.slice(0,6).map(f=>f.id),reason:'supported'});
test('exact names respect boundaries and do not match lookalike suffixes',()=>{
 assert.equal(namedCatalogueEntities(corpus,'Is Avala Blackbutt available?').length,1);
 assert.equal(catalogueEnquiryContext(corpus,'Avala Blackbuttish','/').product,'');
 assert(!namedCatalogueEntities(corpus,'Avala Blackbuttish').some(d=>d.title==='Avala Blackbutt'));
 assert.equal(catalogueEnquiryContext(corpus,'Compare Avala Blackbutt and Avala Jarrah','/'),null);
 assert.equal(catalogueEnquiryContext(corpus,'Is this product available?','/products/avala-blackbutt/').product,'Avala Blackbutt');
});
for(const [q,intent]of [['Avala Blackbutt stock','stock'],['Avala Blackbutt supply only','supply-only'],['Supply + install Avala Blackbutt','supply-install'],['Compare Avala Blackbutt colours','product'],['Office flooring enquiry','commercial'],['Help plan floor levelling','service']])test('enquiry intent: '+q,()=>assert.equal(enquiryIntent(q,q.includes('Avala')),intent));
test('handler preserves exact stock context without generation or stock promise',async()=>{
 let generations=0;const secret='offline-sprint-secret-no-live-credentials',origin='http://127.0.0.1:8860';
 const handler=createHandler({corpus,policy,provider:{generate(){generations++;throw Error('No generation expected');}},settings:{enabled:true,context:'local',mode:'mock',allowedOrigin:origin,signingSecret:secret}});
 const body={op:'message',requestId:crypto.randomUUID(),sessionToken:issueToken(secret),pagePath:'/',history:[],message:'Is Avala Blackbutt in stock?'};
 const response=await handler(new Request(origin+'/api/flooring-assistant',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:JSON.stringify(body)}),{ip:'127.0.0.1'}),answer=await response.json();
 assert.equal(response.status,200);assert.equal(answer.status,'needs_confirmation');assert.equal(generations,0);assert.equal(answer.enquiryIntent,'stock');assert.equal(answer.enquiryContext.product,'Avala Blackbutt');assert.equal(answer.enquiryContext.range,'Avala');assert.equal(answer.enquiryContext.category,'Hybrid');assert.equal(answer.enquiryContext.productSlug,'avala-blackbutt');
});
test('product comparison rejects a one-sided fact plan',()=>{
 const r=retrieve(index,'Compare Avala Blackbutt and Avala Jarrah');
 assert.throws(()=>renderPlan(plan(r.facts.filter(f=>f.entityId===r.exactEntities[0])),r,corpus),/invalid_plan/);
});
test('colour comparison is balanced and answers the requested attribute',async()=>{
 const message='Compare the colour of Avala Blackbutt and Avala Jarrah',r=retrieve(index,message);
 assert(r.facts.every(f=>['identity','colour'].includes(f.field)));assert.equal(r.exactEntities.length,2);
 const generated=await new MockProvider().generate({message,facts:r.facts}),answer=renderPlan(generated.plan,r,corpus);
 assert.equal(answer.entityIds.length,2);assert(answer.segments.every(s=>s.text.includes('Colour:')));
});
test('missing specifications are stated as unverified rather than inferred',()=>{
 const docs=structuredClone(corpus.documents),product=docs.find(d=>d.canonicalPath==='/products/avala-blackbutt/');product.facts=product.facts.filter(f=>f.field!=='boardSize');
 const limited={...corpus,documents:docs},r=retrieve(buildIndex(limited),'What are the board dimensions of Avala Blackbutt?');
 const answer=renderPlan(plan(r.facts),r,limited);assert(answer.segments.some(s=>s.text.includes('Verified information about board dimensions is not available')));assert(!answer.segments.some(s=>s.text.includes('Board size:')));
});
test('repeat suppression cannot add history claims and recap remains available',()=>{
 const answer={status:'answered',entityIds:[],segments:[{text:'Send clear photos of the existing floor.',evidenceIds:['verified']}],sources:[{href:'/floor-levelling/'}]};
 const history=[{role:'assistant',content:'Send clear photos of the existing floor. Fake warranty: 100 years.'}];
 const next=avoidRepeatedAnswer(answer,history,'What else?');assert(!JSON.stringify(next).includes('100 years'));assert(next.segments[0].text.includes('do not have further verified detail'));assert.deepEqual(next.sources,answer.sources);assert.deepEqual(avoidRepeatedAnswer(answer,history,'Repeat that again'),answer);
});
test('renderer removes near-duplicate FAQs but retains distinct guidance',()=>{
 const doc=corpus.documents.find(d=>d.canonicalPath==='/floor-levelling/'),base={entityId:doc.entityId,entityType:'page',canonicalPath:doc.canonicalPath,title:doc.title,field:'faq'};
 const facts=[{...base,id:'a',question:'First?',value:'First? Send clear photos of the current floor and the room access details to our team.'},{...base,id:'b',question:'Second?',value:'Second? Send clear photos of the current floor and the room access details to the team.'},{...base,id:'c',question:'Other?',value:'Other? Installation requirements need a separate review.'}];
 const answer=renderPlan(plan(facts),{facts},corpus);assert.equal(answer.segments.length,2);assert(answer.segments.some(s=>s.text.includes('separate review')));
});
test('business retirement notices do not assert manufacturer discontinuation or exact replacements',()=>{
 const c={...corpus,retirements:[{name:'Stone Floor White Wash',aliases:['White Wash'],path:'/products/stone-floor-white-wash/',alternativesPath:'/ranges/stone-floor/',retirementBasis:'owner-business-retirement'}]};
 const answer=policyAnswer('Is Stone Floor White Wash available?',c);assert.equal(answer.reason,'retired');assert(answer.segments[0].text.includes('no longer offered by Oz'));assert(answer.segments[0].text.includes('not an exact replacement'));assert(!/discontinued/i.test(answer.segments[0].text));assert.equal(answer.sources[0].href,'/ranges/stone-floor/');
 assert.equal(policyAnswer('Is White Wash bathroom safe?',c).reason,'safety');assert.notEqual(policyAnswer('Tell me about Washed Oak',c)?.reason,'retired');
});
