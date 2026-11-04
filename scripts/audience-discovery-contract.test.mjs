import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {preAudienceHTML} from './audience-discovery-contract.mjs';
const root=process.cwd();
for(const file of ['services.html','services/index.html','builder-flooring-contractor-sydney.html','builder-flooring-contractor-sydney/index.html','commercial-flooring.html','commercial-flooring/index.html','commercial-flooring-sydney.html','commercial-flooring-sydney/index.html']){
 test(file+' reverses only the exact reviewed discovery block',()=>{
  const html=fs.readFileSync(file,'utf8'),block=html.match(/<!-- audience-([\w-]+) -->[\s\S]*?<!-- \/audience-\1 -->/)[0];
  assert.equal(preAudienceHTML(html,file,root),html.replace(block,''));
  assert.throws(()=>preAudienceHTML(html.replace(block,block.replace('href="/','href="/unapproved/')),file,root));
  assert.throws(()=>preAudienceHTML(html.replace(block,block+block),file,root));
  assert.throws(()=>preAudienceHTML(html,'unreviewed/index.html',root));
  assert(preAudienceHTML(html+'<a href="/unrelated-change/">Changed</a>',file,root).includes('/unrelated-change/'),'Unrelated changes must remain visible to the historical contract');
 });
}
