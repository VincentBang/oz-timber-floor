import test from 'node:test';
import assert from 'node:assert/strict';
import candidate from '../config/paid-preview.json' with {type:'json'};
import policy from '../config/policy.json' with {type:'json'};
import currentCorpus from '../generated/corpus.json' with {type:'json'};
import corpus from './fixtures/bound-approval-corpus.mjs';
import {approvedPreviewPolicy,CANDIDATE_MODEL} from '../lib/runtime.mjs';
import {OpenAIResponsesProvider} from '../lib/provider.mjs';
import {reservationCost} from '../lib/budget.mjs';
import {AtomicBlobBudgetStore} from '../lib/atomic-budget.mjs';
import {ConditionalBlobFixture} from './fixtures/conditional-blob.mjs';
import {hash} from '../lib/security.mjs';

const approved={...candidate,activationApproved:true,dataUseApproved:true,approvalReference:'OFFLINE-LUNA-FIXTURE'};
const approve=p=>approvedPreviewPolicy(p,policy,corpus,{OZ_ASSISTANT_PAID_CONFIG_HASH:hash(p)});
const usage={input_tokens:1000,output_tokens:80,input_tokens_details:{cached_tokens:0,cache_write_tokens:0,cache_write_tokens_details:{ttl_30m_tokens:0,ttl_12h_tokens:0}},output_tokens_details:{reasoning_tokens:0}};
const fake=u=>({status:'completed',model:'gpt-6-luna',output:[{content:[{type:'output_text',text:JSON.stringify({status:'clarify',factIds:[],reason:'insufficient'})}]}],usage:u});

test('Luna is the explicit default candidate but remains disabled locally',()=>{
 assert.equal(CANDIDATE_MODEL,'gpt-6-luna');assert.equal(candidate.activationApproved,false);assert.equal(candidate.dataUseApproved,false);assert.equal(candidate.accountModelAvailable,false);
 assert.throws(()=>approve(candidate),/paid_not_approved/);assert.equal(approve(approved).reviewedModelId,'gpt-6-luna');
 for(const patch of [{candidateModelId:'automatic'},{rateTable:{...candidate.rateTable,outputUsdPerMillion:.1}},{requestSettings:{...candidate.requestSettings,reasoningEffort:'medium'}},{requestSettings:{...candidate.requestSettings,cacheBreakpoints:1}}])assert.throws(()=>approve({...approved,...patch}));
});
test('new knowledge never inherits the historical preview approval',()=>{
 const documents=structuredClone(corpus.documents);documents[0].candidateHash=hash('unapproved-offline-test-input');
 const changed={...corpus,documents,corpusVersion:hash(documents)};
 assert.notEqual(changed.corpusVersion,corpus.corpusVersion);
 for(const next of [changed,...(currentCorpus.corpusVersion!==corpus.corpusVersion?[currentCorpus]:[])]){
  assert.throws(()=>approvedPreviewPolicy(approved,policy,next,{OZ_ASSISTANT_PAID_CONFIG_HASH:hash(approved)}),/paid_not_approved/);
 }
});
test('Luna sends strict Responses schema, no reasoning/cache writes, no tools or retries',async()=>{
 let calls=0,captured;const provider=new OpenAIResponsesProvider({key:'offline-only',model:'gpt-6-luna',fetchImpl:async(url,opts)=>{calls++;captured=JSON.parse(opts.body);return new Response(JSON.stringify(fake(usage)));}});
 await provider.generate({message:'Avala details',facts:[]});assert.equal(calls,1);assert.equal(captured.model,'gpt-6-luna');assert.deepEqual(captured.reasoning,{effort:'none'});assert.deepEqual(captured.prompt_cache_options,{mode:'explicit',ttl:'30m'});assert.equal(captured.store,false);assert.equal(captured.max_output_tokens,800);assert.equal(captured.text.format.strict,true);assert.equal(captured.service_tier,'default');assert(!captured.tools&&!captured.previous_response_id&&!captured.conversation);assert(!JSON.stringify(captured).includes('cache_control'));
});
test('Luna rejects unexpected cache/reasoning or malformed usage without another call',async()=>{
 for(const u of [{...usage,input_tokens_details:undefined},{...usage,input_tokens_details:{cached_tokens:1}},{...usage,input_tokens_details:{cached_tokens:0,cache_write_tokens:1}},{...usage,output_tokens_details:{reasoning_tokens:1}},{...usage,input_tokens:20001}]){
  let calls=0;const p=new OpenAIResponsesProvider({key:'offline-only',model:'gpt-6-luna',fetchImpl:async()=>{calls++;return new Response(JSON.stringify(fake(u)));}});await assert.rejects(p.generate({message:'Avala',facts:[]}),/provider_usage/);assert.equal(calls,1);
 }
});
test('Luna cost reserves worst cache-write rate; verified ordinary usage settles at standard rates',()=>{
 assert.equal(reservationCost(candidate.rateTable),.0054);assert.equal(reservationCost(candidate.rateTable,1000,80),.00014);
 assert.equal(reservationCost(candidate.rateTable,20000,800),.0024);
});
test('model transition preserves five historical calls and spending; only fifteen remain across months',async()=>{
 const backend=new ConditionalBlobFixture(),store=()=>new AtomicBlobBudgetStore(backend),limits=approve(approved).limits;
 const now=Date.UTC(2026,9,27),reserve=(key,at=now)=>store().reserve({key,bodyHash:hash(key),session:key,ip:hash(key),limits,reservedUsd:reservationCost(candidate.rateTable),now:at});
 // Existing ledger, not a new model-specific namespace.
 await reserve('seed');await store().settle('seed',.0024476);
 backend.data.counters['ge:internal-evaluation'].value=5;
 for(let i=0;i<15;i++){await reserve('luna-'+i,now+i*61000);await store().settle('luna-'+i,.00014);}
 assert.equal(backend.data.counters['ge:internal-evaluation'].value,20);assert.equal(backend.data.counters['be:internal-evaluation'].value,4547600);
 await assert.rejects(reserve('over-cap',Date.UTC(2026,10,2)),/budget_exhausted/);
});
