# Oz Timber Floor — 10 November 2026 public release

The sealed public delta records the approved Sydney floor levelling and installation release, Sydney installation/Cabramatta sanding/Liverpool follow-up, and the combined commercial guides, hardwood, laminate and vinyl updates.

`RELEASE.json` binds every changed public path to its before/after SHA-256 and identifies the exact colour-audit package from which to replay. Decompress `public.patch.gz`, check it against a copy of that exact sealed public package, and verify the target hashes before use.

This archive is outside the public output. It does not change the Git-based build, import unrelated working-tree source, or replace Netlify functions or provider configuration. The Netlify publication is performed from the independently verified static package; do not rebuild production from this commit alone.
