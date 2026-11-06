// Rebuild the two reviewed audience pages and only their marked discovery links.
// Copy lives in data/audience-service-pages.json; SEO metadata/ownership stays in
// the existing SEO registry. The current authored builder page supplies the shell.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import {editorialHTML} from './editorial-gallery.mjs';
import {architecturalHTML} from './architectural-design.mjs';
import {reliabilityHTML} from './reliability-disclosures.mjs';
import {remediateHTML} from './audit-remediation.mjs';
import {routing} from './october-route-fixture.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const config = JSON.parse(fs.readFileSync(path.join(root, 'data/audience-service-pages.json'), 'utf8'));
const metadata = JSON.parse(fs.readFileSync(path.join(root, 'data/seo-landing-pages.json'), 'utf8'));
const check = process.argv.includes('--check');
const changed = [];
const catalogue = JSON.parse(fs.readFileSync(path.join(root, 'data/product-catalogue.json'), 'utf8'));
const router = routing(root);
const origin = 'https://oztimberfloor.com.au';
const esc = value => String(value).replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
const link = item => `<a href="${esc(item.href)}">${esc(item.label)}</a>`;
const paragraph = text => `<p>${esc(text)}</p>`;
const wrap = (name, content) => `<!-- audience-${name} -->${content}<!-- /audience-${name} -->`;

