import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {parse} from 'parse5';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const placeholder = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
const walk = n => [n, ...(n.childNodes || []).flatMap(walk)];
const attr = (n, key) => n.attrs?.find(a => a.name === key)?.value;

export function repairLegacyGuideImages(html, exists) {
  const edits = [];
  for (const n of walk(parse(html, {sourceCodeLocationInfo:true}))) {
    if (n.tagName !== 'img' || attr(n, 'src') !== placeholder) continue;
    const src = attr(n, 'data-src');
    if (!/^\/assets\/guides\/legacy-wp\/[a-z0-9-]+\.(?:png|jpe?g|webp)$/i.test(src || '') || !exists(src)) {
      throw Error('Legacy guide image requires a verified existing local asset');
    }
    let ancestor = n.parentNode;
    while (ancestor && ancestor.tagName !== 'article' && !(attr(ancestor, 'class') || '').split(/\s+/).includes('text-block')) ancestor = ancestor.parentNode;
    if (!ancestor) throw Error('Legacy placeholder outside article requires separate review');
    const loc = n.sourceCodeLocation.startTag;
    let tag = html.slice(loc.startOffset, loc.endOffset);
    tag = tag.replace(/\ssrc="[^"]*"/, ' src="' + src + '"')
      .replace(/\s+fetchpriority="[^"]*"/g, '')
      .replace(/\s+loading="[^"]*"/g, '')
      .replace(/>$/, ' loading="lazy">');
    edits.push({start:loc.startOffset, end:loc.endOffset, tag});
  }
  for (const edit of edits.reverse()) html = html.slice(0, edit.start) + edit.tag + html.slice(edit.end);
  return {html, repaired:edits.length};
}

export function applyLegacyGuideImages() {
  let repaired = 0;
  for (const entry of fs.readdirSync(root + '/guides', {withFileTypes:true})) {
    const file = path.join(root, 'guides', entry.name, 'index.html');
    if (!entry.isDirectory() || !fs.existsSync(file)) continue;
    const before = fs.readFileSync(file, 'utf8');
    const result = repairLegacyGuideImages(before, src => fs.existsSync(root + src));
    if (result.html !== before) fs.writeFileSync(file, result.html);
    repaired += result.repaired;
  }
  return repaired;
}
