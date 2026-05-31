# Site Readiness And Ranking Verdict

Date: 2026-05-26

## 1. Are We Happy With The New Site?

Yes, structurally. The new Netlify site is a much stronger customer and SEO foundation than the old WordPress site. It has clearer service pages, category pages, range pages, product pages, guide pages and enquiry pathways.

## 2. Is It Better Than Old WordPress?

Yes. The old WordPress site still has SEO value because it has indexed URLs, product-category archives, product pages, blog posts and existing authority. The new site is better for conversion, internal linking and long-term content growth as long as old URL equity is preserved through redirects.

## 3. Can It Preserve Rankings?

Likely yes, with risks. The main old service/category/blog/range URL groups are mapped. The biggest remaining risks are:

- Product alias redirect behaviour for old `/product/[product]/` URLs.
- Duplicate/alias range identities.
- Some high-value range pages needing richer supplier-backed content.
- Backlink export limitations.

## 4. What Must Be Verified Before Launch?

- Final deploy reflects latest repo state.
- Production domain canonicals/sitemap are clean.
- P0/P1 old service/category/product-category URLs return clean `301 -> 200`.
- Old product aliases return clean `301 -> 200` to product or range destinations.
- No old WordPress URLs remain in sitemap.
- No Netlify/Operon/localhost URLs appear in SEO metadata.
- Search Console sitemap submission works.

## 5. What Content Needs Enrichment?

Highest priority:

- Villeroy & Boch Aquastop pages.
- Infinite.
- Kronoswiss Aquastop thickness pages.
- Reflections.
- Swish Laminate.
- Ornato Vinyl.
- Artisan Oak.
- Prestige Oak.
- Hydroplank WPC.
- Storm Luxury.
- Solid timber species pages.
- Builder contractor guide cluster.

## 6. Which Keywords Map To Which Pages?

See `KEYWORD_TO_PAGE_MAP.md`. Summary:

- Homepage: broad timber flooring Sydney / contractor trust.
- Service pages: installation, floor levelling, sanding, removal, commercial, office.
- Builder page: builder/subcontractor keywords.
- Category pages: hybrid, laminate, engineered timber, solid timber, vinyl, bamboo.
- Supplier pages: supply-only, stock and lead-time keywords.
- Range pages: range-name keywords.
- Product pages: colour/product long-tail keywords.
- Guides: education/comparison/supporting clusters.

## 7. Which Pages Are Page 1 Candidates?

Current best candidates:

- `/`
- `/hybrid-flooring-sydney/`
- `/engineered-timber-flooring-sydney/`
- `/floor-levelling-sydney/`
- `/timber-flooring-installation-sydney/`
- `/builder-flooring-contractor-sydney/`
- `/commercial-flooring-sydney/`
- `/ranges/artisan-tile/`
- `/ranges/prestige-oak/`
- `/products/` for broad product-routing intent

With enrichment:

- `/solid-timber-flooring-sydney/`
- `/vinyl-flooring-sydney/`
- priority Aquastop/Kronoswiss/Infinite/Reflections/Swish/Ornato range pages.

## 8. What Backlinks Need Preservation?

Preserve old URLs with high internal-link footprint:

- `/`
- `/bamboo/`
- top `/product-category/laminate/*`
- top `/product-category/hybrid/*`
- top `/product-category/engineered-timber/*`
- `/timber-floor-installation/`
- `/floor-levelling/`
- `/office-flooring/`
- old guide/blog URLs

## 9. What Backlinks Should Be Built?

- Supplier/dealer listing links.
- Builder partner links.
- Commercial fit-out partner links.
- Reputable Sydney/local directories.
- Google Business Profile assets.
- Houzz/renovation profiles.
- Real project collaborator mentions.

Avoid spam, irrelevant directories and paid link farms.

## 10. 30/60/90 Day Priorities

### First 30 Days

- Stabilise migration.
- Fix redirect/canonical/404 issues.
- Enrich top range pages.
- Improve existing guide internal links.

### Days 31-60

- Publish builder and floor preparation guide clusters.
- Add real project proof.
- Enrich supplier pages.
- Improve Google Business Profile.

### Days 61-90

- Expand comparison content.
- Build legitimate backlinks.
- Improve pages with high impressions and low CTR.
- Review keywords in positions 4-20.

## Final Verdict

## READY WITH RISKS

Reason:

- The new site is better than the old WordPress site and has a strong migration structure.
- Redirect matrix, sitemap/domain strategy, service/category destinations, blog migration and internal link structure are documented.
- However, the latest sampled product-alias behaviour still needs one final crawler/browser verification, and several old high-value range pages need enrichment before they become true page 1 candidates.

If the product-alias verification passes cleanly and the final deploy confirms redirect/canonical/sitemap health, this can move to:

`READY FOR MIGRATION + SEO GROWTH`
