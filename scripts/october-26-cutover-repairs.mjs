#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function read(relative) {
  return fs.readFileSync(path.join(root, relative), "utf8");
}

function write(relative, contents) {
  const target = path.join(root, relative);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, contents);
}

function replaceOnce(contents, pattern, replacement, label) {
  const matches = contents.match(pattern);
  if (!matches) throw new Error(`Missing ${label}`);
  const updated = contents.replace(pattern, replacement);
  if (updated === contents) throw new Error(`No change for ${label}`);
  return updated;
}

function escapeJson(value) {
  return JSON.stringify(value);
}

const faqItems = [
  ["Can Oz Timber Floor supply products without installation?", "Yes. Send a supply-only enquiry with the product or range, quantity or approximate area, suburb and timing. Stock, current product details and the next supply step can then be confirmed."],
  ["When should floor levelling be checked?", "Check the subfloor before installation dates are locked in, especially after old flooring is removed, on uneven slabs or where the selected product needs a flat substrate."],
  ["Can I order directly from product pages?", "No. The catalogue is enquiry-based. You can request a supply price, request supply and installation, check stock or ask about a product before ordering."],
  ["Does Oz work with builders and commercial clients?", "Yes. Builder and commercial enquiries can include product supply, floor preparation, staged delivery, access requirements, installation scheduling and handover details."],
  ["How should I prepare the property before installation?", "Confirm furniture movement, access, parking, lift or strata rules, other trades and whether existing flooring must be removed. The exact preparation depends on the product and site."],
  ["How long will a flooring renovation take?", "Timing depends on the area, product, access, removal work, subfloor condition and whether levelling or moisture-related preparation is needed. Share those details so the sequence can be assessed."],
  ["Can damaged boards be repaired or matched?", "Sometimes, but an exact match depends on the product, colour, batch, age and whether replacement boards are still available. Send photos and any product details before assuming a match is possible."],
  ["What information helps with a flooring quote?", "Include the suburb, approximate area, current floor, preferred product or material, access details, timing and whether you need supply-only, preparation or installation. Photos or plans are useful when available."],
  ["Is a site assessment always required?", "Not every first enquiry needs one. Photos, plans and measurements can help with an initial review, but site conditions may need to be checked before product quantities, preparation and installation scope are finalised."],
  ["How should new flooring be maintained?", "Use the care guidance supplied for the selected product, clean spills promptly and avoid unsuitable cleaners or excessive moisture. Confirm the current manufacturer care instructions before use."],
  ["Can flooring be installed during a larger renovation?", "Yes, but sequencing matters. Wet trades, painting, cabinetry, floor preparation, delivery access and protection of the finished floor should be coordinated before the installation date."],
  ["Can I request a colour sample before ordering?", "Ask about a current sample or showroom viewing when you enquire. Screen colours can vary, and stock, batch and appearance should be confirmed before an order is finalised."],
  ["Can existing flooring be removed as part of the project?", "Removal and stripping can be discussed with the installation enquiry. The existing material, adhesive, disposal access and condition of the exposed subfloor can affect the scope."],
  ["Can you help with apartment flooring?", "Apartment work may be possible, but strata rules, acoustic requirements, lift access, delivery times and approved underlay or installation systems should be confirmed early."],
  ["What happens if the selected colour is discontinued?", "The team can check current stock and discuss alternatives, but a different colour or range should not be presented as an exact replacement. Samples and current specifications should be reviewed before changing products."],
];

const faqMarkup = faqItems.map(([question, answer], index) =>
  `<div class="faq-item"${index === 0 ? " open" : ""}><button type="button">${question}</button><p>${answer}</p></div>`,
).join("");
const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "@id": "https://oztimberfloor.com.au/faqs/#faq",
  mainEntity: faqItems.map(([question, answer]) => ({
    "@type": "Question",
    name: question,
    acceptedAnswer: { "@type": "Answer", text: answer },
  })),
};

