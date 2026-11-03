import test from'node:test';import assert from'node:assert/strict';import fs from'node:fs';import{editorialHTML,HOME_COMPACT_THUMBNAILS}from'./editorial-gallery.mjs';
test('home compact thumbnail repair is route-scoped and idempotent',()=>{
 const home=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');assert.equal(home.split(HOME_COMPACT_THUMBNAILS).length,2);
 const before=home.replace(HOME_COMPACT_THUMBNAILS,'');const generated=editorialHTML(before);assert(generated.includes(HOME_COMPACT_THUMBNAILS));assert.equal(editorialHTML(generated),generated);
 assert.equal(generated.replace(HOME_COMPACT_THUMBNAILS,''),editorialHTML(before).replace(HOME_COMPACT_THUMBNAILS,''));
 for(const file of['contact.html','ranges/avala/index.html']){const html=fs.readFileSync(new URL('../'+file,import.meta.url),'utf8');assert(!editorialHTML(html).includes(HOME_COMPACT_THUMBNAILS));}
 assert.match(HOME_COMPACT_THUMBNAILS,/@media\(max-width:760px\)/);assert.match(HOME_COMPACT_THUMBNAILS,/height:96px;min-height:0;align-self:start/);assert(!HOME_COMPACT_THUMBNAILS.includes('!important'));
});
