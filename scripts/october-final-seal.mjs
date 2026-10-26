import fs from 'node:fs';
import crypto from 'node:crypto';
import {execFileSync,spawnSync} from 'node:child_process';
const out='docs/migration-october-2026-final-repairs',sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const entry=JSON.parse(fs.readFileSync(out+'/entry.json'));
const commands=[['git','diff','--check'],['node','scripts/approved-artisan-retirement-regression.mjs'],['node','scripts/seo-migration-hardening.mjs'],['node','scripts/october-final-audit-regression.mjs'],['npm','run','release:package:check']];
const results=[];
for(const [cmd,...args]of commands){const start=new Date().toISOString();const r=spawnSync(cmd,args,{encoding:'utf8',maxBuffer:32e6,env:{...process.env,OZ_MIGRATION_GENERATED_DIR:out+'/migration',CONTEXT:'deploy-preview',OZ_PRODUCTION_INDEXING_ENABLED:'false'}});const log=`checks/final-${results.length+1}.log`;fs.writeFileSync(out+'/'+log,(r.stdout||'')+(r.stderr||''));results.push({command:[cmd,...args].join(' '),start,end:new Date().toISOString(),exitCode:r.status,log});if(r.status!==0)throw Error('Final check failed: '+cmd+' '+args.join(' '));}
fs.writeFileSync(out+'/final-commands.json',JSON.stringify(results,null,2)+'\n');
const files=execFileSync('git',['ls-files','--cached','--others','--exclude-standard','-z']).toString().split('\0').filter(Boolean);
const changes=files.filter(f=>fs.existsSync(f)&&fs.statSync(f).isFile()).map(f=>({file:f,beforeSha256:entry.hashes[f]||null,afterSha256:sha(fs.readFileSync(f))})).filter(x=>x.beforeSha256!==x.afterSha256);
fs.writeFileSync(out+'/FILES_CHANGED.json',JSON.stringify({basis:'Task-entry working tree, not HEAD; inherited dirty files are not credited to this task',changes},null,2)+'\n');
const receipt=fs.readFileSync(out+'/checks/final-5.log','utf8').match(/PUBLIC PACKAGE PASS mode=(\S+) files=(\d+) bytes=(\d+) manifestSha256=(\w+)/);
const manifest={at:new Date().toISOString(),scope:'LOCAL ONLY; no deploy or live-domain migration authorised',head:execFileSync('git',['rev-parse','HEAD']).toString().trim(),branch:execFileSync('git',['branch','--show-current']).toString().trim(),package:{mode:receipt[1],files:Number(receipt[2]),bytes:Number(receipt[3]),manifestSha256:receipt[4]},liveBaselineDeploy:'6ac5eaf69631bc9e67d50585',publication:771,existingRedirectsPreserved:true,addedRedirect:'/sitemap_index.xml /sitemap.xml 301',newSourceChanges:changes.length,realSubmissions:0,deployed:false,evidence:{}};
for(const f of ['REPORT.md','FILES_CHANGED.json','regression.json','commands.json','extra-commands.json','final-commands.json','live-before.json','live-routes.json','mapping-evidence.json','migration-mapping-review.csv','header-fixtures.json','images.json','freeze-summary.json','browser/result.json','enquiry-rerun/enquiry-regression.json','migration/migration-readiness-report.json','migration/seo-migration-hardening-report.json'])manifest.evidence[f]=sha(fs.readFileSync(out+'/'+f));
fs.writeFileSync(out+'/RELEASE_MANIFEST.json',JSON.stringify(manifest,null,2)+'\n');console.log(JSON.stringify({package:manifest.package,newChanges:changes.length,changedFiles:changes.map(x=>x.file)},null,2));
