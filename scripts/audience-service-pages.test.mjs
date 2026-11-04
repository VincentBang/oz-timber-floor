import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { after, test } from 'node:test';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'oz-audience-generator-'));
after(() => fs.rmSync(temporary, { recursive: true, force: true }));
const inputs = ['data/audience-service-pages.json', 'data/seo-landing-pages.json', 'scripts/audience-service-pages.mjs',
  'builder-flooring-contractor-sydney.html', 'builder-flooring-contractor-sydney/index.html',
  'commercial-flooring.html', 'commercial-flooring/index.html', 'commercial-flooring-sydney.html', 'commercial-flooring-sydney/index.html',
  'services.html', 'services/index.html'];
for (const file of inputs) { fs.mkdirSync(path.dirname(path.join(temporary, file)), { recursive: true }); fs.copyFileSync(path.join(root, file), path.join(temporary, file)); }
// Exercise the real current presentation dependencies rather than a stub or
// an old shell. All writes still occur in the disposable fixture.
for (const directory of ['scripts','data','config','docs']) fs.cpSync(path.join(root,directory),path.join(temporary,directory),{recursive:true});
fs.symlinkSync(path.join(root,'node_modules'),path.join(temporary,'node_modules'),'dir');
const assetPaths=new Set(inputs.filter(f=>f.endsWith('.html')).flatMap(f=>[...fs.readFileSync(path.join(root,f),'utf8').matchAll(/src="\/(assets\/[^"?]+)"/g)].map(m=>m[1])));
for(const page of JSON.parse(fs.readFileSync(path.join(root,'data/audience-service-pages.json'))).pages)assetPaths.add(page.image.src.replace(/^\//,''));
for(const file of assetPaths){fs.mkdirSync(path.dirname(path.join(temporary,file)),{recursive:true});fs.copyFileSync(path.join(root,file),path.join(temporary,file));}
const run = (...args) => spawnSync(process.execPath, [path.join(temporary, 'scripts/audience-service-pages.mjs'), ...args], { cwd: temporary, encoding: 'utf8' });
const read = file => fs.readFileSync(path.join(temporary, file), 'utf8');
const esc = value => String(value).replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
const content = JSON.parse(read('data/audience-service-pages.json'));

function publicStrings(value, key = '') {
  if (typeof value === 'string') return ['heading', 'question', 'answer', 'text', 'label', 'primary', 'secondary', 'helper', 'eyebrow', 'h1'].includes(key) ? [value] : [];
  if (Array.isArray(value)) return value.flatMap(v => typeof v === 'string' && key === 'paragraphs' ? [v] : publicStrings(v, key));
  if (value && typeof value === 'object') return Object.entries(value).flatMap(([k, v]) => publicStrings(v, k));
  return [];
}

test('reviewed page content is regenerated with matching copies, canonical metadata and visible FAQs', () => {
  const result = run(); assert.equal(result.status, 0, result.stderr);
  for (const page of content.pages) {
    const slug = page.route.slice(1, -1), html = read(slug + '/index.html');
    assert(!fs.existsSync(path.join(temporary, slug + '.html')), 'One physical canonical owner');
    assert.equal((html.match(/<h1>/g) || []).length, 1);
    assert(html.includes(`<link rel="canonical" href="https://oztimberfloor.com.au${page.route}">`));
    assert(html.includes('content="index,follow"'));
    for (const text of publicStrings({ h1: page.h1, hero: page.hero, sections: page.sections })) assert(html.includes(esc(text)), 'Missing approved public copy: ' + text);
    const questions = page.sections.flatMap(s => s.blocks.filter(b => b.type === 'faq'));
    const faq = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map(m => JSON.parse(m[1])).find(s => s['@type'] === 'FAQPage');
    assert.deepEqual(faq.mainEntity.map(q => [q.name, q.acceptedAnswer.text]), questions.map(q => [q.question, q.answer]));
    assert.equal((html.match(/<details class="faq-item">/g) || []).length, questions.length);
    assert(!/<details[^>]*\bopen\b/.test(html));
    assert(!/<form\b/.test(html));
    assert(!/EDITORIAL LIMITS|BEGIN VISIBLE PAGE COPY|Primary keyword cluster|Navigation\/card label/.test(html));
    assert(html.includes(esc(page.ctaUrl)));
    assert(!/topic=(?:insurance|property)|enquiry=(?:insurance|property)/.test(html));
  }
});

test('generation is idempotent and stale-page checking reports drift without modifying it', () => {
  assert.equal(run().status, 0); assert.deepEqual(JSON.parse(run().stdout).changed, []);
  assert.equal(run('--check').status, 0);
  const file = 'property-manager-flooring/index.html';
  const drift = read(file).replace('<h1>', '<h1>Unexpected text ');
  fs.writeFileSync(path.join(temporary, file), drift);
  assert.equal(run('--check').status, 1);
  assert.equal(read(file), drift, '--check must remain read-only');
  assert.equal(run().status, 0); assert.equal(run('--check').status, 0);
});

test('discovery regeneration retains unrelated authored content and fails closed on duplicate own markers', () => {
  const file = 'services.html', comment = '<!-- unrelated existing user note -->';
  fs.writeFileSync(path.join(temporary, file), read(file).replace('</main>', comment + '</main>'));
  assert.equal(run().status, 0); assert(read(file).includes(comment));
  assert.equal((read(file).match(/<!-- audience-service-cards -->/g) || []).length, 1);
  const duplicated = read(file).replace('<!-- audience-service-cards -->', '<!-- audience-service-cards --><!-- audience-service-cards -->');
  fs.writeFileSync(path.join(temporary, file), duplicated);
  assert.notEqual(run('--check').status, 0);
  assert.equal(read(file), duplicated);
});
