// Strip only physical-property-key phrases for the secret-request classifier.
// The original user message still goes through all other safety checks/retrieval.
export function securityMessage(message){
 if(/api|secret|token|credential|password|encrypt|decrypt|private|access code|door code|lockbox|key safe|system|reveal/i.test(message))return message;
 return message.replace(/\bkeys?\s+from\s+(?:(?:our|the|my|your)\s+)?(?:agency|property manager|tenant)\b/gi,'physical access coordination')
  .replace(/\b(?:agency|property|tenant)\s+keys?\s+(?:collection|return|handover)\b/gi,'physical access coordination')
  .replace(/\b(?:collect|return|pick up)\s+(?:(?:our|the|my|your)\s+)?(?:property|agency|tenant)\s+keys?\b/gi,'physical access coordination');
}
export function uploadHelp(message,corpus){
 if(!/\b(?:upload|attach|send)\b/i.test(message)||!/floor\s*plans?|photographs?|photos?/i.test(message))return null;
 const doc=corpus.documents.find(d=>d.canonicalPath==='/contact/'),fact=doc?.facts.find(f=>f.field==='guidance'&&f.value==='You can optionally attach a floor plan or photos in the form. If a file is too large, mention it in your message so we can discuss another way to send it.');
 if(!fact)return null;
 return {status:'answered',reason:'public_enquiry_help',segments:[{text:fact.value,evidenceIds:[fact.id]},{text:'Use the contact enquiry form and follow its file limits. Do not send the files into this chat.',evidenceIds:[]}],sources:[{id:doc.documentId,title:doc.title,href:'/contact/',expectedStatus:200}],entityIds:[],corpusVersion:corpus.corpusVersion};
}
