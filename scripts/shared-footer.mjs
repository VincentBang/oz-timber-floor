// Owner-supplied footer component; shared composition, not a page redesign.
import fs from 'node:fs';import path from 'node:path';import vm from 'node:vm';import assert from 'node:assert/strict';import {parse,serializeOuter} from 'parse5';
const project=path.resolve(import.meta.dirname,'..'),all=n=>[n,...(n.childNodes||[]).flatMap(all)],attr=(n,k)=>n.attrs?.find(a=>a.name===k)?.value||'',text=n=>n.nodeName==='#text'?n.value:(n.childNodes||[]).map(text).join(''),esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const FOOTER_RESOURCES='<link rel="stylesheet" href="/assets/footer-v2.css" data-oz-footer-resource="style"><script src="/assets/footer-v2.js" defer data-site-shell="true" data-oz-footer-resource="script"></script>';
// Footer-only owner copy change; leaves contact-page information/config intact.
export function compactFooterContacts(html){return html.replace(/(<a class="ozf__phone"[^>]*>)[^<]*(<\/a>)/g,'$1Call us$2').replace(/(?:\n[ \t]*)?<a class="ozf__secondary-phone"[^>]*>[\s\S]*?<\/a>/g,'').replace(/(?:\n[ \t]*)?<a class="ozf__showroom"[^>]*>[\s\S]*?<\/a>/g,'').replace(/(<a class="ozf__email"[^>]*>)[^<]*(<\/a>)/g,'$1Email us$2').replaceAll('<a href="/contact/#showroom">Contact &amp; showroom</a>','<a href="/contact/">Contact us</a>');}
export function footerContact(root=project){const context={window:{}};vm.runInNewContext(fs.readFileSync(path.join(root,'assets/contact-config.js'),'utf8'),context,{timeout:1000});const c=context.window.OZ_TIMBER_FLOOR_CONTACT;assert(c?.businessName&&c.phoneDisplay&&/^\+[0-9]{8,15}$/.test(c.phoneHref)&&/^[^\s@]+@[^\s@]+$/.test(c.email)&&c.address?.streetAddress&&c.address?.addressLocality&&c.address?.addressRegion&&c.address?.postalCode,'Invalid canonical footer contact configuration');return c;}
export function renderSharedFooter(root=project,{year=new Date().getUTCFullYear()}={}){
 const c=footerContact(root);let html=fs.readFileSync(path.join(root,'components/footer-v2.template'),'utf8').replace(/^<!--[\s\S]*?-->\s*/,'').trim();
 html=html.replaceAll('tel:+61435496975','tel:'+esc(c.phoneHref)).replaceAll('0435 496 975',esc(c.phoneDisplay)).replaceAll('info@oztimberfloor.com.au',esc(c.email));
 html=html.replace('© 2026 Oz Timber Floor','© '+year+' '+esc(c.businessName));return html;
}
export function consolidateHomeClosing(html){
 if(!/rel="canonical" href="https:\/\/oztimberfloor\.com\.au\/"/.test(html)||html.includes('data-footer-home-preparation'))return html;
 const nodes=all(parse(html,{sourceCodeLocationInfo:true})),heading=nodes.find(n=>n.tagName==='h2'&&text(n).trim()==='Ready to plan your flooring project?');if(!heading)return html;
 let section=heading.parentNode;while(section&&section.tagName!=='section')section=section.parentNode;assert(section?.sourceCodeLocation,'Missing closing CTA section');assert(!all(section).some(n=>attr(n,'id')),'Do not discard closing-section anchors');
 const guidance=all(section).find(n=>n.tagName==='p'&&text(n).includes('Send your suburb, approximate area'));assert(guidance,'Missing unique enquiry preparation guidance');
 const paths=nodes.find(n=>attr(n,'id')==='home-pathways'),shell=paths&&all(paths).find(n=>attr(n,'class').split(' ').includes('shell'));assert(shell?.sourceCodeLocation?.endTag,'Missing existing homepage enquiry context');
 const note='<details class="arch-home-detail" data-footer-home-preparation=""><summary>What to send with your enquiry</summary>'+serializeOuter(guidance)+'<p><a href="/contact/?enquiry=supply-only&amp;source=home">Request supply price</a> · <a href="/contact/?enquiry=stock&amp;source=home">Check stock availability</a></p></details>';
 const edits=[{start:section.sourceCodeLocation.startOffset,end:section.sourceCodeLocation.endOffset,value:''},{start:shell.sourceCodeLocation.endTag.startOffset,end:shell.sourceCodeLocation.endTag.startOffset,value:note}].sort((a,b)=>b.start-a.start);for(const e of edits)html=html.slice(0,e.start)+e.value+html.slice(e.end);return html;
}
export function sharedFooterHTML(html,{root=project}={}){
 const old=/<div class="arch-footer-surround"><footer\b[\s\S]*?<\/footer><\/div>/,current=/<footer class="ozf"[^>]*>[\s\S]*?<\/footer>/;
 if(!old.test(html)&&!current.test(html))return html;
 html=html.replace(old,()=>renderSharedFooter(root)).replace(current,()=>renderSharedFooter(root));
 if(!html.includes('data-oz-footer-resource="style"')){assert(html.includes('</head>'),'Footer resources require a real document head');html=html.replace('</head>',FOOTER_RESOURCES+'</head>');}
 return consolidateHomeClosing(html);
}
export function applySharedFooter(root=project){let checked=0,changed=0;const skip=new Set(['.git','node_modules','dist','docs','assistant','data','config','scripts','components','migration','floor-plan','netlify']);function walk(dir){for(const e of fs.readdirSync(dir,{withFileTypes:true})){if(e.name.startsWith('.')||skip.has(e.name)||e.isSymbolicLink())continue;const p=path.join(dir,e.name);if(e.isDirectory())walk(p);else if(e.name.endsWith('.html')){checked++;const before=fs.readFileSync(p,'utf8'),after=sharedFooterHTML(before,{root});if(before!==after){fs.writeFileSync(p,after);changed++;}}}}walk(root);return{checked,changed};}
if(process.argv[1]===new URL(import.meta.url).pathname){assert(process.argv.includes('--apply'),'Explicit --apply required');console.log(applySharedFooter());}
