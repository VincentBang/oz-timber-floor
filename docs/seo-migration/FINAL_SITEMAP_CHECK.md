# Final Sitemap Check

Date: 2026-05-21

Checked against:
- `https://oztimberfloor.netlify.app/sitemap.xml`
- `https://oztimberfloor.netlify.app/robots.txt`

## Summary
- Sitemap loads: `yes`
- Robots sitemap references use final production domain: `yes`
- Netlify URLs inside sitemap: `no`
- Operon URLs inside sitemap: `no`
- Sitemap URL count on current staging: `1730`

## Robots.txt

Current staging `robots.txt`:

```text
User-agent: *
Allow: /

Sitemap: https://oztimberfloor.com.au/sitemap.xml
Sitemap: https://oztimberfloor.com.au/sitemap-keyword-targets.xml
```

This is correct for production migration readiness because the sitemap references already point to the final production domain.

## Important URLs Confirmed In Sitemap
- `/`
- `/services/`
- `/products/`
- `/projects/`
- `/guides/`
- `/contact/`
- `/privacy/`
- `/terms/`
- `/hybrid-flooring-sydney/`
- `/laminate-flooring-sydney/`
- `/engineered-timber-flooring-sydney/`
- `/solid-timber-flooring-sydney/`
- `/vinyl-flooring-sydney/`
- `/floor-levelling-sydney/`
- `/timber-flooring-installation-sydney/`
- `/timber-floor-removal-and-stripping-sydney/`
- `/timber-floor-sanding-and-polishing-sydney/`
- `/commercial-flooring-sydney/`
- `/office-flooring-sydney/`
- `/builder-flooring-contractor-sydney/`

## Hygiene Checks
- Old redirected WordPress URLs present in sitemap: `no`
- Netlify preview URLs present in sitemap: `no`
- Operon URLs present in sitemap: `no`
- Sitemap URLs use final domain `https://oztimberfloor.com.au/`: `yes`

## Conclusion
The sitemap layer is clean and production-domain aligned. It is not the current migration blocker.
