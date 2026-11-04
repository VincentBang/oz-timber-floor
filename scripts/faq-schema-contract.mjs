import assert from 'node:assert/strict';import * as parse5 from 'parse5';
const all=(n,p)=>[...(p(n)?[n]:[]),...(n.childNodes||[]).flatMap(c=>all(c,p))];
const attr=(n,k)=>n.attrs?.find(a=>a.name===k)?.value;
const text=n=>n.nodeName==='#text'?n.value:(n.childNodes||[]).map(text).join(' ');
const norm=s=>text(parse5.parseFragment(String(s))).replace(/\s+/g,' ').trim();
export function assertFaqSchema(html,expected){
 const tree=parse5.parse(html),items=all(tree,n=>['article','div','details'].includes(n.tagName)&&(attr(n,'class')||'').split(/\s+/).includes('faq-item'));
 assert.equal(items.length,expected,'Visible FAQ count');
 const schemas=all(tree,n=>n.tagName==='script'&&attr(n,'type')==='application/ld+json').flatMap(n=>{const j=JSON.parse(text(n));return [j,...(j['@graph']||[])];});
 const faq=schemas.find(j=>j['@type']==='FAQPage');assert(faq);assert.equal(faq.mainEntity.length,expected);
 const questions=new Set();
 for(const item of items){
  const heading=all(item,n=>item.tagName==='details'?n.tagName==='summary':/^h[2-6]$/.test(n.tagName));assert.equal(heading.length,1,'FAQ needs one question');
  if(item.tagName==='details')assert.equal(attr(item,'open'),undefined,'FAQ should begin collapsed');
  const question=norm(text(heading[0]));assert(!questions.has(question),'Duplicate FAQ');questions.add(question);
  const entity=faq.mainEntity.find(q=>norm(q.name)===question);assert(entity,'Visible FAQ question differs from schema');
  const answer=norm(text(item)).slice(question.length).trim();assert.equal(answer,norm(entity.acceptedAnswer.text),'Visible FAQ answer differs from schema');
 }
}
