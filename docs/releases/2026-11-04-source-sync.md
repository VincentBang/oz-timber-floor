# Deployed source checkpoint — 4 November 2026

This Git checkpoint records the already deployed audience pages, supplier
improvements, and floorplan implementation. It does not authorise another deploy.

- Current production deploy: `6aeacd565b1124aa60b776dd`.
- Previous floorplan deploy / rollback: `6aeac948432569013f2f5313`.
- Public package: 6,574 files; 775 sitemap URLs.
- Package manifest SHA-256:
  `7f4ac4133a97a2016a4d114a9f573a05ef8e653b927ef102541fb9923dda6d7f`.
- Two additions: `/property-manager-flooring/`, `/insurance-flooring-repairs/`.
- Verified supplier images/specifications and three Oakleaf arrival-label removals.
- Stock status and unresolved product identities remain unchanged.

## Runtime preservation

The live assistant and enquiry functions were reused byte-for-byte. The rebuilt
local corpus and source manifest are deliberately excluded from this commit.
No approval hashes, provider settings, USD30 monthly / USD1 daily controls, or
runtime functions are changed by this Git-only operation.

Ordinary builds intentionally exclude floorplan even with a hosted feature flag.
Do not deploy an ordinary build over production: the reviewed release assembly
adds the floorplan with `addFloorPlan`, preserves the existing approved assistant
config and compiled functions, and validates the exact final manifest. Production
and branch pushes for this checkpoint carry `[skip ci]` and `[skip netlify]`.

The deployment package and private evidence remain outside Git/public output.
The release report is retained locally as
`OZ_PAGES_SUPPLIER_RELEASE_2026-11-04/REPORT.txt` in the owner's Downloads folder.

## Verification already completed for this release

- Nine offline validation stages; 58 scoped tests and 218 website regressions.
- Three browser engines: 18 audience states and six floorplan handoff journeys.
- 126 supplier desktop/mobile states, with expanded image galleries.
- Every provider public-file digest and both function archives verified.
- 108 live HTTP checks; live audience and synthetic floorplan handoffs passed.
- No paid GPT calls or real form submissions.

Historical JPEG/console uncertainty and unverified physical-device/spoken-reader
behaviour remain owner-accepted risks, not newly claimed passes. Some local
historical-regression tests require sealed private evidence intentionally absent
from a clean public clone; missing evidence must not be silently treated as pass.
