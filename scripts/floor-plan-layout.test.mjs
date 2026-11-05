import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {parse} from 'parse5';
import {renderFloorPlanPage,floorPlanThemeCSS} from './floor-plan-site-shell.mjs';
const root=new URL('../',import.meta.url).pathname,template=fs.readFileSync(root+'floor-plan/page.template','utf8'),all=n=>[n,...(n.childNodes||[]).flatMap(all)],attr=(n,k)=>n.attrs?.find(a=>a.name===k)?.value||'',nodes=all(parse(template));
test('one workflow precedes the workspace and secondary help follows it in DOM order',()=>{
 const order=['floorplanHero','floorplanGuideSection','measurementTool','floorplanEntrySection','floorplanFaq'].map(id=>template.indexOf('id="'+id+'"'));
 assert(order.every((x,i)=>x>=0&&(!i||x>order[i-1])));
 assert(!template.includes('hero-mini-panel'));
 const workflow=nodes.find(n=>attr(n,'class')==='workflow-steps');assert.equal(workflow.tagName,'ol');assert.equal(workflow.childNodes.filter(n=>n.tagName==='li').length,4);
 const help=nodes.find(n=>attr(n,'class')==='measurement-help');assert.equal(help.tagName,'details');assert(help.childNodes.some(n=>n.tagName==='summary'));assert(!attr(help,'hidden'));
 assert(template.includes('Ask us to review your plan'));
});
test('accuracy and privacy are beside file selection and final sharing, not only in FAQ',()=>{
 const privacy=nodes.find(n=>attr(n,'class').includes('plan-privacy')),limits=nodes.find(n=>attr(n,'class').includes('estimate-limits'));
 assert(privacy&&limits);assert(serializeText(privacy).includes('does not send the file, room names or outlines'));assert(serializeText(limits).includes('not an order quantity or a price'));
 assert(template.indexOf('class="helper plan-privacy"')<template.indexOf('id="uploadStatus"'));
 assert(template.indexOf('class="helper estimate-limits"')<template.indexOf('id="useAreaInQuoteButton"'));
});
function serializeText(n){return n.value||n.childNodes?.map(serializeText).join('')||'';}
test('assembled CSS has a common 1080px container, explicit section rhythm and no positional borders or order hacks',()=>{
 const css=floorPlanThemeCSS(root);assert(css.includes('--max-width:1080px'));assert(css.includes('calc(100% - 40px)'));assert(css.includes('main > section + section { margin-top:48px; }'));assert(css.includes('main > section + section { margin-top:32px; }'));assert(css.includes('padding:20px; gap:20px'));assert(!/nth-of-type|\border\s*:/.test(css));assert(!/overflow:\s*auto[^}]*padding-right/.test(css));
});
test('page keeps the protected head and a single shared shell, with native fallback instructions',()=>{
 const page=renderFloorPlanPage(root),n=all(parse(page));assert.equal(n.filter(n=>n.tagName==='h1').length,1);assert.equal(n.filter(n=>n.tagName==='title').length,1);assert.equal(n.filter(n=>n.tagName==='header').length,1);assert.equal(n.filter(n=>n.tagName==='footer').length,1);assert(template.includes('<noscript>'));assert(page.includes("form-action 'none'"));assert(page.includes('href="https://oztimberfloor.com.au/floor-plan/"'));assert(page.includes('content="noindex, nofollow"'));
});
