import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const dataPath = path.join(root, 'data/product-catalogue.json');
const redirectsPath = path.join(root, '_redirects');
const reportPath = path.join(root, 'docs/range_product_catalogue_cleanup_report.md');
const qaPath = path.join(root, 'docs/range_product_data_audit.md');
const productPageAuditPath = path.join(root, 'docs/product_page_consistency_audit.md');

const siteUrl = 'https://oztimberfloor.com.au';

const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
let ranges = data.ranges || [];
const products = data.products || [];

const cleanEarly = (value) => String(value || '').trim();
const productBySlug = new Map(products.map((product) => [product.slug, product]));
const titleCaseFromSlug = (slug) =>
  String(slug || '')
    .split('-')
    .filter(Boolean)
    .map((word) => (/^\d/.test(word) ? word : word.charAt(0).toUpperCase() + word.slice(1)))
    .join(' ')
    .replace(/\bMm\b/g, 'mm')
    .replace(/\bSpc\b/g, 'SPC')
    .replace(/\bWpc\b/g, 'WPC')
    .replace(/\bEtf\b/g, 'ETF');

const explicitRangeAliases = {
  'artisan-hybrid-tile': 'artisan-tile',
  'artisan-oak': 'artisan-tile',
  'aspire-classic-width': 'aspire',
  'aspire-hybrid': 'aspire',
  'aspire-super-width': 'aspire',
  'avala-hybrid-planks': 'avala',
  'elite-6mm-hybrid': 'elite-6-0-hybrid',
  'etf-7mm-waterproof-hybrid': 'etf-7-0mm-hybrid',
  'etf-8mm-waterproof-hybrid': 'etf-8-0mm-hybrid',
  'etf-9mm-waterproof-hybrid': 'etf-9-0mm-hybrid',
  'etf-12mm-water-resistant-laminate': 'etf-12mm-laminate',
  'grande-7-5mm-hybrid': 'grande-7-5-hybrid',
  'grande-9mm-hybrid': 'grande-9-0-hybrid',
  'herringbone-7mm-hybrid': 'herringbone-7-0-hybrid',
  'infinite-laminate': 'infinite',
  'oakstep-laminate': 'oak-step',
  'ornato-hybrid': 'ornato-vinyl',
  'pantora-amor-collection': 'pantora-amor',
  'pantora-lifestyle-collection': 'pantora-lifestyle',
  'prime-contemporary-plus-edition': 'prime-contemporary-plus',
  'prime-deluxe-edition': 'prime-deluxe',
  'prime-legend-collection': 'prime-legend',
  'prime-luxury-edition': 'prime-luxury',
  'reflections-laminate': 'reflections',
  'storm-luxury-hybrid-planks': 'storm-luxury',
  'swish-aquastop-laminate': 'swish-laminate-aqua',
  'swish-laminate-classic': 'swish-laminate',
  'urban-6-5mm-hybrid': 'urban-6-5-hybrid',
  'villeroy-boch-aquastop': 'villeroy-boch-aquastop-8mm',
  'villeroy-boch-contemporary-laminate': 'villeroy-and-boch-contemporary',
  'villeroy-boch-cosmopolitan-laminate': 'villeroy-and-boch-cosmopolitan',
  'villeroy-boch-country-laminate': 'villeroy-and-boch-country',
  'villeroy-boch-heritage-laminate': 'villeroy-and-boch-heritage',
  'xxl-8mm-hybrid': 'xxl-8-0-hybrid',
};

function inferCategoryFromText(text) {
  const lower = String(text || '').toLowerCase();
  if (lower.includes('laminate')) return 'Laminate';
  if (lower.includes('engineered')) return 'Engineered timber';
  if (lower.includes('solid') || lower.includes('hardwood') || lower.includes('raw-timber')) return 'Solid timber';
  if (lower.includes('vinyl') || lower.includes('wpc')) return 'Vinyl';
  return 'Hybrid';
}