let faq = read("faqs/index.html");
faq = faq.replace(/<script id="faq-coverage-schema" type="application\/ld\+json">[\s\S]*?<\/script>/, "");
faq = replaceOnce(
  faq,
  /<div class="faq-list">[\s\S]*?<\/div><\/div><\/section><section class="section"><div class="shell cta">/,
  `<div class="faq-list">${faqMarkup}</div></div></section><section class="section"><div class="shell cta">`,
  "FAQ list",
);
faq = faq.replace(
  '<img src="/assets/images/hero/sydney-timber-flooring-contractor.jpg" alt="Timber flooring installed by Oz Timber Floor in Sydney">',
  '<img src="/assets/images/hero/sydney-timber-flooring-contractor.jpg" alt="Timber flooring installed by Oz Timber Floor in Sydney" width="1600" height="1200" loading="eager" fetchpriority="high" decoding="async" data-lcp-image>',
);
faq = replaceOnce(
  faq,
  /<\/head>/,
  `<script id="faq-coverage-schema" type="application/ld+json">${escapeJson(faqSchema)}</script></head>`,
  "FAQ schema insertion",
);
write("faqs/index.html", faq);
write("faqs.html", faq);

const installFaqItems = [
  ["What types of flooring can Oz Timber Floor install?", "Oz can discuss engineered timber, solid timber, hybrid, laminate, vinyl and related preparation services depending on site conditions and product availability."],
  ["Should the floor be level before installation?", "The subfloor should be checked before installation. Required preparation depends on the flooring option, tolerance, substrate and existing floor condition."],
  ["Can you install flooring in apartments?", "Apartment projects may be possible, but acoustic requirements, lift access, strata rules, working hours and underlay specifications should be confirmed early."],
  ["Can I request supply-only instead of installation?", "Yes. Oz supports supply-only enquiries, stock checks and supply and installation enquiries. Include the product range, quantity and suburb when you contact the team."],
  ["What should be ready before installation day?", "Confirm access, furniture movement, other trades, power, parking or lift arrangements, the removal scope and where the flooring will be stored. Requirements vary by product and site."],
  ["How is installation timing confirmed?", "Timing is reviewed after the product, area, access, removal work and subfloor preparation are understood. Levelling, moisture concerns or staged work can change the sequence."],
  ["Can old boards be matched during a repair?", "An exact match may not be possible because products, colours and batches change. Send photos and any product or purchase details so availability and realistic repair options can be reviewed."],
  ["What should I include in an installation enquiry?", "Send the suburb, approximate area, current floor, preferred product, access details, timing, photos or plans, and whether removal or floor preparation may be needed."],
];
const installFaqMarkup = installFaqItems.map(([question, answer]) =>
  `<article class="faq-item"><button type="button">${question}</button><p>${answer}</p></article>`,
).join("");

const preparationSection = `<section class="section"><div class="shell"><div class="section-head"><div><p class="eyebrow">Project sequence</p><h2>Prepare the property and installation sequence</h2></div><p>Installation timing becomes clearer when access, removal, preparation and other renovation work are discussed together.</p></div><div class="grid-4"><article class="category-card"><strong>Before the site review</strong><p>Share measurements, photos or plans, the current floor, preferred product and any known access or strata conditions.</p></article><article class="category-card"><strong>Before flooring arrives</strong><p>Confirm stock, batch, delivery access, storage needs and the latest product-specific installation requirements.</p></article><article class="category-card"><strong>Before work starts</strong><p>Coordinate furniture, removal, wet trades, painting, cabinetry and any floor levelling so the new floor is installed in the right sequence.</p></article><article class="category-card"><strong>Before handover</strong><p>Review trims, transitions, doors, stairs and protection of the finished floor while remaining work is completed.</p></article></div></div></section><section class="section soft"><div class="shell"><div class="section-head"><div><p class="eyebrow">Assessment and quote</p><h2>What happens after you enquire</h2></div><p>The first response depends on how much product and site information is available.</p></div><div class="process-steps"><article class="process-step"><span class="insight-label">1</span><h3>Send the project details</h3><p>Provide the suburb, approximate area, product preference, current floor, access, timing and photos or plans if available.</p></article><article class="process-step"><span class="insight-label">2</span><h3>Review product and site needs</h3><p>The product, quantity, removal work, subfloor condition and installation method are considered together.</p></article><article class="process-step"><span class="insight-label">3</span><h3>Confirm what must be inspected</h3><p>An initial review may be possible from supplied details, while some projects need site conditions checked before the scope is final.</p></article><article class="process-step"><span class="insight-label">4</span><h3>Agree the next step</h3><p>Confirm supply-only, preparation or installation requirements without treating an alternative product as an exact match.</p></article></div></div></section>`;

