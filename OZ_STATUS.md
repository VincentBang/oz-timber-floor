# Oz Timber Floor Status

## 27 October 2026 — GitHub source synchronisation prepared on a review branch

Prepared the latest deployed website source on `codex/live-site-sync-20261027`, including previously uncommitted approved migration/catalogue/form/analytics repairs, the eight range text fixes and monochrome theme. Selected website source and minimal public build/check inputs only; private release/audit data and screenshots remain local. Fresh staged-source export reproduces the reviewed 6,262-file protected package with a successful build and zero catalogue/image mutations. Text tests, analytics/enquiry contracts, field integrity, credential scan and staged diff checks pass. `main` remains unchanged because it automatically triggers a Netlify production build; this GitHub synchronisation does not redeploy production. Public source summary: `docs/GITHUB_SOURCE_SYNC_2026-10-27.md`; owner-local push evidence is retained separately.

## 27 October 2026 — approved latest design and range repairs published

Owner requested production deployment after the design review. Published the validated 6,262-file public-only package to the existing Netlify site as production deploy `6adfbb7059d75a50df80ebca`; provider confirms ready/published at `https://oztimberfloor.com.au/`. Includes the monochrome theme and eight Villeroy & Boch text repairs. Preserved existing production indexing, GA4 configuration, form function, redirects, sitemap, catalogue holds and all other content; no DNS, domains, email/provider settings or Git changes.

Actual live verification passes all 773 sitemap pages, all 539 legacy outcomes and all eight repaired ranges; CSS/config/robots/verification bytes match the candidate, private files return 404 and www redirects to apex. Production browser QA passes 28 responsive cells and eleven interactions with no detected overflow, broken images, uncaught JS errors or text-contrast failures. No forms submitted or analytics events sent by QA. Previous production `6adf0bae91e46eca56e40052` remains the rollback reference. Existing broader SEO/evidence conflicts remain documented separately, not suppressed. Evidence: `docs/release/monochrome-production-2026-10-27/REPORT.md`.

## 27 October 2026 — Modern Monochrome Luxury palette implemented for review

Refined `assets/site.css` to one shared warm-white/stone/charcoal palette with restrained bronze detail, accessible dark-bronze text/focus and neutral form boundaries. Preserved layout tokens, typography, official logo, product photography and all page/SEO/form/catalogue contracts. Fresh comparison passes 773 publication/sitemap owners and sixteen protected files with zero differences; all 2,226 packaged HTML files remain byte-identical to the repaired candidate. Browser QA passes 28 before/after route-width pairs, eleven interactions and 5,545 measured text checks with no detected contrast failures or geometry changes. Eighty screenshots are retained.

Isolated protected build and 6,262-file package validation pass all 539 legacy outcomes and link/asset/schema checks. Draft `6adfb9fe5186fcbcb0bd45ed` is at `https://6adfb9fe5186fcbcb0bd45ed--oztimberfloor.netlify.app/`; existing Netlify team protection returns 401 without login, so deployed-page HTTPS/render verification is not claimed. Production is unchanged. Existing older UI hashes and ten SEO-hardening routing/evidence conflicts remain explicitly reported, not suppressed or treated as theme regressions. No commit, push, merge, production publication, DNS, domain, analytics, email or form-backend changes. Full evidence and before/after images: `docs/release/monochrome-luxury-2026-10-27/REPORT.md`. Ready for owner visual review, not an unconditional production-release GO.

## 27 October 2026 — eight Villeroy & Boch text defects repaired locally

Corrected repeated ampersand encoding in all eight affected range HTML pages, their schema/enquiry links and twenty identity fields in the eight underlying catalogue records. Added a shared text normalizer with three passing regression tests and integrated it into the legacy catalogue cleanup parser/renderer; the broad cleanup tool was not run. Existing range classifications, noindex holds, canonicals, redirects, sitemap, forms and supplier/product facts are unchanged. Protected file hashes match entry state.

Local verification passes 24 responsive cells and 24 prefill journeys at 320/390/768, with no clipped/corrupt text, broken images, overflow or JS errors. Isolated production-package validation passes 773 sitemap owners and all 539 legacy outcomes; the 6,262-file candidate differs only in the eight repaired public HTML files. Candidate: `/private/tmp/oz-range-text-fix.eHBVHR/dist`; report: `docs/release/range-text-repair-2026-10-27/REPORT.md`. No commit, push, deployment, provider setting or form submission occurred. Earlier audit findings describe the still-live pre-repair state until a deployment is requested.

## 27 October 2026 — Search Console's 19 historical noindex examples reconciled

Read all 19 examples from the owner's authenticated Search Console report (last updated 23 October, before the 26 October migration) and checked every URL live. Five legacy landing URLs now return one-hop 301s to indexable, self-canonical owners; twelve obsolete WordPress feed URLs correctly return 404; the retired Uncategorized archive returns the existing 410; the old search-placeholder query canonicalizes to the indexable homepage. Current home, robots.txt and 773-entry sitemap have no global indexing block. No accidental destination noindex defect was found, so no site/indexation/routing change was made. No Search Console validation or indexing request was sent. Full URL evidence: `docs/release/gsc-noindex-2026-10-27/LIVE_RESULTS.json`; disposition: `REPORT.md` in the same directory. Eight mobile Villeroy & Boch text defects identified in the separate responsive audit remain outstanding.

## 27 October 2026 — whole-site live mobile responsive review

Read-only browser audit completed all 2,225 packaged customer-page URLs, including all 773 current sitemap URLs, at 320, 390 and 768 pixels: 6,675 viewport checks. Zero detected document-wide horizontal overflow, broken visible images, JavaScript errors or navigation failures. Element-level review nevertheless confirmed clipped/corrupted breadcrumb, heading and description text on eight Villeroy & Boch range pages: repeated ampersand escaping extends text beyond the viewport while document overflow is hidden. Six initially pending-image cases passed a slower retest. All final pages had one H1 and initialized the shared JavaScript. Twenty-four effective behavioral checks passed across the three widths for menus, scroll locking/drawer scrolling, outside/Escape dismissal, range search/reset and items beyond 12, FAQ toggling, product prefill, required consent and unobstructed submit; no enquiry was submitted. Initial harness assumptions and corrected retests are preserved separately.

Verdict: usable overall, repair the eight text defects. Minor observations: footer Cookie settings target is 23.33px high, first-visit analytics banner is tall at 320px, and product heroes can stack four full-width actions. Automated checks cover every enumerated page; human visual inspection covers representative templates and is not a physical-device or WCAG certification. Product-design audit guidance informed the screenshot-backed review. Report and exact page evidence: `docs/release/mobile-audit-2026-10-27/REPORT.md`. No site sources, deployment or provider settings changed.

## 26 October 2026 — production DNS cutover complete and indexing enabled

Owner changed only the public web records: apex resolves to Netlify (`75.2.60.5`) and `www` resolves by CNAME to `oztimberfloor.netlify.app`; the existing MX and mail records were preserved. Corrected production deployment `6adf0bae91e46eca56e40052` is published from the isolated validated package, serves the 773-route candidate, enables owner-approved GA4 measurement ID `G-EWSMKKM9N8`, and has working apex HTTPS plus a Netlify `www` → apex 301. The isolated production-package validator passed 773 sitemap owners and all 539 legacy outcomes (18 direct 200, 507 one-hop redirects, 14 deliberate 410).

