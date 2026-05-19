import fs from "node:fs";

const catalogue = JSON.parse(fs.readFileSync("data/product-catalogue.json", "utf8"));
const sourceHtml = fs.readFileSync("products/index.html", "utf8");

const header = sourceHtml.match(/<header class="site-header">[\s\S]*?<\/header>/)?.[0] || "";
const footer = sourceHtml.match(/<footer class="site-footer">[\s\S]*?<\/footer>/)?.[0] || "";

const esc = (value = "") => String(value)
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;");

const plus = (value = "") => encodeURIComponent(value).replaceAll("%20", "+");
const exists = (src = "") => src && src.startsWith("/assets/") && !src.includes("coming-soon") && fs.existsSync(`.${src}`);

const rangesById = new Map(catalogue.ranges.map((range) => [range.id, range]));
const productsById = new Map(catalogue.products.map((product) => [product.id, product]));

const categoryCards = [
  {
    name: "Hybrid",
    href: "/hybrid-flooring-sydney/",
    image: "/assets/images/categories/hybrid-flooring-thumbnail.webp",
    alt: "Hybrid flooring installed room example",
    text: "Practical timber-look and selected tile-look flooring for homes, apartments and rental upgrades.",
  },
  {
    name: "Laminate",
    href: "/laminate-flooring-sydney/",
    image: "/assets/images/categories/laminate-flooring-thumbnail.jpg",
    alt: "Laminate flooring installed room example",
    text: "Timber-look flooring for dry internal rooms and budget-aware renovations.",
  },
  {
    name: "Engineered timber",
    href: "/engineered-timber-flooring-sydney/",
    image: "/assets/images/categories/engineered-timber-flooring-thumbnail.webp",
    alt: "Engineered timber flooring installed room example",
    text: "Real timber surface flooring for premium homes, apartments and interiors.",
  },
  {
    name: "Solid timber",
    href: "/solid-timber-flooring-sydney/",
    image: "/assets/images/categories/solid-timber-flooring-thumbnail.jpg",
    alt: "Solid timber flooring installed room example",
    text: "Natural timber flooring for long-term projects where installation and finishing need careful planning.",
  },
  {
    name: "Vinyl",
    href: "/vinyl-flooring-sydney/",
    image: "/assets/images/categories/vinyl-flooring-thumbnail.jpg",
    alt: "Vinyl flooring installed room example",
    text: "Practical flooring options for residential, rental and suitable commercial spaces.",
  },
];

const projectNeedCards = [
  ["Family home", "Compare practical flooring options for living areas, bedrooms and everyday family use.", "/engineered-timber-flooring-sydney/"],
  ["Apartment / strata", "Hybrid or engineered timber options may need acoustic, access and strata timing checks.", "/hybrid-flooring-sydney/"],
  ["Rental upgrade", "Laminate or hybrid flooring can suit fast upgrades where availability and timing matter.", "/laminate-flooring-sydney/"],
  ["Builder project", "Plan product supply, installation sequencing, trims and handover timing early.", "/builder-flooring-contractor-sydney/"],
  ["Commercial / office", "Review flooring choice, access, staging and preparation before commercial work starts.", "/commercial-flooring-sydney/"],
  ["Premium timber finish", "Compare engineered timber, solid timber and hardwood pathways for long-term timber character.", "/hardwood-timber-flooring-sydney/"],
];

const rangeIds = [
  "avala",
  "artisan-tile",
  "aqua-wood-plus-12mm",
  "prime-legend",
  "botanica",
  "swish-oak-natura",
];

const rangeDescriptions = {
  avala: "A practical hybrid plank range for homes, apartments and rental upgrades.",
  "artisan-tile": "A tile-look hybrid range for stone, marble and concrete-style interiors.",
  "aqua-wood-plus-12mm": "A thicker 12mm laminate range for customers comparing timber-look flooring.",
  "prime-legend": "A 12.3mm laminate range for dry internal rooms and renovation projects.",
  botanica: "An engineered timber range for interiors needing a real timber surface.",
  "swish-oak-natura": "An engineered oak range for premium homes and office interiors.",
};

const productIds = [
  "avala-blackbutt",
  "grande-9-0-hybrid-sand",
  "aqua-wood-plus-12mm-big-ben-p-and-h",
  "prime-legend-atlantic-oak",
  "botanica-alaska",
  "swish-oak-natura-ambient-sand",
];

const productDescriptions = {
  "avala-blackbutt": "A warm Australian timber-look hybrid plank for everyday residential interiors.",
  "grande-9-0-hybrid-sand": "A pale neutral hybrid plank for apartments, rentals and modern homes.",
  "aqua-wood-plus-12mm-big-ben-p-and-h": "A practical 12mm laminate colour for thicker timber-look flooring comparisons.",
  "prime-legend-atlantic-oak": "A natural oak-look laminate for dry rooms and renovation budgets.",
  "botanica-alaska": "A light engineered timber surface for calm premium interiors.",
  "swish-oak-natura-ambient-sand": "A soft oak engineered timber option for premium homes and offices.",
};