let install = read("timber-floor-installation/index.html");
install = replaceOnce(
  install,
  /<section class="section"><div class="shell"><div class="section-head"><div><p class="eyebrow">Related pages<\/p>/,
  `${preparationSection}<section class="section"><div class="shell"><div class="section-head"><div><p class="eyebrow">Related pages</p>`,
  "installation preparation sections",
);
install = replaceOnce(
  install,
  /<div class="faq-list">[\s\S]*?<\/div><\/div><\/section><section class="section"><div class="shell cta">/,
  `<div class="faq-list">${installFaqMarkup}</div></div></section><section class="section"><div class="shell cta">`,
  "installation FAQ list",
);
const installSchemaMatch = install.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
if (!installSchemaMatch) throw new Error("Missing installation schema");
const installSchema = JSON.parse(installSchemaMatch[1]);
const installFaqSchema = installSchema["@graph"].find((entry) => entry["@type"] === "FAQPage");
if (!installFaqSchema) throw new Error("Missing installation FAQ schema node");
installFaqSchema.mainEntity = installFaqItems.map(([question, answer]) => ({
  "@type": "Question",
  name: question,
  acceptedAnswer: { "@type": "Answer", text: answer },
}));
install = install.replace(installSchemaMatch[0], `<script type="application/ld+json">${escapeJson(installSchema)}</script>`);
write("timber-floor-installation/index.html", install);
write("timber-floor-installation.html", install);

const engineered = read("engineered-timber-flooring/index.html");
const siteHeader = engineered.match(/<header class="site-header">[\s\S]*?<\/header>/)?.[0];
const siteFooter = engineered.match(/<footer class="site-footer">[\s\S]*?<\/footer>/)?.[0];
if (!siteHeader || !siteFooter) throw new Error("Could not reuse site chrome for oak page");

const oakFaqItems = [
  ["Is oak flooring available as engineered and solid timber?", "Oak flooring can be available in different constructions and ranges. Compare the current engineered and solid timber options, then confirm the exact product specification before ordering."],
  ["What should be checked before installing oak flooring?", "Check the subfloor, moisture conditions, board direction, installation method, expansion details, transitions and site access before the installation scope is finalised."],
  ["Can an existing oak floor be colour-matched?", "An exact match is not guaranteed because species appearance, finish, age and production batches vary. Samples and the existing floor should be reviewed before selecting a replacement."],
  ["How should oak flooring be maintained?", "Follow the care guidance for the selected finish, remove grit, clean spills promptly and avoid unsuitable cleaners or excessive moisture. Confirm the current manufacturer instructions for the exact product."],
];
const oakDescription = "Oak flooring Sydney supply and installation guidance covering engineered and solid oak options, preparation, finishing, maintenance and product enquiries.";
const oakSchema = {
  "@context": "https://schema.org",
  "@graph": [
    { "@type": "LocalBusiness", "@id": "https://oztimberfloor.com.au/#business", name: "Oz Timber Floor", url: "https://oztimberfloor.com.au/", areaServed: { "@type": "City", name: "Sydney" }, description: "Sydney timber flooring supplier, installer, builder flooring contractor and floor preparation specialist." },
    { "@type": "WebPage", "@id": "https://oztimberfloor.com.au/oak-flooring-sydney/#webpage", url: "https://oztimberfloor.com.au/oak-flooring-sydney/", name: "Oak Flooring Sydney | Supply & Installation", description: oakDescription, isPartOf: { "@type": "WebSite", "@id": "https://oztimberfloor.com.au/#website", name: "Oz Timber Floor", url: "https://oztimberfloor.com.au/" }, about: { "@id": "https://oztimberfloor.com.au/#business" } },
    { "@type": "Service", "@id": "https://oztimberfloor.com.au/oak-flooring-sydney/#service", name: "Oak flooring supply and installation in Sydney", description: oakDescription, provider: { "@id": "https://oztimberfloor.com.au/#business" }, areaServed: { "@type": "City", name: "Sydney" }, url: "https://oztimberfloor.com.au/oak-flooring-sydney/" },
    { "@type": "BreadcrumbList", itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://oztimberfloor.com.au/" },
      { "@type": "ListItem", position: 2, name: "Products", item: "https://oztimberfloor.com.au/products/" },
      { "@type": "ListItem", position: 3, name: "Oak flooring Sydney", item: "https://oztimberfloor.com.au/oak-flooring-sydney/" },
    ] },
    { "@type": "FAQPage", "@id": "https://oztimberfloor.com.au/oak-flooring-sydney/#faq", mainEntity: oakFaqItems.map(([question, answer]) => ({ "@type": "Question", name: question, acceptedAnswer: { "@type": "Answer", text: answer } })) },
  ],
};
const oakFaqMarkup = oakFaqItems.map(([question, answer]) => `<article class="faq-item"><button type="button">${question}</button><p>${answer}</p></article>`).join("");

