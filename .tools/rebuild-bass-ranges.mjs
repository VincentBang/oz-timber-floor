import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const catalogue = JSON.parse(fs.readFileSync(path.join(root, "data/product-catalogue.json"), "utf8"));
const ranges = catalogue.ranges || [];
const products = catalogue.products || [];

const BASS_SUPPLIER_HOME = "https://basstimber.com.au/";
const WARRANTY_BOOKLET = BASS_SUPPLIER_HOME;
const HYBRID_BROCHURE = BASS_SUPPLIER_HOME;

const artisanConfig = {
  heroLead:
    "Artisan Tile is a tile-format hybrid flooring range for customers comparing stone, marble or concrete-style visuals with a floating hybrid floor installation pathway. Before ordering, stock, batch, floor preparation and installation suitability should be confirmed.",
  title: "Artisan Tile Hybrid Flooring Range | Oz Timber Floor",
  meta: "Browse Artisan Tile hybrid flooring colours, 9mm tile-format specs, supplier ratings, documents and stock enquiries in Sydney.",
  technicalRows: [
    ["Collection", "Hybrid Planks - Artisan Tile"],
    ["Category", "Hybrid"],
    ["Format", "Plank / Tile Format"],
    ["Construction", "Hybrid (7/0.5mm SPC + 2mm EVA)"],
    ["Thickness", "9mm"],
    ["Dimensions", "620 x 310 x 9mm"],
    ["Box coverage", "1.5376m² / 8pcs"],
    ["Installation profile", "Floating Floor (Licensed Click System)"],
    ["Colours", "12"],
  ],
  colourCodes: {
    Calacatta: "1201",
    Grigio: "1202",
    "Monaco Brown": "1203",
    "Pietra Grey": "1204",
    "Dover Grey": "1205",
    "Black Maquina": "1206",
    "Crema Marfil": "1207",
    "Jasper Grey": "1208",
    "Valley Beige": "1209",
    Volcano: "1210",
    "Casper White": "1211",
    Madison: "1212",
  },
  ratings: [
    ["Fire rating", "Passed AS ISO 9239.1 Standard", "Supplier fire test documentation is available for review before product selection or specification."],
    ["Slip rating", "SRV P4", "Review the supplier slip test report before relying on a rating for a specific room or usage condition."],
    ["Acoustic rating", "AAAC 5 Star", "Acoustic suitability should still be checked against the tested system and any strata or building requirements."],
    ["Environment certificate", "VOC E0 (0.014mg/m³)", "Use the supplier certificate for the tested hybrid flooring system rather than assuming every project condition is identical."],
  ],
  docs: [
    ["Brochure", "Review the Hybrid Planks collection overview, collection positioning and shared supplier product information.", HYBRID_BROCHURE],
    ["Warranty", "Review supplier warranty conditions before final product selection, room-use decisions or installation planning.", WARRANTY_BOOKLET],
    ["Installation guide", "Check floating-floor installation requirements, tile-format laying patterns, subfloor preparation and site conditions.", "https://cdn.shopify.com/s/files/1/0739/9132/3868/files/ARTISAN_TILES_-_INSTALLATION_GUIDELINES.pdf?v=1759965829"],
    ["Maintenance & care guide", "Review cleaning, moisture, furniture and long-term care advice for supplier-backed maintenance planning.", "https://cdn.shopify.com/s/files/1/0739/9132/3868/files/ARTISAN_TILES_-_M_C.pdf?v=1759965838"],
    ["Fire test report", "Review the supplier fire test report for the tested Artisan Hybrid Tile system and conditions.", "https://cdn.shopify.com/s/files/1/0739/9132/3868/files/ARTISAN_-_FIRE_TEST_11.pdf?v=1759966228"],
    ["Slip test report", "Review the wet pendulum slip test report before relying on a rating for a specific room or usage condition.", "https://cdn.shopify.com/s/files/1/0739/9132/3868/files/ARTISAN_-_SLIP_TEST_P4.pdf?v=1759966229"],
    ["Acoustic certificate", "Review the acoustic certificate and tested build-up before using it for apartment or project compliance discussions.", "https://cdn.shopify.com/s/files/1/0739/9132/3868/files/ARTISAN_-_ACOUSTIC_COP_5_STAR.pdf?v=1759966229"],
    ["VOC / environment certificate", "Review the supplier environment certificate for the tested hybrid flooring system and declared VOC result.", "https://cdn.shopify.com/s/files/1/0739/9132/3868/files/HYBRID_-_VOC_E0.pdf?v=1759819680"],
  ],
  fit: [
    ["Stone, marble or concrete-look interiors", "For customers who want a tile-style visual without choosing ceramic tile."],
    ["Colour comparison before ordering", "Useful when comparing light, dark, marble, stone and concrete-style finishes."],
    ["Supply-only enquiries", "Best when stock, batch, lead time and quantity should be confirmed before ordering."],
    ["Supply + install projects", "Useful when floor preparation, trims, access or acoustic requirements may affect the final quote."],
  ],
  faq: [
    ["Is Artisan Tile real tile or hybrid flooring?", "Artisan Tile is a tile-format hybrid flooring range. It gives a stone, marble or concrete-style visual with a floating hybrid floor installation profile."],
    ["What size is Artisan Tile?", "Supplier specifications list Artisan Tile at 620 x 310 x 9mm, with 1.5376m² and 8 pieces per box."],
    ["Can Oz Timber Floor supply Artisan Tile without installation?", "Yes. Send the preferred colour, code, quantity and suburb so stock, batch and lead time can be checked."],
    ["Can Artisan Tile be quoted with installation?", "Yes. Include the floor area, current floor type, suburb, access and timing so preparation and installation scope can be reviewed."],
    ["Are ratings and certification documents available?", "Oz Timber Floor can help confirm current product information, preparation notes and any relevant ratings or certificates before ordering."],
    ["What should I check before ordering?", "Confirm stock, batch, colour, floor condition, trims, transitions, acoustic requirements where relevant and installation suitability before ordering."],
  ],
};

