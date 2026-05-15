# UI QA Report

QA date: 2026-05-16

Local preview: `http://127.0.0.1:5173/`

## Desktop QA

| Check | Result |
| --- | --- |
| Local preview loads | Pass |
| Header uses real Oz logo | Pass |
| Duplicate visible logo/name removed | Pass |
| Ranges nav visible | Pass |
| Header CTA visible and readable | Pass |
| Footer contact fallback visible | Pass |
| Homepage hero less blocky | Pass |
| Product page scannability | Pass |
| `/ranges/` full range list accessible | Pass |
| Representative range pages load | Pass |
| Representative product pages load | Pass |
| Contact form has no blank metadata fields | Pass |
| Selected enquiry card is clean | Pass |
| Product slug/source/UTM fields hidden | Pass |
| No public internal copy in sampled pages | Pass |

## Mobile QA

Viewport tested: 390 x 844.

| Check | Result |
| --- | --- |
| Logo not oversized | Pass |
| No duplicated visible brand text | Pass |
| Mobile menu opens | Pass |
| Ranges link appears in mobile menu | Pass |
| Mobile CTAs have large tap targets | Pass |
| Product page stacks cleanly | Pass |
| No obvious horizontal scrolling in screenshot | Pass |

## Accessibility Checks

| Check | Result |
| --- | --- |
| Logo alt text | `Oz Timber Floor` |
| Header home link aria label | Present |
| Mobile menu button label | Present |
| Focus states | Present in CSS |
| Form labels | Present |
| Consent checkbox sizing | Normalised to 18px |
| Button contrast | Primary buttons use dark brand colour with white text |
| Image alt text in sampled pages | Present |

## Limitations

- Netlify redirects are not executed by the local static server. `_redirects` was checked separately and no redirect removals were detected.
- Some legacy catalogue pages still need supplier-image/data review outside this UI pass.
