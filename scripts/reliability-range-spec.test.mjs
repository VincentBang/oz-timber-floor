import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {repairReviewedRangeSpec, easiPlankImportText, iconicImportText, lifestyleImportText, installationConfirmation} from './reliability-range-spec.mjs';
import {reliabilityHTML} from './reliability-disclosures.mjs';
const fixture = (route, value) => `<link rel="canonical" href="https://oztimberfloor.com.au${route}"><div class="spec-item"><span>Installation profile</span><strong>${value}</strong></div>`;
test('reviewed importer navigation text is withheld, not presented as a specification', () => {
  const before = fixture('/ranges/easi-plank/', easiPlankImportText);
  assert.equal(repairReviewedRangeSpec(before), before.replace(easiPlankImportText, installationConfirmation));
});
test('repair is idempotent and preserves verified future methods', () => {
  for (const value of [installationConfirmation, 'Floating click system']) {
    const html = fixture('/ranges/easi-plank/', value);
    assert.equal(repairReviewedRangeSpec(html), html);
  }
});
test('unreviewed routes and other fields remain byte-identical', () => {
  const html = fixture('/ranges/cavallo-bianco/', easiPlankImportText);
  assert.equal(repairReviewedRangeSpec(html), html);
});
test('published Easi Plank profile is an honest confirmation fallback', () => {
  const html = fs.readFileSync(new URL('../ranges/easi-plank/index.html', import.meta.url), 'utf8');
  assert(html.includes(`<span>Installation profile</span><strong>${installationConfirmation}</strong>`));
  assert.equal(repairReviewedRangeSpec(html), html);
});
test('shared build repair stage reapplies the exact display correction', () => {
  const catalogue = JSON.parse(fs.readFileSync(new URL('../data/product-catalogue.json', import.meta.url)));
  const html = fixture('/ranges/easi-plank/', easiPlankImportText);
  assert.equal(reliabilityHTML(html, catalogue).html, html.replace(easiPlankImportText, installationConfirmation));
});
test('Iconic exact reviewed text is corrected in the shared build stage without changing other HTML', () => {
  const catalogue = JSON.parse(fs.readFileSync(new URL('../data/product-catalogue.json', import.meta.url)));
  const html = fixture('/ranges/iconic-wpc/', iconicImportText) + '<p>Confirm product details before order.</p>';
  const repaired = reliabilityHTML(html, catalogue).html;
  assert.equal(repaired, html.replace(iconicImportText, installationConfirmation));
  assert.equal(reliabilityHTML(repaired, catalogue).html, repaired);
});
test('Iconic repair does not overwrite future methods, different imported values or unreviewed routes', () => {
  for (const value of ['Floating click system', easiPlankImportText]) {
    const html = fixture('/ranges/iconic-wpc/', value);
    assert.equal(repairReviewedRangeSpec(html), html);
  }
  const unreviewed = fixture('/ranges/hydroplank-wpc/', iconicImportText);
  assert.equal(repairReviewedRangeSpec(unreviewed), unreviewed);
});
test('reviewed Iconic static output is an honest confirmation fallback and ambiguous structure fails closed', () => {
  const html = fs.readFileSync(new URL('../ranges/iconic-wpc/index.html', import.meta.url), 'utf8');
  assert(html.includes(`<span>Installation profile</span><strong>${installationConfirmation}</strong>`));
  assert.equal(repairReviewedRangeSpec(html), html);
  assert.throws(() => repairReviewedRangeSpec(fixture('/ranges/iconic-wpc/', iconicImportText).replace('<span>Installation profile</span>', '<span>Other field</span>')), /requires review/);
});
test('Lifestyle known navigation pollution is corrected by the shared build stage, not inferred as a method', () => {
  const catalogue = JSON.parse(fs.readFileSync(new URL('../data/product-catalogue.json', import.meta.url)));
  assert.equal(catalogue.ranges.find(r => r.url === '/ranges/lifestyle-collection/').installationMethod, '');
  const html = fixture('/ranges/lifestyle-collection/', lifestyleImportText) + '<p>Confirm current product details.</p>';
  assert.equal(reliabilityHTML(html, catalogue).html, html.replace(lifestyleImportText, installationConfirmation));
});
test('Lifestyle guard preserves future methods, other imported text and unreviewed ranges', () => {
  for (const value of ['Floating click system', iconicImportText, installationConfirmation]) {
    const html = fixture('/ranges/lifestyle-collection/', value);
    assert.equal(repairReviewedRangeSpec(html), html);
  }
  const unreviewed = fixture('/ranges/lumiere-ultra-hd/', lifestyleImportText);
  assert.equal(repairReviewedRangeSpec(unreviewed), unreviewed);
});
test('Lifestyle static output contains the honest fallback and missing installation structure fails closed', () => {
  const html = fs.readFileSync(new URL('../ranges/lifestyle-collection/index.html', import.meta.url), 'utf8');
  assert(html.includes(`<span>Installation profile</span><strong>${installationConfirmation}</strong>`));
  assert.equal(repairReviewedRangeSpec(html), html);
  assert.throws(() => repairReviewedRangeSpec(fixture('/ranges/lifestyle-collection/', lifestyleImportText).replace('<span>Installation profile</span>', '<span>Other field</span>')), /requires review/);
});
