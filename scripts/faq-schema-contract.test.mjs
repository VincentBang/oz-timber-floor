import fs from 'node:fs';import assert from 'node:assert/strict';import test from 'node:test';import {assertFaqSchema} from './faq-schema-contract.mjs';
test('accessible successor FAQs preserve exact questions and answers, rejecting missing or changed content',()=>{
 for(const[file,count]of [['oak-flooring-sydney/index.html',4],['faqs/index.html',15],['timber-floor-installation/index.html',8]]){
  const html=fs.readFileSync(file,'utf8');assertFaqSchema(html,count);
  for(const bad of [html.replace('<summary>','<summary>Unapproved '),html.replace('</summary>','</summary>Unapproved answer'),html.replace('<details class="faq-item','<details open class="faq-item')])assert.throws(()=>assertFaqSchema(bad,count));
 }
});
