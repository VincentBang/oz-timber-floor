import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {createRequire} from 'node:module';
const {chromium}=createRequire(import.meta.url)(process.env.OZ_PLAYWRIGHT_MODULE||'/Users/daibang/.npm/_npx/e41f203b7505f1fb/node_modules/playwright');
const publish=path.resolve(process.env.OZ_TEST_PACKAGE||'dist');
const out=path.resolve(process.env.OZ_FOLLOWUP_OUTPUT||'docs/migration-october-2026-followup');fs.mkdirSync(out,{recursive:true});
const report={startedAt:new Date().toISOString(),mode:'fully intercepted browser; zero provider submissions, calls, email or GA4 requests',siteSha256:crypto.createHash('sha256').update(fs.readFileSync(publish+'/assets/site.js')).digest('hex'),tests:[],captures:[],failures:[]};
const browser=await chromium.launch({headless:true,executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
const origin='https://oztimberfloor.com.au';
async function fixture(width,host=origin,configured=true){
 const ctx=await browser.newContext({viewport:{width,height:900}}),posts=[],outside=[];
 let mode='success',release;
 await ctx.addInitScript(()=>{window.__events=[];window.gtag=(...args)=>window.__events.push(args);});
 await ctx.route('**/*',async route=>{
  const req=route.request(),u=new URL(req.url());
  if(u.origin!==host){outside.push(u.origin);return route.abort();}
  if(req.method()==='POST'){
   assert.equal(u.pathname,'/thank-you/');posts.push(Object.fromEntries(new URLSearchParams(req.postData())));
   if(mode==='delayed')await new Promise(r=>release=r);
   if(mode==='network-error')return route.abort();
   return route.fulfill({status:mode==='failure'?500:200,contentType:'text/html',body:'Local synthetic response only'});
  }
  const rel=decodeURIComponent(u.pathname).slice(1),file=[rel||'index.html',rel.replace(/\/$/,'')+'/index.html'].find(f=>fs.existsSync(path.join(publish,f))&&fs.statSync(path.join(publish,f)).isFile());
  if(!file)return route.fulfill({status:404,body:'Missing fixture'});
  let body=fs.readFileSync(path.join(publish,file));
  if(configured&&file==='assets/contact-config.js')body=Buffer.from(body.toString().replace('ga4MeasurementId: null','ga4MeasurementId: "G-EWSMKKM9N8"'));
  const type={'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.webp':'image/webp','.jpg':'image/jpeg','.png':'image/png'}[path.extname(file)]||'application/octet-stream';
  return route.fulfill({status:200,contentType:type,body});
 });
 const page=await ctx.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 async function ready(){await page.waitForFunction(()=>window.OZ_TIMBER_FLOOR_SITE_READY);}
 async function go(route){await page.goto(host+route);await ready();}
 async function fill(){await page.locator('#name').fill('PRIVATE SYNTHETIC NAME');await page.locator('#email').fill('private-synthetic@example.invalid');await page.locator('#phone').fill('0400000000');await page.locator('#message').fill('PRIVATE SYNTHETIC ENQUIRY ADDRESS');await page.locator('[name="consent"]').check();}
 async function events(){return page.evaluate(()=>window.__events);}
 async function assertNoLead(){assert.equal((await events()).filter(e=>e[0]==='event'&&e[1]==='quote_submit').length,0);}
 async function submit(){await page.locator('form[data-contact-form] button[type="submit"]').click();}
 return {ctx,page,posts,outside,errors,go,ready,fill,events,assertNoLead,submit,setMode:m=>mode=m,release:()=>release()};
}
try{
for(const width of [1440,320]){
 const f=await fixture(width),{page}=f;
 await f.go('/');await page.locator('main a[href="/hybrid/"]').first().click();await f.ready();
 await page.locator('main a[href^="/ranges/"]:not([href="/ranges/"])').filter({visible:true}).first().click();await f.ready();
 await page.locator('main a[href^="/products/"]:not([href="/products/"])').filter({visible:true}).first().click();await f.ready();
 const productPath=new URL(page.url()).pathname;
 await page.locator('.product-hero .button-row a[href^="/contact/?"]').first().click();await f.ready();
 const original=await page.locator('form').evaluate(e=>Object.fromEntries(new FormData(e)));
 for(const field of ['product','range','category','product_slug','source_page'])assert.ok(original[field],field+' missing');
 await f.submit();assert.equal(f.posts.length,0);await f.assertNoLead();
 await f.fill();await page.locator('#enquiryType').selectOption('supply-install');
 assert.equal(await page.locator('[data-field="property_type"]').isVisible(),true);
 await page.locator('#enquiryType').selectOption('supply-only');
 assert.equal(await page.locator('[data-field="property_type"]').isVisible(),false);
 // Changing a CTA or select must keep the original product source.
 await page.locator('[data-set-enquiry="supply-install"]').first().click();
 const before=await page.locator('form').evaluate(e=>Object.fromEntries(new FormData(e)));
 assert.equal(before.source_page,original.source_page);
 f.setMode('delayed');await f.submit();await page.waitForFunction(()=>document.querySelector('form').getAttribute('aria-busy')==='true');
 // Simulate repeated submit events while the first POST remains in flight.
 await page.locator('form').evaluate(e=>{e.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true}));e.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true}));});
 assert.equal(f.posts.length,1);f.release();await page.waitForURL('**/thank-you/');await f.ready();
 for(const k of ['product','range','category','product_slug','source_page'])assert.equal(f.posts[0][k],original[k]);
 assert.equal(f.posts[0].enquiry_type,'supply-install');assert.equal(f.posts[0].consent,'on');
 assert.match(f.posts[0].current_page_url,/enquiry=supply-install/);
 let events=await f.events();assert.equal(events.filter(e=>e[1]==='quote_submit').length,1);
 assert.equal(events.filter(e=>e[1]==='Contact_Form').length,0,'Do not dual-fire completed leads');
 assert.doesNotMatch(JSON.stringify(events),/PRIVATE|private-synthetic|0400000000/);
 assert.equal(events.filter(e=>e[0]==='config').length,1,'One intended GA4 automatic pageview configuration');
 await page.reload();await f.ready();await f.assertNoLead();
 await f.go('/thank-you/?email=private-synthetic@example.invalid#PRIVATE');await f.assertNoLead();
 assert.doesNotMatch(JSON.stringify(await f.events()),/PRIVATE|private-synthetic/);
 report.tests.push({width,case:'product journey, selection, payload, validation, repeated clicks, once-only success, refresh, direct visit, PII',passed:true,productPath,posts:f.posts.length});
 for(const mode of ['failure','network-error']){
  await f.go('/contact/');await f.fill();f.setMode(mode);await f.submit();await page.locator('[data-submit-error]').waitFor();
  assert.equal(new URL(page.url()).pathname,'/contact/');assert.equal(await page.locator('button[type="submit"]').isDisabled(),false);await f.assertNoLead();
  assert.equal(await page.evaluate(()=>sessionStorage.getItem('oz-pending-quote-submit')),null);
  await f.go('/thank-you/');await f.assertNoLead();report.tests.push({width,case:mode+' produces no completed lead or stale marker',passed:true});
 }
 f.setMode('success');await f.go('/floor-levelling/');
 await page.locator('main a[href^="/contact/?"]').first().click();await f.ready();await f.fill();
 const service=await page.locator('form').evaluate(e=>Object.fromEntries(new FormData(e)));
 assert.equal(service.enquiry_type,'service');assert.ok(/levell/i.test(service.service_type));
 await f.submit();await page.waitForURL('**/thank-you/');await f.ready();assert.equal(f.posts.at(-1).service_type,service.service_type);assert.equal(f.posts.at(-1).source_page,service.source_page);
 assert.equal((await f.events()).filter(e=>e[1]==='quote_submit').length,1);
 report.tests.push({width,case:'floor levelling service payload and accepted submission',passed:true});
 await f.go('/contact/');await f.fill();await page.locator('#enquiryType').selectOption('supply-only');await f.submit();await page.waitForURL('**/thank-you/');await f.ready();
 assert.equal(f.posts.at(-1).enquiry_type,'supply-only');assert.equal((await f.events()).filter(e=>e[1]==='quote_submit').length,1);
 report.tests.push({width,case:'direct contact supply-only accepted submission',passed:true});
 await f.go('/contact/');
 for(const [scheme,name] of [['tel:','phone_click'],['mailto:','email_click']]){
  await page.locator(`a[href^="${scheme}"]`).first().evaluate(e=>{e.addEventListener('click',event=>event.preventDefault(),{once:true});e.click();});
  assert.equal((await f.events()).filter(e=>e[1]===name).length,1);await f.assertNoLead();
 }
 report.tests.push({width,case:'phone/email click events without calls or messages, no completed lead',passed:true});
 for(const [route,thickness] of [
  ['/ranges/swish-laminate/','12mm'],['/products/swish-laminate-eggshell/','12mm'],
  ['/ranges/swish-oak-contemporary/','14/2mm'],['/products/swish-oak-contemporary-elegant-natural-oak/','14/2mm'],
  ['/ranges/swish-oak-natura-handcrafted/','14/3mm'],['/products/swish-oak-natura-handcrafted-misty-quartz/','14/3mm']
 ]){
  await f.go(route);assert.equal(await page.locator('.spec-item').filter({has:page.locator('span',{hasText:/^Thickness$/})}).locator('strong').textContent(),thickness);
  await page.evaluate(async()=>{document.documentElement.style.scrollBehavior='auto';for(let y=0;y<document.documentElement.scrollHeight;y+=innerHeight){scrollTo(0,y);await new Promise(r=>setTimeout(r,20));}scrollTo(0,0);});
  const state=await page.evaluate(()=>({overflow:document.documentElement.scrollWidth>innerWidth,broken:[...document.images].filter(i=>i.complete&&!i.naturalWidth).map(i=>i.getAttribute('src'))}));assert.equal(state.overflow,false);assert.equal(state.broken.length,0);
  const file=`${width}-${route.replaceAll('/','_')}.png`;fs.mkdirSync(out+'/screenshots',{recursive:true});await page.screenshot({path:out+'/screenshots/'+file,fullPage:true});report.captures.push({route,width,file,thickness,...state});
 }
 assert.equal(f.errors.length,0);await f.ctx.close();
}
for(const host of ['https://oztimberfloor.netlify.app','https://draft--oztimberfloor.netlify.app','http://localhost']){
 const f=await fixture(390,host);await f.go('/contact/?email=private-synthetic@example.invalid');await f.fill();await f.submit();await f.page.waitForURL('**/thank-you/');await f.ready();
 assert.equal((await f.events()).length,0);assert.equal(f.outside.filter(h=>/google-analytics|googletagmanager/.test(h)).length,0,'No external GA4 loader request even with an injected valid ID');
 report.tests.push({case:'preview collector and loader suppressed',host,passed:true,otherBlockedOrigins:[...new Set(f.outside)]});await f.ctx.close();
}
{
 const f=await fixture(390,origin,false);await f.go('/contact/');await f.fill();await f.submit();await f.page.waitForURL('**/thank-you/');await f.ready();
 assert.equal((await f.events()).length,0,'Null production build configuration must suppress a pre-existing collector');
 report.tests.push({case:'disabled production environment suppresses existing collector',passed:true});await f.ctx.close();
}
}catch(e){report.failures.push(e.stack);}finally{await browser.close();}
report.success=!report.failures.length;report.endedAt=new Date().toISOString();fs.writeFileSync(path.join(out,'enquiry-regression.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));if(!report.success)process.exitCode=1;
