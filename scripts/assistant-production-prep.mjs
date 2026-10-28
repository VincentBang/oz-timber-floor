// Local-only production preparation. No provider, secret or paid API access.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {hash} from '../assistant/lib/security.mjs';
const root=path.resolve(import.meta.dirname,'..'),out=root+'/docs/flooring-assistant/production-prep-2026-10-27',mode=process.argv[2];
const write=(p,v)=>fs.writeFileSync(p,JSON.stringify(v,null,2));fs.mkdirSync(out,{recursive:true});
if(mode==='baseline'){
 assert(!fs.existsSync(out+'/BASELINE.json'));
 const priorDir=root+'/docs/flooring-assistant/answer-quality-hosted-2026-10-27',prior=JSON.parse(fs.readFileSync(priorDir+'/MANIFEST.json'));
 assert.equal(hash(fs.readFileSync(priorDir+'/MANIFEST.json')),'fc2fb8b8629b75c4d4d500097405bb7b6d3d7ff1626a5be11aca11f15ce8ef77');for(const f of prior.evidence)assert.equal(hash(fs.readFileSync(priorDir+'/'+f.file)),f.sha256);
 const state=JSON.parse(fs.readFileSync(priorDir+'/STATE.json')),fixture=fs.mkdtempSync(path.join(os.tmpdir(),'oz-production-prep-'));
 fs.cpSync(state.fixture,fixture,{recursive:true});
 const files=execFileSync('git',['ls-files','-z'],{cwd:root}).toString().split('\0').filter(Boolean);files.push('assets/flooring-assistant.js','assets/flooring-assistant-loader.js','assets/flooring-assistant.css','assets/flooring-assistant-config.js','assistant/generated/corpus.json','assistant/config/paid-preview.json','netlify/functions/flooring-assistant.mjs');
 write(out+'/BASELINE.json',{at:new Date().toISOString(),fixture,branch:execFileSync('git',['branch','--show-current'],{cwd:root}).toString().trim(),head:execFileSync('git',['rev-parse','HEAD'],{cwd:root}).toString().trim(),priorManifestHash:hash(fs.readFileSync(priorDir+'/MANIFEST.json')),files:files.map(file=>({file,sha256:hash(fs.readFileSync(root+'/'+file))}))});console.log(JSON.stringify({fixture,out}));
}else if(mode==='checks'){
 const base=JSON.parse(fs.readFileSync(out+'/BASELINE.json')),logs=[];
 if(fs.existsSync(out+'/CHECKS.json'))fs.copyFileSync(out+'/CHECKS.json',out+'/CHECKS_'+hash(fs.readFileSync(out+'/CHECKS.json')).slice(0,12)+'.json');
 const run=(cmd,args,env={})=>{try{const output=execFileSync(cmd,args,{cwd:root,env:{...process.env,...env},encoding:'utf8',maxBuffer:4000000});logs.push({command:[cmd,...args],exitCode:0,output});}catch(e){logs.push({command:[cmd,...args],exitCode:e.status,output:String(e.stdout||'')+String(e.stderr||'')});}write(out+'/CHECKS.json',{at:new Date().toISOString(),logs});};
 run(process.execPath,['--test',...fs.readdirSync(root+'/assistant/tests').filter(f=>f.endsWith('.test.mjs')).map(f=>'assistant/tests/'+f)]);
 run(process.execPath,['scripts/assistant-check.mjs'],{OZ_ASSISTANT_EVIDENCE_DIR:out+'/source-check'});
 for(const f of ['assistant/lib/production.mjs','assistant/lib/runtime.mjs','assistant/lib/handler.mjs','netlify/functions/flooring-assistant.mjs','assets/flooring-assistant.js','assets/flooring-assistant-loader.js','scripts/assistant-production-prep.mjs'])run(process.execPath,['--check',f]);
 run('git',['diff','--check']);
 const allowed=new Set(['.gitignore','OZ_STATUS.md','assets/flooring-assistant.js','assets/flooring-assistant-loader.js','assets/flooring-assistant.css','netlify/functions/flooring-assistant.mjs']);
 const changed=base.files.filter(f=>hash(fs.readFileSync(root+'/'+f.file))!==f.sha256).map(f=>f.file);assert(changed.every(f=>allowed.has(f)),'Protected website/legacy corpus contract changed');assert(logs.every(l=>l.exitCode===0));
 fs.cpSync(root+'/assistant',base.fixture+'/assistant',{recursive:true});for(const f of ['flooring-assistant.js','flooring-assistant-loader.js','flooring-assistant.css','flooring-assistant-config.js'])fs.copyFileSync(root+'/assets/'+f,base.fixture+'/assets/'+f);
 fs.copyFileSync(root+'/netlify/functions/flooring-assistant.mjs',base.fixture+'/netlify/functions/flooring-assistant.mjs');fs.copyFileSync(root+'/scripts/assistant-preview.mjs',base.fixture+'/scripts/assistant-preview.mjs');
 write(out+'/VALIDATION.json',{at:new Date().toISOString(),fixture:base.fixture,changed,paidCalls:0,deployments:0,providerChanges:0,protectedFilesUnchanged:true});console.log(JSON.stringify({success:true,changed,fixture:base.fixture,tests:logs[0].output.slice(-220)}));
}else if(mode==='seal'){
 assert(!fs.existsSync(out+'/MANIFEST.json'),'Preserve existing seal');
 const base=JSON.parse(fs.readFileSync(out+'/BASELINE.json')),priorDir=root+'/docs/flooring-assistant/answer-quality-hosted-2026-10-27';
 assert.equal(hash(fs.readFileSync(priorDir+'/MANIFEST.json')),base.priorManifestHash);for(const f of JSON.parse(fs.readFileSync(priorDir+'/MANIFEST.json')).evidence)assert.equal(hash(fs.readFileSync(priorDir+'/'+f.file)),f.sha256);
 const walk=dir=>fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(dir+'/'+e.name):[dir+'/'+e.name]);
 const source=[...walk(root+'/assistant').filter(f=>!f.includes('/node_modules/')),...['assets/flooring-assistant.js','assets/flooring-assistant-loader.js','assets/flooring-assistant.css','netlify/functions/flooring-assistant.mjs','scripts/assistant-preview.mjs','scripts/assistant-production-prep.mjs','OZ_STATUS.md'].map(f=>root+'/'+f)];
 write(out+'/MANIFEST.json',{at:new Date().toISOString(),scope:'local production preparation; public activation OFF',branch:base.branch,head:base.head,priorManifestHash:base.priorManifestHash,paidCalls:0,deployments:0,providerChanges:0,sources:source.map(f=>({file:path.relative(root,f),sha256:hash(fs.readFileSync(f))})),evidence:walk(out).map(f=>({file:path.relative(out,f),sha256:hash(fs.readFileSync(f))}))});console.log(hash(fs.readFileSync(out+'/MANIFEST.json')));
}else throw Error('Use baseline, checks or seal');
