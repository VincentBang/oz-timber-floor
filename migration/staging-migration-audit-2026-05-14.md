# Oz Timber Floor staging migration audit

Date: 2026-05-14

## High-priority findings
- Staging now has repo-level noindex protection via `_headers` and `robots.txt` disallow rules. Remove these only at production cutover.
- Core service, category, guides, projects, FAQs and contact pages exist in the static rebuild.
- The legacy WordPress URL export now includes the remaining high-priority page-level mappings for `artisan-oak`, `bt-bamboo`, `easiplank`, `elk-falls`, `fiddleback`, `hydroplank-wpc`, `infinite-laminate-2`, `oakstep-laminate`, `ornato-vinyl` and `prefinished-solid-timber`.
- Three missing legacy range destinations were created as static landers: `bt-bamboo`, `elk-falls`, and `oakstep-laminate`.

## Remaining SEO/manual review risks
- `Elk Falls` is preserved as a legacy enquiry landing page, but supplier/category specifics still need human confirmation.
- Canonical tags still point to `https://oztimberfloor.com.au/`, which is correct for production but should not be exposed to indexing while the site remains on `netlify.app`.
- Netlify form routing still needs one real staging submission test in the Netlify dashboard.
- Real project photography, review snippets and final service-area trust signals still need manual supply.

## Core inventory status
- Core static pages: present
- Guide pages: 20
- Range pages: 119
- Product pages: 894
- Sitemap URLs: 1057

## Files to review before production
- /_headers
- /robots.txt
- /_redirects
- /migration/old-wordpress-url-export.csv
- /migration/redirect-map.csv
- /contact.html
