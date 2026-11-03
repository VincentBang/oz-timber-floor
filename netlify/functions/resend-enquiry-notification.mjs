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
  var shortened = false;
  const text = visibleFields
    .map(([key, label]) => { const full = String(data[key] || "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim(); const preview = full.slice(0, 2000).replace(/[\uD800-\uDBFF]$/, ""); if (preview.length < full.length) shortened = true; return [label, preview + (preview.length < full.length ? " [shortened preview]" : "")]; })
    .filter(([, value]) => value)
    .map(([label, value]) => `${label}: ${value}`)
    .join("\n");
  // Netlify's hosted upload receipt/schema still needs independent validation.
  // Report field presence only: never fetch, embed or forward supplied URLs,
  // filenames or raw binary, and never claim files were verified from this flag.
  const uploadFields = ["floor_plan", "flooring_photo_1", "flooring_photo_2"];
  const supplied = uploadFields.some(key => {
    const value = data[key];
    if (typeof value === "string") return value.trim().length > 0;
    // Netlify's accepted submission uses a file descriptor, not a URL string.
    // Inspect only its shape; never fetch/forward its URL, name or contents.
    return value && typeof value === "object" && !Array.isArray(value)
      && value.type === "file" && typeof value.filename === "string"
      && value.filename.trim().length > 0 && value.filename.length <= 512
      && Number.isFinite(value.size) && value.size > 0 && value.size <= 7000000;
  });
  return text + (shortened ? "\n\nSome fields above are shortened previews. Sign in to the Oz Timber Floor Netlify dashboard, open Forms, select oz-flooring-enquiry and locate the matching submission for the complete details." : "") + (supplied ? "\n\nAttachment check: upload fields were supplied. Review the original Netlify Forms submission to confirm file receipt and open any attachments." : "");
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
