import {createRequire} from 'node:module';
import fs from 'node:fs';
import assert from 'node:assert/strict';
const {chromium}=createRequire(import.meta.url)('/Users/daibang/.npm/_npx/e41f203b7505f1fb/node_modules/playwright');
const out='docs/seo-growth/evidence/2026-10-28-exact-formats/final',rows=JSON.parse(fs.readFileSync('docs/seo-growth/evidence/2026-10-28-exact-formats/PLAN.json')).rows;
const browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
const results=[];
try{for(const width of [390,1440]){
 const page=await browser.newPage({viewport:{width,height:900}});
 await page.route('**/*',route=>new URL(route.request().url()).hostname==='127.0.0.1'?route.continue():route.abort());
 for(const id of ['avala-coastal-beige','aqua-wood-plus-12mm-blackbutt-p-and-h','aqua-wood-plus-12mm-gold-coast']){
  const row=rows.find(r=>r.id===id),errors=[];page.on('pageerror',e=>errors.push(e.message));
  const response=await page.goto('http://127.0.0.1:8862'+row.route,{waitUntil:'networkidle'});assert.equal(response.status(),200);
  const spec=page.locator('.spec-item').filter({hasText:'Format options'});assert.equal(await spec.count(),1);assert((await spec.innerText()).includes(row.after.formatSummary));
  await spec.scrollIntoViewIfNeeded();assert(await spec.isVisible());
  const size=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,viewport:innerWidth}));assert(size.scroll<=size.viewport,JSON.stringify(size));assert.equal(errors.length,0);
  const screenshot=`${out}/${id}-${width}.png`;await page.screenshot({path:screenshot});results.push({id,width,visible:true,noHorizontalOverflow:true,pageErrors:errors,screenshot});
 }await page.close();
}}finally{await browser.close();}
fs.writeFileSync(out+'/BROWSER.json',JSON.stringify({at:new Date().toISOString(),network:'localhost only; all external requests blocked',results},null,2));console.log(JSON.stringify(results));
