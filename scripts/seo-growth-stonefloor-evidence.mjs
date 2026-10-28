// Public supplier collection evidence only; absence is NOT retirement authority.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {parse} from 'parse5';
const out=path.resolve(process.argv[2]);assert(!fs.existsSync(out),'Preserve previous evidence');fs.mkdirSync(out,{recursive:true});
const reports=[];
for(const [family,url] of [['tile','https://stonefloor.com.au/tile-and-marble-design/'],['timber','https://stonefloor.com.au/timber-design/']]){
 const r=await fetch(url,{signal:AbortSignal.timeout(30000)});assert.equal(r.status,200);assert.equal(new URL(r.url).hostname,'stonefloor.com.au');const html=await r.text();
 fs.writeFileSync(out+'/'+family+'.html',html,{flag:'wx'});
 const products=new Map(),text=n=>(n.childNodes||[]).map(c=>c.nodeName==='#text'?c.value:text(c)).join(' ').replace(/\s+/g,' ').trim();
 function visit(n){if(n.tagName==='a'){const href=n.attrs.find(a=>a.name==='href')?.value||'';const u=new URL(href,url);if(u.hostname==='stonefloor.com.au'&&/^\/shop\/[^/]+\/$/.test(u.pathname)&&!u.search){const label=text(n);if(label)products.set(u.href,label);}}for(const c of n.childNodes||[])visit(c);}visit(parse(html));
 const names=[...new Set(products.values())];
 reports.push({family,url:r.url,at:new Date().toISOString(),status:r.status,sha256:crypto.createHash('sha256').update(html).digest('hex'),products:[...products].map(([url,name])=>({url,name})),exactLegacyMatches:Object.fromEntries(['Stone Oak','White Wash'].map(name=>[name,names.some(n=>n.toLowerCase()===name.toLowerCase())])),absenceIsNotDiscontinuation:true});
}
fs.writeFileSync(out+'/SUPPLIER_COLLECTIONS.json',JSON.stringify({at:new Date().toISOString(),reports,retirementApproval:false,websiteChanges:0},null,2),{flag:'wx'});
console.log(JSON.stringify(reports,null,2));
