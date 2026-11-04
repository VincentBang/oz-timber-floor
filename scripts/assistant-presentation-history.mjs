import assert from 'node:assert/strict';
import {hash} from '../assistant/lib/security.mjs';

// Additive receipt produced by protected semantic/content/form comparison.
// The November 4 historical entry and successor receipts remain immutable.
export const PRESENTATION_RECEIPT_SHA256='65b62b1270db89ac90123f37adde2d32cd873aeaf15757abb44bc6d01d45fee6';
export function reviewedPresentation({entryBytes,successorBytes,read}) {
 const bytes=read('config/assistant-presentation-successor-20261105.json');
 assert.equal(hash(bytes),PRESENTATION_RECEIPT_SHA256,'Unreviewed presentation receipt');
 const receipt=JSON.parse(bytes),entry=JSON.parse(entryBytes),parent=JSON.parse(successorBytes);
 assert.equal(receipt.historicalEntrySha256,hash(entryBytes));
 assert.equal(receipt.parentReceiptSha256,hash(successorBytes));
 assert.equal(receipt.sourceCommit,parent.sourceCommit);
 assert.deepEqual(receipt.review,{seoSchemaFormsEqual:true,allPreviousHrefsRetained:true,allPreviousMeaningfulContentRetained:true,protectedDataRoutingFunctionsEqual:true});
 for(const [file,row] of Object.entries(receipt.files)) {
  assert(entry.hashes[file],'Extraneous presentation successor '+file);
  assert.equal(row.previousSha256,parent.files[file]?.successorSha256||entry.hashes[file],file+' presentation parent');
 }
 return receipt.files;
}
