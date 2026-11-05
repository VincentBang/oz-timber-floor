import test from 'node:test';import assert from 'node:assert/strict';
import corpus from '../generated/corpus.json' with {type:'json'};import policy from '../config/policy.json' with {type:'json'};
import {buildIndex,retrieve} from '../lib/retrieval.mjs';import {namedCatalogueEntities} from '../lib/catalogue-context.mjs';import {renderPlan,policyAnswer,avoidRepeatedAnswer} from '../lib/answers.mjs';import {resolveConversation} from '../lib/conversation-state.mjs';import {guideFailure} from '../../assets/flooring-guide-request.js';import {createHandler} from '../lib/handler.mjs';import {issueToken} from '../lib/security.mjs';
const index=buildIndex(corpus),empty={entityIds:[],owners:[],intent:'supply-install',preference:null};
test('reviewed cross-page access overlap retains the richer cited answer, independent of model order',()=>{
 const r=retrieve(index,'Can you collect keys from our agency and coordinate with the tenant?'),ids=['f0a06e03e71fcd15eeba784b','2d98e9464622ab815e7bd21c'];assert(ids.every(id=>r.facts.some(f=>f.id===id)));
 for(const factIds of [ids,[...ids].reverse()]){const a=renderPlan({status:'answered',factIds,reason:'supported'},r,corpus);assert.equal(a.segments.length,1);assert.match(a.segments[0].text,/collection and return/);assert.match(a.segments[0].text,/agreed contact process/);assert.deepEqual(a.segments[0].evidenceIds,[ids[0]]);assert.deepEqual(a.sources.map(s=>s.href),['/property-manager-flooring/']);}
});
test('nearby but non-equivalent and changed answers are not silently dropped',()=>{
 const r=retrieve(index,'Can you collect keys from our agency and coordinate with the tenant?'),a=r.facts.find(f=>f.id==='f0a06e03e71fcd15eeba784b'),b={...r.facts.find(f=>f.id==='2d98e9464622ab815e7bd21c'),value:'Arrange access only after the insurer has confirmed authorisation.'};
 const answer=renderPlan({status:'answered',factIds:[a.id,b.id],reason:'supported'},{facts:[a,b]},corpus);assert.equal(answer.segments.length,2);assert(answer.segments.some(s=>s.text===b.value));
});
test('a follow-up cannot repeat the narrower reviewed access answer or discard new privacy details',()=>{
 const r=retrieve(index,'Can you collect keys from our agency and coordinate with the tenant?');const render=id=>renderPlan({status:'answered',factIds:[id],reason:'supported'},r,corpus),rich=render('f0a06e03e71fcd15eeba784b'),short=render('2d98e9464622ab815e7bd21c');
 const suppressed=avoidRepeatedAnswer(short,[{role:'assistant',content:rich.segments[0].text}],'What else?');assert.equal(suppressed.segments[0].text,'I do not have further verified detail on that point. You can review the linked source or prepare a question for the Oz Timber Floor team.');assert.deepEqual(suppressed.segments[0].evidenceIds,[]);assert.deepEqual(suppressed.sources,short.sources);assert.deepEqual(avoidRepeatedAnswer(rich,[{role:'assistant',content:short.segments[0].text}],'What else?'),rich);assert.deepEqual(avoidRepeatedAnswer(short,[{role:'assistant',content:rich.segments[0].text}],'repeat that'),short);
});
test('excluded catalogue names do not become a third comparison member or handoff owner',()=>{
 for(const word of ['not','excluding','without']){const q='Compare Avala Blackbutt and Avala Jarrah, '+word+' Artisan Tile';const r=retrieve(index,q);assert.equal(r.exactEntities.length,2);assert(r.facts.every(f=>f.title.startsWith('Avala ')));assert.equal(namedCatalogueEntities(corpus,q).length,2);assert.equal(resolveConversation(q,empty,corpus).state.entityIds.length,2);}
 assert.equal(namedCatalogueEntities(corpus,'Artisan Tile is not waterproof').length,1);assert.equal(policyAnswer('Compare Avala Blackbutt and Avala Jarrah, not waterproof',corpus).reason,'safety');
});
test('attribute fragments retain signed product/pair context without inheriting untrusted prose',()=>{
 const first=resolveConversation('Avala Blackbutt supply only',empty,corpus);
 for(const q of ['And board size?','What about the width?','And finish?','And colour?','Pack size?']){const r=resolveConversation(q,first.state,corpus);assert.match(r.question,/Avala Blackbutt/);assert.deepEqual(r.state.entityIds,first.state.entityIds);assert.equal(r.state.intent,'supply-only');}
 const pair=resolveConversation('Compare Avala Blackbutt and Avala Jarrah',empty,corpus);assert.match(resolveConversation('And board size?',pair.state,corpus).question,/Compare Avala Blackbutt and Avala Jarrah/);assert(resolveConversation('Is it available?',pair.state,corpus).ambiguous);
 for(const q of ['now a different floor','suspected asbestos','Artisan Oak'])assert.deepEqual(resolveConversation(q,first.state,corpus).state.entityIds,[]);
});
test('unknown finish remains unknown and comparison retains both owners',()=>{
 const r=retrieve(index,'Compare Avala Blackbutt and Avala Jarrah finish');assert.equal(r.missingFields.length,2);assert(r.missingFields.every(f=>f.field==='finish'));const a=renderPlan({status:'answered',factIds:r.facts.map(f=>f.id),reason:'supported'},r,corpus);assert.equal(a.entityIds.length,2);assert.equal(a.segments.filter(s=>s.text.startsWith('Verified information')).length,2);
});
test('usage-limit recovery is useful, non-retrying and cannot display server exception content',()=>{
 assert.match(guideFailure('budget_exhausted').text,/usage allowance/);assert.equal(guideFailure('budget_exhausted').retry,false);assert.match(guideFailure('rate_limit').text,/wait/);assert.match(guideFailure('busy').text,/busy/);assert(!guideFailure('<script>private key</script>').text.includes('script'));
});
test('real handler attribute follow-up retains exact handoff and reviewed retired products never become current',async()=>{
 const origin='http://127.0.0.1:8840',secret='quality-sprint-local-only-secret-123456789',handler=createHandler({corpus,policy,settings:{enabled:true,mode:'mock',context:'local',allowedOrigin:origin,signingSecret:secret}}),sessionToken=issueToken(secret);let conversationToken='';
 for(const [i,message]of ['Avala Blackbutt supply only','And board size?','And finish?'].entries()){const r=await handler(new Request(origin+'/api/flooring-assistant',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:JSON.stringify({op:'message',message,history:[],conversationToken,pagePath:'/',sessionToken,requestId:'quality-followup-'+i})}),{ip:'local'}),a=await r.json();assert.equal(r.status,200);assert.equal(a.enquiryContext?.product,'Avala Blackbutt');assert.equal(a.enquiryIntent,'supply-only');conversationToken=a.conversationToken;}
 for(const name of ['Artisan Oak','Stone Floor Oak Beige']){const a=policyAnswer(name,corpus);assert.equal(a.reason==='retired'||a.retirementStatus==='retired',true);assert(!a.enquiryContext);}assert.equal(policyAnswer('Pronto Portofino stock',corpus).reason,'confirmation');
});
