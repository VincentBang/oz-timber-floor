// Deterministic navigation/explanation templates, not free model prose. These
// do not add catalogue properties or expose private provenance.
export function guideIntentAnswer(message,state,corpus){
 const q=message.trim().replace(/[?.!]+$/,'').toLowerCase();
 const response=(text,paths,evidenceIds=[])=>({status:'answered',segments:[{text,evidenceIds}],sources:paths.map(path=>corpus.documents.find(d=>d.canonicalPath===path)).filter(Boolean).map(d=>({id:d.documentId,title:d.title,href:d.canonicalPath,expectedStatus:200})),entityIds:[],reason:'supported'});
 if(/^(?:help me choose flooring|compare flooring options)$/.test(q))return response('Start with the flooring type, then compare ranges and colours. Browse hybrid, laminate, engineered timber, solid timber and vinyl in our catalogue. Do you need supply only, installation, or help preparing the existing floor?',['/products/','/ranges/']);
 if(/^(?:are you|is oz timber floor) (?:a )?(?:timber )?flooring supplier$/.test(q)){
  const d=corpus.documents.find(d=>d.canonicalPath==='/about/'),f=d?.facts.find(f=>f.field==='identity'&&/suppliers and installers/i.test(f.value));
  if(f)return response(f.value+'. Browse our products and ranges, or contact the team to discuss supply-only or supply and installation.',['/about/','/contact/'],[f.id]);
 }
 if(/^(?:can i request|do you (?:offer|provide)) supply[ -]only$/.test(q))return response('You can prepare a supply-only enquiry through our contact form. Include the product or range if known and any approximate area you want the team to review. The team confirms stock, quantities and pricing; chat does not reserve products or place an order.',['/contact/']);
 if(/^(?:tell me about )?de marqu[eé]$/.test(q)){const d=corpus.documents.find(d=>d.title==='De Marque Oak'&&d.entityType==='range');if(d)return response('Do you mean De Marque Oak? Open the range page to check the exact name and colours, or name the product you want to compare.',[d.canonicalPath]);}
 if(/maintenance|cleaning|care|easier to clean/i.test(message)&&state.owners.length===2)return response('For that comparison, I do not have enough verified like-for-like maintenance guidance for both flooring types. Check care instructions for the exact products before choosing. Which two named ranges are you considering? The team can help confirm the relevant product details.',state.owners);
 return null;
}
