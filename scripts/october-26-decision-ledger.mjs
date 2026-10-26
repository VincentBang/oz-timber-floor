#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const auditRoot = "/Users/daibang/Documents/Codex/2026-10-26/referenced-chatgpt-conversation-this-is-an/outputs";
const outputDir = path.join(root, "docs/release/cutover-readiness-2026-10-26");

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    if (quoted) {
      if (character === '"' && text[index + 1] === '"') {
        field += '"';
        index += 1;
      } else if (character === '"') quoted = false;
      else field += character;
    } else if (character === '"') quoted = true;
    else if (character === ",") {
      row.push(field);
      field = "";
    } else if (character === "\n") {
      row.push(field.replace(/\r$/, ""));
      if (row.some((value) => value !== "")) rows.push(row);
      row = [];
      field = "";
    } else field += character;
  }
  if (field || row.length) {
    row.push(field.replace(/\r$/, ""));
    rows.push(row);
  }
  const [headers, ...records] = rows;
  return records.map((values) => Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""])));
}

function csvEscape(value) {
  const string = String(value ?? "");
  return /[",\n\r]/.test(string) ? `"${string.replaceAll('"', '""')}"` : string;
}

function writeCsv(filePath, rows) {
  const headers = Object.keys(rows[0]);
  const contents = [headers.join(","), ...rows.map((row) => headers.map((header) => csvEscape(row[header])).join(","))].join("\n") + "\n";
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, contents);
}

function pathname(url) {
  try { return new URL(url).pathname; } catch { return url; }
}

function slugFromPath(route) {
  const segments = route.split("/").filter(Boolean);
  return segments.at(-1) || "";
}

function evidenceSummary(raw) {
  if (!raw) return "No row in supplied exports; unknown, not zero.";
  try {
    const records = JSON.parse(raw);
    if (!records.length) return "No row in supplied exports; unknown, not zero.";
    return records.map((record) => {
      const metrics = [
        record.clicks !== undefined ? `clicks=${record.clicks}` : "",
        record.impressions !== undefined ? `impressions=${record.impressions}` : "",
        record.sessions !== undefined ? `sessions=${record.sessions}` : "",
        record.key_events !== undefined ? `key_events=${record.key_events}` : "",
        record.historical_average_position !== undefined ? `historical_position=${record.historical_average_position}` : "",
      ].filter(Boolean).join(";");
      const period = Array.isArray(record.period) ? ` period=${record.period.join(" to ")}` : "";
      return `${record.source}: ${record.kind}${period}${metrics ? `; ${metrics}` : ""}`;
    }).join(" | ") + " | Dated evidence only; overlapping periods are not summed and historical position is not current ranking.";
  } catch {
    return `${raw} | Dated evidence only; filters and overlapping periods must be respected.`;
  }
}

const broadRows = parseCsv(fs.readFileSync(path.join(auditRoot, "broad-product-mappings.csv"), "utf8"));
const noindexRows = parseCsv(fs.readFileSync(path.join(auditRoot, "linked-noindex-pages.csv"), "utf8"));
const historicalRows = parseCsv(fs.readFileSync(path.join(root, "docs/migration-october-2026-followup/private/migration-url-review.csv"), "utf8"));
const historicalByUrl = new Map(historicalRows.map((row) => [row.legacy_url, row]));
const backlinkRows = parseCsv(fs.readFileSync(path.join(root, "docs/seo-migration/source/https___oztimberfloor.com.au_-Top target pages-2026-05-18.csv"), "utf8"));
const backlinkByUrl = new Map(backlinkRows.map((row) => [row[Object.keys(row)[0]], row[Object.keys(row)[1]]]));
const catalogue = JSON.parse(fs.readFileSync(path.join(root, "data/product-catalogue.json"), "utf8"));
const products = Array.isArray(catalogue.products) ? catalogue.products : [];
const productBySlug = new Map(products.map((product) => [product.slug || product.id, product]));
const overrides = JSON.parse(fs.readFileSync(path.join(root, "data/catalogue-quality-overrides.json"), "utf8")).pages || {};

