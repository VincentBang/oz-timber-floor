import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {isRedirectDocument} from './reliability-redirect-document.mjs';
import {reliabilityHTML} from './reliability-disclosures.mjs';

const stub = fs.readFileSync(new URL('../ranges/avala-hybrid-planks/index.html', import.meta.url), 'utf8');
const catalogue = JSON.parse(fs.readFileSync(new URL('../data/product-catalogue.json', import.meta.url)));
test('generated noindex redirect stub stays byte identical instead of being repaired as its canonical owner', () => {
  assert.equal(isRedirectDocument(stub), true);
  assert.deepEqual(reliabilityHTML(stub, catalogue), {html:stub, faqs:0, cards:0, unresolved:[]});
});
test('missing protection, mismatched destination, or content owner cannot bypass strict section checks', () => {
  for (const html of [stub.replace('noindex,follow', 'index,follow'), stub.replace('0; url=', '5; url='), stub.replace('<body>', '<body><main></main>'), stub.replace('<body>', '<body><h1>Content</h1>'), stub.replace('<body>', '<body><script type="application/ld+json">{}</script>'), stub.replace('<body>', '<body><details class="faq-item"></details>')]) {
    assert.equal(isRedirectDocument(html), false);
    assert.throws(() => reliabilityHTML(html, catalogue), /FAQ/);
  }
});
test('every generated reviewed alias is excluded without changing routing or metadata', () => {
  for (const slug of ['artisan-hybrid-tile', 'avala-hybrid-planks', 'belle-vie-herringbone', 'botanica-engineered', 'castel-nuovo-herringbone', 'etf-12mm-water-resistant-laminate', 'etf-7mm-waterproof-hybrid', 'etf-8mm-waterproof-hybrid', 'etf-9mm-waterproof-hybrid', 'pantora-amor-collection', 'pantora-lifestyle-collection', 'prime-contemporary-plus-edition', 'prime-deluxe-edition', 'prime-legend-collection']) {
    const html = fs.readFileSync(new URL('../ranges/' + slug + '/index.html', import.meta.url), 'utf8');
    assert.equal(isRedirectDocument(html), true, slug);
    assert.equal(reliabilityHTML(html, catalogue).html, html, slug);
  }
});
