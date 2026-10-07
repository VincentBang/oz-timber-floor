import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const requestedContext = process.env.CONTEXT || "dev";
const context = String(requestedContext).trim().toLowerCase();
const isProduction = context === "production";
const indexingEnabled = /^true$/i.test(String(process.env.OZ_PRODUCTION_INDEXING_ENABLED || "").trim());
const publishIndexable = isProduction && indexingEnabled;
const headersSource = path.join(
  root,
  "config",
  "netlify-headers",
  publishIndexable ? "production" : "non-production",
);
const headersDestination = path.join(root, "_headers");
const contactConfigPath = path.join(root, "assets", "contact-config.js");
// Owner supplied the existing Oz property in the October migration brief.
const measurementId = String(process.env.OZ_GA4_MEASUREMENT_ID || "G-EWSMKKM9N8").trim();
const validMeasurementId = /^G-[A-Z0-9]+$/i.test(measurementId);
if (measurementId.toUpperCase() !== 'G-EWSMKKM9N8') {
  throw new Error('GA4 configuration differs from the owner-approved Oz property G-EWSMKKM9N8; resolve the property identity before building.');
}

if (!fs.existsSync(headersSource)) {
  throw new Error(`Missing deploy header template: ${headersSource}`);
}

fs.copyFileSync(headersSource, headersDestination);

if (!fs.existsSync(contactConfigPath)) {
  throw new Error(`Missing contact configuration: ${contactConfigPath}`);
}

let contactConfig = fs.readFileSync(contactConfigPath, "utf8");
const configuredId = publishIndexable && validMeasurementId ? measurementId.toUpperCase() : null;
const replacement = `ga4MeasurementId: ${configuredId ? JSON.stringify(configuredId) : "null"}`;

if (!/ga4MeasurementId\s*:\s*(?:null|["'][^"']*["'])/.test(contactConfig)) {
  throw new Error("assets/contact-config.js must expose analytics.ga4MeasurementId for safe build injection.");
}

contactConfig = contactConfig.replace(
  /ga4MeasurementId\s*:\s*(?:null|["'][^"']*["'])/,
  replacement,
);
fs.writeFileSync(contactConfigPath, contactConfig);

const mode = publishIndexable
  ? "approved indexable production"
  : isProduction
    ? "protected production"
    : "non-production";
const analytics = configuredId ? "configured for owner-approved Oz property G-EWSMKKM9N8" : "not configured";
process.stdout.write(`Prepared ${mode} Netlify headers; GA4 ${analytics}.\n`);
