// November 5 remediation, applied after all presentation/data generators.
// No catalogue facts, identity, routing, schema or backend mutation.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {parse} from 'parse5';
const root=path.resolve(import.meta.dirname,'..');
const all=n=>[n,...(n.childNodes||[]).flatMap(all)],attr=(n,k)=>n?.attrs?.find(a=>a.name===k)?.value||'',has=(n,c)=>attr(n,'class').split(/\s+/).includes(c),text=n=>n?.value||(n?.childNodes||[]).map(text).join('');
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const metadataIDs=[
 'etf-12mm-laminate-barnwood-oak','etf-72hrs-water-resistant-laminate-barnwood-oak',
 'etf-12mm-laminate-coastal-blackbutt-1-5m','etf-1-5-meter-laminate-coastal-blackbutt-1-5m',
 'etf-12mm-laminate-earl-grey-1-5m','etf-1-5-meter-laminate-earl-grey-1-5m',
 'etf-12mm-laminate-frosty-pine','etf-72hrs-water-resistant-laminate-frosty-pine',
 'etf-australian-engineered-spotted-gum','ultimo-luxury-vinyl-plank-spotted-gum',
 'etf-hybrid-herringbone-natural-oak-herringbone','etf-oak-herringbone-natural-oak-herringbone'];
