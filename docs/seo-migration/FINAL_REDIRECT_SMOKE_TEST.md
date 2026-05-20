# Final Redirect Smoke Test

Date: 2026-05-21

Test host: `https://oztimberfloor.netlify.app`

Important note:
- current staging is still serving an older deployed redirect map
- repo-side fixes have now been added to `/_redirects`
- this file records the live staging behavior observed before that fresh deploy is confirmed

| Old path | Redirect chain | Final status | Final URL | Indexable |
|---|---|---:|---|---|
| `/` | 200 | 200 | `https://oztimberfloor.netlify.app/` | yes |
| `/contact-us/` | 301 to /contact/ -> 301 to /contact -> 200 | 200 | `https://oztimberfloor.netlify.app/contact` | yes |
| `/services/` | 301 to /services -> 200 | 200 | `https://oztimberfloor.netlify.app/services` | yes |
| `/hybrid/` | 301 to /hybrid-flooring-sydney/ -> 301 to /hybrid-flooring-sydney -> 200 | 200 | `https://oztimberfloor.netlify.app/hybrid-flooring-sydney` | yes |
| `/laminate/` | 301 to /laminate-flooring-sydney/ -> 301 to /laminate-flooring-sydney -> 200 | 200 | `https://oztimberfloor.netlify.app/laminate-flooring-sydney` | yes |
| `/vinyl/` | 301 to /vinyl-flooring-sydney/ -> 301 to /vinyl-flooring-sydney -> 200 | 200 | `https://oztimberfloor.netlify.app/vinyl-flooring-sydney` | yes |
| `/solid-timber/` | 301 to /solid-timber-flooring-sydney/ -> 301 to /solid-timber-flooring-sydney -> 200 | 200 | `https://oztimberfloor.netlify.app/solid-timber-flooring-sydney` | yes |
| `/bamboo/` | 301 to /bamboo-flooring-sydney/ -> 301 to /bamboo-flooring-sydney -> 200 | 200 | `https://oztimberfloor.netlify.app/bamboo-flooring-sydney` | yes |
| `/floor-levelling/` | 301 to /floor-levelling-sydney/ -> 301 to /floor-levelling-sydney -> 200 | 200 | `https://oztimberfloor.netlify.app/floor-levelling-sydney` | yes |
| `/timber-floor-installation/` | 301 to /timber-flooring-installation-sydney/ -> 301 to /timber-flooring-installation-sydney -> 200 | 200 | `https://oztimberfloor.netlify.app/timber-flooring-installation-sydney` | yes |
| `/timber-floor-removal-and-stripping/` | 301 to /timber-floor-removal-and-stripping-sydney/ -> 301 to /timber-floor-removal-and-stripping-sydney -> 200 | 200 | `https://oztimberfloor.netlify.app/timber-floor-removal-and-stripping-sydney` | yes |
| `/timber-floor-sanding-and-polishing/` | 301 to /timber-floor-sanding-and-polishing-sydney/ -> 301 to /timber-floor-sanding-and-polishing-sydney -> 200 | 200 | `https://oztimberfloor.netlify.app/timber-floor-sanding-and-polishing-sydney` | yes |
| `/commercial-flooring/` | 301 to /commercial-flooring-sydney/ -> 301 to /commercial-flooring-sydney -> 200 | 200 | `https://oztimberfloor.netlify.app/commercial-flooring-sydney` | yes |
| `/office-flooring/` | 301 to /office-flooring-sydney/ -> 301 to /office-flooring-sydney -> 200 | 200 | `https://oztimberfloor.netlify.app/office-flooring-sydney` | yes |
| `/blogs/` | 301 to /guides -> 200 | 200 | `https://oztimberfloor.netlify.app/guides` | yes |
| `/product-category/laminate/infinite-laminate/` | 301 to /ranges/infinite/ -> 200 | 200 | `https://oztimberfloor.netlify.app/ranges/infinite/` | yes |
| `/product-category/laminate/kronoswiss-aquastop-laminate-12mm/` | 301 to /ranges/kronoswiss-aquastop-laminate-12mm/ -> 200 | 200 | `https://oztimberfloor.netlify.app/ranges/kronoswiss-aquastop-laminate-12mm/` | yes |
| `/product-category/laminate/kronoswiss-aquastop-laminate-14mm/` | 301 to /ranges/kronoswiss-aquastop-laminate-14mm/ -> 200 | 200 | `https://oztimberfloor.netlify.app/ranges/kronoswiss-aquastop-laminate-14mm/` | yes |
| `/product-category/laminate/reflections-laminate/` | 301 to /ranges/reflections/ -> 200 | 200 | `https://oztimberfloor.netlify.app/ranges/reflections/` | yes |
| `/product-category/laminate/swish-laminate/` | 301 to /ranges/swish-laminate/ -> 200 | 200 | `https://oztimberfloor.netlify.app/ranges/swish-laminate/` | yes |
| `/product-category/laminate/villeroy-boch-aquastop-8mm/` | 301 to /ranges/villeroy-boch-aquastop-8mm/ -> 200 | 200 | `https://oztimberfloor.netlify.app/ranges/villeroy-boch-aquastop-8mm/` | yes |
| `/product-category/laminate/villeroy-boch-aquastop-10mm/` | 301 to /ranges/villeroy-boch-aquastop-10mm/ -> 200 | 200 | `https://oztimberfloor.netlify.app/ranges/villeroy-boch-aquastop-10mm/` | yes |
| `/product-category/engineered-timber/prestige-oak/` | 301 to /ranges/prestige-oak/ -> 200 | 200 | `https://oztimberfloor.netlify.app/ranges/prestige-oak/` | yes |
| `/product-category/hybrid/hydroplank-wpc/` | 301 to /ranges/hydroplank-wpc/ -> 200 | 200 | `https://oztimberfloor.netlify.app/ranges/hydroplank-wpc/` | yes |
| `/product-category/solid-timber/topdeck-pre-finished-solid-timber/` | 301 to /ranges/solid/ -> 200 | 200 | `https://oztimberfloor.netlify.app/ranges/solid/` | yes |
| `/hire-over-diy/` | 301 to /guides/hire-over-diy/ -> 200 | 200 | `https://oztimberfloor.netlify.app/guides/hire-over-diy/` | yes |
| `/3-services-timber-floor-installers-in-sydney-can-do-for-you/` | 301 to /guides/3-services-timber-floor-installers-in-sydney-can-do-for-you/ -> 200 | 200 | `https://oztimberfloor.netlify.app/guides/3-services-timber-floor-installers-in-sydney-can-do-for-you/` | yes |
| `/3-reasons-why-modern-homes-use-engineered-oak-flooring-in-sydney/` | 301 to /guides/3-reasons-why-modern-homes-use-engineered-oak-flooring-in-sydney/ -> 200 | 200 | `https://oztimberfloor.netlify.app/guides/3-reasons-why-modern-homes-use-engineered-oak-flooring-in-sydney/` | yes |
| `/5-tell-tale-signs-engineered-timber-flooring-is-right-for-your-property/` | 301 to /guides/5-tell-tale-signs-engineered-timber-flooring-is-right-for-your-property/ -> 200 | 200 | `https://oztimberfloor.netlify.app/guides/5-tell-tale-signs-engineered-timber-flooring-is-right-for-your-property/` | yes |
| `/why-a-hardwood-timber-floor-will-never-be-out-of-style/` | 301 to /guides/why-a-hardwood-timber-floor-will-never-be-out-of-style/ -> 200 | 200 | `https://oztimberfloor.netlify.app/guides/why-a-hardwood-timber-floor-will-never-be-out-of-style/` | yes |
| `/the-5-questions-to-ask-your-timber-floor-installer-in-sydney/` | 301 to /guides/the-5-questions-to-ask-your-timber-floor-installer-in-sydney/ -> 200 | 200 | `https://oztimberfloor.netlify.app/guides/the-5-questions-to-ask-your-timber-floor-installer-in-sydney/` | yes |
| `/your-guide-for-choosing-a-reliable-sydney-timber-flooring-provider/` | 301 to /guides/your-guide-for-choosing-a-reliable-sydney-timber-flooring-provider/ -> 200 | 200 | `https://oztimberfloor.netlify.app/guides/your-guide-for-choosing-a-reliable-sydney-timber-flooring-provider/` | yes |
| `/common-questions-we-get-as-hybrid-floor-installers-in-sydney/` | 301 to /guides/common-questions-we-get-as-hybrid-floor-installers-in-sydney/ -> 200 | 200 | `https://oztimberfloor.netlify.app/guides/common-questions-we-get-as-hybrid-floor-installers-in-sydney/` | yes |
| `/laying-the-foundations-right-why-floor-levelling-matters-for-your-timber-flooring/` | 301 to /guides/laying-the-foundations-right-why-floor-levelling-matters-for-your-timber-flooring/ -> 200 | 200 | `https://oztimberfloor.netlify.app/guides/laying-the-foundations-right-why-floor-levelling-matters-for-your-timber-flooring/` | yes |
| `/guide-to-choosing-the-right-vinyl-timber-flooring/` | 301 to /guides/guide-to-choosing-the-right-vinyl-timber-flooring/ -> 200 | 200 | `https://oztimberfloor.netlify.app/guides/guide-to-choosing-the-right-vinyl-timber-flooring/` | yes |
| `/product/eco-eco-swish-laminate-new-england-blackbutt/` | 404 | 404 | `https://oztimberfloor.netlify.app/product/eco-eco-swish-laminate-new-england-blackbutt/` | no |
| `/product/eco-eco-swish-laminate-nutmeg/` | 404 | 404 | `https://oztimberfloor.netlify.app/product/eco-eco-swish-laminate-nutmeg/` | no |
| `/product/eco-eco-swish-oak-contemporary-elegant-milano-oak/` | 404 | 404 | `https://oztimberfloor.netlify.app/product/eco-eco-swish-oak-contemporary-elegant-milano-oak/` | no |
| `/product/stonewood-natural/` | 301 to /bamboo-flooring-sydney/ -> 301 to /bamboo-flooring-sydney -> 200 | 200 | `https://oztimberfloor.netlify.app/bamboo-flooring-sydney` | yes |
| `/product/verdura-outback/` | 301 to /bamboo-flooring-sydney/ -> 301 to /bamboo-flooring-sydney -> 200 | 200 | `https://oztimberfloor.netlify.app/bamboo-flooring-sydney` | yes |