Fresh public checks confirm the apex and sitemap return 200 without `X-Robots-Tag`, the sitemap contains exactly 773 unique production canonicals, and `www` redirects to the apex. The earlier production deploy had accidentally retained the preview header because it was published from the repository context; republishing the same validated files from the isolated production directory removed it. No production form submission has been made in this cutover window. Search Console sitemap submission and the separately authorised production form/GA4 verification remain post-cutover actions.

## 26 October 2026 — 773-route protected draft deployed and verified

Owner authorised deployment of the exact validated candidate as a protected Netlify draft. Deploy `6adeedca520756e458515e7e` is ready at `https://6adeedca520756e458515e7e--oztimberfloor.netlify.app`, context `deploy-preview`, with no publication timestamp. Package identity remains 6,262 files / 583,628,138 bytes / SHA-256 `6fc94b830e55139ed9bbfd3da536fa8e7e9bbfcf22ba85f941cc512a278ad269`. Fresh HTTPS validation passed all 773 sitemap owners and 539 legacy routes (18 direct 200, 507 one-hop redirects, 14 deliberate 410), global noindex, disabled GA4, Google verification, real 404s and direct sitemap-index routing. No form was submitted. The primary deployment, WordPress, DNS, TLS, production indexing and analytics remain unchanged. Cutover remains HOLD for the owner/provider gates in `docs/release/cutover-readiness-2026-10-26/FINAL_READINESS.md`.

## 26 October 2026 — local cutover candidate complete; cutover HOLD

Completed the authorised local content/SEO continuity repairs and isolated cutover validation. Restored `/oak-flooring-sydney/` as a dedicated publication owner, expanded FAQs and installation content, and reconciled the publication/sitemap set at 773. Both protected and isolated-production packages pass all 539 legacy outcomes and 773 sitemap owners; changed-content browser checks pass 12 cells and the fully intercepted enquiry suite passes 17 cases. A 538-row URL decision ledger preserves three owner-confirmed retirements, Helena Oak's evidence-limited family fallback, 204 broad mappings and all 330 linked noindex quality holds. No bulk release occurred.

Verdict is **local candidate complete; cutover HOLD**. Remaining gates are owner acceptance of the URL ledger, a complete Crazy Domains zone export, separately authorised Netlify custom-domain/TLS setup, restore-drill or explicit backup-risk acceptance, fresh Search Console baseline/post-launch checks, GA4 duplication and production receipt verification, one separately authorised product-prefilled production enquiry, and physical-device checks. No deploy, commit, push, merge, DNS/domain, WordPress, provider, production indexing/analytics, Search Console or real-enquiry action occurred. Evidence: `docs/release/cutover-readiness-2026-10-26/FINAL_READINESS.md`.

## 26 October 2026 — Resend controlled delivery confirmed

The controlled enquiry `OZ-RESEND-TEST-20261026T051700Z-1` is recorded in Netlify as a verified `oz-flooring-enquiry` submission (`6adee2527533d5057805af74`) at 4:17 PM, with the approved inbox field, `/contact/` source, Laminate category and consent retained. Resend shows `oztimberfloor.com.au` verified and ready to send. The owner confirmed receipt in `info@oztimberfloor.com.au`; this completes the controlled end-to-end delivery check for protected deploy `6adee19d57537cc923d89114`. The supplied screenshot is retained as provider-side submission evidence, rather than being represented as inbox-message evidence. No WordPress, DNS, domain, indexing or GA4 configuration changed.

## 26 October 2026 — Resend enquiry notification deployed and controlled test sent

Published protected Netlify deploy `6adee19d57537cc923d89114` at `https://oztimberfloor.netlify.app`; provider confirms one function, `resend-enquiry-notification`, is deployed. The site remains globally noindex and GA4 remains disabled. Owner authorised one controlled submission: `OZ-RESEND-TEST-20261026T051700Z-1`. Netlify stored it as submission `6adee2527533d5057805af74` with the intended supply-only, Laminate, source-page and consent fields; the browser-level POST received the thank-you page. The function runs only for verified submissions and has no PII logging, so mailbox receipt is the remaining independent delivery confirmation. No WordPress, DNS, domain, indexing or GA4 setting changed.

## 26 October 2026 — Resend verified-enquiry notification (local only)

Owner approved the narrow Oz-only Resend integration after the `oztimberfloor.com.au` Resend domain was shown verified. Added a Netlify form-event function that runs only after Netlify verifies an `oz-flooring-enquiry` submission, preserves the existing honeypot/spam gate, sends its internal notification from `Oz Timber Floor <info@oztimberfloor.com.au>` to the same approved inbox and uses the customer's address only as Reply-To. The notification has an idempotency key and does not log enquiry data. The Resend key remains provider-managed and is never stored in source. Local Resend, analytics and public-package checks pass. No deploy, form submission, Resend API request, provider setting, DNS, WordPress, indexing or GA4 action occurred.

## 8 October 2026 — final migration preparation (local/read-only)

Completed the authorised final preparation against the current candidate and the independent 8 October audit. The local migration gate passes with zero blocker/high/medium findings; the protected package contains 772 sitemap URLs. Produced the final readiness, cutover and rollback plans plus a 539-route review and 816-row legacy-image inventory in `docs/release/final-migration-2026-10-08/`. Four representative legacy source images remain live as JPEGs on WordPress, but no unproven image redirect was added. No commit, push, deployment, DNS/domain, WordPress, GA4, indexing or live enquiry action occurred. Final cutover remains conditional on the full Crazy Domains zone export, an image-priority/equivalence decision and explicit final domain-change approval.

## 8 October 2026 — DNS and rollback pre-check (read-only)

Prepared the cutover/rollback pre-check at `docs/release/CUTOVER_PRECHECK_2026-10-08.md`. Public DNS currently resolves the WordPress apex to `35.213.187.160`, uses Crazy Domains nameservers and has the three existing MailSpamProtection MX records. The verified Oz Netlify project still has no custom domain, while Forms remains enabled and the latest protected deploy remains current. No DNS, WordPress, Netlify domain, email, Google, indexing or analytics setting changed. A complete Crazy Domains zone export remains required before the separately authorised cutover.

## 8 October 2026 — Latest protected Netlify publication

Published the validated current package directly to the verified Oz Timber Floor Netlify project: deploy `6ac6de9bcdf718dd3f8db825`, https://oztimberfloor.netlify.app, package SHA-256 `297cdfdb157ec85930c55496b031599625ebbce7d8491af271b5f67e38607f9a`. Live HTTPS checks confirm the home page and contact page return 200 with `X-Robots-Tag: noindex, nofollow`; the 772-entry sitemap and consent-control code are present. GA4 remains unconfigured and no custom domain, WordPress, DNS, email-hosting, indexing or production analytics setting changed. This is a protected Netlify publication, not the final domain migration.

## 8 October 2026 — GA4 consent control (local only)

