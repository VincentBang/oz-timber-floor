// Historical evidence view ONLY. Never import this into runtime, the knowledge
// builder, source-manifest freshness validation or production approval logic.
// Reapply the frozen, owner-authorised audit recipe to an immutable Git parent;
// return that parent only if the ENTIRE supplied file matches the replay.
import fs from 'node:fs';import zlib from 'node:zlib';import assert from 'node:assert/strict';import {execFileSync} from 'node:child_process';
import {hash} from '../assistant/lib/security.mjs';
import {historicalAuditHTML} from './fixtures/audit-history-render-20261106.mjs';
import {sourceForHistoricalDigest} from './homepage-search-source-delta.mjs';
export const AUDIT_HISTORY_PARENT='add9bb0c6c710cd8c0ed1e8fe1b50223836dc836';
// Integrity of a test-only literal edit recipe, NOT a knowledge/launch approval.
export const AUDIT_HISTORY_RECIPE_DIGEST='6af3414cf2d4006589693497c3199cbda1e970a7991127e35b61e0a2df61abd5';
let recipe,catalogue;const originals=new Map(),expectedFiles=new Map();
const original=file=>{if(!originals.has(file))originals.set(file,execFileSync('git',['show',AUDIT_HISTORY_PARENT+':'+file],{cwd:import.meta.dirname,maxBuffer:8e6}));return originals.get(file);};
export function validateAuditHistoryRecipe(bytes){
 assert.equal(hash(bytes),AUDIT_HISTORY_RECIPE_DIGEST,'Unreviewed historical audit recipe');
 const r=JSON.parse(zlib.gunzipSync(bytes,{maxOutputLength:16e6}));
 assert.equal(r.scope,'HISTORICAL_AUDIT_REPLAY_ONLY_NOT_KNOWLEDGE_OR_ACTIVATION');
 assert.equal(r.parent,AUDIT_HISTORY_PARENT);assert.equal(r.activationAuthority,false);
 for(const file of Object.keys(r.literalEdits))assert(!file.includes('..')&&(/\.(?:html|css|js|mjs)$/.test(file)||file==='assets/site-search-index.json'),'Out-of-scope historical recipe path');
 assert.equal(hash(fs.readFileSync(new URL('./fixtures/audit-history-render-20261106.mjs',import.meta.url))),r.rendererSha256,'Historical renderer changed');
 return r;
}
function load(){recipe??=validateAuditHistoryRecipe(fs.readFileSync(new URL('./fixtures/audit-history-delta-20261106.json.gz',import.meta.url)));catalogue??=JSON.parse(original('data/product-catalogue.json'));return recipe;}
function replay(file,before,r){
 if(expectedFiles.has(file))return expectedFiles.get(file);
 let outputs=[];
 if(r.literalEdits[file])for(const edits of r.literalEdits[file]){let text=before.toString();for(const e of edits){assert.equal(text.slice(e.at,e.at+e.before.length),e.before,'Historical edit context changed '+file);text=text.slice(0,e.at)+e.after+text.slice(e.at+e.before.length);}outputs.push(Buffer.from(text));}
 else if(file.endsWith('.html')){let text=before.toString();for(let i=0;i<3;i++)text=historicalAuditHTML(text,catalogue);outputs=[Buffer.from(text)];}
 expectedFiles.set(file,outputs);return outputs;
}
export function sourceBeforeAudit(file,bytes){
 if(!file.endsWith('.html')&&!/\.(?:js|mjs|css)$/.test(file)&&file!=='assets/site-search-index.json')return bytes;
 const r=load();if(!file.endsWith('.html')&&!r.literalEdits[file])return bytes;
 let before;try{before=original(file);}catch{return bytes;}
 // A historic comparison cannot hide changed catalogue inputs either.
 if(hash(fs.readFileSync(new URL('../data/product-catalogue.json',import.meta.url)))!==r.catalogueSha256)return bytes;
 return replay(file,before,r).some(expected=>expected.equals(Buffer.from(bytes)))?before:bytes;
}
export function historicalSourceForDigest(file,bytes,expected){
 if(hash(bytes)===expected)return bytes;
 const earlier=sourceBeforeAudit(file,bytes),result=sourceForHistoricalDigest(file,earlier,expected);
 return hash(result)===expected?result:bytes;
}
export function auditedAudienceBlock(file,open,close){
 const r=load(),before=original(file);
 return replay(file,before,r).flatMap(bytes=>{const text=bytes.toString(),start=text.indexOf(open),end=text.indexOf(close,start);return start<0||end<start?[]:[text.slice(start,end+close.length)];});
}
// The dated authoring receipt counts production-source headers/config as
// successors. A local build intentionally replaces those TWO files with its
// original noindex/analytics-off mode. Keep that test context explicit; refuse
// every third/modified variant and never use this in current source freshness.
export function authoringReadForHistory(read){
 const entry=JSON.parse(read('docs/flooring-assistant/ENTRY_STATE.json'));
 assert.equal(hash(read('docs/flooring-assistant/ENTRY_STATE.json')),'c9de93fc4247d5de74676203310625c50a989e58bf37a8a3f9c1031507a7a00d');
 return file=>{const bytes=read(file);if(!['_headers','assets/contact-config.js'].includes(file))return bytes;const parent=original(file);return hash(bytes)===entry.hashes[file]||Buffer.from(bytes).equals(parent)?parent:bytes;};
}
