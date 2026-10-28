import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {execFileSync,spawnSync} from 'node:child_process';
const root=process.cwd(),candidate=JSON.parse(fs.readFileSync('docs/flooring-assistant/evidence/CANDIDATE.json')),baseline=fs.mkdtempSync(path.join(os.tmpdir(),'oz-assistant-entry-check-'));
fs.cpSync(candidate.fixture,baseline,{recursive:true,filter:file=>!['node_modules','dist'].includes(path.basename(file))});
for(const file of ['site.js','site.css'])fs.copyFileSync(root+'/docs/flooring-assistant/entry-'+file,baseline+'/assets/'+file);
fs.writeFileSync(baseline+'/package.json',execFileSync('git',['show','HEAD:package.json'],{cwd:root}));
for(const relative of ['docs/release/OZ-RELEASE-CLOSEOUT/browser/browser-qa.json','docs/release/OZ-RELEASE-CLOSEOUT/generated/migration']){fs.mkdirSync(path.dirname(baseline+'/'+relative),{recursive:true});fs.cpSync(root+'/'+relative,baseline+'/'+relative,{recursive:true});}
const results=[];for(const script of ['ui-qa.mjs','seo-migration-hardening.mjs']){const result=spawnSync(process.execPath,['scripts/'+script],{cwd:baseline,env:{...process.env,GIT_DIR:root+'/.git',GIT_WORK_TREE:baseline},encoding:'utf8'});results.push({command:'node scripts/'+script,exitCode:result.status,stdout:result.stdout,stderr:result.stderr});}
const report=baseline+'/docs/release/OZ-RELEASE-CLOSEOUT/generated/migration/seo-migration-hardening-report.json';fs.writeFileSync(root+'/docs/flooring-assistant/evidence/BASELINE_GUARDS.json',JSON.stringify({baseline,results,hardening:fs.existsSync(report)?JSON.parse(fs.readFileSync(report)):null},null,2));console.log(JSON.stringify(results.map(({command,exitCode,stdout,stderr})=>({command,exitCode,summary:(stdout+stderr).slice(0,200)}))));
