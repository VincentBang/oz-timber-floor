# Old vs New Site Comparison

Date: 2026-05-26

Scope: comparison and recommendation only. No redirects, `netlify.toml`, sitemap, robots, canonicals, pricing logic, checkout or migration mappings were changed.

## Inputs Reviewed

- New staging site: `https://oztimberfloor.netlify.app/`
- Old WordPress site: `https://oztimberfloor.com.au/`
- `docs/seo-migration/SEO_MIGRATION_AUDIT.md`
- `docs/seo-migration/MIGRATION_READY_REPORT.md`
- `docs/seo-migration/REDIRECT_MATRIX.csv`
- `docs/seo-migration/REDIRECT_IMPLEMENTATION_NOTES.md`
- `docs/seo-migration/BLOG_MIGRATION_MATRIX.csv`
- `docs/seo-migration/BACKLINK_TARGET_REDIRECTS.md`
- Search Console exports in `docs/seo-migration/source/`

## Worktree State At Audit Start

- Existing local changes were already present before this comparison pass:
  - `products.html`
  - `docs/seo-products/`
- This task only adds recommendation documents under `docs/seo-growth/`.

## Structure Comparison

| Area | Old WordPress | New Netlify | SEO view |
| --- | --- | --- | --- |
| Homepage | Strong simple focus on `Timber Flooring Sydney`; older brand/trust footprint. | Stronger conversion routing for supply, installation, preparation, services, products, projects and guides. | New homepage is better for enquiries and internal link flow. Preserve old homepage keyword focus in title/H1/support copy. |
| Product hub | `/products/` exists but is thin; product browsing mostly lives in WooCommerce-style categories/products. | `/products/` is a curated routing hub into categories, ranges, colours and enquiry paths. | New hub is better. Do not turn it into a catalogue dump. |
| Product categories | `/hybrid/`, `/laminate/`, `/solid-timber/`, `/vinyl/`, `/bamboo/`, plus `/product-category/*`. | Clean category pages: `/hybrid-flooring-sydney/`, `/laminate-flooring-sydney/`, `/engineered-timber-flooring-sydney/`, `/solid-timber-flooring-sydney/`, `/vinyl-flooring-sydney/`, `/bamboo-flooring-sydney/`. | New category structure is stronger if redirects stay clean. |
| Range URLs | Many `/product-category/[category]/[range]/` archive URLs with keyword value. | Dedicated `/ranges/[range]/` pages with colours, CTAs and stronger product data. | New structure is better, but old range URL equity must be redirected to closest matching range pages. |
| Product URLs | WooCommerce-style `/product/[product]/` footprint. | Dedicated `/products/[colour]/` pages. | Good long-tail potential. Ensure old product aliases resolve to product or parent range, not homepage. |
| Services | Old `/services/` plus individual service pages. | Strong service hub plus dedicated high-intent pages for installation, levelling, removal, sanding, commercial, office and builder contractor. | New service depth is clearly better. |
| Blog/archive | `/blogs/` and root-level posts. | `/guides/` with 20 migrated guide pages. | New guide structure is better, but old blog content depth and redirects must stay preserved. |
| Gallery/projects | Older site has a project/gallery footprint but less structured. | `/projects/` exists as a clean proof hub. | New site needs more real project proof over time. |
| Contact | Old contact page exists but returned 403 in live sample. | New `/contact/` has stronger enquiry routing and query parameter paths. | New contact flow is better for conversion. |
| Internal links | Old has many product-category internal links from WP templates. | New has intentional hub links across services, products, ranges, guides and CTAs. | New is cleaner. Watch for orphaned long-tail range/product pages. |
| Trust/review content | Old has age/history and some trust content. | New has better process and project pathways but should add more genuine project proof and reviews over time. | Preserve old trust signals and strengthen with real project examples. |

## What The New Site Does Better

- Clearer customer journey: products -> category -> range -> colour/product -> enquiry.
- Better service landing pages for installation, floor levelling, removal, sanding, commercial, office and builders.
- Stronger local intent pages using Sydney-specific URLs and metadata.
- Much stronger range and product depth than the old WooCommerce archive pattern.
- Better enquiry routing for stock, supply-only and supply + install.
- Production-domain canonicals and sitemap structure are already planned for migration.

## What The Old Site Still Has That Must Be Preserved

- Indexed legacy URL footprint:
  - `/hybrid/`
  - `/laminate/`
  - `/solid-timber/`
  - `/vinyl/`
  - `/bamboo/`
  - `/product-category/[category]/[range]/`
  - `/product/[product]/`
  - root-level blog URLs
- Existing authority around broad terms such as `timber flooring Sydney`.
- Search Console internal-link concentration on old range archives such as Villeroy & Boch Aquastop, Kronoswiss Aquastop, Infinite, Reflections, Swish, Ornato, Prestige Oak and Stone Floor.
- Old blog/article topics that can support long-tail rankings if mapped into guides.

## SEO Risks

- Redirect risk if old product-category URLs are sent to broad hubs instead of the closest range.
- Long-tail product risk if `/product/[product]/` aliases are not consistently redirected to `/products/[product]/` or parent ranges.
- Duplicate/cannibalisation risk between category pages and supplier pages if titles/copy become too similar.
- Thin alias range risk: several old alias folders contain minimal redirect/transition content and should not be promoted as separate SEO pages.
- Content quality risk for high-value range pages that still lack supplier-backed specifications, technical checks or rich FAQs.
- Backlink attribution limitation: Search Console export provides linking pages but not every exact target URL.

## Content Gaps

- More real project proof and before/after examples.
- More builder/subcontractor proof content.
- More product comparison content for categories and guides.
- More supplier-backed range specs where data is verified.
- More internal links from guides to money pages.
- Stronger local trust content: service areas, project constraints, strata/builders/commercial examples.

## Keyword Opportunities

- Broad local: timber flooring Sydney, flooring contractor Sydney, timber flooring supplier Sydney.
- Services: timber flooring installation Sydney, timber floor installer Sydney, floor levelling Sydney, commercial flooring Sydney, office flooring Sydney.
- Builder: builder flooring contractor Sydney, timber flooring subcontractor Sydney.
- Categories: hybrid flooring Sydney, laminate flooring Sydney, engineered timber flooring Sydney, solid timber flooring Sydney, vinyl flooring Sydney.
- Supplier intent: hybrid flooring supplier Sydney, laminate flooring supplier Sydney, engineered timber supplier Sydney.
- Range/product long-tail: `[range] flooring Sydney`, `[colour] [category] flooring`, stock/availability/supply queries.

## Pages Needing Enrichment

- Top old range destinations by Search Console internal links:
  - `/ranges/villeroy-boch-aquastop-10mm/`
  - `/ranges/infinite/`
  - `/ranges/kronoswiss-aquastop-laminate-12mm/`
  - `/ranges/kronoswiss-aquastop-laminate-14mm/`
  - `/ranges/reflections/`
  - `/ranges/swish-laminate/`
  - `/ranges/ornato-vinyl/`
  - `/ranges/artisan-oak/`
  - `/ranges/prestige-oak/`
  - `/ranges/hydroplank-wpc/`
  - `/ranges/artisan-tile/`
- Category pages should keep clear differentiation from supplier pages.
- Guide pages should be reviewed for internal links, not just migrated body copy.

## Link And Backlink Risks

- Some Search Console link exports are linking-page lists without exact target pairing.
- Current backlink protection should focus on old URLs with high internal links and known category/range visibility.
- Avoid homepage dumping. Preserve relevance: old service -> service, old category -> category, old range -> range, old product -> product/range.