Added a first-party analytics choice for the eventual production domain. GA4 remains off until a visitor accepts optional analytics; rejecting it blocks the GA loader and subsequent events. The control links to the existing Privacy Policy and can be reopened from the footer as “Cookie settings”. It renders only when the canonical production host has an approved GA4 measurement ID, so local, draft and Netlify preview environments stay analytics-free and do not display the prompt. The existing event contract and production/preview analytics checks pass. No GA4 setting, analytics ID, Netlify deploy, production publication, domain or DNS setting changed.

## 8 October 2026 — StoneFloor supplier reconciliation (local only)

Supersedes the Oak Beige routing uncertainty below: general Stone Floor restored with supplier-listed timber and tile collections, and Oak Beige legacy URL now points there, not Tile & Marble. Matched 22 listed designs to existing records; corrected seven legacy product destinations and removed the general-range redirect to Hybrid. Source sitemap now 772 (one restored range). Product noindex holds retained. Targeted routing, catalogue, analytics, desktop/mobile browser and Oak Beige prefill checks pass; no submission. Old 771-route sealed evidence/package untouched and no full release GO claimed. See `docs/migration-october-2026-followup/STONEFLOOR_SUPPLIER_MATCH_2026-10-08.md`. No deployment or DNS changes.

### Later owner correction — Oak Beige retired

Oak Beige was absent from the current StoneFloor supplier listing and the owner instructed retirement. Its page now says discontinued and remains noindex; its legacy URL still redirects to general Stone Floor alternatives, not Tile & Marble. The general range no longer presents an Oak Beige enquiry. Catalogue, routing, analytics and diff checks pass; no deployment or DNS changes.

## 8 October 2026 — owner colour corrections (local only)

Natural Oak Brown and Interlaken marked discontinued; existing Aquastop alternative-range redirects retained. Helena Oak retained in ETF 9mm Hybrid with wrong Alaskan image removed. Oak Beige retained in Stone Floor with misleading tile copy/image removed; withdrawn retirement instruction not applied. Existing noindex holds, 771 sitemap entries and routing preserved. Oak Beige's tile/marble redirect relevance remains unresolved. Catalogue, analytics, targeted metadata/link/local-routing and diff checks pass. No fresh browser/full release validation or package rebuild; prior protected preview remains unchanged. Details: `docs/migration-october-2026-followup/OWNER_COLOUR_CORRECTIONS_2026-10-08.md`.

## Last Updated

8 October 2026

### GA4 diagnostic receipt and final enquiry confirmed — 8 October 2026

Final preview enquiry token `OZ-RELEASE-TEST-20261007T222924Z-4` is now confirmed delivered to the owner's inbox and shown under Netlify Verified submissions with correct Beach/Aquastop/Laminate, supply-only, source, product slug and consent fields. Preserved pending results are superseded by `docs/release/october-final-preview-enquiry-test/DELIVERY_CONFIRMED.json`; no additional enquiry was sent.

Owner-authorised isolated GA4 diagnostic PASS: actual DebugView in property `326951899`, stream `G-EWSMKKM9N8`, showed exactly one `quote_submit` labelled `OZ-GA4-TEST-20261008-2`; correct safe context inspected; refresh and direct thank-you access did not duplicate the success event. Unchanged local analytics contract passed. Test simulated accepted state without a form submission; it is not a live-domain production test. Initial diagnostic adapter failure preserved and corrected only in disposable test code. Both temporary diagnostic drafts were deleted after use; release preview/package and primary publication remain unchanged, release analytics remains disabled, and no GA4 property or key-event settings changed. Details: `docs/release/ga4-final-test-2026-10-08/REPORT.md` and `RESULT.json`. Production analytics/key-event configuration, consent/settings review and separate cutover approval remain pending.

### Owner confirmations and final-preview enquiry — 8 October 2026

Vincent confirmed backup/recovery checklist item 2 and physical-phone checklist item 6. Recorded as owner confirmations, not independent restore/device evidence. Newly authorised one additional controlled enquiry on final preview `6ac62bab5d09838900ed7085`: token `OZ-RELEASE-TEST-20261007T222924Z-4`, product Kronoswiss Aquastop Beach, supply-only enquiry. One Send enquiry click reached the thank-you page; refresh remained stable. Existing form detection and one email notification to `info@oztimberfloor.com.au` verified read-only. Actual provider record/classification, persisted fields and inbox delivery remain pending exact-token confirmation; no retry is authorised. See `docs/release/october-final-preview-enquiry-test/RESULT.json` and `ADDENDUM.md`. No website/provider settings, DNS, primary publication or analytics activation changed; earlier sealed evidence remains historical and unchanged.

## Current Branch

`main` at `5fecd58f1cfce728047cf27c7659fd6fbee4e2d0`, with uncommitted Artisan Tile, Artisan Oak, ASPECT and De Marque corrections. The verified package has been published on the existing Netlify hostname; no commit, push, branch merge or WordPress/domain cutover.

## Netlify-only publication completed — 7 October 2026

### Later protected-preview verification addendum — 7 October 2026

The new preview authority does not authorise another primary publication or business-domain cutover. Original approved package `bba6140043dd97023db9ad70d8b5ab19dfc1ba7cbc58339bc6e00d265e42c4c0` was uploaded unchanged to draft `6ac627edf40d435f58a83c6c`. Fresh HTTPS checks found four forced-rewrite targets serving older root HTML bodies. Synced only `hybrid.html`, `laminate.html`, `commercial-flooring.html` and `timber-floor-installation.html` with their already approved directory counterparts; protected routing, catalogue, sitemap, forms and analytics were not changed.

The isolated replacement package is `182a515c276942cf64c091b87e11306d4fcc7da9103e667618d4d47555ab4b0c`, 6,260 files, with exactly four changed package hashes. Draft: https://6ac62bab5d09838900ed7085--oztimberfloor.netlify.app. Seven isolated validation commands passed, including 5,529 regression checks and current migration GO. Final browser checks pass 54 cells at 1440/390/320 and 15 prefill journeys, without submissions or analytics collection. The active public package matches the isolated replacement.

Protected-preview verdict is conditional: Netlify-native redirects return `noindex` without `nofollow`; terminal responses retain `noindex, nofollow`. The strict all-response header requirement is not a pass. A native `/404/` to `/404` normalisation differs from the local fixture; an actually missing URL still returns 404. Detailed final HTTPS results, screenshots, preserved failed runs and the new manifest are in `docs/release/october-final-repairs-preview/REPORT.md` and `RELEASE_MANIFEST.json`.

Primary published deploy remains `6ac5eaf69631bc9e67d50585`. Before/after WordPress and primary homepages are byte-identical; queried public DNS result sets and Netlify domain configuration are unchanged. No commit, push, merge, real enquiry, email, live GA4, primary publication or domain/DNS change. Historical SEO freeze failure and original sealed evidence remain untouched. Live migration remains HOLD for four mapping decisions, owner launch checks and separate cutover approval. Earlier “local only” statements below describe the earlier snapshot, not this later draft verification.

### Fresh audit repairs — 7 October 2026, LOCAL ONLY

