# Preference Floors Direct Supplier Audit

Date: 2026-05-25

Scope: Preference-family range records that were rechecked against Preference Floors supplier data after the Operon comparison left unresolved colour gaps.

Important policy note: Supplier/source names and URLs are preserved in backend catalogue data for accuracy, but the affected customer-facing range and product pages do not link out to Preference Floors or present Preference Floors as the public hero. Public pages route customers to Oz Timber Floor enquiry paths.

## Source References

- https://preferencefloors.com.au/brand/demarqueoak/
- https://preferencefloors.com.au/brand/aquastop/
- https://preferencefloors.com.au/brand/fiddleback-australian-hardwood/
- Preference Floors floor-type data containing the embedded `window.preferencefloor` catalogue records.

## Updated Range Counts

| Range | Category | Active colours now public | Phase-out colours hidden | Image gaps remaining |
| --- | --- | ---: | ---: | ---: |
| De Marque Oak | Engineered timber | 35 | 5 | 0 |
| Elk Falls Hickory | Engineered timber | 12 | 3 | 0 |
| Prestige Oak | Engineered timber | 55 | 5 | 0 |
| Hydroplank WPC | Hybrid | 12 | 0 | 0 |
| Oakleaf HD PLUS | Laminate | 12 | 5 | 3 |
| Oakleaf Laminate | Laminate | 14 | 1 | 0 |
| Kronoswiss Aquastop | Laminate | 20 | 1 | 0 |
| Preference Classic Laminate | Laminate | 9 | 0 | 0 |
| Fiddleback Australian Hardwood | Engineered timber | 6 | 0 | 0 |

## Previously Missing Colours Now Added

- De Marque Oak: Chevron Sauvignon, Chevron Riesling, Chevron Vintage
- Elk Falls Hickory: Snowdrift
- Prestige Oak: Chocolate Brown
- Hydroplank WPC: Northern Blackbutt

## Remaining Manual Image Gaps

Oakleaf HD PLUS still has three active supplier colours without a usable supplier image URL in the parsed data:

- Bellmore Oak
- Hampton Oak
- Windsor

These remain functional customer-facing product records, but their image state should be treated as needing manual supplier sample/photo confirmation before promotion.

## Phase-Out Handling

Phase-out colours were not deleted. They were marked `publicCatalogueStatus: "legacy-hidden"` so they do not appear in the visible customer catalogue while preserving backend traceability and avoiding unnecessary page deletion.

## Public QA

- Checked 237 affected Preference-family range/product HTML files.
- No `preferencefloors.com.au` public links found.
- No `target="_blank"` supplier document links found.
- No `Open supplier document`, `Supplier technical documents`, or `Supplier document` customer-facing CTAs found.
- No `Preference Floors` supplier-name wording remains in the affected customer-facing pages.
- Installation wording was normalised where old copied supplier/document text appeared.

## Files/Areas Updated

- `data/product-catalogue.json`
- Preference-family range pages under `ranges/`
- Preference-family product pages under `products/`
- Local product images under `assets/products/engineered-timber/`, `assets/products/hybrid/`, and `assets/products/laminate/`
- `.tools/rebuild-preference-ranges.mjs`

