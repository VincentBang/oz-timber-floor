#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createPublicationInventory } from "./publication-inventory.mjs";
import { artisanRetirementIssues } from "./approved-artisan-retirement-check.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const domain = "https://oztimberfloor.com.au";
const generatedDir = process.env.OZ_MIGRATION_GENERATED_DIR
  ? path.resolve(process.env.OZ_MIGRATION_GENERATED_DIR)
  : path.join(root, "docs/release/OZ-RELEASE-CLOSEOUT/generated/migration");
const equityPath = path.join(generatedDir, "gsc-equity-map-2026-09-01.csv");
const expectations = JSON.parse(fs.readFileSync(path.join(root, "data", "seo-migration-redirect-expectations.json"), "utf8"));
const ownership = JSON.parse(fs.readFileSync(path.join(root, "data", "seo-keyword-ownership.json"), "utf8"));
const catalogueQuality = JSON.parse(fs.readFileSync(path.join(generatedDir, "catalogue-quality-report.json"), "utf8"));
const rawCatalogue = JSON.parse(fs.readFileSync(path.join(root, "data", "product-catalogue.json"), "utf8"));
const inventory = createPublicationInventory({ root, domain });

function normalizeRoute(value) {
  const url = new URL(String(value || ""), domain);
  let route = url.pathname.replace(/\\/g, "/").replace(/\/+/g, "/");
  if (route === "/index.html") return "/";
  if (route.endsWith("/index.html")) route = route.slice(0, -"index.html".length);
  if (route.endsWith(".html")) route = `${route.slice(0, -".html".length)}/`;
  if (!path.extname(route) && !route.endsWith("/")) route += "/";
  return route;
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let value = "";
  let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    if (quoted) {
      if (character === '"' && text[index + 1] === '"') {
        value += '"';
        index += 1;
      } else if (character === '"') quoted = false;
      else value += character;
    } else if (character === '"') quoted = true;
    else if (character === ",") {
      row.push(value);
      value = "";
    } else if (character === "\n") {
      row.push(value.replace(/\r$/, ""));
      rows.push(row);
      row = [];
      value = "";
    } else value += character;
  }
  if (value || row.length) {
    row.push(value);
    rows.push(row);
  }
  const [headers, ...data] = rows;
  return data.filter((fields) => fields.some(Boolean)).map((fields) => Object.fromEntries(headers.map((header, index) => [header, fields[index] || ""])));
}

function redirectRules() {
  const rules = [];
  fs.readFileSync(path.join(root, "_redirects"), "utf8").split(/\r?\n/).forEach((raw, index) => {
    const line = raw.trim();
    if (!line || line.startsWith("#")) return;
    const [source, destination, statusText = "301"] = line.split(/\s+/);
    const status = Number.parseInt(statusText, 10);
    rules.push({ line: index + 1, source: normalizeRoute(source), destination: normalizeRoute(destination), status, statusText, raw });
  });
  return rules;
}

const rules = redirectRules();
const rulesBySource = new Map();
for (const rule of rules) {
  const items = rulesBySource.get(rule.source) || [];
  items.push(rule);
  rulesBySource.set(rule.source, items);
}

const publicationRoutes = new Set(inventory.publicationRoutes);
const sitemapRoutes = new Set(inventory.sitemapRoutes);
const noindexRoutes = new Set(inventory.noindexRoutes);
const redirectOnlyRoutes = new Set(inventory.redirectOnlyRoutes);
const reviewedBySource = new Map(expectations.reviewedRedirects.map((item) => [normalizeRoute(item.source), item]));
const categoryRoutes = new Map([
  ["hybrid", "/hybrid/"],
  ["laminate", "/laminate/"],
  ["engineered timber", "/engineered-timber-flooring/"],
  ["solid timber", "/solid-timber/"],
  ["vinyl", "/vinyl/"],
]);

