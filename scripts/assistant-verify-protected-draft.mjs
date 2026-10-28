import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {hash} from '../assistant/lib/security.mjs';
const root=path.resolve(import.meta.dirname,'..'),out=root+'/docs/flooring-assistant/evidence/hosted-2026-10-27/mock-enabled';
const receipt=JSON.parse(fs.readFileSync(out+'/DEPLOY_STATE.json'));
const manifest=JSON.parse(fs.readFileSync(root+'/docs/flooring-assistant/RELEASE_MANIFEST.json'));
const config=JSON.parse(fs.readFileSync('/Users/daibang/Library/Preferences/netlify/config.json'));
const auth={Authorization:'Bearer '+config.users[config.userId].auth.token};
async function api(p){const r=await fetch('https://api.netlify.com/api/v1'+p,{headers:auth,signal:AbortSignal.timeout(30000)});assert(r.ok,'Provider '+r.status);return r.json();}
const site=await api('/sites/'+receipt.before.id),deploy=await api('/deploys/'+receipt.deployId);
assert.equal(site.published_deploy.id,receipt.before.publishedDeployId);assert.equal(site.sso_login,true);assert.equal(site.sso_login_context,'non_production');assert.equal(deploy.context,'deploy-preview');assert.equal(deploy.published_at,null);
const functions=deploy.available_functions.map(f=>({name:f.n,sha256:f.d,runtime:f.r,routes:f.ro||[],rateLimit:f.tr||null}));
assert.equal(functions.length,2);for(const f of manifest.functions)assert.equal(functions.find(d=>d.name===f.name)?.sha256,f.sha256);
assert.equal(functions.find(f=>f.name==='flooring-assistant').rateLimit.action.config.rate_limit_config.window_limit,12);
assert.equal(functions.find(f=>f.name==='flooring-assistant').routes[0].p,'/api/flooring-assistant');
const env=await api('/accounts/'+site.account_slug+'/env?site_id='+site.id);
const assistantEnv=env.filter(e=>e.key.startsWith('OZ_ASSISTANT_')).map(e=>({key:e.key,is_secret:e.is_secret,scopes:e.scopes,values:e.values.map(v=>({context:v.context,value:e.is_secret?'[REDACTED]':v.value}))}));
assert.equal(assistantEnv.length,5);for(const e of assistantEnv){assert.equal(e.values.length,1);assert.equal(e.values[0].context,'deploy-preview');}assert(!env.some(e=>e.key==='OPENAI_API_KEY'));
const probes=[];
for(const origin of [receipt.previewUrl,receipt.immutableUrl])for(const [route,method]of [['/','GET'],['/contact/','GET'],['/api/flooring-assistant','POST'],['/.netlify/functions/flooring-assistant','POST']]){
 const headers=method==='POST'?{'Content-Type':'application/json',Origin:origin}:{};
 const r=await fetch(origin+route,{method,headers,body:method==='POST'?JSON.stringify({op:'session',requestId:'anonymous-check-20261027'}):undefined,redirect:'manual',signal:AbortSignal.timeout(20000)});
 await r.arrayBuffer();const row={origin,route,method,status:r.status,robots:r.headers.get('x-robots-tag'),requestId:r.headers.get('x-nf-request-id')};probes.push(row);assert.equal(r.status,401);assert(/noindex/.test(row.robots));
}
const production=[];
for(const baseline of JSON.parse(fs.readFileSync(root+'/docs/flooring-assistant/PUBLIC_SAMPLES.json'))){
 const r=await fetch('https://oztimberfloor.com.au'+baseline.path,{redirect:'manual',signal:AbortSignal.timeout(20000)}),body=Buffer.from(await r.arrayBuffer());
 const row={path:baseline.path,status:r.status,sha256:hash(body),matchesPredeploymentPublicBytes:hash(body)===baseline.sha256,robots:r.headers.get('x-robots-tag')};production.push(row);assert.equal(r.status,baseline.status);assert(row.matchesPredeploymentPublicBytes,'Production drift '+baseline.path);
}
const walk=d=>fs.readdirSync(d,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(d,e.name)):[path.join(d,e.name)]);
const files=walk(manifest.staticDirectory).map(f=>({path:path.relative(manifest.staticDirectory,f),sha256:hash(fs.readFileSync(f)),bytes:fs.statSync(f).size})).sort((a,b)=>a.path.localeCompare(b.path));assert.equal(hash(files),manifest.staticManifestHash);
assert.equal(hash(fs.readFileSync(root+'/docs/flooring-assistant/RELEASE_MANIFEST.json')),'fdb4c44ea15eb0bee5fde7cfad6ecca03ef1dc093cd68bd696a77668df8e6536');
const result={at:new Date().toISOString(),deployId:deploy.id,context:deploy.context,published_at:deploy.published_at,productionDeployId:site.published_deploy.id,productionPointerUnchanged:true,protection:{teamLogin:site.sso_login,context:site.sso_login_context},functions,assistantEnv,openAIKeyPresent:false,anonymousProtection:probes,productionSamples:production,staticFiles:files.length,staticManifestHash:hash(files),originalSealUnchanged:true,providerSummary:deploy.summary,sourceZipUploaded:deploy.has_source_zip,authenticatedBackendChecks:'See BROWSER.json; anonymous 401 does not validate handler behavior'};
fs.writeFileSync(out+'/HTTPS_PROVIDER_CHECKS.json',JSON.stringify(result,null,2));console.log(JSON.stringify({success:true,deployId:deploy.id,functions:functions.map(f=>({name:f.name,sha256:f.sha256})),anonymousChecks:probes.length,productionSamples:production.length,staticFiles:files.length,productionUnchanged:true},null,2));
