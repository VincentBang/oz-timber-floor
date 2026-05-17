# Oz Timber Floor SEO Policy

## Purpose

Protect rankings, backlink value, internal link equity and customer trust during the WordPress-to-static migration and ongoing site improvements.

## URL Preservation Rules

- Preserve old ranking URLs through equivalent pages or 301 redirects.
- Do not delete important old SEO intent unless replacing it with equal or stronger content.
- Do not redirect all old product/category/range URLs to `/products/`.
- Map old URLs to the closest relevant new URL:
  - service to service
  - category to category
  - range to range
  - product to product where possible
  - product to closest range/category only when exact page does not exist

## Redirect Rules

- Use 301 redirects in Netlify `_redirects`.
- Keep non-Bamboo redirects unless a specific redirect is proven wrong.
- Keep Bamboo redirects for migration protection, but do not show Bamboo publicly.
- Redirect typo URLs to corrected canonical pages where applicable.
- Never remove high-value redirects without documenting the reason.
- Redirect targets must exist and resolve.

## Canonical Rules

- Canonicals should use `https://oztimberfloor.com.au/`.
- Do not use Netlify staging URLs in canonicals.
- Do not canonicalize many unique products/ranges to one generic page.
- Correct typo product canonical URLs when corrected pages exist.
- Do not include redirected URLs in sitemap.

## Title, Meta and H1 Rules

- Each indexable page needs one H1.
- Each indexable page needs a unique title tag.
- Each indexable page needs a useful meta description.
- Target one primary keyword/page intent per money page.
- Do not keyword stuff.
- Keep headings customer-facing and clear.

## Internal Linking Rules

- Homepage links to major services, products, projects, guides and contact.
- Services link to related product categories, floor levelling where relevant, commercial/builder pages and contact.
- Product/category/range pages link to installation, levelling, relevant services and enquiry paths.
- Guides link to at least one service page, one product/category page and contact.
- Footer keeps service, product, all ranges, legal and enquiry links.
- `/ranges/` remains live and internally linked, even though it is not top-level navigation.

## Image Alt Text Rules

- Product swatch alt text should describe the range, colour and category.
- Example: `Avala Blackbutt hybrid flooring colour swatch`.
- Do not prefix every product image with “Oz Timber Floor” unless it is an Oz project photo.
- Real project photos should describe the actual scene.
- Do not keyword-stuff alt text.
- Do not use misleading alt text for generic/category images.

## Sitemap and Robots Rules

- Sitemap should include canonical, indexable URLs only.
- Sitemap should use `https://oztimberfloor.com.au/`.
- Do not include staging URLs.
- Do not include redirected typo URLs.
- Do not include discontinued Bamboo URLs.
- Keep important service, category, product, range, project, guide, legal and contact pages.
- Robots should be production-ready before launch.

## Noindex Rules for Staging

- Netlify staging/preview should not be indexed before production readiness.
- Do not submit staging to Search Console.
- Before connecting the real domain, confirm production pages are indexable and staging protection does not block production.

## Duplicate Product/Range Rules

- Avoid duplicate product pages for typo and corrected slugs.
- If a typo URL already exists, redirect it to the corrected canonical slug.
- Do not create near-duplicate range pages unless there is clear search/product intent.
- If supplier/product naming is uncertain, document it in QA rather than silently inventing a correction.

## Migration Checklist

- Old URL inventory complete.
- Redirect map complete.
- All redirect targets exist.
- Sitemap canonical-only.
- Robots and noindex behavior confirmed.
- Important old ranking pages rebuilt or redirected.
- Product/category/range intent preserved.
- Broken links fixed.
- Contact form tested.
- Search Console sitemap submission prepared after production launch.
- 404 monitoring plan in place after launch.
