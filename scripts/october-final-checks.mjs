import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
const out='docs/migration-october-2026-final-repairs';fs.mkdirSync(out+'/checks',{recursive:true});
const commands=[['git','diff','--check'],['npm','run','catalogue:field-integrity:check'],['npm','run','catalogue:october:check'],['npm','run','analytics:contract:check'],['node','scripts/october-analytics-check.mjs'],['npm','run','ui:lcp:check'],['node','scripts/migration-readiness.mjs','--allow-external'],['npm','run','release:package:check'],['xmllint','--noout','sitemap.xml'],['node','scripts/october-final-audit-regression.mjs']];
const results=[];
for(const [command,...args]of commands){const start=new Date().toISOString();const r=spawnSync(command,args,{encoding:'utf8',maxBuffer:32e6,env:{...process.env,OZ_MIGRATION_GENERATED_DIR:out+'/migration',CONTEXT:'deploy-preview',OZ_PRODUCTION_INDEXING_ENABLED:'false'}});const log=`checks/${results.length+1}.log`;fs.writeFileSync(out+'/'+log,(r.stdout||'')+(r.stderr||''));results.push({command:[command,...args].join(' '),start,end:new Date().toISOString(),exitCode:r.status,log});console.log(JSON.stringify(results.at(-1)));fs.writeFileSync(out+'/commands.json',JSON.stringify(results,null,2)+'\n');}
process.exitCode=results.some(x=>x.exitCode!==0)?1:0;
