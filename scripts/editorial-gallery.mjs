// Deterministic presentation pass. Existing content, facts and URL contracts are authoritative.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {parse,parseFragment,serialize} from 'parse5';
import {readImageSize} from './image-dimension-audit.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const sizes=new Map();
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
 if(!html.includes('site-header'))return html;
 const dom=parse(html),body=one(dom,n=>n.tagName==='body'),head=one(dom,n=>n.tagName==='head'),main=one(body,n=>n.tagName==='main');if(!main)return html;
 set(body,'data-editorial-version','1');cl(body,'editorial');
 if(!one(head,n=>attr(n,'href')==='/assets/editorial-gallery.css'))add(head,'<link rel="stylesheet" href="/assets/editorial-gallery.css"><script src="/assets/editorial-gallery.js" defer></script>');
 if(!attr(main,'id'))set(main,'id','main-content');set(main,'tabindex','-1');
 if(!one(body,n=>has(n,'skip-link')))add(body,'<a class="skip-link" href="#'+attr(main,'id')+'">Skip to content</a>',body.childNodes[0]);
 const hero=one(main,n=>has(n,'hero')),grid=hero&&one(hero,n=>has(n,'hero-grid')||has(n,'product-hero-grid'));
 const canonical=attr(one(head,n=>n.tagName==='link'&&attr(n,'rel')==='canonical'),'href')||'';
 const route=canonical.replace('https://oztimberfloor.com.au','');
 const family=route==='/'?'home':/\/products\/[^/]+\//.test(route)?'product':/\/ranges\/[^/]+\//.test(route)?'range':/^\/(products|ranges|hybrid|laminate|engineered-timber-flooring|solid-timber|vinyl)\/$/.test(route)?'discovery':route==='/contact/'?'contact':route==='/projects/'?'projects':'secondary';
 set(body,'data-editorial-family',family);
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
  const h1=one(hero,n=>n.tagName==='h1');cl(h1,'editorial-search-heading');
  if(!one(hero,n=>has(n,'editorial-display')))add(h1.parentNode,'<p class="editorial-display">A beautiful floor.<br>A considered<br>beginning.</p>',h1.parentNode.childNodes[h1.parentNode.childNodes.indexOf(h1)+1]);
  const material=all(main,n=>n.tagName==='section').find(n=>one(n,x=>has(x,'category-card')));
  if(material){cl(material,'editorial-materials');set(material,'data-mobile-order','1');move(material,main,hero.nextSibling||main.childNodes[main.childNodes.indexOf(hero)+1]);}
  const pathways=one(main,n=>attr(n,'id')==='home-pathways');if(pathways)set(pathways,'data-mobile-order','2');
 }
 if(family==='product'&&grid){
  const gallery=one(grid,n=>has(n,'catalogue-gallery'));if(gallery){move(gallery,grid,grid.childNodes[0]);const extra=(gallery.childNodes||[]).filter(n=>has(n,'catalogue-gallery-item')&&!has(n,'primary'));if(extra.length){const d=add(gallery,'<details class="editorial-extra-photos"><summary>More product photos</summary></details>');extra.forEach(n=>move(n,d));}}
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
 return serialize(dom);
}
export function applyEditorial(){let changed=0,total=0;function walk(dir){for(const e of fs.readdirSync(dir,{withFileTypes:true})){if(e.name.startsWith('.')||['docs','node_modules','dist','assistant','data','migration'].includes(e.name))continue;const p=path.join(dir,e.name);if(e.isDirectory())walk(p);else if(e.name.endsWith('.html')){const old=fs.readFileSync(p,'utf8'),next=editorialHTML(old,path.relative(root,p));total++;if(next!==old){fs.writeFileSync(p,next);changed++;}}}}walk(root);return{total,changed};}
if(process.argv[1]===fileURLToPath(import.meta.url))console.log('Editorial presentation',applyEditorial());
