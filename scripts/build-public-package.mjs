#!/usr/bin/env node

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
execFileSync(process.execPath, [path.join(root, 'scripts/october-catalogue-repair.mjs')], {cwd:root, stdio:'inherit'});
execFileSync(process.execPath, [path.join(root, 'scripts/october-verified-specs.mjs')], {cwd:root, stdio:'inherit'});
const publishRoot = path.join(root, "dist");
const checkOnly = process.argv.includes("--check");
const context = String(process.env.CONTEXT || "dev").trim().toLowerCase();
const indexingEnabled = /^true$/i.test(String(process.env.OZ_PRODUCTION_INDEXING_ENABLED || "").trim());
const publishIndexable = context === "production" && indexingEnabled;

const publicDirectories = Object.freeze([
  "timber-flooring-installation-common-mistakes-and-solutions",
  "timber-flooring-options-solid-vs-engineered-vs-hybrid",
  "laminate-timber-flooring-explained-cost-durability-use-cases",
  "vinyl-timber-flooring-sydney-cost-durability-and-best-use-cases",
  "floor-levelling",
  "hybrid",
  "laminate",
  "engineered-timber-flooring",
  "timber-floor-installation",
  "commercial-flooring",
  "office-flooring",
  "solid-timber",
  "vinyl",
  "about",
  "assets",
  "bamboo-flooring-sydney",
  "builder-flooring-contractor-sydney",
  "commercial-flooring-sydney",
  "contact",
  "engineered-timber-flooring-supplier-sydney",
  "engineered-timber-flooring-sydney",
  "faqs",
  "floor-levelling-sydney",
  "guides",
  "hardwood-timber-flooring-sydney",
  "hybrid-flooring-supplier-sydney",
  "hybrid-flooring-sydney",
  "laminate-flooring-supplier-sydney",
  "laminate-flooring-sydney",
  "office-flooring-sydney",
  "privacy",
  "product",
  "products",
  "projects",
  "ranges",
  "services",
  "solid-timber-flooring-supplier-sydney",
  "solid-timber-flooring-sydney",
  "terms",
  "thank-you",
  "timber-floor-removal-and-stripping-sydney",
  "timber-floor-sanding-and-polishing-sydney",
  "timber-flooring-installation-sydney",
  "timber-flooring-supplier-sydney",
  "vinyl-flooring-supplier-sydney",
  "vinyl-flooring-sydney",
]);

const requiredRootFiles = Object.freeze([
  "_headers",
  "_redirects",
  "404.html",
  "robots.txt",
  "sitemap.xml",
]);

const forbiddenPackageRoots = Object.freeze([
  ".git",
  ".github",
  ".tools",
  "config",
  "data",
  "docs",
  "migration",
  "node_modules",
  "scripts",
]);

function toPosix(value) {
  return value.split(path.sep).join("/");
}

function sha256(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function copyFile(relative) {
  const source = path.join(root, relative);
  const destination = path.join(publishRoot, relative);
  if (!fs.existsSync(source) || !fs.statSync(source).isFile()) {
    throw new Error(`Missing required public file: ${relative}`);
  }
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.copyFileSync(source, destination);
}

function copyDirectory(relative) {
  const source = path.join(root, relative);
  const destination = path.join(publishRoot, relative);
  if (!fs.existsSync(source) || !fs.statSync(source).isDirectory()) {
    throw new Error(`Missing required public directory: ${relative}`);
  }
  fs.cpSync(source, destination, {
    recursive: true,
    dereference: true,
    filter: (sourcePath) => path.basename(sourcePath) !== ".DS_Store",
  });
}

function walkFiles(directory, found = []) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const filePath = path.join(directory, entry.name);
    if (entry.isDirectory()) walkFiles(filePath, found);
    else if (entry.isFile()) found.push(filePath);
    else throw new Error(`Unsupported package entry: ${toPosix(path.relative(publishRoot, filePath))}`);
  }
  return found;
}

