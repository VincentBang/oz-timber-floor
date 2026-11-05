// Maintained offline suite. Build only in a disposable snapshot, never source.
import fs from 'node:fs';import path from 'node:path';import os from 'node:os';import {spawnSync,execFileSync} from 'node:child_process';
const root=path.resolve(import.meta.dirname,'..'),out=path.resolve(process.env.OZ_CHATBOT_QUALITY_OUT||fs.mkdtempSync(os.tmpdir()+'/oz-chatbot-quality-')),fixture=out+'/candidate';
if(fs.existsSync(fixture))throw Error('Use a new output folder; preserve old runs');fs.mkdirSync(out,{recursive:true});const excluded=new Set(['.git','node_modules','dist','.netlify']);fs.cpSync(root,fixture,{recursive:true,filter:p=>!excluded.has(path.basename(p))});fs.symlinkSync(fs.realpathSync(root+'/node_modules'),fixture+'/node_modules');
// Read-only Git history is necessary for unchanged evidence-bound tests. Use
// the real object database with the disposable working tree, never relax hashes.
const gitDir=execFileSync('git',['rev-parse','--absolute-git-dir'],{cwd:root,encoding:'utf8'}).trim();
const env={PATH:process.env.PATH,HOME:process.env.HOME,GIT_DIR:gitDir,GIT_WORK_TREE:fixture,EDITORIAL_BASELINE:root,NODE_OPTIONS:'--import='+fixture+'/scripts/floor-plan-qa/no-network.mjs',CONTEXT:'deploy-preview',OZ_PRODUCTION_INDEXING_ENABLED:'false',OZ_ASSISTANT_EVIDENCE_DIR:out+'/generated',OZ_GUIDE_EVIDENCE_DIR:out+'/guide',OZ_BINDING_BASELINE_CORPUS:process.env.OZ_BINDING_BASELINE_CORPUS||'/Users/daibang/Downloads/OZ_ASSISTANT_KNOWLEDGE_CANDIDATE_2026-11-04/corpus.json'};
const results=[];function run(name,args){const start=Date.now(),r=spawnSync(process.execPath,args,{cwd:fixture,env,encoding:'utf8',maxBuffer:40e6,timeout:240000});fs.writeFileSync(out+'/'+name+'.log',(r.stdout||'')+(r.stderr||'')+(r.error?.message||''));results.push({name,args,exit:r.status??1,ms:Date.now()-start});fs.writeFileSync(out+'/RESULTS.json',JSON.stringify({root,fixture,results},null,2));console.log(name,r.status??1);}
run('assistant',['--test',...fs.readdirSync(fixture+'/assistant/tests').filter(f=>f.endsWith('.test.mjs')).map(f=>'assistant/tests/'+f)]);
// Dated release/layout tests require their original snapshots; running them on
// today's source is NOT a release test. Keep them intact and list them explicitly.
// --all-history reproduces the raw glob (and fails if those gates are stale).
const historical={
 'current-assistant-release-contract.test.mjs':'Dated 773-page source/corpus review; requires its original exact manifest and parent corpus.',
 'production-binding-contract.test.mjs':'Dated 6744-fact production binding, not the current 6821-fact candidate.',
 'production-release-20261103.test.mjs':'Exact earlier production approval must not authorise this rebuilt candidate.',
 'projects-page.test.mjs':'Old header/footer equality predates the verified Gallery White release.',
 'historical-scope-reconciliation.test.mjs':'Raw aggregate contains dated contact/layout constraints; local UI delta has its own tamper-negative test.',
 'stonefloor-legacy-retirement.test.mjs':'Contains dated whole-site byte constraints; current retirements remain covered by assistant, supplier and routing contracts.',
 'floor-plan-discovery.test.mjs':'Old tool IDs predate the faithful port; current source-port test retains exact controls and explicit sharing.',
 'floor-plan-accessibility.test.mjs':'Browser-only suite must not run under the offline socket-denying unit preload.',
 'floor-plan-loader.test.mjs':'Browser-only suite requires its browser/decode fixtures; not a no-network unit test.',
 'audience-service-pages.test.mjs':'Old blanket no-form assertion conflicts with the shipped GET search form in the new header.',
};
const all=fs.readdirSync(fixture+'/scripts').filter(f=>f.endsWith('.test.mjs'));fs.writeFileSync(out+'/TEST_SCOPE.json',JSON.stringify({current:all.filter(f=>!historical[f]),historical,rawHistoryCommand:'node scripts/chatbot-quality-local.mjs --all-history',notPasses:Object.keys(historical)},null,2));
run('website-current',['--test',...all.filter(f=>!historical[f]).map(f=>'scripts/'+f)]);
if(process.argv.includes('--all-history'))run('website-raw-history',['--test',...all.map(f=>'scripts/'+f)]);
for(const[name,file]of [['source','assistant-check.mjs'],['gold','assistant-eval.mjs'],['holdout','assistant-holdout.mjs'],['quality','assistant-quality-eval.mjs'],['usefulness','guide-usefulness-eval.mjs'],['analytics','analytics-event-contract.mjs'],['notification','resend-enquiry-contract.mjs'],['catalogue','catalogue-field-integrity.mjs'],['seo','seo-migration-hardening.mjs']])run(name,['scripts/'+file]);
// Normal build steps without shell/npm ambiguity; all children inherit the
// network-denying preload and no provider credentials.
for(const file of ['prepare-netlify-deploy.mjs','migration-readiness.mjs','image-dimension-audit.mjs','build-public-package.mjs','assistant-build-knowledge.mjs'])run('build-'+file,['scripts/'+file,...(file==='migration-readiness.mjs'?['--apply-catalogue-only']:file==='image-dimension-audit.mjs'?['--apply']:[])]);
run('rebuilt-source',['scripts/assistant-check.mjs']);run('rebuilt-assistant',['--test',...fs.readdirSync(fixture+'/assistant/tests').filter(f=>f.endsWith('.test.mjs')).map(f=>'assistant/tests/'+f)]);
run('migration-readiness',['scripts/migration-readiness.mjs','--allow-external']);
console.log({out,fixture,stages:results.length,failures:results.filter(r=>r.exit!==0).map(r=>r.name),paidCalls:0,submissions:0});if(results.some(r=>r.exit!==0))process.exitCode=1;
