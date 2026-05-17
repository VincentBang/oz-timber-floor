# Oz Timber Floor Task Queue

## P0: Launch Blockers / SEO Damage Risk

- Audit `_redirects` for missing or broken targets.
- Confirm sitemap contains only canonical production URLs.
- Confirm production launch does not inherit staging `robots.txt` `Disallow: /` or `_headers` `X-Robots-Tag: noindex, nofollow`.
- Remove any public Bamboo references outside migration docs/redirects.
- Remove any public supplier-name leakage if current policy remains “do not show supplier names.”
- Confirm staging noindex protection and production index behavior.
- Run full broken internal link check.
- Test contact form submission and thank-you handling.
- Confirm Netlify deploy branch before production migration.
- Export Search Console top linked pages and top linking sites before launch.

## P1: Money-Page Conversion and SEO

- Use `OZ_SEO_GROWTH_SYSTEM.md` keyword-to-page map to avoid keyword cannibalisation.
- Strengthen `/engineered-timber-flooring-sydney/` for agency target terms.
- Strengthen `/commercial-flooring-sydney/` for commercial timber flooring and installation terms.
- Strengthen `/floor-levelling-sydney/` for floor levelling, self-levelling compound and subfloor preparation.
- Strengthen `/hybrid-flooring-sydney/`, `/laminate-flooring-sydney/`, `/vinyl-flooring-sydney/`, `/office-flooring-sydney/` and `/timber-flooring-installation-sydney/`.
- Improve internal links between money pages and product/category pages.

## P2: Catalogue/Range/Product Cleanup

- Audit product and range images for missing, generic or mismatched images.
- Clean product/range names and suspected typo slugs.
- Ensure product pages have enquiry CTAs with correct URL parameters.
- Keep `/products/` concise and balanced.
- Keep `/ranges/` useful as the complete range index.
- Document unknown product specs instead of inventing them.

## P3: UX Improvements

- Keep main nav clear and mobile-safe.
- Improve range/product page scanability.
- Keep FAQ accordions showing questions while hiding answers.
- Remove messy right-column section intros and overly academic list layouts.
- Check mobile spacing, card density and hero scale.

## P4: Content and Projects

- Add real project proof when photos/details are supplied.
- Build guide pages only where useful and internally linked.
- Improve Projects page over time with verified work examples.
- Add review snippets only if real and approved.

## P5: Backlog Polish

- Compress oversized images.
- Consolidate duplicate CSS only after launch-critical work is stable.
- Improve schema depth where useful.
- Add post-launch Search Console monitoring workflow.
- Review page speed and Core Web Vitals.
