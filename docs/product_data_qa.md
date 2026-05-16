# Product Data QA

## High-Confidence Fixes Made

- Removed duplicate typo canonical product folders:
  - `products/artisan-calcatta/`
  - `products/artisan-grema-marfil/`
- Preserved typo URL redirects to corrected product pages.
- Removed public supplier names from product enquiry URL parameters and visible product card labels.
- Updated central product policy in `data/product-catalogue.json` so public catalogue pages remain category-led and range-led, with third-party supplier names hidden unless explicitly approved.

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

## Image QA

- No broken local links found.
- Exact product-image accuracy still needs human review for supplier colour matching.
- Some products intentionally use the neutral image-coming-soon asset until exact product imagery is confirmed.
