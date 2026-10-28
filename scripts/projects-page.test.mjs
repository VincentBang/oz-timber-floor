import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {createRequire} from 'node:module';
import {htmlFacts} from './seo-growth-health.mjs';
import {priorityRoutes,readImageSize} from './image-dimension-audit.mjs';
const read=f=>fs.readFileSync(f,'utf8'),sha=f=>crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');
const data=JSON.parse(read('data/projects.json')),assets=JSON.parse(read('docs/projects-redesign/evidence/ASSETS.json'));
test('one approved source, seventeen real photos; no invented project identities',()=>{
 assert.equal(data.projects.length,7);assert.equal(assets.photos.length,17);assert.equal(new Set(data.projects.map(p=>p.id)).size,7);
 for(const p of data.projects){assert.equal(p.publicApproved,true);assert.equal(p.location,'Sydney');assert(!p.description.includes('Operon'));assert(p.photos.length);for(const photo of p.photos)assert(assets.photos.some(a=>a.projectId===p.id&&a.photoId===photo.id));}
});
test('canonical owner, metadata, visible FAQ schema and unmodified navigation/footer',()=>{
 for(const file of ['projects.html','projects/index.html']){
  const html=read(file),before=read('docs/projects-redesign/evidence/before/'+file),f=htmlFacts(html);
  assert.equal(f.titles.length,1);assert.equal(f.h1s.length,1);assert.equal(f.descriptions.length,1);assert.deepEqual(f.canonicals,['https://oztimberfloor.com.au/projects/']);assert(!f.robots.join(',').includes('noindex'));
  assert.equal(html.match(/<header[\s\S]*?<\/header>/)[0],before.match(/<header[\s\S]*?<\/header>/)[0]);assert.equal(html.match(/<footer[\s\S]*?<\/footer>/)[0],before.match(/<footer[\s\S]*?<\/footer>/)[0]);
  for(const field of ['canonicals','robots','verification'])assert.deepEqual(f[field],htmlFacts(before)[field]);
  const faq=f.schema.flatMap(s=>s.value?.['@graph']||[]).find(s=>s['@type']==='FAQPage');assert.equal(faq.mainEntity.length,5);for(const q of faq.mainEntity){assert(html.includes('<summary>'+q.name+'</summary>'));assert(html.includes(q.acceptedAnswer.text));}
  assert.equal((html.match(/data-project-tags=/g)||[]).length,17);assert(!html.includes('operonflooring.com.au'));assert(html.includes('enquiry=supply-install&amp;source=projects'));
 }
});
test('responsive images are decodable, orientation-correct and original files unchanged',async()=>{
 const sharp=createRequire(import.meta.url)('/Users/daibang/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
 for(const asset of assets.photos){assert.equal(sha(asset.sourcePath),asset.sourceSha256);for(const v of asset.variants){const m=await sharp('.'+v.url).metadata();assert.equal(m.format,'webp');assert.equal(m.width,v.width);assert(Math.abs(m.height-v.height)<=1);assert(!m.orientation);assert(!m.exif);assert.equal(sha('.'+v.url),v.sha256);}}
});
test('approved filters have actual entries and all photographs exist without JavaScript',()=>{
 const html=read('projects/index.html');
 for(const tag of ['herringbone','chevron','engineered','hybrid','stairs','preparation']){assert(data.projects.some(p=>p.tags.includes(tag)));assert(html.includes('data-project-filter="'+tag+'"'));}
 assert.equal((html.match(/data-project-photo /g)||[]).length,17);assert(html.includes('data-project-filters hidden'));assert(!html.includes('fetch('));
 const hero=html.match(/<figure class="portfolio-hero-photo">([\s\S]*?)<\/figure>/)[1];assert(hero.includes('loading="eager"'));assert(hero.includes('fetchpriority="high"'));
 assert(hero.includes(priorityRoutes.find(p=>p.route==='/projects/').primarySrc));
 for(const match of html.matchAll(/<img\b[^>]*src="(\/assets\/images\/projects\/[^\"]+)"[^>]*width="(\d+)" height="(\d+)"[^>]*>/g)){const size=readImageSize('.'+match[1]);assert.equal(Number(match[2]),size.width);assert.equal(Number(match[3]),size.height);}
});
test('global protected source hashes remain unchanged',()=>{
 const b=JSON.parse(read('docs/projects-redesign/evidence/BASELINE.json'));for(const f of b.protectedFiles)assert.equal(sha(f.file),f.sha256,f.file);
});