function packageManifest() {
  const files = walkFiles(publishRoot)
    .map((filePath) => ({
      path: toPosix(path.relative(publishRoot, filePath)),
      bytes: fs.statSync(filePath).size,
      sha256: sha256(fs.readFileSync(filePath)),
    }))
    .sort((left, right) => left.path.localeCompare(right.path));
  const payload = {
    schemaVersion: 1,
    fileCount: files.length,
    byteCount: files.reduce((total, file) => total + file.bytes, 0),
    files,
  };
  const text = `${JSON.stringify(payload, null, 2)}\n`;
  return { ...payload, manifestSha256: sha256(text) };
}

function verifyPublicPackage(manifest) {
  const issues = [];
  for (const required of requiredRootFiles) {
    if (!fs.existsSync(path.join(publishRoot, required))) issues.push(`missing:${required}`);
  }
  for (const forbidden of forbiddenPackageRoots) {
    if (fs.existsSync(path.join(publishRoot, forbidden))) issues.push(`forbidden-root:${forbidden}`);
  }
  for (const forbiddenFile of [
    "AGENTS.md",
    "OZ_STATUS.md",
    "OZ_DECISION_LOG.md",
    "OZ_MIGRATION_CHECKLIST.md",
    "package.json",
    "package-lock.json",
    "netlify.toml",
  ]) {
    if (fs.existsSync(path.join(publishRoot, forbiddenFile))) issues.push(`forbidden-file:${forbiddenFile}`);
  }

  const headers = fs.readFileSync(path.join(publishRoot, "_headers"), "utf8");
  const globalNoindex = /X-Robots-Tag:\s*noindex,\s*nofollow/i.test(headers);
  if (publishIndexable && globalNoindex) issues.push("unexpected-global-noindex-in-production-fixture");
  if (!publishIndexable && !globalNoindex) issues.push("missing-global-noindex");

  const sensitivePatterns = [
    /\/Users\/daibang\//,
    /NETLIFY_AUTH_TOKEN/,
    /OZ_PRODUCTION_INDEXING_ENABLED/,
    /OZ_GA4_MEASUREMENT_ID/,
    /BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY/,
    /AKIA[0-9A-Z]{16}/,
    /(?:sk|rk)_(?:live|test)_[A-Za-z0-9]+/,
  ];
  const textExtensions = new Set([".css", ".html", ".js", ".svg", ".txt", ".xml"]);
  for (const file of manifest.files) {
    if (!textExtensions.has(path.extname(file.path).toLowerCase())) continue;
    const contents = fs.readFileSync(path.join(publishRoot, file.path), "utf8");
    if (sensitivePatterns.some((pattern) => pattern.test(contents))) issues.push(`sensitive-content:${file.path}`);
  }

  if (issues.length) throw new Error(`Public package preflight failed:\n${issues.join("\n")}`);
}

if (!checkOnly) {
  if (path.dirname(publishRoot) !== root || path.basename(publishRoot) !== "dist") {
    throw new Error(`Unsafe publish directory: ${publishRoot}`);
  }
  fs.rmSync(publishRoot, { recursive: true, force: true });
  fs.mkdirSync(publishRoot, { recursive: true });

  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    if (entry.isFile() && entry.name.endsWith(".html")) copyFile(entry.name);
  }
  for (const required of requiredRootFiles) copyFile(required);
  for (const directory of publicDirectories) copyDirectory(directory);
}

if (!fs.existsSync(publishRoot) || !fs.statSync(publishRoot).isDirectory()) {
  throw new Error("Public package is missing; run npm run release:package first.");
}

const manifest = packageManifest();
verifyPublicPackage(manifest);
process.stdout.write(
  `PUBLIC PACKAGE PASS mode=${publishIndexable ? "isolated-production-fixture" : "protected-preview"} files=${manifest.fileCount} bytes=${manifest.byteCount} manifestSha256=${manifest.manifestSha256} output=dist\n`,
);
