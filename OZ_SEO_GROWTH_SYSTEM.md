# Oz Timber Floor SEO Growth System

## Purpose

This operating system protects Oz Timber Floor during the rebuild/migration and then turns the site into a compounding local SEO and conversion asset.

Oz Timber Floor is a Sydney flooring supplier and installer. The site should rank for flooring services, timber flooring installation, floor levelling, hybrid flooring, laminate flooring, engineered timber, commercial flooring, builder flooring, product/range searches and project/gallery trust queries.

The commercial model is enquiry-led catalogue browsing, not checkout.

## Hard Rules

- Do not change quote or pricing logic.
- Do not expose internal pricing.
- Do not delete SEO pages without a redirect/canonical decision.
- Do not remove product/range pages.
- Do not remove service pages.
- Do not create thin blog spam.
- Do not create fake projects, fake testimonials or fake reviews.
- Do not use spam backlink schemes.
- Keep all content useful, customer-facing and conversion-focused.

---

## 1. Migration SEO Checklist

### Current Local Audit Snapshot

Checked on 17 May 2026 in `/Users/daibang/Projects/oz-timber-floor` on branch `dev`.

| Item | Current status | Notes |
|---|---:|---|
| `sitemap.xml` exists | Yes | Uses production `https://oztimberfloor.com.au/` URLs. |
| `robots.txt` exists | Yes | Currently `Disallow: /`. Good for staging, launch blocker for production. |
| `_headers` exists | Yes | Contains `X-Robots-Tag: noindex, nofollow`. Good for staging, launch blocker for production. |
| `_redirects` exists | Yes | Contains service, category, guide, product-category and product redirects. |
| Key page H1 count | Passed sample | Key money pages checked had one H1 each. |
| Canonical strategy | Production canonical | Local pages use production domain canonicals. |
| Accidental noindex | Staging-wide noindex present | Intentional for staging, must be removed/conditioned for production. |
| Search Console readiness | Manual action needed | Do not submit staging. Submit production sitemap after launch. |
| Analytics/conversion tracking | Manual confirmation needed | Confirm GA4 and form/phone/email event tracking before launch. |

### Pre-Launch Required Checks

- Confirm sitemap loads at `/sitemap.xml`.
- Confirm robots is production-ready before domain launch.
- Confirm no staging `X-Robots-Tag: noindex` applies to production.
- Confirm all old high-value WordPress URLs redirect to the closest matching new pages.
- Confirm no important old URL redirects to homepage unless there is no relevant replacement.
- Confirm no broken internal links.
- Confirm no broken images.
- Confirm no duplicate titles on key pages.
- Confirm no duplicate/confusing H1s.
- Confirm Search Console ownership and sitemap submission workflow.
- Confirm GA4/conversion tracking for:
  - form submit
  - phone click
  - email click
  - product enquiry source where possible

### Redirect Mapping Report

| Old URL | New URL | Redirect status | Notes |
|---|---|---:|---|
| `/` | `/` | No redirect needed | Homepage exists. |
| `/about-us/` | `/about/` | 301 | Preserves business/about intent. |
| `/services/` | `/services/` | 200 rewrite | Clean URL maps to static page. |
| `/contact-us/` | `/contact/` | 301 | Preserves contact intent. |
| `/timber-floor-installation/` | `/timber-flooring-installation-sydney/` | 301 | High-value service page. |
| `/floor-levelling/` | `/floor-levelling-sydney/` | 301 | High-value SEO page from agency report. |
| `/commercial-flooring/` | `/commercial-flooring-sydney/` | 301 | High-value SEO page from agency report. |
| `/office-flooring/` | `/office-flooring-sydney/` | 301 | High-value SEO page from agency report. |
| `/timber-floor-sanding-and-polishing/` | `/timber-floor-sanding-and-polishing-sydney/` | 301 | Service intent preserved. |
| `/timber-floor-removal-and-stripping/` | `/timber-floor-removal-and-stripping-sydney/` | 301 | Service intent preserved. |
| `/hybrid/` | `/hybrid-flooring-sydney/` | 301 | High-value category page. |
| `/laminate/` | `/laminate-flooring-sydney/` | 301 | High-value category page. |
| `/engineered-timber-flooring/` | `/engineered-timber-flooring-sydney/` | 301 | Primary engineered timber target. |
| `/manufactured-wood/` | `/engineered-timber-flooring-sydney/` | 301 | Preserves engineered/manufactured wood intent. |
| `/solid-timber/` | `/solid-timber-flooring-sydney/` | 301 | Category intent preserved. |
| `/vinyl/` | `/vinyl-flooring-sydney/` | 301 | High-value category page. |
| `/bamboo/` | `/hardwood-timber-flooring-sydney/` | 301 | Bamboo discontinued publicly; migration redirect preserved. |
| `/blogs/` | `/guides/` | 301 | Blog hub intent preserved. |
| `/gallery/` | `/projects/` | 301 | Gallery trust intent preserved. |
| `/faqs/` | `/faqs/` | 200 rewrite | Clean URL maps to static page. |
| `/product-category/...` | closest category/range page | Many 301s present | Must not flatten all to `/products/`. |
| `/product/...` | closest product page | Many 301s present | Continue QA for typo/product slugs. |

