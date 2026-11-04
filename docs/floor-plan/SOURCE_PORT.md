# Operon source-code floorplan port — local only

## Narrow owner exception

On 4 November 2026 the owner explicitly permitted read-only inspection of
`/Users/daibang/Documents/operon-platform` and copying the Flooring floorplan
UI, necessary assets and measurement logic into Oz. This is a task-specific
exception to Oz's Operon restriction, not standing cross-project permission.
No Operon file, deployment, customer record, credential or provider setting
was modified. No quote/pricing engine, database, email backend, customer data,
HomeChatbot, site configuration or Operon analytics integration was copied.

## Source and attribution

Source repository: `VincentBang/operon-platform`.
Platform HEAD inspected: `27664e6c132d85be9bc89413eff6d526e16d8074`.
Last relevant source commit: `a49b8f3b27754c522d7dcab50cdc21487ce712b0`.
Source root: `products/flooring/apps/web-tsx/`.

- `src/app/floorplan/page.tsx`: actual HTML strings, inline layout declarations,
  page stylesheet and planning-link section, not a recreated UI.
- `src/app/floorplan/FloorplanRuntime.tsx`: loader inventory; React is not needed
  by the static measurement runtime, so Oz keeps its existing static framework.
- `public/floorplanRuntime.js`: actual runtime, with the bounded changes below.
- `public/floorplanQuickRoom.js`: original algorithm, only global namespace renamed.
- `public/mobile-nav.js`: original menu, with a desktop accessibility correction.
- `src/styles/global.css`: exact applicable selectors/declarations, without other
  application sections; the page's own stylesheet is retained.

The runtime and Quick Room files matched production byte-for-byte on retrieval:

| File | Production and local SHA-256 |
| --- | --- |
| floorplanRuntime.js | 053215091dec7bdcedeb5322780648c8507047010657019c49b8357e03a2df5f |
| floorplanQuickRoom.js | 3fae7f25b4e761e2be5deb06c3d298d34852396f039d0d8f280d160737654a25 |

This identifies the relevant source content, not an independently verified
provider deployment commit. Source receipts and immutable originals are in
the external review packet, not the public package.

## Necessary adaptations and differences

1. Oz branding, canonical/robots/title/description, local navigation and enquiry
   copy. No Operon suburb destinations or quote-review service are presented
   as Oz pages. Original layout, colours, typography, cards, workspace, step
   sequence, modal and responsive ordering are retained, including source
   mobile section ordering.
2. Source inline style attributes become static stylesheet classes. The
   inherited CSP is unchanged; no inline-script/style allowance was added.
   Inter is self-hosted with its existing SIL OFL notice. No remote font/CDN
   dependency is introduced.
3. Existing Oz signed-type/size/dimension limits, JPEG/CMYK checks, PDF page
   limits, cancellation and cleanup remain in `plan-loader.mjs`. The source
   loader's unavailable PDF CDN is replaced with the existing local PDF worker.
   PDFs offer explicit page selection rather than automatic largest-page choice.
4. Operon server measurement persistence, version IDs, lead writes and tracking
   are removed. No plan/room payload, filename or raw geometry is sent to any
   backend, assistant or analytics by the tool.
5. Existing explicit sharing consent, minimal 15-minute one-use area/count
   summary and contact review/Apply are retained. Reviewed Quick Room totals
   are labelled `reviewed_suggestion`, never falsely labelled manual tracing.
6. Resume retains bounded validated geometry in session storage for 15 minutes,
   without image bytes or filenames. It requires the same file (SHA-256 match)
   and remembers PDF page and original canvas dimensions. This differs from
   Operon's image-data session restore and server review persistence.
7. Source self-crossing/overlap, calibration bounds, stale asynchronous loading,
   edit rollback and resource cleanup are guarded by existing Oz checks.
   Accepted Quick Room totals are recalculated from the reviewed outline,
   rather than reusing flood-fill pixel count that disagrees with that outline.
   The suggestion algorithm itself is unchanged. Source experimental Quick Room
   remains behind its original developer query flag, not enabled by default.
   On the synthetic two-adjoining-room 40 m² reference, bulk suggestions totalled
   37.34 m² and the enclosing merged outline totalled 37.87 m². These are not
   certified measurements. Source merge uses an enclosing outline, not an exact
   geometric union; boundaries must be reviewed. Split returns to manual tracing,
   rather than claiming to perform an automatic split. The exact manual 20 m²
   reference passes. No public activation of experimental suggestions is implied.
8. Native modal focus/Escape, live status, room labels, reduced motion and an
   optional keyboard coordinate alternative are present. Coordinate input is
   not claimed to make visual tracing independently usable without sight.
9. The deployed TSX menu PNG (348 bytes, SHA-256
   `d1d81e2e6d53721254ec078068e18a8d68e126beb63a9a47328288811a4755b7`)
   has an invalid compressed image stream. Oz uses the intact actual original
   icon from `products/flooring/apps/web/assets/mobile-menu-icon.png` (SHA-256
   `ddf61768ffb8fbc733c722e972bf875d4d8cb38d3d37797f7c2adb92be023482`).
   This is an accessibility repair, not a newly designed icon.

## Reproducible local checks

Run from the Oz checkout:

```sh
node --test scripts/floor-plan-source-port.test.mjs scripts/floor-plan-geometry.test.mjs scripts/floor-plan-handoff.test.mjs
node --test scripts/enquiry-upload.test.mjs scripts/enquiry-upload-notification.test.mjs
node scripts/analytics-event-contract.mjs
node scripts/resend-enquiry-contract.mjs
node --test assistant/tests/*.test.mjs
```

The external packet records actual commands/results, a source-only preservation
manifest, public-only overlay hashes and browser captures. No live enquiries
or paid model calls are part of these checks. Existing old-interface browser
harnesses retain their historical expectations; they are not substitutes for
the new source-port journey checks. Do not reset old approval hashes.

## Packaging, review and rollback

The normal default/production/hosted-preview floorplan feature gates are not
changed. `addFloorPlan` copies the port's additional dependencies only into an
explicitly enabled package. The external local review overlay changes only
`floor-plan/**` relative to the sealed live package; other pages/forms/functions,
catalogue, redirects, sitemap, assistant corpus/profile and spending caps remain
unchanged. This is not a production activation or deployment instruction.

Rollback is the preserved before-snapshot of the affected files, applied only
after checking for subsequent edits. Do not reset the checkout or restore a
whole old website over unrelated work. Historical browser/JPEG evidence remains
preserved. Real devices, spoken screen readers and hosted delivery are separate
checks; local success does not imply them.
