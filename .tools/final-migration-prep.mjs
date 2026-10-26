import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const auditRoot = "/Users/daibang/Documents/Codex/2026-10-07/referenced-chatgpt-conversation-this-is-an/outputs";
const output = path.join(root, "docs/release/final-migration-2026-10-08");
fs.mkdirSync(output, { recursive: true });

function csvRows(text) {
  const rows = []; let row = []; let field = ""; let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (quoted && char === '"' && text[index + 1] === '"') { field += '"'; index += 1; }
    else if (char === '"') quoted = !quoted;
    else if (char === "," && !quoted) { row.push(field); field = ""; }
    else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && text[index + 1] === "\n") index += 1;
      row.push(field); if (row.some(Boolean)) rows.push(row); row = []; field = "";
    } else field += char;
  }
  if (field || row.length) { row.push(field); rows.push(row); }
  const [header, ...data] = rows;
  return data.map((values) => Object.fromEntries(header.map((key, index) => [key, values[index] || ""])));
}
function value(value) { return /[",\n]/.test(String(value)) ? `"${String(value).replaceAll('"', '""')}"` : String(value); }
function writeCsv(file, columns, rows) {
  fs.writeFileSync(path.join(output, file), `${columns.join(",")}\n${rows.map((row) => columns.map((column) => value(row[column] || "")).join(",")).join("\n")}\n`);
}
const pages = csvRows(fs.readFileSync(path.join(auditRoot, "wordpress-legacy-recheck-2026-10-08.csv"), "utf8"));
const images = csvRows(fs.readFileSync(path.join(auditRoot, "wordpress-image-recheck-2026-10-08.csv"), "utf8"));
const representativeLiveImages = new Set([
  "/wp-content/uploads/2019/10/Swish-Aquastop-Laminate-1-300x300.jpg",
  "/wp-content/uploads/2020/05/AGED-TEAK.jpg",
  "/wp-content/uploads/2020/05/ANTIQUE-BRASS.jpg",
  "/wp-content/uploads/2020/05/solid_hardwood_flooring_nsw_spotted_gum_lifestyle_2.jpg",
]);

writeCsv("migration-url-review.csv", ["Old URL", "Netlify status", "Redirect hops", "Final URL", "Canonical", "Assessment", "Final status"], pages.map((page) => ({
  "Old URL": `https://oztimberfloor.com.au${page.path}`,
  "Netlify status": page.status,
  "Redirect hops": page.redirects,
  "Final URL": page.final_url,
  "Canonical": page.canonical,
  "Assessment": page.status === "410" ? "Approved retirement; retain" : page.status === "200" && Number(page.redirects) <= 1 ? "Accounted for in deployed audit" : "Needs route review",
  "Final status": page.status === "410" ? "APPROVED_RETIREMENT" : page.status === "200" && Number(page.redirects) <= 1 ? "PASS_IN_PROTECTED_AUDIT" : "RECHECK_REQUIRED"
})));

writeCsv("legacy-image-migration.csv", ["Old URL", "Live status", "Proposed action", "Replacement URL", "Evidence of equivalence", "Final status", "Content type", "Redirect hops", "Remaining uncertainty"], images.map((image) => ({
  "Old URL": `https://oztimberfloor.com.au${image.path}`,
  "Live status": representativeLiveImages.has(image.path) ? "200_CONFIRMED_2026-10-08" : "NOT_RECHECKED_IN_THIS_PREPARATION",
  "Proposed action": image.status === "200" ? "PRESERVE_EXISTING_MIGRATED_ASSET" : "PRIORITISE_IF_IMAGE_TRAFFIC_BACKLINK_OR_PRODUCT_RELEVANCE_IS_EVIDENCED",
  "Replacement URL": image.status === "200" ? image.final_url : "",
  "Evidence of equivalence": image.status === "200" ? "Deployed audit found this legacy image URL resolves to migrated asset" : "No asset-equivalence evidence supplied; do not redirect to HTML or unrelated image",
  "Final status": image.status === "200" ? "PRESERVED_IN_PROTECTED_AUDIT" : "UNRESOLVED_NOT_SAFE_TO_BULK_REDIRECT",
  "Content type": representativeLiveImages.has(image.path) ? "WordPress: image/jpeg; Netlify replacement not matched" : image.status === "200" ? "Not independently rechecked in this preparation" : "Not applicable until image destination is matched",
  "Redirect hops": image.redirects,
  "Remaining uncertainty": image.status === "200" ? "Confirm response Content-Type at cutover verification" : "WordPress availability, importance, ownership and same-subject replacement are not yet established"
})));

const common = `# Final migration readiness — 8 October 2026\n\n## Candidate\n\n- Source branch: \`main\`, base commit \`5fecd58f1cfce728047cf27c7659fd6fbee4e2d0\`; current working tree contains approved, uncommitted migration repairs.\n- Protected Netlify deploy: \`6ac6de9bcdf718dd3f8db825\` at \`https://oztimberfloor.netlify.app\`.\n- Reproducible protected package: 6,260 files, SHA-256 \`297cdfdb157ec85930c55496b031599625ebbce7d8491af271b5f67e38607f9a\`.\n- It is deliberately noindex and has GA4 disabled. The production domain is not attached.\n\n## Evidence reconciled\n\nThe independent 8 October audit reports 539 WordPress page URLs: 17 direct 200 responses, 508 one-hop permanent redirects to 200 and 14 approved 410 retirements; no unintended page-route 404 or chain. It reports 772 replacement sitemap URLs, all 200, canonical to the intended production host and staging-noindexed. The local package currently also contains 772 sitemap entries.\n\nThe seven restored articles, Swish/Beach/Kronoswiss/Hardwood corrections, ASPECT display and enquiry-context flow are covered by prior/current regression evidence. Retired Artisan Oak and InnovaKitchens are retained as business decisions; Artisan Oak must not be redirected to Hybrid.\n\n## Material remaining conditions\n\n1. **Legacy images:** 816 WordPress upload URLs were inventoried; 815 are not present on Netlify. They are image assets, not HTML-page failures. No blanket redirect is safe without same-subject asset evidence.\n2. **DNS/mailer evidence:** preserve the current MX records and collect the complete Crazy Domains zone export, including TXT, SPF, DKIM, DMARC and verification records.\n3. **Final authority:** attaching the domain, changing web DNS, enabling production indexing and production GA4 remain separate owner-approved actions.\n\n## Analytics and enquiry policy\n\nThe configured production ID is \`G-EWSMKKM9N8\`. Previews and localhost remain excluded. Production GA4 must initialise only for the canonical production hostname after analytics consent, only once, with query-free page locations and no customer data in event parameters. Map legacy \`Click_to_Call\`, \`Click_to_Email\`, \`Contact_Form\` to replacement \`phone_click\`, \`email_click\`, \`quote_submit\` in GA4 documentation; only \`quote_submit\` is a completed-lead event. Record the cutover date because comparisons with historical totals will change.\n\nNo live enquiry is sent by this preparation. At launch, one authorised test must confirm browser submission, stored Netlify record/spam state, full context fields, inbox receipt and one GA4 \`quote_submit\` receipt; a thank-you screen alone is insufficient.\n`;
fs.writeFileSync(path.join(output, "FINAL_MIGRATION_READINESS.md"), `${common}\n## Verdict\n\n**CONDITIONAL — READY FOR FINAL CUTOVER APPROVAL AFTER DNS-ZONE EXPORT AND IMAGE-PRIORITY DECISION.** Page-route preservation and the protected candidate are strong. The legacy-image cohort and production-only provider actions remain distinct and must not be represented as completed.\n`);
fs.writeFileSync(path.join(output, "FINAL_CUTOVER_PLAN.md"), `${common}\n## Exact cutover sequence\n\n1. Capture the complete Crazy Domains zone and WordPress recovery details immediately before the change.\n2. Add \`oztimberfloor.com.au\` and \`www.oztimberfloor.com.au\` to Netlify site \`fd68e39e-7863-4012-8a97-40bec59b23d9\`; record Netlify's actual DNS targets and TLS validation.\n3. Change only the required web records. Retain MX ` + "`mx10/mx20/mx30.mailspamprotection.com`" + ` and every TXT/mail/verification record.\n4. Verify HTTPS/TLS and canonical apex/www behaviour, then enable the production-only indexing and GA4 workflow with approved ID \`G-EWSMKKM9N8\`.\n5. Verify priority URLs, redirects, sitemap, robots, form storage/inbox delivery and one consented \`quote_submit\`.\n6. Submit/check the production sitemap in Search Console using the already verified property.\n\nNo DNS target is guessed here: use the target values displayed by Netlify after the domain is attached.\n`);
fs.writeFileSync(path.join(output, "ROLLBACK_PLAN.md"), `# Rollback plan — 8 October 2026\n\n## Trigger\n\nImmediately roll back for failed SSL, wrong website, broken priority routes, failed stored/inbox enquiry delivery, mail disruption, exposure of private content, or unintended production indexing. Do not roll back solely for normal DNS caching or short-term ranking fluctuation.\n\n## Action\n\n1. Restore the pre-cutover web DNS record(s), including current apex A \`35.213.187.160\`, from the captured provider-zone export.\n2. Do not alter MX, SPF, DKIM, DMARC, verification or unrelated records.\n3. Keep WordPress hosting and its database/uploads backup available throughout the observation period.\n4. If the issue is limited to the Netlify package, restore the previously verified Netlify deploy under explicit authorisation; do not use destructive Git operations.\n5. Allow for DNS caching, test from more than one network and document the fault before retrying.\n`);
fs.appendFileSync(path.join(output, "FINAL_MIGRATION_READINESS.md"), "\n## Representative legacy-image availability\n\nFour representative source-image URLs were rechecked on WordPress in this preparation and each returned `200 image/jpeg`: Swish Aquastop Laminate, Aged Teak, Antique Brass and Spotted Gum lifestyle. No same-subject Netlify replacement was assumed for any of them; they remain unresolved in the image inventory.\n");
console.log(JSON.stringify({output, pages: pages.length, images: images.length}, null, 2));
