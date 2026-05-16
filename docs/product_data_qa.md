# Product Data QA

| Page / file | Issue | Current value | Recommended fix | Confidence | Needs Vincent review |
| --- | --- | --- | --- | --- | --- |
| `products.html` | Extra closing wrapper after category grid | Closing `</div>` count exceeded opening count by 1 | Removed extra closing `</div>` after the category chooser | High | No |
| `index.html` | Broken homepage category card | Empty title card linking to `/products/` with unrelated image | Removed the stray card from the homepage category grid | High | No |
| `products.html` | Public supplier-led overlines | Popular range cards used `Oz Timber Floor` as the visible overline | Replaced visible overlines with category-led labels | High | No |
| `ranges/index.html` | Public supplier-led overlines | Range library cards used `Oz Timber Floor` as the visible overline | Replaced visible overlines with category-led labels | High | No |
| `products.html` | Alt text branding overload | Listing card alts prefixed with `Oz Timber Floor` | Removed the Oz prefix from non-project swatch/listing alt text | High | No |
| `products.html` | Suspicious colour count | `Hardwood Collection` showed `185 colours` on a homepage-style card | Removed the unverified count from the simplified hub card | Medium | Yes |
| `ranges/index.html` | Suspicious image match | `Aquastop Laminate` card appears to use a hardwood collection swatch image | Review the source image and replace with the correct laminate image before promoting the card further | Medium | Yes |
| `products.html` | Featured mix still lacks a verified vinyl colour card | No safe vinyl colour card with verified image/data is currently surfaced | Keep vinyl active in category/range navigation and add a verified vinyl product card only when exact imagery is ready | High | Yes |
