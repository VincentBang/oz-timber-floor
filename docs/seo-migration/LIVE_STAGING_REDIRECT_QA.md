# Live Staging Redirect QA

Checked against:
- `https://oztimberfloor.netlify.app`

Date:
- `2026-05-19`

## Scope

This QA pass focused only on migration-critical URLs:
- backlink-priority service and category targets
- remaining long-tail alias range redirects
- old blog redirects already migrated into `/guides/`

## Results

| Old URL | Expected repo target | Live staging result | Status | Notes |
| --- | --- | --- | --- | --- |
| `/timber-floor-installation/` | `/timber-flooring-installation-sydney/` | `301 -> /timber-flooring-installation-sydney/` | Pass | Intent preserved. |
| `/floor-levelling/` | `/floor-levelling-sydney/` | `301 -> /floor-levelling-sydney/` | Pass | Intent preserved. |
| `/blogs/` | `/guides/` | `301 -> /guides/ -> /guides` | Pass with chain | Netlify currently adds a second slash-normalisation hop. |
| `/hire-over-diy/` | `/guides/hire-over-diy/` | `301 -> /guides/hire-over-diy/` | Pass | Blog migration redirect working. |
| `/product-category/laminate/villeroy-boch-aquastop-10mm/` | `/ranges/villeroy-boch-aquastop-10mm/` | `301 -> /ranges/villeroy-boch-aquastop-10mm/` | Pass | Exact range preserved. |
| `/product-category/hybrid/stone-floor-tile/` | `/ranges/stone-floor-tile/` | `301 -> /ranges/stone-floor-tile/` | Pass | Exact range preserved on staging. |
| `/product-category/hybrid/stone-floor-timber/` | `/ranges/stone-floor-timber/` | `301 -> /ranges/stone-floor-timber/` | Pass | Exact range preserved on staging. |
| `/product-category/laminate/infinite-laminate/` | `/ranges/infinite/` | `301 -> /ranges/infinite-laminate/` | Needs deploy | Repo redirect has been tightened, but staging is still serving the older alias destination. |
| `/product-category/solid-timber/topdeck-pre-finished-solid-timber/` | `/ranges/solid/` | `301 -> /ranges/pre-finished-solid-timber/` | Needs deploy | Repo now points to the canonical prefinish solid page; staging still reflects the older redirect. |
| `/product-category/engineered-timber/prestige-oak/` | `/ranges/prestige-oak/` | `404` | Needs deploy | Redirect added in repo during this pass; staging has not picked it up yet. |
| `/bamboo/` | `/bamboo-flooring-sydney/` | `301 -> /hardwood-timber-flooring-sydney/` | Needs deploy | Repo target is correct now, but staging is still on the older hardwood fallback. |
| `/product/stonewood-natural/` | `/bamboo-flooring-sydney/` | `301 -> /hardwood-timber-flooring-sydney/` | Needs deploy | Bamboo product alias fixed in repo; staging still uses the older hardwood fallback. |
| `/product/verdura-natural/` | `/bamboo-flooring-sydney/` | `301 -> /hardwood-timber-flooring-sydney/` | Needs deploy | Same issue as above. |

## Takeaway

- The repo redirect map is now stronger than the currently deployed Netlify staging behavior for several bamboo and long-tail range aliases.
- The remaining staging mismatches appear to be deployment lag, not unresolved repo mapping decisions.
- A fresh Netlify deploy is needed before calling redirect QA complete.
