import {hash} from './security.mjs';
export const PROJECT_PHOTO_NOTICE="The projects page shows photographs of Oz Timber Floor's flooring work. Photographs do not confirm the exact product, customer identity, individual suburb or suitability for another site.";
export const PROJECT_RECORD_HASH='648d46949b2b53e5b3c95d7b21f47e310426e3965053c2f6a155485ebc428f0c';
export const PROJECT_IMAGE_RECORD_HASH='ba1811b80fc3314f0097d5f047d05b1dad7a2efe449cf8e8590a04efb8862402';
// Local approved Oz copies only. Never visits or reads the separate photo origin.
export function reviewedProjectEvidence({data,manifest,html,readAsset}){
 if(hash(data)!==PROJECT_RECORD_HASH||hash(manifest)!==PROJECT_IMAGE_RECORD_HASH)throw Error('Project source records require review');
 if(data?.approval?.date!=='2026-10-28'||data.approval.use!=='Oz Timber Floor portfolio'||data.approval.basis!=='Owner stated: these operon photos are my project that you can use')throw Error('Project owner evidence missing');
 const projects=data.projects.filter(p=>p.publicApproved===true);if(!projects.length)throw Error('No approved project records');
 const ids=new Set();let photos=0;
 for(const p of projects){
  if(ids.has(p.id))throw Error('Project rendered identity mismatch');ids.add(p.id);
  for(const photo of p.photos){
   const asset=manifest.photos.filter(a=>a.projectId===p.id&&a.photoId===photo.id);if(asset.length!==1||!asset[0].variants?.length)throw Error('Project photo evidence missing');
   for(const v of asset[0].variants){if(!/^\/assets\/images\/projects\/[a-z0-9\-/]+\.webp$/.test(v.url)||!v.url.startsWith(`/assets/images/projects/${p.id}/`)||hash(readAsset(v.url))!==v.sha256)throw Error('Project image hash mismatch');}
   if(!asset[0].variants.some(v=>html.includes(v.url)))throw Error('Project photo not rendered');photos++;
  }
 }
 return {status:'owner-authorised-photographs',projects:projects.length,photos,approvalDate:data.approval.date,recordHash:PROJECT_RECORD_HASH,imageRecordHash:PROJECT_IMAGE_RECORD_HASH};
}
export function projectAnswer(corpus){
 const doc=(corpus.documents||[]).find(d=>d.canonicalPath==='/projects/');
 const proof=doc?.projectEvidence,notice=doc?.facts.find(f=>f.field==='guidance'&&f.value===PROJECT_PHOTO_NOTICE);
 if(proof?.status==='owner-authorised-photographs'&&proof.recordHash===PROJECT_RECORD_HASH&&proof.imageRecordHash===PROJECT_IMAGE_RECORD_HASH&&proof.projects===7&&proof.photos===17&&notice)return {status:'answered',reason:'reviewed_project_photos',segments:[{text:notice.value,evidenceIds:[notice.id]}],sources:[{id:doc.documentId,title:'Flooring project photographs',href:'/projects/',expectedStatus:200}],entityIds:[],corpusVersion:corpus.corpusVersion};
 // Historical knowledge keeps its historically correct answer; no inference
 // about a newer portfolio is made without its evidence metadata.
 if(doc&&/planning examples|project examples/i.test(doc.title+' '+doc.facts.map(f=>f.value).join(' ')))return {status:'answered',segments:[{text:'The project types on this website are planning examples, not verified records of completed Oz Timber Floor jobs.',evidenceIds:['policy-project-examples']}],sources:[{id:'policy-project-examples',title:'Project planning examples',href:'/projects/',expectedStatus:200}],entityIds:[],reason:'planning_examples',corpusVersion:corpus.corpusVersion};
 return {status:'needs_confirmation',reason:'project_verification_required',segments:[{text:'Please review the current project information or ask the team to confirm a relevant example. I cannot verify a project, customer or suburb from this information.',evidenceIds:[]}],sources:[{id:'project-information',title:'Project information',href:'/projects/',expectedStatus:200}],entityIds:[],corpusVersion:corpus.corpusVersion};
}
