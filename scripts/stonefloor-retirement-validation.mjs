// Build and validate only in the previously recorded disposable candidate.
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
const root=process.cwd(),out=root+'/docs/seo-growth/evidence/2026-10-28-stonefloor-retirement';
const fixture=JSON.parse(fs.readFileSync(root+'/docs/seo-growth/evidence/2026-10-28-routing-reconciliation/RECONCILIATION.json')).fixture;
if(!fixture.startsWith('/var/folders/')||!fs.existsSync(fixture+'/package.json'))throw Error('Recorded disposable fixture unavailable');
const files=['_redirects','data/product-catalogue.json','data/catalogue-quality-overrides.json','data/seo-migration-redirect-expectations.json','config/stonefloor-legacy-retirement-2026-10-28.json','products/stone-floor-stone-oak/index.html','products/stone-floor-white-wash/index.html','scripts/approved-stonefloor-legacy-retirement.mjs','scripts/migration-rule-evidence.mjs','scripts/seo-migration-hardening.mjs','scripts/october-26-package-validation.mjs'];
for(const file of files){fs.mkdirSync(path.dirname(fixture+'/'+file),{recursive:true});fs.copyFileSync(root+'/'+file,fixture+'/'+file);}
const results=[];
for(const [name,cmd,args]of [['build','npm',['run','build']],['package',process.execPath,['scripts/october-26-package-validation.mjs']]]){
 let status=0,output='';try{output=execFileSync(cmd,args,{cwd:fixture,env:{...process.env,GIT_DIR:root+'/.git',GIT_WORK_TREE:fixture,CONTEXT:'deploy-preview',OZ_PRODUCTION_INDEXING_ENABLED:'false',OZ_ASSISTANT_EVIDENCE_DIR:out+'/knowledge',OZ_VALIDATION_OUTPUT:out+'/PACKAGE.json'},encoding:'utf8',stdio:'pipe',maxBuffer:20000000,timeout:180000});}catch(e){status=e.status??1;output=String(e.stdout||'')+String(e.stderr||'');}
 fs.writeFileSync(out+'/'+name+'.log',output,{flag:'wx'});results.push({name,status,command:[cmd,...args].join(' ')});console.log(name,status,output.slice(-1300));
}
fs.writeFileSync(out+'/VALIDATION.json',JSON.stringify({at:new Date().toISOString(),fixture,results,deployed:false},null,2),{flag:'wx'});
if(results.some(r=>r.status!==0))process.exitCode=1;