function productForUrl(url) {
  return productBySlug.get(slugFromPath(pathname(url)));
}

function materialIntent(product, destination) {
  if (product?.category) return product.category;
  const route = pathname(destination).toLowerCase();
  if (route.includes("laminate")) return "Laminate";
  if (route.includes("hybrid")) return "Hybrid";
  if (route.includes("engineered")) return "Engineered timber";
  if (route.includes("solid")) return "Solid timber";
  if (route.includes("vinyl")) return "Vinyl";
  if (route.includes("hardwood")) return "Hardwood/timber alternatives";
  return "Unknown; review source page intent";
}

function backlinkEvidence(url) {
  const count = backlinkByUrl.get(url);
  return count
    ? `2026-05-18 Search Console top-target-page export row=${count}; export does not identify linking-page URLs.`
    : "No exact row in the supplied 2026-05-18 top-target-page export; backlink demand remains unknown, not zero.";
}

function supplierEvidence(product) {
  if (!product) return "No exact current catalogue record matched; supplier identity and current availability unresolved.";
  const sources = [product.supplierSourceUrl, product.sourceUrl].filter(Boolean);
  const note = product.catalogueNote || product.retirementBasis || "";
  if (sources.length || note) return `${sources.length ? `Recorded source: ${[...new Set(sources)].join("; ")}. ` : ""}${note || "Current-source review still required."}`;
  return "Catalogue record exists, but no exact current supplier source is recorded.";
}

function identity(product) {
  if (!product) return "Unverified legacy product identity";
  return [product.name, product.range, product.colour, product.totalThickness || product.thickness].filter(Boolean).join(" | ");
}

function currentDecisionForBroad(row) {
  const route = pathname(row.legacy_url);
  const slug = slugFromPath(route);
  const product = productBySlug.get(slug);
  const retired = product?.publicCatalogueStatus === "retired";
  const priority = {
    "kronoswiss-aquastop-natural-oak-brown-8mm": "Owner confirmed discontinued on 2026-10-08; current Aquastop range is an alternatives page, not an exact substitute.",
    "kronoswiss-aquastop-interlaken": "Owner confirmed discontinued on 2026-10-08; WordPress title identifies 12mm, and the current range is alternatives only.",
    "stone-floor-oak-beige": "Owner confirmed discontinued on 2026-10-08 after absence from the current supplier list; general Stone Floor range is alternatives only.",
    "etf-hybrid-spc-9mm-helena-oak": "Owner confirmed Helena Oak belongs to ETF 9mm, but exact current supplier evidence and a verified colour image remain missing.",
  }[slug];
  const historical = historicalByUrl.get(row.legacy_url);
  const ownerPath = pathname(row.replacement_destination);
  const decision = retired ? "SUPPORTED_CONSERVATIVE_RETIREMENT" : "NEEDS_SPECIFIC_EVIDENCE";
  return {
    cohort: "legacy-broad-destination",
    url: row.legacy_url,
    current_destination: row.replacement_destination,
    material_intent: materialIntent(product, row.replacement_destination),
    manufacturer_or_range_intent: product?.range || product?.brand || "Infer from legacy slug/source page; not independently verified",
    colour_intent: product?.colour || slug.replaceAll("-", " "),
    thickness_intent: product?.totalThickness || product?.thickness || "Unknown; do not infer from neighbouring colours",
    current_product_identity: identity(product),
    supplier_or_business_evidence: supplierEvidence(product),
    dated_gsc_ga4_evidence: evidenceSummary(historical?.ga4_search_console_evidence),
    backlink_target_evidence: backlinkEvidence(row.legacy_url),
    existing_approval_or_retirement: retired ? `${product.retirementDate || "date recorded in catalogue"}: ${product.retirementBasis || product.catalogueNote}` : (priority || "No exact retirement or equivalence approval located."),
    recommended_final_owner: ownerPath,
    http_treatment: "301 direct to owner; no chain",
    canonical: ownerPath,
    indexing_status: "Indexable destination; exact held/retired record remains outside sitemap",
    evidence_confidence: retired ? "High for retirement; medium for alternatives-family destination" : (priority ? "Medium for family identity; low for exact current-product publication" : "Low until exact supplier/business/search/backlink evidence is reviewed"),
    unresolved_information: retired ? "No exact substitute claimed; monitor dated landing/query demand after cutover." : (priority || "Current availability, exact identity/equivalence, current landing demand and target-specific backlinks."),
    decision,
  };
}

