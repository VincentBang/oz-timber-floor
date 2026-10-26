// Catalogue strings are plain text. Decode inherited/repeated ampersand
// escaping before a renderer applies its one HTML-escaping pass.
export function normalizeCatalogueAmpersands(value = '') {
  return String(value).replace(/&(?:amp;)+/gi, '&');
}
