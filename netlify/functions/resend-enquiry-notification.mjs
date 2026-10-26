import crypto from "node:crypto";

const formName = "oz-flooring-enquiry";
const sender = "Oz Timber Floor <info@oztimberfloor.com.au>";
const recipient = "info@oztimberfloor.com.au";
const visibleFields = [
  ["name", "Name"], ["email", "Email"], ["phone", "Phone"], ["enquiry_type", "Enquiry type"],
  ["product", "Product"], ["range", "Range"], ["category", "Category"], ["suburb", "Suburb"],
  ["area", "Area"], ["timing", "Timing"], ["property_type", "Property type"], ["service_type", "Service"],
  ["current_flooring", "Current flooring"], ["company_project", "Project"], ["access_constraints", "Access notes"],
  ["message", "Message"], ["source_page", "Source page"],
];

function clean(value, maxLength = 2000) {
  return String(value || "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, maxLength);
}

function email(value) {
  const candidate = clean(value, 254);
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(candidate) ? candidate : "";
}

function messageText(data) {
  return visibleFields
    .map(([key, label]) => [label, clean(data[key])])
    .filter(([, value]) => value)
    .map(([label, value]) => `${label}: ${value}`)
    .join("\n");
}

function eventKey(event, data) {
  const knownId = clean(event?.submissionId || event?.id || data.submission_id, 120);
  if (knownId) return `oz-enquiry-${knownId}`;
  return `oz-enquiry-${crypto.createHash("sha256").update(JSON.stringify(data)).digest("hex")}`;
}

export async function sendVerifiedEnquiryNotification(event, send = fetch) {
  const data = event?.data || {};
  if (clean(data["form-name"]) !== formName || clean(data.company)) return { skipped: true };

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("RESEND_API_KEY is not configured");

  const from = clean(process.env.RESEND_FROM_EMAIL || sender, 320);
  if (!/info@oztimberfloor\.com\.au/i.test(from)) throw new Error("RESEND_FROM_EMAIL must use info@oztimberfloor.com.au");
  const to = email(process.env.RESEND_ENQUIRY_TO || recipient);
  if (to !== recipient) throw new Error("RESEND_ENQUIRY_TO must be info@oztimberfloor.com.au");

  const replyTo = email(data.email);
  const response = await send("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "Idempotency-Key": eventKey(event, data),
    },
    body: JSON.stringify({
      from,
      to: [to],
      reply_to: replyTo || undefined,
      subject: `New Oz Timber Floor enquiry${clean(data.enquiry_type) ? ` — ${clean(data.enquiry_type, 80)}` : ""}`,
      text: messageText(data) || "A verified Oz Timber Floor enquiry was received. Review the Netlify Forms record for details.",
    }),
  });
  if (!response.ok) throw new Error(`Resend notification failed with HTTP ${response.status}`);
  return { skipped: false };
}

export default {
  async formSubmitted(event) {
    await sendVerifiedEnquiryNotification(event);
  },
};
