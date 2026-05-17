import fs from 'node:fs';

const catalogue = JSON.parse(fs.readFileSync('data/product-catalogue.json', 'utf8'));

const rangeIds = [
  'avala',
  'artisan-tile',
  'aqua-wood-plus-12mm',
  'prime-legend',
  'botanica',
  'swish-oak-natura',
  'hardwood-collection'
];

const productIds = [
  'avala-blackbutt',
  'grande-9-0-hybrid-sand',
  'aqua-wood-plus-12mm-big-ben-p-and-h',
  'prime-legend-atlantic-oak',
  'botanica-alaska',
  'swish-oak-natura-ambient-sand',
  'hardwood-collection-abbey-grey'
];

const rangeDescriptions = {
  avala: 'A practical hybrid plank range for homes, apartments and rental upgrades.',
  'artisan-tile': 'A tile-look hybrid range for stone, marble and concrete-style interiors.',
  'aqua-wood-plus-12mm': 'A thicker 12mm laminate range for timber-look floors in dry internal rooms.',
  'prime-legend': 'A 12.3mm laminate range for customers comparing durable timber-look colours.',
  botanica: 'An engineered timber range for interiors needing a real timber surface.',
  'swish-oak-natura': 'An engineered oak range for premium homes and office interiors.',
  'hardwood-collection': 'A hardwood range for projects where natural timber character matters.'
};

const productDescriptions = {
  'avala-blackbutt': 'A warm Australian timber-look hybrid plank for everyday residential interiors.',
  'grande-9-0-hybrid-sand': 'A pale neutral hybrid plank for apartments, rentals and modern homes.',
  'aqua-wood-plus-12mm-big-ben-p-and-h': 'A practical 12mm laminate colour for thicker timber-look flooring comparisons.',
  'prime-legend-atlantic-oak': 'A natural oak-look laminate for dry rooms and renovation budgets.',
  'botanica-alaska': 'A light engineered timber surface for calm premium interiors.',
  'swish-oak-natura-ambient-sand': 'A soft oak engineered timber option for premium homes and offices.',
  'hardwood-collection-abbey-grey': 'A grey-toned hardwood option for long-term timber character.'
};

const byId = (items, id) => items.find((item) => item.id === id);
const esc = (value = '') => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;');
const plus = (value = '') => encodeURIComponent(value).replaceAll('%20', '+');

function rangeCard(range) {
  const pills = [range.category, range.thickness, `${range.colourCount || 'Colour list'} colours`]
    .filter((pill) => pill && String(pill).length <= 28)
    .slice(0, 3);
  const img = range.primaryImage && !range.primaryImage.includes('coming-soon') ? `<img class="category-thumb" src="${esc(range.primaryImage)}" alt="${esc(`${range.supplier || range.brand} ${range.name} ${range.category} range colour swatch`)}" loading="lazy" decoding="async">` : '';
  return `<article class="card range-summary-card" data-range-card data-category="${esc(range.category)}" data-search="${esc(`${range.supplier} ${range.name} ${range.category}`.toLowerCase())}">${img}<p class="catalogue-overline">${esc(range.supplier || range.brand || 'Flooring range')}</p><h3>${esc(range.name)}</h3><p>${esc(rangeDescriptions[range.id] || range.shortDescription)}</p><p class="product-meta">${pills.map((pill) => `<span class="pill">${esc(pill)}</span>`).join('')}</p><a class="card-link" href="${esc(range.url)}">View range</a></article>`;
}

function productCard(product) {
  const range = product.range || product.rangeName || '';
  const category = product.category || '';
  const pills = [category, product.thickness, product.boardSize || product.packSizeM2]
    .filter((pill) => pill && String(pill).length <= 28)
    .slice(0, 3);
  const stockHref = `/contact/?enquiry=stock&product=${plus(product.name)}&productSlug=${plus(product.id)}&range=${plus(range)}&category=${plus(category)}&source=${plus(product.url)}`;
  const alt = `${product.supplier || product.brand} ${range} ${product.colour || product.name} ${category.toLowerCase()} flooring colour swatch`;
  return `<article class="product-card catalogue-card"><img src="${esc(product.primaryImage)}" alt="${esc(alt)}" loading="lazy" decoding="async"><div class="product-body"><p class="catalogue-overline">${esc(range)}</p><h3>${esc(product.name)}</h3><p>${esc(productDescriptions[product.id] || product.shortDescription)}</p><p class="product-meta">${pills.map((pill) => `<span class="pill">${esc(pill)}</span>`).join('')}</p><div class="product-actions compact-actions"><a class="button-inline" href="${esc(product.url)}">View details</a><a class="button-inline ghost-inline" href="${esc(stockHref)}">Check stock</a></div></div></article>`;
}

function Card() {
  const stockHref = '/contact/?enquiry=stock&product=BT++Natural&productSlug=bt--natural&range=BT+&category=&source=%2F-flooring-sydney%2F';
  return `<article class="product-card catalogue-card"><img src="/assets/images/categories/-flooring-thumbnail.webp" alt=" BT  Natural  flooring colour swatch" loading="lazy" decoding="async"><div class="product-body"><p class="catalogue-overline">BT </p><h3>BT  Natural</h3><p>A natural  option for customers comparing practical timber-look alternatives.</p><p class="product-meta"><span class="pill"></span><span class="pill">Confirm specs</span></p><div class="product-actions compact-actions"><a class="button-inline" href="/-flooring-sydney/">View category</a><a class="button-inline ghost-inline" href="${stockHref}">Check stock</a></div></div></article>`;
}

const popularHtml = rangeIds.map((id) => rangeCard(byId(catalogue.ranges, id))).join('');
const featuredHtml = productIds.map((id) => productCard(byId(catalogue.products, id))).join('') + Card();

for (const file of ['products.html', 'products/index.html']) {
  let html = fs.readFileSync(file, 'utf8');
  html = html.replace(
    /<section class="section soft"><div class="shell"><div class="section-head"><div><p class="eyebrow">Popular ranges<\/p>[\s\S]*?<p class="section-action"><a class="button" href="\/ranges\/">View all flooring ranges<\/a><\/p><\/div><\/section>/,
    `<section class="section soft"><div class="shell"><div class="section-head"><div><p class="eyebrow">Popular ranges</p><h2>Popular flooring ranges</h2></div><p>Compare a short list of useful ranges first, then open the full range library when you are ready.</p></div><div class="grid-4">${popularHtml}</div><p class="section-action"><a class="button" href="/ranges/">View all flooring ranges</a></p></div></section>`
  );
  html = html.replace(
    /<section class="section catalogue-products"><div class="shell"><div class="section-head"><div><p class="eyebrow">Featured products<\/p>[\s\S]*?<\/div><\/div><\/section><section class="section soft"><div class="shell split-content">/,
    `<section class="section catalogue-products"><div class="shell"><div class="section-head"><div><p class="eyebrow">Featured products</p><h2>Featured colours across the catalogue</h2></div><p>A balanced sample across hybrid, laminate, engineered timber, solid timber and  enquiries.</p></div><div class="grid-4">${featuredHtml}</div></div></section><section class="section soft"><div class="shell split-content">`
  );
  fs.writeFileSync(file, html);
}
