// Restore owned WordPress copy, retaining the current guide chrome. Not an importer.
import fs from 'node:fs';
import crypto from 'node:crypto';
const source = process.argv[2];
if (!source) throw new Error('Pass the preserved WordPress post snapshot directory');
const routes = JSON.parse(fs.readFileSync('config/october-article-routes.json'));
const template = fs.readFileSync('guides/hire-over-diy/index.html', 'utf8');
const headChrome = template.match(/<header[\s\S]*?<\/header>/)[0];
const footer = template.match(/<footer[\s\S]*?<\/footer>/)[0];
const esc = s => s.replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
let redirects = fs.readFileSync('_redirects', 'utf8');
let sitemap = fs.readFileSync('sitemap.xml', 'utf8');
const evidence = [];
for (const [slug, target] of Object.entries(routes)) {
  const bytes = fs.readFileSync(`${source}/${slug}.json`);
  const [post] = JSON.parse(bytes);
  if (!post || post.slug !== slug || post.status !== 'publish') throw new Error(`Unexpected snapshot: ${slug}`);
  evidence.push({route:`/${slug}/`, source:post.link, postId:post.id, sha256:crypto.createHash('sha256').update(bytes).digest('hex'), action: target ? '301-equivalent-guide' : 'restore-owned-article', target:target || `/${slug}/`});
  if (target) {
    const line = `/${slug}/ ${target} 301`;
    if (!redirects.includes(line)) redirects = redirects.replace('/* /404.html 404', `${line}\n/* /404.html 404`);
    continue;
  }
  // Keep the restored article informational; the established service page owns
  // the exact commercial "Timber flooring installation Sydney" phrase.
  const title = slug === 'timber-flooring-installation-common-mistakes-and-solutions'
    ? 'Timber Flooring Installation: Common Mistakes and How to Avoid Them'
    : post.title.rendered.replace(/&#8211;/g, '–').replace(/&#038;/g, '&');
  let body = post.content.rendered.replace(/\[\/?et_pb_[^\]]*\]/g, '').trim();
  if (/<script|<iframe|<form|on\w+\s*=/i.test(body)) throw new Error(`Unexpected active markup: ${slug}`);
  body = body.replace(/https:\/\/oztimberfloor.com.au\/contact-us\//g, '/contact/').replace(/https:\/\/oztimberfloor.com.au(?=\/)/g, '');
  const intro = body.match(/<p[^>]*>([\s\S]*?)<\/p>/)?.[1].replace(/<[^>]*>/g,'').replace(/\s+/g,' ').trim() || title;
  const description = intro.length > 157 ? intro.slice(0,154).replace(/\s+\S*$/, '') + '…' : intro;
  const canonical = `https://oztimberfloor.com.au/${slug}/`;
  const schema = {'@context':'https://schema.org','@type':'Article',headline:title,mainEntityOfPage:canonical,datePublished:post.date_gmt+'Z',author:{'@type':'Organization',name:'Oz Timber Floor'}};
  const html = `<!DOCTYPE html><html lang="en-AU"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>${esc(title)} | Oz Timber Floor</title><meta name="description" content="${esc(description)}"><link rel="canonical" href="${canonical}"><meta name="robots" content="index,follow"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(description)}"><meta property="og:url" content="${canonical}"><meta property="og:type" content="article"><link rel="icon" href="/assets/brand/favicon-32.png"><link rel="stylesheet" href="/assets/site.css"><script src="/assets/contact-config.js" defer></script><script src="/assets/site.js" defer></script><script type="application/ld+json">${JSON.stringify(schema)}</script></head><body>${headChrome}<main><section class="hero"><div class="shell"><p class="eyebrow">Flooring guide</p><h1>${esc(title)}</h1><div class="button-row"><a class="button" href="/contact/?enquiry=product&amp;source=guide">Ask Oz Timber Floor</a><a class="button-secondary" href="/guides/">More guides</a></div></div></section><section class="section"><div class="shell text-block">${body}</div></section></main>${footer}</body></html>\n`;
  fs.mkdirSync(slug,{recursive:true});
  fs.writeFileSync(`${slug}/index.html`,html);
  if (!sitemap.includes(`<loc>${canonical}</loc>`)) sitemap = sitemap.replace('</urlset>',`  <url><loc>${canonical}</loc></url>\n</urlset>`);
}
fs.writeFileSync('_redirects', redirects);
fs.writeFileSync('sitemap.xml', sitemap);
console.log(JSON.stringify(evidence,null,2));
