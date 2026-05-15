import fs from "fs";
import path from "path";
import vm from "vm";

const ROOT = "/Users/daibang/Documents/New project";
const OZ_ROOT = path.join(ROOT, "apps/oz-timber-floor");
const WEB_ROOT = path.join(ROOT, "apps/web");
const OPERON_PRODUCTS_PATH = path.join(WEB_ROOT, "products.js");
const OZ_DATA_PATH = path.join(OZ_ROOT, "data");
const OZ_PRODUCTS_DIR = path.join(OZ_ROOT, "products");
const OZ_RANGES_DIR = path.join(OZ_ROOT, "ranges");
const CATEGORY_PAGES = [
  { file: "hybrid-flooring-sydney.html", category: "Hybrid" },
  { file: "laminate-flooring-sydney.html", category: "Laminate" },
  { file: "engineered-timber-flooring-sydney.html", category: "Engineered timber" },
  { file: "solid-timber-flooring-sydney.html", category: "Solid timber" }
];

const CATEGORY_META = {
  hybrid: {
    label: "Hybrid",
    slug: "hybrid-flooring-sydney",
    heading: "Hybrid flooring Sydney",
    productType: "hybrid flooring product",
    categoryUrl: "/hybrid-flooring-sydney/",
    heroImage: "/assets/images/products/hybrid/-lumiere-ultra-hd/lumiere-lovanna-oak.webp"
  },
  laminate: {
    label: "Laminate",
    slug: "laminate-flooring-sydney",
    heading: "Laminate flooring Sydney",
    productType: "laminate flooring product",
    categoryUrl: "/laminate-flooring-sydney/",
    heroImage: "/assets/images/products/laminate/-pantora-amor/amor-amalfi-oak.webp"
  },
  engineered: {
    label: "Engineered timber",
    slug: "engineered-timber-flooring-sydney",
    heading: "Engineered timber flooring Sydney",
    productType: "engineered timber flooring product",
    categoryUrl: "/engineered-timber-flooring-sydney/",
    heroImage: "/assets/images/products/engineered/-project-oak/project-oak-baltimore-oak.webp"
  },
  solid: {
    label: "Solid timber",
    slug: "solid-timber-flooring-sydney",
    heading: "Solid timber flooring Sydney",
    productType: "solid timber flooring range",
    categoryUrl: "/solid-timber-flooring-sydney/",
    heroImage: "/assets/images/hero/sydney-timber-flooring-contractor.jpg"
  }
};

const RANGE_OVERRIDES = {
  "hybrid--avala": {
    slug: "avala-hybrid-planks",
    shortLabel: "Avala",
    brandFamily: "Hybrid Planks",
    liveBlurb: "Contemporary hybrid flooring with a sleek finish and strong water resistance for busy interiors."
  },
  "hybrid--lumiere-ultra-hd": {
    slug: "lumiere-ultra-hd-hybrid-plank",
    shortLabel: "Lumiere Ultra HD",
    brandFamily: "Hybrid Planks",
    liveBlurb: "High-definition wood visuals with strong clarity, realistic texture and a wider plank format."
  },
  "hybrid--belle-vie": {
    slug: "belle-vie-herringbone",
    shortLabel: "Belle Vie",
    brandFamily: "Hybrid Planks",
    liveBlurb: "A hybrid herringbone range for projects that want patterned layout with a lower-maintenance product system."
  },
  "hybrid--storm-luxury": {
    slug: "storm-luxury-hybrid-planks",
    shortLabel: "Storm Luxury",
    brandFamily: "Hybrid Planks",
    liveBlurb: "Bold hybrid planks designed for statement timber looks and hard-working residential interiors."
  },
  "hybrid--artisan-tile": {
    slug: "artisan-hybrid-tile",
    shortLabel: "Artisan Tile",
    brandFamily: "Hybrid Planks",
    liveBlurb: "Tile-look hybrid flooring for projects that want the appearance of stone with a floating-floor workflow."
  },
  "laminate--pantora-amor": {
    slug: "pantora-amor-collection",
    shortLabel: "Pantora Amor",
    brandFamily: "Pantora Laminate",
    liveBlurb: "A 12mm embossed-in-register laminate range with deeper texture and a more premium underfoot feel."
  },
  "laminate--pantora-lifestyle": {
    slug: "pantora-lifestyle-collection",
    shortLabel: "Pantora Lifestyle",
    brandFamily: "Pantora Laminate",
    liveBlurb: "A practical 8mm laminate collection with realistic timber visuals for cost-conscious renovations."
  },
  "laminate--prime-deluxe": {
    slug: "prime-deluxe-edition",
    shortLabel: "Prime Deluxe",
    brandFamily: "Prime Laminate",
    liveBlurb: "An entry pathway into the Prime laminate family with a slimmer board profile and straightforward timber styling."
  },
  "laminate--prime-contemporary-plus": {
    slug: "prime-contemporary-plus-edition",
    shortLabel: "Prime Contemporary Plus",
    brandFamily: "Prime Laminate",
    liveBlurb: "A refined laminate range for clients who want more board substance and a broader modern colour palette."
  },
  "laminate--prime-luxury": {
    slug: "prime-luxury-edition",
    shortLabel: "Prime Luxury",
    brandFamily: "Prime Laminate",
    liveBlurb: "A premium-leaning laminate collection for dry internal rooms that need timber visuals without engineered timber budgets."
  },
  "laminate--prime-legend": {
    slug: "prime-legend-collection",
    shortLabel: "Prime Legend",
    brandFamily: "Prime Laminate",
    liveBlurb: "A bold laminate collection designed for durable day-to-day use with stronger visual character."
  },
  "engineered--wooden-land-foreign-species": {
    slug: "wooden-land-foreign-species",
    shortLabel: "Wooden-Land Foreign Species",
    brandFamily: "Wooden-Land Classic Engineered",
    liveBlurb: "Distinctive engineered timber in uncommon species for design-led projects that want stronger grain character."
  },
  "engineered--wooden-land-australian-136mm": {
    slug: "wooden-land-australian-species-136mm",
    shortLabel: "Wooden-Land Australian Species 136mm",
    brandFamily: "Wooden-Land Classic Engineered",
    liveBlurb: "Australian species engineered timber in a balanced plank width suited to homes, renovations and builder schedules."
  },
  "engineered--wooden-land-australian-190mm": {
    slug: "wooden-land-australian-species-190mm",
    shortLabel: "Wooden-Land Australian Species 190mm",
    brandFamily: "Wooden-Land Classic Engineered",
    liveBlurb: "Wider-plank Australian species engineered timber for premium spaces that want a broader board presentation."
  },
  "engineered--wooden-land-herringbone": {
    slug: "wooden-land-herringbone",
    shortLabel: "Wooden-Land Herringbone",
    brandFamily: "Wooden-Land Classic Engineered",
    liveBlurb: "A herringbone engineered timber option for projects that need parquet character without moving into solid timber blocks."
  },
  "engineered--project-oak": {
    slug: "project-oak",
    shortLabel: "Project Oak",
    brandFamily: "Euro Oak Engineered",
    liveBlurb: "European oak engineered boards with commercial-friendly breadth across colour and project fit."
  },
  "engineered--castel-nuovo-herringbone": {
    slug: "castel-nuovo-herringbone",
    shortLabel: "Castel Nuovo",
    brandFamily: "Euro Oak Engineered",
    liveBlurb: "A classic herringbone Euro oak range for formal interiors, builder upgrades and architect-led homes."
  },
  "engineered--lavanda-oak": {
    slug: "lavanda-oak",
    shortLabel: "Lavanda Oak",
    brandFamily: "Euro Oak Engineered",
    liveBlurb: "Soft-toned European oak planks aimed at calm, wider-feeling interiors and contemporary homes."
  },
  "engineered--cavallo-bianco-chevron": {
    slug: "cavallo-bianco-chevron",
    shortLabel: "Cavallo Bianco",
    brandFamily: "Euro Oak Engineered",
    liveBlurb: "Chevron engineered timber with a cleaner geometric finish for higher-spec residential and boutique commercial work."
  },
  "solid--raw": {
    slug: "-raw-solid-timber",
    shortLabel: " Raw Solid Timber",
    brandFamily: " Solid Timber",
    liveBlurb: "Unfinished solid hardwood ready for custom staining, sanding, polishing or coating to suit the project."
  },
  "solid--pre-finished": {
    slug: "-pre-finished-solid-timber",
    shortLabel: " Pre-Finished Solid Timber",
    brandFamily: " Solid Timber",
    liveBlurb: "Factory-finished solid timber for projects that want the depth of real hardwood with less finishing work on site."
  }
};

