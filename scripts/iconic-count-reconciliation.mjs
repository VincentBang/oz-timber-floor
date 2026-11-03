// Local listed-product count only: no supplier total, retirement or indexation inference.
import assert from 'node:assert/strict';
import {parse} from 'parse5';
export const ICONIC_ROUTE='/ranges/iconic-wpc/';
export const ICONIC_COUNT_BADGE_STYLE='<style data-iconic-count-badge="">@media(min-width:761px){body.editorial .hero-media .hero-badge{min-height:38px;overflow:visible}}</style>';
export function reviewedIconicBadgeHTML(html,route){if(route!==ICONIC_ROUTE||html.includes('data-iconic-count-badge')||!html.includes('class="hero-badge"'))return html;assert(html.includes('</head>'),'Iconic badge head missing');return html.replace('</head>',ICONIC_COUNT_BADGE_STYLE+'</head>');}
export const ICONIC_MEMBERS=Object.freeze(['iconic-wpc-onyx','iconic-wpc-alabaster','iconic-wpc-blackbutt','iconic-wpc-crystal','iconic-wpc-flagstone','iconic-wpc-graphite','iconic-wpc-jasper','iconic-wpc-limestone','iconic-wpc-millstone','iconic-wpc-pale-stone','iconic-wpc-pearl-shell','iconic-wpc-red-rock','iconic-wpc-spotted-gum','iconic-wpc-tumble-stone']);
const normal=s=>String(s).replace(/^\/products\//,'').replace(/\/$/,'');
export function iconicListedCount(range){
 assert.equal(range?.id,'iconic-wpc','Reviewed Iconic identity required');
 assert.equal(range.url,ICONIC_ROUTE,'Reviewed Iconic route required');
 for(const field of ['productSlugs','products']){
  const ids=range[field].map(normal);
  assert.deepEqual(ids,ICONIC_MEMBERS,'Iconic membership/order drift: '+field);
  assert.deepEqual(range[field],ICONIC_MEMBERS,'Iconic membership must use unique IDs: '+field);
 }
 assert.equal(range.colourCount,ICONIC_MEMBERS.length,'Iconic count must follow unique listed IDs');
 return range.colourCount;
}
const walk=n=>[n,...(n.childNodes||[]).flatMap(walk)],attr=(n,k)=>n.attrs?.find(a=>a.name===k)?.value||'',text=n=>n.nodeName==='#text'?n.value:(n.childNodes||[]).map(text).join(''),has=(n,c)=>attr(n,'class').split(/\s+/).includes(c);
export function reviewedIconicCountHTML(html,route,range){
 const count=iconicListedCount(range),nodes=walk(parse(html,{sourceCodeLocationInfo:true})),edits=[];
 const replaceText=(node,replacement,allowed)=>{
  const ts=walk(node).filter(n=>n.nodeName==='#text'&&n.value.trim());
  assert.equal(ts.length,1,'Iconic count text shape drift');const t=ts[0];assert(allowed.includes(t.value.trim()),'Iconic count value drift: '+t.value);
  if(t.value.trim()===replacement)return;const p=t.sourceCodeLocation;assert(p,'Iconic count location missing');edits.push({start:p.startOffset,end:p.endOffset,value:t.value.replace(t.value.trim(),replacement)});
 };
 for(const card of nodes.filter(n=>n.tagName==='a'&&attr(n,'href')===ICONIC_ROUTE&&(has(n,'range-summary-card')||has(n,'range-card')))){
  const badges=walk(card).filter(n=>n.tagName==='span'&&/^(?:14|15) colours$/.test(text(n).trim()));
  assert.equal(badges.length,1,'Iconic summary count badge drift');replaceText(badges[0],count+' colours',['14 colours','15 colours']);
 }
 if(route===ICONIC_ROUTE){
  for(const badge of nodes.filter(n=>has(n,'hero-badge')))for(const span of walk(badge).filter(n=>n.tagName==='span'&&/^(?:14|15) colours$/.test(text(n).trim())))replaceText(span,count+' colours',['14 colours','15 colours']);
  for(const spec of nodes.filter(n=>has(n,'spec-item')&&text(n.childNodes.find(n=>n.tagName==='span')||{}).trim()==='Colours')){
   const value=spec.childNodes.find(n=>n.tagName==='strong');assert(value,'Iconic Colours value missing');replaceText(value,String(count),['14','15']);
  }
 }
 edits.sort((a,b)=>b.start-a.start);for(const e of edits)html=html.slice(0,e.start)+e.value+html.slice(e.end);return html;
}
