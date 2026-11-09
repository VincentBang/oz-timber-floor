# Oz static website release — 9 November 2026

This directory records the exact public artifact delta from Netlify deploy
`6af0fa8acbb4ce140923b09b`. It is a reproducible release record, not a
new site build pipeline. Decompress `public.patch.gz` and use
`git apply --binary` against the prior verified public package. Check the
result against the manifest hash in PACKAGE.json before use.

Includes sitewide instructional copy refinements, Product Finder,
Projects portfolio and project enquiry context, and the homepage
category layout with the verified Oz herringbone photo. Excludes
unreleased OZ-CONVERSION changes and unlicensed third-party preview
images. Existing tools, forms, functions, routing, sitemap and provider
settings remain on the previously verified contracts.

Netlify publication is performed separately from this commit using the
sealed artifact, so no automatic rebuild or additional deployment is needed.
