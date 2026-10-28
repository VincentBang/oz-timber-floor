import {hash} from './security.mjs';
import {knowledgeTextIssue} from './knowledge-quality.mjs';
export const normalise=s=>String(s).toLowerCase().normalize('NFKC').replace(/engineered wood/g,'engineered timber').replace(/leveling/g,'levelling').replace(/supply and install/g,'supply install').replace(/[^\p{L}\p{N}.]+/gu,' ').trim();
export const tokens=s=>normalise(s).split(/\s+/).filter(t=>t.length>1&&!['the','what','which','about','does','with','from','have','your','please','tell','this','that','flooring','floor','how','do','is','are','me','you','of','for','in','on','and','or','to','can','vs','compare','between','difference','differences'].includes(t));
export function unqualifiedColour(doc,message){
 const range=doc?.facts.find(f=>f.field==='range')?.value;
 return doc?.entityType==='product'&&tokens(doc.title).length<=2&&!!range&&!(' '+normalise(message)+' ').includes(' '+normalise(range)+' ');
}
const materialOwners=[['engineered',/\bengineered(?: timber| wood)?\b/,'/engineered-timber-flooring/'],['solid',/\bsolid(?: timber| wood)?\b/,'/solid-timber/'],['hybrid',/\bhybrid\b/,'/hybrid/'],['laminate',/\blaminate\b/,'/laminate/'],['vinyl',/\bvinyl\b/,'/vinyl/']];
export function comparisonMaterials(message){
 const q=normalise(message);if(!/\b(compare|versus|vs|difference|differences|between|better|and)\b/.test(q))return [];
 const positive=q.replace(/\b(?:not|no|exclude|excluding|without)\s+(?:(?:engineered|solid)(?: timber| wood)?|hybrid|laminate|vinyl)\b/g,'');
 const matches=materialOwners.filter(([,pattern])=>pattern.test(positive));return matches.length>=2?matches:[];
}
export function buildIndex(corpus){
 const entries=corpus.documents.map(doc=>({doc,words:tokens(doc.title+' '+doc.canonicalPath+' '+doc.facts.map(f=>f.field+' '+f.value).join(' '))})),df=new Map();for(const e of entries)for(const t of new Set(e.words))df.set(t,(df.get(t)||0)+1);
 const average=entries.reduce((s,e)=>s+e.words.length,0)/entries.length;
 return {corpus,entries,df,average};
}
export function retrieve(index,message,{pagePath='/',entityId}={}){
 const q=normalise(message),qt=tokens(q),context=index.corpus.documents.find(d=>d.canonicalPath===pagePath);
 if(entityId&&context?.entityId!==entityId)return {status:'clarify',reason:'invalid_context',documents:[],facts:[]};
 const exact=index.corpus.documents.filter(d=>['product','range'].includes(d.entityType)&&(d.entityType!=='product'||tokens(d.title).length>=2)&&(' '+q+' ').includes(' '+normalise(d.title)+' ')).sort((a,b)=>b.title.length-a.title.length);
 // Whole identity match takes precedence over a containing range name.
 let selected=exact.filter(d=>!exact.some(o=>o!==d&&normalise(o.title).length>normalise(d.title).length&&normalise(o.title).includes(normalise(d.title))));
 if(selected.some(d=>d.entityType==='product'))selected=selected.filter(d=>d.entityType==='product');
 if(selected.length===1&&unqualifiedColour(selected[0],message)&&selected[0].canonicalPath!==pagePath)return {status:'clarify',reason:'ambiguous_colour',documents:[],facts:[]};
 if(selected.length>1&&!/\bcompare|\bversus|\bvs\b|\band\b/.test(q))return {status:'clarify',reason:'ambiguous_entity',documents:[],facts:[]};
 if(q==='blackbutt'||(!/avala|aqua|etf|range|laminate|hybrid|timber/.test(q)&&/\bblackbutt\b/.test(q)&&selected.length!==1))return {status:'clarify',reason:'ambiguous_entity',documents:[],facts:[]};
 if(!selected.length&&/\bblackbutt\b/.test(q))return {status:'clarify',reason:'ambiguous_entity',documents:[],facts:[]};
 if(!selected.length&&/\b(?:that one|this one|it|its)\b/.test(q))return {status:'clarify',reason:'ambiguous_reference',documents:[],facts:[]};
 if(!selected.length&&/helena|\betf\b/.test(q))return {status:'clarify',reason:'confirm_family_thickness',documents:[],facts:[]};
 const specific=selected.length?selected:(/\b(?:this product|this range)\b/.test(q)&&context&&['product','range'].includes(context.entityType)?[context]:[]);
 let ranked=index.entries.map(({doc,words})=>{
  let score=0;for(const term of qt){const tf=words.filter(t=>t===term).length,idf=Math.log(1+(index.entries.length-(index.df.get(term)||0)+0.5)/((index.df.get(term)||0)+0.5));score+=idf*(tf*2.2)/(tf+1.2*(0.25+0.75*words.length/index.average));}
  if(specific.includes(doc))score+=1000;
  if(doc.canonicalPath==='/contact/'&&/phone|call|email|address|showroom/.test(q))score+=100;
  // Explicit category/service owners precede broad guides for matching intent.
  // These are navigation priorities, never synonym equivalences between specs.
  const topics=[
   [/hybrid|rental/,['/hybrid/']],[/engineered|patterns/,['/engineered-timber-flooring/']],
   [/laminate/,['/laminate/']],[/vinyl/,['/vinyl/']],[/solid timber/,['/solid-timber/']],
   [/choos.*timber|flooring categor|floor colours/,['/products/']],
   [/browse.*range|where.*range/,['/ranges/']],
   [/levelling|subfloor|floor preparation|surface preparation|transitions/,['/floor-levelling/']],
   [/installation|access.*planning/,['/timber-floor-installation/']],
   [/removal|stripping/,['/timber-floor-removal-and-stripping-sydney/']],
   [/sanding|polishing/,['/timber-floor-sanding-and-polishing-sydney/']],
   [/builder/,['/builder-flooring-contractor-sydney/']],
   [/commercial/,['/commercial-flooring/']],[/office/,['/office-flooring/']],
   [/renovation|sequence/,['/faqs/']]
  ];for(const [pattern,paths]of topics)if(pattern.test(q)&&paths.includes(doc.canonicalPath))score+=60;
  return {doc,score};
 }).filter(e=>e.score>2).sort((a,b)=>b.score-a.score||a.doc.canonicalPath.localeCompare(b.doc.canonicalPath));
 if(specific.length)ranked=ranked.filter(e=>specific.includes(e.doc));
 else ranked=ranked.filter(e=>!['product','range'].includes(e.doc.entityType));
 const scope=specific.length?[]:comparisonMaterials(q);
 if(scope.length)ranked=ranked.filter(e=>scope.some(([, ,owner])=>e.doc.canonicalPath===owner));
 const documents=ranked.slice(0,8).map(e=>e.doc);
 let facts=[];for(const doc of documents){
  let relevant=doc.facts;
  if(specific.length){relevant=doc.facts.filter(f=>['identity','category','range','colour','thickness','boardSize','finish'].includes(f.field));}
  else relevant=doc.facts.filter(f=>['guidance','faq','phone','email','showroom'].includes(f.field)&&(tokens(f.value+' '+f.field).some(t=>qt.includes(t))||doc.canonicalPath==='/contact/'&&/phone|call|email|address|showroom/.test(q)&&['phone','email','showroom'].includes(f.field)));
  // UTF-8 bytes are a conservative upper bound on text tokens: do not rely
  // on a character/token ratio for the six-thousand-token evidence ceiling.
  for(const f of relevant){
   if(['guidance','faq'].includes(f.field)&&knowledgeTextIssue(f.value))continue;
   if(!specific.length&&(f.value.length>800||scope.length&&materialOwners.some(([key,pattern])=>!scope.some(([requested])=>requested===key)&&pattern.test(normalise(f.value)))))continue;
   if(scope.length&&!scope.find(([, ,owner])=>owner===doc.canonicalPath)?.[1].test(normalise(f.value)))continue;
   facts.push({...f,entityId:doc.entityId,entityType:doc.entityType,canonicalPath:doc.canonicalPath,title:doc.title});
  }
 }
 if(!specific.length){
  const focused=/\b(?:installation|install|subfloor|levelling|maintenance|cleaning|care|preparation)\b/.test(q);
  const score=f=>20/(documents.findIndex(d=>d.entityId===f.entityId)+1)+tokens(f.value).filter(t=>qt.includes(t)).length*2+tokens(f.question||'').filter(t=>qt.includes(t)).length*6+(scope.length?(f.field==='guidance'?12:!focused&&/^what (?:is|are)/i.test(f.question||'')?20:-12):0)+(!scope.length&&/\b(plan|prepare|start|enquiry)\b/.test(q)&&f.field==='guidance'&&/photos|dimensions|suburb|floor area|access|staging|current floor/i.test(f.value)?12:0);
  facts.sort((a,b)=>score(b)-score(a)||a.id.localeCompare(b.id));
  if(scope.length){const groups=scope.map(([, ,owner])=>facts.filter(f=>f.canonicalPath===owner).slice(0,2));facts=[0,1].flatMap(i=>groups.map(g=>g[i]).filter(Boolean));}
 }
 // Prefer the requested attribute instead of unrelated identity/FAQ blocks.
 const requestedFields=[[/\b(?:thickness|thick)\b/,'thickness'],[/\b(?:colour|color)\b/,'colour'],[/\b(?:board size|plank size|dimensions|width|length)\b/,'boardSize'],[/\bfinish\b/,'finish'],[/\bcategory\b/,'category']].filter(([pattern])=>pattern.test(q)).map(([,field])=>field);
 if(specific.length&&requestedFields.length)facts=facts.filter(f=>f.field==='identity'||requestedFields.includes(f.field));
 if(specific.length>1){const groups=specific.map(d=>facts.filter(f=>f.entityId===d.entityId));facts=Array.from({length:Math.max(...groups.map(g=>g.length))},(_,i)=>groups.map(g=>g[i]).filter(Boolean)).flat();}
 const bounded=[],seen=new Set();for(const f of facts){const key=normalise(f.question?f.value.slice(f.question.length):f.value),ownerKey=(scope.length||specific.length>1?f.canonicalPath+':':'')+key;if(seen.has(ownerKey))continue;if(Buffer.byteLength(JSON.stringify([...bounded,f]),'utf8')>6000)continue;seen.add(ownerKey);bounded.push(f);if(bounded.length>=(specific.length?32:scope.length?scope.length*2:8))break;}
 const missingFields=specific.flatMap(d=>requestedFields.filter(field=>!bounded.some(f=>f.entityId===d.entityId&&f.field===field)).map(field=>({title:d.title,field})));
 return {status:bounded.length?'answered':'clarify',reason:bounded.length?'evidence_found':'low_evidence',documents,facts:bounded,exactEntities:specific.map(d=>d.entityId),comparisonOwners:scope.map(([, ,owner])=>owner),missingFields,queryHash:hash(q)};
}
// Explicit extension point, not an enabled embedding provider.
export class SemanticRetrievalAdapter { async search(){throw Error('semantic_provider_not_approved');} }
