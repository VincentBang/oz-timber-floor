// One owner-authorised production-context provider test; public assistant stays OFF.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
import {getStore} from '@netlify/blobs';
import {atomicBlobFetch} from '../assistant/lib/blob-transport.mjs';
import {buildIndex,retrieve} from '../assistant/lib/retrieval.mjs';
import {hash} from '../assistant/lib/security.mjs';
const root=path.resolve(import.meta.dirname,'..'),base=root+'/docs/flooring-assistant/production-one-shot-2026-10-28',out=base+(/^r[2-5]$/.test(process.argv[2]||'')?'/attempt-'+process.argv[2]:'');
// Previous transport/preflight attempts must prove zero provider requests.
for(const dir of [base,...(fs.existsSync(base)?fs.readdirSync(base).filter(f=>f.startsWith('attempt-')).map(f=>base+'/'+f):[])])if(fs.existsSync(dir+'/REQUEST_STARTED.json')){assert(fs.existsSync(dir+'/RESULT.json'),'Uncertain prior request: stop, do not repeat');assert.equal(JSON.parse(fs.readFileSync(dir+'/RESULT.json')).body.providerRequests,0,'One authorised provider request already consumed');}
assert(!fs.existsSync(out+'/CREATED.json'),'Do not repeat an existing one-shot operation');
fs.mkdirSync(out,{recursive:true});
const read=p=>JSON.parse(fs.readFileSync(p)),write=(name,value)=>fs.writeFileSync(out+'/'+name,JSON.stringify(value,null,2));
const origin='https://oztimberfloor.com.au',siteId='fd68e39e-7863-4012-8a97-40bec59b23d9',rollback='6ae1138fb7fc5f96d33726ba';
const parent=root+'/docs/flooring-assistant/public-release-2026-10-28/attempt-v6';
for(const e of read(parent+'/MANIFEST.json').evidence)assert.equal(hash(fs.readFileSync(parent+'/'+e.file)),e.sha256);
const pkg=read(parent+'/PACKAGE.json'),approved=read(root+'/docs/flooring-assistant/activation-2026-10-27/PRODUCTION_PACKAGE.json');
assert(pkg.syntaxOnly&&pkg.assistantLauncherEnabled===false);
for(const f of pkg.files)assert.equal(hash(fs.readFileSync(pkg.staticDirectory+'/'+f.file)),f.sha256);
for(const f of [pkg.form,pkg.assistant])assert.equal(hash(fs.readFileSync(f.path)),f.sha256);
const c=read('/Users/daibang/Library/Preferences/netlify/config.json'),token=c.users[c.userId].auth.token;
const api=async(p,o={})=>{const r=await fetch('https://api.netlify.com/api/v1'+p,{...o,headers:{Authorization:'Bearer '+token,...o.headers},signal:AbortSignal.timeout(30000)});assert(r.ok,'Netlify HTTP '+r.status);return r.status===204?null:r.json();};
const store=getStore({name:'oz-assistant-production-budget-v1',region:'us-east-2',consistency:'strong',siteID:siteId,token,fetch:atomicBlobFetch()});
async function state(){const s=await store.get('state-v1',{type:'json',consistency:'strong'});return {control:await store.get('control-v1',{type:'json',consistency:'strong'}),hash:hash(s),money:Object.fromEntries(Object.entries(s.counters).filter(([k])=>/^b[dm]:/.test(k)).map(([k,v])=>[k,v.value/1e9])),calls:Object.fromEntries(Object.entries(s.counters).filter(([k])=>/^g[dm]:/.test(k)).map(([k,v])=>[k,v.value])),activeReservations:Object.values(s.reservations).filter(r=>r.pending&&r.slotExpires>Date.now()).length};}
const site=await api('/sites/'+siteId);assert.equal(site.name,'oztimberfloor');assert.equal(site.published_deploy.id,rollback);
const plan=await api('/accounts/'+site.account_slug);assert.equal(plan.type_name,'Free');assert(!plan.usages_exceeded?.length);assert.equal(plan.capabilities.accumulate_overages.included,false);
const envPath='/accounts/'+site.account_slug+'/env?site_id='+siteId;
// Netlify returns variable entries in nondeterministic order. Compare every
// full record by key, not response array order; do not exclude secret metadata.
const envHash=entries=>hash(entries.map(e=>[e.key,hash(e)]).sort(([a],[b])=>a.localeCompare(b)));
const envBefore=envHash(await api(envPath));
for(const key of ['OZ_ASSISTANT_ENABLED','OZ_ASSISTANT_PAID_CALLS_ENABLED'])assert.equal((await api(envPath)).find(v=>v.key===key).values.find(v=>v.context==='production').value,'false');
const before=await state();assert.equal(before.control.enabled,false);assert.equal(before.control.profileSha256,approved.profileHash);write('BEFORE.json',before);
const fixture=fs.mkdtempSync(path.join(os.tmpdir(),'oz-production-one-shot-')),fns=fixture+'/functions',bundle=fixture+'/bundle';fs.mkdirSync(fns);fs.mkdirSync(bundle);
fs.cpSync(approved.fixture+'/assistant/lib',fixture+'/lib',{recursive:true});fs.cpSync(root+'/node_modules',fixture+'/node_modules',{recursive:true,dereference:true});
const corpus=read(approved.fixture+'/assistant/generated/corpus.json'),facts=retrieve(buildIndex(corpus),'Compare engineered timber and hybrid',{pagePath:'/'}).facts;assert(facts.length);
const guard=crypto.randomBytes(32).toString('hex'),runId='production-one-shot-'+crypto.randomUUID(),deadline=Date.now()+15*60000;
const constants={origin,siteId,runId,deadline,guardHash:hash(guard),profile:approved.profile,profileHash:approved.profileHash,facts};
async function diagnostic(request,context){
 const reply=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json','Cache-Control':'no-store','X-Robots-Tag':'noindex,nofollow'}});
 if(Date.now()>C.deadline||context.site?.id!==C.siteId||context.deploy?.context!=='production'||context.deploy?.published!==true||request.method!=='POST'||new URL(request.url).origin!==C.origin||request.headers.get('origin')!==C.origin||hash(request.headers.get('x-oz-test-guard')||'')!==C.guardHash||process.env.OZ_ASSISTANT_ENABLED!=='false'||process.env.OZ_ASSISTANT_PAID_CALLS_ENABLED!=='false')return reply({status:'REFUSED'},403);
 let d={providerRequests:0,phase:'body'};
 try{
  if(await request.text()!=='{"op":"diagnose"}')return reply({status:'REFUSED'},400);
  d.phase='control_read';const blob=getStore({name:'oz-assistant-production-budget-v1',region:'us-east-2',consistency:'strong',fetch:atomicBlobFetch()}),control=await blob.get('control-v1',{type:'json',consistency:'strong'});
  if(control?.enabled!==false||control.profileSha256!==C.profileHash)return reply({status:'REFUSED'},403);
  d.phase='claim';if(!(await blob.setJSON('diagnostic-'+C.runId,{claimed:true},{onlyIfNew:true})).modified)return reply({status:'ALREADY_RUN'},409);
  const budget=new AtomicBlobBudgetStore(blob),now=Date.now();
  d.phase='reservation';if(!process.env.OZ_ASSISTANT_PRODUCTION_SIGNING_SECRET||process.env.OZ_ASSISTANT_PRODUCTION_SIGNING_SECRET.length<32)throw Error('production_signing_missing');await budget.reserve({key:C.runId,bodyHash:hash('fixed comparison diagnostic'),session:C.runId,ip:ipKey(context.ip,process.env.OZ_ASSISTANT_PRODUCTION_SIGNING_SECRET,now),limits:C.profile.allowance,reservedUsd:reservationCost(C.profile.rateTable),now});
  const fetchImpl=async(url,options)=>{if(d.providerRequests!==0)throw Error('one_request_only');d.providerRequests++;const r=await fetch(url,options);d.httpStatus=r.status;const b=await r.clone().json().catch(()=>({}));for(const k of ['code','type','param'])d['error_'+k]=/^[a-zA-Z0-9_.-]{1,80}$/.test(b.error?.[k]||'')?b.error[k]:null;d.completed=b.status==='completed';d.model=b.model==='gpt-6-luna'?b.model:null;return r;};
  d.phase='provider';const provider=new OpenAIResponsesProvider({key:process.env.OZ_ASSISTANT_OPENAI_API_KEY,model:'gpt-6-luna',fetchImpl}),result=await provider.generate({message:'Compare engineered timber and hybrid',facts:C.facts});
  const ids=result.plan.factIds; if(result.plan.status!=='answered'||!Array.isArray(ids)||ids.length<1||ids.some(id=>!C.facts.some(f=>f.id===id)))throw Error('unsupported_plan');
  const cost=reservationCost(C.profile.rateTable,result.usage.input_tokens,result.usage.output_tokens);await budget.settle(C.runId,cost);
  return reply({status:'PASS',...d,cost,usage:result.usage,selectedFactCount:ids.length,allFactIdsGrounded:true,syntheticAnswerFacts:C.facts.filter(f=>ids.includes(f.id)).map(({field,value,title})=>({field,value,title}))});
 }catch(error){return reply({status:'FAIL',...d,stage:/^[a-z_]{1,80}$/.test(error.message)?error.message:'unknown',errorType:['TypeError','Error','MissingBlobsEnvironmentError'].includes(error.name)?error.name:'Other'},503);}
}
const code="import {getStore} from '@netlify/blobs';import {atomicBlobFetch} from '../lib/blob-transport.mjs';import {AtomicBlobBudgetStore} from '../lib/atomic-budget.mjs';import {reservationCost} from '../lib/budget.mjs';import {OpenAIResponsesProvider} from '../lib/provider.mjs';import {hash,ipKey} from '../lib/security.mjs';\nconst C="+JSON.stringify(constants)+";\nexport default "+diagnostic.toString()+";\nexport const config={path:'/api/production-one-shot',method:'POST'};\n";
fs.writeFileSync(fns+'/production-one-shot.mjs',code);
const {zipFunctions}=await import(pathToFileURL('/private/tmp/oz-gpt-netlify-tools-3ngdza/node_modules/@netlify/zip-it-and-ship-it/dist/main.js'));
const functions=await zipFunctions(fns,bundle,{basePath:fixture,config:{'production-one-shot':{nodeBundler:'esbuild',nodeVersion:'24.x'}},manifest:bundle+'/manifest.json'});assert.equal(functions.length,1);
const extra={...functions[0],sha256:hash(fs.readFileSync(functions[0].path))},archives=[pkg.form,pkg.assistant,extra],functions_config={};
for(const f of archives)functions_config[f.name]={priority:f.priority,build_data:f.buildData,...(f.eventSubscriptions?{event_subscriptions:f.eventSubscriptions}:{}),...(f.routes?{routes:f.routes}:{})};
const rule=pkg.assistant.trafficRules.action.config;functions_config[pkg.assistant.name].traffic_rules={action:{type:'rate_limit',config:{rate_limit_config:{algorithm:rule.rateLimitConfig.algorithm,window_size:rule.rateLimitConfig.windowSize,window_limit:rule.rateLimitConfig.windowLimit},aggregate:rule.aggregate}}};
write('PACKAGE.json',{at:new Date().toISOString(),fixture,staticFilesUnchanged:pkg.files.length,mailArchive:pkg.form.sha256,assistantArchive:pkg.assistant.sha256,oneShotArchive:extra.sha256,guardValueRecorded:false,maxProviderRequests:1,productionSettingsChanged:false,deadline});
let created=false;
try{
 let deploy=await api('/sites/'+siteId+'/deploys?title='+encodeURIComponent('Owner approved one-use GPT credential test; public assistant OFF'),{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({files:Object.fromEntries(pkg.files.map(f=>[f.file,f.sha1])),functions:Object.fromEntries(archives.map(f=>[f.name,f.sha256])),functions_config,draft:false,async:true})});created=true;write('CREATED.json',{deployId:deploy.id,at:new Date().toISOString()});
 for(let i=0;i<90&&!Array.isArray(deploy.required);i++){await new Promise(r=>setTimeout(r,1000));deploy=await api('/deploys/'+deploy.id);assert.notEqual(deploy.state,'error');}
 assert(Array.isArray(deploy.required));
 for(const digest of deploy.required){const f=pkg.files.find(f=>f.sha1===digest);assert(f);await api('/deploys/'+deploy.id+'/files/'+encodeURI(f.file),{method:'PUT',headers:{'Content-Type':'application/octet-stream'},body:fs.readFileSync(pkg.staticDirectory+'/'+f.file)});}
 const {NetlifyAPI}=await import(pathToFileURL('/Users/daibang/.npm/_npx/da5c1b6ea715e8b4/node_modules/@netlify/api/lib/index.js')),sdk=new NetlifyAPI(token);
 for(const digest of deploy.required_functions||[]){const f=archives.find(f=>f.sha256===digest);assert(f);for(let attempt=0;attempt<2;attempt++){try{await sdk.uploadDeployFunction({deployId:deploy.id,name:f.name,runtime:f.runtimeVersion,invocationMode:f.invocationMode,body:()=>fs.createReadStream(f.path)});break;}catch(error){write('UPLOAD_ERROR-'+attempt+'.json',{function:f.name,status:error.status||error.statusCode||error.response?.status||null,type:error.name==='Error'?'Error':'SDKError'});if(attempt===1)throw Error('Function upload failed');await new Promise(r=>setTimeout(r,1000));}}}
 for(let i=0;i<300&&deploy.state!=='ready';i++){await new Promise(r=>setTimeout(r,1000));deploy=await api('/deploys/'+deploy.id);assert.notEqual(deploy.state,'error');}
 assert.equal(deploy.state,'ready');assert.equal(deploy.context,'production');assert.equal((await api('/sites/'+siteId)).published_deploy.id,deploy.id);
 for(const f of [pkg.form,pkg.assistant])assert.equal(deploy.available_functions.find(v=>v.n===f.name).d,f.sha256);
 assert.equal((await state()).control.enabled,false);assert.equal(envHash(await api(envPath)),envBefore);
 const checks=[];for(const route of ['/','/sitemap.xml','/assets/flooring-assistant-config.js','/assets/contact-config.js']){const r=await fetch(origin+route),b=Buffer.from(await r.arrayBuffer()),file=route==='/'?'index.html':route.slice(1);assert.equal(r.status,200);assert.equal(hash(b),pkg.files.find(f=>f.file===file).sha256);checks.push({route,status:r.status,sha256:hash(b)});}write('DEPLOY.json',{deployId:deploy.id,checks});
 const refused=await fetch(origin+'/api/production-one-shot',{method:'POST',headers:{Origin:origin},body:'{"op":"diagnose"}'});assert.equal(refused.status,403);
 assert.equal((await state()).hash,before.hash);
 write('REQUEST_STARTED.json',{at:new Date().toISOString(),maxRequests:1,message:'Compare engineered timber and hybrid',noCustomerData:true});
 const r=await fetch(origin+'/api/production-one-shot',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json','X-Oz-Test-Guard':guard},body:'{"op":"diagnose"}',signal:AbortSignal.timeout(30000)}),body=await r.json();
 write('RESULT.json',{at:new Date().toISOString(),httpStatus:r.status,body,before,after:await state()});console.log(JSON.stringify({httpStatus:r.status,...body}));
}finally{
 if(created){await api('/sites/'+siteId+'/deploys/'+rollback+'/restore',{method:'POST'});assert.equal((await api('/sites/'+siteId)).published_deploy.id,rollback);assert.equal((await state()).control.enabled,false);assert.equal(envHash(await api(envPath)),envBefore);write('RESTORED.json',{at:new Date().toISOString(),deployId:rollback,...await state()});console.log('Mail-tested release restored; public assistant and paid switches remain OFF');}
}
