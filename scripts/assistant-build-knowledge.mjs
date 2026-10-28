import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import * as parse5 from 'parse5';
import {fileURLToPath} from 'node:url';
import {routing} from './october-route-fixture.mjs';
import {createPublicationInventory} from './publication-inventory.mjs';
import {normalizeCatalogueAmpersands} from './catalogue-text.mjs';
import {hash} from '../assistant/lib/security.mjs';
import {instructionLike,excludedNode} from '../assistant/lib/source-policy.mjs';
import {isFaqSection,extractFaqPairs} from '../assistant/lib/knowledge-extraction.mjs';
import {STONEFLOOR_RETIREMENT_SHA256,stonefloorRetirementIssues} from './approved-stonefloor-legacy-retirement.mjs';
import {knowledgeTextIssue,visibleKnowledgeText} from '../assistant/lib/knowledge-quality.mjs';
import {reviewedProjectEvidence,PROJECT_PHOTO_NOTICE} from '../assistant/lib/project-knowledge.mjs';
import {ETF_RESTRICTED_ROUTE} from '../assistant/lib/restricted-range.mjs';
import {reviewedOakBeigeRetirement,OAK_BEIGE_ROUTE} from '../assistant/lib/legacy-retirement.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),report=process.env.OZ_ASSISTANT_EVIDENCE_DIR||root+'/docs/flooring-assistant',generated=root+'/assistant/generated';
fs.mkdirSync(report,{recursive:true});fs.mkdirSync(generated,{recursive:true});
const read=f=>fs.readFileSync(root+'/'+f,'utf8'),json=f=>JSON.parse(read(f));
const policy=json('assistant/config/policy.json'),catalogue=json('data/product-catalogue.json'),router=routing(root);
const inventory=createPublicationInventory({root,domain:'https://oztimberfloor.com.au'});
const attr=(n,k)=>n.attrs?.find(a=>a.name===k)?.value||'';
const all=(n,fn)=>excludedNode(n)?[]:[...(fn(n)?[n]:[]),...(n.childNodes||[]).flatMap(c=>all(c,fn))];
const text=n=>normalizeCatalogueAmpersands(visibleKnowledgeText(n));
const norm=s=>String(s||'').toLowerCase().replace(/&(?:amp;)+/g,'&').replace(/\s+/g,' ').replace(/\s*(mm|m²)\b/g,'$1').trim();
const risky=/water\s*proof|water.resistan|bathroom|wet.area|scratch.proof|pet.proof|acoustic|strata|certif|compliant|\bfire\b|slip|warrant|guarantee|underfloor|heating|asbestos|adhesive|tolerance|\bmoisture\b|\bcommercial.rat|\bprice|\bcost|\$|\bstock|lead time|booking|refund|\bhealth\b|environment|\bVOC\b|\bmm\b|\b\d+(?:\.\d+)?\s*(?:mm|m2|m²|%|hours?|days?|years?)\b|system prompt|ignore (?:all|previous)|api.key|https?:/i;
const supplierNames=[...new Set([...catalogue.products,...catalogue.ranges].flatMap(p=>[p.supplier]).filter(s=>typeof s==='string'&&s.length>3&&!/approved catalogue|oz timber/i.test(s)))];
const privateText=s=>instructionLike(s)||/\bbamboo\b/i.test(s)||supplierNames.some(n=>String(s).toLowerCase().includes(n.toLowerCase()))||/operon|supabase|wholesale|supplierSource|sourceTag|\.env|api[_ -]?key|ignore previous|system prompt|<\/?script/i.test(s);
const fieldLabels={category:['Category'],range:['Range'],colour:['Colour','Color'],thickness:['Thickness','Total thickness'],boardSize:['Board size','Plank size'],packSizeM2:['Pack size m²','Pack size'],finish:['Finish']};
const routes=[...read('sitemap.xml').matchAll(/<loc>([^<]+)<\/loc>/g)].map(m=>new URL(m[1]).pathname).sort();
const groups=new Map();for(const record of catalogue.products){const route=record.url||record.slug;if(routes.includes(route)){if(!groups.has(route))groups.set(route,[]);groups.get(route).push(record);}}
const sourceFiles=new Map([['sitemap.xml',hash(read('sitemap.xml'))],['_redirects',hash(read('_redirects'))],['data/product-catalogue.json',hash(read('data/product-catalogue.json'))],['data/catalogue-quality-overrides.json',hash(read('data/catalogue-quality-overrides.json'))],['data/seo-keyword-ownership.json',hash(read('data/seo-keyword-ownership.json'))],['assistant/config/policy.json',hash(read('assistant/config/policy.json'))]]);
const preservedSpecSource='docs/migration-october-2026-followup/supplier/product-specifications.json';
if(hash(read(preservedSpecSource))!=='e49283aadf30f55057043edc8203b4dc583f8e5a570f5cc46685aa0cbf21afa4')throw Error('Preserved specification evidence changed');
sourceFiles.set(preservedSpecSource,hash(read(preservedSpecSource)));
const preservedSpecs=json(preservedSpecSource);
const refreshedSpecPlan='docs/seo-growth/evidence/2026-10-28-supplier-refresh/REVIEWED_PLAN.json',refreshedSpecCapture='docs/seo-growth/evidence/2026-10-28-supplier-refresh/CAPTURE_VERIFIED.json';
const refreshedSpecs=json(refreshedSpecPlan).proposals,refreshedCapture=json(refreshedSpecCapture).records;
sourceFiles.set(refreshedSpecPlan,hash(read(refreshedSpecPlan)));sourceFiles.set(refreshedSpecCapture,hash(read(refreshedSpecCapture)));
const fourSpecPlan='docs/seo-growth/evidence/2026-10-28-four-suppliers/REVIEWED_PLAN.json',fourSpecCapture='docs/seo-growth/evidence/2026-10-28-four-suppliers/CAPTURE_PARSED.json';
const fourSpecs=json(fourSpecPlan).proposals,fourCapture=json(fourSpecCapture).records;
sourceFiles.set(fourSpecPlan,hash(read(fourSpecPlan)));sourceFiles.set(fourSpecCapture,hash(read(fourSpecCapture)));
const formatPlan='docs/seo-growth/evidence/2026-10-28-exact-formats/PLAN.json';
const formatRows=json(formatPlan).rows;sourceFiles.set(formatPlan,hash(read(formatPlan)));
const retirementReceipt='config/stonefloor-legacy-retirement-2026-10-28.json',receiptBytes=fs.readFileSync(root+'/'+retirementReceipt),receipt=JSON.parse(receiptBytes),quality=json('data/catalogue-quality-overrides.json');
if(hash(receiptBytes)!==STONEFLOOR_RETIREMENT_SHA256)throw Error('Owner retirement receipt changed; review required');
sourceFiles.set(retirementReceipt,hash(receiptBytes));
const businessRetirements=receipt.products.map(item=>{
 const product=catalogue.products.find(p=>p.id===item.id),resolved=router.rules.filter(r=>r.from===item.legacySource);
 const file=item.heldRoute.slice(1)+'index.html';
 const issues=stonefloorRetirementIssues({source:item.legacySource,rule:resolved[0],approvalBytes:receiptBytes,product,control:quality.pages[item.heldRoute],html:read(file),sitemapRoutes:inventory.sitemapRoutes,publicationRoutes:inventory.publicationRoutes});
 if(resolved.length!==1||issues.length)throw Error('Retirement evidence conflict: '+item.id);
 sourceFiles.set(file,hash(read(file)));
 return {name:product.name,aliases:[product.name.replace(/^Stone Floor /,'')],path:item.heldRoute,expectedStatus:200,alternativesPath:'/ranges/stone-floor/',retirementBasis:'owner-business-retirement',authorityHash:STONEFLOOR_RETIREMENT_SHA256};
});
const oakBeige=reviewedOakBeigeRetirement({control:quality.pages[OAK_BEIGE_ROUTE],product:catalogue.products.find(p=>p.id==='stone-floor-oak-beige')});
if(inventory.sitemapRoutes.includes(OAK_BEIGE_ROUTE)||inventory.publicationRoutes.includes(OAK_BEIGE_ROUTE))throw Error('Retired Oak Beige must not be a publication owner');
const oakLegacy=router.resolve('/product/stone-floor-oak-beige/');
if(oakLegacy.status!==200||oakLegacy.destination!==oakBeige.alternativesPath)throw Error('Oak Beige alternatives routing conflict');
businessRetirements.push(oakBeige);
sourceFiles.set('assistant/lib/legacy-retirement.mjs',hash(read('assistant/lib/legacy-retirement.mjs')));
const docs=[],ledger=[],conflicts=[],gaps=[],provenance=[];
function fact(doc,field,value,section,qualifier='Final specifications, batch and suitability need confirmation before order.'){
 if(!value||/confirm product details|not specified|unknown/i.test(value)||privateText(value))return;
 const qualityIssue=['guidance','faq'].includes(field)&&knowledgeTextIssue(value);if(qualityIssue){gaps.push({canonicalPath:doc.canonicalPath,field,reason:qualityIssue,contentHash:hash(value)});return;}
 const id=hash([doc.entityId,field,value,section]).slice(0,24);doc.facts.push({id,field,value,section:section||'',qualifier:doc.entityType==='product'||doc.entityType==='range'?qualifier:'',reviewState:'candidate-corroborated'});
}
for(const canonicalPath of routes){
 const resolved=router.resolve(canonicalPath);if(resolved.status!==200||resolved.hops||!resolved.file)throw Error('Publication owner routing conflict: '+canonicalPath);
 const html=read(resolved.file);sourceFiles.set(resolved.file,hash(html));const tree=parse5.parse(html),main=all(tree,n=>n.tagName==='main')[0];
 const title=text(all(tree,n=>n.tagName==='h1')[0]||{});const noindex=all(tree,n=>n.tagName==='meta'&&attr(n,'name')==='robots').some(n=>/noindex/i.test(attr(n,'content')));
 if(noindex)throw Error('Publication hold mismatch');
 const entityType=/^\/products\/[^/]+\/$/.test(canonicalPath)?'product':/^\/ranges\/[^/]+\/$/.test(canonicalPath)?'range':/^\/guides\/[^/]+\/$/.test(canonicalPath)||['/timber-flooring-installation-common-mistakes-and-solutions/','/timber-flooring-options-solid-vs-engineered-vs-hybrid/','/laminate-timber-flooring-explained-cost-durability-use-cases/','/vinyl-timber-flooring-sydney-cost-durability-and-best-use-cases/'].includes(canonicalPath)?'guide':/privacy|terms/.test(canonicalPath)?'policy':'page';
 const doc={schemaVersion:1,documentId:hash(canonicalPath).slice(0,24),entityId:hash(canonicalPath).slice(0,24),entityType,canonicalPath,title,sourceHash:hash(html),reviewState:'candidate-owner-review-required',expectedStatus:200,facts:[]};
 const records=entityType==='range'?catalogue.ranges.filter(r=>r.url===canonicalPath):groups.get(canonicalPath)||[];
 if(records.some(r=>r.publicCatalogueStatus==='retired'))throw Error('Retired record cannot become current assistant knowledge: '+canonicalPath);
 provenance.push({canonicalPath,file:resolved.file,sourceHash:doc.sourceHash,recordIds:records.map(r=>r.id),observedAt:new Date().toISOString(),reviewedAt:null});
 if(canonicalPath===ETF_RESTRICTED_ROUTE){
  const category=all(main||{},n=>attr(n,'class').split(' ').includes('spec-item')).find(n=>text(all(n,c=>c.tagName==='span')[0]||{})==='Category');
  if(records.length!==1||records[0].category!=='Laminate'||text(all(category||{},c=>c.tagName==='strong')[0]||{})!=='Laminate')throw Error('ETF navigation identity/category mismatch');
  doc.title='ETF laminate range information';doc.navigationOnly=true;doc.restriction='unverified_performance_and_specs';doc.originalTitleHash=hash(title);fact(doc,'identity',doc.title,'','');
  docs.push(doc);ledger.push({canonicalPath,disposition:'restricted',reason:'navigation_only_no_performance_or_specification_advice',entityId:doc.entityId,entityType,facts:doc.facts.length});continue;
 }
 if(privateText(title)||/water.?resistan|waterproof|scratch.?proof|commercial.?rated/i.test(title)){ledger.push({canonicalPath,disposition:'restricted',reason:'identity_requires_public_naming_or_claim_review'});continue;}
 fact(doc,'identity',title,'');
 if(entityType==='product'||entityType==='range'){
  const specs=new Map(all(main||{},n=>attr(n,'class').split(' ').includes('spec-item')).map(n=>{const label=text(all(n,c=>['span','dt'].includes(c.tagName))[0]||{}),value=text(all(n,c=>['strong','dd'].includes(c.tagName))[0]||{});return[label,value];}));
  // Keep the complete labelled alternative atomic: never infer a selected width/SKU.
  const formatEvidence=records.length===1&&formatRows.find(r=>r.id===records[0].id&&r.route===canonicalPath);
  if(formatEvidence){
   const source=read(formatEvidence.file);if(hash(source)!==formatEvidence.sourceSha256)throw Error('Format source hash mismatch');
   sourceFiles.set(formatEvidence.file,hash(source));
   if(JSON.stringify(records[0].formatOptions)!==JSON.stringify(formatEvidence.after.formatOptions)||records[0].formatSummary!==formatEvidence.after.formatSummary||norm(specs.get('Format options'))!==norm(records[0].formatSummary))throw Error('Format alternatives record/rendered mismatch');
   fact(doc,'formatSummary',records[0].formatSummary,'','Choose the format first; these are alternatives, not an order quantity or stock guarantee.');
  }
  const finishEvidence=records.length===1&&(preservedSpecs.find(e=>e.record===records[0].id&&e.fields['Surface Finish']&&norm(e.fields['Surface Finish'])===norm(records[0].finish)&&norm(e.title)===norm(records[0].colour))||refreshedSpecs.find(e=>e.id===records[0].id&&e.route===canonicalPath&&e.changes.some(c=>c.field==='finish'&&norm(c.after)===norm(records[0].finish))&&refreshedCapture.some(s=>s.url===e.source&&s.sha256===e.sourceSha256&&norm(s.fields.Finish)===norm(records[0].finish)&&norm(s.title)===norm(records[0].colour))));
  const fourFinishEvidence=records.length===1&&fourSpecs.find(e=>e.id===records[0].id&&e.route===canonicalPath&&e.changes.some(c=>c.field==='finish'&&norm(c.after)===norm(records[0].finish))&&fourCapture.some(s=>s.url===e.source&&s.sha256===e.sourceSha256&&norm(s.title.replace(/^[A-Z]{1,4}\d+(?:-\d+)?\s+/,''))===norm(records[0].colour)&&(norm(s.fields['Surface Finish'])===norm(records[0].finish)||norm(s.fields.Surface?.match(/^(MATT|Matte|EIR)\b/i)?.[1])===norm(records[0].finish))));
  for(const field of [...policy.publicFields,...(finishEvidence||fourFinishEvidence?['finish']:[])]){
   const rendered=(fieldLabels[field]||[]).map(l=>specs.get(l)).find(Boolean)||'';
   const values=[...new Set(records.map(r=>norm(r[field])).filter(Boolean))];
   const blank=records.some(r=>!r[field]);
   if(values.length>1||blank&&values.length||values.length===1&&norm(rendered)!==values[0]){conflicts.push({canonicalPath,field,reason:values.length>1?'duplicate_field_disagreement':blank?'partial_missing_duplicate':'rendered_record_disagreement',rendered,recordValues:records.map(r=>({id:r.id,value:r[field]||''}))});continue;}
   if(!rendered||/confirm product details/i.test(rendered)||!values.length){gaps.push({canonicalPath,field,reason:'unknown'});continue;}
   fact(doc,field,rendered,'');
  }
  for(const field of ['name','installationMethod','suitableUse','finish','warrantySummary','waterResistance','commercialSuitability','specSheetUrl']){const values=[...new Set(records.map(r=>norm(r[field])))];if(values.length>1)conflicts.push({canonicalPath,field,reason:'duplicate_field_disagreement',recordValues:records.map(r=>({id:r.id,value:r[field]||''}))});else if(!values[0])gaps.push({canonicalPath,field,reason:'unknown_not_inferred'});}
 }
 if(entityType!=='product'){
  const collected=new Set();let heading=title,section='';
  const walk=n=>{if(excludedNode(n)||n.tagName==='summary'||isFaqSection(n))return;
   if(['h2','h3'].includes(n.tagName)){heading=text(n);section=attr(n,'id');if(!section){let parent=n.parentNode;while(parent&&parent!==main){if(attr(parent,'id')){section=attr(parent,'id');break;}parent=parent.parentNode;}}return;}
   if(['p','li'].includes(n.tagName)){
    let parent=n.parentNode,card=false;while(parent&&parent!==main){if(/(?:product-card|range-summary-card|category-card|product-meta|button-row|breadcrumbs)/.test(attr(parent,'class')))card=true;parent=parent.parentNode;}if(card)return;
    const value=text(n);if(!value||value.length<25||collected.has(value))return;collected.add(value);
    const linkText=all(n,c=>c.tagName==='a').map(text).join(' ');if(norm(linkText)===norm(value)){gaps.push({canonicalPath,field:'paragraph',reason:'navigation_link_not_claim',contentHash:hash(value)});return;}
    if(risky.test(value)||privateText(value)){gaps.push({canonicalPath,field:'paragraph',heading,reason:'unreviewed_risk_or_private_text_suppressed',contentHash:hash(value)});return;}
    // A whole paragraph is the atomic evidence unit; never concatenate FAQs
    // or unrelated neighbouring cards into one selectable claim block.
    fact(doc,'guidance',value,section,'');return;
   }for(const child of n.childNodes||[])walk(child);
  };if(main)walk(main);
  // FAQ questions and complete answers stay together; risky pairs require review.
  for(const {question,answer,value}of extractFaqPairs(main||{},text))if(!risky.test(answer)&&!privateText(value)){const before=doc.facts.length;fact(doc,'faq',value,'','');if(doc.facts.length>before)doc.facts.at(-1).question=question;}
 }
 if(canonicalPath==='/projects/'){
  const projectData=json('data/projects.json'),imageManifest=json('data/project-image-manifest.json');
  doc.projectEvidence=reviewedProjectEvidence({data:projectData,manifest:imageManifest,html,readAsset:url=>{const file=url.slice(1);const bytes=fs.readFileSync(root+'/'+file);sourceFiles.set(file,hash(bytes));return bytes;}});
  for(const file of ['data/projects.json','data/project-image-manifest.json'])sourceFiles.set(file,hash(read(file)));
  fact(doc,'guidance',PROJECT_PHOTO_NOTICE,'featured-projects','');
 }
 docs.push(doc);ledger.push({canonicalPath,disposition:doc.facts.length>1?'included':'restricted',reason:doc.facts.length>1?'sanitised_candidate_facts':'identity_only_pending_claim_review',entityId:doc.entityId,entityType,facts:doc.facts.length});
}
// Business constants are parsed in a blank sandbox, never evaluated from a request.
const context={window:{}};vm.runInNewContext(read('assets/contact-config.js'),context,{timeout:500});const contact=context.window.OZ_TIMBER_FLOOR_CONTACT;
sourceFiles.set('assets/contact-config.js',hash(read('assets/contact-config.js')));
const contactDoc=docs.find(d=>d.canonicalPath==='/contact/');
for(const [field,value]of Object.entries({phone:contact.phoneDisplay,email:contact.email,showroom:contact.showroom})){if(typeof value==='string'&&read('contact.html').includes(value))fact(contactDoc,field,value,'','');else throw Error('Business contact mismatch: '+field);}
const physical=new Map(inventory.records.map(r=>[r.file,r]));
const ownerFiles=new Set(routes.map(route=>router.resolve(route).file));
for(const [file,r]of physical){if(ownerFiles.has(file))continue;ledger.push({file,canonicalPath:r.canonicalRoute||null,disposition:'excluded',reason:r.noindex?'noindex_hold_or_utility':'nonpublication_or_alias'});}
for(const rule of router.rules)if(rule.status>=300&&rule.status<400)ledger.push({canonicalPath:rule.from,disposition:'alias_only',reason:'redirect_not_entity_evidence',destination:rule.to,status:rule.status,line:rule.line,force:rule.force});
for(const retirement of policy.retirements){const resolved=router.resolve(retirement.path);if(resolved.status!==410)throw Error('Retirement status mismatch');ledger.push({canonicalPath:retirement.path,disposition:'retired',reason:'reviewed_discontinued_notice',expectedStatus:410});}
const candidateHash=hash([...sourceFiles].sort(([a],[b])=>a.localeCompare(b))),documents=docs.sort((a,b)=>a.canonicalPath.localeCompare(b.canonicalPath));
for(const doc of documents){doc.candidateHash=candidateHash;doc.chunks=[];for(let i=0;i<doc.facts.length;i+=4){const facts=doc.facts.slice(i,i+4);doc.chunks.push({chunkId:hash(facts).slice(0,24),heading:doc.title,contentHash:hash(facts),factIds:facts.map(f=>f.id),approvedFields:facts.map(f=>f.field),qualifiers:[...new Set(facts.map(f=>f.qualifier).filter(Boolean))]});}}
const corpus={schemaVersion:1,candidateHash,corpusVersion:hash(documents),documents,retirements:[...policy.retirements,...businessRetirements]};
if(privateText(JSON.stringify(documents)))throw Error('Private text survived sanitisation');
fs.writeFileSync(generated+'/corpus.json',JSON.stringify(corpus));
const counts={publication:routes.length,documents:documents.length,products:documents.filter(d=>d.entityType==='product').length,ranges:documents.filter(d=>d.entityType==='range').length,matchingProductRecords:[...groups.values()].flat().length,duplicateRouteGroups:[...groups.values()].filter(g=>g.length>1).length,facts:documents.reduce((n,d)=>n+d.facts.length,0),chunks:documents.reduce((n,d)=>n+d.chunks.length,0),conflicts:conflicts.length,gaps:gaps.length,dispositions:Object.fromEntries([...new Set(ledger.map(r=>r.disposition))].map(k=>[k,ledger.filter(r=>r.disposition===k).length]))};
fs.writeFileSync(generated+'/source-manifest.json',JSON.stringify({candidateHash,files:Object.fromEntries(sourceFiles),counts},null,2));
for(const [name,data]of Object.entries({'SOURCE_MANIFEST.json':{candidateHash,files:Object.fromEntries(sourceFiles),counts},'DISPOSITION_LEDGER.json':ledger,'FIELD_CONFLICTS.json':conflicts,'FIELD_GAPS.json':gaps,'PRIVATE_PROVENANCE.json':provenance}))fs.writeFileSync(report+'/'+name,JSON.stringify(data,null,2));
console.log(JSON.stringify({corpusVersion:corpus.corpusVersion,candidateHash,counts},null,2));
