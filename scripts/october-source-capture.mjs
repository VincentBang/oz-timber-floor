import fs from 'node:fs';
import crypto from 'node:crypto';
const out = 'docs/migration-october-2026/source';
fs.mkdirSync(out, {recursive:true});
const manifest=[];
for (const file of ['sitemap_index.xml','post-sitemap.xml','page-sitemap.xml','product-sitemap.xml','product_cat-sitemap.xml','googlea11728cf4d174049.html']) {
  const url='https://oztimberfloor.com.au/'+file;
  const response=await fetch(url, {signal:AbortSignal.timeout(30000)});
  if (!response.ok) throw new Error(`${url}: ${response.status}`);
  const bytes=Buffer.from(await response.arrayBuffer());
  fs.writeFileSync(`${out}/${file}`,bytes);
  manifest.push({url,status:response.status,sha256:crypto.createHash('sha256').update(bytes).digest('hex'),capturedAt:new Date().toISOString()});
}
fs.writeFileSync(`${out}/manifest.json`,JSON.stringify(manifest,null,2)+'\n');
console.log(manifest);
