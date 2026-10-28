import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { releaseBuildContract } from "./release-build-contract.mjs";
import {
  createPublicationInventory,
  intentionalNoindexUtilityRoutes,
} from "./publication-inventory.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const domain = "https://oztimberfloor.com.au";
const args = new Set(process.argv.slice(2));
const applyCatalogueOnly = args.has("--apply-catalogue-only");
const allowExternal = args.has("--allow-external");
const generatedDir = process.env.OZ_MIGRATION_GENERATED_DIR
  ? path.resolve(process.env.OZ_MIGRATION_GENERATED_DIR)
  : path.join(root, "docs/release/OZ-RELEASE-CLOSEOUT/generated/migration");
const sitemapPath = process.env.OZ_MIGRATION_SITEMAP_PATH
  ? path.resolve(process.env.OZ_MIGRATION_SITEMAP_PATH)
  : path.join(root, "sitemap.xml");
const ignoredDirectories = new Set([".git", "dist", "node_modules", ".netlify", "docs", "migration", "config"]);
const categoryNames = new Set(["hybrid", "laminate", "engineered timber", "solid timber", "vinyl"]);

function toPosix(value) {
  return value.split(path.sep).join("/");
}

function ensureDirectory(directory) {
  fs.mkdirSync(directory, { recursive: true });
}

function writeText(filePath, content) {
  ensureDirectory(path.dirname(filePath));
  fs.writeFileSync(filePath, content);
}

function walkFiles(directory, matcher, found = []) {
  if (!fs.existsSync(directory)) return found;
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (entry.name.startsWith(".")) {
      if (entry.name !== ".well-known") continue;
    }
    const filePath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      if (!ignoredDirectories.has(entry.name)) walkFiles(filePath, matcher, found);
    } else if (matcher(filePath)) {
      found.push(filePath);
    }
  }
  return found;
}

function text(value = "") {
  return String(value)
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function attribute(tag, name) {
  const match = String(tag).match(new RegExp(`\\b${escapeRegex(name)}\\s*=\\s*(["'])([\\s\\S]*?)\\1`, "i"));
  return match ? text(match[2]) : "";
}

function allTags(html, tagName) {
  return String(html).match(new RegExp(`<${tagName}\\b[^>]*>`, "gi")) || [];
}

function metaContent(html, name) {
  const target = String(name).toLowerCase();
  for (const tag of allTags(html, "meta")) {
    if (attribute(tag, "name").toLowerCase() === target || attribute(tag, "property").toLowerCase() === target) {
      return attribute(tag, "content");
    }
  }
  return "";
}

function canonicalFromHtml(html) {
  for (const tag of allTags(html, "link")) {
    if (attribute(tag, "rel").toLowerCase() === "canonical") return attribute(tag, "href");
  }
  return "";
}

function h1sFromHtml(html) {
  return [...String(html).matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/gi)].map((match) => text(match[1]));
}

