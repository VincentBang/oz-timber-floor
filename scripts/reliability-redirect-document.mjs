import {parse} from 'parse5';

// Redirect stubs are not content owners. Never apply page-section repairs to them.
export function isRedirectDocument(html) {
  const walk = n => [n, ...(n.childNodes || []).flatMap(walk)];
  const nodes = walk(parse(html));
  const attr = (n, key) => n.attrs?.find(a => a.name === key)?.value || '';
  const canonical = attr(nodes.find(n => n.tagName === 'link' && attr(n, 'rel') === 'canonical') || {}, 'href');
  if (!canonical.startsWith('https://oztimberfloor.com.au/')) return false;
  const noindex = nodes.some(n => n.tagName === 'meta' && attr(n, 'name').toLowerCase() === 'robots' && /(?:^|,)\s*noindex\s*(?:,|$)/i.test(attr(n, 'content')));
  const refresh = nodes.some(n => n.tagName === 'meta' && attr(n, 'http-equiv').toLowerCase() === 'refresh' && attr(n, 'content') === '0; url=' + canonical);
  const destination = nodes.some(n => n.tagName === 'a' && attr(n, 'href') === canonical);
  const content = nodes.some(n => n.tagName === 'main' || n.tagName === 'h1' || attr(n, 'type') === 'application/ld+json' || attr(n, 'class').split(/\s+/).includes('faq-item'));
  return noindex && refresh && destination && !content;
}
