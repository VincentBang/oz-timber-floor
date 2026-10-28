import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { createPublicationInventory } from "./publication-inventory.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const domain = "https://oztimberfloor.com.au";
const reportPath = path.join(root, "docs/release/OZ-RELEASE-CLOSEOUT/generated/performance/image-dimension-audit.json");

export const priorityRoutes = Object.freeze([
  { route: "/", primarySrc: "/assets/images/hero/enchant-caramel-herringbone-interior.webp" },
  { route: "/floor-levelling/", primarySrc: "/assets/images/hero/sydney-timber-flooring-contractor.jpg" },
  { route: "/timber-floor-installation/", primarySrc: "/assets/images/hero/sydney-timber-flooring-contractor.jpg" },
  { route: "/hybrid/", primarySrc: "/assets/images/products/hybrid/hybrid-pacific-blackbutt.webp" },
  { route: "/laminate/", primarySrc: "/assets/images/products/laminate/laminate-coastal-blackbutt.jpg" },
  { route: "/engineered-timber-flooring/", primarySrc: "/assets/images/products/engineered/engineered-blackbutt-rustic.jpg" },
  { route: "/solid-timber/", primarySrc: "/assets/images/hero/sydney-timber-flooring-contractor.jpg" },
  { route: "/commercial-flooring/", primarySrc: "/assets/images/products/engineered/engineered-blackbutt-rustic.jpg" },
  { route: "/office-flooring/", primarySrc: "/assets/images/products/hybrid/hybrid-natural-oak.jpg" },
  { route: "/products/", primarySrc: "/assets/images/products/engineered/engineered-blackbutt-rustic.jpg" },
  { route: "/ranges/etf-9-0mm-hybrid/", primarySrc: "/assets/products/hybrid/etf-9-0mm-hybrid/alaskan-oak.jpg" },
  { route: "/products/etf-9-0mm-hybrid-driftwood/", primarySrc: "/assets/products/hybrid/etf-9-0mm-hybrid/driftwood.jpg" },
  { route: "/projects/", primarySrc: "/assets/images/projects/herringbone-timber-stairs/kitchen-living-960.webp" },
  { route: "/about/", primarySrc: "/assets/images/hero/sydney-timber-flooring-contractor.jpg" },
  { route: "/contact/", primarySrc: "/assets/images/hero/sydney-timber-flooring-contractor.jpg" },
]);

const rasterExtensions = new Set([".gif", ".jpeg", ".jpg", ".png", ".webp"]);
const jpegStartOfFrameMarkers = new Set([
  0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf,
]);

function toPosix(value) {
  return value.split(path.sep).join("/");
}