## Failures / Risks

- `/contact-us/` -> final `200` at `https://oztimberfloor.netlify.app/contact`; chain length `3`.
- `/hybrid/` -> final `200` at `https://oztimberfloor.netlify.app/hybrid-flooring-sydney`; chain length `3`.
- `/laminate/` -> final `200` at `https://oztimberfloor.netlify.app/laminate-flooring-sydney`; chain length `3`.
- `/vinyl/` -> final `200` at `https://oztimberfloor.netlify.app/vinyl-flooring-sydney`; chain length `3`.
- `/solid-timber/` -> final `200` at `https://oztimberfloor.netlify.app/solid-timber-flooring-sydney`; chain length `3`.
- `/bamboo/` -> final `200` at `https://oztimberfloor.netlify.app/bamboo-flooring-sydney`; chain length `3`.
- `/floor-levelling/` -> final `200` at `https://oztimberfloor.netlify.app/floor-levelling-sydney`; chain length `3`.
- `/timber-floor-installation/` -> final `200` at `https://oztimberfloor.netlify.app/timber-flooring-installation-sydney`; chain length `3`.
- `/timber-floor-removal-and-stripping/` -> final `200` at `https://oztimberfloor.netlify.app/timber-floor-removal-and-stripping-sydney`; chain length `3`.
- `/timber-floor-sanding-and-polishing/` -> final `200` at `https://oztimberfloor.netlify.app/timber-floor-sanding-and-polishing-sydney`; chain length `3`.
- `/commercial-flooring/` -> final `200` at `https://oztimberfloor.netlify.app/commercial-flooring-sydney`; chain length `3`.
- `/office-flooring/` -> final `200` at `https://oztimberfloor.netlify.app/office-flooring-sydney`; chain length `3`.
- `/product/eco-eco-swish-laminate-new-england-blackbutt/` -> final `404` at `https://oztimberfloor.netlify.app/product/eco-eco-swish-laminate-new-england-blackbutt/`; chain length `1`.
- `/product/eco-eco-swish-laminate-nutmeg/` -> final `404` at `https://oztimberfloor.netlify.app/product/eco-eco-swish-laminate-nutmeg/`; chain length `1`.
- `/product/eco-eco-swish-oak-contemporary-elegant-milano-oak/` -> final `404` at `https://oztimberfloor.netlify.app/product/eco-eco-swish-oak-contemporary-elegant-milano-oak/`; chain length `1`.
- `/product/stonewood-natural/` -> final `200` at `https://oztimberfloor.netlify.app/bamboo-flooring-sydney`; chain length `3`.
- `/product/verdura-outback/` -> final `200` at `https://oztimberfloor.netlify.app/bamboo-flooring-sydney`; chain length `3`.

## Repo-side fixes now prepared
- Added direct redirects for:
  - `/product/eco-eco-swish-laminate-new-england-blackbutt/`
  - `/product/eco-eco-swish-laminate-nutmeg/`
  - `/product/eco-eco-swish-oak-contemporary-elegant-milano-oak/`
- Normalised several old URL redirect targets in `/_redirects` to slashless final destinations to reduce extra hops once deployed.

## Required next step
- trigger a fresh staging deploy
- rerun this smoke test
- if the 404s disappear and the extra hops collapse, the redirect layer can be considered launch-safe
