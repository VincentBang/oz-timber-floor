Exact deployed chatbot release — 6 November2026

This immutable production overlay records the knowledge/profile and contact copy
actually deployed as6aed0124f8a810d9098d6b1b. It is separate from the ordinary
generated knowledge candidate and source defaults, which intentionally remain
OFF/unapproved until a separately authorised release.

The two deployed client files and all deployed runtime modules were already in
the parent Git commit. RELEASE.json pins their digests. Only these versioned
payloads are new: the exact approved corpus, active profile, function descriptor,
and two contact HTML overlays. Do not sweep unpublished audit edits into them.
Do not replace original approval hashes, regenerate the released corpus from a
different working tree, or assume a normal build reproduces this live overlay.

Run from repository root:
  node scripts/verify-chatbot-release-20261106.mjs
  node --test scripts/verify-chatbot-release-20261106.test.mjs

The verifier is read-only and makes no provider/Git/deployment/model calls. An
optional OZ_DEPLOYED_ASSISTANT_ZIP path checks the original private production
archive, including the full inlined corpus/profile. Vendor bundles, provider
snapshots, customer submissions, secrets and machine-local evidence are not
committed here. All content in corpus.json is the already reviewed public-site
knowledge snapshot, not private supplier provenance or customer information.

For any future explicitly approved release, use the exact tracked runtime sources
listed in RELEASE.json, overlay corpus.json and production-profile.json into an
isolated function source directory, and preserve the recorded Node24 function
descriptor. Apply only public/contact.html and public/contact/index.html onto
the previously verified live public package; preserve every other public file,
including the already tracked client assets. Verify the complete result against
the owner-approved release packet, not a newly rebuilt website candidate.

These files do NOT authorise another deployment or live control change. Current
production fingerprint/control are already matched; do not write them again for
a Git-only sync. Keep US$30/month and US$1/day, the same durable store/region,
state-v1 and control-v1. Never reset or restore spending counters.

The release directory is server/release-only and must stay out of the public
publish package. The default website builder uses an explicit public-directory
allowlist; assistant/ is not in it. Keep source default activation OFF.

This Git sync uses [skip ci] [skip netlify] and must not deploy again. Unrelated
local work, original approval evidence, floorplan and enquiry upload code remain
untouched. The full private release report/archives are retained by the owner.
