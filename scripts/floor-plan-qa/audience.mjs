import fs from 'node:fs';import assert from 'node:assert/strict';
import {launch} from './harness.mjs';
const origin=process.env.OZ_LOCAL_ORIGIN,out=process.env.OZ_LOCAL_EVIDENCE,engine=process.env.OZ_BROWSER;
const browser=await launch(engine),rows=[];
try{
 for(const slug of ['property-manager-flooring','insurance-flooring-repairs'])for(const width of [1280,390,320]){
  const context=await browser.newContext({viewport:{width,height:844},serviceWorkers:'block'}),requests=[],errors=[];
  await context.route('**/*',r=>{const q=r.request(),u=new URL(q.url());requests.push({method:q.method(),origin:u.origin});if(q.method()!=='GET')return r.abort();if(u.origin!==origin)return r.fulfill({status:200,contentType:'text/css',body:''});return r.continue();});
  try{
   const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));await page.goto(origin+'/'+slug+'/',{waitUntil:'networkidle'});
   assert.equal(await page.locator('h1').count(),1);assert.equal(await page.locator('link[rel=canonical]').getAttribute('href'),'https://oztimberfloor.com.au/'+slug+'/');
   assert.equal(await page.locator('body').evaluate(e=>e.classList.contains('editorial')),true);
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
   const faq=page.locator('details.faq-item').first();assert.equal(await faq.evaluate(e=>e.open),false);await faq.locator('summary').click();assert.equal(await faq.evaluate(e=>e.open),true);await faq.locator('summary').focus();await page.keyboard.press('Enter');assert.equal(await faq.evaluate(e=>e.open),false);
   await page.locator('footer').scrollIntoViewIfNeeded();assert.equal(await page.locator('img').evaluateAll(images=>images.filter(i=>i.getClientRects().length).every(i=>i.complete&&i.naturalWidth>0)),true);
   await page.screenshot({path:out+'/checks/'+slug+'-'+width+'.png',fullPage:true,caret:'initial'});
   await page.locator('a[href*="source='+slug+'"]').first().click();await page.locator('#floor-plan-entry').waitFor();
   assert.equal(await page.locator('#enquiryType').inputValue(),'commercial');assert.equal(await page.locator('[name=source_page]').inputValue(),slug);
   assert.equal(await page.locator('[name=consent]').isChecked(),false);assert.equal(await page.locator('input[type=file]').count(),3);
   const tool=new URL(await page.locator('#floor-plan-entry').getAttribute('href'),origin);assert.equal(tool.pathname,'/floor-plan/');assert.equal(tool.searchParams.get('enquiry'),'commercial');assert.equal(tool.searchParams.get('source'),slug);
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);assert.deepEqual(errors,[]);assert.equal(requests.filter(r=>r.method!=='GET').length,0);
   rows.push({slug,width,pass:true,submissions:0,sourcePreserved:true});
  }catch(e){rows.push({slug,width,pass:false,error:e.stack});}finally{await context.close();}
 }
}finally{await browser.close();fs.writeFileSync(out+'/audience-results.json',JSON.stringify(rows,null,2));console.log(JSON.stringify(rows,null,2));if(rows.some(r=>!r.pass))process.exitCode=1;}
