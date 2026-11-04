import fs from 'node:fs';import assert from 'node:assert/strict';import {createRequire} from 'node:module';
import {launch} from './harness.mjs';
const origin=process.env.OZ_LOCAL_ORIGIN,out=process.env.OZ_LOCAL_EVIDENCE;
const browser=await launch(process.env.OZ_BROWSER);
const capture=async(p,options)=>{if(process.env.OZ_BROWSER!=='webkit')await p.screenshot({...options,caret:'initial'});};
const result={browser:browser.version(),rows:[],requests:[],errors:[],limitations:['Browser emulation only; physical touch devices and screen-reader speech not tested.']};
async function scenario(name,fn,width=390){
 const ctx=await browser.newContext({viewport:{width,height:844},hasTouch:width<=390,serviceWorkers:'block'});
 await ctx.route('**/*',r=>{const req=r.request(),u=new URL(req.url());result.requests.push({scenario:name,method:req.method(),origin:u.origin,path:u.pathname});if(u.origin!==origin)return r.fulfill({status:200,body:'',contentType:'text/plain'});if(req.method()!=='GET')return r.abort();return r.continue();});
 const page=await ctx.newPage();page.setDefaultTimeout(7000);const errors=[];page.on('pageerror',e=>errors.push(e.message));
 try{await fn(page);assert.deepEqual(errors,[]);result.rows.push({name,width,pass:true});}catch(e){result.rows.push({name,width,pass:false,error:e.message});}finally{result.errors.push(...errors);await ctx.close();}
}
const png=out+'/samples/sample-room-5m-by-4m.png';
async function open(p){await p.goto(origin+'/floor-plan/');await p.locator('#plan-file').setInputFiles(png);await p.waitForFunction(()=>document.querySelector('#status').textContent.startsWith('Plan ready'));}
async function point(p,x,y){if(!await p.locator('#coords').evaluate(e=>e.open))await p.locator('#coords summary').click();await p.locator('#point-x').fill(String(x));await p.locator('#point-y').fill(String(y));await p.locator('#add-point').focus();await p.keyboard.press('Enter');}
async function calibrate(p){await point(p,40,40);await point(p,240,40);await p.locator('#known-distance').fill('5');await p.locator('#apply-scale').focus();await p.keyboard.press('Enter');}
async function room(p,name='Synthetic room'){for(const[x,y]of[[40,40],[240,40],[240,200],[40,200]])await point(p,x,y);await p.locator('#room-name').fill(name);await p.locator('#finish-room').focus();await p.keyboard.press('Enter');}
try{
 await scenario('keyboard focus remains usable after scale and save',async p=>{
  await open(p);await calibrate(p);assert.notEqual(await p.evaluate(()=>document.activeElement.tagName),'BODY','scale action must not lose keyboard focus');
  await room(p);assert.equal(await p.locator('#area-output').textContent(),'20.00');assert.notEqual(await p.evaluate(()=>document.activeElement.tagName),'BODY','save must retain focus');
  const focus=await p.evaluate(()=>{const s=getComputedStyle(document.activeElement);return {outline:s.outlineStyle,width:s.outlineWidth}});assert.notEqual(focus.outline,'none');assert.notEqual(focus.width,'0px');
  assert.equal(await p.locator('#status').getAttribute('aria-live'),'polite');await capture(p,{path:out+'/checks/keyboard-review.png',fullPage:true});
  await p.locator('#share-consent').check();await p.locator('#handoff').scrollIntoViewIfNeeded();
  const bounds=await p.evaluate(()=>{const a=document.querySelector('#handoff').getBoundingClientRect(),b=document.querySelector('#status').getBoundingClientRect();return {overlap:a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top};});assert.equal(bounds.overlap,false,'Status must not obstruct enquiry action');
  await capture(p,{path:out+'/checks/desktop-enquiry-action.png'});
 },1280);
 await scenario('room edit cancel exclusion overlap deletion and consent invalidation',async p=>{
  await open(p);await calibrate(p);await room(p);await p.locator('#share-consent').check();
  await p.getByRole('button',{name:'Edit Synthetic room',exact:true}).click();assert.equal(await p.locator('#share-consent').isChecked(),false);
  await p.locator('#room-name').fill('Renamed room');await p.locator('#finish-room').click();assert.match(await p.locator('#room-list').textContent(),/Renamed room/);
  await p.getByRole('button',{name:'Edit Renamed room',exact:true}).click();await p.locator('#clear-points').click();await p.locator('#cancel-edit').click();assert.equal(await p.locator('#area-output').textContent(),'20.00');
  await room(p,'Overlapping room');assert.match(await p.locator('#status').textContent(),/overlaps/);assert.equal(await p.locator('#room-list li').count(),1);await p.locator('#clear-points').click();
  await p.locator('#room-list input').uncheck();assert.equal(await p.locator('#area-output').textContent(),'0.00');await room(p,'Replacement trace');assert.equal(await p.locator('#room-list li').count(),2);
  await p.locator('#room-list input').first().click();assert.equal(await p.locator('#room-list input').first().isChecked(),false);assert.match(await p.locator('#status').textContent(),/overlaps/);
  p.once('dialog',d=>d.dismiss());await p.getByRole('button',{name:'Remove Replacement trace',exact:true}).click();assert.equal(await p.locator('#room-list li').count(),2);
  p.once('dialog',d=>d.accept());await p.getByRole('button',{name:'Remove Replacement trace',exact:true}).click();assert.equal(await p.locator('#room-list li').count(),1);
 });
 await scenario('bad replacement preserves prior work; confirmed plan switch clears all state',async p=>{
  await open(p);await calibrate(p);await room(p);p.once('dialog',d=>d.accept());await p.locator('#plan-file').setInputFiles({name:'damaged.png',mimeType:'image/png',buffer:Buffer.from('bad')});await p.waitForFunction(()=>document.querySelector('#status').classList.contains('error'));
  assert.equal(await p.locator('#area-output').textContent(),'20.00');assert.equal(await p.locator('#room-list li').count(),1);
  p.once('dialog',d=>d.dismiss());await p.locator('#plan-file').setInputFiles(png);assert.equal(await p.locator('#room-list li').count(),1);
  p.once('dialog',d=>d.accept());await p.locator('#plan-file').setInputFiles(png);await p.waitForFunction(()=>document.querySelector('#room-list').children.length===0);assert.equal(await p.locator('#area-output').textContent(),'0.00');assert.equal(await p.locator('#known-distance').inputValue(),'');
 });
 await scenario('PDF page switch confirmation clears dimensions and rooms',async p=>{
  await p.goto(origin+'/floor-plan/');await p.locator('#plan-file').setInputFiles(out+'/samples/sample-two-page-plan.pdf');await p.waitForFunction(()=>document.querySelector('#status').textContent.startsWith('Plan ready'));
  await calibrate(p);for(const[x,y]of[[40,40],[240,40],[240,150],[40,150]])await point(p,x,y);await p.locator('#finish-room').click();
  p.once('dialog',d=>d.dismiss());await p.locator('#page-number').selectOption('2');assert.equal(await p.locator('#page-number').inputValue(),'1');assert.equal(await p.locator('#room-list li').count(),1);
  p.once('dialog',d=>d.accept());await p.locator('#page-number').selectOption('2');await p.waitForFunction(()=>document.querySelector('#page-number').value==='2'&&!document.querySelector('#page-number').disabled&&document.querySelector('#room-list').children.length===0);assert.equal(await p.locator('#known-distance').inputValue(),'');
 });
 await scenario('keyboard-only tab sequence and 200 percent text zoom at 320px',async p=>{
  await open(p);await p.evaluate(()=>document.documentElement.style.fontSize='200%');
  fs.writeFileSync(out+'/zoom-diagnostic.json',JSON.stringify(await p.evaluate(()=>[...document.querySelectorAll('body *')].filter(e=>e.getBoundingClientRect().right>innerWidth+1).map(e=>({tag:e.tagName,id:e.id,width:e.getBoundingClientRect().width,right:e.getBoundingClientRect().right,text:e.textContent.slice(0,50)}))),null,2));
  await capture(p,{path:out+'/checks/zoom-320.png',fullPage:true});
  assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,'No horizontal page overflow at text zoom');
  await p.locator('#plan-file').focus();let visited=[];for(let i=0;i<14;i++){await p.keyboard.press('Tab');visited.push(await p.evaluate(()=>document.activeElement.id||document.activeElement.tagName));}
  assert(visited.includes('known-distance'));assert(visited.includes('distance-unit'));await capture(p,{path:out+'/checks/zoom-320.png',fullPage:true});
 },320);
 if(process.env.OZ_BROWSER==='chromium'){
 await scenario('touch scroll does not add an accidental room corner',async p=>{
  await open(p);await calibrate(p);await p.locator('#overlay').scrollIntoViewIfNeeded();const b=await p.locator('#overlay').boundingBox();
  const cdp=await p.context().newCDPSession(p);await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:b.x+b.width/2,y:b.y+b.height/2}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:b.x+b.width/2,y:Math.max(10,b.y+b.height/2-100)}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  assert.match(await p.locator('#point-count').textContent(),/0 corners/);assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
 },320);
 }else result.limitations.push('Native CDP touch drag is Chromium-only; not run in this engine.');
 await scenario('blocked summary write stays on tool and exposes manual enquiry recovery',async p=>{
  await open(p);await calibrate(p);await room(p);await p.evaluate(()=>Storage.prototype.setItem=function(){throw new DOMException('blocked','SecurityError')});await p.locator('#share-consent').check();await p.locator('#handoff').click();assert(p.url().includes('/floor-plan/'));assert.match(await p.locator('#status').textContent(),/could not be carried across/);
 });
 await scenario('pagehide removes plan pixels measurements and private labels',async p=>{
  await open(p);await calibrate(p);await room(p,'Private test room');await p.evaluate(()=>window.dispatchEvent(new PageTransitionEvent('pagehide')));assert.equal(await p.locator('#raster canvas').count(),0);assert.equal(await p.locator('#room-list li').count(),0);assert.equal(await p.locator('#workspace').isHidden(),true);assert.equal(await p.locator('#room-name').inputValue(),'');
 });
}finally{await browser.close();result.failed=result.rows.filter(x=>!x.pass).length;result.nonGet=result.requests.filter(x=>x.method!=='GET').length;fs.writeFileSync(out+'/extended-results.json',JSON.stringify(result,null,2));console.log(JSON.stringify({browser:result.browser,rows:result.rows,nonGet:result.nonGet},null,2));if(result.failed||result.nonGet)process.exitCode=1;}
