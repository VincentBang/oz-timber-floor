// Exact presentation replay for historical checks, never live AI authority.
import fs from 'node:fs';import assert from 'node:assert/strict';import {hash} from '../assistant/lib/security.mjs';
export const COMPACT_UI_RECEIPT_SHA256='5c5cae3d8178e7d584226fc5cbe6eccac91a5f56fd184d5276bdaf6d1737a8ce';
export function validateCompactUIReceipt(bytes){assert.equal(hash(bytes),COMPACT_UI_RECEIPT_SHA256,'Unreviewed compact UI receipt');const r=JSON.parse(bytes);assert.equal(r.scope,'LOCAL_OWNER_UI_REPLAY_ONLY_NOT_KNOWLEDGE_OR_ACTIVATION_APPROVAL');assert.equal(r.previousFooterReceiptSha256,'366e6d16896379e8faebba72034d7005327dc25c491d246dde62c06de3fd7d01');return r;}
let receipt;
export function sourceBeforeCompactUI(file,html){
 if(!file.endsWith('.html'))return html;
 receipt??=validateCompactUIReceipt(fs.readFileSync(new URL('../config/compact-ui-transition-20261105.json',import.meta.url)));
 const footers=html.match(/<footer class="ozf"[^>]*>[\s\S]*?<\/footer>/g);
 if(footers?.length===1&&footers[0]===receipt.footerAfter)html=html.replace(footers[0],receipt.footerBefore);
 if(['contact.html','contact/index.html'].includes(file)&&html.split(receipt.contactAfter).length===2)html=html.replace(receipt.contactAfter,receipt.contactBefore);
 // Caller still verifies the entire expected old file digest after all replays.
 return html;
}
