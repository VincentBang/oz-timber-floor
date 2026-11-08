# 9 November 2026 — Exact non-conversion release delta

This is the byte-exact static delta published on Oz Timber Floor in Netlify deploy
`6af0fa8acbb4ce140923b09b`, relative to deploy `6af06710bae33937aa8a40ff`.
It contains the released content clarity and catalogue SEO edits plus the
refreshed search index. It is a release record, not an input to the Git-based
website build. Do not apply it to the source checkout or deploy this directory.

To reproduce the exact public tree, make an isolated copy of the previous sealed
public package, verify its manifest against `PACKAGE.json`, and run
`gzip -dc /absolute/path/to/public.patch.gz | git apply --check`, followed by
`gzip -dc /absolute/path/to/public.patch.gz | git apply` from that isolated public directory.
Then verify its full SHA-256 manifest against `publicManifestSha256`.
The patch was verified by applying it to the exact baseline files and checking
the reconstructed manifest of all 6,619 public files.

The two Contact pages, the existing live enquiry flow, uploads, chatbot, and
function archives were not changed. The release includes no pending
OZ-CONVERSION work. This GitHub sync must not trigger a Netlify deployment.
