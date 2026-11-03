import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {parse} from 'parse5';
import {hash} from '../assistant/lib/security.mjs';
import {createPublicationInventory} from './publication-inventory.mjs';
import {reviewedETF12Formats,verifyETF12FormatEvidence} from './etf12-reviewed-board-size.mjs';
import {reliabilityHTML} from './reliability-disclosures.mjs';
import {visibleKnowledgeText} from '../assistant/lib/knowledge-quality.mjs';

const attr=(n,k)=>n.attrs?.find(a=>a.name===k)?.value||'';
const walk=n=>[n,...(n.childNodes||[]).flatMap(walk)];
const text=n=>n.nodeName==='#text'?n.value:(n.childNodes||[]).map(text).join('');

// This is a current release contract, not a rewrite of the dated single-change
// tests or their baselines. Every changed fact must have a specific disposition.
export function checkCurrentAssistantRelease({root,previousCorpus,reviewedManifestBytes}) {
 const read=f=>fs.readFileSync(path.join(root,f)),json=f=>JSON.parse(read(f));
 assert.equal(hash(reviewedManifestBytes),'5319547bbca9818b954bd833ec638b89468cc103a663302b46e7e015eaa44d0f');
 const reviewed=JSON.parse(reviewedManifestBytes),operationalChanges=new Set(['OZ_STATUS.md','scripts/editorial-gallery.mjs','scripts/editorial-gallery.test.mjs','scripts/reliability-disclosures.mjs']);
 for(const item of reviewed.cumulativeFiles){if(!operationalChanges.has(item.file))assert.equal(hash(read(item.file)),item.after,'Reviewed source drift: '+item.file);}
 const corpus=json('assistant/generated/corpus.json'),manifest=json('assistant/generated/source-manifest.json');
 assert.equal(hash(corpus.documents),corpus.corpusVersion);assert.equal(manifest.candidateHash,corpus.candidateHash);
 for(const[f,digest]of Object.entries(manifest.files))assert.equal(hash(read(f)),digest,'Knowledge evidence drift: '+f);
 const prior=new Map(previousCorpus.documents.flatMap(d=>d.facts.map(f=>[f.id,{...f,path:d.canonicalPath}]))),current=new Map(corpus.documents.flatMap(d=>d.facts.map(f=>[f.id,{...f,path:d.canonicalPath}])));
 const removed=[...prior].filter(([id])=>!current.has(id)).map(([,f])=>f),added=[...current].filter(([id])=>!prior.has(id)).map(([,f])=>f);
 assert.equal(previousCorpus.corpusVersion,'0627c3489978e806f4ee0a2aff08732a2ef28fbc9d77ebc928ca4179c0f03730');
 assert.equal(removed.length,26);assert.equal(added.length,21);
 const rangePaths=new Set();let contact=0,guide=0,dimensions=0;
 const dispositions=[];
 for(const f of removed){
  if(f.field==='guidance'&&f.path.startsWith('/ranges/')&&f.value==='These HRT ranges stay close to the same category while giving a useful alternative to compare.'){
   assert(added.some(a=>a.path===f.path&&a.field==='guidance'&&a.value===f.value.replace('These HRT ranges','These ranges')));rangePaths.add(f.path);dispositions.push({id:f.id,path:f.path,reason:'Remove public supplier attribution; same comparison meaning'});continue;
  }
  if(f.path==='/contact/'&&f.field==='guidance'){
   assert.equal(f.value,'If you have photos or a floor plan, mention it in the message and we can request them after your enquiry.');
   assert(added.some(a=>a.path===f.path&&a.value==='You can optionally attach a floor plan or photos in the form. If a file is too large, mention it in your message so we can discuss another way to send it.'));contact++;dispositions.push({id:f.id,path:f.path,reason:'Locally implemented optional attachments; hosted activation remains a separate gate'});continue;
  }
  if(reviewedETF12Formats.some(p=>f.path==='/products/'+p.id+'/')&&f.field==='boardSize'){
   assert.equal(f.value,'1215mm x 196mm');verifyETF12FormatEvidence();assert(![...current.values()].some(a=>a.path===f.path&&a.field==='boardSize'&&a.value===f.value));dimensions++;dispositions.push({id:f.id,path:f.path,reason:'Do not retain superseded dimensions. Builder conservatively omits disputed historical specification; public correction remains exact-capture-bound'});continue;
  }
  if(f.field==='guidance'&&['/guides/how-hybrid-timber-flooring-performs-in-sydney-apartments/','/guides/laying-the-foundations-right-why-floor-levelling-matters-for-your-timber-flooring/'].includes(f.path)){
   assert(!JSON.stringify(corpus.documents).includes(f.value));guide++;dispositions.push({id:f.id,path:f.path,reason:'Reviewed guide repairs remove unsupported compliance, underlay and outcome assurances'});continue;
  }
  assert.fail('Unreviewed removed fact: '+f.id);
 }
 assert.equal(rangePaths.size,15);assert.equal(contact,1);assert.equal(dimensions,2);assert.equal(guide,8);
 for(const f of added){assert(removed.some(p=>p.path===f.path),'Unreviewed added route');const doc=corpus.documents.find(d=>d.canonicalPath===f.path);const file=Object.keys(manifest.files).find(file=>file.endsWith('.html')&&manifest.files[file]===doc.sourceHash);assert(file);const main=walk(parse(read(file).toString())).find(n=>n.tagName==='main');assert(main);const visible=visibleKnowledgeText(main).replace(/\s+/g,' ');assert(visible.includes(f.value),'Added fact lacks exact visible page evidence');assert(!/HRT|aligns with Australian standards|minimum IIC|NRC measures/.test(f.value));}
 const inventory=createPublicationInventory({root,domain:'https://oztimberfloor.com.au'});assert.equal(inventory.publicationRoutes.length,773);assert.deepEqual(inventory.publicationRoutes,inventory.sitemapRoutes);assert.deepEqual(inventory.blockingIssues,[]);
 const project=read('projects/index.html').toString(),nodes=walk(parse(project));
 assert.equal(nodes.filter(n=>n.attrs?.some(a=>a.name==='data-project-photo')).length,17);
 const header=project.match(/<header[\s\S]*?<\/header>/)[0];assert.equal(reliabilityHTML(header,json('data/product-catalogue.json')).html,header);
 for(const id of ['services','products']){const panel=nodes.find(n=>attr(n,'id')==='oz-nav-'+id);assert(panel);assert(nodes.some(n=>attr(n,'aria-controls')==='oz-nav-'+id));assert.equal(attr(panel,'role'),'');}
 const result={status:'LOCAL_CURRENT_RELEASE_CONTRACT_PASS',scope:'Exact reviewed source, corpus changes, current ownership, accessible navigation and photo identity; NOT GPT/model/hosted/form-delivery proof',corpusVersion:corpus.corpusVersion,documents:corpus.documents.length,facts:current.size,removedFacts:removed.length,addedFacts:added.length,dispositions,publication:773,sourceDefaultOffPreserved:json('assistant/config/production.json').activationApproved===false};
 assert(result.sourceDefaultOffPreserved);return result;
}
