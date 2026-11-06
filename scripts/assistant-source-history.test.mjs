import fs from 'node:fs';import test from 'node:test';import assert from 'node:assert/strict';import {checkSourceHistory} from './assistant-source-history.mjs';
import {authoringReadForHistory} from './audit-source-history.mjs';
const entryBytes=fs.readFileSync('docs/flooring-assistant/ENTRY_STATE.json'),successorBytes=fs.readFileSync('config/assistant-source-successor-20261104.json'),read=authoringReadForHistory(f=>fs.readFileSync(f));
test('exact published successor history passes while retaining original entry bytes',()=>{const r=checkSourceHistory({entryBytes,successorBytes,read});assert.equal(r.successors,2215);assert(r.originals>0);});
test('unrelated page drift is rejected',()=>assert.throws(()=>checkSourceHistory({entryBytes,successorBytes,read:f=>f==='404.html'?Buffer.concat([read(f),Buffer.from('changed')]):read(f)}),/Unreviewed source drift/));
test('neither historical baseline nor successor receipt may be rewritten to bless drift',()=>{for(const key of ['entryBytes','successorBytes'])assert.throws(()=>checkSourceHistory({entryBytes,successorBytes,read,[key]:Buffer.concat([key==='entryBytes'?entryBytes:successorBytes,Buffer.from(' ')])}));});
