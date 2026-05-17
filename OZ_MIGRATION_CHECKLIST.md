# Oz Timber Floor Migration Checklist

## Old URL Inventory

Core old URLs to preserve or redirect:

- `/`
- `/about-us/`
- `/services/`
- `/contact-us/`
- `/sitemap/`
- `/blogs/`
- `/faqs/`
- `/gallery/`

Service old URLs:

- `/timber-floor-installation/`
- `/floor-levelling/`
- `/commercial-flooring/`
- `/office-flooring/`
- `/timber-floor-sanding-and-polishing/`
- `/timber-floor-removal-and-stripping/`

Category old URLs:

- `/hybrid/`
- `/laminate/`
- `/engineered-timber-flooring/`
- `/manufactured-wood/`
- `/solid-timber/`
- `/vinyl/`
- `/bamboo/`

Product/category URL groups:

- `/product-category/...`
- `/product/...`

## New URL Mapping

Required mappings:

- `/about-us/` -> `/about/`
- `/services/` -> `/services/`
- `/contact-us/` -> `/contact/`
- `/timber-floor-installation/` -> `/timber-flooring-installation-sydney/`
- `/floor-levelling/` -> `/floor-levelling-sydney/`
- `/commercial-flooring/` -> `/commercial-flooring-sydney/`
- `/office-flooring/` -> `/office-flooring-sydney/`
- `/timber-floor-sanding-and-polishing/` -> `/timber-floor-sanding-and-polishing-sydney/`
- `/timber-floor-removal-and-stripping/` -> `/timber-floor-removal-and-stripping-sydney/`
- `/hybrid/` -> `/hybrid-flooring-sydney/`
- `/laminate/` -> `/laminate-flooring-sydney/`
- `/engineered-timber-flooring/` -> `/engineered-timber-flooring-sydney/`
- `/manufactured-wood/` -> `/engineered-timber-flooring-sydney/`
- `/solid-timber/` -> `/solid-timber-flooring-sydney/`
- `/vinyl/` -> `/vinyl-flooring-sydney/`
- `/bamboo/` -> `/hardwood-timber-flooring-sydney/`
- `/blogs/` -> `/guides/`
- `/faqs/` -> `/faqs/`
- `/gallery/` -> `/projects/`
- `/sitemap/` -> `/sitemap/`

## Redirect Status

- Check `_redirects` exists.
- Check all required service redirects exist.
- Check product/category/range redirects are relevant.
- Check old Bamboo URLs redirect to a relevant non-Bamboo destination.
- Check typo URLs redirect to corrected canonical destinations.
- Check every redirect target exists.

## Sitemap Status

- Sitemap exists.
- Sitemap uses `https://oztimberfloor.com.au/`.
- Sitemap excludes Netlify staging URLs.
- Sitemap excludes Bamboo public URLs.
- Sitemap excludes redirected typo URLs.
- Sitemap includes key services, products, ranges, projects, guides, legal and contact pages.

## Robots Status

- Production robots ready.
- Staging indexing protection confirmed before launch.
- Staging not submitted to Search Console.

## Noindex Status

- Staging should be noindex until approved.
- Production should be indexable when the real domain is connected.
- Confirm no staging noindex leaks into production launch.

## Search Console Readiness

- Export top linked pages.
- Export top linking sites.
- Confirm final sitemap URL.
- Prepare to submit sitemap after production launch.
- Monitor 404s after launch.

## Contact Form Test

- Form destination confirmed.
- Test submission successful.
- Thank-you or success state works.
- Enquiry type is captured.
- Product/range/category/source fields are captured where relevant.
- Phone and email CTAs work.

## Image Check

- No broken images.
- Product images are local, not hotlinked.
- Obvious mismatches flagged.
- Oversized images compressed where practical.
- Alt text is descriptive.

## Mobile Check

- Header menu works.
- Dropdowns/tap targets work.
- Product cards stack cleanly.
- Forms are usable.
- FAQ accordions work.
- No horizontal overflow.

## Footer and Legal Links

- Privacy Policy link works.
- Terms link works.
- Contact link works.
- Product/category links work.
- `/ranges/` remains linked.
- No Bamboo visible publicly.

## Launch Blockers

- Broken redirect targets.
- Broken contact form.
- Staging noindex/production index confusion.
- Public Bamboo references.
- Public supplier names if current policy remains hidden supplier names.
- Major missing old URL mappings.
- Sitemap containing redirected or discontinued URLs.
- Product/range pages with misleading images or fake specs.
