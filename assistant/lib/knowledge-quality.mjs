import {excludedNode} from './source-policy.mjs';
export function visibleKnowledgeText(node){
 if(excludedNode(node))return '';
 return (node.nodeName==='#text'?node.value:(node.childNodes||[]).filter(child=>child.tagName!=='summary').map(visibleKnowledgeText).join(' ')).replace(/\s+/g,' ').trim();
}
// Conservative exclusion rules: removal from assistant evidence is not a change
// to website content, a supplier decision, or proof that a claim is false.
export function knowledgeTextIssue(value){
 if(/<\/?[a-z][^>]*>|&lt;\/?[a-z]|\[(?:\/?caption|gallery|embed|vc_|wp:)|<!--/i.test(value))return 'embedded_markup_not_answer_text';
 if(/most experienced|\bpremier\b|\bnumber.one\b|assured longevity|will not have any hazards|\bfree[ ,]+(?:no.obligation|estimate|quote)|eco.friendly|sustainab|hypoallergenic|non.toxic|antibacterial/i.test(value))return 'unreviewed_marketing_or_performance_claim';
 if(/^best suited to\s*:/i.test(value))return 'material_context_missing';
 return null;
}
