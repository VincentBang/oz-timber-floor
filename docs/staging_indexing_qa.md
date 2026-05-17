# Staging Indexing QA

## Status

- Staging is protected by `_headers` with `X-Robots-Tag: noindex, nofollow`.
- Local `robots.txt` currently disallows all crawling, suitable for staging.
- Sitemap points to production URLs, not Netlify preview URLs.
- Production canonical URLs are used in page HTML.

## Risk

This setup is safe for staging review, but it is not production-ready until noindex/disallow behaviour is intentionally changed for the real domain launch.

## Production Action

Before connecting `oztimberfloor.com.au`, confirm whether Netlify will use branch-specific headers/robots or whether these files need to be changed as part of the launch commit.
