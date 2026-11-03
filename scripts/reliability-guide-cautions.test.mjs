import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {parse} from 'parse5';
const root=new URL('../',import.meta.url),review=JSON.parse(fs.readFileSync(new URL('fixtures/reliability-guide-cautions.json',import.meta.url),'utf8'));
const walk=n=>[n,...(n.childNodes||[]).flatMap(walk)],a=(n,k)=>n.attrs?.find(x=>x.name===k)?.value;
for(const row of review){
 test(row.route+' retains exact conservative qualifications, not unsupported assurances',()=>{
  const h=fs.readFileSync(new URL('.'+row.route+'index.html',root),'utf8');
  for(const [old,next]of row.changes){assert(!h.includes(old),'Remove unsupported wording: '+old);assert.equal(h.split(next).length,2,'The reviewed replacement must occur exactly once');}
  if(row.route.includes('hybrid')){assert(h.includes('do not assume that adding underlay establishes compliance'));assert(h.includes('full report for the proposed flooring system'));}
  else{assert(h.includes('Structural movement, active cracking and moisture problems may need separate investigation'));assert(!/services that guarantee resilience/.test(h));}
 });
 test(row.route+' retains its canonical, heading and description contracts',()=>{
  const ns=walk(parse(fs.readFileSync(new URL('.'+row.route+'index.html',root),'utf8')));
  assert.equal(ns.filter(n=>n.tagName==='h1').length,1);assert.equal(ns.filter(n=>n.tagName==='title').length,1);
  const canonical=ns.filter(n=>n.tagName==='link'&&a(n,'rel')==='canonical');assert.equal(canonical.length,1);assert.equal(a(canonical[0],'href'),'https://oztimberfloor.com.au'+row.route);
  assert.equal(ns.filter(n=>n.tagName==='meta'&&a(n,'name')==='description').length,1);
 });
}
