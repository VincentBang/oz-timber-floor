import assert from 'node:assert/strict';
import {before,after,test} from 'node:test';
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
const browsers=createRequire(import.meta.url)(process.env.OZ_PLAYWRIGHT_PATH||'playwright');
const engine=process.env.OZ_BROWSER||'chromium';
assert(['chromium','firefox','webkit'].includes(engine));
const root=new URL('../floor-plan/',import.meta.url);let server,browser,page,origin;const rejected=[];
before(async()=>{
 server=createServer(async(req,res)=>{
  if(req.method!=='GET'){res.writeHead(405).end();return;}
  const url=new URL(req.url,'http://localhost');if(!url.pathname.startsWith('/floor-plan/')){res.writeHead(204).end();return;}
  const file=url.pathname==='/floor-plan/'?new URL('page.template',root):new URL('.'+url.pathname.slice('/floor-plan'.length),root);
  if(!file.href.startsWith(root.href)){res.writeHead(403).end();return;}
  try{res.writeHead(200,{'Content-Type':file.pathname.endsWith('.template')?'text/html':file.pathname.endsWith('.css')?'text/css':'text/javascript'}).end(await readFile(file));}catch{res.writeHead(404).end();}
 });await new Promise(r=>server.listen(0,'127.0.0.1',r));origin='http://127.0.0.1:'+server.address().port;
 browser=await browsers[engine].launch({headless:true,...(engine==='chromium'&&process.env.OZ_CHROME_PATH&&{executablePath:process.env.OZ_CHROME_PATH})});console.log('Keyboard QA browser: '+browser.version());
 const context=await browser.newContext({viewport:{width:390,height:844}});await context.route('**/*',r=>{if(new URL(r.request().url()).origin!==origin||r.request().method()!=='GET'){rejected.push(r.request().method());return r.abort();}return r.continue();});page=await context.newPage();
});
after(async()=>{await browser?.close();if(server?.listening)await new Promise(r=>server.close(r));});
test('keyboard focus moves to an enabled visible control after each disappearing or disabling action',async()=>{
 await page.goto(origin+'/floor-plan/');const bytes=await page.evaluate(async()=>{const c=document.createElement('canvas');c.width=400;c.height=260;c.getContext('2d').fillRect(40,40,200,160);return Array.from(new Uint8Array(await(await new Promise(r=>c.toBlob(r))).arrayBuffer()));});
 await page.locator('#plan-file').setInputFiles({name:'synthetic.png',mimeType:'image/png',buffer:Buffer.from(bytes)});await page.waitForFunction(()=>document.querySelector('#status').textContent.startsWith('Plan ready'));
 async function point(x,y){if(!await page.locator('#coords').evaluate(e=>e.open))await page.locator('#coords summary').click();await page.locator('#point-x').fill(String(x));await page.locator('#point-y').fill(String(y));await page.locator('#add-point').focus();await page.keyboard.press('Enter');}
 async function expectFocus(selector){const value=await page.evaluate(selector=>{const e=document.activeElement,s=getComputedStyle(e);return{matches:e.matches(selector),disabled:!!e.disabled,visible:!!e.getClientRects().length,outline:s.outlineStyle,width:s.outlineWidth};},selector);assert.equal(value.matches,true,selector);assert.equal(value.disabled,false);assert.equal(value.visible,true);assert.notEqual(value.outline,'none');assert.notEqual(value.width,'0px');}
 await point(40,40);await point(240,40);await expectFocus('#known-distance');await page.locator('#known-distance').fill('5');await page.locator('#apply-scale').focus();await page.keyboard.press('Enter');
 await page.locator('#check-scale').focus();await page.keyboard.press('Enter');await point(40,40);await point(40,200);await expectFocus('#stop-check');await page.keyboard.press('Enter');
 for(const [x,y]of [[40,40],[240,40],[240,200],[40,200]])await point(x,y);await page.locator('#finish-room').click();assert.equal(await page.locator('#area-output').textContent(),'20.00');
 await page.getByRole('button',{name:'Edit Room 1',exact:true}).click();await page.locator('#cancel-edit').focus();await page.keyboard.press('Enter');await expectFocus('#room-name');
 await point(40,40);await page.locator('#undo-point').focus();await page.keyboard.press('Enter');await expectFocus('#coords summary');
 await point(40,40);await page.locator('#clear-points').focus();await page.keyboard.press('Enter');await expectFocus('#coords summary');
 assert.equal(await page.locator('#area-output').textContent(),'20.00');assert.deepEqual(rejected,[]);
});