function currentDecisionForNoindex(row) {
  const route = pathname(row.canonical || row.url);
  const product = productForUrl(route);
  const override = overrides[route];
  const retired = product?.publicCatalogueStatus === "retired";
  const historical = historicalByUrl.get(`https://oztimberfloor.com.au${route}`);
  const decision = retired ? "RETAIN_RETIRED_NOINDEX" : "RETAIN_QUALITY_HOLD_PENDING_EVIDENCE";
  return {
    cohort: "linked-individual-noindex",
    url: `https://oztimberfloor.com.au${route}`,
    current_destination: `https://oztimberfloor.com.au${route}`,
    material_intent: materialIntent(product, route),
    manufacturer_or_range_intent: product?.range || product?.brand || "Current record needs source review",
    colour_intent: product?.colour || slugFromPath(route).replaceAll("-", " "),
    thickness_intent: product?.totalThickness || product?.thickness || "Unknown; do not infer",
    current_product_identity: identity(product),
    supplier_or_business_evidence: supplierEvidence(product),
    dated_gsc_ga4_evidence: evidenceSummary(historical?.ga4_search_console_evidence),
    backlink_target_evidence: backlinkEvidence(`https://oztimberfloor.com.au${route}`),
    existing_approval_or_retirement: retired
      ? `${product.retirementDate || "date recorded in catalogue"}: ${product.retirementBasis || product.catalogueNote}`
      : `${override?.reason || "Existing controlled noindex hold; no blanket release approval."}${override?.replacementRoute ? ` Candidate parent owner: ${override.replacementRoute}.` : ""}`,
    recommended_final_owner: retired ? (override?.replacementRoute || (product?.rangeSlug ? `/ranges/${product.rangeSlug}/` : route)) : (override?.replacementRoute || route),
    http_treatment: retired && override?.directRedirect ? "301 to approved owner" : "200 while held; consolidate only after exact duplicate/owner evidence",
    canonical: route,
    indexing_status: retired ? "noindex,follow; outside sitemap" : "noindex,follow quality hold; outside sitemap",
    evidence_confidence: retired ? "High for retirement; destination relevance separately constrained" : "Medium for hold; low for indexation until quality and demand evidence are complete",
    unresolved_information: retired ? "No exact substitute claimed." : "Exact current supplier record, verified imagery/specifications, duplicate ownership, current landing/query demand and target-specific backlinks.",
    decision,
  };
}

