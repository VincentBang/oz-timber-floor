# Final Canonical, Sitemap And Robots Check

Date: 2026-05-31  
Final production domain: https://oztimberfloor.com.au/

## Summary

| Check | Result |
| --- | ---: |
| Sitemap URL count | 1,973 |
| Non-production sitemap domains | 0 |
| Old `/product-category/` or `/product/` URLs in sitemap | 0 |
| Netlify, Operon or localhost URLs in sitemap | 0 |
| Sitemap URLs that redirect | 0 |
| Missing local files for sitemap URLs | 0 |
| Canonical mismatches | 0 |
| Production noindex pages in sitemap | 0 |
| Bad Netlify/Operon/localhost metadata references | 0 |
| JSON-LD parse errors | 0 |
| Missing titles | 0 |
| Missing meta descriptions | 0 |
| Missing H1s | 0 |
| Robots issues | 0 |

## Sitemap Fix

`sitemap.xml` was regenerated from local canonical HTML pages and then normalised through `_redirects` so old aliases and redirected URLs are not submitted as canonical sitemap entries.

This corrected a launch blocker where 142 sitemap URLs were pointing at paths that would immediately 301.

## Robots

`robots.txt` allows production crawl:

- `User-agent: *`
- `Allow: /`
- final sitemap reference: `https://oztimberfloor.com.au/sitemap.xml`
- keyword-target sitemap reference retained: `https://oztimberfloor.com.au/sitemap-keyword-targets.xml`

No Netlify, Operon or localhost references were found in `robots.txt`.

## Canonicals And Metadata

All sitemap URLs checked use:

- final production canonical domain
- matching canonical URL
- production Open Graph URL
- valid parseable JSON-LD where schema is present
- indexable robots state

## Generated Evidence

Detailed machine-readable output:

- `docs/seo-migration/generated/final-canonical-sitemap-audit.json`

## Launch Note

After deployment, fetch the live sitemap and re-run the same checks against the deployed URL. The repo-level sitemap is clean; the remaining risk is deployment state.
