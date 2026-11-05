# Exact rebuilt knowledge binding — local preparation only

Base source commit: `67f71ea86ac0ddd63e38b1f992c474e0ffb9d679`.
Candidate corpus: `a26ef1108a47eba7e29017b2b49b02ac5f3af3d8b85270b42b26ddb598f163e9`.
Pending profile object hash: `adb7ec34b60305f4a010eb99ae4df12d7236f79c68c81205b9428557b1c16545`.

The November 5 owner request permits preparation and local checks, not push,
deployment, provider writes, paid GPT calls or activation. Both the prepared
profile and its authority remain inactive. Knowledge/launch approval flags are
false until separately authorised. Do not put the pending hash into Netlify.

## Reviewed scope

775 canonical documents, 6,821 facts. The preserved approved parent has 6,818
facts. No prior semantic fact value or retirement changes. Exactly three
homepage additions are corroborated by the public page and approved photo data:

- Flooring supply, installation and preparation across Sydney.
- Herringbone kitchen and living area — an approved project-photo caption,
  not a product identity or specification.
- 24/24–32 Hughes Street, Cabramatta NSW 2166 — the business showroom.

The review also records changed IDs/section references for otherwise unchanged
facts. Privacy wording is unchanged; its new raw-source hash is bound to the
current page. The historical model/store reports remain historical and are not
relabelled as hosted verification of this candidate. Runtime, model, key-variable
name, rate table, budget adapter, durable store and allowance values are unchanged.
No provider pricing or model-access refresh is claimed by offline checks.

## Reproduce locally

Use an isolated copy with the repository's dependencies. Baseline corpus must
be the preserved November 4 file with SHA-256
`228c2b9a62a29fc80afa16cf6b152737c7bb38e374c363c6f2435e99d39dd328`.

```sh
OZ_BINDING_BASELINE_CORPUS=/absolute/path/to/preserved/corpus.json \
  node --test scripts/knowledge-binding-20261105.test.mjs
```

The maintained preparer is `scripts/prepare-knowledge-binding-20261105.mjs`.
It requires explicit `OZ_BINDING_BASELINE_CORPUS`, `OZ_BINDING_PARENT_PACKET`,
`OZ_ASSISTANT_BUNDLER` (installed official Netlify bundler matching the parent
production bootstrap; ZISI16.6.0/serverless API2.24.0 in this pass) and a new absolute
`OZ_BINDING_OUTPUT` outside the source checkout. It refuses output reuse.
Run with the existing no-network preload for local-only assurance. It verifies
all 881 source-manifest inputs, the parent release and all 6,592 static files,
compares approved runtime hashes, copies historical reports byte-for-byte,
creates an inactive Node24 function archive and cold-imports it with network
forbidden. No ordinary website rebuild is needed.

Exact command logs and current artifacts:
`/Users/daibang/Downloads/OZ_CHATBOT_REBUILT_BINDING_LOCAL_2026-11-05_R2/`.
The first inactive local packet is retained as HOLD: its older CLI bundler
produced bootstrap2.16.0 instead of production2.24.0. The corrected producer
requires identical runtime/routes/rate-limit/bootstrap metadata and includes
the preserved notification descriptor and submission event subscription.
The preparer must never overwrite old approval records, published archives,
source defaults or the live configuration.

## Budget and subsequent activation

USD30 per month and USD1 per day remain exact. The same production budget store,
region, `state-v1` ledger and `control-v1` activation record are required. Local
tests use RAM fixtures only: they check pre-existing daily/monthly spending and
concurrent CAS reservations. No real ledger is initialised or reset.

Remaining: separately approved protected hosted verification, then owner release
approval. Later approval changes the launch flags/reference and therefore the
profile hash: seal that new active payload, bundle it and coordinate the matching
environment fingerprint/control update as one verified release. Do not reuse
the pending hash as an activated hash, publish the inactive archive, reset
counters or change the model/key merely to bypass a binding mismatch. Preserve
the existing website/floorplan and the byte-identical notification function.
