// A narrow addendum, not a replacement for the sealed September approval contract.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createPublicationInventory} from './publication-inventory.mjs';
const entry='2cdf99368af7d963ae0e4aabeaeaaae8c01486dd';
const before=f=>execFileSync('git',['show',`${entry}:${f}`],{encoding:'utf8',maxBuffer:30e6});
const current=f=>fs.readFileSync(f,'utf8');
const routes=JSON.parse(current('config/october-article-routes.json'));
const r1=JSON.parse(current('docs/seo-migration/OZ-MIG-004/revisions/R1/DECISION_PLAN_R1.json'));
for(const f of ['data/catalogue-quality-overrides.json','robots.txt','netlify.toml','contact/index.html','thank-you/index.html','assets/contact-config.js','assets/site.css','privacy/index.html','terms/index.html'])assert.equal(current(f),before(f),`Protected input changed: ${f}`);
let redirect=current('_redirects');
for(const [slug,target] of Object.entries(routes))if(target){const line=`/${slug}/ ${target} 301\n`;assert.equal(redirect.split(line).length,2);assert.ok(redirect.indexOf(line)<redirect.indexOf('/* /404.html 404'));redirect=redirect.replace(line,'');}
assert.equal(redirect,before('_redirects'),'Only the three article redirects are authorized in this pending candidate');
const inventory=createPublicationInventory({root:process.cwd(),domain:'https://oztimberfloor.com.au'});
const additions=Object.entries(routes).filter(([,target])=>!target).map(([s])=>'/'+s+'/');
assert.deepEqual(inventory.publicationRoutes,[...r1.fullProposedPublication.publicationRoutes,...additions].sort());
assert.deepEqual(inventory.noindexRoutes,r1.fullProposedPublication.noindexRoutes);
assert.deepEqual(inventory.sitemapRoutes,inventory.publicationRoutes);
assert.equal(inventory.blockingIssues.length,0);
const changed=execFileSync('git',['diff','--name-only',entry],{encoding:'utf8'}).trim().split('\n').filter(f=>f.endsWith('.html'));
function protectedMarkup(html) {
  return {
    title:html.match(/<title>[\s\S]*?<\/title>/)?.[0],
    meta:[...html.matchAll(/<meta[^>]*(?:name="(?:description|robots)"|property="og:[^"]+")[^>]*>/g)].map(m=>m[0]),
    canonical:html.match(/<link[^>]*rel="canonical"[^>]*>/)?.[0],
    h1:[...html.matchAll(/<h1\b[^>]*>[\s\S]*?<\/h1>/g)].map(m=>m[0]),
    hrefs:[...html.matchAll(/\bhref="([^"]*)"/g)].map(m=>m[1]),
    forms:[...html.matchAll(/<form\b[^>]*>/g)].map(m=>m[0])
  };
}
for(const f of changed){
  const actual=protectedMarkup(current(f));
  if(f==='guides/index.html'){
    for(const route of additions)assert.equal(actual.hrefs.filter(h=>h===route).length,1,'Restored article needs one guide-library link');
    actual.hrefs=actual.hrefs.filter(h=>!additions.includes(h));
  }
  assert.deepEqual(actual,protectedMarkup(before(f)),`Protected SEO/form contract drift: ${f}`);
}
const fields=JSON.parse(current('data/product-catalogue.json')),old=JSON.parse(before('data/product-catalogue.json'));
assert.equal(fields.products.length,old.products.length);assert.equal(fields.ranges.length,old.ranges.length);
const allowed=new Set(['thickness','totalThickness','installationMethod','shortDescription','colourCount']);
for(const type of ['products','ranges'])for(let i=0;i<fields[type].length;i++){
  const a={...fields[type][i]},b={...old[type][i]};for(const key of allowed){delete a[key];delete b[key];}
  assert.deepEqual(a,b,`Unrelated catalogue change: ${type}:${i}`);
}
console.log(JSON.stringify({success:true,entryHead:entry,protectedExistingHtml:changed.length,publicationPages:inventory.publicationRoutes.length,restoredArticles:additions,noindexRoutesUnchanged:inventory.noindexRoutes.length,redirectDelta:3,historicalContract:'Retained unchanged; its exact September hashes are not a current-candidate approval'},null,2));
