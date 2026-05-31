# Migration Preservation Check

Date: 2026-05-26

No redirect or migration files were changed in this task. This document reports current preservation status based on migration docs, Search Console exports and a staging smoke sample.

## Summary

- Redirect matrix rows: `1725`
- Blog migration matrix rows: `20`
- Search Console top target export includes old category, product-category and product-style footprint.
- New staging sitemap exposes production-domain URLs and contains `1730` URLs in the sampled fetch.
- Staging smoke sample confirms high-value old service/category/product-category paths resolve to relevant new pages.
- Old `/product/...` paths still deserve a product-alias QA pass because some sampled paths show a lightweight `Redirecting...` page rather than a clean visible final product URL in the basic fetch.

## URL Group Check

| Old URL / group | New target | Redirect status | Target page quality | Keyword intent preserved? | Notes |
| --- | --- | --- | --- | --- | --- |
| `/` | `/` | Matrix mapped | Strong | Yes | New homepage is stronger for conversion and local service/product routing. |
| `/hybrid/` | `/hybrid-flooring-sydney/` | Staging resolves to target | Strong | Yes | Category intent preserved. |
| `/laminate/` | `/laminate-flooring-sydney/` | Staging resolves to target | Strong | Yes | Category intent preserved. |
| `/engineered-timber-flooring/` | `/engineered-timber-flooring-sydney/` | Staging resolves to target | Strong | Yes | Old category/service hybrid intent preserved. |
| `/solid-timber/` | `/solid-timber-flooring-sydney/` | Staging resolves to target | Acceptable | Yes | Page could use more project proof and species comparison content. |
| `/vinyl/` | `/vinyl-flooring-sydney/` | Staging resolves to target | Acceptable | Yes | Page has fewer ranges than other categories but intent is preserved. |
| `/bamboo/` | `/bamboo-flooring-sydney/` | Staging resolves to target | Acceptable | Yes | Honest availability/alternatives page is safer than showing discontinued bamboo products. |
| `/floor-levelling/` | `/floor-levelling-sydney/` | Staging resolves to target | Strong | Yes | High-intent service preserved. |
| `/timber-floor-installation/` | `/timber-flooring-installation-sydney/` | Staging resolves to target | Strong | Yes | High-intent service preserved. |
| `/timber-floor-removal-and-stripping/` | `/timber-floor-removal-and-stripping-sydney/` | Staging resolves to target | Strong | Yes | Service intent preserved. |
| `/timber-floor-sanding-and-polishing/` | `/timber-floor-sanding-and-polishing-sydney/` | Staging resolves to target | Strong | Yes | Service intent preserved. |
| `/commercial-flooring/` | `/commercial-flooring-sydney/` | Staging resolves to target | Strong | Yes | Commercial intent preserved. |
| `/office-flooring/` | `/office-flooring-sydney/` | Staging resolves to target | Strong | Yes | Office-specific intent preserved. |
| `/blogs/` | `/guides/` | Staging resolves to target | Strong hub | Yes | Individual old blog posts are mapped in `BLOG_MIGRATION_MATRIX.csv`. |
| old root-level blog posts | `/guides/[slug]/` | Matrix mapped | Mostly strong | Yes | 20 migrated guide rows recorded as full copied. |
| `/product-category/hybrid/` | `/hybrid-flooring-sydney/` | Matrix mapped | Strong | Yes | Category archive intent preserved. |
| `/product-category/laminate/` | `/laminate-flooring-sydney/` | Matrix mapped | Strong | Yes | Category archive intent preserved. |
| `/product-category/engineered-timber/` | `/engineered-timber-flooring-sydney/` | Matrix mapped | Strong | Yes | Category archive intent preserved. |
| `/product-category/solid-timber/` | `/solid-timber-flooring-sydney/` | Matrix mapped | Acceptable | Yes | Continue enriching solid timber proof/species content. |
| `/product-category/vinyl/` | `/vinyl-flooring-sydney/` | Matrix mapped | Acceptable | Yes | Continue enriching vinyl range coverage. |
| `/product-category/bamboo/` | `/bamboo-flooring-sydney/` | Matrix mapped | Acceptable | Yes | Good discontinued/legacy handling. |
| `/product-category/laminate/villeroy-boch-aquastop-10mm/` | `/ranges/villeroy-boch-aquastop-10mm/` | Staging resolves to target | Acceptable | Yes | Priority enrichment candidate. |
| `/product-category/hybrid/artisan-hybrid-tile/` | `/ranges/artisan-tile/` | Staging resolves to target | Page 1 candidate | Yes | Pilot page is the strongest range model. |
| `/product-category/engineered-timber/artisan-oak/` | `/ranges/artisan-oak/` | Staging resolves to target | Acceptable | Yes | Needs enrichment if old URL has value. |
| `/product-category/hybrid/storm-luxury-hybrid-planks/` | `/ranges/storm-luxury/` | Staging resolves to target | Acceptable | Yes | Needs Topdeck-style data enrichment. |
| old `/product/[product]/` URLs | `/products/[product]/` or parent range | Matrix has many mappings | Mixed | Mostly | Product alias QA remains the biggest long-tail preservation check. |

## Product Alias Risk Note

Sampled old product URLs:

- `/product/eco-eco-swish-laminate-new-england-blackbutt/`
- `/product/eco-eco-swish-laminate-nutmeg/`
- `/product/eco-eco-swish-oak-contemporary-elegant-milano-oak/`

returned a `Redirecting...` page in the simple staging fetch. That is better than the earlier 404 state, but before final production cutover these should be rechecked with browser/devtools or a redirect crawler to confirm Googlebot sees a clean `301 -> 200` chain to the final product or range target.

## Migration Preservation Verdict

The main old service, category, blog and product-category range footprint is protected. The remaining preservation risk is long-tail product alias behaviour and later duplicate/canonical cleanup for older alias ranges.
