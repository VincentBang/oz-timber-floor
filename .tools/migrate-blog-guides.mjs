import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const root = "/Users/daibang/Projects/oz-timber-floor";
const oldDomain = "https://oztimberfloor.com.au";
const postsApi = `${oldDomain}/wp-json/wp/v2/posts?per_page=100&_fields=slug,link,title.rendered,date`;

function fetchText(url) {
  return execFileSync("curl", ["-L", "--max-time", "30", "-A", "Mozilla/5.0", url], {
    encoding: "utf8",
    maxBuffer: 20 * 1024 * 1024,
  });
}

function decodeEntities(value = "") {
  return String(value)
    .replace(/&#8217;|&rsquo;/g, "'")
    .replace(/&#8220;|&#8221;|&ldquo;|&rdquo;/g, '"')
    .replace(/&#8211;|&#8212;|&ndash;|&mdash;/g, "-")
    .replace(/&#038;|&amp;/g, "&")
    .replace(/&nbsp;/g, " ")
    .replace(/&#8230;/g, "...")
    .replace(/&#039;/g, "'")
    .replace(/&#8242;/g, "'")
    .replace(/&#8243;/g, '"')
    .replace(/&#8216;/g, "'")
    .replace(/&#8239;/g, " ")
    .replace(/&#160;/g, " ")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function stripTags(value = "") {
  return decodeEntities(String(value).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ")).trim();
}

function truncate(text, max = 155) {
  const clean = stripTags(text);
  if (clean.length <= max) return clean;
  const trimmed = clean.slice(0, max - 1);
  return `${trimmed.slice(0, Math.max(trimmed.lastIndexOf(" "), 80)).trim()}.`;
}

function sentenceLead(text, max = 170) {
  const clean = stripTags(text);
  if (clean.length <= max) return clean;
  const sentences = clean.match(/[^.!?]+[.!?]+/g) || [];
  let result = "";
  for (const sentence of sentences) {
    const candidate = `${result} ${sentence}`.trim();
    if (candidate.length > max) break;
    result = candidate;
  }
  return result || truncate(clean, max);
}

function slugToGuideUrl(slug) {
  return `/guides/${slug}/`;
}

const postList = JSON.parse(fetchText(postsApi));
const postSlugs = new Set(postList.map((post) => post.slug));

const internalPathMap = new Map([
  ["/contact-us/", "/contact/"],
  ["/services/", "/services/"],
  ["/timber-floor-installation/", "/timber-flooring-installation-sydney/"],
  ["/timber-floor-sanding-and-polishing/", "/timber-floor-sanding-and-polishing-sydney/"],
  ["/timber-floor-removal-and-stripping/", "/timber-floor-removal-and-stripping-sydney/"],
  ["/floor-levelling/", "/floor-levelling-sydney/"],
  ["/commercial-flooring/", "/commercial-flooring-sydney/"],
  ["/office-flooring/", "/office-flooring-sydney/"],
  ["/hybrid/", "/hybrid-flooring-sydney/"],
  ["/laminate/", "/laminate-flooring-sydney/"],
  ["/vinyl/", "/vinyl-flooring-sydney/"],
  ["/solid-timber/", "/solid-timber-flooring-sydney/"],
  ["/manufactured-wood/", "/engineered-timber-flooring-sydney/"],
  ["/engineered-timber-flooring/", "/engineered-timber-flooring-sydney/"],
  ["/bamboo/", "/bamboo-flooring-sydney/"],
  ["/gallery/", "/projects/"],
  ["/blogs/", "/guides/"],
]);

function replaceInternalUrls(html) {
  let output = html.replace(/<\/?u>/g, "");
  output = output.replace(
    /href="https:\/\/oztimberfloor\.com\.au\/([^"#?]+)\/"/g,
    (match, slug) => {
      const oldPath = `/${slug}/`;
      if (postSlugs.has(slug)) return `href="${slugToGuideUrl(slug)}"`;
      return `href="${internalPathMap.get(oldPath) || oldPath}"`;
    }
  );
  output = output.replace(/href="https:\/\/oztimberfloor\.com\.au\/"/g, 'href="/"');
  return output;
}

function extractBodyFromOldPost(postUrl) {
  const html = fetchText(postUrl);
  const textBlocks = [...html.matchAll(/<div class="et_pb_text_inner">([\s\S]*?)<\/div>/g)].map((match) => match[1].trim());
  const featuredMatch = html.match(/class="entry-featured-image-url"><img[^>]+data-src="([^"]+)"/);
  const bodyHtml = replaceInternalUrls(textBlocks.join("\n"));
  return {
    bodyHtml,
    featuredImage: featuredMatch ? decodeEntities(featuredMatch[1]) : "",
  };
}

function extractExistingHeroImage(fileHtml) {
  const match = fileHtml.match(/<div class="hero-media">\s*<img src="([^"]+)" alt="([^"]*)"/);
  return match ? { src: match[1], alt: decodeEntities(match[2]) } : null;
}

function updateTag(html, pattern, replacement) {
  return html.replace(pattern, replacement);
}

function buildTopicConfig(slug) {
  if (slug.includes("floor-levelling")) {
    return {
      summaryHeading: "Why this matters before installation",
      checklistTitle: "What to send before asking about floor levelling",
      checklist: [
        "Suburb and approximate floor area",
        "Current floor type or subfloor condition",
        "The flooring category you want to install next",
        "Photos of uneven areas, transitions and doorways",
      ],
      related: [
        ["Floor levelling Sydney", "Review the service page when the substrate needs checking before installation.", "/floor-levelling-sydney/"],
        ["Timber flooring installation Sydney", "See how preparation connects to the installation pathway.", "/timber-flooring-installation-sydney/"],
        ["Hybrid flooring Sydney", "Compare a common product path that still depends on a suitable base.", "/hybrid-flooring-sydney/"],
      ],
      ctaHeading: "Need your floor checked before installation?",
      ctaText: "Send your suburb, approximate floor area, current floor type and photos if available. Oz Timber Floor can help review whether levelling, preparation or installation planning is needed.",
      buttons: [
        ["Ask about floor levelling", "/contact/?enquiry=service&topic=floor%20levelling&source=guide"],
        ["Request supply + install quote", "/contact/?enquiry=supply-install&source=guide"],
      ],
    };
  }
  if (slug.includes("hybrid") || slug.includes("vinyl")) {
    return {
      summaryHeading: "Start with product fit, not just colour",
      checklistTitle: "What to include in a product enquiry",
      checklist: [
        "Suburb and approximate area",
        "Room type and current floor condition",
        "Preferred product, range or colour if known",
        "Photos, floor plan or access details if installation is needed",
      ],
      related: [
        [slug.includes("vinyl") ? "Vinyl flooring Sydney" : "Hybrid flooring Sydney", "Compare the relevant category and range options before narrowing down colours.", slug.includes("vinyl") ? "/vinyl-flooring-sydney/" : "/hybrid-flooring-sydney/"],
        ["Floor levelling Sydney", "Review preparation if the floor may not be ready for installation.", "/floor-levelling-sydney/"],
        ["Products", "Browse category, range and colour pathways before sending an enquiry.", "/products/"],
      ],
      ctaHeading: slug.includes("vinyl") ? "Need help choosing vinyl timber flooring?" : "Need help choosing hybrid flooring?",
      ctaText: "Send the suburb, approximate area, current floor and any preferred range or colour. Oz Timber Floor can help review product fit, preparation and installation timing.",
      buttons: [
        ["Ask Oz Timber Floor", "/contact/?enquiry=product&source=guide"],
        ["Request supply + install quote", "/contact/?enquiry=supply-install&source=guide"],
      ],
    };
  }
  if (slug.includes("commercial") || slug.includes("office")) {
    return {
      summaryHeading: "Commercial flooring decisions usually start with the site",
      checklistTitle: "What to include in a commercial or office enquiry",
      checklist: [
        "Site type, suburb and approximate floor area",
        "Preferred product category or finish direction",
        "Access rules, working hours and staging needs",
        "Current floor condition and any preparation requirements",
      ],
      related: [
        [slug.includes("office") ? "Office flooring Sydney" : "Commercial flooring Sydney", "Review the main service page for site coordination, staging and product pathways.", slug.includes("office") ? "/office-flooring-sydney/" : "/commercial-flooring-sydney/"],
        ["Builder flooring contractor Sydney", "Use the builder page when project coordination, schedules and handover matter.", "/builder-flooring-contractor-sydney/"],
        ["Projects", "See related project and proof pathways before sending your enquiry.", "/projects/"],
      ],
      ctaHeading: slug.includes("office") ? "Planning an office flooring upgrade?" : "Need help planning a commercial flooring project?",
      ctaText: "Send the site type, suburb, approximate area, access rules and preferred product direction. Oz Timber Floor can help review the right preparation and installation path.",
      buttons: [
        ["Request commercial quote", "/contact/?enquiry=commercial&source=guide"],
        ["Ask about staged installation", "/contact/?enquiry=service&topic=commercial%20staging&source=guide"],
      ],
    };
  }
  if (slug.includes("installer") || slug.includes("provider") || slug === "hire-over-diy" || slug.includes("services-timber-floor-installers")) {
    return {
      summaryHeading: "Use this guide to qualify the work pathway early",
      checklistTitle: "What to gather before asking for an installation quote",
      checklist: [
        "Suburb and approximate floor area",
        "Current floor type and any removal needs",
        "Preferred product or finish direction if known",
        "Access details, stairs, parking or timing constraints",
      ],
      related: [
        ["Timber flooring installation Sydney", "Review the main installation pathway before comparing quotes or scope.", "/timber-flooring-installation-sydney/"],
        ["Floor levelling Sydney", "Check preparation early if the floor may not be ready for installation.", "/floor-levelling-sydney/"],
        ["Contact Oz Timber Floor", "Send the project details directly when you are ready to move into quoting.", "/contact/?enquiry=supply-install&source=guide"],
      ],
      ctaHeading: "Ready to talk through your flooring project?",
      ctaText: "Send the suburb, approximate area, current floor, preferred product and whether you need supply-only, preparation or installation. Oz Timber Floor can help point you toward the right next step.",
      buttons: [
        ["Request supply + install quote", "/contact/?enquiry=supply-install&source=guide"],
        ["Ask about preparation", "/contact/?enquiry=service&source=guide"],
      ],
    };
  }
  if (slug.includes("restore") || slug.includes("hardwood") || slug.includes("engineered") || slug.includes("solid-timber-flooring-vs")) {
    return {
      summaryHeading: "Compare the flooring path before you compare colours",
      checklistTitle: "What to consider before choosing a timber flooring path",
      checklist: [
        "Suburb and approximate floor area",
        "Current floor or subfloor condition",
        "Whether you want restoration, replacement or a new install",
        "Preferred look, product type and timing",
      ],
      related: [
        ["Engineered timber flooring Sydney", "Compare engineered timber ranges and product pathways.", "/engineered-timber-flooring-sydney/"],
        ["Solid timber flooring Sydney", "Review solid timber options when a natural timber path is still on the table.", "/solid-timber-flooring-sydney/"],
        ["Timber floor sanding and polishing Sydney", "Use the restoration path when the existing floor may still be worth saving.", "/timber-floor-sanding-and-polishing-sydney/"],
      ],
      ctaHeading: "Need help choosing the right timber flooring path?",
      ctaText: "Send your suburb, approximate area, current floor and preferred look or product type. Oz Timber Floor can help review whether solid timber, engineered timber, restoration or preparation makes the most sense.",
      buttons: [
        ["Ask Oz Timber Floor", "/contact/?enquiry=product&source=guide"],
        ["Request supply + install quote", "/contact/?enquiry=supply-install&source=guide"],
      ],
    };
  }
  return {
    summaryHeading: "Start with the practical decision",
    checklistTitle: "What to include with your flooring enquiry",
    checklist: [
      "Suburb and approximate floor area",
      "Current floor or subfloor condition",
      "Preferred product, service or finish direction",
      "Photos, plans, access or timing details if relevant",
    ],
    related: [
      ["Products", "Compare flooring categories, ranges and colours before ordering.", "/products/"],
      ["Services", "Review installation, preparation and flooring service pathways.", "/services/"],
      ["Contact Oz Timber Floor", "Send the project details directly when you are ready for the next step.", "/contact/?enquiry=product&source=guide"],
    ],
    ctaHeading: "Need help with your flooring project?",
    ctaText: "Send the suburb, approximate area, current floor and preferred product or service direction. Oz Timber Floor can help point you toward the right product, preparation or installation pathway.",
    buttons: [
      ["Ask Oz Timber Floor", "/contact/?enquiry=product&source=guide"],
      ["Request supply + install quote", "/contact/?enquiry=supply-install&source=guide"],
    ],
  };
}

function buildGuideMain({ title, lead, heroImage, heroAlt, contentHtml, config }) {
  return `<main>
  <section class="hero">
    <div class="shell hero-grid">
      <div>
        <p class="eyebrow">Flooring guide</p>
        <h1>${escapeHtml(title)}</h1>
        <p class="lead">${escapeHtml(lead)}</p>
        <div class="button-row">
          <a class="button" href="/contact/?enquiry=product&source=guide">Ask Oz Timber Floor</a>
          <a class="button-secondary" href="/guides/">More guides</a>
        </div>
      </div>
      <div class="hero-media">
        <img src="${escapeHtml(heroImage)}" alt="${escapeHtml(heroAlt)}">
        <div class="hero-badge"><span>Choose</span><span>Prepare</span><span>Install</span></div>
      </div>
    </div>
  </section>
  <section class="section soft">
    <div class="shell">
      <div class="section-head">
        <div><p class="eyebrow">Key takeaway</p><h2>${escapeHtml(config.summaryHeading)}</h2></div>
        <p>${escapeHtml(lead)}</p>
      </div>
    </div>
  </section>
  <section class="section">
    <div class="shell text-block">
      <p class="eyebrow">Full guide</p>
      ${contentHtml}
    </div>
  </section>
  <section class="section soft">
    <div class="shell">
      <div class="section-head">
        <div><p class="eyebrow">Checklist</p><h2>${escapeHtml(config.checklistTitle)}</h2></div>
      </div>
      <div class="grid-4">
        ${config.checklist.map((item, index) => `<article class="category-card"><strong>Check ${index + 1}</strong><p>${escapeHtml(item)}</p></article>`).join("")}
      </div>
    </div>
  </section>
  <section class="section">
    <div class="shell">
      <div class="section-head">
        <div><p class="eyebrow">Next pages</p><h2>Related product and service pathways</h2></div>
        <p>Use these links to move from research into the right product, preparation or enquiry page.</p>
      </div>
      <div class="grid-3">
        ${config.related.map(([cardTitle, text, href]) => `<a class="card link-card" href="${href}"><h3>${escapeHtml(cardTitle)}</h3><p>${escapeHtml(text)}</p><span class="card-arrow" aria-hidden="true">→</span></a>`).join("")}
      </div>
    </div>
  </section>
  <section class="section soft">
    <div class="shell cta">
      <p class="eyebrow">Talk to Oz Timber Floor</p>
      <h2>${escapeHtml(config.ctaHeading)}</h2>
      <p>${escapeHtml(config.ctaText)}</p>
      <div class="button-row">
        ${config.buttons.map(([label, href], index) => `<a class="${index === 0 ? "button" : "button-secondary"}" href="${href}">${escapeHtml(label)}</a>`).join("")}
      </div>
    </div>
  </section>
</main>`;
}

function ensureRedirectLines(lines) {
  const redirectsPath = path.join(root, "_redirects");
  let redirects = fs.readFileSync(redirectsPath, "utf8");
  let changed = false;
  for (const line of lines) {
    if (!redirects.includes(line)) {
      redirects += `${redirects.endsWith("\n") ? "" : "\n"}${line}\n`;
      changed = true;
    }
  }
  if (changed) fs.writeFileSync(redirectsPath, redirects);
}

const matrixRows = [
  [
    "old_title",
    "old_url",
    "old_slug",
    "new_guide_title",
    "new_guide_url",
    "new_slug",
    "status",
    "content_status",
    "redirect_status",
    "image_status",
    "priority",
    "notes",
  ].join(","),
];

const redirectLines = ["/blogs/page/* /guides/ 301"];

for (const post of postList) {
  const guidePath = path.join(root, "guides", post.slug, "index.html");
  if (!fs.existsSync(guidePath)) continue;

  const currentHtml = fs.readFileSync(guidePath, "utf8");
  const currentWordCount = stripTags((currentHtml.match(/<main>[\s\S]*<\/main>/) || [""])[0]).split(/\s+/).filter(Boolean).length;

  const { bodyHtml, featuredImage } = extractBodyFromOldPost(post.link);
  const cleanTitle = stripTags(post.title.rendered);
  const bodyWordCount = stripTags(bodyHtml).split(/\s+/).filter(Boolean).length;
  const firstParagraph = bodyHtml.match(/<p[^>]*>([\s\S]*?)<\/p>/i);
  const lead = sentenceLead(firstParagraph ? firstParagraph[1] : cleanTitle, 170);
  const existingHero = extractExistingHeroImage(currentHtml);
  const config = buildTopicConfig(post.slug);
  const heroImage = existingHero?.src || "/assets/images/hero/sydney-timber-flooring-contractor.jpg";
  const heroAlt = existingHero?.alt || cleanTitle;
  const newMain = buildGuideMain({
    title: cleanTitle,
    lead,
    heroImage,
    heroAlt,
    contentHtml: bodyHtml,
    config,
  });

  let updated = currentHtml.replace(/<main>[\s\S]*?<\/main>/, newMain);
  updated = updateTag(updated, /<title>[\s\S]*?<\/title>/, `<title>${escapeHtml(cleanTitle)} | Oz Timber Floor Guide</title>`);
  updated = updateTag(updated, /<meta name="description" content="[^"]*">/, `<meta name="description" content="${escapeHtml(truncate(lead))}">`);
  updated = updateTag(updated, /<meta property="og:title" content="[^"]*">/, `<meta property="og:title" content="${escapeHtml(cleanTitle)} | Oz Timber Floor Guide">`);
  updated = updateTag(updated, /<meta property="og:description" content="[^"]*">/, `<meta property="og:description" content="${escapeHtml(truncate(lead))}">`);
  updated = updateTag(updated, /"headline":"[^"]*"/, `"headline":"${escapeHtml(cleanTitle)}"`);
  fs.writeFileSync(guidePath, updated);

  redirectLines.push(`/${post.slug}/ ${slugToGuideUrl(post.slug)} 301`);

  const previouslyShort = currentWordCount < Math.max(200, bodyWordCount * 0.7);
  const imageStatus = featuredImage && heroImage !== featuredImage ? "fallback local image used" : featuredImage ? "old featured image retained" : "fallback local image used";
  const priority = [
    "solid-timber-flooring-vs-engineered-flooring-which-one-is-right-for-you",
    "5-tell-tale-signs-engineered-timber-flooring-is-right-for-your-property",
    "laying-the-foundations-right-why-floor-levelling-matters-for-your-timber-flooring",
    "common-questions-we-get-as-hybrid-floor-installers-in-sydney",
    "3-reasons-why-modern-homes-use-engineered-oak-flooring-in-sydney",
    "your-guide-for-choosing-a-reliable-sydney-timber-flooring-provider",
    "why-a-hardwood-timber-floor-will-never-be-out-of-style",
    "the-5-questions-to-ask-your-timber-floor-installer-in-sydney",
    "3-services-timber-floor-installers-in-sydney-can-do-for-you",
    "hire-over-diy",
  ].includes(post.slug)
    ? "P1"
    : "P2";

  matrixRows.push([
    `"${cleanTitle.replace(/"/g, '""')}"`,
    post.link,
    post.slug,
    `"${cleanTitle.replace(/"/g, '""')}"`,
    `${oldDomain}${slugToGuideUrl(post.slug)}`,
    post.slug,
    "migrated",
    "full copied",
    "redirect implemented",
    imageStatus,
    priority,
    `"${(previouslyShort ? "Previously shortened summary guide rebuilt with cleaned full article body." : "Guide retained and refreshed with cleaned full article body.").replace(/"/g, '""')}"`,
  ].join(","));
}

ensureRedirectLines(redirectLines);
fs.writeFileSync(path.join(root, "docs/seo-migration/BLOG_MIGRATION_MATRIX.csv"), `${matrixRows.join("\n")}\n`);
console.log(`Migrated ${postList.length} blog posts into the guides system and updated the blog migration matrix.`);
