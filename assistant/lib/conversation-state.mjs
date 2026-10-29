import crypto from 'node:crypto';
import {exactKeys} from './security.mjs';
import {namedCatalogueEntities,retiredCatalogueMatch,enquiryIntent} from './catalogue-context.mjs';
import {comparisonMaterials,normalise} from './retrieval.mjs';

const owners=[['engineered','/engineered-timber-flooring/'],['hybrid','/hybrid/'],['laminate','/laminate/'],['vinyl','/vinyl/'],['solid','/solid-timber/']];
const intents=['stock','supply-only','supply-install','product','commercial','service'];
const signature=(value,secret)=>crypto.createHmac('sha256',secret).update('oz-guide-state-v1:'+value).digest('base64url');
const empty=()=>({entityIds:[],owners:[],intent:'supply-install',preference:null});
const current=(corpus,id)=>corpus.documents.find(d=>d.entityId===id&&['product','range'].includes(d.entityType)&&!retiredCatalogueMatch(corpus,d.title)&&!/artisan oak|bamboo/i.test(d.title));
export function verifyConversation(token,{secret,session,corpus,now=Date.now()}){
 if(!token)return empty();
 if(typeof token!=='string'||token.length>1800||!secret||secret.length<32)throw Error('conversation');
 const [value,mac,...extra]=token.split('.');const expected=signature(value,secret);
 if(extra.length||!mac||mac.length!==expected.length||!crypto.timingSafeEqual(Buffer.from(mac),Buffer.from(expected)))throw Error('conversation');
 let d;try{d=JSON.parse(Buffer.from(value,'base64url'));}catch{throw Error('conversation');}
 if(!exactKeys(d,['v','sid','exp','corpus','entityIds','owners','intent','preference'])||d.v!==1||d.sid!==session.id||d.exp!==session.exp||d.exp<=now||d.corpus!==corpus.corpusVersion||!Array.isArray(d.entityIds)||d.entityIds.length>2||new Set(d.entityIds).size!==d.entityIds.length||!d.entityIds.every(id=>typeof id==='string'&&current(corpus,id))||!Array.isArray(d.owners)||d.owners.length>2||new Set(d.owners).size!==d.owners.length||!d.owners.every(p=>owners.some(([,path])=>path===p)&&corpus.documents.some(doc=>doc.canonicalPath===p))||d.entityIds.length&&d.owners.length||!intents.includes(d.intent)||![null,'supply-only','supply-install'].includes(d.preference))throw Error('conversation');
 return {entityIds:d.entityIds,owners:d.owners,intent:d.intent,preference:d.preference};
}
export function signConversation(state,{secret,session,corpus}){
 const value=Buffer.from(JSON.stringify({v:1,sid:session.id,exp:session.exp,corpus:corpus.corpusVersion,...state})).toString('base64url');
 return value+'.'+signature(value,secret);
}
export function resolveConversation(message,prior,corpus){
 if(retiredCatalogueMatch(corpus,message)||/\b(?:artisan oak|bamboo)\b/i.test(message))return {question:message,state:empty()};
 // History is deliberately absent. Only signed state supplies prior identities.
 const named=namedCatalogueEntities(corpus,message).filter(d=>current(corpus,d.entityId));
 const explicitOwners=owners.filter(([name])=>new RegExp('\\b'+name+'\\b','i').test(message));
 const pair=comparisonMaterials(message);
 if(named.length>2||pair.length>2)return {question:message,state:empty(),ambiguous:true};
 const follow=/\b(?:it|its|that one|this one|those|them|their)\b/i.test(message)||/^(?:and\s+)?(?:what about\s+)?(?:maintenance|cleaning|care|thickness|dimensions)\b/i.test(message)||/\b(?:easier|easy)\s+to\s+clean\b/i.test(message);
 let state=empty(),question=message;
 if(named.length&&named.length<=2)state.entityIds=named.map(d=>d.entityId);
 else if(pair.length===2)state.owners=pair.map(([, ,path])=>path);
 else if(explicitOwners.length===1)state.owners=explicitOwners.map(([,path])=>path);
 else if(follow){state={...prior,entityIds:[...prior.entityIds],owners:[...prior.owners]};
  if(state.entityIds.length===1)question=message+' '+current(corpus,state.entityIds[0]).title;
  else if(state.entityIds.length===2&&/maintenance|cleaning|care|thickness|dimensions|compare|both/i.test(message))question='Compare '+state.entityIds.map(id=>current(corpus,id).title).join(' and ')+' '+message;
  else if(state.owners.length&&/maintenance|cleaning|care|clean/i.test(message))question=(state.owners.length===2?'Compare ':'')+state.owners.map(path=>owners.find(([,p])=>p===path)[0]).join(' and ')+' '+message;
  else if(state.entityIds.length>1||state.owners.length>1)return {question:message,state:empty(),ambiguous:true};
 }
 const intent=enquiryIntent(message,state.entityIds.length===1);
 state.intent=follow&&intent==='supply-install'&&prior.intent?prior.intent:intent;
 if(follow&&intent==='product'&&prior.preference)state.intent=prior.preference;
 if(/supply.only/i.test(message))state.preference='supply-only';
 if(/supply\s*(?:and|\+)\s*install/i.test(message))state.preference='supply-install';
 // Names not in current evidence, hazards, retirements and private requests
 // never acquire a previous product merely because a pronoun was included.
 if(/\b(?:instead|switch|now|different)\b/i.test(normalise(message))&&!named.length&&!explicitOwners.length)state=empty();
 if(question.length>2000)return {question:message,state:empty(),ambiguous:true};
 return {question,state};
}
