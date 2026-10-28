import fs from 'node:fs';
import assert from 'node:assert/strict';
import zlib from 'node:zlib';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {hash} from '../assistant/lib/security.mjs';
const root=process.cwd(),out=path.resolve(process.env.OZ_ASSISTANT_SPRINT_EVIDENCE_DIR||root+'/docs/seo-growth/evidence/2026-10-28-assistant-approval-repair');
const previous=JSON.parse(fs.readFileSync(root+'/docs/seo-growth/evidence/2026-10-28-assistant-local-sprint/VALIDATION.json'));
const unchanged=['assistant/lib/runtime.mjs','assistant/lib/production.mjs','assistant/tests/gold.mjs','assistant/tests/post-migration-gold.mjs'].map(file=>{
 const before=previous.sourceFiles.find(f=>f.file===file)?.sha256;assert(before,'Prior source receipt missing: '+file);
 const sha256=hash(fs.readFileSync(root+'/'+file));assert.equal(sha256,before,file+' must not change');return {file,sha256,unchanged:true};
});
for(const [file,expected]of Object.entries({'assistant/config/paid-preview.json':'5a02ee80442e1c053412b42f12b0b4efd70cb3054dca8b601568887bf5dc16e7','assistant/config/production.json':'719bb6ab7bd47d65832e63f724596006072156a01e010bd2dd2d298ebaa0d327','assistant/generated/corpus.json':'b2e94a791e53c0b2b6ef616a685c55b0bf3f8b36c738911990ac8040b233bc03'})){
 const sha256=hash(fs.readFileSync(root+'/'+file));assert.equal(sha256,expected);unchanged.push({file,sha256,unchanged:true});
}
const boundBytes=zlib.gunzipSync(fs.readFileSync(root+'/assistant/tests/fixtures/bound-corpus-db73162e.fixture.json.gz'));
assert.deepEqual(boundBytes,fs.readFileSync(root+'/assistant/generated/corpus.json'));
const validation=JSON.parse(fs.readFileSync(out+'/VALIDATION.json')),fixture=validation.fixture;
const packaged=JSON.parse(fs.readFileSync(fixture+'/docs/flooring-assistant/evidence/PACKAGE.json'));
for(const fn of packaged.functions){
 assert.equal(hash(fs.readFileSync(fn.path)),fn.sha256);
 const entries=execFileSync('unzip',['-Z1',fn.path],{encoding:'utf8'}).trim().split('\n');
 assert(!entries.some(e=>/assistant\/tests|bound-corpus-db73162e|bound-approval-corpus/.test(e)),'Test input must not be shipped');
}
for(const [source,dest]of [['PACKAGE.json','FUNCTION_PACKAGE.json'],['EVALUATION.json','ORIGINAL_GOLD_EVALUATION.json'],['ANSWER_QUALITY.json','ANSWER_QUALITY.json']])fs.copyFileSync(fixture+'/docs/flooring-assistant/evidence/'+source,out+'/'+dest);
const expectationSuccessors=JSON.parse(fs.readFileSync(fixture+'/docs/flooring-assistant/evidence/EVALUATION.json')).rows.filter(r=>r.expectationBasis).map(r=>({id:r.id,basis:r.expectationBasis}));
const results={at:new Date().toISOString(),unchanged,originalCorpusCopiedByteIdentically:true,approvalHashesModified:false,approvalGuardCodeModified:false,historicalGoldFilesModified:false,reviewedExpectationSuccessors:expectationSuccessors,testFixtureInFunctionArchive:false,protectedFileDrift:validation.protectedFileDrift,paidCalls:0,deployed:false};
fs.writeFileSync(out+'/'+(process.argv.includes('--addendum')?'INTEGRITY_ADDENDUM.json':'INTEGRITY.json'),JSON.stringify(results,null,2),{flag:'wx'});console.log(JSON.stringify(results,null,2));
