// Bounded owner retirement. Source changes are emitted for apply_patch only.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
const root=process.cwd(),out=root+'/docs/seo-growth/evidence/2026-10-28-stonefloor-retirement';
const read=f=>fs.readFileSync(f,'utf8'),hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const approval=JSON.parse(read('config/stonefloor-legacy-retirement-2026-10-28.json'));
const files=['_redirects','data/product-catalogue.json','data/catalogue-quality-overrides.json','data/seo-migration-redirect-expectations.json',...approval.products.map(p=>p.heldRoute.slice(1)+'index.html')];
if(process.argv.includes('--baseline')){
 assert(!fs.existsSync(out),'Preserve previous evidence');fs.mkdirSync(out,{recursive:true});
 const originals=files.map(file=>{fs.mkdirSync(path.dirname(out+'/before/'+file),{recursive:true});fs.copyFileSync(file,out+'/before/'+file);return {file,sha256:hash(fs.readFileSync(file))};});
 const protectedFiles=['sitemap.xml','robots.txt','netlify.toml','assets/site.css','assets/site.js','assets/contact-config.js','contact.html','contact/index.html','projects.html','projects/index.html','assistant/config/production.json','assistant/config/paid-preview.json','assistant/generated/corpus.json','netlify/functions/flooring-assistant.mjs'].map(file=>({file,sha256:hash(fs.readFileSync(file))}));
 fs.writeFileSync(out+'/BASELINE.json',JSON.stringify({at:new Date().toISOString(),branch:execFileSync('git',['branch','--show-current'],{encoding:'utf8'}).trim(),head:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),originals,protectedFiles,approvalSha256:hash(fs.readFileSync('config/stonefloor-legacy-retirement-2026-10-28.json'))},null,2),{flag:'wx'});
 const generated=out+'/before-gate';fs.mkdirSync(generated);for(const f of ['catalogue-quality-report.json','gsc-equity-map-2026-09-01.csv'])fs.copyFileSync('docs/release/OZ-RELEASE-CLOSEOUT/generated/migration/'+f,generated+'/'+f);
 let status=0,output='';try{output=execFileSync(process.execPath,['scripts/seo-migration-hardening.mjs'],{encoding:'utf8',stdio:'pipe',env:{...process.env,OZ_MIGRATION_GENERATED_DIR:generated}});}catch(e){status=e.status;output=String(e.stdout||'')+String(e.stderr||'');}
 fs.writeFileSync(out+'/before-gate.log',output,{flag:'wx'});console.log(JSON.stringify({out,status,blockers:JSON.parse(read(generated+'/seo-migration-hardening-report.json')).blockers}));process.exit(0);
}
if(!process.argv.includes('--patch'))throw Error('Use --baseline or --patch');
assert(fs.existsSync(out+'/BASELINE.json'),'Record baseline before applying changes');
const data=JSON.parse(read('data/product-catalogue.json')),controls=JSON.parse(read('data/catalogue-quality-overrides.json')),expect=JSON.parse(read('data/seo-migration-redirect-expectations.json'));
const oldData=structuredClone(data),oldControls=structuredClone(controls),oldExpect=structuredClone(expect),changes=new Map();
let redirects=read('_redirects');
for(const item of approval.products){
 const p=data.products.find(p=>p.id===item.id),c=controls.pages[item.heldRoute];assert(p&&c);assert.equal(c.applyNoindex,true);assert.equal(c.directRedirect,false);
 assert(!Object.keys(p).some(k=>/price|cost|margin/i.test(k)),'Do not emit private pricing fields');
 const note='Owner retired this legacy colour from Oz Timber Floor\'s offer on 2026-10-28. Manufacturer discontinuation is not independently confirmed. General Stone Floor options are alternatives, not an exact replacement.';
 Object.assign(p,{publicCatalogueStatus:'retired',stockStatusLabel:'No longer offered by Oz Timber Floor',retirementDate:'2026-10-28',retirementBasis:'Owner business retirement; not a manufacturer discontinuation claim',lastCatalogueReview:'2026-10-28',catalogueNote:note,shortDescription:`Oz Timber Floor no longer offers ${p.name}. Browse current Stone Floor alternatives or contact our team for help.`});
 Object.assign(c,{replacementRoute:item.afterTarget,replacementBasis:'owner-approved-retirement-alternatives',reason:note});
 const reviewed=expect.reviewedRedirects.find(r=>r.source===item.legacySource);assert(reviewed);Object.assign(reviewed,{target:item.afterTarget,semanticMatch:'retired',decision:'redirect-range',note});
 const fallback=expect.catalogueFallbacks.find(r=>r.route===item.heldRoute);assert(fallback);fallback.target=item.afterTarget;
 const before=`${item.legacySource} ${item.beforeTarget} 301`,after=`${item.legacySource} ${item.afterTarget} 301`;
 assert.equal(redirects.split('\n').filter(l=>l===before||l===after).length,1);redirects=redirects.replace(before,after);
 const file=item.heldRoute.slice(1)+'index.html';let html=read(file);assert(/noindex,follow/.test(html));
 const title=p.name+' — No Longer Offered | Oz Timber Floor';
 html=html.replace(/<title>[\s\S]*?<\/title>/,`<title>${title}</title>`).replace(/<meta\b[^>]*name="description"[^>]*>/,`<meta name="description" content="${p.shortDescription}">`).replace(/(<meta\b[^>]*property="og:title"[^>]*content=")[^"]*/,`$1${title}`).replace(/(<meta\b[^>]*property="og:description"[^>]*content=")[^"]*/,`$1${p.shortDescription}`);
 html=html.replace(/<main\b[^>]*>[\s\S]*?<\/main>/,`<main id="main-content"><section class="section"><div class="shell"><nav class="breadcrumbs" aria-label="Breadcrumb"><a href="/">Home</a><span> / </span><a href="/products/">Products</a><span> / </span><a href="/ranges/stone-floor/">Stone Floor</a></nav><p class="eyebrow">No longer offered</p><h1>${p.name}</h1><p class="lead">This legacy colour is no longer offered by Oz Timber Floor.</p><p>Explore the current Stone Floor collection for alternatives. These options are not an exact replacement for this colour.</p><div class="button-row"><a class="button" href="/ranges/stone-floor/">Browse current Stone Floor options</a><a class="button-secondary" href="/contact/?enquiry=product&amp;product=${encodeURIComponent(p.name)}&amp;range=Stone%20Floor&amp;source=${encodeURIComponent(item.heldRoute)}">Ask about alternatives</a></div></div></section><section class="section soft"><div class="shell"><h2>Planning a replacement floor?</h2><p>Product choice, floor preparation and installation requirements need to be reviewed for your site.</p><p><a href="/ranges/">Browse flooring ranges</a> · <a href="/hybrid/">Hybrid flooring</a> · <a href="/floor-levelling/">Floor levelling</a> · <a href="/timber-floor-installation/">Installation</a> · <a href="/commercial-flooring/">Commercial flooring</a></p></div></section></main>`);
 changes.set(file,html);
}
let patch='*** Begin Patch\n';
const hunk=(before,after)=>'@@\n'+before.map(l=>'-'+l+'\n').join('')+after.map(l=>'+'+l+'\n').join('');
for(const file of [files[1],files[2],files[3]]){
 const pairs=file===files[1]?approval.products.map(p=>[oldData.products.find(r=>r.id===p.id),data.products.find(r=>r.id===p.id)]):file===files[2]?approval.products.map(p=>[{[p.heldRoute]:oldControls.pages[p.heldRoute]},{[p.heldRoute]:controls.pages[p.heldRoute]}]):[...approval.products.map(p=>[oldExpect.reviewedRedirects.find(r=>r.source===p.legacySource),expect.reviewedRedirects.find(r=>r.source===p.legacySource)]),...approval.products.map(p=>[oldExpect.catalogueFallbacks.find(r=>r.route===p.heldRoute),expect.catalogueFallbacks.find(r=>r.route===p.heldRoute)])];
 const format=(obj,comma=false)=>{const lines=file===files[2]?JSON.stringify(obj,null,2).split('\n').slice(1,-1).map(l=>'  '+l):JSON.stringify(obj,null,2).split('\n').map(l=>'    '+l);if(comma)lines[lines.length-1]+=',';return lines;};
 const changed=pairs.filter(([a,b])=>JSON.stringify(a)!==JSON.stringify(b)).sort((a,b)=>read(file).indexOf(format(a[0]).join('\n'))-read(file).indexOf(format(b[0]).join('\n')));
 if(changed.length){patch+='*** Update File: '+file+'\n';for(const [a,b]of changed){const comma=read(file).includes(format(a,true).join('\n'));assert(read(file).includes(format(a,comma).join('\n')),'Exact record context missing');patch+=hunk(format(a,comma),format(b,comma));}}
}
if(redirects!==read('_redirects')){patch+='*** Update File: _redirects\n';for(const p of [...approval.products].sort((a,b)=>read('_redirects').indexOf(a.legacySource)-read('_redirects').indexOf(b.legacySource)))patch+=hunk([`${p.legacySource} ${p.beforeTarget} 301`],[`${p.legacySource} ${p.afterTarget} 301`]);}
for(const [file,html]of changes)if(html!==read(file))patch+='*** Update File: '+file+'\n'+hunk(read(file).trimEnd().split('\n'),html.trimEnd().split('\n'));
console.log(patch+'*** End Patch');
