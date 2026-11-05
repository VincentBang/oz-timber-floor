// Use the current Oz shell at assembly time, never a second copied header/footer.
import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import {parse,serializeOuter} from 'parse5';
const attr=(n,k)=>n.attrs?.find(a=>a.name===k)?.value||'',all=n=>[n,...(n.childNodes||[]).flatMap(all)],has=(n,c)=>attr(n,'class').split(/\s+/).includes(c);
function one(nodes,p,label){const found=nodes.filter(p);assert.equal(found.length,1,'One shared '+label+' required');return found[0];}
export function renderFloorPlanPage(root,{shellHTML=fs.readFileSync(path.join(root,'contact.html'),'utf8')}={}){
 const nodes=all(parse(shellHTML)),header=one(nodes,n=>n.tagName==='header'&&has(n,'site-header'),'header'),footer=one(nodes,n=>has(n,'arch-footer-surround'),'footer surround'),body=one(nodes,n=>n.tagName==='body','body');
 // Ordinary header/footer quote actions must retain the originating product,
 // while only the dedicated measurement action shares an explicit area summary.
 for(const n of [...all(header),...all(footer)])if(n.tagName==='a'&&attr(n,'href').startsWith('/contact/?enquiry=supply-install')&&!n.attrs.some(a=>a.name==='data-quote-return-link'))n.attrs.push({name:'data-quote-return-link',value:''});
 const styles=nodes.filter(n=>n.tagName==='link'&&attr(n,'rel')==='stylesheet'&&attr(n,'href').startsWith('/assets/'));
 // Put shared rules in one cascade layer. Measurement defaults can then reset
 // inherited generic .hero/.layout styles without touching header/footer CSS.
 const resources=styles.map(n=>'<link rel="preload" as="style" href="'+attr(n,'href')+'">').join('\n')+'\n<link rel="stylesheet" href="./site-theme.css">\n'+nodes.filter(n=>n.tagName==='script'&&(attr(n,'src')==='/assets/architectural.js'||attr(n,'data-site-shell')==='true'&&attr(n,'src').startsWith('/assets/'))).map(n=>serializeOuter(n)).join('\n');
 assert(resources.includes('/assets/site.css')&&resources.includes('/assets/architectural.css')&&resources.includes('/assets/architectural.js'),'Shared theme/navigation resources missing');
 const attrs=body.attrs.filter(a=>!['data-editorial-family','data-mobile-page'].includes(a.name));const bodyHTML='<body'+attrs.map(a=>' '+a.name+'="'+a.value.replaceAll('&','&amp;').replaceAll('"','&quot;')+'"').join(' ')+' data-editorial-family="floorplan" data-mobile-page="floorplan">';
 let template=fs.readFileSync(path.join(root,'floor-plan/page.template'),'utf8');for(const marker of ['OZ_SHARED_HEADER','OZ_SHARED_FOOTER','OZ_SHARED_RESOURCES'])assert.equal(template.split('<!-- '+marker+' -->').length,2,'One shell slot required');
 const chrome=n=>{const html=serializeOuter(n),link='<a href="/floor-plan/">Floor Plan</a>';return html.includes(link)?html:html.replaceAll('<a href="/guides/">Guides</a>',link+'<a href="/guides/">Guides</a>');};
 return template.replace('<body>',bodyHTML).replace('<!-- OZ_SHARED_HEADER -->','<a class="skip-link" href="#main-content">Skip to content</a>'+chrome(header)).replace('<!-- OZ_SHARED_FOOTER -->',chrome(footer)).replace('<!-- OZ_SHARED_RESOURCES -->',resources);
}
export function floorPlanSharedThemeCSS(root,{shellHTML=fs.readFileSync(path.join(root,'contact.html'),'utf8')}={}){
 const nodes=all(parse(shellHTML)),styles=nodes.filter(n=>n.tagName==='link'&&attr(n,'rel')==='stylesheet'&&attr(n,'href').startsWith('/assets/'));
 return '@layer oz-site;\n'+styles.map(n=>'@import url("'+attr(n,'href')+'") layer(oz-site);').join('\n')+'\n';
}
// Native CSS nesting isolates the measurement layout from the shared shell.
// The inherited source files remain intact; only their scoped output is loaded.
export function floorPlanThemeCSS(root){
 const rootBlock=/^\s*:root\s*\{[^}]*\}/,colours=new Map([['#ffffff','surface'],['#f4f7f6','stone'],['#17232d','ink'],['#5e6a74','muted'],['#d8e2df','line'],['#17313a','brand'],['#b56e52','accent'],['#946149','bronze-text'],['#b33a2f','brand-dark'],['#456b5c','brand'],['#f8f9fb','stone'],['#f8fafc','stone'],['#f9fbfa','canvas'],['#111820','ink']]);
 let css=fs.readFileSync(path.join(root,'floor-plan/operon-page.css'),'utf8').replace(rootBlock,'');
 css+='\n'+fs.readFileSync(path.join(root,'floor-plan/port-inline-layout.css'),'utf8')+'\n'+fs.readFileSync(path.join(root,'floor-plan/port-accessibility.css'),'utf8').replace(/@font-face\{[^}]*\}/,'');
 css=css.replace(/#[a-f0-9]{6}\b/gi,c=>{assert(colours.has(c.toLowerCase()),'Unmapped inherited colour '+c);return 'var(--'+colours.get(c.toLowerCase())+')';});
 css=css.replace(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*([\d.]+))?\s*\)/g,(_,r,g,b,a='1')=>{r=+r;g=+g;b=+b;const min=Math.min(r,g,b),max=Math.max(r,g,b),token=min>250?'surface':min>220?'stone':max<50?'ink':max-min<35?'ink':r>g&&r>b?'accent':'brand';return 'color-mix(in srgb, var(--'+token+') '+Math.round(+a*100)+'%, transparent)';});
 css=css.replace(/\bbody((?:\.[a-zA-Z0-9_-]+)+)/g,'body$1 &').replace(/(^|[{},]\s*)\s*(?:body|html)(?=\s*[{,])/gm,'$1 &');
 return '/* Generated from measurement layout; all theme colours inherit Oz tokens. */\n.oz-floorplan-tool,.oz-floorplan-tool :where(*),.oz-floorplan-tool :where(*)::before,.oz-floorplan-tool :where(*)::after{all:revert}\n.oz-floorplan-tool{\n--bg:var(--canvas);--text:var(--ink);--surface-strong:var(--surface);--surface-soft:var(--stone);--brand-soft:color-mix(in srgb,var(--brand) 6%,transparent);--warn:var(--bronze-text);--danger:var(--brand-dark);--success:var(--brand);--shadow:var(--shadow-soft);--radius-xl:var(--radius-feature);--radius-lg:var(--radius-card);--radius-md:var(--radius-control);--max-width:1080px;--hero-width:1080px;--font-sans:inherit;\n'+css+'\n}\n.oz-floorplan-tool :is(.button,.button-secondary,.button-quiet,.button-danger){border-radius:var(--radius-control);font-family:inherit}\n.oz-floorplan-tool :focus-visible{outline-color:var(--brand)}\n.oz-floorplan-tool .port-skip{color:var(--ink);background:var(--surface)}\n.oz-floorplan-tool :is(h1,h2,h3,h4){font-family:revert-layer;font-weight:revert-layer;letter-spacing:revert-layer}\n@media(max-width:640px){.oz-floorplan-tool [aria-labelledby="floorplanPlanningLinksTitle"]{order:7}}\n';
}
