// Read-only activation preflight. Never logs/saves key values or raw responses.
import fs from 'node:fs';
import assert from 'node:assert/strict';
const out='docs/flooring-assistant/activation-2026-10-27';fs.mkdirSync(out,{recursive:true});
const c=JSON.parse(fs.readFileSync('/Users/daibang/Library/Preferences/netlify/config.json'));
const headers={Authorization:'Bearer '+c.users[c.userId].auth.token};
const api=async p=>{const r=await fetch('https://api.netlify.com/api/v1'+p,{headers,signal:AbortSignal.timeout(30000)});assert(r.ok,'Netlify read failed '+r.status);return r.json();};
const site=await api('/sites/fd68e39e-7863-4012-8a97-40bec59b23d9');assert.equal(site.name,'oztimberfloor');
const rows=await api('/accounts/'+site.account_slug+'/env?site_id='+site.id),key=rows.find(e=>e.key==='OZ_ASSISTANT_OPENAI_API_KEY');
assert(key?.is_secret&&key.scopes.includes('functions'));assert(key.values.filter(v=>v.value).every(v=>v.context==='deploy-preview'),'Unexpected existing key exposure');
const value=key.values.find(v=>v.context==='deploy-preview')?.value;
const result={at:new Date().toISOString(),siteId:site.id,siteName:site.name,productionDeployId:site.published_deploy.id,key:{name:key.key,isSecret:key.is_secret,scopes:key.scopes,nonemptyContexts:key.values.filter(v=>v.value).map(v=>v.context)},model:'gpt-6-luna',generationCalls:0,providerChanges:0,productionPublished:false};
// Secret values stay only in this process and travel solely to api.openai.com.
if(!/^sk-/.test(value||'')){result.modelAccess='NOT_RUN_SECRET_NOT_RETRIEVABLE';}
else{try{const r=await fetch('https://api.openai.com/v1/models/gpt-6-luna',{headers:{Authorization:'Bearer '+value},signal:AbortSignal.timeout(15000)}),body=await r.json();result.httpStatus=r.status;result.modelAccess=r.ok&&body.id==='gpt-6-luna'?'PASS':'FAIL';result.errorCode=/^[a-z_]+$/.test(body.error?.code||'')?body.error.code:null;}catch{result.modelAccess='NETWORK_ERROR';}}
fs.writeFileSync(out+'/EXISTING_KEY_CHECK.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));
