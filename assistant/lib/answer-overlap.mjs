// Only this reviewed overlap is equivalent. Do not use loose similarity to
// collapse unrelated safety, supplier, availability or technical statements.
const agency='Can you collect keys from our agency and coordinate with the tenant? Yes, tenant appointments and agency key collection and return can be arranged. Tell us who should coordinate access. Please share detailed access instructions through the agreed contact process rather than in the initial website enquiry.';
const insurance='Can you coordinate access with a tenant or property manager? Yes. Tenant appointments and agency key coordination can be arranged. Tell us who should manage access and agree the details before attendance.';
const entries=new Map([
 ['/property-manager-flooring/\n'+agency,{key:'agency-access',priority:2}],
 ['/insurance-flooring-repairs/\n'+insurance,{key:'agency-access',priority:1}],
]);
export function reviewedAnswerOverlap(fact){return fact.field==='faq'?entries.get(fact.canonicalPath+'\n'+fact.value):undefined;}
export function preferCompleteAnswers(facts,{comparison=false}={}){
 if(comparison)return facts;
 return facts.filter(f=>{const overlap=reviewedAnswerOverlap(f);return !overlap||!facts.some(other=>{const o=reviewedAnswerOverlap(other);return o?.key===overlap.key&&o.priority>overlap.priority;});});
}
export function repeatsReviewedAnswer(current,previous){
 for(const [entry,group]of entries){const value=entry.slice(entry.indexOf('\n')+1);if(!current.includes(value))continue;for(const [other,candidate]of entries){const prior=other.slice(other.indexOf('\n')+1);if(candidate.key===group.key&&candidate.priority>=group.priority&&previous.includes(prior))return true;}}
 return false;
}
