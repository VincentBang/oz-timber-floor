// Source-history compatibility only, never knowledge or activation authority.
// Preserve the original manifest and prove the owner's exact UI-only removal.
import {execFileSync} from 'node:child_process';
import {hash} from '../assistant/lib/security.mjs';
const parent='67f71ea86ac0ddd63e38b1f992c474e0ffb9d679';
const boundHomepage='9ad3bae6c3cd4d2afd2a3768b72b7f57642cacb2b2dddb25e844518f7a454e6b';
let original;
export function sourceForHistoricalDigest(file,bytes,expected){
 if(hash(bytes)===expected||file!=='index.html'||expected!==boundHomepage)return bytes;
 original??=execFileSync('git',['show',parent+':index.html'],{maxBuffer:4e6});
 if(hash(original)!==boundHomepage)throw Error('Immutable homepage parent mismatch');
 const text=original.toString(),bands=text.match(/<section class="arch-home-search"[^>]*>[\s\S]*?<\/section>/g)||[];
 if(bands.length!==1)throw Error('Expected one original homepage search band');
 const approved=Buffer.from(text.replace(bands[0],''));
 return Buffer.from(bytes).equals(approved)?original:bytes;
}