function inferFallbackRange(slug) {
  const file = path.join(root, 'ranges', slug, 'index.html');
  const html = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '';
  const titleName = cleanEarly(html.match(/<title>(.*?)\s+(Hybrid|Laminate|Engineered timber|Solid timber|Vinyl)\s+Range/i)?.[1]);
  const h1 = cleanEarly(html.match(/<h1>(.*?)<\/h1>/i)?.[1])
    .replace(/\s+(hybrid|laminate|engineered timber|solid timber|vinyl)?\s*flooring range$/i, '');
  const name = titleName || h1 || titleCaseFromSlug(slug);
  const category = inferCategoryFromText(`${slug} ${html.match(/<p class="eyebrow">(.*?)<\/p>/i)?.[1] || ''} ${html.match(/<title>(.*?)<\/title>/i)?.[1] || ''}`);
  const productSlugs = Array.from(new Set([...html.matchAll(/href="\/products\/([^/"#?]+)\//g)].map((match) => match[1]).filter((productSlug) => productBySlug.has(productSlug))));
  const sourceProduct = productSlugs.map((productSlug) => productBySlug.get(productSlug)).find(Boolean);
  return {
    id: slug,
    slug,
    url: `/ranges/${slug}/`,
    name,
    rangeName: name,
    supplier: sourceProduct?.supplier || '',
    brand: sourceProduct?.brand || '',
    category,
    shortDescription: '',
    thickness: sourceProduct?.thickness || '',
    boardSize: sourceProduct?.boardSize || '',
    packSizeM2: sourceProduct?.packSizeM2 || '',
    installationMethod: sourceProduct?.installationMethod || '',
    colourCount: productSlugs.length || '',
    warrantySummary: sourceProduct?.warrantySummary || '',
    finish: sourceProduct?.finish || '',
    productSlugs,
    heroImage: sourceProduct?.primaryImage || '/assets/products/coming-soon/image-coming-soon.svg',
    primaryImage: sourceProduct?.primaryImage || '/assets/products/coming-soon/image-coming-soon.svg',
    thumbnailImage: sourceProduct?.primaryImage || '/assets/products/coming-soon/image-coming-soon.svg',
    publicCatalogueStatus: explicitRangeAliases[slug] ? 'legacy-alias' : 'partial',
    visibleInRangeLibrary: !explicitRangeAliases[slug],
    preferredRangeSlug: explicitRangeAliases[slug] || '',
    catalogueNote: 'Inferred from existing range page during catalogue cleanup.',
    lastCatalogueReview: '2026-05-17',
  };
}

const physicalRangeSlugs = fs.existsSync(path.join(root, 'ranges'))
  ? fs.readdirSync(path.join(root, 'ranges')).filter((slug) => fs.existsSync(path.join(root, 'ranges', slug, 'index.html')) && slug !== 'index.html')
  : [];
const knownRangeSlugs = new Set(ranges.map((range) => range.slug));
for (const slug of physicalRangeSlugs) {
  if (!knownRangeSlugs.has(slug)) {
    ranges.push(inferFallbackRange(slug));
    knownRangeSlugs.add(slug);
  }
}
data.ranges = ranges;

const rangeBySlug = new Map(ranges.map((range) => [range.slug, range]));

const firstHtml = fs.readFileSync(path.join(root, 'ranges/artisan-tile/index.html'), 'utf8');
const sharedHeader = firstHtml.match(/<header class="site-header">[\s\S]*?<\/header>/)?.[0] || '';
const sharedFooter = firstHtml.match(/<footer class="site-footer">[\s\S]*?<\/footer>/)?.[0] || '';

const escapeHtml = (value = '') =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const escapeAttr = escapeHtml;
const encode = (value = '') => encodeURIComponent(String(value));
const clean = (value) => String(value || '').trim();
const compact = (items) => items.filter((item) => clean(item));
const fileExists = (src) => src && src.startsWith('/') && fs.existsSync(path.join(root, src.replace(/^\//, '')));
const isPlaceholder = (src) => !src || /coming-soon|placeholder|dummy|fallback/i.test(src);
const hasRealImage = (src) => fileExists(src) && !isPlaceholder(src);
const stripCategory = (category = '') => String(category).toLowerCase().replace(/\s+/g, '-');
const categoryPage = (category = '') => {
  const key = stripCategory(category);
  if (key.includes('engineered')) return '/engineered-timber-flooring-sydney/';
  if (key.includes('solid') || key.includes('hardwood')) return '/solid-timber-flooring-sydney/';
  if (key.includes('laminate')) return '/laminate-flooring-sydney/';
  if (key.includes('vinyl')) return '/vinyl-flooring-sydney/';
  return '/hybrid-flooring-sydney/';
};

function parsePreferred(preferred) {
  if (!preferred) return [];
  return String(preferred)
    .split('/')
    .map((part) => part.trim())
    .filter((slug) => rangeBySlug.has(slug));
}

function canonicalSlug(range) {
  const preferred = parsePreferred(range.preferredRangeSlug);
  return preferred[0] || range.slug;
}

function canonicalRange(range) {
  return rangeBySlug.get(canonicalSlug(range)) || range;
}

function rangeProducts(range) {
  const sourceRange = canonicalRange(range);
  const slugs = Array.from(new Set([...(sourceRange.productSlugs || []), ...(sourceRange.products || [])]));
  return slugs.map((slug) => productBySlug.get(slug)).filter(Boolean);
}

function displayNameWithCategory(range) {
  const name = clean(range.name || range.rangeName || range.slug);
  const category = clean(range.category);
  const lower = name.toLowerCase();
  if (!category) return `${name} flooring range`;
  if (lower.includes(category.toLowerCase().split(' ')[0])) return `${name} flooring range`;
  return `${name} ${category.toLowerCase()} flooring range`;
}

function categoryDescription(range) {
  const name = clean(range.name || range.rangeName);
  const cat = clean(range.category).toLowerCase();
  const existing = clean(range.shortDescription || range.longDescription);
  if (/tile|stone|marble|concrete/i.test(`${name} ${existing}`) && cat.includes('hybrid')) {
    return `${name} is a tile-look hybrid range for customers comparing stone, marble or concrete-look styles. Oz Timber Floor can help confirm stock, colour samples and installation suitability before order.`;
  }
  if (cat.includes('laminate')) {
    return `${name} is a laminate flooring range for dry internal rooms where customers want to compare timber-look colours, specifications and stock before ordering.`;
  }
  if (cat.includes('engineered')) {
    return `${name} is an engineered timber range for customers wanting a real timber surface, with subfloor condition and installation method confirmed early.`;
  }
  if (cat.includes('solid') || cat.includes('hardwood')) {
    return `${name} is a real timber flooring range where species, finish, site preparation and installation suitability should be checked before order.`;
  }
  if (cat.includes('vinyl')) {
    return `${name} is a vinyl flooring range for practical interiors where colour, stock and installation suitability should be confirmed before order.`;
  }
  if (cat.includes('hybrid')) {
    return `${name} is a timber-look hybrid flooring range for customers comparing practical colours, stock and installation suitability before order.`;
  }
  return existing || `${name} flooring colours, specifications and enquiry options for Sydney flooring projects.`;
}

function fitCards(range) {
  const cat = clean(range.category).toLowerCase();
  const name = clean(range.name || range.rangeName);
  if (/tile|stone|marble|concrete/i.test(name) && cat.includes('hybrid')) {
    return [
      ['Stone-look colour comparison', 'Homeowners comparing stone, marble or concrete-look hybrid colours before confirming stock.'],
      ['Supply-only planning', 'Projects where colour, batch, quantity and lead time should be checked before payment.'],
      ['Supply + install review', 'Jobs where floor levels, trims or preparation may affect the final quote.'],
    ];
  }
  if (cat.includes('laminate')) {
    return [
      ['Dry internal rooms', 'Bedrooms, living areas and other dry internal rooms where a timber-look floor is preferred.'],
      ['Budget-aware renovations', 'Rental upgrades and home improvements where colour and stock should be confirmed first.'],
      ['Supply or installation support', 'Projects where product suitability, underlay and installation method should be checked before ordering.'],
    ];
  }
  if (cat.includes('engineered')) {
    return [
      ['Real timber surface', 'Customers wanting natural timber character for premium homes or office interiors.'],
      ['Early subfloor review', 'Projects where subfloor condition and installation method should be confirmed early.'],
      ['Supply or supply + install', 'Jobs where colour batch, lead time, trims and delivery access need clear planning.'],
    ];
  }
  if (cat.includes('solid') || cat.includes('hardwood')) {
    return [
      ['Real hardwood projects', 'Homes and projects where species, finish and installation method need careful confirmation.'],
      ['Installation planning', 'Jobs where moisture, acclimatisation, access and finishing details should be reviewed early.'],
      ['Supply enquiries', 'Customers comparing species and quantities before checking current availability.'],
    ];
  }
  if (cat.includes('vinyl')) {
    return [
      ['Practical interiors', 'Rooms where a vinyl flooring option is being compared for colour, durability needs and budget.'],
      ['Supply-only enquiries', 'Customers who need stock, batch and quantity checked before ordering.'],
      ['Installation review', 'Jobs where subfloor condition and transitions should be checked before quote finalisation.'],
    ];
  }
  return [
    ['Colour comparison', 'Customers comparing flooring colours and key specifications before asking about stock.'],
    ['Supply-only enquiries', 'Projects where batch, quantity, suburb and delivery timing should be confirmed.'],
    ['Supply + install', 'Jobs where floor preparation, access, trims and timing should be reviewed before quote finalisation.'],
  ];
}

function confirmCards() {
  return [
    ['Stock, batch and specifications', 'Current stock, colour batch and product specifications should be checked before payment.'],
    ['Floor condition', 'Floor flatness, moisture, trims and transitions should be reviewed before installation.'],
    ['Room and site suitability', 'Some rooms or site conditions may need preparation before this range is suitable.'],
  ];
}

function productImage(product) {
  const gallery = Array.isArray(product.imageGallery) ? product.imageGallery : [];
  return compact([product.primaryImage, ...gallery])[0];
}

function rangeImage(range) {
  const productsForRange = rangeProducts(range);
  return compact([
    range.heroImage,
    range.primaryImage,
    range.thumbnailImage,
    productImage(productsForRange.find((product) => hasRealImage(productImage(product))) || {}),
  ]).find(hasRealImage);
}

function specRows(range, productList) {
  const rows = [
    ['Category', range.category],
    ['Range', range.name || range.rangeName],
    ['Thickness', range.thickness],
    ['Board size', range.boardSize],
    ['Installation method', range.installationMethod],
    ['Surface / finish', range.finish],
    ['Colour count', range.colourCount || productList.length],
    ['Warranty', range.warrantySummary],
  ];
  return rows.filter(([, value]) => {
    const v = clean(value);
    return v && !/confirm product details before order|confirm before order|unknown|n\/a/i.test(v);
  });
}

function contactUrl(type, params) {
  const entries = Object.entries({ enquiry: type, ...params }).filter(([, value]) => clean(value));
  return `/contact/?${entries.map(([key, value]) => `${encode(key)}=${encode(value)}`).join('&amp;')}`;
}

function colourCard(product, range, pageSlug) {
  const category = clean(product.category || range.category);
  const img = productImage(product);
  const imageHtml = hasRealImage(img)
    ? `<img src="${escapeAttr(img)}" alt="${escapeAttr(product.altText || `${range.name} ${product.colour || product.name} ${category.toLowerCase()} flooring colour swatch`)}" loading="lazy" decoding="async">`
    : `<div class="missing-image-state colour-missing"><span>Colour image to confirm</span><small>Ask us for the current supplier sample.</small></div>`;
  const pills = compact([category, product.thickness || range.thickness, product.boardSize || range.boardSize])
    .slice(0, 3)
    .map((pill) => `<span class="pill">${escapeHtml(pill)}</span>`)
    .join('');
  const params = {
    product: product.name,
    productSlug: product.slug,
    range: range.name,
    category,
    source: `/ranges/${pageSlug}/`,
  };
  return `<article class="product-card catalogue-card">${imageHtml}<div class="product-body"><p class="catalogue-overline">${escapeHtml(range.name)}</p><h3>${escapeHtml(product.name)}</h3><p class="product-meta">${pills}</p><div class="product-actions compact-actions"><a class="button-inline" href="/products/${escapeAttr(product.slug)}/">View details</a><a class="button-inline ghost-inline" href="${contactUrl('stock', params)}">Check stock</a><a class="button-inline ghost-inline" href="${contactUrl('supply-install', params)}">Supply + install</a></div></div></article>`;
}

function relatedRanges(range) {
  const current = canonicalSlug(range);
  const seen = new Set([current]);
  const candidates = ranges
    .map((candidate) => canonicalRange(candidate))
    .filter((candidate) => {
      const slug = candidate.slug;
      if (seen.has(slug)) return false;
      seen.add(slug);
      return clean(candidate.name) && candidate.visibleInRangeLibrary !== false && candidate.publicCatalogueStatus !== 'legacy-hidden';
    })
    .sort((a, b) => {
      const sameA = a.category === range.category ? 0 : 1;
      const sameB = b.category === range.category ? 0 : 1;
      if (sameA !== sameB) return sameA - sameB;
      const imageA = rangeImage(a) ? 0 : 1;
      const imageB = rangeImage(b) ? 0 : 1;
      if (imageA !== imageB) return imageA - imageB;
      return String(a.name).localeCompare(String(b.name));
    });
  return candidates.slice(0, 6);
}

function relatedCard(range) {
  const img = rangeImage(range);
  const imageHtml = img
    ? `<img class="category-thumb" src="${escapeAttr(img)}" alt="${escapeAttr(`${range.name} ${range.category.toLowerCase()} flooring range`)}" loading="lazy" decoding="async">`
    : `<div class="missing-image-state range-missing"><span>Range image to confirm</span><small>Ask us to confirm current samples.</small></div>`;
  const pills = compact([range.category, range.thickness, `${range.colourCount || rangeProducts(range).length || 'Several'} colours`])
    .slice(0, 3)
    .map((pill) => `<span class="pill">${escapeHtml(pill)}</span>`)
    .join('');
  return `<article class="card range-summary-card">${imageHtml}<p class="catalogue-overline">${escapeHtml(range.category)}</p><h3>${escapeHtml(range.name)}</h3><p>${escapeHtml(categoryDescription(range))}</p><p class="product-meta">${pills}</p><a class="card-link" href="/ranges/${escapeAttr(range.slug)}/">View range</a></article>`;
}

function faqSchema(range) {
  return [
    {
      '@type': 'Question',
      name: `Can Oz Timber Floor supply ${range.name} without installation?`,
      acceptedAnswer: { '@type': 'Answer', text: 'Yes. Send a supply-only enquiry with the preferred colour, quantity and suburb so stock, batch and lead time can be checked.' },
    },
    {
      '@type': 'Question',
      name: `Can ${range.name} be quoted with installation?`,
      acceptedAnswer: { '@type': 'Answer', text: 'Yes. Include your suburb, approximate area, current floor and access details so preparation and installation scope can be reviewed.' },
    },
    {
      '@type': 'Question',
      name: `Should I choose a colour before checking stock?`,
      acceptedAnswer: { '@type': 'Answer', text: 'You can shortlist colours first, but current stock, batch and product details should be confirmed before final ordering.' },
    },
  ];
}

function buildPage(pageRange) {
  const range = canonicalRange(pageRange);
  const pageSlug = pageRange.slug;
  const canonical = `/ranges/${range.slug}/`;
  const productList = rangeProducts(range);
  const category = clean(range.category || 'Flooring');
  const title = `${range.name} ${category} Range | Oz Timber Floor`;
  const meta = `Browse ${range.name} ${category.toLowerCase()} colours, specs and stock enquiries in Sydney. Ask Oz Timber Floor for supply-only or supply + install support.`;
  const heroImg = rangeImage(range);
  const heroImageHtml = heroImg
    ? `<img src="${escapeAttr(heroImg)}" alt="${escapeAttr(`${range.name} ${category.toLowerCase()} flooring range image`)}" loading="lazy" decoding="async">`
    : `<div class="missing-image-state hero-missing"><span>Range image to confirm</span><small>Ask us for current supplier samples.</small></div>`;
  const specs = specRows(range, productList);
  const specHtml = specs.length
    ? `<div class="spec-grid">${specs.map(([label, value]) => `<div class="spec-item"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></div>`).join('')}</div><p class="spec-note">Final stock, batch, warranty and product specifications are confirmed before order.</p>`
    : `<div class="missing-range-data"><p>Specification to confirm before ordering.</p><p class="spec-note">Final stock, batch, warranty and product specifications are confirmed before order.</p></div>`;
  const colourHtml = productList.length
    ? productList.map((product) => colourCard(product, range, range.slug)).join('')
    : `<div class="missing-range-data"><p>Colour image to confirm — ask us for current supplier samples and available colours.</p></div>`;
  const fitHtml = fitCards(range).map(([heading, text]) => `<article class="fit-card"><span class="insight-label">Best suited</span><h3>${escapeHtml(heading)}</h3><p>${escapeHtml(text)}</p></article>`).join('');
  const confirmHtml = confirmCards().map(([heading, text]) => `<article class="caution-card"><span class="insight-label">Confirm</span><h3>${escapeHtml(heading)}</h3><p>${escapeHtml(text)}</p></article>`).join('');
  const related = relatedRanges(range);
  const rangeParams = { range: range.name, category, source: `/ranges/${range.slug}/` };
  const schema = [
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: `${siteUrl}/` },
        { '@type': 'ListItem', position: 2, name: 'Products', item: `${siteUrl}/products/` },
        { '@type': 'ListItem', position: 3, name: 'Ranges', item: `${siteUrl}/ranges/` },
        { '@type': 'ListItem', position: 4, name: range.name, item: `${siteUrl}${canonical}` },
      ],
    },
    { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: faqSchema(range) },
  ];

  return `<!DOCTYPE html>
<html lang="en-AU">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeAttr(meta)}">
  <link rel="canonical" href="${siteUrl}${canonical}">
  <link rel="icon" href="/assets/brand/favicon-32.png" sizes="32x32" type="image/png">
  <link rel="apple-touch-icon" href="/assets/brand/apple-touch-icon.png">
  <meta name="robots" content="index,follow">
  <meta property="og:type" content="website">
  <meta property="og:title" content="${escapeAttr(title)}">
  <meta property="og:description" content="${escapeAttr(meta)}">
  <meta property="og:url" content="${siteUrl}${canonical}">
  <link rel="stylesheet" href="/assets/site.css">
  <script src="/assets/contact-config.js" defer></script>
  <script src="/assets/site.js" defer></script>
  <script type="application/ld+json">${JSON.stringify(schema)}</script>
</head>
<body>
${sharedHeader}
<main>
  <section class="section slim-breadcrumbs">
    <div class="shell">
      <nav class="breadcrumbs" aria-label="Breadcrumb"><a href="/">Home</a><span>›</span><a href="/products/">Products</a><span>›</span><a href="/ranges/">Ranges</a><span>›</span><span>${escapeHtml(range.name)}</span></nav>
    </div>
  </section>
  <section class="hero range-hero">
    <div class="shell hero-grid">
      <div>
        <p class="eyebrow">${escapeHtml(category)} range</p>
        <h1>${escapeHtml(displayNameWithCategory(range))}</h1>
        <p class="lead">${escapeHtml(categoryDescription(range))}</p>
        <div class="button-row"><a class="button" href="#colours">View colours</a><a class="button-secondary" href="${contactUrl('stock', rangeParams)}">Ask about this range</a></div>
      </div>
      <div class="hero-media">${heroImageHtml}<div class="hero-badge"><span>${escapeHtml(category)}</span>${range.thickness ? `<span>${escapeHtml(range.thickness)}</span>` : ''}<span>${escapeHtml(range.colourCount || productList.length || 'Colours to confirm')} colours</span></div></div>
    </div>
  </section>
  <section class="section catalogue-products" id="colours">
    <div class="shell">
      <div class="section-head"><div><p class="eyebrow">Available colours</p><h2>${escapeHtml(range.name)} colours</h2></div><p>Open a colour page for full enquiry options, check stock directly from the colour card, or request supply + install support.</p></div>
      <div class="grid-3">${colourHtml}</div>
    </div>
  </section>
  <section class="section soft catalogue-specs">
    <div class="shell">
      <div class="section-head"><div><p class="eyebrow">Quick specs</p><h2>${escapeHtml(range.name)} specifications</h2></div><p>Known specifications are shown here. Anything not listed should be confirmed before order.</p></div>
      ${specHtml}
    </div>
  </section>
  <section class="section">
    <div class="shell">
      <div class="section-head"><div><p class="eyebrow">Project fit</p><h2>Best suited for</h2></div><p>Use these notes to decide whether this range belongs on your shortlist before checking colour, stock and installation details.</p></div>
      <div class="fit-grid">${fitHtml}</div>
    </div>
  </section>
  <section class="section soft">
    <div class="shell">
      <div class="section-head"><div><p class="eyebrow">Before ordering</p><h2>Confirm before ordering</h2></div><p>These checks help keep product choice, site conditions and installation expectations clear.</p></div>
      <div class="caution-grid">${confirmHtml}</div>
    </div>
  </section>
  <section class="section range-preparation">
    <div class="shell">
      <div class="section-head"><div><p class="eyebrow">Before choosing this range</p><h2>Check the floor condition first</h2></div><p>Before confirming this range, we recommend checking subfloor flatness, moisture, trims, transitions and site access. These details can affect installation method, timing and preparation cost.</p></div>
      <p>For apartments, builder projects and commercial jobs, delivery access, staging and handover timing should be confirmed early.</p>
      <div class="range-help-box"><h3>Need help checking this range?</h3><p>Send us your room size, photos or floor plan. Oz Timber Floor can confirm whether this range is suitable before you order.</p><div class="button-row"><a class="button" href="${contactUrl('stock', rangeParams)}">Check this range</a><a class="button-secondary" href="${contactUrl('supply-install', rangeParams)}">Request supply + install quote</a></div><p class="section-action"><a href="/floor-levelling-sydney/">Floor levelling Sydney</a></p></div>
    </div>
  </section>
  <section class="section soft">
    <div class="shell">
      <div class="section-head"><div><p class="eyebrow">Related ranges</p><h2>Compare nearby options</h2></div><p>Similar ranges are grouped by category first and exclude duplicate versions of this range.</p></div>
      <div class="grid-3">${related.map(relatedCard).join('')}</div>
    </div>
  </section>
  <section class="section" id="faqs">
    <div class="shell">
      <div class="section-head"><div><p class="eyebrow">FAQ</p><h2>Questions about ${escapeHtml(range.name)}</h2></div></div>
      <div class="faq-list">
        <details class="faq-item"><summary>Can Oz Timber Floor supply ${escapeHtml(range.name)} without installation?</summary><div><p>Yes. Send a supply-only enquiry with the preferred colour, quantity and suburb so stock, batch and lead time can be checked.</p></div></details>
        <details class="faq-item"><summary>Can ${escapeHtml(range.name)} be quoted with installation?</summary><div><p>Yes. Include your suburb, approximate area, current floor and access details so preparation and installation scope can be reviewed.</p></div></details>
        <details class="faq-item"><summary>Should I choose a colour before checking stock?</summary><div><p>You can shortlist colours first, but current stock, batch and product details should be confirmed before final ordering.</p></div></details>
      </div>
    </div>
  </section>
  <section class="section soft">
    <div class="shell cta">
      <p class="eyebrow">Range enquiry</p>
      <h2>Ready to ask about ${escapeHtml(range.name)}?</h2>
      <p>Send the range name, preferred colours, suburb, approximate area and whether you need supply-only, stock check or supply + install support.</p>
      <div class="button-row"><a class="button" href="${contactUrl('supply-only', rangeParams)}">Request supply price</a><a class="button-secondary" href="${contactUrl('stock', rangeParams)}">Check stock availability</a><a class="button-secondary" href="${contactUrl('supply-install', rangeParams)}">Request supply + install quote</a></div>
    </div>
  </section>
</main>
${sharedFooter}
</body>
</html>
`;
}

const duplicateNames = new Map();
const duplicateSlugs = new Map();
const canonicalGroups = new Map();
const categoryMismatches = [];
const brokenImages = [];
const missingImages = [];
const missingSpecs = [];
const redirectAliases = [];
const productPageIssues = [];

for (const range of ranges) {
  duplicateNames.set(String(range.name || '').toLowerCase(), [...(duplicateNames.get(String(range.name || '').toLowerCase()) || []), range.slug]);
  duplicateSlugs.set(range.slug, [...(duplicateSlugs.get(range.slug) || []), range.name]);
  const canonical = canonicalSlug(range);
  canonicalGroups.set(canonical, [...(canonicalGroups.get(canonical) || []), range.slug]);
  if (range.slug !== canonical) redirectAliases.push([range.slug, canonical]);
  const realRange = canonicalRange(range);
  const productList = rangeProducts(realRange);
  for (const product of productList) {
    if (clean(product.category) && clean(realRange.category) && product.category !== realRange.category) {
      categoryMismatches.push([realRange.slug, product.slug, product.category, realRange.category]);
    }
    const img = productImage(product);
    if (!hasRealImage(img)) missingImages.push([realRange.slug, product.slug, img || '']);
    else if (!fileExists(img)) brokenImages.push([realRange.slug, product.slug, img]);
  }
  const img = rangeImage(realRange);
  if (!img) missingImages.push([realRange.slug, '(range hero)', clean(realRange.heroImage || realRange.primaryImage || realRange.thumbnailImage)]);
  for (const field of ['thickness', 'boardSize', 'installationMethod']) {
    if (!clean(realRange[field])) missingSpecs.push([realRange.slug, field]);
  }
}

for (const product of products) {
  const file = path.join(root, 'products', product.slug, 'index.html');
  const pageExists = fs.existsSync(file);
  const parentRange = rangeBySlug.get(product.rangeSlug);
  const productImagePath = productImage(product);
  if (!pageExists) productPageIssues.push([product.slug, 'missing product page', product.url || '']);
  if (!hasRealImage(productImagePath)) productPageIssues.push([product.slug, 'missing or placeholder product image', productImagePath || '']);
  if (productImagePath && !isPlaceholder(productImagePath) && !fileExists(productImagePath)) productPageIssues.push([product.slug, 'broken product image path', productImagePath]);
  if (!parentRange) productPageIssues.push([product.slug, 'parent range missing from mapping', product.rangeSlug || product.range || '']);
  if (parentRange && clean(product.category) && clean(parentRange.category) && product.category !== parentRange.category) {
    productPageIssues.push([product.slug, 'product category differs from parent range', `${product.category} vs ${parentRange.category}`]);
  }
  if (pageExists) {
    const html = fs.readFileSync(file, 'utf8');
    if (!html.includes(`<link rel="canonical" href="${siteUrl}/products/${product.slug}/"`)) {
      productPageIssues.push([product.slug, 'canonical does not match product slug', product.canonicalUrl || '']);
    }
    if (!html.includes('Check stock') || !html.includes('Request supply price') || !html.includes('Request supply + install')) {
      productPageIssues.push([product.slug, 'missing expected enquiry CTA', 'Check stock / supply price / supply + install']);
    }
    if (product.rangeSlug && !html.includes(`/ranges/${product.rangeSlug}/`)) {
      productPageIssues.push([product.slug, 'missing link back to parent range', product.rangeSlug]);
    }
    if (product.category && !html.includes(categoryPage(product.category))) {
      productPageIssues.push([product.slug, 'missing link back to category page', categoryPage(product.category)]);
    }
  }
}

for (const range of ranges) {
  const dir = path.join(root, 'ranges', range.slug);
  if (!fs.existsSync(dir)) continue;
  fs.writeFileSync(path.join(dir, 'index.html'), buildPage(range));
}

const existingRedirects = fs.existsSync(redirectsPath) ? fs.readFileSync(redirectsPath, 'utf8') : '';
const redirectLines = redirectAliases
  .filter(([from, to]) => !existingRedirects.includes(`/ranges/${from}/ /ranges/${to}/ 301`))
  .map(([from, to]) => `/ranges/${from}/ /ranges/${to}/ 301`);
if (redirectLines.length) {
  fs.writeFileSync(redirectsPath, `${existingRedirects.trimEnd()}\n\n# Range canonical aliases\n${redirectLines.join('\n')}\n`);
}

const duplicateNameRows = [...duplicateNames.entries()].filter(([name, slugs]) => name && slugs.length > 1);
const duplicateSlugRows = [...duplicateSlugs.entries()].filter(([, names]) => names.length > 1);
const canonicalAliasRows = [...canonicalGroups.entries()].filter(([, slugs]) => slugs.length > 1);

const renderRows = (rows, headers) => {
  if (!rows.length) return '_None found._\n';
  return `| ${headers.join(' | ')} |\n| ${headers.map(() => '---').join(' | ')} |\n${rows.map((row) => `| ${row.map((cell) => escapeHtml(cell)).join(' | ')} |`).join('\n')}\n`;
};

const qa = `# Range + Product Data Audit

Generated: ${new Date().toISOString()}

## Duplicate Range Names

${renderRows(duplicateNameRows.map(([name, slugs]) => [name, slugs.join(', ')]), ['range name', 'slugs'])}

## Duplicate Slugs

${renderRows(duplicateSlugRows.map(([slug, names]) => [slug, names.join(', ')]), ['slug', 'names'])}

## Canonical Alias Groups

${renderRows(canonicalAliasRows.map(([canonical, slugs]) => [canonical, slugs.join(', ')]), ['canonical slug', 'alias pages'])}

## Category Mismatches

${renderRows(categoryMismatches.slice(0, 200), ['range', 'product', 'product category', 'range category'])}

## Missing Or Placeholder Images

${renderRows(missingImages.slice(0, 250), ['range', 'product', 'current image'])}

## Broken Image Paths

${renderRows(brokenImages.slice(0, 250), ['range', 'product', 'image path'])}

## Missing Core Specs

${renderRows(missingSpecs.slice(0, 250), ['range', 'field'])}

## Manual Review Notes

- Alias pages with multiple preferred targets, such as broad collection pages, were kept as pages but canonicalised to the first verified child range when one explicit slug existed in data.
- Product pages with missing supplier images still need supplier-source review before production photography can be added.
- Category mismatches are listed for Vincent review unless the source data clearly identifies the corrected category.
`;

fs.writeFileSync(qaPath, qa);

const productAudit = `# Product Page Consistency Audit

Generated: ${new Date().toISOString()}

## Summary

- Product records checked: ${products.length}
- Product page issues flagged: ${productPageIssues.length}

## Issues

${renderRows(productPageIssues.slice(0, 400), ['product slug', 'issue', 'current value'])}

## Notes

- Missing or placeholder product images should be replaced only after supplier image/source verification.
- Product pages were audited for canonical URL, parent range link, category link, image path and core enquiry CTAs.
- No checkout, instant pricing or internal pricing fields were added.
`;

fs.writeFileSync(productPageAuditPath, productAudit);

const report = `# Range + Product Catalogue Cleanup Report

Generated: ${new Date().toISOString()}

## Work Completed In Order

1. Data audit completed across ${ranges.length} ranges and ${products.length} product colour records.
2. Canonical cleanup applied using existing preferred range slug data.
3. Image audit completed for range hero images and colour card images.
4. Range pages regenerated with this order: hero, available colours, quick specs, best suited for, confirm before ordering, preparation notes, related ranges, FAQ, final enquiry CTA.
5. CTA pathways upgraded for hero, colour cards, preparation section and final range enquiry.
6. SEO cleanup applied to title, meta description, canonical, clean breadcrumb and BreadcrumbList schema.

## Counts

- Range pages regenerated: ${ranges.length}
- Canonical alias groups found: ${canonicalAliasRows.length}
- Alias redirects present: ${redirectAliases.length}
- New alias redirects added on this run: ${redirectLines.length}
- Product-to-range category mismatches flagged: ${categoryMismatches.length}
- Missing or placeholder product/range images flagged: ${missingImages.length}
- Broken image paths flagged: ${brokenImages.length}
- Missing core spec fields flagged: ${missingSpecs.length}
- Product page issues flagged: ${productPageIssues.length}

## Key Canonical Decisions

${canonicalAliasRows.map(([canonical, slugs]) => `- ${canonical}: ${slugs.join(', ')}`).join('\n') || '- None.'}

## Remaining Manual Data Gaps

- Missing supplier images need source verification before adding local WebP assets.
- Missing thickness, board size or installation method should stay blank until supplier documentation confirms them.
- Broad collection pages with multiple possible preferred targets should be reviewed before adding stronger redirects.
- Product page consistency details are listed in docs/product_page_consistency_audit.md.
`;

fs.writeFileSync(reportPath, report);

for (const range of ranges) {
  range.canonicalName = canonicalRange(range).name;
  range.canonicalSlug = canonicalSlug(range);
  const img = rangeImage(canonicalRange(range));
  const missingCoreSpec = ['thickness', 'boardSize', 'installationMethod'].some((field) => !clean(canonicalRange(range)[field]));
  range.status = img ? (missingCoreSpec ? 'partial' : 'verified') : 'missing-images';
  range.relatedRanges = relatedRanges(canonicalRange(range)).map((related) => related.slug);
}

fs.writeFileSync(dataPath, `${JSON.stringify(data, null, 2)}\n`);

console.log(JSON.stringify({
  rangesRegenerated: ranges.length,
  canonicalAliasGroups: canonicalAliasRows.length,
  redirectLinesAdded: redirectLines.length,
  categoryMismatches: categoryMismatches.length,
  missingImages: missingImages.length,
  brokenImages: brokenImages.length,
  missingSpecs: missingSpecs.length,
  productPageIssues: productPageIssues.length,
  reports: [qaPath, productPageAuditPath, reportPath],
}, null, 2));
