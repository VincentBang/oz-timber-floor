# Oz Timber Floor Status

## Last Updated

17 May 2026

## Current Branch

`dev`

## Current Task

Create persistent agent-loop documentation so future Codex sessions can safely continue Oz Timber Floor work without full context being repeated.

## Completed Work

- Created persistent operating instructions and project control documents.
- Documented strategic separation from Operon.
- Documented hard rules for SEO, catalogue, conversion, content and QA.
- Captured current execution plan, SEO policy, task queue, decision log and migration checklist.
- Added `OZ_SEO_GROWTH_SYSTEM.md` with migration SEO checks, keyword-to-page map, money-page improvement system, 3-month content plan, project proof rules, internal linking strategy, legitimate backlink/local SEO plan and monthly review template.

## Files Changed

- `AGENTS.md`
- `OZ_EXECUTION_PLAN.md`
- `OZ_STATUS.md`
- `OZ_SEO_POLICY.md`
- `OZ_TASK_QUEUE.md`
- `OZ_DECISION_LOG.md`
- `OZ_MIGRATION_CHECKLIST.md`
- `OZ_SEO_GROWTH_SYSTEM.md`

## Tests/Checks Run

- Confirmed current branch: `dev`.
- Checked current git status before adding documentation.
- Confirmed `_redirects`, `sitemap.xml`, `robots.txt` and `_headers` exist.
- Sample checked priority money pages for one H1 each.
- Sample checked priority old URL mappings in `_redirects`.

## Open Risks

- The working tree is already heavily dirty from previous site, product, image and generated-page work.
- Many product/range/image changes need careful QA before commit or production migration.
- Do not commit or push until the dirty worktree has been reviewed and grouped safely.
- `robots.txt` currently blocks all crawling and `_headers` applies `X-Robots-Tag: noindex, nofollow`; good for staging but a production launch blocker.

## Next Recommended Task

Run a focused launch-safety QA pass on the current `dev` branch:

1. broken internal links
2. sitemap canonical URLs
3. `_redirects` targets
4. Bamboo public references
5. supplier-name public references
6. product/range missing images
7. mobile layout regressions

Then prepare production-specific indexing settings only after Vincent confirms the real domain migration timing.

## Blocked Decisions

- Confirm final Netlify deploy branch before production migration.
- Confirm final form destination and test submission.
- Confirm GA4/Search Console setup.
- Confirm whether any supplier names can appear publicly. Current policy says no public supplier names.
- Confirm real project photos/details before claiming completed projects.

## Manual Data Needed

- Real completed project photos and details.
- Verified review snippets, if used.
- Final showroom/service area wording.
- Final form destination and notification inbox.
- Insurance/licence wording, if the business wants it shown.
- Search Console top linked pages and top linking sites export.