function categoryCard(card) {
  return `<a class="category-card chooser-card link-card" href="${esc(card.href)}"><img class="category-thumb" src="${esc(card.image)}" alt="${esc(card.alt)}" loading="lazy" decoding="async"><span><strong>${esc(card.name)}</strong><p>${esc(card.text)}</p></span><span class="card-arrow" aria-hidden="true">→</span></a>`;
}

function projectNeedCard([title, text, href]) {
  return `<a class="category-card link-card" href="${esc(href)}"><strong>${esc(title)}</strong><p>${esc(text)}</p><span class="card-arrow" aria-hidden="true">→</span></a>`;
}

function rangeCard(range) {
  const image = range.primaryImage && exists(range.primaryImage) ? range.primaryImage : "";
  const pills = [range.category, range.thickness, range.colourCount ? `${range.colourCount} colours` : ""]
    .filter(Boolean)
    .filter((pill) => String(pill).length <= 28)
    .slice(0, 3);
  return `<a class="card range-summary-card link-card" data-range-card data-category="${esc(range.category)}" href="${esc(range.url)}">${image ? `<img class="category-thumb" src="${esc(image)}" alt="${esc(`${range.name} ${String(range.category).toLowerCase()} range colour swatch`)}" loading="lazy" decoding="async">` : ""}<p class="catalogue-overline">${esc(range.category || "Flooring range")}</p><h3>${esc(range.name)}</h3><p>${esc(rangeDescriptions[range.id] || range.shortDescription || "Compare colours, specifications, stock availability and project fit for this flooring range.")}</p><p class="product-meta">${pills.map((pill) => `<span class="pill">${esc(pill)}</span>`).join("")}</p><span class="card-arrow" aria-hidden="true">→</span></a>`;
}

function productCard(product) {
  if (!product || !exists(product.primaryImage)) return "";
  const range = product.range || product.rangeName || "";
  const category = product.category || "";
  const pills = [category, product.thickness, product.boardSize || product.plankSize]
    .filter(Boolean)
    .filter((pill) => String(pill).length <= 30)
    .slice(0, 3);
  const stockHref = `/contact/?enquiry=stock&product=${plus(product.name)}&productSlug=${plus(product.id)}&range=${plus(range)}&category=${plus(category)}&source=${plus(product.url)}`;
  const alt = product.altText || `${range} ${product.colour || product.name} ${String(category).toLowerCase()} flooring colour swatch`;
  return `<article class="product-card catalogue-card"><img src="${esc(product.primaryImage)}" alt="${esc(alt)}" loading="lazy" decoding="async"><div class="product-body"><p class="catalogue-overline">${esc(range)}</p><h3>${esc(product.name)}</h3><p>${esc(productDescriptions[product.id] || product.shortDescription || "A flooring colour option to compare before sending a stock or supply enquiry.")}</p><p class="product-meta">${pills.map((pill) => `<span class="pill">${esc(pill)}</span>`).join("")}</p><div class="product-actions compact-actions"><a class="button-inline" href="${esc(product.url)}">View details</a><a class="button-inline ghost-inline" href="${esc(stockHref)}">Check stock</a></div></div></article>`;
}

const popularRanges = rangeIds
  .map((id) => rangesById.get(id))
  .filter(Boolean)
  .map(rangeCard)
  .join("");

const featuredProducts = productIds
  .map((id) => productsById.get(id))
  .filter((product) => product && exists(product.primaryImage))
  .map(productCard)
  .join("");