const RANGE_IDS = new Set(Object.keys(RANGE_OVERRIDES).filter((key) => key !== "solid--raw" && key !== "solid--pre-finished"));
const CTA_LABELS = [
  "Request supply price",
  "Check stock availability",
  "Request supply + install quote",
  "Ask about this product"
];

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function slugify(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeFile(filePath, content) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, content);
}

function formatDisplayCategory(categoryKey) {
  return CATEGORY_META[categoryKey]?.label || categoryKey;
}

function parseDimensions(value) {
  if (!value) return "";
  return String(value).replace(/\s+/g, " ").trim();
}

function csvEscape(value) {
  const stringValue = String(value ?? "");
  if (/[",\n]/.test(stringValue)) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
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
  return body.filter((entry) => entry.length && entry.some((cell) => cell !== "")).map((entry) => {
    const obj = {};
    header.forEach((key, index) => {
      obj[key] = entry[index] ?? "";
    });
    return obj;
  });
}

function toCsv(rows, header) {
  return [header.join(","), ...rows.map((row) => header.map((key) => csvEscape(row[key] ?? "")).join(","))].join("\n") + "\n";
}

function loadOperonProducts() {
  const code = fs.readFileSync(OPERON_PRODUCTS_PATH, "utf8");
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
    window: { FLOORS_IMPORT: null, location: { href: "" } },
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

function imageToOzPath(sourceImagePath) {
  if (!sourceImagePath) return CATEGORY_META.solid.heroImage;
  return `/${path.posix.join("assets", sourceImagePath.replace(/^images\//, ""))}`;
}

function sourceImagePath(sourceImagePath) {
  return path.join(WEB_ROOT, sourceImagePath);
}

function imageTargetPath(sourceImagePath) {
  return path.join(OZ_ROOT, "assets", sourceImagePath.replace(/^images\//, ""));
}

function copyImage(relativeImagePath) {
  if (!relativeImagePath) return;
  const source = sourceImagePath(relativeImagePath);
  const target = imageTargetPath(relativeImagePath);
  if (!fs.existsSync(source)) return;
  ensureDir(path.dirname(target));
  fs.copyFileSync(source, target);
}

function getRangeShortLabel(rangeId, rangeLabel) {
  return RANGE_OVERRIDES[rangeId]?.shortLabel || rangeLabel;
}

function getRangeSlug(rangeId) {
  return RANGE_OVERRIDES[rangeId]?.slug || slugify(rangeId);
}

function getRangeFamily(rangeId) {
  return RANGE_OVERRIDES[rangeId]?.brandFamily || "";
}

function plainTextList(items) {
  return items.filter(Boolean).join(" ");
}

function pickTechnicalMap(technicalRows = []) {
  const map = new Map();
  for (const row of technicalRows) {
    if (row?.label) {
      map.set(String(row.label).toLowerCase(), String(row.value || "").trim());
    }
  }
  return map;
}

function technicalValue(map, labels) {
  for (const label of labels) {
    const hit = map.get(label.toLowerCase());
    if (hit) return hit;
  }
  return "";
}

function detectFinish(product, rangeDescription) {
  const joined = [product.description, ...(product.features || []), ...rangeDescription].join(" ").toLowerCase();
  if (joined.includes("ultra-matt")) return "Ultra-matt PU finish";
  if (joined.includes("embossed-in-register") || joined.includes("4d")) return "Embossed-in-register laminate finish";
  if (joined.includes("brushed")) return "Brushed timber-look surface";
  if (joined.includes("sealed")) return "Factory-finished sealed surface";
  if (product.category === "engineered") return "Prefinished engineered timber surface";
  return "Confirm current supplier finish";
}

function inferWarranty(categoryKey) {
  if (categoryKey === "hybrid") return "Confirm the current  residential and commercial warranty for the exact hybrid collection before ordering.";
  if (categoryKey === "laminate") return "Confirm the current  laminate warranty for the selected collection, room type and installation method before ordering.";
  if (categoryKey === "engineered") return "Confirm the current  engineered timber warranty, maintenance requirements and site conditions before ordering.";
  return "Confirm the current  solid timber warranty and finishing requirements before ordering.";
}

function mapSuitableUse(product) {
  if (Array.isArray(product.suitableFor) && product.suitableFor.length) {
    return product.suitableFor.join(", ");
  }
  if (product.category === "laminate") return "Bedrooms, living rooms, rentals and dry internal renovations";
  if (product.category === "hybrid") return "Homes, apartments, kitchens, family areas and selected light commercial interiors";
  if (product.category === "engineered") return "Premium homes, offices, apartments and builder-specified interiors";
  return "Homes, renovations and commercial projects subject to product and site review";
}

function productDisplayName(product) {
  const shortLabel = getRangeShortLabel(product.rangeId, product.rangeLabel).replace(/\s+Hybrid Plank(s)?$/i, "").replace(/\s+Collection$/i, "").replace(/\s+Edition$/i, "");
  return `${shortLabel} ${product.colour}`.replace(/\s+/g, " ").trim();
}

function createProducts(api) {
  const items = [];
  const productIds = new Set();
  for (const categoryKey of ["hybrid", "laminate", "engineered"]) {
    for (const product of api.getProductsByCategory(categoryKey)) {
      if (!RANGE_IDS.has(product.rangeId)) continue;
      if (productIds.has(product.id)) continue;
      productIds.add(product.id);
      const technicalMap = pickTechnicalMap(product.rangeContent?.technical || []);
      const displayCategory = formatDisplayCategory(categoryKey);
      const displayName = productDisplayName(product);
      const slug = slugify(product.id || displayName);
      const image = imageToOzPath(product.imageUrl || product.image);
      const boardSize = parseDimensions(technicalValue(technicalMap, ["dimensions", "board size", "plank size", "panel size"]));
      const installMethod = parseDimensions(technicalValue(technicalMap, ["locking", "installation", "installation method", "profile"])) || "Floating floor installation; confirm subfloor, underlay and manufacturer requirements";
      const finish = detectFinish(product, product.rangeContent?.description || []);
      const enquiryBase = `/contact/?product=${encodeURIComponent(displayName)}&category=${encodeURIComponent(displayCategory)}`;
      const rangeSlug = getRangeSlug(product.rangeId);
      items.push({
        id: product.id,
        url: `/products/${slug}/`,
        slug,
        name: displayName,
        short_name: product.colour,
        brand: "",
        supplier: "",
        supplier_url: product.supplierUrl || "",
        range: product.rangeLabel,
        range_short_label: getRangeShortLabel(product.rangeId, product.rangeLabel),
        range_family: getRangeFamily(product.rangeId),
        range_id: product.rangeId,
        range_url: `/ranges/${rangeSlug}/`,
        colour: product.colour,
        category_key: categoryKey,
        category: displayCategory,
        thickness: product.thickness || "",
        board_size: boardSize,
        wear_layer: categoryKey === "hybrid" ? "Confirm current supplier wear layer or construction sheet" : "Confirm current supplier specification",
        installation_method: installMethod,
        finish,
        suitable_use: mapSuitableUse(product),
        warranty_summary: inferWarranty(categoryKey),
        image,
        image_source: product.imageUrl || product.image,
        alt_text: product.imageAlt || product.alt || `${displayName} ${displayCategory.toLowerCase()} product`,
        description: product.description || plainTextList(product.rangeContent?.description || []),
        spec_sheet_link: "",
        gallery_images: (product.galleryImages || []).map(imageToOzPath),
        enquiry_ctas: CTA_LABELS.slice(),
        no_checkout: true,
        source: " live-aligned import"
      });
      copyImage(product.imageUrl || product.image);
      for (const galleryImage of product.galleryImages || []) {
        copyImage(galleryImage);
      }
    }
  }
  return items;
}

function createSolidRanges() {
  return [
    {
      range_id: "solid--raw",
      slug: getRangeSlug("solid--raw"),
      range_name: " Raw Solid Timber",
      range_short_label: "Raw Solid Timber",
      family: " Solid Timber",
      category_key: "solid",
      category: "Solid timber",
      url: `/ranges/${getRangeSlug("solid--raw")}/`,
      description: [
        "Unfinished solid hardwood ready for custom staining, polishing or site-specific finishing.",
        "This pathway suits projects where colour, sheen and sanding schedule need to be controlled on site.",
        "Oz Timber Floor should review species choice, site moisture, acclimatisation, expansion detail and finishing scope before ordering."
      ],
      features: [
        "Traditional solid timber flooring for long-term projects.",
        "Flexible finishing pathway when stain, sheen or sanding sequence matters.",
        "Useful for restoration work, extensions and projects matching existing solid boards."
      ],
      technical: [
        { label: "Product family", value: " Solid Timber" },
        { label: "Finish", value: "Unfinished solid hardwood" },
        { label: "Use", value: "Site-finished timber flooring" },
        { label: "Installation", value: "Confirm direct-fix method, subfloor type and finishing sequence" }
      ],
      productCount: 0,
      liveBlurb: RANGE_OVERRIDES["solid--raw"].liveBlurb,
      image: CATEGORY_META.solid.heroImage
    },
    {
      range_id: "solid--pre-finished",
      slug: getRangeSlug("solid--pre-finished"),
      range_name: " Pre-Finished Solid Timber",
      range_short_label: "Pre-Finished Solid Timber",
      family: " Solid Timber",
      category_key: "solid",
      category: "Solid timber",
      url: `/ranges/${getRangeSlug("solid--pre-finished")}/`,
      description: [
        "Factory-finished solid timber for projects that want authentic hardwood with less site finishing disruption.",
        "This range is suited to installs where program, handover and reduced coating time matter.",
        "Oz Timber Floor should still review substrate, board acclimatisation, site access and trim details before confirming supply or install."
      ],
      features: [
        "Real solid timber board construction with factory coating.",
        "Reduced on-site finishing compared with unfinished hardwood pathways.",
        "Useful for builder schedules and occupied-home planning when finishing time matters."
      ],
      technical: [
        { label: "Product family", value: " Solid Timber" },
        { label: "Finish", value: "Factory-finished solid hardwood" },
        { label: "Use", value: "Supply-only or supply + install solid timber projects" },
        { label: "Installation", value: "Confirm board profile, fixing method and site readiness before ordering" }
      ],
      productCount: 0,
      liveBlurb: RANGE_OVERRIDES["solid--pre-finished"].liveBlurb,
      image: CATEGORY_META.solid.heroImage
    }
  ];
}

function createRangeRecords(products) {
  const grouped = new Map();
  for (const product of products) {
    if (!grouped.has(product.range_id)) grouped.set(product.range_id, []);
    grouped.get(product.range_id).push(product);
  }
  const ranges = [];
  for (const [rangeId, rangeProducts] of grouped.entries()) {
    const first = rangeProducts[0];
    const sourceProduct = rangeProducts[0];
    const technicalMap = pickTechnicalMap(sourceProduct.rangeContent?.technical || []);
    ranges.push({
      range_id: rangeId,
      slug: getRangeSlug(rangeId),
      range_name: sourceProduct.rangeLabel,
      range_short_label: getRangeShortLabel(rangeId, sourceProduct.rangeLabel),
      family: getRangeFamily(rangeId),
      category_key: first.category_key,
      category: first.category,
      url: `/ranges/${getRangeSlug(rangeId)}/`,
      description: sourceProduct.rangeContent?.description || [],
      features: sourceProduct.rangeContent?.features || [],
      technical: sourceProduct.rangeContent?.technical || [],
      productCount: rangeProducts.length,
      liveBlurb: RANGE_OVERRIDES[rangeId]?.liveBlurb || "",
      image: first.image,
      representativeProduct: first,
      products: rangeProducts,
      installationMethod: technicalValue(technicalMap, ["locking", "installation", "installation method", "profile"])
    });
  }
  return ranges.concat(createSolidRanges());
}

function productCards(products) {
  return products.map((product) => {
    const source = encodeURIComponent(product.url);
    return `<article class="product-card compact"><img src="${escapeHtml(product.image)}" alt="${escapeHtml(product.alt_text)}" loading="lazy" decoding="async"><div class="product-body"><h3>${escapeHtml(product.name)}</h3><p>${escapeHtml(product.range_family)} · ${escapeHtml(product.range_short_label)} · ${escapeHtml(product.colour)}</p><p class="product-meta"><span class="pill">${escapeHtml(product.category)}</span>${product.thickness ? `<span class="pill">${escapeHtml(product.thickness)}</span>` : ""}</p><div class="product-actions"><a href="/contact/?enquiry=supply-only&product=${encodeURIComponent(product.name)}&category=${encodeURIComponent(product.category)}&source=${source}">Request supply price</a><a href="/contact/?enquiry=stock&product=${encodeURIComponent(product.name)}&category=${encodeURIComponent(product.category)}&source=${source}">Check stock availability</a><a href="/contact/?enquiry=supply-install&product=${encodeURIComponent(product.name)}&category=${encodeURIComponent(product.category)}&source=${source}">Request supply + install quote</a><a href="/contact/?enquiry=product&product=${encodeURIComponent(product.name)}&category=${encodeURIComponent(product.category)}&source=${source}">Ask about this product</a></div></div></article>`;
  }).join("");
}

function technicalGrid(rows, fallback) {
  const items = rows.length ? rows : fallback;
  return `<div class="spec-grid">${items.map((row) => `<div class="spec-item"><span>${escapeHtml(row.label)}</span><strong>${escapeHtml(row.value)}</strong></div>`).join("")}</div>`;
}

function pageShell({ title, description, canonical, bodyClass = "", jsonLd, mainContent, navCurrent = "Products" }) {
  const navMap = {
    Home: [true, false, false, false, false, false],
    Services: [false, true, false, false, false, false],
    Products: [false, false, true, false, false, false],
    Projects: [false, false, false, true, false, false],
    Guides: [false, false, false, false, true, false],
    Contact: [false, false, false, false, false, true]
  };
  const states = navMap[navCurrent] || navMap.Products;
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
    <script type="application/ld+json">${JSON.stringify(jsonLd)}</script>
  </head>
  <body${bodyClass ? ` class="${bodyClass}"` : ""}>
    <header class="site-header">
      <div class="shell nav">
        <a class="brand" href="/" aria-label="Oz Timber Floor home"><span class="brand-mark">OZ</span><span>Oz Timber Floor<small>Sydney Flooring Contractor</small></span></a>
        <nav class="nav-links" aria-label="Primary">
          <a href="/"${states[0] ? ' aria-current="page"' : ""}>Home</a>
          <a href="/services/"${states[1] ? ' aria-current="page"' : ""}>Services</a>
          <a href="/products/"${states[2] ? ' aria-current="page"' : ""}>Products</a>
          <a href="/projects/"${states[3] ? ' aria-current="page"' : ""}>Projects</a>
          <a href="/guides/"${states[4] ? ' aria-current="page"' : ""}>Guides</a>
          <a href="/contact/"${states[5] ? ' aria-current="page"' : ""}>Contact</a>
        </nav>
        <button class="nav-toggle" type="button" aria-label="Open menu" aria-expanded="false"><span></span><span></span><span></span></button>
        <div class="header-actions"><a class="button-secondary" href="/products/">Browse products</a><a class="button" href="/contact/?enquiry=supply-install">Send enquiry</a></div>
      </div>
    </header>
    <main>${mainContent}</main>
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
</html>
`;
}

function buildProductPage(product) {
  const categoryMeta = CATEGORY_META[product.category_key];
  const title = `${product.name} | ${product.range_short_label} | Oz Timber Floor`;
  const description = `${product.name} from ${product.range_family}. Request supply price, stock availability or a supply + install enquiry in Sydney.`;
  const canonical = `https://oztimberfloor.com.au${product.url}`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "LocalBusiness",
        "@id": "https://oztimberfloor.com.au/#business",
        name: "Oz Timber Floor",
        url: "https://oztimberfloor.com.au/",
        areaServed: { "@type": "City", name: "Sydney" },
        description: "Sydney timber flooring supplier, installer, builder flooring contractor and floor preparation specialist."
      },
      {
        "@type": "Product",
        name: product.name,
        category: product.category,
        brand: { "@type": "Brand", name: product.brand },
        image: [`https://oztimberfloor.com.au${product.image}`],
        description: product.description,
        sku: product.id,
        url: canonical
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: "https://oztimberfloor.com.au/" },
          { "@type": "ListItem", position: 2, name: "Products", item: "https://oztimberfloor.com.au/products/" },
          { "@type": "ListItem", position: 3, name: product.name, item: canonical }
        ]
      }
    ]
  };
  const specRows = [
    { label: "Brand", value: product.brand },
    { label: "Range", value: product.range_short_label },
    { label: "Colour", value: product.colour },
    { label: "Category", value: product.category },
    { label: "Thickness", value: product.thickness || "Confirm current supplier specification" },
    { label: "Board size", value: product.board_size || "Confirm current supplier specification" },
    { label: "Wear layer", value: product.wear_layer || "Confirm current supplier specification" },
    { label: "Installation method", value: product.installation_method },
    { label: "Finish", value: product.finish || "Confirm current supplier finish" },
    { label: "Suitable use", value: product.suitable_use },
    { label: "Warranty summary", value: product.warranty_summary },
    { label: "Spec sheet", value: product.spec_sheet_link ? "Current supplier sheet available on request" : "Ask Oz Timber Floor for the current supplier sheet" }
  ];
  const body = `
    <section class="hero">
      <div class="shell hero-grid">
        <div>
          <p class="eyebrow">${escapeHtml(product.category)} product</p>
          <h1>${escapeHtml(product.name)}</h1>
          <p class="lead">${escapeHtml(product.description)}</p>
          <div class="button-row">
            <a class="button" href="/contact/?enquiry=supply-install&product=${encodeURIComponent(product.name)}&category=${encodeURIComponent(product.category)}&source=${encodeURIComponent(product.url)}">Request supply + install quote</a>
            <a class="button-secondary" href="/contact/?enquiry=supply-only&product=${encodeURIComponent(product.name)}&category=${encodeURIComponent(product.category)}&source=${encodeURIComponent(product.url)}">Request supply price</a>
          </div>
        </div>
        <div class="hero-media">
          <img src="${escapeHtml(product.image)}" alt="${escapeHtml(product.alt_text)}" loading="lazy" decoding="async">
          <div class="hero-badge"><span>Supply</span><span>Install</span><span>Preparation</span></div>
        </div>
      </div>
    </section>
    <section class="section soft">
      <div class="shell split-content">
        <div class="text-block">
          <p class="eyebrow">Catalogue-commerce</p>
          <h2>Use this page for product-specific supply and install enquiries</h2>
          <p>Oz Timber Floor keeps this product page as a catalogue enquiry pathway. There is no online checkout or instant flooring price engine here.</p>
          <p>Use it to confirm supply pricing, current stock, compatible alternatives, site preparation and whether the selected collection suits the room, building type and installation method.</p>
        </div>
        <div class="card">
          <h3>Product actions</h3>
          <ul class="check-list">
            <li><a href="/contact/?enquiry=supply-only&product=${encodeURIComponent(product.name)}&category=${encodeURIComponent(product.category)}">Request supply price</a></li>
            <li><a href="/contact/?enquiry=stock&product=${encodeURIComponent(product.name)}&category=${encodeURIComponent(product.category)}">Check stock availability</a></li>
            <li><a href="/contact/?enquiry=supply-install&product=${encodeURIComponent(product.name)}&category=${encodeURIComponent(product.category)}">Request supply + install quote</a></li>
            <li><a href="/contact/?enquiry=product&product=${encodeURIComponent(product.name)}&category=${encodeURIComponent(product.category)}">Ask about this product</a></li>
          </ul>
        </div>
      </div>
    </section>
    <section class="section catalogue-specs">
      <div class="shell">
        <div class="section-head">
          <div><p class="eyebrow">Product details</p><h2>Catalogue specifications</h2></div>
          <p>Specifications should be checked against the current supplier sheet, the selected underlay and the site conditions before ordering.</p>
        </div>
        ${technicalGrid(specRows, [])}
      </div>
    </section>
    <section class="section">
      <div class="shell">
        <div class="grid-4">
          <a class="category-card" href="${escapeHtml(product.range_url)}"><strong>View range</strong><p>Compare this product against the rest of the ${escapeHtml(product.range_short_label)} collection.</p></a>
          <a class="category-card" href="/floor-levelling-sydney/"><strong>Floor levelling</strong><p>Check slab flatness, patching and preparation before final product ordering.</p></a>
          <a class="category-card" href="/timber-flooring-installation-sydney/"><strong>Installation</strong><p>Plan underlay, trims, access and installation sequencing.</p></a>
          <a class="category-card" href="${escapeHtml(categoryMeta.categoryUrl)}"><strong>More ${escapeHtml(product.category)}</strong><p>Compare this product with the broader Sydney category page.</p></a>
        </div>
      </div>
    </section>
    <section class="section">
      <div class="shell cta">
        <p class="eyebrow">Talk to Oz Timber Floor</p>
        <h2>Send a catalogue enquiry for ${escapeHtml(product.name)}</h2>
        <p>Share the suburb, approximate area, current floor, builder timing and whether you need supply-only, stock checking, floor preparation or installation support.</p>
        <div class="button-row">
          <a class="button-light" href="/contact/?enquiry=supply-install&topic=${encodeURIComponent(product.name)}&product=${encodeURIComponent(product.name)}&category=${encodeURIComponent(product.category)}">Request supply + install quote</a>
          <a class="button-light" href="/contact/?enquiry=stock&topic=${encodeURIComponent(product.name)}&product=${encodeURIComponent(product.name)}&category=${encodeURIComponent(product.category)}">Check stock availability</a>
        </div>
      </div>
    </section>`;
  return pageShell({ title, description, canonical, jsonLd, mainContent: body });
}

