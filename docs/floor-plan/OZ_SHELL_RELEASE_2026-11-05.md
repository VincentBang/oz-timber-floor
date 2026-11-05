# Oz floorplan shared-shell production release — 5 November 2026

Owner authorised pushing the latest reviewed local source and one production
deployment including the floorplan updates and homepage search-band removal.
The source checkout is the existing `codex/gallery-floorplan-release-20261105`
worktree; the older dirty main checkout remains untouched.

## Exact production scope

Six public paths differ from published deployment `6aeb8aa06b0e0a368a27e903`:
`index.html`, `assets/architectural.css`, `floor-plan/index.html`,
`floor-plan/operon-runtime.mjs`, `floor-plan/site-theme.css`, and
`floor-plan/site-tool.css`. The page uses the shared Oz header/footer/theme,
Oz enquiry wording and the enlarged footer surround. Only the owner-selected
homepage search band is removed; header and standalone search remain.

All other published files and both live function archives are byte-identical.
The published chatbot profile/corpus and clients remain the working production
version. The separately committed quality candidate and binding tools remain
inactive source work: this release does not activate or deploy them. No original
approval hashes, provider settings, budget counters or controls are replaced.
Limits remain USD30/month and USD1/day. No paid call or real enquiry is allowed.

## Source-history reconciliation

The first full local run correctly rejected the changed homepage against its
old source digest. Its failure logs are retained. A narrow compatibility helper
replays only removal of the single search band from immutable commit
`67f71ea86ac0ddd63e38b1f992c474e0ffb9d679`. It does not approve new knowledge or
activation. Whitespace drift, changed CTA/canonical/phone/H1, other files and
other parent digests are rejected by added regression cases. Old source
manifests, receipts, corpus and approval records remain byte-identical.

## Verification and release records

External packet (not in the public package):
`/Users/daibang/Documents/Codex/2026-11-04/what-do-you-need-from-me/work/oz-shell-production-20261105/`

`checks/` preserves the initial failures; `checks-final/` contains the fresh
19-stage local suite. `PACKAGE_CHECK.json` checks 2,229 unchanged protected HTML
contracts, 775 publication/sitemap owners, all local assets and links.
`floorplan-browser/` checks JPG/PNG/PDF, recovery, known 20m² geometry, resume,
consent and product/source handoff in Chromium/Firefox/WebKit on desktop/mobile.
`website-browser/` covers 1440/390/320px, shared shell, search, overflow, three
upload fields and unchecked consent. These are local tests, not device or spoken
screen-reader certification or fresh delivered enquiry evidence.

The package manifest, Git commit/push receipt, single-deployment intent and
provider/live verification are appended externally. This source note alone is
not proof of deployment. Skip markers prevent a second automatic Netlify build.

## Rollback

With owner authority, restore deployment `6aeb8aa06b0e0a368a27e903` as published.
Keep the existing chatbot profile/control/ledger, API keys, mail settings, DNS,
enquiry backend and spending counters. Do not rebuild the old dirty checkout or
deploy the inactive quality archive. Prior JPEG/device/screen-reader evidence
limitations remain recorded; this scoped shell update does not certify them.
