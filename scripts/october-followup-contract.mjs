// New approval-scope check. It does not replace or reset any earlier baseline.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {createPublicationInventory} from './publication-inventory.mjs';
import {routing} from './october-route-fixture.mjs';
const baseline=process.env.OZ_FOLLOWUP_ENTRY||'/tmp/oz-followup.1IKA4M/entry';
const read=f=>fs.readFileSync(f,'utf8'),old=f=>fs.readFileSync(path.join(baseline,f),'utf8'),sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const protectedFiles=['data/catalogue-quality-overrides.json','sitemap.xml','robots.txt','netlify.toml','assets/contact-config.js','assets/site.css','contact/index.html','thank-you/index.html','privacy/index.html','terms/index.html'];
for(const f of protectedFiles)assert.equal(read(f),old(f),'Protected input changed: '+f);
const routes=JSON.parse(read('config/october-followup-routes.json'));let redirects=read('_redirects');
for(const [from,to] of Object.entries(routes)){const line=`${from} ${to} 301\n`;assert.equal(redirects.split(line).length,2);assert.ok(redirects.indexOf(line)<redirects.indexOf('/* /404.html 404'));redirects=redirects.replace(line,'');}
assert.equal(redirects,old('_redirects'),'No inherited redirect may be rewritten');
const before=JSON.parse(old('data/product-catalogue.json')),after=JSON.parse(read('data/product-catalogue.json'));
const specs=JSON.parse(read('docs/migration-october-2026-followup/supplier/product-specifications.json')),ids=new Set(specs.map(x=>x.record)),ranges=new Set(specs.map(x=>x.range));let fields=0;
for(const type of ['products','ranges']){assert.equal(after[type].length,before[type].length);for(let i=0;i<after[type].length;i++){
 const a=structuredClone(after[type][i]),b=structuredClone(before[type][i]);
 if(type==='products'?ids.has(a.id):ranges.has(a.slug))for(const k of type==='products'?['thickness','totalThickness']:['thickness']){if(a[k]!==b[k])fields++;delete a[k];delete b[k];}
 assert.deepEqual(a,b,'Unrelated catalogue drift: '+a.slug);
}}
function walk(dir){return fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.name==='.git'||e.name==='dist'||e.name==='node_modules'||e.name==='docs'||e.name==='migration'||e.name==='config'?[]:e.isDirectory()?walk(path.join(dir,e.name)):[path.join(dir,e.name)]);}
function protectedMarkup(h){return {title:h.match(/<title>[\s\S]*?<\/title>/)?.[0],meta:[...h.matchAll(/<meta[^>]*(?:name="(?:description|robots)"|property="og:[^"]+")[^>]*>/g)].map(m=>m[0]),canonical:h.match(/<link[^>]*rel="canonical"[^>]*>/)?.[0],h1:[...h.matchAll(/<h1\b[^>]*>[\s\S]*?<\/h1>/g)].map(m=>m[0]),hrefs:[...h.matchAll(/\bhref="([^"]*)"/g)].map(m=>m[1]),forms:[...h.matchAll(/<form\b[^>]*>/g)].map(m=>m[0])};}
let changedHtml=0;
for(const file of walk(process.cwd()).filter(f=>f.endsWith('.html'))){const rel=path.relative(process.cwd(),file);if(!fs.existsSync(path.join(baseline,rel)))continue;const a=read(file),b=old(rel);if(a===b)continue;changedHtml++;assert.deepEqual(protectedMarkup(a),protectedMarkup(b),'SEO/form drift: '+rel);
 const schemas=h=>[...h.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map(m=>JSON.parse(m[1]));
 const clean=x=>Array.isArray(x)?x.filter(v=>v?.name!=='Thickness').map(clean):x&&typeof x==='object'?Object.fromEntries(Object.entries(x).map(([k,v])=>[k,clean(v)])):x;
 assert.deepEqual(clean(schemas(a)),clean(schemas(b)),'Non-thickness schema changed: '+rel);
}
const inv=createPublicationInventory({root:process.cwd(),domain:'https://oztimberfloor.com.au'}),prior=createPublicationInventory({root:baseline,domain:'https://oztimberfloor.com.au'});
assert.deepEqual(inv.publicationRoutes,prior.publicationRoutes);assert.deepEqual(inv.noindexRoutes,prior.noindexRoutes);assert.deepEqual(inv.sitemapRoutes,inv.publicationRoutes);assert.equal(inv.blockingIssues.length,0);
const resolver=routing('dist');for(const [from,to] of Object.entries(routes)){const r=resolver.resolve(from);assert.equal(r.hops,1);assert.equal(r.destination,to);assert.equal(r.status,200);}
const image=JSON.parse(read('docs/migration-october-2026-followup/legacy-image.json'));assert.equal(sha(fs.readFileSync(image.file)),image.sha256);
let historicalFiles=0;function seal(dir){for(const e of fs.readdirSync(dir,{withFileTypes:true})){const p=path.join(dir,e.name);if(e.isDirectory())seal(p);else{const rel=path.relative(baseline,p);assert.equal(sha(fs.readFileSync(rel)),sha(fs.readFileSync(p)),'Historical October evidence changed: '+rel);historicalFiles++;}}}seal(path.join(baseline,'docs/migration-october-2026'));
console.log(JSON.stringify({success:true,protectedFiles:protectedFiles.length,changedHtml,catalogueFields:fields,publication:inv.publicationRoutes.length,noindex:inv.noindexRoutes.length,additionalRedirects:Object.keys(routes).length,historicalOctoberFilesUnchanged:historicalFiles},null,2));
