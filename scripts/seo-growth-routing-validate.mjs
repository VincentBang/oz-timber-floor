// All mutations, builds and fault injection occur in the recorded disposable copy.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
const base=path.resolve(process.argv[2]),out=process.argv[3]?path.resolve(process.argv[3]):base,record=JSON.parse(fs.readFileSync(base+'/RECONCILIATION.json')),fixture=record.fixture;
if(out!==base){assert(!fs.existsSync(out),'Preserve prior validation evidence');fs.mkdirSync(out,{recursive:true});}
const results=[];
function run(name,command,args,expected=0){
 let status=0,output='';
 try{output=execFileSync(command,args,{cwd:fixture,encoding:'utf8',stdio:'pipe',timeout:180000,maxBuffer:20000000,env:{...process.env,GIT_DIR:path.join(process.cwd(),'.git'),GIT_WORK_TREE:fixture,CONTEXT:'deploy-preview',OZ_PRODUCTION_INDEXING_ENABLED:'false',OZ_ASSISTANT_EVIDENCE_DIR:out+'/knowledge'}});}catch(e){status=e.status??1;output=String(e.stdout||'')+String(e.stderr||'');}
 fs.writeFileSync(out+'/'+name+'.log',output,{flag:'wx'});results.push({name,command:[command,...args].join(' '),status,expected,pass:status===expected});console.log(JSON.stringify(results.at(-1)));return status;
}
const hardening=()=>JSON.parse(fs.readFileSync(fixture+'/docs/release/OZ-RELEASE-CLOSEOUT/generated/migration/seo-migration-hardening-report.json'));
const tests=fs.readdirSync(fixture+'/assistant/tests').filter(f=>f.endsWith('.test.mjs')).map(f=>'assistant/tests/'+f);
run('unit-tests',process.execPath,['--test',...tests,'scripts/seo-growth-health.test.mjs','scripts/seo-growth-metrics.test.mjs','scripts/migration-rule-evidence.test.mjs']);
const negative=[];
for(const [name,file,mutate,code] of [
 ['wrong-blackbutt-owner','_redirects',s=>s.replace('/product/stone-floor-blackbutt/ /ranges/stone-floor-timber/ 301','/product/stone-floor-blackbutt/ /hybrid/ 301'),'reviewed-redirect-target-changed'],
 ['duplicate-literal-rule','_redirects',s=>s+'\n/product/stone-floor-blackbutt/ /hybrid/ 301\n','reviewed-redirect-rule-count'],
 ['wrong-bianco-family','_redirects',s=>s.replace('/product/stone-floor-bianco-white/ /ranges/stone-floor-tile/ 301','/product/stone-floor-bianco-white/ /ranges/stone-floor-timber/ 301'),'high-equity-exact-range-collapsed'],
 ['historical-archive-drift','docs/release/OZ-RELEASE-CLOSEOUT/generated/migration/gsc-equity-map-2026-09-01.csv',s=>s+'\n','gsc-equity-map-stale-target'],
]){
 const target=fixture+'/'+file,original=fs.readFileSync(target,'utf8'),changed=mutate(original);assert.notEqual(changed,original);
 try{fs.writeFileSync(target,changed);run('negative-'+name,process.execPath,['scripts/seo-migration-hardening.mjs'],1);const report=hardening();assert(report.blockers.some(b=>b.code===code),'Fault was not detected: '+name);negative.push({name,expectedBlocker:code,detected:true});}
 finally{fs.writeFileSync(target,original);}
}
run('final-strict-gate',process.execPath,['scripts/seo-migration-hardening.mjs'],1);
fs.copyFileSync(fixture+'/docs/release/OZ-RELEASE-CLOSEOUT/generated/migration/seo-migration-hardening-report.json',out+'/FINAL_STRICT.json');
const remaining=hardening().blockers;
assert.equal(remaining.length,2);assert.deepEqual(remaining.map(b=>b.source).sort(),['/product/stone-floor-stone-oak/','/product/stone-floor-white-wash/']);
run('isolated-build','npm',['run','build']);
run('analytics-contract',process.execPath,['scripts/analytics-event-contract.mjs']);
run('enquiry-contract',process.execPath,['scripts/resend-enquiry-contract.mjs']);
run('cutover-contract',process.execPath,['scripts/october-26-cutover-contract.mjs']);
run('public-package',process.execPath,['scripts/october-26-package-validation.mjs']);
const intended=new Set(['scripts/seo-migration-hardening.mjs','data/seo-migration-redirect-expectations.json']);
const unexpectedSourceChanges=record.sourceHashes.filter(r=>!intended.has(r.file)&&crypto.createHash('sha256').update(fs.readFileSync(r.file)).digest('hex')!==r.sha256).map(r=>r.file);
const validation={at:new Date().toISOString(),results,negative,remaining,unexpectedSourceChanges,strictGate:'HOLD: two unresolved semantic owners; nonzero failure retained',providerConfigurationWrites:0,deployed:false,paidCalls:0,formSubmissions:0};
fs.writeFileSync(out+'/VALIDATION.json',JSON.stringify(validation,null,2),{flag:'wx'});
assert.equal(unexpectedSourceChanges.length,0,'Unexpected active source mutation');
if(results.some(r=>!r.pass))process.exitCode=1;
