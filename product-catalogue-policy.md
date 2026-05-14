# Product Catalogue Policy

## Strategic position
Oz Timber Floor runs a catalogue-commerce product system for flooring supply, stock enquiries and supply + install enquiries. It is not a checkout store and must stay separate from Operon.

## Non-negotiables
- No checkout
- No instant pricing
- No Operon quote flow, quote review or floorplan logic
- No internal pricing exposure
- No wrong product images
- No hotlinked supplier images on public pages
- No raw oversized uploads
- No removal of approved range/category pages or migration redirects without replacement mapping

## Product data rules
Every product should carry, where known and supplier-confirmed:
- id
- slug
- brand
- supplier
- range
- colour
- category
- shortDescription
- thickness / total thickness
- boardSize
- packSizeM2
- installationMethod
- finish
- warrantySummary
- suitableUse
- cautionNotes
- stockStatusLabel
- primaryImage
- imageGallery
- altText
- specSheetUrl
- supplierSourceUrl

If data is unknown, leave it blank or use: Confirm with supplier before order. Do not invent specs.

## Image policy
- Images must be stored locally inside the Oz repo
- Public pages must not hotlink supplier images
- Exact colour/product image beats generic imagery every time
- If the exact image is unavailable, use a neutral coming-soon placeholder and mark the product for follow-up
- Card images should be compressed and sized for web delivery
- Product galleries should preserve traceability back to supplier source URLs

## CTA policy
Grid cards:
- View details
- Check stock

Range pages:
- Request supply price
- Check stock
- Request supply + install quote

Product pages:
- Request supply price
- Check stock availability
- Request supply + install quote
- Ask about this product

## Enquiry parameter policy
Contact links should preserve:
- enquiry type
- product name
- product slug
- brand
- range
- category
- source page

## Category policy
Current live Oz categories:
- Hybrid
- Laminate
- Engineered timber
- Solid timber
- Vinyl

Bamboo is discontinued for Oz Timber Floor and should not be reintroduced to public category pages or future imports unless explicitly re-approved. Legacy bamboo redirects may remain only for migration protection.

## Supplier import policy
- Use supplier pages as the primary source of truth for specs and image matching
- Do not silently “correct” supplier names if the supplier uses a deliberate spelling or code; flag suspicious names for review instead
- Keep supplier source URLs in product data where possible
- Preference Floors products can be added only if they follow this same policy and do not reintroduce discontinued bamboo into the live Oz catalogue