const oak = `<!DOCTYPE html>
<html lang="en-AU"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Oak Flooring Sydney | Supply &amp; Installation</title><meta name="description" content="${oakDescription}"><link rel="canonical" href="https://oztimberfloor.com.au/oak-flooring-sydney/"><link rel="icon" href="/assets/brand/favicon-32.png" sizes="32x32" type="image/png"><link rel="apple-touch-icon" href="/assets/brand/apple-touch-icon.png"><meta name="robots" content="index,follow"><meta property="og:type" content="website"><meta property="og:title" content="Oak Flooring Sydney | Supply &amp; Installation"><meta property="og:description" content="${oakDescription}"><meta property="og:url" content="https://oztimberfloor.com.au/oak-flooring-sydney/"><link rel="stylesheet" href="/assets/site.css"><script src="/assets/contact-config.js" defer></script><script src="/assets/site.js" defer></script><script type="application/ld+json">${escapeJson(oakSchema)}</script></head><body>${siteHeader}<main><section class="hero"><div class="shell hero-grid"><div><p class="eyebrow">Oak flooring Sydney</p><h1>Oak flooring supply and installation in Sydney</h1><p class="lead">Compare oak flooring options, check current colours and specifications, and plan supply, floor preparation and installation around the actual site.</p><div class="button-row"><a class="button" href="/contact/?enquiry=supply-install&amp;source=oak-flooring-sydney&amp;topic=oak-flooring">Request oak flooring quote</a><a class="button-secondary" href="/engineered-timber-flooring/">Browse engineered timber</a></div></div><div class="hero-media"><img src="/assets/products/engineered/etf-14mm-oak-flooring/natural-oak.jpg" alt="Natural oak engineered timber flooring colour" width="500" height="500" loading="eager" fetchpriority="high" decoding="async" data-lcp-image><div class="hero-badge"><span>Oak options</span><span>Supply</span><span>Install</span></div></div></div></section><section class="section soft"><div class="shell"><div class="section-head"><div><p class="eyebrow">Choose the right construction</p><h2>Engineered and solid oak pathways</h2></div><p>Oak describes the timber appearance or species, while the board construction, finish and installation method still need to be confirmed for the chosen product.</p></div><div class="grid-3"><a class="card link-card" href="/engineered-timber-flooring/"><h3>Engineered oak flooring</h3><p>Compare current engineered timber ranges where oak colours and constructions are available.</p><span class="card-arrow" aria-hidden="true">→</span></a><a class="card link-card" href="/solid-timber/"><h3>Solid timber flooring</h3><p>Review traditional timber options and confirm whether a current solid oak product suits the project.</p><span class="card-arrow" aria-hidden="true">→</span></a><a class="card link-card" href="/ranges/"><h3>Browse current ranges</h3><p>Check current ranges and ask about colour samples, stock, batch and the latest product details.</p><span class="card-arrow" aria-hidden="true">→</span></a></div></div></section><section class="section"><div class="shell"><div class="section-head"><div><p class="eyebrow">Product and site fit</p><h2>What to confirm before choosing oak flooring</h2></div><p>A colour name alone does not establish an exact match. Review the construction, dimensions, finish, batch and site requirements together.</p></div><div class="caution-grid"><article class="caution-card"><span class="insight-label">Product</span><h3>Construction and dimensions</h3><p>Confirm whether the product is engineered or solid timber, plus the board thickness, width, length mix and installation method.</p></article><article class="caution-card"><span class="insight-label">Colour</span><h3>Samples and batch variation</h3><p>Natural timber and finishes vary. Review a current sample and confirm available stock before relying on website colour alone.</p></article><article class="caution-card"><span class="insight-label">Prepare</span><h3>Subfloor and moisture</h3><p>Check flatness, stability, moisture conditions, removal work and transitions before installation is scheduled.</p></article><article class="caution-card"><span class="insight-label">Finish</span><h3>Care and finishing details</h3><p>Confirm the supplied finish, current care guidance, trims and protection requirements for the selected product.</p></article></div></div></section><section class="section soft"><div class="shell"><div class="section-head"><div><p class="eyebrow">Installation planning</p><h2>Plan supply, preparation and installation together</h2></div><p>Oak flooring enquiries are clearer when product selection and site conditions are considered before the work date is fixed.</p></div><div class="process-steps"><article class="process-step"><span class="insight-label">1</span><h3>Send the project details</h3><p>Share the suburb, approximate area, current floor, preferred oak look, access and timing.</p></article><article class="process-step"><span class="insight-label">2</span><h3>Confirm a current product</h3><p>Review available ranges, construction, samples, stock, batch and the latest specifications.</p></article><article class="process-step"><span class="insight-label">3</span><h3>Check preparation</h3><p>Assess removal, subfloor flatness, moisture, stairs, trims and adjoining floor levels.</p></article><article class="process-step"><span class="insight-label">4</span><h3>Confirm the next step</h3><p>Proceed with the appropriate supply-only, preparation or supply and installation pathway.</p></article></div></div></section><section class="section" id="faq"><div class="shell"><div class="section-head"><div><p class="eyebrow">FAQ</p><h2>Oak flooring questions</h2></div><p>Use these answers to prepare a more accurate product or installation enquiry.</p></div><div class="faq-list">${oakFaqMarkup}</div></div></section><section class="section soft"><div class="shell cta"><p class="eyebrow">Talk to Oz Timber Floor</p><h2>Planning oak flooring for a Sydney property?</h2><p>Send the area, suburb, current floor, preferred look and whether you need supply-only, preparation or installation.</p><div class="button-row"><a class="button-light" href="/contact/?enquiry=supply-install&amp;source=oak-flooring-sydney&amp;topic=oak-flooring">Request oak flooring quote</a><a class="button-light" href="/contact/?enquiry=supply-only&amp;source=oak-flooring-sydney&amp;topic=oak-flooring">Request supply price</a><a class="button-light" href="/floor-levelling/">Check floor preparation</a></div></div></section></main>${siteFooter}</body></html>
`;
write("oak-flooring-sydney/index.html", oak);
write("oak-flooring-sydney.html", oak);

