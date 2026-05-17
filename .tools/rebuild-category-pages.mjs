import fs from "fs";
import path from "path";

const ROOT = "/Users/daibang/Projects/oz-timber-floor";

const CATEGORY_CONFIG = {
  "hybrid-flooring-sydney": {
    category: "Hybrid",
    categorySlug: "hybrid",
    anchor: "hybrid-ranges",
    heading: "Popular hybrid flooring ranges to start with",
    intro: "Start with the range, then compare colours, specifications and project fit.",
    showAll: false,
  },
  "laminate-flooring-sydney": {
    category: "Laminate",
    categorySlug: "laminate",
    anchor: "laminate-ranges",
    heading: "Popular laminate flooring ranges to start with",
    intro: "Start with the range, then compare colours, specifications and project fit.",
    showAll: false,
  },
  "engineered-timber-flooring-sydney": {
    category: "Engineered timber",
    categorySlug: "engineered-timber",
    anchor: "engineered-timber-ranges",
    heading: "Popular engineered timber flooring ranges to start with",
    intro: "Start with the range, then compare colours, specifications and project fit.",
    showAll: false,
  },
  "solid-timber-flooring-sydney": {
    category: "Solid timber",
    categorySlug: "solid-timber",
    anchor: "solid-timber-ranges",
    heading: "Browse all solid timber flooring ranges",
    intro: "Start with the range, then compare species direction, finishing pathway and project fit.",
    showAll: true,
  },
  "vinyl-flooring-sydney": {
    category: "Vinyl",
    categorySlug: "vinyl",
    anchor: "vinyl-ranges",
    heading: "Popular vinyl flooring ranges to start with",
    intro: "Start with the range, then compare colours, practical use and installation fit.",
    showAll: false,
  },
};

const RANGE_DESCRIPTION_OVERRIDES = {
  artisan: "Timber-look hybrid range for customers comparing broader colour choice across practical residential projects.",
  "artisan-tile": "Tile-look hybrid range for stone, marble and concrete-style interiors without moving into ceramic tile selection.",
  aspire: "Hybrid range with timber-look colours for customers comparing a broader residential colour set.",
  avala: "6.5mm timber-look hybrid range with 10 colours for practical residential and apartment projects.",
  "belle-vie": "7mm hybrid range with timber-look colours for homes, apartments and rental upgrades.",
  "easi-plank": "Straightforward timber-look hybrid plank range for customers comparing practical colour options.",
  "elite-6-0-hybrid": "Slimmer hybrid profile for projects comparing timber-look colours with a lower overall build-up.",
  "etf-7-0mm-hybrid": "7mm hybrid collection for customers comparing timber-look colours and floating-floor options.",
  "etf-8-0mm-hybrid": "8mm hybrid collection for customers comparing timber-look colours and thicker floating-floor options.",
  "etf-9-0mm-hybrid": "9mm hybrid collection for customers comparing timber-look colours and larger-format hybrid options.",
  "etf-hybrid-spc-9mm": "9mm SPC hybrid range for customers checking timber-look colours, stock and project fit.",
  "grande-7-5-hybrid": "7.5mm hybrid plank option for customers comparing larger-format timber-look flooring.",
  "grande-9-0-hybrid": "Thicker hybrid plank option for customers comparing larger-format hybrid flooring.",
  infinite: "Laminate range for customers comparing timber-look colours for dry internal rooms and renovation planning.",
  "kronoswiss-aquastop": "Laminate range with a broad colour library for dry internal rooms and renovation upgrades.",
  "aqua-wood-plus-12mm": "12mm laminate range for customers comparing thicker timber-look flooring in dry internal rooms.",
  "aquastop-laminate": "Laminate option for customers checking timber-look colour direction, stock and room suitability.",
  "etf-12mm-laminate": "12mm laminate collection for customers comparing thicker timber-look renovation options.",
  "oak-step": "Laminate range for customers comparing everyday timber-look colours for dry internal spaces.",
  "oak-step-plus": "Laminate range for customers comparing timber-look colours with a thicker profile where verified.",
  oakleaf: "Laminate range for customers comparing timber-look colour options in dry internal rooms.",
  "oakleaf-laminate": "Laminate range for customers checking colour direction, stock and project fit for dry internal rooms.",
  "pantora-amor": "Laminate range with oak-look colours for customers comparing renovation-ready timber-look flooring.",
  "pantora-lifestyle": "Laminate range for budget-aware renovations where dry room suitability still needs to be checked.",
  "classic-laminate": "Laminate pathway for customers checking straightforward timber-look options, stock and trims.",
  botanica: "Engineered timber range with real timber character for premium homes, studios and office interiors.",
  "castel-nuovo": "Engineered timber range for customers comparing chevron and plank-style timber visuals where verified.",
  "cavallo-bianco": "Engineered timber range for premium interiors where board size, colour and installation method matter.",
  "elk-falls": "Engineered timber pathway for customers comparing real timber character with a smaller verified colour set.",
  "lavanda-oak": "Engineered oak range for premium residential interiors where board specification should be confirmed.",
  fiddleback: "Engineered Australian timber range for customers comparing Blackbutt and Spotted Gum-style visuals.",
  "select-australian-timber": "Engineered Australian timber range for projects comparing local timber visuals and stable board construction.",
  "prestige-oak": "Engineered oak range for premium interiors where colour, board construction and lead time matter.",
  "project-oak": "Engineered oak pathway for customers balancing colour direction, site fit and installation planning.",
  pronto: "Engineered timber option for customers comparing practical timber visuals and board specifications.",
  "pronto-engineered-oak": "Engineered oak range for customers comparing straightforward timber colour options and project fit.",
  "swish-oak": "Engineered timber range for customers comparing contemporary oak visuals, stock and installation fit.",
  solid: "Natural timber range for customers comparing species direction, finishing pathway and long-term timber character.",
  swish: "Engineered timber range for customers comparing Australian hardwood visuals, stock availability and installation planning.",
  "ornato-vinyl": "Practical vinyl plank range for customers checking colour availability, stock and supply-only options.",
  vinyl: "Vinyl flooring pathway for customers checking live colour availability, stock timing and installation fit.",
};

