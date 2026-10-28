#!/usr/bin/env node

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { routing } from "./october-route-fixture.mjs";
import { createPublicationInventory } from "./publication-inventory.mjs";
import {approvedStonefloorSource,stonefloorRetirementIssues} from './approved-stonefloor-legacy-retirement.mjs';

const sourceRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const fixtureRoot = path.resolve(process.env.OZ_FIXTURE_ROOT || path.join(sourceRoot, "dist"));
const mode = process.env.OZ_FIXTURE_MODE || "protected";
const domain = "https://oztimberfloor.com.au";
const auditRoot = "/Users/daibang/Documents/Codex/2026-10-26/referenced-chatgpt-conversation-this-is-an/outputs";

function parseCsv(text) {
  const rows = [];
  let row = [], field = "", quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    if (quoted) {
      if (character === '"' && text[index + 1] === '"') { field += '"'; index += 1; }
      else if (character === '"') quoted = false;
      else field += character;
    } else if (character === '"') quoted = true;
    else if (character === ",") { row.push(field); field = ""; }
    else if (character === "\n") { row.push(field.replace(/\r$/, "")); if (row.some(Boolean)) rows.push(row); row = []; field = ""; }
    else field += character;
  }
  const [headers, ...data] = rows;
  return data.map((fields) => Object.fromEntries(headers.map((header, index) => [header, fields[index] || ""])));
}

function normalizeRoute(value) {
  const url = new URL(value, domain);
  return url.pathname || "/";
}

function htmlFile(result) {
  if (!result.file) return null;
  return path.join(fixtureRoot, result.file);
}

function htmlState(html) {
  const title = html.match(/<title>([\s\S]*?)<\/title>/i)?.[1]?.trim() || "";
  const description = html.match(/<meta\b[^>]*name="description"[^>]*content="([^"]*)"[^>]*>/i)?.[1] || html.match(/<meta\b[^>]*content="([^"]*)"[^>]*name="description"[^>]*>/i)?.[1] || "";
  const canonical = html.match(/<link\b[^>]*rel="canonical"[^>]*href="([^"]+)"[^>]*>/i)?.[1] || html.match(/<link\b[^>]*href="([^"]+)"[^>]*rel="canonical"[^>]*>/i)?.[1] || "";
  const noindex = /<meta\b[^>]*name="robots"[^>]*content="[^"]*noindex/i.test(html);
  return { title, description, canonical, noindex, h1: (html.match(/<h1\b/gi) || []).length };
}

const sourceSitemaps = ["page-sitemap.xml", "post-sitemap.xml", "product-sitemap.xml", "product_cat-sitemap.xml"];
const legacyRoutes = [...new Set(sourceSitemaps.flatMap((file) => [...fs.readFileSync(path.join(sourceRoot, "docs/migration-october-2026/source", file), "utf8").matchAll(/<loc>(https:\/\/oztimberfloor\.com\.au[^<]*)<\/loc>/g)].map((match) => normalizeRoute(match[1]))))];
assert.equal(legacyRoutes.length, 539);

const evidence = parseCsv(fs.readFileSync(path.join(auditRoot, "url-evidence.csv"), "utf8"));
const auditByRoute = new Map(evidence.filter((row) => {
  try { return new URL(row.requested_url).hostname === "oztimberfloor.netlify.app"; } catch { return false; }
}).map((row) => [normalizeRoute(row.requested_url), row]));
const router = routing(fixtureRoot);
const stonefloorApprovalBytes=fs.readFileSync(path.join(sourceRoot,'config/stonefloor-legacy-retirement-2026-10-28.json'));
const catalogue=JSON.parse(fs.readFileSync(path.join(sourceRoot,'data/product-catalogue.json'),'utf8'));
const overrides=JSON.parse(fs.readFileSync(path.join(sourceRoot,'data/catalogue-quality-overrides.json'),'utf8'));
const sourceInventory=createPublicationInventory({root:sourceRoot,domain});
const legacyResults = [];
for (const route of legacyRoutes) {
  const result = router.resolve(route);
  const audit = auditByRoute.get(route);
  assert.ok(audit, `October 26 audit row missing for ${route}`);
  assert.equal(result.loop, false, `redirect loop: ${route}`);
  assert.ok(result.hops <= 1, `multi-hop redirect: ${route}`);
  if (approvedStonefloorSource(route,stonefloorApprovalBytes)) {
    const id=route.split('/').filter(Boolean).at(-1),held=`/products/${id}/`,rules=router.rules.filter(r=>r.from===route);
    assert.equal(rules.length,1,`approved retirement literal rule count: ${route}`);
    const issues=stonefloorRetirementIssues({source:route,rule:rules[0],approvalBytes:stonefloorApprovalBytes,product:catalogue.products.find(p=>p.id===id),control:overrides.pages[held],html:fs.readFileSync(path.join(fixtureRoot,held.slice(1),'index.html'),'utf8'),sitemapRoutes:sourceInventory.sitemapRoutes,publicationRoutes:sourceInventory.publicationRoutes});
    assert.deepEqual(issues,[],`approved retirement contract drift: ${route}`);
    assert.equal(result.status,200);assert.equal(result.hops,1);assert.equal(result.destination,'/ranges/stone-floor/');
  } else if (route === "/oak-flooring-sydney/") {
    assert.equal(result.status, 200);
    assert.equal(result.hops, 0);
    assert.equal(result.destination, "/oak-flooring-sydney/");
  } else {
    const expectedStatus = audit.status_chain === "410" ? 410 : 200;
    const expectedHops = audit.status_chain === "301 > 200" ? 1 : 0;
    assert.equal(result.status, expectedStatus, `${route} status differs from audit baseline`);
    assert.equal(result.hops, expectedHops, `${route} hops differ from audit baseline`);
    assert.equal(result.destination, normalizeRoute(audit.final_url), `${route} destination differs from audit baseline`);
  }
  legacyResults.push({ route, status: result.status, hops: result.hops, destination: result.destination });
}

