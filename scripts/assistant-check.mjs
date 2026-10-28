import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import zlib from 'node:zlib';
import {hash} from '../assistant/lib/security.mjs';
import {routing} from './october-route-fixture.mjs';
import {reviewedOakBeigeRetirement,OAK_BEIGE_ROUTE} from '../assistant/lib/legacy-retirement.mjs';
const root=process.cwd(),corpus=JSON.parse(fs.readFileSync('assistant/generated/corpus.json')),manifest=JSON.parse(fs.readFileSync(fs.existsSync('assistant/generated/source-manifest.json')?'assistant/generated/source-manifest.json':'docs/flooring-assistant/SOURCE_MANIFEST.json')),router=routing(root);
assert.equal(hash(corpus.documents),corpus.corpusVersion);
assert.equal(corpus.candidateHash,manifest.candidateHash);
for(const [file,expected]of Object.entries(manifest.files))assert.equal(hash(fs.readFileSync(file)),expected,'Stale knowledge input '+file);
if(manifest.files['assistant/lib/legacy-retirement.mjs']){
 const control=JSON.parse(fs.readFileSync('data/catalogue-quality-overrides.json')).pages[OAK_BEIGE_ROUTE];
 const product=JSON.parse(fs.readFileSync('data/product-catalogue.json')).products.find(p=>p.id==='stone-floor-oak-beige');
 assert.deepEqual(corpus.retirements.filter(r=>r.path===OAK_BEIGE_ROUTE),[reviewedOakBeigeRetirement({control,product})],'Missing or altered reviewed Oak Beige retirement');
 assert(!corpus.documents.some(d=>d.canonicalPath===OAK_BEIGE_ROUTE),'Retired colour became a current document');
}
const fields=['identity','category','range','colour','thickness','boardSize','packSizeM2','finish','guidance','faq','phone','email','showroom','formatSummary'];
// New alternative-format facts require exact source, record and rendered bindings;
// permitting the field does not permit arbitrary new specification claims.
for(const d of corpus.documents)for(const f of d.facts.filter(f=>f.field==='formatSummary')){
 const planFile='docs/seo-growth/evidence/2026-10-28-exact-formats/PLAN.json';assert.equal(manifest.files[planFile],hash(fs.readFileSync(planFile)));
 const row=JSON.parse(fs.readFileSync(planFile)).rows.find(r=>r.route===d.canonicalPath);assert(row);assert.equal(f.value,row.after.formatSummary);
 assert.equal(manifest.files[row.file],row.sourceSha256);assert.equal(hash(fs.readFileSync(row.file)),row.sourceSha256);
 const product=JSON.parse(fs.readFileSync('data/product-catalogue.json')).products.find(p=>p.id===row.id);assert.deepEqual(product.formatOptions,row.after.formatOptions);assert.equal(product.formatSummary,f.value);
 assert(fs.readFileSync(router.resolve(d.canonicalPath).file,'utf8').includes(f.value));
}
for(const d of corpus.documents){assert.equal(router.resolve(d.canonicalPath).status,200);assert.equal(router.resolve(d.canonicalPath).hops,0);assert.equal(d.expectedStatus,200);assert(d.facts.every(f=>fields.includes(f.field)));for(const f of d.facts)if(f.section)assert(fs.readFileSync(router.resolve(d.canonicalPath).file,'utf8').includes('id="'+f.section+'"'));}
const raw=fs.readFileSync('assistant/generated/corpus.json','utf8');assert(!/supplierSourceUrl|supplierId|sourceTag|wholesale|supabase|operon|\.codex|\/Users\/|\.env|sk-[a-zA-Z0-9]{16}/i.test(raw));
const entryFile='docs/flooring-assistant/ENTRY_STATE.json';
if(fs.existsSync(entryFile)){const entry=JSON.parse(fs.readFileSync(entryFile));for(const [file,before]of Object.entries(entry.hashes)){if(['OZ_STATUS.md','.gitignore'].includes(file))continue;let bytes=fs.readFileSync(file);if(file==='assets/site.js')bytes=Buffer.from(bytes.toString().replace(/  \/\/ Flooring assistant bridge: begin[\s\S]*?  \/\/ Flooring assistant bridge: end\n\n/,''));assert.equal(hash(bytes),before,'Inherited source changed outside assistant bridge: '+file);}}
const sizes={};for(const name of ['config','loader','handoff','']){const file='assets/flooring-assistant'+(name?'-'+name:'')+'.js';sizes[file]={bytes:fs.statSync(file).size,gzip:zlib.gzipSync(fs.readFileSync(file)).length};assert(!fs.readFileSync(file,'utf8').includes('innerHTML'));}
sizes['assets/flooring-assistant.css']={bytes:fs.statSync('assets/flooring-assistant.css').size,gzip:zlib.gzipSync(fs.readFileSync('assets/flooring-assistant.css')).length};
const incrementalInitialGzip=sizes['assets/flooring-assistant-config.js'].gzip+sizes['assets/flooring-assistant-loader.js'].gzip+zlib.gzipSync(fs.readFileSync('assets/site.js','utf8').match(/  \/\/ Flooring assistant bridge: begin[\s\S]*?  \/\/ Flooring assistant bridge: end/)[0]).length;assert(incrementalInitialGzip<30000);
const result={success:true,publicationOwners:manifest.counts.publication,corpusDocuments:corpus.documents.length,inheritedSourcePreserved:true,sizes,incrementalInitialGzip,uiDefaultOff:/enabled: false/.test(fs.readFileSync('assets/flooring-assistant-config.js','utf8')),formBackendSha256:hash(fs.readFileSync('netlify/functions/resend-enquiry-notification.mjs'))};
const evidenceDir=process.env.OZ_ASSISTANT_EVIDENCE_DIR||'docs/flooring-assistant/evidence';fs.mkdirSync(evidenceDir,{recursive:true});fs.writeFileSync(evidenceDir+'/CHECK.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));
