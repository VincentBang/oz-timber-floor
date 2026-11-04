import assert from 'node:assert/strict';
import fs from 'node:fs';
import {base,serve,launch,sample} from './harness.mjs';

const engine=process.env.OZ_BROWSER,server=await serve(),browser=await launch(engine),rows=[];
try {
  for(const mode of ['delayed','failed']) {
    const context=await browser.newContext();
    let release,entered;
    const gate=new Promise(r=>release=r),seen=new Promise(r=>entered=r);
    const requests=[];
    await context.route('**/*',async route=>{
      const request=route.request(),url=new URL(request.url());
      requests.push({method:request.method(),origin:url.origin});
      if(url.origin!==server.origin||request.method()!=='GET')return route.abort();
      if(url.pathname==='/floor-plan/tool.mjs') {
        entered();
        if(mode==='failed')return route.abort();
        await gate;
      }
      return route.continue();
    });
    try {
      const page=await context.newPage();page.setDefaultTimeout(7000);
      await page.goto(server.origin+'/floor-plan/',{waitUntil:'commit'});await seen;
      await page.locator('#plan-file').waitFor();
      assert.equal(await page.locator('#plan-file').isDisabled(),true,'File chooser must not accept a real user selection before handlers exist');
      assert.equal(await page.locator('#tool-readiness').isVisible(),true);
      assert.match(await page.locator('#tool-readiness').textContent(),/continue with an enquiry/);
      if(mode==='delayed') {
        release();
        await page.waitForFunction(()=>!document.querySelector('#plan-file').disabled);
        assert.equal(await page.locator('#tool-readiness').isHidden(),true);
        await page.locator('#plan-file').setInputFiles(sample);
        await page.waitForFunction(()=>document.querySelector('#status').textContent.startsWith('Plan ready'));
        assert.equal(await page.locator('#raster canvas').count(),1);
      } else {
        await page.waitForLoadState('load');
        assert.equal(await page.locator('#plan-file').isDisabled(),true);
        await page.locator('#tool-readiness a').click();
        await page.locator('form[name="oz-flooring-enquiry"]').waitFor();
        assert.equal(await page.locator('[name=consent]').isChecked(),false);
      }
      assert.equal(requests.filter(r=>r.origin!==server.origin||r.method!=='GET').length,0);
      rows.push({mode,pass:true,method:'Deterministic module-response gate; no sleeps or retry masking.'});
    } finally {release();await context.close();}
  }
} finally {
  await browser.close();await server.close();
  fs.writeFileSync(base+'/startup-results.json',JSON.stringify({engine,rows},null,2));
}
console.log(JSON.stringify({engine,rows},null,2));
