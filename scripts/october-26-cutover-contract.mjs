#!/usr/bin/env node

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (relative) => fs.readFileSync(path.join(root, relative), "utf8");
const count = (text, pattern) => [...text.matchAll(pattern)].length;
const schemas = (html) => [...html.matchAll(/<script(?:\s+id="[^"]+")?\s+type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((match) => JSON.parse(match[1]));
const wordCount = (html) => html.replace(/<script[\s\S]*?<\/script>/g, " ").replace(/<style[\s\S]*?<\/style>/g, " ").replace(/<[^>]+>/g, " ").replace(/&[a-z0-9#]+;/gi, " ").trim().split(/\s+/).filter(Boolean).length;
const regexEscape = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const sitemap = read("sitemap.xml");
assert.equal(count(sitemap, /<loc>/g), 773, "sitemap must contain 773 canonical pages after restoring oak owner");
assert.equal(count(sitemap, /https:\/\/oztimberfloor\.com\.au\/oak-flooring-sydney\//g), 1);

const redirects = read("_redirects");
assert.match(redirects, /^\/oak-flooring-sydney\/ \/oak-flooring-sydney\.html 200!$/m);
assert.match(redirects, /^\/oak-flooring-sydney\.html \/oak-flooring-sydney\/ 301!$/m);
assert.match(redirects, /^\/oak-flooring-sydney\/index\.html \/oak-flooring-sydney\/ 301!$/m);
assert.doesNotMatch(redirects, /^\/oak-flooring-sydney\/ \/engineered-timber-flooring\/ 301!?$/m);
assert.match(redirects, /^\/\* \/404\.html 404$/m, "catch-all must return the real 404 page with status 404");

const oak = read("oak-flooring-sydney/index.html");
assert.match(oak, /<link rel="canonical" href="https:\/\/oztimberfloor\.com\.au\/oak-flooring-sydney\/">/);
assert.match(oak, /<meta name="robots" content="index,follow">/);
assert.equal(count(oak, /<h1[ >]/g), 1);
assert.ok(wordCount(oak) >= 500, `oak page must be useful, found ${wordCount(oak)} words`);
assert.equal(count(oak, /<article class="faq-item">/g), 4);
assert.ok(schemas(oak).some((schema) => schema["@graph"]?.some((entry) => entry["@type"] === "FAQPage" && entry.mainEntity.length === 4)));
assert.equal(read("oak-flooring-sydney.html"), oak);

const faq = read("faqs/index.html");
assert.equal(count(faq, /<div class="faq-item"/g), 15);
assert.ok(schemas(faq).some((schema) => schema["@type"] === "FAQPage" && schema.mainEntity.length === 15));
for (const phrase of ["maintained", "prepare the property", "damaged boards", "site assessment", "larger renovation"]) assert.match(faq.toLowerCase(), new RegExp(phrase));
assert.equal(read("faqs.html"), faq);

const installation = read("timber-floor-installation/index.html");
assert.equal(count(installation, /<article class="faq-item">/g), 8);
assert.match(installation, /Prepare the property and installation sequence/);
assert.match(installation, /What happens after you enquire/);
assert.ok(schemas(installation).some((schema) => schema["@graph"]?.some((entry) => entry["@type"] === "FAQPage" && entry.mainEntity.length === 8)));
assert.equal(read("timber-floor-installation.html"), installation);

const engineered = read("engineered-timber-flooring/index.html");
assert.match(engineered, /href="\/oak-flooring-sydney\/"/);
assert.equal(read("engineered-timber-flooring.html"), engineered);

for (const [source, destination] of [
  ["/product/kronoswiss-aquastop-natural-oak-brown-8mm/", "/ranges/kronoswiss-aquastop/"],
  ["/product/kronoswiss-aquastop-interlaken/", "/ranges/kronoswiss-aquastop/"],
  ["/product/stone-floor-oak-beige/", "/ranges/stone-floor/"],
  ["/product/etf-hybrid-spc-9mm-helena-oak/", "/ranges/etf-9-0mm-hybrid/"],
]) assert.match(redirects, new RegExp(`^${regexEscape(source)} ${regexEscape(destination)} 301$`, "m"));

for (const route of [
  "products/kronoswiss-aquastop-natural-oak-brown-8mm/index.html",
  "products/kronoswiss-aquastop-interlaken/index.html",
  "products/stone-floor-oak-beige/index.html",
  "products/etf-hybrid-spc-9mm-helena-oak/index.html",
]) assert.match(read(route), /<meta name="robots" content="noindex,follow">/);

for (const slug of [
  "artisan-cotton-wood", "artisan-biarritz", "artisan-chanterelle", "artisan-chantilly", "artisan-naturalle", "artisan-oxford-grey",
  "artisan-provence", "artisan-woodlands", "artisan-natural-classic", "artisan-romandie", "artisan-montreux", "artisan-brittany-grey",
]) assert.match(redirects, new RegExp(`^/products/${slug}/ /products/${slug}/index\\.html 410!$`, "m"));

assert.match(read("ranges/hardwood-collection/index.html"), /12 colours/i);
assert.match(read("ranges/kronoswiss-aquastop/index.html"), /8\s*\/\s*12\s*\/\s*14\s*mm/i);
assert.match(read("products/kronoswiss-aquastop-beach/index.html"), /14mm/i);
assert.ok(fs.existsSync(path.join(root, "googlea11728cf4d174049.html")));
assert.match(read("index.html"), /google-site-verification/i);
assert.match(read("scripts/build-public-package.mjs"), /"oak-flooring-sydney"/);

process.stdout.write("OCTOBER 26 CUTOVER CONTRACT PASS sitemap=773 oak-owner=restored faq=15 installation-faq=8 priorities=4 retirement=12\n");
