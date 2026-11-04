import assert from 'node:assert/strict';
import {test} from 'node:test';
import fs from 'node:fs';
import {assertAudiencePublication, audiencePublicationAdditions, restorePreAudienceSitemap} from './audience-publication-contract.mjs';
import {createHash} from 'node:crypto';
import {assertSuccessor} from './historical-scope-reconciliation.mjs';

const sitemap = fs.readFileSync(new URL('../sitemap.xml', import.meta.url), 'utf8');
const baselineBytes = fs.readFileSync(new URL('../config/audience-page-publication-baseline.json', import.meta.url));
const baseline = JSON.parse(baselineBytes);
const entry = url => `<url><loc>${url}</loc></url>`;
const remove = url => sitemap.replace(new RegExp(`<url>\\s*<loc>${url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}</loc>[\\s\\S]*?</url>`), '');

test('publication successor accepts the complete historical set and exactly two audience additions', () => {
  assert.deepEqual(assertAudiencePublication(sitemap), {historical: 773, additions: 2, total: 775});
});

test('rejects an unrelated new canonical route', () => {
  assert.throws(() => assertAudiencePublication(sitemap.replace('</urlset>', entry('https://oztimberfloor.com.au/unapproved-page/') + '</urlset>')),
    /exactly the two approved/);
});

test('rejects removal or substitution of any historical URL, including count-preserving replacement', () => {
  for (const url of baseline.urls) {
    assert.throws(() => assertAudiencePublication(remove(url)), /every historical URL/);
    assert.throws(() => assertAudiencePublication(sitemap.replace(`<loc>${url}</loc>`, '<loc>https://oztimberfloor.com.au/unapproved-page/</loc>')),
      /every historical URL/);
  }
});

test('rejects either missing audience page and duplicate canonical URLs', () => {
  for (const url of audiencePublicationAdditions) assert.throws(() => assertAudiencePublication(remove(url)), /exactly the two approved/);
  assert.throws(() => assertAudiencePublication(sitemap.replace('</urlset>', entry(audiencePublicationAdditions[0]) + '</urlset>')),
    /Duplicate canonical/);
});

test('rejects altered historical evidence instead of blessing the current route set', () => {
  const modified = {...baseline, urls: [...baseline.urls]};
  modified.urls[0] = 'https://oztimberfloor.com.au/unapproved-page/';
  assert.throws(() => assertAudiencePublication(sitemap, Buffer.from(JSON.stringify(modified))), /Immutable pre-audience/);
});

test('exact inverse restores the sealed historical sitemap bytes and rejects unrelated metadata drift', () => {
  const original=restorePreAudienceSitemap(sitemap);
  assert.equal(createHash('sha256').update(original).digest('hex'),baseline.sourceSitemapSha256);
  const modified=sitemap.replace('<priority>1.00</priority>','<priority>0.99</priority>');
  assert.throws(() => assertSuccessor(process.cwd(),'sitemap.xml',baseline.sourceSitemapSha256,Buffer.from(modified)), /Unrelated sitemap drift/);
  const changedNewEntry=sitemap.replace('https://oztimberfloor.com.au/property-manager-flooring/</loc>\n    <changefreq>weekly</changefreq>',
    'https://oztimberfloor.com.au/property-manager-flooring/</loc>\n    <changefreq>daily</changefreq>');
  assert.throws(() => restorePreAudienceSitemap(changedNewEntry), /authorised source addition/);
});
