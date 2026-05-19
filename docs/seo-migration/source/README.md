# Restored source exports

The Search Console source folder is now populated with the local exports that were missing from the earlier migration pass.

Current files:
- `https___oztimberfloor.com.au_-Top target pages-2026-05-18.csv`
- `https___oztimberfloor.com.au_-Latest links-2026-05-18.csv`
- `https___oztimberfloor.com.au_-More sample links-2026-05-18.csv`

What they provide:
- `Top target pages`: old URLs with internal link counts
- `Latest links`: sample linking pages plus last crawled date
- `More sample links`: additional sample linking pages

Important limitation:
- The restored link exports do **not** include target-page pairing for each external link.
- That means we can now prioritise migration work with real internal-link counts, but backlink protection still needs some inference unless a target-paired export is provided later.