const priorityMappings = [
  ["kronoswiss-aquastop-natural-oak-brown-8mm", "/ranges/kronoswiss-aquastop/", "8 mm (legacy product identity; retired)"],
  ["kronoswiss-aquastop-interlaken", "/ranges/kronoswiss-aquastop/", "12 mm (current WordPress title; retired)"],
  ["stone-floor-oak-beige", "/ranges/stone-floor/", "Unknown; do not infer from other Stone Floor colours"],
  ["etf-hybrid-spc-9mm-helena-oak", "/ranges/etf-9-0mm-hybrid/", "9 mm (owner-confirmed range identity; exact current record unresolved)"],
].map(([slug, destination, reviewedThickness]) => {
  const legacyUrl = `https://oztimberfloor.com.au/product/${slug}/`;
  const product = productBySlug.get(slug);
  const historical = historicalByUrl.get(legacyUrl);
  const retired = product?.publicCatalogueStatus === "retired";
  const exactReason = retired
    ? `${product.retirementDate || "2026-10-08"}: ${product.retirementBasis || product.catalogueNote}`
    : "Owner confirmed Helena Oak belongs to ETF 9mm, but the exact current supplier record and verified colour image remain unresolved.";
  return {
    cohort: "priority-family-mapping",
    url: legacyUrl,
    current_destination: `https://oztimberfloor.com.au${destination}`,
    material_intent: materialIntent(product, destination),
    manufacturer_or_range_intent: product?.range || product?.brand || "Unresolved",
    colour_intent: product?.colour || slug.replaceAll("-", " "),
    thickness_intent: product?.totalThickness || product?.thickness || reviewedThickness,
    current_product_identity: identity(product),
    supplier_or_business_evidence: supplierEvidence(product),
    dated_gsc_ga4_evidence: evidenceSummary(historical?.ga4_search_console_evidence),
    backlink_target_evidence: backlinkEvidence(legacyUrl),
    existing_approval_or_retirement: exactReason,
    recommended_final_owner: destination,
    http_treatment: "301 direct to family owner; alternatives are not represented as an exact substitute",
    canonical: destination,
    indexing_status: "Indexable range owner; exact catalogue record remains noindex and outside sitemap",
    evidence_confidence: retired ? "High for retirement; medium for the alternatives-family owner" : "Medium for family identity; low for exact current-product publication",
    unresolved_information: retired ? "No exact substitute claimed; monitor dated product-intent demand after cutover." : "Current supplier URL, verified Helena Oak colour image, complete current specifications and stock/availability evidence.",
    decision: retired ? "SUPPORTED_CONSERVATIVE_RETIREMENT" : "NEEDS_SPECIFIC_EVIDENCE",
  };
});

const ledger = [...priorityMappings, ...broadRows.map(currentDecisionForBroad), ...noindexRows.map(currentDecisionForNoindex)];
const seen = new Set();
for (const row of ledger) {
  const key = `${row.cohort}|${row.url}`;
  if (seen.has(key)) throw new Error(`Duplicate ledger key: ${key}`);
  seen.add(key);
}
if (broadRows.length !== 204) throw new Error(`Expected 204 broad mappings, found ${broadRows.length}`);
if (noindexRows.length !== 330) throw new Error(`Expected 330 linked noindex pages, found ${noindexRows.length}`);
if (ledger.length !== 538) throw new Error(`Expected 538 ledger rows, found ${ledger.length}`);

writeCsv(path.join(outputDir, "URL_DECISION_LEDGER.csv"), ledger);
const summary = {
  generatedAt: new Date().toISOString(),
  inputs: {
    auditDate: "2026-10-26",
    priorityFamilyMappings: 4,
    broadMappings: 204,
    linkedNoindexPages: 330,
    historicalSearchAndAnalyticsEvidence: "Supplied exports through 2026-10-07; filters retained in row text; overlapping periods not summed",
    backlinkEvidence: "Search Console top target pages export dated 2026-05-18; no linking-page-to-target export supplied",
  },
  outputRows: ledger.length,
  decisions: Object.fromEntries([...new Set(ledger.map((row) => row.decision))].sort().map((decision) => [decision, ledger.filter((row) => row.decision === decision).length])),
  cautions: [
    "Absence from any supplied export is unknown, not zero demand.",
    "Historical average position is not current ranking.",
    "A working redirect does not prove semantic equivalence.",
    "No bulk noindex removal is approved.",
  ],
};
fs.writeFileSync(path.join(outputDir, "URL_DECISION_LEDGER_SUMMARY.json"), `${JSON.stringify(summary, null, 2)}\n`);
process.stdout.write(`URL DECISION LEDGER PASS broad=${broadRows.length} linkedNoindex=${noindexRows.length} total=${ledger.length}\n`);
