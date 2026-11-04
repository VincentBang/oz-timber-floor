import assert from 'node:assert/strict';
import test from 'node:test';
import {saveAreaSummary,takeAreaSummary,contactDestination} from '../floor-plan/summary.mjs';
import {localFloorPlanEnabled} from './floor-plan-package.mjs';
import {floorPlanDestination} from '../floor-plan/context.mjs';
const key='oz-floorplan-handoff-v1', now=100000000;
function memory() {
  const entries=new Map();
  return {entries, getItem:k=>entries.get(k)??null,removeItem:k=>entries.delete(k),setItem:(k,v)=>entries.set(k,v)};
}
test('only the two approved customer values and validation metadata survive a single handoff',()=>{
 const tab=memory();assert.ok(saveAreaSummary(12.337,2,tab,now));
 assert.deepEqual(takeAreaSummary(tab,now+1),{v:1,createdAt:now,totalAreaM2:12.34,includedRoomCount:2,method:'manual_trace'});
 assert.equal(takeAreaSummary(tab,now+2),null);
});
test('blocked or invalid storage cannot become an enquiry',()=>{
 const tab=memory();
 for(const [area,count] of [[-2,1],[NaN,1],[Infinity,1],[1e6,2],[2,0],[2,251],[2,1.5],[0.0001,1]]){
  assert.equal(saveAreaSummary(area,count,tab,now),false);assert.equal(tab.entries.size,0);
 }
 const blocked={getItem(){throw Error()},removeItem(){throw Error()},setItem(){throw Error()}};
 assert.equal(saveAreaSummary(12,1,blocked,now),false);assert.equal(takeAreaSummary(blocked,now),null);
});
test('reject future, stale, malformed and oversized summaries and consume invalid records',()=>{
 const tab=memory();const good={v:1,createdAt:now,totalAreaM2:20,includedRoomCount:1,method:'manual_trace'};
 const samples=['null','{','1'.repeat(600), ...[{...good,createdAt:now+1},{...good,createdAt:now-900000},{...good,filename:'secret-plan'},{...good,totalAreaM2:0.001},{...good, method:'auto'},{...good,v:2}].map(s=>JSON.stringify(s))];
 for(const raw of samples){tab.setItem(key,raw);assert.equal(takeAreaSummary(tab,now),null);assert.equal(tab.getItem(key),null);}
});
test('default and contextual handoffs keep a fixed internal contact path and bounded public enquiry parameters',()=>{
 let u=new URL(contactDestination('?returnTo=https://foreign.test&enquiry=invalid&area=223&filename=private.pdf'), 'https://oztimberfloor.com.au');
 assert.equal(u.href,'https://oztimberfloor.com.au/contact/?floorplan=1&enquiry=supply-install&source=floor-plan');
 assert.equal(new URL(contactDestination('?source=https://foreign.test'),u).searchParams.get('source'),'floor-plan');
 u=new URL(contactDestination('?enquiry=stock&product=Avala&productSlug=avala-blackbutt&category=Hybrid&source=%2Fhybrid%2F&utm_source=example&range=%3Cbad%3E'),u);
 assert.equal(u.searchParams.get('product'),'Avala');assert.equal(u.searchParams.get('productSlug'),'avala-blackbutt');assert.equal(u.searchParams.get('enquiry'),'stock');assert.equal(u.searchParams.get('source'),'/hybrid/');assert.equal(u.searchParams.get('utm_source'),'example');assert.equal(u.searchParams.has('range'),false);
});
test('build permission is explicit and limited to a local build',()=>{
 for (const context of [undefined,'production','deploy-preview','branch-deploy','PRODUCTION']) assert.equal(localFloorPlanEnabled({CONTEXT:context,OZ_FLOORPLAN_ENABLED:'true'}),false);
 for(const context of ['local','dev']){assert.equal(localFloorPlanEnabled({CONTEXT:context,OZ_FLOORPLAN_ENABLED:'true'}),true);assert.equal(localFloorPlanEnabled({CONTEXT:context}),false);}
 for(const providerFlag of ['NETLIFY','DEPLOY_ID','NETLIFY_LOCAL'])assert.equal(localFloorPlanEnabled({CONTEXT:'local',OZ_FLOORPLAN_ENABLED:'true',[providerFlag]:'true'}),false);
});
test('floorplan entry carries only bounded public context, never private plan or form fields',()=>{
 const url = new URL(floorPlanDestination('?product=Avala&range=Avala&source=%2Franges%2Favala%2F&email=private&name=private&message=private&filename=private.pdf&room=Private&geometry=1,2&area=99&floorplan=1&returnTo=https://foreign.test', 'service'), 'https://oztimberfloor.com.au');
 assert.equal(url.pathname, '/floor-plan/');
 assert.deepEqual([...url.searchParams.keys()], ['enquiry','product','range','source']);
 assert.equal(url.searchParams.get('enquiry'), 'service');
 assert.equal(url.searchParams.get('source'), '/ranges/avala/');
 assert.equal(new URL(floorPlanDestination('?source=//foreign.test&product='+ 'a'.repeat(181)),url).searchParams.has('product'),false);
});
