# Public Copy Cleanup Report

## Customer-Facing Cleanup Completed

Removed or avoided visible wording connected to internal build/migration language, including:

- catalogue-commerce
- no checkout / no automated pricing
- WordPress preservation wording
- mapped/static/flattened range wording
- backend/system/import/source wording
- generated/placeholder/dummy wording
- supplier import wording
- staging/migration wording

## Supplier Name Cleanup

Public pages were scanned for the disallowed supplier names and exact supplier labels. Public supplier labels were removed from product enquiry URLs, card overlines, alt text, and visible copy where found.

## Allowed Exceptions

- Internal documentation and redirect QA may mention migration, WordPress, Bamboo or redirects.
- Contact form hidden field names such as `brand` remain as backend form fields only; current public product links no longer pass supplier names into that parameter.
- CSS system font tokens such as `-apple-system` are not customer-facing copy.