The later audit brief authorises local implementation and testing only. Embedded Hardwood Collection cards now derive their count from the twelve published members, and every Kronoswiss Aquastop summary card uses the approved 8 / 12 / 14 mm range specification. Beach remains 14mm. Added narrow material comparisons on Hybrid/Laminate, commercial timber guidance and customer-facing installation copy. Added only `/sitemap_index.xml` → `/sitemap.xml` (301); all prior redirect bytes, retirements, holds, catalogue facts and sitemap membership are preserved.

Fresh local gate GO with zero blocker/high/medium findings; 771 publication canonicals. All 539 legacy routes retain the audited 17 direct 200 / 508 one-hop 301-to-200 / 14 deliberate 410 outcomes. Existing Artisan Oak hardening assertion was updated to validate the exact approved retirement, with nine negative mutation checks; no blanket 410 exception. Historical SEO freeze remains FAIL against its 943-page baseline, which is not reset. Desktop/mobile and mocked enquiry evidence, current command results and 423-row mapping review are in `docs/migration-october-2026-final-repairs/REPORT.md`. No commit, push, deploy, live submission, DNS or live analytics change. The current Netlify deployment does not contain these new repairs.

Delivery evidence clarification: Vincent supplied the matching Netlify CSV row and confirmed the test email arrived in the inbox, not spam. Product/range/category/source and consent matched the requested test. This is prior deployed-state evidence, not a new delivery test of this local package. Netlify internal classification is not a CSV field. Earlier pending-delivery statements below remain historical.

Inbox update: Vincent confirmed receipt of the 7 October product-prefilled test email (`OZ-RELEASE-TEST-20261007T070514529Z-3`). Delivery is owner-confirmed; Netlify persisted-field and Verified/Spam verification remain pending exact-record evidence. No further test sent. See `docs/release/october-enquiry-test/OWNER_INBOX_CONFIRMATION.md`; the earlier pending-receipt entry below is historical.

Latest delivery test: one owner-authorised product-prefilled synthetic enquiry submitted on 7 October using `info@oztimberfloor.com.au`, token `OZ-RELEASE-TEST-20261007T070514529Z-3`. Browser reached the thank-you page. Netlify persisted fields/spam state and inbox receipt remain unconfirmed; safety review blocked a newest-entry lookup that could expose unrelated customer data. No retry. Conservatively three total historical/current attempts used, zero remaining under the existing limit. Owner must provide matching inbox confirmation and exact test record/link or screenshot. Evidence: `docs/release/october-enquiry-test/`.

Owner selected option 1: publish the latest Netlify version while leaving WordPress live. Promoted existing verified deploy `6ac5eaf69631bc9e67d50585` without rebuilding to `https://oztimberfloor.netlify.app/`. Provider confirms it is the published deploy; custom domain remains null. Package SHA-256 `a1667b2d7d1d217cce44faf8aed43d81c73ef393aff41b6840f4b371df5a14ee` is unchanged. Rollback deploy: `6ac5d55d2164040008cd8d5e`.

Fresh checks on the published hostname pass 1,302 general HTTPS routes, 93 targeted cases, twenty desktop/mobile cells and twelve enquiry-prefill journeys. All 771 sitemap canonicals, De Marque redirects, Artisan Oak retirement, Artisan Tile destinations, noindex protection and disabled GA4 pass. No form submitted; no new inbox delivery claim. Domain/DNS, WordPress, forms configuration and analytics settings remain unchanged. Git changes remain uncommitted and have not been pushed. Publication receipt, fresh test evidence and manifest: `docs/release/october-netlify-publication/`. Earlier draft-only statements below are historical.

## Protected draft verified — 7 October 2026

Owner approved the next protected-preview step. Draft `6ac5eaf69631bc9e67d50585` is ready at `https://6ac5eaf69631bc9e67d50585--oztimberfloor.netlify.app/`, using the exact prebuilt public-only package SHA-256 `a1667b2d7d1d217cce44faf8aed43d81c73ef393aff41b6840f4b371df5a14ee` (6,260 files / 583,605,192 bytes). Provider confirms deploy-preview context and no publication timestamp. Published deploy remains `6ac5d55d2164040008cd8d5e`, custom domain remains null, and the existing `oz-flooring-enquiry` form is detected.

Read-only HTTPS checks pass 1,302/1,302 general routes and 93/93 targeted cases, including 771 sitemap canonicals, four De Marque owner transitions, Artisan Oak 410 responses, Artisan Tile exact destinations, global noindex and public-package exclusions. Desktop/mobile browser checks pass twenty cells and twelve enquiry-prefill journeys; no script errors or horizontal overflow, required consent and visible submit verified. No form submitted or new inbox-delivery claim. GA4 remains disabled. Evidence and next owner checks: `docs/release/october-final-draft/VERIFICATION_ADDENDUM.md`. Earlier local-only statements below are historical.

## Four De Marque duplicate owners consolidated — 7 October 2026, local only

Owner's “fix it” approved the four previously listed exact Copper Brown, Dusk Grey, Matterhorn and Polar Ice consolidations. The wrongly named `wide-plank-water-resistant-laminate-*` pages now have forced permanent redirects to matching existing De Marque pages, including direct index-file paths. Eight incoming rules now name the final owner directly, preserving existing ordering, force behaviour and physical-file shadowing. Six pages' related-product references/enquiry parameters were corrected. Four complete records were moved to `productAliases`, not discarded; all other active catalogue records and existing noindex controls are unchanged. Four exact alias overrides added, four sitemap entries removed, fallback aliases carry owner canonicals and noindex with no Product schema. ASPECT remains fourteen colours.

Fresh local migration gate: GO, zero blocker/high/medium findings; 771 publication canonicals and sitemap URLs, 1,971 redirect rules, 1,404 unique noindex routes, 362 physical redirect-only routes. Protected build, field integrity, twenty routing variants, preservation of 347 existing physical-shadow rule behaviours, ten desktop/mobile browser cells and eight enquiry-prefill journeys pass. Browser verification used a localhost HTTP fixture; no form submission. Netlify HTTPS behaviour is not yet verified for this candidate, and local GO does not authorise domain cutover. The pending-approval notes below are historical and superseded. Details: `docs/demarque-consolidation/REPORT.md`.

## ASPECT supplier correction — 7 October 2026, local only

Verified eighteen exact supplier product pages. Corrected fourteen ASPECT products to 12mm laminate, their per-product dimensions/pack coverage, range name, listings and enquiry prefill. Removed eight unrelated timber entries from the ASPECT range listing without deleting their records/pages or lifting existing holds. Corrected four misclassified products and their four existing De Marque counterparts to 15mm engineered timber, 2200 × 240mm with nested shorts and 2.112m² packs. Wattleseed's conflicting supplier width is deliberately unconfirmed.

Protected build, catalogue field integrity and entry-bound regression pass: 22 records, 29 HTML pages, 2,091 link destinations and 374 image references. Browser evidence covers 46 desktop/mobile cells and six prefill journeys without submitting forms. Redirects, sitemap, robots/canonical ownership, noindex overrides and unrelated catalogue records remain unchanged. Publication/sitemap remains 775 and redirect entries 1,963. The migration gate is still NO-GO: eight affected URLs are four duplicate identity pairs, with four duplicate title and four duplicate description warnings. The fourteen ASPECT missing-thickness failures are resolved; the four De Marque old routes also have verified thickness, but require exact owner consolidation approval rather than a noindex workaround.

