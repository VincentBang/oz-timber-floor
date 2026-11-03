import {parse} from 'parse5';

// A reviewed display repair, not a new supplier specification. Keep raw import evidence intact.
export const easiPlankImportText = 'Download Acoustic Test 7.5mm Easi-Plank Hybrid Plank Download Acoustic Test 8mm';
export const iconicImportText = 'Download Acoustic Test Iconic Download Fire Test Download Floor Care Download Sp';
export const lifestyleImportText = 'Download See more of our products Hybrid Flooring Urban Grey Hybrid Flooring Wil';
const reviewedImportText = new Map([
  ['https://oztimberfloor.com.au/ranges/easi-plank/', easiPlankImportText],
  ['https://oztimberfloor.com.au/ranges/iconic-wpc/', iconicImportText],
  ['https://oztimberfloor.com.au/ranges/lifestyle-collection/', lifestyleImportText],
]);
export const installationConfirmation = 'Confirm installation requirements before order.';
const walk = n => [n, ...(n.childNodes || []).flatMap(walk)];
const attr = (n, k) => n.attrs?.find(a => a.name === k)?.value;
const text = n => n.nodeName === '#text' ? n.value : (n.childNodes || []).map(text).join('');
export function repairReviewedRangeSpec(html) {
  const nodes = walk(parse(html, {sourceCodeLocationInfo: true}));
  const canonical = nodes.find(n => n.tagName === 'link' && attr(n, 'rel') === 'canonical');
  const reviewedText = reviewedImportText.get(attr(canonical || {}, 'href'));
  if (!reviewedText) return html;
  const fields = nodes.filter(n => (attr(n, 'class') || '').split(/\s+/).includes('spec-item') && n.childNodes?.some(c => c.tagName === 'span' && text(c).trim() === 'Installation profile'));
  if (fields.length !== 1) throw Error('Reviewed range installation profile structure requires review');
  const value = fields[0].childNodes.find(n => n.tagName === 'strong');
  if (!value?.sourceCodeLocation?.endTag) throw Error('Reviewed range installation value requires review');
  const current = text(value).replace(/\s+/g, ' ').trim();
  if (current === installationConfirmation) return html;
  // Do not overwrite a later verified installation method or broaden to unreviewed pages.
  if (current !== reviewedText) return html;
  const loc = value.sourceCodeLocation;
  return html.slice(0, loc.startTag.endOffset) + installationConfirmation + html.slice(loc.endTag.startOffset);
}
