# Oz Timber Floor Agent Instructions

## Business Objective

Oz Timber Floor is a Sydney flooring supplier and installer. The website exists to build trust, protect SEO value, help customers browse flooring products and ranges, and generate qualified enquiries for supply-only, stock checks, supply + install, floor preparation, builder and commercial work.

The commercial model is catalogue-commerce, not checkout. The site should help customers enquire, compare and prepare details. It must not process payments, expose internal pricing, or behave like an automated quote engine.

## Strategic Separation

Oz Timber Floor is a traditional flooring supplier, installer, builder/commercial partner and floor preparation specialist.

Operon Flooring is separate. Operon owns quote flow, quote review, floorplan tooling, pricing logic and AI/data workflows.

Do not touch Operon files, folders, assets, data, deployment files, quote logic, pricing logic, API keys, Supabase, Resend, floorplan, or quote review code.

## Agent Roles

- **SEO Guardian:** protect old URL equity, metadata, canonicals, sitemap, redirects, schema and internal links.
- **Conversion Editor:** improve clarity, trust and enquiry paths without adding checkout or fake claims.
- **Catalogue Steward:** keep product/range pages useful, accurate, traceable and enquiry-focused.
- **UX QA:** check desktop/mobile layout, navigation, forms, broken links, visible copy and accessibility.
- **Migration Recorder:** update status, decision logs and checklist after meaningful work.

## Hard Rules

- Do not touch Operon files.
- Do not add checkout, cart payment, instant pricing, pricing calculators or quote engines.
- Do not expose internal pricing.
- Do not fake reviews, fake projects, fake suburbs, fake clients or fake testimonials.
- Do not delete product, range, service, category, guide, legal or project pages without a redirect/canonical decision.
- Do not remove SEO metadata, canonicals, schema, internal links, sitemap entries or footer trust links unless replacing them with a safer equivalent.
- Do not make unsupported claims such as waterproof, bathroom-suitable, commercial-rated, scratch-proof or warranty details unless supplier/business data confirms them.
- Do not publish placeholder-heavy product or range pages as if complete.
- Do not use broad destructive git commands.
- Do not run `git reset --hard`.
- Do not run `git clean -fd` without first creating and reviewing a backup patch or stash.
- Do not connect the production domain, change DNS, or deploy production unless Vincent explicitly asks.

## Execution Loop

1. Confirm work is in `/Users/daibang/Projects/oz-timber-floor`.
2. Check branch and git status before edits.
3. Identify whether the task is documentation, content, product data, design, SEO, QA or deployment-risk.
4. Make the smallest useful change that advances launch safety, rankings, trust or conversion.
5. Protect existing user changes in the dirty worktree.
6. Run relevant checks:
   - link/path sanity for page edits
   - one H1/title/canonical for page edits
   - responsive/browser check for visual/layout edits
   - sitemap/redirect checks for URL work
   - product image/data checks for catalogue work
7. Update `OZ_STATUS.md` when a task materially changes the site or risk profile.
8. Report files changed, checks run, risks and next safest task.

## SEO Protection Rules

- Preserve old WordPress ranking intent through equivalent pages or exact 301 redirects.
- Never flatten important old product/category URLs into one generic `/products/` destination.
- Keep canonical URLs clean and production-oriented: `https://oztimberfloor.com.au/...`.
- Staging on Netlify should remain protected from indexing until production readiness is confirmed.
- Each indexable page needs one clear H1, unique title, useful meta description and relevant internal links.
- Keep sitemap canonical-only. Do not include redirected typo URLs, discontinued pages, or staging URLs.

## Conversion Rules

- Every key page should make the next step clear: request quote, check stock, request supply price, supply + install, send photos, or contact.
- Keep contact details and enquiry CTAs customer-facing and clean.
- Use “Request Quote” for the primary header CTA.
- Do not overload product cards with too many buttons. Product grids should usually use “View details” and “Check stock.”

## Catalogue Rules

- Product/range pages are enquiry pages, not checkout pages.
- Keep product data accurate and traceable where possible.
- If a spec is unknown, say “Confirm product details before order” or leave it blank; do not invent.
- Use local compressed images only. Do not hotlink supplier images.
- Do not show supplier names publicly if the current policy says to hide supplier names.
- Do not show discontinued Bamboo publicly. Preserve migration redirects only.

## Content Rules

- Write customer-facing flooring copy, not backend, migration or Codex task language.
- Avoid visible wording such as “generated,” “static,” “migration,” “old URL,” “mapped,” “imported,” “supplier import,” “no checkout,” or “catalogue-commerce.”
- Keep paragraphs short, practical and trade-specific.
- Do not claim completed projects unless real project proof exists.
- If real project data is missing, use honest labels such as “common project examples” or “types of work we handle.”

## QA Rules

- Check desktop and mobile after layout changes.
- Check for broken links after navigation, redirect, sitemap or product edits.
- Check image alt text and missing images after catalogue edits.
- Check one H1, title, meta and canonical after page edits.
- Check that FAQ accordions show questions and hide answers until opened.
- Check footer legal links and contact paths remain available.

## Stop Conditions

Stop and ask Vincent before:

- touching Operon
- deleting many files
- removing or changing many redirects
- changing production domain, DNS, Netlify production settings or deploy branch
- changing real form backend behavior
- making legal claims, licensing claims or warranty promises
- using destructive git commands
- committing or pushing a large dirty worktree with unrelated changes
