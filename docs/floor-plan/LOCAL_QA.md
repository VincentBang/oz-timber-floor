# Floorplan local release-candidate QA

This suite is local-only. Passing it does not authorise activation, resolve the
historical intermittent JPEG failure, or establish physical-device/screen-reader
speech verification. The owner separately accepted those risks and authorised
the 4 November production activation. See `docs/releases/2026-11-04-source-sync.md`.
Default builds still exclude the tool: future deployments must explicitly
preserve the approved live floorplan through the reviewed packaging workflow.

## Source of truth

Run against the current combined release candidate, not an older checkout. The
4 November 2026 release worktree includes the current supplier changes, assistant
and three enquiry-upload fields. The older main project checkout lacks those
uploads. Do not copy its catalogue/form baseline over the release candidate.
Reconcile branch, HEAD and dirty state before every release review.

## One command

From the chosen repository:

```sh
node scripts/floor-plan-qa.mjs --out /absolute/path/to/new-empty-evidence-directory
```

Omit `--out` to create a unique temporary directory. Evidence must be outside the
source checkout. Existing non-empty output directories are rejected. The runner
copies sources, uses a separate Git metadata/index snapshot for read-only tracked
file enumeration, and builds only disposable copies. It does not stage or commit.
Source preservation is checked at the end, including when a check fails.

The default/full command runs all three browser engines. No reduced browser set
is silently called a complete pass. A child command has a five-minute execution
limit; interruption, missing dependencies and nonzero exits are failures, not skips.

## Optional QA dependencies, outside the publish package

The environment must have Node, npm, Python 3 and Git, the repository's installed
`parse5` and `@netlify/blobs` dependencies, and external QA copies of Playwright,
axe-core and Sharp. All browser binaries must already be installed. The runner
never installs anything automatically or uses provider credentials.

Set these paths if packages are not resolvable from the repository:

- `OZ_PLAYWRIGHT_PATH`: installed Playwright module/directory.
- `OZ_AXE_PATH`: installed `axe-core/axe.min.js` file.
- `OZ_SHARP_PATH`: installed Sharp module/directory.
- `OZ_QA_NODE_MODULES`: directory containing the repository build dependencies.
- `PLAYWRIGHT_BROWSERS_PATH`: optional Playwright browser cache directory.
- `OZ_CHROME_PATH`: optional Chromium-family executable; otherwise Playwright's
  installed Chromium is used. Firefox/WebKit use Playwright's installed binaries.

Check dependencies without claiming any tests ran:

```sh
node scripts/floor-plan-qa.mjs --preflight-only --out /absolute/new-empty-preflight
```

`DEPENDENCIES_READY_NOT_TESTED` is only setup readiness. A missing module or
browser produces `DEPENDENCY_OR_SETUP_BLOCKED` and a nonzero exit. Do not change
the suite to skip an unavailable engine.

Verified tool versions in the initial maintained run: Playwright 1.60.0,
axe-core 4.12.1, Chrome 156.0.8078.80, Firefox 150.0.2, WebKit 26.4. Versions are
recorded anew by subsequent runs; WebKit is not proof of physical Safari.

## What runs

1. Geometry, handoff, consent, expiry, storage and environment-gate unit tests.
2. Isolated local build and public-package validation.
3. Per-engine loader/keyboard regressions, desktop/mobile tool journey, all six
   enquiry modes, overwrite/autofill protection and once-only summary handling.
   Actual product/range enquiry links lead to a local-only measurement entry,
   opening a new tab so unsent contact details and selected uploads stay intact.
   The new tab carries only bounded public context, never those personal fields.
4. Room edit/delete/include/overlap, scale/page changes, error recovery, blocked
   storage, pagehide cleanup, mobile layouts/text sizing and focus checks.
   Deterministically delayed/failed module startup keeps the file chooser
   disabled until handlers exist and retains a usable direct enquiry fallback.
5. Automated accessibility scans and scoped screenshots. Spoken announcements
   and independent nonvisual tracing remain outside automation's claim.
