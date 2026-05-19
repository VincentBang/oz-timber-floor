import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const catalogue = JSON.parse(fs.readFileSync(path.join(root, "data/product-catalogue.json"), "utf8"));
const ranges = catalogue.ranges || [];
const products = catalogue.products || [];

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

const categoryCopy = {
  Hybrid: {
    noun: "hybrid flooring",
    hero: (range) => `${range.name} is a ${range.thickness ? `${range.thickness} ` : ""}hybrid flooring range with practical colours for homes, apartments, rental upgrades and suitable light commercial interiors.`,
    suited: [
      ["Homes and apartments", "Practical colours for everyday residential interiors where product suitability and preparation are checked first."],
      ["Rental upgrades", "Useful for rental or investment properties where availability, timing and installation planning matter."],
      ["Supply-only enquiries", "Suitable when customers want to confirm stock, batch, lead time and quantity before ordering."],
      ["Supply + install", "Useful when Oz Timber Floor needs to review floor condition, access, trims and installation scope."],
    ],
  },
  Laminate: {
    noun: "laminate flooring",
    hero: (range) => `${range.name} is a laminate flooring range for dry internal rooms, rental upgrades and budget-aware renovations where stock, trims and subfloor suitability should be confirmed.`,
    suited: [
      ["Dry internal rooms", "A practical timber-look pathway for bedrooms, living areas and other suitable dry spaces."],
      ["Budget-aware renovations", "Useful for customers comparing appearance, availability and installation timing."],
      ["Supply-only enquiries", "Suitable when colour, quantity, trims and stock need confirmation before ordering."],
      ["Supply + install", "Useful when floor flatness, access and installation scope should be reviewed together."],
    ],
  },
  "Engineered timber": {
    noun: "engineered timber flooring",
    hero: (range) => `${range.name} is an engineered timber range for premium interiors where real timber character, installation method and subfloor conditions should be confirmed before order.`,
    suited: [
      ["Premium interiors", "A real timber surface option for homes, apartments, offices and builder projects."],
      ["Apartments and offices", "Useful where appearance, access, trims and installation method need early planning."],
      ["Supply-only enquiries", "Suitable when stock, batch, colour and product sheet details need confirmation."],
      ["Supply + install", "Useful when the installation method, floor condition and expansion details should be reviewed."],
    ],
  },
  "Solid timber": {
    noun: "solid timber flooring",
    hero: (range) => `${range.name} is a solid timber flooring pathway for long-term timber projects where species, installation method, finishing and site conditions need careful planning.`,
    suited: [
      ["Long-term timber projects", "A natural hardwood pathway where material choice and installation planning matter."],
      ["Renovations", "Useful when matching, sanding, coating or finishing details need to be discussed."],
      ["Supply-only enquiries", "Suitable when species, quantity and board details need confirmation before ordering."],
      ["Supply + install", "Useful when subfloor, access, fixing method and finishing sequence should be reviewed."],
    ],
  },
  Vinyl: {
    noun: "vinyl flooring",
    hero: (range) => `${range.name} is a vinyl flooring range for practical residential, rental or suitable commercial spaces where product type and site conditions should be confirmed.`,
    suited: [
      ["Practical interiors", "A product pathway for customers comparing low-maintenance flooring options."],
      ["Rental or commercial enquiries", "Useful where timing, availability and site suitability need confirmation."],
      ["Supply-only enquiries", "Suitable when customers need stock, batch, colour and quantity checked."],
      ["Supply + install", "Useful when subfloor preparation, joins, trims and access should be reviewed."],
    ],
  },
};

