import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {execFileSync, spawnSync} from 'node:child_process';
const site=fs.readFileSync('assets/site.js','utf8');
const source=site.slice(site.indexOf('  function initAnalytics()'),site.indexOf('  function trackEvent('));
for(const origin of ['https://oztimberfloor.com.au','https://www.oztimberfloor.com.au','https://oztimberfloor.netlify.app','https://draft--oztimberfloor.netlify.app','http://localhost']) {
  const events=[],scripts=[];
  const window={location:{origin,pathname:'/contact/',search:'?email=private@example.com',hash:'#private-name'},gtag:(...args)=>events.push(args)};
  const document={referrer:'https://example.com/private-name?email=private@example.com',querySelector:()=>null,createElement:()=>({setAttribute(){}}),head:{appendChild:node=>scripts.push(node)}};
  vm.runInNewContext(source+'\ninitAnalytics();initAnalytics();',{window,document,analytics:{ga4MeasurementId:'G-EWSMKKM9N8'},URL,Date});
  const prod=['https://oztimberfloor.com.au','https://www.oztimberfloor.com.au'].includes(origin);
  assert.equal(scripts.length,prod?1:0);assert.equal(events.filter(e=>e[0]==='config').length,prod?1:0);
  assert.doesNotMatch(JSON.stringify(events),/private|email=/);
  if(prod){const config=events.find(e=>e[0]==='config');assert.equal(config[1],'G-EWSMKKM9N8');assert.equal(config[2].page_location,origin+'/contact/');}
}
const fixture=fs.mkdtempSync(path.join(os.tmpdir(),'oz-analytics-build-'));
for(const dir of ['scripts','assets','config/netlify-headers'])fs.mkdirSync(path.join(fixture,dir),{recursive:true});
for(const file of ['scripts/prepare-netlify-deploy.mjs','assets/contact-config.js','config/netlify-headers/production','config/netlify-headers/non-production'])fs.copyFileSync(file,path.join(fixture,file));
const results=[];
for(const [context,flag] of [['dev','false'],['deploy-preview','true'],['branch-deploy','true'],['production','false'],['production','true']]) {
  const env={...process.env,CONTEXT:context,OZ_PRODUCTION_INDEXING_ENABLED:flag};delete env.OZ_GA4_MEASUREMENT_ID;
  execFileSync(process.execPath,[path.join(fixture,'scripts/prepare-netlify-deploy.mjs')],{env});
  const indexable=context==='production'&&flag==='true';
  const headers=fs.readFileSync(path.join(fixture,'_headers'),'utf8'),config=fs.readFileSync(path.join(fixture,'assets/contact-config.js'),'utf8');
  assert.equal(/X-Robots-Tag: noindex/.test(headers),!indexable);
  assert.equal(/ga4MeasurementId: "G-EWSMKKM9N8"/.test(config),indexable);
  results.push({context,flag,indexable,analyticsConfigured:indexable});
}
const wrongProperty=spawnSync(process.execPath,[path.join(fixture,'scripts/prepare-netlify-deploy.mjs')],{env:{...process.env,CONTEXT:'production',OZ_PRODUCTION_INDEXING_ENABLED:'true',OZ_GA4_MEASUREMENT_ID:'G-WRONGPROPERTY'},encoding:'utf8'});
assert.notEqual(wrongProperty.status,0,'A different property must not silently replace the approved Oz ID');
console.log(JSON.stringify({success:true,loader:'once-only,production-host-only,query-and-fragment-redacted,origin-only-referrer',wrongPropertyRejected:true,buildModes:results,fixture},null,2));
