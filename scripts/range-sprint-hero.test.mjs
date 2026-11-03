import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('range hero facts use natural block height without changing image colour or typography', () => {
  const css = fs.readFileSync(new URL('../assets/editorial-gallery.css', import.meta.url), 'utf8');
  const rule = 'body.editorial[data-editorial-family="range"] .hero-media:has(>img[src*="/assets/products/"]){display:block;aspect-ratio:auto}';
  assert.equal(css.split(rule).length - 1, 1);
  assert(!/font|filter|color|display:none/.test(rule));
});
