import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {parse} from 'parse5';
const route='/guides/solid-timber-flooring-vs-engineered-flooring-which-one-is-right-for-you/';
const html=()=>fs.readFileSync(new URL('..'+route+'index.html',import.meta.url),'utf8');
const walk=n=>[n,...(n.childNodes||[]).flatMap(walk)],a=(n,k)=>n.attrs?.find(x=>x.name===k)?.value;
test('comparison guide does not imply automatic wet-area or below-grade suitability',()=>{
 const h=html();
 assert(!h.includes('such as basements, bathrooms, or kitchens, engineered timber flooring stands out with its stability'));
 assert(!h.includes('especially over concrete subfloors or in below-grade environments'));
 assert(h.includes('Do not assume engineered timber is suitable for bathrooms, other wet areas or below-grade spaces. Confirm the exact product instructions and site conditions before choosing a floor.'));
 assert(h.includes('Installation requirements depend on the exact product and subfloor. Confirm moisture conditions, preparation and the permitted installation method before ordering.'));
});
test('comparison guide retains its canonical identity and single heading contract',()=>{
 const ns=walk(parse(html()));
 assert.equal(ns.filter(n=>n.tagName==='title').length,1);assert.equal(ns.filter(n=>n.tagName==='h1').length,1);
 const canon=ns.filter(n=>n.tagName==='link'&&a(n,'rel')==='canonical');assert.equal(canon.length,1);assert.equal(a(canon[0],'href'),'https://oztimberfloor.com.au'+route);
 assert.equal(ns.filter(n=>n.tagName==='meta'&&a(n,'name')==='description').length,1);
});
