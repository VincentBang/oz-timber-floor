import fs from 'node:fs';

const catalogue = JSON.parse(fs.readFileSync('data/product-catalogue.json', 'utf8'));
const ranges = catalogue.ranges || [];

const categoryOrder = [
  ['Hybrid', 'hybrid', 'Hybrid ranges'],
  ['Laminate', 'laminate', 'Laminate ranges'],
  ['Engineered timber', 'engineered-timber', 'Engineered timber ranges'],
  ['Solid timber', 'solid-timber', 'Solid timber / hardwood ranges']
];

const manualRanges = {
  Vinyl: [
    {
      name: 'Ornato Vinyl',
      supplier: '',
      category: 'Vinyl',
      thickness: '',
      colourCount: '',
      url: '/ranges/ornato-vinyl/',
      primaryImage: '/assets/images/categories/vinyl-flooring-thumbnail.webp',
      description: 'A practical vinyl range pathway for residential, rental and light commercial enquiries.'
    }
  ]
};

const esc = (value = '') => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;');

function card(range) {
  const image = range.primaryImage && !range.primaryImage.includes('coming-soon')
    ? `<img class="category-thumb" src="${esc(range.primaryImage)}" alt="${esc(`${range.supplier || range.brand || 'Supplier'} ${range.name} ${range.category} range colour swatch`)}" loading="lazy" decoding="async">`
    : '';
  const pills = [
    range.category,
    range.thickness,
    range.colourCount ? `${range.colourCount} colours` : ''
  ].filter((pill) => pill && String(pill).length <= 28).slice(0, 3);
  const description = range.description || range.shortDescription || `${range.name} is available for catalogue enquiry and supplier confirmation.`;
  const search = `${range.supplier || range.brand || ''} ${range.name} ${range.category}`.toLowerCase();
  return `<article class="card range-summary-card" id="range-${esc((range.id || range.name).toLowerCase().replace(/[^a-z0-9]+/g, '-'))}" data-range-card data-supplier="${esc(range.supplier || range.brand || 'Supplier')}" data-category="${esc(range.category)}" data-search="${esc(search)}">${image}<p class="catalogue-overline">${esc(range.supplier || range.brand || 'Supplier')}</p><h3>${esc(range.name)}</h3><p>${esc(description)}</p><p class="product-meta">${pills.map((pill) => `<span class="pill">${esc(pill)}</span>`).join('')}</p><a class="card-link" href="${esc(range.url)}">View range</a></article>`;
}

const supplierNames = [...new Set(ranges.map((range) => range.supplier || range.brand).filter(Boolean))]
  .filter((name) => !['Oz Timber Floor', 'Flooring range'].includes(name))
  .sort((a, b) => a.localeCompare(b))
  .slice(0, 12);

let sectionHtml = '';
for (const [category, id, title] of categoryOrder) {
  const items = ranges.filter((range) => range.category === category);
  sectionHtml += `<section class="section" id="${id}"><div class="shell"><div class="section-head"><div><p class="eyebrow">${esc(title)}</p><h2>${esc(title)}</h2></div><p>${items.length} ranges available to compare.</p></div><div class="grid-3">${items.map(card).join('')}</div></div></section>`;
}
for (const category of ['Vinyl']) {
  const id = category.toLowerCase();
  const items = manualRanges[category];
  sectionHtml += `<section class="section" id="${id}"><div class="shell"><div class="section-head"><div><p class="eyebrow">${category} ranges</p><h2>${category} ranges</h2></div><p>${category} is visible because supplier source navigation still includes it. Exact product details are confirmed before order.</p></div><div class="grid-3">${items.map(card).join('')}</div></div></section>`;
}

const totalRanges = ranges.length + manualRanges.Vinyl.length;
const supplierLinks = supplierNames.map((name) => `<a href="#range-library" data-supplier-filter="${esc(name)}">${esc(name)}</a>`).join('');

