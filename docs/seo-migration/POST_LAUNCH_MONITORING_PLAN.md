# Post-Launch Monitoring Plan

Date: 2026-05-31

## Day 0

- Deploy the current repo to Netlify staging.
- Confirm staging uses the latest `_redirects`, `sitemap.xml`, `robots.txt` and HTML files.
- Smoke test old high-value URLs:
  - category URLs
  - service URLs
  - product-category range URLs
  - product URLs
  - old blog URLs
  - known backlink targets
- Submit `https://oztimberfloor.com.au/sitemap.xml` in Search Console after DNS cutover.
- Inspect homepage, main category pages, service pages and several old redirected URLs in Search Console URL Inspection.

## Day 1-3

- Check Search Console Page Indexing.
- Review Not Found / 404 reports.
- Review Page with Redirect reports.
- Review Duplicate without user-selected canonical and Google chose different canonical reports.
- Confirm sitemap is processed and the URL count is expected.
- Check server logs or Netlify analytics for repeated 404s from old WordPress paths.
- Patch redirect gaps quickly if any high-value old URL appears.

## Day 7

- Compare clicks, impressions, CTR and average position against the pre-launch baseline.
- Check whether old URLs are dropping out while new URLs are picking up impressions.
- Inspect the highest impression pages with low CTR.
- Confirm branded queries and main service/category queries are stable.
- Review top redirected old URLs and ensure they are landing on relevant pages, not generic hubs.

## Day 14-30

- Monitor ranking volatility before doing broad content rewrites.
- Prioritise fixes in this order:
  1. 404 or redirect gaps
  2. canonical mismatches
  3. sitemap errors
  4. thin migrated guide pages if Search Console shows weak performance
  5. top range/product enrichment
- Continue duplicate range identity cleanup only after migration stability is visible.

## Ongoing Monthly Rhythm

- Review Search Console query/page performance.
- Improve three existing pages based on real query data.
- Publish or improve one strong guide/project asset.
- Build one to three legitimate local, supplier or partner links.
- Re-run sitemap, redirect and broken-link checks after every catalogue or migration-sensitive update.

## Alert Conditions

Act immediately if any of these appear:

- Important old URLs returning 404.
- Old URLs redirecting to homepage when a relevant target exists.
- Netlify preview URLs appearing as canonicals.
- Sitemap containing redirected URLs.
- Production pages accidentally noindexed.
- Search Console reports a sudden spike in not found URLs.
- High-value pages lose impressions without a matching new page gaining them.
