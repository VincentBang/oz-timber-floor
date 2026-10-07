import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const {chromium}=createRequire(import.meta.url)('/Users/daibang/.npm/_npx/e41f203b7505f1fb/node_modules/playwright');
const root=process.cwd(),publish=path.join(root,'dist'),out=path.join(root,'docs/migration-october-2026/browser');
fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
const report={startedAt:new Date().toISOString(),mode:'fully intercepted synthetic browser; no provider submissions or analytics traffic',flows:[],captures:[],failures:[]};
try {
for(const width of [1440,320]) {
  const context=await browser.newContext({viewport:{width,height:900}});
  const posts=[],errors=[];
  await context.addInitScript(()=>{window.__events=[];window.gtag=(...args)=>window.__events.push(args);});
  await context.route('**/*',async route=>{
    const req=route.request(),url=new URL(req.url());
    if(url.origin!=='https://oztimberfloor.com.au')return route.abort();
    if(req.method()==='POST') {
      assert.equal(url.pathname,'/thank-you/');
      posts.push(Object.fromEntries(new URLSearchParams(req.postData())));
      return route.fulfill({status:200,contentType:'text/html',body:'Synthetic accepted response - not sent to Netlify'});
    }
    const rel=url.pathname.replace(/^\//,''),file=[rel||'index.html',rel.replace(/\/$/,'')+'/index.html'].find(f=>fs.existsSync(path.join(publish,f))&&fs.statSync(path.join(publish,f)).isFile());
    if(!file)return route.fulfill({status:404,body:'Missing test fixture'});
    let body=fs.readFileSync(path.join(publish,file));
    if(file==='assets/contact-config.js')body=Buffer.from(body.toString().replace('ga4MeasurementId: null','ga4MeasurementId: "G-EWSMKKM9N8"'));
    const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.webp':'image/webp','.jpg':'image/jpeg','.png':'image/png','.svg':'image/svg+xml'};
    return route.fulfill({status:200,contentType:types[path.extname(file)]||'application/octet-stream',body});
  });
  const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
  await page.goto('https://oztimberfloor.com.au/');
  const category=page.locator('main a[href="/hybrid/"]').first();await category.click();
  await page.locator('main a[href^="/ranges/"]:not([href="/ranges/"])').filter({visible:true}).first().click();
  const rangePath=new URL(page.url()).pathname;
  await page.locator('main a[href^="/products/"]:not([href="/products/"])').filter({visible:true}).first().click();
  const productPath=new URL(page.url()).pathname;
  await page.locator('.product-hero .button-row a[href^="/contact/?"]').first().click();
  const prefill=await page.locator('form[data-contact-form]').evaluate(f=>Object.fromEntries(new FormData(f)));
  assert.ok(prefill.product&&prefill.range&&prefill.category&&prefill.enquiry_type,'Selected product context must survive');
  const submit=page.locator('form[data-contact-form] button[type="submit"]');
  await submit.click();assert.equal(posts.length,0,'Invalid form must not submit');
  await page.locator('#name').fill('OZ LOCAL SYNTHETIC QA');
  await page.locator('#email').fill('info@oztimberfloor.com.au');
  await page.locator('#phone').fill('0435496975');
  await page.locator('[name="consent"]').check();
  await submit.scrollIntoViewIfNeeded();
  await page.waitForFunction(()=>{const e=document.querySelector('form[data-contact-form] button[type="submit"]'),r=e.getBoundingClientRect(),h=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return h===e||e.contains(h);},{},{timeout:5000});
  const unobstructed=await submit.evaluate(e=>{const r=e.getBoundingClientRect(),h=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return h===e||e.contains(h);});
  assert.ok(unobstructed,'Submit button must not be covered');
  await submit.click();await page.waitForURL('**/thank-you/');
  assert.equal(posts.length,1);assert.equal(posts[0].product,prefill.product);assert.equal(posts[0].range,prefill.range);assert.equal(posts[0].category,prefill.category);
  const events=await page.evaluate(()=>window.__events);
  assert.equal(events.filter(e=>e[0]==='event'&&e[1]==='quote_submit').length,1);
  assert.ok(!JSON.stringify(events).includes('info@oztimberfloor.com.au')&&!JSON.stringify(events).includes('0435496975'));
  await page.reload();assert.equal(await page.evaluate(()=>window.__events.filter(e=>e[1]==='quote_submit').length),0);
  await page.goto('https://oztimberfloor.com.au/thank-you/?email=private@example.com');
  const direct=await page.evaluate(()=>window.__events);assert.equal(direct.filter(e=>e[1]==='quote_submit').length,0);assert.ok(!JSON.stringify(direct).includes('private@example.com'));
  report.flows.push({width,rangePath,productPath,prefill:{product:prefill.product,range:prefill.range,category:prefill.category,enquiry:prefill.enquiry_type},mockPosts:posts.length,submitUnobstructed:unobstructed,successOnce:true,refreshAndDirectNoSuccess:true,noPii:true,errors});
  const articles=JSON.parse(fs.readFileSync('config/october-article-routes.json'));
  for(const route of [...Object.keys(articles).filter(s=>!articles[s]).map(s=>'/'+s+'/'),'/guides/','/ranges/kronoswiss-aquastop/','/ranges/']) {
    await page.goto('https://oztimberfloor.com.au'+route);
    const state=await page.evaluate(()=>({overflow:document.documentElement.scrollWidth>innerWidth,brokenImages:[...document.images].filter(i=>i.complete&&!i.naturalWidth).map(i=>i.src)}));
    const filename=`${width}-${route.replaceAll('/','_')}.png`;
    await page.screenshot({path:path.join(out,filename),fullPage:true});report.captures.push({route,width,filename,...state});
    assert.equal(state.overflow,false,route+' horizontal overflow');assert.equal(state.brokenImages.length,0);
  }
  assert.equal(errors.length,0);await context.close();
}
}catch(e){report.failures.push(e.stack);}finally{await browser.close();}
report.endedAt=new Date().toISOString();report.success=!report.failures.length;
fs.writeFileSync(path.join(out,'targeted-browser.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));if(!report.success)process.exitCode=1;