assert.equal(config.schemaVersion, 1);
assert.deepEqual(config.pages.map(p => p.route), ['/property-manager-flooring/', '/insurance-flooring-repairs/']);
const template = fs.readFileSync(path.join(root, config.template), 'utf8');
const head = template.match(/^[\s\S]*?<head>([\s\S]*?)<\/head>/)?.[1];
const header = template.match(/<header\b[\s\S]*?<\/header>/)?.[0];
const tail = template.slice(template.lastIndexOf('</main>') + '</main>'.length);
assert(head && header && tail.includes('<footer'), 'The current service shell is incomplete');
const graphs = [...head.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map(m => JSON.parse(m[1]));
const business = graphs.flatMap(g => g['@graph'] || []).find(n => n['@id'] === origin + '/#business');
assert(business && business['@type'] === 'LocalBusiness', 'Use the existing business identity');

function save(relative, output) {
  // Compare the actual composed build output. Comparing raw audience markup
  // with a page already processed by downstream owners falsely reports drift.
  output = editorialHTML(output, relative);
  output = reliabilityHTML(output, catalogue, u => router.resolve(u).destination).html;
  output = architecturalHTML(output, relative);
  output = remediateHTML(remediateHTML(output, catalogue), catalogue);
  const file = path.join(root, relative);
  const previous = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : null;
  if (previous === output) return;
  changed.push(relative);
  if (!check) { fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, output); }
}
function cta(page, label, secondary = false) {
  return `<a class="${secondary ? 'button-secondary' : 'button'}" href="${esc(page.ctaUrl)}">${esc(label)}</a>`;
}
function breadcrumbs(meta) {
  return '<!-- seo-landing-breadcrumbs --><nav class="breadcrumbs" aria-label="Breadcrumb">' + meta.breadcrumbs.map((c, i) => i === meta.breadcrumbs.length - 1 ? `<span aria-current="page">${esc(c.label)}</span>` : `<a href="${c.route}">${esc(c.label)}</a>`).join('<span aria-hidden="true"> / </span>') + '</nav><!-- /seo-landing-breadcrumbs -->';
}
function renderBlocks(blocks, page) {
  let output = '';
  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];
    if (['card', 'faq', 'step'].includes(block.type)) {
      const group = [block];
      while (blocks[i + 1]?.type === block.type) group.push(blocks[++i]);
      if (block.type === 'card') output += '<div class="scope-grid">' + group.map(b => `<article class="scope-card"><h3>${esc(b.heading)}</h3>${b.paragraphs.map(paragraph).join('')}${b.link ? '<p>' + link(b.link) + '</p>' : ''}</article>`).join('') + '</div>';
      if (block.type === 'faq') output += '<div class="faq-list">' + group.map(b => `<details class="faq-item"><summary>${esc(b.question)}</summary><div>${paragraph(b.answer)}</div></details>`).join('') + '</div>';
      if (block.type === 'step') output += '<ol>' + group.map(b => `<li><h3>${esc(b.heading)}</h3>${paragraph(b.text)}</li>`).join('') + '</ol>';
      continue;
    }
    if (block.type === 'paragraph') output += paragraph(block.text);
    else if (block.type === 'list' || block.type === 'related') {
      if (block.type === 'related') output += '<h3>Related services</h3>';
      output += '<ul>' + block.items.map(item => '<li>' + (item.href ? link(item) : esc(item.text)) + '</li>').join('') + '</ul>';
    } else if (block.type === 'cta') output += `<div class="button-row">${cta(page, block.label)}</div>` + (block.helper ? `<p class="muted">${esc(block.helper)}</p>` : '');
    else throw new Error('Unsupported audience block: ' + block.type);
  }
  return output;
}
function pageHTML(page) {
  const meta = metadata.pages.find(p => p.route === page.route);
  assert(meta, 'Missing audience SEO metadata: ' + page.route);
  assert.equal(page.h1, meta.h1, 'Copy and SEO H1 must agree');
  assert(!meta.introHtml && !meta.bodyHtml, 'Audience body has one source; SEO config must not duplicate it');
  const canonical = origin + page.route;
  const crumbId = canonical + '#breadcrumb';
  const graph = [business,
    { '@type': 'WebPage', '@id': canonical + '#webpage', url: canonical, name: meta.h1, description: meta.description, isPartOf: { '@type': 'WebSite', '@id': origin + '/#website', name: 'Oz Timber Floor', url: origin + '/' }, about: { '@id': business['@id'] }, breadcrumb: { '@id': crumbId } },
    { '@type': 'Service', '@id': canonical + '#service', name: meta.h1, description: meta.description, provider: { '@id': business['@id'] }, areaServed: { '@type': 'City', name: 'Sydney' }, url: canonical },
    { '@type': 'BreadcrumbList', '@id': crumbId, itemListElement: meta.breadcrumbs.map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: c.label, item: origin + c.route })) }
  ];
  const faq = { '@context': 'https://schema.org', '@type': 'FAQPage', '@id': canonical + '#faq', mainEntity: page.sections.flatMap(s => s.blocks.filter(b => b.type === 'faq')).map(b => ({ '@type': 'Question', name: b.question, acceptedAnswer: { '@type': 'Answer', text: b.answer } })) };
  let pageHead = head.replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/g, '');
  pageHead = pageHead.replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(meta.title)}</title>`)
    .replace(/(<meta name="description" content=")[^"]*(")/, `$1${esc(meta.description)}$2`)
    .replace(/(<link rel="canonical" href=")[^"]*(")/, `$1${canonical}$2`)
    .replace(/(<meta property="og:title" content=")[^"]*(")/, `$1${esc(meta.title)}$2`)
    .replace(/(<meta property="og:description" content=")[^"]*(")/, `$1${esc(meta.description)}$2`)
    .replace(/(<meta property="og:url" content=")[^"]*(")/, `$1${canonical}$2`);
  const schema = value => `<script type="application/ld+json">${JSON.stringify(value).replaceAll('<', '\\u003c')}</script>`;
  pageHead += schema({ '@context': 'https://schema.org', '@graph': graph }) + schema(faq);
  const hero = `<section class="hero"><div class="shell hero-grid"><div>${breadcrumbs(meta)}<p class="eyebrow">${esc(page.hero.eyebrow)}</p><h1>${esc(page.h1)}</h1>${page.hero.paragraphs.map((p, i) => i === 0 ? `<p class="lead">${esc(p)}</p>` : paragraph(p)).join('')}<div class="button-row">${cta(page, page.hero.primary)}${cta(page, page.hero.secondary, true)}</div><p class="muted">${esc(page.hero.helper)}</p></div><div class="hero-media"><img src="${esc(page.image.src)}" alt="${esc(page.image.alt)}" width="${page.image.width}" height="${page.image.height}" loading="eager" fetchpriority="high" decoding="async" data-lcp-image></div></div></section>`;
  const sections = page.sections.map((s, i) => `<section class="section${i % 2 === 0 ? ' soft' : ''}"${s.blocks.some(b => b.type === 'faq') ? ' id="faq"' : ''}><div class="shell${s.blocks.some(b => b.type === 'card') ? '' : ' text-block'}"><h2>${esc(s.heading)}</h2>${renderBlocks(s.blocks, page)}</div></section>`).join('\n');
  return '<!DOCTYPE html>\n<html lang="en-AU"><head>' + pageHead + '</head><body>' + header + '<main>\n' + hero + '\n' + sections + '\n</main>' + tail;
}
for (const page of config.pages) {
  const slug = page.route.slice(1, -1);
  // Use the current presentation pass, not an older main-checkout shell.
  // Checking compares the same fully rendered output that the build publishes.
  const html = editorialHTML(pageHTML(page), slug + '/index.html');
  save(slug + '/index.html', html);
}

function stripMarked(html, name) {
  const open = '<!-- audience-' + name + ' -->', close = '<!-- /audience-' + name + ' -->';
  const start = html.indexOf(open), end = html.indexOf(close);
  if (start === -1 && end === -1) return html;
  assert(start !== -1 && end > start && html.indexOf(open, start + open.length) === -1, 'Unexpected audience markers: ' + name);
  return html.slice(0, start) + html.slice(end + close.length);
}
const card = page => `<a class="card link-card" href="${page.route}"><h3>${esc(page.hubCard.heading)}</h3>${paragraph(page.hubCard.description)}<p>${esc(page.hubCard.linklabel)}</p><span class="card-arrow" aria-hidden="true">→</span></a>`;
for (const file of ['services.html', 'services/index.html']) {
  let html = stripMarked(fs.readFileSync(path.join(root, file), 'utf8'), 'service-cards'), marker = '<section class="section" id="core-services">';
  const start = html.indexOf(marker), end = html.indexOf('</section>', start);
  assert(start !== -1 && end > start, 'Missing service discovery section');
  const section = html.slice(start, end + '</section>'.length), closing = '</div></div></section>';
  assert(section.endsWith(closing), 'Service-card grid insertion contract changed');
  const insertion = start + section.length - closing.length;
  html = html.slice(0, insertion) + wrap('service-cards', config.pages.map(card).join('')) + html.slice(insertion);
  save(file, html);
}
const integrations = [
  { files: ['builder-flooring-contractor-sydney.html', 'builder-flooring-contractor-sydney/index.html'], marker: 'insurance-link', html: '<h2>Flooring work for insurance repair projects</h2><p>For repairs managed through an insurance builder, see our <a href="/insurance-flooring-repairs/">insurance flooring repairs and replacement service</a> and send the flooring scope, property suburb and access requirements.</p>' },
  { files: ['commercial-flooring.html', 'commercial-flooring/index.html', 'commercial-flooring-sydney.html', 'commercial-flooring-sydney/index.html'], marker: 'property-link', html: '<h2>Manage flooring work for a rental property</h2><p>For tenancy changeovers, small repairs or replacement flooring, see our <a href="/property-manager-flooring/">flooring service for property managers and rental properties</a>, including tenant and agency key coordination.</p>' }
];
for (const integration of integrations) for (const file of integration.files) {
  const source = fs.readFileSync(path.join(root, file), 'utf8');
  const html = stripMarked(source, integration.marker);
  const mainEnd = html.indexOf('</main>');
  assert(mainEnd !== -1, 'Missing contextual-link insertion point');
  const faq = html.lastIndexOf('<section class="section" id="faq"', mainEnd);
  const insert = faq !== -1 ? faq : mainEnd;
  save(file, html.slice(0, insert) + wrap(integration.marker, '<section class="section"><div class="shell text-block">' + integration.html + '</div></section>') + html.slice(insert));
}
console.log(JSON.stringify({ mode: check ? 'check' : 'apply', pages: config.pages.length, changed }, null, 2));
if (check && changed.length) process.exitCode = 1;