function buildRangePage(range) {
  const categoryMeta = CATEGORY_META[range.category_key];
  const title = `${range.range_short_label} Flooring Range | Oz Timber Floor`;
  const description = `${range.range_short_label} from ${range.family}. Request supply price, stock checks or supply + install support in Sydney.`;
  const canonical = `https://oztimberfloor.com.au${range.url}`;
  const faq = [
    {
      "@type": "Question",
      name: `Can I buy ${range.range_short_label} supply only?`,
      acceptedAnswer: {
        "@type": "Answer",
        text: `Yes. Oz Timber Floor can handle supply-only pricing, stock checks and supply + install enquiries for ${range.range_short_label}.`
      }
    },
    {
      "@type": "Question",
      name: `Should ${range.range_short_label} be installed over an uneven subfloor?`,
      acceptedAnswer: {
        "@type": "Answer",
        text: "No flooring range should be ordered or installed without checking the substrate. Floor levelling, patching or moisture review may still be required before final installation."
      }
    }
  ];
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "LocalBusiness",
        "@id": "https://oztimberfloor.com.au/#business",
        name: "Oz Timber Floor",
        url: "https://oztimberfloor.com.au/",
        areaServed: { "@type": "City", name: "Sydney" },
        description: "Sydney timber flooring supplier, installer, builder flooring contractor and floor preparation specialist."
      },
      {
        "@type": "Service",
        "@id": `${canonical}#service`,
        name: `${range.range_short_label} supply and installation enquiries in Sydney`,
        description,
        provider: { "@id": "https://oztimberfloor.com.au/#business" },
        areaServed: { "@type": "City", name: "Sydney" },
        url: canonical
      },
      {
        "@type": "FAQPage",
        "@id": `${canonical}#faq`,
        mainEntity: faq
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: "https://oztimberfloor.com.au/" },
          { "@type": "ListItem", position: 2, name: "Products", item: "https://oztimberfloor.com.au/products/" },
          { "@type": "ListItem", position: 3, name: range.range_short_label, item: canonical }
        ]
      }
    ]
  };
  const body = `
    <section class="hero">
      <div class="shell hero-grid">
        <div>
          <p class="eyebrow">${escapeHtml(range.category)} range</p>
          <h1>${escapeHtml(range.range_short_label)} flooring range</h1>
          <p class="lead">${escapeHtml(range.liveBlurb || description)}</p>
          <div class="button-row">
            <a class="button" href="/contact/?enquiry=supply-install&product=${encodeURIComponent(range.range_short_label)}&category=${encodeURIComponent(range.category)}&source=${encodeURIComponent(range.url)}">Request supply + install quote</a>
            <a class="button-secondary" href="/contact/?enquiry=supply-only&product=${encodeURIComponent(range.range_short_label)}&category=${encodeURIComponent(range.category)}&source=${encodeURIComponent(range.url)}">Request supply price</a>
          </div>
        </div>
        <div class="hero-media">
          <img src="${escapeHtml(range.image || categoryMeta.heroImage)}" alt="${escapeHtml(range.range_short_label)} flooring range" loading="lazy" decoding="async">
          <div class="hero-badge"><span>Supply</span><span>Install</span><span>Preparation</span></div>
        </div>
      </div>
    </section>
    <section class="section soft">
      <div class="shell split-content">
        <div class="text-block">
          <p class="eyebrow">${escapeHtml(range.family)}</p>
          <h2>Why this range matters in the Oz catalogue</h2>
          ${(range.description || []).map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join("")}
          <p>Use this range page when you want advice on collection fit, current availability, close alternative colours, installation method, floor preparation and whether the product suits the project brief.</p>
        </div>
        <div class="card">
          <h3>Range actions</h3>
          <ul class="check-list">
            <li><a href="/contact/?enquiry=supply-only&product=${encodeURIComponent(range.range_short_label)}&category=${encodeURIComponent(range.category)}">Request supply price</a></li>
            <li><a href="/contact/?enquiry=stock&product=${encodeURIComponent(range.range_short_label)}&category=${encodeURIComponent(range.category)}">Check stock availability</a></li>
            <li><a href="/contact/?enquiry=supply-install&product=${encodeURIComponent(range.range_short_label)}&category=${encodeURIComponent(range.category)}">Request supply + install quote</a></li>
            <li><a href="/contact/?enquiry=product&product=${encodeURIComponent(range.range_short_label)}&category=${encodeURIComponent(range.category)}">Ask about this range</a></li>
          </ul>
        </div>
      </div>
    </section>
    <section class="section catalogue-specs">
      <div class="shell">
        <div class="section-head">
          <div><p class="eyebrow">Range specifications</p><h2>Current collection details</h2></div>
          <p>Final board size, packaging, warranty and installation method should always be checked against the current supplier sheet before ordering.</p>
        </div>
        ${technicalGrid(range.technical || [], [
          { label: "Brand family", value: range.family },
          { label: "Category", value: range.category },
          { label: "Use", value: "Supply-only, stock and supply + install enquiries" }
        ])}
      </div>
    </section>
    ${range.products?.length ? `<section class="section soft catalogue-products"><div class="shell"><div class="section-head"><div><p class="eyebrow">Collection colours</p><h2>Products in the ${escapeHtml(range.range_short_label)} range</h2></div><p>Each product keeps the same catalogue-commerce enquiry structure, with no checkout or instant pack-pricing flow.</p></div><div class="grid-3">${productCards(range.products)}</div></div></section>` : ""}
    <section class="section">
      <div class="shell">
        <div class="grid-4">
          <a class="category-card" href="${escapeHtml(categoryMeta.categoryUrl)}"><strong>More ${escapeHtml(range.category)}</strong><p>Compare this range with the broader Sydney category page.</p></a>
          <a class="category-card" href="/timber-flooring-installation-sydney/"><strong>Installation</strong><p>Review the installation method, underlay and sequencing before ordering.</p></a>
          <a class="category-card" href="/floor-levelling-sydney/"><strong>Floor levelling</strong><p>Preparation still matters before floating, direct-stick or site-finished flooring work.</p></a>
          <a class="category-card" href="/builder-flooring-contractor-sydney/"><strong>Builder support</strong><p>Use Oz for staged handover, site coordination and commercial scheduling where needed.</p></a>
        </div>
      </div>
    </section>
    <section class="section soft" id="faqs">
      <div class="shell">
        <div class="section-head">
          <div><p class="eyebrow">FAQs</p><h2>Common range questions</h2></div>
          <p>These answers help scope supply-only, stock and installation enquiries before site inspection.</p>
        </div>
        <div class="faq-list">
          <article class="faq-item"><button type="button">Can I buy ${escapeHtml(range.range_short_label)} supply only?</button><p>Yes. Oz Timber Floor can handle supply-only pricing, stock checks and supply + install enquiries for ${escapeHtml(range.range_short_label)}.</p></article>
          <article class="faq-item"><button type="button">Should ${escapeHtml(range.range_short_label)} be installed over an uneven subfloor?</button><p>No flooring range should be ordered or installed without checking the substrate. Floor levelling, patching or moisture review may still be required before final installation.</p></article>
        </div>
      </div>
    </section>
    <section class="section">
      <div class="shell cta">
        <p class="eyebrow">Talk to Oz Timber Floor</p>
        <h2>Send an enquiry for ${escapeHtml(range.range_short_label)}</h2>
        <p>Share the suburb, approximate area, current floor, preferred colour, builder timing and whether you need supply-only, stock checking, floor preparation or installation support.</p>
        <div class="button-row">
          <a class="button-light" href="/contact/?enquiry=supply-install&topic=${encodeURIComponent(range.range_short_label)}&product=${encodeURIComponent(range.range_short_label)}&category=${encodeURIComponent(range.category)}">Request supply + install quote</a>
          <a class="button-light" href="/contact/?enquiry=stock&topic=${encodeURIComponent(range.range_short_label)}&product=${encodeURIComponent(range.range_short_label)}&category=${encodeURIComponent(range.category)}">Check stock availability</a>
        </div>
      </div>
    </section>`;
  return pageShell({ title, description, canonical, jsonLd, mainContent: body });
}

