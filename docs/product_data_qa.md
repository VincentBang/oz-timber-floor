# Product Data QA

## High-Confidence Fixes Made

- Removed duplicate typo canonical product folders:
  - `products/artisan-calcatta/`
  - `products/artisan-grema-marfil/`
- Preserved typo URL redirects to corrected product pages.
- Removed public supplier names from product enquiry URL parameters and visible product card labels.
- Updated central product policy in `data/product-catalogue.json` so public catalogue pages remain category-led and range-led, with third-party supplier names hidden unless explicitly approved.
- Verified `Ornato Como` against Eco Flooring source as a Vinyl > Ornato Luxury product, not Hybrid.
- Added local WebP images for `Ornato Como` and used them on the product page, range page, ranges index and products hub.
- Added `Ornato Como` as the verified vinyl featured card so the products hub featured mix is 2 hybrid, 2 laminate, 2 engineered timber, 1 solid timber and 1 vinyl.
- Updated `products/ornato-como/` title, meta description, schema category, breadcrumbs, visible category, range label and enquiry parameters from inherited Hybrid data to Vinyl / Ornato Luxury.
- Updated `ranges/ornato-vinyl/` to use local Ornato imagery and show `Ornato Como` as a verified colour instead of a generic colour-list placeholder.

## Product Redirect Model

- Product redirects to exact `/products/*`: 1,439.
- Product/category redirects to `/ranges/*`: 36.
- Product/category redirects to closest category/service page: 27.
- Generic `/products/` product redirect dump: 0.

## Suspected Data Issues Needing Vincent Review

These look like spelling or source-data issues and were flagged instead of silently changing all occurrences:

- `beltimore` likely `baltimore`.
- `blacbutt` likely `blackbutt`.
- `backbutt` likely `blackbutt` in `fiddleback-backbutt-smooth-10-matte`.
- `homstead` likely `homestead`.
- `shefilled` likely `sheffield`.
- `barrnyard` likely `barnyard`.
- `baliness` likely `balinese`.
- `vennice` likely `venice`.
- `madrio` likely `madrid`.
- `verneto` likely `veneto`.
- Several generated product pages still show inherited duplicated naming patterns, such as repeated range/category words in titles or related colour cards. Recommended next pass: regenerate affected pages from corrected catalogue data instead of hand-editing every generated file.
- Some generated pages still have empty or malformed supplier/range metadata in related-card overlines and hidden enquiry parameters, including leading separators and occasional blank brand values. Keep public pages range/category-led, but clean internal hidden values before final catalogue QA.
- Some range index cards appear to use suspicious cross-category swatches, especially vinyl/WPC/laminate cards pointing at solid timber images. These should be checked against supplier source pages before replacing images.
- `Hardwood Collection` currently shows `185 colours`, which is likely an inherited count rather than a customer-useful range count. Needs Vincent/source review before changing.

## Image QA

- No broken local links found.
- Exact product-image accuracy still needs human review for supplier colour matching.
- Some products intentionally use the neutral image-coming-soon asset until exact product imagery is confirmed.
- `Ornato Como` image source verified from Eco Flooring and downloaded locally:
  - `assets/products/vinyl/ornato-como/ornato-como-swatch.webp`
  - `assets/products/vinyl/ornato-como/ornato-como-room.webp`
- Remaining high-risk image QA areas: generated range cards with solid timber swatches used for non-solid categories, and generated Ornato related colour pages that still use `image-coming-soon.svg` until exact supplier images are matched.
