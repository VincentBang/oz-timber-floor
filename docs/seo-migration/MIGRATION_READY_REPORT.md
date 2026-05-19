# Migration Ready Report

## 1. Final domain status

- Final production domain in canonicals, Open Graph URLs, robots and sitemap files is `https://oztimberfloor.com.au/`.
- A repo-wide scan found **0** live content files still using `operonflooring.com.au`, `operonflooring.netlify.app` or `oztimberfloor.netlify.app` in Oz production pages.

## 2. Canonical status

- Core service, category, guide, range and product pages inspected in this pass use production canonicals on `https://oztimberfloor.com.au/`.
- One important caveat remains: the repo still contains many alias range pages and legacy range folders, so canonical consistency across every long-tail range page still needs a broader cleanup pass.

## 3. Sitemap status

- `robots.txt` points to production sitemap files.
- `sitemap.xml` contains **1752** production URLs.
- `sitemap-keyword-targets.xml` contains **15** production URLs.
- The new bamboo destination page was added to both sitemap files.

## 4. Redirect matrix status

- Created: `/docs/seo-migration/REDIRECT_MATRIX.csv`
- Matrix rows: **1725** legacy URL entries including the live root row.
- Search Console source exports are now restored in `/docs/seo-migration/source/`.
- Internal-link counts have been backfilled for **74** old URLs present in `Top target pages`.
- External link attribution is still only partial because the restored link exports do not pair each linking page with its exact old target URL.

## 5. Number of redirects implemented

- Active 301 redirects in `_redirects`: **1721**
- Migration-critical redirect adjustments made in this pass:
  - bamboo legacy URLs now resolve to `/bamboo-flooring-sydney/`
  - key engineered timber, laminate and hybrid legacy range URLs now resolve directly to live range pages
  - Stonewood and Verdura bamboo product aliases now resolve to `/bamboo-flooring-sydney/`
  - Prestige Oak and Stone Floor legacy product-category URLs now resolve to exact live range pages
  - stale redirect overrides that were forcing live range pages into broader category pages were removed

## 6. Missing destination pages created

- Created: `/bamboo-flooring-sydney/`
- Internal crawl support added from `/products/`
- Added 200 route for `/bamboo-flooring-sydney/` in `_redirects`

## 7. High-priority old URLs mapped

- Preserved service paths:
  - `/timber-floor-installation/`
  - `/timber-floor-sanding-and-polishing/`
  - `/timber-floor-removal-and-stripping/`
  - `/floor-levelling/`
  - `/commercial-flooring/`
  - `/office-flooring/`
- Preserved category paths:
  - `/hybrid/`
  - `/laminate/`
  - `/engineered-timber-flooring/`
  - `/solid-timber/`
  - `/vinyl/`
  - `/bamboo/`
- Tightened high-intent range mappings:
  - Artisan Oak
  - Grand Oak / Grand Oak 14.5mm
  - Prestige Oak
  - Prestige Oak 15mm / 21mm
  - Kronoswiss Aquastop 8mm / 12mm / 14mm
  - Villeroy & Boch Aquastop 8mm / 10mm / 12mm
  - Luxury Hybrid
  - Ornato Hybrid
  - Stone Floor Tile / Timber

## 8. High-priority old URLs still unresolved

- Bamboo supplier intent still lands on the bamboo category page rather than a dedicated bamboo supplier page because the current catalogue has no live bamboo range library to support a stronger supplier landing.
- A wider alias-range rationalisation pass is still needed for some legacy range slugs that were imported from WordPress and are not yet migration-clean.
- The restored Search Console exports still do not provide target-paired backlink data, so old URL backlink prioritisation remains partly inferred rather than fully evidenced.
- Live Netlify staging still needs a fresh deploy before the newest bamboo and long-tail redirect fixes can be re-checked as live passes.
- `/faqs/` is now inventoried from the restored export, but it still needs a final destination decision because the rebuilt site does not yet have a dedicated FAQ hub.

## 9. Backlink targets protected

- Created: `/docs/seo-migration/BACKLINK_TARGET_REDIRECTS.md`
- High-intent service/category/range targets were documented and mapped using the restored Search Console source exports.
- Target-paired linking domains still remain unavailable in the restored export set.

## 10. Pages restored for long-tail rankings

- `/bamboo-flooring-sydney/` restored missing bamboo category intent.
- Existing high-intent service and category pages already present in the repo remain part of the canonical crawl path.
- Existing live range pages for key long-tail legacy targets are now reachable directly from migration redirects instead of broader fallback pages.

## 11. Sitemap URLs count

- Main sitemap URL count: **1752**
- Keyword-target sitemap URL count: **15**

## 12. Known risks

- No `package.json` or formal build/test command was present, so QA in this pass relied on static file, redirect-map and content scans rather than a full build pipeline.
- The repo worktree is already very dirty and contains many unrelated content changes; a migration-only branch cut would still be wise before launch.
- There are still long-tail alias range pages and product alias redirects that deserve another cleanup pass before calling the migration fully finished.
- Live Netlify staging is currently behind the repo redirect map for several migration-critical URLs. See `/docs/seo-migration/LIVE_STAGING_REDIRECT_QA.md`.
- The restored Search Console link exports are helpful but incomplete for backlink attribution because they do not identify the exact target URL for each linking page.

## 13. Manual decisions needed

- Decide whether bamboo should remain a category-intent landing only, or whether current supplier data is strong enough to justify a bamboo supplier page.
- Confirm whether additional legacy WordPress range aliases should stay live, redirect, or be retired after a separate long-tail audit.
- Trigger a fresh Netlify staging deploy, then rerun the live redirect QA so the repo fixes and staging behavior are back in sync.
- Confirm the deploy branch and production launch sequence if that operational decision still sits outside this repo.

## 14. Launch readiness verdict

**READY WITH RISKS**

This repo is much closer to migration-safe launch than before this pass: production-domain references are clean, sitemap files are on the correct domain, a redirect matrix now exists, the missing bamboo destination page has been restored, and several high-intent legacy range redirects now land exactly where they should.

It is not yet honest to call this fully **MIGRATION READY** because backlink-priority validation is still partly inferred from incomplete link exports, live Netlify staging has not yet caught up with the latest redirect fixes, and a broader long-tail alias cleanup pass is still outstanding.
