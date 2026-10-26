// Bounded owner corrections. Emits an apply_patch patch; never writes source files.
import fs from 'node:fs';
import assert from 'node:assert/strict';
const read = f => fs.readFileSync(f, 'utf8');
const catalogueFile = 'data/product-catalogue.json';
const overridesFile = 'data/catalogue-quality-overrides.json';
const catalogue = JSON.parse(read(catalogueFile));
const overrides = JSON.parse(read(overridesFile));
const retired = ['kronoswiss-aquastop-natural-oak-brown-8mm', 'kronoswiss-aquastop-natural-oak-brown', 'kronoswiss-aquastop-interlaken', 'stone-floor-oak-beige'];
const active = ['etf-hybrid-spc-9mm-helena-oak'];
const updates = new Map();
const date = '2026-10-08';
for (const id of [...retired, ...active]) {
  const p = catalogue.products.find(p => p.id === id);
  const route = `/products/${id}/`;
  const control = overrides.pages[route];
  assert.ok(p && control, id);
  assert.equal(control.applyNoindex, true, 'Preserve existing noindex hold');
  const isRetired = retired.includes(id);
  p.lastCatalogueReview = date;
  p.catalogueNote = isRetired
    ? id === 'stone-floor-oak-beige'
      ? 'Owner confirmed Oak Beige discontinued on 2026-10-08 after it was absent from the current StoneFloor supplier listing. Retain the existing general Stone Floor redirect as alternatives, not an exact replacement.'
      : 'Owner confirmed this Kronoswiss Aquastop colour discontinued on 2026-10-08. Retain existing range redirect as alternatives, not an exact replacement.'
    : id === active[0]
      ? 'Owner confirmed Helena Oak belongs to ETF 9mm Hybrid on 2026-10-08. Exact colour image and remaining specifications are unverified; do not substitute Alaskan Oak.'
      : 'Owner explicitly retained Oak Beige as a Stone Floor colour on 2026-10-08, superseding the withdrawn discontinuation instruction. Material/design, exact image and dimensions remain unverified.';
  // The later supplier match records Oak Beige's general-range routing decision.
  control.reason = p.catalogueNote;
  if (isRetired) {
    p.publicCatalogueStatus = 'retired';
    p.stockStatusLabel = 'Discontinued';
    p.retirementDate = date;
    p.retirementBasis = 'Owner-confirmed discontinued colour; existing range destination offers alternatives only';
    p.shortDescription = id === 'stone-floor-oak-beige'
      ? 'Stone Floor Oak Beige has been discontinued. Browse current Stone Floor alternatives or contact us for assistance.'
      : `${p.name} has been discontinued. Browse current Kronoswiss Aquastop alternatives or contact us for assistance.`;
  } else {
    p.stockStatusLabel = 'Confirm current availability';
    p.shortDescription = id === active[0]
      ? 'Helena Oak is a colour in the ETF 9mm Hybrid range. Ask us to confirm current availability, colour samples and product details before ordering.'
      : 'Oak Beige is a colour in the Stone Floor range. Ask us to confirm current availability, colour samples and product details before ordering.';
    p.colour = id === active[0] ? 'Helena Oak' : 'Oak Beige';
    p.imageGallery = [];
    p.primaryImage = '';
    p.altText = '';
    p.galleryStatus = 'needs-verified-colour-image';
    p.suitableUse = '';
    p.installationMethod = '';
  }
  const file = route.slice(1) + 'index.html';
  let html = read(file);
  // These pages remain excluded from indexation; do not publish placeholder Product schema.
  assert.match(html, /noindex/);
  html = html.replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/g, block => /"@type"\s*:\s*"Product"/.test(block) ? '' : block);
  if (isRetired) {
    html = html.replace(/<title>[\s\S]*?<\/title>/, `<title>${p.name} discontinued | Oz Timber Floor</title>`)
      .replace(/<meta\b[^>]*name="description"[^>]*>/, `<meta name="description" content="${p.shortDescription}">`)
      .replace(/<main\b[^>]*>[\s\S]*?<\/main>/, `<main id="main-content"><section class="section"><div class="shell"><p class="eyebrow">Discontinued colour</p><h1>${p.name} discontinued</h1><p>This colour has been discontinued and is no longer offered as an available colour.</p><p>Current ${id === 'stone-floor-oak-beige' ? 'Stone Floor' : 'Kronoswiss Aquastop'} colours are alternatives, not an exact replacement.</p><div class="button-row"><a class="button" href="${id === 'stone-floor-oak-beige' ? '/ranges/stone-floor/' : '/ranges/kronoswiss-aquastop/'}">Browse current colours</a><a class="button-secondary" href="/contact/">Contact us</a></div></div></section></main>`);
  } else {
    html = html.replace(/<p class="lead">[\s\S]*?<\/p>/, `<p class="lead">${p.shortDescription}</p>`)
      .replace(/<meta\b[^>]*name="description"[^>]*>/, `<meta name="description" content="${p.shortDescription}">`)
      .replace(/<div class="catalogue-gallery">[\s\S]*?<\/figure><\/div>/, '<div class="catalogue-gallery"><p>Contact us for a current colour sample and product details before ordering.</p></div>')
      .replaceAll('Homes, apartments, rentals and selected light commercial interiors', 'Confirm suitability for your project before ordering')
      .replaceAll('Floating click installation; confirm range-specific subfloor requirements', 'Confirm the installation requirements before ordering');
    if (id === active[0]) html = html.replaceAll('>9mm Helena Oak<', '>Helena Oak<').replaceAll('href="/ranges/etf-hybrid-spc-9mm/"', 'href="/ranges/etf-9-0mm-hybrid/"');
  }
  updates.set(file, html);
}
updates.set(catalogueFile, JSON.stringify(catalogue, null, 2) + '\n');
updates.set(overridesFile, JSON.stringify(overrides, null, 2) + '\n');
const changed = [...updates].filter(([file, content]) => read(file) !== content);
if (process.argv.includes('--patch')) {
  let patch = '*** Begin Patch\n';
  for (const [file, content] of changed) {
    if (file === catalogueFile || file === overridesFile) {
      const old = JSON.parse(read(file)), next = JSON.parse(content);
      const pairs = file === catalogueFile
        ? next.products.filter(p => [...retired, ...active].includes(p.id)).map(p => [old.products.find(o => o.id === p.id), p])
        : Object.entries(next.pages).map(([key,p]) => [{[key]:old.pages[key]}, {[key]:p}]);
      patch += `*** Update File: ${file}\n`;
      for (const [oldRecord,newRecord] of pairs) {
        if (JSON.stringify(oldRecord) === JSON.stringify(newRecord)) continue;
        const lines = obj => file === catalogueFile
          ? JSON.stringify(obj,null,2).split('\n').map(l=>'    '+l)
          : JSON.stringify(obj,null,2).split('\n').slice(1,-1).map(l=>'  '+l);
        const withComma = obj => {const a=lines(obj); a[a.length-1]+=','; return a;};
        patch += '@@\n'+withComma(oldRecord).map(l=>'-'+l+'\n').join('')+withComma(newRecord).map(l=>'+'+l+'\n').join('');
      }
      continue;
    }
    // Emit only differing line intervals, preserving unrelated inherited edits.
    const before = read(file).trimEnd().split('\n'), after = content.trimEnd().split('\n');
    let a = 0, b = before.length, c = after.length;
    while (a < b && a < c && before[a] === after[a]) a++;
    while (b > a && c > a && before[b-1] === after[c-1]) { b--; c--; }
    patch += `*** Update File: ${file}\n`;
    while (a < b || a < c) {
      let bi = b, ci = c;
      outer: for (let distance = 1; distance < 100; distance++) {
        for (let i = 0; i <= distance; i++) {
          const j = distance - i;
          if (a+i+3 < b && a+j+3 < c && before.slice(a+i,a+i+4).join('\n') === after.slice(a+j,a+j+4).join('\n')) { bi=a+i; ci=a+j; break outer; }
        }
      }
      patch += '@@\n' + before.slice(a,bi).map(l=>'-'+l+'\n').join('') + after.slice(a,ci).map(l=>'+'+l+'\n').join('');
      if (bi === b && ci === c) break;
      // Include a stable anchor then process the remaining suffix independently.
      patch += ' '+before[bi]+'\n';
      before.splice(0,bi+1); after.splice(0,ci+1); b=before.length; c=after.length; a=0;
      while(a<b && a<c && before[a]===after[a]) a++;
      while(b>a && c>a && before[b-1]===after[c-1]) {b--;c--;}
    }
  }
  console.log(patch + '*** End Patch');
} else {
  assert.equal(changed.length, 0, `Corrections not applied: ${changed.map(([f])=>f).join(', ')}`);
  console.log('PASS: five records representing four colours; owner corrections and noindex holds preserved.');
}
