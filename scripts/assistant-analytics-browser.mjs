import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const {chromium}=createRequire(import.meta.url)(process.env.OZ_PLAYWRIGHT_MODULE||'playwright'),origin='https://oztimberfloor.com.au',local='http://127.0.0.1:8840',rows=[];
const b=await chromium.launch({headless:true,executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
for(const consent of ['accepted','rejected','unset']){
 const c=await b.newContext();await c.addInitScript(value=>{if(value!=='unset')localStorage.setItem('oz-analytics-consent-v1',value);window.__mockEvents=[];window.gtag=(...args)=>window.__mockEvents.push(args);},consent);
 await c.route('**/*',async r=>{const u=new URL(r.request().url());if(u.origin!==origin||r.request().method()!=='GET')return r.abort();if(u.pathname==='/assets/contact-config.js'){const source=fs.readFileSync('assets/contact-config.js','utf8').replace(/ga4MeasurementId:\s*null/,'ga4MeasurementId: "G-EWSMKKM9N8"');return r.fulfill({contentType:'text/javascript',body:source});}const response=await fetch(local+u.pathname);return r.fulfill({status:response.status,contentType:response.headers.get('content-type'),body:Buffer.from(await response.arrayBuffer())});});
 const p=await c.newPage();await p.goto(origin+'/?email=not-for-analytics@example.test');await p.waitForFunction(()=>window.OZ_TIMBER_FLOOR_SITE_READY);
 const events=await p.evaluate(()=>{window.__mockEvents=[];for(const detail of [{name:'assistant_open',reason:'open',question:'private@example.test'},{name:'assistant_handoff',reason:'review',sessionToken:'private-token'},{name:'quote_submit',reason:'review'},{name:'assistant_feedback',reason:'private@example.test'}])document.dispatchEvent(new CustomEvent('oz:assistant-event',{detail}));return window.__mockEvents.filter(e=>e[0]==='event');});
 assert.equal(events.length,consent==='accepted'?2:0);assert(!/private@|private-token|quote_submit|not-for-analytics/.test(JSON.stringify(events)));rows.push({consent,events,pass:true});await c.close();
}
await b.close();fs.writeFileSync('docs/flooring-assistant/evidence/ANALYTICS_BROWSER.json',JSON.stringify({success:true,rows,productionOrigin:'all GETs intercepted to loopback; all foreign requests aborted',realAnalyticsSent:0},null,2));console.log(JSON.stringify({success:true,scenarios:rows.length,realAnalyticsSent:0}));