function replaceOrInsertSection(html, marker, sectionHtml, beforePattern) {
  const start = `<!-- ${marker} START -->`;
  const end = `<!-- ${marker} END -->`;
  const wrapped = `${start}\n${sectionHtml}\n${end}`;
  const blockPattern = new RegExp(`${start}[\\s\\S]*?${end}`);
  if (blockPattern.test(html)) {
    return html.replace(blockPattern, wrapped);
  }
  return html.replace(beforePattern, `${wrapped}\n$&`);
}

function updateCategoryPage(filePath, categoryLabel, Ranges, Products) {
  let html = fs.readFileSync(filePath, "utf8");
  const rangeSection = `<section class="section soft"><div class="shell"><div class="section-head"><div><p class="eyebrow"> ranges</p><h2>Imported  ${escapeHtml(categoryLabel.toLowerCase())} collections</h2></div><p>These collections follow the current supplier range structure, with each range leading to supply price, stock and supply + install enquiries.</p></div><div class="grid-3">${Ranges.map((range) => `<a class="category-card" href="${escapeHtml(range.url)}"><strong>${escapeHtml(range.range_short_label)}</strong><p>${escapeHtml(range.liveBlurb || plainTextList(range.description || []).slice(0, 180))}</p></a>`).join("")}</div></div></section>`;
  const productSection = `<section class="section catalogue-products"><div class="shell"><div class="section-head"><div><p class="eyebrow"> products</p><h2>Current  products in this category</h2></div><p>Use these product pages to ask about current availability, supply-only pricing, floor preparation and supply + install scope.</p></div><div class="grid-3">${productCards(Products.slice(0, 12))}</div></div></section>`;
  html = replaceOrInsertSection(html, `CATALOGUE ${categoryLabel.toUpperCase()} RANGES`, rangeSection, /<section class="section">\s*<div class="shell cta">/);
  html = replaceOrInsertSection(html, `CATALOGUE ${categoryLabel.toUpperCase()} PRODUCTS`, productSection, /<section class="section">\s*<div class="shell cta">/);
  fs.writeFileSync(filePath, html);
}

