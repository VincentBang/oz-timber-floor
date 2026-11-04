import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {launch} from './harness.mjs';
const base=process.env.OZ_LOCAL_ORIGIN;
const out=path.resolve(process.env.OZ_LOCAL_EVIDENCE);
const browser=await launch(process.env.OZ_BROWSER);
const capture=async(page,options)=>{if(process.env.OZ_BROWSER!=='webkit')await page.screenshot({...options,caret:'initial'});};
const scenarios=[];
try {
for(const width of [1280,390,320,768]){
 const mobile=width<=390;
 const context=await browser.newContext({viewport:{width,height:mobile?844:900},hasTouch:mobile});
 const page=await context.newPage();page.setDefaultTimeout(5500);
 const requests=[],errors=[],blocked=[],storageWrites=[];
 await context.route('**/*',route=>{
   const req=route.request(),u=new URL(req.url());
   if(u.protocol.startsWith('http')){
     requests.push({host:u.host,method:req.method(),path:u.pathname});
     if(u.origin!==base || req.method()!=='GET'){blocked.push(String(req.method())+' '+u.host);return req.method()==='GET' ? route.fulfill({status:200,contentType:u.pathname.endsWith('.css')?'text/css':'text/plain',body:''}) : route.abort();}
   }
   return route.continue();
 });
 await page.addInitScript(()=>{ const original=Storage.prototype.setItem; Storage.prototype.setItem=function(k,v){window.__writes??=[];window.__writes.push([k,v]);return original.call(this,k,v);}; });
 page.on('pageerror',e=>errors.push(e.message));
 page.on('console',m=>{if(m.type()==='error') errors.push(m.text())});
 const opening='/floor-plan/?product=Avala&source=%2Fhybrid%2F';
 await page.goto(base+opening);await page.locator('#plan-file').waitFor();
 assert.equal(await page.title(),'Floor plan area tool | Oz Timber Floor');
 assert.equal(await page.locator('[name=robots]').getAttribute('content'),'noindex, nofollow');
 await page.locator('#plan-file').setInputFiles(path.join(out,'samples/sample-room-5m-by-4m.png'));
 await page.locator('#raster canvas').waitFor();
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
 if(width===768 || width===320){
  await capture(page,{path:out+'/checks/tool-'+width+'.png',fullPage:true});
  scenarios.push({width,flow:'image decode and layout',errors,blocked});assert.equal(errors.length,0);await context.close();continue;
 }
 const area=page.locator('#area-output');
 async function point(x,y,keyboard=false){
  if(keyboard){
   if(!await page.locator('#coords').evaluate(e=>e.open))await page.locator('#coords summary').click();
   await page.locator('#point-x').fill(String(x));await page.locator('#point-y').fill(String(y));await page.locator('#add-point').focus();await page.keyboard.press('Enter');
  }else{
   const el=page.locator('#overlay');await el.scrollIntoViewIfNeeded();const box=await el.boundingBox();
   const px=box.x+x*box.width/400,py=box.y+y*box.height/260;
   if(mobile)await page.touchscreen.tap(px,py);else await page.mouse.click(px,py);
  }
 }
 await point(40,40,!mobile);await point(240,40,!mobile);
 await page.locator('#known-distance').fill('5000');await page.locator('#distance-unit').selectOption('mm');await page.locator('#apply-scale').click();
 if(width===1280){
   await page.locator('#check-scale').click();await point(40,40,true);await point(40,200,true);
   assert.match(await page.locator('#check-result').textContent(),/4(?:\.00)?\s*m/);await page.locator('#stop-check').click();
 }
 const corners=[[40,40],[240,40],[240,200],[40,200]];
 for(const [x,y] of corners)await point(x,y,!mobile);
 await page.locator('#room-name').fill('Private Sample Lounge');
 await page.locator('#finish-room').click();
 const expected=mobile?0.35:0;assert.ok(Math.abs(Number(await area.textContent())-20)<=expected,'Measured '+await area.textContent());
 const measured=Number(await area.textContent());
 await page.locator('#room-list input').uncheck();assert.equal(Number(await area.textContent()),0);
 await page.locator('#room-list input').check();assert.equal(Number(await area.textContent()),measured);
 assert.equal(await page.locator('#handoff').isDisabled(),true);
 assert.equal(await page.evaluate(()=>sessionStorage.length+localStorage.length),0);
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
 await capture(page,{path:out+'/checks/tool-'+width+'.png',fullPage:true});
 const pngRequests=[...requests];
 assert.ok(!pngRequests.some(r=>r.path.includes('pdfjs')));assert.equal(blocked.length,0);assert.equal(errors.length,0,errors.join('\n'));
 await page.locator('#share-consent').check();
 // Inspect the carried fields at the destination before its adapter consumes them.
 await page.addInitScript(()=>{ if(location.pathname==='/contact/')window.__carried=sessionStorage.getItem('oz-floorplan-handoff-v1');});
 await page.locator('#handoff').click();await page.waitForURL('**/contact/**');await page.getByRole('button',{name:'Apply '+measured+' m²',exact:true}).click();
 assert.equal(await page.locator('#area').inputValue(),measured+' m²');
 assert.equal(await page.locator('#product').inputValue(),'Avala');
 const carried=await page.evaluate(()=>JSON.parse(window.__carried)), keys=Object.keys(carried).sort();
 assert.deepEqual(keys,['createdAt','includedRoomCount','method','totalAreaM2','v']);assert.equal(carried.totalAreaM2,measured);
 assert.equal(await page.evaluate(()=>sessionStorage.getItem('oz-floorplan-handoff-v1')),null);
 assert.equal(await page.locator('input[type=file]').evaluateAll(nodes=>nodes.every(n=>n.files.length===0)),true);
 scenarios.push({width,flow:mobile?'touch':'keyboard',area:measured,fileRequests:pngRequests,carriedKeys:keys,formSubmissions:requests.filter(r=>r.method!=='GET').length,toolPageErrors:errors.filter(e=>!e.includes('net::ERR_FAILED')),externalToolRequests:pngRequests.filter(r=>r.host!==new URL(base).host).length});
 await context.close();
}
const ctx=await browser.newContext();await ctx.route('**/*',r=>new URL(r.request().url()).origin===base&&r.request().method()==='GET'?r.continue():r.abort());const page=await ctx.newPage();page.setDefaultTimeout(10000);const pdfErrors=[],requests=[];page.on('pageerror',e=>pdfErrors.push(e.message));page.on('console',m=>{if(m.type()==='error') pdfErrors.push(m.text())});
page.on('request',r=>requests.push([r.method(),r.url()]));await page.goto(base+'/floor-plan/');await page.locator('#plan-file').setInputFiles(path.join(out,'samples/sample-two-page-plan.pdf'));
await page.locator('#raster canvas').waitFor();assert.equal(await page.locator('#page-number option').count(),2);await page.locator('#page-number').selectOption('2');
await page.waitForFunction(()=>document.getElementById('page-number').value==='2' && !document.getElementById('page-number').disabled);
assert.ok(requests.some(([m,url])=>url.endsWith('/pdf.worker.min.mjs')));
assert.ok(!requests.some(([m,url])=>/^https?:/.test(url)&&(m!=='GET'||new URL(url).origin!==base)));
assert.deepEqual(pdfErrors,[]);scenarios.push({flow:'PDF two-page render + local module worker',requests:requests.filter(([,url])=>url.startsWith(base)),errors:pdfErrors});
await ctx.close();
fs.writeFileSync(out+'/checks/browser-flows.json',JSON.stringify(scenarios,null,2));console.log('Browser flow scenarios passed',scenarios.map(s=>[s.width,s.flow,s.area]));
}finally{await browser.close();}
