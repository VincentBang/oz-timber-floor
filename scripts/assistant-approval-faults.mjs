// Destructive fault injection is restricted to the recorded disposable fixture.
// Every modified byte is restored in finally. No network/provider access.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import zlib from 'node:zlib';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {hash} from '../assistant/lib/security.mjs';
const out=path.resolve(process.env.OZ_ASSISTANT_SPRINT_EVIDENCE_DIR||process.cwd()+'/docs/seo-growth/evidence/2026-10-28-assistant-approval-repair');
const fixture=JSON.parse(fs.readFileSync(out+'/BASELINE.json')).fixture;
assert(fixture.startsWith('/var/folders/')&&fs.existsSync(fixture+'/assistant/tests/fixtures/bound-approval-corpus.mjs'));
const results=[],env={...process.env};for(const key of Object.keys(env))if(/API_KEY|ACCESS_TOKEN|AUTH_TOKEN/.test(key))delete env[key];
for(const [name,file,change,testFile,expected]of [
 ['preview-binding-removed','assistant/lib/runtime.mjs',bytes=>Buffer.from(bytes.toString().replace('profile.boundCorpusVersion!==corpus.corpusVersion||','')),'assistant/tests/luna.test.mjs','new knowledge never inherits the historical preview approval'],
 ['production-binding-removed','assistant/lib/production.mjs',bytes=>Buffer.from(bytes.toString().replace('profile.boundCorpusVersion!==corpus.corpusVersion||','')),'assistant/tests/production.test.mjs','rebuilt knowledge cannot inherit production approval'],
 ['bound-fixture-tampered','assistant/tests/fixtures/bound-corpus-db73162e.fixture.json.gz',bytes=>{const c=JSON.parse(zlib.gunzipSync(bytes));c.documents[0].title+=' tampered';return zlib.gzipSync(JSON.stringify(c));},'assistant/tests/luna.test.mjs','Bound test corpus byte drift'],
 ['fabrication-guard-removed','assistant/lib/answers.mjs',bytes=>Buffer.from(bytes.toString().split('\n').filter(line=>!line.includes("reason:'project_verification_required'")).join('\n')),'assistant/tests/post-migration-safety.test.mjs','fabricated project verification is explicitly refused']
 ,['hidden-text-guard-removed','assistant/lib/knowledge-quality.mjs',bytes=>Buffer.from(bytes.toString().replace("if(excludedNode(node))return '';","if(false)return '';")),'assistant/tests/knowledge-review.test.mjs','nested hidden and executable content never becomes paragraph evidence']
 ,['project-image-hash-guard-removed','assistant/lib/project-knowledge.mjs',bytes=>Buffer.from(bytes.toString().replace('||hash(readAsset(v.url))!==v.sha256','')),'assistant/tests/knowledge-review.test.mjs','unreviewed project records, altered images and missing rendered photos fail closed']
]){
 const target=fixture+'/'+file,before=fs.readFileSync(target),changed=change(before);assert.notEqual(hash(changed),hash(before),name+' must alter the fixture');
 let status=0,output='';
 try{
  fs.writeFileSync(target,changed);
  try{output=execFileSync(process.execPath,['--test',testFile],{cwd:fixture,env,encoding:'utf8',stdio:'pipe',timeout:30000,maxBuffer:2000000});}catch(e){status=e.status??1;output=String(e.stdout||'')+String(e.stderr||'');}
  fs.writeFileSync(out+'/negative-'+name+'.log',output,{flag:'wx'});
  assert.notEqual(status,0,name+' must fail');assert(output.includes(name==='bound-fixture-tampered'?expected:'✖ '+expected),'Expected assertion did not fail: '+name);
 }finally{fs.writeFileSync(target,before);assert.equal(hash(fs.readFileSync(target)),hash(before));}
 results.push({name,expectedFailureDetected:status!==0,restored:true});
}
fs.writeFileSync(out+'/FAULT_INJECTION.json',JSON.stringify({at:new Date().toISOString(),results,activeRepositoryModified:false,paidCalls:0},null,2),{flag:'wx'});console.log(JSON.stringify(results,null,2));