function sha256(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function attribute(tag, name) {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = String(tag).match(new RegExp(`\\b${escaped}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, "i"));
  return match ? (match[1] ?? match[2] ?? match[3] ?? "") : "";
}

function hasAttribute(tag, name) {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(?:^|\\s)${escaped}(?:\\s*=|\\s|/?>)`, "i").test(String(tag));
}

function setAttribute(tag, name, value) {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const expression = new RegExp(`\\s${escaped}\\s*=\\s*(?:"[^"]*"|'[^']*'|[^\\s>]+)`, "i");
  if (expression.test(tag)) return tag.replace(expression, ` ${name}="${value}"`);
  const close = tag.endsWith("/>") ? "/>" : ">";
  return `${tag.slice(0, -close.length)} ${name}="${value}"${close}`;
}

function addBooleanAttribute(tag, name) {
  if (hasAttribute(tag, name)) return tag;
  const close = tag.endsWith("/>") ? "/>" : ">";
  return `${tag.slice(0, -close.length)} ${name}${close}`;
}

function imageTags(html) {
  return String(html).match(/<img\b[^>]*>/gi) ?? [];
}

function localAssetPath(htmlFile, src) {
  const clean = String(src).split(/[?#]/)[0];
  if (!clean || /^(?:data:|https?:|\/\/)/i.test(clean)) return null;
  const decoded = decodeURIComponent(clean);
  const absolute = decoded.startsWith("/")
    ? path.join(root, decoded.replace(/^\/+/, ""))
    : path.resolve(path.dirname(htmlFile), decoded);
  if (root !== absolute && !absolute.startsWith(`${root}${path.sep}`)) return null;
  if (!rasterExtensions.has(path.extname(absolute).toLowerCase())) return null;
  return absolute;
}

function readJpegSize(buffer) {
  if (buffer.length < 4 || buffer[0] !== 0xff || buffer[1] !== 0xd8) return null;
  let offset = 2;
  while (offset + 8 < buffer.length) {
    while (offset < buffer.length && buffer[offset] === 0xff) offset += 1;
    const marker = buffer[offset];
    offset += 1;
    if (marker === 0xd8 || marker === 0xd9) continue;
    if (marker === 0xda) break;
    if (offset + 2 > buffer.length) break;
    const length = buffer.readUInt16BE(offset);
    if (length < 2 || offset + length > buffer.length) break;
    if (jpegStartOfFrameMarkers.has(marker) && length >= 7) {
      return { width: buffer.readUInt16BE(offset + 5), height: buffer.readUInt16BE(offset + 3) };
    }
    offset += length;
  }
  return null;
}

function readWebpSize(buffer) {
  if (buffer.length < 30 || buffer.toString("ascii", 0, 4) !== "RIFF" || buffer.toString("ascii", 8, 12) !== "WEBP") return null;
  const type = buffer.toString("ascii", 12, 16);
  if (type === "VP8X") {
    return {
      width: 1 + buffer.readUIntLE(24, 3),
      height: 1 + buffer.readUIntLE(27, 3),
    };
  }
  if (type === "VP8L" && buffer[20] === 0x2f) {
    const b1 = buffer[21];
    const b2 = buffer[22];
    const b3 = buffer[23];
    const b4 = buffer[24];
    return {
      width: 1 + (((b2 & 0x3f) << 8) | b1),
      height: 1 + (((b4 & 0x0f) << 10) | (b3 << 2) | ((b2 & 0xc0) >> 6)),
    };
  }
  if (type === "VP8 " && buffer[23] === 0x9d && buffer[24] === 0x01 && buffer[25] === 0x2a) {
    return {
      width: buffer.readUInt16LE(26) & 0x3fff,
      height: buffer.readUInt16LE(28) & 0x3fff,
    };
  }
  return null;
}

export function readImageSize(filePath) {
  const buffer = fs.readFileSync(filePath);
  // Some inherited catalogue files carry a .jpg or .webp suffix that does not
  // match their encoded bytes. Sniff the file signature so dimensions remain
  // factual without renaming URLs or changing catalogue data.
  if (buffer.length >= 24 && buffer.toString("hex", 0, 8) === "89504e470d0a1a0a") {
    return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
  }
  if (buffer.length >= 10 && /^GIF8[79]a$/.test(buffer.toString("ascii", 0, 6))) {
    return { width: buffer.readUInt16LE(6), height: buffer.readUInt16LE(8) };
  }
  if (buffer.length >= 12 && buffer.toString("ascii", 0, 4) === "RIFF" && buffer.toString("ascii", 8, 12) === "WEBP") {
    return readWebpSize(buffer);
  }
  if (buffer.length >= 2 && buffer[0] === 0xff && buffer[1] === 0xd8) return readJpegSize(buffer);
  return null;
}

export function priorityPublicationPages() {
  const inventory = createPublicationInventory({ root, domain });
  const byRoute = new Map(inventory.publicationPages.map((page) => [page.route, page]));
  return {
    inventory,
    pages: priorityRoutes.map((definition) => {
      const publication = byRoute.get(definition.route);
      if (!publication) throw new Error(`No publication owner for priority route ${definition.route}`);
      return { ...definition, ...publication };
    }),
  };
}

function routeAudit(page) {
  const htmlFile = path.join(root, page.file);
  const html = fs.readFileSync(htmlFile, "utf8");
  const tags = imageTags(html);
  const assets = [];
  const missingAssets = [];
  const unsupportedAssets = [];
  const missingDimensions = [];
  const dimensionMismatches = [];
  let primarySourceOccurrences = 0;

  for (const [index, tag] of tags.entries()) {
    const src = attribute(tag, "src");
    const assetPath = localAssetPath(htmlFile, src);
    if (!assetPath) continue;
    const relativeAsset = toPosix(path.relative(root, assetPath));
    if (!fs.existsSync(assetPath)) {
      missingAssets.push({ index, src, file: relativeAsset });
      continue;
    }
    const dimensions = readImageSize(assetPath);
    if (!dimensions) {
      unsupportedAssets.push({ index, src, file: relativeAsset });
      continue;
    }
    const width = Number.parseInt(attribute(tag, "width"), 10) || null;
    const height = Number.parseInt(attribute(tag, "height"), 10) || null;
    const primary = src === page.primarySrc && primarySourceOccurrences === (page.primaryOccurrence ?? 0);
    if (src === page.primarySrc) primarySourceOccurrences += 1;
    const record = {
      index,
      src,
      file: relativeAsset,
      bytes: fs.statSync(assetPath).size,
      intrinsicWidth: dimensions.width,
      intrinsicHeight: dimensions.height,
      width,
      height,
      loading: attribute(tag, "loading") || null,
      fetchpriority: attribute(tag, "fetchpriority") || null,
      decoding: attribute(tag, "decoding") || null,
      lcpMarker: hasAttribute(tag, "data-lcp-image"),
      primary,
    };
    assets.push(record);
    if (!width || !height) missingDimensions.push({ index, src, width, height });
    if ((width && width !== dimensions.width) || (height && height !== dimensions.height)) {
      dimensionMismatches.push({
        index,
        src,
        declared: { width, height },
        intrinsic: dimensions,
      });
    }
  }

  const uniqueAssets = new Map();
  for (const asset of assets) uniqueAssets.set(asset.file, asset.bytes);
  const primaryImages = assets.filter((asset) => asset.primary);
  const highPriorityImages = assets.filter((asset) => String(asset.fetchpriority).toLowerCase() === "high");
  const markedImages = assets.filter((asset) => asset.lcpMarker);
  const issues = [];
  if (primaryImages.length !== 1) issues.push(`expected one primary image; found ${primaryImages.length}`);
  if (missingAssets.length) issues.push(`${missingAssets.length} local image assets are missing`);
  if (unsupportedAssets.length) issues.push(`${unsupportedAssets.length} local image assets have unreadable dimensions`);
  if (missingDimensions.length) issues.push(`${missingDimensions.length} local image tags lack complete dimensions`);
  if (dimensionMismatches.length) issues.push(`${dimensionMismatches.length} image tags mismatch intrinsic dimensions`);
  if (highPriorityImages.length !== 1) issues.push(`expected one high-priority image; found ${highPriorityImages.length}`);
  if (markedImages.length !== 1) issues.push(`expected one data-lcp-image marker; found ${markedImages.length}`);
  const primary = primaryImages[0];
  if (primary && String(primary.loading).toLowerCase() !== "eager") issues.push("primary image is not eager-loaded");
  if (primary && String(primary.fetchpriority).toLowerCase() !== "high") issues.push("primary image is not high priority");
  if (primary && String(primary.decoding).toLowerCase() !== "async") issues.push("primary image does not use async decoding");
  if (primary && !primary.lcpMarker) issues.push("primary image lacks data-lcp-image marker");

  return {
    route: page.route,
    file: page.file,
    ownershipRule: page.ownershipRule,
    aliasFiles: page.aliasFiles,
    ownerSha256: sha256(html),
    primarySrc: page.primarySrc,
    primarySourceOccurrences,
    imageTags: tags.length,
    localRasterImages: assets.length,
    uniqueLocalAssets: uniqueAssets.size,
    uniqueLocalAssetBytes: [...uniqueAssets.values()].reduce((total, bytes) => total + bytes, 0),
    missingDimensions,
    dimensionMismatches,
    missingAssets,
    unsupportedAssets,
    highPriorityImageCount: highPriorityImages.length,
    lcpMarkerCount: markedImages.length,
    primaryImage: primary ?? null,
    issues,
  };
}

function applyRoute(page) {
  const htmlFile = path.join(root, page.file);
  const before = fs.readFileSync(htmlFile, "utf8");
  const prior = routeAudit(page);
  const unsafeIssues = [
    ...(prior.missingAssets.length ? ["missing assets"] : []),
    ...(prior.unsupportedAssets.length ? ["unreadable image dimensions"] : []),
    ...(prior.dimensionMismatches.length ? ["dimension mismatches"] : []),
    ...(prior.primaryImage ? [] : ["missing primary image"]),
    ...(prior.highPriorityImageCount > 1 ? ["multiple high-priority images"] : []),
    ...(prior.lcpMarkerCount > 1 ? ["multiple data-lcp-image markers"] : []),
  ];
  if (unsafeIssues.length) throw new Error(`${page.route}: refusing to apply with ${unsafeIssues.join(", ")}`);

  let primarySourceOccurrences = 0;
  const after = before.replace(/<img\b[^>]*>/gi, (original) => {
    const src = attribute(original, "src");
    const assetPath = localAssetPath(htmlFile, src);
    if (!assetPath || !fs.existsSync(assetPath)) return original;
    const dimensions = readImageSize(assetPath);
    if (!dimensions) return original;
    let next = original;
    if (!attribute(next, "width")) next = setAttribute(next, "width", String(dimensions.width));
    if (!attribute(next, "height")) next = setAttribute(next, "height", String(dimensions.height));
    const primary = src === page.primarySrc && primarySourceOccurrences === (page.primaryOccurrence ?? 0);
    if (src === page.primarySrc) primarySourceOccurrences += 1;
    if (primary) {
      next = setAttribute(next, "loading", "eager");
      next = setAttribute(next, "fetchpriority", "high");
      next = setAttribute(next, "decoding", "async");
      next = addBooleanAttribute(next, "data-lcp-image");
    }
    return next;
  });

  if (after !== before) fs.writeFileSync(htmlFile, after);
  return { file: page.file, changed: after !== before };
}

export function buildImageDimensionReport() {
  const { inventory, pages } = priorityPublicationPages();
  const routes = pages.map(routeAudit);
  const summary = {
    priorityRoutes: routes.length,
    publicationOwners: new Set(routes.map((route) => route.file)).size,
    imageTags: routes.reduce((total, route) => total + route.imageTags, 0),
    localRasterImages: routes.reduce((total, route) => total + route.localRasterImages, 0),
    uniqueLocalAssets: new Set(routes.flatMap((route) => route.primaryImage ? [route.primaryImage.file] : [])).size,
    missingDimensions: routes.reduce((total, route) => total + route.missingDimensions.length, 0),
    dimensionMismatches: routes.reduce((total, route) => total + route.dimensionMismatches.length, 0),
    missingAssets: routes.reduce((total, route) => total + route.missingAssets.length, 0),
    unreadableAssets: routes.reduce((total, route) => total + route.unsupportedAssets.length, 0),
    routesWithIssues: routes.filter((route) => route.issues.length).length,
  };
  const allUniqueAssets = new Map();
  for (const page of pages) {
    const htmlFile = path.join(root, page.file);
    for (const tag of imageTags(fs.readFileSync(htmlFile, "utf8"))) {
      const assetPath = localAssetPath(htmlFile, attribute(tag, "src"));
      if (assetPath && fs.existsSync(assetPath)) allUniqueAssets.set(toPosix(path.relative(root, assetPath)), fs.statSync(assetPath).size);
    }
  }
  summary.uniqueLocalAssets = allUniqueAssets.size;
  summary.uniqueLocalAssetBytes = [...allUniqueAssets.values()].reduce((total, bytes) => total + bytes, 0);
  return {
    schemaVersion: 1,
    task: "OZ-PERF-002",
    scope: "15 redirect-resolved publication owners only",
    generationLayer: "scripts/image-dimension-audit.mjs",
    publicationInventory: {
      physicalHtmlFiles: inventory.physicalHtmlFiles,
      publicationCanonicalPages: inventory.publicationPages.length,
      sitemapUrls: inventory.sitemapRoutes.length,
      blockingIssues: inventory.blockingIssues.length,
    },
    summary,
    routes,
  };
}

function writeReport(report) {
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
}

function main() {
  const apply = process.argv.includes("--apply");
  const { pages } = priorityPublicationPages();
  let changedFiles = [];
  if (apply) changedFiles = pages.map(applyRoute).filter((entry) => entry.changed).map((entry) => entry.file);
  const report = buildImageDimensionReport();
  writeReport(report);
  const { summary } = report;
  console.log(`PERF IMAGE ${apply ? "APPLY" : "CHECK"} routes=${summary.priorityRoutes} owners=${summary.publicationOwners} images=${summary.localRasterImages} uniqueAssets=${summary.uniqueLocalAssets} updatedFiles=${changedFiles.length}`);
  console.log(`PERF IMAGE RESULT missingDimensions=${summary.missingDimensions} mismatches=${summary.dimensionMismatches} missingAssets=${summary.missingAssets} unreadable=${summary.unreadableAssets} routeIssues=${summary.routesWithIssues}`);
  if (changedFiles.length) console.log(`PERF IMAGE UPDATED ${changedFiles.join(", ")}`);
  if (summary.routesWithIssues) {
    for (const route of report.routes.filter((entry) => entry.issues.length)) {
      for (const issue of route.issues) console.error(`- ${route.route} [${route.file}]: ${issue}`);
    }
    process.exitCode = 1;
  } else {
    console.log(`PERF IMAGE PASSED report=${toPosix(path.relative(root, reportPath))}`);
  }
}

if (path.resolve(process.argv[1] ?? "") === fileURLToPath(import.meta.url)) main();