const productById = new Map();
for (const product of products) {
  for (const key of [product.id, product.slug, product.url].map(cleanSlug).filter(Boolean)) {
    productById.set(key, product);
  }
}

const productsByRange = new Map();
for (const product of products) {
  const rangeSlug = cleanSlug(product.rangeSlug || product.range || "");
  if (!productsByRange.has(rangeSlug)) productsByRange.set(rangeSlug, []);
  productsByRange.get(rangeSlug).push(product);
}

const categoryUrls = {
  Hybrid: "/hybrid-flooring-sydney/",
  Laminate: "/laminate-flooring-sydney/",
  "Engineered timber": "/engineered-timber-flooring-sydney/",
  "Solid timber": "/solid-timber-flooring-sydney/",
  Vinyl: "/vinyl-flooring-sydney/",
};

function cleanSlug(value = "") {
  return String(value).replace(/^\/?products\//, "").replace(/^\/?ranges\//, "").replace(/\/$/, "").trim().toLowerCase();
}

function esc(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function plus(value = "") {
  return encodeURIComponent(value).replaceAll("%20", "+");
}

function imageExists(src = "") {
  return src && !src.includes("coming-soon") && src.startsWith("/assets/") && fs.existsSync(path.join(root, src.replace(/^\//, "")));
}

function productListForRange(range) {
  const seen = new Set();
  const direct = [...(range.productSlugs || []), ...(range.products || [])]
    .map(cleanSlug)
    .map((slug) => productById.get(slug))
    .filter(Boolean);
  const indirect = productsByRange.get(cleanSlug(range.slug || range.name)) || [];
  return [...direct, ...indirect].filter((product) => {
    const key = cleanSlug(product.id || product.slug || product.url);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function bestImage(range, items) {
  const candidates = [
    range.primaryImage,
    range.thumbnailImage,
    range.heroImage,
    ...items.map((item) => item.primaryImage),
  ];
  return candidates.find(imageExists) || "";
}

function imageOrFallback(src, alt, name) {
  if (imageExists(src)) return `<img src="${esc(src)}" alt="${esc(alt)}" loading="lazy" decoding="async">`;
  return `<div class="missing-image-state" role="img" aria-label="${esc(`${name} colour image to confirm`)}"><span>Image to confirm</span><small>Ask for current sample</small></div>`;
}

function displayInstall(value = "") {
  return String(value)
    .replace(/Floating Floor \(Licensed Click System\)/gi, "Floating Floor (Licensed Click System)")
    .replace(/Floating click installation/gi, "Floating Floor (Licensed Click System)")
    .trim();
}

function titleCase(value = "") {
  return String(value)
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function categoryLabel(value = "") {
  const key = String(value).trim();
  const labels = {
    Hybrid: "Hybrid",
    Laminate: "Laminate",
    "Engineered timber": "Engineered Timber",
    "Solid timber": "Solid Timber",
    Vinyl: "Vinyl",
  };
  return labels[key] || titleCase(key);
}

function categoryPhrase(value = "") {
  const key = String(value).trim();
  const phrases = {
    Hybrid: "hybrid",
    Laminate: "laminate",
    "Engineered timber": "engineered timber",
    "Solid timber": "solid timber",
    Vinyl: "vinyl",
  };
  return phrases[key] || String(value).toLowerCase();
}

function indefiniteArticle(phrase = "") {
  return /^[aeiou]/i.test(String(phrase).trim()) ? "an" : "a";
}

function titleForRange(range) {
  if (range.slug === "artisan-tile") return artisanConfig.title;
  const category = categoryLabel(range.category);
  const name = String(range.name || "").trim();
  if (name.toLowerCase().includes(category.toLowerCase())) {
    return `${name} Range | Oz Timber Floor`;
  }
  return `${name} ${category} Flooring Range | Oz Timber Floor`;
}

function descriptionForRange(range) {
  if (range.slug === "artisan-tile") return artisanConfig.meta;
  const category = categoryPhrase(range.category);
  const name = String(range.name || "").trim();
  if (name.toLowerCase().includes(category.toLowerCase())) {
    return `Browse ${name} colours, supplier-backed product details and stock enquiries in Sydney.`;
  }
  return `Browse ${name} ${category} colours, supplier-backed product details and stock enquiries in Sydney.`;
}

function heroLead(range) {
  if (range.slug === "artisan-tile") return artisanConfig.heroLead;
  if (range.category === "Hybrid") {
    return `${range.name} is a hybrid flooring range for customers comparing practical floating-floor options, current colours, stock timing and installation suitability before ordering.`;
  }
  if (range.category === "Laminate") {
    return `${range.name} is a laminate flooring range for customers comparing dry-area timber-look floors, supplier-backed product information and installation planning before ordering.`;
  }
  if (range.category === "Engineered timber") {
    return `${range.name} is an engineered timber flooring range for customers comparing real timber surfaces, board formats, stock timing and installation suitability before ordering.`;
  }
  if (range.category === "Solid timber") {
    return `${range.name} is a solid timber flooring range for customers comparing species, board format, prefinished or raw options and installation planning before ordering.`;
  }
  return `${range.name} is a flooring range for customers comparing colours, specifications, stock timing and installation suitability before ordering.`;
}

function technicalRows(range, items) {
  if (range.slug === "artisan-tile") return artisanConfig.technicalRows;
  const rows = [
    ["Collection", range.name],
    ["Category", range.category],
    ["Thickness", range.thickness],
    ["Dimensions", range.boardSize || range.plankSize],
    ["Box coverage", range.packSizeM2],
    ["Installation profile", displayInstall(range.installationMethod)],
    ["Colours", String(range.colourCount || items.length || "")],
  ];
  return rows.filter(([, value]) => String(value || "").trim());
}

function docsForRange(range) {
  const docs = [];
  if (range.sourceUrl) {
    docs.push([
      "Supplier range reference",
      "Open the official supplier range page to compare the collection, product family and reference details before ordering.",
      range.sourceUrl,
    ]);
  }
  if (range.brochureUrl) {
    docs.push([
      "Brochure",
      "Review the official supplier brochure before comparing colours, collection positioning and general product information.",
      range.brochureUrl,
    ]);
  }
  if (range.specSheetUrl) {
    docs.push([
      "Specification sheet",
      "Review the supplier specification sheet before relying on dimensions, installation notes or current product construction.",
      range.specSheetUrl,
    ]);
  }
  docs.push([
    "Supplier website",
    "Use the supplier website as the primary reference for current collection details, then ask Oz Timber Floor to confirm stock and project suitability.",
    BASS_SUPPLIER_HOME,
  ]);
  return docs;
}

function fitCards(range) {
  const set = range.slug === "artisan-tile"
    ? artisanConfig.fit
    : range.category === "Hybrid"
      ? [
          ["Homes, apartments and practical updates", "Useful when comparing floating-floor options for residential interiors, rental upgrades and similar day-to-day spaces."],
          ["Colour comparison before ordering", "Helpful when comparing timber-look or feature flooring colours before stock and batch confirmation."],
          ["Supply-only enquiries", "Useful when stock, quantity, lead time and current product details should be confirmed before ordering."],
          ["Supply + install projects", "Helpful when floor preparation, trims, access and installation scope may affect the final quote."],
        ]
      : range.category === "Laminate"
        ? [
            ["Dry internal rooms", "Useful for customers comparing timber-look flooring for bedrooms, living areas and similar dry spaces."],
            ["Colour comparison before ordering", "Helpful when comparing timber-look tones, board formats and current stock timing."],
            ["Supply-only enquiries", "Useful when quantities, trims and current supplier details should be confirmed first."],
            ["Supply + install projects", "Helpful when floor condition, access and installation planning need review before final ordering."],
          ]
        : range.category === "Engineered timber"
          ? [
              ["Premium interiors", "Useful for customers comparing real timber surfaces, board formats and richer interior finishes."],
              ["Colour and board-format comparison", "Helpful when comparing oak tones, wider boards, herringbone or chevron-style alternatives."],
              ["Supply-only enquiries", "Useful when stock, batch, quantity and product sheet details should be confirmed before ordering."],
              ["Supply + install projects", "Helpful when subfloor preparation, trims, access and installation method may affect the final quote."],
            ]
          : [
              ["Long-term timber projects", "Useful for customers comparing species, board format and finishing pathway before ordering."],
              ["Prefinished and raw timber planning", "Helpful when comparing ready-to-install boards against raw timber requiring more finishing discussion."],
              ["Supply-only enquiries", "Useful when species, quantity and lead time should be confirmed before ordering."],
              ["Supply + install projects", "Helpful when fixing method, access, sanding or coating sequence may affect the final quote."],
            ];

  return set
    .map(([title, text]) => `<article class="fit-card"><span class="insight-label">Fit</span><h3>${esc(title)}</h3><p>${esc(text)}</p></article>`)
    .join("");
}

function confirmCards() {
  return [
    ["Stock and batch", "Confirm current availability, batch and lead time before payment or delivery planning."],
    ["Colour and screen variation", "Product colour, pattern and texture can vary from screen representations. Samples or in-person viewing are recommended where colour accuracy matters."],
    ["Floor condition", "Subfloor flatness, moisture and stability should be reviewed before installation."],
    ["Trims and transitions", "Check doorways, adjoining floors, skirting, expansion allowance and transition details before final ordering."],
    ["Apartment or acoustic requirements", "Apartment, builder and commercial projects may need early review of tested documentation and project-specific requirements."],
    ["Room or project suitability", "Confirm the product is suitable for the room, access conditions and installation pathway before you order."],
  ]
    .map(([title, text]) => `<article class="caution-card"><span class="insight-label">Confirm</span><h3>${esc(title)}</h3><p>${esc(text)}</p></article>`)
    .join("");
}

function prepCopy(range) {
  if (range.category === "Solid timber") {
    return "Before ordering or installation, confirm subfloor condition, fixing method, moisture, trims, expansion allowance, access and whether the selected species or finish pathway is suitable for the project conditions.";
  }
  if (range.category === "Engineered timber") {
    return "Before ordering or installation, confirm subfloor flatness, moisture, installation method, transitions, expansion allowance, trims, door clearances and whether the product is suitable for the room or project conditions.";
  }
  return "Before ordering or installation, confirm subfloor flatness, moisture, transitions, expansion allowance, trims, door clearances and whether the product is suitable for the room or project conditions.";
}

function faqForRange(range) {
  if (range.slug === "artisan-tile") return artisanConfig.faq;
  const category = categoryPhrase(range.category);
  const article = indefiniteArticle(category);
  return [
    [`What type of flooring is ${range.name}?`, `${range.name} is ${article} ${category} flooring range. Oz Timber Floor can help confirm current product details, stock and project suitability before ordering.`],
    [`What should I compare first in ${range.name}?`, `Start with colour, board format, thickness and current stock timing, then confirm installation suitability for the project.`],
    [`Can Oz Timber Floor supply ${range.name} without installation?`, `Yes. Send the preferred colour, quantity and suburb so stock, batch and lead time can be checked.`],
    [`Can ${range.name} be quoted with installation?`, `Yes. Include the floor area, current floor type, suburb, access and timing so preparation and installation scope can be reviewed.`],
    [`Are supplier documents available for ${range.name}?`, `Yes. Oz Timber Floor can help confirm current product information, stock timing, preparation notes and any relevant ratings or certificates before ordering.`],
    [`What should I check before ordering ${range.name}?`, `Confirm stock, batch, colour, floor condition, trims, transitions and installation suitability before ordering.`],
  ];
}

function relatedRanges(range, supplierRanges) {
  return supplierRanges
    .filter((item) => item.slug !== range.slug && item.category === range.category && item.publicCatalogueStatus !== "legacy-hidden")
    .slice(0, 6);
}

function rangeCard(range, items) {
  const img = bestImage(range, items);
  const pills = [range.category, range.thickness, range.colourCount ? `${range.colourCount} colours` : ""].filter(Boolean).slice(0, 3);
  return `<a class="card range-summary-card link-card" href="${esc(range.url)}">${img ? `<img class="category-thumb" src="${esc(img)}" alt="${esc(`${range.name} ${categoryPhrase(range.category)} colour swatch`)}" loading="lazy" decoding="async">` : ""}<p class="catalogue-overline">${esc(range.category || "Flooring range")}</p><h3>${esc(range.name)}</h3><p>${esc(range.shortDescription || heroLead(range))}</p><p class="product-meta">${pills.map((pill) => `<span class="pill">${esc(pill)}</span>`).join("")}</p><span class="card-arrow" aria-hidden="true">→</span></a>`;
}

function productCard(product, range, colourCodes = {}) {
  const name = product.colour || product.name || "Colour option";
  const productUrl = product.url || `/products/${cleanSlug(product.id || product.slug)}/`;
  const productSlug = cleanSlug(product.id || product.slug || product.url);
  const stockHref = `/contact/?enquiry=stock&product=${plus(product.name || `${range.name} ${name}`)}&productSlug=${plus(productSlug)}&range=${plus(range.name)}&category=${plus(range.category)}&source=${plus(range.url)}`;
  const alt = product.altText || `${range.name} ${name} ${String(range.category).toLowerCase()} colour swatch`;
  const code = colourCodes[name];
  const pills = [code, range.category, range.thickness || product.thickness, range.boardSize || product.boardSize].filter(Boolean).slice(0, 4);
  return `<article class="product-card catalogue-card">${imageOrFallback(product.primaryImage, alt, name)}<div class="product-body"><p class="catalogue-overline">${esc(range.name)}</p><h3>${esc(name)}</h3><p class="product-meta">${pills.map((pill) => `<span class="pill">${esc(pill)}</span>`).join("")}</p><div class="product-actions compact-actions"><a class="button-inline" href="${esc(productUrl)}">View details</a><a class="button-inline ghost-inline" href="${esc(stockHref)}">Check stock</a></div></div></article>`;
}

function buildPage(range, supplierRanges) {
  const items = productListForRange(range);
  const image = bestImage(range, items);
  const canonical = `https://oztimberfloor.com.au${range.url}`;
  const stockHref = `/contact/?enquiry=stock&range=${plus(range.name)}&category=${plus(range.category)}&source=${plus(range.url)}`;
  const supplyHref = `/contact/?enquiry=supply-only&range=${plus(range.name)}&category=${plus(range.category)}&source=${plus(range.url)}`;
  const installHref = `/contact/?enquiry=supply-install&range=${plus(range.name)}&category=${plus(range.category)}&source=${plus(range.url)}`;
  const prepHref = `/contact/?enquiry=service&topic=preparation&range=${plus(range.name)}&category=${plus(range.category)}&source=${plus(range.url)}`;
  const infoHref = `/contact/?enquiry=product-info&range=${plus(range.name)}&category=${plus(range.category)}&source=${plus(range.url)}`;
  const docs = docsForRange(range);
  const ratings = range.slug === "artisan-tile" ? artisanConfig.ratings : [];
  const rows = technicalRows(range, items);
  const faq = faqForRange(range);
  const related = relatedRanges(range, supplierRanges);
  const colourCodes = range.slug === "artisan-tile" ? artisanConfig.colourCodes : {};
  const category = categoryPhrase(range.category);
  const description = descriptionForRange(range);
  const title = titleForRange(range);

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: "https://oztimberfloor.com.au/" },
        { "@type": "ListItem", position: 2, name: "Products", item: "https://oztimberfloor.com.au/products/" },
        { "@type": "ListItem", position: 3, name: "Ranges", item: "https://oztimberfloor.com.au/ranges/" },
        { "@type": "ListItem", position: 4, name: range.name, item: canonical },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faq.map(([name, text]) => ({ "@type": "Question", name, acceptedAnswer: { "@type": "Answer", text } })),
    },
  ];

  return `<!DOCTYPE html><html lang="en-AU"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>${esc(title)}</title><meta name="description" content="${esc(description)}"><link rel="canonical" href="${esc(canonical)}"><link rel="icon" href="/assets/brand/favicon-32.png" sizes="32x32" type="image/png"><link rel="apple-touch-icon" href="/assets/brand/apple-touch-icon.png"><meta name="robots" content="index,follow"><meta property="og:type" content="website"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(description)}"><meta property="og:url" content="${esc(canonical)}"><link rel="stylesheet" href="/assets/site.css"><script src="/assets/contact-config.js" defer></script><script src="/assets/site.js" defer></script><script type="application/ld+json">${JSON.stringify(jsonLd)}</script></head><body>${header()}<main><section class="section slim-breadcrumbs"><div class="shell"><nav class="breadcrumbs" aria-label="Breadcrumb"><a href="/">Home</a><span>›</span><a href="/products/">Products</a><span>›</span><a href="/ranges/">Ranges</a><span>›</span><span>${esc(range.name)}</span></nav></div></section><section class="hero"><div class="shell hero-grid"><div><p class="eyebrow">${esc(range.category)} range</p><h1>${esc(range.name)}</h1><p class="lead">${esc(heroLead(range))}</p><div class="button-row"><a class="button" href="#colours">View colours</a><a class="button-secondary" href="${esc(stockHref)}">Check stock</a><a class="button-secondary" href="${esc(installHref)}">Request supply + install quote</a></div></div><div class="hero-media">${image ? `<img src="${esc(image)}" alt="${esc(`${range.name} ${String(range.category).toLowerCase()} colour swatch`)}" loading="lazy" decoding="async">` : imageOrFallback("", `${range.name} colour image to confirm`, range.name)}<div class="hero-badge"><span>${esc(range.category)}</span>${range.thickness ? `<span>${esc(range.thickness)}</span>` : ""}<span>${esc(String(range.colourCount || items.length || ""))} colours</span></div></div></div></section><section class="section soft"><div class="shell"><div class="section-head"><div><p class="eyebrow">Start here</p><h2>What do you need help with?</h2></div><p>Choose the next step based on whether you are comparing colours, reviewing range information or ready to check stock and installation support.</p></div><div class="grid-4"><a class="category-card link-card" href="#colours"><strong>View colours</strong><p>Compare every colour available in this range.</p><span class="card-arrow" aria-hidden="true">→</span></a><a class="category-card link-card" href="#supplier-documents"><strong>Range information</strong><p>Ask Oz Timber Floor to confirm current specs, stock notes and project requirements before ordering.</p><span class="card-arrow" aria-hidden="true">→</span></a><a class="category-card link-card" href="${esc(stockHref)}"><strong>Check stock</strong><p>Already know the colour? Ask us to confirm current stock, batch and lead time.</p><span class="card-arrow" aria-hidden="true">→</span></a><a class="category-card link-card" href="${esc(installHref)}"><strong>Request supply + install quote</strong><p>For installed flooring, include area, current floor, access and timing details.</p><span class="card-arrow" aria-hidden="true">→</span></a></div></div></section><section class="section catalogue-products" id="colours"><div class="shell"><div class="section-head"><div><p class="eyebrow">Available colours</p><h2>${esc(range.name)} colours</h2></div><p>Open a colour page for product details, or check stock directly from the colour card.</p></div><div class="grid-3">${items.map((product) => productCard(product, range, colourCodes)).join("")}</div></div></section><section class="section soft catalogue-specs"><div class="shell"><div class="section-head"><div><p class="eyebrow">Technical specifications</p><h2>${esc(range.name)} technical specifications</h2></div><p>Current collection and installation details help compare this range properly before requesting stock or installation advice.</p></div><div class="spec-grid">${rows.map(([label, value]) => `<div class="spec-item"><span>${esc(label)}</span><strong>${esc(value)}</strong></div>`).join("")}</div><p class="catalogue-note">Stock, batch, warranty and current product details are confirmed before order.</p></div></section>${ratings.length ? `<section class="section"><div class="shell"><div class="section-head"><div><p class="eyebrow">Ratings</p><h2>Ratings and certifications</h2></div><p>These results come from supplier-provided documents and should be reviewed against the actual room, building or project requirements before ordering.</p></div><div class="grid-4">${ratings.map(([label, title, text]) => `<article class="card"><p class="eyebrow">${esc(label)}</p><h3>${esc(title)}</h3><p>${esc(text)}</p></article>`).join("")}</div><p class="catalogue-note">These ratings are based on supplier-provided documents and tested systems. Suitability for a specific home, apartment, commercial space, wet-area or building requirement should be confirmed before ordering or installation.</p></div></section>` : ""}<section class="section ${ratings.length ? "soft" : ""}" id="supplier-documents"><div class="shell"><div class="section-head"><div><p class="eyebrow">Product support</p><h2>Range information and project support</h2></div><p>Oz Timber Floor can help confirm current product information, stock timing, preparation notes and the most relevant project details before you order.</p></div><div class="grid-4"><article class="card"><h3>Current product information</h3><p>Confirm collection details, format, dimensions and available colours with Oz Timber Floor before final selection.</p><a class="card-link" href="${esc(infoHref)}">Ask Oz Timber Floor</a></article><article class="card"><h3>Stock and batch check</h3><p>Confirm current stock, batch and lead time before payment, delivery planning or scheduling.</p><a class="card-link" href="${esc(stockHref)}">Check stock</a></article><article class="card"><h3>Installation guidance</h3><p>We can help review preparation, room suitability, transitions and installation questions before ordering.</p><a class="card-link" href="${esc(prepHref)}">Ask about preparation</a></article><article class="card"><h3>Supply + install scope</h3><p>Share floor area, current surface, suburb and access details for project advice and installation support.</p><a class="card-link" href="${esc(installHref)}">Request supply + install quote</a></article></div></div></section><section class="section"><div class="shell"><div class="section-head"><div><p class="eyebrow">Project fit</p><h2>Best suited for</h2></div><p>Use these notes to decide whether this range belongs on your shortlist before checking stock, installation scope or final project suitability.</p></div><div class="fit-grid">${fitCards(range)}</div></div></section><section class="section soft"><div class="shell"><div class="section-head"><div><p class="eyebrow">Before ordering</p><h2>Confirm before ordering</h2></div><p>These checks help keep product choice, site conditions and installation expectations clear.</p></div><div class="caution-grid">${confirmCards()}</div></div></section><section class="section"><div class="shell"><div class="section-head"><div><p class="eyebrow">Preparation</p><h2>Installation and preparation notes</h2></div><p>${esc(prepCopy(range))}</p></div><div class="text-block"><p>For apartments, builder projects and commercial sites, acoustic, access, timing and handover requirements should be reviewed early.</p><p>Oz Timber Floor can help review whether this range suits the job before stock, quantity and installation planning are finalised.</p></div><div class="button-row"><a class="button" href="${esc(prepHref)}">Ask about preparation</a><a class="button-secondary" href="${esc(installHref)}">Request supply + install quote</a><a class="button-secondary" href="/floor-levelling-sydney/">Read about floor levelling</a></div></div></section>${related.length ? `<section class="section soft"><div class="shell"><div class="section-head"><div><p class="eyebrow">Related ranges</p><h2>Compare nearby options</h2></div><p>These Bass Timber ranges stay close to the same category while giving a useful alternative to compare.</p></div><div class="grid-3">${related.map((item) => rangeCard(item, productListForRange(item))).join("")}</div></div></section>` : ""}<section class="section" id="faqs"><div class="shell"><div class="section-head"><div><p class="eyebrow">FAQ</p><h2>Questions about ${esc(range.name)}</h2></div></div><div class="faq-list">${faq.map(([question, answer]) => `<details class="faq-item"><summary>${esc(question)}</summary><div><p>${esc(answer)}</p></div></details>`).join("")}</div></div></section><section class="section soft"><div class="shell cta"><p class="eyebrow">Range enquiry</p><h2>Ready to ask about ${esc(range.name)}?</h2><p>Send the range name, preferred colours, suburb, approximate area and whether you need stock, supply-only pricing or supply + install support.</p><div class="button-row"><a class="button" href="${esc(supplyHref)}">Request supply price</a><a class="button-secondary" href="${esc(stockHref)}">Check stock availability</a><a class="button-secondary" href="${esc(installHref)}">Supply + install</a></div></div></section></main>${footer()}</body></html>`;
}

function header() {
  return `<header class="site-header"><div class="shell nav"><a class="brand" href="/" aria-label="Oz Timber Floor home"><img class="brand-logo" src="/assets/brand/oz-timber-floor-logo.webp" alt="Oz Timber Floor" width="680" height="215"><span class="brand-fallback">Oz Timber Floor</span></a><nav class="nav-links" aria-label="Primary"><a href="/">Home</a><div class="nav-item has-dropdown"><a class="nav-parent" href="/services/">Services</a><button class="nav-dropdown-toggle" type="button" aria-label="Toggle services menu" aria-expanded="false"></button><div class="nav-dropdown" role="menu"><a href="/timber-flooring-installation-sydney/" role="menuitem">Timber flooring installation</a><a href="/floor-levelling-sydney/" role="menuitem">Floor levelling</a><a href="/timber-floor-removal-and-stripping-sydney/" role="menuitem">Floor removal</a><a href="/timber-floor-sanding-and-polishing-sydney/" role="menuitem">Sanding and polishing</a><a href="/commercial-flooring-sydney/" role="menuitem">Commercial flooring</a><a href="/builder-flooring-contractor-sydney/" role="menuitem">Builder flooring contractor</a></div></div><div class="nav-item has-dropdown"><a class="nav-parent" href="/products/" aria-current="page">Products</a><button class="nav-dropdown-toggle" type="button" aria-label="Toggle products menu" aria-expanded="false"></button><div class="nav-dropdown" role="menu"><a href="/hybrid-flooring-sydney/" role="menuitem">Hybrid flooring</a><a href="/laminate-flooring-sydney/" role="menuitem">Laminate flooring</a><a href="/engineered-timber-flooring-sydney/" role="menuitem">Engineered timber</a><a href="/solid-timber-flooring-sydney/" role="menuitem">Solid timber</a><a href="/vinyl-flooring-sydney/" role="menuitem">Vinyl flooring</a><a href="/ranges/" role="menuitem">All ranges</a></div></div><a href="/projects/">Projects</a><a href="/guides/">Guides</a><a href="/contact/">Contact</a></nav><button class="nav-toggle" type="button" aria-label="Open menu" aria-expanded="false"><span></span><span></span><span></span></button><div class="header-actions"><a class="button" href="/contact/?enquiry=supply-install&amp;source=header">Request Quote</a></div></div></header>`;
}

function footer() {
  return `<footer class="site-footer"><div class="shell footer-grid"><div><img class="footer-brand-logo" src="/assets/brand/oz-timber-floor-logo.webp" alt="Oz Timber Floor" width="680" height="215"><p>Sydney timber flooring supplier, installer, builder flooring contractor and floor preparation specialist.</p></div><div><h3>Services</h3><div class="footer-links"><a href="/timber-flooring-installation-sydney/">Installation</a><a href="/floor-levelling-sydney/">Floor levelling</a><a href="/commercial-flooring-sydney/">Commercial flooring</a><a href="/builder-flooring-contractor-sydney/">Builder contractor</a><a href="/timber-floor-sanding-and-polishing-sydney/">Sanding and polishing</a><a href="/timber-floor-removal-and-stripping-sydney/">Removal and stripping</a></div></div><div><h3>Products</h3><div class="footer-links"><a href="/products/">Products</a><a href="/ranges/">All ranges</a><a href="/hybrid-flooring-sydney/">Hybrid</a><a href="/laminate-flooring-sydney/">Laminate</a><a href="/engineered-timber-flooring-sydney/">Engineered timber</a><a href="/solid-timber-flooring-sydney/">Solid timber</a><a href="/vinyl-flooring-sydney/">Vinyl</a></div></div><div><h3>Enquiries</h3><div class="footer-links"><a href="/contact/?enquiry=supply-only">Request supply price</a><a href="/contact/?enquiry=supply-install">Supply + install quote</a><a href="/contact/?enquiry=stock">Check stock availability</a><a href="/projects/">Projects</a><a href="/guides/">Guides</a><a href="/privacy/">Privacy Policy</a><a href="/terms/">Terms</a></div></div></div><div class="shell footer-bottom">© 2026 Oz Timber Floor. Sydney timber flooring supply, installation and preparation.</div></footer>`;
}

const bassRanges = ranges.filter((range) => range.supplier === "Bass Timber" && range.publicCatalogueStatus !== "legacy-hidden");

for (const range of bassRanges) {
  const dir = path.join(root, range.url.replace(/^\/|\/$/g, ""));
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "index.html"), buildPage(range, bassRanges));
}

console.log(`Rebuilt ${bassRanges.length} Bass Timber range pages`);
