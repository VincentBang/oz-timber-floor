// Local-only assembly. This does not change build gates or grant release authority.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {addFloorPlan,checkFloorPlan} from './floor-plan-package.mjs';

export const digest = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
export function inventory(root, prefix='') {
  const files={};
  for (const entry of fs.readdirSync(root,{withFileTypes:true})) {
    assert(!entry.isSymbolicLink(),'Package must not contain symlinks');
    const name=prefix+entry.name;
    if(entry.isDirectory())Object.assign(files,inventory(path.join(root,entry.name),name+'/'));
    else files[name]=digest(fs.readFileSync(path.join(root,entry.name)));
  }
  return files;
}
export function validateBaseline({manifest,receipt,source,functions}) {
  assert.equal(receipt.status,'RELEASED_AND_LIVE_SMOKE_VERIFIED');
  assert.equal(manifest.status,'EXACT_PRODUCTION_PACKAGE_PASS');
  assert.equal(receipt.allProviderFileDigestsMatch,true);
  assert.equal(manifest.corpusVersion,receipt.corpusVersion);
  assert.equal(manifest.profileHash,receipt.profileSha256);
  assert.equal(receipt.limits.monthlyUsd,30);
  assert.equal(receipt.limits.ledgerReset,false);
  const actual=inventory(source),expected=Object.fromEntries(manifest.files.map(f=>[f.file,f.sha256]));
  assert.deepEqual(actual,expected,'Published baseline file mismatch');
  assert.equal(Object.keys(actual).length,receipt.publicFiles);
  assert.equal(manifest.sitemap,receipt.sitemapUrls);
  assert.equal(manifest.functions.length,2);
  for(const f of manifest.functions){
    const released=receipt.functions.find(r=>r.name===f.name);
    assert(released,'Unreleased function');
    assert.equal(f.sha256,released.sha256);
    assert.equal(f.runtimeVersion,released.runtime);
    assert.equal(digest(fs.readFileSync(path.join(functions,f.name+'.zip'))),f.sha256,'Function archive mismatch');
  }
  checkFloorPlan(source,false);
  assert(!/X-Robots-Tag:\s*noindex/.test(fs.readFileSync(source+'/_headers','utf8')));
  assert(/ga4MeasurementId:\s*"G-EWSMKKM9N8"/.test(fs.readFileSync(source+'/assets/contact-config.js','utf8')));
  return actual;
}
export function assembleProductionCandidate({root,source,output,functions,manifest,receipt}) {
  root=path.resolve(root);source=path.resolve(source);output=path.resolve(output);
  for(const protectedRoot of [root,source,path.resolve(functions)]) {
    assert(output!==protectedRoot&&!output.startsWith(protectedRoot+'/')&&!protectedRoot.startsWith(output+'/'),'Output must be isolated');
  }
  assert(!fs.existsSync(output),'Never overwrite a package');
  const before=validateBaseline({manifest,receipt,source,functions});
  fs.mkdirSync(output,{recursive:true});
  fs.cpSync(source,output+'/public',{recursive:true});
  addFloorPlan(root,output+'/public');
  checkFloorPlan(output+'/public',true);
  const files=inventory(output+'/public');
  const delta=Object.keys(files).filter(f=>files[f]!==before[f]);
  assert(delta.every(f=>f.startsWith('floor-plan/')||['contact/index.html','contact.html','guides/index.html','guides.html'].includes(f)));
  assert(Object.keys(before).every(f=>files[f]),'No published files may be removed');
  const page=fs.readFileSync(output+'/public/floor-plan/index.html','utf8');
  assert(/name="robots" content="noindex, nofollow"/.test(page));
  assert(page.includes('https://oztimberfloor.com.au/floor-plan/'));
  for(const f of ['contact/index.html','contact.html']) {
    const h=fs.readFileSync(output+'/public/'+f,'utf8');
    assert(!h.includes('preview-safety.js')&&!h.includes('enquiry submission is disabled'));
    assert(h.includes('name="oz-flooring-enquiry"')&&h.includes('action="/thank-you/"'));
  }
  assert(!fs.existsSync(output+'/public/floor-plan/preview-safety.js'));
  for(const f of Object.keys(files))assert(!/^(scripts|docs|assistant|data|netlify|node_modules|\.git|\.env|samples|fixtures)(\/|$)/.test(f),'Nonpublic file');
  fs.mkdirSync(output+'/functions');
  for(const f of manifest.functions)fs.copyFileSync(functions+'/'+f.name+'.zip',output+'/functions/'+f.name+'.zip');
  const result={status:'LOCAL_PRODUCTION_CANDIDATE_NOT_AUTHORISED_FOR_DEPLOY',baseDeployId:receipt.deployId,
    activationApproved:false,scope:'Floorplan only on exact published baseline; newer supplier/audience source remains local',
    publicFiles:Object.keys(files).length,sitemapUrls:manifest.sitemap,files,delta,
    functions:manifest.functions.map(({name,sha256,runtimeVersion})=>({name,sha256,runtimeVersion})),
    corpusVersion:receipt.corpusVersion,profileSha256:receipt.profileSha256,limits:receipt.limits,
    rollbackDeployId:receipt.deployId,providerChanges:[],submissionsTested:false,paidCalls:0};
  fs.writeFileSync(output+'/MANIFEST.json',JSON.stringify(result,null,2));
  return result;
}
