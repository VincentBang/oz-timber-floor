import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";

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

const mappings = [
  { operonRangeId: "engineered-preference-de-marque-oak", ozRangeSlug: "de-marque-oak" },
  { operonRangeId: "hybrid-preference-iconic-wpc", ozRangeSlug: "iconic-wpc" },
  { operonRangeId: "laminate-preference-oakleaf-laminate", ozRangeSlug: "oakleaf-laminate" },
  { operonRangeId: "engineered-preference-elk-falls-hickory", ozRangeSlug: "elk-falls" },
  { operonRangeId: "engineered-preference-prestige-oak", ozRangeSlug: "prestige-oak" },
  { operonRangeId: "hybrid-preference-lifestyle-collection-epc", ozRangeSlug: "lifestyle-collection" },
  { operonRangeId: "laminate-preference-aspect", ozRangeSlug: "wide-plank-water-resistant-laminate" },
  { operonRangeId: "engineered-preference-pronto-engineered-oak-flooring", ozRangeSlug: "pronto" },
  { operonRangeId: "hybrid-preference-hydroplank-wpc", ozRangeSlug: "hydroplank-wpc" },
];

const operonScriptUrls = [
  "https://operonflooring.com.au/pricingSourceConfig.js",
  "https://operonflooring.com.au/pricingSource.js",
  "https://operonflooring.com.au/preference-floors-import.js",
  "https://operonflooring.com.au/products.js",
];

const productsBySlug = new Map(catalogue.products.map((product) => [product.slug, product]));
const rangesBySlug = new Map(catalogue.ranges.map((range) => [range.slug, range]));

