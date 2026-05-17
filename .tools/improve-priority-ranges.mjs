import fs from 'node:fs';

const catalogue = JSON.parse(fs.readFileSync('data/product-catalogue.json', 'utf8'));
const priority = ['avala', 'artisan-tile', 'aqua-wood-plus-12mm', 'botanica', 'swish-oak-natura'];

const esc = (value = '') => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;');

const categoryLabel = (category = '') => {
  if (category === 'Hybrid') return 'Hybrid Flooring';
  if (category === 'Laminate') return 'Laminate Flooring';
  if (category === 'Engineered timber') return 'Engineered Timber Flooring';
  if (category === 'Solid timber') return 'Solid Timber Flooring';
  return `${category} Flooring`.trim();
};

for (const id of priority) {
  const range = catalogue.ranges.find((item) => item.id === id);
  if (!range) continue;
  const file = `ranges/${range.slug}/index.html`;
  if (!fs.existsSync(file)) continue;
  let html = fs.readFileSync(file, 'utf8');
  const title = `${range.name} ${categoryLabel(range.category)} Range | ${range.supplier || range.brand} | Oz Timber Floor`;
  const meta = `Browse ${range.supplier || range.brand} ${range.name} ${range.category.toLowerCase()} colours, specs and stock enquiries in Sydney. Ask Oz Timber Floor for supply-only or supply + install support.`;
  html = html.replace(/<title>.*?<\/title>/, `<title>${esc(title)}</title>`);
  html = html.replace(/<meta name="description" content=".*?">/, `<meta name="description" content="${esc(meta)}">`);
  html = html.replace(/<meta property="og:title" content=".*?">/, `<meta property="og:title" content="${esc(title)}">`);
  html = html.replace(/<meta property="og:description" content=".*?">/, `<meta property="og:description" content="${esc(meta)}">`);
  html = html.replace(/<p class="eyebrow">([^<]*?) range<\/p><h1>/, `<p class="eyebrow">${esc(range.supplier || range.brand)} ${esc(range.category.toLowerCase())} range</p><h1>`);
  html = html.replace(/<img src="([^"]+)" alt="([^"]*?) flooring range"/, `<img src="$1" alt="${esc(`${range.supplier || range.brand} ${range.name} ${range.category.toLowerCase()} range colour swatch`)}"`);
  html = html.replace(/<strong>Product range<\/strong>/, `<strong>${esc(range.supplier || range.brand)}</strong>`);
  fs.writeFileSync(file, html);
}
