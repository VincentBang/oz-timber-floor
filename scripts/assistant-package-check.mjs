import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {execFileSync} from 'node:child_process';
import assert from 'node:assert/strict';
import {hash} from '../assistant/lib/security.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),publish=path.join(root,'dist'),out=path.join(root,'docs/flooring-assistant/evidence');fs.mkdirSync(out,{recursive:true});
function walk(dir){return fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(dir,e.name)):[path.join(dir,e.name)]);}
assert(fs.existsSync(publish),'Build in an isolated snapshot first');
for(const name of ['assistant','docs','data','node_modules','.git','netlify'])assert(!fs.existsSync(path.join(publish,name)),'Private package root '+name);
for(const name of ['flooring-assistant.js','flooring-assistant-loader.js','flooring-assistant-handoff.js','flooring-assistant.css'])assert.equal(hash(fs.readFileSync(path.join(root,'assets',name))),hash(fs.readFileSync(path.join(publish,'assets',name))));
const previewConfig='window.OZ_FLOORING_ASSISTANT = Object.freeze({ enabled: true, mode: "mock" });\n';
assert.equal(fs.readFileSync(publish+'/assets/flooring-assistant-config.js','utf8'),previewConfig,'Only the explicit local/mock preview flag output is allowed');
assert(/enabled: false/.test(fs.readFileSync(root+'/assets/flooring-assistant-config.js','utf8')),'Source default must remain off');
assert(fs.readFileSync(publish+'/_headers','utf8').includes('noindex'));
assert(!/ga4MeasurementId:\s*["']G-/.test(fs.readFileSync(publish+'/assets/contact-config.js','utf8')));
const corpus=JSON.parse(fs.readFileSync(root+'/assistant/generated/corpus.json'));assert.equal(hash(corpus.documents),corpus.corpusVersion);
const currentSourceManifest=root+'/assistant/generated/source-manifest.json';
const source=JSON.parse(fs.readFileSync(fs.existsSync(currentSourceManifest)?currentSourceManifest:root+'/docs/flooring-assistant/SOURCE_MANIFEST.json'));
assert.equal(source.candidateHash,corpus.candidateHash,'Corpus/source candidate binding mismatch');
for(const [file,expected]of Object.entries(source.files))assert.equal(hash(fs.readFileSync(root+'/'+file)),expected,'Stale bundled knowledge input '+file);
// Official Netlify bundler, supplied by a locally available CLI or approved tool install.
const bundler=process.env.OZ_ASSISTANT_BUNDLER;if(!bundler)throw Error('Set OZ_ASSISTANT_BUNDLER to the installed @netlify/zip-it-and-ship-it/dist/main.js');
const {zipFunctions}=await import(pathToFileURL(bundler));const bundled=fs.mkdtempSync(path.join(os.tmpdir(),'oz-assistant-functions-'));
const results=await zipFunctions(root+'/netlify/functions',bundled,{basePath:root,config:{'flooring-assistant':{nodeBundler:'esbuild',nodeVersion:'24.x'}},manifest:bundled+'/manifest.json'});
assert.deepEqual(results.map(r=>r.name).sort(),['flooring-assistant','resend-enquiry-notification']);
const fn=results.find(r=>r.name==='flooring-assistant');assert(fn,'Assistant function not bundled');
const extraction=fs.mkdtempSync(path.join(os.tmpdir(),'oz-assistant-function-load-'));execFileSync('unzip',['-q',fn.path,'-d',extraction]);
const zipFiles=walk(extraction).map(f=>path.relative(extraction,f));
// With server dependencies the bundler retains netlify/functions/ inside ZIPs.
// Never select an arbitrary .mjs (which may be the Lambda bootstrap or SDK).
const entries=zipFiles.filter(f=>f==='flooring-assistant.mjs'||f==='netlify/functions/flooring-assistant.mjs');
assert.equal(entries.length,1,'Exactly one known assistant ESM entry required');
const js=entries[0];
const loaded=await import(pathToFileURL(path.join(extraction,js)));assert.equal(typeof loaded.default,'function');
const result=await loaded.default(new Request('https://test--oztimberfloor.netlify.app/api/flooring-assistant',{method:'POST',headers:{Origin:'https://test--oztimberfloor.netlify.app','Content-Type':'application/json'},body:'{}'}),{ip:'127.0.0.1'});assert.equal(result.status,403); // no approved origin/settings
const smokeCode=`import fn from ${JSON.stringify(pathToFileURL(path.join(extraction,js)).href)};const origin='http://127.0.0.1:8840';const request=body=>new Request(origin+'/api/flooring-assistant',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:JSON.stringify(body)});const session=await(await fn(request({op:'session',requestId:'bundle-session-test'}),{ip:'127.0.0.1'})).json();const response=await fn(request({op:'message',requestId:'bundle-answer-test',sessionToken:session.sessionToken,message:'Avala Blackbutt details',pagePath:'/',history:[]}),{ip:'127.0.0.1'});const result=await response.json();if(response.status!==200||!JSON.stringify(result).includes('183 or 230'))process.exit(1);console.log('clean bundled mock answer PASS');`;
execFileSync(process.execPath,['--input-type=module','-e',smokeCode],{cwd:extraction,encoding:'utf8',env:{...process.env,CONTEXT:'local',OZ_ASSISTANT_ENABLED:'true',OZ_ASSISTANT_MODE:'mock',OZ_ASSISTANT_ORIGIN:'http://127.0.0.1:8840',OZ_ASSISTANT_SIGNING_SECRET:'isolated-bundle-test-secret-not-a-live-key-12345'}});
const staticFiles=walk(publish).map(file=>({path:path.relative(publish,file),sha256:hash(fs.readFileSync(file)),bytes:fs.statSync(file).size})).sort((a,b)=>a.path.localeCompare(b.path));
const functions=results.map(r=>({name:r.name,path:r.path,sha256:hash(fs.readFileSync(r.path)),runtime:r.runtime,runtimeAPIVersion:r.runtimeAPIVersion,routes:r.routes,trafficRules:r.trafficRules}));
const sourceCorpus=fs.readFileSync(root+'/assistant/generated/corpus.json','utf8');assert(!/supplierSourceUrl|supplierId|sourceTag|\/Users\/|wholesale|supabase|operon|sk-[A-Za-z0-9]{16}/i.test(sourceCorpus));
// Scan every assistant public asset and function archive contents, including JSON/maps.
for(const file of [...walk(extraction),...walk(publish).filter(f=>/flooring-assistant/.test(f))]){const value=fs.readFileSync(file,'utf8');assert(!/sk-[A-Za-z0-9]{20}|RESEND_API_KEY\s*=|\/Users\/daibang|PRIVATE_PROVENANCE|sourceTag|supplierSourceUrl/i.test(value),'Unsafe artifact '+file);}
const manifest={schemaVersion:1,mode:'protected-preview-ready-not-deployed',sourceUiDefault:false,previewOnlyUiFlag:true,productionUiHostGuard:true,staticFileCount:staticFiles.length,staticManifestHash:hash(staticFiles),staticFiles,functions,bundleDirectory:bundled,cleanLoadDirectory:extraction,cleanFunctionLoad:true,cleanBundledMockAnswer:true,corpusVersion:corpus.corpusVersion,candidateSourceHash:corpus.candidateHash,corpusSha256:hash(sourceCorpus),paidModeEnabled:false,hostedVerification:'NOT_RUN'};
fs.writeFileSync(out+'/PACKAGE.json',JSON.stringify(manifest,null,2));console.log(JSON.stringify({...manifest,staticFiles:undefined},null,2));
