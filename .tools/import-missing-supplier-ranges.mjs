import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const dataPath = path.join(root, "data/product-catalogue.json");
const catalogue = JSON.parse(fs.readFileSync(dataPath, "utf8"));

const DOMAIN = "https://oztimberfloor.com.au";
const categoryUrls = {
  Hybrid: "/hybrid-flooring-sydney/",
  Laminate: "/laminate-flooring-sydney/",
  "Engineered timber": "/engineered-timber-flooring-sydney/",
  "Solid timber": "/solid-timber-flooring-sydney/",
  Vinyl: "/vinyl-flooring-sydney/",
};

const productsBySlug = new Map(catalogue.products.map((product) => [product.slug, product]));
const rangeBySlug = new Map(catalogue.ranges.map((range) => [range.slug, range]));

function slugify(value = "") {
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function htmlEscape(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function plus(value = "") {
  return encodeURIComponent(value).replaceAll("%20", "+");
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function titleCase(value = "") {
  return String(value)
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

async function fetchText(url, userAgent = "curl/8.0") {
  const response = await fetch(url, {
    headers: {
      "user-agent": userAgent,
      accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    },
  });
  if (!response.ok) throw new Error(`Failed to fetch ${url}: ${response.status}`);
  return await response.text();
}

async function downloadFile(url, targetPath, userAgent = "curl/8.0") {
  ensureDir(path.dirname(targetPath));
  const response = await fetch(url, {
    headers: {
      "user-agent": userAgent,
      accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
      referer: new URL(url).origin + "/",
    },
  });
  if (!response.ok) throw new Error(`Failed to download ${url}: ${response.status}`);
  const arrayBuffer = await response.arrayBuffer();
  fs.writeFileSync(targetPath, Buffer.from(arrayBuffer));
}

function extFromUrl(url) {
  try {
    const pathname = new URL(url).pathname;
    const ext = path.extname(pathname).toLowerCase();
    return ext || ".jpg";
  } catch {
    return ".jpg";
  }
}

function uniqueBy(items, keyFn) {
  const seen = new Set();
  const output = [];
  for (const item of items) {
    const key = keyFn(item);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    output.push(item);
  }
  return output;
}

function firstMatch(urls, patterns) {
  return urls.find((url) => patterns.some((pattern) => pattern.test(url))) || "";
}

function allMatches(urls, patterns) {
  return uniqueBy(
    urls.filter((url) => patterns.some((pattern) => pattern.test(url))),
    (url) => url,
  );
}

function parseWooBlocks(html) {
  return [...html.matchAll(/<li class="product[\s\S]*?<\/li>/gi)].map((match) => match[0]);
}

function parseWooRangeProducts(html) {
  const blocks = parseWooBlocks(html);
  const items = [];
  for (const block of blocks) {
    const hrefMatch =
      block.match(/<a href="([^"]+)" class="woocommerce-LoopProduct-link/i) ||
      block.match(/woocommerce-LoopProduct-link[^>]+href="([^"]+)"/i);
    const titleMatch =
      block.match(/<h2 class="woocommerce-loop-product__title">([^<]+)<\/h2>/i) ||
      block.match(/woocommerce-LoopProduct-link[^>]+href="[^"]+"[^>]*>([^<]+)/i);
    const imageMatch = block.match(/<img[^>]+src="([^"]+)"/i);
    if (!hrefMatch || !titleMatch || !imageMatch) continue;
    const href = hrefMatch[1].trim();
    const name = titleMatch[1].replace(/&amp;/g, "&").trim();
    const image = imageMatch[1].trim();
    if (!href || !name || !image) continue;
    items.push({ name, href, image });
  }
  return items;
}

async function fetchPagedWooRangeProducts(urls, userAgent = "Mozilla/5.0") {
  const all = [];
  for (const url of urls) {
    const html = await fetchText(url, userAgent);
    all.push(...parseWooRangeProducts(html));
  }
  return uniqueBy(all, (item) => `${item.name.toLowerCase()}|${item.href}`);
}

function parsePreferenceUltimo(html) {
  const urls = [...new Set([...html.matchAll(/https:\/\/preferencefloors\.com\.au\/wp-content\/uploads\/[^"' )]+/g)].map((match) => match[0]))];
  const colourMap = [
    ["Salamanca", [/Salamanca-Ultimo-Vinyl/i]],
    ["Spotted Gum", [/Spotted-Gum-Ultimo-Vinyl/i]],
    ["Valencia", [/Valencia-Ultimo-Vinyl/i]],
    ["Coastal Spotted Gum", [/Ultimo-Costal-Spotted-Gum/i]],
  ];
  return colourMap
    .map(([name, patterns]) => {
      const gallery = allMatches(urls, patterns);
      const image = gallery[0] || "";
      return image ? { name, href: "https://preferencefloors.com.au/brand/ultimo-luxury-vinyl-plank/", image, gallery } : null;
    })
    .filter(Boolean);
}

function parsePreferenceDeMarque(html) {
  const urls = [...new Set([...html.matchAll(/https:\/\/preferencefloors\.com\.au\/wp-content\/uploads\/[^"' )]+/g)].map((match) => match[0]))];
  const colourMap = [
    ["Cannes", [/DM1-Cannes-Demarque/i]],
    ["Sauvignon", [/DM2-Sauvignon-Demarque/i, /DeMarque-Parquetry-Herringbone-Sauvignon/i, /Sauvignon-Herringbone-De-Marque-Parquetry/i]],
    ["Latte", [/Mosman_Latte_detail/i, /Mosman_Latte_dining/i]],
    ["Colonial Grey", [/Chevron-Colonial-Grey/i]],
    ["Vintage", [/Vintage-Herringbone/i]],
    ["Parana", [/Herringbone-Parana-Private-Use-Entry\.jpg/i, /Herringbone-Parana-Private-Use-M/i, /Herringbone-Parana-Private-Use-Work-Space-Play-Space/i, /Herringbone-Parana-Private-Use-entry-living/i]],
    ["Riesling", [/Chevron-Riesling-warm-edit/i, /DM10-Reisling-Living/i]],
    ["Chateau Grey", [/Chateau-Grey-Herringbone/i]],
    ["Pure Natural", [/Pure-Natural/i]],
    ["Valley Oak", [/De-Marque-Wide-Plank-Valley-Oak/i]],
  ];
  return colourMap
    .map(([name, patterns]) => {
      const gallery = allMatches(urls, patterns);
      const image = gallery[0] || "";
      return image ? { name, href: "https://preferencefloors.com.au/brand/demarqueoak/", image, gallery } : null;
    })
    .filter(Boolean);
}

function rangeShortDescription(range) {
  const descriptions = {
    Hybrid: `${range.name} is a hybrid flooring range for customers comparing colour options, stock timing and installation suitability before order.`,
    Laminate: `${range.name} is a laminate flooring range for dry internal rooms where colour choice, stock timing and trim details should be confirmed before order.`,
    "Engineered timber": `${range.name} is an engineered timber range for customers comparing real timber colour options, stock timing and installation planning.`,
    Vinyl: `${range.name} is a vinyl flooring range for customers comparing colour options, stock timing and practical installation planning before order.`,
  };
  return descriptions[range.category] || `${range.name} is a flooring range for customers comparing colours, stock availability and project fit before order.`;
}

function productShortDescription(range, colour) {
  const base = {
    Hybrid: `${colour} hybrid flooring colour in the ${range.name} range for customers checking stock availability, quantity and installation suitability.`,
    Laminate: `${colour} laminate flooring colour in the ${range.name} range for customers checking stock availability, quantity and dry-area suitability.`,
    "Engineered timber": `${colour} engineered timber flooring colour in the ${range.name} range for customers checking stock availability, colour variation and installation planning.`,
    Vinyl: `${colour} vinyl flooring colour in the ${range.name} range for customers checking stock availability, quantity and site suitability.`,
  };
  return base[range.category] || `${colour} flooring colour in the ${range.name} range for customers checking stock availability and project fit.`;
}

function ensureRangeRecord(definition, importedProducts) {
  const existing = rangeBySlug.get(definition.slug) || {};
  const firstImage = importedProducts.find((item) => item.localAsset)?.localAsset || existing.primaryImage || "";
  const record = {
    ...existing,
    id: definition.slug,
    slug: definition.slug,
    url: `/ranges/${definition.slug}/`,
    name: definition.name,
    brand: definition.brand,
    supplier: definition.supplier,
    supplierId: definition.supplierId,
    sourceUrl: definition.sourceUrl,
    canonicalUrl: "",
    category: definition.category,
    shortDescription: definition.shortDescription || rangeShortDescription(definition),
    thickness: definition.thickness || existing.thickness || "",
    boardSize: definition.boardSize || existing.boardSize || "",
    plankSize: definition.plankSize || existing.plankSize || "",
    installationMethod: definition.installationMethod || existing.installationMethod || "",
    finish: definition.finish || existing.finish || "",
    surfaceFinish: definition.surfaceFinish || existing.surfaceFinish || "",
    specSheetUrl: definition.specSheetUrl || existing.specSheetUrl || "",
    brochureUrl: definition.brochureUrl || existing.brochureUrl || "",
    warrantySummary: definition.warrantySummary || existing.warrantySummary || "",
    primaryImage: firstImage,
    thumbnailImage: firstImage,
    heroImage: firstImage,
    productSlugs: importedProducts.map((item) => item.slug),
    products: importedProducts.map((item) => item.slug),
    colourCount: importedProducts.length,
    status: "verified",
    galleryStatus: firstImage ? "supplier-image" : "missing",
    dataCompletenessStatus: "supplier-image-verified",
    visibleInRangeLibrary: true,
    publicCatalogueStatus: "live",
    sourceTag: definition.sourceTag,
  };
  rangeBySlug.set(definition.slug, record);
  return record;
}

function existingSwishSlug(colour) {
  const map = {
    "Blackbutt Natural": "swish-blackbutt",
    "Blackbutt Neat": "swish-blackbutt-neat",
    "Blackbutt Select": "swish-blackbutt-select",
    "Spotted Gum Natural": "swish-spotted-gum",
    "Spotted Gum Neat": "swish-spotted-gum-neat",
    "Spotted Gum Select": "swish-spotted-gum-select",
  };
  return map[colour] || null;
}

function ensureProductRecord(rangeRecord, item) {
  const explicitSlug = item.slug || (rangeRecord.slug === "swish" ? existingSwishSlug(item.name) : null);
  const slug = explicitSlug || `${rangeRecord.slug}-${slugify(item.name)}`;
  const existing = productsBySlug.get(slug) || {};
  const productName = rangeRecord.slug === "swish" ? `${rangeRecord.name} ${item.name}` : item.name;
  const localAsset = item.localAsset || existing.primaryImage || "";
  const imageGallery = item.galleryAssets?.length ? item.galleryAssets : localAsset ? [localAsset] : [];
  const record = {
    ...existing,
    id: slug,
    slug,
    url: `/products/${slug}/`,
    canonicalUrl: "",
    name: productName,
    brand: rangeRecord.brand,
    supplier: rangeRecord.supplier || existing.supplier || "Oz Timber Floor",
    supplierId: rangeRecord.supplierId || existing.supplierId || "",
    supplierSourceUrl: item.href || rangeRecord.sourceUrl,
    sourceUrl: item.href || rangeRecord.sourceUrl,
    range: rangeRecord.name,
    rangeSlug: rangeRecord.slug,
    colour: item.name,
    category: rangeRecord.category,
    shortDescription: productShortDescription(rangeRecord, item.name),
    thickness: rangeRecord.thickness || existing.thickness || "",
    boardSize: rangeRecord.boardSize || existing.boardSize || "",
    plankSize: rangeRecord.plankSize || existing.plankSize || "",
    installationMethod: rangeRecord.installationMethod || existing.installationMethod || "Installation method should be confirmed against the current product sheet, site conditions and project scope.",
    suitableUse: existing.suitableUse || "Stock, site suitability and installation details should be confirmed before order.",
    cautionNotes: existing.cautionNotes || "Stock, colour variation, access and site conditions should be confirmed before order or installation.",
    stockStatusLabel: "Check stock availability",
    imageGallery,
    primaryImage: localAsset,
    altText: `${rangeRecord.name} ${item.name} ${String(rangeRecord.category).toLowerCase()} flooring colour swatch`,
    galleryStatus: imageGallery.length > 1 ? "supplier-gallery" : localAsset ? "supplier-image" : "missing",
    sourceTag: rangeRecord.sourceTag || existing.sourceTag || "Supplier range import",
    noCheckout: true,
    legacyUrl: existing.legacyUrl || `/products/${slug}/`,
    productCode: existing.productCode || "",
    wearLayer: existing.wearLayer || "",
    coreType: existing.coreType || "",
    acousticBacking: existing.acousticBacking || "",
    waterResistance: existing.waterResistance || "",
    acRating: existing.acRating || "",
    edgeDetail: existing.edgeDetail || "",
    species: existing.species || "",
    totalThickness: existing.totalThickness || "",
    structureCore: existing.structureCore || "",
    surfaceFinish: existing.surfaceFinish || "",
    gradeCharacter: existing.gradeCharacter || "",
    boardWidth: existing.boardWidth || "",
    rawOrPrefinished: existing.rawOrPrefinished || "",
    sandingFinishingNotes: existing.sandingFinishingNotes || "",
    plankOrTileFormat: existing.plankOrTileFormat || "",
    commercialSuitability: existing.commercialSuitability || "",
    appearanceTone: existing.appearanceTone || "",
    dataCompletenessStatus: localAsset ? "supplier-image-verified" : "needs-source-review",
  };
  productsBySlug.set(slug, record);
  return record;
}

function writeProductPage(product, range, nearbyProducts) {
  const canonical = `${DOMAIN}${product.url}`;
  const stockHref = `/contact/?enquiry=stock&product=${plus(product.colour || product.name)}&productSlug=${plus(product.slug)}&range=${plus(range.name)}&category=${plus(range.category)}&source=${plus(product.url)}`;
  const supplyHref = `/contact/?enquiry=supply-only&product=${plus(product.colour || product.name)}&productSlug=${plus(product.slug)}&range=${plus(range.name)}&category=${plus(range.category)}&source=${plus(product.url)}`;
  const installHref = `/contact/?enquiry=supply-install&product=${plus(product.colour || product.name)}&productSlug=${plus(product.slug)}&range=${plus(range.name)}&category=${plus(range.category)}&source=${plus(product.url)}`;
  const questionHref = `/contact/?enquiry=product&product=${plus(product.colour || product.name)}&productSlug=${plus(product.slug)}&range=${plus(range.name)}&category=${plus(range.category)}&source=${plus(product.url)}`;
  const categoryUrl = categoryUrls[range.category] || "/products/";
  const categoryLabel = range.category;
  const rangeUrl = range.url;
  const gallery = (product.imageGallery || []).filter(Boolean);
  const galleryFigures = (gallery.length ? gallery : [product.primaryImage]).filter(Boolean).map((src, index) => {
    const classes = index === 0 ? "catalogue-gallery-item primary" : "catalogue-gallery-item";
    const alt = index === 0
      ? product.altText || `${range.name} ${product.colour || product.name} ${String(range.category).toLowerCase()} flooring colour swatch`
      : `${product.altText || `${range.name} ${product.colour || product.name} ${String(range.category).toLowerCase()} flooring colour swatch`} view ${index + 1}`;
    return `<figure class="${classes}"><img src="${htmlEscape(src)}" alt="${htmlEscape(alt)}" loading="lazy" decoding="async"></figure>`;
  }).join("");
  const relatedCards = nearbyProducts
    .filter((item) => item.slug !== product.slug)
    .slice(0, 6)
    .map((item) => {
      const href = item.url || `/products/${item.slug}/`;
      return `<article class="product-card catalogue-card"><img src="${htmlEscape(item.primaryImage)}" alt="${htmlEscape(item.altText || `${range.name} ${item.colour} flooring colour swatch`)}" loading="lazy" decoding="async"><div class="product-body"><p class="catalogue-overline">${htmlEscape(range.name)}</p><h3>${htmlEscape(item.colour || item.name)}</h3><p class="product-meta"><span class="pill">${htmlEscape(range.category)}</span></p><div class="product-actions compact-actions"><a class="button-inline" href="${htmlEscape(href)}">View details</a><a class="button-inline ghost-inline" href="/contact/?enquiry=stock&amp;product=${plus(item.colour || item.name)}&amp;productSlug=${plus(item.slug)}&amp;range=${plus(range.name)}&amp;category=${plus(range.category)}&amp;source=${plus(href)}">Check stock</a></div></div></article>`;
    })
    .join("");
  const title = `${product.name} | Oz Timber Floor`;
  const description = `${product.name} ${String(range.category).toLowerCase()} flooring colour in Sydney. View colour photos, stock enquiry and supply + install options from Oz Timber Floor.`;
  const html = `<!DOCTYPE html><html lang="en-AU"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>${htmlEscape(title)}</title><meta name="description" content="${htmlEscape(description)}"><link rel="canonical" href="${htmlEscape(canonical)}"><link rel="icon" href="/assets/brand/favicon-32.png" sizes="32x32" type="image/png"><link rel="apple-touch-icon" href="/assets/brand/apple-touch-icon.png"><meta name="robots" content="index,follow"><meta property="og:type" content="website"><meta property="og:title" content="${htmlEscape(title)}"><meta property="og:description" content="${htmlEscape(description)}"><meta property="og:url" content="${htmlEscape(canonical)}"><link rel="stylesheet" href="/assets/site.css"><script src="/assets/contact-config.js" defer></script><script src="/assets/site.js" defer></script></head><body><header class="site-header"><div class="shell nav"><a class="brand" href="/" aria-label="Oz Timber Floor home"><img class="brand-logo" src="/assets/brand/oz-timber-floor-logo.webp" alt="Oz Timber Floor" width="680" height="215"><span class="brand-fallback">Oz Timber Floor</span></a><nav class="nav-links" aria-label="Primary"><a href="/">Home</a><div class="nav-item has-dropdown"><a class="nav-parent" href="/services/">Services</a><button class="nav-dropdown-toggle" type="button" aria-label="Toggle services menu" aria-expanded="false"></button><div class="nav-dropdown" role="menu"><a href="/timber-flooring-installation-sydney/" role="menuitem">Timber flooring installation</a><a href="/floor-levelling-sydney/" role="menuitem">Floor levelling</a><a href="/timber-floor-removal-and-stripping-sydney/" role="menuitem">Floor removal</a><a href="/timber-floor-sanding-and-polishing-sydney/" role="menuitem">Sanding and polishing</a><a href="/commercial-flooring-sydney/" role="menuitem">Commercial flooring</a><a href="/builder-flooring-contractor-sydney/" role="menuitem">Builder flooring contractor</a></div></div><div class="nav-item has-dropdown"><a class="nav-parent" href="/products/" aria-current="page">Products</a><button class="nav-dropdown-toggle" type="button" aria-label="Toggle products menu" aria-expanded="false"></button><div class="nav-dropdown" role="menu"><a href="/hybrid-flooring-sydney/" role="menuitem">Hybrid flooring</a><a href="/laminate-flooring-sydney/" role="menuitem">Laminate flooring</a><a href="/engineered-timber-flooring-sydney/" role="menuitem">Engineered timber</a><a href="/solid-timber-flooring-sydney/" role="menuitem">Solid timber</a><a href="/vinyl-flooring-sydney/" role="menuitem">Vinyl flooring</a><a href="/ranges/" role="menuitem">All ranges</a></div></div><a href="/projects/">Projects</a><a href="/guides/">Guides</a><a href="/contact/">Contact</a></nav><button class="nav-toggle" type="button" aria-label="Open menu" aria-expanded="false"><span></span><span></span><span></span></button><div class="header-actions"><a class="button" href="/contact/?enquiry=supply-install&amp;source=header">Request Quote</a></div></div></header><main><div class="mobile-sticky-cta"><a href="${htmlEscape(stockHref)}">Check stock</a><a href="${htmlEscape(questionHref)}">Enquire</a></div><section class="section slim-breadcrumbs"><div class="shell"><nav class="breadcrumbs" aria-label="Breadcrumb"><a href="/">Home</a><span>›</span><a href="/products/">Products</a><span>›</span><a href="${htmlEscape(categoryUrl)}">${htmlEscape(categoryLabel)}</a><span>›</span><a href="${htmlEscape(rangeUrl)}">${htmlEscape(range.name)}</a><span>›</span><span>${htmlEscape(product.colour || product.name)}</span></nav></div></section><section class="hero product-hero"><div class="shell product-hero-grid"><div><p class="eyebrow">${htmlEscape(range.category)} · ${htmlEscape(range.name)}</p><h1>${htmlEscape(product.colour || product.name)}</h1><p class="lead">${htmlEscape(product.shortDescription)}</p><div class="button-row"><a class="button" href="${htmlEscape(supplyHref)}">Request supply price</a><a class="button-secondary" href="${htmlEscape(stockHref)}">Check stock availability</a><a class="button-secondary" href="${htmlEscape(installHref)}">Request supply + install quote</a><a class="button-secondary" href="${htmlEscape(questionHref)}">Ask about this product</a></div></div><div class="catalogue-gallery">${galleryFigures}</div></div></section><section class="section soft catalogue-specs"><div class="shell"><div class="section-head"><div><p class="eyebrow">Product facts</p><h2>${htmlEscape(product.colour || product.name)} details</h2></div><p>Use these details to compare options. Final specifications, stock and installation suitability should be confirmed before ordering.</p></div><div class="spec-grid"><div class="spec-item"><span>Range</span><strong>${htmlEscape(range.name)}</strong></div><div class="spec-item"><span>Colour</span><strong>${htmlEscape(product.colour || product.name)}</strong></div><div class="spec-item"><span>Category</span><strong>${htmlEscape(range.category)}</strong></div>${range.thickness ? `<div class="spec-item"><span>Thickness</span><strong>${htmlEscape(range.thickness)}</strong></div>` : ""}${range.boardSize ? `<div class="spec-item"><span>Board size</span><strong>${htmlEscape(range.boardSize)}</strong></div>` : ""}${range.installationMethod ? `<div class="spec-item"><span>Installation method</span><strong>${htmlEscape(range.installationMethod)}</strong></div>` : ""}</div></div></section><section class="section"><div class="shell"><div class="section-head"><div><p class="eyebrow">Related colours</p><h2>More colours in ${htmlEscape(range.name)}</h2></div><p>Compare nearby colours before sending your final enquiry.</p></div><div class="grid-3">${relatedCards}</div></div></section><section class="section soft"><div class="shell cta"><p class="eyebrow">Product enquiry</p><h2>Ask about ${htmlEscape(product.colour || product.name)}</h2><p>Send the colour, range name, suburb, approximate area and whether you need supply-only, stock check or supply + install support.</p><div class="button-row"><a class="button" href="${htmlEscape(supplyHref)}">Request supply price</a><a class="button-secondary" href="${htmlEscape(stockHref)}">Check stock availability</a><a class="button-secondary" href="${htmlEscape(installHref)}">Request supply + install quote</a></div></div></section></main><footer class="site-footer"><div class="shell footer-grid"><div><img class="footer-brand-logo" src="/assets/brand/oz-timber-floor-logo.webp" alt="Oz Timber Floor" width="680" height="215"><p>Sydney timber flooring supplier, installer, builder flooring contractor and floor preparation specialist.</p></div><div><h3>Services</h3><div class="footer-links"><a href="/timber-flooring-installation-sydney/">Installation</a><a href="/floor-levelling-sydney/">Floor levelling</a><a href="/commercial-flooring-sydney/">Commercial flooring</a><a href="/builder-flooring-contractor-sydney/">Builder contractor</a><a href="/timber-floor-sanding-and-polishing-sydney/">Sanding and polishing</a><a href="/timber-floor-removal-and-stripping-sydney/">Removal and stripping</a></div></div><div><h3>Products</h3><div class="footer-links"><a href="/products/">Products</a><a href="/ranges/">All ranges</a><a href="/hybrid-flooring-sydney/">Hybrid</a><a href="/laminate-flooring-sydney/">Laminate</a><a href="/engineered-timber-flooring-sydney/">Engineered timber</a><a href="/solid-timber-flooring-sydney/">Solid timber</a><a href="/vinyl-flooring-sydney/">Vinyl</a></div></div><div><h3>Enquiries</h3><div class="footer-links"><a href="/contact/?enquiry=supply-only">Request supply price</a><a href="/contact/?enquiry=supply-install">Supply + install quote</a><a href="/contact/?enquiry=stock">Check stock availability</a><a href="/projects/">Projects</a><a href="/guides/">Guides</a><a href="/privacy/">Privacy Policy</a><a href="/terms/">Terms</a></div></div></div><div class="shell footer-bottom">© 2026 Oz Timber Floor. Sydney timber flooring supply, installation and preparation.</div></footer></body></html>`;
  const dir = path.join(root, product.url.replace(/^\/|\/$/g, ""));
  ensureDir(dir);
  fs.writeFileSync(path.join(dir, "index.html"), html);
}

const rangeDefinitions = [
  {
    slug: "etf-10mm-hybrid",
    name: "ETF 10mm Hybrid",
    brand: "ETF 10mm Hybrid",
    supplier: "HRT Timber Flooring",
    supplierId: "hrt-timber-flooring",
    sourceUrl: "https://hrttimberflooring.com.au/product-category/hybrid-flooring/10-0mm-etf-hybrid-waterproof-flooring/",
    category: "Hybrid",
    thickness: "10mm",
    installationMethod: "Floating click installation",
    assetDir: "assets/products/hybrid/etf-10mm-hybrid",
    fetcher: async () => parseWooRangeProducts(await fetchText("https://hrttimberflooring.com.au/product-category/hybrid-flooring/10-0mm-etf-hybrid-waterproof-flooring/", "Mozilla/5.0")),
    sourceTag: "HRT Timber Flooring 10mm ETF range import",
  },
  {
    slug: "etf-6-5mm-hybrid",
    name: "ETF 6.5mm Hybrid",
    brand: "ETF 6.5mm Hybrid",
    supplier: "HRT Timber Flooring",
    supplierId: "hrt-timber-flooring",
    sourceUrl: "https://hrttimberflooring.com.au/product-category/hybrid-flooring/6-5mm-etf-hybrid-waterproof-flooring/",
    category: "Hybrid",
    thickness: "6.5mm",
    installationMethod: "Floating click installation",
    assetDir: "assets/products/hybrid/etf-6-5mm-hybrid",
    fetcher: async () => parseWooRangeProducts(await fetchText("https://hrttimberflooring.com.au/product-category/hybrid-flooring/6-5mm-etf-hybrid-waterproof-flooring/", "Mozilla/5.0")),
    sourceTag: "HRT Timber Flooring 6.5mm ETF range import",
  },
  {
    slug: "etf-7-0mm-hybrid",
    name: "ETF 7.0mm Hybrid",
    brand: "ETF 7.0mm Hybrid",
    supplier: "HRT Timber Flooring",
    supplierId: "hrt-timber-flooring",
    sourceUrl: "https://hrttimberflooring.com.au/product-category/hybrid-flooring/7-0mm-etf-hybrid-waterproof-flooring/",
    category: "Hybrid",
    thickness: "7.0mm",
    boardSize: "1500 mm x 228 mm",
    installationMethod: "Floating click installation",
    assetDir: "assets/products/hybrid/etf-7-0mm-hybrid",
    fetcher: async () => parseWooRangeProducts(await fetchText("https://hrttimberflooring.com.au/product-category/hybrid-flooring/7-0mm-etf-hybrid-waterproof-flooring/", "Mozilla/5.0")),
    sourceTag: "HRT Timber Flooring 7.0mm ETF range import",
  },
  {
    slug: "etf-8-0mm-hybrid",
    name: "ETF 8.0mm Hybrid",
    brand: "ETF 8.0mm Hybrid",
    supplier: "HRT Timber Flooring",
    supplierId: "hrt-timber-flooring",
    sourceUrl: "https://hrttimberflooring.com.au/product-category/hybrid-flooring/8-0mm-etf-hybrid-waterproof-flooring/",
    category: "Hybrid",
    thickness: "8.0mm",
    boardSize: "1810 mm x 228 mm",
    installationMethod: "Floating click installation",
    assetDir: "assets/products/hybrid/etf-8-0mm-hybrid",
    fetcher: async () => parseWooRangeProducts(await fetchText("https://hrttimberflooring.com.au/product-category/hybrid-flooring/8-0mm-etf-hybrid-waterproof-flooring/", "Mozilla/5.0")),
    sourceTag: "HRT Timber Flooring 8.0mm ETF range import",
  },
  {
    slug: "etf-9-0mm-hybrid",
    name: "ETF 9.0mm Hybrid",
    brand: "ETF 9.0mm Hybrid",
    supplier: "HRT Timber Flooring",
    supplierId: "hrt-timber-flooring",
    sourceUrl: "https://hrttimberflooring.com.au/product-category/hybrid-flooring/9-0mm-hybrid-waterproof-flooring/",
    category: "Hybrid",
    thickness: "9.0mm",
    boardSize: "Refer to selected colour brochure",
    installationMethod: "Floating click installation",
    assetDir: "assets/products/hybrid/etf-9-0mm-hybrid",
    fetcher: async () => parseWooRangeProducts(await fetchText("https://hrttimberflooring.com.au/product-category/hybrid-flooring/9-0mm-hybrid-waterproof-flooring/", "Mozilla/5.0")),
    sourceTag: "HRT Timber Flooring 9.0mm ETF range import",
  },
  {
    slug: "etf-9-5mm-hybrid",
    name: "ETF 9.5mm Hybrid",
    brand: "ETF 9.5mm Hybrid",
    supplier: "HRT Timber Flooring",
    supplierId: "hrt-timber-flooring",
    sourceUrl: "https://hrttimberflooring.com.au/product-category/hybrid-flooring/9-5mm-etf-hybrid-waterproof-flooring/",
    category: "Hybrid",
    thickness: "9.5mm",
    installationMethod: "Floating click installation",
    assetDir: "assets/products/hybrid/etf-9-5mm-hybrid",
    fetcher: async () => parseWooRangeProducts(await fetchText("https://hrttimberflooring.com.au/product-category/hybrid-flooring/9-5mm-etf-hybrid-waterproof-flooring/", "Mozilla/5.0")),
    sourceTag: "HRT Timber Flooring 9.5mm ETF range import",
  },
  {
    slug: "etf-hybrid-herringbone",
    name: "ETF Hybrid Herringbone",
    brand: "ETF Hybrid Herringbone",
    supplier: "HRT Timber Flooring",
    supplierId: "hrt-timber-flooring",
    sourceUrl: "https://hrttimberflooring.com.au/product-category/herringbone-waterproof-hybrid-spc-flooring/",
    category: "Hybrid",
    installationMethod: "Floating click installation",
    assetDir: "assets/products/hybrid/etf-hybrid-herringbone",
    fetcher: async () => parseWooRangeProducts(await fetchText("https://hrttimberflooring.com.au/product-category/herringbone-waterproof-hybrid-spc-flooring/", "Mozilla/5.0")),
    sourceTag: "HRT Timber Flooring hybrid herringbone import",
  },
  {
    slug: "etf-72hrs-water-resistant-laminate",
    name: "ETF 72hrs Water Resistant Laminate",
    brand: "ETF 72hrs Water Resistant Laminate",
    supplier: "HRT Timber Flooring",
    supplierId: "hrt-timber-flooring",
    sourceUrl: "https://hrttimberflooring.com.au/product-category/laminate-flooring/12mm-water-resistant-ac5-laminate-flooring/",
    category: "Laminate",
    installationMethod: "Floating click installation",
    assetDir: "assets/products/laminate/etf-72hrs-water-resistant-laminate",
    fetcher: async () => parseWooRangeProducts(await fetchText("https://hrttimberflooring.com.au/product-category/laminate-flooring/12mm-water-resistant-ac5-laminate-flooring/", "Mozilla/5.0")),
    sourceTag: "HRT Timber Flooring 72hr laminate import",
  },
  {
    slug: "etf-12mm-laminate",
    name: "ETF 12mm Laminate",
    brand: "ETF 12mm Laminate",
    supplier: "HRT Timber Flooring",
    supplierId: "hrt-timber-flooring",
    sourceUrl: "https://hrttimberflooring.com.au/product-category/laminate-flooring/12mm-water-resistant-ac4-laminate-flooring/",
    category: "Laminate",
    thickness: "12.0mm",
    boardSize: "1215mm x 196mm",
    installationMethod: "Floating click installation",
    assetDir: "assets/products/laminate/etf-12mm-laminate",
    fetcher: async () => parseWooRangeProducts(await fetchText("https://hrttimberflooring.com.au/product-category/laminate-flooring/12mm-water-resistant-ac4-laminate-flooring/", "Mozilla/5.0")),
    sourceTag: "HRT Timber Flooring 12mm laminate import",
  },
  {
    slug: "etf-1-5-meter-laminate",
    name: "ETF 1.5 meter Laminate",
    brand: "ETF 1.5 meter Laminate",
    supplier: "HRT Timber Flooring",
    supplierId: "hrt-timber-flooring",
    sourceUrl: "https://hrttimberflooring.com.au/product-category/laminate-flooring/12mm-water-resistant-ac4-xl-laminate-flooring/",
    category: "Laminate",
    installationMethod: "Floating click installation",
    assetDir: "assets/products/laminate/etf-1-5-meter-laminate",
    fetcher: async () => parseWooRangeProducts(await fetchText("https://hrttimberflooring.com.au/product-category/laminate-flooring/12mm-water-resistant-ac4-xl-laminate-flooring/", "Mozilla/5.0")),
    sourceTag: "HRT Timber Flooring 1.5m laminate import",
  },
  {
    slug: "aquatuff-flooring",
    name: "ETF Aquatuff Flooring",
    brand: "ETF Aquatuff Flooring",
    supplier: "HRT Timber Flooring",
    supplierId: "hrt-timber-flooring",
    sourceUrl: "https://hrttimberflooring.com.au/product-category/12-3mm-etf-aquatuff-carbon-core-waterproof-hybrid-flooring/",
    category: "Laminate",
    thickness: "12.3mm",
    installationMethod: "Floating click installation",
    assetDir: "assets/products/laminate/etf-aquatuff-flooring",
    fetcher: async () =>
      fetchPagedWooRangeProducts(
        [
          "https://hrttimberflooring.com.au/product-category/12-3mm-etf-aquatuff-carbon-core-waterproof-hybrid-flooring/",
          "https://hrttimberflooring.com.au/product-category/12-3mm-etf-aquatuff-carbon-core-waterproof-hybrid-flooring/page/2/",
        ],
        "Mozilla/5.0",
      ),
    sourceTag: "HRT Timber Flooring Aquatuff range import",
  },
  {
    slug: "swish",
    name: "Swish Native Hardwood",
    brand: "Swish",
    supplier: "Eco Flooring Systems",
    supplierId: "eco-flooring-systems",
    sourceUrl: "https://ecoflooring.com.au/product-category/bamboo/swish-native-hardwood/",
    category: "Engineered timber",
    installationMethod: "Installation method should be confirmed against the current product sheet, site conditions and project scope.",
    assetDir: "assets/products/engineered/swish-native-hardwood",
    fetcher: async () => parseWooRangeProducts(await fetchText("https://ecoflooring.com.au/product-category/bamboo/swish-native-hardwood/", "curl/8.0")).slice(0, 6),
    sourceTag: "Eco Flooring Swish Native Hardwood import",
  },
  {
    slug: "etf-14mm-oak-flooring",
    name: "ETF 14mm Oak Flooring",
    brand: "ETF 14mm Oak Flooring",
    supplier: "HRT Timber Flooring",
    supplierId: "hrt-timber-flooring",
    sourceUrl: "https://hrttimberflooring.com.au/product-category/engineered-timber-flooring/14mm-engineered-oak-timber-flooring/",
    category: "Engineered timber",
    thickness: "14mm",
    installationMethod: "Installation method should be confirmed against the current product sheet, site conditions and project scope.",
    assetDir: "assets/products/engineered/etf-14mm-oak-flooring",
    fetcher: async () => parseWooRangeProducts(await fetchText("https://hrttimberflooring.com.au/product-category/engineered-timber-flooring/14mm-engineered-oak-timber-flooring/", "Mozilla/5.0")),
    sourceTag: "HRT Timber Flooring 14mm engineered oak import",
  },
  {
    slug: "etf-15mm-oak-flooring",
    name: "ETF 15mm Oak Flooring",
    brand: "ETF 15mm Oak Flooring",
    supplier: "HRT Timber Flooring",
    supplierId: "hrt-timber-flooring",
    sourceUrl: "https://hrttimberflooring.com.au/product-category/engineered-timber-flooring/15mm-engineered-oak-timber-flooring/",
    category: "Engineered timber",
    thickness: "15mm",
    installationMethod: "Installation method should be confirmed against the current product sheet, site conditions and project scope.",
    assetDir: "assets/products/engineered/etf-15mm-oak-flooring",
    fetcher: async () => uniqueBy(parseWooRangeProducts(await fetchText("https://hrttimberflooring.com.au/product-category/engineered-timber-flooring/15mm-engineered-oak-timber-flooring/", "Mozilla/5.0")), (item) => item.name.toLowerCase()),
    sourceTag: "HRT Timber Flooring 15mm engineered oak import",
  },
  {
    slug: "etf-australian-engineered",
    name: "ETF Australian Engineered",
    brand: "ETF Australian Engineered",
    supplier: "HRT Timber Flooring",
    supplierId: "hrt-timber-flooring",
    sourceUrl: "https://hrttimberflooring.com.au/product-category/engineered-timber-flooring/australian-hardwoods-timber-floors/",
    category: "Engineered timber",
    installationMethod: "Installation method should be confirmed against the current product sheet, site conditions and project scope.",
    assetDir: "assets/products/engineered/etf-australian-engineered",
    fetcher: async () => parseWooRangeProducts(await fetchText("https://hrttimberflooring.com.au/product-category/engineered-timber-flooring/australian-hardwoods-timber-floors/", "Mozilla/5.0")),
    sourceTag: "HRT Timber Flooring Australian engineered import",
  },
  {
    slug: "etf-oak-chevron",
    name: "ETF Oak Chevron",
    brand: "ETF Oak Chevron",
    supplier: "HRT Timber Flooring",
    supplierId: "hrt-timber-flooring",
    sourceUrl: "https://hrttimberflooring.com.au/product-category/engineered-timber-flooring/etf_15mm_chevron_oak_flooring/",
    category: "Engineered timber",
    installationMethod: "Installation method should be confirmed against the current product sheet, site conditions and project scope.",
    assetDir: "assets/products/engineered/etf-oak-chevron",
    fetcher: async () => uniqueBy(parseWooRangeProducts(await fetchText("https://hrttimberflooring.com.au/product-category/engineered-timber-flooring/etf_15mm_chevron_oak_flooring/", "Mozilla/5.0")), (item) => item.name.toLowerCase()),
    sourceTag: "HRT Timber Flooring oak chevron import",
  },
  {
    slug: "etf-oak-herringbone",
    name: "ETF Oak Herringbone",
    brand: "ETF Oak Herringbone",
    supplier: "HRT Timber Flooring",
    supplierId: "hrt-timber-flooring",
    sourceUrl: "https://hrttimberflooring.com.au/product-category/engineered-timber-flooring/herringbone-oak-parquetry/",
    category: "Engineered timber",
    installationMethod: "Installation method should be confirmed against the current product sheet, site conditions and project scope.",
    assetDir: "assets/products/engineered/etf-oak-herringbone",
    fetcher: async () => parseWooRangeProducts(await fetchText("https://hrttimberflooring.com.au/product-category/engineered-timber-flooring/herringbone-oak-parquetry/", "Mozilla/5.0")),
    sourceTag: "HRT Timber Flooring oak herringbone import",
  },
  {
    slug: "de-marque-oak",
    name: "De Marque Oak",
    brand: "De Marque Oak",
    supplier: "Preference Floors",
    supplierId: "preference-floors",
    sourceUrl: "https://preferencefloors.com.au/brand/demarqueoak/",
    category: "Engineered timber",
    installationMethod: "Wide plank and parquetry installation varies by format; confirm the current Preference Floors installation sheet before order.",
    brochureUrl: "https://preferencefloors.com.au/wp-content/uploads/2022/06/Current-De-Marque-Brochure-Autumn-Update-June-2022-LOW-RES-Preference-Floors.pdf",
    warrantySummary: "Preference Floors engineered oak warranty documents are available; confirm the current sheet and format before order.",
    assetDir: "assets/products/engineered/de-marque-oak",
    fetcher: async () => parsePreferenceDeMarque(await fetchText("https://preferencefloors.com.au/brand/demarqueoak/", "curl/8.0")),
    sourceTag: "Preference Floors De Marque Oak import",
  },
  {
    slug: "ultimo-luxury-vinyl-plank",
    name: "Ultimo Luxury Vinyl Plank",
    brand: "Ultimo Luxury Vinyl Plank",
    supplier: "Preference Floors",
    supplierId: "preference-floors",
    sourceUrl: "https://preferencefloors.com.au/brand/ultimo-luxury-vinyl-plank/",
    category: "Vinyl",
    installationMethod: "Confirm the current Ultimo vinyl installation sheet and subfloor requirements before order.",
    brochureUrl: "https://preferencefloors.com.au/wp-content/uploads/2022/02/Ultimo-Series-2-Brochure-Jan-2022-Preference-Floors.pdf",
    warrantySummary: "Preference Floors Ultimo vinyl warranty documents are available; confirm the current sheet before order.",
    assetDir: "assets/products/vinyl/ultimo-luxury-vinyl-plank",
    fetcher: async () => parsePreferenceUltimo(await fetchText("https://preferencefloors.com.au/brand/ultimo-luxury-vinyl-plank/", "curl/8.0")),
    sourceTag: "Preference Floors Ultimo vinyl import",
  },
];

const requestedSlugs = new Set(process.argv.slice(2));
const activeDefinitions = requestedSlugs.size
  ? rangeDefinitions.filter((definition) => requestedSlugs.has(definition.slug))
  : rangeDefinitions;

const touchedRanges = [];
const touchedProducts = [];

for (const definition of activeDefinitions) {
  const fetched = await definition.fetcher();
  const cleanItems = uniqueBy(fetched, (item) => item.name.toLowerCase());
  const importedItems = [];
  for (const item of cleanItems) {
    const ext = extFromUrl(item.image);
    const fileName = `${slugify(item.name)}${ext}`;
    const localAsset = `/${definition.assetDir}/${fileName}`;
    const localPath = path.join(root, definition.assetDir, fileName);
    if (!fs.existsSync(localPath)) {
      await downloadFile(item.image, localPath, definition.supplier === "HRT Timber Flooring" ? "Mozilla/5.0" : "curl/8.0");
    }
    const gallery = uniqueBy([item.image, ...(item.gallery || [])].filter(Boolean), (url) => url);
    const galleryAssets = [];
    for (const [index, url] of gallery.entries()) {
      const galleryExt = extFromUrl(url);
      const galleryFileName = index === 0 ? fileName : `${slugify(item.name)}-${index + 1}${galleryExt}`;
      const galleryAsset = `/${definition.assetDir}/${galleryFileName}`;
      const galleryPath = path.join(root, definition.assetDir, galleryFileName);
      if (!fs.existsSync(galleryPath)) {
        await downloadFile(url, galleryPath, definition.supplier === "HRT Timber Flooring" ? "Mozilla/5.0" : "curl/8.0");
      }
      galleryAssets.push(galleryAsset);
    }
    importedItems.push({ ...item, localAsset, galleryAssets });
  }
  const rangeRecord = ensureRangeRecord(definition, importedItems);
  touchedRanges.push(rangeRecord.slug);
  const productRecords = importedItems.map((item) => ensureProductRecord(rangeRecord, item));
  rangeRecord.productSlugs = productRecords.map((product) => product.slug);
  rangeRecord.products = productRecords.map((product) => product.slug);
  rangeRecord.colourCount = productRecords.length;
  rangeRecord.primaryImage = productRecords.find((product) => product.primaryImage)?.primaryImage || rangeRecord.primaryImage;
  rangeRecord.thumbnailImage = rangeRecord.primaryImage;
  rangeRecord.heroImage = rangeRecord.primaryImage;
  for (const product of productRecords) touchedProducts.push(product.slug);
  for (const product of productRecords) writeProductPage(product, rangeRecord, productRecords);
}

catalogue.ranges = [...rangeBySlug.values()].sort((a, b) => String(a.slug).localeCompare(String(b.slug)));
catalogue.products = [...productsBySlug.values()].sort((a, b) => String(a.slug).localeCompare(String(b.slug)));

fs.writeFileSync(dataPath, JSON.stringify(catalogue, null, 2) + "\n");

console.log(`Imported ${touchedRanges.length} ranges`);
console.log(`Updated ${touchedProducts.length} products`);
