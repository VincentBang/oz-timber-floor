import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {routing} from './october-route-fixture.mjs';
import {createPublicationInventory} from './publication-inventory.mjs';
const out='docs/migration-october-2026-final-repairs';
const audit=JSON.parse(fs.readFileSync('/Users/daibang/Documents/Codex/2026-10-07/referenced-chatgpt-conversation-this-is-an-2/outputs/migration-audit-evidence-2026-10-07.json'));
const read=f=>fs.readFileSync(f,'utf8');
const r=routing('dist'),failures=[],checks=[];
function check(name,fn){try{fn();checks.push({name,pass:true});}catch(e){checks.push({name,pass:false,error:e.message});failures.push(name);}}
const legacy=audit.legacy_routes.map(row=>{const route=new URL(row.url).pathname,actual=r.resolve(route);check('legacy:'+route,()=>{assert.equal(actual.status,row.status);assert.equal(actual.hops,row.hops);assert.equal(actual.destination,new URL(row.final).pathname);assert.equal(actual.loop,false);});return{route,status:actual.status,hops:actual.hops,destination:actual.destination};});
const inv=createPublicationInventory({root:path.resolve('dist'),domain:'https://oztimberfloor.com.au'});
check('exact-publication-contract',()=>{assert.equal(inv.publicationRoutes.length,771);assert.deepEqual(inv.publicationRoutes,inv.sitemapRoutes);assert.deepEqual(inv.sitemapRoutes,[...audit.sitemap_routes.map(x=>new URL(x.url).pathname)].sort());});
for(const route of inv.sitemapRoutes)check('publication:'+route,()=>{
 const res=r.resolve(route);assert.equal(res.status,200);assert.equal(res.hops,0);
 const html=read('dist/'+res.file);assert.equal((html.match(/<h1\b/g)||[]).length,1);assert.equal((html.match(/<title>/g)||[]).length,1);assert.equal((html.match(/rel="canonical"/g)||[]).length,1);
 const canonical=(html.match(/<link\b[^>]*>/g)||[]).find(t=>/rel="canonical"/.test(t));
 assert.equal(canonical?.match(/href="([^"]+)"/)?.[1],`https://oztimberfloor.com.au${route}`);
 const description=(html.match(/<meta\b[^>]*>/g)||[]).find(t=>/name="description"/.test(t));assert.ok((description?.match(/content="([^"]+)"/)?.[1]||'').length>=15);assert.doesNotMatch(html,/<meta[^>]*name="robots"[^>]*content="[^"]*noindex/);
});
check('sitemap-index-direct-redirect',()=>{const res=r.resolve('/sitemap_index.xml');assert.equal(res.status,200);assert.equal(res.hops,1);assert.equal(res.destination,'/sitemap.xml');});
const entry=JSON.parse(read(out+'/entry.json'));
const protectedFiles=['data/product-catalogue.json','data/catalogue-quality-overrides.json','sitemap.xml','robots.txt','assets/contact-config.js','assets/site.js'];
const {createHash}=await import('node:crypto');
check('existing-redirects-byte-preserved',()=>{
 const original=read('_redirects').replace('# WordPress sitemap compatibility; canonical sitemap remains /sitemap.xml\n/sitemap_index.xml /sitemap.xml 301\n','');
 assert.equal(createHash('sha256').update(original).digest('hex'),entry.hashes._redirects);
});
for(const file of protectedFiles)check('preserved:'+file,()=>assert.equal(createHash('sha256').update(read(file)).digest('hex'),entry.hashes[file]));
for(const file of ['config/october-article-routes.json','config/october-followup-routes.json'])for(const [slug,target]of Object.entries(JSON.parse(read(file))))check('restored-article:'+slug,()=>{const route=slug.startsWith('/')?slug:'/'+slug+'/';assert.equal(r.resolve(route).status,200);if(target)assert.equal(r.resolve(route).destination,target);});
const data=JSON.parse(read('data/product-catalogue.json'));
const range=data.ranges.find(x=>x.slug==='hardwood-collection');
check('hardwood-derived-count',()=>{const expected=range.productSlugs.filter(s=>inv.sitemapRoutes.includes('/products/'+s.replace(/^\/?products\//,'').replace(/\/$/,'')+'/')).length;assert.equal(expected,12);assert.equal(range.colourCount,expected);});
check('aquastop-range-and-beach',()=>{assert.equal(data.ranges.find(x=>x.slug==='kronoswiss-aquastop').thickness,'8 / 12 / 14 mm');assert.equal(data.products.find(x=>x.slug==='kronoswiss-aquastop-beach').thickness,'14mm');});
let links=0,assets=0,htmlFiles=0,cards=0;
function walk(dir){for(const e of fs.readdirSync(dir,{withFileTypes:true})){const file=path.join(dir,e.name);if(e.isDirectory()){walk(file);continue;}if(!e.name.endsWith('.html')||e.name.startsWith('google'))continue;htmlFiles++;const html=read(file);
 check('html:'+file,()=>{
  assert.doesNotMatch(html,/188 colours/);
  for(const m of html.matchAll(/<a\b[^>]*>[\s\S]*?<\/a>/g)){
   const card=m[0];if(!card.includes('range-summary-card'))continue;
   if(card.includes('href="/ranges/hardwood-collection/"')){cards++;assert.match(card,/12 colours/);}
   if(card.includes('href="/ranges/kronoswiss-aquastop/"')){cards++;assert.match(card,/8 \/ 12 \/ 14 mm/);assert.doesNotMatch(card,/>8mm</);}
  }
  for(const m of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)){const schema=JSON.parse(m[1]);assert.doesNotMatch(JSON.stringify(schema),/oztimberfloor\.netlify\.app/);}
  for(const m of html.matchAll(/(?:href|src)="(\/[^"\s]*)"/g)){
   if(m[1].startsWith('//'))continue;const target=m[1].replaceAll('&amp;','&');const res=r.resolve(target);
   if(/\.(?:webp|jpg|png|svg|css|js|ico|pdf)(?:[?#]|$)/.test(target))assets++;else links++;
   assert.equal(res.loop,false,target);assert.ok(res.status===200||res.status===410,`${target}: ${res.status}`);assert.ok(res.hops<=1,`${target}: ${res.hops} hops`);
  }
 });
}}
walk('dist');
for(const rule of r.rules.filter(x=>!x.from.includes('*')))check('rule:'+rule.from,()=>{const res=r.resolve(rule.from);assert.equal(res.loop,false);assert.ok(res.hops<=1);assert.ok([200,410].includes(res.status));});
check('preview-protections',()=>{assert.match(read('dist/_headers'),/noindex, nofollow/);assert.match(read('dist/assets/contact-config.js'),/ga4MeasurementId: null/);assert.match(read('dist/index.html'),/google-site-verification/);assert.ok(fs.existsSync('dist/googlea11728cf4d174049.html'));for(const d of ['docs','data','config','scripts','.git'])assert.equal(fs.existsSync('dist/'+d),false);});
for(const [route,id]of [['hybrid','compare-hybrid-construction'],['laminate','compare-laminate-construction'],['commercial-flooring','commercial-timber']])check('content:'+route,()=>assert.match(read(`dist/${route}/index.html`),new RegExp(`id="${id}"`)));
check('customer-installation-copy',()=>assert.doesNotMatch(read('dist/timber-floor-installation/index.html'),/Installation pages should/));
const summary={at:new Date().toISOString(),htmlFiles,links,assets,cards,legacy:legacy.length,direct200:legacy.filter(x=>x.status===200&&x.hops===0).length,redirect200:legacy.filter(x=>x.status===200&&x.hops===1).length,retired410:legacy.filter(x=>x.status===410).length,publication:inv.publicationRoutes.length,noindex:inv.noindexRoutes.length,redirectRules:r.rules.length,checks:checks.length,failures};
fs.writeFileSync(out+'/regression.json',JSON.stringify({summary,checks,legacy},null,2)+'\n');console.log(JSON.stringify(summary,null,2));if(failures.length)process.exitCode=1;