const sitemapText = fs.readFileSync(path.join(fixtureRoot, "sitemap.xml"), "utf8");
const sitemapRoutes = [...sitemapText.matchAll(/<loc>(https:\/\/oztimberfloor\.com\.au[^<]*)<\/loc>/g)].map((match) => normalizeRoute(match[1]));
assert.equal(sitemapRoutes.length, 773);
assert.equal(new Set(sitemapRoutes).size, sitemapRoutes.length, "duplicate sitemap route");
const titles = new Map();
for (const route of sitemapRoutes) {
  const result = router.resolve(route);
  assert.equal(result.status, 200, `sitemap status: ${route}`);
  assert.equal(result.hops, 0, `sitemap route redirects: ${route}`);
  const file = htmlFile(result);
  assert.ok(file && fs.existsSync(file), `sitemap file missing: ${route}`);
  const state = htmlState(fs.readFileSync(file, "utf8"));
  assert.equal(state.h1, 1, `H1 count: ${route}`);
  assert.ok(state.title, `title missing: ${route}`);
  assert.ok(state.description.length >= 15, `description missing: ${route}`);
  assert.equal(state.canonical, `${domain}${route}`, `canonical mismatch: ${route}`);
  assert.equal(state.noindex, false, `page-level noindex in sitemap: ${route}`);
  assert.equal(titles.has(state.title), false, `duplicate title: ${state.title}`);
  titles.set(state.title, route);
}

const inventory = createPublicationInventory({ root: fixtureRoot, domain });
assert.deepEqual(inventory.publicationRoutes, inventory.sitemapRoutes, "publication and sitemap sets differ");
assert.equal(inventory.publicationRoutes.length, 773);

const linkTargets = new Set();
const assetTargets = new Set();
let htmlFiles = 0, schemaBlocks = 0;
function walk(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(file);
    else if (entry.isFile() && entry.name.endsWith(".html")) {
      htmlFiles += 1;
      const html = fs.readFileSync(file, "utf8");
      for (const match of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) { JSON.parse(match[1]); schemaBlocks += 1; }
      for (const match of html.matchAll(/(?:href|src)="(\/[^"\s]*)"/g)) {
        const target = match[1].replaceAll("&amp;", "&");
        if (target.startsWith("//")) continue;
        if (/\.(?:webp|avif|jpe?g|png|svg|css|js|ico|pdf)(?:[?#]|$)/i.test(target)) assetTargets.add(target.split(/[?#]/)[0]);
        else linkTargets.add(target);
      }
    }
  }
}
walk(fixtureRoot);
for (const target of assetTargets) assert.ok(fs.existsSync(path.join(fixtureRoot, decodeURIComponent(target).slice(1))), `missing asset: ${target}`);
for (const target of linkTargets) {
  const result = router.resolve(target);
  assert.equal(result.loop, false, `linked loop: ${target}`);
  assert.ok(result.hops <= 1, `linked chain: ${target}`);
  assert.ok([200, 410].includes(result.status), `broken link: ${target} -> ${result.status}`);
}

const missing = router.resolve("/__oct26_package_missing_page__/");
assert.equal(missing.status, 404);
const sitemapIndex = router.resolve("/sitemap_index.xml");
assert.equal(sitemapIndex.status, 200);
assert.equal(sitemapIndex.hops, 1);
assert.equal(sitemapIndex.destination, "/sitemap.xml");

const headers = fs.readFileSync(path.join(fixtureRoot, "_headers"), "utf8");
const config = fs.readFileSync(path.join(fixtureRoot, "assets/contact-config.js"), "utf8");
if (mode === "production") {
  assert.doesNotMatch(headers, /X-Robots-Tag:\s*noindex,\s*nofollow/i);
  assert.match(config, /ga4MeasurementId:\s*["']G-EWSMKKM9N8["']/);
} else {
  assert.match(headers, /X-Robots-Tag:\s*noindex,\s*nofollow/i);
  assert.match(config, /ga4MeasurementId:\s*null/);
}
for (const forbidden of ["docs", "data", "config", "scripts", ".git", "AGENTS.md", "OZ_STATUS.md", "netlify.toml", "package.json"]) assert.equal(fs.existsSync(path.join(fixtureRoot, forbidden)), false, `private package entry: ${forbidden}`);
assert.ok(fs.existsSync(path.join(fixtureRoot, "googlea11728cf4d174049.html")));
assert.match(fs.readFileSync(path.join(fixtureRoot, "index.html"), "utf8"), /google-site-verification/);

const summary = {
  checkedAt: new Date().toISOString(), mode, fixtureRoot,
  legacy: { total: legacyResults.length, direct200: legacyResults.filter((row) => row.status === 200 && row.hops === 0).length, redirected200: legacyResults.filter((row) => row.status === 200 && row.hops === 1).length, retired410: legacyResults.filter((row) => row.status === 410).length },
  sitemap: { total: sitemapRoutes.length, direct200: sitemapRoutes.length, uniqueTitles: titles.size },
  package: { htmlFiles, publication: inventory.publicationRoutes.length, noindexRoutes: inventory.noindexRoutes.length, redirectOnlyRoutes: inventory.redirectOnlyRoutes.length, linkTargets: linkTargets.size, assetTargets: assetTargets.size, schemaBlocks },
  missingPageStatus: missing.status,
  sitemapIndexHops: sitemapIndex.hops,
};
const output = process.env.OZ_VALIDATION_OUTPUT;
if (output) fs.writeFileSync(output, `${JSON.stringify(summary, null, 2)}\n`);
process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
