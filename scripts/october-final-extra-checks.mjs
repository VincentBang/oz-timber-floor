import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
import {buildImageDimensionReport} from './image-dimension-audit.mjs';
const out='docs/migration-october-2026-final-repairs';
const image=buildImageDimensionReport();fs.writeFileSync(out+'/images.json',JSON.stringify(image,null,2)+'\n');console.log(JSON.stringify(image.summary));
fs.mkdirSync(out+'/historical-freeze',{recursive:true});fs.copyFileSync('docs/ui-ux/generated/seo-freeze-before.json',out+'/historical-freeze/seo-freeze-before.json');
const commands=[['python3','scripts/gsc_migration_audit.py'],['node','scripts/seo-migration-hardening.mjs'],['node','scripts/ui-ux-seo-freeze.mjs','capture-after'],['node','scripts/ui-ux-seo-freeze.mjs','compare']];
const results=[];
for(const [cmd,...args]of commands){const start=new Date().toISOString();const r=spawnSync(cmd,args,{encoding:'utf8',maxBuffer:32e6,env:{...process.env,OZ_MIGRATION_GENERATED_DIR:out+'/migration',OZ_UI_UX_GENERATED_DIR:out+'/historical-freeze'}});const log=`checks/extra-${results.length+1}.log`;fs.writeFileSync(out+'/'+log,(r.stdout||'')+(r.stderr||''));results.push({command:[cmd,...args].join(' '),start,end:new Date().toISOString(),exitCode:r.status,log});console.log(JSON.stringify(results.at(-1)));}
fs.writeFileSync(out+'/extra-commands.json',JSON.stringify(results,null,2)+'\n');
