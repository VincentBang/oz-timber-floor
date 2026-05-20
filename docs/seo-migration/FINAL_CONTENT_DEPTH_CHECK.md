# Final Content Depth Check

Date: 2026-05-21

## Objective
Check whether the new site preserves enough topical depth from the old WordPress site across services, categories, ranges, guides and core trust pages.

## Coverage Summary

### Homepage
- Trust and positioning content exists.
- Product/category pathways, service pathways, projects and contact are all present.
- Approximate text depth in repo output: `942` words.

### Service Pages
High-intent service destinations exist and are not thin placeholders:
- `/timber-flooring-installation-sydney/`
- `/timber-floor-removal-and-stripping-sydney/`
- `/timber-floor-sanding-and-polishing-sydney/`
- `/floor-levelling-sydney/`
- `/commercial-flooring-sydney/`
- `/office-flooring-sydney/`

These pages include useful service context, internal links and enquiry pathways.

### Category Pages
Core category destinations exist and have meaningful landing-page depth:
- `/hybrid-flooring-sydney/` -> approx `1150` words
- `/laminate-flooring-sydney/` -> approx `1125` words
- `/engineered-timber-flooring-sydney/` -> approx `1288` words
- `/solid-timber-flooring-sydney/` -> approx `959` words
- `/vinyl-flooring-sydney/` -> approx `922` words

These are materially stronger than thin archive pages and support migration of old category intent.

### Range Pages
Sampled range pages are not thin and include colour links plus enquiry paths:
- `/ranges/pronto/` -> approx `908` words
- `/ranges/prestige-oak/` -> approx `922` words
- `/ranges/hydroplank-wpc/` -> approx `877` words
- `/ranges/iconic-wpc/` -> approx `979` words
- `/ranges/classic-laminate/` -> approx `995` words

The sampled range pages include:
- unique H1
- useful intro copy
- colour links
- range/spec context
- enquiry CTAs

### Guides / Blog Migration
The old blog layer has been mapped into `/guides/`.

Evidence:
- `BLOG_MIGRATION_MATRIX.csv` shows migrated guide coverage and mostly `full copied` content status for priority posts.
- Sample migrated guides are not thin:
  - `/guides/hire-over-diy/` -> approx `865` words
  - `/guides/common-questions-we-get-as-hybrid-floor-installers-in-sydney/` -> approx `942` words in repo output
  - additional sampled guides previously checked were in the `~895` to `1558` word range

### Projects
- `/projects/` exists and contributes trust/authority flow.

## Old vs New Coverage Judgment
- Old service intent: preserved
- Old category intent: preserved
- Old range/product-category intent: broadly preserved through category and range destinations
- Old blog intent: broadly preserved through mapped guide pages

## Risks
- Some long-tail range families still carry legacy alias complexity, but this is a cleanliness issue more than a depth issue.
- One migrated guide page on current staging still has empty meta/lead fields because the repo fix has not yet been deployed:
  - `/guides/common-questions-we-get-as-hybrid-floor-installers-in-sydney/`

## Conclusion
The new site preserves enough content depth to support migration. Content depth is not the main blocker. The remaining migration risk is deployment-state verification, especially redirects and the one guide metadata fix not yet visible on staging.
