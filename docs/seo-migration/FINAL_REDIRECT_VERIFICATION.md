# Final Redirect Verification

Date: 2026-05-31  
Source set: live WordPress sitemaps, required legacy paths, migration docs and generated old URL exports.

## Summary

Old URL count checked: 1,725

| Check | Result |
| --- | ---: |
| Exact new matches | 7 |
| Close topical matches | 1,716 |
| Obsolete 410 paths | 2 |
| Missing destinations | 0 |
| Redirect chains | 0 |
| Redirect loops | 0 |
| Missing redirect targets | 0 |
| Homepage dumps | 0 |
| Old URLs without 301 or valid exact/410 handling | 0 |

## Required Legacy Groups

Verified coverage includes:

- `/`
- `/hybrid/`
- `/laminate/`
- `/engineered-timber-flooring/`
- `/solid-timber/`
- `/vinyl/`
- `/bamboo/`
- `/product-category/*`
- `/product/*`
- `/products/*` legacy product aliases found in exports
- `/blogs/`
- `/blogs/page/*`
- individual blog article URLs
- `/timber-floor-installation/`
- `/floor-levelling/`
- `/timber-floor-sanding-and-polishing/`
- `/timber-floor-removal-and-stripping/`
- `/commercial-flooring/`
- `/office-flooring/`
- `/services/`
- `/faqs/`
- `/gallery/`
- `/contact-us/`

## Intentional 410 Paths

These are treated as obsolete and not relevant to flooring migration targets:

- `/innovakitchens/`
- `/product-category/uncategorized/`

## Product Alias Risk

Previously noted Eco/Swish product aliases are covered by `_redirects`, including forced 301 rules where needed:

- `/product/eco-eco-swish-laminate-new-england-blackbutt/`
- `/product/eco-eco-swish-laminate-nutmeg/`
- `/product/eco-eco-swish-oak-contemporary-elegant-milano-oak/`
- `/products/eco-eco-swish-laminate-new-england-blackbutt/`
- `/products/eco-eco-swish-laminate-nutmeg/`
- `/products/eco-eco-swish-oak-contemporary-elegant-milano-oak/`

## Generated Evidence

Detailed machine-readable outputs:

- `docs/seo-migration/generated/final-redirect-audit.json`
- `docs/seo-migration/generated/final-redirect-audit.csv`
- `docs/seo-migration/generated/old-wordpress-urls.json`
- `docs/seo-migration/generated/old-wordpress-urls.txt`

## Launch Note

Run the same smoke test against the deployed Netlify staging URL before DNS cutover. Repo-level redirect logic is clean, but deployed behavior should be confirmed after the current changes are published.
