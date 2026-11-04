import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import {spawn,execFileSync} from 'node:child_process';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {fixtures} from './floor-plan-qa/fixtures.mjs';

const require=createRequire(import.meta.url),source=path.resolve(fileURLToPath(new URL('../',import.meta.url)));
const args=process.argv.slice(2),outIndex=args.indexOf('--out');
for(let i=0;i<args.length;i++){if(args[i]==='--preflight-only')continue;if(args[i]==='--out'&&args[i+1]&&!args[i+1].startsWith('--')){i++;continue;}throw Error('Usage: node scripts/floor-plan-qa.mjs [--out /absolute/empty-directory] [--preflight-only]');}
const out=outIndex<0?fs.mkdtempSync(path.join(os.tmpdir(),'oz-floorplan-qa-')):path.resolve(args[outIndex+1]);
if(out===source||out.startsWith(source+path.sep)||source.startsWith(out+path.sep))throw Error('QA evidence must be outside the source tree and its parents');
fs.mkdirSync(out,{recursive:true});if(fs.readdirSync(out).length)throw Error('Evidence directory must be empty; previous evidence is never overwritten');
const result={status:'RUNNING',source,out,startedAt:new Date().toISOString(),commands:[],dependencies:{},browserVersions:{},limitations:['No physical devices or spoken screen-reader verification.','Original intermittent JPEG pixel failure remains unattributed unless separately evidenced.'],network:'Build/unit stages use a no-network preload. Browsers serve loopback static files only and intercept external/non-GET requests.'};
const save=()=>fs.writeFileSync(out+'/RESULT.json',JSON.stringify(result,null,2));
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
function inventory(dir,prefix=''){const rows={};for(const e of fs.readdirSync(dir,{withFileTypes:true})){if(['.git','node_modules','dist'].includes(e.name)||e.name.startsWith('.env')||e.name==='.netlify')continue;const p=prefix+e.name;if(e.isSymbolicLink())rows[p]='symlink:'+fs.readlinkSync(dir+'/'+e.name);else if(e.isDirectory())Object.assign(rows,inventory(dir+'/'+e.name,p+'/'));else rows[p]=sha(fs.readFileSync(dir+'/'+e.name));}return rows;}
function packageInventory(dir,prefix=''){const rows={};for(const e of fs.readdirSync(dir,{withFileTypes:true})){const p=prefix+e.name;if(e.isDirectory())Object.assign(rows,packageInventory(dir+'/'+e.name,p+'/'));else rows[p]=sha(fs.readFileSync(dir+'/'+e.name));}return rows;}
let before;
try{
 const resolve=(env,fallback)=>process.env[env]||require.resolve(fallback);
 const playwrightPath=resolve('OZ_PLAYWRIGHT_PATH','playwright');const playwright=require(playwrightPath);
 const sharpPath=resolve('OZ_SHARP_PATH','sharp');require(sharpPath);
 const axePath=resolve('OZ_AXE_PATH','axe-core/axe.min.js');if(!fs.existsSync(axePath))throw Error('axe-core script missing');
 const modules=process.env.OZ_QA_NODE_MODULES||path.join(source,'node_modules');
 const depRequire=createRequire(path.join(modules,'_qa_resolver.cjs'));
 depRequire.resolve('parse5');depRequire.resolve('@netlify/blobs');
 result.dependencies={playwrightPath,sharpPath,axePath,modules};
 for(const engine of ['chromium','firefox','webkit']){const b=await playwright[engine].launch({headless:true,...(engine==='chromium'&&process.env.OZ_CHROME_PATH&&{executablePath:process.env.OZ_CHROME_PATH})});result.browserVersions[engine]=b.version();await b.close();}
 save();if(args.includes('--preflight-only')){result.status='DEPENDENCIES_READY_NOT_TESTED';save();console.log(JSON.stringify(result,null,2));process.exit(0);}
 before=inventory(source);fs.writeFileSync(out+'/source-before.json',JSON.stringify(before));
 const isolated=path.join(out,'isolated-source');
 fs.cpSync(source,isolated,{recursive:true,filter:p=>{const name=path.basename(p);return!['.git','node_modules','dist','.netlify'].includes(name)&&!name.startsWith('.env');}});
 fs.symlinkSync(path.resolve(modules),isolated+'/node_modules','dir');
 // Existing build scripts enumerate tracked HTML. Copy their read-only Git
 // context instead of pointing disposable builds at the owner's live index.
 const git=(...a)=>execFileSync('git',a,{cwd:source,encoding:'utf8'}).trim();
 const gitDir=out+'/git-context';
 fs.cpSync(path.resolve(source,git('rev-parse','--git-common-dir')),gitDir,{recursive:true,filter:p=>path.basename(p)!=='worktrees'});
 fs.copyFileSync(path.resolve(source,git('rev-parse','--git-path','index')),gitDir+'/index');
 fs.writeFileSync(gitDir+'/HEAD',git('rev-parse','HEAD')+'\n');
 const env={PATH:process.env.PATH,HOME:process.env.HOME,TMPDIR:process.env.TMPDIR,
  OZ_PLAYWRIGHT_PATH:playwrightPath,OZ_SHARP_PATH:sharpPath,OZ_AXE_PATH:axePath,GIT_DIR:gitDir,GIT_OPTIONAL_LOCKS:'0',GIT_TERMINAL_PROMPT:'0',
  ...(process.env.OZ_CHROME_PATH&&{OZ_CHROME_PATH:process.env.OZ_CHROME_PATH}),
  ...(process.env.PLAYWRIGHT_BROWSERS_PATH&&{PLAYWRIGHT_BROWSERS_PATH:process.env.PLAYWRIGHT_BROWSERS_PATH})};
 const offline={NODE_OPTIONS:'--import='+isolated+'/scripts/floor-plan-qa/no-network.mjs',OZ_MIGRATION_GENERATED_DIR:out+'/migration',CONTEXT:'local',OZ_FLOORPLAN_ENABLED:'true'};
 async function run(label,command,extra={},cwd=isolated){const file=out+'/'+label+'.log',fd=fs.openSync(file,'wx'),start=Date.now();const child=spawn(command[0],command.slice(1),{cwd,env:{...env,GIT_WORK_TREE:cwd,...extra},stdio:['ignore',fd,fd]});let code;const timer=setTimeout(()=>child.kill('SIGTERM'),300000);try{code=await new Promise((r,j)=>{child.once('error',j);child.once('exit',r);});}finally{clearTimeout(timer);fs.closeSync(fd);}result.commands.push({label,command,cwd,code,ms:Date.now()-start,log:file});save();return code;}
 await run('unit',['node','--test','scripts/floor-plan-geometry.test.mjs','scripts/floor-plan-handoff.test.mjs'],offline);
 if(await run('local-build',['npm','run','build'],offline))throw Error('Local build failed; browser checks not run');
 if(await run('package-check',['npm','run','release:package:check'],offline))throw Error('Public package check failed');
 await run('audience-unit',['node','--test','scripts/audience-publication-contract.test.mjs','scripts/audience-service-pages.test.mjs','scripts/audience-discovery-contract.test.mjs','scripts/historical-scope-reconciliation.test.mjs','scripts/stonefloor-legacy-retirement.test.mjs'],offline);
 const modulePath=isolated+'/scripts/floor-plan-qa/harness.mjs';
 for(const engine of ['chromium','firefox','webkit']){
  const engineOut=out+'/'+engine;fs.mkdirSync(engineOut+'/checks',{recursive:true});fixtures(engineOut+'/samples');
  const browserEnv={OZ_BROWSER:engine,OZ_QA_ROOT:isolated,OZ_QA_OUTPUT:engineOut,OZ_LOCAL_EVIDENCE:engineOut};
  await run(engine+'-loader-keyboard',['node','--test','scripts/floor-plan-loader.test.mjs','scripts/floor-plan-accessibility.test.mjs'],browserEnv);
  // Parent-owned loopback server is used only for the legacy flow suites.
  Object.assign(process.env,{OZ_QA_ROOT:isolated,OZ_QA_OUTPUT:engineOut,OZ_PLAYWRIGHT_PATH:playwrightPath,OZ_AXE_PATH:axePath});
  const {serve}=await import(modulePath+'?engine='+engine);const server=await serve();
  try{for(const file of ['tool','contact','extended','journey','audience'])await run(engine+'-'+file,['node','scripts/floor-plan-qa/'+file+'.mjs'],{...browserEnv,OZ_LOCAL_ORIGIN:server.origin});}finally{await server.close();}
  for(const file of ['a11y','mobile','orientation','lifecycle','jpeg-recovery','startup'])await run(engine+'-'+file,['node','scripts/floor-plan-qa/'+file+'.mjs'],browserEnv);
 }
 for(const script of ['analytics:contract:check','resend:enquiry:check','catalogue:field-integrity:check','migration:check:local','cutover:oct26:check','cutover:oct26:package-check','assistant:eval'])await run(script.replaceAll(':','-'),['npm','run',script],offline);
 await run('assistant-unit',['node','--test',...fs.readdirSync(isolated+'/assistant/tests').filter(f=>f.endsWith('.test.mjs')).map(f=>'assistant/tests/'+f)],offline);
 const website=fs.readdirSync(isolated+'/scripts').filter(f=>/^(?:reliability|range-sprint|editorial-gallery|enquiry-|etf12-|project-photo-|classic-membership|iconic-count|lifestyle-count|catalogue-text|range-hub|legacy-guide|supplier-gap-refresh|oakleaf-arrival|faq-schema-contract)/.test(f)&&f.endsWith('.test.mjs'));
 await run('website-unit',['node','--test',...website.map(f=>'scripts/'+f)],offline);
 // A baseline built without the floorplan hook is the reference, not a new
 // approval hash. All copies are disposable and outside the caller checkout.
 result.packages=[];const localFiles=packageInventory(isolated+'/dist');let reference;
 for(const context of ['default','production','deploy-preview']){
  const copy=out+'/package-'+context;fs.cpSync(isolated,copy,{recursive:true});
  const buildEnv={NODE_OPTIONS:'--import='+copy+'/scripts/floor-plan-qa/no-network.mjs',OZ_MIGRATION_GENERATED_DIR:out+'/migration-'+context,OZ_PRODUCTION_INDEXING_ENABLED:'false',...(context!=='default'&&{CONTEXT:context,OZ_FLOORPLAN_ENABLED:'true'})};
  const code=await run('build-'+context,['npm','run','build'],buildEnv,copy);
  if(code){result.packages.push({context,code});continue;}
  const files=packageInventory(copy+'/dist');if(!reference)reference=files;
  const differences=[...new Set([...Object.keys(files),...Object.keys(reference)])].filter(p=>files[p]!==reference[p]);
  const forbidden=Object.keys(files).filter(p=>p.startsWith('floor-plan/')||/^(?:scripts|docs|node_modules|samples|fixtures)\//.test(p)||p.includes('axe.min.js'));
  const row={context,code,count:Object.keys(files).length,differences,forbidden};result.packages.push(row);if(differences.length||forbidden.length)result.packageFailure=true;
  fs.writeFileSync(out+'/package-'+context+'-files.json',JSON.stringify(files));
 }
 const localDelta=Object.keys(localFiles).filter(p=>reference?.[p]!==localFiles[p]);
 result.localPackage={count:Object.keys(localFiles).length,differences:localDelta};
 if(localDelta.some(p=>!p.startsWith('floor-plan/')&&!['contact/index.html','contact.html','guides/index.html','guides.html'].includes(p)))result.packageFailure=true;
 fs.writeFileSync(out+'/local-package-files.json',JSON.stringify(localFiles));
 result.status=result.commands.some(r=>r.code!==0)||result.packageFailure?'CHECKS_FAILED':'LOCAL_CHECKS_PASSED_RELEASE_HOLD';
}catch(error){result.status=before?'CHECKS_FAILED':'DEPENDENCY_OR_SETUP_BLOCKED';result.error=error.stack;process.exitCode=1;}
finally{if(before){const after=inventory(source),drift=[...new Set([...Object.keys(before),...Object.keys(after)])].filter(p=>before[p]!==after[p]);result.sourcePreservation={drift,files:Object.keys(before).length};if(drift.length){result.status='SOURCE_PRESERVATION_FAILED';process.exitCode=1;}}result.finishedAt=new Date().toISOString();save();console.log(JSON.stringify({status:result.status,out,error:result.error},null,2));if(['CHECKS_FAILED','SOURCE_PRESERVATION_FAILED','DEPENDENCY_OR_SETUP_BLOCKED'].includes(result.status))process.exitCode=1;}
