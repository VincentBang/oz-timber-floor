// Read-only provider reconciliation and isolated source snapshot. Never deploys.
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';

const root=process.cwd(), out=path.resolve(process.argv[2]||'');
assert(process.argv[2] && !fs.existsSync(out), 'Supply a new evidence directory');
const read=p=>JSON.parse(fs.readFileSync(p)), digest=(bytes,kind='sha256')=>crypto.createHash(kind).update(bytes).digest('hex');
const git=(...args)=>execFileSync('git',args,{cwd:root,encoding:'utf8'}).trim();
const p=read(root+'/docs/flooring-assistant/public-release-2026-10-28/attempt-v7/PACKAGE.json');
const c=read('/Users/daibang/Library/Preferences/netlify/config.json');
const token=c.users[c.userId].auth.token;
const get=async route=>{const r=await fetch('https://api.netlify.com/api/v1'+route,{headers:{Authorization:'Bearer '+token},signal:AbortSignal.timeout(30000)});assert(r.ok,'Provider metadata HTTP '+r.status);return r.json();};
const site=await get('/sites/fd68e39e-7863-4012-8a97-40bec59b23d9');
assert.equal(site.name,'oztimberfloor');
const deploy=await get('/deploys/'+site.published_deploy.id), inventory=await get('/deploys/'+deploy.id+'/files');
const provider=new Map(inventory.map(f=>[f.path.replace(/^\//,''),f]));
const rows=p.files.map(f=>{
  assert(!path.isAbsolute(f.file)&&!f.file.split('/').includes('..'));
  const bytes=fs.readFileSync(path.join(p.staticDirectory,f.file)), local=path.join(root,f.file);
  return {file:f.file,sealedSha256:f.sha256,archiveIntact:digest(bytes)===f.sha256,providerSha1:provider.get(f.file)?.sha||null,providerMatches:digest(bytes,'sha1')===provider.get(f.file)?.sha,localPresent:fs.existsSync(local),localMatches:fs.existsSync(local)&&digest(fs.readFileSync(local))===f.sha256};
});
const functionRows=[p.form,p.assistant].map(f=>({name:f.name,sealedSha256:f.sha256,archiveIntact:digest(fs.readFileSync(f.path))===f.sha256,providerMatches:deploy.available_functions.some(x=>x.n===f.name&&x.d===f.sha256),runtime:deploy.available_functions.find(x=>x.n===f.name)?.r}));
const packageNames=new Set(rows.map(r=>r.file));
const extraProviderFiles=[...provider.keys()].filter(f=>!packageNames.has(f));
assert(rows.every(r=>r.archiveIntact&&r.providerMatches)&&extraProviderFiles.length===0&&functionRows.every(r=>r.archiveIntact&&r.providerMatches),'Published release does not match sealed archive; stop before source changes');
fs.mkdirSync(out,{recursive:true});
const fixture=fs.mkdtempSync(path.join(os.tmpdir(),'oz-routing-reconcile-'));
const files=[...new Set([...git('ls-files','-z').split('\0'),...git('ls-files','--others','--exclude-standard','-z').split('\0').filter(f=>/^(assistant\/|assets\/|scripts\/|netlify\/functions\/|package-lock.json$)/.test(f))])].filter(f=>f&&fs.existsSync(root+'/'+f)&&fs.statSync(root+'/'+f).isFile()&&!/^\.env/.test(f));
const sourceHashes=[];
for(const f of files){fs.mkdirSync(path.dirname(fixture+'/'+f),{recursive:true});fs.copyFileSync(root+'/'+f,fixture+'/'+f);if(!f.startsWith('docs/'))sourceHashes.push({file:f,sha256:digest(fs.readFileSync(root+'/'+f))});}
// Original private inputs copied unchanged, never refreshed from production.
for(const f of ['gsc-equity-map-2026-09-01.csv','catalogue-quality-report.json']){
 const rel='docs/release/OZ-RELEASE-CLOSEOUT/generated/migration/'+f;
 fs.mkdirSync(path.dirname(fixture+'/'+rel),{recursive:true});fs.copyFileSync(root+'/'+rel,fixture+'/'+rel);
}
fs.symlinkSync(root+'/node_modules',fixture+'/node_modules','dir');
const sourceDifferences=rows.filter(r=>!r.localMatches).map(r=>r.file);
const record={at:new Date().toISOString(),branch:git('branch','--show-current'),head:git('rev-parse','HEAD'),dirtyStatus:git('status','--short'),site:{id:site.id,name:site.name},deploy:{id:deploy.id,context:deploy.context,commitRef:deploy.commit_ref||null,branchLabel:deploy.branch,publishedAt:deploy.published_at},manualDeployHasNoCommit:!deploy.commit_ref,files:rows,extraProviderFiles,functions:functionRows,sourceDifferences,fixture,sourceHashes,providerConfigurationWrites:0,paidCalls:0,formSubmissions:0};
fs.writeFileSync(out+'/RECONCILIATION.json',JSON.stringify(record,null,2),{flag:'wx'});
fs.copyFileSync(root+'/data/seo-migration-redirect-expectations.json',out+'/ORIGINAL_EXPECTATIONS.json');
fs.copyFileSync(root+'/scripts/seo-migration-hardening.mjs',out+'/ORIGINAL_HARDENING.mjs');
fs.copyFileSync(root+'/docs/release/OZ-RELEASE-CLOSEOUT/generated/migration/gsc-equity-map-2026-09-01.csv',out+'/ORIGINAL_EQUITY.csv');
try{execFileSync(process.execPath,['scripts/seo-migration-hardening.mjs'],{cwd:fixture,encoding:'utf8',stdio:'pipe'});}catch(e){fs.writeFileSync(out+'/BEFORE.log',String(e.stdout||'')+String(e.stderr||''),{flag:'wx'});}
fs.copyFileSync(fixture+'/docs/release/OZ-RELEASE-CLOSEOUT/generated/migration/seo-migration-hardening-report.json',out+'/BEFORE.json');
console.log(JSON.stringify({out,fixture,deploy:record.deploy,verifiedProviderFiles:rows.length,functions:functionRows,sourceDifferences},null,2));
