import fs from "node:fs";

const files = fs
  .readdirSync(".", { recursive: true })
  .filter((file) => file.endsWith(".html") && !file.startsWith(".git/"));

const brand =
  '<a class="brand" href="/" aria-label="Oz Timber Floor home"><img class="brand-logo" src="/assets/brand/oz-timber-floor-logo.webp" alt="Oz Timber Floor" width="680" height="215"><span class="brand-fallback">Oz Timber Floor<small>Sydney Flooring Contractor</small></span></a>';

const footerStart =
  '<footer class="site-footer"><div class="shell footer-grid"><div><img class="footer-brand-logo" src="/assets/brand/oz-timber-floor-logo.webp" alt="Oz Timber Floor" width="680" height="215"><p>Sydney timber flooring supplier, installer, builder flooring contractor and floor preparation specialist.</p>';

let changed = 0;

for (const file of files) {
  const before = fs.readFileSync(file, "utf8");
  let html = before;

  html = html.replace(
    /<a class="brand" href="\/" aria-label="Oz Timber Floor home">[\s\S]*?<\/a>(?=<nav class="nav-links")/g,
    brand,
  );

  html = html.replace(
    /<a href="\/products\/"([^>]*)>Products<\/a>(?!<a href="\/ranges\/")/g,
    '<a href="/products/"$1>Products</a><a href="/ranges/">Ranges</a>',
  );

  html = html.replace(
    /<footer class="site-footer"><div class="shell footer-grid"><div><h3>Oz Timber Floor<\/h3><p>Sydney timber flooring supplier, installer, builder flooring contractor and floor preparation specialist\.<\/p>/g,
    footerStart,
  );

  html = html.replace(
    /supply-only or install , and timing/g,
    "supply-only or installation preference, and timing",
  );

  if (html !== before) {
    fs.writeFileSync(file, html);
    changed += 1;
  }
}

console.log(`html header/footer refreshed ${changed} files`);
