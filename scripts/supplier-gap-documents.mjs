import fs from 'node:fs';import assert from 'node:assert/strict';
import {captureURL,evidenceDirectory} from './supplier-gap-capture.mjs';
const capture=JSON.parse(fs.readFileSync(evidenceDirectory+'/CAPTURE.json'));
const pages=capture.records.filter(r=>/preferencefloors.*\/brand\//.test(r.url));
const docs=pages.flatMap(r=>r.links.filter(l=>/\.pdf/i.test(l.url)&&/Brochure|Specification|Floating-Installation|Swish-Native/i.test(l.url)).map(l=>({url:l.url,referringPage:r.url})));
const native=capture.records.find(r=>r.url==='https://ecoflooring.com.au/product/blackbutt-natural/');for(const l of native.links.filter(l=>/Swish-Native.*\.pdf/i.test(l.url)))docs.push({url:l.url,referringPage:native.url});
const top=capture.records.find(r=>r.url==='https://topdeckflooring.com.au/pages/resources');for(const l of top.links.filter(l=>/ARTISAN|HYBRID_-_VOC_E0/i.test(l.url)))docs.push({url:l.url,referringPage:top.url});
const index=JSON.parse(fs.readFileSync(evidenceDirectory+'/PREFERENCE_INDEX.json'));for(const p of index.all__floor.filter(p=>p.brand==='Select Australian Timber'||p.brand==='Aspire RCB'&&p.title==='Warm Springs'))docs.push({url:p.permalink,referringPage:'https://preferencefloors.com.au/floor-type/'});
assert(!fs.existsSync(evidenceDirectory+'/DOCUMENT_CAPTURE.json'));const records=[];for(const d of [...new Map(docs.map(d=>[d.url,d])).values()]){try{const r=await captureURL(d.url);records.push({...r,referringPage:d.referringPage});console.log(r.status,d.url);}catch(e){records.push({...d,status:0,error:e.message});}}fs.writeFileSync(evidenceDirectory+'/DOCUMENT_CAPTURE.json',JSON.stringify({at:new Date().toISOString(),records},null,2),{flag:'wx'});
