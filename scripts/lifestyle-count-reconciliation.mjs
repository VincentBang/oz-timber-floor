// Local listed-product count only: no supplier total, retirement or indexation inference.
import assert from 'node:assert/strict';
import {parse} from 'parse5';
export const LIFESTYLE_ROUTE='/ranges/lifestyle-collection/';
export const LIFESTYLE_COUNT_BADGE_STYLE='<style data-lifestyle-count-badge="">@media(min-width:761px){body.editorial .hero-media .hero-badge{min-height:38px;overflow:visible}}</style>';
export function reviewedLifestyleBadgeHTML(html,route){if(route!==LIFESTYLE_ROUTE||html.includes('data-lifestyle-count-badge')||!html.includes('class="hero-badge"'))return html;assert(html.includes('</head>'),'Lifestyle badge head missing');return html.replace('</head>',LIFESTYLE_COUNT_BADGE_STYLE+'</head>');}
export const LIFESTYLE_MEMBERS=Object.freeze(['lifestyle-collection-spotted-gum','lifestyle-collection-almond','lifestyle-collection-blackbutt','lifestyle-collection-blissful','lifestyle-collection-carbon','lifestyle-collection-husky-grey','lifestyle-collection-oatmeal','lifestyle-collection-travertine','lifestyle-collection-white-oak']);
const normal=s=>String(s).replace(/^\/products\//,'').replace(/\/$/,'');
export function lifestyleListedCount(range){
 assert.equal(range?.id,'lifestyle-collection','Reviewed Lifestyle identity required');
 assert.equal(range.url,LIFESTYLE_ROUTE,'Reviewed Lifestyle route required');
 for(const field of ['productSlugs','products']){
  const ids=range[field].map(normal);
  assert.deepEqual(ids,LIFESTYLE_MEMBERS,'Lifestyle membership/order drift: '+field);
  assert.deepEqual(range[field],LIFESTYLE_MEMBERS,'Lifestyle membership must use unique IDs: '+field);
 }
 assert.equal(range.colourCount,LIFESTYLE_MEMBERS.length,'Lifestyle count must follow unique listed IDs');
 return range.colourCount;
}
const walk=n=>[n,...(n.childNodes||[]).flatMap(walk)],attr=(n,k)=>n.attrs?.find(a=>a.name===k)?.value||'',text=n=>n.nodeName==='#text'?n.value:(n.childNodes||[]).map(text).join(''),has=(n,c)=>attr(n,'class').split(/\s+/).includes(c);
export function reviewedLifestyleCountHTML(html,route,range){
 const count=lifestyleListedCount(range),nodes=walk(parse(html,{sourceCodeLocationInfo:true})),edits=[];
 const replaceText=(node,replacement,allowed)=>{
  const ts=walk(node).filter(n=>n.nodeName==='#text'&&n.value.trim());
  assert.equal(ts.length,1,'Lifestyle count text shape drift');const t=ts[0];assert(allowed.includes(t.value.trim()),'Lifestyle count value drift: '+t.value);
  if(t.value.trim()===replacement)return;const p=t.sourceCodeLocation;assert(p,'Lifestyle count location missing');edits.push({start:p.startOffset,end:p.endOffset,value:t.value.replace(t.value.trim(),replacement)});
 };
 for(const card of nodes.filter(n=>n.tagName==='a'&&attr(n,'href')===LIFESTYLE_ROUTE&&(has(n,'range-summary-card')||has(n,'range-card')))){
  const badges=walk(card).filter(n=>n.tagName==='span'&&/^(?:9|10) colours$/.test(text(n).trim()));
  assert.equal(badges.length,1,'Lifestyle summary count badge drift');replaceText(badges[0],count+' colours',['9 colours','10 colours']);
 }
 if(route===LIFESTYLE_ROUTE){
  for(const badge of nodes.filter(n=>has(n,'hero-badge')))for(const span of walk(badge).filter(n=>n.tagName==='span'&&/^(?:9|10) colours$/.test(text(n).trim())))replaceText(span,count+' colours',['9 colours','10 colours']);
  for(const spec of nodes.filter(n=>has(n,'spec-item')&&text(n.childNodes.find(n=>n.tagName==='span')||{}).trim()==='Colours')){
   const value=spec.childNodes.find(n=>n.tagName==='strong');assert(value,'Lifestyle Colours value missing');replaceText(value,String(count),['9','10']);
  }
 }
 edits.sort((a,b)=>b.start-a.start);for(const e of edits)html=html.slice(0,e.start)+e.value+html.slice(e.end);return html;
}