Pending owner decision: redirect Copper Brown, Dusk Grey, Matterhorn and Polar Ice from their four `wide-plank-water-resistant-laminate-*` product URLs to the four matching existing `de-marque-oak-*` product URLs, excluding only the four duplicate sitemap entries. Not implemented or assumed approved. See `docs/aspect-correction/REPORT.md`. Earlier gate counts below are historical.

## Artisan Oak retired — 7 October 2026, local only

Owner explicitly confirmed discontinuation and instructed retirement. One range and twelve exact legacy Oak colours now have discontinued pages and forced 410 responses for legacy, physical and direct-file paths. Incorrect Hybrid destinations and the Oak-to-Tile catalogue alias are removed. Records remain archived as retired; no file/record deletion. Existing noindex controls retained. Artisan Tile fixes, Kronoswiss Artisan Oak colour names and all unrelated records/controls are unchanged.

Protected build, field integrity, 123 scoped retirement checks and 26 desktop/mobile cells pass. Sitemap remains 775; physical noindex routes remain 1,400; redirect entries are 1,963. Migration gate remains NO-GO for eighteen existing Wide Plank blockers. No deployment, WordPress or DNS change; provider 410 behaviour awaits the next authorised preview. Details: `docs/artisan-oak-retirement/REPORT.md`. Earlier pending-Oak notes below are historical and superseded by this explicit retirement.

## Artisan Tile supplier correction — 7 October 2026, local only

Following protected promotion at `5fecd58f1cfce728047cf27c7659fd6fbee4e2d0`, the owner supplied Topdeck's current Artisan Tile range and requested migration fixes. Verified twelve Hybrid colours and product codes, 620 × 310 × 9mm dimensions and 1.5376m²/eight-piece packs. Updated twelve existing product records/pages, corrected Grigio/Madison timber-look wording, and narrowed ten generic Hybrid redirects to exact existing same-colour Artisan Tile pages. No deletion or Artisan Oak reclassification/retirement was performed. Source facts, protected-cohort dependencies and precise scope are documented in `docs/artisan-tile-migration/REPORT.md`.

Protected build, field integrity, scoped alias/data/SEO regression and 26 desktop/mobile browser cells pass. Publication remains 775 sitemap URLs, 1,400 physical noindex routes and 1,938 redirect rules. The migration gate remains NO-GO with eighteen existing Wide Plank blockers; the separate twelve Artisan Oak mappings remain unresolved. These Tile changes are uncommitted and not deployed; WordPress, DNS, forms and live analytics are unchanged.

## Protected Netlify Promotion — 7 October 2026

Owner explicitly authorised push to dev, merge to main and Netlify deployment after the local follow-up. This authorises publishing the protected replacement only, not WordPress/domain/DNS cutover. Verified project `fd68e39e-7863-4012-8a97-40bec59b23d9` (`oztimberfloor`, account `xuyendaibang`) has no custom domain or indexing-enable environment flag. Candidate package: 6,260 files, 583,795,346 bytes, SHA-256 `c9499c7b8e1aaf99cfd846c8365d1ed7929345baa84024063afc06f1b9740103`. Fresh package, bounded follow-up, supplier-spec and analytics checks pass; current source matches the completed browser evidence. Global noindex and disabled GA4 are retained. Migration blockers below remain unresolved. Private audit/analytics and detailed machine-local evidence are not included in this release commit. Final provider/HTTPS receipt will be appended separately under ignored `docs/release/` after publication; this entry does not claim deployment has completed.

## October Follow-up — NOT READY (local only)

Completed the later 7 October brief without commit, push, deployment, provider submissions or live settings changes. Exact supplier evidence now supports thickness on 21 Swish products and three ranges (45 source fields, 24 HTML pages), reducing the unchanged catalogue gate from 27 to 18 blockers. Fixed enquiry source/current-URL preservation, floor-levelling service selection, and disabled-configuration analytics suppression. Added four exact author-archive redirects and a byte-identical legacy image with one direct redirect. Existing product redirects, intentional holds, forms/backend, service owners and sitemap set were preserved.

Current publication remains 775 canonical/sitemap URLs (771 plus four restored articles), with 1,400 physical noindex routes. Redirect entries are 1,938 (five new in this follow-up). Current browser QA passes 130 cells/75 priority measurements; 16 mocked enquiry cases and 12 new Swish captures pass. Preview and isolated production local HTTP fixtures each pass 2,198 checks. No real inbox delivery, GA4 receipt or future Netlify production-host behaviour is claimed.

NOT READY: twelve Artisan Oak wrong-family redirects still need validated final owners, and eighteen Wide Plank records still need supplier dimensions. Named colour/size fallback gaps and owner-only GA4, delivery, backup/DNS and physical-device checks are documented in `docs/migration-october-2026-followup/REPORT.md` and `LAUNCH_CHECKLIST.md`. The broader private URL review covers 2,695 path strings and retains traffic-source caveats. Historical September seals and earlier October evidence remain unchanged; old exact-route/hash tests remain recorded failures, while a new entry-bound contract validates this scope. The current candidate is local only; the earlier draft below does not include this follow-up.

## Earlier October Migration Repair — HOLD MIGRATION

Implemented the independently safe repairs from the 7 October brief: seven article routes (three equivalent-guide redirects and four restored WordPress articles with guide-library links), product-specific Aquastop cards, derived Hardwood Collection count, invalid catalogue field cleanup, Google verification continuity, and production-only GA4 `G-EWSMKKM9N8` with preview suppression and PII-safe page URLs. No catalogue indexation holds or established canonical owners were changed. Publication/sitemap set is now 775 (771 plus four restored articles); 1,400 noindex routes remain unchanged.

Current local crawl: 539 WordPress URLs, 17 direct 200, 521 permanent redirects, one deliberate 410, zero 404s/chains/loops. Twelve Artisan Oak redirects still point to the wrong hybrid family: product availability/final-owner evidence is unresolved, and the imported exact-product pages also have incorrect hybrid imagery. Cleaning invalid thickness values exposes 27 existing indexable product records that fail the unchanged data-quality gate. No bulk noindex, invented dimensions or unsupported discontinuation decision was used to hide these issues.

Separate protected draft: `https://6ac5c97a1ac0d69d4e5449e2--oztimberfloor.netlify.app`. All 1,299 HTTPS route checks and desktop/mobile draft navigation pass. The published Netlify deploy remains `6aa2a1e553c3e900084434fc`; custom domain remains unset. No commit, push, merge, production publication, DNS change, live analytics event or provider form submission was performed. Current results and limitations: `docs/migration-october-2026/REPORT.md`. All earlier status entries below are historical.

## Owner Inbox Confirmation — 10 September 2026

Latest release instruction: Vincent approved dev → main promotion and deployment of this candidate to the existing protected Netlify hostname. Fresh isolated build, current release contract, migration gate, routing, catalogue, old-assets, analytics, image, LCP and package checks pass; all 6,254 rebuilt package files match the verified form-enabled draft. This does not approve the WordPress/domain cutover, DNS, production indexing or live analytics. Provider receipt and post-deployment checks are recorded separately; earlier no-push/no-main-publication statements below are historical within this newly approved narrow scope.

