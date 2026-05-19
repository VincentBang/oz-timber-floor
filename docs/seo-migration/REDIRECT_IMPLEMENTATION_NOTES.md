# Redirect Implementation Notes

## Summary

- Permanent redirects implemented: 1721
- Migration backup patch saved at `/docs/seo-migration/worktree-backup-before-migration-work.patch`
- Final production domain in active sitemap and robots files: `https://oztimberfloor.com.au/`
- Search Console source exports restored into `/docs/seo-migration/source/`

## P0 / P1 redirect decisions tightened in this pass

- Added a live bamboo destination page: `/bamboo-flooring-sydney/`
- Updated legacy bamboo URLs to point to `/bamboo-flooring-sydney/` instead of the broader hardwood page
- Tightened engineered timber range redirects so legacy WordPress range URLs now resolve directly to:
  - `/ranges/artisan-oak/`
  - `/ranges/grand-oak/`
  - `/ranges/grand-oak-14-5mm/`
  - `/ranges/prestige-oak-15mm/`
  - `/ranges/prestige-oak-21mm/`
- Tightened laminate range redirects so legacy WordPress range URLs now resolve directly to:
  - `/ranges/kronoswiss-aquastop-laminate-8mm/`
  - `/ranges/kronoswiss-aquastop-laminate-12mm/`
  - `/ranges/kronoswiss-aquastop-laminate-14mm/`
  - `/ranges/villeroy-boch-aquastop/`
  - `/ranges/villeroy-boch-aquastop-8mm/`
  - `/ranges/villeroy-boch-aquastop-10mm/`
  - `/ranges/villeroy-boch-aquastop-12mm/`
- Tightened hybrid range redirects so legacy WordPress URLs now resolve directly to:
  - `/ranges/luxury-hybrid/`
  - `/ranges/ornato-hybrid/`
- Tightened additional long-tail redirects in this pass so legacy WordPress URLs now resolve directly to:
  - `/ranges/prestige-oak/`
  - `/ranges/stone-floor-tile/`
  - `/ranges/stone-floor-timber/`
  - `/bamboo-flooring-sydney/` for Stonewood and Verdura bamboo product aliases
- Removed stale redirect overrides that were forcing live range pages back to broad category pages.

## Redirects needing manual review later

- The restored Search Console exports still do not include target-paired backlink rows, so backlink protection is improved but not yet fully attributable per old URL.
- Many long-tail alias range slugs still exist in the content layer. They do not all block launch, but they should be rationalised before or shortly after migration.

## Intentionally unresolved / deferred

- No bamboo supplier page was created in this pass because the current catalogue does not expose a live bamboo range library. The category landing page preserves search intent without inventing thin stock pages.
- Product-name typo and alias chains outside the migration-critical range layer were left for a later data-normalisation pass.
- Live Netlify staging still reflects some older redirect behavior. See `/docs/seo-migration/LIVE_STAGING_REDIRECT_QA.md` for the URLs that need a fresh deploy to validate cleanly.