function updateProductsPage(filePath, ranges, products) {
  let html = fs.readFileSync(filePath, "utf8");
  const rangeSection = `<section class="section soft"><div class="shell"><div class="section-head"><div><p class="eyebrow"> supplier import</p><h2>Imported  ranges now available in Oz</h2></div><p>Oz now keeps the current  range structure across solid timber, engineered timber, laminate and hybrid pathways instead of flattening those searches into a single generic product page.</p></div><div class="grid-4">${ranges.map((range) => `<a class="category-card" href="${escapeHtml(range.url)}"><strong>${escapeHtml(range.range_short_label)}</strong><p>${escapeHtml(range.category)} · ${escapeHtml(range.family)}</p></a>`).join("")}</div></div></section>`;
  const productSection = `<section class="section catalogue-products"><div class="shell"><div class="section-head"><div><p class="eyebrow"> featured products</p><h2>Current  catalogue highlights</h2></div><p>These product pages are built for catalogue-commerce only, with no checkout and no instant flooring price calculation.</p></div><div class="grid-3">${productCards(products.slice(0, 18))}</div></div></section>`;
  html = replaceOrInsertSection(html, "CATALOGUE PRODUCTS PAGE RANGES", rangeSection, /<section class="section"><div class="shell cta">/);
  html = replaceOrInsertSection(html, "CATALOGUE PRODUCTS PAGE PRODUCTS", productSection, /<section class="section"><div class="shell cta">/);
  fs.writeFileSync(filePath, html);
}

