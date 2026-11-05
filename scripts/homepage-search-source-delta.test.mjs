import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import {execFileSync} from 'node:child_process';
import {hash} from '../assistant/lib/security.mjs';import {sourceForHistoricalDigest} from './homepage-search-source-delta.mjs';
test('only the exact owner-approved search band removal reconciles with immutable homepage source',()=>{
 const old=execFileSync('git',['show','67f71ea86ac0ddd63e38b1f992c474e0ffb9d679:index.html']),digest=hash(old),current=fs.readFileSync('index.html');
 assert.deepEqual(sourceForHistoricalDigest('index.html',current,digest),old);
 assert.deepEqual(sourceForHistoricalDigest('index.html',old,digest),old);
 for(const bad of [Buffer.concat([current,Buffer.from(' ')]),Buffer.from(current.toString().replace('Request Quote','Pay now')),Buffer.from(current.toString().replace('https://oztimberfloor.com.au/','https://example.invalid/')),Buffer.from(current.toString().replace('0435 496 975','0000')),Buffer.from(current.toString().replace('<h1','<h2'))])assert.notEqual(hash(sourceForHistoricalDigest('index.html',bad,digest)),digest);
 assert.deepEqual(sourceForHistoricalDigest('contact.html',current,digest),current);
 assert.deepEqual(sourceForHistoricalDigest('index.html',current,'different-parent'),current);
});
