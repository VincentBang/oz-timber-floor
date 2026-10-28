export const ETF_RESTRICTED_ROUTE='/ranges/etf-72hrs-water-resistant-laminate/';
export function restrictedRangeAnswer(message,corpus,{pagePath='/'}={}){
 const doc=corpus.documents?.find(d=>d.canonicalPath===ETF_RESTRICTED_ROUTE&&d.navigationOnly===true&&d.restriction==='unverified_performance_and_specs');
 if(!doc||!(/\betf\b.*\b72\s*(?:hrs?|hours?)\b/i.test(message)||pagePath===doc.canonicalPath&&/this range|this product|its specifications|its thickness|tell me about it/i.test(message)))return null;
 return {status:'needs_confirmation',reason:'restricted_specifications',segments:[{text:'This ETF laminate range page is available, but I do not have verified technical specifications or performance conditions for it. The range name is not a guarantee of water resistance or wet-area suitability. Ask the team to confirm the exact product before ordering.',evidenceIds:[]}],sources:[{id:doc.documentId,title:'ETF laminate range information',href:doc.canonicalPath,expectedStatus:200}],entityIds:[],enquiryContext:{entityId:doc.entityId,pagePath:doc.canonicalPath,range:doc.title,category:'Laminate',product:'',productSlug:''},corpusVersion:corpus.corpusVersion};
}
