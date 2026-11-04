// Deterministic presentation pass. Existing content, facts and URL contracts are authoritative.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {parse,parseFragment,serialize} from 'parse5';
import {readImageSize} from './image-dimension-audit.mjs';
import {reviewedIconicCountHTML,reviewedIconicBadgeHTML} from './iconic-count-reconciliation.mjs';
import {reviewedLifestyleCountHTML,reviewedLifestyleBadgeHTML} from './lifestyle-count-reconciliation.mjs';
import {assertClassicMembership} from './classic-membership-reconciliation.mjs';
import {rangeSprintContract,repairReviewedRangeHTML,assertReviewedRangeReferences} from './range-sprint-repairs.mjs';
import {reviewedETF12FormatHTML,assertReviewedETF12Catalogue} from './etf12-reviewed-board-size.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const iconicRange=JSON.parse(fs.readFileSync(path.join(root,'data/product-catalogue.json'),'utf8')).ranges.find(r=>r.id==='iconic-wpc');
const lifestyleRange=JSON.parse(fs.readFileSync(path.join(root,'data/product-catalogue.json'),'utf8')).ranges.find(r=>r.id==='lifestyle-collection');
assertClassicMembership(JSON.parse(fs.readFileSync(path.join(root,'data/product-catalogue.json'),'utf8')));
assertReviewedRangeReferences(JSON.parse(fs.readFileSync(path.join(root,'data/product-catalogue.json'),'utf8')));
assertReviewedETF12Catalogue(JSON.parse(fs.readFileSync(path.join(root,'data/product-catalogue.json'),'utf8')));
const sizes=new Map();
const reviewedSupportRoutes=new Map([['/ranges/etf-10mm-hybrid/',['ETF 10mm Hybrid',1,'Hybrid']],['/ranges/etf-12mm-laminate/',['ETF 12mm Laminate',1,'Laminate']],['/ranges/classic-laminate/',['Preference Classic Laminate',1,'Laminate']],['/ranges/etf-1-5-meter-laminate/',['ETF 1.5 meter Laminate',1,'Laminate']],['/ranges/wooden-land-foreign-species/',['Wooden-Land Foreign Species',2,'Engineered timber']],['/ranges/wooden-land-herringbone/',['Wooden-Land Herringbone',2,'Engineered timber']],['/ranges/wooden-land-australian-species-136mm/',['Wooden-Land Australian Species 136mm',2,'Engineered timber']],['/ranges/wooden-land-australian-species-190mm/',['Wooden-Land Australian Species 190mm',2,'Engineered timber']],['/ranges/storm-luxury/',['Storm Luxury',3,'Hybrid']],['/ranges/ultimo-luxury-vinyl-plank/',['Ultimo Luxury Vinyl Plank',1,'Vinyl']],['/ranges/select-australian-timber/',['Select Australian Timber',1,'Engineered timber']],['/ranges/solid/',['Topdeck Solid Timber',2,'Solid timber']],['/ranges/lifestyle-collection/',['Lifestyle Collection',1,'Hybrid']],['/ranges/lumiere-ultra-hd/',['Lumiere Ultra HD',3,'Hybrid']],['/ranges/hydroplank-wpc/',['Hydroplank WPC',1,'Hybrid']],['/ranges/iconic-wpc/',['Iconic WPC',1,'Hybrid']],['/ranges/elk-falls/',['Elk Falls Hickory',1,'Engineered timber']],['/ranges/fiddleback/',['Fiddleback Australian Hardwood',1,'Engineered timber']],['/ranges/cavallo-bianco/',['Cavallo Bianco',2,'Engineered timber']],['/ranges/easi-plank/',['Easi Plank',1,'Hybrid']],['/ranges/aquatuff-flooring/',['ETF Aquatuff Flooring',1,'Laminate']],['/ranges/avala/',['Avala',3,'Hybrid']],['/ranges/artisan-tile/',['Artisan Tile',8,'Hybrid']],['/ranges/aqua-wood-plus-12mm/',['Aqua Wood Plus 12mm',1,'Laminate']],['/ranges/prime-legend/',['Prime Legend',2,'Laminate']]]);
export function reviewedSupportHTML(html,route){return transformReviewedSupport(html,route,reviewedSupportRoutes.get(route));}
export function reviewedETF10ETF12ComparisonHTML(html,route){
 if(!['/ranges/etf-10mm-hybrid/','/ranges/etf-12mm-laminate/'].includes(route))return html;
 const old='These HRT ranges stay close to the same category while giving a useful alternative to compare.',next='These ranges stay close to the same category while giving a useful alternative to compare.',count=html.split(old).length-1;
 if(count===0&&html.includes(next))return html;
 if(count!==1)throw Error('Reviewed ETF comparison copy drift');
 return html.replace(old,next);
}
export function reviewedETF15ComparisonHTML(html,route){
 if(route!=='/ranges/etf-1-5-meter-laminate/')return html;
 const old='These HRT ranges stay close to the same category while giving a useful alternative to compare.',next='These ranges stay close to the same category while giving a useful alternative to compare.',count=html.split(old).length-1;
 if(count===0&&html.includes(next))return html;
 if(count!==1)throw Error('Reviewed ETF 1.5 comparison copy drift');
 return html.replace(old,next);
}
export function reviewedAspireBelleSupportHTML(html,route){const reviewed=new Map([['/ranges/aspire/',['Aspire',1,'Hybrid']],['/ranges/belle-vie/',['Belle Vie',3,'Hybrid']]]).get(route);return transformReviewedSupport(html,route,reviewed);}
function transformReviewedSupport(html,route,reviewed){
 if(!reviewed)return html;let changed=0;
 const next=html.replace(/href="(\/contact\/\?[^"\n]+)"/g,(tag,raw)=>{const url=new URL(raw.replace(/&amp;/g,'&'),'https://oztimberfloor.com.au');if(url.searchParams.get('enquiry')!=='product-info')return tag;
  if(url.searchParams.get('range')!==reviewed[0]||url.searchParams.get('source')!==route||url.searchParams.has('category')&&url.searchParams.get('category')!==reviewed[2])throw Error('Reviewed range support context drift: '+route);
  url.searchParams.set('enquiry','product');url.searchParams.set('category',reviewed[2]);changed++;return 'href="'+(url.pathname+url.search).replace(/&/g,'&amp;')+'"';
 });if(changed!==0&&changed!==reviewed[1])throw Error('Reviewed support link count drift: '+route);return next;
}
export function reviewedBotanicaCastelSupportHTML(html,route){const reviewed=new Map([['/ranges/botanica/',['Botanica',1,'Engineered timber']],['/ranges/castel-nuovo/',['Castel Nuovo',2,'Engineered timber']]]).get(route);return transformReviewedSupport(html,route,reviewed);}
export const HOME_COMPACT_THUMBNAILS='<style data-home-compact-thumbnails="">@media(max-width:760px){body.editorial[data-mobile-page="home"] .editorial-materials a.category-card>img{height:96px;min-height:0;align-self:start}}</style>';
export const AVALA_RELATED_GRID='<style data-avala-related-grid="">@media(max-width:760px){body.editorial[data-mobile-page="product"] .catalogue-products .grid-3{grid-template-columns:minmax(0,1fr)}}</style>';
export const BOTANICA_PATHWAY_ARROWS='<style data-botanica-pathway-arrows="">@media(max-width:760px){body.editorial .category-card.link-card .card-arrow{display:none}}</style>';
export function reviewedBotanicaPathwayHTML(html,route){if(route!=='/ranges/botanica/'||html.includes('data-botanica-pathway-arrows'))return html;if(!html.includes('</head>'))throw Error('Reviewed Botanica pathway head missing');return html.replace('</head>',BOTANICA_PATHWAY_ARROWS+'</head>');}
export const SOLID_PATHWAY_ARROWS='<style data-solid-pathway-arrows="">@media(max-width:760px){body.editorial .category-card.link-card .card-arrow{display:none}}</style>';
export function reviewedSolidPathwayHTML(html,route){if(route!=='/ranges/solid/'||html.includes('data-solid-pathway-arrows'))return html;if(!html.includes('</head>'))throw Error('Reviewed Solid pathway head missing');return html.replace('</head>',SOLID_PATHWAY_ARROWS+'</head>');}
export const ULTIMO_PATHWAY_ARROWS='<style data-ultimo-pathway-arrows="">@media(max-width:760px){body.editorial .category-card.link-card .card-arrow{display:none}}</style>';
export function reviewedUltimoPathwayHTML(html,route){if(route!=='/ranges/ultimo-luxury-vinyl-plank/'||html.includes('data-ultimo-pathway-arrows'))return html;if(!html.includes('</head>'))throw Error('Reviewed Ultimo pathway head missing');return html.replace('</head>',ULTIMO_PATHWAY_ARROWS+'</head>');}
export const PRIME_LEGEND_COMPARISON_WRAP='<style data-prime-legend-comparison-wrap="">@media(max-width:760px){body.editorial .range-summary-card h3{overflow-wrap:anywhere}}</style>';
export function reviewedComparisonHTML(html,route){
 if(route!=='/ranges/prime-legend/'||html.includes('data-prime-legend-comparison-wrap'))return html;
 if(!html.includes('</head>'))throw Error('Reviewed comparison head missing');
 return html.replace('</head>',PRIME_LEGEND_COMPARISON_WRAP+'</head>');
}
const attr=(n,k)=>n?.attrs?.find(a=>a.name===k)?.value;
const set=(n,k,v)=>{n.attrs??=[];const a=n.attrs.find(a=>a.name===k);if(a)a.value=v;else n.attrs.push({name:k,value:v});};
const has=(n,c)=>(attr(n,'class')||'').split(/\s+/).includes(c);
const all=(n,test,out=[])=>{if(test(n))out.push(n);for(const c of n.childNodes||[])all(c,test,out);return out;};
const one=(n,test)=>all(n,test)[0];
const text=n=>n.nodeName==='#text'?n.value:(n.childNodes||[]).map(text).join('');
function move(n,parent,before=null){if(n===before)return;if(n.parentNode)n.parentNode.childNodes.splice(n.parentNode.childNodes.indexOf(n),1);n.parentNode=parent;const i=before?parent.childNodes.indexOf(before):-1;parent.childNodes.splice(i<0?parent.childNodes.length:i,0,n);}
function add(parent,html,before=null){const nodes=[...parseFragment(html).childNodes];for(const n of nodes)move(n,parent,before);return nodes[0];}
function section(n){while(n&&n.tagName!=='section')n=n.parentNode;return n;}
function cl(n,c){if(!has(n,c))set(n,'class',((attr(n,'class')||'')+' '+c).trim());}
export function editorialHTML(html,file=''){
 if(html.includes('data-architecture-version="1"')){
  const canonical=html.match(/<link\b[^>]*rel="canonical"[^>]*href="([^"]+)"/)?.[1];
  const repair=canonical==='https://oztimberfloor.com.au/'?HOME_COMPACT_THUMBNAILS:canonical==='https://oztimberfloor.com.au/products/avala-blackbutt/'?AVALA_RELATED_GRID:null;
  return repair&&!html.includes(repair)?html.replace('</head>',repair+'</head>'):html;
 }
 if(!html.includes('site-header'))return html;
 // parse5 relocates whitespace after </html> into <body>. Preserve that suffix
 // separately so repeated builds do not grow text nodes or alter source hashes.
 const suffix=html.match(/<\/html>(\s*)$/i)?.[1]||'';
 const dom=parse(suffix?html.slice(0,-suffix.length):html),body=one(dom,n=>n.tagName==='body'),head=one(dom,n=>n.tagName==='head'),main=one(body,n=>n.tagName==='main');if(!main)return html;
 set(body,'data-editorial-version','1');cl(body,'editorial');
 if(!one(head,n=>attr(n,'href')==='/assets/editorial-gallery.css'))add(head,'<link rel="stylesheet" href="/assets/editorial-gallery.css"><script src="/assets/editorial-gallery.js" defer></script>');
 if(!attr(main,'id'))set(main,'id','main-content');set(main,'tabindex','-1');
 if(!one(body,n=>has(n,'skip-link')))add(body,'<a class="skip-link" href="#'+attr(main,'id')+'">Skip to content</a>',body.childNodes[0]);
 const hero=one(main,n=>has(n,'hero')),grid=hero&&one(hero,n=>has(n,'hero-grid')||has(n,'product-hero-grid'));
 const canonical=attr(one(head,n=>n.tagName==='link'&&attr(n,'rel')==='canonical'),'href')||'';
 const route=canonical.replace('https://oztimberfloor.com.au','');
 const family=route==='/'?'home':/\/products\/[^/]+\//.test(route)?'product':/\/ranges\/[^/]+\//.test(route)?'range':/^\/(products|ranges|hybrid|laminate|engineered-timber-flooring|solid-timber|vinyl)\/$/.test(route)?'discovery':route==='/contact/'?'contact':route==='/projects/'?'projects':'secondary';
 set(body,'data-editorial-family',family);
 if(route==='/products/avala-blackbutt/'&&attr(body,'data-mobile-page')==='product'&&!one(head,n=>n.tagName==='style'&&attr(n,'data-avala-related-grid')!==undefined))add(head,AVALA_RELATED_GRID);
 if(route==='/thank-you/'){
  // Repair the inherited mismatched anchor/article markup. Keep all meaningful
  // links; remove only empty parser-created copies of the products anchor.
  for(const a of all(main,n=>n.tagName==='a'&&has(n,'link-card')&&attr(n,'href')==='/products/')){
   const nested=(a.childNodes||[]).filter(n=>n.tagName==='article');
   let previous=a;for(const card of nested){const parent=a.parentNode;move(card,parent,parent.childNodes[parent.childNodes.indexOf(previous)+1]);previous=card;}
   if(!text(a).trim()){a.parentNode.childNodes.splice(a.parentNode.childNodes.indexOf(a),1);}
  }
 }
 if(family==='home'&&grid){
  // Keep the existing 76px mobile thumbnail rows compact; the general gallery
  // image height must not stretch these narrow thumbnails to 265px.
  if(!one(head,n=>n.tagName==='style'&&attr(n,'data-home-compact-thumbnails')!==undefined))add(head,HOME_COMPACT_THUMBNAILS);
  const h1=one(hero,n=>n.tagName==='h1');cl(h1,'editorial-search-heading');
  if(!one(hero,n=>has(n,'editorial-display')))add(h1.parentNode,'<p class="editorial-display">A beautiful floor.<br>A considered<br>beginning.</p>',h1.parentNode.childNodes[h1.parentNode.childNodes.indexOf(h1)+1]);
  const material=all(main,n=>n.tagName==='section').find(n=>one(n,x=>has(x,'category-card')));
  if(material){cl(material,'editorial-materials');set(material,'data-mobile-order','1');move(material,main,hero.nextSibling||main.childNodes[main.childNodes.indexOf(hero)+1]);}
  const pathways=one(main,n=>attr(n,'id')==='home-pathways');if(pathways)set(pathways,'data-mobile-order','2');
 }
 if(family==='product'&&grid){
  const gallery=one(grid,n=>has(n,'catalogue-gallery'));if(gallery){
   move(gallery,grid,grid.childNodes[0]);
   // Some reviewed product families use semantic figures rather than the
   // original gallery-item divs. Apply the same disclosure, not a new layout.
   const figures=(gallery.childNodes||[]).filter(n=>n.tagName==='figure'&&one(n,x=>x.tagName==='img'));
   figures.forEach(n=>cl(n,'catalogue-gallery-item'));
   if(figures.length&&!one(gallery,n=>has(n,'primary'))){cl(figures[0],'primary');const image=one(figures[0],n=>n.tagName==='img');if(attr(image,'loading')==='lazy')set(image,'loading','eager');}
   const extra=(gallery.childNodes||[]).filter(n=>has(n,'catalogue-gallery-item')&&!has(n,'primary'));
   if(extra.length){const d=one(gallery,n=>n.tagName==='details'&&has(n,'editorial-extra-photos'))||add(gallery,'<details class="editorial-extra-photos"><summary>More product photos</summary></details>');extra.forEach(n=>move(n,d));}
  }
  const row=one(hero,n=>has(n,'button-row'));if(row&&!attr(row,'data-editorial-actions')){set(row,'data-editorial-actions','true');const links=all(row,n=>n.tagName==='a');const stock=links.find(n=>(attr(n,'href')||'').includes('enquiry=stock'));if(stock){links.forEach(n=>set(n,'class','button-secondary'));set(stock,'class','button');move(stock,row,row.childNodes[0]);}if(links.length>2&&!one(row,n=>has(n,'editorial-more-actions'))){const primary=[stock,links.find(n=>(attr(n,'href')||'').includes('enquiry=supply-install'))].filter(Boolean);primary.forEach(n=>move(n,row));const secondary=links.filter(n=>!primary.includes(n));const d=add(row,'<details class="editorial-more-actions"><summary>More enquiry options</summary></details>');secondary.forEach(n=>move(n,d));}}
 }
 if(family==='contact'){
  const formSection=one(main,n=>attr(n,'id')==='contact-form-start');if(formSection&&hero){move(formSection,main,main.childNodes[main.childNodes.indexOf(hero)+1]);const image=one(hero,n=>has(n,'hero-media'));if(image){const extra=add(main,'<section class="section editorial-contact-inspiration"><div class="shell"><details><summary>Flooring inspiration</summary><div class="editorial-inspiration-photo"></div></details></div></section>');move(image,one(extra,n=>has(n,'editorial-inspiration-photo')));}}
 }
 if(['range','discovery'].includes(family)){
  const listings=all(main,n=>n.tagName==='section'&&!!one(n,x=>has(x,'range-summary-card')||has(x,'product-card')));
  let anchor=hero;for(const listing of listings){if(listing===hero)continue;set(listing,'data-mobile-order','1');if(anchor&&listing.parentNode===main){move(listing,main,main.childNodes[main.childNodes.indexOf(anchor)+1]);anchor=listing;}}
  if(family==='discovery'&&listings.length&&hero){const media=one(hero,n=>has(n,'hero-media'));if(media){const extra=add(main,'<section class="section editorial-material-image"><div class="shell"><details><summary>Material image</summary><div class="editorial-inspiration-photo"></div></details></div></section>');move(media,one(extra,n=>has(n,'editorial-inspiration-photo')));cl(hero,'editorial-discovery-intro');}}
 }
 // Existing native disclosures keep all copy in the initial document.
 for(const img of all(main,n=>n.tagName==='img')){
  const src=attr(img,'src');if(!src?.startsWith('/assets/')||!/\.(png|jpe?g|webp|gif)$/i.test(src))continue;
  if(!sizes.has(src)){try{sizes.set(src,readImageSize(path.join(root,src)));}catch{sizes.set(src,null);}}
  const size=sizes.get(src);if(size){if(!attr(img,'width'))set(img,'width',String(size.width));if(!attr(img,'height'))set(img,'height',String(size.height));}
 }
 const reviewed=reviewedETF10ETF12ComparisonHTML(reviewedETF15ComparisonHTML(reviewedUltimoPathwayHTML(reviewedSolidPathwayHTML(reviewedBotanicaPathwayHTML(reviewedComparisonHTML(reviewedBotanicaCastelSupportHTML(reviewedAspireBelleSupportHTML(reviewedSupportHTML(serialize(dom),route),route),route),route),route),route),route),route),route);
 const iconic=reviewedIconicBadgeHTML(reviewedIconicCountHTML(reviewed,route,iconicRange),route);
 return reviewedLifestyleBadgeHTML(reviewedLifestyleCountHTML(iconic,route,lifestyleRange),route)+suffix;
}
export function applyEditorial(){let changed=0,total=0;function walk(dir){for(const e of fs.readdirSync(dir,{withFileTypes:true})){if(e.name.startsWith('.')||['docs','node_modules','dist','assistant','data','migration'].includes(e.name))continue;const p=path.join(dir,e.name);if(e.isDirectory())walk(p);else if(e.name.endsWith('.html')){const old=fs.readFileSync(p,'utf8'),relative=path.relative(root,p),reviewedRoute=rangeSprintContract.pages.find(page=>page.file===relative)?.route,next=reviewedETF12FormatHTML(repairReviewedRangeHTML(editorialHTML(old,relative),reviewedRoute),'/'+relative.split(path.sep).join('/').replace(/index[.]html$/,''));total++;if(next!==old){fs.writeFileSync(p,next);changed++;}}}}walk(root);return{total,changed};}
if(process.argv[1]===fileURLToPath(import.meta.url))console.log('Editorial presentation',applyEditorial());
