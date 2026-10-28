import test from 'node:test';
import assert from 'node:assert/strict';
import corpus from '../generated/corpus.json' with {type:'json'};
import policy from '../config/policy.json' with {type:'json'};
import currentCandidate from '../config/paid-preview.json' with {type:'json'};
import {runtimeOptions,approvedPreviewPolicy} from '../lib/runtime.mjs';
import {AtomicBlobBudgetStore} from '../lib/atomic-budget.mjs';
import {ConditionalBlobFixture} from './fixtures/conditional-blob.mjs';
import {createHandler} from '../lib/handler.mjs';
import {issueToken,hash} from '../lib/security.mjs';
import {retrieve,buildIndex} from '../lib/retrieval.mjs';

const origin='https://approved-gpt-test--oztimberfloor.netlify.app',secret='offline-test-signing-secret-with-no-provider-access';
// Preserve the historical 4.1-mini monetary assertions verbatim; Luna has its
// own additional tests instead of lowering these previously reviewed amounts.
const candidate={...currentCandidate,candidateModelId:'gpt-4.1-mini-2025-04-14',rateTable:{modelId:'gpt-4.1-mini-2025-04-14',inputUsdPerMillion:.4,outputUsdPerMillion:1.6,verifiedAt:'2026-10-27'}};
const profile={...candidate,activationApproved:true,dataUseApproved:true,approvalReference:'OFFLINE-FIXTURE-ONLY',boundCorpusVersion:corpus.corpusVersion};
const env={OZ_ASSISTANT_ENABLED:'true',OZ_ASSISTANT_MODE:'preview',OZ_ASSISTANT_PREVIEW_APPROVED:'true',OZ_ASSISTANT_PAID_PREVIEW_APPROVED:'true',OZ_ASSISTANT_ORIGIN:origin,OZ_ASSISTANT_SIGNING_SECRET:secret,OZ_ASSISTANT_PAID_CONFIG_HASH:hash(profile)};
const context={site:{id:'fd68e39e-7863-4012-8a97-40bec59b23d9',name:'oztimberfloor'},deploy:{published:false,context:'deploy-preview'},user:{id:'authorised-fixture-user'}};
const settings={enabled:true,mode:'preview',context:'deploy-preview',previewApproved:true,paidPreviewApproved:true,paidCallsEnabled:true,allowedOrigin:origin,signingSecret:secret};
const request=(message='Avala Blackbutt details',id=crypto.randomUUID(),patch={})=>new Request(origin+(patch.path||'/api/flooring-assistant'),{method:'POST',headers:{Origin:origin,'Content-Type':'application/json',...patch.headers},body:JSON.stringify({op:'message',message,history:[],pagePath:'/',sessionToken:issueToken(secret),requestId:id})});
const approved=approvedPreviewPolicy(profile,policy,corpus,env);
const responseFor=message=>new Response(JSON.stringify({status:'completed',model:profile.candidateModelId,output:[{content:[{type:'output_text',text:JSON.stringify({status:'answered',reason:'supported',factIds:retrieve(buildIndex(corpus),message).facts.slice(0,6).map(f=>f.id)})}]}],usage:{input_tokens:1000,output_tokens:80}}),{headers:{'Content-Type':'application/json'}});

