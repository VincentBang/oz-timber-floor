import assert from 'node:assert/strict';import {hash} from '../assistant/lib/security.mjs';
import {reviewedPresentation} from './assistant-presentation-history.mjs';
import {historicalSourceForDigest as sourceForHistoricalDigest,sourceBeforeAudit} from './audit-source-history.mjs';
export const SUCCESSOR_SHA256='a2a3757b57b63def5256468a5a602667ae45f9a2e74f50de7e9ae74b30cfc6c3';
export function checkSourceHistory({entryBytes,successorBytes,read}){
 assert.equal(hash(successorBytes),SUCCESSOR_SHA256,'Unreviewed historical successor receipt');
 const entry=JSON.parse(entryBytes),receipt=JSON.parse(successorBytes);assert.equal(hash(entryBytes),receipt.entrySha256,'Historical entry evidence must remain unchanged');
 assert.equal(receipt.sourceCommit,'0aed252b228bda07185762f40b4251071ea5a4b9');
 const presentation=reviewedPresentation({entryBytes,successorBytes,read});
 let originals=0,successors=0;
 for(const [file,before]of Object.entries(entry.hashes)){
  if(['OZ_STATUS.md','.gitignore'].includes(file))continue;
  let bytes=sourceBeforeAudit(file,read(file));if(file==='assets/site.js')bytes=Buffer.from(bytes.toString().replace(/  \/\/ Flooring assistant bridge: begin[\s\S]*?  \/\/ Flooring assistant bridge: end\n\n/,''));
  const expected=presentation[file]?.sha256||receipt.files[file]?.successorSha256||before;
  const current=hash(sourceForHistoricalDigest(file,bytes,expected));if(current===before){originals++;continue;}
  const successor=receipt.files[file];assert(successor,'Unreconciled protected source '+file);assert.equal(successor.historicalSha256,before,file+' historical identity');assert.equal(current,presentation[file]?.sha256||successor.successorSha256,'Unreviewed source drift '+file);successors++;
 }
 for(const [file,row]of Object.entries(receipt.files))assert.equal(entry.hashes[file],row.historicalSha256,'Extraneous successor '+file);
 return {originals,successors,historicalEvidenceUnchanged:true};
}
