import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
import {launch} from './harness.mjs';
const origin=process.env.OZ_LOCAL_ORIGIN, output=process.env.OZ_LOCAL_EVIDENCE;
const key='oz-floorplan-handoff-v1', choices=['stock','supply-only','supply-install','product','commercial','service'];
const valid=()=>({v:1,createdAt:Date.now(),totalAreaM2:21.25,includedRoomCount:2,method:'manual_trace'});
const card='section[aria-label="Floor plan estimate"]';
const logs={suite:'Oz area handoff, real local browser, intercepted networking',origin,rows:[],posts:[],external:[],consoleErrors:[]};
const browser=await launch(process.env.OZ_BROWSER);
const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jSvkAAAAASUVORK5CYII=','base64');
const formSelector='form[name="oz-flooring-enquiry"]';
const currentURL=qs=> origin+'/contact/'+(qs?'?'+qs:'');
const controls=async p=>p.locator(formSelector).evaluate(f=>({
  identity:f.getAttribute('name'),action:f.getAttribute('action'),method:f.method,enctype:f.enctype,
  consent:f.elements.namedItem('consent').checked,
  fields:Object.fromEntries([...f.elements].filter(e=>e.name&&e.type!=='file').map(e=>[e.name,e.value])),
  attachments:Array.from(f.querySelectorAll('input[type=file]'),e=>[e.name,e.files.length]),
}));
async function run(name,fn,seed){
  const ctx=await browser.newContext({viewport:{width:name.includes('mobile')?390:1280,height:844}, serviceWorkers:'block'}), local=[];
  await ctx.route('**/*',async route=>{
    const req=route.request(),u=new URL(req.url());
    if(req.method()!=='GET'&&req.method()!=='HEAD'){logs.posts.push({name,method:req.method(),path:u.pathname});return req.method()==='GET' ? route.fulfill({status:200,contentType:u.pathname.endsWith('.css')?'text/css':'text/plain',body:''}) : route.abort();}
    if(u.origin!==origin){
      logs.external.push(u.hostname);
      return route.fulfill({status:200,contentType:u.pathname.endsWith('.css')||u.hostname==='fonts.googleapis.com'?'text/css':'text/plain',body:''});
    }
    local.push(u.pathname);return route.continue();
  });
  if(seed!==undefined){await ctx.addInitScript(({key,seed})=>{
    if(sessionStorage.getItem('contact-test-seeded'))return;
    sessionStorage.setItem('contact-test-seeded','1');
    sessionStorage.setItem(key,seed);
  },{key,seed});}
  const p=await ctx.newPage(), errs=[];
  p.on('pageerror',e=>errs.push(e.message));
  try {
    const detail=await fn(p,local);
    assert.deepEqual(errs,[],'uncaught errors on page');
    logs.rows.push({name,status:'PASS',detail});
  } catch(e) {
    logs.rows.push({name,status:'FAIL',error:e.message.slice(0,700)});console.log(name,'FAIL',e.message.slice(0,260));
  } finally{logs.consoleErrors.push(...errs.map(error=>({name,error})));await ctx.close();}
}
async function go(p,qs=''){await p.goto(currentURL(qs),{waitUntil:'networkidle'});await p.locator(formSelector).waitFor();}
async function summaryPresent(p){await p.locator(card).waitFor({timeout:2500});assert.match(await p.locator(card).textContent(),/21.25 m² traced across 2 included rooms/);}
function preserved(before,after,extra=[]){
 const omit=new Set(['area',...extra]);assert.deepEqual(before.attachments,after.attachments);assert.equal(after.identity,'oz-flooring-enquiry');assert.equal(after.action,'/thank-you/');assert.equal(after.method,'post');assert.equal(after.enctype,before.enctype);assert.equal(after.consent,before.consent);
 for(const [name,val] of Object.entries(before.fields))if(!omit.has(name))assert.equal(after.fields[name],val,'changed form field '+name);
}
const seed=()=>JSON.stringify(valid());
try {
 await run('ordinary URL ignores even a valid pending transfer',async(p,requests)=>{
   await go(p,'enquiry=supply-install');assert.equal(await p.locator(card).count(),0);assert.ok(await p.evaluate(k=>sessionStorage.getItem(k),key));
   assert.ok(!requests.some(u=>/summary\.mjs|contact-review\.mjs|pdf|tool\.mjs/.test(u)));return 'No review, measurement or PDF module on ordinary contact.';
 },seed());
 for(const type of choices) await run('mode '+type,async(p)=>{
   const qs=new URLSearchParams({floorplan:'1',enquiry:type,product:'Avala Blackbutt',productSlug:'avala-blackbutt',range:'Avala',brand:'Label',category:'hybrid',source:'range-page',utm_source:'floorplan-local'});
   await go(p,qs);await summaryPresent(p);const before=await controls(p);
   assert.equal(before.fields.enquiry_type,type);assert.equal(before.fields.product_slug,'avala-blackbutt');
   assert.equal(before.fields.range,'Avala');assert.equal(before.fields.source_page,'range-page');assert.equal(before.fields.utm_source,'floorplan-local');
   assert.equal(before.fields.area,'');assert.equal(before.consent,false);
   assert.deepEqual(before.attachments.map(x=>x[0]),['floor_plan','flooring_photo_1','flooring_photo_2']);assert.ok(before.attachments.every(x=>x[1]===0));
   const supported=!['stock','product'].includes(type),apply=p.locator(card+' button').first();
   assert.equal(await apply.isVisible(),supported);
   if(supported){await apply.click();assert.equal(await p.locator('#area').inputValue(),'21.25 m²');}
   else {await p.getByRole('button',{name:'Dismiss'}).click();assert.equal(await p.locator('#area').inputValue(),'');}
   preserved(before,await controls(p));assert.equal(await p.locator(card).count(),0);
   assert.equal(await p.evaluate(k=>sessionStorage.getItem(k),key),null);
   await p.reload({waitUntil:'networkidle'});assert.equal(await p.locator(card).count(),0);
   return supported?'Applied after confirmation; other fields and enquiry attribution preserved; optional attachment fields remain unchanged. No replay on reload.':'Stock/product mode hides application. Ordinary form and context preserved.';
 },seed());
 for(const [name,raw] of [
  ['absent',undefined],['malformed','{"v":'],['expired',JSON.stringify({...valid(),createdAt:Date.now()-16*60000})],['unexpected geometry field',JSON.stringify({...valid(),points:[1]})],['invalid negative area',JSON.stringify({...valid(),totalAreaM2:-8})],
 ])await run(name+' is silent',async p=>{
   await go(p,'floorplan=1&enquiry=supply-install');assert.equal(await p.locator(card).count(),0);assert.equal(await p.locator('#area').inputValue(),'');assert.equal(await p.evaluate(k=>sessionStorage.getItem(k),key),null);return 'ordinary form remains usable';
 },raw);
 await run('conflict can dismiss without overwriting a manual quantity',async p=>{
   await go(p,'floorplan=1&enquiry=supply-only');await summaryPresent(p);await p.locator('#area').fill('15 boxes');await p.locator('#message').fill('Retain customer note');
   assert.match(await p.locator(card+' [role=status]').textContent(),/15 boxes/);const before=await controls(p);await p.getByRole('button',{name:'Dismiss'}).click();const after=await controls(p);
   preserved(before,after);assert.equal(after.fields.area,'15 boxes');assert.equal(await p.locator('#enquiryType').evaluate(e=>e===document.activeElement),true);return 'manual area and notes survive dismissal; focus returned to enquiry type';
 },seed());
 await run('silent browser autofill requires explicit replacement',async p=>{
   await go(p,'floorplan=1&enquiry=supply-install');await summaryPresent(p);
   await p.locator('#area').evaluate(e=>e.value='42 boxes');
   await p.getByRole('button',{name:'Apply 21.25 m²'}).click();
   assert.equal(await p.locator('#area').inputValue(),'42 boxes');await p.getByRole('button',{name:'Replace existing area with 21.25 m²'}).click();
   assert.equal(await p.locator('#area').inputValue(),'21.25 m²');assert.equal(await p.locator('#area').evaluate(e=>e===document.activeElement),true);
   return 'first click reviews an autofilled quantity; second explicit click replaces it';
 },seed());
 await run('stock mode to service via existing dropdown',async p=>{
   await go(p,'floorplan=1&enquiry=stock');await summaryPresent(p);const apply=p.locator(card+' button').first();assert.ok(!(await apply.isVisible()));
   await p.locator('#enquiryType').selectOption('service');assert.equal(await apply.isVisible(),true);await apply.click();assert.equal(await p.locator('#area').inputValue(),'21.25 m²');
   return 'mode changes preserve estimate and make it usable when area becomes visible';
 },seed());
 await run('stock mode to supply-install via existing contact shortcut',async p=>{
   await go(p,'floorplan=1&enquiry=stock');await summaryPresent(p);const apply=p.locator(card+' button').first();assert.ok(!(await apply.isVisible()));
   await p.locator('a[data-set-enquiry="supply-install"]').first().click();assert.equal(await p.locator('#enquiryType').inputValue(),'supply-install');
   assert.equal(await apply.isVisible(),true,'stock to supply-install shortcut must expose Apply as the area field becomes visible');
   await apply.click();assert.equal(await p.locator('#area').inputValue(),'21.25 m²');return 'shortcut switches enquiry and review action together';
 },seed());
 await run('non-local-storage-enabled browser can still use contact',async p=>{
   await p.addInitScript(()=>{const native=Storage.prototype.getItem;Storage.prototype.getItem=function(k){if(k==='oz-floorplan-handoff-v1')throw new DOMException('Unavailable','SecurityError');return native.call(this,k);};});
   await go(p,'floorplan=1&enquiry=service');assert.equal(await p.locator(card).count(),0);await p.locator('#area').fill('Measured later');assert.equal(await p.locator('#area').inputValue(),'Measured later');return 'area stays editable with no floorplan storage access';
 });
}finally{await browser.close();}
logs.failed=logs.rows.filter(row=>row.status!=='PASS').length;logs.passed=logs.rows.length-logs.failed;
logs.external=[...new Set(logs.external)];fs.mkdirSync(output,{recursive:true});fs.writeFileSync(path.join(output,'contact-browser.json'),JSON.stringify(logs,null,2)+'\n');
console.log(JSON.stringify({passed:logs.passed,failed:logs.failed,postAttempts:logs.posts.length,pageErrors:logs.consoleErrors.length}));if(logs.failed||logs.posts.length||logs.consoleErrors.length)process.exitCode=1;
