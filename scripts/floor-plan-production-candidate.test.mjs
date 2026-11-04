import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {validateBaseline,digest} from './floor-plan-production-candidate.mjs';
import {localFloorPlanEnabled} from './floor-plan-package.mjs';
test('ordinary production and preview builds remain excluded',()=>{
  for(const CONTEXT of ['production','deploy-preview','branch-deploy'])
    assert.equal(localFloorPlanEnabled({CONTEXT,OZ_FLOORPLAN_ENABLED:'true'}),false);
});
test('baseline validation fails for altered files, budget, corpus and archives',()=>{
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'oz-floorplan-binding-test-'));
  for(const d of ['contact','guides','assets','functions'])fs.mkdirSync(dir+'/'+d);
  const contents={'index.html':'<main><h1>Home</h1></main>','_headers':'/*\n  X-Content-Type-Options: nosniff\n','assets/contact-config.js':'ga4MeasurementId: "G-EWSMKKM9N8"','contact.html':'contact','contact/index.html':'contact','guides.html':'guides','guides/index.html':'guides'};
  for(const [p,s]of Object.entries(contents))fs.writeFileSync(dir+'/'+p,s);
  const fnRoot=fs.mkdtempSync(path.join(os.tmpdir(),'oz-floorplan-archives-test-'));
  const functions=['flooring-assistant','resend-enquiry-notification'].map(name=>{fs.writeFileSync(fnRoot+'/'+name+'.zip',name);return{name,sha256:digest(name),runtimeVersion:'nodejs22.x'};});
  const manifest={status:'EXACT_PRODUCTION_PACKAGE_PASS',corpusVersion:'corpus',profileHash:'profile',sitemap:773,files:Object.entries(contents).map(([file,s])=>({file,sha256:digest(s)})),functions};
  const receipt={status:'RELEASED_AND_LIVE_SMOKE_VERIFIED',allProviderFileDigestsMatch:true,corpusVersion:'corpus',profileSha256:'profile',publicFiles:7,sitemapUrls:773,limits:{monthlyUsd:30,ledgerReset:false},functions:functions.map(f=>({...f,runtime:f.runtimeVersion}))};
  const args={manifest,receipt,source:dir,functions:fnRoot};
  assert.doesNotThrow(()=>validateBaseline(args));
  for(const update of [{limits:{monthlyUsd:31,ledgerReset:false}},{corpusVersion:'changed'},{allProviderFileDigestsMatch:false}])assert.throws(()=>validateBaseline({...args,receipt:{...receipt,...update}}));
  fs.writeFileSync(dir+'/contact.html','changed');assert.throws(()=>validateBaseline(args),/baseline file mismatch/);
  fs.writeFileSync(dir+'/contact.html','contact');fs.writeFileSync(fnRoot+'/flooring-assistant.zip','changed');assert.throws(()=>validateBaseline(args),/archive mismatch/);
});