### Migration Risks Found

- **Production indexing blocker:** `robots.txt` and `_headers` currently block indexing. This is correct for staging but must be changed before production domain launch.
- **Large dirty worktree:** many product/image/page changes are currently uncommitted. Avoid bulk commits until QA is complete.
- **Product URL QA needed:** many product redirects exist; typo and supplier-origin slugs need a dedicated review before launch.
- **Image QA needed:** product/range image completeness and exact colour matching still need manual and automated checks.

---

## 2. Keyword-to-Page Map

Each keyword cluster should have one primary ranking page to avoid cannibalisation.

| Keyword cluster | Primary page | Secondary/supporting pages | Notes |
|---|---|---|---|
| timber flooring Sydney, flooring contractor Sydney, timber floor company Sydney | `/` | `/services/`, `/products/`, `/projects/` | Homepage should stay broad and local. |
| flooring services Sydney | `/services/` | service detail pages | Services hub should route users to the right service. |
| timber flooring installation Sydney, timber floor installer Sydney | `/timber-flooring-installation-sydney/` | `/floor-levelling-sydney/`, product categories | Main installation page. |
| floor levelling Sydney, subfloor preparation Sydney, self-levelling compound Sydney | `/floor-levelling-sydney/` | installation, hybrid, engineered timber | High-value preparation page. |
| hybrid flooring Sydney, hybrid flooring installation Sydney | `/hybrid-flooring-sydney/` | `/products/`, `/ranges/`, installation | Category page should link to relevant ranges/products. |
| laminate flooring Sydney, laminate flooring installation Sydney | `/laminate-flooring-sydney/` | `/products/`, `/ranges/`, installation | Category page should stay practical, not product dump. |
| engineered timber flooring Sydney, engineered timber floor installation Sydney | `/engineered-timber-flooring-sydney/` | hardwood, solid timber, installation, levelling | Priority growth page. |
| commercial flooring Sydney, commercial timber flooring Sydney | `/commercial-flooring-sydney/` | `/office-flooring-sydney/`, builder, projects | Commercial page should include offices, retail, medical, hospitality, staged work. |
| office flooring Sydney | `/office-flooring-sydney/` | commercial, products, projects | Office-specific intent should not be swallowed by commercial page. |
| builder flooring contractor Sydney, flooring contractor for builders Sydney | `/builder-flooring-contractor-sydney/` | commercial, installation, levelling | Builder and site-manager language. |
| flooring projects Sydney, timber flooring gallery Sydney, flooring installation examples Sydney | `/projects/` | services, product categories | Proof/trust page; no fake projects. |
| product/range specific searches | `/ranges/{range}/` and `/products/{product}/` | parent category and contact | Preserve long-tail product/range intent. |

---

## 3. Money Page Improvement System

Audit every primary money page against the same checklist.

### Money Page Checklist

- Title tag includes the primary keyword naturally.
- Meta description explains service/product and enquiry path.
- One H1 with clear local intent.
- First 100 words quickly explain what Oz does and who it helps.
- H2 structure answers practical customer questions.
- Includes site-condition/preparation notes where relevant.
- Includes trust proof, but only real proof.
- Links to related services/products/guides/contact.
- CTA appears near top and bottom.
- FAQ block answers real buying/service questions.
- FAQ schema exists where FAQs are present.
- Image alt text is descriptive and not keyword-stuffed.
- Mobile sections are easy to scan.

### Priority Improvement Queue

1. Homepage: keep simple, strengthen pathways to services/products/projects/contact.
2. Services: improve service-routing clarity and internal links.
3. Timber flooring installation: connect product choice, preparation, trims, access and timing.
4. Floor levelling: strengthen subfloor preparation and self-levelling intent.
5. Hybrid flooring: category choice, range links, install/preparation considerations.
6. Laminate flooring: dry internal rooms, supply/install, preparation and range links.
7. Engineered timber: priority page for engineered timber flooring Sydney.
8. Commercial flooring: offices, retail, hospitality, medical suites, staging, documentation.
9. Builder flooring: scheduling, staged handover, preparation, supply + install.
10. Projects: trust/proof without fake completed job claims.
11. Products/ranges: clean browsing, accurate images, clear enquiry paths.

---

## 4. Three-Month Content Cluster Plan

