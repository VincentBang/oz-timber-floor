import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const htmlFiles = [];

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name === ".git" || entry.name === "node_modules") continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await walk(full);
    } else if (entry.isFile() && entry.name.endsWith(".html")) {
      htmlFiles.push(full);
    }
  }
}

const replacements = [
  [
    '<span class="brand-fallback">Oz Timber Floor<small>Sydney Flooring Contractor</small></span>',
    '<span class="brand-fallback">Oz Timber Floor</span>',
  ],
  [
    "Catalogue-commerce only: no checkout, no automated pricing, no quote engine.",
    "Browse flooring ranges, compare colours and send an enquiry for stock, supply price or installation support.",
  ],
  ["Range pages preserved from WordPress", "Popular flooring ranges"],
  [
    "Important product-category URLs are mapped to static range pages, not flattened to the product index.",
    "Each range page includes colours, specifications and enquiry options.",
  ],
  [
    "Review neutral project-proof sections and prepare the site for real case studies and completed work photos.",
    "View flooring project examples, preparation notes and completed work references.",
  ],
  ["Send an enquiry about Flooring Supply Or Installation.", "Send a flooring supply or installation enquiry."],
  ["Warm, practical flooring for homes, builders and commercial spaces", "Sydney timber flooring supply, installation and preparation"],
  [
    "Oz Timber Floor supplies, prepares and installs timber, hybrid, laminate, vinyl and solid timber flooring across Sydney with calm advice and careful site planning.",
    "Oz Timber Floor helps homeowners, builders and commercial teams choose the right flooring, prepare the subfloor and install it properly across Sydney.",
  ],
  ["Compare timber systems", "Compare timber flooring options"],
  ["Floating systems", "Floating installation"],
  ["Direct-stick systems", "Direct-stick installation"],
  ["direct-stick systems", "direct-stick installations"],
  ["same product system", "same flooring option"],
  ["product system", "flooring option"],
  ["Floating Floor (Licensed Click System)", "Floating click installation"],
  ["Licensed Click System", "Licensed click installation"],
  ["Floating click system", "Floating click installation"],
  ["floating click system", "floating click installation"],
  ["Click systems", "Click installation"],
  ["locking systems", "locking joins"],
  ["adhesive systems", "adhesive installation"],
  ["Start with the hardwood system that fits the project", "Start with the hardwood pathway that fits the project"],
  [
    "Oz Timber Floor treats levelling as part of the flooring system, not a last-minute patch.",
    "Oz Timber Floor treats levelling as part of the finished flooring result, not a last-minute patch.",
  ],
  ["approved business systems", "approved business tools"],
  ["flooring systems", "flooring options"],
  ["flooring system", "flooring choice"],
  ["product systems", "product options"],
  ["adhesive system", "adhesive method"],
  ["underlay or adhesive system", "underlay or adhesive method"],
  [
    '<a href="/vinyl-flooring-sydney/">Vinyl</a><a </div>',
    '<a href="/vinyl-flooring-sydney/">Vinyl</a><a href="/-flooring-sydney/"></a></div>',
  ],
];

await walk(root);

let changed = 0;
for (const file of htmlFiles) {
  let html = await readFile(file, "utf8");
  const original = html;
  for (const [from, to] of replacements) {
    html = html.split(from).join(to);
  }
  if (html !== original) {
    await writeFile(file, html);
    changed += 1;
  }
}

console.log(`Updated ${changed} HTML files`);
