# Preference Floors Category Cleanup

Date: 2026-05-16

## Source Checks

- Preference Floors `Timber Flooring` source lists engineered hardwood ranges including Hardwood Collection, Fiddleback Australian Hardwood, Prestige Oak, Pronto Engineered Oak Flooring, Select Australian Timber and Village Oak.
- Preference Floors `Oakleaf Laminate` source lists Oakleaf under Laminate Flooring.
- Preference Floors `Preference Classic Laminate` is treated as Laminate.

## High-Confidence Fixes

- Reclassified `Hardwood Collection` from local `Solid timber` to `Engineered timber` because the supplier source describes engineered hardwood planks.
- Preserved existing `/ranges/hardwood-collection/` and `/products/hardwood-collection-*` URLs.
- Moved local Hardwood Collection images from `assets/products/solid/hardwood-collection/` to `assets/products/engineered-timber/hardwood-collection/`.
- Moved messy imported Preference-style asset folders out of `assets/products/solid/`:
  - Prestige Oak and Pronto moved to `assets/products/engineered-timber/`.
  - Oakleaf, Classic Laminate, Kronoswiss Aquastop and Villeroy & Boch Aquastop moved to `assets/products/laminate/`.
  - Aspire, Hybrid and Hydroplank WPC moved to `assets/products/hybrid/`.
- Updated public asset references from the old `solid` paths to category-appropriate paths.
- Added `Preference Floors` as a supplier record in central catalogue data for internal traceability.

## Remaining Review

- Hardwood Collection duplicate naming patterns were cleaned on the range page and individual colour pages. Other generated ranges may still need a later naming pass.
- Some older generated range cards still need image-by-image supplier verification before replacing swatches.
- Solid timber now has fewer confirmed local image assets after moving misfiled Preference assets out of `solid`.

## Final QA

- `data/product-catalogue.json` parses successfully.
- Checked key public pages and catalogue data for missing local asset references; no missing references found in the sampled files.
- No remaining public references to `/assets/products/solid/hardwood-collection/`, `/assets/products/solid/collection-assets/` or `/assets/products/solid/floors/` were found outside audit docs.
- `assets/products/solid/` is now empty after moving misfiled supplier assets.