const RANGE_CHIP_OVERRIDES = {
  solid: ["Natural timber flooring", "24 colours"],
  swish: ["Engineered timber", "6 colours"],
  "ornato-vinyl": ["Vinyl", "16 colours"],
  vinyl: ["Vinyl", "Colours to confirm"],
};

const RANGE_IMAGE_OVERRIDES = {
  "ornato-vinyl": {
    src: "/assets/products/vinyl/ornato-luxury/ornato-como.jpg",
    alt: "Ornato Como vinyl flooring colour swatch",
  },
  vinyl: {
    src: "/assets/products/vinyl/ornato-luxury/ornato-blackbutt.jpg",
    alt: "Ornato Blackbutt vinyl flooring colour swatch",
  },
};

const MANUAL_RANGE_CARDS = {
  "solid-timber-flooring-sydney": [
    {
      name: "Solid",
      href: "/ranges/solid/",
      pills: ["Natural timber flooring", "26 colours"],
      description: "Natural timber range for customers comparing species direction, finishing pathway and long-term timber character.",
    },
    {
      name: "Pre-Finished Solid Timber",
      href: "/ranges/pre-finished-solid-timber/",
      pills: ["Solid timber", "9 colours"],
      description: "Pre-finished solid timber range for customers comparing species colour, stock timing and installation planning before order.",
    },
    {
      name: "Raw Solid Timber",
      href: "/ranges/raw-solid-timber/",
      pills: ["Solid timber", "2 colours"],
      description: "Raw solid timber range for customers comparing species direction, supply timing and installation or finishing planning.",
    },
  ],
  "vinyl-flooring-sydney": [
    {
      name: "Ornato Luxury",
      href: "/ranges/ornato-vinyl/",
      pills: ["Vinyl", "16 colours"],
      description: "Practical vinyl colour range for customers checking stock, lead time, alternatives and supply-only or supply + install options.",
    },
  ],
};

const SELECTED_PRODUCT_CONFIG = {
  "hybrid-flooring-sydney": [
    "artisan-tile-black-maquina",
    "aspire-coastal-blackbutt",
    "avala-blackbutt",
    "belle-vie-bellevue-avenue",
    "grande-9-0-hybrid-sand",
    "elite-6-0-hybrid-american-hickory",
  ],
  "laminate-flooring-sydney": [
    "kronswiss-aquastop-lugano-oak",
    "aqua-wood-plus-12mm-big-ben-p-and-h",
    "aquastop-laminate-zermatt",
    "12mm-laminate-aspen-oak",
    "oak-step-os101-houston",
    "oak-step-plus-op101-houston-plus",
  ],
  "engineered-timber-flooring-sydney": [
    "botanica-alaska",
    "castel-nuovo-black-amber",
    "amaretti-oak",
    "elk-falls-hickory",
    "lavanda-oak-amaretti-oak",
    "fiddleback-herringbone-blackbutt",
  ],
  "solid-timber-flooring-sydney": [
    "australian-blackbutt",
    "australian-spotted-gum",
    "pacific-blackbutt",
    "pacific-spotted-gum",
    "grey-ironbark",
    "cumaru-brazilian-teak",
  ],
  "vinyl-flooring-sydney": [
    "ornato-blackbutt",
    "ornato-como",
    "ornato-florence",
    "ornato-spotted-gum",
    "ornato-tivoli",
    "ornato-vittoria",
  ],
};

