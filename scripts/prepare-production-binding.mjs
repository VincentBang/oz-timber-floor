// LOCAL ONLY. No provider client, credentials, network, Git or deployment code.
// Source/UI defaults and historical approval fixtures remain untouched. The
// explicit prebuilt release overlay is separate; never publish a normal build
// assuming this OFF source template has been activated automatically.
import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import {fileURLToPath,pathToFileURL} from 'node:url';import {execFileSync} from 'node:child_process';
import {parse} from 'parse5';import {hash} from '../assistant/lib/security.mjs';import {checkProductionBinding} from './production-binding-contract.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),out=process.env.OZ_PRODUCTION_BINDING_OUTPUT;
if(!out||!path.isAbsolute(out)||fs.existsSync(out))throw Error('Provide a new absolute OZ_PRODUCTION_BINDING_OUTPUT outside dist');
if(out.startsWith(root+'/dist/'))throw Error('Private release output must not be published');
const read=f=>JSON.parse(fs.readFileSync(root+'/'+f)),authority=read('assistant/releases/2026-10-29/LOCAL_BINDING_AUTHORITY.json'),corpus=read('assistant/generated/corpus.json'),policy=read('assistant/config/policy.json');
const preview=JSON.parse(fs.readFileSync('/private/tmp/oz-navigation-local-dzEkae/candidate/assistant/generated/corpus.json'));
assert.equal(preview.corpusVersion,authority.reviewedPreviewCorpus);assert.equal(corpus.corpusVersion,authority.productionCorpus);
const facts=c=>c.documents.flatMap(d=>d.facts.map(f=>JSON.stringify([d.canonicalPath,f]))).sort(),beforeFacts=new Set(facts(preview)),afterFacts=new Set(facts(corpus));
const added=[...afterFacts].filter(f=>!beforeFacts.has(f)),removed=[...beforeFacts].filter(f=>!afterFacts.has(f));assert.equal(removed.length,0);assert.equal(added.length,1);assert.equal(beforeFacts.size,6743);assert.deepEqual(corpus.retirements,preview.retirements);
const sourceManifest=read('assistant/generated/source-manifest.json');for(const[f,digest]of Object.entries(sourceManifest.files))assert.equal(hash(fs.readFileSync(root+'/'+f)),digest,f);
const live=read('docs/flooring-assistant/public-release-2026-10-28/attempt-v7/PACKAGE.json'),liveRoot=live.assistant.path.replace('/bundle/flooring-assistant.zip',''),profile=JSON.parse(fs.readFileSync(liveRoot+'/assistant/config/production.json'));
assert.equal(hash(profile),live.profileHash);assert.equal(hash(fs.readFileSync(live.assistant.path)),live.assistant.sha256);assert.equal(hash(fs.readFileSync(live.form.path)),live.form.sha256);
const approvedLiveCorpus=JSON.parse(fs.readFileSync(liveRoot+'/assistant/generated/corpus.json'));assert(facts(approvedLiveCorpus).includes(added[0]),'Restored policy fact must already exist exactly in the approved live corpus');const [addedPath,addedFact]=JSON.parse(added[0]);assert.equal(addedPath,authority.restoredPolicyFact.path);assert.equal(addedFact.id,authority.restoredPolicyFact.id);
const modelPath='docs/flooring-assistant/production-one-shot-2026-10-28/attempt-r5/RESULT.json',storePath='docs/flooring-assistant/production-approved-preflight-2026-10-27/HOSTED_SUITE.json',modelProofBytes=fs.readFileSync(root+'/'+modelPath),storeProofBytes=fs.readFileSync(root+'/'+storePath);
assert.equal(hash(storeProofBytes),'9ab3674b37becb25d7b78cef407df5338b0a6e8b399143196dc0bb069d688dec');
profile.boundCorpusVersion=corpus.corpusVersion;profile.privacyDocumentSha256=corpus.documents.find(d=>d.canonicalPath==='/privacy/').sourceHash;
profile.approvalReference='Existing owner-approved privacy, data use, GPT-6 Luna and US$30/month/US$1/day controls; Vincent 29 Oct explicitly approved preparation of the exact combined production binding. This is a LOCAL PREPARED PAYLOAD, not permission to push, deploy or change live controls. Authority receipt: assistant/releases/2026-10-29/LOCAL_BINDING_AUTHORITY.json';
profile.modelAccess={status:'PRODUCTION_KEY_PASS',reportSha256:hash(modelProofBytes)};
profile.rateTable.verifiedAt='2026-10-29';
const checked=checkProductionBinding({profile,corpus,policy,authority,modelProofBytes,storeProofBytes});
assert.deepEqual(profile,read('assistant/releases/2026-10-29/production-profile.json'),'Prepared payload must match the exact locally reviewed release profile');
const critical=['assistant/lib/atomic-budget.mjs','assistant/lib/blob-transport.mjs','assistant/lib/budget.mjs','assistant/lib/production.mjs','assistant/lib/runtime.mjs','assistant/lib/deployment.mjs'];for(const f of critical)assert.equal(hash(fs.readFileSync(root+'/'+f)),hash(fs.readFileSync(liveRoot+'/'+f)),f);
const attr=(n,k)=>n.attrs?.find(a=>a.name===k)?.value,all=(n,p)=>[...(p(n)?[n]:[]),...(n.childNodes||[]).flatMap(c=>all(c,p))];
function text(n){if(n.nodeName==='#text')return n.value;const value=(n.childNodes||[]).map(text).join(' ');if((attr(n,'class')||'').split(/\s+/).includes('hero-badge')){assert.equal(value.replace(/\s+/g,' ').trim(),'Supply Install Preparation');return '';}return value;}
const mainText=f=>text(all(parse(fs.readFileSync(f,'utf8')),n=>n.tagName==='main')[0]).replace(/\s+/g,' ').trim();
assert.equal(mainText(root+'/privacy.html'),mainText(live.staticDirectory+'/privacy.html'),'Privacy wording changed beyond reviewed presentation');
assert.equal(read('assistant/config/production.json').activationApproved,false);assert.match(fs.readFileSync(root+'/assets/flooring-assistant-config.js','utf8'),/enabled: false/);
fs.mkdirSync(out,{recursive:true});const fixture=out+'/overlay';
for(const dir of ['dist','assistant/lib','assistant/generated','assistant/config','node_modules'])fs.cpSync(root+'/'+dir,fixture+'/'+dir,{recursive:true,dereference:true});
fs.mkdirSync(fixture+'/netlify/functions',{recursive:true});fs.copyFileSync(root+'/netlify/functions/flooring-assistant.mjs',fixture+'/netlify/functions/flooring-assistant.mjs');
fs.writeFileSync(fixture+'/assistant/config/production.json',JSON.stringify(profile,null,2)+'\n');
fs.writeFileSync(fixture+'/dist/assets/flooring-assistant-config.js','window.OZ_FLOORING_ASSISTANT = Object.freeze({enabled:true,mode:"production",productionApproved:true});\n');
assert(!fs.readFileSync(fixture+'/dist/_headers','utf8').includes('noindex'));assert.match(fs.readFileSync(fixture+'/dist/assets/contact-config.js','utf8'),/ga4MeasurementId: "G-EWSMKKM9N8"/);
const {zipFunctions}=await import(pathToFileURL(process.env.OZ_ASSISTANT_BUNDLER||'/private/tmp/oz-gpt-netlify-tools-3ngdza/node_modules/@netlify/zip-it-and-ship-it/dist/main.js'));
const functions=await zipFunctions(fixture+'/netlify/functions',out+'/functions',{basePath:fixture,config:{'flooring-assistant':{nodeBundler:'esbuild',nodeVersion:'24.x'}},manifest:out+'/functions/manifest.json'});assert.equal(functions.length,1);
const assistant=functions[0],form={...live.form,path:out+'/functions/resend-enquiry-notification.zip'};fs.copyFileSync(live.form.path,form.path);assert.equal(hash(fs.readFileSync(form.path)),live.form.sha256);
const clean=out+'/clean';fs.mkdirSync(clean);execFileSync('unzip',['-q',assistant.path,'-d',clean]);const loaded=await import(pathToFileURL(clean+'/netlify/functions/flooring-assistant.mjs'));
const refused=await loaded.default(new Request('https://oztimberfloor.com.au/api/flooring-assistant',{method:'POST',headers:{Origin:'https://oztimberfloor.com.au','Content-Type':'application/json'},body:'{}'}),{});assert.equal(refused.status,403);
const walk=d=>fs.readdirSync(d,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(d+'/'+e.name):[d+'/'+e.name]);
const files=walk(fixture+'/dist').map(f=>({file:path.relative(fixture+'/dist',f),sha256:hash(fs.readFileSync(f)),bytes:fs.statSync(f).size})).sort((a,b)=>a.file.localeCompare(b.file));
const write=(f,v)=>fs.writeFileSync(out+'/'+f,JSON.stringify(v,null,2));
write('PROOFS.json',{model:{file:modelPath,sha256:hash(modelProofBytes),scope:'Historical actual Production-context generation; not a new paid request'},store:{file:storePath,sha256:hash(storeProofBytes),scope:'Historical real production-store component/CAS tests; not fresh hosted validation'},criticalCode:critical.map(file=>({file,sha256:hash(fs.readFileSync(root+'/'+file)),matchesLive:true})),privacyTextUnchangedFromApprovedLive:true,factsUnchanged:6743,restoredPolicyFact:{path:addedPath,...addedFact,alreadyInApprovedLiveCorpus:true},sourceManifestSha256:hash(fs.readFileSync(root+'/assistant/generated/source-manifest.json')),authoritySha256:hash(fs.readFileSync(root+'/assistant/releases/2026-10-29/LOCAL_BINDING_AUTHORITY.json'))});
write('BINDING.json',{schemaVersion:1,at:new Date().toISOString(),...checked,profileFile:fixture+'/assistant/config/production.json',profileFileSha256:hash(fs.readFileSync(fixture+'/assistant/config/production.json')),preparedActivationPayload:true,liveActivationApplied:false,providerWrites:0,paidCalls:0,publishWorkflow:'Explicit prebuilt public package plus exact two function archives only; normal source build remains OFF'});
write('PACKAGE.json',{schemaVersion:1,at:new Date().toISOString(),fixture,staticDirectory:fixture+'/dist',files,assistant:{...assistant,sha256:hash(fs.readFileSync(assistant.path))},form,profileHash:checked.profileHash,profileSha256:hash(fs.readFileSync(fixture+'/assistant/config/production.json')),corpusVersion:corpus.corpusVersion,corpusSha256:hash(fs.readFileSync(fixture+'/assistant/generated/corpus.json')),productionUiEnabled:true,productionPublished:false,deployAuthorized:false,providerWritesAuthorized:false,rollbackDeployId:'6ae122decf6c1988e807e38f'});
console.log(JSON.stringify({output:out,profileHash:checked.profileHash,corpusVersion:corpus.corpusVersion,staticFiles:files.length,enquiryArchivePreserved:true,productionUiPrepared:true,liveChanges:0}));
