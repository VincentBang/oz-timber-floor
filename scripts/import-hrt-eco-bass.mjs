import fs from "fs";
import path from "path";
import vm from "vm";

const ROOT = "/Users/daibang/Documents/New project";
const OZ_ROOT = path.join(ROOT, "apps/oz-timber-floor");
const WEB_ROOT = path.join(ROOT, "apps/web");
const PRODUCTS_JS = path.join(WEB_ROOT, "products.js");
const PRODUCT_CATALOGUE = path.join(OZ_ROOT, "data/product-catalogue.json");
const SUPPLIER_CATALOGUE = path.join(OZ_ROOT, "data/supplier-catalogue.csv");
const EXPANDED_CATALOGUE = path.join(OZ_ROOT, "data/product-catalogue-expanded.csv");
const SUPPLIER_RANGES = path.join(OZ_ROOT, "data/supplier-ranges.csv");

const CATEGORY_URLS = {
  laminate: "/laminate-flooring-sydney/",
  hybrid: "/hybrid-flooring-sydney/",
  engineered: "/engineered-timber-flooring-sydney/",
  solid: "/solid-timber-flooring-sydney/"
};

const IMPORT_GROUPS = [
  {
    supplier: "HRT Timber Flooring",
    sourceTag: "HRT live-aligned import",
    rangeIds: [
      "laminate-12mm-24hr-water-resistant",
      "hybrid-etf-7mm",
      "hybrid-etf-8mm",
      "hybrid-etf-9mm"
    ],
    rangeOverrides: {
      "laminate-12mm-24hr-water-resistant": { slug: "hrt-etf-12mm-water-resistant-laminate", shortLabel: "ETF 12mm Laminate", family: "HRT Laminate" },
      "hybrid-etf-7mm": { slug: "hrt-etf-7mm-waterproof-hybrid", shortLabel: "ETF 7.0mm Hybrid", family: "HRT SPC Hybrid" },
      "hybrid-etf-8mm": { slug: "hrt-etf-8mm-waterproof-hybrid", shortLabel: "ETF 8.0mm Hybrid", family: "HRT SPC Hybrid" },
      "hybrid-etf-9mm": { slug: "hrt-etf-9mm-waterproof-hybrid", shortLabel: "ETF 9.0mm Hybrid", family: "HRT SPC Hybrid" }
    },
    supplementalRanges: [
      ["hrt-aquatuff-flooring", "AquaTuff Flooring", "hybrid", "HRT Timber Flooring lists AquaTuff as a separate waterproof flooring collection for busy homes and family traffic."],
      ["hrt-6-5mm-hybrid", "ETF 6.5mm Hybrid", "hybrid", "HRT Timber Flooring lists a dedicated 6.5mm hybrid range alongside its thicker SPC hybrid collections."],
      ["hrt-9-5mm-hybrid", "ETF 9.5mm Hybrid", "hybrid", "HRT Timber Flooring lists a 9.5mm hybrid collection for projects comparing thicker board constructions."],
      ["hrt-10mm-hybrid", "ETF 10mm Hybrid", "hybrid", "HRT Timber Flooring lists a 10mm hybrid collection for projects wanting a heavier board feel."],
      ["hrt-hybrid-herringbone", "HRT Hybrid Herringbone", "hybrid", "HRT Timber Flooring lists a hybrid herringbone pathway separate from its straight plank SPC ranges."],
      ["hrt-1-5m-laminate", "HRT 1.5m Laminate", "laminate", "HRT Timber Flooring lists a 1.5 metre laminate category alongside its 1.2 metre laminate offering."],
      ["hrt-72hr-water-resistant-laminate", "HRT 72hr Water Resistant Laminate", "laminate", "HRT Timber Flooring lists a 72-hour water resistant laminate category as a separate laminate pathway."],
      ["hrt-14mm-oak-flooring", "HRT 14mm Oak Flooring", "engineered", "HRT Timber Flooring lists a 14mm oak engineered flooring category under its engineered range."],
      ["hrt-15mm-oak-flooring", "HRT 15mm Oak Flooring", "engineered", "HRT Timber Flooring lists a 15mm oak engineered flooring category for wider engineered options."],
      ["hrt-oak-herringbone", "HRT Oak Herringbone", "engineered", "HRT Timber Flooring lists an engineered oak herringbone category for patterned layouts."],
      ["hrt-oak-chevron", "HRT Oak Chevron", "engineered", "HRT Timber Flooring lists an engineered oak chevron category for premium pattern-led projects."],
      ["hrt-australian-engineered", "HRT Australian Engineered", "engineered", "HRT Timber Flooring lists an Australian engineered timber category alongside its oak collections."],
      ["hrt-solid-timber", "HRT Solid Timber", "solid", "HRT Timber Flooring also lists solid timber as a separate product family."]
    ]
  },
  {
    supplier: "Eco Flooring Systems",
    sourceTag: "Eco live-aligned import",
    rangeIds: [
      "laminate-eco-villeroy-boch-heritage",
      "laminate-eco-villeroy-boch-country",
      "laminate-eco-villeroy-boch-cosmopolitan",
      "laminate-eco-villeroy-boch-contemporary",
      "laminate-eco-swish-laminate-aqua",
      "laminate-eco-swish-laminate",
      "hybrid-eco-grande-9mm",
      "hybrid-eco-xxl-8mm",
      "hybrid-eco-grande-7-5mm",
      "hybrid-eco-herringbone-7mm",
      "hybrid-eco-urban-6-5mm",
      "hybrid-eco-elite-6mm",
      "engineered-swish-oak-natura",
      "engineered-swish-oak-natura-herringbone",
      "engineered-eco-swish-oak-wideboard",
      "engineered-eco-swish-oak-contemporary",
      "engineered-eco-swish-oak-natura-handcrafted"
    ],
    rangeOverrides: {
      "laminate-eco-villeroy-boch-heritage": { slug: "villeroy-boch-heritage-laminate", shortLabel: "Villeroy & Boch Heritage", family: "Eco Flooring Laminate" },
      "laminate-eco-villeroy-boch-country": { slug: "villeroy-boch-country-laminate", shortLabel: "Villeroy & Boch Country", family: "Eco Flooring Laminate" },
      "laminate-eco-villeroy-boch-cosmopolitan": { slug: "villeroy-boch-cosmopolitan-laminate", shortLabel: "Villeroy & Boch Cosmopolitan", family: "Eco Flooring Laminate" },
      "laminate-eco-villeroy-boch-contemporary": { slug: "villeroy-boch-contemporary-laminate", shortLabel: "Villeroy & Boch Contemporary", family: "Eco Flooring Laminate" },
      "laminate-eco-swish-laminate-aqua": { slug: "swish-laminate-aqua", shortLabel: "Swish Laminate Aqua", family: "Eco Flooring Laminate" },
      "laminate-eco-swish-laminate": { slug: "swish-laminate-classic", shortLabel: "Swish Laminate", family: "Eco Flooring Laminate" },
      "hybrid-eco-grande-9mm": { slug: "eco-grande-9mm-hybrid", shortLabel: "Grande 9.0 Hybrid", family: "Eco Flooring Hybrid" },
      "hybrid-eco-xxl-8mm": { slug: "eco-xxl-8mm-hybrid", shortLabel: "XXL 8.0 Hybrid", family: "Eco Flooring Hybrid" },
      "hybrid-eco-grande-7-5mm": { slug: "eco-grande-7-5mm-hybrid", shortLabel: "Grande 7.5 Hybrid", family: "Eco Flooring Hybrid" },
      "hybrid-eco-herringbone-7mm": { slug: "eco-herringbone-7mm-hybrid", shortLabel: "Herringbone 7.0 Hybrid", family: "Eco Flooring Hybrid" },
      "hybrid-eco-urban-6-5mm": { slug: "eco-urban-6-5mm-hybrid", shortLabel: "Urban 6.5 Hybrid", family: "Eco Flooring Hybrid" },
      "hybrid-eco-elite-6mm": { slug: "eco-elite-6mm-hybrid", shortLabel: "Elite 6.0 Hybrid", family: "Eco Flooring Hybrid" },
      "engineered-swish-oak-natura": { slug: "swish-oak-natura", shortLabel: "Swish Oak Natura", family: "Eco Flooring Engineered" },
      "engineered-swish-oak-natura-herringbone": { slug: "swish-oak-natura-herringbone", shortLabel: "Swish Oak Natura Herringbone", family: "Eco Flooring Engineered" },
      "engineered-eco-swish-oak-wideboard": { slug: "swish-oak-wideboard", shortLabel: "Swish Oak Wideboard", family: "Eco Flooring Engineered" },
      "engineered-eco-swish-oak-contemporary": { slug: "swish-oak-contemporary", shortLabel: "Swish Oak Contemporary", family: "Eco Flooring Engineered" },
      "engineered-eco-swish-oak-natura-handcrafted": { slug: "swish-oak-natura-handcrafted", shortLabel: "Swish Oak Natura Handcrafted", family: "Eco Flooring Engineered" }
    },
    supplementalRanges: []
  },
  {
    supplier: "Bass Timber",
    sourceTag: "Bass live-aligned import",
    rangeIds: [
      "laminate-oak-step",
      "laminate-oak-step-plus",
      "laminate-aqua-wood-plus-12mm",
      "hybrid-luxury-7mm",
      "hybrid-luxury-8mm",
      "hybrid-luxury-9mm",
      "hybrid-luxury-plus-10mm",
      "engineered-botanica"
    ],
    rangeOverrides: {
      "laminate-oak-step": { slug: "bass-oak-step", shortLabel: "Oak Step", family: "Bass Timber Laminate" },
      "laminate-oak-step-plus": { slug: "bass-oak-step-plus", shortLabel: "Oak Step PLUS", family: "Bass Timber Laminate" },
      "laminate-aqua-wood-plus-12mm": { slug: "bass-aqua-wood-plus-12mm", shortLabel: "Aqua Wood Plus 12mm", family: "Bass Timber Laminate" },
      "hybrid-luxury-7mm": { slug: "bass-luxury-hybrid-7mm", shortLabel: "Luxury Hybrid 7mm", family: "Bass Timber Hybrid" },
      "hybrid-luxury-8mm": { slug: "bass-luxury-hybrid-8mm", shortLabel: "Luxury Hybrid 8mm", family: "Bass Timber Hybrid" },
      "hybrid-luxury-9mm": { slug: "bass-luxury-hybrid-9mm", shortLabel: "Luxury Hybrid 9mm", family: "Bass Timber Hybrid" },
      "hybrid-luxury-plus-10mm": { slug: "bass-luxury-hybrid-plus-10mm", shortLabel: "Luxury Hybrid PLUS 10mm", family: "Bass Timber Hybrid" },
      "engineered-botanica": { slug: "bass-botanica-engineered", shortLabel: "Botanica", family: "Bass Timber Engineered" }
    },
    supplementalRanges: [
      ["bass-coswick-hardwood", "Coswick Hardwood", "engineered", "Bass Timber promotes Coswick Hardwood as a separate engineered flooring pathway with European-made constructions and matching accessories."]
    ]
  }
];

