# Oz Timber Floor Launch Checklist

## Completed In Static Rebuild
- Clean static pages exist for core services, categories, guides, projects, FAQs, contact, privacy and thank-you.
- 20 guide pages and priority service/category pages have launch-quality customer copy.
- Product and range pages use enquiry CTAs for supply price, supply + install, stock checks and product questions.
- Old range/category redirects map to relevant range/category pages where possible.
- Contact form has Netlify Forms-compatible markup, honeypot, thank-you action and consent wording.
- Approved contact details are managed through editable constants in /assets/contact-config.js.
- Approved contact inbox is info@oztimberfloor.com.au and the form is marked for Netlify Forms handling.
- Local crawl found no broken internal links or missing redirect targets.
- robots.txt allows crawling and references https://oztimberfloor.com.au/sitemap.xml.
- sitemap.xml includes core pages, service pages, product/category pages, range pages and product detail pages.
- GA4-ready tracking hooks are in /assets/site.js for phone clicks, email clicks and form submits.
- Expanded supplier catalogue exports are available at /data/supplier-catalogue.csv and /data/supplier-ranges.csv.
- Old WordPress URL export is available at /migration/old-wordpress-url-export.csv.
- Domain deployment path is documented at /migration/domain-deployment-path.md and production deployment is on hold.

## Production Gate Audit - 2026-05-14
- Placeholder/protected-term scan: pass.
- Internal links: pass across 548 HTML files.
- Sitemap targets: pass across 523 sitemap URLs.
- Redirect targets: pass across 555 redirect rules.
- Contact form fields: pass for enquiry type, source page, product, suburb, phone, email and message.
- Contact fallback: pass with visible phone and email actions rendered from /assets/contact-config.js.

## Manual Checks Still Required
- Confirm showroom/address wording in /assets/contact-config.js.
- Add the approved GA4 measurement ID to /assets/contact-config.js, then confirm call click, email click and form submit events in GA4 DebugView.
- Log in to the Oz Netlify project and verify form notification routing.
- Submit a staging enquiry and confirm captured fields: enquiry type, source page, product, suburb, phone, email and message.
- Review top product pages for final supplier specs, current stock ranges, discontinued products and preferred alternatives.
- Review redirects against Google Search Console top linked pages, then submit sitemap.xml after deployment.
- Export Search Console top linked pages after domain verification and compare them against /migration/redirect-map.csv.
- Complete final business owner review of phone, address, product ranges, service claims and project proof before DNS cutover.
