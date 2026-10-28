import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import * as parse5 from 'parse5';
import {hash} from '../lib/security.mjs';import {restrictedRangeAnswer,ETF_RESTRICTED_ROUTE} from '../lib/restricted-range.mjs';import {policyAnswer} from '../lib/answers.mjs';import {recordedPackAnswer} from '../lib/recorded-pack.mjs';
import {createHandler} from '../lib/handler.mjs';import {issueToken} from '../lib/security.mjs';import policy from '../config/policy.json' with {type:'json'};
const root=new URL('../../',import.meta.url).pathname,read=f=>fs.readFileSync(root+f),catalogue=JSON.parse(read('data/product-catalogue.json')),source=JSON.parse(read('docs/migration-october-2026-followup/supplier/product-specifications.json'));
test('recovered fields exactly match the preserved dated source and current product identity',()=>{
 assert.equal(hash(read('docs/migration-october-2026-followup/supplier/product-specifications.json')),'e49283aadf30f55057043edc8203b4dc583f8e5a570f5cc46685aa0cbf21afa4');
 for(const e of source){const p=catalogue.products.find(p=>p.id===e.record);assert.equal(p.thickness,e.fields.Thickness);assert.equal(p.boardSize,`Length ${e.fields.Length} x Width ${e.fields.Width}`);assert.equal(p.packSizeM2,e.fields['Pack Size'].match(/^(\d+(?:\.\d+)?)/)[1]);if(e.fields['Surface Finish'])assert.equal(p.finish,e.fields['Surface Finish']);}
});
const nav={documentId:'etf-information',entityId:'etf-information',title:'ETF laminate range information',canonicalPath:ETF_RESTRICTED_ROUTE,entityType:'range',navigationOnly:true,restriction:'unverified_performance_and_specs',facts:[]};
test('ETF has a safe information link and enquiry context, not invented specifications',()=>{
 const c={documents:[nav],corpusVersion:'offline'},a=restrictedRangeAnswer('Tell me about ETF 72hrs water resistant laminate',c);assert.equal(a.status,'needs_confirmation');assert.equal(a.sources[0].href,ETF_RESTRICTED_ROUTE);assert.equal(a.enquiryContext.category,'Laminate');assert.match(a.segments[0].text,/not a guarantee/);assert(!/\b12mm|AC5|7mm|8mm|9mm/.test(a.segments[0].text));
 assert.equal(restrictedRangeAnswer('Tell me about this range',c,{pagePath:ETF_RESTRICTED_ROUTE}).reason,'restricted_specifications');assert.equal(policyAnswer('Can ETF 72hrs go in a bathroom?',c).reason,'safety');assert.equal(restrictedRangeAnswer('Tell me about ETF 72hrs',{}),null);
});
test('known pack coverage can be stated without quantity, waste or stock calculations',()=>{
 const doc={entityId:'spec',documentId:'spec',entityType:'product',canonicalPath:'/products/swish-laminate-eggshell/',title:'Swish Laminate Eggshell',facts:[{id:'range',field:'range',value:'Swish Laminate'},{id:'pack',field:'packSizeM2',value:'1.791'}]},c={documents:[doc],corpusVersion:'offline'};
 const answer=recordedPackAnswer('What is the pack size of Swish Laminate Eggshell?',c);assert.equal(answer.status,'answered');assert.match(answer.segments[0].text,/1.791 m²/);assert.match(answer.segments[0].text,/Confirm the current product and batch/);
 for(const question of ['Calculate boxes for 60m2 of Swish Laminate Eggshell','Pack size and stock of Swish Laminate Eggshell','What is the pack size of another product?'])assert.equal(recordedPackAnswer(question,c),null);
});
test('ETF range questions remain zero-generation and preserve stock enquiry intent',async()=>{
 const secret='offline-etf-range-test-not-a-live-secret',origin='http://127.0.0.1:8860',documents=[nav],corpus={documents,corpusVersion:hash(documents)};let calls=0;
 const handle=createHandler({corpus,policy,provider:{generate(){calls++;throw Error('must not call');}},settings:{enabled:true,mode:'mock',context:'local',allowedOrigin:origin,signingSecret:secret}});
 const body={op:'message',message:'Is ETF 72hrs laminate in stock?',history:[],pagePath:ETF_RESTRICTED_ROUTE,sessionToken:issueToken(secret),requestId:crypto.randomUUID()};
 const response=await handle(new Request(origin+'/api/flooring-assistant',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:JSON.stringify(body)}),{ip:'127.0.0.1'}),a=await response.json();assert.equal(response.status,200);assert.equal(a.reason,'restricted_specifications');assert.equal(a.enquiryContext.pagePath,ETF_RESTRICTED_ROUTE);assert.equal(a.enquiryIntent,'stock');assert.equal(calls,0);
});
