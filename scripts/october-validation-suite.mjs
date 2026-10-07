import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
const out=path.resolve('docs/migration-october-2026/checks');fs.mkdirSync(out,{recursive:true});
const commands=[
 ['git','diff','--check'],
 ['npm','run','catalogue:field-integrity:check'],
 ['node','scripts/october-catalogue-repair.mjs'],
 ['npm','run','analytics:contract:check'],
 ['node','scripts/october-analytics-check.mjs'],
 ['node','scripts/october-delta-contract.mjs'],
 ['npm','run','migration:check:local'],
 ['npm','run','seo:gsc-audit'],
 ['npm','run','seo:migration-hardening:check'],
 ['npm','run','seo:current-release-contract:check'],
 ['npm','run','release:routing:check'],
 ['npm','run','perf:images:check'],
 ['npm','run','ui:lcp:check'],
 ['npm','run','release:package:check'],
 ['node','scripts/october-migration-audit.mjs'],
 ['node','scripts/october-browser.mjs']
];
const results=[];
for(const [cmd,...args] of commands){
 const start=new Date().toISOString(),r=spawnSync(cmd,args,{encoding:'utf8',maxBuffer:40e6});
 const logfile=`${results.length+1}-${args.at(-1).replace(/[^a-z0-9.-]/gi,'_')}.log`;
 fs.writeFileSync(path.join(out,logfile),(r.stdout||'')+(r.stderr||'')+(r.error?.stack||''));
 const result={command:[cmd,...args].join(' '),startedAt:start,endedAt:new Date().toISOString(),exitCode:r.status,logfile};results.push(result);console.log(JSON.stringify(result));
 fs.writeFileSync(path.join(out,'commands.json'),JSON.stringify(results,null,2)+'\n');
}
process.exitCode=results.some(x=>x.exitCode!==0)?1:0;
