import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
const out=path.resolve('docs/migration-october-2026-followup/checks');fs.mkdirSync(out,{recursive:true});
const commands=[
 ['git','diff','--check'],['npm','run','build'],
 ['npm','run','catalogue:field-integrity:check'],['node','scripts/october-catalogue-repair.mjs'],['node','scripts/october-verified-specs.mjs'],
 ['npm','run','analytics:contract:check'],['node','scripts/october-analytics-check.mjs'],['node','scripts/october-followup-contract.mjs'],
 ['node','scripts/october-enquiry-regression.mjs'],['npm','run','release:browser'],
 ['npm','run','perf:images:check'],['npm','run','perf:priority-routes:check'],['npm','run','ui:lcp:check'],
 ['npm','run','migration:check:local'],['npm','run','seo:gsc-audit'],['npm','run','seo:migration-hardening:check'],
 ['npm','run','seo:current-release-contract:check'],['npm','run','release:routing:check'],['npm','run','ui:seo-freeze:compare'],
 ['node','scripts/october-delta-contract.mjs'],['node','scripts/october-migration-audit.mjs'],
 ['node','scripts/october-followup-routes.mjs'],['node','scripts/october-header-fixture.mjs'],['npm','run','release:package:check'],['xmllint','--noout','sitemap.xml']
];
const results=[];
for(const [cmd,...args] of commands){
 const startedAt=new Date().toISOString(),r=spawnSync(cmd,args,{encoding:'utf8',maxBuffer:40e6,env:{...process.env,CONTEXT:'deploy-preview',OZ_PRODUCTION_INDEXING_ENABLED:'false'}});
 const logfile=`${results.length+1}-${args.at(-1).replace(/[^a-z0-9.-]/gi,'_')}.log`;
 fs.writeFileSync(path.join(out,logfile),(r.stdout||'')+(r.stderr||'')+(r.error?.stack||''));
 const record={command:[cmd,...args].join(' '),startedAt,endedAt:new Date().toISOString(),exitCode:r.status,logfile};results.push(record);console.log(JSON.stringify(record));fs.writeFileSync(out+'/commands.json',JSON.stringify(results,null,2)+'\n');
}
process.exitCode=results.some(r=>r.exitCode!==0)?1:0;
