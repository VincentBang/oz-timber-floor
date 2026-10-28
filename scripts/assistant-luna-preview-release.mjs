// Explicit transport for the owner-approved protected internal evaluation only.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {pathToFileURL} from 'node:url';
import {hash} from '../assistant/lib/security.mjs';
const root=path.resolve(import.meta.dirname,'..');
const out=root+'/docs/flooring-assistant/gpt-luna-2026-10-27';
const write=(p,value)=>fs.writeFileSync(p,JSON.stringify(value,null,2));
const mode=process.argv[2];
const walk=d=>fs.readdirSync(d,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(d,e.name)):[path.join(d,e.name)]);
fs.mkdirSync(out,{recursive:true});
const prior=JSON.parse(fs.readFileSync(root+'/docs/flooring-assistant/gpt-integration-2026-10-27/MANIFEST.json'));
const statePath=out+'/STATE.json';
if(mode==='prepare'){
 assert(!fs.existsSync(statePath),'Existing run: inspect, do not overwrite');
 const previousDir=root+'/docs/flooring-assistant/gpt-hosted-2026-10-27';
 const previous=JSON.parse(fs.readFileSync(previousDir+'/MANIFEST.json'));
 assert.equal(hash(fs.readFileSync(previousDir+'/MANIFEST.json')),'9a13d5ec6d72b508866879c1ab00f7ddbb164c23ee83e3e22b57b94cd32ed165');
 for(const f of previous.evidence)assert.equal(hash(fs.readFileSync(previousDir+'/'+f.file)),f.sha256,'Historical evidence drift '+f.file);
 const oldState=JSON.parse(fs.readFileSync(previousDir+'/STATE.json')),oldPackage=JSON.parse(fs.readFileSync(previousDir+'/PACKAGE_paid.json'));
 for(const f of oldPackage.staticFiles)assert.equal(hash(fs.readFileSync(oldPackage.staticDirectory+'/'+f.path)),f.sha256);
 const fixture=fs.mkdtempSync(path.join(os.tmpdir(),'oz-luna-hosted-'));
 fs.cpSync(oldState.fixture,fixture,{recursive:true,filter:p=>!['.netlify','.git'].some(n=>path.relative(oldState.fixture,p).split(path.sep).includes(n))});
 assert(!fs.lstatSync(fixture+'/node_modules').isSymbolicLink());
 for(const name of fs.readdirSync(root+'/assistant/lib'))if(name.endsWith('.mjs'))fs.copyFileSync(root+'/assistant/lib/'+name,fixture+'/assistant/lib/'+name);
 const profile=JSON.parse(fs.readFileSync(root+'/assistant/config/paid-preview.json'));
 assert.equal(profile.activationApproved,false);assert.equal(profile.candidateModelId,'gpt-6-luna');
 profile.activationApproved=true;profile.dataUseApproved=true;
 profile.approvalReference='Owner approval in Codex 2026-10-27: GPT-6 Luna protected testing, remaining <=15 additional calls within SAME lifetime20 / US$1; no production';
 write(fixture+'/assistant/config/paid-preview.json',profile);
 const runId='oz-gpt-verify-'+hash({at:new Date().toISOString(),model:profile.candidateModelId}).slice(0,12),origin='https://'+runId+'--oztimberfloor.netlify.app';
 fs.writeFileSync(fixture+'/netlify/functions/flooring-assistant.mjs',`import {verificationHandler} from '../../assistant/lib/hosted-verification.mjs';\nexport default verificationHandler(${JSON.stringify(runId)},'gpt-6-luna');\nexport const config={path:'/api/flooring-assistant',method:'POST',rateLimit:{windowLimit:12,windowSize:60,aggregateBy:['ip','domain']}};\n`);
 fs.writeFileSync(fixture+'/dist/assets/flooring-assistant-config.js','window.OZ_FLOORING_ASSISTANT = Object.freeze({ enabled: true, mode: "mock" });\n');
 fs.writeFileSync(fixture+'/dist/assistant-verification/index.html','<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="robots" content="noindex,nofollow"><title>Protected Luna verification</title></head><body><h1>GPT-6 Luna protected verification — zero generation</h1><p>Same lifetime20-call / US$1 ledger; no production or real enquiries.</p><button id="model">Check model access</button> <button id="ledger">Read existing lifetime ledger</button> <button id="suite">Verify hosted spending controls</button> <button id="receipt">Read persisted verification</button><pre id="result" aria-live="polite">Not run</pre><script src="/assets/assistant-verification.js" defer></script></body></html>');
 fs.writeFileSync(fixture+'/dist/assets/assistant-verification.js',`for(const op of ['model','ledger','suite','receipt'])document.getElementById(op).onclick=async()=>{const target=document.getElementById('result');target.textContent='Running '+op;try{const r=await fetch('/api/flooring-assistant',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({op}),credentials:'same-origin'});target.textContent=JSON.stringify({httpStatus:r.status,...await r.json()},null,2);}catch{target.textContent=JSON.stringify({status:'NETWORK_ERROR',op});}};\n`);
 write(statePath,{schemaVersion:1,at:new Date().toISOString(),fixture,runId,origin,profileHash:hash(profile),priorHostedManifestHash:hash(fs.readFileSync(previousDir+'/MANIFEST.json')),originalMockManifestHash:hash(fs.readFileSync(root+'/docs/flooring-assistant/RELEASE_MANIFEST.json')),productionDeployId:oldState.productionDeployId,stages:[]});
 console.log(fs.readFileSync(statePath,'utf8'));
}else if(mode==='bundle'){
 const state=JSON.parse(fs.readFileSync(statePath)),fixture=state.fixture;
 if(fs.lstatSync(fixture+'/node_modules').isSymbolicLink()){
  const target=fs.realpathSync(fixture+'/node_modules');assert.equal(target,fs.realpathSync(path.dirname(prior.staticDirectory)+'/node_modules'));
  fs.unlinkSync(fixture+'/node_modules');fs.cpSync(target,fixture+'/node_modules',{recursive:true,dereference:true});
 }
 const bundler=process.env.OZ_GPT_BUNDLER||'/Users/daibang/.npm/_npx/da5c1b6ea715e8b4/node_modules/@netlify/zip-it-and-ship-it/dist/main.js';
 const {zipFunctions}=await import(pathToFileURL(bundler));
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'oz-gpt-hosted-functions-'));
 const result=await zipFunctions(fixture+'/netlify/functions',dir,{basePath:fixture,config:{'flooring-assistant':{nodeBundler:'esbuild',nodeVersion:'24.x'}},manifest:dir+'/manifest.json'});
 assert.deepEqual(result.map(f=>f.name).sort(),['flooring-assistant','resend-enquiry-notification']);
 const resend=result.find(f=>f.name==='resend-enquiry-notification'),sealedResend=prior.functions.find(f=>f.name===resend.name);
 assert.equal(hash(fs.readFileSync(fixture+'/netlify/functions/resend-enquiry-notification.mjs')),hash(fs.readFileSync(root+'/netlify/functions/resend-enquiry-notification.mjs')));
 assert.equal(hash(fs.readFileSync(sealedResend.path)),sealedResend.sha256);
 // A fresh archive embeds different fixture paths. Transport the exact already
 // verified notification archive instead; never replace the real form backend.
 fs.copyFileSync(sealedResend.path,resend.path);assert.equal(hash(fs.readFileSync(resend.path)),sealedResend.sha256);
 const extracted=fs.mkdtempSync(path.join(os.tmpdir(),'oz-gpt-hosted-clean-load-'));
 execFileSync('unzip',['-q',result.find(f=>f.name==='flooring-assistant').path,'-d',extracted]);
 const noLinks=d=>{for(const e of fs.readdirSync(d)){const p=path.join(d,e),s=fs.lstatSync(p);assert(!s.isSymbolicLink(),'Archive must not depend on local symlinks');if(s.isDirectory())noLinks(p);}};noLinks(extracted);
 const entries=['flooring-assistant.mjs','netlify/functions/flooring-assistant.mjs'].map(p=>extracted+'/'+p).filter(p=>fs.existsSync(p));assert.equal(entries.length,1);const fn=await import(pathToFileURL(entries[0]));assert.equal(typeof fn.default,'function');
 const denied=await fn.default(new Request('https://oztimberfloor.com.au/api/flooring-assistant',{method:'POST',body:'{}'}),{});assert.equal(denied.status,403);
 const files=walk(fixture+'/dist').map(p=>({path:path.relative(fixture+'/dist',p),sha256:hash(fs.readFileSync(p)),bytes:fs.statSync(p).size})).sort((a,b)=>a.path.localeCompare(b.path));
 const record={stage:process.argv[3]||'verification',at:new Date().toISOString(),staticDirectory:fixture+'/dist',bundleDirectory:dir,staticFileCount:files.length,staticManifestHash:hash(files),staticFiles:files,functions:result.map(f=>({name:f.name,path:f.path,sha256:hash(fs.readFileSync(f.path))})),profileHash:hash(JSON.parse(fs.readFileSync(fixture+'/assistant/config/paid-preview.json')))};
 write(out+'/PACKAGE_'+record.stage+'.json',record);console.log(JSON.stringify({...record,staticFiles:undefined},null,2));
}else if(mode==='deploy'){
 const stage=process.argv[3]||'verification',state=JSON.parse(fs.readFileSync(statePath)),pkg=JSON.parse(fs.readFileSync(out+'/PACKAGE_'+stage+'.json'));
 assert(!state.stages.some(s=>s.stage===stage),'Stage already deployed; inspect first');
 const config=JSON.parse(fs.readFileSync('/Users/daibang/Library/Preferences/netlify/config.json'));
 const headers={Authorization:'Bearer '+config.users[config.userId].auth.token};
 async function api(p,options={}){const r=await fetch('https://api.netlify.com/api/v1'+p,{...options,headers:{...headers,...options.headers},signal:AbortSignal.timeout(30000)});assert(r.ok,'Netlify '+(options.method||'GET')+' '+r.status);return r.status===204?null:r.json();}
 const siteId='fd68e39e-7863-4012-8a97-40bec59b23d9';const before=await api('/sites/'+siteId);assert.equal(before.name,'oztimberfloor');assert.equal(before.published_deploy?.id,state.productionDeployId);assert.equal(before.sso_login,true);assert.equal(before.sso_login_context,'non_production');
 const account=await api('/accounts/'+before.account_slug);assert.equal(account.type_name,'Free');assert.equal(account.capabilities.accumulate_overages.included,false);assert(!account.usages_exceeded?.length);
 const envPath='/accounts/'+before.account_slug+'/env?site_id='+siteId,env=await api(envPath);
 const key=env.find(e=>e.key==='OZ_ASSISTANT_OPENAI_API_KEY');assert(key?.is_secret);assert(!key.scopes.includes('post_processing'));assert.deepEqual(key.values.filter(v=>v.value).map(v=>v.context),['deploy-preview']);
 const origin=state.origin,profileHash=pkg.profileHash;
 const desired={OZ_ASSISTANT_ENABLED:'true',OZ_ASSISTANT_MODE:stage.startsWith('verification')?'mock':'preview',OZ_ASSISTANT_PREVIEW_APPROVED:'true',OZ_ASSISTANT_ORIGIN:origin,OZ_ASSISTANT_PAID_PREVIEW_APPROVED:'true',OZ_ASSISTANT_PAID_CONFIG_HASH:profileHash,OZ_ASSISTANT_PAID_CALLS_ENABLED:stage==='paid'?'true':'false'};
 const safeEnv=rows=>rows.filter(e=>!e.key.startsWith('OZ_ASSISTANT_')).map(e=>({key:e.key,is_secret:e.is_secret,scopes:e.scopes,values:e.values}));
 const unrelatedHash=hash(safeEnv(env)),changes=[];
 for(const [name,value]of Object.entries(desired)){
  const previous=env.find(e=>e.key===name);if(previous)assert(previous.values.filter(v=>v.value).every(v=>v.context==='deploy-preview'));
  if(previous){await api('/accounts/'+before.account_slug+'/env/'+name+'?site_id='+siteId,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({key:name,is_secret:false,scopes:previous.scopes,values:[{context:'deploy-preview',value}]})});}
  else await api(envPath,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify([{key:name,is_secret:false,scopes:['builds','functions','runtime','post_processing'],values:[{context:'deploy-preview',value}]}])});
  changes.push({key:name,context:'deploy-preview',before:previous?.values.map(v=>({context:v.context,value:v.value}))||[],after:value});
  write(out+'/SETTINGS_PROGRESS_'+stage+'.json',{at:new Date().toISOString(),changes,productionDeployId:before.published_deploy.id});
 }
 const afterEnv=await api(envPath);assert.equal(hash(safeEnv(afterEnv)),unrelatedHash);
 for(const [name,value]of Object.entries(desired))assert.deepEqual(afterEnv.find(e=>e.key===name).values.filter(v=>v.value).map(v=>({context:v.context,value:v.value})),[{context:'deploy-preview',value}]);
 for(const f of pkg.staticFiles)assert.equal(hash(fs.readFileSync(pkg.staticDirectory+'/'+f.path)),f.sha256);
 for(const f of pkg.functions)assert.equal(hash(fs.readFileSync(f.path)),f.sha256);
 const transport=fs.mkdtempSync(path.join(os.tmpdir(),'oz-gpt-hosted-transport-'));fs.mkdirSync(transport+'/.netlify/functions',{recursive:true});fs.copyFileSync(root+'/netlify.toml',transport+'/netlify.toml');
 const bm=JSON.parse(fs.readFileSync(pkg.bundleDirectory+'/manifest.json'));bm.timestamp=Date.now();write(transport+'/.netlify/functions/manifest.json',bm);
 write(out+'/PREFLIGHT_'+stage+'.json',{at:new Date().toISOString(),siteId,productionDeployId:before.published_deploy.id,plan:{name:account.type_name,usageExceeded:account.usages_exceeded},changes,keyMetadata:{is_secret:key.is_secret,scopes:key.scopes,contexts:key.values.map(v=>({context:v.context,nonempty:!!v.value}))},pkgHash:hash(pkg),transport});
 const args=['/Users/daibang/.npm/_npx/da5c1b6ea715e8b4/node_modules/netlify-cli/bin/run.js','deploy','--draft','--no-build','--alias='+state.runId,'--dir='+pkg.staticDirectory,'--functions='+pkg.bundleDirectory,'--site='+siteId,'--message=Owner approved protected GPT internal '+stage+'; <=20 calls / US$1; no production','--json'];
 const output=execFileSync(process.execPath,args,{cwd:transport,encoding:'utf8',maxBuffer:4000000,timeout:240000});const receipt=JSON.parse(output);write(out+'/DEPLOY_RECEIPT_'+stage+'.json',receipt);
 const deploy=await api('/deploys/'+receipt.deploy_id),after=await api('/sites/'+siteId);assert.equal(after.published_deploy.id,before.published_deploy.id);assert.equal(deploy.published_at,null);assert.equal(deploy.context,'deploy-preview');assert.equal(deploy.state,'ready');
 const result={stage,at:new Date().toISOString(),deployId:deploy.id,context:deploy.context,publishedAt:deploy.published_at,origin,immutableUrl:'https://'+deploy.id+'--oztimberfloor.netlify.app',productionUnchanged:true,productionDeployId:after.published_deploy.id,packageHash:hash(pkg),functions:deploy.available_functions?.map(f=>({name:f.n,sha256:f.d}))};state.stages.push(result);write(statePath,state);write(out+'/DEPLOY_STATE_'+stage+'.json',result);console.log(JSON.stringify(result,null,2));
}else if(mode==='stage-paid'){
 const observed=JSON.parse(fs.readFileSync(out+'/BROWSER_LIVE.json')),off=observed.evaluation.find(e=>e.check==='paid-call-switch-off')?.observed,before=observed.evaluation.find(e=>e.check==='before-paid-calls')?.observed;
 assert.equal(off.httpStatus,503);assert.equal(off.reason,'feature_off');assert.equal(before.evaluationCalls,JSON.parse(fs.readFileSync(out+'/BASELINE_BUDGET.json')).evaluationCalls);assert.equal(before.evaluationReservedUsd,JSON.parse(fs.readFileSync(out+'/BASELINE_BUDGET.json')).evaluationReservedUsd);assert.equal(before.paidCallsEnabled,false);
 const pkg=JSON.parse(fs.readFileSync(out+'/PACKAGE_evaluation-off.json'));write(out+'/PACKAGE_paid.json',{...pkg,stage:'paid',at:new Date().toISOString(),identicalToOffStage:true});console.log('Exact off-tested static/function bytes staged for approved capped paid evaluation');
}else if(mode==='prepare-evaluation'){
 const state=JSON.parse(fs.readFileSync(statePath)),fixture=state.fixture,proof=JSON.parse(fs.readFileSync(out+'/BUDGET_VERIFICATION.json')),model=JSON.parse(fs.readFileSync(out+'/MODEL_ACCESS.json'));
 assert.equal(proof.suite.status,'PASS');assert.equal(proof.crossInvocation.status,'PASS');assert.equal(model.status,'PASS');assert.equal(model.model,'gpt-6-luna');
 const profile=JSON.parse(fs.readFileSync(fixture+'/assistant/config/paid-preview.json'));profile.accountModelAvailable=true;profile.budgetVerification={status:'HOSTED_PASS',reportSha256:hash(fs.readFileSync(out+'/BUDGET_VERIFICATION.json'))};write(fixture+'/assistant/config/paid-preview.json',profile);
 fs.copyFileSync(root+'/assistant/lib/evaluation-harness.mjs',fixture+'/assistant/lib/evaluation-harness.mjs');
 fs.writeFileSync(fixture+'/netlify/functions/flooring-assistant.mjs',`import corpus from '../../assistant/generated/corpus.json' with {type:'json'};\nimport policy from '../../assistant/config/policy.json' with {type:'json'};\nimport profile from '../../assistant/config/paid-preview.json' with {type:'json'};\nimport {evaluationHandler} from '../../assistant/lib/evaluation-harness.mjs';\nexport default (request,context)=>evaluationHandler(request,context,{corpus,policy,profile});\nexport const config={path:'/api/flooring-assistant',method:'POST',rateLimit:{windowLimit:12,windowSize:60,aggregateBy:['ip','domain']}};\n`);
 fs.writeFileSync(fixture+'/dist/assets/flooring-assistant-config.js','window.OZ_FLOORING_ASSISTANT = Object.freeze({ enabled: true, mode: "preview" });\n');
 fs.writeFileSync(fixture+'/dist/assistant-verification/index.html','<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="robots" content="noindex,nofollow"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Oz protected GPT evaluation</title></head><body><h1>Protected GPT evaluation</h1><p>GPT-6 Luna. Owner-approved synthetic questions and public Oz facts only. Maximum20 calls / US$1 total. Not customer advice. No enquiry is submitted. Questions are sent to OpenAI overseas.</p><label>Test question<textarea id="question" maxlength="2000">Tell me about Avala Blackbutt</textarea></label><button id="send">Send one approved test question</button> <button id="budget">Read evaluation budget</button> <button id="replay">Replay last request (must not call GPT)</button><pre id="result" aria-live="polite">Not run</pre><script src="/assets/assistant-verification.js" defer></script></body></html>');
 fs.writeFileSync(fixture+'/dist/assets/assistant-verification.js',`let sessionToken='',last;const target=document.getElementById('result');async function call(body){const r=await fetch('/api/flooring-assistant',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body),credentials:'same-origin'});return {httpStatus:r.status,metadata:Object.fromEntries([...r.headers].filter(([k])=>k.startsWith('x-oz-evaluation-'))),...await r.json()};}document.getElementById('budget').onclick=async()=>{target.textContent=JSON.stringify(await call({op:'evaluation-budget'}),null,2);};document.getElementById('send').onclick=async()=>{target.textContent='Running approved synthetic question';try{if(!sessionToken){const s=await call({op:'session',requestId:crypto.randomUUID()});if(!s.sessionToken){target.textContent=JSON.stringify(s,null,2);return;}sessionToken=s.sessionToken;}last={op:'message',requestId:crypto.randomUUID(),sessionToken,message:document.getElementById('question').value,pagePath:'/',history:[]};target.textContent=JSON.stringify(await call(last),null,2);}catch{target.textContent='NETWORK_ERROR';}};document.getElementById('replay').onclick=async()=>{if(last)target.textContent=JSON.stringify(await call(last),null,2);};\n`);
 write(out+'/APPROVED_PROFILE.json',profile);console.log(JSON.stringify({fixture,profileHash:hash(profile),budgetReportSha256:profile.budgetVerification.reportSha256,paidCallsStillOff:true},null,2));
}else if(mode==='verify-remote'){
 const state=JSON.parse(fs.readFileSync(statePath)),latest=state.stages.at(-1),config=JSON.parse(fs.readFileSync('/Users/daibang/Library/Preferences/netlify/config.json'));
 const auth={Authorization:'Bearer '+config.users[config.userId].auth.token};
 const read=async p=>{const r=await fetch('https://api.netlify.com/api/v1'+p,{headers:auth,signal:AbortSignal.timeout(20000)});assert(r.ok);return r.json();};
 const site=await read('/sites/fd68e39e-7863-4012-8a97-40bec59b23d9'),deploy=await read('/deploys/'+latest.deployId),env=await read('/accounts/'+site.account_slug+'/env?site_id='+site.id);
 assert.equal(site.published_deploy.id,state.productionDeployId);assert(site.sso_login&&site.sso_login_context==='non_production');assert.equal(deploy.published_at,null);
 const key=env.find(e=>e.key==='OZ_ASSISTANT_OPENAI_API_KEY');assert(key.is_secret);assert.deepEqual(key.values.filter(v=>v.value).map(v=>v.context),['deploy-preview']);
 const paidCallsEnabled=latest.stage==='paid';assert(env.find(e=>e.key==='OZ_ASSISTANT_PAID_CALLS_ENABLED').values.filter(v=>v.value).every(v=>v.value===String(paidCallsEnabled)));
 const anonymous=[];for(const origin of [state.origin,latest.immutableUrl])for(const route of ['/','/assistant-verification/','/api/flooring-assistant','/.netlify/functions/flooring-assistant']){
  const post=route.includes('flooring-assistant'),r=await fetch(origin+route,{method:post?'POST':'GET',headers:post?{Origin:origin,'Content-Type':'application/json'}:{},body:post?'{"op":"model"}':undefined,redirect:'manual',signal:AbortSignal.timeout(15000)});await r.arrayBuffer();const row={origin,route,status:r.status,robots:r.headers.get('x-robots-tag')};anonymous.push(row);assert.equal(r.status,401);assert(row.robots?.includes('noindex'));
 }
 const production=[];for(const sample of JSON.parse(fs.readFileSync(root+'/docs/flooring-assistant/PUBLIC_SAMPLES.json'))){const r=await fetch('https://oztimberfloor.com.au'+sample.path,{redirect:'manual',signal:AbortSignal.timeout(15000)}),sha256=hash(Buffer.from(await r.arrayBuffer()));const row={path:sample.path,status:r.status,sha256,unchanged:sha256===sample.sha256};production.push(row);assert.equal(r.status,sample.status);assert(row.unchanged);}
 const pkg=JSON.parse(fs.readFileSync(out+'/PACKAGE_'+latest.stage+'.json')),originalPkg=JSON.parse(fs.readFileSync(root+'/docs/flooring-assistant/gpt-integration-2026-10-27/PACKAGE.json'));
 const actual=new Map(pkg.staticFiles.map(f=>[f.path,f]));let byteIdentical=0;for(const f of originalPkg.staticFiles){if(f.path==='assets/flooring-assistant-config.js'&&!latest.stage.startsWith('verification')){assert.equal(fs.readFileSync(pkg.staticDirectory+'/'+f.path,'utf8'),'window.OZ_FLOORING_ASSISTANT = Object.freeze({ enabled: true, mode: "preview" });\n');continue;}assert.equal(actual.get(f.path)?.sha256,f.sha256);byteIdentical++;}
 const result={at:new Date().toISOString(),project:site.name,siteId:site.id,deployId:deploy.id,publishedAt:deploy.published_at,productionDeployId:site.published_deploy.id,productionPointerUnchanged:true,anonymous,production,key:{secret:key.is_secret,scopes:key.scopes,contexts:key.values.map(v=>({context:v.context,nonempty:!!v.value}))},paidCallsEnabled,originalStaticFilesByteIdentical:byteIdentical,previewUiModeChange:byteIdentical!==originalPkg.staticFileCount,addedPrivateQaFiles:pkg.staticFileCount-originalPkg.staticFileCount,originalNotificationZipUnchanged:true};
 write(out+'/REMOTE_CHECKS_'+latest.stage+'.json',result);console.log(JSON.stringify({anonymous:anonymous.length,productionSamples:production.length,productionUnchanged:true,paidCallsEnabled,originalStaticFilesByteIdentical:byteIdentical},null,2));
}else if(mode==='seal'){
 const state=JSON.parse(fs.readFileSync(statePath)),browser=JSON.parse(fs.readFileSync(out+'/BROWSER_LIVE.json')),pkg=JSON.parse(fs.readFileSync(out+'/PACKAGE_paid.json')),remote=JSON.parse(fs.readFileSync(out+'/REMOTE_CHECKS_paid.json')),baseline=JSON.parse(fs.readFileSync(out+'/BASELINE_BUDGET.json'));
 const budget=browser.evaluation.find(e=>e.check==='final-durable-budget').observed;
 assert.equal(baseline.evaluationCalls,5);assert.equal(baseline.evaluationReservedUsd,.0024476);
 assert(budget.evaluationCalls>baseline.evaluationCalls&&budget.evaluationCalls<=20);assert(budget.evaluationCalls-baseline.evaluationCalls<=15);assert(budget.evaluationReservedUsd>=baseline.evaluationReservedUsd&&budget.evaluationReservedUsd<=1);assert.equal(budget.maxCalls,20);assert.equal(budget.maxUsd,1);assert.equal(browser.consoleErrors.length,0);
 const corpus=JSON.parse(fs.readFileSync(root+'/assistant/generated/corpus.json')),facts=new Set(corpus.documents.flatMap(d=>d.facts.map(f=>f.id)));
 const generated=browser.evaluation.filter(e=>e.observed.metadata?.['x-oz-evaluation-model']==='gpt-6-luna');assert(generated.length>=3);
 for(const item of generated){assert.equal(item.observed.httpStatus,200);assert.equal(item.observed.corpusVersion,corpus.corpusVersion);assert.equal(item.observed.metadata['x-oz-evaluation-cached'],'0');assert.equal(item.observed.metadata['x-oz-evaluation-written'],'0');assert.equal(item.observed.metadata['x-oz-evaluation-reasoning'],'0');for(const segment of item.observed.segments)for(const id of segment.evidenceIds)assert(facts.has(id),'Uncorroborated fact');for(const source of item.observed.sources)assert(corpus.documents.some(d=>d.canonicalPath===source.href));}
 assert.equal(browser.evaluation.find(e=>e.check==='paid-replay-rejected').observed.reason,'duplicate');assert(remote.productionPointerUnchanged);
 const checks=JSON.parse(fs.readFileSync(out+'/LOCAL_CHECKS.json'));assert(checks.checks.every(c=>c.exitCode===0));
 for(const [file,expected]of [['docs/flooring-assistant/RELEASE_MANIFEST.json','fdb4c44ea15eb0bee5fde7cfad6ecca03ef1dc093cd68bd696a77668df8e6536'],['docs/flooring-assistant/gpt-integration-2026-10-27/MANIFEST.json','82d611402a783feb4660c6febcea7755d3bb8ece995e07d90c1897d5933e0e54'],['docs/flooring-assistant/gpt-hosted-2026-10-27/MANIFEST.json','9a13d5ec6d72b508866879c1ab00f7ddbb164c23ee83e3e22b57b94cd32ed165']])assert.equal(hash(fs.readFileSync(root+'/'+file)),expected);
 const sourceFiles=['assistant/lib/runtime.mjs','assistant/lib/provider.mjs','assistant/lib/budget.mjs','assistant/lib/handler.mjs','assistant/lib/blob-transport.mjs','assistant/lib/hosted-verification.mjs','assistant/lib/evaluation-harness.mjs','assistant/tests/luna.test.mjs','assistant/tests/paid-preview.test.mjs','scripts/assistant-luna-preview-release.mjs','.gitignore','OZ_STATUS.md','assistant/config/paid-preview.json','assets/flooring-assistant-config.js'].map(file=>({file,sha256:hash(fs.readFileSync(root+'/'+file))}));
 const evidence=walk(out).filter(p=>path.basename(p)!=='MANIFEST.json').map(p=>({file:path.relative(out,p),sha256:hash(fs.readFileSync(p)),bytes:fs.statSync(p).size}));
 const manifest={schemaVersion:1,at:new Date().toISOString(),outcome:'PROTECTED_LUNA_WORKING__NOT_APPROVED_FOR_PUBLIC_USE',branch:execFileSync('git',['branch','--show-current'],{cwd:root}).toString().trim(),head:execFileSync('git',['rev-parse','HEAD'],{cwd:root}).toString().trim(),preview:state.origin,deployId:state.stages.at(-1).deployId,productionDeployId:state.productionDeployId,productionUnchanged:true,model:'gpt-6-luna',requestSettings:{reasoningEffort:'none',cacheMode:'explicit',cacheTtl:'30m',cacheBreakpoints:0},baselineCalls:baseline.evaluationCalls,newGenerationAttempts:budget.evaluationCalls-baseline.evaluationCalls,paidCalls:budget.evaluationCalls,usageDerivedEstimatedUsd:budget.evaluationReservedUsd,invoiceReconciled:false,remainingEvaluationCalls:budget.maxCalls-budget.evaluationCalls,evaluationCeiling:{calls:20,usd:1},paidPreviewOn:true,publicActivationApproved:false,sourceUiOff:true,sourcePaidProfileOff:true,unitTests:45,hostedSafetyGroups:6,anonymousProtectionChecks:8,unchangedProductionSamples:11,corpusVersion:corpus.corpusVersion,staticManifestHash:pkg.staticManifestHash,staticFiles:pkg.staticFileCount,functions:pkg.functions,approvedProfileHash:pkg.profileHash,budgetProofHash:hash(fs.readFileSync(out+'/BUDGET_VERIFICATION.json')),historicalManifestsUnchanged:true,realFormSubmissions:0,gitPromotions:0,productionDeployments:0,providerUpgrade:false,sourceFiles,evidence};
 write(out+'/MANIFEST.json',manifest);console.log(JSON.stringify({manifest:out+'/MANIFEST.json',sha256:hash(fs.readFileSync(out+'/MANIFEST.json')),preview:manifest.preview,deployId:manifest.deployId,paidCalls:manifest.paidCalls,newAttempts:manifest.newGenerationAttempts,estimatedUsd:manifest.usageDerivedEstimatedUsd,remainingCalls:manifest.remainingEvaluationCalls,productionUnchanged:true},null,2));
}else if(mode==='checks'){
 const checks=[],run=(cmd,args)=>{try{const output=execFileSync(cmd,args,{cwd:root,encoding:'utf8',maxBuffer:4000000});checks.push({command:[cmd,...args],exitCode:0,output});}catch(error){checks.push({command:[cmd,...args],exitCode:error.status,output:String(error.stdout||'')+String(error.stderr||'')});}};
 run(process.execPath,['--test',...fs.readdirSync(root+'/assistant/tests').filter(f=>f.endsWith('.test.mjs')).map(f=>'assistant/tests/'+f)]);
 for(const f of ['assistant/lib/hosted-verification.mjs','assistant/lib/evaluation-harness.mjs','scripts/assistant-luna-preview-release.mjs'])run(process.execPath,['--check',f]);
 run('git',['diff','--check']);
 assert.equal(hash(fs.readFileSync(root+'/docs/flooring-assistant/RELEASE_MANIFEST.json')),'fdb4c44ea15eb0bee5fde7cfad6ecca03ef1dc093cd68bd696a77668df8e6536');
 assert.equal(hash(fs.readFileSync(root+'/docs/flooring-assistant/gpt-integration-2026-10-27/MANIFEST.json')),'82d611402a783feb4660c6febcea7755d3bb8ece995e07d90c1897d5933e0e54');
 write(out+'/LOCAL_CHECKS.json',{at:new Date().toISOString(),checks,historicalSealsUnchanged:true});console.log(JSON.stringify(checks.map(c=>({command:c.command,exitCode:c.exitCode})),null,2));assert(checks.every(c=>c.exitCode===0));
}else throw Error('Use prepare, bundle <stage>, deploy <stage>, or checks');