function syncCleanUrlMirror(htmlFile) {
  const baseName = path.basename(htmlFile, ".html");
  const cleanDirIndex = path.join(OZ_ROOT, baseName, "index.html");
  if (fs.existsSync(path.join(OZ_ROOT, baseName))) {
    ensureDir(path.dirname(cleanDirIndex));
    fs.copyFileSync(htmlFile, cleanDirIndex);
  }
}

function updateProductCatalogue(products) {
  const filePath = path.join(OZ_DATA_PATH, "product-catalogue.json");
  const current = readJson(filePath);
  const non = (current.products || []).filter((item) => item.supplier !== "");
  const merged = non.concat(products.map((product) => ({
    url: product.url,
    name: product.name,
    brand: product.brand,
    range: product.range_short_label,
    colour: product.colour,
    category: product.category,
    thickness: product.thickness,
    board_size: product.board_size,
    wear_layer: product.wear_layer,
    installation_method: product.installation_method,
    finish: product.finish,
    suitable_use: product.suitable_use,
    warranty_summary: product.warranty_summary,
    image: product.image,
    alt_text: product.alt_text,
    spec_sheet_link: product.spec_sheet_link,
    supplier: product.supplier,
    supplier_url: product.supplier_url,
    enquiry_ctas: CTA_LABELS,
    no_checkout: true,
    source: product.source
  }))).sort((a, b) => a.name.localeCompare(b.name));
  current.updated = new Date().toISOString().slice(0, 10);
  current.products = merged;
  writeFile(filePath, JSON.stringify(current, null, 2) + "\n");

  const csvRows = merged.map((product) => ({
    url: product.url,
    product_name: product.name,
    supplier: product.supplier || product.brand,
    range: product.range,
    category: product.category,
    enquiry_type: "Catalogue enquiry only - no checkout",
    ctas: CTA_LABELS.join("; ")
  }));
  writeFile(path.join(OZ_DATA_PATH, "supplier-catalogue.csv"), toCsv(csvRows, ["url", "product_name", "supplier", "range", "category", "enquiry_type", "ctas"]));
}