6. Eight EXIF orientations with baseline/progressive JPEG fixtures, bounded
   native-decoder cancellation, late bitmap completion and six-megapixel
   load/release tests. Legitimate blank JPEGs remain accepted.
7. Current catalogue, SEO/migration, analytics, Resend contracts, website and
   assistant tests/evaluations. Offline answer evaluations do not call GPT.
8. Default, production and deploy-preview builds. All must omit the tool and QA
   assets, including when the feature flag is true in hosted contexts. Their
   output must match. Local differences are restricted to floorplan assets and
   the two Guides/two Contact integration entries.

## Safety and reporting

No real form is submitted. Browser routes block external requests and non-GET
traffic. The test HTTP server accepts GET only and binds loopback. Build/unit
stages preload a network-denial module; only documented local Python/Git checks
run alongside them. API keys and provider environment variables are not passed
to child processes. No cloud document, assistant generation or email is sent.

Synthetic PNG/PDF fixtures are embedded in the QA source; JPEG fixtures are
generated locally. Samples, tests, screenshots, dependency paths and reports
must never appear in the public package. The runner tests this exclusion.

`RESULT.json` contains command outcomes, versions, package comparisons and
source drift. Read the individual logs and engine JSON results; do not infer
full accessibility or release approval from the status string. Coverage exists
in `checks/browser-flows.json`, `contact-browser.json`, `extended-results.json`,
the accessibility scan results, `journey-results.json`, `startup-results.json`, `mobile-results.json`, `orientation-results.json`
and `lifecycle-results.json` inside each engine's output directory.

WebKit's screenshot helper injects a stylesheet that strict CSP rejects. The
functional zero-error suites therefore capture WebKit layouts separately in
the accessibility pass. CSP is not weakened and application errors are not
filtered away. Native pinch/drag uses Chromium's protocol; the other engines
record that limitation instead of counting those gestures as passed.

## JPEG decision record

### Bounded follow-up: decoder deadlines and failed replacement recovery

`scripts/floor-plan-qa/jpeg-recovery.mjs` adds nine gap checks per engine:
greyscale JPEG; bounded large JPEG; CMYK rejection and RGB re-export recovery;
bitmap/native decoder deadline and late completion; failed context/draw raster
cleanup; PDF-to-failed-JPEG-to-same-file recovery; and no outbound submission.
It uses synthetic retained inputs and an independent Sharp decoder. Existing
orientation/stress/startup suites need not be repeated just to investigate these
gaps. The full maintained command includes this suite for future release runs.

To run only the gap suite, set the existing dependency paths, `OZ_BROWSER`,
`OZ_QA_ROOT` to an isolated candidate containing a local-only `dist`, and
`OZ_QA_OUTPUT` to a fresh evidence directory, then run:

```sh
node scripts/floor-plan-qa/jpeg-recovery.mjs
```

`OZ_JPEG_CASES` optionally selects comma-separated case-name prefixes for a
focused repair regression. Unselected cases are explicitly `notRun`, never
counted as passes. Use separate output directories for each engine/run.
Deadline tests invoke the captured 30-second deadline after a controlled decoder
gate is reached; they do not add production delays/retries or change its deadline.

Four-component print-colour JPEGs are rejected before decoding with an actionable
RGB/sRGB JPG-or-PNG export message. Both untagged and profiled CMYK experiments
showed cross-decoder colour differences; no browser colour-conversion patch or
weaker pixel threshold was introduced. Normal RGB and greyscale JPEG support
remains unchanged. A failed replacement explicitly identifies the retained plan.
Failed raster allocations are zero-sized immediately instead of awaiting GC.
These demonstrated issues do not establish the cause of the historical blank
JPEG observation described below.

The original historical failure reported red-channel 0 for a generated JPEG
after a successful PNG; it did not retain the failing encoded input. Subsequent
passing runs cannot prove which layer failed. The distinct Firefox EXIF bitmap
decoder rejection was reproduced and repaired earlier; it is not an explanation
for the original Chromium result.