let engineeredUpdated = engineered;
if (!engineeredUpdated.includes('href="/oak-flooring-sydney/"')) {
  const oakLinkSection = `<section class="section"><div class="shell"><div class="section-head"><div><p class="eyebrow">Oak flooring</p><h2>Looking specifically for oak flooring?</h2></div><p>The dedicated oak flooring page covers engineered and solid oak pathways, samples, preparation, finishing and maintenance considerations without treating every oak-named product as equivalent.</p></div><div class="button-row"><a class="button" href="/oak-flooring-sydney/">Explore oak flooring Sydney</a><a class="button-secondary" href="/contact/?enquiry=supply-install&amp;source=engineered-timber-flooring&amp;topic=oak-flooring">Ask about oak supply + install</a></div></div></section>`;
  engineeredUpdated = replaceOnce(engineeredUpdated, /<\/main><footer class="site-footer">/, `${oakLinkSection}</main><footer class="site-footer">`, "engineered oak internal link");
}
write("engineered-timber-flooring/index.html", engineeredUpdated);
write("engineered-timber-flooring.html", engineeredUpdated);

let redirects = read("_redirects");
redirects = replaceOnce(
  redirects,
  /^\/oak-flooring-sydney\/ \/engineered-timber-flooring\/ 301$/m,
  "/oak-flooring-sydney.html /oak-flooring-sydney/ 301!\n/oak-flooring-sydney/index.html /oak-flooring-sydney/ 301!\n/oak-flooring-sydney/ /oak-flooring-sydney.html 200!",
  "oak routing owner",
);
write("_redirects", redirects);

let sitemap = read("sitemap.xml");
if (!sitemap.includes("https://oztimberfloor.com.au/oak-flooring-sydney/")) {
  sitemap = replaceOnce(
    sitemap,
    /  <url>\n    <loc>https:\/\/oztimberfloor\.com\.au\/privacy\/<\/loc>/,
    "  <url>\n    <loc>https://oztimberfloor.com.au/oak-flooring-sydney/</loc>\n    <changefreq>weekly</changefreq>\n    <priority>0.85</priority>\n  </url>\n  <url>\n    <loc>https://oztimberfloor.com.au/privacy/</loc>",
    "oak sitemap entry",
  );
}
write("sitemap.xml", sitemap);

let packageScript = read("scripts/build-public-package.mjs");
if (!packageScript.includes('  "oak-flooring-sydney",')) {
  packageScript = replaceOnce(packageScript, /  "office-flooring-sydney",\n/, '  "office-flooring-sydney",\n  "oak-flooring-sydney",\n', "oak package directory");
}
write("scripts/build-public-package.mjs", packageScript);

process.stdout.write("OCTOBER 26 CUTOVER REPAIRS APPLIED faq=15 installation-faq=8 oak-owner=/oak-flooring-sydney/ sitemap+1\n");
