# SEO Migration Check

Date: 2026-05-16

## Branch and Deployment Source

- Improved site branch: `dev`.
- `origin/main` is behind the improved staging branch and still contains older public-site problems such as the fake text mark, Bamboo navigation/content, and supplier/internal catalogue wording.
- `netlify.toml` publishes the repository root (`.`). The staging site currently responds with `X-Robots-Tag: noindex, nofollow`, matching the staging-safety files in `dev`.
- Recommendation before domain migration: either merge `dev` into `main` after final approval or explicitly confirm Netlify is deploying `dev`. Do not connect the production domain while `main` remains behind.

## Old URL Preservation

| Old URL | New URL | Redirect exists | Content equivalent | SEO risk | Fix required / note |
| --- | --- | --- | --- | --- | --- |
| / | / | No | Yes | Low | Homepage remains live as root and links to service/category depth pages. |
| /timber-floor-installation/ | /timber-flooring-installation-sydney/ | Yes | Yes | Low | Priority service intent preserved. |
| /floor-levelling/ | /floor-levelling-sydney/ | Yes | Yes | Low | Ranking page from SEO report; redirect and equivalent page present. |
| /commercial-flooring/ | /commercial-flooring-sydney/ | Yes | Yes | Low | Ranking page from SEO report; commercial page present. |
| /office-flooring/ | /office-flooring-sydney/ | Yes | Yes | Low | Redirect and office page present. |
| /hybrid/ | /hybrid-flooring-sydney/ | Yes | Yes | Low | Ranking page from SEO report; category preserved. |
| /laminate/ | /laminate-flooring-sydney/ | Yes | Yes | Low | Ranking page from SEO report; category preserved. |
| /engineered-timber-flooring/ | /engineered-timber-flooring-sydney/ | Yes | Yes | Low | Priority keyword page upgraded and preserved. |
| /manufactured-wood/ | /engineered-timber-flooring-sydney/ | Yes | Yes | Low | Legacy engineered timber intent redirected to primary page. |
| /solid-timber/ | /solid-timber-flooring-sydney/ | Yes | Yes | Low | Solid timber category preserved. |
| /vinyl/ | /vinyl-flooring-sydney/ | Yes | Yes | Low | Ranking page from SEO report; category preserved. |
| /about-us/ | /about/ | Yes | Yes | Low | About page present. |
| /contact-us/ | /contact/ | Yes | Yes | Low | Contact page and Netlify form present. |
| /blogs/ | /guides/ | Yes | Yes | Medium | Guides hub exists; keep adding useful guides after launch. |
| /gallery/ | /projects/ | Yes | Yes | Medium | Projects page exists; real project photos still improve trust. |
| /faqs/ | /faqs.html | Yes | Yes | Low | FAQ page exists and redirect points to file. |
| /product-category/... | /ranges/* or category pages | Yes | Mostly | Medium | Mapped to closest range/category/product pages; no mass /products/ dump found. |
| /product/... | /products/* | Yes | Mostly | Medium | Product redirects point to matching product pages where available. |

## Keyword Protection

- commercial flooring installation sydney: `/commercial-flooring-sydney/`
- commercial timber flooring sydney: `/commercial-flooring-sydney/`
- engineered timber flooring sydney: `/engineered-timber-flooring-sydney/`
- floor levelling sydney: `/floor-levelling-sydney/`
- hybrid timber flooring sydney: `/hybrid-flooring-sydney/`
- laminate timber flooring sydney: `/laminate-flooring-sydney/`
- office flooring sydney: `/office-flooring-sydney/`
- timber flooring installation sydney: `/timber-flooring-installation-sydney/`
- timber flooring sydney: `/`
- vinyl timber flooring sydney: `/vinyl-flooring-sydney/`
