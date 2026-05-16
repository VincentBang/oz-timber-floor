# Redirect QA

## Status

- Redirect file checked: `_redirects`.
- Redirect target check: 1,667 local redirect targets checked.
- Missing targets: 0.
- Self-loops: 0.
- Duplicate redirect sources: 0.
- Product/category redirects are not mass redirected to `/products/`.

## Fixes Applied

- Removed duplicate redirect source rules while preserving the first matching rule.
- Added canonical typo redirects:
  - `/products/artisan-calcatta/` -> `/products/artisan-calacatta/`
  - `/product/artisan-calcatta/` -> `/products/artisan-calacatta/`
  - `/products/artisan-grema-marfil/` -> `/products/artisan-crema-marfil/`
  - `/product/artisan-grema-marfil/` -> `/products/artisan-crema-marfil/`
- Kept old Bamboo redirects pointing to `/hardwood-timber-flooring-sydney/`.

## Bamboo Redirects Preserved

- `/bamboo/` -> `/hardwood-timber-flooring-sydney/`
- `/bamboo-flooring-sydney/` -> `/hardwood-timber-flooring-sydney/`
- `/product-category/bamboo/` -> `/hardwood-timber-flooring-sydney/`
- `/product-category/bamboo/stonewood-bamboo/` -> `/hardwood-timber-flooring-sydney/`
- `/product-category/bamboo/verdura-bamboo/` -> `/hardwood-timber-flooring-sydney/`

## Manual Review

- Keep monitoring Netlify 404 logs after launch for any legacy product URLs that were not present in the current redirect export.
