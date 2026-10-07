// Bounded October repair. Unknown dimensions are not inferred from mixed importer text.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
const root = process.cwd();
const file = path.join(root, 'data/product-catalogue.json');
const data = JSON.parse(fs.readFileSync(file, 'utf8'));
const apply = process.argv.includes('--apply');
const changes = [];
const invalidThickness = value => /^(?:Laminate|Engineered oak|Hybrid|Vinyl|Solid timber|Engineered timber)$/i.test(value) || /Pack|Length|Width|Finish|AC[1-9]|Thickness:|colours/i.test(value);
const invalidInstallation = value => /^s\.|Size & Length|Download (?:Warranty|Brochure)/i.test(value);
assert.ok(invalidThickness('Laminate'));
assert.ok(invalidThickness('2200mm length Pack 2.112m2 /ctn. Finish matte'));
assert.ok(!invalidThickness('14/3 mm'));
assert.ok(!invalidThickness('8 / 12 / 14 mm'));
assert.ok(invalidInstallation('s. Pre-finished, Matte PU Lacquer. Size & Length'));
assert.ok(!invalidInstallation('Floating click system'));
const slug = value => String(value).replace(/^\/?products\//, '').replace(/\/$/, '');
const products = new Map(data.products.map(p => [slug(p.slug), p]));
function change(record, key, after) {
  if (record[key] === after) return;
  changes.push({record: record.slug, field: key, before: record[key] ?? null, after});
  record[key] = after;
}
for (const record of [...data.ranges, ...data.products]) {
  for (const key of ['thickness', 'totalThickness']) {
    if (invalidThickness(String(record[key] || ''))) {
      change(record, key, '');
    }
  }
  if (invalidInstallation(String(record.installationMethod || ''))) {
    change(record, 'installationMethod', '');
  }
}
const aqua = data.ranges.find(r => r.slug === 'kronoswiss-aquastop');
assert.equal(products.get('kronoswiss-aquastop-beach').thickness, '14mm');
change(aqua, 'thickness', '8 / 12 / 14 mm');
change(aqua, 'shortDescription', 'Kronoswiss Aquastop laminate flooring is available in different thicknesses. Confirm the selected colour and thickness before ordering.');
for (const r of data.ranges) {
  if (/is a Laminate laminate|is a Engineered oak|2200mm length.*Pack/.test(r.shortDescription || '')) {
    change(r, 'shortDescription', `${r.name} flooring: compare colours and confirm current product dimensions and installation requirements before ordering.`);
  }
}
const hardwood = data.ranges.find(r => r.slug === 'hardwood-collection');
const published = hardwood.productSlugs.map(slug).filter(s => {
  const p = path.join(root, 'products', s, 'index.html');
  if (!products.has(s) || !fs.existsSync(p)) return false;
  const html = fs.readFileSync(p, 'utf8');
  return !/<meta[^>]*name="robots"[^>]*content="[^"]*noindex/i.test(html) && html.includes(`rel="canonical" href="https://oztimberfloor.com.au/products/${s}/"`);
});
assert.equal(published.length, hardwood.productSlugs.length, 'Range membership must contain only published canonical products');
change(hardwood, 'colourCount', published.length);
const htmlChanges = [];
function cleanRelatedRangeCopy(html) {
  return html.replace(/Wide Plank Water Resistant Laminate is a 2200mm length \(nested shorts\) Pack 2\.112m2 \/ctn\. Finish Pre-finished, matte coat laminate range for customers comparing timber-look flooring for dry internal rooms and renovation budgets\./g, data.ranges.find(r => r.slug === 'wide-plank-water-resistant-laminate').shortDescription)
    .replace(/is a Laminate laminate range/g, 'is a laminate range')
    .replace(/(<span class="pill">Laminate<\/span>)<span class="pill">Laminate<\/span>/g, '$1')
    .replace(/(<span class="pill">Engineered timber<\/span>)<span class="pill">Engineered oak<\/span>/g, '$1');
}
function update(relative, transform) {
  const filename = path.join(root, relative);
  const before = fs.readFileSync(filename, 'utf8');
  const after = transform(before);
  if (after !== before) { htmlChanges.push(relative); if (apply) fs.writeFileSync(filename, after); }
}
// Remove only invalid field values, not material/category labels with identical text.
for (const folder of ['products', 'ranges']) {
  for (const dir of fs.readdirSync(path.join(root, folder), {withFileTypes: true})) {
    if (!dir.isDirectory() || !fs.existsSync(path.join(root, folder, dir.name, 'index.html'))) continue;
    update(`${folder}/${dir.name}/index.html`, html => {
      html = html.replace(/<div class="spec-item"><span>(Thickness|Installation method)<\/span><strong>([^<]*)<\/strong><\/div>/g,
        (whole, label, value) => (label === 'Thickness' ? invalidThickness(value) : invalidInstallation(value.replace(/&amp;/g, '&'))) ? '' : whole);
      html = html.replace(/(<div class="hero-badge"><span>[^<]*<\/span>)<span>([^<]*)<\/span>(?=<span>)/g, (whole, start, value) => invalidThickness(value) ? `${start}<span>Confirm dimensions</span>` : whole);
      html = html.replace(/<span class="pill">([^<]*)<\/span>/g, (whole, value) => /Pack|Finish/i.test(value) ? '' : whole);
      html = html.replace(/is a Laminate laminate range/g, 'is a laminate range').replace(/is a Engineered oak engineered timber range/g, 'is an engineered timber range');
      html = html.replace(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g, (whole, json) => {
        const schema = JSON.parse(json);
        function clean(value) {
          if (Array.isArray(value)) return value.filter(x => !(x?.name === 'Thickness' && invalidThickness(String(x.value || '')))).map(clean);
          if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([k,v]) => [k, clean(v)]));
          return value;
        }
        const cleaned = JSON.stringify(clean(schema));
        return cleaned === JSON.stringify(schema) ? whole : `<script type="application/ld+json">${cleaned}</script>`;
      });
      return cleanRelatedRangeCopy(html);
    });
  }
}
update('ranges/kronoswiss-aquastop/index.html', html => {
  html = html.replace(/<article\b[\s\S]*?<\/article>/g, card => {
    const s = card.match(/href="\/products\/([^/]+)\//)?.[1];
    const p = products.get(s);
    if (!p) return card;
    return card.replace(/(<p class="product-meta"><span class="pill">Laminate<\/span>)<span class="pill">[^<]*<\/span>/, `$1<span class="pill">${p.thickness || 'Confirm thickness'}</span>`);
  });
  return html.replace(/8 \/ 12 \/ 14 mm \(varies by colour\)/g, aqua.thickness).replace(/<span>8mm<\/span>/g, `<span>${aqua.thickness}</span>`).replace(/(<span>Thickness<\/span><strong>)8mm/, `$1${aqua.thickness}`);
});
update('ranges/index.html', html => cleanRelatedRangeCopy(html.replace(/<a[^>]*id="range-hardwood-collection"[\s\S]*?<\/a>/, card => card.replace(/\d+ colours/g, `${published.length} colours`))));
if (apply) fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n');
console.log(JSON.stringify({mode: apply ? 'apply' : 'check', changes, htmlChanges}, null, 2));
if (!apply && (changes.length || htmlChanges.length)) process.exitCode = 1;
