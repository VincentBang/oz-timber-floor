// Owner-approved four exact product-owner consolidations; local only.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
const apply=process.argv.includes('--apply'),entry='/tmp/oz-demarque.p7Js7j';
const colours=['copper-brown','dusk-grey','matterhorn','polar-ice'];
const pairs=colours.map(c=>({colour:c,old:`/products/wide-plank-water-resistant-laminate-wide-plank-${c}/`,owner:`/products/de-marque-oak-wide-plank-${c}/`}));
const read=f=>fs.readFileSync(f,'utf8'),changes=[];
function update(file,after){const before=read(file);if(before===after)return;changes.push({file});if(apply){const backup=path.join(entry,file);if(!fs.existsSync(backup)){fs.mkdirSync(path.dirname(backup),{recursive:true});fs.writeFileSync(backup,before);}fs.writeFileSync(file,after);}}
const data=JSON.parse(read('data/product-catalogue.json')),controls=JSON.parse(read('data/catalogue-quality-overrides.json'));
data.productAliases ||= [];
for(const p of pairs){
 p.id=p.old.split('/')[2];p.ownerId=p.owner.split('/')[2];
 const target=data.products.find(x=>x.id===p.ownerId);assert.ok(target);assert.equal(target.range,'De Marque Oak');assert.equal(target.thickness,'15mm');
 const source=data.products.find(x=>x.id===p.id)||data.productAliases.find(x=>x.id===p.id);assert.ok(source);assert.equal(source.supplierSourceUrl,target.supplierSourceUrl);assert.equal(source.colour,target.colour);assert.equal(source.boardSize,target.boardSize);
 if(!data.productAliases.some(x=>x.id===p.id))data.productAliases.push({...source,publicCatalogueStatus:'legacy-alias',canonicalUrl:'https://oztimberfloor.com.au'+p.owner,replacementRoute:p.owner,aliasApprovedAt:'2026-10-07'});
 data.products=data.products.filter(x=>x.id!==p.id);
 controls.pages[p.old]={classification:'redirect-only',applyNoindex:true,replacementRoute:p.owner,replacementBasis:'exact-supplier-range-colour-product',directRedirect:true,reason:'Owner approved four De Marque duplicate-owner consolidations on 2026-10-07; not ASPECT. Exact existing equivalent product.'};
 const f=p.old.slice(1)+'index.html';let h=read(f);
 h=h.replace(/(<link rel="canonical" href=")[^"]+(")/,`$1https://oztimberfloor.com.au${p.owner}$2`).replace(/(<meta name="robots" content=")[^"]+(")/,'$1noindex,follow$2');
 h=h.replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/g,'');
 h=h.replace(/<title>[^<]*<\/title>/,`<title>${target.name} — product page moved | Oz Timber Floor</title>`).replace(/(<meta name="description" content=")[^"]*(")/,`$1Find ${target.name} specifications and stock enquiries on its current product page.$2`);
 h=h.replace(/<main\b[^>]*>[\s\S]*?<\/main>/,`<main id="main-content"><section class="section"><div class="shell"><h1>${target.name}</h1><p>This product is part of the De Marque engineered oak range, not ASPECT laminate.</p><a class="button" href="${p.owner}">View product details and check stock</a></div></section></main>`);
 update(f,h);
}
update('data/product-catalogue.json',JSON.stringify(data,null,2)+'\n');update('data/catalogue-quality-overrides.json',JSON.stringify(controls,null,2)+'\n');
let redirects=read('_redirects'),ruleChanges=[];
redirects=redirects.split('\n').map(line=>{const parts=line.trim().split(/\s+/);const p=pairs.find(p=>parts[1]===p.old);if(!p)return line;const after=line.replace(p.old,p.owner);ruleChanges.push({before:line,after,forcePreserved:true});return after;}).join('\n');
const marker='# Owner-approved De Marque exact duplicate consolidation — 2026-10-07';
const additions=pairs.flatMap(p=>[`${p.old} ${p.owner} 301!`,`${p.old}index.html ${p.owner} 301!`]);
if(!redirects.includes(marker))redirects=marker+'\n'+additions.join('\n')+'\n'+redirects;
update('_redirects',redirects);
let sitemap=read('sitemap.xml');for(const p of pairs)sitemap=sitemap.replace(/\s*<url>\s*<loc>([^<]+)<\/loc>[\s\S]*?<\/url>/g,(tag,url)=>url==='https://oztimberfloor.com.au'+p.old?'':tag);update('sitemap.xml',sitemap);
const files=execFileSync('git',['ls-files','*.html'],{encoding:'utf8'}).trim().split('\n');
for(const f of files){if(pairs.some(p=>f===p.old.slice(1)+'index.html'))continue;let h=read(f);
 h=h.replace(/<article\b[^>]*>[\s\S]*?<\/article>/g,card=>{const p=pairs.find(p=>card.includes(`href="${p.old}"`));if(!p)return card;return card.replaceAll('Wide Plank Water Resistant Laminate','De Marque Oak').replaceAll('>Laminate<','>Engineered timber<').replaceAll(' laminate ',' engineered timber ');});
 for(const p of pairs)h=h.replaceAll(p.old,p.owner);
 h=h.replace(/href="(\/contact\/\?[^\"]*)"/g,(tag,raw)=>{const u=new URL(raw.replaceAll('&amp;','&'),'https://oztimberfloor.com.au'),p=pairs.find(p=>u.searchParams.get('productSlug')===p.id);if(!p)return tag;const target=data.products.find(x=>x.id===p.ownerId);u.searchParams.set('productSlug',p.ownerId);u.searchParams.set('product',target.name);u.searchParams.set('range',target.range);u.searchParams.set('category',target.category);if(u.searchParams.get('source')===p.old)u.searchParams.set('source',p.owner);return `href="${(u.pathname+u.search).replaceAll('&','&amp;')}"`;});
 update(f,h);
}
if(apply&&changes.length){fs.mkdirSync('docs/demarque-consolidation',{recursive:true});const file='docs/demarque-consolidation/implementation.json';if(!fs.existsSync(file))fs.writeFileSync(file,JSON.stringify({approvedAt:'2026-10-07',entry,pairs,ruleChanges,addedRules:additions,changes,ordering:'Eight exact forced rules prepended; existing incoming rule order, conditions and force behaviour unchanged',rollback:'Restore only files listed in changes from entry backup; preserve other inherited edits',archival:'Four complete source records moved intact to productAliases with alias metadata, not discarded'},null,2)+'\n');}
console.log(JSON.stringify({apply,changes,pairs:4,incomingRules:ruleChanges.length},null,2));if(changes.length&&!apply)process.exitCode=1;