function cleanSlug(value = "") {
  return String(value)
    .replace(/^\/?products\//, "")
    .replace(/^\/?ranges\//, "")
    .replace(/\/$/, "")
    .trim()
    .toLowerCase();
}

function slugify(value = "") {
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
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

function fileExistsForUrl(url = "") {
  return fs.existsSync(path.join(root, url.replace(/^\/|\/$/g, ""), "index.html"));
}

function imageExists(src = "") {
  return src && !src.includes("coming-soon") && src.startsWith("/assets/") && fs.existsSync(path.join(root, src.replace(/^\//, "")));
}

function displayInstall(value = "") {
  return String(value)
    .replace(/Floating Floor \(Licensed Click System\)/gi, "Floating click installation")
    .replace(/Floating click system/gi, "Floating click installation")
    .replace(/; confirm range-specific subfloor requirements/gi, "")
    .trim();
}

function specRows(range, rangeProducts) {
  const rows = [
    ["Range", range.name],
    ["Category", range.category],
    ["Thickness", range.thickness],
    ["Board size", range.boardSize || range.plankSize],
    ["Installation method", displayInstall(range.installationMethod)],
    ["Surface / finish", range.finish || range.surfaceFinish],
    ["Colours", range.colourCount || rangeProducts.length],
  ];
  if (range.warrantySummary && !/confirm product details before order/i.test(range.warrantySummary)) {
    rows.push(["Warranty", range.warrantySummary]);
  }
  return rows
    .map(([label, value]) => [label, String(value || "").trim()])
    .filter(([, value]) => value && !/^confirm current/i.test(value) && !/^confirm product/i.test(value));
}

function rangeProducts(range) {
  const seen = new Set();
  const fromSlugs = [...(range.productSlugs || []), ...(range.products || [])]
    .map(cleanSlug)
    .map((slug) => productById.get(slug))
    .filter(Boolean);
  const fromRange = productsByRange.get(cleanSlug(range.slug || range.id || range.name)) || [];
  return [...fromSlugs, ...fromRange].filter((product) => {
    const key = cleanSlug(product.id || product.slug || product.url);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function bestImage(range, rangeProducts) {
  const candidates = [
    range.primaryImage,
    range.thumbnailImage,
    range.heroImage,
    ...rangeProducts.map((product) => product.primaryImage),
  ];
  return candidates.find(imageExists) || "";
}

function missingImageState(name) {
  return `<div class="missing-image-state" role="img" aria-label="${esc(`${name} colour image to confirm`)}"><span>Image to confirm</span><small>Ask for current sample</small></div>`;
}

function imageOrState(src, alt, name) {
  if (imageExists(src)) return `<img src="${esc(src)}" alt="${esc(alt)}" loading="lazy" decoding="async">`;
  return missingImageState(name);
}

function productCard(product, range) {
  const name = product.name || product.colour || "Colour option";
  const productSlug = cleanSlug(product.id || product.slug || product.url);
  const productUrl = product.url || `/products/${productSlug}/`;
  const category = product.category || range.category;
  const stockHref = `/contact/?enquiry=stock&product=${plus(name)}&productSlug=${plus(productSlug)}&range=${plus(range.name)}&category=${plus(category)}&source=${plus(range.url)}`;
  const pills = [category, product.thickness, product.boardSize || product.plankSize]
    .filter(Boolean)
    .filter((pill) => String(pill).length <= 32)
    .slice(0, 3);
  const alt = product.altText || `${range.name} ${product.colour || name} ${String(category).toLowerCase()} colour swatch`;
  return `<article class="product-card catalogue-card">${imageOrState(product.primaryImage, alt, name)}<div class="product-body"><p class="catalogue-overline">${esc(range.name)}</p><h3>${esc(name)}</h3><p class="product-meta">${pills.map((pill) => `<span class="pill">${esc(pill)}</span>`).join("")}</p><div class="product-actions compact-actions"><a class="button-inline" href="${esc(productUrl)}">View details</a><a class="button-inline ghost-inline" href="${esc(stockHref)}">Check stock</a></div></div></article>`;
}

function fitCards(range) {
  const copy = categoryCopy[range.category] || categoryCopy.Hybrid;
  return copy.suited.map(([title, text]) => `<article class="fit-card"><span class="insight-label">Fit</span><h3>${esc(title)}</h3><p>${esc(text)}</p></article>`).join("");
}

function confirmCards(range) {
  const category = range.category || "";
  const methodTitle = category === "Solid timber" ? "Species and finish" : category === "Engineered timber" ? "Installation method" : category === "Vinyl" ? "Product type" : "Stock and batch";
  const methodText = category === "Solid timber"
    ? "Confirm timber species, board details, finish pathway and order quantity before booking work."
    : category === "Engineered timber"
      ? "Confirm floating or direct-stick method, product sheet details and site requirements before ordering."
      : category === "Vinyl"
        ? "Confirm plank, tile or sheet format and suitability for the intended room or project."
        : "Confirm current availability, batch and lead time before payment or installation planning.";
  return [
    ["Confirm", methodTitle, methodText],
    ["Review", "Floor condition", "Review subfloor flatness, moisture and stability before installation."],
    ["Plan", "Trims and transitions", "Check doorways, adjoining floors, skirting, scotia and expansion requirements."],
    ["Check", "Project suitability", "Some rooms, site conditions or usage types may need supplier or installer confirmation first."],
  ].map(([label, title, text]) => `<article class="caution-card"><span class="insight-label">${esc(label)}</span><h3>${esc(title)}</h3><p>${esc(text)}</p></article>`).join("");
}

function titleCase(value = "") {
  return String(value)
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function labelCase(value = "") {
  const text = String(value).trim();
  return text ? text.charAt(0).toUpperCase() + text.slice(1) : "";
}

function isCategoryStyleRange(range, noun) {
  const name = String(range.name || "").toLowerCase();
  const category = String(range.category || "").toLowerCase();
  const nounLower = String(noun || "").toLowerCase();
  return name === category || name === nounLower || name === `${category} flooring`;
}

function titleForRange(range, noun) {
  if (isCategoryStyleRange(range, noun)) {
    return `${titleCase(noun)} Range | Oz Timber Floor`;
  }
  return `${range.name} ${range.category} Range | Oz Timber Floor`;
}

function h1ForRange(range, noun) {
  if (isCategoryStyleRange(range, noun)) {
    return `${labelCase(noun)} ranges`;
  }
  return `${range.name} ${noun} range`;
}

function descriptionForRange(range, noun) {
  if (isCategoryStyleRange(range, noun)) {
    return `Browse ${noun} ranges, colours and stock enquiries in Sydney. Ask Oz Timber Floor for supply-only or supply + install support.`;
  }
  return `Browse ${range.name} ${String(range.category).toLowerCase()} colours, specs and stock enquiries in Sydney. Ask Oz Timber Floor for supply-only or supply + install support.`;
}

function relatedRanges(range, canonicalByName) {
  const seen = new Set([canonicalByName.get(range.name.toLowerCase())?.slug || range.slug, range.name.toLowerCase()]);
  return ranges
    .filter((item) => item.category === range.category)
    .filter((item) => {
      const canonical = canonicalByName.get(String(item.name).toLowerCase());
      if (canonical && canonical.slug !== item.slug) return false;
      const nameKey = String(item.name).toLowerCase();
      if (seen.has(item.slug) || seen.has(nameKey)) return false;
      seen.add(item.slug);
      seen.add(nameKey);
      return item.visibleInRangeLibrary !== false && item.publicCatalogueStatus !== "legacy-hidden";
    })
    .slice(0, 6);
}

function rangeCard(range) {
  const pills = [range.category, range.thickness, range.colourCount ? `${range.colourCount} colours` : ""].filter(Boolean).slice(0, 3);
  const img = bestImage(range, rangeProducts(range));
  return `<a class="card range-summary-card link-card" href="${esc(range.url)}">${img ? `<img class="category-thumb" src="${esc(img)}" alt="${esc(`${range.name} ${String(range.category).toLowerCase()} colour swatch`)}" loading="lazy" decoding="async">` : ""}<p class="catalogue-overline">${esc(range.category || "Flooring range")}</p><h3>${esc(range.name)}</h3><p>${esc(range.shortDescription || categoryCopy[range.category]?.hero(range) || "Compare colours, specifications, stock availability and project fit for this flooring range.")}</p><p class="product-meta">${pills.map((pill) => `<span class="pill">${esc(pill)}</span>`).join("")}</p><span class="card-arrow" aria-hidden="true">→</span></a>`;
}

function header() {
  return `<header class="site-header"><div class="shell nav"><a class="brand" href="/" aria-label="Oz Timber Floor home"><img class="brand-logo" src="/assets/brand/oz-timber-floor-logo.webp" alt="Oz Timber Floor" width="680" height="215"><span class="brand-fallback">Oz Timber Floor</span></a><nav class="nav-links" aria-label="Primary"><a href="/">Home</a><div class="nav-item has-dropdown"><a class="nav-parent" href="/services/">Services</a><button class="nav-dropdown-toggle" type="button" aria-label="Toggle services menu" aria-expanded="false"></button><div class="nav-dropdown" role="menu"><a href="/timber-flooring-installation-sydney/" role="menuitem">Timber flooring installation</a><a href="/floor-levelling-sydney/" role="menuitem">Floor levelling</a><a href="/timber-floor-removal-and-stripping-sydney/" role="menuitem">Floor removal</a><a href="/timber-floor-sanding-and-polishing-sydney/" role="menuitem">Sanding and polishing</a><a href="/commercial-flooring-sydney/" role="menuitem">Commercial flooring</a><a href="/builder-flooring-contractor-sydney/" role="menuitem">Builder flooring contractor</a></div></div><div class="nav-item has-dropdown"><a class="nav-parent" href="/products/" aria-current="page">Products</a><button class="nav-dropdown-toggle" type="button" aria-label="Toggle products menu" aria-expanded="false"></button><div class="nav-dropdown" role="menu"><a href="/hybrid-flooring-sydney/" role="menuitem">Hybrid flooring</a><a href="/laminate-flooring-sydney/" role="menuitem">Laminate flooring</a><a href="/engineered-timber-flooring-sydney/" role="menuitem">Engineered timber</a><a href="/solid-timber-flooring-sydney/" role="menuitem">Solid timber</a><a href="/vinyl-flooring-sydney/" role="menuitem">Vinyl flooring</a><a href="/ranges/" role="menuitem">All ranges</a></div></div><a href="/projects/">Projects</a><a href="/guides/">Guides</a><a href="/contact/">Contact</a></nav><button class="nav-toggle" type="button" aria-label="Open menu" aria-expanded="false"><span></span><span></span><span></span></button><div class="header-actions"><a class="button" href="/contact/?enquiry=supply-install&amp;source=header">Request Quote</a></div></div></header>`;
}

function footer() {
  return `<footer class="site-footer"><div class="shell footer-grid"><div><img class="footer-brand-logo" src="/assets/brand/oz-timber-floor-logo.webp" alt="Oz Timber Floor" width="680" height="215"><p>Sydney timber flooring supplier, installer, builder flooring contractor and floor preparation specialist.</p></div><div><h3>Services</h3><div class="footer-links"><a href="/timber-flooring-installation-sydney/">Installation</a><a href="/floor-levelling-sydney/">Floor levelling</a><a href="/commercial-flooring-sydney/">Commercial flooring</a><a href="/builder-flooring-contractor-sydney/">Builder contractor</a><a href="/timber-floor-sanding-and-polishing-sydney/">Sanding and polishing</a><a href="/timber-floor-removal-and-stripping-sydney/">Removal and stripping</a></div></div><div><h3>Products</h3><div class="footer-links"><a href="/products/">Products</a><a href="/ranges/">All ranges</a><a href="/hybrid-flooring-sydney/">Hybrid</a><a href="/laminate-flooring-sydney/">Laminate</a><a href="/engineered-timber-flooring-sydney/">Engineered timber</a><a href="/solid-timber-flooring-sydney/">Solid timber</a><a href="/vinyl-flooring-sydney/">Vinyl</a></div></div><div><h3>Enquiries</h3><div class="footer-links"><a href="/contact/?enquiry=supply-only">Request supply price</a><a href="/contact/?enquiry=supply-install">Supply + install quote</a><a href="/contact/?enquiry=stock">Check stock availability</a><a href="/projects/">Projects</a><a href="/guides/">Guides</a><a href="/privacy/">Privacy Policy</a><a href="/terms/">Terms</a></div></div></div><div class="shell footer-bottom">© 2026 Oz Timber Floor. Sydney timber flooring supply, installation and preparation.</div></footer>`;
}

function page(range, canonicalByName) {
  const rangeItems = rangeProducts(range);
  const image = bestImage(range, rangeItems);
  const copy = categoryCopy[range.category] || categoryCopy.Hybrid;
  const title = titleForRange(range, copy.noun);
  const description = descriptionForRange(range, copy.noun);
  const canonical = `https://oztimberfloor.com.au${range.url}`;
  const stockHref = `/contact/?enquiry=stock&range=${plus(range.name)}&category=${plus(range.category)}&source=${plus(range.url)}`;
  const supplyHref = `/contact/?enquiry=supply-only&range=${plus(range.name)}&category=${plus(range.category)}&source=${plus(range.url)}`;
  const installHref = `/contact/?enquiry=supply-install&range=${plus(range.name)}&category=${plus(range.category)}&source=${plus(range.url)}`;
  const productHref = `/contact/?enquiry=product&range=${plus(range.name)}&category=${plus(range.category)}&source=${plus(range.url)}`;
  const prepHref = `/contact/?enquiry=service&topic=preparation&range=${plus(range.name)}&category=${plus(range.category)}&source=${plus(range.url)}`;
  const rows = specRows(range, rangeItems);
  const related = relatedRanges(range, canonicalByName);
  const missingImageCount = rangeItems.filter((product) => !imageExists(product.primaryImage)).length;
  const showColourGrid = rangeItems.length && (missingImageCount <= 6 || missingImageCount / rangeItems.length <= 0.35);
  const colourGrid = showColourGrid
    ? `<div class="grid-3">${rangeItems.map((product) => productCard(product, range)).join("")}</div>`
    : `<div class="card missing-range-data"><h3>Colour list to confirm</h3><p>Ask Oz Timber Floor for the current colour list, samples and stock availability for this range.</p><a class="card-link" href="${esc(productHref)}">Ask about this range</a></div>`;
  const faq = [
    [`Can Oz Timber Floor supply ${range.name} without installation?`, `Yes. Send a supply-only enquiry with the preferred colour, quantity and suburb so stock, batch and lead time can be checked.`],
    [`Can ${range.name} be quoted with installation?`, `Yes. Include your suburb, approximate area, current floor and access details so preparation and installation scope can be reviewed.`],
    [`Should I choose a colour before checking stock?`, `You can shortlist colours first, but current stock, batch and product details should be confirmed before final ordering.`],
  ];
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
  return `<!DOCTYPE html><html lang="en-AU"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>${esc(title)}</title><meta name="description" content="${esc(description)}"><link rel="canonical" href="${esc(canonical)}"><link rel="icon" href="/assets/brand/favicon-32.png" sizes="32x32" type="image/png"><link rel="apple-touch-icon" href="/assets/brand/apple-touch-icon.png"><meta name="robots" content="index,follow"><meta property="og:type" content="website"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(description)}"><meta property="og:url" content="${esc(canonical)}"><link rel="stylesheet" href="/assets/site.css"><script src="/assets/contact-config.js" defer></script><script src="/assets/site.js" defer></script><script type="application/ld+json">${JSON.stringify(jsonLd)}</script></head><body>${header()}<main><section class="section slim-breadcrumbs"><div class="shell"><nav class="breadcrumbs" aria-label="Breadcrumb"><a href="/">Home</a><span>›</span><a href="/products/">Products</a><span>›</span><a href="/ranges/">Ranges</a><span>›</span><span>${esc(range.name)}</span></nav></div></section><section class="hero"><div class="shell hero-grid"><div><p class="eyebrow">${esc(range.category)} range</p><h1>${esc(h1ForRange(range, copy.noun))}</h1><p class="lead">${esc(range.shortDescription || copy.hero(range))}</p><div class="button-row"><a class="button" href="#colours">View colours</a><a class="button-secondary" href="${esc(stockHref)}">Check stock</a></div></div><div class="hero-media">${image ? `<img src="${esc(image)}" alt="${esc(`${range.name} ${String(range.category).toLowerCase()} colour swatch`)}" loading="lazy" decoding="async">` : missingImageState(range.name)}<div class="hero-badge"><span>${esc(range.category)}</span>${range.thickness ? `<span>${esc(range.thickness)}</span>` : ""}<span>${esc(range.colourCount || rangeItems.length || "Colour")} colours</span></div></div></div></section><section class="section soft"><div class="shell"><div class="section-head"><div><p class="eyebrow">Start here</p><h2>What do you need help with?</h2></div><p>Choose the next step based on whether you are still comparing colours or ready to confirm stock, supply or installation.</p></div><div class="grid-4"><a class="category-card link-card" href="#colours"><strong>View colours</strong><p>Compare every colour available in this range.</p><span class="card-arrow" aria-hidden="true">→</span></a><a class="category-card link-card" href="${esc(stockHref)}"><strong>Check stock</strong><p>Already know the colour? Ask us to confirm current stock, batch and lead time.</p><span class="card-arrow" aria-hidden="true">→</span></a><a class="category-card link-card" href="${esc(supplyHref)}"><strong>Request supply price</strong><p>For supply-only enquiries, include colour, quantity and suburb.</p><span class="card-arrow" aria-hidden="true">→</span></a><a class="category-card link-card" href="${esc(installHref)}"><strong>Request supply + install quote</strong><p>For installed flooring, include area, current floor and access details.</p><span class="card-arrow" aria-hidden="true">→</span></a></div></div></section><section class="section catalogue-products" id="colours"><div class="shell"><div class="section-head"><div><p class="eyebrow">Available colours</p><h2>${esc(range.name)} colours</h2></div><p>Open a colour page for product details, or check stock directly from the colour card.</p></div>${colourGrid}</div></section><section class="section soft catalogue-specs"><div class="shell"><div class="section-head"><div><p class="eyebrow">Range snapshot</p><h2>${esc(range.name)} specifications</h2></div><p>Stock, batch, warranty and current product specifications are confirmed before order.</p></div><div class="spec-grid">${rows.map(([label, value]) => `<div class="spec-item"><span>${esc(label)}</span><strong>${esc(value)}</strong></div>`).join("")}</div></div></section><section class="section"><div class="shell"><div class="section-head"><div><p class="eyebrow">Project fit</p><h2>Best suited for</h2></div><p>Use these notes to decide whether this range belongs on your shortlist before checking colour, stock and installation details.</p></div><div class="fit-grid">${fitCards(range)}</div></div></section><section class="section soft"><div class="shell"><div class="section-head"><div><p class="eyebrow">Before ordering</p><h2>Confirm before ordering</h2></div><p>These checks help keep product choice, site conditions and installation expectations clear.</p></div><div class="caution-grid">${confirmCards(range)}</div></div></section><section class="section"><div class="shell"><div class="section-head"><div><p class="eyebrow">Range help</p><h2>Need help choosing this range?</h2></div><p>Send your preferred colours, suburb, approximate floor area, current floor type and any photos or plans. Oz Timber Floor can help confirm stock, preparation and installation suitability before you order.</p></div><div class="button-row"><a class="button" href="${esc(stockHref)}">Check stock</a><a class="button-secondary" href="${esc(installHref)}">Request supply + install quote</a><a class="button-secondary" href="${esc(prepHref)}">Ask about preparation</a></div><p class="section-action">Not sure about floor levels? <a href="/floor-levelling-sydney/">Read about floor levelling in Sydney</a>.</p></div></section>${related.length ? `<section class="section soft"><div class="shell"><div class="section-head"><div><p class="eyebrow">Related ranges</p><h2>Compare nearby options</h2></div><p>These ranges sit in the same broad flooring category.</p></div><div class="grid-3">${related.map(rangeCard).join("")}</div></div></section>` : ""}<section class="section" id="faqs"><div class="shell"><div class="section-head"><div><p class="eyebrow">FAQ</p><h2>Questions about ${esc(range.name)}</h2></div></div><div class="faq-list">${faq.map(([question, answer]) => `<details class="faq-item"><summary>${esc(question)}</summary><div><p>${esc(answer)}</p></div></details>`).join("")}</div></div></section><section class="section soft"><div class="shell cta"><p class="eyebrow">Range enquiry</p><h2>Ready to ask about ${esc(range.name)}?</h2><p>Send the range name, preferred colours, suburb, approximate area and whether you need supply-only, stock check or supply + install support.</p><div class="button-row"><a class="button" href="${esc(supplyHref)}">Request supply price</a><a class="button-secondary" href="${esc(stockHref)}">Check stock availability</a><a class="button-secondary" href="${esc(installHref)}">Supply + install</a></div></div></section></main>${footer()}</body></html>`;
}

function parseLegacyRange(slug) {
  const file = path.join(root, "ranges", slug, "index.html");
  const html = fs.readFileSync(file, "utf8");
  const rawTitle = html.match(/<title>(.*?)<\/title>/)?.[1] || "";
  const rawH1 = html.match(/<h1>(.*?)<\/h1>/)?.[1] || "";
  const text = `${rawH1} ${rawTitle}`.replace(/<[^>]+>/g, " ");
  let name = rawH1
    .replace(/\s+(hybrid|laminate|engineered timber|solid timber|vinyl)?\s*flooring range$/i, "")
    .replace(/\s+ranges?$/i, "")
    .trim();
  if (!name || /^(hybrid|laminate|engineered timber|solid timber|vinyl)$/i.test(name)) {
    name = rawTitle.split("|")[0].replace(/\s+Flooring\s+Ranges?$/i, "").replace(/\s+Ranges?$/i, "").trim();
  }
  name = name
    .replace(/\s+(Hybrid|Laminate|Engineered timber|Solid timber|Vinyl)\s+Flooring\s+Range$/i, "")
    .replace(/\s+Flooring\s+Range$/i, "")
    .replace(/\s+Ranges?$/i, "")
    .replace(/\b(Vinyl|Laminate|Hybrid|Engineered timber|Solid timber)\s+\1\b/gi, "$1")
    .trim();
  if (!name) name = slug.split("-").map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" ");
  let category = "Hybrid";
  if (/laminate/i.test(text)) category = "Laminate";
  else if (/engineered|oak|hardwood/i.test(text)) category = "Engineered timber";
  else if (/solid|raw timber/i.test(text)) category = "Solid timber";
  else if (/vinyl/i.test(text)) category = "Vinyl";
  else if (/hybrid/i.test(text)) category = "Hybrid";
  const productUrls = [...html.matchAll(/href="(\/products\/[^"]+\/)"/g)].map((match) => cleanSlug(match[1]));
  const seen = new Set();
  const legacyProducts = productUrls
    .map((key) => productById.get(key))
    .filter(Boolean)
    .filter((product) => {
      const key = cleanSlug(product.url || product.id);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  const specValues = {};
  for (const match of html.matchAll(/<div class="spec-item"><span>(.*?)<\/span><strong>(.*?)<\/strong><\/div>/g)) {
    const label = match[1].replace(/<[^>]+>/g, "").trim().toLowerCase();
    const value = match[2].replace(/<[^>]+>/g, "").trim();
    if (value && !/confirm product details before order/i.test(value)) specValues[label] = value;
  }
  return {
    id: slug,
    slug,
    url: `/ranges/${slug}/`,
    name,
    category,
    shortDescription: `${name} is a ${String(category).toLowerCase()} range for customers comparing colours, specifications, stock availability and project fit.`,
    thickness: specValues.thickness || "",
    boardSize: specValues["board size"] || "",
    installationMethod: specValues["installation method"] || "",
    colourCount: legacyProducts.length || "",
    primaryImage: legacyProducts.find((product) => imageExists(product.primaryImage))?.primaryImage || "",
    products: legacyProducts.map((product) => cleanSlug(product.id || product.url)),
    productSlugs: legacyProducts.map((product) => cleanSlug(product.id || product.url)),
    legacyRangePage: true,
  };
}

const existingRangeDirs = fs.readdirSync(path.join(root, "ranges"), { withFileTypes: true })
  .filter((entry) => entry.isDirectory() && fs.existsSync(path.join(root, "ranges", entry.name, "index.html")))
  .map((entry) => entry.name);
const knownSlugs = new Set(ranges.map((range) => range.slug));
const orphanDirs = existingRangeDirs.filter((slug) => !knownSlugs.has(slug)).sort();
const legacyRanges = orphanDirs.map(parseLegacyRange);
const allRangesForRelated = [...ranges, ...legacyRanges];

const canonicalByName = new Map();
for (const range of allRangesForRelated) {
  if (!range.name || range.publicCatalogueStatus === "legacy-hidden" || range.visibleInRangeLibrary === false) continue;
  const key = String(range.name).toLowerCase();
  if (!canonicalByName.has(key)) canonicalByName.set(key, range);
  else {
    const current = canonicalByName.get(key);
    if (imageExists(range.primaryImage) && !imageExists(current.primaryImage)) canonicalByName.set(key, range);
  }
}

let written = 0;
const duplicateNotes = [];
const colourListReviewNotes = [];
for (const range of allRangesForRelated) {
  if (!range.slug || !range.url) continue;
  const canonical = canonicalByName.get(String(range.name || "").toLowerCase());
  if (canonical && canonical.slug !== range.slug) {
    duplicateNotes.push(`- ${range.url} duplicates ${canonical.url} for range name "${range.name}". Review redirect/canonical decision.`);
  }
  const items = rangeProducts(range);
  const missingImages = items.filter((product) => !imageExists(product.primaryImage)).length;
  if (!items.length || (missingImages > 6 && missingImages / items.length > 0.35)) {
    colourListReviewNotes.push(`- ${range.url} needs colour/image data review before showing a full colour grid.`);
  }
  const dir = path.join(root, range.url.replace(/^\/|\/$/g, ""));
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "index.html"), page(range, canonicalByName));
  written += 1;
}

fs.writeFileSync(path.join(root, "docs/range_template_rebuild_report.md"), `# Range Template Rebuild Report

Updated: 2026-05-17

## Pages regenerated

- ${ranges.length} range pages were regenerated from \`data/product-catalogue.json\`.
- ${legacyRanges.length} existing legacy range folders were also rebuilt into the clean range template using their existing product links where available.
- ${written} total range pages were written.
- Avala was used as the reference issue list and now follows the new range page structure.

## Duplicate range URL review

${duplicateNotes.length ? duplicateNotes.join("\n") : "- No duplicate range names detected in the central catalogue."}

## Colour and image data review

These range pages avoid showing a placeholder-heavy colour grid. Review product links and exact colour images before exposing a full colour grid.

${colourListReviewNotes.length ? colourListReviewNotes.join("\n") : "- No placeholder-heavy range colour grids detected."}

## Existing range folders not in central catalogue

These folders were cleaned visually, but they are not represented in \`data/product-catalogue.json\`. Review whether they should redirect to canonical range pages or be added to the central catalogue before launch.

${orphanDirs.length ? orphanDirs.map((slug) => `- /ranges/${slug}/`).join("\n") : "- None."}
`);

console.log(`Regenerated ${written} range pages`);
console.log(`Duplicate notes: ${duplicateNotes.length}`);
console.log(`Orphan range folders: ${orphanDirs.length}`);
