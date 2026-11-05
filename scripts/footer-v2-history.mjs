// Exact local UI transition accounting. Never changes approvals or activation.
import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import {hash} from '../assistant/lib/security.mjs';
import {sourceBeforeCompactUI} from './compact-ui-history.mjs';
export const FOOTER_TRANSITION_SHA256='366e6d16896379e8faebba72034d7005327dc25c491d246dde62c06de3fd7d01';
let receipt;
export function validateFooterReceipt(bytes){assert.equal(hash(bytes),FOOTER_TRANSITION_SHA256,'Unreviewed footer presentation receipt');const r=JSON.parse(bytes);assert.equal(r.scope,'LOCAL_FOOTER_PRESENTATION_RECONCILIATION_ONLY_NOT_KNOWLEDGE_OR_ACTIVATION_APPROVAL');return r;}
export function sourceBeforeFooterV2(file,bytes){
 let html=bytes.toString();
 if(file==='assets/site.js')return Buffer.from(html.replace('document.querySelector(".footer-bottom, .ozf__bottom")','document.querySelector(".footer-bottom")').replace('document.querySelector(".site-footer, .ozf")','document.querySelector(".site-footer")'));
 if(file==='assets/mobile-ux.js')return Buffer.from(html.replace('.site-footer a[href^="tel:"], .ozf a[href^="tel:"]','.site-footer a[href^="tel:"]').replace('document.querySelector(".site-footer, .ozf")','document.querySelector(".site-footer")'));
 if(!file.endsWith('.html')||!html.includes('data-oz-footer="v2"'))return bytes;
 html=sourceBeforeCompactUI(file,html);
 receipt??=validateFooterReceipt(fs.readFileSync(path.resolve(import.meta.dirname,'../config/footer-v2-transition-20261105.json')));
 const old=receipt.variants[receipt.files[file]],matches=html.match(/<footer class="ozf"[^>]*>[\s\S]*?<\/footer>/g);if(!old||matches?.length!==1||matches[0]!==receipt.footerHTML)return bytes;
 html=html.replace(matches[0],old).replace(receipt.resources,'');
 if(file==='index.html'&&html.includes(receipt.home.after))html=html.replace(receipt.home.after,receipt.home.before);
 return Buffer.from(html);
}
