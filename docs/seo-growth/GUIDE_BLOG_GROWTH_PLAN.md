# Guide And Blog Growth Plan

Date: 2026-05-26

## Current Migration State

- Old `/blogs/` maps to `/guides/`.
- `BLOG_MIGRATION_MATRIX.csv` contains 20 rows.
- Rows reviewed show `status = migrated` and `content_status = full copied`.
- New guide pages are stronger than a thin archive if internal links and CTAs stay maintained.

## Preservation Checks

| Check | Status | Notes |
| --- | --- | --- |
| Old blog URLs mapped to new guides | Good | Matrix maps root-level posts to `/guides/[slug]/`. |
| Full useful content preserved | Good | Matrix indicates full copied content. |
| Archive route preserved | Good | `/blogs/` resolves to `/guides` on staging sample. |
| Internal links to money pages | Needs ongoing improvement | Each guide should have one primary money page, one related service/category page and contact CTA. |
| Guide clusters support services/categories | Partial | Commercial and comparison coverage exists; builder cluster needs expansion. |
| Builder/contractor guide cluster | Needs planning | Important for contractor/subcontractor growth. |

## Recommended Guide Clusters

| Cluster | Purpose | Example guide topics | Primary money page |
| --- | --- | --- | --- |
| Builder contractor guides | Win builder/subcontractor search and trust. | Flooring handover checklist for builders; sequencing floor levelling before timber install; builder flooring contractor quote checklist. | `/builder-flooring-contractor-sydney/` |
| Floor preparation guides | Support floor levelling and install quality. | How to check subfloor flatness; moisture before timber flooring; trims and transition planning. | `/floor-levelling-sydney/` |
| Flooring comparison guides | Support category decisions. | Hybrid vs laminate; solid timber vs engineered timber; vinyl vs hybrid; timber-look flooring for apartments. | Category pages |
| Apartment/strata guides | Capture strata/acoustic intent. | Acoustic checks before flooring in apartments; apartment flooring access and timing; strata approval checklist. | `/hybrid-flooring-sydney/`, `/timber-flooring-installation-sydney/` |
| Commercial/office guides | Support business fit-out intent. | Office flooring durability; flooring for medical suites; commercial flooring installation staging. | `/commercial-flooring-sydney/`, `/office-flooring-sydney/` |
| Quote/checklist guides | Improve enquiry quality. | What to send for a flooring quote; supply-only checklist; how to check stock and batch. | `/contact/`, `/products/` |

## Publishing Order

1. Do not publish new guides during days 0-14 after migration unless fixing a blocker.
2. First update internal links in existing guides.
3. Then publish one strong builder contractor guide.
4. Then publish one floor preparation guide.
5. Then publish comparison guides based on Search Console query data.

## Internal Link Rules

Each guide should include:

- One primary money page link.
- One related service/category link.
- One product/range link when relevant.
- One contact/enquiry CTA.
- No keyword stuffing.
- No unsupported claims.

## Priority Existing Guides To Revisit

- `how-hybrid-timber-flooring-performs-in-sydney-apartments`
- `solid-timber-flooring-vs-engineered-flooring-which-one-is-right-for-you`
- `commercial-timber-flooring-specialist-sydney-builders-designers`
- `choosing-office-flooring-durability-design-performance`
- `professional-commercial-flooring-installation-what-to-expect`

## Do Not Do Yet

- Do not mass-publish thin guides.
- Do not rewrite all migrated blog content during launch week.
- Do not create near-duplicate guides for every suburb/range.