Vincent confirms receipt in the intended email inbox, responding to the request for reference `OZ-RELEASE-TEST-20260910T105455596Z-1`. The controlled draft test now has Netlify verified-storage evidence, owner-confirmed thank-you navigation and owner-confirmed mailbox delivery. No additional submission was performed. Product/range-prefilled live delivery is still untested because this test's fields were blank. Backup/restore and full DNS evidence, existing Oz GA4 ID, physical-device review, Google verification carry-forward, final candidate validation and explicit production approval remain pending. See `docs/release/OZ-RELEASE-CLOSEOUT/form-activation-2026-09-10/INBOX_CONFIRMATION_ADDENDUM.md`. Earlier records below retain their original observation state.

## Owner Submission Verification — 10 September 2026, 21:29 AEST

Netlify's authenticated Oz form UI now shows one clearly labelled controlled test under **Verified submissions**, received at 21:25 AEST. Its exact reference is `OZ-RELEASE-TEST-20260910T105455596Z-1`; enquiry type is `supply-only`, source is `/contact/`, and consent is `on`. The owner reports seeing the thank-you page. Mailbox receipt remains unconfirmed. Product/range fields are empty, so this test does not establish live product/range prefill delivery. The owner manually used a different sender email from the approved automated-test address; no agent submission or sender-authority expansion occurred. Two owner-reported attempts total, no further submission performed. The earlier zero-submission snapshots below remain historical. See `docs/release/OZ-RELEASE-CLOSEOUT/form-activation-2026-09-10/OWNER_SUBMISSION_ADDENDUM.md`. Production approval remains pending.

## Form Activation Addendum — 10 September 2026

ENGINEERING COMPLETE — EXACT OWNER ACTIONS REMAINING. Vincent's narrow extension was applied: existing Oz Netlify form detection enabled; exactly one notification to `info@oztimberfloor.com.au` bound to `oz-flooring-enquiry` (33 detected fields). New noindex draft `6aa28aaf1ed9ee51094d4a3b` uses the unchanged verified public package; production remains `6aa211dff262ae00099fc4ed`. Fresh HTTPS checks: 2,001/2,001 pass, 1,962 unique URLs, exact 771 publication/sitemap and protected routing contracts. Seven fresh isolated success-event unit cases pass; earlier full browser/Lighthouse evidence remains historical and source-bound, not relabelled as testing this deploy.

Actual synthetic delivery is still NOT VERIFIED: two automated submit actions were rejected by runtime safety checks before execution; the final provider aggregate reports zero submissions. The prepared test token is `OZ-RELEASE-TEST-20260910T105455596Z-1`. Owner should click Send enquiry once and confirm receipt; no bypass, duplicate submission, spam weakening or production workaround was attempted. Backup/restore evidence, full DNS export, approved GA4 ID and physical-device checks remain missing. Current WordPress verification is preserved live; its exact Google verification meta must be carried into the final production package before cutover. See `docs/release/OZ-RELEASE-CLOSEOUT/form-activation-2026-09-10/VERIFICATION_ADDENDUM.md` and its dated `RELEASE_MANIFEST.json`. Previous sealed records and the status snapshot below are preserved as historical evidence.

## Active Release Closeout — 10 September 2026

Vincent's standing release-closeout instruction approves the verified R1 (`d2ab0a23d6d171ef465a933ea191eabdb1db68ae6c4337b5c948ca0f68bf8fa7`) for implementation and bounded non-production verification. All 2,196 exact R1 file operations are applied locally. Current migration and release contracts pass: 771 exact publication/sitemap owners, 2,219 physical HTML files, zero blocker/high/medium findings, 5,194 local routing assertions, 130 current responsive cells and 75 priority measurements. The public-only package is deterministic; the isolated production fixture differs only by the global noindex header.

The Netlify login mismatch is resolved. Verified Oz Owner authentication created non-production draft `6aa26cac57a49b0b2ddb9326` at `https://ozqa-6b3ecb6fb09fb1421f0d446c--oztimberfloor.netlify.app`; published deploy remains `6aa211dff262ae00099fc4ed`. The exact public package and 771 served sitemap entries match. HTTPS browser evidence covers 130 cells (129 original passes plus one independently retested lazy-trigger harness observation), and all 30 Lighthouse runs are complete. The full HTTPS rerun passes all 2,001 checks across 1,962 unique URLs with zero transients after correcting one ETF physical-noindex expectation against the frozen R1 evidence; no page/redirect change was made. Status: ENGINEERING COMPLETE — OWNER ACTION REQUIRED. Provider HTML form detection is disabled, no forms/form notifications exist, and real enquiry delivery is unverified. Owner provider-setup/safe-sender, backup/DNS, GA4 and device inputs remain pending. This is not production GO. See `docs/release/OZ-RELEASE-CLOSEOUT/RELEASE_REPORT.md`.

The inherited status content below is preserved as historical context. The current ledger is `docs/release/OZ-RELEASE-CLOSEOUT/LEDGER.json`. No push, merge, production publication, domain/DNS change, production indexing or live GA4/Search Console configuration is authorized.

## Current Task

Vincent explicitly approved publishing the four independent decision-review documents to the public GitHub repository and requested dev/main promotion with deployment to the existing protected Netlify site. The review is a preserved snapshot of `b406af8e64bc84d269711a88303ae0a378ac96ee` and recommends **REVISE BEFORE APPROVAL**: retain the nine established owner choices, but specify their complete routing/publication transitions, including 413 other incoming rules and 297 protected-cohort dependencies. See `docs/seo-migration/OZ-MIG-004/review/DECISION_REVIEW.md`. This documentation-only publication does not approve or apply the protected SEO plan, alter the website package, or enable indexing. The earlier repair deployment receipt below remains historical evidence, not proof of this later publication.

The reviewed OZ-MIG-004 repair package is deployed to the existing protected Netlify site through the Git integration. Code commit `1916b19733a90907aafe765089ffbe85c390ef2c` was pushed to dev and fast-forwarded into main; ready main deploy `6aa144f26420d10008e8b8fc` passed 30 live HTTP checks and four live browser cells. See `docs/seo-migration/OZ-MIG-004/DEPLOYMENT_RECEIPT_2026-09-09.md`. The receipt/test follow-up changes no public package bytes. Production indexing and the protected route/catalogue decision remain unapproved.

### Local repair and approval context

OZ-MIG-004 independently safe local repairs are complete; the consolidated protected decision is pending. Current counts remain 943 publication canonicals/sitemap URLs, 971 physical indexable HTML, 1,230 physical noindex files representing 1,228 unique noindex routes, 350 redirect-only routes and 1,912 redirect rules. Factual catalogue repair exposed 172 exact currently indexable Hardwood-derived routes that require the hash-locked route-level control decision; no bulk noindex or protected redirect/indexation change was made. Vincent subsequently requested dev push, main merge and deployment. The protected-preview package and promotion preflight are recorded in `docs/seo-migration/OZ-MIG-004/IMPLEMENTATION_AND_QA.md`; actual publication is established by the provider receipt and post-deploy smoke test, not this preflight. No form submission, DNS/domain, production-indexing, GA4 or Search Console action is included in that promotion.

