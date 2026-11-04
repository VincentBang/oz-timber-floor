import fs from 'node:fs';import assert from 'node:assert/strict';import test from 'node:test';import {assertFaqSchema} from './faq-schema-contract.mjs';
test('accessible successor FAQs preserve exact questions and answers, rejecting missing or changed content',()=>{
 for(const[file,count]of [['oak-flooring-sydney/index.html',4],['faqs/index.html',15],['timber-floor-installation/index.html',8]]){
  const html=fs.readFileSync(file,'utf8');assertFaqSchema(html,count);
  const prefix=html.match(/<details\b[^>]*class="[^"]*\bfaq-item\b[^"]*"[^>]*>[\s\S]*?<summary\b[^>]*>/)?.[0];assert(prefix,'Fault injection must target an actual FAQ, not the navigation summary');
  const bads=[html.replace(prefix,prefix+'Unapproved '),html.slice(0,html.indexOf('</summary>',html.indexOf(prefix))+10)+'Unapproved answer'+html.slice(html.indexOf('</summary>',html.indexOf(prefix))+10),html.replace(prefix,prefix.replace('<details','<details open'))];
  for(const bad of bads){assert.notEqual(bad,html,'Fault injection must mutate the fixture');assert.throws(()=>assertFaqSchema(bad,count));}
 }
});
