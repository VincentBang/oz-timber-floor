import test from 'node:test';
import assert from 'node:assert/strict';
import {validateDraft,makeHandoff,clearDrafts} from '../../assets/flooring-assistant-handoff.js';
globalThis.location={origin:'http://127.0.0.1:8840'};
const context={entityId:'e04b115963cb4604fdf56cf4',pagePath:'/products/avala-blackbutt/',product:'Avala Blackbutt',range:'Avala',category:'Hybrid',productSlug:'avala-blackbutt'};
for(const intent of ['stock','supply-only','supply-install','product','commercial','service'])test('review-only handoff '+intent,()=>{const saved=new Map(),storage={setItem:(k,v)=>saved.set(k,v)},values={suburb:'Sydney',area:'Approximately 55 m²',message:'Please review my access & timing; customer@example.test'};const r=makeHandoff({intent,context,values},storage,1000),u=new URL(r.href,location.origin);assert(r.stored);assert.equal(u.searchParams.get('enquiry'),intent);assert.equal(u.searchParams.get('productSlug'),'avala-blackbutt');assert.equal(u.searchParams.get('source'),context.pagePath);assert(!/55|customer|access|timing/.test(u.search));assert.match(u.hash,/^#oz-assistant-draft=[a-f0-9-]{36}$/);const d=JSON.parse([...saved.values()][0]);assert.equal(d.values.message,values.message);assert(validateDraft(d,2000));assert.throws(()=>validateDraft(d,902000));});
test('disabled storage, malformed/future/expired drafts, field allowlist and clear',()=>{
 const result=makeHandoff({intent:'stock',context,values:{message:'Copyable summary'}},{setItem(){throw Error('disabled');}},1000);assert(!result.stored);assert(result.summary.includes('Copyable summary'));assert(!result.href.includes('#'));
 const good={version:1,createdAt:1000,intent:'stock',context,values:{suburb:'Sydney'}};
 for(const d of [{...good,createdAt:999999},{...good,intent:'book'},{...good,values:{email:'no'}},{...good,context:{pagePath:'//evil.test'}},{...good,context:{...context,supplier:'private'}},{...good,unexpected:'x'}])assert.throws(()=>validateDraft(d,2000));
 const saved=new Map([['oz-assistant-draft-v1:test','x'],['other','keep']]);clearDrafts({get length(){return saved.size;},key:i=>[...saved.keys()][i],removeItem:k=>saved.delete(k)});assert.equal(saved.size,1);assert(saved.has('other'));
});
