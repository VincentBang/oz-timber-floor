# Oz Timber Floor Domain Deployment Path Status: do not deploy to production yet. ## Intended Production Domain
- Primary domain: `https://oztimberfloor.com.au/`
- Recommended canonical host: apex domain `oztimberfloor.com.au`
- `www.oztimberfloor.com.au` should redirect to the canonical host when DNS and hosting are configured. ## Static Site Publish Root
Use the Oz Timber Floor static folder as the publish root: `apps/oz-timber-floor` This folder contains the production-facing static assets that must be deployed together: - `_redirects`
- `sitemap.xml`
- `robots.txt`
- `404.html`
- clean URL folders such as `/floor-levelling-sydney/index.html`
- product/range URL folders under `/products/` and `/ranges/`
- `assets/contact-config.js`
- `assets/site.js` Do not publish this site from the Operon app root. Oz Timber Floor must remain separate from Operon quote flow, floorplan, quote review, pricing engine, Supabase, Resend and AI/data tooling. ## Netlify Settings
- Base directory: `apps/oz-timber-floor`
- Publish directory: `.`
- Build command: none required for the static export
- Form handler: Netlify Forms via the `oz-flooring-enquiry` form in `/contact/`
- Approved notification inbox: `info@oztimberfloor.com.au` The local `netlify.toml` in this folder sets `publish ="."`. Netlify should be pointed at this folder so `_redirects`, `sitemap.xml` and `robots.txt` are copied to the site root. ## Pre-Launch Hold
Do not switch DNS or deploy the production domain until: - Search Console top linked pages have been exported and compared against `/migration/old-wordpress-url-export.csv`.
- The 301 redirect map has been reviewed against high-value WordPress pages and backlinks.
- Flooring catalogue names, discontinued ranges and available alternatives have had business-owner review.
- A staging form submission has been tested and received at `info@oztimberfloor.com.au`.
- GA4 measurement ID has been added to `/assets/contact-config.js` and call click, email click and form submit events have been verified.
- Final crawl confirms no broken internal links, no missing sitemap targets and no missing redirect targets. ## Launch-Day Checks
- Confirm `https://oztimberfloor.com.au/robots.txt` returns the Oz robots file.
- Confirm `https://oztimberfloor.com.au/sitemap.xml` returns the expanded Oz sitemap.
- Confirm old WordPress service, guide, product-category and product URLs return the intended 301 targets.
- Submit `https://oztimberfloor.com.au/sitemap.xml` in Google Search Console.
- Monitor Search Console coverage, 404s, redirects and top linked pages during the first two weeks.