const load = (filePath) => fs.readFileSync(filePath, "utf8");
const save = (filePath, content) => fs.writeFileSync(filePath, content);

function getCurrentRangeCards(html) {
  const sectionMatch = html.match(/<section class="section" id="[^"]+-ranges">([\s\S]*?)<\/section>/);
  if (!sectionMatch) return [];
  return [...sectionMatch[1].matchAll(/<article class="card range-summary-card">([\s\S]*?)<\/article>/g)].map((match) => {
    const body = match[1];
    return {
      name: (body.match(/<h3>(.*?)<\/h3>/) || [])[1] || "",
      href: (body.match(/href="([^"]+)"/) || [])[1] || "",
      pills: [...body.matchAll(/<span class="pill">(.*?)<\/span>/g)].map((pill) => pill[1]),
      description: (body.match(/<h3>.*?<\/h3><p>(.*?)<\/p>/) || [])[1] || "",
    };
  });
}

function getBestRangeImage(rangeSlug) {
  if (RANGE_IMAGE_OVERRIDES[rangeSlug]) return RANGE_IMAGE_OVERRIDES[rangeSlug];
  const rangePath = path.join(ROOT, "ranges", rangeSlug, "index.html");
  if (!fs.existsSync(rangePath)) return null;
  const html = load(rangePath);
  const patterns = [
    /<figure class="catalogue-gallery-item primary"><img src="([^"]+)" alt="([^"]+)"/,
    /<div class="hero-media"><img src="([^"]+)" alt="([^"]+)"/,
    /<article class="product-card[^"]*"[\s\S]*?<img src="([^"]+)" alt="([^"]+)"/,
  ];
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (!match) continue;
    const [src, alt] = [match[1], match[2]];
    if (src.includes("coming-soon") || src.includes("oz-timber-floor-logo")) continue;
    return { src, alt };
  }
  return null;
}

function buildRangeCard(category, card) {
  const slug = card.href.replace(/^\/ranges\/|\/$/g, "");
  const image = getBestRangeImage(slug);
  const description = RANGE_DESCRIPTION_OVERRIDES[slug] || card.description;
  const pills = RANGE_CHIP_OVERRIDES[slug] || card.pills;
  const imageHtml = image
    ? `<img class="category-thumb" src="${image.src}" alt="${image.alt}" loading="lazy" decoding="async">`
    : `<div class="missing-image-state range-missing"><span>Colour image to confirm</span><small>Ask Oz Timber Floor for the current range swatch</small></div>`;
  return `<article class="card range-summary-card">${imageHtml}<p class="catalogue-overline">${category}</p><h3>${card.name}</h3><p>${description}</p><p class="product-meta">${pills.map((pill) => `<span class="pill">${pill}</span>`).join("")}</p><a class="card-link" href="${card.href}">View range</a></article>`;
}

function buildRangeSection(slug, html) {
  const config = CATEGORY_CONFIG[slug];
  const sourceCards = MANUAL_RANGE_CARDS[slug] || getCurrentRangeCards(html);
  const cards = sourceCards.map((card) => buildRangeCard(config.category, card)).join("");
  const button = config.showAll
    ? ""
    : `<div class="button-row"><a class="button-secondary" href="/ranges/#${config.categorySlug}">View all ${config.category.toLowerCase()} ranges</a></div>`;
  return `<section class="section" id="${config.anchor}"><div class="shell"><div class="section-head"><div><p class="eyebrow">Ranges</p><h2>${config.heading}</h2></div><p>${config.intro}</p></div><div class="grid-3">${cards}</div>${button}</div></section>`;
}

