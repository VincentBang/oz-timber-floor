import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
export function routing(publish){
 publish=path.resolve(publish);
 const url=route=>new URL(route.startsWith('/')?'https://oztimberfloor.com.au'+route:route,'https://oztimberfloor.com.au');
 const rules=fs.readFileSync(publish+'/_redirects','utf8').split(/\r?\n/).flatMap((l,i)=>{
  if(!l.trim()||l.trim().startsWith('#'))return[];const [from,to,code='301',...conditions]=l.trim().split(/\s+/);assert.equal(conditions.length,0);
  return [{from,to,status:parseInt(code),force:code.endsWith('!'),line:i+1}];
 });
 function physical(route){
  let rel;try{rel=decodeURIComponent(url(route).pathname).slice(1);}catch{return null;}
  return [rel||'index.html',rel.replace(/\/$/,'')+'/index.html',rel.replace(/\/$/,'')+'.html'].find(f=>{const p=path.resolve(publish,f);return p.startsWith(publish+'/')&&fs.existsSync(p)&&fs.statSync(p).isFile();})||null;
 }
 function step(route){
  const u=url(route),p=u.pathname,file=physical(route);
  const r=rules.find(r=>r.from.includes('*')?p.startsWith(r.from.slice(0,r.from.indexOf('*'))):r.from.replace(/\/$/,'')===p.replace(/\/$/,''));
  if(r&&(!file||r.force)){const dest=r.to.replace(':splat',r.from.includes('*')?p.slice(r.from.indexOf('*')):'');return {...r,destination:dest,file:r.status>=300&&r.status<400?null:physical(dest)};}
  return {status:file?200:404,file,destination:p};
 }
 function resolve(route){let cur=route,trail=[];const seen=new Set();for(let n=0;n<20;n++){if(seen.has(cur))return {loop:true,status:0,hops:trail.length,destination:cur,trail};seen.add(cur);const r=step(cur);if(r.status>=300&&r.status<400){trail.push(r);cur=r.destination;}else return {...r,loop:false,hops:trail.length,destination:url(cur).pathname,trail};}return {loop:true,status:0,hops:trail.length,destination:cur,trail};}
 return {rules,physical,step,resolve};
}
