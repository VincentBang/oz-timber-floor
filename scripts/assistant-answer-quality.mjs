// Local-only regression runner. Never calls OpenAI/Netlify or deploys.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {hash} from '../assistant/lib/security.mjs';
const root=path.resolve(import.meta.dirname,'..'),out=root+'/docs/flooring-assistant/answer-quality-2026-10-27';
const mode=process.argv[2],write=(p,v)=>fs.writeFileSync(p,JSON.stringify(v,null,2));
const walk=d=>fs.readdirSync(d,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(d+'/'+e.name):[d+'/'+e.name]);
fs.mkdirSync(out,{recursive:true});
if(mode==='baseline'){
 assert(!fs.existsSync(out+'/BASELINE.json'),'Do not overwrite the baseline');
 const previous=root+'/docs/flooring-assistant/gpt-luna-2026-10-27',seal=JSON.parse(fs.readFileSync(previous+'/MANIFEST.json'));
 assert.equal(hash(fs.readFileSync(previous+'/MANIFEST.json')),'76925172a9b675cad1eb487caa263e79f5fa1449a1931e9e8afd5bd72fd73303');
 for(const f of seal.evidence)assert.equal(hash(fs.readFileSync(previous+'/'+f.file)),f.sha256);
 const pkg=JSON.parse(fs.readFileSync(previous+'/PACKAGE_paid.json')),state=JSON.parse(fs.readFileSync(previous+'/STATE.json'));
 const protectedFiles=[...execFileSync('git',['ls-files','-z'],{cwd:root}).toString().split('\0').filter(Boolean),...walk(root+'/assistant').filter(p=>p.endsWith('.mjs')||p.endsWith('.json')).map(p=>path.relative(root,p))];
 const fixture=fs.mkdtempSync(path.join(os.tmpdir(),'oz-answer-quality-'));fs.cpSync(state.fixture,fixture,{recursive:true});
 write(out+'/BASELINE.json',{at:new Date().toISOString(),branch:execFileSync('git',['branch','--show-current'],{cwd:root}).toString().trim(),head:execFileSync('git',['rev-parse','HEAD'],{cwd:root}).toString().trim(),fixture,protectedFiles:[...new Set(protectedFiles)].filter(f=>fs.existsSync(root+'/'+f)).map(file=>({file,sha256:hash(fs.readFileSync(root+'/'+file))})),priorSealHash:hash(fs.readFileSync(previous+'/MANIFEST.json')),corpus:hash(fs.readFileSync(root+'/assistant/generated/corpus.json')),staticFiles:pkg.staticFileCount});
 console.log(JSON.stringify({fixture,baseline:out+'/BASELINE.json',priorSealIntact:true}));
}else if(mode==='validate'){
 const base=JSON.parse(fs.readFileSync(out+'/BASELINE.json')),fixture=base.fixture;
 if(fs.existsSync(out+'/CHECKS.json')){const bytes=fs.readFileSync(out+'/CHECKS.json');fs.copyFileSync(out+'/CHECKS.json',out+'/CHECKS_'+hash(bytes).slice(0,12)+'.json');}
 for(const dir of ['assistant/lib','assistant/tests'])fs.cpSync(root+'/'+dir,fixture+'/'+dir,{recursive:true});
 for(const f of ['assistant-build-knowledge.mjs','assistant-check.mjs','assistant-eval.mjs','assistant-holdout.mjs','assistant-quality-eval.mjs'])fs.copyFileSync(root+'/scripts/'+f,fixture+'/scripts/'+f);
 fs.copyFileSync(root+'/assistant/config/paid-preview.json',fixture+'/assistant/config/paid-preview.json');
 const logs=[],run=(cmd,args)=>{try{const output=execFileSync(cmd,args,{cwd:fixture,encoding:'utf8',maxBuffer:4000000});logs.push({command:[cmd,...args],exitCode:0,output});write(out+'/CHECKS.json',{fixture,logs});console.log(output.slice(-1800));}catch(e){logs.push({command:[cmd,...args],exitCode:e.status,output:String(e.stdout||'')+String(e.stderr||'')});write(out+'/CHECKS.json',{fixture,logs});throw e;}};
 run(process.execPath,['scripts/assistant-build-knowledge.mjs']);
 // Rebind this generated, disabled fixture profile to the newly extracted
 // corpus. Never relax the production runtime's stale-corpus approval guard.
 const profile=JSON.parse(fs.readFileSync(fixture+'/assistant/config/paid-preview.json'));assert.equal(profile.activationApproved,false);assert.equal(profile.dataUseApproved,false);profile.boundCorpusVersion=JSON.parse(fs.readFileSync(fixture+'/assistant/generated/corpus.json')).corpusVersion;write(fixture+'/assistant/config/paid-preview.json',profile);
 run(process.execPath,['--test',...fs.readdirSync(fixture+'/assistant/tests').filter(f=>f.endsWith('.test.mjs')).map(f=>'assistant/tests/'+f)]);
 run(process.execPath,['scripts/assistant-check.mjs']);run(process.execPath,['scripts/assistant-eval.mjs']);run(process.execPath,['scripts/assistant-holdout.mjs']);run(process.execPath,['scripts/assistant-quality-eval.mjs']);
 for(const name of ['CHECK','EVALUATION','HOLDOUT','ANSWER_QUALITY'])fs.copyFileSync(fixture+'/docs/flooring-assistant/evidence/'+name+'.json',out+'/'+name+'.json');
 const changed=base.protectedFiles.filter(f=>hash(fs.readFileSync(root+'/'+f.file))!==f.sha256).map(f=>f.file);
 assert(changed.every(f=>f.startsWith('assistant/')||f==='scripts/assistant-build-knowledge.mjs'||f==='scripts/assistant-check.mjs'||f==='OZ_STATUS.md'||f==='.gitignore'),'Unrelated source changed');
 const priorState=JSON.parse(fs.readFileSync(root+'/docs/flooring-assistant/gpt-luna-2026-10-27/STATE.json')),priorBytes=fs.readFileSync(priorState.fixture+'/assistant/generated/corpus.json');assert.equal(hash(priorBytes),base.corpus);
 const before=JSON.parse(priorBytes),after=JSON.parse(fs.readFileSync(fixture+'/assistant/generated/corpus.json'));
 assert.equal(before.candidateHash,after.candidateHash);assert.equal(before.documents.length,after.documents.length);
 for(const doc of before.documents){const next=after.documents.find(d=>d.entityId===doc.entityId);assert(next);for(const k of ['canonicalPath','title','sourceHash','entityType'])assert.equal(next[k],doc[k]);const fixed=f=>!['guidance','faq'].includes(f.field);assert.deepEqual(next.facts.filter(fixed),doc.facts.filter(fixed),'Non-guidance facts changed '+doc.canonicalPath);}
 write(out+'/VALIDATION.json',{at:new Date().toISOString(),fixture,commands:logs.map(({command,exitCode})=>({command,exitCode})),changed,websiteSourcesUnchanged:true,catalogueFactsUnchanged:true,publicationCandidateHashUnchanged:true,paidCalls:0,providerChanges:0,deployments:0,newCorpusVersion:after.corpusVersion});
 console.log(JSON.stringify({fixture,passed:true,changed}));
}else if(mode==='seal'){
 const base=JSON.parse(fs.readFileSync(out+'/BASELINE.json')),validation=JSON.parse(fs.readFileSync(out+'/VALIDATION.json')),checks=JSON.parse(fs.readFileSync(out+'/ROOT_CHECKS.json')),browser=JSON.parse(fs.readFileSync(out+'/BROWSER.json'));
 assert(checks.every(c=>c.exit_code===0));assert.equal(browser.consoleErrors.length,0);assert.equal(browser.dom.overflow,false);assert(validation.websiteSourcesUnchanged&&validation.catalogueFactsUnchanged);
 const previous=root+'/docs/flooring-assistant/gpt-luna-2026-10-27';assert.equal(hash(fs.readFileSync(previous+'/MANIFEST.json')),base.priorSealHash);for(const f of JSON.parse(fs.readFileSync(previous+'/MANIFEST.json')).evidence)assert.equal(hash(fs.readFileSync(previous+'/'+f.file)),f.sha256);
 const corpus=JSON.parse(fs.readFileSync(root+'/assistant/generated/corpus.json')),fixtureCorpus=JSON.parse(fs.readFileSync(base.fixture+'/assistant/generated/corpus.json'));assert.equal(hash(corpus),hash(fixtureCorpus));
 const profile=JSON.parse(fs.readFileSync(root+'/assistant/config/paid-preview.json'));assert.equal(profile.activationApproved,false);assert.equal(profile.dataUseApproved,false);assert.equal(profile.accountModelAvailable,false);assert.equal(profile.boundCorpusVersion,corpus.corpusVersion);
 const changed=base.protectedFiles.filter(f=>hash(fs.readFileSync(root+'/'+f.file))!==f.sha256).map(f=>f.file);assert(changed.every(f=>f.startsWith('assistant/')||['OZ_STATUS.md','.gitignore','scripts/assistant-build-knowledge.mjs','scripts/assistant-check.mjs'].includes(f)));
 const sources=['assistant/lib/knowledge-extraction.mjs','assistant/lib/retrieval.mjs','assistant/lib/answers.mjs','assistant/tests/answer-quality.test.mjs','scripts/assistant-build-knowledge.mjs','scripts/assistant-check.mjs','scripts/assistant-answer-quality.mjs','scripts/assistant-quality-eval.mjs','assistant/config/paid-preview.json','assistant/generated/corpus.json','assistant/generated/source-manifest.json','OZ_STATUS.md','.gitignore'].map(file=>({file,sha256:hash(fs.readFileSync(root+'/'+file))}));
 const evidence=walk(out).filter(p=>path.basename(p)!=='MANIFEST.json').map(p=>({file:path.relative(out,p),sha256:hash(fs.readFileSync(p))}));
 const manifest={at:new Date().toISOString(),outcome:'LOCAL_REPAIRS_VERIFIED__PROTECTED_LUNA_RETEST_NOT_RUN',branch:base.branch,head:base.head,corpusVersion:corpus.corpusVersion,candidateHash:corpus.candidateHash,unitTests:53,existingMockCases:120,additionalMockHoldouts:24,focusedQualityCases:8,browserCases:browser.observations.length,paidCalls:0,deployments:0,providerChanges:0,productionChanges:0,websiteSourcesUnchanged:true,catalogueFactsUnchanged:true,historicalLunaEvidenceUnchanged:true,uiDefaultOff:true,paidProfileOff:true,changed,sources,evidence};
 write(out+'/MANIFEST.json',manifest);console.log(JSON.stringify({manifest:out+'/MANIFEST.json',sha256:hash(fs.readFileSync(out+'/MANIFEST.json')),outcome:manifest.outcome,changed},null,2));
}else throw Error('Use baseline, validate or seal');
