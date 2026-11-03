import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {parse} from 'parse5';

// Only the range families independently reviewed in checkpoints twelve through seventeen.
export const reviewedRangeFAQRoutes = ['/ranges/avala/', '/ranges/artisan-tile/', '/ranges/etf-9-0mm-hybrid/', '/ranges/wide-plank-water-resistant-laminate/', '/ranges/aquatuff-flooring/', '/ranges/classic-laminate/', '/ranges/etf-1-5-meter-laminate/', '/ranges/etf-12mm-laminate/', '/ranges/etf-72hrs-water-resistant-laminate/', '/ranges/kronoswiss-aquastop/', '/ranges/oakleaf/', '/ranges/prime-contemporary-plus/', '/ranges/etf-10mm-hybrid/', '/ranges/etf-14mm-oak-flooring/', '/ranges/etf-6-5mm-hybrid/', '/ranges/etf-australian-engineered/', '/ranges/oakleaf-laminate/', '/ranges/pantora-amor/', '/ranges/pantora-lifestyle/', '/ranges/prime-deluxe/', '/ranges/etf-15mm-oak-flooring/', '/ranges/etf-7-0mm-hybrid/', '/ranges/etf-8-0mm-hybrid/', '/ranges/etf-9-5mm-hybrid/', '/ranges/etf-hybrid-herringbone/', '/ranges/etf-oak-chevron/', '/ranges/etf-oak-herringbone/', '/ranges/prime-legend/', '/ranges/aspire/', '/ranges/belle-vie/', '/ranges/botanica/', '/ranges/castel-nuovo/'];
const walk=n=>[n,...(n.childNodes||[]).flatMap(walk)];
const attr=(n,k)=>n.attrs?.find(a=>a.name===k)?.value;
const text=n=>n?.nodeName==='#text'?n.value:(n?.childNodes||[]).map(text).join('');
const norm=s=>s.replace(/\s+/g,' ').trim();

export function reconcileReviewedRangeFAQ(html){
 const nodes=walk(parse(html,{sourceCodeLocationInfo:true}));
 const canonical=attr(nodes.find(n=>n.tagName==='link'&&attr(n,'rel')==='canonical')||{},'href');
 if(!reviewedRangeFAQRoutes.some(r=>canonical==='https://oztimberfloor.com.au'+r))return html;
 const faqs=nodes.filter(n=>n.tagName==='details'&&(attr(n,'class')||'').split(/\s+/).includes('faq-item')).map(n=>({q:norm(text(n.childNodes.find(c=>c.tagName==='summary'))),a:norm(text(n.childNodes.find(c=>c.tagName==='div')))}));
 if(!faqs.length||faqs.some(f=>!f.q||!f.a)||new Set(faqs.map(f=>f.q)).size!==faqs.length)throw Error('Reviewed range FAQ structure requires review');
 const edits=[];let schemaCount=0;
 for(const node of nodes.filter(n=>n.tagName==='script'&&attr(n,'type')==='application/ld+json')){
  const original=text(node),json=JSON.parse(original);let changed=false;
  function visit(value){if(!value||typeof value!=='object')return;if(Array.isArray(value)){value.forEach(visit);return;}
   if(value['@type']==='FAQPage'){schemaCount++;if(!Array.isArray(value.mainEntity)||value.mainEntity.length!==faqs.length)throw Error('Reviewed range FAQ count mismatch');const questions=new Set();for(const entity of value.mainEntity){const q=norm(entity.name||''),match=faqs.find(f=>f.q===q);if(!match||questions.has(q)||!entity.acceptedAnswer||typeof entity.acceptedAnswer.text!=='string')throw Error('Reviewed range FAQ identity requires review');questions.add(q);if(norm(entity.acceptedAnswer.text)!==match.a){entity.acceptedAnswer.text=match.a;changed=true;}}}
   for(const [key,child] of Object.entries(value))if(key!=='mainEntity')visit(child);
  }visit(json);
  if(changed){const loc=node.sourceCodeLocation;edits.push({start:loc.startTag.endOffset,end:loc.endTag.startOffset,text:JSON.stringify(json).replace(/</g,'\\u003c')});}
 }
 if(schemaCount!==1)throw Error('Reviewed range must have exactly one FAQPage schema');
 for(const edit of edits.sort((a,b)=>b.start-a.start))html=html.slice(0,edit.start)+edit.text+html.slice(edit.end);
 return html;
}
if(process.argv[1]===fileURLToPath(import.meta.url)){const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),changed=[];for(const route of reviewedRangeFAQRoutes){const file=path.join(root,route,'index.html'),before=fs.readFileSync(file,'utf8'),after=reconcileReviewedRangeFAQ(before);if(before!==after){fs.writeFileSync(file,after);changed.push(route);}}console.log(JSON.stringify({changed}));}
