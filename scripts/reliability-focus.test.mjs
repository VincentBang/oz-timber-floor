import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const root=new URL('../',import.meta.url);

test('FAQ keyboard focus is not clipped or drawn over question text, without changing layout',()=>{
 const css=fs.readFileSync(new URL('assets/editorial-gallery.css',root),'utf8');
 const base=fs.readFileSync(new URL('assets/site.css',root),'utf8');
 assert.match(base,/\.faq-item\s*\{\s*overflow:\s*hidden/);
 const rule=css.match(/body\.editorial\s+\.faq-item\s*>\s*summary:focus-visible\s*\{([^}]+)\}/);
 assert(rule,'The FAQ needs a scoped keyboard-focus override');
 assert.equal(rule[1].trim(),'outline-offset:4px','Keep the outline outside the question text; preserve dimensions, colours and typography');
 const card=css.match(/body\.editorial\s+\.faq-item:focus-within\s*\{([^}]+)\}/);
 assert(card,'The focused card must not clip its child focus outline');
 assert.equal(card[1].trim(),'overflow:visible','Only focus-time painting may change, not spacing or dimensions');
 assert.match(css,/summary\):focus-visible\{outline:3px solid #80501f;outline-offset:4px\}/,'Keep the existing visible focus colour/width for all controls');
});
