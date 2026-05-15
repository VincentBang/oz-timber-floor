# Brand Colour Audit

Audit date: 2026-05-16

## Logo File Used

- Source URL: `https://oztimberfloor.com.au/wp-content/uploads/2019/08/logo.jpg`
- Local source file: `assets/brand/oz-timber-floor-logo.jpg`
- Optimised display file: `assets/brand/oz-timber-floor-logo.webp`
- Source dimensions: 680 x 215

No SVG logo was found in the old WordPress page source. The old site uses JPEG logo assets in the header and footer.

## Extracted Logo Colours

Simple pixel sampling from the logo produced these dominant colours:

| Role | Extracted colour | Note |
| --- | --- | --- |
| Dominant warm colour | `#985123` | Timber/orange-brown used in the logo mark |
| Dominant dark colour | `#3c3c3c` | Charcoal text colour in the logo |
| Secondary dark | `#2c2c2c` | Darker charcoal edge/shadow pixels |
| Neutral | `#cccccc` | Anti-aliased grey from logo edges |

## Proposed Site Palette

The site palette uses the logo as an anchor, but softens it for a professional timber-flooring website:

| CSS variable | Final value | Use |
| --- | --- | --- |
| `--bg` | `#fbf7ef` | Warm ivory page background |
| `--surface` | `#fffdf8` | Cards and form surfaces |
| `--soft` | `#eef1e8` | Soft sage/stone section bands |
| `--ink` | `#26302d` | Main text |
| `--muted` | `#68736d` | Secondary text |
| `--line` | `#d8d4c8` | Soft borders |
| `--brand` | `#2f4239` | Primary charcoal green |
| `--brand-hover` | `#3d5a4c` | Primary hover |
| `--timber` | `#985123` | Logo-derived timber brown |
| `--accent` | `#b86b32` | Warm CTA/accent brown |
| `--accent-soft` | `#f1dfc9` | Pale oak/tan backgrounds |

## Contrast Notes

- White text on `--brand #2f4239` passes normal button contrast.
- `--ink #26302d` on `--bg #fbf7ef` and `--surface #fffdf8` is high contrast.
- `--muted #68736d` is reserved for body/supporting text, not critical controls.
- `--accent #b86b32` is used as an accent and hover/border colour, not as small white-text body copy.
