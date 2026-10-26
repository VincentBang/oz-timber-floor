import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const {chromium}=createRequire(import.meta.url)(process.env.OZ_PLAYWRIGHT_MODULE||'/Users/daibang/.npm/_npx/e41f203b7505f1fb/node_modules/playwright');
const out='docs/migration-october-2026-final-repairs/browser';fs.mkdirSync(out,{recursive:true});
const routes=['/engineered-timber-flooring/','/laminate/','/hybrid/','/commercial-flooring/','/timber-floor-installation/',...['de-marque-oak','elk-falls','fiddleback','prestige-oak','pronto','select-australian-timber'].map(x=>'/ranges/'+x+'/')];
const report={at:new Date().toISOString(),mode:'intercepted GET-only local public package; existing public Google font GETs allowed, all other external requests and submissions blocked',captures:[],failures:[]};
const browser=await chromium.launch({headless:true,executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
try{for(const width of [1440,390,320]){
 const ctx=await browser.newContext({viewport:{width,height:900}});const page=await ctx.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await ctx.route('**/*',async route=>{const req=route.request(),url=new URL(req.url());if(req.method()!=='GET')return route.abort();
 if(['fonts.googleapis.com','fonts.gstatic.com'].includes(url.hostname))return route.continue();
 if(url.origin!=='https://oztimberfloor.netlify.app')return route.abort();
 const rel=decodeURIComponent(url.pathname).slice(1);const file=path.join('dist',rel.endsWith('/')?rel+'index.html':rel||'index.html');if(!fs.existsSync(file))return route.fulfill({status:404,body:'Missing fixture'});
 const type={'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.webp':'image/webp','.jpg':'image/jpeg','.png':'image/png'}[path.extname(file)]||'application/octet-stream';await route.fulfill({status:200,contentType:type,body:fs.readFileSync(file)});
 });
 for(const route of routes){await page.goto('https://oztimberfloor.netlify.app'+route);await page.waitForFunction(()=>window.OZ_TIMBER_FLOOR_SITE_READY);
 await page.evaluate(async()=>{document.documentElement.style.scrollBehavior='auto';for(let y=0;y<document.documentElement.scrollHeight;y+=innerHeight){scrollTo(0,y);await new Promise(r=>setTimeout(r,30));}await Promise.all([...document.images].map(i=>i.decode().catch(()=>{})));scrollTo(0,0);});
 const state=await page.evaluate(()=>({overflow:document.documentElement.scrollWidth>innerWidth,broken:[...document.images].filter(x=>!x.naturalWidth).map(x=>x.src),h1:document.querySelectorAll('h1').length}));assert.equal(state.overflow,false,route);assert.equal(state.broken.length,0,route);assert.equal(state.h1,1);assert.equal(errors.length,0,errors.join('\n'));
 const name=width+'-'+route.replaceAll('/','_');await page.screenshot({path:out+'/'+name+'-top.png'});
 const changed=page.locator('#compare-hybrid-construction,#compare-laminate-construction,#commercial-timber');
 if(await changed.count()){
  await changed.screenshot({path:out+'/'+name+'-content.png'});
  await page.evaluate(()=>scrollTo(0,0));await page.screenshot({path:out+'/'+name+'-full.png',fullPage:true});
 }
 const card=page.locator('a.range-summary-card[href="/ranges/hardwood-collection/"],a.range-summary-card[href="/ranges/kronoswiss-aquastop/"]').first();
 if(await card.count())await card.screenshot({path:out+'/'+name+'-card.png'});
 report.captures.push({route,width,...state,base:name});
 }await ctx.close();
}}catch(e){report.failures.push(e.stack);}finally{await browser.close();}
fs.writeFileSync(out+'/result.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({cells:report.captures.length,failures:report.failures}));if(report.failures.length)process.exitCode=1;
