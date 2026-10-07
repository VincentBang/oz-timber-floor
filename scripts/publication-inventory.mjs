import fs from "node:fs";
import path from "node:path";

export const defaultIgnoredDirectories = new Set([
  ".git",
  "dist",
  "node_modules",
  ".netlify",
  "docs",
  "migration",
  "config",
]);

export const intentionalNoindexUtilityRoutes = Object.freeze([
  "/404/",
  "/thank-you/",
]);

function toPosix(value) {
  return value.split(path.sep).join("/");
}

function decodeHtml(value) {
  return String(value ?? "")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">");
}

function attributes(tag) {
  const result = {};
  for (const match of String(tag).matchAll(/([^\s=/>]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g)) {
    result[match[1].toLowerCase()] = decodeHtml(match[2] ?? match[3] ?? match[4] ?? "");
  }
  return result;
}

function walkHtmlFiles(directory, ignoredDirectories, found = []) {
  if (!fs.existsSync(directory)) return found;
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (entry.name.startsWith(".") && entry.name !== ".well-known") continue;
    const filePath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      if (!ignoredDirectories.has(entry.name)) walkHtmlFiles(filePath, ignoredDirectories, found);
    } else if (entry.name.endsWith(".html") && entry.name !== 'googlea11728cf4d174049.html') {
      found.push(filePath);
    }
  }
  return found;
}

