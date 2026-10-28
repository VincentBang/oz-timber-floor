import {excludedNode} from './source-policy.mjs';
const classes=n=>(n.attrs?.find(a=>a.name==='class')?.value||'').split(/\s+/);
const attr=(n,k)=>n.attrs?.find(a=>a.name===k)?.value||'';
export const isFaqItem=n=>classes(n).includes('faq-item');
export const isFaqSection=n=>isFaqItem(n)||/^faqs?$/i.test(attr(n,'id'))||classes(n).some(c=>['faq-list','faq-section'].includes(c));
// Traverse only visible, permitted nodes. A closed native details element is
// still legitimate source evidence, but hidden/script/template children are not.
const visible=(node,match)=>excludedNode(node)?[]:[...(match(node)?[node]:[]),...(node.childNodes||[]).flatMap(n=>visible(n,match))];
const clean=node=>excludedNode(node)?null:{nodeName:node.nodeName,tagName:node.tagName,value:node.value,attrs:node.attrs,childNodes:(node.childNodes||[]).map(clean).filter(Boolean)};
export function extractFaqPairs(main,text){
 return visible(main,isFaqItem).flatMap(node=>{
  const questionNode=visible(node,n=>['summary','button','h3'].includes(n.tagName))[0];
  const question=questionNode?text(clean(questionNode)):'';
  const answer=visible(node,n=>n.tagName==='p').map(n=>text(clean(n))).filter(Boolean).join(' ');
  return question&&answer?[{question,answer,value:question+' '+answer}]:[];
 });
}