export const attachmentRoutes=['engineered-timber-flooring-supplier-sydney','builder-flooring-contractor-sydney','laminate-flooring-supplier-sydney','hybrid-flooring-supplier-sydney','solid-timber-flooring-supplier-sydney','vinyl-flooring-supplier-sydney','timber-flooring-supplier-sydney'];
const services=['/services/','/builder-flooring-contractor-sydney/','/commercial-flooring/','/timber-floor-installation/'];
export function remediateHTML(html,catalogue){
 if(/http-equiv="refresh"/i.test(html))return html;
 // The inherited hub search lived below all 85 ranges and had no clear/count
 // controls. Upgrade its actual static owner, not a second competing toolbar.
 if(html.includes('href="https://oztimberfloor.com.au/ranges/"')&&!html.includes('data-range-filter-form')){
  const ns=all(parse(html,{sourceCodeLocationInfo:true})),library=ns.find(n=>n.tagName==='section'&&attr(n,'id')==='range-library'),first=ns.find(n=>n.tagName==='section'&&attr(n,'id')==='hybrid');
  if(!library||!first)throw Error('Range hub owner structure changed');
  const l=library.sourceCodeLocation;let block=html.slice(l.startOffset,l.endOffset);
  block=block.replace(/<div class="catalogue-filter">([\s\S]*?)<\/div>/,'<form class="catalogue-filter" data-range-filter-form><label for="rangeSearch">Search all flooring ranges</label>$1<button type="button" data-range-clear hidden>Clear filters</button><p role="status" aria-live="polite" data-range-filter-status>Showing all 85 ranges.</p><p data-range-empty hidden>No matching ranges. Try another name or clear filters.</p></form>');
  for(const [slug,label]of [['hybrid','Hybrid'],['laminate','Laminate'],['engineered-timber','Engineered timber'],['solid-timber','Solid timber'],['vinyl','Vinyl']])block=block.replace('<a href="#'+slug+'">','<a href="#'+slug+'" data-range-category="'+label+'">');
  html=html.slice(0,l.startOffset)+html.slice(l.endOffset);html=html.slice(0,first.sourceCodeLocation.startOffset)+block+html.slice(first.sourceCodeLocation.startOffset);
  html=html.replace(/<script>document.addEventListener\("input",function\(event\)\{if\(event.target.id!=="rangeSearch"\)[\s\S]*?<\/script>/,'');
 }
 const nodes=all(parse(html,{sourceCodeLocationInfo:true})),edits=[];
 const canonical=attr(nodes.find(n=>n.tagName==='link'&&attr(n,'rel')==='canonical'),'href'),route=canonical.replace('https://oztimberfloor.com.au','');
 const body=nodes.find(n=>n.tagName==='body'),family=attr(body,'data-editorial-family');
 const edit=(n,value,inner=false)=>{const l=n?.sourceCodeLocation;if(!l)return;edits.push({start:inner?l.startTag.endOffset:l.startOffset,end:inner?l.endTag.startOffset:l.endOffset,value});};
 const insert=(n,value)=>{const l=n?.sourceCodeLocation;if(l)edits.push({start:l.endTag.startOffset,end:l.endTag.startOffset,value});};
 const product=catalogue.products.find(p=>p.url===route),id=route.split('/')[2];
 if(route==='/guides/solid-timber-flooring-vs-engineered-flooring-which-one-is-right-for-you/')for(const n of nodes.filter(n=>n.tagName==='a'&&attr(n,'href')==='https://www.sciencedirect.com/topics/engineering/high-density-fiberboard')){const l=n.sourceCodeLocation.startTag;edits.push({start:l.startOffset,end:l.endOffset,value:html.slice(l.startOffset,l.endOffset).replace('https://www.sciencedirect.com/topics/engineering/high-density-fiberboard','https://research.fs.usda.gov/download/treesearch/22049.pdf#page=9')});}
 if(metadataIDs.includes(id)){
  if(!product)throw Error('Missing metadata identity: '+route);
  const display=product.name.toLowerCase().includes(product.range.toLowerCase())?product.name:product.range+' — '+product.name;
  edit(nodes.find(n=>n.tagName==='title'),esc(display+' | Oz Timber Floor'),true);
  // Only the eight audited description pages; no blanket metadata rewrite.
  if(metadataIDs.indexOf(id)<8)for(const n of nodes.filter(n=>n.tagName==='meta'&&(attr(n,'name')==='description'||attr(n,'property')==='og:description'))){const d=display+' flooring in Sydney. View colour photos and enquire about stock, supply or installation with Oz Timber Floor.';const tag=html.slice(n.sourceCodeLocation.startOffset,n.sourceCodeLocation.endOffset);edit(n,tag.replace(/content="[^"]*"/,'content="'+esc(d)+'"'));}
 }
 // Accessible names keep visible action wording and canonical display identity.
 for(const card of nodes.filter(n=>has(n,'product-card')||has(n,'range-summary-card'))){
  const children=all(card),links=children.filter(n=>n.tagName==='a'),target=links.map(n=>attr(n,'href').split(/[?#]/)[0]);
  const p=catalogue.products.find(p=>target.includes(p.url)),r=catalogue.ranges.find(r=>target.includes(r.url));
  const name=p?(p.name.toLowerCase().includes(p.range.toLowerCase())?p.name:p.range+' '+p.name):r?.name;
  if(!name)continue;
  for(const link of links){const label=text(link).trim();if(!['View details','Check stock'].includes(label))continue;const loc=link.sourceCodeLocation.startTag;let tag=html.slice(loc.startOffset,loc.endOffset);const value=' aria-label="'+esc(label+' — '+name)+'"';tag=/\saria-label="[^"]*"/.test(tag)?tag.replace(/\saria-label="[^"]*"/,value):tag.replace(/>$/,value+'>');edits.push({start:loc.startOffset,end:loc.endOffset,value:tag});}
 }
 if(route==='/contact/'){
  for(const n of nodes.filter(n=>n.tagName==='p'&&text(n).includes('Hidden source and attribution fields')))edit(n,'Oz Timber Floor uses your product, service and project details to respond to your enquiry.',true);
  const form=nodes.find(n=>n.tagName==='form'&&attr(n,'name')==='oz-flooring-enquiry');
  for(const input of all(form||{}).filter(n=>['input','select','textarea'].includes(n.tagName)&&n.attrs?.some(a=>a.name==='required'))){let label=attr(input,'id')&&nodes.find(n=>n.tagName==='label'&&attr(n,'for')===attr(input,'id'));if(!label){let parent=input.parentNode;while(parent&&parent!==form){if(parent.tagName==='label'){label=parent;break;}parent=parent.parentNode;}}if(label&&!/\(required\)/i.test(text(label)))insert(label,' <span class="required-label">(required)</span>');}
 }
 if(attachmentRoutes.includes(route.replaceAll('/',''))){
  for(const n of nodes.filter(n=>n.tagName==='p'&&/mention it in your message and we can request them after your enquiry/.test(text(n))))edit(n,'You can optionally attach one floor plan (PDF, JPG/JPEG, PNG or WebP) and up to two photos (JPG/JPEG, PNG or WebP) in the enquiry form, up to 7 MB combined. For larger files, ask the team how to send them. Measuring a plan shares only the area you review, not the drawing.',true);
  if(route==='/builder-flooring-contractor-sydney/'&&!nodes.some(n=>has(n,'audit-attachment-guidance'))){const p=nodes.find(n=>n.tagName==='p'&&has(n,'lead'));if(p)insert(p,'<span class="audit-attachment-guidance"> You can optionally attach one floor plan (PDF, JPG/JPEG, PNG or WebP) and up to two photos (JPG/JPEG, PNG or WebP), up to 7 MB combined, in the enquiry form. Ask the team about larger files. Measuring a plan shares only the reviewed area, not the drawing.</span>');}
  // Detailed live form instructions are not automatically reviewed AI facts.
  // Keep them visible to customers; the knowledge builder takes the separately
  // validated, approved generic help fact from enquiry-help-evidence.mjs.
  for(const n of nodes.filter(n=>has(n,'audit-attachment-guidance')||n.tagName==='p'&&text(n).includes('up to 7 MB combined. For larger files, ask the team how to send them.'))){
   if(n.attrs?.some(a=>a.name==='data-enquiry-attachment-contract'))continue;
   const l=n.sourceCodeLocation.startTag;edits.push({start:l.startOffset,end:l.endOffset,value:html.slice(l.startOffset,l.endOffset).replace(/>$/,' data-enquiry-attachment-contract>')});
  }
 }
 // Display the already-reviewed variants together; retain the original facts.
 if(product?.formatOptions?.length&&!nodes.some(n=>attr(n,'data-product-formats'))){
  const grid=nodes.find(n=>has(n,'spec-grid'));
  if(grid)insert(grid,`<div class="audit-format-options" data-product-formats="${esc(product.id)}"><h3>Choose a format to ask about (optional)</h3><p>Coverage and pieces apply to each format below, not every version. Confirm the chosen format and stock before order.</p><ul>${product.formatOptions.map(o=>`<li><strong>${esc(o.format)}</strong>: ${esc(o.boardSize)}; ${esc(o.packSizeM2)} m² per pack; ${esc(o.piecesPerPack)} pieces.</li>`).join('')}</ul><label>Format for this enquiry <select data-enquiry-format><option value="">Please help me choose</option>${product.formatOptions.map(o=>`<option value="${esc(o.format)}">${esc(o.format)}</option>`).join('')}</select></label><p data-format-status role="status">Your choice is a request to confirm, not a stock reservation.</p></div>`);
 }
 if(product?.formatOptions?.length>1&&!product.packSizeM2)for(const n of nodes.filter(n=>has(n,'spec-item'))){const label=(n.childNodes||[]).find(c=>c.tagName==='span'),value=(n.childNodes||[]).find(c=>c.tagName==='strong');if(['Pack size','Pack size m²'].includes(text(label))&&/confirm/i.test(text(value)))edit(value,'Varies by format — see the approved format options below.',true);}
 // Native, server-rendered secondary guidance. No-JS remains fully expanded.
 if(services.includes(route)||family==='range'){
  const main=nodes.find(n=>n.tagName==='main'),sections=(main?.childNodes||[]).filter(n=>n.tagName==='section');
  for(const [index,section]of sections.entries()){
   const ns=all(section),h=ns.find(n=>n.tagName==='h2'),heading=text(h).trim();
   if(!h||index<3||ns.some(n=>has(n,'audit-secondary')||has(n,'mobile-disclosure'))||has(section,'catalogue-products')||ns.some(n=>has(n,'range-summary-card')||has(n,'product-card')||has(n,'cta'))||/project examples|photograph|compare|colours|nearby|next step|enquiry$|send an/i.test(heading))continue;
   const shell=(section.childNodes||[]).find(n=>has(n,'shell'));if(!shell?.sourceCodeLocation?.endTag)continue;
   const l=shell.sourceCodeLocation,hl=h.sourceCodeLocation;
   if(edits.some(e=>e.start>=l.startTag.endOffset&&e.end<=l.endTag.startOffset))continue;
   const contents=html.slice(l.startTag.endOffset,hl.startOffset)+html.slice(hl.endOffset,l.endTag.startOffset);
   edits.push({start:l.startTag.endOffset,end:l.endTag.startOffset,value:`<details class="audit-secondary" open><summary>${html.slice(hl.startOffset,hl.endOffset)}</summary><div class="audit-secondary-panel">${contents}</div></details>`});
  }
 }
 const head=nodes.find(n=>n.tagName==='head');
 if(head&&!html.includes('src="/assets/audit-remediation.js"'))insert(head,'<script src="/assets/audit-remediation.js" defer></script><link rel="stylesheet" href="/assets/audit-remediation.css">');
 // Reject overlapping transformations instead of silently losing an inner fix.
 edits.sort((a,b)=>b.start-a.start);let boundary=Infinity;
 for(const e of edits){if(e.end>boundary)throw Error('Overlapping remediation edits: '+route);html=html.slice(0,e.start)+e.value+html.slice(e.end);boundary=e.start;}
 return html;
}
export function applyAuditRemediation(){const data=JSON.parse(fs.readFileSync(root+'/data/product-catalogue.json')),changed=[];function visit(dir){for(const e of fs.readdirSync(dir,{withFileTypes:true})){if(e.name.startsWith('.')||['docs','node_modules','dist','assistant','data','migration','config','scripts','floor-plan'].includes(e.name))continue;const file=path.join(dir,e.name);if(e.isDirectory())visit(file);else if(file.endsWith('.html')){const before=fs.readFileSync(file,'utf8'),after=remediateHTML(before,data);if(after!==before){fs.writeFileSync(file,after);changed.push(path.relative(root,file));}}}}visit(root);return{changed};}
if(process.argv[1]===fileURLToPath(import.meta.url))console.log(JSON.stringify(applyAuditRemediation()));
