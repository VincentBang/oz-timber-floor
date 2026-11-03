import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import test from 'node:test';
const root=path.resolve(import.meta.dirname,'..');
test('natural-height material disclosure is restricted to the ranges hub',()=>{
 const matches=[];
 function scan(d){for(const e of fs.readdirSync(d,{withFileTypes:true})){if(['.git','node_modules','docs','dist','assets'].includes(e.name))continue;const p=path.join(d,e.name);if(e.isDirectory())scan(p);else if(e.name.endsWith('.html')){const h=fs.readFileSync(p,'utf8');if(h.includes('data-editorial-family="discovery"')&&h.includes('id="range-library"')&&h.includes('editorial-material-image'))matches.push(path.relative(root,p));}}}
 scan(root);assert.deepEqual(matches,['ranges/index.html']);
});
test('hub correction changes only layout and keeps all range facts',()=>{
 const css=fs.readFileSync(path.join(root,'assets/editorial-gallery.css'),'utf8'),rule='body.editorial[data-editorial-family="discovery"]:has(main #range-library) .editorial-material-image .hero-media{display:block;aspect-ratio:auto}';
 assert.equal(css.split(rule).length-1,1);assert(!/font|filter|color|display:none/.test(rule));
 const html=fs.readFileSync(path.join(root,'ranges/index.html'),'utf8');for(const fact of ['85 ranges','Catalogue enquiry','Sydney'])assert(html.includes(fact));
});