function slugify(value) {
  return String(value || "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

function escapeHtml(value) {
  return String(value ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];
    if (inQuotes) {
      if (char === '"' && next === '"') {
        field += '"';
        i += 1;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        field += char;
      }
    } else if (char === '"') {
      inQuotes = true;
    } else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (char !== "\r") {
      field += char;
    }
  }
  if (field.length || row.length) {
    row.push(field);
    rows.push(row);
  }
  const [header = [], ...body] = rows;
  return body.filter((entry) => entry.some(Boolean)).map((entry) => Object.fromEntries(header.map((key, index) => [key, entry[index] ?? ""])));
}

function csvEscape(value) {
  const stringValue = String(value ?? "");
  return /[",\n]/.test(stringValue) ? `"${stringValue.replace(/"/g, '""')}"` : stringValue;
}

function toCsv(rows, header) {
  return [header.join(","), ...rows.map((row) => header.map((key) => csvEscape(row[key] ?? "")).join(","))].join("\n") + "\n";
}

function loadApi() {
  const code = fs.readFileSync(PRODUCTS_JS, "utf8");
  const noop = () => {};
  const fakeEl = () => ({
    addEventListener: noop,
    removeEventListener: noop,
    querySelector: () => fakeEl(),
    querySelectorAll: () => [],
    appendChild: noop,
    setAttribute: noop,
    getAttribute: () => null,
    classList: { add: noop, remove: noop, toggle: noop, contains: () => false },
    style: {},
    dataset: {},
    innerHTML: "",
    textContent: "",
    onclick: null
  });
  const context = {
    window: { PREFERENCE_FLOORS_IMPORT: null, location: { href: "" } },
    document: {
      getElementById: () => null,
      querySelector: () => null,
      querySelectorAll: () => [],
      createElement: () => fakeEl(),
      body: fakeEl(),
      addEventListener: noop
    },
    localStorage: { getItem: () => null, setItem: noop, removeItem: noop },
    console
  };
  context.window.window = context.window;
  context.window.document = context.document;
  context.window.localStorage = context.localStorage;
  vm.createContext(context);
  vm.runInContext(code, context, { timeout: 10000 });
  return context.window.OperonProducts;
}

function normalizeName(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/\b(hybrid|flooring|laminate|engineered|timber|waterproof|spc|oak|mm|plus|collection|edition|range)\b/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function categoryLabel(categoryKey) {
  return categoryKey === "engineered" ? "Engineered timber" : categoryKey === "hybrid" ? "Hybrid" : categoryKey === "laminate" ? "Laminate" : "Solid timber";
}

function imageToOzAsset(relPath) {
  if (!relPath) return "/assets/images/hero/sydney-timber-flooring-contractor.jpg";
  const source = path.join(WEB_ROOT, relPath);
  const target = path.join(OZ_ROOT, "assets", relPath.replace(/^images\//, ""));
  if (fs.existsSync(source)) {
    ensureDir(path.dirname(target));
    fs.copyFileSync(source, target);
  }
  return `/${path.posix.join("assets", relPath.replace(/^images\//, ""))}`;
}

function existingProductUrlMap(products) {
  const map = new Map();
  for (const product of products) {
    map.set(normalizeName(product.name), product.url);
  }
  return map;
}

function pageShell({ title, description, canonical, body }) {
  return `<!DOCTYPE html>
<html lang="en-AU">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${escapeHtml(title)}</title>
    <meta name="description" content="${escapeHtml(description)}">
    <link rel="canonical" href="${escapeHtml(canonical)}">
    <link rel="icon" href="/assets/favicon.svg" type="image/svg+xml">
    <meta name="robots" content="index,follow">
    <meta property="og:type" content="website">
    <meta property="og:title" content="${escapeHtml(title)}">
    <meta property="og:description" content="${escapeHtml(description)}">
    <meta property="og:url" content="${escapeHtml(canonical)}">
    <link rel="stylesheet" href="/assets/site.css">
    <script src="/assets/contact-config.js" defer></script>
    <script src="/assets/site.js" defer></script>
  </head>
  <body>
    <header class="site-header">
      <div class="shell nav">
        <a class="brand" href="/" aria-label="Oz Timber Floor home"><span class="brand-mark">OZ</span><span>Oz Timber Floor<small>Sydney Flooring Contractor</small></span></a>
        <nav class="nav-links" aria-label="Primary">
          <a href="/">Home</a>
          <a href="/services/">Services</a>
          <a href="/products/" aria-current="page">Products</a>
          <a href="/projects/">Projects</a>
          <a href="/guides/">Guides</a>
          <a href="/contact/">Contact</a>
        </nav>
        <button class="nav-toggle" type="button" aria-label="Open menu" aria-expanded="false"><span></span><span></span><span></span></button>
        <div class="header-actions"><a class="button-secondary" href="/products/">Browse products</a><a class="button" href="/contact/?enquiry=supply-install">Send enquiry</a></div>
      </div>
    </header>
    <main>${body}</main>
    <footer class="site-footer">
      <div class="shell footer-grid">
        <div><h3>Oz Timber Floor</h3><p>Sydney timber flooring supplier, installer, builder flooring contractor and floor preparation specialist.</p><p class="contact-details" data-contact-block></p></div>
        <div><h3>Services</h3><div class="footer-links"><a href="/timber-flooring-installation-sydney/">Installation</a><a href="/floor-levelling-sydney/">Floor levelling</a><a href="/commercial-flooring-sydney/">Commercial flooring</a><a href="/builder-flooring-contractor-sydney/">Builder contractor</a><a href="/timber-floor-sanding-and-polishing-sydney/">Sanding and polishing</a><a href="/timber-floor-removal-and-stripping-sydney/">Removal and stripping</a></div></div>
        <div><h3>Products</h3><div class="footer-links"><a href="/laminate-flooring-sydney/">Laminate</a><a href="/hybrid-flooring-sydney/">Hybrid</a><a href="/engineered-timber-flooring-sydney/">Engineered timber</a><a href="/solid-timber-flooring-sydney/">Solid timber</a><a href="/vinyl-flooring-sydney/">Vinyl</a></div></div>
        <div><h3>Enquiries</h3><div class="footer-links"><a href="/contact/?enquiry=supply-only">Request supply price</a><a href="/contact/?enquiry=supply-install">Supply + install quote</a><a href="/contact/?enquiry=stock">Check stock availability</a><a href="/faqs/">FAQs</a><a href="/privacy/">Privacy notice</a></div></div>
      </div>
      <div class="shell footer-bottom">© 2026 Oz Timber Floor. Sydney timber flooring supply, installation and preparation.</div>
    </footer>
  </body>
</html>`;
}

function buildProductPage(product) {
  const title = `${product.name} | ${product.supplier} | Oz Timber Floor`;
  const description = `${product.name} from ${product.supplier}. Request supply price, stock availability or a supply + install enquiry in Sydney.`;
  const canonical = `https://oztimberfloor.com.au${product.url}`;
  return pageShell({
    title,
    description,
    canonical,
    body: `<section class="hero"><div class="shell hero-grid"><div><p class="eyebrow">${escapeHtml(product.category)} product</p><h1>${escapeHtml(product.name)}</h1><p class="lead">${escapeHtml(product.description)}</p><div class="button-row"><a class="button" href="/contact/?enquiry=supply-install&product=${encodeURIComponent(product.name)}&category=${encodeURIComponent(product.category)}&source=${encodeURIComponent(product.url)}">Request supply + install quote</a><a class="button-secondary" href="/contact/?enquiry=supply-only&product=${encodeURIComponent(product.name)}&category=${encodeURIComponent(product.category)}&source=${encodeURIComponent(product.url)}">Request supply price</a></div></div><div class="hero-media"><img src="${escapeHtml(product.image)}" alt="${escapeHtml(product.alt_text)}" loading="lazy" decoding="async"><div class="hero-badge"><span>${escapeHtml(product.supplier)}</span><span>Supply</span><span>Install</span></div></div></div></section><section class="section soft"><div class="shell split-content"><div class="text-block"><p class="eyebrow">${escapeHtml(product.range)}</p><h2>Supplier-backed catalogue enquiry page</h2><p>Oz Timber Floor uses this page for supply-only pricing, stock checks, supply + install advice and preparation planning. There is no checkout or instant pricing engine here.</p><p>Ask about current lead times, close alternatives, site suitability, floor levelling and builder or commercial scheduling where relevant.</p></div><div class="card"><h3>Product actions</h3><ul class="check-list"><li><a href="/contact/?enquiry=supply-only&product=${encodeURIComponent(product.name)}&category=${encodeURIComponent(product.category)}">Request supply price</a></li><li><a href="/contact/?enquiry=stock&product=${encodeURIComponent(product.name)}&category=${encodeURIComponent(product.category)}">Check stock availability</a></li><li><a href="/contact/?enquiry=supply-install&product=${encodeURIComponent(product.name)}&category=${encodeURIComponent(product.category)}">Request supply + install quote</a></li><li><a href="/contact/?enquiry=product&product=${encodeURIComponent(product.name)}&category=${encodeURIComponent(product.category)}">Ask about this product</a></li></ul></div></div></section><section class="section catalogue-specs"><div class="shell"><div class="section-head"><div><p class="eyebrow">Product details</p><h2>Catalogue specifications</h2></div><p>Confirm the current supplier specification sheet before final ordering, especially on commercial work, apartment jobs and installations with preparation needs.</p></div><div class="spec-grid"><div class="spec-item"><span>Supplier</span><strong>${escapeHtml(product.supplier)}</strong></div><div class="spec-item"><span>Range</span><strong>${escapeHtml(product.range)}</strong></div><div class="spec-item"><span>Colour</span><strong>${escapeHtml(product.colour)}</strong></div><div class="spec-item"><span>Category</span><strong>${escapeHtml(product.category)}</strong></div><div class="spec-item"><span>Thickness</span><strong>${escapeHtml(product.thickness || "Confirm current supplier specification")}</strong></div><div class="spec-item"><span>Board size</span><strong>${escapeHtml(product.board_size || "Confirm current supplier specification")}</strong></div><div class="spec-item"><span>Installation method</span><strong>${escapeHtml(product.installation_method || "Confirm current supplier installation method")}</strong></div><div class="spec-item"><span>Suitable use</span><strong>${escapeHtml(product.suitable_use || "Homes, apartments, builder projects and selected commercial interiors subject to product review")}</strong></div></div></div></section><section class="section"><div class="shell"><div class="grid-4"><a class="category-card" href="${CATEGORY_URLS[product.category_key] || "/products/"}"><strong>More ${escapeHtml(product.category)}</strong><p>Compare this product with the broader Sydney category page.</p></a><a class="category-card" href="/floor-levelling-sydney/"><strong>Floor levelling</strong><p>Check substrate flatness before final product ordering.</p></a><a class="category-card" href="/timber-flooring-installation-sydney/"><strong>Installation</strong><p>Plan trims, underlay, sequencing and access.</p></a><a class="category-card" href="/builder-flooring-contractor-sydney/"><strong>Builder support</strong><p>Use Oz for staged supply and handover coordination.</p></a></div></div></section>`
  });
}

function buildRangePage(range) {
  const canonical = `https://oztimberfloor.com.au${range.url}`;
  return pageShell({
    title: `${range.name} Flooring Range | Oz Timber Floor`,
    description: `${range.name} from ${range.supplier}. Request supply price, stock availability or supply + install support in Sydney.`,
    canonical,
    body: `<section class="hero"><div class="shell hero-grid"><div><p class="eyebrow">${escapeHtml(range.category)} range</p><h1>${escapeHtml(range.name)} flooring range</h1><p class="lead">${escapeHtml(range.summary)}</p><div class="button-row"><a class="button" href="/contact/?enquiry=supply-install&product=${encodeURIComponent(range.name)}&category=${encodeURIComponent(range.category)}&source=${encodeURIComponent(range.url)}">Request supply + install quote</a><a class="button-secondary" href="/contact/?enquiry=supply-only&product=${encodeURIComponent(range.name)}&category=${encodeURIComponent(range.category)}&source=${encodeURIComponent(range.url)}">Request supply price</a></div></div><div class="hero-media"><img src="${escapeHtml(range.image)}" alt="${escapeHtml(range.name)} flooring range" loading="lazy" decoding="async"><div class="hero-badge"><span>${escapeHtml(range.supplier)}</span><span>${range.products.length} products</span><span>${escapeHtml(range.category)}</span></div></div></div></section><section class="section soft"><div class="shell split-content"><div class="text-block"><p class="eyebrow">${escapeHtml(range.family)}</p><h2>Current supplier pathway in Oz</h2><p>${escapeHtml(range.description)}</p><p>Use this page to compare colours within the collection, confirm current stock, review installation method and connect supply-only choices with preparation or install scope.</p></div><div class="card"><h3>Range actions</h3><ul class="check-list"><li><a href="/contact/?enquiry=supply-only&product=${encodeURIComponent(range.name)}&category=${encodeURIComponent(range.category)}">Request supply price</a></li><li><a href="/contact/?enquiry=stock&product=${encodeURIComponent(range.name)}&category=${encodeURIComponent(range.category)}">Check stock availability</a></li><li><a href="/contact/?enquiry=supply-install&product=${encodeURIComponent(range.name)}&category=${encodeURIComponent(range.category)}">Request supply + install quote</a></li><li><a href="/contact/?enquiry=product&product=${encodeURIComponent(range.name)}&category=${encodeURIComponent(range.category)}">Ask about this range</a></li></ul></div></div></section>${range.products.length ? `<section class="section catalogue-products"><div class="shell"><div class="section-head"><div><p class="eyebrow">Collection products</p><h2>Products in ${escapeHtml(range.name)}</h2></div><p>Catalogue-commerce only. Use these product pages for supply price, stock and installation enquiries.</p></div><div class="grid-3">${range.products.slice(0, 18).map((product) => `<article class="product-card compact"><img src="${escapeHtml(product.image)}" alt="${escapeHtml(product.alt_text)}" loading="lazy" decoding="async"><div class="product-body"><h3>${escapeHtml(product.name)}</h3><p>${escapeHtml(product.supplier)} · ${escapeHtml(product.colour)}</p><p class="product-meta"><span class="pill">${escapeHtml(product.category)}</span></p><div class="product-actions"><a href="${escapeHtml(product.url)}">View product</a><a href="/contact/?enquiry=stock&product=${encodeURIComponent(product.name)}&category=${encodeURIComponent(product.category)}">Check stock availability</a></div></div></article>`).join("")}</div></div></section>` : ""}<section class="section"><div class="shell"><div class="grid-4"><a class="category-card" href="${CATEGORY_URLS[range.category_key] || "/products/"}"><strong>More ${escapeHtml(range.category)}</strong><p>Compare this range with the broader category page.</p></a><a class="category-card" href="/floor-levelling-sydney/"><strong>Floor levelling</strong><p>Preparation still matters before final ordering or installation.</p></a><a class="category-card" href="/timber-flooring-installation-sydney/"><strong>Installation</strong><p>Review install method, trims and sequencing.</p></a><a class="category-card" href="/contact/?enquiry=product&product=${encodeURIComponent(range.name)}&category=${encodeURIComponent(range.category)}"><strong>Ask Oz</strong><p>Send a direct product or range question.</p></a></div></div></section>`
  });
}

function appendImportSection(filePath, marker, heading, copy, cards) {
  let html = fs.readFileSync(filePath, "utf8");
  const start = `<!-- ${marker} START -->`;
  const end = `<!-- ${marker} END -->`;
  const block = `${start}\n<section class="section soft"><div class="shell"><div class="section-head"><div><p class="eyebrow">Supplier import</p><h2>${heading}</h2></div><p>${copy}</p></div><div class="grid-4">${cards}</div></div></section>\n${end}`;
  const regex = new RegExp(`${start}[\\s\\S]*?${end}`);
  if (regex.test(html)) {
    html = html.replace(regex, block);
  } else {
    html = html.replace(/<section class="section">\s*<div class="shell cta">/, `${block}\n<section class="section"><div class="shell cta">`);
  }
  fs.writeFileSync(filePath, html);
  const clean = path.join(OZ_ROOT, path.basename(filePath, ".html"), "index.html");
  if (fs.existsSync(path.dirname(clean))) fs.copyFileSync(filePath, clean);
}

function main() {
  const api = loadApi();
  const currentCatalogue = JSON.parse(fs.readFileSync(PRODUCT_CATALOGUE, "utf8"));
  const currentProducts = currentCatalogue.products || [];
  const currentUrlByName = existingProductUrlMap(currentProducts);
  const importedProducts = [];
  const importedRanges = [];

  for (const group of IMPORT_GROUPS) {
    for (const categoryKey of ["laminate", "hybrid", "engineered"]) {
      const all = api.getProductsByCategory(categoryKey).filter((product) => group.rangeIds.includes(product.rangeId));
      const grouped = new Map();
      for (const product of all) {
        const override = group.rangeOverrides[product.rangeId] || {};
        const rangeName = override.shortLabel || product.rangeLabel || product.range || product.brand;
        const baseName = product.rangeLabel && !String(product.rangeLabel).includes(product.colour) ? `${rangeName} ${product.colour}` : product.customerLabel || `${rangeName} ${product.colour}`;
        const existingUrl = currentUrlByName.get(normalizeName(baseName));
        const slug = existingUrl ? existingUrl.split("/").filter(Boolean).pop() : slugify(product.id || baseName);
        const image = imageToOzAsset(product.imageUrl || product.image);
        const firstTech = Array.isArray(product.rangeContent?.technical) ? product.rangeContent.technical : [];
        const byLabel = Object.fromEntries(firstTech.map((row) => [String(row.label || "").toLowerCase(), String(row.value || "")]));
        const item = {
          url: existingUrl || `/products/${slug}/`,
          slug,
          name: baseName.replace(/\s+/g, " ").trim(),
          supplier: group.supplier,
          supplier_url: product.supplierUrl || "",
          range: rangeName,
          family: override.family || group.supplier,
          category_key: categoryKey,
          category: categoryLabel(categoryKey),
          colour: product.colour,
          thickness: product.thickness || "",
          board_size: byLabel["dimensions"] || byLabel["board size"] || byLabel["plank size"] || "",
          installation_method: byLabel["locking"] || byLabel["installation"] || byLabel["installation method"] || "",
          suitable_use: Array.isArray(product.suitableFor) ? product.suitableFor.join(", ") : "",
          image,
          alt_text: product.imageAlt || product.alt || `${baseName} flooring product`,
          description: product.description || (Array.isArray(product.rangeContent?.description) ? product.rangeContent.description[0] : `${baseName} is available through the Oz Timber Floor supplier catalogue.`),
          source: group.sourceTag,
          range_id: product.rangeId
        };
        importedProducts.push(item);
        if (!grouped.has(product.rangeId)) {
          grouped.set(product.rangeId, {
            url: `/ranges/${override.slug || slugify(product.rangeId)}/`,
            slug: override.slug || slugify(product.rangeId),
            name: rangeName,
            supplier: group.supplier,
            family: override.family || group.supplier,
            category_key: categoryKey,
            category: categoryLabel(categoryKey),
            summary: Array.isArray(product.rangeContent?.description) ? product.rangeContent.description[0] : `${rangeName} is available through the Oz Timber Floor supplier catalogue.`,
            description: Array.isArray(product.rangeContent?.description) ? product.rangeContent.description.join(" ") : `${rangeName} is available through the Oz Timber Floor supplier catalogue.`,
            image,
            products: []
          });
        }
        grouped.get(product.rangeId).products.push(item);
      }
      importedRanges.push(...grouped.values());
    }
    for (const [slug, name, categoryKey, summary] of group.supplementalRanges) {
      importedRanges.push({
        url: `/ranges/${slug}/`,
        slug,
        name,
        supplier: group.supplier,
        family: group.supplier,
        category_key: categoryKey,
        category: categoryLabel(categoryKey),
        summary,
        description: summary,
        image: "/assets/images/hero/sydney-timber-flooring-contractor.jpg",
        products: []
      });
    }
  }

  const importedNames = new Set(importedProducts.map((product) => normalizeName(product.name)));
  const mergedProducts = currentProducts.filter((product) => !importedNames.has(normalizeName(product.name))).concat(importedProducts.map((product) => ({
    url: product.url,
    name: product.name,
    brand: product.supplier,
    range: product.range,
    colour: product.colour,
    category: product.category,
    thickness: product.thickness,
    board_size: product.board_size,
    wear_layer: "",
    installation_method: product.installation_method,
    finish: "",
    suitable_use: product.suitable_use,
    warranty_summary: "Confirm the current supplier warranty for the selected range before ordering.",
    image: product.image,
    alt_text: product.alt_text,
    spec_sheet_link: "",
    supplier: product.supplier,
    supplier_url: product.supplier_url,
    enquiry_ctas: ["Request supply price", "Check stock availability", "Request supply + install quote", "Ask about this product"],
    no_checkout: true,
    source: product.source
  }))).sort((a, b) => a.name.localeCompare(b.name));

  currentCatalogue.updated = new Date().toISOString().slice(0, 10);
  currentCatalogue.products = mergedProducts;
  fs.writeFileSync(PRODUCT_CATALOGUE, JSON.stringify(currentCatalogue, null, 2) + "\n");

  fs.writeFileSync(SUPPLIER_CATALOGUE, toCsv(mergedProducts.map((product) => ({
    url: product.url,
    product_name: product.name,
    supplier: product.supplier || product.brand,
    range: product.range,
    category: product.category,
    enquiry_type: "Catalogue enquiry only - no checkout",
    ctas: "Request supply price; Check stock availability; Request supply + install quote; Ask about this product"
  })), ["url", "product_name", "supplier", "range", "category", "enquiry_type", "ctas"]));

  fs.writeFileSync(EXPANDED_CATALOGUE, toCsv(mergedProducts.map((product) => ({
    url: product.url,
    supplier: product.supplier || product.brand,
    range_name: product.range,
    product_name: product.name,
    colour: product.colour,
    category: product.category,
    thickness: product.thickness,
    board_size: product.board_size,
    installation_method: product.installation_method,
    image: product.image
  })), ["url", "supplier", "range_name", "product_name", "colour", "category", "thickness", "board_size", "installation_method", "image"]));

  const existingRanges = parseCsv(fs.readFileSync(SUPPLIER_RANGES, "utf8"));
  const rangeRows = existingRanges.filter((row) => !importedRanges.some((range) => range.url === row.url)).concat(importedRanges.map((range) => ({
    url: range.url,
    range_name: range.name,
    page_h1: `${range.name} flooring range`,
    category: range.category,
    ctas: "Supply price; Supply + install; Stock availability; Product question"
  }))).sort((a, b) => a.url.localeCompare(b.url));
  fs.writeFileSync(SUPPLIER_RANGES, toCsv(rangeRows, ["url", "range_name", "page_h1", "category", "ctas"]));
  fs.copyFileSync(SUPPLIER_CATALOGUE, path.join(OZ_ROOT, "migration/supplier-catalogue-expanded.csv"));
  fs.copyFileSync(SUPPLIER_RANGES, path.join(OZ_ROOT, "migration/supplier-ranges-expanded.csv"));

  for (const product of importedProducts) {
    const dir = path.join(OZ_ROOT, product.url.replace(/^\/|\/$/g, ""));
    ensureDir(dir);
    fs.writeFileSync(path.join(dir, "index.html"), buildProductPage(product));
  }
  for (const range of importedRanges) {
    const dir = path.join(OZ_ROOT, range.url.replace(/^\/|\/$/g, ""));
    ensureDir(dir);
    fs.writeFileSync(path.join(dir, "index.html"), buildRangePage(range));
  }

  const supplierCards = importedRanges.slice(0, 24).map((range) => `<a class="category-card" href="${range.url}"><strong>${escapeHtml(range.name)}</strong><p>${escapeHtml(range.supplier)} · ${escapeHtml(range.category)}</p></a>`).join("");
  appendImportSection(path.join(OZ_ROOT, "products.html"), "ADDITIONAL SUPPLIER IMPORT", "HRT, Eco and Bass supplier ranges", "These supplier-backed range pages and product pages now sit inside the Oz catalogue with supply-only, stock and supply + install enquiry paths.", supplierCards);

  const hybridCards = importedRanges.filter((range) => range.category_key === "hybrid").slice(0, 12).map((range) => `<a class="category-card" href="${range.url}"><strong>${escapeHtml(range.name)}</strong><p>${escapeHtml(range.supplier)}</p></a>`).join("");
  appendImportSection(path.join(OZ_ROOT, "hybrid-flooring-sydney.html"), "ADDITIONAL HYBRID SUPPLIER IMPORT", "Imported supplier hybrid collections", "Oz now includes supplier-backed hybrid collections from Topdeck, HRT, Eco Flooring Systems and Bass Timber.", hybridCards);

  const laminateCards = importedRanges.filter((range) => range.category_key === "laminate").slice(0, 12).map((range) => `<a class="category-card" href="${range.url}"><strong>${escapeHtml(range.name)}</strong><p>${escapeHtml(range.supplier)}</p></a>`).join("");
  appendImportSection(path.join(OZ_ROOT, "laminate-flooring-sydney.html"), "ADDITIONAL LAMINATE SUPPLIER IMPORT", "Imported supplier laminate collections", "Oz now includes supplier-backed laminate collections from HRT, Eco Flooring Systems, Bass Timber and Topdeck pathways.", laminateCards);

  const engineeredCards = importedRanges.filter((range) => range.category_key === "engineered").slice(0, 12).map((range) => `<a class="category-card" href="${range.url}"><strong>${escapeHtml(range.name)}</strong><p>${escapeHtml(range.supplier)}</p></a>`).join("");
  appendImportSection(path.join(OZ_ROOT, "engineered-timber-flooring-sydney.html"), "ADDITIONAL ENGINEERED SUPPLIER IMPORT", "Imported supplier engineered collections", "Oz now includes supplier-backed engineered timber collections from Eco Flooring Systems, HRT, Bass Timber and Topdeck.", engineeredCards);

  const note = `# Supplier import notes
\n- Added supplier-backed import pages for HRT Timber Flooring, Eco Flooring Systems and Bass Timber on ${new Date().toISOString().slice(0, 10)}.\n- Product-level imports were created where the shared supplier dataset already contains item-level data.\n- Additional live-only range pages were created for HRT and Bass where the current live site shows a product family but the workspace does not yet hold a full SKU dataset.\n- Remaining manual gap: Bass Coswick Hardwood still needs full SKU extraction if Oz wants every Coswick colour/product split as separate product pages.\n`;
  fs.writeFileSync(path.join(OZ_ROOT, "migration/additional-supplier-import-notes.md"), note);
}

main();
