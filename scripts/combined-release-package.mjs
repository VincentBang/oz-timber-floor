// Local-only assembly of a reviewed website build plus the EXACT existing live
// assistant/upload archives. No network, provider, deployment or Git writes.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {execFileSync} from 'node:child_process';
export const LIVE_DEPLOY='6aed0124f8a810d9098d6b1b';
export const PROFILE='7755e9f34ddf7ae17c7912a3eabddd5971a9fbb650a1e32ef47dfcc0a5d21ba6';
export const CORPUS='e15e64b25fd01798e0430c8af886b7bdd37961d3607a061a0dba7941bd318358';
const BUILD_MANIFEST='e4e833219c06b5baaad918bd56ae944b5d441913753e2a7c420a8ab92b5d4f39';
export const digest=b=>crypto.createHash('sha256').update(typeof b==='string'||b instanceof Uint8Array?b:JSON.stringify(b)).digest('hex');
const json=f=>JSON.parse(fs.readFileSync(f)),walk=(dir,p='')=>fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>{assert(!e.isSymbolicLink(),'Symlink in release '+p+e.name);return e.isDirectory()?walk(dir+'/'+e.name,p+e.name+'/'):[p+e.name];}).sort();
const inside=(child,parent)=>{const r=path.relative(path.resolve(parent),path.resolve(child));return r===''||(!r.startsWith('..'+path.sep)&&r!=='..'&&!path.isAbsolute(r));};
function clone(from,to){fs.mkdirSync(path.dirname(to),{recursive:true});if(process.platform==='darwin')execFileSync('/bin/cp',['-c',from,to]);else fs.copyFileSync(from,to,fs.constants.COPYFILE_FICLONE_FORCE);}
export function assertActiveProfile(profile,corpus){
 assert.equal(digest(profile),PROFILE,'Exact live approval profile required');
 assert.equal(digest(corpus),'d882ec2693f0c72b1199cdca4fcee0e946018e02cb5832a69eb976451738acae');
 assert.equal(digest(corpus.documents),CORPUS);assert.equal(profile.boundCorpusVersion,CORPUS);
 assert.equal(profile.activationApproved,true);assert.equal(profile.allowance.dayBudgetUsd,1);assert.equal(profile.allowance.monthBudgetUsd,30);
 assert.equal(profile.budgetStoreName,'oz-assistant-production-budget-v1');assert.equal(profile.budgetStoreRegion,'us-east-2');
 assert.equal(profile.apiKeyVariable,'OZ_ASSISTANT_OPENAI_API_KEY');assert.equal(profile.candidateModelId,'gpt-6-luna');
}
export function assertProductionUI(code){const sandbox={window:{}};vm.runInNewContext(code,sandbox,{timeout:1000});const c=sandbox.window.OZ_FLOORING_ASSISTANT;assert(c?.enabled===true&&c.mode==='production'&&c.productionApproved===true,'Do not publish the source-OFF or mock configuration');}
export function prepareCombined({buildRoot,liveRoot,sourceRoot,output}){
 assert(path.isAbsolute(output),'Use an explicit absolute output directory');
 for(const root of[buildRoot,liveRoot,sourceRoot]){assert(fs.statSync(root).isDirectory());assert(!inside(output,root)&&!inside(root,output),'Output must be isolated from all input trees');}
 assert(!fs.existsSync(output),'Never overwrite an existing release/evidence packet');
 assert.equal(digest(fs.readFileSync(buildRoot+'/PUBLIC_MANIFEST.json')),BUILD_MANIFEST,'Unreviewed website base');
 const base=json(buildRoot+'/PUBLIC_MANIFEST.json'),live=json(liveRoot+'/PACKAGE.json'),release=json(liveRoot+'/RELEASE_MANIFEST.json');
 assert.equal(release.deployId,LIVE_DEPLOY);assert.equal(release.status,'RELEASED_AND_LIVE_VERIFIED');
 const profile=json(liveRoot+'/production-profile.json'),corpus=json(liveRoot+'/function-source/assistant/generated/corpus.json');assertActiveProfile(profile,corpus);
 assert.equal(digest(json(sourceRoot+'/assistant/generated/corpus.json')),digest(corpus),'New knowledge needs its own release review');
 assert.equal(Object.keys(base).length,6598);assert.deepEqual(walk(buildRoot+'/public'),Object.keys(base).sort());
 for(const[f,h]of Object.entries(base))assert.equal(digest(fs.readFileSync(buildRoot+'/public/'+f)),h,'Reviewed build drift '+f);
 assert.equal(live.files.length,6596);for(const f of live.files)assert.equal(digest(fs.readFileSync(live.publish+'/'+f.file)),f.sha256,'Live packet drift '+f.file);
 for(const f of live.functions)assert.equal(digest(fs.readFileSync(f.path)),f.sha256,'Live function drift');
 assert.equal(live.functions.find(f=>f.name==='flooring-assistant').sha256,'f5c36da566b473e09398614cddd7f82e2cc6eb96c5ae1f07555ada01e15361d4');
 assert.equal(live.functions.find(f=>f.name==='resend-enquiry-notification').sha256,'553a49f26fc7bb5fbf8c0961857f885e0636391c656a1392e5ba90dac260505e');
 for(const f of['_redirects','robots.txt','sitemap.xml','assets/contact-config.js','assets/flooring-assistant.js','assets/flooring-guide-request.js','assets/enquiry-attachments.js'])assert.equal(base[f],digest(fs.readFileSync(live.publish+'/'+f)),'Protected live contract '+f);
 // All core floorplan code/vendor files stay byte-identical. The reviewed
 // contact-review presentation and shared site-theme are the only exceptions.
 const floorplanExceptions=['floor-plan/contact-review.mjs','floor-plan/site-theme.css','floor-plan/index.html'];
 const preload='<link rel="preload" as="style" href="/assets/audit-remediation.css">\n';
 assert.equal(fs.readFileSync(buildRoot+'/public/floor-plan/index.html','utf8').replace(preload,''),fs.readFileSync(live.publish+'/floor-plan/index.html','utf8'),'Floorplan HTML may add only the reviewed shared stylesheet preload');
 for(const f of live.files.filter(f=>f.file.startsWith('floor-plan/')&&!floorplanExceptions.includes(f.file)))assert.equal(base[f.file],f.sha256,f.file);
 assert(/enabled: false/.test(fs.readFileSync(sourceRoot+'/assets/flooring-assistant-config.js','utf8')),'Source defaults must stay OFF');
 fs.mkdirSync(output,{recursive:true});
 const publish=output+'/public';if(process.platform==='darwin')execFileSync('/bin/cp',['-cR',buildRoot+'/public',publish]);else fs.cpSync(buildRoot+'/public',publish,{recursive:true,mode:fs.constants.COPYFILE_FICLONE_FORCE});
 clone(live.publish+'/assets/flooring-assistant-config.js',publish+'/assets/flooring-assistant-config.js');
 assertProductionUI(fs.readFileSync(publish+'/assets/flooring-assistant-config.js','utf8'));
 // Search is regenerated on the independent source copy before assembly.
 clone(sourceRoot+'/assets/site-search-index.json',publish+'/assets/site-search-index.json');
 // Scoped post-review repair: native-details sort controls must not collapse.
 clone(sourceRoot+'/assets/audit-remediation.css',publish+'/assets/audit-remediation.css');
 const functions=live.functions.map(f=>{const file=output+'/functions/'+f.name+'.zip';clone(f.path,file);return{...f,path:file,mainFile:undefined};});
 clone(liveRoot+'/production-profile.json',output+'/production-profile.json');
 clone(liveRoot+'/function-source/assistant/generated/corpus.json',output+'/corpus.json');
 const files=walk(publish).map(file=>({file,sha256:digest(fs.readFileSync(publish+'/'+file)),bytes:fs.statSync(publish+'/'+file).size}));
 const old=new Map(live.files.map(f=>[f.file,f.sha256])),changed=files.filter(f=>old.get(f.file)!==f.sha256).map(f=>f.file);
 const packageInfo={status:'LOCAL_COMBINED_CANDIDATE_NOT_DEPLOYED',publish,files,functions,profilePath:output+'/production-profile.json',profileHash:PROFILE,corpusVersion:CORPUS,baseDeploy:LIVE_DEPLOY,monthlyUsd:30,dailyUsd:1,budgetLedgerReset:false,providerWrites:0,pushes:0,deployments:0,paidCalls:0,realSubmissions:0,changedPublicFiles:changed,addedPublicFiles:files.filter(f=>!old.has(f.file)).map(f=>f.file),sourceDefaultsRemainOff:true,incrementalOverlayFiles:['assets/audit-remediation.css'],approval:'Existing live chatbot approval reused unchanged; website publication NOT authorised',floorplanExceptions};
 fs.writeFileSync(output+'/PACKAGE.json',JSON.stringify(packageInfo,null,2)+'\n');
 verifyCombined(output);return packageInfo;
}
export function verifyCombined(output){
 const p=json(output+'/PACKAGE.json');assert.equal(p.status,'LOCAL_COMBINED_CANDIDATE_NOT_DEPLOYED');assert.equal(p.baseDeploy,LIVE_DEPLOY);assert.equal(p.profileHash,PROFILE);assert.equal(p.corpusVersion,CORPUS);assert.equal(p.monthlyUsd,30);assert.equal(p.dailyUsd,1);assert.equal(p.budgetLedgerReset,false);
 assertActiveProfile(json(output+'/production-profile.json'),json(output+'/corpus.json'));
 assert.deepEqual(walk(p.publish),p.files.map(f=>f.file).sort());
 for(const f of p.files){assert(!path.isAbsolute(f.file)&&!f.file.split('/').includes('..'));assert(!/^(?:assistant|scripts|docs|config|data|netlify|node_modules|fixtures|\.git)(?:\/|$)/.test(f.file));assert(!/(?:^|\/)(?:AGENTS\.md|OZ_STATUS\.md|package(?:-lock)?\.json|netlify\.toml|\.env(?:\..*)?)$/.test(f.file));assert.equal(digest(fs.readFileSync(p.publish+'/'+f.file)),f.sha256,f.file);}
 assert.deepEqual(p.functions.map(f=>f.name).sort(),['flooring-assistant','resend-enquiry-notification']);
 const archives={'flooring-assistant':'f5c36da566b473e09398614cddd7f82e2cc6eb96c5ae1f07555ada01e15361d4','resend-enquiry-notification':'553a49f26fc7bb5fbf8c0961857f885e0636391c656a1392e5ba90dac260505e'};
 for(const f of p.functions){assert.equal(f.sha256,archives[f.name]);assert.equal(digest(fs.readFileSync(f.path)),f.sha256,f.name);}
 assertProductionUI(fs.readFileSync(p.publish+'/assets/flooring-assistant-config.js','utf8'));
 assert(!/X-Robots-Tag:\s*noindex,\s*nofollow/i.test(fs.readFileSync(p.publish+'/_headers','utf8')));
 assert(fs.readFileSync(p.publish+'/assets/contact-config.js','utf8').includes('ga4MeasurementId: "G-EWSMKKM9N8"'));
 return{status:'PASS',files:p.files.length,functions:p.functions.length,monthlyUsd:30,dailyUsd:1,networkCalls:0};
}
