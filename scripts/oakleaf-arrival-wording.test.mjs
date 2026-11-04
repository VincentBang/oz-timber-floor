import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import test from 'node:test';

const root = path.resolve(import.meta.dirname, '..');
const targets = [
  ['oakleaf-hd-plus-bellmore-oak', 'Bellmore Oak'],
  ['oakleaf-hd-plus-hampton-oak', 'Hampton Oak'],
  ['oakleaf-hd-plus-windsor', 'Windsor'],
];
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const baseline = file => execFileSync('git', ['show', '98624d3e:'+file], {cwd:root, encoding:'utf8', maxBuffer:32_000_000});
const catalogue = JSON.parse(read('data/product-catalogue.json'));
const before = JSON.parse(baseline('data/product-catalogue.json'));
const withoutImageFields = ({primaryImage,imageGallery,galleryStatus,altText,...record}) => record;
const protectedParts = html => html.match(/<title\b[^>]*>[\s\S]*?<\/title>|<h1\b[^>]*>[\s\S]*?<\/h1>|<link\b[^>]*rel="canonical"[^>]*>|<meta\b[^>]*name="robots"[^>]*>|<script\b[^>]*type="application\/ld\+json"[^>]*>[\s\S]*?<\/script>|\bhref="[^"]*"|<(?:form|input|select|button|textarea)\b[^>]*>/gi);
const presentationBaseline = file => architecturalHTML(baseline(file),file);

test('only the approved description and thickness fields change on the three Oakleaf product records, beside previously verified images', () => {
  for (const [id,colour] of targets) {
    const matches = catalogue.products.filter(p => p.id === id);
    assert.equal(matches.length,1);
    const old = before.products.find(p => p.id === id);
    const description = old.shortDescription.replace(colour+' 12mm ARRIVING SOON', colour+' 12mm');
    assert.notEqual(description, old.shortDescription);
    assert.deepEqual(withoutImageFields(matches[0]), {...withoutImageFields(old), thickness:'12mm', shortDescription:description});
    assert.equal(matches[0].stockStatusLabel,'Check stock availability');
  }
});

test('product summaries and both meta descriptions agree without the obsolete qualifier; protected page structure and handoffs remain intact', () => {
  for (const [id,colour] of targets) {
    const record = catalogue.products.find(p => p.id === id), file = record.url.slice(1)+'index.html';
    const html = read(file);
    assert.doesNotMatch(html,/arriving soon/i);
    assert(html.includes('<meta name="description" content="'+record.shortDescription+'">'));
    assert(html.includes('<meta property="og:description" content="'+record.shortDescription+'">'));
    assert(html.includes('<p class="lead">'+record.shortDescription+'</p>'));
    assert(html.includes('<span>Thickness</span><strong>12mm</strong>'));
    assert(html.includes('<h1>'+colour+'</h1>'));
    assert.deepEqual(protectedParts(html),protectedParts(presentationBaseline(file)));
  }
});

test('Oakleaf cards display the corrected thickness under the right colour, without changing any other card wording', () => {
  const file = 'ranges/oakleaf/index.html', extract = html => [...html.matchAll(/<article\b[^>]*>[\s\S]*?<\/article>/g)].map(m=>m[0]),
    words = html => html.replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim();
  const cards = extract(read(file)), old = extract(baseline(file));
  assert.equal(cards.length, old.length);
  let fixed = 0;
  for (const [i,card] of cards.entries()) {
    const match = targets.find(([id])=>old[i].includes('href="/products/'+id+'/"'));
    if (match) {
      assert(card.includes('<h3>'+match[1]+'</h3>'));
      assert(card.includes('<span class="pill">12mm</span>'));
      assert(!card.includes('ARRIVING SOON'));
      fixed++;
    }
    // The earlier supplier-image change can replace a textual image placeholder.
    // Only compare the product summary, starting at its heading.
    const summary = x => words(x.slice(x.indexOf('<h3>')));
    assert.equal(summary(card), match ? summary(old[i]).replace('12mm ARRIVING SOON','12mm') : summary(old[i]));
  }
  assert.equal(fixed,3);
  assert.deepEqual(protectedParts(read(file)),protectedParts(presentationBaseline(file)));
});
import {architecturalHTML} from './architectural-design.mjs';