Tests now preserve full output/native-decoder/source-after pixels and the
original **synthetic** encoded bytes on a pixel failure, with a negative test
showing a blank output can be distinguished from a correct encoded fixture.
No retries, sleeps, replacement approval hashes or blank-page heuristics are
accepted fixes. This sprint's bounded lifecycle cases cover new paths; do not
repeat equivalent stress runs indefinitely.

To close the original investigation, obtain a reproducible failing input and
its browser/version, decoder mode, output pixels and resource/cancellation
timeline. Independently decode the retained bytes. A correct input with wrong
output points toward rendering/decoder lifetime; a wrong encoded input points
toward fixture encoding. Neither diagnosis is established without that evidence.

## Activation prerequisites and rollback

Keep the current default/production/hosted-preview exclusion unchanged. Before
activation, separately review the exact candidate manifest and the JPEG risk;
obtain an explicit owner decision on unresolved evidence and unverified device/
speech behaviour. This suite cannot grant that acceptance.

Any later activation requires separate authority, exact package/environment
binding, authorised HTTPS verification and normal release controls. Never turn
on the gate or rebind assistant approvals merely because local checks passed.

Rollback for this local QA consolidation is the scoped patch and independent
before snapshots, not a broad checkout/reset. Remove only newly added QA files
if authorised; preserve unrelated work and earlier floorplan fixes. Production
is unaffected by this sprint. A future hosted activation must retain its own
known-good package/configuration rollback without touching DNS, email or budget
ledgers.

## 4 November 2026 — separately authorised protected preview

Run `node --test scripts/floor-plan-protected-preview.test.mjs` to validate the
separate preview assembler and rejection of non-preview bindings.
`assemblePreview` in `scripts/floor-plan-protected-preview.mjs` accepts a validated
public package, separate output directory, verified project ID, exact
`floorplan-<12 hex>--oztimberfloor.netlify.app` origin, non-production protection
and unchanged production deployment ID. Ordinary build exclusion remains intact.

The approved draft was deployed once without functions, AI or analytics. Its
provider context is `branch-deploy` (CLI draft alias, no Git push). Anonymous
access returned HTTP 401; signed-in hosted tests passed. The package retains its
global noindex header. Preview-only guards disable enquiry submission: only area
review/application is tested. Never reuse this package as production.

Hosted coverage: PNG/JPG, two PDF pages, damaged/CMYK JPEG rejection and recovery,
20 m² explicit-consent handoff, product context, area application and refresh.
The browser did not surface the link's native new tab; its observed destination
was opened explicitly. Hidden source attribution was redacted by browser tooling
and is not independently confirmed here. Physical devices, spoken screen readers
and the original unattributed intermittent JPEG failure remain separate risks.

Evidence: `floorplan-protected-preview-20261104` in the established external
evidence directory. No submission delivery or public activation is asserted.

## Separate production candidate preparation (not activation)

`node --test scripts/floor-plan-production-candidate.test.mjs` checks immutable
published-baseline and budget/corpus/archive rejection. The exported
`assembleProductionCandidate` in `scripts/floor-plan-production-candidate.mjs`
requires an exact verified public package, release receipt and original function
archives; it adds floorplan separately without changing ordinary build gates.
Output must be outside source/baseline directories and must not already exist.
Its manifest explicitly denies deployment authority. Reconcile any intervening
live release before using it; never silently overwrite newer live work.

The 4 November floorplan-only package preserves the live 773-page contract and
functions; it is not the separate 775-page combined local candidate. Test it with
the maintained journey/contact/extended/mobile/a11y suites in all three engines,
serving only loopback and intercepting all external/non-GET traffic. Exact
commands/results and package are in
`/Users/daibang/Downloads/OZ_FLOORPLAN_PRODUCTION_CANDIDATE_2026-11-04/`.
Do not publish the protected-preview package or treat a local pass as approval
for unresolved JPEG/device/speech evidence. No automatic deployment is included.
