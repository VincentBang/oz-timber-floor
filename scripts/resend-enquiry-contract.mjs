import assert from "node:assert/strict";
import { sendVerifiedEnquiryNotification } from "../netlify/functions/resend-enquiry-notification.mjs";

const originalKey = process.env.RESEND_API_KEY;
const originalFrom = process.env.RESEND_FROM_EMAIL;
const originalTo = process.env.RESEND_ENQUIRY_TO;
process.env.RESEND_API_KEY = "test-key-not-a-secret";
process.env.RESEND_FROM_EMAIL = "Oz Timber Floor <info@oztimberfloor.com.au>";
process.env.RESEND_ENQUIRY_TO = "info@oztimberfloor.com.au";

let request;
const fakeSend = async (url, options) => {
  request = { url, options };
  return { ok: true, status: 200 };
};
const result = await sendVerifiedEnquiryNotification({ id: "submission-1", data: {
  "form-name": "oz-flooring-enquiry", name: "Test Customer", email: "customer@example.com", phone: "0400 000 000",
  enquiry_type: "supply-install", product: "Example product", range: "Example range", source_page: "/products/example/",
} }, fakeSend);
assert.equal(result.skipped, false);
assert.equal(request.url, "https://api.resend.com/emails");
assert.equal(request.options.headers["Idempotency-Key"], "oz-enquiry-submission-1");
const payload = JSON.parse(request.options.body);
assert.equal(payload.from, "Oz Timber Floor <info@oztimberfloor.com.au>");
assert.deepEqual(payload.to, ["info@oztimberfloor.com.au"]);
assert.equal(payload.reply_to, "customer@example.com");
assert.match(payload.text, /Example product/);
assert.deepEqual(await sendVerifiedEnquiryNotification({ data: { "form-name": "other-form" } }, fakeSend), { skipped: true });
assert.deepEqual(await sendVerifiedEnquiryNotification({ data: { "form-name": "oz-flooring-enquiry", company: "bot" } }, fakeSend), { skipped: true });
process.env.RESEND_API_KEY = originalKey;
process.env.RESEND_FROM_EMAIL = originalFrom;
process.env.RESEND_ENQUIRY_TO = originalTo;
console.log("RESEND ENQUIRY CONTRACT PASS verified-form-only,honeypot-safe,from-and-recipient-pinned,reply-to-customer,idempotent");
