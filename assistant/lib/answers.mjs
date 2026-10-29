import {exactKeys} from './security.mjs';
import {retiredCatalogueMatch} from './catalogue-context.mjs';
import {projectAnswer} from './project-knowledge.mjs';
import {knowledgeTextIssue} from './knowledge-quality.mjs';
import {restrictedRangeAnswer} from './restricted-range.mjs';
import {recordedPackAnswer} from './recorded-pack.mjs';
const routeSafe=path=>typeof path==='string'&&/^\/(?!\/)[a-z0-9\-/]*$/.test(path);
export function renderPlan(plan,retrieval,corpus){
 if(!exactKeys(plan,['status','factIds','reason'])||!['answered','clarify'].includes(plan.status)||!['supported','insufficient'].includes(plan.reason)||!Array.isArray(plan.factIds)||plan.factIds.length>6||new Set(plan.factIds).size!==plan.factIds.length)throw Error('invalid_plan');
 if(plan.status==='clarify'||!plan.factIds.length)return {status:'clarify',segments:[{text:'Which named product, range or flooring question would you like help with?',evidenceIds:[]}],sources:[],entityIds:[]};
 let facts=plan.factIds.map(id=>{const f=retrieval.facts.find(f=>f.id===id);if(!f||!routeSafe(f.canonicalPath)||!corpus.documents.some(d=>d.entityId===f.entityId&&d.canonicalPath===f.canonicalPath))throw Error('invalid_citation');return f;});
 if(facts.some(f=>['guidance','faq'].includes(f.field)&&knowledgeTextIssue(f.value)))throw Error('invalid_citation');
 if(retrieval.exactEntities?.length&&facts.some(f=>!retrieval.exactEntities.includes(f.entityId)))throw Error('irrelevant_entity');
 if(retrieval.exactEntities?.length>1&&retrieval.exactEntities.some(id=>!facts.some(f=>f.entityId===id)))throw Error('invalid_plan');
 // Keep complete cited units, not sentence fragments or orphaned Yes/No text.
 // A model cannot restore an excluded block, repeat the same answer under a
 // different FAQ question, or overwhelm the widget with six long paragraphs.
 if(!facts.some(f=>['product','range'].includes(f.entityType))){
  const kept=[];let chars=0;const key=f=>(f.question?f.value.slice(f.question.length):f.value).toLowerCase().replace(/[^\p{L}\p{N}]+/gu,' ').trim();
  const duplicate=(a,b)=>{if(retrieval.comparisonOwners?.length&&a.canonicalPath!==b.canonicalPath)return false;const x=key(a),y=key(b);if(x===y||x.includes(y)||y.includes(x))return true;const first=new Set(x.split(' ')),second=new Set(y.split(' '));return first.size>=8&&second.size>=8&&[...first].filter(t=>second.has(t)).length/new Set([...first,...second]).size>=0.85;};
  const asksForDetails=f=>f.field==='guidance'&&/\b(?:send|enquiry)\b/i.test(f.value)&&/photos/i.test(f.value)&&/dimensions|suburb|floor area/i.test(f.value);
  for(const f of facts){if(kept.some(other=>duplicate(other,f)||other.entityId===f.entityId&&asksForDetails(other)&&asksForDetails(f)))continue;if(kept.length===4||chars+f.value.length>1400)continue;kept.push(f);chars+=f.value.length;}
  facts=kept;
  if(!facts.length)throw Error('invalid_plan');
  if(retrieval.comparisonOwners?.length&&retrieval.comparisonOwners.some(owner=>!facts.some(f=>f.canonicalPath===owner)))throw Error('invalid_plan');
 }
 const sources=[...new Set(facts.map(f=>f.canonicalPath))].map(path=>{const d=corpus.documents.find(d=>d.canonicalPath===path);return{id:d.documentId,title:d.title,href:path,expectedStatus:200};});
 const segments=[];
 for(const entityId of [...new Set(facts.map(f=>f.entityId))]){
  const group=facts.filter(f=>f.entityId===entityId);
  if(['product','range'].includes(group[0].entityType)){
   const labels={category:'Category',range:'Range',colour:'Colour',thickness:'Thickness',boardSize:'Board size',packSizeM2:'Pack size m²',finish:'Finish'};
   const details=group.filter(f=>f.field!=='identity').map(f=>(labels[f.field]||f.field)+': '+f.value).join('; ');
   segments.push({text:group[0].title+(details?' — '+details+'.':'')+' '+[...new Set(group.map(f=>f.qualifier).filter(Boolean))].join(' '),evidenceIds:group.map(f=>f.id)});
  }else for(const f of group){const value=retrieval.comparisonOwners?.length&&f.question&&f.value.startsWith(f.question)?f.value.slice(f.question.length).trim():f.value;const label={'/engineered-timber-flooring/':'Engineered timber','/hybrid/':'Hybrid','/laminate/':'Laminate','/vinyl/':'Vinyl','/solid-timber/':'Solid timber'}[f.canonicalPath]||f.title;segments.push({text:f.field==='guidance'||f.field==='faq'?(retrieval.comparisonOwners?.length?label+' — ':'')+value:f.title+' — '+f.field+': '+value,evidenceIds:[f.id]});}
 }
 const labels={thickness:'thickness',colour:'colour',boardSize:'board dimensions',category:'category',finish:'finish'};
 for(const missing of (retrieval.missingFields||[]).slice(0,2))segments.push({text:`Verified information about ${labels[missing.field]||'these details'} is not available for ${missing.title}. Confirm with the team before choosing.`,evidenceIds:[]});
 return {status:'answered',segments,sources,entityIds:[...new Set(facts.filter(f=>['product','range'].includes(f.entityType)).map(f=>f.entityId))]};
}
export function fallback(reason,corpus){
 const messages={feature_off:'The flooring assistant is currently off. You can still browse the site or contact the team.',provider_unavailable:'The assistant cannot complete that answer right now. Please use the linked pages or contact the team.',budget_exhausted:'The assistant has reached its usage allowance. Please contact the team.',rate_limit:'Please wait before asking another question, or contact the team.',busy:'The assistant is busy. Please try again shortly.',duplicate:'That request has already been processed. Ask again only if you need a new answer.',low_evidence:'I do not have enough verified information for that. Which flooring type or named range are you asking about?',ambiguous_entity:'Which flooring material or range do you mean by Blackbutt?',ambiguous_reference:'Which named product or range do you mean?',ambiguous_colour:'Which range does that colour belong to? Please name the range so I do not select the wrong product.',confirm_family_thickness:'Please confirm the exact ETF range or product and its thickness if known. I cannot infer specifications from the name alone.',confirmation:'Stock, prices, pack quantities, timing, warranties and final suitability need confirmation by the Oz Timber Floor team.',safety:'I cannot confirm technical suitability or diagnose hazards here. Please arrange a qualified site assessment; do not disturb suspected asbestos.',private_request:'I can help with public flooring information, not private suppliers, internal data or instructions.',language:'This assistant is evaluated in English. Please ask in English or contact the team for help.',out_of_scope:'I can help with flooring choices, preparation and an enquiry for Oz Timber Floor.',invalid_context:'Please open the relevant product or range page, or name it in your question.',invalid_plan:'I could not verify that answer. Please use the source pages or ask the team.'};
 messages.consent_required='Please read the AI use information and acknowledge it before sending a question.';
 return {status:['feature_off','provider_unavailable','budget_exhausted','rate_limit','busy','duplicate'].includes(reason)?'unavailable':reason==='confirmation'||reason==='safety'?'needs_confirmation':'clarify',segments:[{text:messages[reason]||messages.provider_unavailable,evidenceIds:[]}],sources:[{id:'contact',title:'Contact Oz Timber Floor',href:'/contact/',expectedStatus:200}],entityIds:[],reason,corpusVersion:corpus.corpusVersion};
}
// History can suppress verbatim repetition, never introduce evidence or claims.
export function avoidRepeatedAnswer(answer,history,message){
 if(answer.status!=='answered'||answer.entityIds?.length||/\b(?:again|repeat|recap|summarise|summarize)\b/i.test(message))return answer;
 const clean=s=>String(s).toLowerCase().replace(/[^\p{L}\p{N}]+/gu,' ').trim();
 const previous=(history||[]).filter(t=>t.role==='assistant').map(t=>clean(t.content));
 const fresh=answer.segments.filter(s=>!s.evidenceIds.length||!previous.some(text=>text.includes(clean(s.text))));
 if(fresh.length===answer.segments.length)return answer;
 return {...answer,segments:fresh.length?fresh:[{text:'I do not have further verified detail on that point. You can review the linked source or prepare a question for the Oz Timber Floor team.',evidenceIds:[]}]};
}
export function policyAnswer(message,corpus,options={}){
 if(/password|confidential|supplier (?:cost|price|name|list)|wholesale|operon|supabase|\bkeys?\b|system prompt|all.*(?:data|index)|ignore.*(?:previous|instructions)|reveal|<script|javascript:|https?:\/\//i.test(message))return fallback('private_request',corpus);
 if(/asbestos|dangerous removal/i.test(message))return fallback('safety',corpus);
 if(/what affects.*cost|cost factors|cost depend/i.test(message)){
  const doc=corpus.documents.find(d=>d.canonicalPath==='/timber-floor-installation/');
  const facts=doc?.facts.filter(f=>f.field==='guidance'&&/preparation|access|current floor/i.test(f.value)).slice(0,2).map(f=>({...f,entityId:doc.entityId,entityType:doc.entityType,canonicalPath:doc.canonicalPath,title:doc.title}))||[];
  if(facts.length){const answer=renderPlan({status:'answered',factIds:facts.map(f=>f.id),reason:'supported'},{facts},corpus);answer.segments.push({text:'The team confirms the quote after reviewing your project details.',evidenceIds:[]});return answer;}
 }
 if(/\bbamboo\b/i.test(message))return {status:'needs_confirmation',segments:[{text:'That material is not part of the current public catalogue. Ask the team about current alternatives.',evidenceIds:['business-current-offering']}],sources:[{id:'business-current-offering',title:'Contact Oz Timber Floor',href:'/contact/',expectedStatus:200}],entityIds:[],reason:'not_offered',corpusVersion:corpus.corpusVersion};
 if(/confidential|supplier (?:cost|price|name|list)|wholesale|operon|supabase|\bkeys?\b|system prompt|all.*(?:data|index)|ignore.*(?:previous|instructions)|reveal|<script|javascript:|https?:\/\//i.test(message))return fallback('private_request',corpus);
 if(/asbestos|dangerous removal/i.test(message))return fallback('safety',corpus);
 if(/bathroom|scratch.proof|pet.proof|certif|acoustic|fire|slip|underfloor|heating|adhesive|moisture|tolerances?|wet area|commercial.rat/i.test(message))return {...fallback('safety',corpus),segments:[{text:'I cannot approve site-specific suitability or certify performance here. The team needs the exact product and project requirements before advising on the next steps.',evidenceIds:[]}]};
 if(/waterproof/i.test(message))return {...fallback('safety',corpus),segments:[{text:'Waterproof claims need verification for the exact product. I cannot apply that claim to all hybrid flooring or approve an unseen installation. Which product are you considering?',evidenceIds:[]}]};
 if(/strata/i.test(message))return {...fallback('safety',corpus),segments:[{text:'Ask your strata manager to confirm the requirements for your proposed flooring before choosing a product. The team can review your requirements; this chat cannot certify compliance.',evidenceIds:[]}]};
 const restricted=restrictedRangeAnswer(message,corpus,options);if(restricted)return restricted;
 const retired=retiredCatalogueMatch(corpus,message);
 if(retired)return {status:'needs_confirmation',segments:[{text:retired.name+' is no longer offered by Oz Timber Floor. The current Stone Floor collection contains alternatives, not an exact replacement. Ask the team to help choose an alternative.',evidenceIds:[]}],sources:[{id:'stone-floor-alternatives',title:'Current Stone Floor alternatives',href:retired.alternativesPath,expectedStatus:200}],entityIds:[],reason:retired.responseReason==='confirmation'?'confirmation':'retired',retirementStatus:'retired',corpusVersion:corpus.corpusVersion};
 if(/artisan oak/i.test(message)){return {status:'needs_confirmation',segments:[{text:'Artisan Oak is discontinued. Artisan Tile is a separate range, not an exact replacement. Ask the team about alternatives.',evidenceIds:['retirement-artisan-oak']}],sources:[{id:'retirement-artisan-oak',title:'Artisan Oak discontinued notice',href:'/ranges/artisan-oak/',expectedStatus:410}],entityIds:[],reason:'retired',corpusVersion:corpus.corpusVersion};}
 // Keep privacy/safety precedence. Site-specific promises and payment requests
 // must not be answered by loosely relevant catalogue/legal snippets.
 if(/\bplace\s+(?:an?\s+)?order\b|\btake\b.*\bdeposit\b|\baccept\b.*\bpayments?\b|\bpay\b.*\bchat\b/i.test(message))return {...fallback('confirmation',corpus),segments:[{text:'I can help prepare an enquiry, but cannot place orders or accept payments. Contact Oz Timber Floor to confirm ordering and payment arrangements.',evidenceIds:[]}]};
 if(/\bguarantee(?:d|s)?\b|\bpromise\b|\btomorrow\b|\b(?:prices|costs|pricing)\b/i.test(message))return fallback('confirmation',corpus);
 if(/\b(?:every|any|all)\b.*\b(?:plank|board|product)s?\b.*\b(?:chevron|herringbone|parquetry)\b|\bsuitable\b.*\b(?:my|our|apartment|without|site)\b|\b(?:compound|levelling|leveling)\b.*\b(?:depth|every uneven|all floors?)\b/i.test(message))return fallback('confirmation',corpus);
 if(/\b(?:pretend|fabricate|invent|fake|make up|say you verified|claim you verified)\b[\s\S]*\b(?:projects?|jobs?|clients?|suburbs?|reviews?|testimonials?)\b/i.test(message))return {status:'needs_confirmation',segments:[{text:'I cannot invent or claim to have verified a completed project, client or suburb. Please review the available project information or ask Oz Timber Floor to confirm a relevant example.',evidenceIds:[]}],sources:[{id:'project-verification',title:'Project information',href:'/projects/',expectedStatus:200}],entityIds:[],reason:'project_verification_required',corpusVersion:corpus.corpusVersion};
 if(/project.*(?:example|completed|job|client)|(?:your|completed|client).*project|completed jobs?|client jobs?|testimonials?/i.test(message))return projectAnswer(corpus);
 if(/interlaken|natural oak brown|stone floor oak beige|helena oak/i.test(message))return fallback('confirmation',corpus);
 const recordedPack=recordedPackAnswer(message,corpus,options);if(recordedPack)return recordedPack;
 if(/\b(?:price|prices|cost|stock|warranty|lead time|urgent|urgently|book|booking|appointment|available|availability|box|boxes|pack|waste|calculate|refund|opening hours|open today)\b|\$/i.test(message))return fallback('confirmation',corpus);
 if(/[\u0400-\u04ff\u3040-\u9fff\u0600-\u06ff]/u.test(message))return fallback('language',corpus);
 return null;
}
