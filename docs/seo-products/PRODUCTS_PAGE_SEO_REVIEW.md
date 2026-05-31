# Products Page SEO Review

Date: 2026-05-26

Scope: `/products/` only. Redirects, `netlify.toml`, sitemap, robots, canonicals and migration URL mappings were not edited.

## Current Audit

| Item | Result |
| --- | --- |
| Live staging title before update | `Flooring Products Sydney \| Oz Timber Floor` |
| Updated local title | `Flooring Products Sydney \| Hybrid, Laminate, Timber & Vinyl \| Oz Timber Floor` |
| Live staging meta before update | `Browse hybrid, laminate, engineered timber, solid timber and vinyl flooring ranges by category, range and colour. Send supply, stock or installation enquiries.` |
| Updated local meta | `Browse flooring products in Sydney by category, range and colour. Compare hybrid, laminate, engineered timber, solid timber and vinyl, then request stock, supply or installation support.` |
| Canonical | `https://oztimberfloor.com.au/products/` preserved |
| Robots | `index,follow` preserved |
| H1 | `Browse flooring products by type, range and colour` |
| Image alt text | Present on all `/products/` images |
| Internal links | Category, supplier-intent, selected range, selected product, service, project and contact pathways present |
| Mobile layout risk | Uses existing responsive grid classes; no new CSS required |

The old WordPress `/products/` page currently exposes a simpler `Products - Oz Timber Floor` title with little visible metadata depth. The new page is stronger as a routing hub and should not be expanded into a full catalogue dump.

## Current Strengths

- Clear page role: choose flooring type, then range, then colour/product enquiry.
- Canonical already points to the final production domain.
- The page links to major category pages rather than competing with them.
- Popular ranges and sample colours are capped and remain curated.
- Enquiry CTAs support stock, supply-only and supply + install pathways without checkout or instant pricing.

## Keyword Opportunities

- Broad hub terms: flooring products Sydney, flooring supplier Sydney, timber flooring products Sydney, flooring ranges Sydney.
- Category modifiers: hybrid flooring, laminate flooring, engineered timber, solid timber, vinyl flooring.
- Conversion modifiers: stock check, supply-only, supply and installation, lead time, flooring supplier.

The update adds these signals naturally through page title, meta description, concise usage guidance, category cards and lower supplier-intent links.

## Migration Risks

- `/products/` should not become the redirect target for valuable old product-category and range URLs.
- Old category URLs should continue to map to category pages:
  - `/hybrid/` -> `/hybrid-flooring-sydney/`
  - `/laminate/` -> `/laminate-flooring-sydney/`
  - `/solid-timber/` -> `/solid-timber-flooring-sydney/`
  - `/vinyl/` -> `/vinyl-flooring-sydney/`
  - `/bamboo/` -> `/bamboo-flooring-sydney/`
- Old product-category range URLs should continue to map to the closest range page, for example:
  - `/product-category/laminate/villeroy-boch-aquastop-10mm/` -> `/ranges/villeroy-boch-aquastop-10mm/`
  - `/product-category/hybrid/artisan-hybrid-tile/` -> `/ranges/artisan-tile/`
  - `/product-category/engineered-timber/artisan-oak/` -> `/ranges/artisan-oak/`

Review of the existing redirect files/docs found no broad dump of old range/category URLs into `/products/`. No redirect changes were made in this task.

## Internal Link Gaps Found

- The page did not have a short “how to use this guide” explanation.
- Supplier-intent pages were not grouped from `/products/`.
- Project-need routing did not include a direct floor preparation pathway.
- Popular ranges and sample colours were strong but under-represented solid timber and vinyl.
- A short ordering-confirmation trust block was missing before the final CTA.

## Safe Improvements Implemented

- Added a concise `How to use this product guide` section.
- Added a lower `Need supply-only or stock check?` section linking to category supplier pages.
- Added `Floor preparation needed` as a project-need pathway to `/floor-levelling-sydney/`.
- Added a legacy bamboo availability card/link without presenting a live bamboo product catalogue.
- Expanded popular ranges from 6 to 8 cards:
  - 2 hybrid
  - 2 laminate
  - 2 engineered timber
  - 1 solid timber
  - 1 vinyl
- Expanded sample colours from 6 to 8 cards:
  - 2 hybrid
  - 2 laminate
  - 2 engineered timber
  - 1 solid timber
  - 1 vinyl
- Added `Why confirm before ordering?` trust section covering stock, samples, floor condition and supply-only vs installed job details.
- Updated title, meta description and Open Graph copy while preserving canonical.

## Bamboo Handling

Bamboo is treated as a legacy availability enquiry pathway only. The page links to `/bamboo-flooring-sydney/` for current availability and alternatives; it does not show discontinued bamboo products or a bamboo catalogue.

## Technical Safety Checks

- `products.html` section count matches closing section count.
- All images on `/products/` include alt text.
- Local internal links in `/products/` resolve to existing files/pages.
- Local image paths in `/products/` resolve to existing assets.
- No `noindex` was added.
- No Netlify, localhost or Operon canonical/domain was added to the products page SEO metadata.

## Recommended Next Steps

- After deploy, spot-check `/products/` in browser on desktop and mobile.
- Re-run redirect smoke tests separately if migration files change in a future task.
- Keep future `/products/` additions curated to 6-8 popular ranges and 6-8 sample colours so `/ranges/` remains the full catalogue route.
