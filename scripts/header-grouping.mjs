// Shared shell only. No page content, forms, provider or measurement changes.
import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';
const menuContactActions=[
 ['<a href="tel:+61435496975">0435 496 975</a>','<a class="button-secondary arch-menu-contact-action" href="tel:+61435496975" aria-label="Call Oz Timber Floor on 0435 496 975" title="0435 496 975">Call</a>'],
 ['<a href="mailto:info@oztimberfloor.com.au">info@oztimberfloor.com.au</a>','<a class="button-secondary arch-menu-contact-action" href="mailto:info@oztimberfloor.com.au" aria-label="Email Oz Timber Floor at info@oztimberfloor.com.au" title="info@oztimberfloor.com.au">Email</a>'],
];
export function menuContactButtons(html,{reverse=false}={}){return html.replace(/<div class="arch-menu-contact">[\s\S]*?<\/div>/g,group=>menuContactActions.reduce((s,[before,after])=>s.replaceAll(reverse?after:before,reverse?before:after),group));}
export function groupedHeaderHTML(html,{floorPlan=false,currentPath=''}={}){
 currentPath||=html.match(/rel="canonical" href="https:\/\/oztimberfloor\.com\.au([^"?]*)"/)?.[1]||'';
 return html.replace(/<header\b[^>]*>[\s\S]*?<\/header>/g,header=>{
  if(!header.includes('class="arch-primary"'))return header;
  const primary=[['Products','/products/'],['Services','/services/'],['Projects','/projects/'],...(floorPlan?[['Floor Area Tool','/floor-plan/']]:[])].map(([label,url])=>'<a href="'+url+'"'+(url===currentPath?' aria-current="page"':'')+'>'+label+'</a>').join('');
  let next=header.replace(/(<nav\b[^>]*class="arch-primary"[^>]*>)[\s\S]*?<\/nav>/,'$1'+primary+'</nav>');
  const search=next.match(/<a\b[^>]*class="arch-search-open arch-tool"[^>]*>[\s\S]*?<\/a>/)?.[0];
  if(search&&next.includes('<div class="arch-header-tools header-actions">'))next=next.replace(search,'').replace('<div class="arch-header-tools header-actions">','<div class="arch-header-tools header-actions">'+search);
  return menuContactButtons(next.replaceAll('<a href="/floor-plan/">Floor Plan</a>','<a href="/floor-plan/">Floor Area Tool</a>'));
 });
}
// Used only by historical source checks. The caller must still verify the exact
// complete historical file hash; this is not an approval or runtime bypass.
export function previousHeaderGrouping(html){const currentPath=html.match(/rel="canonical" href="https:\/\/oztimberfloor\.com\.au([^"?]*)"/)?.[1]||'';return html.replace(/<header\b[^>]*>[\s\S]*?<\/header>/g,header=>{
 if(!header.includes('class="arch-browse-group"'))return header;
 const added=[['Projects','/projects/'],['Floor Plan','/floor-plan/']].map(([label,url])=>'<a href="'+url+'"'+(url===currentPath?' aria-current="page"':'')+'>'+label+'</a>');
 let next=header.replace(/(<nav\b[^>]*class="arch-primary"[^>]*>)([\s\S]*?)(<\/nav>)/,(whole,open,links,close)=>open+added.reduce((s,link)=>s.replace(link,''),links)+close);
 const search=next.match(/<a\b[^>]*class="arch-search-open arch-tool"[^>]*>[\s\S]*?<\/a>/)?.[0];
 if(search&&next.includes('<div class="arch-header-tools header-actions">'+search))next=next.replace(search,'').replace(/(<div class="arch-browse-group"><nav\b[^>]*>[\s\S]*?<\/nav>)(<\/div>)/,'$1'+search+'$2');
 return menuContactButtons(next,{reverse:true});
});}
export function applyHeaderGrouping(root){let checked=0,changed=0;const skip=new Set(['.git','node_modules','dist','docs','assistant','data','config','scripts','migration','floor-plan','netlify']);function walk(dir){for(const e of fs.readdirSync(dir,{withFileTypes:true})){if(e.name.startsWith('.')||skip.has(e.name)||e.isSymbolicLink())continue;const p=path.join(dir,e.name);if(e.isDirectory())walk(p);else if(e.name.endsWith('.html')){checked++;const before=fs.readFileSync(p,'utf8'),after=groupedHeaderHTML(before);if(before!==after){fs.writeFileSync(p,after);changed++;}}}}walk(root);return{checked,changed};}
if(process.argv[1]===fileURLToPath(import.meta.url)){if(!process.argv.includes('--apply'))throw Error('Explicit --apply required');console.log(applyHeaderGrouping(path.resolve(import.meta.dirname,'..')));}
