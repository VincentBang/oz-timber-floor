import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {execFileSync} from 'node:child_process';
import {hash} from '../assistant/lib/security.mjs';
const root=process.cwd(),fixture=fs.mkdtempSync(path.join(os.tmpdir(),'oz-assistant-candidate-'));
let files=execFileSync('git',['ls-files','-z'],{cwd:root}).toString().split('\0').filter(Boolean);
function walk(dir){return fs.readdirSync(root+'/'+dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(dir+'/'+e.name):[dir+'/'+e.name]);}
files.push(...walk('assistant'),...fs.readdirSync('assets').filter(f=>f.startsWith('flooring-assistant')).map(f=>'assets/'+f),...fs.readdirSync('scripts').filter(f=>f.startsWith('assistant-')).map(f=>'scripts/'+f),'netlify/functions/flooring-assistant.mjs','package-lock.json','assets/mobile-ux.css','assets/mobile-ux.js');
for(const dir of ['assets/images/hero','assets/images/products/engineered'])files.push(...fs.readdirSync(dir).filter(f=>/-mobile-(400|800)\.webp$/.test(f)).map(f=>dir+'/'+f));
files=[...new Set(files)].filter(f=>fs.existsSync(root+'/'+f)&&!f.startsWith('docs/flooring-assistant/'));
for(const f of files){const dest=fixture+'/'+f;fs.mkdirSync(path.dirname(dest),{recursive:true});fs.copyFileSync(root+'/'+f,dest);}
const logs=[];const run=(command,args,extra={})=>{try{const output=execFileSync(command,args,{cwd:fixture,env:{...process.env,...extra},encoding:'utf8',maxBuffer:10000000});logs.push({command:[command,...args],pass:true,output});console.log(output.slice(-1400));}catch(e){logs.push({command:[command,...args],pass:false,output:String(e.stdout)+String(e.stderr)});throw e;}};
try{
 run('npm',['ci','--offline','--ignore-scripts']);
 run('npm',['run','build'],{GIT_DIR:root+'/.git',GIT_WORK_TREE:fixture,CONTEXT:'deploy-preview',OZ_PRODUCTION_INDEXING_ENABLED:'false'});
 // Generated preview artifact only: source flag stays off. The UI also refuses
 // production hosts, and backend activation still needs separate scoped flags.
 fs.writeFileSync(fixture+'/dist/assets/flooring-assistant-config.js','window.OZ_FLOORING_ASSISTANT = Object.freeze({ enabled: true, mode: "mock" });\n');
 run(process.execPath,['scripts/assistant-package-check.mjs']);
 run(process.execPath,['scripts/october-26-package-validation.mjs'],{OZ_FIXTURE_ROOT:fixture+'/dist',OZ_FIXTURE_MODE:'protected',OZ_VALIDATION_OUTPUT:fixture+'/docs/flooring-assistant/evidence/ROUTES_PACKAGE.json'});
 const entryFiles=files.filter(f=>!f.startsWith('docs/')&&!f.startsWith('assistant/generated/')).map(f=>({file:f,sourceHash:hash(fs.readFileSync(root+'/'+f)),fixtureHash:hash(fs.readFileSync(fixture+'/'+f))}));
 const result={fixture,head:execFileSync('git',['rev-parse','HEAD'],{cwd:root}).toString().trim(),entryFileCount:entryFiles.length,dirtySourceHash:hash(entryFiles.map(({file,sourceHash})=>({file,sourceHash}))),buildSourceMutations:entryFiles.filter(f=>f.sourceHash!==f.fixtureHash),package:JSON.parse(fs.readFileSync(fixture+'/docs/flooring-assistant/evidence/PACKAGE.json')),routes:JSON.parse(fs.readFileSync(fixture+'/docs/flooring-assistant/evidence/ROUTES_PACKAGE.json')),logs};
 fs.writeFileSync(root+'/docs/flooring-assistant/evidence/CANDIDATE.json',JSON.stringify(result,null,2));console.log(JSON.stringify({fixture,dirtySourceHash:result.dirtySourceHash,buildSourceMutations:result.buildSourceMutations,staticFileCount:result.package.staticFileCount,corpusVersion:result.package.corpusVersion}));
}catch(e){fs.writeFileSync(root+'/docs/flooring-assistant/evidence/BUILD_FAILURE.json',JSON.stringify({fixture,logs,error:e.message},null,2));throw e;}
