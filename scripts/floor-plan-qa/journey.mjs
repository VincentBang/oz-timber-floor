import assert from 'node:assert/strict';
import fs from 'node:fs';
import {launch, point, sample} from './harness.mjs';

const origin = process.env.OZ_LOCAL_ORIGIN;
const out = process.env.OZ_LOCAL_EVIDENCE;
const browser = await launch(process.env.OZ_BROWSER);
const rows = [];
try {
  for (const [route, width] of [['/products/avala-blackbutt/',1280],['/ranges/avala/',390]]) {
    const context = await browser.newContext({viewport:{width,height:844},serviceWorkers:'block'});
    const requests = [], errors = [];
    await context.route('**/*', request => {
      const req = request.request(), url = new URL(req.url());
      requests.push({url:req.url(),method:req.method(),body:req.postData()});
      if (req.method() !== 'GET') return request.abort();
      if (url.origin !== origin) return request.fulfill({status:200,body:'',contentType:url.hostname==='fonts.googleapis.com'?'text/css':'text/plain'});
      return request.continue();
    });
    context.on('page', page => page.on('pageerror', error => errors.push(error.message)));
    try {
      const page = await context.newPage();
      await page.goto(origin + route, {waitUntil:'networkidle'});
      const enquiry = page.locator('a[href*="/contact/?enquiry=supply-install"][href*="range=Avala"]').first();
      const expected = new URL(await enquiry.getAttribute('href'), origin).searchParams;
      // On mobile this existing CTA lives in a collapsed preparation section.
      // Exercise its real disclosure; never force-click a hidden control.
      if (!await enquiry.isVisible()) {
        const disclosure = enquiry.locator('xpath=ancestor::details[1]');
        assert.equal(await disclosure.count(),1);
        await disclosure.locator('summary').first().click();
        assert.equal(await enquiry.isVisible(),true);
      }
      await enquiry.click();
      await page.locator('#floor-plan-entry').waitFor();
      assert.equal(await page.locator('#enquiryType').inputValue(),'supply-install');
      // Leave unsent personal details in the original tab; they must not travel.
      await page.locator('#email').fill('private-session@example.invalid');
      await page.locator('#message').fill('Private unsent note');
      await page.locator('#floor_plan').setInputFiles({name:'private-original.png',mimeType:'image/png',buffer:fs.readFileSync(sample)});
      const original = await page.locator('form[name="oz-flooring-enquiry"]').evaluate(form => ({
        fields:Object.fromEntries([...form.elements].filter(e=>e.name&&e.type!=='file').map(e=>[e.name,e.value])),
        files:[...form.querySelectorAll('input[type=file]')].map(e=>[e.name,e.files.length]),
      }));
      if (process.env.OZ_BROWSER !== 'webkit') await page.screenshot({path:out+'/checks/contact-entry-'+width+'.png',fullPage:true,caret:'initial'});
      const opened = context.waitForEvent('page');
      await page.locator('#floor-plan-entry').click();
      const tool = await opened;
      await tool.locator('#plan-file').waitFor();
      await tool.waitForFunction(()=>!document.querySelector('#plan-file').disabled);
      assert.equal(await tool.evaluate(()=>window.opener),null);
      assert.ok(page.url().includes('/contact/'),'Original enquiry tab remains open');
      const entered = new URL(tool.url()).searchParams;
      for (const field of ['product','range','productSlug','category','source']) {
        if(expected.has(field)) assert.equal(entered.get(field),expected.get(field),field);
      }
      await tool.locator('#plan-file').setInputFiles(sample);
      await tool.waitForFunction(()=>document.querySelector('#status').textContent.startsWith('Plan ready'));
      await point(tool,40,40); await point(tool,240,40);
      await tool.locator('#known-distance').fill('5');
      await tool.locator('#apply-scale').click();
      for(const [x,y] of [[40,40],[240,40],[240,200],[40,200]]) await point(tool,x,y);
      await tool.locator('#room-name').fill('Private room label');
      await tool.locator('#finish-room').click();
      assert.equal(await tool.locator('#handoff').isDisabled(),true);
      assert.equal(await tool.evaluate(()=>sessionStorage.length),0);
      await tool.locator('#share-consent').check();
      await tool.addInitScript(()=>{
        if(location.pathname==='/contact/') window.__carried=sessionStorage.getItem('oz-floorplan-handoff-v1');
      });
      await tool.locator('#handoff').click();
      await tool.getByRole('button',{name:'Apply 20 m²',exact:true}).click();
      assert.equal(await tool.locator('#area').inputValue(),'20 m²');
      for (const [query,field] of [['product','product'],['range','range'],['productSlug','product_slug'],['category','category_interest'],['source','source_page']]) {
        if(expected.has(query)) assert.equal(await tool.locator('[name="'+field+'"]').inputValue(),expected.get(query),field);
      }
      const carried = await tool.evaluate(()=>JSON.parse(window.__carried));
      assert.deepEqual(Object.keys(carried).sort(),['createdAt','includedRoomCount','method','totalAreaM2','v']);
      assert.equal(await tool.locator('[name=consent]').isChecked(),false);
      assert.equal(await tool.locator('#email').inputValue(),'');
      assert.equal(await tool.locator('input[type=file]').evaluateAll(fields=>fields.every(f=>!f.files.length)),true);
      assert.equal(await tool.locator('form').first().getAttribute('action'),'/thank-you/');
      assert.deepEqual(await page.locator('form[name="oz-flooring-enquiry"]').evaluate(form => ({
        fields:Object.fromEntries([...form.elements].filter(e=>e.name&&e.type!=='file').map(e=>[e.name,e.value])),
        files:[...form.querySelectorAll('input[type=file]')].map(e=>[e.name,e.files.length]),
      })),original);
      assert.deepEqual(errors,[]);
      assert.equal(requests.filter(r=>r.method!=='GET').length,0);
      assert.ok(!JSON.stringify(requests).includes('Private room label'));
      assert.ok(!JSON.stringify(requests).includes('private-original'));
      assert.ok(!JSON.stringify(requests).includes('private-session'));
      rows.push({route,width,pass:true,carriedKeys:Object.keys(carried),requests:requests.length,nonGet:0,originalTabPreserved:true});
    } catch(error) {
      rows.push({route,width,pass:false,error:error.stack});
    } finally { await context.close(); }
  }
} finally {
  await browser.close();
  fs.writeFileSync(out+'/journey-results.json',JSON.stringify(rows,null,2));
  console.log(JSON.stringify(rows,null,2));
  if(rows.some(row=>!row.pass)) process.exitCode=1;
}
