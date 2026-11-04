// Bounded successor to the historical 773-page publication contract.
// The original URL set is immutable; this change authorises exactly two pages.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';

const baselineURL = new URL('../config/audience-page-publication-baseline.json', import.meta.url);
const baselineSha256 = 'a18537bdc3657512dd72e6cad7e3f887b4640d1fb731b9cff262aac65038c3b9';
const domain = 'https://oztimberfloor.com.au';
export const audiencePublicationAdditions = Object.freeze([
  domain + '/property-manager-flooring/',
  domain + '/insurance-flooring-repairs/',
]);

// Exact source additions, including formatting. Historical evidence can replay
// their inverse and require the original byte hash, not just a matching count.
export const audienceSitemapEntries = Object.freeze(audiencePublicationAdditions.map(url =>
  `  <url>\n    <loc>${url}</loc>\n    <changefreq>weekly</changefreq>\n    <priority>0.85</priority>\n  </url>\n`));

export function restorePreAudienceSitemap(sitemap) {
  assertAudiencePublication(sitemap);
  let original = sitemap;
  for (const entry of audienceSitemapEntries) {
    assert.equal(original.split(entry).length, 2, 'Audience sitemap entry differs from the authorised source addition');
    original = original.replace(entry, '');
  }
  return original;
}

export function assertAudiencePublication(sitemap, baselineBytes = fs.readFileSync(baselineURL)) {
  assert.equal(createHash('sha256').update(baselineBytes).digest('hex'), baselineSha256,
    'Immutable pre-audience publication evidence changed');
  const baseline = JSON.parse(baselineBytes);
  assert.equal(baseline.schemaVersion, 1);
  assert.equal(baseline.urls.length, 773, 'Historical publication count must remain 773');
  assert.equal(new Set(baseline.urls).size, 773, 'Historical URLs must remain unique');
  const actual = [...sitemap.matchAll(/<loc>([\s\S]*?)<\/loc>/g)].map(match => match[1]);
  assert.equal(new Set(actual).size, actual.length, 'Duplicate canonical sitemap URL');
  const expected = [...baseline.urls, ...audiencePublicationAdditions].sort();
  assert.deepEqual([...actual].sort(), expected,
    'Sitemap must preserve every historical URL and add exactly the two approved audience pages');
  return {historical: baseline.urls.length, additions: audiencePublicationAdditions.length, total: actual.length};
}
