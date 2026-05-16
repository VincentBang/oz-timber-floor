# Final Launch Readiness Report

## 1. Branch / Deploy Status

- Improved site is on `dev`.
- `origin/main` is materially behind and should not be treated as production-ready yet.
- Staging currently returns noindex headers.
- Do not connect the real domain until the deploy branch is confirmed.

## 2. Old SEO URL Redirect Status

- Core old WordPress service/category URLs are redirected to relevant new pages.
- Product/category redirects point to product, range or category pages; they are not collapsed into `/products/`.
- Legacy Bamboo URLs redirect to `/hardwood-timber-flooring-sydney/`.

## 3. Sitemap Cleanup Status

- Sitemap has 1,771 canonical production URLs.
- Bamboo and typo product URLs were removed.
- No Netlify staging URLs appear in sitemap.

## 4. Bamboo Removal Status

- Bamboo is not visible publicly.
- Bamboo remains only in redirect/documentation context for migration protection.

## 5. Product Page Simplification Status

- `/products/` is simplified with 7 range cards and 7 featured product cards.
- Full browsing depth lives under `/ranges/` and `/products/*`.

## 6. Homepage Simplicity Status

- Homepage remains simple with 6 popular range links and clear service/category paths.

## 7. Ranges Page Status

- `/ranges/` exists and is linked from header, products page and footer.

## 8. Product Data QA Issues

- Several suspected spelling issues remain for Vincent review, listed in `docs/product_data_qa.md`.
- Exact product image/colour match still needs human review for high-value ranges.

## 9. Contact Form / Conversion QA

- Contact form is production-shaped and uses Netlify form markup.
- Footer contact fallback is clickable.
- A real staging submission still needs to be tested after Netlify redeploy.

## 10. Header / Footer / Internal Link QA

- Required header and footer links are present.
- Internal link crawl found 0 broken local links.

## 11. Design Simplicity QA

- Products page and homepage are no longer overloaded.
- Remaining visual QA should focus on mobile spacing for product gallery pages.

## 12. Remaining Blockers

- Confirm Netlify deploy branch: `dev` vs `main`.
- Merge or promote `dev` only after final approval.
- Production launch needs robots/noindex behaviour changed intentionally.
- Run a real Netlify form submission test.
- Confirm product spelling/image issues in `docs/product_data_qa.md`.
- Confirm GA4/Search Console setup.
- Export Search Console top linked pages and top linking sites from the old WordPress property.

## 13. Safe To Connect Domain?

No. The site is much safer for staging review, but the real domain should not be connected until the deploy branch, staging noindex/robots behaviour, form delivery and Search Console migration checklist are confirmed.

## 14. Manual Actions For Vincent

- Confirm Netlify deploy branch.
- Confirm when to merge `dev` into `main` or deploy from `dev`.
- Test contact form delivery.
- Confirm product spelling/image issues.
- Export Search Console link reports.
- Confirm GA4 and Search Console launch setup.
- Confirm whether any insurance/licence wording should be added.
