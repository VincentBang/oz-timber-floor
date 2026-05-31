# Backlink And Authority Plan

Date: 2026-05-26

## Current Evidence

Search Console exports in `docs/seo-migration/source/` include:

- Top target pages with internal link counts.
- Latest linking pages.
- More sample linking pages.

Limitation: exports do not pair every linking page with the exact old target URL, so target-level backlink attribution is incomplete.

## A. Preserve Existing Links

| Old target / group | Evidence | Redirect target | Status | Notes |
| --- | --- | --- | --- | --- |
| `/` | 481 internal links | `/` | Protected | Homepage should preserve broad timber flooring Sydney authority. |
| `/bamboo/` | 341 internal links | `/bamboo-flooring-sydney/` | Protected | Keeps legacy intent without showing discontinued product catalogue. |
| `/product-category/laminate/villeroy-boch-aquastop-10mm/` | 342 internal links | `/ranges/villeroy-boch-aquastop-10mm/` | Protected | High priority range enrichment. |
| `/product-category/laminate/infinite-laminate/` | 341 internal links | `/ranges/infinite/` | Protected | High priority range. |
| `/product-category/laminate/kronoswiss-aquastop-laminate-12mm/` | 341 internal links | `/ranges/kronoswiss-aquastop-laminate-12mm/` | Protected | Watch duplicate family pages. |
| `/product-category/laminate/kronoswiss-aquastop-laminate-14mm/` | 341 internal links | `/ranges/kronoswiss-aquastop-laminate-14mm/` | Protected | Watch duplicate family pages. |
| `/product-category/laminate/reflections-laminate/` | 341 internal links | `/ranges/reflections/` | Protected in repo mapping | Re-test after deploy if redirects change. |
| `/product-category/vinyl/ornato-vinyl/` | 341 internal links | `/ranges/ornato-vinyl/` | Protected | Needs enrichment. |
| `/product-category/engineered-timber/prestige-oak/` | 340 internal links | `/ranges/prestige-oak/` | Protected | Strong page; improve structured clarity. |
| `/timber-floor-installation/` | 338 internal links | `/timber-flooring-installation-sydney/` | Protected | High-intent service preserved. |
| `/floor-levelling/` | 338 internal links | `/floor-levelling-sydney/` | Protected | High-intent service preserved. |
| `/office-flooring/` | 338 internal links | `/office-flooring-sydney/` | Protected | Re-test after production migration. |

## Link Source Observations

Sample linking pages include business directories, local listing pages, article syndication and industry-style pages. Quality appears mixed. Preserve redirects, but do not copy low-quality link-building tactics.

## B. Build Better Links

| Opportunity | Target page | Quality standard | Action |
| --- | --- | --- | --- |
| Supplier/dealer listings | Supplier/category pages | Real authorised listing only | Ask suppliers/manufacturers for dealer or stockist links where appropriate. |
| Builder partner links | `/builder-flooring-contractor-sydney/` | Real project relationship | Request partner/vendor mentions from builders Oz works with. |
| Commercial fit-out partners | `/commercial-flooring-sydney/`, `/office-flooring-sydney/` | Real collaboration | Seek project/vendor pages from fit-out firms. |
| Local Sydney directories | Homepage/services | Reputable local directories only | Keep NAP consistent; avoid low-quality mass submissions. |
| Google Business Profile | Homepage/contact | Essential local trust | Add services, products, project photos and posts after launch. |
| Houzz/renovation platforms | Projects/services | Legitimate profile only | Use project images and service descriptions. |
| Project collaborator mentions | `/projects/` and service pages | Real completed work | Ask designers/builders/architects for project credit links. |
| Manufacturer/product partner links | Category/range pages | Supplier-approved | Focus on stockist/dealer relationships without sending customers away from Oz product pages. |

## Avoid

- Paid link farms.
- Irrelevant overseas directories.
- Exact-match anchor spam.
- Private blog networks.
- Supplier outbound links from Oz range pages that send customers directly to buy elsewhere.

## Monthly Authority Rhythm

- Check Search Console links once per month.
- Fix any old linked URL that hits 404 or irrelevant target.
- Add 1-3 legitimate local/supplier/partner links per month.
- Add one real project proof asset per month where possible.
