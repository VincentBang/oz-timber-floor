# Live Staging Redirect QA

Checked against:
- `https://oztimberfloor.netlify.app`

Date:
- `2026-05-19`

## Scope
This QA pass focused on migration-critical URLs only:
- legacy service URLs
- old blog URLs
- old product-category range URLs
- bamboo legacy URLs

## Results

| Old URL | Expected repo target | Live staging result | Status | Notes |
| --- | --- | --- | --- | --- |
| `/timber-floor-installation/` | `/timber-flooring-installation-sydney/` | `200 -> /timber-flooring-installation-sydney` | Pass | Intent preserved. |
| `/floor-levelling/` | `/floor-levelling-sydney/` | `200 -> /floor-levelling-sydney` | Pass | Intent preserved. |
| `/blogs/` | `/guides` | `200 -> /guides` | Pass | No extra chain remained in this check. |
| `/hire-over-diy/` | `/guides/hire-over-diy/` | `200 -> /guides/hire-over-diy/` | Pass | Blog migration redirect working. |
| `/product-category/laminate/villeroy-boch-aquastop-10mm/` | `/ranges/villeroy-boch-aquastop-10mm/` | `200 -> /ranges/villeroy-boch-aquastop-10mm/` | Pass | Exact range preserved. |
| `/product-category/hybrid/stone-floor-tile/` | `/ranges/stone-floor-tile/` | `200 -> /ranges/stone-floor-tile/` | Pass | Exact range preserved. |
| `/product-category/hybrid/stone-floor-timber/` | `/ranges/stone-floor-timber/` | `200 -> /ranges/stone-floor-timber/` | Pass | Exact range preserved. |
| `/product-category/laminate/infinite-laminate/` | `/ranges/infinite/` | `200 -> /ranges/infinite/` | Pass | Exact range preserved. |
| `/product-category/solid-timber/topdeck-pre-finished-solid-timber/` | `/ranges/solid/` | `200 -> /ranges/solid/` | Pass | Current canonical solid timber destination preserved. |
| `/product-category/engineered-timber/prestige-oak/` | `/ranges/prestige-oak/` | `200 -> /ranges/prestige-oak/` | Pass | Exact range preserved. |
| `/bamboo/` | `/bamboo-flooring-sydney/` | `200 -> /bamboo-flooring-sydney` | Pass | Bamboo intent preserved. |
| `/product/stonewood-natural/` | `/bamboo-flooring-sydney/` | `200 -> /bamboo-flooring-sydney` | Pass | Legacy bamboo product alias protected. |
| `/product/verdura-natural/` | `/bamboo-flooring-sydney/` | `200 -> /bamboo-flooring-sydney` | Pass | Legacy bamboo product alias protected. |

## Takeaway
- The live staging behavior now matches the strengthened repo-side redirect map for the migration-critical URLs checked here.
- The migration verdict no longer hinges on “needs deploy” mismatches for this checked set.
