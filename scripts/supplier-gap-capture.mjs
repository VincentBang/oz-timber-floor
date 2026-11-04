import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {parse} from 'parse5';

export const evidenceDirectory='docs/seo-growth/evidence/2026-11-03-supplier-gaps';
export const digest=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
export const walk=node=>[node,...(node.childNodes||[]).flatMap(walk)];
export const attr=(node,key)=>node.attrs?.find(a=>a.name===key)?.value||'';
export const text=node=>node.nodeName==='#text'?node.value:(node.childNodes||[]).filter(n=>!['script','style'].includes(n.tagName)).map(text).join(' ').replace(/\s+/g,' ').trim();
export function preferenceIndex(html){
 const script=walk(parse(html)).filter(n=>n.tagName==='script').map(n=>(n.childNodes||[]).map(c=>c.value||'').join('')).find(s=>s.includes('window.preferencefloor = '));
 assert(script,'Missing exact supplier filter data');return JSON.parse(script.slice(script.indexOf('{'),script.lastIndexOf('}')+1));
}
export function pageEvidence(html,url){
 const nodes=walk(parse(html)),main=nodes.find(n=>n.tagName==='main')||nodes.find(n=>n.tagName==='body'),inside=walk(main),fields={};
 for(const button of inside.filter(n=>n.tagName==='button'&&n.parentNode)){const siblings=button.parentNode.childNodes,i=siblings.indexOf(button),panel=siblings.slice(i+1).find(n=>n.tagName);if(panel&&attr(panel,'class').split(/\s/).includes('panel'))fields[text(button)]=text(panel);}
 return{title:text(inside.find(n=>n.tagName==='h1')||main),fields,text:text(main),links:inside.filter(n=>n.tagName==='a'&&attr(n,'href')).map(n=>({label:text(n),url:new URL(attr(n,'href'),url).href})),images:inside.filter(n=>n.tagName==='img').map(n=>({alt:attr(n,'alt'),src:attr(n,'data-src')||attr(n,'src'),srcset:attr(n,'srcset'),full:attr(n,'data-large_image')}))};
}
const hosts=new Set(['preferencefloors.com.au','www.preferencefloors.com.au','ecoflooring.com.au','www.ecoflooring.com.au','topdeckflooring.com.au','www.topdeckflooring.com.au','cdn.shopify.com','i0.wp.com']);
export async function captureURL(url,out=evidenceDirectory){
 assert(hosts.has(new URL(url).hostname),'Unapproved capture host');const response=await fetch(url,{signal:AbortSignal.timeout(35000)});assert(hosts.has(new URL(response.url).hostname),'Unexpected redirect host');const bytes=Buffer.from(await response.arrayBuffer()),sha256=digest(bytes),type=response.headers.get('content-type')||'',ext=type.includes('pdf')?'pdf':type.includes('image')?'image':type.includes('json')?'json':'html',file=path.join(out,'raw',sha256+'.'+ext);fs.mkdirSync(path.dirname(file),{recursive:true});if(!fs.existsSync(file))fs.writeFileSync(file,bytes,{flag:'wx'});
 return{url,finalUrl:response.url,status:response.status,at:new Date().toISOString(),contentType:type,sha256,file,bytes:bytes.length,...(ext==='html'&&response.ok?pageEvidence(bytes.toString(),response.url):{})};
}
if(process.argv[1]===new URL(import.meta.url).pathname){
 const out=process.env.OZ_SUPPLIER_GAP_DIR||evidenceDirectory;assert(!fs.existsSync(out+'/CAPTURE.json'),'Preserve prior captures');
 const initial=['https://preferencefloors.com.au/floor-type/','https://preferencefloors.com.au/brand/hybrid-flooring-aspire-rcb/','https://preferencefloors.com.au/brand/oakleaf-hd-plus/','https://preferencefloors.com.au/brand/pronto-engineered-oak-flooring/','https://preferencefloors.com.au/brand/select-australian-timber/','https://preferencefloors.com.au/brand/elk-falls-hickory/','https://ecoflooring.com.au/product-category/bamboo/swish-native-hardwood/','https://ecoflooring.com.au/technical-information/','https://topdeckflooring.com.au/pages/resources','https://topdeckflooring.com.au/pages/hybrid-planks-topdeck-flooring-au'];
 const records=[],seen=new Set(),queue=[...initial];let next=0;
 async function worker(){while(next<queue.length){const url=queue[next++];if(seen.has(url))continue;seen.add(url);try{const record=await captureURL(url,out);records.push(record);console.log(record.status,url);if(url===initial[0]&&record.status===200){const index=preferenceIndex(fs.readFileSync(record.file,'utf8'));fs.writeFileSync(out+'/PREFERENCE_INDEX.json',JSON.stringify(index,null,2));const colours=new Set(['barn oak','buckskin','homestead','homstead','pale gorge','qld spotted gum','tempest','tumbleweed','twilight mist','warm spring','bellmore oak','hampton oak','windsor','chesterfield','dockside','herringbone chesterfield','herringbone parchment','herringbone seafoam','herringbone washed pebble','parchment','portofino','river sand','seafoam','washed pebble','welsh slate','blackbutt','jarrah','spotted gum','sydney blue gum','select blackbutt','select jarrah','select spotted gum','select sydney blue gum']);for(const p of index.all__floor)if(colours.has(p.title?.toLowerCase())&&/Aspire|Oakleaf HD|Pronto|Hardwood Collection|Select Australian/i.test(p.brand))queue.push(p.permalink);}if(url===initial[6])for(const link of record.links||[])if(/\/product\//.test(link.url))queue.push(link.url);}catch(error){records.push({url,status:0,error:error.message});console.log('UNAVAILABLE',url);}}}
 await Promise.all(Array.from({length:3},worker));fs.writeFileSync(out+'/CAPTURE.json',JSON.stringify({at:new Date().toISOString(),records},null,2),{flag:'wx'});console.log({captured:records.length,failures:records.filter(r=>r.status!==200).length});
}
