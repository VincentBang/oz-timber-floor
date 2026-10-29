import {namedCatalogueEntities} from './catalogue-context.mjs';
import {comparisonMaterials} from './retrieval.mjs';
// Re-resolve user-mentioned names; never trust prior assistant prose as facts.
export function guideQuestion(message,history,corpus){
 let question=message;
 for(const raw of message.match(/https?:\/\/[^\s<>]+/gi)||[]){
  let url;try{url=new URL(raw);}catch{return {question:message,invalidUrl:true};}
  const doc=url.origin==='https://oztimberfloor.com.au'&&!url.username&&!url.password&&corpus.documents.find(d=>d.canonicalPath===url.pathname);
  if(!doc)return {question:message,invalidUrl:true};
  question=question.replace(raw,doc.title);
 }
 if(namedCatalogueEntities(corpus,question).length||comparisonMaterials(question).length)return {question};
 if(!/\b(it|its|that one|maintenance|cleaning|care)\b/i.test(question))return {question};
 const previous=(history||[]).filter(t=>t.role==='user').at(-1)?.content||'';
 const entities=namedCatalogueEntities(corpus,previous);
 if(entities.length===1)return {question:question+' '+entities[0].title};
 const pair=comparisonMaterials(previous);
 if(pair.length===2&&/maintenance|cleaning|care/i.test(question))return {question:'Compare '+pair.map(([name])=>name).join(' and ')+' '+question};
 return {question};
}