function slugify(value = "") {
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normaliseName(value = "") {
  return String(value).toLowerCase().replace(/&/g, " and ").replace(/[^a-z0-9]+/g, " ").trim().replace(/\s+/g, " ");
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

async function fetchText(url, userAgent = "Mozilla/5.0") {
  const response = await fetch(url, {
    headers: {
      "user-agent": userAgent,
      accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    },
  });
  if (!response.ok) throw new Error(`Failed to fetch ${url}: ${response.status}`);
  return await response.text();
}

async function downloadFile(url, targetPath, userAgent = "Mozilla/5.0") {
  ensureDir(path.dirname(targetPath));
  const response = await fetch(url, {
    headers: {
      "user-agent": userAgent,
      accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
      referer: new URL(url).origin + "/",
    },
  });
  if (!response.ok) throw new Error(`Failed to download ${url}: ${response.status}`);
  fs.writeFileSync(targetPath, Buffer.from(await response.arrayBuffer()));
}

function extFromUrl(url) {
  try {
    const ext = path.extname(new URL(url).pathname).toLowerCase();
    return ext || ".jpg";
  } catch {
    return ".jpg";
  }
}

function categoryDescription(range, colour) {
  const descriptions = {
    Hybrid: `${colour} hybrid flooring colour in the ${range.name} range for customers checking stock availability, quantity and installation suitability.`,
    Laminate: `${colour} laminate flooring colour in the ${range.name} range for customers checking stock availability, quantity and dry-area suitability.`,
    "Engineered timber": `${colour} engineered timber flooring colour in the ${range.name} range for customers checking stock availability, colour variation and installation planning.`,
    Vinyl: `${colour} vinyl flooring colour in the ${range.name} range for customers checking stock availability, quantity and site suitability.`,
    "Solid timber": `${colour} solid timber flooring colour in the ${range.name} range for customers checking stock availability and installation planning.`,
  };
  return descriptions[range.category] || `${colour} flooring colour in the ${range.name} range for customers checking stock availability and project fit.`;
}

function determineAssetDir(range) {
  const sourceImage = range.primaryImage || range.thumbnailImage || range.heroImage || "";
  const posixDir = path.posix.dirname(sourceImage || "");
  if (posixDir && posixDir !== "/" && posixDir !== ".") {
    return posixDir.replace(/^\//, "");
  }
  const fallbackCategory = slugify(range.category || "products");
  return path.posix.join("assets/products", fallbackCategory, range.slug);
}

function canonicalUrlForProduct(slug) {
  return `${DOMAIN}/products/${slug}/`;
}

function writeProductPage(product, range, nearbyProducts) {
  const categoryUrl = categoryUrls[range.category] || "/products/";
  const categoryLabel = range.category || "Products";
  const canonical = canonicalUrlForProduct(product.slug);
  const title = `${range.name} ${product.colour || product.name} ${range.category} | Oz Timber Floor`;
  const description = `${range.name} ${product.colour || product.name} ${String(range.category || "flooring").toLowerCase()} in Sydney. View specs, colour photos, stock enquiry and supply + install options from Oz Timber Floor.`;
  const rangeUrl = `/ranges/${range.slug}/`;
  const stockHref = `/contact/?enquiry=stock&product=${plus(product.name || product.colour || "")}&productSlug=${plus(product.slug)}&range=${plus(range.name)}&category=${plus(range.category)}&source=${plus(`/products/${product.slug}/`)}`;
  const supplyHref = `/contact/?enquiry=supply-only&product=${plus(product.name || product.colour || "")}&productSlug=${plus(product.slug)}&range=${plus(range.name)}&category=${plus(range.category)}&source=${plus(`/products/${product.slug}/`)}`;
  const installHref = `/contact/?enquiry=supply-install&product=${plus(product.name || product.colour || "")}&productSlug=${plus(product.slug)}&range=${plus(range.name)}&category=${plus(range.category)}&source=${plus(`/products/${product.slug}/`)}`;
  const questionHref = `/contact/?enquiry=product&product=${plus(product.name || product.colour || "")}&productSlug=${plus(product.slug)}&range=${plus(range.name)}&category=${plus(range.category)}&source=${plus(`/products/${product.slug}/`)}`;

  const galleryFigures = (product.imageGallery || [product.primaryImage]).filter(Boolean).map((image, index) => {
    const classes = index === 0 ? "catalogue-gallery-item primary" : "catalogue-gallery-item";
    return `<figure class="${classes}"><img src="${htmlEscape(image)}" alt="${htmlEscape(product.altText || `${range.name} ${product.colour || product.name} ${range.category} colour swatch`)}" loading="${index === 0 ? "eager" : "lazy"}" decoding="async"></figure>`;
  }).join("");

  const relatedCards = nearbyProducts
    .filter((item) => item.slug !== product.slug)
    .slice(0, 6)
    .map((item) => {
      const href = `/products/${item.slug}/`;
      const image = item.primaryImage || product.primaryImage;
      return `<article class="product-card catalogue-card"><img src="${htmlEscape(image)}" alt="${htmlEscape(item.altText || `${range.name} ${item.colour || item.name} ${range.category} colour swatch`)}" loading="lazy" decoding="async"><div class="product-body"><p class="catalogue-overline">${htmlEscape(range.name)}</p><h3>${htmlEscape(item.colour || item.name)}</h3><p>${htmlEscape(item.shortDescription || categoryDescription(range, item.colour || item.name))}</p><div class="product-actions compact-actions"><a class="button-inline" href="${htmlEscape(href)}">View details</a><a class="button-inline ghost-inline" href="/contact/?enquiry=stock&amp;product=${plus(item.name || item.colour || "")}&amp;productSlug=${plus(item.slug)}&amp;range=${plus(range.name)}&amp;category=${plus(range.category)}&amp;source=${plus(href)}">Check stock</a></div></div></article>`;
    })
    .join("");

  const html = `<!DOCTYPE html><html lang="en-AU"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>${htmlEscape(title)}</title><meta name="description" content="${htmlEscape(description)}"><link rel="canonical" href="${htmlEscape(canonical)}"><link rel="icon" href="/assets/brand/favicon-32.png" sizes="32x32" type="image/png"><link rel="apple-touch-icon" href="/assets/brand/apple-touch-icon.png"><meta name="robots" content="index,follow"><meta property="og:type" content="website"><meta property="og:title" content="${htmlEscape(title)}"><meta property="og:description" content="${htmlEscape(description)}"><meta property="og:url" content="${htmlEscape(canonical)}"><link rel="stylesheet" href="/assets/site.css"><script src="/assets/contact-config.js" defer></script><script src="/assets/site.js" defer></script></head><body><header class="site-header"><div class="shell nav"><a class="brand" href="/" aria-label="Oz Timber Floor home"><img class="brand-logo" src="/assets/brand/oz-timber-floor-logo.webp" alt="Oz Timber Floor" width="680" height="215"><span class="brand-fallback">Oz Timber Floor</span></a><nav class="nav-links" aria-label="Primary"><a href="/">Home</a><div class="nav-item has-dropdown"><a class="nav-parent" href="/services/">Services</a><button class="nav-dropdown-toggle" type="button" aria-label="Toggle services menu" aria-expanded="false"></button><div class="nav-dropdown" role="menu"><a href="/timber-flooring-installation-sydney/" role="menuitem">Timber flooring installation</a><a href="/floor-levelling-sydney/" role="menuitem">Floor levelling</a><a href="/timber-floor-removal-and-stripping-sydney/" role="menuitem">Floor removal</a><a href="/timber-floor-sanding-and-polishing-sydney/" role="menuitem">Sanding and polishing</a><a href="/commercial-flooring-sydney/" role="menuitem">Commercial flooring</a><a href="/builder-flooring-contractor-sydney/" role="menuitem">Builder flooring contractor</a></div></div><div class="nav-item has-dropdown"><a class="nav-parent" href="/products/" aria-current="page">Products</a><button class="nav-dropdown-toggle" type="button" aria-label="Toggle products menu" aria-expanded="false"></button><div class="nav-dropdown" role="menu"><a href="/hybrid-flooring-sydney/" role="menuitem">Hybrid flooring</a><a href="/laminate-flooring-sydney/" role="menuitem">Laminate flooring</a><a href="/engineered-timber-flooring-sydney/" role="menuitem">Engineered timber</a><a href="/solid-timber-flooring-sydney/" role="menuitem">Solid timber</a><a href="/vinyl-flooring-sydney/" role="menuitem">Vinyl flooring</a><a href="/ranges/" role="menuitem">All ranges</a></div></div><a href="/projects/">Projects</a><a href="/guides/">Guides</a><a href="/contact/">Contact</a></nav><button class="nav-toggle" type="button" aria-label="Open menu" aria-expanded="false"><span></span><span></span><span></span></button><div class="header-actions"><a class="button" href="/contact/?enquiry=supply-install&amp;source=header">Request Quote</a></div></div></header><main><div class="mobile-sticky-cta"><a href="${htmlEscape(stockHref)}">Check stock</a><a href="${htmlEscape(questionHref)}">Enquire</a></div><section class="section slim-breadcrumbs"><div class="shell"><nav class="breadcrumbs" aria-label="Breadcrumb"><a href="/">Home</a><span>›</span><a href="/products/">Products</a><span>›</span><a href="${htmlEscape(categoryUrl)}">${htmlEscape(categoryLabel)}</a><span>›</span><a href="${htmlEscape(rangeUrl)}">${htmlEscape(range.name)}</a><span>›</span><span>${htmlEscape(product.colour || product.name)}</span></nav></div></section><section class="hero product-hero"><div class="shell product-hero-grid"><div><p class="eyebrow">${htmlEscape(range.category)} · ${htmlEscape(range.name)}</p><h1>${htmlEscape(product.colour || product.name)}</h1><p class="lead">${htmlEscape(product.shortDescription)}</p><div class="button-row"><a class="button" href="${htmlEscape(supplyHref)}">Request supply price</a><a class="button-secondary" href="${htmlEscape(stockHref)}">Check stock availability</a><a class="button-secondary" href="${htmlEscape(installHref)}">Request supply + install quote</a><a class="button-secondary" href="${htmlEscape(questionHref)}">Ask about this product</a></div></div><div class="catalogue-gallery">${galleryFigures}</div></div></section><section class="section soft catalogue-specs"><div class="shell"><div class="section-head"><div><p class="eyebrow">Product facts</p><h2>${htmlEscape(product.colour || product.name)} details</h2></div><p>Use these details to compare options. Final specifications, stock and installation suitability should be confirmed before ordering.</p></div><div class="spec-grid"><div class="spec-item"><span>Range</span><strong>${htmlEscape(range.name)}</strong></div><div class="spec-item"><span>Colour</span><strong>${htmlEscape(product.colour || product.name)}</strong></div><div class="spec-item"><span>Category</span><strong>${htmlEscape(range.category)}</strong></div>${range.thickness ? `<div class="spec-item"><span>Thickness</span><strong>${htmlEscape(range.thickness)}</strong></div>` : ""}${range.boardSize ? `<div class="spec-item"><span>Board size</span><strong>${htmlEscape(range.boardSize)}</strong></div>` : ""}${range.installationMethod ? `<div class="spec-item"><span>Installation method</span><strong>${htmlEscape(range.installationMethod)}</strong></div>` : ""}</div></div></section><section class="section"><div class="shell"><div class="section-head"><div><p class="eyebrow">Related colours</p><h2>More colours in ${htmlEscape(range.name)}</h2></div><p>Compare nearby colours before sending your final enquiry.</p></div><div class="grid-3">${relatedCards}</div></div></section><section class="section soft"><div class="shell cta"><p class="eyebrow">Product enquiry</p><h2>Ask about ${htmlEscape(product.colour || product.name)}</h2><p>Send the colour, range name, suburb, approximate area and whether you need supply-only, stock check or supply + install support.</p><div class="button-row"><a class="button" href="${htmlEscape(supplyHref)}">Request supply price</a><a class="button-secondary" href="${htmlEscape(stockHref)}">Check stock availability</a><a class="button-secondary" href="${htmlEscape(installHref)}">Request supply + install quote</a></div></div></section></main><footer class="site-footer"><div class="shell footer-grid"><div><img class="footer-brand-logo" src="/assets/brand/oz-timber-floor-logo.webp" alt="Oz Timber Floor" width="680" height="215"><p>Sydney timber flooring supplier, installer, builder flooring contractor and floor preparation specialist.</p></div><div><h3>Services</h3><div class="footer-links"><a href="/timber-flooring-installation-sydney/">Installation</a><a href="/floor-levelling-sydney/">Floor levelling</a><a href="/commercial-flooring-sydney/">Commercial flooring</a><a href="/builder-flooring-contractor-sydney/">Builder contractor</a><a href="/timber-floor-sanding-and-polishing-sydney/">Sanding and polishing</a><a href="/timber-floor-removal-and-stripping-sydney/">Removal and stripping</a></div></div><div><h3>Products</h3><div class="footer-links"><a href="/products/">Products</a><a href="/ranges/">All ranges</a><a href="/hybrid-flooring-sydney/">Hybrid</a><a href="/laminate-flooring-sydney/">Laminate</a><a href="/engineered-timber-flooring-sydney/">Engineered timber</a><a href="/solid-timber-flooring-sydney/">Solid timber</a><a href="/vinyl-flooring-sydney/">Vinyl</a></div></div><div><h3>Enquiries</h3><div class="footer-links"><a href="/contact/?enquiry=supply-only">Request supply price</a><a href="/contact/?enquiry=supply-install">Supply + install quote</a><a href="/contact/?enquiry=stock">Check stock availability</a><a href="/projects/">Projects</a><a href="/guides/">Guides</a><a href="/privacy/">Privacy Policy</a><a href="/terms/">Terms</a></div></div></div><div class="shell footer-bottom">© 2026 Oz Timber Floor. Sydney timber flooring supply, installation and preparation.</div></footer></body></html>`;

  const productDir = path.join(root, "products", product.slug);
  ensureDir(productDir);
  fs.writeFileSync(path.join(productDir, "index.html"), html);
}

async function loadOperonProducts() {
  const sandbox = {
    console,
    localStorage: { getItem() { return null; }, setItem() {}, removeItem() {} },
    sessionStorage: { getItem() { return null; }, setItem() {}, removeItem() {} },
    document: {
      querySelector() { return null; },
      querySelectorAll() { return []; },
      addEventListener() {},
      body: null,
      createElement() {
        return {
          style: {},
          appendChild() {},
          setAttribute() {},
          classList: { add() {}, remove() {} },
        };
      },
    },
    location: { href: "https://operonflooring.com.au/products/" },
    navigator: { userAgent: "Mozilla/5.0" },
    setTimeout,
    clearTimeout,
    CustomEvent: function CustomEvent(name, options) {
      this.name = name;
      this.detail = options?.detail;
    },
    dispatchEvent() {},
    addEventListener() {},
  };
  sandbox.window = sandbox;
  vm.createContext(sandbox);
  for (const scriptUrl of operonScriptUrls) {
    vm.runInContext(await fetchText(scriptUrl), sandbox, { timeout: 20_000, filename: scriptUrl });
  }
  if (!sandbox.OperonProducts) {
    throw new Error("Operon public product API not available.");
  }
  return sandbox.OperonProducts;
}

const operon = await loadOperonProducts();
const skipped = [];
const imported = [];

for (const mapping of mappings) {
  const range = rangesBySlug.get(mapping.ozRangeSlug);
  if (!range) {
    skipped.push({ range: mapping.ozRangeSlug, reason: "missing_oz_range" });
    continue;
  }

  const operonProducts = operon.getColoursByRange(mapping.operonRangeId) || [];
  const existingProducts = (range.productSlugs || [])
    .map((slug) => productsBySlug.get(slug))
    .filter(Boolean);
  const existingColourKeys = new Set(existingProducts.map((product) => normaliseName(product.colour || product.name)));
  const assetDir = determineAssetDir(range);

  for (const item of operonProducts) {
    const colour = item.colour || item.name || "";
    const colourKey = normaliseName(colour);
    if (!colourKey || existingColourKeys.has(colourKey)) continue;

    const imageUrl = item.imageUrl || item.image || "";
    if (!imageUrl) {
      skipped.push({ range: range.slug, colour, reason: "missing_operon_image" });
      continue;
    }

    const slug = `${range.slug}-${slugify(colour)}`;
    const ext = extFromUrl(imageUrl);
    const fileName = `${slugify(colour)}${ext}`;
    const localAsset = `/${assetDir}/${fileName}`;
    const localPath = path.join(root, assetDir, fileName);
    if (!fs.existsSync(localPath)) {
      await downloadFile(imageUrl, localPath);
    }

    const record = {
      id: slug,
      slug,
      url: `/products/${slug}/`,
      canonicalUrl: "",
      name: colour,
      brand: range.brand || range.name,
      supplier: range.supplier || "",
      supplierId: range.supplierId || "",
      supplierSourceUrl: range.sourceUrl || "",
      sourceUrl: range.sourceUrl || "",
      range: range.name,
      rangeSlug: range.slug,
      colour,
      category: range.category,
      shortDescription: categoryDescription(range, colour),
      thickness: range.thickness || "",
      boardSize: range.boardSize || "",
      plankSize: range.plankSize || "",
      installationMethod: range.installationMethod || "",
      suitableUse: "Stock, site suitability and installation details should be confirmed before order.",
      cautionNotes: "Stock, colour variation, access and site conditions should be confirmed before order or installation.",
      stockStatusLabel: "Check stock availability",
      imageGallery: [localAsset],
      primaryImage: localAsset,
      altText: `${range.name} ${colour} ${String(range.category || "flooring").toLowerCase()} colour swatch`,
      galleryStatus: "operon-reference-image",
      sourceTag: "Operon public catalogue reference import",
      noCheckout: true,
      legacyUrl: `/products/${slug}/`,
      productCode: "",
      wearLayer: "",
      coreType: "",
      acousticBacking: "",
      waterResistance: "",
      acRating: "",
      edgeDetail: "",
      species: "",
      totalThickness: "",
      structureCore: "",
      surfaceFinish: "",
      gradeCharacter: "",
      boardWidth: "",
      rawOrPrefinished: "",
      sandingFinishingNotes: "",
      plankOrTileFormat: "",
      commercialSuitability: "",
      appearanceTone: "",
      dataCompletenessStatus: "operon-reference-image-verified",
    };

    productsBySlug.set(slug, record);
    range.productSlugs = [...(range.productSlugs || []), slug];
    range.products = [...(range.products || []), slug];
    existingColourKeys.add(colourKey);
    imported.push({ range: range.slug, colour, slug });
  }

  const refreshedProducts = (range.productSlugs || []).map((slug) => productsBySlug.get(slug)).filter(Boolean);
  range.colourCount = refreshedProducts.length;
  for (const product of refreshedProducts) {
    writeProductPage(product, range, refreshedProducts);
  }
}

catalogue.ranges = [...rangesBySlug.values()].sort((a, b) => String(a.slug).localeCompare(String(b.slug)));
catalogue.products = [...productsBySlug.values()].sort((a, b) => String(a.slug).localeCompare(String(b.slug)));
fs.writeFileSync(dataPath, JSON.stringify(catalogue, null, 2) + "\n");

console.log(`Imported ${imported.length} missing colours from Operon public catalogue reference.`);
console.log(JSON.stringify({ imported, skipped }, null, 2));
