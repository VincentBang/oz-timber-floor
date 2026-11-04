// Explicit one-preview assembly, separate from default/production build gates.
import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import crypto from 'node:crypto';
import {addFloorPlan,checkFloorPlan} from './floor-plan-package.mjs';
export const siteId='fd68e39e-7863-4012-8a97-40bec59b23d9';
export function validatePreview({origin,site,protectedContext,productionDeployId}){
 assert.equal(site,siteId);assert.equal(protectedContext,'non_production');assert(/^[a-f0-9]{24}$/.test(productionDeployId));
 assert(/^https:\/\/floorplan-[a-f0-9]{12}--oztimberfloor\.netlify\.app$/.test(origin),'Exact floorplan-only draft alias required');
 return true;
}
export function assemblePreview({root,source,output,...binding}){
 validatePreview(binding);root=path.resolve(root);source=path.resolve(source);output=path.resolve(output);
 assert(!output.startsWith(root+'/')&&!root.startsWith(output+'/')&&output!==root,'Output must be isolated');
 assert(!fs.existsSync(output),'Never overwrite a package');checkFloorPlan(source,false);
 const read=p=>fs.readFileSync(source+'/'+p,'utf8');assert(/X-Robots-Tag:\s*noindex, nofollow/.test(read('_headers')));assert(/ga4MeasurementId:\s*null/.test(read('assets/contact-config.js')));assert(/enabled:\s*false/.test(read('assets/flooring-assistant-config.js')));
 fs.cpSync(source,output,{recursive:true});addFloorPlan(root,output);
 const origin=JSON.stringify(binding.origin),guard=`if(location.origin!==${origin}){throw new Error('This floorplan package is restricted to its approved protected preview.');}\n`;
 const tool=output+'/floor-plan/tool.mjs';fs.writeFileSync(tool,guard+fs.readFileSync(tool,'utf8'));
 const adapter=output+'/floor-plan/contact-entry.js';fs.writeFileSync(adapter,`if(location.origin===${origin}){\n`+fs.readFileSync(adapter,'utf8')+'\n}\n');
 fs.writeFileSync(output+'/floor-plan/preview-safety.js',`document.addEventListener('submit',event=>{event.preventDefault();event.stopImmediatePropagation();},true);\ndocument.addEventListener('DOMContentLoaded',()=>{const form=document.querySelector('form[name="oz-flooring-enquiry"]');if(!form)return;for(const button of form.querySelectorAll('[type="submit"]')){button.disabled=true;button.title='Protected preview: enquiry submission disabled';}const note=document.createElement('p');note.id='floorplan-preview-notice';note.textContent='Protected preview — enquiry submission is disabled. You can review the floor-area handoff without sending an enquiry.';form.prepend(note);});\n`);
 for(const file of ['contact.html','contact/index.html']){const p=output+'/'+file,h=fs.readFileSync(p,'utf8');assert.equal(h.split('</head>').length,2);fs.writeFileSync(p,h.replace('</head>','<script defer src="/floor-plan/preview-safety.js"></script></head>'));}
 checkFloorPlan(output,true);
 const files={};const walk=(dir,prefix='')=>{for(const e of fs.readdirSync(dir,{withFileTypes:true})){const p=prefix+e.name;if(e.isDirectory())walk(dir+'/'+e.name,p+'/');else{assert(!e.isSymbolicLink());assert(!/^(?:scripts|docs|assistant|netlify|node_modules|\.env|\.git|fixtures|samples)(?:\/|$)/.test(p),'Private/QA file in package');files[p]=crypto.createHash('sha256').update(fs.readFileSync(dir+'/'+e.name)).digest('hex');}}};walk(output);
 return{...binding,files,functions:[],paidCallsEnabled:false,submissionsEnabled:false,productionActivationApproved:false};
}