test('default profile and any key alone cannot select paid mode or open storage',async()=>{
 let opens=0;const loadBlobs=async()=>{opens++;throw Error('must not load');};
 for(const selected of [candidate,{...profile,dataUseApproved:false},{...profile,candidateModelId:'unreviewed-model'},{...profile,boundCorpusVersion:'stale'},{...profile,budgetStoreRegion:'different-region'}]){
  const opts=await runtimeOptions({env:{...env,OZ_ASSISTANT_OPENAI_API_KEY:'offline-only',OZ_ASSISTANT_PAID_CONFIG_HASH:hash(selected)},context,url:origin+'/api/flooring-assistant',profile:selected,policy,corpus,loadBlobs});assert.equal(opts.settings.enabled,false);
 }assert.equal(opens,0);
});
test('production, published, wrong site and guest do not open budget storage',async()=>{
 let opens=0;const loadBlobs=async()=>{opens++;throw Error('must not load');};
 for(const c of [{...context,deploy:{published:true,context:'production'}},{...context,deploy:{published:false,context:'production'}},{...context,user:null},{...context,site:{id:'other',name:'other'}}]){const opts=await runtimeOptions({env,context:c,url:origin+'/api/flooring-assistant',profile,policy,corpus,loadBlobs});assert.equal(opts.settings.enabled,false);}assert.equal(opens,0);
});
test('SDK receives fixed site-wide region, strong consistency and no manual credential',async()=>{
 let captured;const opts=await runtimeOptions({env,context,url:origin+'/api/flooring-assistant',profile,policy,corpus,loadBlobs:async()=>({getStore:options=>{captured=options;return new ConditionalBlobFixture();}})});
 assert.equal(captured.name,'oz-assistant-paid-preview-budget-v1');assert.equal(captured.region,'us-east-2');assert.equal(captured.consistency,'strong');assert(!captured.siteID&&!captured.token);assert(opts.store instanceof AtomicBlobBudgetStore);assert.equal(opts.settings.paidCallsEnabled,false);
});
test('environment paid switch cannot bypass hosted-store and account-model checks',async()=>{
 const loadBlobs=async()=>({getStore:()=>new ConditionalBlobFixture()});
 const opts=await runtimeOptions({env:{...env,OZ_ASSISTANT_PAID_CALLS_ENABLED:'true'},context,url:origin+'/api/flooring-assistant',profile,policy,corpus,loadBlobs});assert.equal(opts.settings.paidCallsEnabled,false);
 const verified={...profile,accountModelAvailable:true,budgetVerification:{status:'HOSTED_PASS',reportSha256:hash('offline-report-fixture-not-hosted-evidence')}};
 const approvedOpts=await runtimeOptions({env:{...env,OZ_ASSISTANT_PAID_CALLS_ENABLED:'true',OZ_ASSISTANT_PAID_CONFIG_HASH:hash(verified)},context,url:origin+'/api/flooring-assistant',profile:verified,policy,corpus,loadBlobs});assert.equal(approvedOpts.settings.paidCallsEnabled,true);
});
test('one metered Responses call renders only corroborated facts and rejects replay',async()=>{
 const backend=new ConditionalBlobFixture(),store=new AtomicBlobBudgetStore(backend),events=[];let calls=0,captured;
 const handler=createHandler({corpus,policy:approved,settings,store,paid:{key:'offline-placeholder-not-a-live-key',model:profile.candidateModelId,fetchImpl:async(url,options)=>{calls++;captured=JSON.parse(options.body);assert(backend.data.counters['be:internal-evaluation'].value>0);return responseFor('Avala Blackbutt details');}},metadata:e=>events.push(e)});
 const id=crypto.randomUUID(),req=request('Avala Blackbutt details',id),token=JSON.parse(await req.clone().text()).sessionToken;
 const result=await handler(req,{ip:'192.0.2.1'}),body=await result.json();assert.equal(result.status,200);assert.equal(body.mode,'preview');assert.match(JSON.stringify(body),/183 or 230/);assert.equal(calls,1);assert.equal(captured.store,false);assert.equal(captured.service_tier,'default');assert(!captured.tools&&!captured.previous_response_id&&!captured.conversation);
 const repeated=new Request(origin+'/api/flooring-assistant',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:JSON.stringify({op:'message',message:'Avala Blackbutt details',history:[],pagePath:'/',sessionToken:token,requestId:id})});assert.equal((await handler(repeated,{ip:'192.0.2.1'})).status,429);assert.equal(calls,1);
 assert(!JSON.stringify(events).includes('192.0.2.1'));assert(!JSON.stringify(events).includes('visitorQuestion'));assert(!JSON.stringify(body).includes('offline-placeholder'));assert.equal(backend.data.counters['be:internal-evaluation'].value,528000);
});
test('paid switch, model mismatch and store failure prevent provider calls',async()=>{
 let calls=0;const paid={key:'offline-placeholder',model:profile.candidateModelId,fetchImpl:async()=>{calls++;return responseFor('Avala Blackbutt details');}};
 for(const options of [{settings:{...settings,paidCallsEnabled:false},store:new AtomicBlobBudgetStore(new ConditionalBlobFixture()),paid},{settings,store:new AtomicBlobBudgetStore({getWithMetadata(){throw Error('outage');},setJSON(){}}),paid},{settings,store:new AtomicBlobBudgetStore(new ConditionalBlobFixture()),paid:{...paid,model:'wrong'}}]){const r=await createHandler({corpus,policy:approved,...options})(request(),{ip:'192.0.2.1'});assert.equal(r.status,503);}assert.equal(calls,0);
});
test('price/stock/retirement and unsafe questions use deterministic answers without GPT',async()=>{
 let calls=0;const handler=createHandler({corpus,policy:approved,settings,store:new AtomicBlobBudgetStore(new ConditionalBlobFixture()),paid:{key:'offline-placeholder',model:profile.candidateModelId,fetchImpl:async()=>{calls++;throw Error('must not call');}}});
 for(const q of ['What is the price?','Do you have stock?','Artisan Oak','Is it waterproof?'])assert.equal((await handler(request(q),{ip:'192.0.2.1'})).status,200);assert.equal(calls,0);
});
test('timeout and invalid usage retain the maximum spending reservation',async()=>{
 for(const fetchImpl of [async()=>{throw new DOMException('timeout','AbortError');},async()=>new Response(JSON.stringify({status:'completed',output:[],usage:{input_tokens:1000,output_tokens:80}}))]){
  const backend=new ConditionalBlobFixture(),handler=createHandler({corpus,policy:approved,settings,store:new AtomicBlobBudgetStore(backend),paid:{key:'offline-placeholder',model:profile.candidateModelId,fetchImpl}});assert.equal((await handler(request(),{ip:'192.0.2.1'})).status,503);assert.equal(backend.data.counters['be:internal-evaluation'].value,9280000);
 }
});

test('hostile origin and alternate function alias share the same paid guards',async()=>{
 let calls=0;const handler=createHandler({corpus,policy:approved,settings,store:new AtomicBlobBudgetStore(new ConditionalBlobFixture()),paid:{key:'offline-placeholder',model:profile.candidateModelId,fetchImpl:async()=>{calls++;return responseFor('Avala Blackbutt details');}}});
 assert.equal((await handler(request('Avala Blackbutt details',crypto.randomUUID(),{headers:{Origin:'https://evil.test'}}),{ip:'192.0.2.1'})).status,403);assert.equal(calls,0);
 assert.equal((await handler(request('Avala Blackbutt details',crypto.randomUUID(),{path:'/.netlify/functions/flooring-assistant'}),{ip:'192.0.2.1'})).status,200);assert.equal(calls,1);
});