export function routeFromUrl(value, domain) {
  const raw = String(value ?? "").trim();
  if (!raw) return "";
  let pathname;
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

export function routeForHtmlFile(root, filePath) {
  const relative = toPosix(path.relative(root, filePath));
  if (relative === "index.html") return "/";
  if (relative.endsWith("/index.html")) return `/${relative.slice(0, -"index.html".length)}`;
  if (relative.endsWith(".html")) return `/${relative.slice(0, -".html".length)}/`;
  return `/${relative}`;
}

function canonicalValues(html) {
  const values = [];
  for (const match of String(html).matchAll(/<link\b[^>]*>/gi)) {
    const attrs = attributes(match[0]);
    if (String(attrs.rel ?? "").toLowerCase().split(/\s+/).includes("canonical")) {
      values.push(String(attrs.href ?? "").trim());
    }
  }
  return values;
}

function robotsValues(html) {
  const values = [];
  for (const match of String(html).matchAll(/<meta\b[^>]*>/gi)) {
    const attrs = attributes(match[0]);
    if (String(attrs.name ?? "").toLowerCase() === "robots") values.push(String(attrs.content ?? "").trim());
  }
  return values;
}

function robotsTokens(values) {
  return [...new Set(values
    .flatMap((value) => String(value).toLowerCase().split(/[\s,]+/))
    .filter(Boolean))].sort();
}

function normalizedRobotsValues(values) {
  return [...new Set(values.map((value) => robotsTokens([value]).join(",")))].sort();
}

function redirectContracts(root, domain) {
  const redirectsPath = path.join(root, "_redirects");
  const rewrites = new Map();
  const redirects = new Set();
  if (!fs.existsSync(redirectsPath)) return { rewrites, redirects };

  for (const rawLine of fs.readFileSync(redirectsPath, "utf8").split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const [sourceValue, destinationValue, statusText = "301"] = line.split(/\s+/);
    if (!sourceValue || !destinationValue || /[*:]/.test(sourceValue)) continue;
    const source = routeFromUrl(sourceValue, domain);
    const status = Number.parseInt(statusText, 10);
    if (status === 200) {
      const destination = destinationValue.replace(/^\//, "").split(/[?#]/)[0];
      rewrites.set(source, toPosix(destination));
    } else if (status >= 300 && status < 400) {
      redirects.add(source);
    }
  }
  return { rewrites, redirects };
}

export function sitemapRoutesFromXml(xml, domain) {
  const routes = [];
  for (const match of String(xml).matchAll(/<url(?:\s[^>]*)?>[\s\S]*?<loc>([\s\S]*?)<\/loc>[\s\S]*?<\/url>/gi)) {
    const href = decodeHtml(match[1]).trim();
    const url = new URL(href, domain);
    routes.push({ href, route: routeFromUrl(url.href, domain), origin: url.origin });
  }
  return routes;
}

export function sitemapUrlBlocks(xml) {
  return [...String(xml).matchAll(/<url(?:\s[^>]*)?>[\s\S]*?<\/url>/gi)].map((match) => match[0]);
}

export function sitemapLocation(block) {
  return decodeHtml(String(block).match(/<loc>([\s\S]*?)<\/loc>/i)?.[1] ?? "").trim();
}

export function filterExactSitemapLocation(xml, targetLocation) {
  return String(xml).replace(/<url(?:\s[^>]*)?>[\s\S]*?<\/url>/gi, (block) => (
    sitemapLocation(block) === targetLocation ? "" : block
  ));
}

function selectCanonicalOwner(canonicalRoute, candidates, rewrites) {
  if (candidates.length === 1) {
    return { owner: candidates[0], aliases: [], rule: "single-physical-owner" };
  }

  const rewriteDestination = rewrites.get(canonicalRoute);
  if (rewriteDestination) {
    const matches = candidates.filter((candidate) => candidate.file === rewriteDestination);
    const samePublicRoute = candidates.every((candidate) => candidate.physicalRoute === canonicalRoute);
    if (matches.length === 1 && samePublicRoute) {
      return {
        owner: matches[0],
        aliases: candidates.filter((candidate) => candidate.file !== matches[0].file),
        rule: "exact-200-rewrite-owner",
      };
    }
  }

  return { owner: null, aliases: [], rule: "ambiguous" };
}

export function publicationBlockingIssues(inventory) {
  return [
    ...inventory.utilityRoutePolicyIssues.map((issue) => ({
      severity: "BLOCKER",
      code: issue.code,
      route: issue.route,
    })),
    ...inventory.sitemapDuplicateRoutes.map((route) => ({
      severity: "BLOCKER",
      code: "duplicate-sitemap-url",
      route,
    })),
    ...inventory.sitemapNonProductionUrls.map((href) => ({
      severity: "BLOCKER",
      code: "sitemap-non-production-origin",
      loc: href,
    })),
    ...inventory.sitemapOmissions.map((route) => ({
      severity: "BLOCKER",
      code: "publication-canonical-missing-from-sitemap",
      route,
      canonical: `${inventory.domain}${route}`,
    })),
    ...inventory.noindexSitemapRoutes.map((route) => ({
      severity: "BLOCKER",
      code: "noindex-in-sitemap",
      route,
    })),
    ...inventory.sitemapWithoutPublicationCanonical.map((route) => ({
      severity: "BLOCKER",
      code: "sitemap-url-without-publication-canonical",
      route,
    })),
    ...inventory.duplicateOwnership.map((entry) => ({
      severity: "BLOCKER",
      code: "duplicate-canonical-ownership",
      route: entry.route,
      canonical: entry.canonical,
      files: entry.files,
    })),
    ...inventory.missingCanonicalFiles.map((file) => ({
      severity: "BLOCKER",
      code: "indexable-page-missing-canonical",
      file,
    })),
    ...inventory.multipleCanonicalFiles.map((entry) => ({
      severity: "BLOCKER",
      code: "multiple-canonical-tags",
      file: entry.file,
      canonicals: entry.canonicals,
    })),
    ...inventory.invalidCanonicalFiles.map((entry) => ({
      severity: "BLOCKER",
      code: "invalid-publication-canonical",
      file: entry.file,
      canonical: entry.canonical,
      reason: entry.reason,
    })),
    ...inventory.conflictingRobotsFiles.map((entry) => ({
      severity: "BLOCKER",
      code: "conflicting-robots-directives",
      file: entry.file,
      robots: entry.robots,
    })),
  ];
}

export function createPublicationInventory({
  root,
  domain,
  ignoredDirectories = defaultIgnoredDirectories,
  sitemapPath = path.join(root, "sitemap.xml"),
} = {}) {
  if (!root || !domain) throw new Error("createPublicationInventory requires root and domain.");
  const { rewrites, redirects } = redirectContracts(root, domain);
  const files = walkHtmlFiles(root, ignoredDirectories).sort((a, b) => a.localeCompare(b));
  const records = files.map((filePath) => {
    const html = fs.readFileSync(filePath, "utf8");
    const file = toPosix(path.relative(root, filePath));
    const physicalRoute = routeForHtmlFile(root, filePath);
    const canonicals = canonicalValues(html);
    const robots = robotsValues(html);
    const tokens = robotsTokens(robots);
    const normalizedRobots = normalizedRobotsValues(robots);
    const noindex = tokens.includes("noindex");
    const conflictingRobots = normalizedRobots.length > 1
      || (tokens.includes("index") && tokens.includes("noindex"))
      || (tokens.includes("follow") && tokens.includes("nofollow"));
    // An exact clean-route 200 rewrite defines the published owner even when a
    // separate `.html` compatibility URL redirects back to the clean route.
    const redirectOnly = !rewrites.has(physicalRoute) && redirects.has(physicalRoute);
    let canonical = canonicals[0] ?? "";
    let canonicalRoute = "";
    let canonicalOrigin = "";
    if (canonical) {
      try {
        const parsed = new URL(canonical, domain);
        canonical = parsed.href;
        canonicalOrigin = parsed.origin;
        canonicalRoute = routeFromUrl(parsed.href, domain);
      } catch {
        canonicalRoute = "";
      }
    }
    return {
      file,
      physicalRoute,
      canonical,
      canonicalRoute,
      canonicalOrigin,
      canonicalCount: canonicals.length,
      canonicals,
      robots,
      normalizedRobots,
      noindex,
      conflictingRobots,
      redirectOnly,
      indexable: !noindex && !redirectOnly,
    };
  });

  const missingCanonicalFiles = records
    .filter((record) => record.indexable && record.canonicalCount === 0)
    .map((record) => record.file);
  const multipleCanonicalFiles = records
    .filter((record) => record.canonicalCount > 1)
    .map((record) => ({ file: record.file, canonicals: record.canonicals }));
  const invalidCanonicalFiles = records
    .filter((record) => record.indexable && record.canonicalCount === 1)
    .filter((record) => record.canonicalOrigin !== domain || !record.canonicalRoute || record.canonicalRoute !== record.physicalRoute)
    .map((record) => ({
      file: record.file,
      canonical: record.canonical,
      reason: record.canonicalOrigin !== domain
        ? "non-production-origin"
        : record.canonicalRoute !== record.physicalRoute
          ? `canonical-route-does-not-own-physical-route:${record.physicalRoute}`
          : "invalid-canonical",
    }));
  const conflictingRobotsFiles = records
    .filter((record) => record.conflictingRobots)
    .map((record) => ({ file: record.file, robots: record.robots }));

  const eligibleOwners = records.filter((record) => record.indexable
    && record.canonicalCount === 1
    && record.canonicalOrigin === domain
    && record.canonicalRoute === record.physicalRoute);
  const candidatesByRoute = new Map();
  for (const record of eligibleOwners) {
    const candidates = candidatesByRoute.get(record.canonicalRoute) ?? [];
    candidates.push(record);
    candidatesByRoute.set(record.canonicalRoute, candidates);
  }

  const publicationPages = [];
  const intentionalPhysicalAliases = [];
  const duplicateOwnership = [];
  for (const [route, candidates] of [...candidatesByRoute].sort(([a], [b]) => a.localeCompare(b))) {
    const selected = selectCanonicalOwner(route, candidates, rewrites);
    if (!selected.owner) {
      duplicateOwnership.push({
        route,
        canonical: `${domain}${route}`,
        files: candidates.map((candidate) => candidate.file).sort(),
      });
      continue;
    }
    publicationPages.push({
      route,
      canonical: selected.owner.canonical,
      file: selected.owner.file,
      ownershipRule: selected.rule,
      aliasFiles: selected.aliases.map((alias) => alias.file).sort(),
    });
    if (selected.aliases.length) {
      intentionalPhysicalAliases.push({
        route,
        canonical: selected.owner.canonical,
        ownerFile: selected.owner.file,
        aliasFiles: selected.aliases.map((alias) => alias.file).sort(),
        ownershipRule: selected.rule,
      });
    }
  }

  const sitemapEntries = sitemapRoutesFromXml(fs.readFileSync(sitemapPath, "utf8"), domain);
  const sitemapRouteCounts = new Map();
  for (const entry of sitemapEntries) sitemapRouteCounts.set(entry.route, (sitemapRouteCounts.get(entry.route) ?? 0) + 1);
  const sitemapRoutes = [...new Set(sitemapEntries.map((entry) => entry.route))].sort();
  const sitemapDuplicateRoutes = [...sitemapRouteCounts]
    .filter(([, count]) => count > 1)
    .map(([route]) => route)
    .sort();
  const sitemapNonProductionUrls = sitemapEntries
    .filter((entry) => entry.origin !== domain)
    .map((entry) => entry.href)
    .sort();
  const publicationRoutes = publicationPages.map((page) => page.route).sort();
  const publicationSet = new Set(publicationRoutes);
  const sitemapSet = new Set(sitemapRoutes);
  const noindexRoutes = [...new Set(records.filter((record) => record.noindex).map((record) => record.physicalRoute))].sort();
  const redirectOnlyRoutes = [...new Set(records.filter((record) => record.redirectOnly).map((record) => record.physicalRoute))].sort();
  const noindexSet = new Set(noindexRoutes);
  const utilityRoutePolicyIssues = intentionalNoindexUtilityRoutes
    .filter((route) => !noindexSet.has(route))
    .map((route) => ({ code: "utility-route-must-be-noindex", route }));

  const recordsByCanonical = new Map();
  for (const record of records.filter((candidate) => candidate.canonical)) {
    const members = recordsByCanonical.get(record.canonical) ?? [];
    members.push(record);
    recordsByCanonical.set(record.canonical, members);
  }
  const duplicateCanonicals = [...recordsByCanonical]
    .filter(([, members]) => members.length > 1)
    .map(([canonical, members]) => ({
      canonical,
      files: members.map((member) => member.file).sort(),
      robots: Object.fromEntries(members.map((member) => [member.file, member.normalizedRobots])),
    }))
    .sort((a, b) => a.canonical.localeCompare(b.canonical));
  const canonicalRobotsConflicts = [...recordsByCanonical]
    .filter(([, members]) => new Set(members.map((member) => (member.noindex ? "noindex" : "indexable"))).size > 1)
    .map(([canonical, members]) => ({
      canonical,
      files: members.map((member) => ({
        file: member.file,
        physicalRoute: member.physicalRoute,
        robots: member.normalizedRobots,
        redirectOnly: member.redirectOnly,
      })).sort((a, b) => a.file.localeCompare(b.file)),
    }))
    .sort((a, b) => a.canonical.localeCompare(b.canonical));

  const inventory = {
    domain,
    physicalHtmlFiles: records.length,
    physicalIndexableHtmlFiles: records.filter((record) => record.indexable).length,
    sitemapRoutes,
    sitemapDuplicateRoutes,
    sitemapNonProductionUrls,
    publicationRoutes,
    sitemapOmissions: publicationRoutes.filter((route) => !sitemapSet.has(route)),
    sitemapWithoutPublicationCanonical: sitemapRoutes.filter((route) => !publicationSet.has(route)),
    noindexRoutes,
    redirectOnlyRoutes,
    intentionalNoindexUtilityRoutes: [...intentionalNoindexUtilityRoutes],
    utilityRoutePolicyIssues,
    noindexSitemapRoutes: sitemapRoutes.filter((route) => noindexSet.has(route)),
    publicationPages,
    intentionalPhysicalAliases,
    duplicateCanonicals,
    canonicalRobotsConflicts,
    duplicateOwnership,
    missingCanonicalFiles,
    multipleCanonicalFiles,
    invalidCanonicalFiles,
    conflictingRobotsFiles,
    records,
  };
  inventory.blockingIssues = publicationBlockingIssues(inventory);
  return inventory;
}