Do not publish random weekly blogs. Each guide must support a money page and a conversion action.

### Month 1

| Content item | Target keyword | Intent | Supporting money page | Internal links | CTA | FAQ opportunities |
|---|---|---|---|---|---|---|
| Hybrid vs laminate flooring | hybrid vs laminate flooring | Compare options | `/hybrid-flooring-sydney/`, `/laminate-flooring-sydney/` | hybrid, laminate, installation, contact | Ask which floor suits my project | durability, moisture, cost factors, rental use |
| Do I need floor levelling before hybrid flooring? | floor levelling before hybrid flooring | Preparation education | `/floor-levelling-sydney/` | hybrid, installation, contact | Ask about floor preparation | flatness, compound, timing, old floor removal |
| How to compare flooring quotes | compare flooring quotes Sydney | Quote quality | `/services/` | installation, levelling, products, contact | Send a quote for review/discussion | inclusions, trims, removal, preparation |
| Project/example page 1 | flooring project example Sydney | Trust/proof | `/projects/` | relevant service/category | Request similar quote | photos, access, product choice |
| Project/example page 2 | apartment flooring example Sydney | Apartment trust | `/projects/` | hybrid, levelling, contact | Send project photos | strata, lifts, acoustic, timing |

### Month 2

| Content item | Target keyword | Intent | Supporting money page | Internal links | CTA | FAQ opportunities |
|---|---|---|---|---|---|---|
| Engineered timber vs solid timber | engineered timber vs solid timber | Compare real timber options | `/engineered-timber-flooring-sydney/`, `/solid-timber-flooring-sydney/` | hardwood, installation, levelling | Ask about timber options | wear layer, stability, sanding, installation |
| Flooring for apartments | apartment flooring Sydney | Apartment constraints | `/timber-flooring-installation-sydney/` | hybrid, engineered, levelling, contact | Send apartment details | strata, access, acoustic, lifts |
| What should be included in a flooring installation quote? | flooring installation quote inclusions | Buyer education | `/timber-flooring-installation-sydney/` | services, products, levelling | Request a detailed quote | removal, trims, prep, disposal |
| Project/example page 3 | commercial flooring project example | Commercial trust | `/commercial-flooring-sydney/` | office, products, contact | Request commercial quote | staging, access, handover |
| Project/example page 4 | floor levelling project example | Preparation proof | `/floor-levelling-sydney/` | installation, hybrid, engineered | Ask about levelling | uneven floors, compound, finished height |

### Month 3

| Content item | Target keyword | Intent | Supporting money page | Internal links | CTA | FAQ opportunities |
|---|---|---|---|---|---|---|
| Floor preparation checklist before installation | floor preparation checklist | Pre-install education | `/floor-levelling-sydney/` | installation, removal, contact | Send floor photos | moisture, flatness, trims, access |
| Floating vs glue-down timber flooring | floating vs glue down timber flooring | Installation method comparison | `/engineered-timber-flooring-sydney/` | installation, levelling, products | Ask about install method | subfloor, acoustic, apartment use |
| Supply-only vs supply + install flooring | supply only flooring Sydney | Commercial model clarity | `/products/` | products, ranges, installation, contact | Request supply price | stock, batch, delivery, installer responsibility |
| Project/example page 5 | builder flooring project example | Builder trust | `/builder-flooring-contractor-sydney/` | commercial, levelling, contact | Request builder support | schedule, staged work, handover |
| Project/example page 6 | timber floor replacement example | Replacement trust | `/timber-floor-removal-and-stripping-sydney/` | removal, installation, products | Request replacement quote | removal, disposal, substrate |

---

## 5. Project Page System

The Projects page should build trust without inventing completed work.

### Rules

- Use real project details only where verified.
- If not verified, label cards as “common project example.”
- Do not invent suburbs, customers, products or results.
- Use real photos where available.
- Do not use product swatches as completed project proof.
- Link each project/example to relevant services and product/category pages.
- CTA: `Request similar quote`.

### Project Card Fields

- Project type
- Flooring type
- Scope
- Preparation issue
- Outcome
- Image
- Relevant links

### Project Categories

- Residential
- Apartment / strata
- Commercial / office
- Builder
- Floor preparation / levelling
- Sanding and polishing
- Removal and replacement

---

## 6. Internal Linking System

### Rules

- Category pages link to relevant ranges.
- Range pages link to parent category and contact.
- Product pages link to range, category, levelling, installation and contact.
- Guides link to money pages.
- Project pages link to services/products.
- Services link to preparation/product guides.
- Footer keeps broad navigation.
- Top navigation stays simple.

### Guide Link Requirement

Each new guide should include:

- 1 primary money page link
- 1 related service page link
- 1 product/category page link
- 1 contact/quote link