const main = `<main><section class="hero"><div class="shell hero-grid"><div><p class="eyebrow">Flooring products Sydney</p><h1>Browse flooring products by type, range and colour</h1><p class="lead">Choose a flooring type first, then compare ranges, colours and enquiry options for supply-only, stock checks or supply + install support.</p><div class="button-row"><a class="button" href="#flooring-categories">Browse by flooring type</a><a class="button-secondary" href="/contact/?enquiry=supply-install&amp;source=products">Request supply + install quote</a><a class="button-secondary" href="/ranges/">View all ranges</a></div></div><div class="hero-media"><img src="/assets/images/products/engineered/engineered-blackbutt-rustic.jpg" alt="Timber flooring product samples for Sydney projects" loading="lazy" decoding="async"><div class="hero-badge"><span>Supply</span><span>Install</span><span>Stock check</span></div></div></div></section><section class="section soft"><div class="shell"><div class="section-head"><div><p class="eyebrow">Start here</p><h2>What are you looking for?</h2></div><p>Choose the path that matches where you are in the product decision.</p></div><div class="grid-4"><a class="category-card link-card" href="#flooring-categories"><strong>Choose flooring type</strong><p>Compare hybrid, laminate, engineered timber, solid timber and vinyl.</p><span class="card-arrow" aria-hidden="true">→</span></a><a class="category-card link-card" href="/contact/?enquiry=stock&amp;source=products"><strong>Already know the product?</strong><p>Send the range or colour and ask us to confirm stock, batch and lead time.</p><span class="card-arrow" aria-hidden="true">→</span></a><a class="category-card link-card" href="/contact/?enquiry=supply-install&amp;source=products"><strong>Need installation?</strong><p>Request supply + install with suburb, floor area, current floor and access details.</p><span class="card-arrow" aria-hidden="true">→</span></a><a class="category-card link-card" href="/contact/?enquiry=supply-only&amp;source=products"><strong>Supply-only enquiry</strong><p>Ask about availability, supply pricing and product lead time.</p><span class="card-arrow" aria-hidden="true">→</span></a></div></div></section><section class="section" id="flooring-categories"><div class="shell"><div class="section-head"><div><p class="eyebrow">Categories</p><h2>Choose by flooring category</h2></div><p>Start with the flooring type, then compare ranges, colours and project fit.</p></div><div class="grid-3">${categoryCards.map(categoryCard).join("")}</div></div></section><section class="section soft"><div class="shell"><div class="section-head"><div><p class="eyebrow">Project need</p><h2>Choose by project need</h2></div><p>Use these pathways when room type, access, timing or finish matters more than the product name.</p></div><div class="grid-3">${projectNeedCards.map(projectNeedCard).join("")}</div></div></section><section class="section"><div class="shell"><div class="section-head"><div><p class="eyebrow">Popular ranges</p><h2>Popular ranges to start with</h2></div><p>These are common starting points. Open each category page to compare the full range list.</p></div><div class="grid-3">${popularRanges}</div><p class="section-action"><a class="button" href="/ranges/">View all ranges</a></p></div></section><section class="section soft catalogue-products"><div class="shell"><div class="section-head"><div><p class="eyebrow">Sample colours</p><h2>Sample colours across categories</h2></div><p>A small sample of colours across product types. Full colour lists are available on each range page.</p></div><div class="grid-3">${featuredProducts}</div></div></section><section class="section"><div class="shell"><div class="section-head"><div><p class="eyebrow">Enquiries</p><h2>How product enquiries work</h2></div><p>Stock, product details and installation suitability are confirmed before order so the next step is clear.</p></div><div class="process-steps"><article class="process-step"><span class="insight-label">1</span><h3>Choose a type, range or colour</h3><p>Start with the flooring category or send us a product you already like.</p></article><article class="process-step"><span class="insight-label">2</span><h3>Send project details</h3><p>Include suburb, approximate area, timing, current floor and whether you need supply-only or installation.</p></article><article class="process-step"><span class="insight-label">3</span><h3>Confirm stock and suitability</h3><p>Oz Timber Floor checks stock, lead time, product details and installation suitability before order.</p></article><article class="process-step"><span class="insight-label">4</span><h3>Quote or next step</h3><p>We confirm supply price, stock availability or the supply + install pathway.</p></article></div></div></section><section class="section soft"><div class="shell cta"><p class="eyebrow">Product enquiry</p><h2>Ready to check a flooring product or range?</h2><p>Send the range, colour, square metres, suburb, current floor type and whether you need supply-only, stock check, preparation or installation.</p><div class="button-row"><a class="button" href="/contact/?enquiry=supply-only&amp;source=products">Request supply price</a><a class="button-secondary" href="/contact/?enquiry=stock&amp;source=products">Check stock availability</a><a class="button-secondary" href="/contact/?enquiry=supply-install&amp;source=products">Request supply + install quote</a></div></div></section></main>`;

const head = `<!DOCTYPE html><html lang="en-AU"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Flooring Products Sydney | Oz Timber Floor</title><meta name="description" content="Browse hybrid, laminate, engineered timber, solid timber and vinyl flooring ranges by category, range and colour. Send supply, stock or installation enquiries."><link rel="canonical" href="https://oztimberfloor.com.au/products/"><link rel="icon" href="/assets/brand/favicon-32.png" sizes="32x32" type="image/png"><link rel="apple-touch-icon" href="/assets/brand/apple-touch-icon.png"><meta name="robots" content="index,follow"><meta property="og:type" content="website"><meta property="og:title" content="Flooring Products Sydney | Oz Timber Floor"><meta property="og:description" content="Browse flooring products by category, range and colour, then send supply, stock or installation enquiries."><meta property="og:url" content="https://oztimberfloor.com.au/products/"><link rel="stylesheet" href="/assets/site.css"><script src="/assets/contact-config.js" defer></script><script src="/assets/site.js" defer></script></head><body>`;

const html = `${head}${header}${main}${footer}</body></html>`;

for (const file of ["products.html", "products/index.html"]) {
  fs.writeFileSync(file, html);
}

console.log(`Products page rebuilt with ${categoryCards.length} category cards, ${rangeIds.length} range cards and ${productIds.length} sample products.`);
