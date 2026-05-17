import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const DATA_PATH = path.join(ROOT, "data/product-catalogue.json");
const REPORT_PATH = path.join(ROOT, "docs/supplier_gallery_photo_audit.md");
const PUBLIC_HOST = "https://oztimberfloor.com.au";
const IMAGE_EXTENSIONS = new Set([".webp", ".jpg", ".jpeg", ".png"]);

const slugify = (value = "") =>
  String(value)
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const stripProductSlug = (value = "") =>
  String(value).replace(/^\/products\//, "").replace(/\/$/, "");

const toAbs = (urlPath = "") => path.join(ROOT, urlPath.replace(/^\//, ""));
const toUrlPath = (absPath) => `/${path.relative(ROOT, absPath).split(path.sep).join("/")}`;

const imageRole = (file) => {
  const name = path.basename(file).toLowerCase();
  if (name.includes("-room-") || name.includes("-installed-")) return "room";
  if (name.includes("-closeup") || name.includes("-close-up")) return "closeup";
  if (name.includes("-board") || name.includes("-plank")) return "board";
  if (name.includes("-lifestyle")) return "lifestyle";
  if (name.includes("-gallery-")) return "gallery";
  return "swatch";
};

const imageSort = (a, b, primaryBase) => {
  const roleOrder = { swatch: 0, gallery: 1, room: 2, closeup: 3, board: 4, lifestyle: 5 };
  const aBase = path.basename(a, path.extname(a));
  const bBase = path.basename(b, path.extname(b));
  if (aBase === primaryBase) return -1;
  if (bBase === primaryBase) return 1;
  const roleDiff = (roleOrder[imageRole(a)] ?? 9) - (roleOrder[imageRole(b)] ?? 9);
  if (roleDiff) return roleDiff;
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" });
};

const altFor = (product, role) => {
  const range = product.range || product.rangeName || "";
  const colour = product.colour || product.color || "";
  const category = String(product.category || "").toLowerCase();
  const prefix = `${range} ${colour} ${category} flooring`.replace(/\s+/g, " ").trim();
  if (role === "room" || role === "lifestyle") return `${prefix} installed room example`;
  if (role === "closeup") return `${prefix} plank close-up`;
  if (role === "board") return `${prefix} board detail`;
  if (role === "gallery") return `${prefix} product photo`;
  return `${prefix} colour swatch`;
};

const htmlEscape = (value = "") =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

const buildGalleryHtml = (gallery) => {
  const figures = gallery
    .map((item, index) => {
      const primaryClass = index === 0 ? " primary" : "";
      return `<figure class="catalogue-gallery-item${primaryClass}"><img src="${htmlEscape(item.src)}" alt="${htmlEscape(item.alt)}" loading="lazy" decoding="async"></figure>`;
    })
    .join("");
  return `<div class="catalogue-gallery">${figures}</div>`;
};

const updateProductPageGallery = (product, gallery) => {
  const slug = stripProductSlug(product.slug || product.id || "");
  if (!slug) return { updated: false, reason: "missing slug" };
  const htmlPath = path.join(ROOT, "products", slug, "index.html");
  if (!fs.existsSync(htmlPath)) return { updated: false, reason: "page missing" };

  const html = fs.readFileSync(htmlPath, "utf8");
  const start = html.indexOf('<div class="catalogue-gallery">');
  const marker = "</div></div></section><section class=\"section soft catalogue-specs\">";
  const end = start >= 0 ? html.indexOf(marker, start) : -1;
  if (start < 0 || end < 0) return { updated: false, reason: "gallery marker not found" };

  let next = `${html.slice(0, start)}${buildGalleryHtml(gallery)}</div></section><section class=\"section soft catalogue-specs\">${html.slice(end + marker.length)}`;

  const imageArray = gallery.map((item) => `${PUBLIC_HOST}${item.src}`);
  next = next.replace(
    /"image":\[[^\]]*\]/,
    `"image":${JSON.stringify(imageArray)}`
  );

  if (next !== html) {
    fs.writeFileSync(htmlPath, next);
    return { updated: true, path: path.relative(ROOT, htmlPath) };
  }
  return { updated: false, reason: "no change" };
};

const data = JSON.parse(fs.readFileSync(DATA_PATH, "utf8"));
const products = data.products || [];
const changedProducts = [];
const matchedProducts = [];
const unchangedWithExtras = [];
const missingPages = [];
const suspiciousUnmatchedFiles = [];

for (const product of products) {
  const primary = product.primaryImage || product.image || "";
  if (!primary.startsWith("/assets/products/") || primary.includes("coming-soon")) continue;

  const primaryAbs = toAbs(primary);
  if (!fs.existsSync(primaryAbs)) continue;

  const dir = path.dirname(primaryAbs);
  const ext = path.extname(primaryAbs);
  const primaryBase = path.basename(primaryAbs, ext);
  const baseNoSwatch = primaryBase.replace(/-swatch$/, "");
  const productSlug = stripProductSlug(product.slug || product.id || "");
  const colourSlug = slugify(product.colour || product.color || product.name || "");
  const exactPrefixes = [...new Set([primaryBase, baseNoSwatch, productSlug, colourSlug].filter(Boolean))];

  const files = fs
    .readdirSync(dir)
    .filter((file) => IMAGE_EXTENSIONS.has(path.extname(file).toLowerCase()))
    .filter((file) => {
      const base = path.basename(file, path.extname(file));
      return exactPrefixes.some((prefix) => {
        if (base === prefix) return true;
        return (
          base.startsWith(`${prefix}-gallery-`) ||
          base.startsWith(`${prefix}-room-`) ||
          base.startsWith(`${prefix}-closeup`) ||
          base.startsWith(`${prefix}-close-up`) ||
          base.startsWith(`${prefix}-board`) ||
          base.startsWith(`${prefix}-plank`) ||
          base.startsWith(`${prefix}-lifestyle`)
        );
      });
    })
    .map((file) => path.join(dir, file))
    .sort((a, b) => imageSort(a, b, primaryBase));

  if (files.length <= 1) continue;

  const gallery = files.map((file) => {
    const role = imageRole(file);
    return {
      src: toUrlPath(file),
      alt: altFor(product, role),
      role,
      sourceUrl: product.sourceUrl || product.supplierSourceUrl || ""
    };
  });

  matchedProducts.push({
    slug: productSlug,
    range: product.range || product.rangeName || "",
    colour: product.colour || product.color || "",
    category: product.category || "",
    galleryCount: gallery.length
  });

  const before = JSON.stringify(product.imageGallery || []);
  product.imageGallery = gallery;
  product.primaryImage = gallery[0].src;
  product.altText = gallery[0].alt;
  product.galleryStatus = "multi-image-gallery";
  const pageResult = updateProductPageGallery(product, gallery);

  if (before !== JSON.stringify(gallery) || pageResult.updated) {
    changedProducts.push({
      slug: productSlug,
      range: product.range || product.rangeName || "",
      colour: product.colour || product.color || "",
      category: product.category || "",
      galleryCount: gallery.length,
      page: pageResult.path || pageResult.reason
    });
  } else {
    unchangedWithExtras.push(productSlug);
  }
  if (!pageResult.updated && pageResult.reason && pageResult.reason !== "no change") {
    missingPages.push({ slug: productSlug, reason: pageResult.reason });
  }
}

for (const dir of new Set(
  products
    .map((product) => product.primaryImage || "")
    .filter((primary) => primary.startsWith("/assets/products/") && !primary.includes("coming-soon"))
    .map((primary) => path.dirname(toAbs(primary)))
)) {
  for (const file of fs.readdirSync(dir).filter((file) => file.includes("gallery-") && IMAGE_EXTENSIONS.has(path.extname(file).toLowerCase()))) {
    const abs = path.join(dir, file);
    const used = products.some((product) => (product.imageGallery || []).some((item) => toAbs(item.src) === abs));
    if (!used) suspiciousUnmatchedFiles.push(path.relative(ROOT, abs));
  }
}

fs.writeFileSync(DATA_PATH, `${JSON.stringify(data, null, 2)}\n`);

const byRange = matchedProducts.reduce((acc, item) => {
  const key = `${item.range || "Unknown range"} (${item.category || "Unknown category"})`;
  acc[key] = (acc[key] || 0) + 1;
  return acc;
}, {});

const productsWithMultiGallery = products.filter((product) => (product.imageGallery || []).length > 1).length;
const productsWithSingleGallery = products.filter((product) => (product.imageGallery || []).length === 1).length;
const productsWithNoGallery = products.filter((product) => !(product.imageGallery || []).length).length;
const matchedProductPages = matchedProducts.filter((item) =>
  fs.existsSync(path.join(ROOT, "products", item.slug, "index.html"))
).length;

const report = `# Supplier Gallery Photo Audit

Date: 2026-05-17

## Scope

- Operon Flooring files were inspected only as a reference for gallery behaviour. No Operon files were modified.
- This pass only used local Oz Timber Floor image assets already stored under \`assets/products/\`.
- Images were matched only when they lived in the same product asset folder and had an exact same-colour filename prefix, such as \`colour.webp\`, \`colour-gallery-2.webp\`, \`colour-room-01.webp\`, \`colour-closeup.webp\`, or \`colour-board.webp\`.
- No supplier image was hotlinked. No new product specs were invented.

## Result

- Products with exact local multi-image gallery matches: ${matchedProducts.length}
- Product pages now carrying matched multi-image gallery markup: ${matchedProductPages}
- Ranges touched by local exact-image matches: ${Object.keys(byRange).length}
- Unmatched local gallery files requiring manual source/name review: ${suspiciousUnmatchedFiles.length}
- Catalogue products now with multi-image galleries: ${productsWithMultiGallery}
- Catalogue products still single-image only: ${productsWithSingleGallery}
- Catalogue products still missing gallery data: ${productsWithNoGallery}

## Updated Products By Range

${Object.entries(byRange)
  .sort((a, b) => a[0].localeCompare(b[0]))
  .map(([range, count]) => `- ${range}: ${count} products`)
  .join("\n") || "- None"}

## Products Updated

${matchedProducts
  .slice(0, 260)
  .map((item) => `- ${item.slug}: ${item.galleryCount} images (${item.range}, ${item.category})`)
  .join("\n") || "- None"}
${matchedProducts.length > 260 ? `\n- ... ${matchedProducts.length - 260} more products updated.` : ""}

## Unmatched Gallery Files

These files look like additional colour photos, but they did not match an existing product primary image prefix exactly. They should be checked against the supplier site before use. Common reasons include old typo filenames, renamed colours, retired ranges or duplicate legacy imports.

${suspiciousUnmatchedFiles
  .slice(0, 220)
  .map((file) => `- ${file}`)
  .join("\n") || "- None"}
${suspiciousUnmatchedFiles.length > 220 ? `\n- ... ${suspiciousUnmatchedFiles.length - 220} more unmatched files.` : ""}

## Remaining Work

- Crawl the supplier source pages range by range before importing any missing images that are not already local.
- For products still using \`image-coming-soon.svg\`, do not substitute generic or similar-looking images.
- Review typo pairs such as Calacatta/Calcatta and Crema Marfil/Grema Marfil against the official supplier spelling before renaming assets.
`;

fs.writeFileSync(REPORT_PATH, report);

console.log(JSON.stringify({
  changedProducts: changedProducts.length,
  matchedProducts: matchedProducts.length,
  pagesUpdated: changedProducts.filter((item) => item.page && item.page.endsWith("/index.html")).length,
  rangesTouched: Object.keys(byRange).length,
  suspiciousUnmatchedFiles: suspiciousUnmatchedFiles.length,
  missingPages: missingPages.length,
  report: path.relative(ROOT, REPORT_PATH)
}, null, 2));