## OZ-MIG-004 current record — 9 September 2026

- Fresh GET reconciliation covers 35 routes each on WordPress and Netlify. WordPress still owns nine established category/service paths; Netlify serves newer staging-only owners and remains globally noindex.
- Repaired Hardwood Collection to the verified 12-colour supplier set and removed reproduced mixed/download/navigation field contamination without inventing facts.
- Removed 54 obsolete old-WordPress `srcset` references where valid local primary images already existed.
- Corrected `quote_submit` to fire only after a confirmed thank-you marker; local form contract/prefill remain intact and no real submission occurred.
- Added context-aware public-package validation. Preview remains fail-closed noindex; an isolated production fixture proves normal owners can be indexable while deliberate controlled/thank-you pages remain noindex.
- Current release contract passes with zero unexplained protected drift. GSC, hardening, image, LCP, old-asset, analytics, package and whitespace checks pass.
- `migration:check:local` intentionally remains `NO-GO` on the exact 172 protected-decision routes. Three historical browser/performance hashes and the legacy SEO freeze remain stale by design and are not being rewritten into expected output.
- Protected manifest SHA-256: `ab50628d77038ea331e94d253aa4735ee0405a05f5d1d785b8cd28bf5650514e`.

## Completed Work

- Preserved the dated Search Console source exports and generated a repeatable 130-page equity decision map using the exported top 100 pages, every page with at least one click and every page with at least 500 impressions.
- Recorded 60 priority manual catalogue rows, 72 exact product/range mappings and 8 unresolved mappings that remain controlled pending business/source evidence.
- Expanded the permanent semantic redirect set to 60 reviewed contracts. The current set includes the original ETF, Helena Oak, Stonewood Bamboo and retired Hybrid guide decisions; 15 verified product-to-parent-range corrections; 22 Grand Oak product routes corrected to the Engineered Timber category; and 12 further verified parent-range corrections covering Stone Floor (6), Storm (3), Swish Oak (2) and Swish Aqua (1).
- Added a 12-owner keyword map and permanent GSC/semantic redirect regression checks without removing any inherited readiness command.
- Reconciled the catalogue at 2,115 pages: 893 indexable and 1,222 controlled/noindex. The hardening review reports 361 indexable catalogue quality findings for controlled review, not automatic quarantine.
- Reconciled the current 1,222-page control manifest to 6 exact-product replacements, 743 parent-range replacements and 473 category replacements.
- Prohibited bulk catalogue noindex treatment: 632 current redirect destinations were in the original control queue and must continue to receive route-by-route data, redirect, retirement or 410 decisions before indexation changes.
- Retained privacy-safe analytics hooks for `phone_click`, `email_click`, `quote_start`, `quote_submit`, `stock_check`, `supply_only_enquiry` and `supply_install_enquiry`; no approved GA4 measurement ID is present, so production analytics is not claimed operational.
- Added a root-local `npm run migration:check` suite for required files, page contracts, JSON-LD, links/assets, sitemap, redirects, catalogue quality, form contract, analytics configuration and production/preview index controls.
- Added fail-closed Netlify header preparation: previews, branch deploys and a main deploy without approved production-indexing configuration receive `X-Robots-Tag: noindex, nofollow`. Indexable headers require the approved custom-domain state and explicit `OZ_PRODUCTION_INDEXING_ENABLED=true`.
- Added production-only GA4 build injection from `OZ_GA4_MEASUREMENT_ID`, while retaining `null` in source until the approved ID is supplied. The readiness gate fails when it is absent.
- Hardened client analytics against duplicate initialisation/listeners, retained URL attribution for the browser session, and removed free-text/enquirer fields from GA payloads.
- Added an explicit catalogue quality manifest and reports. Three explicitly missing-image product pages are now `noindex,follow`, have Product schema removed, and are excluded from the main sitemap.
- Retired the duplicate keyword sitemap safely: it now 301s to the main sitemap and is no longer advertised by `robots.txt`.
- Added release evidence, external verification, e-commerce decision, project-entry and WordPress/static parity records.
- Retired Bamboo publicly and mapped all 25 legacy Bamboo routes plus the landing variants directly to `/hardwood-timber-flooring-sydney/`; the public HTML scan now contains no Bamboo references.
- Historical 4 August manifest snapshot: the 1,222 controlled pages were then classified as 715 parent-range replacements and 507 category replacements. This historical split is superseded by the verified 1 September manifest above.
- Historical 4 August release snapshot: validation then recorded 941 sitemap URLs and 1,910 redirect rules; the current 1 September publication figures are 943 and 1,912 respectively.
- Applied controlled `noindex,follow`, Product-schema removal and sitemap exclusion to all 1,222 classified pages; 1,026 URLs were removed from the sitemap.
- Applied 220 direct redirect decisions and remapped 636 existing catalogue redirect rules (632 in the initial risk set plus four forced `301!` aliases found by the refined matcher) so no redirect now lands on a controlled/noindex page.
- Updated unique metadata for the remaining indexable catalogue pages and regenerated the migration evidence.
- Added an append-only, removable UI layer in `assets/site.css` using the approved Australian material palette, spacing, radius and shadow tokens; refined navigation, heroes, cards, catalogue presentation, enquiry controls and mobile layouts without changing public HTML content or route ownership.
- Replaced the overbroad Bamboo sitemap regex with exact `<url>`-block filtering, restored `/` and `/about/`, and documented `/thank-you/` as a preserved `noindex,follow` utility route excluded from the sitemap.
- Expanded the SEO freeze from sitemap discovery to all 2,201 physical HTML files. It now resolves 943 publication owners, reports noindex/redirect/alias classifications and blocks publication canonicals missing from the sitemap.
- Completed mobile menu Escape/outside-click/focus/ARIA/body-lock/scroll-restoration behaviour and added a product-only safe-area action dock that suppresses over competing actions, the footer, the menu and Contact.
- Removed product/range image colour alteration and added computed-style regression coverage.
- Corrected representative LCP loading, priority and dimensions on seven routes/ten physical outputs; remaining staged image-dimension debt is explicitly measured rather than bulk rewritten.
- Reframed Projects as honest planning examples rather than verified completed jobs; its route and canonical remain stable while title, metadata, H1, schema and enquiry links were intentionally aligned to the new truthful scope.
- Completed a fresh-tab, true-page-top 70-cell screenshot matrix across 14 routes and five viewports, plus menu, dock and form-state evidence.
- Hardened all 15 OZ-PERF-002 priority publication owners through a scoped final-stage postprocessor: 136 missing dimension pairs resolved across 170 local raster images, zero mismatches/missing assets and exactly one eager/high-priority primary per route. The second apply and build-stage apply changed zero files.
- Added 75 redirect-aware browser records across 1440, 1024, 768, 390 and 320 px, with zero horizontal overflow, lazy primary candidates, missing dimensions or console errors; retained a bounded 10-screenshot visual matrix.
- Added a GSC/redirect/data-weighted top-25 catalogue quality queue without changing indexation, redirects, metadata, schema, product facts or public copy. Raw Solid Timber is the recommended first evidence package.
- Preserved the exact 29 authorised SEO-freeze differences by proving all 15 owner HTML changes normalise exclusively to the allowed image-performance attributes.

