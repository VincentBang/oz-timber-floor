import fs from "node:fs";

const file = "assets/site.js";
let js = fs.readFileSync(file, "utf8");

js = js
  .replaceAll('<p><strong>Range:</strong>" + escapeHtml(range) +"</p>', '<p><strong>Range:</strong> " + escapeHtml(range) +"</p>')
  .replaceAll('<p><strong>Category:</strong>" + escapeHtml(category) +"</p>', '<p><strong>Category:</strong> " + escapeHtml(category) +"</p>')
  .replaceAll('<p><strong>Enquiry:</strong>" + escapeHtml(humanEnquiry(select ? select.value : enquiry)) +"</p>', '<p><strong>Enquiry:</strong> " + escapeHtml(humanEnquiry(select ? select.value : enquiry)) +"</p>')
  .replaceAll(
    'message.value ="I\'m enquiring about" + product +". Please confirm" + (select && select.value ==="stock" ?"stock availability and supply options." :"the best supply or installation options.");',
    'message.value ="I am enquiring about " + product +". Please confirm " + (select && select.value ==="stock" ?"stock availability and supply options." :"the best supply or installation options.");',
  )
  .replaceAll('lines.push("Showroom:" + contact.showroom);', 'lines.push("Showroom: " + contact.showroom);')
  .replaceAll('lines.push("Phone:" + contact.phoneDisplay);', 'lines.push("Phone: " + contact.phoneDisplay);')
  .replaceAll('lines.push("Second phone:" + contact.secondaryPhoneDisplay);', 'lines.push("Second phone: " + contact.secondaryPhoneDisplay);')
  .replaceAll('lines.push("Email:" + contact.email);', 'lines.push("Email: " + contact.email);');

fs.writeFileSync(file, js);
console.log("site.js contact copy refined");
