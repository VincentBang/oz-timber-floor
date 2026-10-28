import {catalogueEnquiryContext} from './catalogue-context.mjs';
export function recordedPackAnswer(message,corpus,{pagePath='/'}={}){
 if(!/\bpack\s+(?:size|coverage)\b|\b(?:widths?|formats?|herringbone)\b|\bplank size\b/i.test(message)||/calculate|how many|waste|boxes|packs needed|\b(?:stock|available|price|cost|warranty)\b|\d+\s*(?:m2|m²|sqm)/i.test(message))return null;
 const context=catalogueEnquiryContext(corpus,message,pagePath);if(!context?.product)return null;
 const doc=corpus.documents.find(d=>d.entityId===context.entityId),formats=doc?.facts.find(f=>f.field==='formatSummary');
 if(formats){
  const choiceNeeded=/\bpack\s+(?:size|coverage)\b/i.test(message)&&formats.value.includes(' | ')&&!/\b(?:183|230)\s*mm\b|\bherringbone\b|\bstraight plank\b/i.test(message);
  return {status:choiceNeeded?'needs_confirmation':'answered',reason:choiceNeeded?'confirmation':'recorded_format_alternatives',segments:[{text:`${doc.title} — ${choiceNeeded?'Please choose the width or pattern first. ':''}${formats.value} These are format specifications, not a quantity calculation or a stock guarantee.`,evidenceIds:[formats.id]}],sources:[{id:doc.documentId,title:doc.title,href:doc.canonicalPath,expectedStatus:200}],entityIds:[doc.entityId],corpusVersion:corpus.corpusVersion};
 }
 if(!/\bpack\s+(?:size|coverage)\b/i.test(message))return null;
 const pack=doc?.facts.find(f=>f.field==='packSizeM2'&&/^\d+(?:\.\d+)?$/.test(f.value));if(!pack)return null;
 return {status:'answered',reason:'recorded_pack_specification',segments:[{text:`${doc.title} — recorded pack coverage: ${pack.value} m². Confirm the current product and batch before ordering. This is not a quantity or waste calculation.`,evidenceIds:[pack.id]}],sources:[{id:doc.documentId,title:doc.title,href:doc.canonicalPath,expectedStatus:200}],entityIds:[doc.entityId],corpusVersion:corpus.corpusVersion};
}
