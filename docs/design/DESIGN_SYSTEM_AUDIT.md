# Oz Timber Floor Design System Audit

Date: 2026-05-27

Scope reviewed:
- Homepage
- Products page
- Services page
- Builder flooring contractor page
- Hybrid category page
- Artisan Tile range page
- Guides hub
- Projects page
- Contact page

## Current Strengths

- The site already has a strong customer journey: services, product categories, ranges, colours, guides and contact pathways are clear.
- Most high-value routing cards already use real crawlable anchor links and preserve enquiry query parameters.
- Product and range cards are image-led where real product images exist.
- Header and footer navigation are consistent and avoid public supplier-heavy wording.
- The current CSS already has a warm flooring direction, so the polish can be handled as a design-system tightening rather than a rebuild.

## Visual Weaknesses

- The palette had multiple overlapping warm redesign values, which made cards and section backgrounds feel slightly inconsistent across pages.
- Some card grids used the same visual treatment for decision cards, product cards, proof cards and process steps, reducing hierarchy.
- Soft sections, normal sections and CTA bands needed clearer rhythm so long pages feel more deliberate.
- Button states were close, but secondary and inline actions needed cleaner contrast and more consistent hover/focus treatment.
- Some inline card links still looked like separate action pills inside cards, especially on Guides, Projects and Contact, while many newer cards already use full-card links.

## Inconsistent Components

- `category-card`, `card`, `range-summary-card`, `product-card`, `process-step`, `spec-item` and FAQ items all shared too much of the same surface treatment.
- Range cards and category cards now need to stay image-led and concise, while product cards should keep their two-action pattern.
- Technical/spec sections need calmer scan-friendly cards distinct from product browsing cards.

## Colour Issues

- Previous values leaned more orange/brown in some accents.
- The updated design system now uses explicit tokens:
  - `--color-bg`
  - `--color-surface`
  - `--color-surface-soft`
  - `--color-text`
  - `--color-text-muted`
  - `--color-brand`
  - `--color-brand-dark`
  - `--color-accent-timber`
  - `--color-accent-brass`
  - `--color-border`
  - `--color-white`
- Legacy aliases remain mapped to the new tokens so existing templates keep working.

## Card-Link Issues

- Many single-destination cards already use `.link-card`, which is the right pattern.
- Product cards correctly remain multi-action cards with `View details` and `Check stock`.
- Remaining `.card-link` usage is mostly inline helper/action links on Guides, Projects, Contact and a few range support sections. These were restyled to feel like compact action pills rather than underlined text links.

## CTA Inconsistencies

- Primary, secondary, light and inline buttons now share a more consistent radius, contrast and hover/focus pattern.
- CTA bands now keep a darker forest treatment for stronger end-of-page contrast.
- Product card actions remain compact and readable.

## Mobile Concerns

- The main mobile risk is very dense grids on pages with many cards; the CSS already stacks grids on small screens.
- Button tap targets remain at or above practical mobile size.
- Range/product hero image rules still prevent right-side product images from overflowing desktop and mobile viewports.

## Recommended Fixes Implemented

- Added an explicit premium flooring colour token system in `assets/site.css`.
- Tightened button contrast and hover/focus states.
- Improved card hierarchy for decision, range, product, proof, process and technical-style cards.
- Improved section rhythm with subtler soft bands and stronger CTA contrast.
- Restyled inline `.card-link` actions so they no longer feel like messy underlined links.
- Kept product cards as two-action cards and did not alter destinations or query parameters.

## Remaining Recommendations

- In a later component pass, convert remaining single-destination `article.card` blocks on Guides, Projects and Contact into full-card anchors where there is only one intended destination.
- Continue replacing missing range thumbnails with verified real images rather than decorative placeholders.
- Review the longest static generated pages after the next catalogue cleanup so card density can be reduced where old import content is still too heavy.
