# Live Oz Crawl Summary

Sources checked:

- https://oztimberfloor.com.au/wp-sitemap.xml
- https://oztimberfloor.com.au/page-sitemap.xml
- https://oztimberfloor.com.au/post-sitemap.xml
- https://oztimberfloor.com.au/product_cat-sitemap.xml
- https://oztimberfloor.com.au/product-sitemap.xml

Counts from live Yoast sitemaps:

- Pages: 43
- Guides/posts: 20
- Product categories/ranges: 45
- Products: 423

Key leakage found and removed from the static rebuild:

- Innova Kitchens links and footer copy seen on live snippets and old pages are not included in the new public navigation, footer or CTAs.

Protected boundary confirmed in generated static files:

- No Operon quote flow, quote review, floorplan, pricing logic, Supabase config, Resend config or AI tools are copied into Oz.
