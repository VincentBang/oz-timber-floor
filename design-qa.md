# Editorial Gallery design QA

Final result: passed for the inspected local visual implementation. This is not production or accessibility certification.

References: approved Concept 01; prototype home desktop/mobile, product mobile and contact mobile. Combined comparisons are outside the public package at `../evidence/comparison.html`, with product/contact comparison captures. Final captures are named `final-*.png`.

## Visual assessment

- Composition: retained the 42/58 home split and 74px header. The real H1 and longer business copy increase desktop hero height to roughly 655px rather than clipping into the 535px prototype target. Material discovery is the next section.
- Typography: Georgia display headings, Arial controls and body copy; no remote font request. Original keyword-specific H1 remains visible above the new editorial display paragraph.
- Photography: existing authentic local assets, unchanged colour; dimensions added, restrained rectangular crops. Product swatch remains prominent above product identity/actions on mobile.
- Rhythm: warm paper, fine rules, square controls, unboxed product cards. Stock is primary; supply + install secondary; other product enquiry paths remain in native disclosure.
- Contact: genuine title, form fields, six enquiry types and selected product context preserved. Real form appears early, rather than reproducing prototype demo form copy. Matched stock/Avala Blackbutt state inspected beside the reference.
- Discovery: complete catalogue, not the ten-item prototype. Search, range selection, reset and sorting progressively enhance existing static links. Existing range hub's own filtering is retained.
- Projects/services/secondary: shared system applied without replacing verified gallery content, service copy, legal text or FAQ content.

## Corrections made during QA

Fixed inherited selector specificity causing tall contact buttons, white product-link text on transparent backgrounds, footer contrast and project CTA contrast. Repaired existing malformed thank-you anchor/article markup without removing any meaningful destination. Kept whole range cards together for mobile filtering/sorting.

## Evidence and limitations

100 final checks: 20 routes × 1440/768/390/360/320 widths; actual viewport sizes recorded. No horizontal overflow, one H1, no broken sourced images or axe WCAG A/AA violations in those samples. Empty inactive lightbox image is not a failed network asset. Mobile menu focus/lock/inert/Escape/resize and project lightbox focus restoration exercised.

Native browser zoom shortcuts were unavailable in the controlled browser; 720px/360px reflow corresponds to 1440px at 200%/400%, with 320px additionally checked. Physical-device keyboard, OS enlarged text and native browser zoom remain manual release checks, not claimed verified.

P3: the longer genuine category headings and real form require more vertical space than the simplified prototype. Preserve their meaning rather than hiding content to make screenshots match exactly.