## Files Changed

- See `docs/seo-migration/GSC_MIGRATION_HARDENING_2026-09-01.md` and `docs/seo-migration/generated/approved-release-decisions-2026-09-01.md` for the current decision and validation evidence. The 4 August and 29 July reports remain historical snapshots.
- See `docs/ui-ux/AUSTRALIAN_MATERIAL_INTELLIGENCE_QA_2026-08-04.md` for UI scope, before/after screenshots, responsive evidence and the SEO freeze result.
- See `docs/ui-ux/OZ_UI_UX_V2_REPORT.md` for the focused blocker remediation, reconciled counts, complete evidence matrix, exact acceptance commands and external release gates.
- See `docs/performance/OZ_PERF_BASELINE_2026-09-01.md` and `docs/performance/OZ_PERF_HARDENING_2026-09-01.md` for OZ-PERF-002 ownership, image, browser, freeze and command evidence.
- See `docs/seo-migration/CATALOGUE_QUALITY_NEXT_QUEUE_2026-09-01.md` for the audit-only top-25 catalogue evidence queue.

## Tests/Checks Run

- Baseline for the 1 September hardening was recorded on `main` at `6909ee83800c4c08e9207694c5bf70bce0c92eb0`; the inherited dirty worktree was preserved rather than reset, stashed or overwritten.
- The build and header selector are release-gated: noindex remains the safe default, including for the main Netlify hostname while no custom domain is connected.
- Local form contract passed all required Netlify attributes/fields.
- Local sitemap/redirect/link/asset checks passed structurally: 943 publication canonicals, 943 sitemap URLs and 1,912 redirect rules, with zero sitemap omissions, sitemap extras, noindex sitemap URLs, redirect conflicts, loops, chains, missing targets, noindex targets, broken local links or broken local assets.
- The planned redirect map contains 536 unique source rows with zero duplicate sources and zero 301 self-maps.
- `npm run migration:check:local` returns `GO` with 0 blockers, 0 high findings and 0 medium findings.
- The current route inventory records 971 physical indexable HTML pages, 1,228 noindex routes and 350 redirect-only routes. The 971 physical indexable outputs consolidate to 943 publication canonicals; the canonical-only sitemap contains the same 943 URLs.
- The catalogue report records 2,115 catalogue pages: 893 indexable and 1,222 explicitly controlled as `noindex,follow` fallbacks.
- `npm run seo:gsc-audit` passed with 130 GSC equity decisions, 60 priority manual rows, 72 exact product/range mappings and 8 unresolved mappings retained for review.
- `npm run seo:migration-hardening:check` passed with 60 reviewed semantic redirect contracts, 130 GSC decisions, 12 keyword owners, zero blockers and 361 controlled catalogue quality findings. It independently derives 74 mapping candidates rather than trusting only the committed decision list.
- The UI SEO freeze capture reconciles 943 complete publication contracts before and after. Its comparison to the August UI-only baseline intentionally reports `FAIL` with 29 reviewed differences: five protected source files changed for this migration hardening and 24 page-field changes across `/`, `/about/`, `/commercial-flooring-sydney/`, `/floor-levelling-sydney/` and `/projects/`. This is retained as an explicit authorised-change audit, not misreported as a zero-difference UI-only pass.
- Browser QA passes 70/70 cells across 14 representative routes at 1440×1000, 1024×768, 768×1024, 390×844 and 320×800: true page top/header present, zero horizontal overflow, zero broken images, zero visible images left unready and zero console issues.
- Mobile navigation and dropdown state pass at 320, 390 and 768 px. Escape, outside click, background scroll prevention/restoration, focus return, ARIA and target sizes pass; catalogue item 13 remains accessible and filtering/clear restore all 85 eligible ranges.
- Representative LCP QA passes seven routes/ten physical files. The audit records 18,281 image tags and 13,888 remaining missing-dimension tags as staged debt.
- Screenshot evidence passes 70/70 exact JPEG cells with truthful extensions/dimensions, plus three non-substitution state captures.
- `npm run perf:images:check` passes 15 priority owners, 170 local raster occurrences and 86 unique assets with zero missing dimensions, mismatches, missing assets, unreadable assets or route issues.
- `npm run perf:priority-routes:check` passes 75/75 route/width records at 1440, 1024, 768, 390 and 320 px; every route has one high-priority image and no record overflows horizontally.
- `npm run ui:seo-freeze:check` retains its expected exit 1 and byte-for-byte identical 29-item difference array; 15 image-only HTML allowances verify against the reconstructed pre-task owners with zero allowance issues.
- The repository-wide missing-dimension debt is now 13,752, reduced by exactly the 136 priority-route tags in scope.

## Open Risks

- The current task is a large, scoped launch-hardening change set. Keep it isolated from unrelated work and preserve the generated decision evidence through promotion.
- Human visual review should explicitly assess the mobile three/four-action stacks, the below-initial-viewport Contact form, the soft 300×300 hybrid hero source and repeated generic lifestyle imagery. These are documented review observations, not unresolved focused-remediation blockers.
- A real-device safe-area check, full accessibility audit and Lighthouse measurement remain release-stage checks.
- Large colour-sensitive catalogue images, especially the approximately 13.8 MB Solid Timber route set, remain deliberately unchanged pending separate lossless or pixel-verified optimisation.
- The approved GA4 measurement ID is not present. Privacy-safe event hooks are prepared, but production analytics cannot be claimed operational until the ID is approved, configured in the Netlify production context and verified in Realtime.
- Netlify form notification routing, spam handling, mobile submission and production/preview headers still need external verification.
- The currently linked Netlify site has no custom domain. Its main deploy must remain `noindex` until a production custom domain is approved and connected and `OZ_PRODUCTION_INDEXING_ENABLED=true` is explicitly enabled; the Netlify hostname is not an indexable production target.
- Repository validation is not deployment proof. The deployed commit, real production redirect responses, sitemap, robots/header behaviour and rollback evidence must be recorded after deployment.
- The UI upgrade remains local and uncommitted. Production appearance is unchanged until a separate promotion and deployment is explicitly approved.

## Next Recommended Task

Revise the existing OZ-MIG-004 decision manifest to explicitly bind all nine owner transitions, incoming rules, URL variants, rewrite ordering and owner-publication contracts; then present its new exact hash for Vincent's approval. Preserve the review-supported reversible 172-route catalogue hold, Bamboo retirement, six separate supplier pages and no-new-hub scope. Publication of the review does not authorise applying these protected changes.

## Blocked Decisions

- Confirm final form notification destination and test submission in Netlify.
- Confirm GA4/Search Console setup and approve the production-only measurement ID.
- Confirm the production domain/DNS plan and verify real production redirect responses after an approved deployment.
- Confirm whether any supplier names can appear publicly. Current policy says no public supplier names.
- Confirm real project photos/details before claiming completed projects.

## Manual Data Needed

- Real completed project photos and details.
- Verified review snippets, if used.
- Final showroom/service area wording.
- Final form destination and notification inbox.
- Insurance/licence wording, if the business wants it shown.
- Search Console top linked pages and top linking sites export.
