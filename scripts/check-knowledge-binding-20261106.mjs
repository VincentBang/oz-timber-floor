// Read-only verification of the newly sealed INACTIVE packet. No provider I/O.
import fs from'node:fs';import path from'node:path';import assert from'node:assert/strict';
import{hash}from'../assistant/lib/security.mjs';import{checkPending}from'./knowledge-binding-20261106.mjs';
const out=process.env.OZ_BINDING_PACKET;assert(out&&path.isAbsolute(out),'Provide the exact private binding packet');
const root=path.resolve(import.meta.dirname,'..'),read=f=>fs.readFileSync(root+'/'+f),load=f=>JSON.parse(fs.readFileSync(out+'/'+f)),seal=load('SHA256.json');
for(const[f,h]of Object.entries(seal)){assert(!path.isAbsolute(f)&&!f.split('/').includes('..'));assert.equal(hash(fs.readFileSync(out+'/'+f)),h,'Sealed artifact drift '+f);}
const binding=load('BINDING.json'),corpus=load('corpus.json'),profile=load('production-profile.PENDING.json'),authority=load('AUTHORITY.json'),parent=JSON.parse(read('assistant/releases/2026-11-04/production-profile.json'));
assert.deepEqual(authority,JSON.parse(read('assistant/releases/2026-11-06-rebuilt/LOCAL_BINDING_AUTHORITY.json')),'Current local preparation authority changed');
assert.equal(hash(read('assistant/generated/corpus.json')),binding.corpusFileSha256);assert.equal(hash(read('assistant/generated/source-manifest.json')),binding.sourceManifestSha256);
for(const[f,h]of Object.entries(binding.sourceHashes))assert.equal(hash(read(f)),h,'Exact bound source drift '+f);
const checked=checkPending({profile,parent,corpus,authority});assert.equal(checked.profileHash,binding.profileHash);
assert.equal(binding.publicActivationAuthorized,false);assert.equal(binding.budgetLedgerReset,false);assert.equal(binding.budgetStateKey,'state-v1');assert.equal(binding.activationControlKey,'control-v1');
const review=load('REVIEW.json');assert.equal(review.corpusVersion,checked.corpusVersion);assert.equal(review.hostedCandidateVerification,'NOT_RUN');
const pkg=load('PACKAGE.json');for(const f of pkg.functions)assert.equal(hash(fs.readFileSync(f.path)),f.sha256,'Function archive drift '+f.name);
assert.equal(load('FINAL_LOCAL_RESULTS.json').status,'LOCAL_BINDING_READY_FOR_REVIEW_NOT_ACTIVATION');
console.log(JSON.stringify({status:'SEALED_INACTIVE_BINDING_PASS',...checked,archiveIntegrity:true,boundSourceFiles:Object.keys(binding.sourceHashes).length,providerWrites:0,paidCalls:0,realSubmissions:0}));
