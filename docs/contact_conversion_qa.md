# Contact and Conversion QA

## Status

- `/contact/` exists.
- Netlify form attributes remain present: `data-netlify="true"`, honeypot field, and action `/thank-you/`.
- Enquiry types include stock, supply-only, supply + install, product, commercial and service/floor preparation.
- Product URL parameters populate the contact form without exposing raw supplier names from current product links.
- Consent/privacy wording is visible near the form.
- Phone and email calls-to-action are visible.
- Footer contact fallback is clickable HTML, so it does not depend entirely on JavaScript.
- `assets/site.js` does not overwrite non-empty contact fallback blocks.

## Manual Production Test Required

- Submit a staging Netlify form test and confirm delivery to `info@oztimberfloor.com.au` or the approved Netlify notification destination.
- Confirm GA4 lead/call/email events in DebugView once the final measurement ID is active.