const html = `<!DOCTYPE html><html lang="en-AU"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>All Flooring Ranges Sydney | Oz Timber Floor</title><meta name="description" content="Browse the full Oz Timber Floor range list by category, supplier, thickness and colour count."><link rel="canonical" href="https://oztimberfloor.com.au/ranges/"><link rel="icon" href="/assets/favicon.svg" type="image/svg+xml"><meta name="robots" content="index,follow"><meta property="og:type" content="website"><meta property="og:title" content="All Flooring Ranges Sydney | Oz Timber Floor"><meta property="og:description" content="Browse the full Oz Timber Floor range list by category, supplier, thickness and colour count."><meta property="og:url" content="https://oztimberfloor.com.au/ranges/"><link rel="stylesheet" href="/assets/site.css"><script src="/assets/contact-config.js" defer></script><script src="/assets/site.js" defer></script></head><body><header class="site-header"><div class="shell nav"><a class="brand" href="/" aria-label="Oz Timber Floor home"><span class="brand-mark">OZ</span><span>Oz Timber Floor<small>Sydney Flooring Contractor</small></span></a><nav class="nav-links" aria-label="Primary"><a href="/">Home</a><a href="/services/">Services</a><a href="/products/" aria-current="page">Products</a><a href="/projects/">Projects</a><a href="/guides/">Guides</a><a href="/contact/">Contact</a></nav><button class="nav-toggle" type="button" aria-label="Open menu" aria-expanded="false"><span></span><span></span><span></span></button><div class="header-actions"><a class="button-secondary" href="/products/">Products</a><a class="button" href="/contact/?enquiry=supply-install">Send enquiry</a></div></div></header><main><section class="hero"><div class="shell hero-grid"><div><p class="eyebrow">All flooring ranges</p><h1>All flooring ranges</h1><p class="lead">Find the range first, compare colours and specifications, then send Oz Timber Floor a catalogue enquiry for stock, supply or installation support.</p><div class="button-row"><a class="button" href="/products/">Back to products</a><a class="button-secondary" href="/contact/?enquiry=product&amp;source=ranges">Ask about a range</a></div></div><div class="hero-media"><img src="/assets/products/hybrid/avala/avala-blackbutt.webp" alt="Avala Blackbutt hybrid flooring colour swatch" loading="lazy" decoding="async"><div class="hero-badge"><span>${totalRanges} ranges</span><span>Catalogue enquiry</span><span>Sydney</span></div></div></div></section><section class="section soft" id="range-library"><div class="shell"><div class="section-head"><div><p class="eyebrow">Find faster</p><h2>Search or filter the range list</h2></div><p>Use category quick links, supplier filters or search by range name.</p></div><div class="catalogue-filter"><input type="search" id="rangeSearch" aria-label="Search flooring ranges"></div><nav class="service-nav project-type-nav" aria-label="Range categories"><a href="#hybrid">Hybrid</a><a href="#laminate">Laminate</a><a href="#engineered-timber">Engineered timber</a><a href="#solid-timber">Solid timber / hardwood</a><a href="#vinyl">Vinyl</a></nav><nav class="service-nav project-type-nav" aria-label="Supplier filters"><a href="#range-library" data-supplier-filter="">All suppliers</a>${supplierLinks}</nav></div></section>${sectionHtml}<section class="section soft"><div class="shell cta"><p class="eyebrow">Catalogue enquiry</p><h2>Need help narrowing the range list?</h2><p>Send the range names, preferred colours, suburb and approximate area. Oz Timber Floor can confirm stock, product details and installation suitability.</p><div class="button-row"><a class="button" href="/contact/?enquiry=product&amp;source=ranges">Ask about flooring ranges</a></div></div></section><script>document.addEventListener("input",function(event){if(event.target.id!=="rangeSearch")return;var value=event.target.value.toLowerCase();document.querySelectorAll("[data-range-card]").forEach(function(card){card.hidden=value&&!card.dataset.search.includes(value);});});document.addEventListener("click",function(event){var link=event.target.closest("[data-supplier-filter]");if(!link)return;event.preventDefault();var supplier=link.dataset.supplierFilter;document.querySelectorAll("[data-range-card]").forEach(function(card){card.hidden=supplier&&card.dataset.supplier!==supplier;});});</script></main><footer class="site-footer"><div class="shell footer-grid"><div><h3>Oz Timber Floor</h3><p>Sydney timber flooring supplier, installer, builder flooring contractor and floor preparation specialist.</p><p class="contact-details" data-contact-block>Phone: <a href="tel:+61435496975">0435 496 975</a><br>Second phone: <a href="tel:+61434882699">0434 882 699</a><br>Email: <a href="mailto:info@oztimberfloor.com.au">info@oztimberfloor.com.au</a><br>Service area: Sydney-wide flooring supply and installation</p></div><div><h3>Services</h3><div class="footer-links"><a href="/timber-flooring-installation-sydney/">Installation</a><a href="/floor-levelling-sydney/">Floor levelling</a><a href="/commercial-flooring-sydney/">Commercial flooring</a><a href="/builder-flooring-contractor-sydney/">Builder contractor</a><a href="/timber-floor-sanding-and-polishing-sydney/">Sanding and polishing</a><a href="/timber-floor-removal-and-stripping-sydney/">Removal and stripping</a></div></div><div><h3>Products</h3><div class="footer-links"><a href="/products/">Products</a><a href="/ranges/">All ranges</a><a href="/hybrid-flooring-sydney/">Hybrid</a><a href="/laminate-flooring-sydney/">Laminate</a><a href="/engineered-timber-flooring-sydney/">Engineered timber</a><a href="/solid-timber-flooring-sydney/">Solid timber</a><a href="/vinyl-flooring-sydney/">Vinyl</a></div></div><div><h3>Enquiries</h3><div class="footer-links"><a href="/contact/?enquiry=supply-only">Request supply price</a><a href="/contact/?enquiry=supply-install">Supply + install quote</a><a href="/contact/?enquiry=stock">Check stock availability</a><a href="/projects/">Projects</a><a href="/guides/">Guides</a><a href="/contact/">Contact</a><a href="/privacy/">Privacy notice</a></div></div></div><div class="shell footer-bottom">© 2026 Oz Timber Floor. Sydney timber flooring supply, installation and preparation.</div></footer></body></html>`;

fs.writeFileSync('ranges/index.html', html);
