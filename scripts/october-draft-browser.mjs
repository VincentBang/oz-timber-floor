import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const base=process.argv[2];
if(!/^https:\/\/[a-f0-9]{24}--oztimberfloor\.netlify\.app$/.test(base||''))throw new Error('Only an immutable Oz draft is allowed');
const {chromium}=createRequire(import.meta.url)('/Users/daibang/.npm/_npx/e41f203b7505f1fb/node_modules/playwright');
const out='docs/migration-october-2026/browser';fs.mkdirSync(out,{recursive:true});
const report={startedAt:new Date().toISOString(),base,nonGetBlocked:[],flows:[],failures:[]};
const browser=await chromium.launch({headless:true,executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
try{for(const width of [1440,320]){
 const context=await browser.newContext({viewport:{width,height:900}});
 await context.route('**/*',route=>{if(!['GET','HEAD'].includes(route.request().method())){report.nonGetBlocked.push({method:route.request().method(),url:route.request().url()});return route.abort();}return route.continue();});
 const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(base+'/');await page.screenshot({path:path.join(out,`https-home-${width}.png`)});
 if(width===320){await page.locator('.nav-toggle').click();assert.equal(await page.locator('.nav-toggle').getAttribute('aria-expanded'),'true');await page.keyboard.press('Escape');assert.equal(await page.locator('.nav-toggle').getAttribute('aria-expanded'),'false');}
 await page.locator('main a[href="/hybrid/"]').first().click();
 await page.locator('main a[href^="/ranges/"]:not([href="/ranges/"])').filter({visible:true}).first().click();
 await page.locator('main a[href^="/products/"]:not([href="/products/"])').filter({visible:true}).first().click();
 const product=new URL(page.url()).pathname;
 await page.screenshot({path:path.join(out,`https-product-${width}.png`)});
 await page.locator('.product-hero .button-row a[href^="/contact/?"]').first().click();
 await page.waitForFunction(()=>window.OZ_TIMBER_FLOOR_SITE_READY===true);
 const state=await page.locator('form[data-contact-form]').evaluate(f=>{const d=Object.fromEntries(new FormData(f));return {name:f.getAttribute('name'),action:f.getAttribute('action'),product:d.product,range:d.range,category:d.category,enquiry:d.enquiry_type,consent:f.querySelector('[name="consent"]').required,ga4:window.OZ_TIMBER_FLOOR_CONTACT.analytics.ga4MeasurementId,overflow:document.documentElement.scrollWidth>innerWidth,phone:document.querySelector('a[href^="tel:"]')?.getAttribute('href')};});
 assert.equal(state.name,'oz-flooring-enquiry');assert.equal(state.action,'/thank-you/');assert.ok(state.product&&state.range&&state.category&&state.enquiry&&state.consent);assert.equal(state.ga4,null);assert.equal(state.overflow,false);assert.ok(state.phone?.startsWith('tel:'));
 await page.locator('button[type="submit"]').scrollIntoViewIfNeeded();
 await page.waitForFunction(()=>{const e=document.querySelector('form[data-contact-form] button[type="submit"]'),r=e.getBoundingClientRect(),h=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return h===e||e.contains(h);},{},{timeout:5000});
 assert.ok(await page.locator('button[type="submit"]').evaluate(e=>{const r=e.getBoundingClientRect(),h=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return h===e||e.contains(h);}));
 await page.screenshot({path:path.join(out,`https-contact-${width}.png`)});
 assert.equal(errors.length,0);report.flows.push({width,product,...state,errors,submitted:false});await context.close();
}}catch(e){report.failures.push(e.stack);}finally{await browser.close();}
assert.equal(report.nonGetBlocked.length,0,'No non-GET operation should have been attempted');
report.endedAt=new Date().toISOString();report.success=!report.failures.length;fs.writeFileSync(path.join(out,'https-browser.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));if(!report.success)process.exitCode=1;
