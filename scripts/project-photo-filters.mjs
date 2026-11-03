// Presentation-only photo filters. Project facts and their approval remain intact.
import fs from'node:fs';import path from'node:path';import{fileURLToPath}from'node:url';import assert from'node:assert/strict';import{parse}from'parse5';import{hash}from'../assistant/lib/security.mjs';import{PROJECT_RECORD_HASH}from'../assistant/lib/project-knowledge.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),bytes=fs.readFileSync(root+'/data/projects.json'),data=JSON.parse(bytes);
assert.equal(hash(data),PROJECT_RECORD_HASH,'Reviewed project records changed: review photo filters before rebuilding');
const records=new Map(data.projects.flatMap(p=>p.photos.map(photo=>[p.id+'/'+photo.id,{project:p,photo}])));
// Narrow only the mixed-stage/mixed-subject projects, using their unchanged
// approved captions, alt text and local photographs. No category is invented.
const photoTags=Object.freeze({
 'herringbone-timber-stairs/kitchen-living':['herringbone','engineered'],
 'herringbone-timber-stairs/timber-stair':['engineered','stairs'],
 'hybrid-preparation/finished-living':['hybrid'],
 'hybrid-preparation/finished-bedroom':['hybrid'],
 'hybrid-preparation/removal':['preparation'],
 'hybrid-preparation/preparation':['preparation'],
 'hybrid-preparation/levelled-living':['preparation']
});
export function projectPhotoTags(project,photo){const key=project.id+'/'+photo.id,approved=records.get(key);assert(approved,'Unknown approved photo');assert.deepEqual(project.tags,approved.project.tags,'Project category drift');for(const key of['source','alt','caption'])assert.equal(photo[key],approved.photo[key],'Photo evidence drift');const selected=photoTags[key]||project.tags;assert(selected.length&&selected.every(t=>approved.project.tags.includes(t)),'Cannot add unapproved categories');return [...selected];}
const walk=n=>[n,...(n.childNodes||[]).flatMap(walk)],attr=(n,k)=>n.attrs?.find(a=>a.name===k)?.value;
export function projectPhotoFilterHTML(html){const assets=JSON.parse(fs.readFileSync(root+'/data/project-image-manifest.json')),nodes=walk(parse(html,{sourceCodeLocationInfo:true})),edits=[];let photos=0;for(const n of nodes.filter(n=>attr(n,'data-project-tags')!==undefined)){const link=walk(n).find(c=>c.tagName==='a'&&attr(c,'data-project-photo')!==undefined),asset=assets.photos.find(a=>a.variants.some(v=>v.url===attr(link,'href')));assert(asset,'Unknown rendered project photo');const {project,photo}=records.get(asset.projectId+'/'+asset.photoId);assert.equal(attr(link,'data-caption'),photo.caption);const tags=projectPhotoTags(project,photo).join(' '),loc=n.sourceCodeLocation.startTag,tag=html.slice(loc.startOffset,loc.endOffset);photos++;if(tags!==attr(n,'data-project-tags'))edits.push({start:loc.startOffset,end:loc.endOffset,text:tag.replace(/data-project-tags="[^"]*"/,'data-project-tags="'+tags+'"')});}assert.equal(photos,17,'Expected all 17 approved photographs');for(const e of edits.sort((a,b)=>b.start-a.start))html=html.slice(0,e.start)+e.text+html.slice(e.end);return{html,photos,changed:edits.length};}
export function applyProjectPhotoFilters(){const result=[];for(const file of['projects.html','projects/index.html']){const before=fs.readFileSync(root+'/'+file,'utf8'),after=projectPhotoFilterHTML(before);if(before!==after.html)fs.writeFileSync(root+'/'+file,after.html);result.push({file,photos:after.photos,changed:after.changed});}return result;}
if(process.argv[1]===fileURLToPath(import.meta.url))console.log(JSON.stringify(applyProjectPhotoFilters(),null,2));