function updateExpandedCatalogueCsv(products) {
  const rows = products.map((product) => ({
    url: product.url,
    supplier: product.supplier,
    range_family: product.range_family,
    range_name: product.range_short_label,
    product_name: product.name,
    colour: product.colour,
    category: product.category,
    thickness: product.thickness,
    board_size: product.board_size,
    installation_method: product.installation_method,
    finish: product.finish,
    suitable_use: product.suitable_use,
    supplier_url: product.supplier_url,
    image: product.image
  }));
  const csv = toCsv(rows, ["url", "supplier", "range_family", "range_name", "product_name", "colour", "category", "thickness", "board_size", "installation_method", "finish", "suitable_use", "supplier_url", "image"]);
  writeFile(path.join(OZ_DATA_PATH, "product-catalogue-expanded.csv"), csv);
}

function updateRangesCsv(ranges) {
  const supplierRangesPath = path.join(OZ_DATA_PATH, "supplier-ranges.csv");
  const existing = parseCsv(fs.readFileSync(supplierRangesPath, "utf8"));
  const retained = existing.filter((row) => !String(row.url || "").includes("/ranges/-") && !["/ranges/project-oak/", "/ranges/castel-nuovo-herringbone/", "/ranges/lavanda-oak/", "/ranges/cavallo-bianco-chevron/", "/ranges/avala-hybrid-planks/", "/ranges/lumiere-ultra-hd-hybrid-plank/", "/ranges/belle-vie-herringbone/", "/ranges/storm-luxury-hybrid-planks/", "/ranges/artisan-hybrid-tile/", "/ranges/pantora-amor-collection/", "/ranges/pantora-lifestyle-collection/", "/ranges/prime-deluxe-edition/", "/ranges/prime-contemporary-plus-edition/", "/ranges/prime-luxury-edition/", "/ranges/prime-legend-collection/", "/ranges/wooden-land-foreign-species/", "/ranges/wooden-land-australian-species-136mm/", "/ranges/wooden-land-australian-species-190mm/", "/ranges/wooden-land-herringbone/"].includes(row.url));
  const additions = ranges.map((range) => ({
    url: range.url,
    range_name: range.range_short_label,
    page_h1: `${range.range_short_label} flooring range`,
    category: range.category,
    ctas: "Supply price; Supply + install; Stock availability; Product question"
  }));
  const merged = retained.concat(additions).sort((a, b) => a.url.localeCompare(b.url));
  writeFile(supplierRangesPath, toCsv(merged, ["url", "range_name", "page_h1", "category", "ctas"]));
}

