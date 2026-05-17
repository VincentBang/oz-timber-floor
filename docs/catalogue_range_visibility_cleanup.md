# Catalogue Range Visibility Cleanup

Date: 2026-05-16

## Decision

The ranges listed in this audit were reviewed because several appeared in the public range library without thumbnails or colour photos.

The pattern is mixed:

- Some are legacy Oz / old-site imported SEO range pages with incomplete images.
- Some are broad duplicate groupings that overlap with cleaner supplier-backed pages already in the catalogue.
- Some are valid supplier-backed ranges, but only part of the local colour image set has been matched.

We should not delete these pages automatically. Older URLs may still hold search value, backlinks, internal history or migration value. The safer fix is:

1. Keep old range and product URLs live.
2. Hide weak duplicate range cards from the public `/ranges/` library.
3. Promote the cleaner supplier-backed or exact-image range pages.
4. Add exact local images only where the colour match is clear.
5. Leave unknown colour images as coming soon rather than using the wrong image.

## Hidden From Main Range Library

These pages remain available, but were removed from the main `/ranges/` browsing list because they are broad, duplicated or image-incomplete.

| Range | Reason | Preferred visible page |
| --- | --- | --- |
| Artisan | Broad legacy grouping overlaps with verified Artisan Tile. | `/ranges/artisan-tile/` |
| ETF Hybrid SPC 9mm | Legacy 9mm grouping overlaps with current ETF 9.0mm Hybrid. | `/ranges/etf-9-0mm-hybrid/` |
| Luxury Hybrid | Broad grouping overlaps with thickness-specific Luxury Hybrid pages. | `/ranges/luxury-hybrid-7mm/`, `/ranges/luxury-hybrid-8mm/`, `/ranges/luxury-hybrid-9mm/`, `/ranges/luxury-hybrid-plus-10mm/` |
| Ornato | Legacy hybrid-style grouping conflicts with verified Ornato vinyl/luxury page. | `/ranges/ornato-vinyl/` |
| Ornato Hybrid | Legacy hybrid-style grouping conflicts with verified Ornato vinyl/luxury page. | `/ranges/ornato-vinyl/` |
| Stone Floor | Broad legacy grouping lacks exact local images. | `/ranges/stone-floor-tile/`, `/ranges/stone-floor-marble/` |
| Storm | Broad legacy grouping overlaps with Storm Luxury. | `/ranges/storm-luxury/` |
| Infinite | Legacy laminate range lacks a verified local image set. | Laminate category and verified laminate ranges |
| Reflections | Legacy laminate range lacks a verified local image set. | Laminate category and verified laminate ranges |
| Swish Aquastop | Broad legacy grouping overlaps with Swish Laminate Aqua. | `/ranges/swish-laminate-aqua/` |
| Villeroy & Boch Aquastop | Broad grouping overlaps with cleaner thickness-led pages. | `/ranges/villeroy-boch-aquastop-8mm/`, `/ranges/villeroy-boch-aquastop-10mm/`, `/ranges/villeroy-boch-aquastop-12mm/` |
| Swish Oak | Broad engineered timber grouping overlaps with specific Swish Oak pages. | `/ranges/swish-oak-natura/`, `/ranges/swish-oak-contemporary/`, `/ranges/swish-oak-wideboard/` |

## Kept Visible And Improved

These ranges should remain visible because they are useful customer catalogue entries and now have at least a verified local thumbnail.

| Range | Image status | Notes |
| --- | --- | --- |
| Aspire | Partial image set | Matched 5 exact colour swatches from local supplier-image folders. Other colours remain coming soon. |
| Kronoswiss Aquastop | Partial image set | Matched 10 exact colour swatches from local laminate folders. Other colours remain coming soon. |
| Oakleaf | Partial image set | Matched 7 exact colour swatches from local Preference Floors folders. Other colours remain coming soon. |
| Classic Laminate | Partial image set | Matched 6 exact colour swatches from local Preference Floors folders. Other colours remain coming soon. |
| Pronto | Single-colour image set | Matched Herringbone Misty Cove. Other colours remain coming soon until verified images are available. |

## Implemented Page Cleanup

- `/ranges/` now hides the broad legacy/duplicate range cards listed above.
- Related-range cards pointing to those hidden legacy pages were removed from range pages, while the pages themselves remain live.
- Visible colour grids for Aspire, Kronoswiss Aquastop, Oakleaf, Classic Laminate and Pronto now show only colours with matched local photos.
- Product detail pages for matched colours now use the matched local image in the main product gallery.
- Related colour sections on those product pages now only show photographed colours from the same range.

Matched visible colour counts:

| Range | Photographed colours now shown |
| --- | ---: |
| Aspire | 5 |
| Kronoswiss Aquastop | 10 |
| Oakleaf | 7 |
| Classic Laminate | 6 |
| Pronto | 1 |

## SEO Handling

Do not delete the old pages yet.

For SEO, the current safest approach is to keep legacy pages live but remove weak duplicate cards from the customer browsing path. This avoids broken URLs and avoids suddenly removing old keyword landing pages.

If Vincent later confirms the duplicate pages have no unique SEO value, the next step should be a controlled consolidation:

- choose one preferred page per duplicated topic,
- add 301 redirects from weak duplicates to the preferred page,
- update sitemap entries,
- update internal links,
- monitor Search Console after deployment.

## Remaining Manual Review

- Confirm whether Aspire is still an active range and whether the missing colours are still offered.
- Confirm whether Infinite and Reflections should remain indexable or be redirected later.
- Confirm exact supplier status for broad Villeroy & Boch Aquastop versus the 8mm / 10mm / 12mm pages.
- Complete supplier-source image matching for remaining Pronto, Oakleaf, Classic Laminate, Kronoswiss Aquastop and Aspire colours.
