# Migration-Safe Site Audit - 2026-05-29

## Scope

This pass checked the Oz Timber Floor static site for bugs, migration risks, image issues, supplier-link leakage and SEO-critical metadata without changing redirects, sitemap, robots, canonicals or pricing/enquiry logic.

## Checks Completed

- Sitemap audit: 1,730 sitemap URLs checked.
- Canonical audit: sitemap pages match `https://oztimberfloor.com.au/`.
- Metadata audit: sitemap pages have title, meta description, canonical and H1.
- Redirect static audit: no missing redirect targets and no redirect loops found.
- Image/link audit: no broken local image or internal file references found after fixes.
- Placeholder audit: no public `image-coming-soon`, `coming-soon` image path or placeholder image reference remains.
- Supplier outbound-link audit: no public range-page links remain to Topdeck, Bass Timber, Eco Flooring, HRT, Preference Floors or Shopify CDN supplier documents.
- Browser spot-check: `/products/`, `/engineered-timber-flooring-sydney/`, `/ranges/artisan-tile/`, `/ranges/avala/`, one guide page and `/contact/` rendered without horizontal overflow, supplier outbound links or visible placeholder text.

## Fixes Applied

- Replaced supplier/CDN document links on range pages with Oz Timber Floor contact/support enquiry links.
- Reworded public range support sections away from supplier-document language toward Oz-managed product information and project support.
- Replaced one old absolute WordPress service link with the current local installation service URL.
- Localised 24 old WordPress guide images into `assets/guides/legacy-wp/` and updated guide pages to use local assets. This prevents guide images from depending on the old WordPress `/wp-content/uploads/` folder after migration.
- Added missing useful copy to the engineered oak guide page that previously had empty description/lead content.

## Remaining Migration Notes

- The three 301 chains for legacy Prestige Oak and Pronto URLs have been resolved so the old product-category URLs now point directly to their final canonical range targets.
- Redirect static audit now reports no missing redirect targets, no redirect loops and no 301 chains.

## Remaining Content / Catalogue Notes

- The legacy bamboo landing page remains intentionally visible as a search-intent and availability/alternatives page, not as a visible bamboo product catalogue.
- Some guide content still references bamboo as part of old educational comparison content. If the business wants a stricter public bamboo-removal policy, those guide sections should be rewritten or removed in a separate content pass.
- A broader duplicate range identity pass is still recommended after supplier/category mapping stabilises.

## Migration-Safe Verdict

The checked static site surfaces are stronger after this pass. The most important remaining cleanup is ongoing duplicate/canonical range identity work across old alias ranges.