function updateMigrationExports() {
  fs.copyFileSync(path.join(OZ_DATA_PATH, "supplier-catalogue.csv"), path.join(OZ_ROOT, "migration/supplier-catalogue-expanded.csv"));
  fs.copyFileSync(path.join(OZ_DATA_PATH, "supplier-ranges.csv"), path.join(OZ_ROOT, "migration/supplier-ranges-expanded.csv"));
}

function updateDataGaps(products, ranges) {
  const filePath = path.join(OZ_ROOT, "migration/catalogue-commerce-data-gaps.md");
  const RangeCount = ranges.length;
  const ProductCount = products.length;
  const content = `# Catalogue-commerce data gaps

-  import completed for ${RangeCount} ranges and ${ProductCount} products using the current supplier range structure as at May 14, 2026.
- Imported categories: hybrid, laminate, engineered timber, plus range-level solid timber pathways.
- Product imagery was copied from the existing  WebP catalogue assets already held in the shared workspace.

Still needing supplier-confirmed data before final launch:

- Product-level  solid timber SKUs, board sizes and finished colour lists for raw and pre-finished solid timber.
- Current residential/commercial warranty documents for each collection.
- Direct spec sheet or download URLs if Oz wants public download buttons instead of enquiry-only access.
- Current stock flags and discontinued colour confirmation from .
- Final commercial-use suitability rules for each laminate and hybrid line where builder or office traffic is relevant.
`;
  writeFile(filePath, content);
}

function regenerateSitemap() {
  const urls = new Set(["https://oztimberfloor.com.au/"]);
  const topLevelEntries = fs.readdirSync(OZ_ROOT, { withFileTypes: true });
  for (const entry of topLevelEntries) {
    if (entry.isDirectory()) {
      const indexPath = path.join(OZ_ROOT, entry.name, "index.html");
      if (fs.existsSync(indexPath)) {
        urls.add(`https://oztimberfloor.com.au/${entry.name}/`);
      }
    }
  }
  const nestedDirs = ["products", "ranges", "guides"];
  for (const dir of nestedDirs) {
    const parent = path.join(OZ_ROOT, dir);
    if (!fs.existsSync(parent)) continue;
    for (const entry of fs.readdirSync(parent, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      const indexPath = path.join(parent, entry.name, "index.html");
      if (fs.existsSync(indexPath)) {
        urls.add(`https://oztimberfloor.com.au/${dir}/${entry.name}/`);
      }
    }
  }
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${Array.from(urls).sort().map((url) => `  <url><loc>${url}</loc></url>`).join("\n")}\n</urlset>\n`;
  writeFile(path.join(OZ_ROOT, "sitemap.xml"), xml);
}

function main() {
  ensureDir(path.join(OZ_ROOT, "scripts"));
  const api = loadOperonProducts();
  const products = createProducts(api);
  const sourceProductsById = new Map();
  for (const categoryKey of ["hybrid", "laminate", "engineered"]) {
    for (const product of api.getProductsByCategory(categoryKey)) {
      if (RANGE_IDS.has(product.rangeId)) {
        sourceProductsById.set(product.id, product);
      }
    }
  }
  for (const product of products) {
    product.rangeContent = sourceProductsById.get(product.id)?.rangeContent || {};
  }
  const ranges = createRangeRecords(products.map((product) => ({ ...product, rangeContent: sourceProductsById.get(product.id)?.rangeContent || {} })));

  for (const range of ranges) {
    const rangeHtml = buildRangePage(range);
    writeFile(path.join(OZ_RANGES_DIR, range.slug, "index.html"), rangeHtml);
  }

  for (const product of products) {
    const productHtml = buildProductPage(product);
    writeFile(path.join(OZ_PRODUCTS_DIR, product.slug, "index.html"), productHtml);
  }

  updateProductCatalogue(products);
  updateExpandedCatalogueCsv(products);
  updateRangesCsv(ranges);
  updateMigrationExports();
  updateDataGaps(products, ranges);

  updateProductsPage(path.join(OZ_ROOT, "products.html"), ranges, products);
  syncCleanUrlMirror(path.join(OZ_ROOT, "products.html"));

  for (const page of CATEGORY_PAGES) {
    const rangeMatches = ranges.filter((range) => range.category === page.category);
    const productMatches = products.filter((product) => product.category === page.category);
    const htmlPath = path.join(OZ_ROOT, page.file);
    updateCategoryPage(htmlPath, page.category, rangeMatches, productMatches);
    syncCleanUrlMirror(htmlPath);
  }

  regenerateSitemap();
}

main();