function recordSlug(record, prefix) {
  const raw = record.url || record.slug || record.id || "";
  const recordRoute = normalizeRoute(raw || "/");
  if (recordRoute.startsWith(prefix)) return recordRoute.replace(/^\//, "").split("/").filter(Boolean).at(-1) || "";
  return String(record.slug || record.id || "").replace(/^\/+|\/+$/g, "").split("/").at(-1) || "";
}

function groupedBySlug(records, prefix) {
  const grouped = new Map();
  for (const record of records) {
    const slug = recordSlug(record, prefix);
    if (!slug) continue;
    const members = grouped.get(slug) || [];
    members.push(record);
    grouped.set(slug, members);
  }
  return grouped;
}

const productsBySlug = groupedBySlug(rawCatalogue.products, "/products/");
const rangesBySlug = groupedBySlug(rawCatalogue.ranges, "/ranges/");

function redirectRuleFor(routeValue) {
  const candidates = rulesBySource.get(normalizeRoute(routeValue)) || [];
  return candidates.length === 1 && candidates[0].status >= 300 && candidates[0].status < 400
    ? candidates[0]
    : null;
}

function resolveRedirect(routeValue) {
  let current = normalizeRoute(routeValue);
  const visited = new Set();
  while (!visited.has(current)) {
    visited.add(current);
    const rule = redirectRuleFor(current);
    if (!rule) return { route: current, chain: [...visited], loop: false };
    current = rule.destination;
  }
  return { route: current, chain: [...visited, current], loop: true };
}

function isIndexablePublication(routeValue) {
  const route = normalizeRoute(routeValue);
  return publicationRoutes.has(route)
    && sitemapRoutes.has(route)
    && !noindexRoutes.has(route)
    && !redirectOnlyRoutes.has(route);
}

function directIndexableRange(rangeSlug) {
  const slug = String(rangeSlug || "").replace(/^\/+|\/+$/g, "").split("/").at(-1) || "";
  if (!slug || !rangesBySlug.has(slug)) return "";
  const rangeRoute = `/ranges/${slug}/`;
  if (isIndexablePublication(rangeRoute)) return rangeRoute;
  const resolution = resolveRedirect(rangeRoute);
  return !resolution.loop && resolution.route.startsWith("/ranges/") && isIndexablePublication(resolution.route)
    ? resolution.route
    : "";
}

function exactRangeCandidates(rangeSlug) {
  const slug = String(rangeSlug || "").replace(/^\/+|\/+$/g, "").split("/").at(-1) || "";
  const sourceRecords = rangesBySlug.get(slug) || [];
  const candidates = new Set();
  for (const sourceRecord of sourceRecords) {
    const sourceCategory = String(sourceRecord.category || "").toLowerCase();
    const preferred = String(sourceRecord.preferredRangeSlug || "").trim();
    const alternativeSlugs = [
      slug,
      ...(preferred && !/\s|\//.test(preferred) ? [preferred] : []),
      String(sourceRecord.canonicalSlug || "").trim(),
    ].filter(Boolean);
    for (const candidateSlug of new Set(alternativeSlugs)) {
      const targetRecords = rangesBySlug.get(candidateSlug) || [];
      const targetCategories = new Set(targetRecords.map((record) => String(record.category || "").toLowerCase()).filter(Boolean));
      if (sourceCategory && targetCategories.size && !targetCategories.has(sourceCategory)) continue;
      const candidate = directIndexableRange(candidateSlug);
      if (candidate) candidates.add(candidate);
    }
  }
  return [...candidates].sort();
}

function reviewedCandidate(source) {
  const reviewed = reviewedBySource.get(source);
  if (!reviewed) return null;
  return {
    route: normalizeRoute(reviewed.target),
    semanticMatch: reviewed.semanticMatch,
    basis: reviewed.semanticMatch === "retired" ? "reviewed-retirement" : "reviewed-fallback",
  };
}

function independentProductCandidate(sourceValue) {
  const source = normalizeRoute(sourceValue);
  const match = source.match(/^\/product\/([^/]+)\/$/);
  if (!match) return null;
  const reviewed = reviewedCandidate(source);
  if (reviewed?.semanticMatch === "retired") return reviewed;
  const slug = match[1];
  const exactProduct = `/products/${slug}/`;
  if (isIndexablePublication(exactProduct)) {
    return { route: exactProduct, semanticMatch: "exact-product", basis: "exact-indexable-product" };
  }

  const exactResolution = resolveRedirect(exactProduct);
  if (!exactResolution.loop && exactResolution.route.startsWith("/products/") && isIndexablePublication(exactResolution.route)) {
    return { route: exactResolution.route, semanticMatch: "exact-product", basis: "exact-product-alias" };
  }

  if (reviewed?.semanticMatch === "exact-product" && isIndexablePublication(reviewed.route)) {
    return { ...reviewed, basis: "reviewed-exact-product" };
  }

  const records = productsBySlug.get(slug) || [];
  const parentCandidates = new Set(records.flatMap((record) => exactRangeCandidates(record.rangeSlug)));
  if (parentCandidates.size > 1) {
    return { ambiguous: true, routes: [...parentCandidates].sort(), semanticMatch: "exact-range", basis: "ambiguous-catalogue-parent-ranges" };
  }
  if (parentCandidates.size === 1) {
    return { route: [...parentCandidates][0], semanticMatch: "exact-range", basis: "catalogue-record-parent-range" };
  }

  if (reviewed) return reviewed;

  const categories = new Set(records.map((record) => String(record.category || "").toLowerCase()).filter(Boolean));
  if (categories.size > 1) {
    return { ambiguous: true, routes: [...categories].sort(), semanticMatch: "generic-category", basis: "ambiguous-catalogue-categories" };
  }
  if (categories.size === 1) {
    const category = categoryRoutes.get([...categories][0]) || "";
    if (category && isIndexablePublication(category)) {
      return { route: category, semanticMatch: "generic-category", basis: "catalogue-record-category" };
    }
  }
  return null;
}

function independentRangeCandidate(sourceValue) {
  const source = normalizeRoute(sourceValue);
  const match = source.match(/^\/product-category\/(?:[^/]+\/)*([^/]+)\/$/);
  if (!match) return null;
  const reviewed = reviewedCandidate(source);
  if (reviewed?.semanticMatch === "retired") return reviewed;
  const exactRanges = exactRangeCandidates(match[1]);
  if (exactRanges.length > 1) {
    return { ambiguous: true, routes: exactRanges, semanticMatch: "exact-range", basis: "ambiguous-range-aliases" };
  }
  if (exactRanges.length === 1) return { route: exactRanges[0], semanticMatch: "exact-range", basis: "exact-range-alias" };
  return reviewed;
}

const rewrites = new Map(rules.filter((rule) => rule.status === 200 && !/[*:]/.test(rule.source)).map((rule) => [rule.source, rule.destination]));

function fileForRoute(routeValue) {
  const route = normalizeRoute(routeValue);
  const rewrite = rewrites.get(route);
  const candidates = [];
  if (rewrite) candidates.push(path.join(root, rewrite.replace(/^\//, "").replace(/\/$/, ".html")));
  if (route === "/") candidates.push(path.join(root, "index.html"));
  else {
    const clean = route.replace(/^\//, "").replace(/\/$/, "");
    candidates.push(path.join(root, clean, "index.html"), path.join(root, `${clean}.html`));
  }
  return candidates.find((candidate) => fs.existsSync(candidate)) || null;
}

function pageText(route) {
  const file = fileForRoute(route);
  return file ? fs.readFileSync(file, "utf8") : "";
}

function stripTags(value) {
  return String(value || "").replace(/<[^>]*>/g, " ").replace(/&amp;/gi, "&").replace(/\s+/g, " ").trim();
}

function metadata(route) {
  const html = pageText(route);
  return {
    title: stripTags(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]),
    h1: stripTags(html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1]),
    description: stripTags(html.match(/<meta\b[^>]*name=["']description["'][^>]*content=["']([^"']*)/i)?.[1]),
    html,
  };
}

const blockers = [];
const qualityFindings = [];
const keywordFindings = [];
const supplierOverlap = [];
const independentCatalogueCandidates = [];
const seenEquitySources = new Set();

for (const expected of expectations.reviewedRedirects) {
  const source = normalizeRoute(expected.source);
  const target = normalizeRoute(expected.target);
  const sourceRules = rulesBySource.get(source) || [];
  if (sourceRules.length !== 1) {
    blockers.push({ code: "reviewed-redirect-rule-count", source, expected: 1, actual: sourceRules.length });
    continue;
  }
  const rule = sourceRules[0];
  if (rule.status !== 301) blockers.push({ code: "reviewed-redirect-not-301", source, status: rule.statusText });
  if (rule.destination !== target) blockers.push({ code: "reviewed-redirect-target-changed", source, expected: target, actual: rule.destination });
  const targetRedirects = (rulesBySource.get(target) || []).filter((candidate) => candidate.status >= 300 && candidate.status < 400);
  if (targetRedirects.length) blockers.push({ code: "reviewed-target-redirected", source, target, rules: targetRedirects.map((item) => item.raw) });
  if (!inventory.publicationRoutes.includes(target)) blockers.push({ code: "reviewed-target-not-indexable-publication", source, target });
  if (!inventory.sitemapRoutes.includes(target)) blockers.push({ code: "reviewed-target-missing-from-sitemap", source, target });
  if (inventory.noindexRoutes.includes(target)) blockers.push({ code: "reviewed-target-noindex", source, target });
}

if (!fs.existsSync(equityPath)) {
  blockers.push({ code: "gsc-equity-map-missing", file: path.relative(root, equityPath) });
} else {
  const equity = parseCsv(fs.readFileSync(equityPath, "utf8"));
  if (equity.length !== 130) blockers.push({ code: "gsc-equity-coverage-changed", expected: 130, actual: equity.length });
  for (const row of equity) {
    const source = normalizeRoute(row.old_path);
    if (seenEquitySources.has(source)) continue;
    seenEquitySources.add(source);
    const sourceRules = rulesBySource.get(source) || [];
    if (sourceRules.length > 1) {
      blockers.push({ code: "gsc-source-conflicting-rules", source, rules: sourceRules.map((item) => item.raw) });
      continue;
    }
    const sourceRule = sourceRules[0] || null;
    const retirementIssues = artisanRetirementIssues({source,rule:sourceRule,
      approvalBytes:fs.readFileSync(path.join(root,'config/artisan-oak-retirement.json')),
      range:rawCatalogue.ranges.find(r=>r.id==='artisan-oak'),
      html:pageText('/ranges/artisan-oak/'),
      sitemapRoutes:inventory.sitemapRoutes,publicationRoutes:inventory.publicationRoutes});
    if(retirementIssues!==null){
      for(const code of retirementIssues)blockers.push({code,source});
      continue;
    }
    const directTarget = sourceRule && sourceRule.status >= 300 && sourceRule.status < 400
      ? sourceRule.destination
      : source;
    if (sourceRule && sourceRule.status >= 300 && sourceRule.status < 400) {
      const targetRedirects = (rulesBySource.get(directTarget) || []).filter((candidate) => candidate.status >= 300 && candidate.status < 400);
      if (targetRedirects.length) blockers.push({ code: "gsc-target-redirect-chain", source, target: directTarget, rules: targetRedirects.map((item) => item.raw) });
    }
    if (!isIndexablePublication(directTarget)) {
      blockers.push({ code: "gsc-target-not-indexable", source, target: directTarget });
    }
    const csvTarget = normalizeRoute(row.current_redirect_target || row.old_path);
    if (csvTarget !== directTarget) {
      blockers.push({ code: "gsc-equity-map-stale-target", source, csvTarget, actualTarget: directTarget });
    }

    const independent = independentProductCandidate(source) || independentRangeCandidate(source);
    if (!independent) continue;
    if (independent.ambiguous) {
      blockers.push({ code: "ambiguous-semantic-candidate", source, candidates: independent.routes, basis: independent.basis });
      continue;
    }
    independentCatalogueCandidates.push({
      source,
      currentTarget: directTarget,
      candidate: independent.route,
      semanticMatch: independent.semanticMatch,
      basis: independent.basis,
      reviewed: reviewedBySource.has(source),
    });
    if (directTarget !== independent.route) {
      blockers.push({
        code: independent.semanticMatch === "exact-product"
          ? "high-equity-exact-product-collapsed"
          : independent.semanticMatch === "exact-range"
            ? "high-equity-exact-range-collapsed"
            : "high-equity-category-family-mismatch",
        source,
        current: directTarget,
        expected: independent.route,
        basis: independent.basis,
      });
    }
  }
}

const publicationMetadata = new Map(inventory.publicationRoutes.map((route) => [route, metadata(route)]));
for (const owner of ownership.owners) {
  const ownerRoute = normalizeRoute(owner.owner);
  const ownerMeta = publicationMetadata.get(ownerRoute);
  if (!ownerMeta) {
    blockers.push({ code: "keyword-owner-not-indexable", cluster: owner.cluster, owner: ownerRoute });
    continue;
  }
  const primary = owner.primaryPhrase.toLowerCase();
  const ownerClaim = `${ownerMeta.title} ${ownerMeta.h1}`.toLowerCase();
  if (!ownerClaim.includes(primary)) blockers.push({ code: "keyword-owner-missing-primary-phrase", cluster: owner.cluster, owner: ownerRoute, phrase: owner.primaryPhrase });
  const collisions = [];
  for (const [candidateRoute, candidate] of publicationMetadata) {
    if (candidateRoute === ownerRoute || candidateRoute.startsWith("/products/") || candidateRoute.startsWith("/ranges/")) continue;
    const claim = `${candidate.title} ${candidate.h1}`.toLowerCase();
    if (!claim.includes(primary)) continue;
    if (ownerRoute === "/") {
      const qualifiedBroadIntent = new RegExp(`(?:engineered|solid|hardwood|hybrid|laminate|vinyl|commercial)\\s+${primary.replace(/\s+/g, "\\s+")}`, "i");
      if (qualifiedBroadIntent.test(claim)) continue;
    }
    collisions.push(candidateRoute);
  }
  keywordFindings.push({ cluster: owner.cluster, owner: ownerRoute, primaryPhrase: owner.primaryPhrase, collisions });
  if (collisions.length) blockers.push({ code: "keyword-primary-intent-collision", cluster: owner.cluster, owner: ownerRoute, collisions });
}

const inboundRoutes = new Set();
for (const [, page] of publicationMetadata) {
  for (const match of page.html.matchAll(/\bhref\s*=\s*(["'])([\s\S]*?)\1/gi)) {
    const href = match[2];
    if (!href || /^(?:mailto:|tel:|javascript:|#|https?:\/\/(?!oztimberfloor\.com\.au))/i.test(href)) continue;
    inboundRoutes.add(normalizeRoute(href));
  }
}

for (const page of catalogueQuality.pages.filter((item) => item.classification === "indexable")) {
  const html = fs.readFileSync(path.join(root, page.file), "utf8");
  const issues = [];
  if (/Image to confirm/i.test(html)) issues.push("image-to-confirm");
  if ((html.match(/Confirm product details before order/gi) || []).length >= 2) issues.push("repeated-placeholder-specs");
  const title = stripTags(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]);
  const h1 = stripTags(html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1]);
  if (/\b([A-Za-z][A-Za-z0-9-]{2,})\s+\1\b/i.test(`${title} ${h1}`)) issues.push("duplicated-name-token");
  if (/"@type"\s*:\s*"Offer"|"availability"\s*:|"price"\s*:/i.test(html)) issues.push("unsupported-offer-or-stock-schema");
  if (!inboundRoutes.has(normalizeRoute(page.route))) issues.push("no-internal-catalogue-path");
  if (issues.length) qualityFindings.push({ route: page.route, file: page.file, issues });
}

for (const pair of ownership.supplierPairs) {
  const category = normalizeRoute(pair.category);
  const supplier = normalizeRoute(pair.supplier);
  const categoryMeta = metadata(category);
  const supplierMeta = metadata(supplier);
  const categoryPhrase = stripTags(categoryMeta.h1).toLowerCase();
  const supplierClaim = `${supplierMeta.title} ${supplierMeta.h1}`.toLowerCase();
  const collision = Boolean(categoryPhrase && supplierClaim.includes(categoryPhrase));
  const distinctSignals = ["stock", "batch", "quantity", "pickup", "delivery", "lead time", "supply-only", "supply price"]
    .filter((signal) => supplierMeta.html.toLowerCase().includes(signal));
  const status = collision || distinctSignals.length < 3 ? "manual-review" : "differentiated";
  supplierOverlap.push({ category, supplier, collision, distinctSignals, status });
}

const summary = {
  reviewedRedirects: expectations.reviewedRedirects.length,
  equityRows: fs.existsSync(equityPath) ? parseCsv(fs.readFileSync(equityPath, "utf8")).length : 0,
  independentlyDerivedCatalogueCandidates: independentCatalogueCandidates.length,
  independentlyDerivedExactProducts: independentCatalogueCandidates.filter((item) => item.semanticMatch === "exact-product").length,
  independentlyDerivedParentRanges: independentCatalogueCandidates.filter((item) => item.semanticMatch === "exact-range").length,
  independentlyDerivedCategoryFallbacks: independentCatalogueCandidates.filter((item) => !["exact-product", "exact-range"].includes(item.semanticMatch)).length,
  keywordClusters: ownership.owners.length,
  keywordCollisions: keywordFindings.reduce((count, item) => count + item.collisions.length, 0),
  indexableCatalogueQualityFindings: qualityFindings.length,
  supplierPairs: supplierOverlap.length,
  supplierPairsNeedingReview: supplierOverlap.filter((item) => item.status !== "differentiated").length,
  blockers: blockers.length,
};
const report = { generatedAt: new Date().toISOString(), summary, blockers, independentCatalogueCandidates, keywordFindings, supplierOverlap, qualityFindings };
fs.writeFileSync(path.join(generatedDir, "seo-migration-hardening-report.json"), `${JSON.stringify(report, null, 2)}\n`);
fs.writeFileSync(path.join(generatedDir, "seo-migration-hardening-report.md"), [
  "# SEO migration hardening report",
  "",
  `Generated: ${report.generatedAt}`,
  "",
  `- Reviewed semantic redirect contracts: ${summary.reviewedRedirects}`,
  `- GSC equity decisions: ${summary.equityRows}`,
  `- Independently derived catalogue candidates: ${summary.independentlyDerivedCatalogueCandidates} (${summary.independentlyDerivedExactProducts} exact products, ${summary.independentlyDerivedParentRanges} parent ranges, ${summary.independentlyDerivedCategoryFallbacks} reviewed/category fallbacks)`,
  `- Priority keyword clusters: ${summary.keywordClusters}`,
  `- Primary title/H1 intent collisions: ${summary.keywordCollisions}`,
  `- Indexable catalogue pages flagged for controlled quality review: ${summary.indexableCatalogueQualityFindings}`,
  `- Category/supplier pairs needing manual overlap review: ${summary.supplierPairsNeedingReview} of ${summary.supplierPairs}`,
  `- Blocking failures: ${summary.blockers}`,
  "",
  "Catalogue quality findings are deliberately reported for controlled review rather than converted into bulk noindex rules. Redirect destinations and current publication URLs make a page-count-driven quarantine unsafe.",
  "",
].join("\n"));

if (blockers.length) {
  process.stderr.write(`SEO migration hardening FAIL: ${blockers.length} blocker(s). See docs/seo-migration/generated/seo-migration-hardening-report.json.\n`);
  process.exitCode = 1;
} else {
  process.stdout.write(`SEO migration hardening PASS: ${summary.reviewedRedirects} semantic redirects, ${summary.equityRows} GSC decisions and ${summary.keywordClusters} keyword owners verified; ${summary.indexableCatalogueQualityFindings} catalogue page(s) remain in controlled quality review.\n`);
}
