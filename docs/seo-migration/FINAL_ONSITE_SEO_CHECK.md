# Final Onsite SEO Check

Date: 2026-05-21

Checked against:
- `https://oztimberfloor.netlify.app/`

## Scope
Spot-checked:
- homepage
- services hub
- products
- contact
- guides
- projects
- hybrid category
- laminate category
- engineered timber category
- solid timber category
- vinyl category
- floor levelling
- installation
- commercial
- office
- builder
- 5 range pages
- 5 guide pages

## Passes
- Title tags present on sampled key pages: `yes`
- Meta descriptions present on most sampled key pages: `yes`
- H1 present on sampled key pages: `yes`
- Canonicals use `https://oztimberfloor.com.au/`: `yes`
- Accidental `noindex` on sampled key pages: `no`
- Open Graph URLs use final production domain: `yes`
- FAQ schema present where expected on sampled service/category/range pages: `yes`
- Internal links crawlable in sampled pages: `yes`
- Broken images found in sampled checks: `0`
- CTA pathways present on sampled service/category/range/guide pages: `yes`

## Key Range Checks
Sampled range pages:
- `/ranges/pronto/`
- `/ranges/prestige-oak/`
- `/ranges/hydroplank-wpc/`
- `/ranges/iconic-wpc/`
- `/ranges/classic-laminate/`

Result:
- all sampled range pages returned `200`
- all had title, meta, H1 and canonical
- all had enquiry CTAs and product/range context

## Key Guide Checks
Sampled guide pages:
- `/guides/hire-over-diy/`
- `/guides/laying-the-foundations-right-why-floor-levelling-matters-for-your-timber-flooring/`
- `/guides/guide-to-choosing-the-right-vinyl-timber-flooring/`
- `/guides/why-a-hardwood-timber-floor-will-never-be-out-of-style/`
- `/guides/common-questions-we-get-as-hybrid-floor-installers-in-sydney/`

## Issue Found
Current staging still has one guide with missing visible/meta support content:
- `/guides/common-questions-we-get-as-hybrid-floor-installers-in-sydney/`

Observed on staging:
- empty `<meta name="description">`
- empty `og:description`
- empty hero lead
- empty key takeaway paragraph

Repo status:
- this has already been fixed locally in:
  - `/guides/common-questions-we-get-as-hybrid-floor-installers-in-sydney/index.html`
- but the fix is not yet visible on current staging

## Mobile / UX Note
- This pass did not do full visual polish work.
- No major crawl/indexing blocker was found in the sampled pages from the SEO perspective.

## Conclusion
Onsite SEO is broadly healthy. The only sampled content-level staging issue found was the one guide page above, and the repo-side fix already exists but still needs deployment verification.
