// Source-history compatibility only, never knowledge or activation authority.
// Preserve the original manifest and prove the owner's exact UI-only removal.
import {execFileSync} from 'node:child_process';
import {hash} from '../assistant/lib/security.mjs';
import {previousHeaderGrouping} from './header-grouping.mjs';
import {sourceBeforeFooterV2} from './footer-v2-history.mjs';
const parent='67f71ea86ac0ddd63e38b1f992c474e0ffb9d679';
const boundHomepage='9ad3bae6c3cd4d2afd2a3768b72b7f57642cacb2b2dddb25e844518f7a454e6b';
let original;
export function sourceForHistoricalDigest(file,bytes,expected){
 if(hash(bytes)===expected)return bytes;
 const footerSource=sourceBeforeFooterV2(file,bytes);if(hash(footerSource)===expected)return footerSource;
 // The owner also renamed only header /products/ labels. Reconcile only when
 // reversing that exact label change reproduces the entire expected file hash.
 const previousLabels=/\.html$/.test(file)?Buffer.from(previousHeaderGrouping(footerSource.toString()).replace(/<header\b[^>]*>[\s\S]*?<\/header>/g,header=>header.replace(/(<a\b[^>]*\bhref="\/products\/"[^>]*>)Products(<\/a>)/g,'$1Flooring$2'))):footerSource;
 if(hash(previousLabels)===expected)return previousLabels;
 if(file!=='index.html'||expected!==boundHomepage)return bytes;
 original??=execFileSync('git',['show',parent+':index.html'],{maxBuffer:4e6});
 if(hash(original)!==boundHomepage)throw Error('Immutable homepage parent mismatch');
 const text=original.toString(),bands=text.match(/<section class="arch-home-search"[^>]*>[\s\S]*?<\/section>/g)||[];
 if(bands.length!==1)throw Error('Expected one original homepage search band');
 const approved=Buffer.from(text.replace(bands[0],''));
 return Buffer.from(previousLabels).equals(approved)?original:bytes;
}
