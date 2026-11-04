// Gap-only investigation. Does not repeat the orientation/stress/startup suites.
import fs from 'node:fs';import assert from 'node:assert/strict';import crypto from 'node:crypto';import {createRequire} from 'node:module';
import {base,root,serve,launch} from './harness.mjs';import {fixtures} from './fixtures.mjs';
const sharp=createRequire(import.meta.url)(process.env.OZ_SHARP_PATH||'sharp'),engine=process.env.OZ_BROWSER,rows=[];
fs.mkdirSync(base,{recursive:true});if(['jpeg-recovery-results.json','fixtures.json'].some(name=>fs.existsSync(base+'/'+name)))throw Error('Use a fresh JPEG evidence directory; prior results must not be overwritten');
fs.mkdirSync(base+'/fixtures',{recursive:true});fixtures(base+'/samples');
const cases=[];
for(const [name,width,height,space]of [['gray',120,80,'b-w'],['cmyk-profiled',120,80,'cmyk'],['scaled',5000,2500,'srgb']]){
 let image=sharp({create:{width,height,channels:3,background:{r:200,g:30,b:20}}}).toColourspace(space);
 // An untagged CMYK file has no shared colour-conversion reference. Bind this
 // cross-decoder accuracy check to an embedded profile, not assumed defaults.
 if(space==='cmyk')image=image.withIccProfile('cmyk');
 const bytes=await image.jpeg({quality:98}).toBuffer();fs.writeFileSync(base+'/fixtures/'+name+'.jpg',bytes);
 if(space==='cmyk')fs.writeFileSync(base+'/fixtures/cmyk-rgb.jpg',await sharp(bytes).toColourspace('srgb').jpeg({quality:98}).toBuffer());
 const expected=await sharp(bytes).toColourspace('srgb').ensureAlpha().raw().toBuffer({resolveWithObject:true});
 cases.push({name,width,height,pixel:[...expected.data.subarray(0,4)],sha256:crypto.createHash('sha256').update(bytes).digest('hex')});
}fs.writeFileSync(base+'/fixtures.json',JSON.stringify(cases,null,2));
const server=await serve(),browser=await launch(engine);const context=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'block'}),requests=[],errors=[];
await context.route('**/*',r=>{const q=r.request(),u=new URL(q.url());requests.push({method:q.method(),origin:u.origin});return q.method()==='GET'&&u.origin===server.origin?r.continue():r.abort();});
const page=await context.newPage();page.setDefaultTimeout(10000);page.on('pageerror',e=>errors.push(e.message));
async function check(name,fn){if(process.env.OZ_JPEG_CASES&&!process.env.OZ_JPEG_CASES.split(',').some(prefix=>name.startsWith(prefix))){rows.push({name,notRun:'Excluded from focused regression selection'});return;}try{const detail=await fn();rows.push({name,pass:true,detail});}catch(e){rows.push({name,pass:false,error:e.stack});}}
try{
 await page.goto(server.origin+'/floor-plan/');await page.locator('#plan-file').waitFor();await page.waitForFunction(()=>!document.querySelector('#plan-file').disabled);
 for(const f of cases)await check(f.name+' JPEG: independent decoder, bounded raster and native fallback',async()=>{
  if(f.name==='cmyk-profiled'){
   const result=await page.evaluate(async()=>{
    const {loadPlan}=await import('/floor-plan/plan-loader.mjs'),file=new File([await(await fetch('/fixtures/cmyk-profiled.jpg')).blob()],'print.jpg',{type:'image/jpeg'}),original=window.createImageBitmap,create=URL.createObjectURL;let calls=0,urls=0,message;
    try{window.createImageBitmap=async(...a)=>{calls++;return original(...a);};URL.createObjectURL=(...a)=>{urls++;return create.apply(URL,a);};try{await loadPlan(file);}catch(e){message=e.message;}}finally{window.createImageBitmap=original;URL.createObjectURL=create;}
    const recovered=await loadPlan(new File([await(await fetch('/fixtures/cmyk-rgb.jpg')).blob()],'print.jpg',{type:'image/jpeg'}));return{message,calls,urls,size:[recovered.canvas.width,recovered.canvas.height],pixel:[...recovered.canvas.getContext('2d').getImageData(10,10,1,1).data]};
   });
   const converted=await sharp(fs.readFileSync(base+'/fixtures/cmyk-rgb.jpg')).ensureAlpha().raw().toBuffer();assert.match(result.message,/CMYK.*RGB\/sRGB JPG or PNG/);assert.equal(result.calls,0);assert.equal(result.urls,0);assert.deepEqual(result.size,[120,80]);assert(result.pixel.every((v,i)=>Math.abs(v-converted[i])<=8));return result;
  }
  const values=await page.evaluate(async f=>{
   const {loadPlan}=await import('/floor-plan/plan-loader.mjs'),bytes=await(await fetch('/fixtures/'+f.name+'.jpg')).arrayBuffer(),file=new File([bytes],f.name+'.jpg',{type:'image/jpeg'}),original=createImageBitmap,values=[];
   try{for(const native of [false,true]){if(native)window.createImageBitmap=undefined;const {canvas}=await loadPlan(file);values.push({native,size:[canvas.width,canvas.height],pixel:[...canvas.getContext('2d').getImageData(10,10,1,1).data]});canvas.width=canvas.height=0;}}finally{window.createImageBitmap=original;}return values;
  },f);
  fs.writeFileSync(base+'/'+f.name+'-pixels.json',JSON.stringify({fixture:f,values},null,2));
  for(const r of values){assert(r.size[0]*r.size[1]<=8e6&&Math.max(...r.size)<=4096);assert(Math.abs(r.size[0]/r.size[1]-f.width/f.height)<.001);assert(r.pixel.every((v,i)=>Math.abs(v-f.pixel[i])<=8),JSON.stringify({expected:f.pixel,actual:r.pixel}));}return values;
 });
 for(const mode of ['bitmap','native'])await check(mode+' decoder deadline: late completion cannot publish; recover same file',async()=>{
  const detail=await page.evaluate(async mode=>{
   const {loadPlan}=await import('/floor-plan/plan-loader.mjs'),file=new File([await(await fetch('/fixtures/gray.jpg')).blob()],'gray.jpg',{type:'image/jpeg'});
   const bitmap=window.createImageBitmap,decode=HTMLImageElement.prototype.decode,timer=window.setTimeout,create=URL.createObjectURL,revoke=URL.revokeObjectURL;
   let deadline,enter,release,closed=0,created=0,revoked=0,draws=0,lateDone;const entered=new Promise(r=>enter=r),gate=new Promise(r=>release=r),done=new Promise(r=>lateDone=r);const draw=CanvasRenderingContext2D.prototype.drawImage;
   try{
    window.setTimeout=(fn,ms,...args)=>ms===30000?(deadline=()=>fn(...args),-1):timer(fn,ms,...args);
    CanvasRenderingContext2D.prototype.drawImage=function(...args){draws++;return draw.apply(this,args);};
    URL.createObjectURL=(...a)=>{created++;return create.apply(URL,a);};URL.revokeObjectURL=(...a)=>{revoked++;return revoke.apply(URL,a);};
    if(mode==='bitmap')window.createImageBitmap=async(...a)=>{const b=await bitmap(...a),close=b.close.bind(b);b.close=()=>{closed++;close();lateDone();};enter();await gate;return b;};
    else{window.createImageBitmap=undefined;HTMLImageElement.prototype.decode=async function(){await decode.call(this);enter();await gate;lateDone();};}
    const pending=loadPlan(file);await entered;deadline();let message;try{await pending;}catch(e){message=e.message;}release();await done;await Promise.resolve();await Promise.resolve();
    const timed={message,closed,created,revoked,draws};window.createImageBitmap=bitmap;HTMLImageElement.prototype.decode=decode;window.setTimeout=timer;
    const next=await loadPlan(file);return{...timed,recovery:[...next.canvas.getContext('2d').getImageData(10,10,1,1).data]};
   }finally{window.createImageBitmap=bitmap;HTMLImageElement.prototype.decode=decode;window.setTimeout=timer;URL.createObjectURL=create;URL.revokeObjectURL=revoke;CanvasRenderingContext2D.prototype.drawImage=draw;}
  },mode);
  assert.match(detail.message,/too long/);assert.equal(detail.draws,0);assert.equal(detail.closed,mode==='bitmap'?1:0);assert.equal(detail.created,mode==='native'?1:0);assert.equal(detail.revoked,detail.created);assert(detail.recovery.every((v,i)=>Math.abs(v-cases[0].pixel[i])<=8));return detail;
 });
 for(const failure of ['context','draw'])await check(failure+' allocation failure: zero abandoned canvas and recover',async()=>{
  const detail=await page.evaluate(async failure=>{
   const {loadPlan}=await import('/floor-plan/plan-loader.mjs'),file=new File([await(await fetch('/fixtures/gray.jpg')).blob()],'gray.jpg',{type:'image/jpeg'}),create=document.createElement.bind(document),get=HTMLCanvasElement.prototype.getContext,draw=CanvasRenderingContext2D.prototype.drawImage;const allocated=[];
   try{document.createElement=function(tag,...a){const el=create(tag,...a);if(tag==='canvas')allocated.push(el);return el;};if(failure==='context')HTMLCanvasElement.prototype.getContext=()=>null;else CanvasRenderingContext2D.prototype.drawImage=()=>{throw new DOMException('Synthetic raster allocation failure','InvalidStateError');};let message;try{await loadPlan(file);}catch(e){message=e.message;}return{message,sizes:allocated.map(c=>[c.width,c.height])};}
   finally{document.createElement=create;HTMLCanvasElement.prototype.getContext=get;CanvasRenderingContext2D.prototype.drawImage=draw;}
  },failure);
  const recovery=await page.evaluate(async()=>{const {loadPlan}=await import('/floor-plan/plan-loader.mjs'),result=await loadPlan(new File([await(await fetch('/fixtures/gray.jpg')).blob()],'gray.jpg',{type:'image/jpeg'}));return [...result.canvas.getContext('2d').getImageData(10,10,1,1).data];});
  assert(detail.message);assert.equal(detail.sizes.length,1);assert.deepEqual(detail.sizes,[[0,0]]);assert(recovery.every((v,i)=>Math.abs(v-cases[0].pixel[i])<=8));return{...detail,recovery};
 });
 await check('UI PDF to rejected JPEG to same JPEG recovery: retained plan explicit, consent clear, no submission',async()=>{
  await page.locator('#plan-file').setInputFiles(base+'/samples/sample-two-page-plan.pdf');await page.waitForFunction(()=>document.querySelector('#status').textContent.startsWith('Plan ready'));
  const old=await page.locator('#raster canvas').evaluate(c=>({width:c.width,height:c.height,pixel:[...c.getContext('2d').getImageData(0,0,1,1).data]}));
  await page.evaluate(()=>{window.__bitmap=createImageBitmap;window.__decode=HTMLImageElement.prototype.decode;window.createImageBitmap=async()=>{throw Error('Synthetic decoder failure');};HTMLImageElement.prototype.decode=async()=>{throw Error('Synthetic native decoder failure');};});
  await page.locator('#plan-file').setInputFiles(base+'/fixtures/gray.jpg');await page.waitForFunction(()=>document.querySelector('#status').classList.contains('error'));
  const message=await page.locator('#status').innerText(),retained=await page.locator('#raster canvas').evaluate(c=>({width:c.width,height:c.height,pixel:[...c.getContext('2d').getImageData(0,0,1,1).data]}));
  await page.screenshot({path:base+'/replacement-error.png',fullPage:true});
  await page.evaluate(()=>{window.createImageBitmap=window.__bitmap;HTMLImageElement.prototype.decode=window.__decode;});
  await page.locator('#plan-file').setInputFiles(base+'/fixtures/gray.jpg');await page.waitForFunction(()=>document.querySelector('#status').textContent.startsWith('Plan ready'));
  const size=await page.locator('#raster canvas').evaluate(c=>[c.width,c.height]);assert.deepEqual(size,[120,80]);assert.deepEqual(retained,old);assert.equal(await page.locator('#share-consent').isChecked(),false);assert.equal(await page.locator('#handoff').isDisabled(),true);assert.equal(await page.locator('#plan-file').inputValue(),'');assert.match(message,/previous plan.*still displayed/i);
  await page.screenshot({path:base+'/replacement-recovered.png',fullPage:true});return{message,retained,size};
 });
 await check('no application errors or outbound requests/submissions',async()=>{assert.deepEqual(errors,[]);assert.equal(requests.filter(r=>r.method!=='GET'||r.origin!==server.origin).length,0);return{requests:requests.length,submissions:0};});
}finally{await browser.close();await server.close();fs.writeFileSync(base+'/jpeg-recovery-results.json',JSON.stringify({engine,browser:browser.version(),rows},null,2));}
console.log(JSON.stringify({engine,passed:rows.filter(r=>r.pass).length,notRun:rows.filter(r=>r.notRun).length,failed:rows.filter(r=>r.pass===false)},null,2));if(rows.some(r=>r.pass===false)||!rows.some(r=>r.pass===true))process.exitCode=1;
