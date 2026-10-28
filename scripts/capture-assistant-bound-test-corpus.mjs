// Capture an immutable TEST INPUT, not an approval or a deployable corpus.
import fs from 'node:fs';
import zlib from 'node:zlib';
import assert from 'node:assert/strict';
import {hash} from '../assistant/lib/security.mjs';
const bytes=fs.readFileSync('assistant/generated/corpus.json'),corpus=JSON.parse(bytes);
const expectedVersion='db73162e756d3faacef0a1ad90db2fb33e1b64c9e1fc90d71c8d88130ae8e164';
assert.equal(hash(bytes),'b2e94a791e53c0b2b6ef616a685c55b0bf3f8b36c738911990ac8040b233bc03');
assert.equal(corpus.corpusVersion,expectedVersion);assert.equal(hash(corpus.documents),expectedVersion);
for(const file of ['assistant/config/paid-preview.json','assistant/config/production.json'])assert.equal(JSON.parse(fs.readFileSync(file)).boundCorpusVersion,expectedVersion);
const output='assistant/tests/fixtures/bound-corpus-db73162e.fixture.json.gz';
fs.writeFileSync(output,zlib.gzipSync(bytes,{level:9}),{flag:'wx'});
assert.deepEqual(zlib.gunzipSync(fs.readFileSync(output)),bytes);
console.log(JSON.stringify({output,uncompressedSha256:hash(bytes),corpusVersion:expectedVersion,approvalModified:false}));