Use natural anchors. Avoid excessive exact-match linking.

### Priority Internal Link Improvements

- Add more links into `/engineered-timber-flooring-sydney/` from homepage, products, installation, floor levelling, commercial, builder, solid timber, guides and footer.
- Link commercial and office pages together naturally.
- Link floor levelling into hybrid, laminate and engineered timber pages.
- Link product/range pages back to installation and floor preparation.
- Link Projects examples to the most relevant service/category page.

---

## 7. Backlink and Local Authority Plan

Use legitimate, relevant authority sources only.

### Good Backlink Targets

- Supplier/manufacturer dealer pages where allowed.
- Builder partner websites.
- Renovation and interior design directories.
- Local Sydney business directories.
- Chamber of commerce and local business associations.
- Houzz or similar renovation platforms.
- Project collaborators.
- Flooring/product partners.

### Do Not Use

- Paid link farms.
- Fiverr backlink packages.
- Private blog networks.
- Spam guest posts.
- Irrelevant overseas directories.
- Fake profile networks.

### Outreach Template: Supplier Dealer Page

Subject: Dealer listing request for Oz Timber Floor

Hi [Name],

Oz Timber Floor supplies and installs flooring products across Sydney. Could you please confirm whether we can be listed on your dealer, stockist or installer page?

Business name: Oz Timber Floor  
Website: https://oztimberfloor.com.au/  
Service area: Sydney  
Contact: info@oztimberfloor.com.au

Happy to provide any preferred wording or business details.

Thank you,  
Oz Timber Floor

### Outreach Template: Builder/Project Partner Link

Subject: Project partner link for flooring work

Hi [Name],

Thanks for working with Oz Timber Floor. If your website includes supplier, trade partner or project collaborator pages, would you be open to listing Oz Timber Floor as a flooring supplier/installer partner?

Suggested link: https://oztimberfloor.com.au/  
Suggested wording: Sydney flooring supplier and installer for timber, hybrid, laminate and floor preparation projects.

Thank you,  
Oz Timber Floor

### Outreach Template: Local Business Directory

Subject: Business listing update for Oz Timber Floor

Hi [Directory Team],

Please add or update the listing for Oz Timber Floor.

Business: Oz Timber Floor  
Website: https://oztimberfloor.com.au/  
Category: Flooring supplier and installer  
Service area: Sydney  
Email: info@oztimberfloor.com.au

Thank you.

### Outreach Template: Project Collaboration Page

Subject: Project collaboration page link

Hi [Name],

If you publish a project page for our shared work, please include Oz Timber Floor as the flooring supplier/installer where appropriate.

Website: https://oztimberfloor.com.au/  
Relevant service page: [insert service/category page]

We can provide accurate wording and approved photos where available.

Thank you.

---

## 8. Google Business Profile Monthly Checklist

- Add real project photos.
- Keep phone, website, service area and hours accurate.
- Request reviews from completed jobs.
- Respond to reviews professionally.
- Add service/product descriptions where appropriate.
- Link website correctly.
- Keep contact details consistent with the website.
- Do not fake reviews.
- Do not create fake locations.

---

## 9. Monthly SEO Review Template

Use Google Search Console and analytics/conversion data.

### Metrics to Track

- Clicks
- Impressions
- CTR
- Average position
- Top queries
- Pages ranking positions 4-20
- Pages with high impressions but low CTR
- Pages losing clicks
- Pages not indexed
- New keyword opportunities
- Leads by landing page if conversion tracking exists

### Monthly Action Rule

Improve 3 existing pages:

- 1 service page
- 1 product/category page
- 1 guide/project page

Publish or improve:

- 1 high-quality guide, or
- 1 verified project/example page, or
- 1 product/range improvement

Build:

- 1 to 3 legitimate local, supplier, partner or industry backlinks/citations.

### Monthly Review Notes Template

| Section | Notes |
|---|---|
| Month reviewed |  |
| Biggest click gains |  |
| Biggest click losses |  |
| Queries in positions 4-20 |  |
| High impressions / low CTR pages |  |
| Pages needing title/meta improvement |  |
| Indexing issues |  |
| 404/redirect issues |  |
| Leads by page |  |
| 3 pages improved |  |
| Content/project published |  |
| Backlinks/citations built |  |
| Next month focus |  |

---

## 10. Manual Decisions Needed

- Confirm final production robots and `_headers` behavior before connecting the real domain.
- Confirm Netlify deploy branch.
- Confirm Search Console property and sitemap submission timing.
- Confirm GA4 and conversion event setup.
- Confirm final form backend and test submission.
- Confirm whether any supplier names may appear publicly. Current policy says no.
- Supply real project photos/details before publishing completed case studies.
- Export Search Console top linked pages and top linking sites.
