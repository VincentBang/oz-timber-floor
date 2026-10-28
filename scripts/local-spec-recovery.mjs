// Emits exact patches; archives pre-change evidence separately. Never fetches.
import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import * as parse5 from 'parse5';
import {hash} from '../assistant/lib/security.mjs';
const source='docs/migration-october-2026-followup/supplier/product-specifications.json',bytes=fs.readFileSync(source);
assert.equal(hash(bytes),'e49283aadf30f55057043edc8203b4dc583f8e5a570f5cc46685aa0cbf21afa4');
const evidence=JSON.parse(bytes),data=JSON.parse(fs.readFileSync('data/product-catalogue.json')),out='docs/seo-growth/evidence/2026-10-28-local-spec-recovery';assert.equal(evidence.length,21);
const all=(n,fn)=>[...(fn(n)?[n]:[]),...(n.childNodes||[]).flatMap(c=>all(c,fn))],text=n=>n?.nodeName==='#text'?n.value:(n?.childNodes||[]).map(text).join('').trim();
const attr=(n,k)=>n.attrs?.find(a=>a.name===k)?.value||'';
const norm=s=>String(s).toLowerCase().replace(/[^a-z0-9]/g,'');
const projections=evidence.map(e=>{const p=data.products.find(p=>p.id===e.record);assert(p);assert.equal(e.status,200);assert.equal(new URL(e.url).hostname,'ecoflooring.com.au');assert.equal(e.checkedAt.slice(0,10),'2026-10-07');assert.equal(norm(p.colour),norm(e.title));assert.equal(p.thickness,e.fields.Thickness);assert.equal(data.products.filter(r=>r.url===p.url).length,1);assert(/^\d+(?:\.\d+)?mm$/.test(e.fields.Length));assert(/^\d+(?:\.\d+)?mm$/.test(e.fields.Width));const pack=e.fields['Pack Size'].match(/^(\d+(?:\.\d+)?)\s*m2$/);assert(pack);return {id:p.id,route:p.url,boardSize:`Length ${e.fields.Length} x Width ${e.fields.Width}`,packSizeM2:pack[1],finish:e.fields['Surface Finish']||'',evidenceDate:e.checkedAt,sourceSha256:e.sha256};});
if(process.argv.includes('--finish-plan')){fs.writeFileSync(out+'/FINISH_ADDENDUM.json',JSON.stringify(projections.filter(p=>p.finish).map(p=>({id:p.id,finish:p.finish,evidenceDate:p.evidenceDate})),null,2),{flag:'wx'});process.exit(0);}
if(process.argv.includes('--before')){
 fs.mkdirSync(out,{recursive:true});const files=['data/product-catalogue.json',...projections.map(p=>p.route.slice(1)+'index.html')];
 for(const file of files){fs.mkdirSync(path.dirname(out+'/before/'+file),{recursive:true});fs.copyFileSync(file,out+'/before/'+file);}
 fs.writeFileSync(out+'/RECOVERY_PLAN.json',JSON.stringify({source,sourceFileSha256:hash(bytes),projections,scope:'Fill blank boardSize/packSizeM2 only; preserve known values, membership, indexation and SEO metadata'},null,2),{flag:'wx'});console.log(JSON.stringify({products:projections.length,missingBoard:projections.filter(e=>!data.products.find(p=>p.id===e.id).boardSize).length,missingPack:projections.filter(e=>!data.products.find(p=>p.id===e.id).packSizeM2).length}));process.exit(0);
}
const id=process.argv[2],item=projections.find(e=>e.id===id);assert(item,'Pass one exact reviewed product ID');const before=data.products.find(p=>p.id===id),after=structuredClone(before);assert(!Object.keys(before).some(k=>/price|cost|margin/i.test(k)));
const fields=['boardSize','packSizeM2',...(item.finish?['finish']:[])];
for(const field of fields){if(!after[field])after[field]=item[field];else assert.equal(norm(after[field]),norm(item[field]));}
const file=item.route.slice(1)+'index.html',original=fs.readFileSync(file,'utf8');let html=original;
const tree=parse5.parse(html,{sourceCodeLocationInfo:true}),grid=all(tree,n=>attr(n,'class').split(' ').includes('spec-grid'))[0];assert(grid?.sourceCodeLocation);
const labels={boardSize:'Board size',packSizeM2:'Pack size m²',finish:'Finish'},insert=[];
for(const field of fields){
 const node=all(grid,n=>attr(n,'class').split(' ').includes('spec-item')).find(n=>[labels[field],field==='packSizeM2'?'Pack size':labels[field]].includes(text(all(n,c=>c.tagName==='span')[0])));
 if(node){const value=all(node,n=>n.tagName==='strong')[0],old=text(value);if(/confirm|not specified|unknown|^$/i.test(old)){const loc=value.sourceCodeLocation;insert.push({start:loc.startTag.endOffset,end:loc.endTag.startOffset,value:after[field]});}else assert.equal(norm(old),norm(after[field]));}
 else insert.push({start:grid.sourceCodeLocation.endTag.startOffset,end:grid.sourceCodeLocation.endTag.startOffset,value:`<div class="spec-item"><span>${labels[field]}</span><strong>${after[field]}</strong></div>`});
}
for(const change of insert.sort((a,b)=>b.start-a.start))html=html.slice(0,change.start)+change.value+html.slice(change.end);
const hunk=(a,b)=>'@@\n'+a.split('\n').map(l=>'-'+l+'\n').join('')+b.split('\n').map(l=>'+'+l+'\n').join('');let patch='*** Begin Patch\n';
if(JSON.stringify(before)!==JSON.stringify(after)){const format=p=>JSON.stringify(p,null,2).split('\n').map(l=>'    '+l).join('\n'),raw=fs.readFileSync('data/product-catalogue.json','utf8'),suffix=raw.includes(format(before)+',')?',':'';assert(raw.includes(format(before)+suffix));patch+='*** Update File: data/product-catalogue.json\n'+hunk(format(before)+suffix,format(after)+suffix);}
if(html!==original)patch+='*** Update File: '+file+'\n'+hunk(original.trimEnd(),html.trimEnd());
console.log(patch+'*** End Patch');
