// Immutable historical input for approval-path unit tests only. Never imported
// by application/runtime code and never authority for newly rebuilt knowledge.
import fs from 'node:fs';
import zlib from 'node:zlib';
import assert from 'node:assert/strict';
import {hash} from '../../lib/security.mjs';
const bytes=zlib.gunzipSync(fs.readFileSync(new URL('./bound-corpus-db73162e.fixture.json.gz',import.meta.url)));
assert.equal(hash(bytes),'b2e94a791e53c0b2b6ef616a685c55b0bf3f8b36c738911990ac8040b233bc03','Bound test corpus byte drift');
const corpus=JSON.parse(bytes);
assert.equal(corpus.corpusVersion,'db73162e756d3faacef0a1ad90db2fb33e1b64c9e1fc90d71c8d88130ae8e164');
assert.equal(hash(corpus.documents),corpus.corpusVersion,'Bound test corpus document drift');
const freeze=value=>{if(value&&typeof value==='object'&&!Object.isFrozen(value)){for(const child of Object.values(value))freeze(child);Object.freeze(value);}return value;};
freeze(corpus);
export default corpus;