function schemaScripts(html) {
  const scripts = [];
  const expression = /(<script\b[^>]*type\s*=\s*(["'])application\/ld\+json\2[^>]*>)([\s\S]*?)(<\/script>)/gi;
  for (const match of String(html).matchAll(expression)) {
    const raw = match[0];
    const open = match[1];
    const body = match[3];
    const close = match[4];
    try {
      scripts.push({ raw, open, body, close, value: JSON.parse(body), error: null });
    } catch (error) {
      scripts.push({ raw, open, body, close, value: null, error: error.message });
    }
  }
  return scripts;
}

function flattenSchema(value, results = []) {
  if (Array.isArray(value)) {
    value.forEach((item) => flattenSchema(item, results));
  } else if (value && typeof value === "object") {
    results.push(value);
    if (Array.isArray(value["@graph"])) flattenSchema(value["@graph"], results);
  }
  return results;
}

function routeFromUrl(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  let pathname = raw;
  try {
    pathname = new URL(raw, domain).pathname;
  } catch {
    pathname = raw.split(/[?#]/)[0];
  }
  pathname = pathname.replace(/\\/g, "/").replace(/\/+/g, "/");
  if (!pathname.startsWith("/")) pathname = `/${pathname}`;
  if (pathname === "/index.html") return "/";
  if (pathname.endsWith("/index.html")) pathname = pathname.slice(0, -"index.html".length);
  if (pathname.endsWith(".html")) pathname = `${pathname.slice(0, -".html".length)}/`;
  if (!path.extname(pathname) && !pathname.endsWith("/")) pathname += "/";
  return pathname;
}

function urlForFile(filePath) {
  const relative = toPosix(path.relative(root, filePath));
  if (relative === "index.html") return "/";
  if (relative.endsWith("/index.html")) return `/${relative.slice(0, -"index.html".length)}`;
  if (relative.endsWith(".html")) return `/${relative.slice(0, -".html".length)}/`;
  return `/${relative}`;
}

function fileForRoute(route) {
  const cleanRoute = routeFromUrl(route);
  if (!cleanRoute) return "";
  if (cleanRoute === "/") return path.join(root, "index.html");
  const relative = cleanRoute.replace(/^\//, "").replace(/\/$/, "");
  if (path.extname(relative)) {
    const direct = path.join(root, relative);
    return fs.existsSync(direct) ? direct : "";
  }
  const candidates = [
    path.join(root, relative, "index.html"),
    path.join(root, `${relative}.html`),
  ];
  return candidates.find((candidate) => fs.existsSync(candidate)) || "";
}

function isLocalAsset(source) {
  return source && !/^(?:https?:|data:|mailto:|tel:|#|javascript:)/i.test(source);
}

function localAssetExists(source, pageFile) {
  if (!isLocalAsset(source)) return true;
  const clean = source.split(/[?#]/)[0];
  if (!clean) return true;
  const location = clean.startsWith("/")
    ? path.join(root, clean.slice(1))
    : path.resolve(path.dirname(pageFile), clean);
  return fs.existsSync(location);
}

function imageSources(html) {
  return allTags(html, "img").map((tag) => attribute(tag, "src")).filter(Boolean);
}

function pageRobots(html) {
  return metaContent(html, "robots").toLowerCase().replace(/\s+/g, "");
}

function pageHasNoindex(html) {
  return /(?:^|,)noindex(?:,|$)/.test(pageRobots(html));
}

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(root, relativePath), "utf8"));
}

function catalogueKey(value, kind) {
  let key = routeFromUrl(value || "");
  const prefix = kind === "product" ? "/products/" : "/ranges/";
  if (key.startsWith(prefix)) key = key.slice(prefix.length);
  return key.replace(/^\/+|\/+$/g, "").toLowerCase();
}

function makeRecordIndex(records, kind) {
  const index = new Map();
  const duplicates = [];
  for (const record of records) {
    const keys = new Set([record.id, record.slug, record.url]
      .map((value) => catalogueKey(value, kind))
      .filter(Boolean));
    for (const key of keys) {
      if (index.has(key) && index.get(key) !== record) duplicates.push({ key, first: index.get(key).id || index.get(key).name, duplicate: record.id || record.name });
      else index.set(key, record);
    }
  }
  return { index, duplicates };
}

function catalogueFiles(kind) {
  const directory = path.join(root, kind === "product" ? "products" : "ranges");
  return walkFiles(directory, (filePath) => path.basename(filePath) === "index.html")
    .filter((filePath) => path.dirname(filePath) !== directory)
    .sort();
}

function specValues(html) {
  const values = new Map();
  const expression = /<div\b[^>]*class\s*=\s*(["'])[^"']*\bspec-item\b[^"']*\1[^>]*>[\s\S]*?<span\b[^>]*>([\s\S]*?)<\/span>[\s\S]*?<strong\b[^>]*>([\s\S]*?)<\/strong>[\s\S]*?<\/div>/gi;
  for (const match of String(html).matchAll(expression)) {
    const label = text(match[2]).toLowerCase();
    const value = text(match[3]);
    if (label) values.set(label, value);
  }
  return values;
}

function valueIsPlaceholder(value) {
  return /^(?:confirm product details before order|product range|to be confirmed|tbc|n\/a|na|unknown|not available)$/i.test(String(value || "").trim());
}

function validDimension(value) {
  const cleaned = String(value || "").trim();
  if (!cleaned || /^(?:refer to|confirm|available on request|see selected)/i.test(cleaned)) return true;
  return /\d/.test(cleaned) && /(?:mm|cm|m\b|x|×)/i.test(cleaned);
}

function schemaProductIssues(html) {
  const issues = [];
  for (const script of schemaScripts(html)) {
    if (script.error) continue;
    for (const item of flattenSchema(script.value)) {
      const types = Array.isArray(item["@type"]) ? item["@type"] : [item["@type"]];
      if (!types.map((type) => String(type).toLowerCase()).includes("product")) continue;
      if (!text(item.name)) issues.push("product-schema-missing-name");
      if (!text(item.description)) issues.push("product-schema-missing-description");
      if (!item.image || (Array.isArray(item.image) && !item.image.length)) issues.push("product-schema-missing-image");
      if (!text(item.url)) issues.push("product-schema-missing-url");
      const values = flattenSchema(item.additionalProperty || []).map((property) => property.value).filter(Boolean);
      if (values.some(valueIsPlaceholder)) issues.push("product-schema-placeholder-value");
    }
  }
  return [...new Set(issues)];
}

function removeProductSchema(html) {
  return String(html).replace(/(<script\b[^>]*type\s*=\s*(["'])application\/ld\+json\2[^>]*>)([\s\S]*?)(<\/script>)/gi, (whole, open, _quote, body, close) => {
    if (!/@type\s*["']?\s*:\s*["']?Product/i.test(body)) return whole;
    try {
      const original = JSON.parse(body);
      const prune = (value) => {
        if (Array.isArray(value)) return value.map(prune).filter((item) => item !== null);
        if (!value || typeof value !== "object") return value;
        const types = Array.isArray(value["@type"]) ? value["@type"] : [value["@type"]];
        if (types.map((type) => String(type).toLowerCase()).includes("product")) return null;
        const result = { ...value };
        if (Array.isArray(result["@graph"])) result["@graph"] = result["@graph"].map(prune).filter((item) => item !== null);
        return result;
      };
      const pruned = prune(original);
      if (pruned === null || (Array.isArray(pruned) && pruned.length === 0) || (pruned && Array.isArray(pruned["@graph"]) && pruned["@graph"].length === 0)) return "";
      return `${open}${JSON.stringify(pruned)}${close}`;
    } catch {
      return "";
    }
  });
}

function setRobots(html, robots) {
  const replacement = `<meta name="robots" content="${robots}">`;
  if (/<meta\b[^>]*\bname\s*=\s*(["'])robots\1[^>]*>/i.test(html)) {
    return html.replace(/<meta\b[^>]*\bname\s*=\s*(["'])robots\1[^>]*>/i, replacement);
  }
  return html.replace(/<\/head>/i, `${replacement}</head>`);
}

function identityKey(record) {
  return [record.range || record.rangeName || "", record.name || record.colour || ""]
    .map((value) => text(value).toLowerCase().replace(/[^a-z0-9]+/g, " ").trim())
    .join("|");
}

function catalogueAnalysis() {
  const catalogue = readJson("data/product-catalogue.json");
  const overridesPath = path.join(root, "data", "catalogue-quality-overrides.json");
  const overrides = fs.existsSync(overridesPath) ? JSON.parse(fs.readFileSync(overridesPath, "utf8")) : { pages: {} };
  const productRecords = catalogue.products || [];
  const rangeRecords = catalogue.ranges || [];
  const supplierTerms = new Set([...productRecords, ...rangeRecords]
    .map((record) => record.supplier)
    .map((value) => text(value))
    .filter((value) => value.length >= 4 && !/^oz timber floor$/i.test(value)));
  const productIndex = makeRecordIndex(productRecords, "product");
  const rangeIndex = makeRecordIndex(rangeRecords, "range");
  const identities = new Map();
  for (const record of productRecords) {
    const key = identityKey(record);
    if (!key || key === "|") continue;
    const list = identities.get(key) || [];
    list.push(record);
    identities.set(key, list);
  }
  const pages = [];

  for (const kind of ["product", "range"]) {
    const recordIndex = kind === "product" ? productIndex.index : rangeIndex.index;
    for (const file of catalogueFiles(kind)) {
      const html = fs.readFileSync(file, "utf8");
      const route = urlForFile(file);
      const override = overrides.pages?.[route] || null;
      const key = catalogueKey(route, kind);
      const record = recordIndex.get(key);
      const specs = specValues(html);
      const issues = [];
      const add = (code, severity = "HIGH") => issues.push({ code, severity });
      const h1 = h1sFromHtml(html)[0] || "";
      const canonical = canonicalFromHtml(html);
      const images = imageSources(html);
      const category = text(record?.category || specs.get("category") || "");
      const range = text(record?.range || record?.rangeName || specs.get("range") || "");
      const thickness = text(record?.thickness || specs.get("thickness") || "");
      const boardSize = text(record?.boardSize || record?.plankSize || specs.get("board size") || "");

      if (!h1) add("missing-product-name", "BLOCKER");
      if (!canonical) add("missing-canonical", "BLOCKER");
      if (!images.length) add("missing-image", "BLOCKER");
      if (images.some((source) => !localAssetExists(source, file))) add("broken-local-image", "BLOCKER");

      let classification = "indexable";
      if (!record) {
        classification = "manual-review";
        add("missing-source-record", "HIGH");
      }

      const publicStatus = String(record?.publicCatalogueStatus || record?.status || "").toLowerCase();
      const dataStatus = String(record?.dataCompletenessStatus || "").toLowerCase();
      if (publicStatus === "legacy-hidden" || publicStatus === "legacy-alias" || record?.visibleInRangeLibrary === false) {
        classification = "redirect-only";
        add("legacy-or-alias-range", "INFORMATIONAL");
      }
      if (kind === "product" && (dataStatus === "legacy-hidden" || publicStatus === "retired")) {
        classification = "retired";
        add("retired-product", "INFORMATIONAL");
      }

      if (kind === "product") {
        if (!range) add("missing-range-relationship", "BLOCKER");
        if (!category) add("missing-category", "BLOCKER");
        if (!thickness || valueIsPlaceholder(thickness)) add("empty-or-placeholder-thickness", "HIGH");
        if (category && thickness && categoryNames.has(thickness.toLowerCase())) add("category-used-as-thickness", "BLOCKER");
        if (!validDimension(boardSize)) add("invalid-board-dimensions", "HIGH");
        for (const issue of schemaProductIssues(html)) add(issue, "HIGH");
        if (record && identities.get(identityKey(record))?.length > 1) add("duplicate-product-identity", "HIGH");

        const body = text(html);
        const leakedSupplier = [...supplierTerms].find((supplier) => new RegExp(`\\b${escapeRegex(supplier)}\\b`, "i").test(body));
        if (leakedSupplier) add("public-supplier-name", "HIGH");
        const unsupportedClaim = /\b(?:100%\s+waterproof|commercial[-\s]rated|certified\s+(?:to|for)|lifetime\s+warranty)\b/i.test(body);
        const supportedClaimData = [record?.waterResistance, record?.commercialSuitability, record?.warrantySummary]
          .some((value) => text(value) && !valueIsPlaceholder(value));
        if (unsupportedClaim && !supportedClaimData) add("claim-requires-source-confirmation", "MEDIUM");
      } else {
        const body = text(html);
        const leakedSupplier = [...supplierTerms].find((supplier) => new RegExp(`\\b${escapeRegex(supplier)}\\b`, "i").test(body));
        if (leakedSupplier) add("public-supplier-name", "HIGH");
        if (!category) add("missing-category", "HIGH");
        if (record?.preferredRangeSlug && record.preferredRangeSlug !== record.slug) {
          classification = "redirect-only";
          add("range-alias", "INFORMATIONAL");
        }
      }

      if (issues.some((issue) => ["BLOCKER", "HIGH"].includes(issue.severity)) && classification === "indexable") {
        classification = issues.some((issue) => issue.code === "missing-source-record" || issue.code === "duplicate-product-identity" || issue.code === "claim-requires-source-confirmation")
          ? "manual-review"
          : "needs-data";
      }
      if (override?.classification) classification = override.classification;

      pages.push({
        type: kind,
        route,
        file: toPosix(path.relative(root, file)),
        classification,
        sourceRecord: record ? (record.id || record.slug || record.name) : null,
        canonical,
        h1,
        category,
        range,
        thickness,
        boardSize,
        hasProductSchema: schemaProductIssues(html).length > 0 || /"@type"\s*:\s*"Product"/i.test(html),
        currentRobots: pageRobots(html),
        indexationControl: {
          applyNoindex: Boolean(override?.applyNoindex),
          reason: override?.reason || "",
        },
        issues: [...new Map(issues.map((issue) => [issue.code, issue])).values()],
      });
    }
  }

  const byClassification = {};
  const byFailure = {};
  for (const page of pages) {
    byClassification[page.classification] = (byClassification[page.classification] || 0) + 1;
    for (const issue of page.issues) byFailure[issue.code] = (byFailure[issue.code] || 0) + 1;
  }

  return {
    generatedAt: new Date().toISOString(),
    totals: {
      cataloguePages: pages.length,
      productPages: pages.filter((page) => page.type === "product").length,
      rangePages: pages.filter((page) => page.type === "range").length,
      byClassification,
      byFailure,
      sourceRecords: { products: productRecords.length, ranges: rangeRecords.length },
      duplicateSourceKeys: { products: productIndex.duplicates, ranges: rangeIndex.duplicates },
      approvedIndexationOverrides: Object.keys(overrides.pages || {}).length,
    },
    pages,
  };
}

function sitemapEntries(filePath) {
  const xml = fs.readFileSync(filePath, "utf8");
  const entries = [];
  for (const match of xml.matchAll(/<url(?:\s[^>]*)?>[\s\S]*?<\/url>/gi)) {
    const block = match[0];
    const loc = text((block.match(/<loc>([\s\S]*?)<\/loc>/i) || [])[1] || "");
    entries.push({ block, loc, route: routeFromUrl(loc) });
  }
  return { xml, entries };
}

function updateSitemapForQuarantine(quarantinedRoutes) {
  const filePath = path.join(root, "sitemap.xml");
  const { xml, entries } = sitemapEntries(filePath);
  const noindexRoutes = new Set(quarantinedRoutes);
  for (const entry of entries) {
    const file = fileForRoute(entry.route);
    if (file && pageHasNoindex(fs.readFileSync(file, "utf8"))) noindexRoutes.add(entry.route);
  }
  let next = xml;
  for (const entry of entries) {
    if (noindexRoutes.has(entry.route)) next = next.replace(entry.block, "");
  }
  next = next.replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n");
  if (next !== xml) fs.writeFileSync(filePath, next);
  return { removed: entries.filter((entry) => noindexRoutes.has(entry.route)).map((entry) => entry.loc), noindexRoutes };
}

function catalogueMarkdown(analysis, applied) {
  const classifications = Object.entries(analysis.totals.byClassification).sort(([a], [b]) => a.localeCompare(b));
  const failures = Object.entries(analysis.totals.byFailure).sort(([, a], [, b]) => b - a);
  const classifiedNonIndexable = analysis.pages.filter((page) => page.classification !== "indexable");
  const indexable = analysis.pages.filter((page) => page.classification === "indexable");
  const currentlyNoindex = analysis.pages.filter((page) => /(?:^|,)\s*noindex\b/i.test(page.currentRobots)).length;
  return [
    "# Catalogue quality report",
    "",
    `Generated: ${analysis.generatedAt}`,
    "",
    "This report is generated from the current static product/range pages and `data/product-catalogue.json`. It does not invent specifications. The report identifies every non-indexable classification; only explicit, reviewable entries in `data/catalogue-quality-overrides.json` receive automatic noindex/schema/sitemap changes. This prevents an unreviewed bulk noindex from breaking legacy redirect equity.",
    "",
    "## Classification totals",
    "",
    "| Classification | Pages |",
    "| --- | ---: |",
    ...classifications.map(([classification, count]) => `| ${classification} | ${count} |`),
    "",
    "## Failure totals",
    "",
    "| Failure | Pages |",
    "| --- | ---: |",
    ...failures.map(([failure, count]) => `| ${failure} | ${count} |`),
    "",
    "## URL lists",
    "",
    `- Indexable catalogue pages: ${indexable.length}. Full machine-readable list: \`catalogue-quality-report.json\` under \`pages\` with \`classification: "indexable"\`.`,
    `- Pages classified as non-indexable pending remediation: ${classifiedNonIndexable.length}. Full machine-readable list: \`catalogue-quality-report.json\` under \`pages\` where \`classification\` is not \`indexable\`. This is a review queue, not a claim that all of those URLs have already been noindexed.`,
    `- Pages currently protected with \`noindex,follow\`: ${currentlyNoindex}. Those pages have also been removed from the main sitemap.`,
    applied ? `- Applied approved indexation controls to ${applied.pageChanges} page(s) and excluded ${applied.sitemapRemovals} URL(s) from the main sitemap.` : "- Report-only mode: no page or sitemap changes were made.",
    "",
    "## Review rule",
    "",
    "A page can return to `indexable` only after its source record/page facts are complete and accurate, its local image is valid, it has a unique canonical, and any Product schema is meaningful. Do not solve a failure by adding invented dimensions, warranty, performance, stock, or certification claims. Add an override only after choosing a safe redirect/retirement decision where inbound legacy URLs are affected.",
    "",
  ].join("\n");
}

function writeCatalogueReports(analysis, applied = null) {
  const report = {
    ...analysis,
    controls: {
      approvedIndexationControlRun: Boolean(applied),
      sitemapUrlsRemoved: applied?.sitemapRemovals || 0,
      pageChanges: applied?.pageChanges || 0,
      currentlyNoindexPages: analysis.pages.filter((page) => /(?:^|,)\s*noindex\b/i.test(page.currentRobots)).length,
      invalidThicknessSourceRecordsSanitised: applied?.sanitisation?.sourceRecordsChanged || 0,
      invalidThicknessPagesSanitised: applied?.sanitisation?.pagesChanged || 0,
    },
  };
  writeText(path.join(generatedDir, "catalogue-quality-report.json"), `${JSON.stringify(report, null, 2)}\n`);
  writeText(path.join(generatedDir, "catalogue-quality-report.md"), catalogueMarkdown(analysis, applied));
}

function removeInvalidThicknessProperties(html) {
  return String(html).replace(/(<script\b[^>]*type\s*=\s*(["'])application\/ld\+json\2[^>]*>)([\s\S]*?)(<\/script>)/gi, (whole, open, _quote, body, close) => {
    if (!/"name"\s*:\s*"Thickness"/i.test(body)) return whole;
    try {
      const transform = (value) => {
        if (Array.isArray(value)) return value.map(transform);
        if (!value || typeof value !== "object") return value;
        const result = { ...value };
        const types = Array.isArray(result["@type"]) ? result["@type"] : [result["@type"]];
        if (types.map((type) => String(type).toLowerCase()).includes("product") && Array.isArray(result.additionalProperty)) {
          result.additionalProperty = result.additionalProperty.filter((property) => {
            const label = text(property?.name).toLowerCase();
            const valueText = text(property?.value).toLowerCase();
            return !(label === "thickness" && categoryNames.has(valueText));
          });
        }
        if (Array.isArray(result["@graph"])) result["@graph"] = result["@graph"].map(transform);
        return result;
      };
      return `${open}${JSON.stringify(transform(JSON.parse(body)))}${close}`;
    } catch {
      return whole;
    }
  });
}

function sanitizeInvalidThicknesses() {
  const dataPath = path.join(root, "data", "product-catalogue.json");
  const data = JSON.parse(fs.readFileSync(dataPath, "utf8"));
  let sourceRecordsChanged = 0;
  for (const product of data.products || []) {
    const category = text(product.category).toLowerCase();
    if (category && text(product.thickness).toLowerCase() === category && categoryNames.has(category)) {
      product.thickness = "";
      if (text(product.totalThickness).toLowerCase() === category) product.totalThickness = "";
      sourceRecordsChanged += 1;
    }
  }
  if (sourceRecordsChanged) fs.writeFileSync(dataPath, `${JSON.stringify(data, null, 2)}\n`);

  let pagesChanged = 0;
  const changedRoutes = [];
  for (const page of catalogueAnalysis().pages.filter((candidate) => candidate.issues.some((issue) => issue.code === "category-used-as-thickness"))) {
    const pagePath = path.join(root, page.file);
    const original = fs.readFileSync(pagePath, "utf8");
    let next = original.replace(/<div\b[^>]*class\s*=\s*(["'])[^"']*\bspec-item\b[^"']*\1[^>]*>\s*<span\b[^>]*>\s*Thickness\s*<\/span>\s*<strong\b[^>]*>\s*(?:Hybrid|Laminate|Engineered timber|Solid timber|Vinyl)\s*<\/strong>\s*<\/div>/gi, "");
    next = removeInvalidThicknessProperties(next);
    if (next !== original) {
      fs.writeFileSync(pagePath, next);
      pagesChanged += 1;
      changedRoutes.push(page.route);
    }
  }
  const result = { generatedAt: new Date().toISOString(), sourceRecordsChanged, pagesChanged, changedRoutes };
  writeText(path.join(generatedDir, "catalogue-sanitisation-report.json"), `${JSON.stringify(result, null, 2)}\n`);
  return result;
}

function applyCatalogueControls(analysis) {
  let pageChanges = 0;
  const quarantinedRoutes = new Set();
  for (const page of analysis.pages) {
    const pagePath = path.join(root, page.file);
    const original = fs.readFileSync(pagePath, "utf8");
    const controlled = page.classification !== "indexable" && page.indexationControl.applyNoindex;
    let next = original;
    if (controlled) {
      next = setRobots(next, "noindex,follow");
      quarantinedRoutes.add(page.route);
      next = removeProductSchema(next);
    }
    if (next !== original) {
      fs.writeFileSync(pagePath, next);
      pageChanges += 1;
    }
  }
  const sitemap = updateSitemapForQuarantine(quarantinedRoutes);
  return { pageChanges, sitemapRemovals: sitemap.removed.length, quarantinedRoutes: [...sitemap.noindexRoutes].sort() };
}

function parseRedirects() {
  const raw = fs.readFileSync(path.join(root, "_redirects"), "utf8");
  const rules = [];
  raw.split(/\r?\n/).forEach((line, index) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) return;
    const parts = trimmed.split(/\s+/);
    if (parts.length < 2) return;
    const statusText = parts[2] || "301";
    const status = Number.parseInt(statusText, 10);
    rules.push({ line: index + 1, source: parts[0], destination: parts[1], status, statusText, raw: line });
  });
  return rules;
}

function redirectPath(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  try {
    return new URL(raw, domain).pathname.replace(/\\/g, "/").replace(/\/+/g, "/");
  } catch {
    const pathname = raw.split(/[?#]/)[0].replace(/\\/g, "/").replace(/\/+/g, "/");
    return pathname.startsWith("/") ? pathname : `/${pathname}`;
  }
}

function redirectAudit(noindexRoutes) {
  const rules = parseRedirects();
  const bySource = new Map();
  const conflicts = [];
  const loops = [];
  const chains = [];
  const missingTargets = [];
  const noindexTargets = [];
  const homepageDumps = [];
  const wildcardOrdering = [];
  for (const rule of rules) {
    const source = redirectPath(rule.source);
    const existing = bySource.get(source) || [];
    existing.push(rule);
    bySource.set(source, existing);
  }
  for (const [source, sourceRules] of bySource) {
    const variants = new Set(sourceRules.map((rule) => `${rule.destination}|${rule.statusText}`));
    if (variants.size > 1) conflicts.push({ source, lines: sourceRules.map((rule) => rule.line), rules: sourceRules.map((rule) => rule.raw) });
  }
  const directRedirects = new Map();
  for (const rule of rules) {
    if (rule.status >= 300 && rule.status < 400 && !/[*:]/.test(rule.source) && !/^https?:/i.test(rule.destination)) {
      directRedirects.set(redirectPath(rule.source), redirectPath(rule.destination));
    }
  }
  for (const rule of rules) {
    if (rule.status < 300 || rule.status >= 400 || /[*:]/.test(rule.source) || /^https?:/i.test(rule.destination)) continue;
    const source = redirectPath(rule.source);
    const target = redirectPath(rule.destination);
    const visited = [source];
    let current = target;
    while (directRedirects.has(current) && !visited.includes(current)) {
      visited.push(current);
      current = directRedirects.get(current);
    }
    if (visited.includes(current)) loops.push({ line: rule.line, source, cycle: [...visited, current] });
    else if (visited.length > 1) chains.push({ line: rule.line, source, chain: [...visited, current] });
    if (target === "/" && source !== "/") homepageDumps.push({ line: rule.line, source });
    const localFile = fileForRoute(target);
    if (!localFile && !directRedirects.has(target) && !/^\/(?:404\.html)?$/.test(target)) missingTargets.push({ line: rule.line, source, destination: rule.destination });
    if (noindexRoutes.has(routeFromUrl(target)) && !intentionalNoindexUtilityRoutes.includes(routeFromUrl(target))) {
      noindexTargets.push({ line: rule.line, source, destination: rule.destination });
    }
  }
  for (let index = 0; index < rules.length; index += 1) {
    const generic = rules[index];
    if (!/\*/.test(generic.source)) continue;
    const genericPrefix = generic.source.split("*")[0];
    for (const specific of rules.slice(index + 1)) {
      if (!/[*:]/.test(specific.source) && specific.source.startsWith(genericPrefix)) {
        wildcardOrdering.push({ genericLine: generic.line, specificLine: specific.line, generic: generic.source, specific: specific.source });
      }
    }
  }
  return { rules, conflicts, loops, chains, missingTargets, noindexTargets, homepageDumps, wildcardOrdering };
}

function writeRedirectReports(audit) {
  const summary = {
    totalRules: audit.rules.length,
    permanentRedirects: audit.rules.filter((rule) => rule.status === 301).length,
    cleanRewrites: audit.rules.filter((rule) => rule.statusText === "200!").length,
    goneRules: audit.rules.filter((rule) => rule.status === 410).length,
    conflicts: audit.conflicts.length,
    loops: audit.loops.length,
    chains: audit.chains.length,
    missingTargets: audit.missingTargets.length,
    noindexTargets: audit.noindexTargets.length,
    wildcardOrdering: audit.wildcardOrdering.length,
    homepageDumps: audit.homepageDumps.length,
  };
  const report = { generatedAt: new Date().toISOString(), summary, ...audit };
  writeText(path.join(generatedDir, "redirect-validation-report.json"), `${JSON.stringify(report, null, 2)}\n`);
  const rows = Object.entries(summary).map(([label, value]) => `| ${label} | ${value} |`);
  writeText(path.join(generatedDir, "redirect-validation-report.md"), [
    "# Redirect validation report",
    "",
    `Generated: ${report.generatedAt}`,
    "",
    "| Check | Result |",
    "| --- | ---: |",
    ...rows,
    "",
    "Detailed conflicts, loops, chains, missing targets, noindex targets, wildcard ordering findings and redirect rules are in `redirect-validation-report.json`.",
    "",
  ].join("\n"));
  const representative = [
    "/contact-us/",
    "/hybrid/",
    "/product/eco-eco-swish-laminate-new-england-blackbutt/",
    "/product/eco-eco-swish-laminate-nutmeg/",
    "/product/eco-eco-swish-oak-contemporary-elegant-milano-oak/",
    "/product-category/hybrid/ornato-hybrid/",
    "/sitemap-keyword-targets.xml",
  ];
  const sampleRows = representative.map((source) => {
    const rule = audit.rules.find((candidate) => candidate.source === source);
    return `| ${source} | ${rule ? `${rule.destination} (${rule.statusText})` : "MISSING"} |`;
  });
  writeText(path.join(generatedDir, "redirect-representative-tests.md"), [
    "# Representative legacy redirect checks",
    "",
    "Run these against the approved production deploy after release. Local validation confirms the mapping layer only; it cannot prove a Netlify response before deployment.",
    "",
    "| Legacy path | Expected first-hop result |",
    "| --- | --- |",
    ...sampleRows,
    "",
  ].join("\n"));
}

function linkAudit(sitemapRoutes) {
  const pages = [];
  const brokenLinks = [];
  const brokenAssets = [];
  for (const route of sitemapRoutes) {
    const file = fileForRoute(route);
    if (!file) continue;
    const html = fs.readFileSync(file, "utf8");
    const links = [...String(html).matchAll(/\bhref\s*=\s*(["'])([\s\S]*?)\1/gi)].map((match) => text(match[2]));
    for (const href of links) {
      if (!href || /^(?:https?:\/\/(?!oztimberfloor\.com\.au)|mailto:|tel:|#|javascript:)/i.test(href)) continue;
      if (/\.(?:css|js|mjs|map|png|jpe?g|webp|gif|svg|ico|pdf|docx?|xlsx?|zip)(?:$|[?#])/i.test(href)) continue;
      const target = routeFromUrl(href);
      if (target && !fileForRoute(target) && !/\.(?:pdf|docx?|xlsx?|zip)$/i.test(target)) brokenLinks.push({ route, href });
    }
    for (const source of imageSources(html)) {
      if (!localAssetExists(source, file)) brokenAssets.push({ route, source });
    }
    pages.push({ route, file, html });
  }
  return { pages, brokenLinks, brokenAssets };
}

function contactContract() {
  const contactPath = path.join(root, "contact", "index.html");
  const html = fs.readFileSync(contactPath, "utf8");
  const formMatch = html.match(/<form\b[^>]*\bname\s*=\s*(["'])oz-flooring-enquiry\1[^>]*>[\s\S]*?<\/form>/i);
  const form = formMatch ? formMatch[0] : "";
  const requirements = {
    formPresent: Boolean(form),
    netlifyDetection: /\bdata-netlify\s*=\s*(["'])true\1/i.test(form),
    stableName: /\bname\s*=\s*(["'])oz-flooring-enquiry\1/i.test(form),
    matchingFormName: /<input\b[^>]*\bname\s*=\s*(["'])form-name\1[^>]*\bvalue\s*=\s*(["'])oz-flooring-enquiry\2/i.test(form),
    honeypot: /\bnetlify-honeypot\s*=\s*(["'])company\1/i.test(form) && /\bname\s*=\s*(["'])company\1/i.test(form),
    consent: /\bname\s*=\s*(["'])consent\1[^>]*\brequired\b/i.test(form),
    thankYou: /\baction\s*=\s*(["'])\/thank-you\/\1/i.test(form),
    attribution: ["source_page", "product_slug", "range", "category", "utm_source", "utm_medium", "utm_campaign", "gclid", "fbclid"].every((name) => new RegExp(`\\bname\\s*=\\s*(["'])${escapeRegex(name)}\\1`, "i").test(form)),
    progressiveFields: /\bdata-field\s*=\s*(["'])area\1/i.test(form) && /\bdata-field\s*=\s*(["'])company_project\1/i.test(form),
  };
  return { requirements, failures: Object.entries(requirements).filter(([, valid]) => !valid).map(([name]) => name) };
}

function analyticsContract() {
  const config = fs.readFileSync(path.join(root, "assets", "contact-config.js"), "utf8");
  const site = fs.readFileSync(path.join(root, "assets", "site.js"), "utf8");
  const idMatch = config.match(/ga4MeasurementId\s*:\s*(null|["']([^"']*)["'])/i);
  const measurementId = idMatch ? (idMatch[2] || "") : "";
  const idConfigured = /^G-[A-Z0-9]+$/i.test(measurementId);
  const eventNames = [
    "phone_click",
    "email_click",
    "quote_start",
    "quote_submit",
    "stock_check",
    "supply_only_enquiry",
    "supply_install_enquiry",
  ];
  const fields = [
    "page_path",
    "source_page",
    "enquiry_type",
    "category",
    "has_product_context",
    "has_range_context",
    "utm_source_present",
    "utm_medium_present",
    "utm_campaign_present",
    "gclid_present",
    "fbclid_present",
  ];
  return {
    measurementIdConfigured: idConfigured,
    centralizedConfig: /window\.OZ_TIMBER_FLOOR_CONTACT/.test(config) && /ga4MeasurementId/.test(config),
    eventNames: Object.fromEntries(eventNames.map((name) => [name, new RegExp(`trackEvent\\(\\s*["']${name}["']`).test(site)])),
    attributionFields: Object.fromEntries(fields.map((field) => [field, new RegExp(escapeRegex(field)).test(site)])),
    duplicateInitGuard: /OZ_TIMBER_FLOOR_GA4_READY/.test(site) && /data-oz-ga4/.test(site),
    duplicateListenerGuard: /OZ_TIMBER_FLOOR_SITE_READY/.test(site),
    avoidsFreeText: !/\blink_url\s*:/.test(site)
      && !/trackEvent\([\s\S]{0,800}\bformData\.get\(/.test(site)
      && !/\butm_(?:source|medium|campaign)\s*:/.test(site),
  };
}

function nonProductionIndexingContract() {
  const production = fs.readFileSync(path.join(root, "config", "netlify-headers", "production"), "utf8");
  const nonProduction = fs.readFileSync(path.join(root, "config", "netlify-headers", "non-production"), "utf8");
  const prepare = fs.readFileSync(path.join(root, "scripts", "prepare-netlify-deploy.mjs"), "utf8");
  const robots = fs.readFileSync(path.join(root, "robots.txt"), "utf8");
  return {
    productionRobotsAllow: /User-agent:\s*\*/i.test(robots) && /(?:^|\n)Allow:\s*\/\s*$/mi.test(robots) && !/Disallow:\s*\/\s*$/mi.test(robots),
    productionHeaderTemplateIndexable: !/X-Robots-Tag\s*:\s*noindex/i.test(production),
    nonProductionHeadersNoindex: /X-Robots-Tag\s*:\s*noindex/i.test(nonProduction),
    indexingApprovalGate: /OZ_PRODUCTION_INDEXING_ENABLED/.test(prepare)
      && /publishIndexable\s*=\s*isProduction\s*&&\s*indexingEnabled/.test(prepare),
    contextAwareBuild: /process\.env\.CONTEXT/.test(prepare) && /isProduction/.test(prepare) && /non-production/.test(prepare),
  };
}

function pageContracts(sitemapRoutes) {
  const issues = [];
  const titles = new Map();
  const descriptions = new Map();
  const canonicalCounts = new Map();
  for (const route of sitemapRoutes) {
    const file = fileForRoute(route);
    if (!file) {
      issues.push({ severity: "BLOCKER", code: "sitemap-missing-local-file", route });
      continue;
    }
    const html = fs.readFileSync(file, "utf8");
    const h1s = h1sFromHtml(html);
    const title = text((html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i) || [])[1] || "");
    const description = metaContent(html, "description");
    const canonical = canonicalFromHtml(html);
    const ogUrl = metaContent(html, "og:url");
    const language = (html.match(/<html\b[^>]*\blang\s*=\s*(["'])(.*?)\1/i) || [])[2] || "";
    if (h1s.length !== 1) issues.push({ severity: "HIGH", code: "invalid-h1-count", route, count: h1s.length });
    if (!title) issues.push({ severity: "BLOCKER", code: "missing-title", route });
    if (!description) issues.push({ severity: "HIGH", code: "missing-meta-description", route });
    if (canonical !== `${domain}${route}`) issues.push({ severity: "BLOCKER", code: "canonical-mismatch", route, canonical });
    if (ogUrl !== `${domain}${route}`) issues.push({ severity: "HIGH", code: "og-url-mismatch", route, ogUrl });
    if (!language) issues.push({ severity: "HIGH", code: "missing-lang", route });
    if (pageHasNoindex(html)) issues.push({ severity: "BLOCKER", code: "noindex-in-sitemap", route });
    if (/(?:localhost|netlify\.app|operon)/i.test([canonical, ogUrl, html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/i)?.[1] || ""].join(" "))) issues.push({ severity: "BLOCKER", code: "non-production-domain-leak", route });
    for (const script of schemaScripts(html)) if (script.error) issues.push({ severity: "HIGH", code: "invalid-json-ld", route, detail: script.error });
    if (title) {
      const list = titles.get(title) || [];
      list.push(route);
      titles.set(title, list);
    }
    if (description) {
      const list = descriptions.get(description) || [];
      list.push(route);
      descriptions.set(description, list);
    }
    if (canonical) canonicalCounts.set(canonical, (canonicalCounts.get(canonical) || 0) + 1);
  }
  for (const [title, routes] of titles) if (routes.length > 1) issues.push({ severity: "MEDIUM", code: "duplicate-title", title, routes });
  for (const [description, routes] of descriptions) if (routes.length > 1) issues.push({ severity: "MEDIUM", code: "duplicate-meta-description", description, routes });
  for (const [canonical, count] of canonicalCounts) if (count > 1) issues.push({ severity: "BLOCKER", code: "duplicate-canonical", canonical, count });
  return issues;
}

function sitemapAudit() {
  const main = sitemapEntries(sitemapPath);
  const routes = [];
  const issues = [];
  const seen = new Set();
  for (const entry of main.entries) {
    const { loc, route } = entry;
    routes.push(route);
    if (!loc.startsWith(`${domain}/`)) issues.push({ severity: "BLOCKER", code: "sitemap-non-production-domain", loc });
    if (!loc.startsWith("https://")) issues.push({ severity: "BLOCKER", code: "sitemap-non-https", loc });
    if (/\.html(?:$|[?#])/i.test(loc)) issues.push({ severity: "BLOCKER", code: "sitemap-html-url", loc });
    if (/\/(?:product|product-category)\//i.test(route)) issues.push({ severity: "BLOCKER", code: "sitemap-legacy-url", loc });
    if (route === "/bamboo-flooring-sydney/") issues.push({ severity: "BLOCKER", code: "discontinued-bamboo-in-sitemap", loc });
    if (seen.has(loc)) issues.push({ severity: "BLOCKER", code: "sitemap-duplicate-url", loc });
    seen.add(loc);
  }
  const keywordPath = path.join(root, "sitemap-keyword-targets.xml");
  if (fs.existsSync(keywordPath)) {
    const keyword = sitemapEntries(keywordPath);
    const keywordLocs = keyword.entries.map((entry) => entry.loc);
    if (keywordLocs.length && keywordLocs.every((loc) => seen.has(loc))) issues.push({ severity: "HIGH", code: "duplicate-keyword-sitemap", count: keywordLocs.length });
  }
  return { routes, issues, count: main.entries.length };
}

function writeSitemapReport(sitemap, publication) {
  const report = {
    generatedAt: new Date().toISOString(),
    summary: {
      urlCount: sitemap.count,
      publicationCanonicalCount: publication.publicationRoutes.length,
      sitemapOmissionCount: publication.sitemapOmissions.length,
      noindexSitemapCount: publication.noindexSitemapRoutes.length,
      issueCount: sitemap.issues.length + publication.blockingIssues.length,
    },
    urls: sitemap.routes.map((route) => `${domain}${route}`),
    publication: {
      canonicalRoutes: publication.publicationRoutes,
      sitemapOmissions: publication.sitemapOmissions,
      sitemapWithoutPublicationCanonical: publication.sitemapWithoutPublicationCanonical,
      noindexRoutes: publication.noindexRoutes,
      redirectOnlyRoutes: publication.redirectOnlyRoutes,
      noindexSitemapRoutes: publication.noindexSitemapRoutes,
      intentionalPhysicalAliases: publication.intentionalPhysicalAliases,
      duplicateCanonicalOwnership: publication.duplicateOwnership,
      missingCanonicalFiles: publication.missingCanonicalFiles,
      conflictingRobotsFiles: publication.conflictingRobotsFiles,
    },
    issues: [...sitemap.issues, ...publication.blockingIssues],
  };
  writeText(path.join(generatedDir, "sitemap-validation-report.json"), `${JSON.stringify(report, null, 2)}\n`);
  writeText(path.join(generatedDir, "sitemap-validation-report.md"), [
    "# Sitemap validation report",
    "",
    `Generated: ${report.generatedAt}`,
    "",
    `- Main sitemap URLs: ${report.summary.urlCount}`,
    `- Expected publication canonicals: ${report.summary.publicationCanonicalCount}`,
    `- Publication canonicals missing from the sitemap: ${report.summary.sitemapOmissionCount}`,
    `- Noindex routes present in the sitemap: ${report.summary.noindexSitemapCount}`,
    `- Validation findings: ${report.summary.issueCount}`,
    "- The full URL list and findings are in `sitemap-validation-report.json`.",
    "",
  ].join("\n"));
}

function buildContract() {
  const requiredFiles = [
    "_redirects",
    "_headers",
    "netlify.toml",
    "robots.txt",
    "sitemap.xml",
    "assets/contact-config.js",
    "assets/site.js",
    "contact/index.html",
    "data/product-catalogue.json",
    "data/catalogue-quality-overrides.json",
    "scripts/prepare-netlify-deploy.mjs",
    "scripts/build-public-package.mjs",
    "scripts/migration-readiness.mjs",
  ];
  const packageData = readJson("package.json");
  const netlify = fs.readFileSync(path.join(root, "netlify.toml"), "utf8");
  const migrationCheck = packageData.scripts?.["migration:check"] || "";
  const localMigrationCheck = packageData.scripts?.["migration:check:local"] || "";
  const fullHardeningChain = (command, readinessCommand) => command === [
    readinessCommand,
    "npm run seo:gsc-audit",
    "npm run seo:migration-hardening:check",
  ].join(" && ");
  return {
    missingFiles: requiredFiles.filter((file) => !fs.existsSync(path.join(root, file))),
    hasBuildScript: releaseBuildContract(packageData).ok,
    hasReadinessScript: fullHardeningChain(migrationCheck, "node scripts/migration-readiness.mjs")
      && fullHardeningChain(localMigrationCheck, "node scripts/migration-readiness.mjs --allow-external"),
    publicPackagePublish: /publish\s*=\s*"dist"/.test(netlify),
  };
}

function performanceAccessibilityAudit() {
  const files = walkFiles(root, (filePath) => filePath.endsWith(".html"));
  let images = 0;
  let missingAlt = 0;
  let missingDimensions = 0;
  let lazyImages = 0;
  let buttons = 0;
  let unnamedButtons = 0;
  for (const file of files) {
    const html = fs.readFileSync(file, "utf8");
    for (const tag of allTags(html, "img")) {
      images += 1;
      if (!/\balt\s*=\s*(["'])[^]*?\1/i.test(tag)) missingAlt += 1;
      if (!/\bwidth\s*=/.test(tag) || !/\bheight\s*=/.test(tag)) missingDimensions += 1;
      if (/\bloading\s*=\s*(["'])lazy\1/i.test(tag)) lazyImages += 1;
    }
    for (const match of String(html).matchAll(/<button\b[^>]*>([\s\S]*?)<\/button>/gi)) {
      buttons += 1;
      if (!text(match[1]) && !/\baria-label\s*=/.test(match[0])) unnamedButtons += 1;
    }
  }
  const css = fs.readFileSync(path.join(root, "assets", "site.css"), "utf8");
  return {
    htmlFiles: files.length,
    images,
    missingAlt,
    missingDimensions,
    lazyImages,
    buttons,
    unnamedButtons,
    focusVisibleStyles: /:focus-visible/.test(css),
    reducedMotionStyles: /prefers-reduced-motion/.test(css),
  };
}

function writePerformanceAccessibilityReport(audit) {
  writeText(path.join(generatedDir, "performance-accessibility-report.json"), `${JSON.stringify({ generatedAt: new Date().toISOString(), ...audit }, null, 2)}\n`);
  writeText(path.join(generatedDir, "performance-accessibility-report.md"), [
    "# Performance and accessibility baseline",
    "",
    "| Check | Result |",
    "| --- | ---: |",
    `| HTML files scanned | ${audit.htmlFiles} |`,
    `| Images | ${audit.images} |`,
    `| Images with missing alt attribute | ${audit.missingAlt} |`,
    `| Images with missing width or height | ${audit.missingDimensions} |`,
    `| Images marked lazy | ${audit.lazyImages} |`,
    `| Buttons without an accessible name | ${audit.unnamedButtons} |`,
    `| Focus-visible styling present | ${audit.focusVisibleStyles ? "yes" : "no"} |`,
    `| Reduced-motion styling present | ${audit.reducedMotionStyles ? "yes" : "no"} |`,
    "",
    "Missing image dimensions are an optimisation backlog, not a safe auto-fix: product image intrinsic dimensions should be measured before markup is changed so colours and presentation are not degraded. Validate Core Web Vitals and mobile layout against the approved deploy before launch.",
    "",
  ].join("\n"));
}

function issueSummary(issues) {
  const counts = { BLOCKER: 0, HIGH: 0, MEDIUM: 0, INFORMATIONAL: 0 };
  for (const issue of issues) counts[issue.severity] = (counts[issue.severity] || 0) + 1;
  return counts;
}

function migrationReport({ catalogue, sitemap, publication, redirects, contracts, links, contact, analytics, nonProduction, build, performanceAccessibility, issues }) {
  const counts = issueSummary(issues);
  const indexable = catalogue.pages.filter((page) => page.classification === "indexable").length;
  const classifiedNonIndexable = catalogue.pages.length - indexable;
  const currentlyNoindex = catalogue.pages.filter((page) => /(?:^|,)\s*noindex\b/i.test(page.currentRobots)).length;
  return {
    generatedAt: new Date().toISOString(),
    repository: { root, branch: process.env.GIT_BRANCH || "See git status", canonicalDomain: domain },
    verdict: counts.BLOCKER ? "NO-GO" : counts.HIGH ? "CONDITIONAL GO" : "GO",
    summary: {
      ...counts,
      htmlPages: walkFiles(root, (file) => file.endsWith(".html")).length,
      physicalIndexableHtmlPages: publication.physicalIndexableHtmlFiles,
      publicationCanonicals: publication.publicationRoutes.length,
      noindexRoutes: publication.noindexRoutes.length,
      redirectOnlyRoutes: publication.redirectOnlyRoutes.length,
      sitemapUrls: sitemap.count,
      publicationCanonicalSitemapOmissions: publication.sitemapOmissions.length,
      redirectRules: redirects.rules.length,
      cataloguePages: catalogue.totals.cataloguePages,
      catalogueIndexable: indexable,
      catalogueClassifiedNonIndexable: classifiedNonIndexable,
      catalogueCurrentlyNoindex: currentlyNoindex,
      brokenInternalLinks: links.brokenLinks.length,
      brokenLocalAssets: links.brokenAssets.length,
      redirectConflicts: redirects.conflicts.length,
      redirectLoops: redirects.loops.length,
      redirectChains: redirects.chains.length,
      redirectMissingTargets: redirects.missingTargets.length,
      redirectNoindexTargets: redirects.noindexTargets.length,
    },
    publication: {
      canonicalRoutes: publication.publicationRoutes,
      sitemapRoutes: publication.sitemapRoutes,
      sitemapOmissions: publication.sitemapOmissions,
      sitemapWithoutPublicationCanonical: publication.sitemapWithoutPublicationCanonical,
      noindexRoutes: publication.noindexRoutes,
      redirectOnlyRoutes: publication.redirectOnlyRoutes,
      noindexSitemapRoutes: publication.noindexSitemapRoutes,
      intentionalPhysicalAliases: publication.intentionalPhysicalAliases,
      duplicateCanonicals: publication.duplicateCanonicals,
      duplicateCanonicalOwnership: publication.duplicateOwnership,
      missingCanonicalFiles: publication.missingCanonicalFiles,
      invalidCanonicalFiles: publication.invalidCanonicalFiles,
      conflictingRobotsFiles: publication.conflictingRobotsFiles,
    },
    contracts: { contact, analytics, nonProduction, build, performanceAccessibility },
    issues,
  };
}

function markdownReport(report) {
  const { summary } = report;
  const issueRows = report.issues.slice(0, 100).map((issue) => `| ${issue.severity} | ${issue.code} | ${issue.route || issue.source || issue.loc || issue.detail || "See JSON"} |`).join("\n") || "| INFORMATIONAL | no-local-issues | — |";
  return [
    "# Migration readiness report",
    "",
    `Generated: ${report.generatedAt}`,
    "",
    `## Verdict: ${report.verdict}`,
    "",
    "| Measure | Result |",
    "| --- | ---: |",
    `| HTML pages | ${summary.htmlPages} |`,
    `| Physical indexable HTML pages | ${summary.physicalIndexableHtmlPages} |`,
    `| Unique publication canonicals | ${summary.publicationCanonicals} |`,
    `| Unique noindex routes | ${summary.noindexRoutes} |`,
    `| Physical redirect-only routes | ${summary.redirectOnlyRoutes} |`,
    `| Sitemap URLs | ${summary.sitemapUrls} |`,
    `| Publication canonicals missing from sitemap | ${summary.publicationCanonicalSitemapOmissions} |`,
    `| Redirect rules | ${summary.redirectRules} |`,
    `| Catalogue pages | ${summary.cataloguePages} |`,
    `| Catalogue indexable | ${summary.catalogueIndexable} |`,
    `| Catalogue classified non-indexable (review queue) | ${summary.catalogueClassifiedNonIndexable} |`,
    `| Catalogue currently noindex | ${summary.catalogueCurrentlyNoindex} |`,
    `| BLOCKER | ${summary.BLOCKER} |`,
    `| HIGH | ${summary.HIGH} |`,
    `| MEDIUM | ${summary.MEDIUM} |`,
    `| INFORMATIONAL | ${summary.INFORMATIONAL} |`,
    "",
    "## Local findings",
    "",
    "| Severity | Check | Location / detail |",
    "| --- | --- | --- |",
    issueRows,
    "",
    "The complete, machine-readable result is `docs/seo-migration/generated/migration-readiness-report.json`. External checks remain separate and must not be marked verified until tested in the relevant system.",
    "",
  ].join("\n");
}

function runFullCheck() {
  const catalogue = catalogueAnalysis();
  writeCatalogueReports(catalogue);
  const sitemap = sitemapAudit();
  const publication = createPublicationInventory({ root, domain, sitemapPath });
  const noindexRoutes = new Set();
  for (const file of walkFiles(root, (filePath) => filePath.endsWith(".html"))) {
    if (pageHasNoindex(fs.readFileSync(file, "utf8"))) noindexRoutes.add(urlForFile(file));
  }
  const redirects = redirectAudit(noindexRoutes);
  writeRedirectReports(redirects);
  writeSitemapReport(sitemap, publication);
  const contracts = pageContracts(sitemap.routes);
  const links = linkAudit(sitemap.routes);
  const contact = contactContract();
  const analytics = analyticsContract();
  const nonProduction = nonProductionIndexingContract();
  const build = buildContract();
  const performanceAccessibility = performanceAccessibilityAudit();
  writePerformanceAccessibilityReport(performanceAccessibility);
  const issues = [
    ...sitemap.issues,
    ...publication.blockingIssues,
    ...build.missingFiles.map((file) => ({ severity: "BLOCKER", code: "required-file-missing", file })),
    ...(!build.hasBuildScript ? [{ severity: "BLOCKER", code: "build-script-mismatch" }] : []),
    ...(!build.hasReadinessScript ? [{ severity: "BLOCKER", code: "readiness-script-mismatch" }] : []),
    ...(!build.publicPackagePublish ? [{ severity: "BLOCKER", code: "netlify-publish-directory-mismatch" }] : []),
    ...catalogue.pages
      .filter((page) => page.classification !== "indexable" && sitemap.routes.includes(page.route) && !pageHasNoindex(fs.readFileSync(path.join(root, page.file), "utf8")))
      .map((page) => ({
        // A page classified as non-indexable is a release blocker while it remains
        // indexable and listed in the production sitemap. The underlying cause is
        // retained in `failures` for triage rather than being silently downgraded.
        severity: "BLOCKER",
        code: "catalogue-quality-page-still-indexable",
        route: page.route,
        classification: page.classification,
        failures: page.issues.map((issue) => issue.code),
      })),
    ...contracts,
    ...links.brokenLinks.map((item) => ({ severity: "HIGH", code: "broken-internal-link", ...item })),
    ...links.brokenAssets.map((item) => ({ severity: "BLOCKER", code: "broken-local-asset", ...item })),
    ...redirects.conflicts.map((item) => ({ severity: "BLOCKER", code: "redirect-conflict", ...item })),
    ...redirects.loops.map((item) => ({ severity: "BLOCKER", code: "redirect-loop", ...item })),
    ...redirects.chains.map((item) => ({ severity: "HIGH", code: "redirect-chain", ...item })),
    ...redirects.missingTargets.map((item) => ({ severity: "BLOCKER", code: "redirect-missing-target", ...item })),
    ...redirects.noindexTargets.map((item) => ({ severity: "HIGH", code: "redirect-target-noindex", ...item })),
    ...redirects.wildcardOrdering.map((item) => ({ severity: "HIGH", code: "wildcard-shadows-specific-redirect", ...item })),
    ...redirects.homepageDumps.map((item) => ({ severity: "HIGH", code: "homepage-redirect-dump", ...item })),
    ...contact.failures.map((failure) => ({ severity: "BLOCKER", code: `contact-contract-${failure}` })),
    ...Object.entries(analytics.eventNames).filter(([, valid]) => !valid).map(([name]) => ({ severity: "BLOCKER", code: `analytics-event-missing-${name}` })),
    ...Object.entries(analytics.attributionFields).filter(([, valid]) => !valid).map(([name]) => ({ severity: "HIGH", code: `analytics-attribution-missing-${name}` })),
    ...(!analytics.centralizedConfig ? [{ severity: "BLOCKER", code: "analytics-no-central-config" }] : []),
    ...(!analytics.duplicateInitGuard ? [{ severity: "HIGH", code: "analytics-duplicate-init-guard-missing" }] : []),
    ...(!analytics.duplicateListenerGuard ? [{ severity: "HIGH", code: "analytics-listener-guard-missing" }] : []),
    ...(!analytics.avoidsFreeText ? [{ severity: "BLOCKER", code: "analytics-free-text-leak" }] : []),
    ...(!analytics.measurementIdConfigured && !allowExternal ? [{ severity: "BLOCKER", code: "ga4-measurement-id-not-configured", external: true }] : []),
    ...Object.entries(nonProduction).filter(([, valid]) => !valid).map(([name]) => ({ severity: "BLOCKER", code: `indexing-control-${name}` })),
    ...(performanceAccessibility.missingAlt ? [{ severity: "HIGH", code: "accessibility-images-missing-alt", count: performanceAccessibility.missingAlt }] : []),
    ...(performanceAccessibility.unnamedButtons ? [{ severity: "HIGH", code: "accessibility-buttons-without-name", count: performanceAccessibility.unnamedButtons }] : []),
    ...(!performanceAccessibility.focusVisibleStyles ? [{ severity: "MEDIUM", code: "accessibility-focus-visible-styles-missing" }] : []),
    ...(!performanceAccessibility.reducedMotionStyles ? [{ severity: "MEDIUM", code: "accessibility-reduced-motion-styles-missing" }] : []),
  ];
  const report = migrationReport({ catalogue, sitemap, publication, redirects, contracts, links, contact, analytics, nonProduction, build, performanceAccessibility, issues });
  writeText(path.join(generatedDir, "migration-readiness-report.json"), `${JSON.stringify(report, null, 2)}\n`);
  writeText(path.join(generatedDir, "migration-readiness-report.md"), markdownReport(report));
  process.stdout.write(`${report.verdict}: ${report.summary.BLOCKER} blocker(s), ${report.summary.HIGH} high finding(s), ${report.summary.MEDIUM} medium finding(s).\n`);
  if (issues.some((issue) => issue.severity === "BLOCKER")) process.exitCode = 1;
}

if (applyCatalogueOnly) {
  const sanitisation = sanitizeInvalidThicknesses();
  const analysis = catalogueAnalysis();
  const applied = applyCatalogueControls(analysis);
  applied.sanitisation = sanitisation;
  const postApply = catalogueAnalysis();
  writeCatalogueReports(postApply, applied);
  process.stdout.write(`Catalogue controls applied: ${applied.pageChanges} page change(s), ${applied.sitemapRemovals} sitemap URL(s) excluded; removed invalid category-as-thickness values from ${sanitisation.sourceRecordsChanged} source record(s) and ${sanitisation.pagesChanged} page(s).\n`);
} else {
  runFullCheck();
}
