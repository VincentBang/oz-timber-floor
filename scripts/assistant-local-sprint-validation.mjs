// Offline-only: no provider credentials, deployments, submissions or network tools.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
const root=process.cwd(),out=path.resolve(process.env.OZ_ASSISTANT_SPRINT_EVIDENCE_DIR||root+'/docs/seo-growth/evidence/2026-10-28-assistant-local-sprint');
const baselineName=process.env.OZ_ASSISTANT_SPRINT_BASELINE_NAME||'BASELINE.json';if(!/^BASELINE(?:_[A-Z0-9]+)?\.json$/.test(baselineName))throw Error('Expected a versioned local baseline filename');
fs.mkdirSync(out,{recursive:true});
const fixture=JSON.parse(fs.readFileSync(root+'/docs/seo-growth/evidence/2026-10-28-routing-reconciliation/RECONCILIATION.json')).fixture;
if(!fixture.startsWith('/var/folders/')||!fs.existsSync(fixture+'/package.json'))throw Error('Recorded disposable fixture unavailable');
// A symlink to the active checkout is not an isolated function dependency tree.
// Retain the old link as evidence, and copy installed dependencies locally.
if(fs.lstatSync(fixture+'/node_modules').isSymbolicLink()){
 fs.renameSync(fixture+'/node_modules',fixture+'/node_modules.source-link-before-assistant-sprint');
 fs.cpSync(root+'/node_modules',fixture+'/node_modules',{recursive:true,dereference:true});
}
const hash=f=>crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');
const protectedFiles=['_redirects','sitemap.xml','robots.txt','netlify.toml','data/product-catalogue.json','data/catalogue-quality-overrides.json','data/seo-migration-redirect-expectations.json','contact.html','contact/index.html','assets/contact-config.js','assets/site.js','assets/site.css','projects.html','projects/index.html','assistant/generated/corpus.json','assistant/config/policy.json','assistant/config/production.json','assistant/config/paid-preview.json','netlify/functions/resend-enquiry-notification.mjs'].map(file=>({file,sha256:hash(root+'/'+file)}));
const fixtures=dir=>fs.readdirSync(root+'/'+dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?fixtures(dir+'/'+e.name):[dir+'/'+e.name]);
const projectImages=JSON.parse(fs.readFileSync(root+'/data/project-image-manifest.json')).photos.flatMap(p=>p.variants.map(v=>v.url.slice(1)));
const recoveredPages=JSON.parse(fs.readFileSync(root+'/docs/migration-october-2026-followup/supplier/product-specifications.json')).map(e=>JSON.parse(fs.readFileSync(root+'/data/product-catalogue.json')).products.find(p=>p.id===e.record).url.slice(1)+'index.html');
const refreshFiles=['docs/seo-growth/evidence/2026-10-28-supplier-refresh/REVIEWED_PLAN.json','docs/seo-growth/evidence/2026-10-28-supplier-refresh/CAPTURE_VERIFIED.json'];
refreshFiles.push('scripts/aspect-correction.mjs');
const fourFiles=['docs/seo-growth/evidence/2026-10-28-four-suppliers/REVIEWED_PLAN.json','docs/seo-growth/evidence/2026-10-28-four-suppliers/CAPTURE_PARSED.json'];
refreshFiles.push(...fourFiles);
const formatPlan='docs/seo-growth/evidence/2026-10-28-exact-formats/PLAN.json',formatRows=JSON.parse(fs.readFileSync(root+'/'+formatPlan)).rows;
refreshFiles.push(formatPlan,...formatRows.map(r=>r.file));
const refreshedPages=[...new Set(JSON.parse(fs.readFileSync(root+'/'+refreshFiles[0])).proposals.map(p=>p.route.slice(1)+'index.html'))];
refreshedPages.push(...JSON.parse(fs.readFileSync(root+'/'+fourFiles[0])).proposals.map(p=>p.route.slice(1)+'index.html'));
refreshedPages.push(...formatRows.map(p=>p.route.slice(1)+'index.html'));
const files=[...fs.readdirSync(root+'/assistant/lib').map(f=>'assistant/lib/'+f),...fs.readdirSync(root+'/assistant/tests').filter(f=>f.endsWith('.mjs')).map(f=>'assistant/tests/'+f),...fixtures('assistant/tests/fixtures'),'data/product-catalogue.json',...recoveredPages,...refreshedPages,...refreshFiles,'docs/migration-october-2026-followup/supplier/product-specifications.json','data/projects.json','data/project-image-manifest.json',...projectImages,'assets/flooring-assistant.js','scripts/assistant-build-knowledge.mjs','scripts/assistant-check.mjs','scripts/assistant-package-check.mjs','scripts/assistant-eval.mjs','scripts/assistant-quality-eval.mjs','scripts/approved-stonefloor-legacy-retirement.mjs'];
if(process.argv.includes('--prepare')){
 fs.writeFileSync(out+'/'+baselineName,JSON.stringify({at:new Date().toISOString(),fixture,protectedFiles,sourceFiles:files.map(file=>({file,sha256:hash(root+'/'+file)}))},null,2),{flag:'wx'});
 for(const file of files){const source=root+'/'+file,dest=fixture+'/'+file;fs.mkdirSync(path.dirname(dest),{recursive:true});fs.copyFileSync(source,dest);}
 console.log(JSON.stringify({fixture,out}));process.exit(0);
}
const baseline=JSON.parse(fs.readFileSync(out+'/'+baselineName));
for(const file of files){fs.mkdirSync(path.dirname(fixture+'/'+file),{recursive:true});fs.copyFileSync(root+'/'+file,fixture+'/'+file);}
const env={...process.env,GIT_DIR:root+'/.git',GIT_WORK_TREE:fixture,CONTEXT:'deploy-preview',OZ_PRODUCTION_INDEXING_ENABLED:'false',OZ_ASSISTANT_EVIDENCE_DIR:out+'/knowledge',OZ_VALIDATION_OUTPUT:out+'/PACKAGE.json'};
// The child processes use only mock/injected fixtures. Strip inherited provider secrets.
for(const key of Object.keys(env))if(/API_KEY|ACCESS_TOKEN|AUTH_TOKEN/.test(key))delete env[key];
const installedBundler='/private/tmp/oz-gpt-netlify-tools-3ngdza/node_modules/@netlify/zip-it-and-ship-it/dist/main.js';
if(fs.existsSync(installedBundler))env.OZ_ASSISTANT_BUNDLER=installedBundler;
const results=[];
function run(name,base,command,args){let status=0,output='';try{output=execFileSync(command,args,{cwd:base,env,encoding:'utf8',stdio:'pipe',timeout:180000,maxBuffer:20000000});}catch(e){status=e.status??1;output=String(e.stdout||'')+String(e.stderr||'');}fs.writeFileSync(out+'/'+name+'.log',output);results.push({name,status,command:[command,...args].join(' ')});console.log(name,status,output.slice(-600));}
const tests=fs.readdirSync(root+'/assistant/tests').filter(f=>f.endsWith('.test.mjs')).map(f=>'assistant/tests/'+f);
run('active-source-unit-tests',root,process.execPath,['--test',...tests]);
run('isolated-build',fixture,'npm',['run','build']);
if(results.at(-1).status!==0)throw Error('Isolated build failed; do not validate a stale candidate');
run('rebuilt-corpus-unit-tests',fixture,process.execPath,['--test',...tests]);
run('public-package',fixture,process.execPath,['scripts/october-26-package-validation.mjs']);
for(const [name,file]of [['analytics','analytics-event-contract.mjs'],['enquiry','resend-enquiry-contract.mjs'],['cutover','october-26-cutover-contract.mjs'],['field-integrity','catalogue-field-integrity.mjs']])run(name,fixture,process.execPath,['scripts/'+file]);
run('strict-migration',fixture,process.execPath,['scripts/seo-migration-hardening.mjs']);
run('knowledge-source-check',fixture,process.execPath,['scripts/assistant-check.mjs']);
run('quality-evaluation',fixture,process.execPath,['scripts/assistant-quality-eval.mjs']);
run('original-gold-evaluation',fixture,process.execPath,['scripts/assistant-eval.mjs']);
// Generated disposable output only; activate mock UI for the existing bundle check.
fs.writeFileSync(fixture+'/dist/assets/flooring-assistant-config.js','window.OZ_FLOORING_ASSISTANT = Object.freeze({ enabled: true, mode: "mock" });\n');
run('function-bundle-check',fixture,process.execPath,['scripts/assistant-package-check.mjs']);
run('diff-check',root,'git',['diff','--check']);
const corpus=JSON.parse(fs.readFileSync(fixture+'/assistant/generated/corpus.json'));
const retired=corpus.retirements.filter(r=>r.retirementBasis==='owner-business-retirement');
if(retired.length!==2||retired.some(r=>corpus.documents.some(d=>d.canonicalPath===r.path)))throw Error('Retirement corpus regression');
const drift=baseline.protectedFiles.filter(f=>hash(root+'/'+f.file)!==f.sha256).map(f=>f.file);
const manifest={at:new Date().toISOString(),fixture,results,protectedFileDrift:drift,sourceFiles:files.map(file=>({file,sha256:hash(root+'/'+file)})),rootCorpusUnchanged:!drift.includes('assistant/generated/corpus.json'),candidateCorpusVersion:corpus.corpusVersion,businessRetirements:retired,paidCalls:0,realFormSubmissions:0,deployed:false};
fs.writeFileSync(out+'/VALIDATION.json',JSON.stringify(manifest,null,2));
if(drift.length)throw Error('Protected active-source drift');
if(results.some(r=>r.status))process.exitCode=1;
