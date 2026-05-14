# Oz Timber Floor Final Crawl Report

Generated: 2026-05-14

## Redirect Integrity
- Missing redirect target count: 0.
- Removed the self-redirect from /products/ to /products/.
- Fixed the ten missing parent range targets from the migration audit.
- Remapped broad legacy range URLs away from /products/: /aspire-hybrid/, /luxury-hybrid/, /ornato-hybrid/ and /preference-classic/ now resolve to relevant range pages.
- /sitemap/ now maps to /sitemap.xml.
- Remaining generic catalogue redirects: /shop/ and /product-category/uncategorized/ still point to /products/ because the live URLs do not identify a specific range.

## Content Quality
- Rewrote 20 guide pages using the live WordPress sitemap and REST content as source structure.
- Rewrote priority service pages: services, timber installation, floor levelling, sanding and polishing, removal and stripping, office flooring, commercial flooring, builder contractor.
- Rewrote priority category/supplier pages: laminate, hybrid, engineered timber, solid timber, vinyl, bamboo, hybrid supplier, timber supplier, products.
- Each rewritten guide links to a relevant service page, product/category path and contact enquiry path.

## Contact And Launch Plumbing
- Privacy page: /privacy/.
- Thank-you page: /thank-you/.
- Contact form backend markup: Netlify Forms-compatible form with honeypot and action to /thank-you/.
- Captured fields: enquiry type, source page, product/range, suburb, phone, email, message and consent.
- Contact constants are managed in /assets/contact-config.js.
- Standalone Oz Netlify config added at /netlify.toml inside the Oz site folder.

## Crawl Validation
- HTML files checked: 548.
- Broken local href/src references: 0.
- Relative href/src references: 0.
- Missing redirect targets: 0.
- Pages with missing or multiple H1s: 0.
- Public protected-term/placeholder scan: 0 hits.
- Contact form files found: contact.html and contact/index.html.

## Staging Submission Test
- Local static validation passed for form fields and thank-you action.
- Remote inbox/CRM delivery could not be verified from this workspace because Netlify CLI reports the session is not logged in.
- Before launch, log in to the Oz Netlify project, submit one staging enquiry, and confirm notification routing.
