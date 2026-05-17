# Oz Timber Floor UX/UI Audit

Audit date: 2026-05-16

Local preview: `http://127.0.0.1:5173/`

Pages inspected:

- `/`
- `/products/`
- `/ranges/`
- `/services/`
- `/contact/`
- `/engineered-timber-flooring-sydney/`
- `/hybrid-flooring-sydney/`
- `/laminate-flooring-sydney/`
- `/commercial-flooring-sydney/`
- `/builder-flooring-contractor-sydney/`
- `/ranges/avala/`
- `/ranges/kronoswiss-aquastop/`
- `/ranges/artisan-tile/`
- `/products/avala-blackbutt/`
- `/products/kronswiss-aquastop-lugano-oak/`
- `/products/artisan-calacatta/`

## Findings

| Area | Finding | Action |
| --- | --- | --- |
| Branding | Header showed the real Oz logo plus visible duplicated “Oz Timber Floor / Sydney Flooring Contractor” text. | Kept the real logo visible and made the text fallback visually hidden. |
| Old logo | Old WordPress site exposes JPEG logo assets rather than SVG. | Kept local `assets/brand/oz-timber-floor-logo.webp` for display with source JPEGs preserved. |
| Colour system | Previous interface felt more generic than logo-led. | Reconfirmed warm ivory, charcoal green and timber-brown variables in `assets/site.css`. |
| Sizing | Pages were visually heavy before the prior refresh; current preview is improved but still needed a cleaner logo line. | Removed duplicate brand text and kept the header at a lighter visual height. |
| Header | Ranges link is present and the mobile menu opens correctly. | No further nav restructure required in this pass. |
| Product navigation | `/products/` now has category thumbnails, project-type browsing, range entry point and a clear `/ranges/` path. | Confirmed in desktop and mobile preview. |
| Range navigation | `/ranges/` provides the full range library with category sections. | Confirmed in preview. |
| Product/range detail pages | Main templates show breadcrumbs, facts/specs, product imagery and enquiry CTAs. | Confirmed representative range and product pages. |
| Contact form | No blank visible metadata fields were found in preview. | Confirmed selected enquiry card remains customer-friendly. |
| Backend/system wording | Initial scan found mechanical terms and generic “system” wording in public copy. | Replaced internal phrases and softened “system” phrasing where it was not a product/customer term. |
| Mobile | Mobile product page shows logo-only header, large tap targets and a working hamburger menu. | Confirmed at 390 x 844 viewport. |
| Placeholder text | Form placeholder attributes remain where they are useful input hints. | No visible placeholder/internal page copy issue found. |

## Remaining Watch Items

- A few long legacy SEO pages still read more keyword-led than editorial. They are usable, but Vincent may want a later copy pass for tone.
- Some catalogue images are intentionally “coming soon” where exact supplier colour imagery has not been verified.
- The local static server cannot exercise Netlify redirect behavior directly; `_redirects` was checked separately.
