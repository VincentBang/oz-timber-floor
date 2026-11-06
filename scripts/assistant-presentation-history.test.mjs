import fs from 'node:fs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {checkSourceHistory,SUCCESSOR_SHA256} from './assistant-source-history.mjs';
import {hash} from '../assistant/lib/security.mjs';
import {authoringReadForHistory} from './audit-source-history.mjs';
const entryBytes=fs.readFileSync('docs/flooring-assistant/ENTRY_STATE.json'),successorBytes=fs.readFileSync('config/assistant-source-successor-20261104.json'),read=authoringReadForHistory(f=>fs.readFileSync(f));
test('reviewed presentation is additive and does not replace either old approval',()=>{
 assert.equal(SUCCESSOR_SHA256,'a2a3757b57b63def5256468a5a602667ae45f9a2e74f50de7e9ae74b30cfc6c3');
 assert.equal(hash(successorBytes),SUCCESSOR_SHA256);
 assert.equal(hash(entryBytes),'c9de93fc4247d5de74676203310625c50a989e58bf37a8a3f9c1031507a7a00d');
 assert.equal(checkSourceHistory({entryBytes,successorBytes,read}).successors,2215);
});
test('review does not accept altered page, catalogue, routing, forms or generator bytes',()=>{
 for(const target of ['404.html','contact/index.html','data/product-catalogue.json','_redirects','_headers','assets/contact-config.js','scripts/build-public-package.mjs','scripts/artisan-oak-retirement.mjs'])assert.throws(()=>checkSourceHistory({entryBytes,successorBytes,read:f=>f===target?Buffer.concat([read(f),Buffer.from('tampered')]):read(f)}),/Unreviewed source drift/);
});
test('altering a presentation receipt cannot approve altered source',()=>assert.throws(()=>checkSourceHistory({entryBytes,successorBytes,read:f=>f==='config/assistant-presentation-successor-20261105.json'?Buffer.concat([read(f),Buffer.from(' ')]):read(f)}),/Unreviewed presentation receipt/));
