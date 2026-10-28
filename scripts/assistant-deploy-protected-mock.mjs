// Transport only: do not rebuild or modify the approved candidate or archives.
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {hash} from '../assistant/lib/security.mjs';

const root=path.resolve(import.meta.dirname,'..');
const manifestPath=root+'/docs/flooring-assistant/RELEASE_MANIFEST.json';
const original=fs.readFileSync(manifestPath);
const manifest=JSON.parse(original),core={...manifest};delete core.manifestSha256;
assert.equal(hash(core),manifest.manifestSha256);
assert.equal(manifest.manifestSha256,'4616da42b4b5d54a87fcd80e1974bc4f6d26e0bf5aacb6637b4096b15b8a28b3');
const walk=d=>fs.readdirSync(d,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(d,e.name)):[path.join(d,e.name)]);
const staticFiles=walk(manifest.staticDirectory).map(f=>({path:path.relative(manifest.staticDirectory,f),sha256:hash(fs.readFileSync(f)),bytes:fs.statSync(f).size})).sort((a,b)=>a.path.localeCompare(b.path));
assert.equal(hash(staticFiles),manifest.staticManifestHash);assert.equal(staticFiles.length,manifest.staticFileCount);
for(const f of manifest.functions)assert.equal(hash(fs.readFileSync(f.path)),f.sha256);
for(const f of manifest.files)assert.equal(hash(fs.readFileSync(root+'/'+f.file)),f.sha256,'Source drift '+f.file);
const siteId='fd68e39e-7863-4012-8a97-40bec59b23d9',alias='oz-assistant-'+manifest.staticManifestHash.slice(0,12);
const enableMock=process.argv.includes('--approved-preview-settings');
const config=JSON.parse(fs.readFileSync('/Users/daibang/Library/Preferences/netlify/config.json'));
const headers={Authorization:'Bearer '+config.users[config.userId].auth.token};
async function get(p){const r=await fetch('https://api.netlify.com/api/v1'+p,{headers,signal:AbortSignal.timeout(30000)});assert(r.ok,'Provider GET '+r.status);return r.json();}
function safeSite(s){return {id:s.id,name:s.name,ssl_url:s.ssl_url,publishedDeployId:s.published_deploy?.id,sso_login:s.sso_login,sso_login_context:s.sso_login_context,has_password:s.has_password};}
const before=await get('/sites/'+siteId);assert.equal(before.name,'oztimberfloor');assert.equal(before.sso_login,true);assert.equal(before.sso_login_context,'non_production');
const account=await get('/accounts/'+before.account_slug);
const deploys=await get('/sites/'+siteId+'/deploys?per_page=100');
const aliasMatches=deploys.filter(d=>JSON.stringify(d).includes(alias));
if(enableMock){assert.equal(aliasMatches.length,1);assert.equal(aliasMatches[0].id,'6ae002605654767185c6463f');assert.equal(aliasMatches[0].published_at,null);}
else assert.equal(aliasMatches.length,0,'Alias already used');
const env=await get('/accounts/'+before.account_slug+'/env?site_id='+siteId);
assert(!env.some(e=>e.key.startsWith('OZ_ASSISTANT_')),'Unexpected assistant settings: review before any action');
assert.equal(account.capabilities.env_var_scopes.included,false,'Review changed plan capabilities before configuring settings');
let settingsReceipt=[];
if(enableMock){
 const values={OZ_ASSISTANT_ENABLED:'true',OZ_ASSISTANT_MODE:'mock',OZ_ASSISTANT_PREVIEW_APPROVED:'true',OZ_ASSISTANT_ORIGIN:'https://'+alias+'--oztimberfloor.netlify.app',OZ_ASSISTANT_SIGNING_SECRET:crypto.randomBytes(48).toString('base64url')};
 const body=Object.entries(values).map(([key,value])=>({key,is_secret:key.endsWith('_SECRET'),scopes:key.endsWith('_SECRET')?['builds','functions','runtime']:['builds','functions','runtime','post_processing'],values:[{context:'deploy-preview',value}]}));
 const response=await fetch('https://api.netlify.com/api/v1/accounts/'+before.account_slug+'/env?site_id='+siteId,{method:'POST',headers:{...headers,'Content-Type':'application/json'},body:JSON.stringify(body),signal:AbortSignal.timeout(30000)});
 assert(response.ok,'Scoped settings creation failed: '+response.status+'; inspect provider state before retry (no secret response logged)');
 const actual=await get('/accounts/'+before.account_slug+'/env?site_id='+siteId);
 assert.equal(hash(actual.filter(e=>!e.key.startsWith('OZ_ASSISTANT_'))),hash(env.filter(e=>!e.key.startsWith('OZ_ASSISTANT_'))),'Unrelated environment state changed');
 for(const row of body){const match=actual.find(e=>e.key===row.key);assert(match,'Missing '+row.key);assert.deepEqual(match.scopes.slice().sort(),row.scopes.slice().sort());assert.equal(match.values.length,1);assert.equal(match.values[0].context,'deploy-preview');if(!row.is_secret)assert.equal(match.values[0].value,row.values[0].value);else assert.equal(match.is_secret,true);}
 settingsReceipt=body.map(e=>({...e,values:e.values.map(v=>({...v,value:e.is_secret?'[REDACTED]':v.value}))}));
}
// Free plan cannot provide the approved Functions-only scope. Leave API OFF.
// The cache timestamp below records transport preparation, not a rerun of tests.
// Preserve sealed routes/runtime/rate-limit metadata instead of re-bundling ZIPs.
const transport=fs.mkdtempSync(path.join(os.tmpdir(),'oz-assistant-draft-transport-'));
fs.mkdirSync(transport+'/.netlify/functions',{recursive:true});
fs.copyFileSync(root+'/netlify.toml',transport+'/netlify.toml');
const bundleManifest=JSON.parse(fs.readFileSync(manifest.functionBundleDirectory+'/manifest.json'));
assert.deepEqual(bundleManifest.functions.map(f=>f.name).sort(),manifest.functions.map(f=>f.name).sort());
bundleManifest.timestamp=Date.now();
fs.writeFileSync(transport+'/.netlify/functions/manifest.json',JSON.stringify(bundleManifest));
const cli='/Users/daibang/.npm/_npx/da5c1b6ea715e8b4/node_modules/netlify-cli/bin/run.js';
const args=['deploy','--draft','--no-build','--alias='+alias,'--dir='+manifest.staticDirectory,'--functions='+manifest.functionBundleDirectory,'--site='+siteId,'--message=Approved sealed protected MOCK preview; '+(enableMock?'preview-context-only variables':'API OFF (Free scope limitation)')+' '+manifest.manifestSha256,'--json'];
const out=root+'/docs/flooring-assistant/evidence/hosted-2026-10-27'+(enableMock?'/mock-enabled':'');fs.mkdirSync(out,{recursive:true});
const preflight={at:new Date().toISOString(),manifestFileSha256:hash(original),manifestHash:manifest.manifestSha256,staticHash:hash(staticFiles),staticFiles:staticFiles.length,functions:manifest.functions.map(f=>({name:f.name,sha256:f.sha256})),before:safeSite(before),plan:{name:account.type_name,envScopes:account.capabilities.env_var_scopes,overages:account.capabilities.accumulate_overages,usageExceeded:account.usages_exceeded},assistantEnvBefore:[],providerChanges:settingsReceipt,apiConfigured:enableMock,reason:enableMock?'Owner explicitly approved all-scope nonproduction mock variables; signing secret excludes post-processing per Netlify secret rules':'Functions-only environment scopes unavailable on Free; no broader scope or upgrade authorised',transport,command:[process.execPath,cli,...args],cacheMetadata:'Sealed function metadata copied with current transport timestamp only; no build/test/bundle regeneration'};
fs.writeFileSync(out+'/PREFLIGHT.json',JSON.stringify(preflight,null,2));
const stdout=execFileSync(process.execPath,[cli,...args],{cwd:transport,encoding:'utf8',maxBuffer:4*1024*1024,timeout:240000});
const result=JSON.parse(stdout);
fs.writeFileSync(out+'/DEPLOY_RECEIPT.json',JSON.stringify(result,null,2));
const deploy=await get('/deploys/'+result.deploy_id),after=await get('/sites/'+siteId);
assert.equal(after.published_deploy?.id,before.published_deploy?.id,'PRODUCTION POINTER CHANGED');
assert.equal(deploy.site_id,siteId);assert.equal(deploy.published_at,null);assert.equal(deploy.state,'ready');
assert.equal(hash(fs.readFileSync(manifestPath)),hash(original));
const receipt={at:new Date().toISOString(),deployId:deploy.id,state:deploy.state,context:deploy.context,published_at:deploy.published_at,alias,previewUrl:'https://'+alias+'--oztimberfloor.netlify.app',immutableUrl:deploy.links?.permalink||'https://'+deploy.id+'--oztimberfloor.netlify.app',before:safeSite(before),after:safeSite(after),productionUnchanged:true,assistantApiConfigured:enableMock,assistantApiVerification:'PENDING_AUTHENTICATED_TEST',providerSettingsChanges:settingsReceipt,manifestFileUnchanged:true};
fs.writeFileSync(out+'/DEPLOY_STATE.json',JSON.stringify(receipt,null,2));console.log(JSON.stringify(receipt,null,2));
