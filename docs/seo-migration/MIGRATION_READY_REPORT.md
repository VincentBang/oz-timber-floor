# Migration Ready Report

Date: 2026-05-21

This report is now aligned to the final pre-launch verification pass and should be read alongside:
- `/docs/seo-migration/FINAL_REDIRECT_SMOKE_TEST.md`
- `/docs/seo-migration/FINAL_SITEMAP_CHECK.md`
- `/docs/seo-migration/FINAL_CONTENT_DEPTH_CHECK.md`
- `/docs/seo-migration/FINAL_ONSITE_SEO_CHECK.md`
- `/docs/seo-migration/FINAL_BACKLINK_TARGET_CHECK.md`
- `/docs/seo-migration/FINAL_MIGRATION_VERDICT.md`

## 1. Final domain status
- Final production domain in canonicals, Open Graph URLs, schema URLs, robots and sitemap files is `https://oztimberfloor.com.au/`.
- No live production SEO-critical metadata should point at `operonflooring.com.au`, `oztimberfloor.netlify.app` or `localhost`.

## 2. Canonical status
- Sampled key pages on staging use production-domain canonicals.
- No major canonical-domain contamination was found.

## 3. Sitemap status
- `robots.txt` references:
  - `https://oztimberfloor.com.au/sitemap.xml`
  - `https://oztimberfloor.com.au/sitemap-keyword-targets.xml`
- Current staging sitemap URL count: `1730`
- No Netlify preview URLs found in the sitemap.
- No Operon URLs found in the sitemap.

## 4. Redirect matrix status
- Redirect mapping documentation exists and remains strong:
  - `/docs/seo-migration/REDIRECT_MATRIX.csv`
- Blog migration mapping exists:
  - `/docs/seo-migration/BLOG_MIGRATION_MATRIX.csv`

## 5. Number of redirects implemented
- The repo redirect layer is substantial and migration-aware.
- However, current staging has not yet proved the freshest repo-side redirect fixes live.

## 6. Missing pages created or restored
The key high-intent destination pages required for migration are present:
- `/solid-timber-flooring-sydney/`
- `/vinyl-flooring-sydney/`
- `/bamboo-flooring-sydney/`
- `/timber-flooring-installation-sydney/`
- `/timber-floor-removal-and-stripping-sydney/`
- `/timber-floor-sanding-and-polishing-sydney/`
- `/floor-levelling-sydney/`
- `/commercial-flooring-sydney/`
- `/office-flooring-sydney/`

## 7. Blog migration status
- Old blog structure is mapped into `/guides/`
- Sample old blog redirects resolve to matching guide destinations
- Guide depth is broadly adequate

## 8. High-priority old URLs mapped
- Service, category, range and blog targets requested in the migration brief are represented in the redirect layer.

## 9. Unresolved old URLs
Current staging still fails on these old product URLs:
- `/product/eco-eco-swish-laminate-new-england-blackbutt/`
- `/product/eco-eco-swish-laminate-nutmeg/`
- `/product/eco-eco-swish-oak-contemporary-elegant-milano-oak/`

Repo-side fixes are in place, but they are not yet verified live on staging.

## 10. Backlink targets protected
- Backlink target protection is broadly good at the mapping layer.
- Remaining limitation: Search Console exports do not pair every backlink with exact old targets.

## 11. Sitemap URL count
- Main sitemap on current staging: `1730`

## 12. Internal link restoration
Core hub flow is in place across:
- homepage
- products
- category pages
- range pages
- guides
- projects
- contact/footer pathways

## 13. QA results
- Final domain audit: pass
- Canonical audit: pass
- Sitemap hygiene audit: pass
- Redirect smoke test on current staging: not yet clean enough
- Content depth sampling: pass
- Onsite SEO sampling: pass with one guide metadata/content issue still awaiting deploy

## 14. Remaining risks
- Current staging still shows extra redirect hops on several important old URLs.
- Current staging still shows 3 old product URLs returning `404`.
- One migrated guide still has empty meta/lead fields on staging, even though the repo fix is done.

## 15. Manual decisions still useful
- Decide whether the bamboo destination should remain a live enquiry page long-term or later become a more explicit availability/alternatives landing page.

## 16. Final verdict
## NOT READY

Why:
- the repo is close
- the live deployed staging site still needs one fresh deploy and one clean re-test before production migration

To move to `MIGRATION READY`:
1. deploy the current repo changes to staging
2. rerun `FINAL_REDIRECT_SMOKE_TEST.md`
3. confirm the three old product URLs now resolve with `301 -> 200`
4. confirm the sampled guide metadata fix is visible on staging
