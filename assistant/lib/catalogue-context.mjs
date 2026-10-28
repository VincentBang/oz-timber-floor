import {normalise,unqualifiedColour} from './retrieval.mjs';
const contains=(query,name)=>(' '+normalise(query)+' ').includes(' '+normalise(name)+' ');
// Names select reviewed documents, never new facts or instructions from history.
export function namedCatalogueEntities(corpus,message){
 const matches=(corpus.documents||[]).filter(d=>['product','range'].includes(d.entityType)&&normalise(d.title).length>=4&&contains(message,d.title));
 return matches.filter(d=>!matches.some(other=>other!==d&&(contains(other.title,d.title)&&other.title.length>d.title.length||d.entityType==='range'&&other.entityType==='product'&&normalise(other.facts.find(f=>f.field==='range')?.value||'')===normalise(d.title)&&contains(message,d.title+' '+other.title))));
}
export function catalogueEnquiryContext(corpus,message,pagePath){
 const named=namedCatalogueEntities(corpus,message);
 let entity=named.length===1?named[0]:null;
 if(!entity&&!named.length&&/\b(?:this product|this range|its stock|is it available)\b/i.test(message))entity=corpus.documents.find(d=>d.canonicalPath===pagePath&&['product','range'].includes(d.entityType));
 if(!entity)return null;
 if(unqualifiedColour(entity,message)&&entity.canonicalPath!==pagePath)return null;
 return {entityId:entity.entityId,pagePath:entity.canonicalPath,product:entity.entityType==='product'?entity.title:'',range:entity.entityType==='range'?entity.title:entity.facts.find(f=>f.field==='range')?.value||'',category:entity.facts.find(f=>f.field==='category')?.value||'',productSlug:entity.entityType==='product'?entity.canonicalPath.split('/')[2]:''};
}
export function enquiryIntent(message,hasEntity=false){
 if(/\b(?:stock|availability|available)\b/i.test(message))return 'stock';
 if(/\bsupply\s*(?:\+|and|&)\s*install|\bsupply.install\b/i.test(message))return 'supply-install';
 if(/\bsupply.only\b|\bsupply price\b|\b(?:buy|purchase)\b/i.test(message))return 'supply-only';
 if(/\b(?:commercial|builder|office)\b/i.test(message))return 'commercial';
 if(/\b(?:levelling|leveling|preparation|removal|sanding|installation|install)\b/i.test(message))return 'service';
 return hasEntity?'product':'supply-install';
}
export function retiredCatalogueMatch(corpus,message){
 return (corpus.retirements||[]).find(r=>r.retirementBasis==='owner-business-retirement'&&[r.name,...(r.aliases||[])].some(name=>contains(message,name)));
}