function loadProductCardData(slug, sourcePage, category) {
  const filePath = path.join(ROOT, "products", slug, "index.html");
  if (!fs.existsSync(filePath)) return null;
  const html = load(filePath);
  const title = (html.match(/<h1>(.*?)<\/h1>/) || [])[1] || "";
  const description = (html.match(/<p class="lead">(.*?)<\/p>/) || [])[1] || "";
  const imageMatch = html.match(/<figure class="catalogue-gallery-item primary"><img src="([^"]+)" alt="([^"]+)"/);
  if (!imageMatch || imageMatch[1].includes("coming-soon") || imageMatch[1].includes("oz-timber-floor-logo")) return null;
  const specMap = Object.fromEntries(
    [...html.matchAll(/<div class="spec-item"><span>(.*?)<\/span><strong>(.*?)<\/strong><\/div>/g)].map((match) => [match[1], match[2]])
  );
  const chips = [category];
  if (specMap["Thickness"] && !specMap["Thickness"].includes("Confirm")) chips.push(specMap["Thickness"]);
  if (specMap["Board size"] && !specMap["Board size"].includes("Confirm")) chips.push(specMap["Board size"]);
  return {
    title,
    range: specMap["Range"] || "",
    image: imageMatch[1],
    alt: imageMatch[2],
    description,
    chips,
    href: `/products/${slug}/`,
    stockHref: `/contact/?enquiry=stock&product=${encodeURIComponent(title)}&productSlug=${slug}&range=${encodeURIComponent(specMap["Range"] || "")}&category=${encodeURIComponent(category)}&source=${sourcePage}`,
  };
}

function buildProductCard(card) {
  return `<article class="product-card catalogue-card"><img src="${card.image}" alt="${card.alt}" loading="lazy" decoding="async"><div class="product-body"><p class="catalogue-overline">${card.range}</p><h3>${card.title}</h3><p>${card.description}</p><p class="product-meta">${card.chips.map((pill) => `<span class="pill">${pill}</span>`).join("")}</p><div class="product-actions compact-actions"><a class="button-inline" href="${card.href}">View details</a><a class="button-inline ghost-inline" href="${card.stockHref}">Check stock</a></div></div></article>`;
}

function buildSelectedColoursSection(slug) {
  const cards = (SELECTED_PRODUCT_CONFIG[slug] || [])
    .map((productSlug) => loadProductCardData(productSlug, slug, CATEGORY_CONFIG[slug].category))
    .filter(Boolean);
  if (!cards.length) return "";
  const category = CATEGORY_CONFIG[slug].category.toLowerCase();
  const extraNote =
    slug === "vinyl-flooring-sydney"
      ? `<div class="range-help-box"><h3>Need more vinyl colour options?</h3><p>Current live vinyl swatches are limited, so use the range pages or send Oz Timber Floor the look you have in mind for current colour and stock guidance.</p></div>`
      : "";
  return `<section class="section soft catalogue-products"><div class="shell"><div class="section-head"><div><p class="eyebrow">Selected colours</p><h2>Popular ${category} flooring colours</h2></div><p>A small sample of colours across different ranges. Open a range page to compare the full colour list.</p></div><div class="grid-3">${cards.map(buildProductCard).join("")}</div>${extraNote}</div></section>`;
}

function removeSupplySupportSection(html) {
  return html.replace(/<section class="section soft"><div class="shell"><div class="section-head"><div><p class="eyebrow">Supply support<\/p><h2>Need supply-only or stock help\?<\/h2>[\s\S]*?<\/section>/, "");
}

function upsertSelectedColoursSection(slug, html) {
  html = html.replace(/<section class="section soft catalogue-products">[\s\S]*?<\/section>/, "");
  const section = buildSelectedColoursSection(slug);
  if (!section) return html;
  return html.replace(/<section class="section"><div class="shell"><div class="section-head"><div><p class="eyebrow">Before ordering<\/p>/, `${section}<section class="section"><div class="shell"><div class="section-head"><div><p class="eyebrow">Before ordering</p>`);
}

for (const slug of Object.keys(CATEGORY_CONFIG)) {
  const indexPath = path.join(ROOT, slug, "index.html");
  let html = load(indexPath);
  html = html.replace(/<section class="section" id="[^"]+-ranges">[\s\S]*?<\/section>(?=<section class="section)/, buildRangeSection(slug, html));
  html = removeSupplySupportSection(html);
  html = upsertSelectedColoursSection(slug, html);
  save(indexPath, html);
  save(path.join(ROOT, `${slug}.html`), html);
  console.log(`Updated ${slug}`);
}
