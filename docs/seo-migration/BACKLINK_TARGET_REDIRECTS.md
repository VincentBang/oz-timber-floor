# Backlink Target Redirects

The Search Console source folder has now been restored, but the available link exports still have one limitation:
- they list sample linking pages
- they do **not** pair each external link with its exact target URL

So this pass prioritises the old URLs most likely to matter based on:
- the restored `Top target pages` internal-link counts
- the restored sample link exports
- migration-critical service, category and range intent

## Priority legacy targets protected

| Old URL | Internal links | New target | Status | Notes |
| --- | ---:| --- | --- | --- |
| `/bamboo/` | 341 | `/bamboo-flooring-sydney/` | Repo fixed, staging stale | New bamboo destination exists; live staging still needs a fresh deploy. |
| `/product-category/laminate/villeroy-boch-aquastop-10mm/` | 342 | `/ranges/villeroy-boch-aquastop-10mm/` | 301 in place | Exact range intent preserved. |
| `/product-category/laminate/infinite-laminate/` | 341 | `/ranges/infinite/` | Repo fixed, staging stale | Staging still resolves to the older alias range. |
| `/product-category/laminate/kronoswiss-aquastop-laminate-12mm/` | 341 | `/ranges/kronoswiss-aquastop-laminate-12mm/` | 301 in place | Exact range preserved. |
| `/product-category/laminate/kronoswiss-aquastop-laminate-14mm/` | 341 | `/ranges/kronoswiss-aquastop-laminate-14mm/` | 301 in place | Exact range preserved. |
| `/product-category/laminate/reflections-laminate/` | 341 | `/ranges/reflections/` | 301 in place | Exact range preserved. |
| `/product-category/laminate/swish-laminate/` | 341 | `/ranges/swish-laminate/` | 301 in place | Exact range preserved. |
| `/product-category/laminate/villeroy-boch-aquastop-8mm/` | 341 | `/ranges/villeroy-boch-aquastop-8mm/` | 301 in place | Exact range preserved. |
| `/product-category/vinyl/ornato-vinyl/` | 341 | `/ranges/ornato-vinyl/` | 301 in place | Exact range preserved. |
| `/product-category/engineered-timber/artisan-oak/` | 340 | `/ranges/artisan-oak/` | 301 in place | Exact range preserved. |
| `/product-category/engineered-timber/grand-oak-14-5mm/` | 340 | `/ranges/grand-oak-14-5mm/` | 301 in place | Exact range preserved. |
| `/product-category/engineered-timber/prestige-oak/` | 340 | `/ranges/prestige-oak/` | Repo fixed, staging stale | Redirect added in this pass after the restored export highlighted the missing target. |
| `/product-category/engineered-timber/prestige-oak-15mm/` | 340 | `/ranges/prestige-oak-15mm/` | 301 in place | Exact range preserved. |
| `/product-category/engineered-timber/prestige-oak-21mm/` | 340 | `/ranges/prestige-oak-21mm/` | 301 in place | Exact range preserved. |
| `/product-category/hybrid/hydroplank-wpc/` | 340 | `/ranges/hydroplank-wpc/` | 301 in place | Exact range preserved. |
| `/product-category/hybrid/ornato-hybrid/` | 340 | `/ranges/ornato-hybrid/` | 301 in place | Exact range preserved. |
| `/product-category/hybrid/stone-floor-timber/` | 340 | `/ranges/stone-floor-timber/` | Repo fixed, staging aligned | Better long-tail match than the broad hybrid category. |
| `/timber-floor-sanding-and-polishing/` | 340 | `/timber-floor-sanding-and-polishing-sydney/` | 301 in place | High-intent service redirect preserved. |
| `/timber-floor-installation/` | 338 | `/timber-flooring-installation-sydney/` | 301 in place | High-intent service redirect preserved. |
| `/office-flooring/` | 338 | `/office-flooring-sydney/` | 301 in place | High-intent service redirect preserved. |

## Remaining limitation

The restored link exports are enough to prioritise the migration work properly, but they still do not tell us which exact old URLs the external sample links point to. If a target-paired backlink export appears later, this document should be refreshed one more time. 
