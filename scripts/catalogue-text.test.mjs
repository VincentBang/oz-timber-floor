import assert from 'node:assert/strict';
import test from 'node:test';
import { normalizeCatalogueAmpersands } from './catalogue-text.mjs';

test('catalogue names normalize inherited ampersand escaping idempotently', () => {
  for (const source of ['Villeroy & Boch', 'Villeroy &amp; Boch', 'Villeroy &amp;amp;amp; Boch']) {
    const normalized = normalizeCatalogueAmpersands(source);
    assert.equal(normalized, 'Villeroy & Boch');
    assert.equal(normalizeCatalogueAmpersands(normalized), normalized);
    // Repeat the import/render cycle that previously grew escaping each time.
    let rendered = source;
    for (let pass = 0; pass < 5; pass += 1) {
      rendered = normalizeCatalogueAmpersands(rendered).replaceAll('&', '&amp;');
      assert.equal(rendered, 'Villeroy &amp; Boch');
    }
  }
});

test('normalization preserves unrelated text, entities and URLs', () => {
  for (const value of ['Aquastop 8mm', 'A & B / C', '&lt;script&gt;', '&#39;Oak&#39;', '/contact/?enquiry=stock&range=Oak']) {
    assert.equal(normalizeCatalogueAmpersands(value), value);
  }
});

test('raw names retain their identity in JSON and enquiry query values', () => {
  const name = normalizeCatalogueAmpersands('Villeroy &amp;amp; Boch Aquastop');
  assert.equal(JSON.parse(JSON.stringify({ name })).name, 'Villeroy & Boch Aquastop');
  assert.equal(new URLSearchParams({ range: name }).get('range'), name);
  assert(!new URLSearchParams({ range: name }).toString().includes('amp%3B'));
});
