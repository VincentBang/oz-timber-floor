// Narrow supplier-format evidence. GET only; patches are reviewed/applied separately.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import * as parse5 from 'parse5';
const out='docs/seo-growth/evidence/2026-10-28-exact-formats',read=f=>fs.readFileSync(f,'utf8'),json=f=>JSON.parse(read(f)),sha=s=>crypto.createHash('sha256').update(s).digest('hex');
const all=(n,f)=>[...(f(n)?[n]:[]),...(n.childNodes||[]).flatMap(c=>all(c,f))],attr=(n,k)=>n.attrs?.find(a=>a.name===k)?.value||'',text=n=>n?.nodeName==='#text'?n.value:(n?.childNodes||[]).filter(c=>!['script','style'].includes(c.tagName)).map(text).join(' ').replace(/\s+/g,' ').trim();
const norm=s=>s.toLowerCase().replace(/[^a-z0-9]/g,'');
const data=json('data/product-catalogue.json'),capture=json('docs/seo-growth/evidence/2026-10-28-four-suppliers/CAPTURE_PARSED.json');
if(process.argv[2]==='--capture'){
 fs.mkdirSync(out+'/raw',{recursive:true});assert(!fs.existsSync(out+'/PLAN.json'));
 const rows=[];
 for(const p of data.products.filter(p=>['Avala','Aqua Wood Plus 12mm'].includes(p.range))){
  const avala=p.range==='Avala';let urls;
  if(avala)urls=capture.records.flatMap(r=>r.blocks.filter(b=>b.name==='Avala').flatMap(b=>b.colours.filter(c=>norm(c.colour)===norm(p.colour)).map(c=>c.source)));
  else urls=capture.records.filter(r=>/aqua-wood-plus-12mm\//.test(r.url)).flatMap(r=>r.links.filter(l=>norm(l.label)===norm(p.colour)&&l.url.includes('/menu/')).map(l=>l.url.split('?')[0]));
  urls=[...new Set(urls)];assert.equal(urls.length,1,p.id);const url=urls[0];assert(['basstimber.com.au','topdeckflooring.com.au'].includes(new URL(url).hostname));
  const html=execFileSync('curl',['-f','-sS','-L','--max-time','45','--proto','=https','--proto-redir','=https',url],{encoding:'utf8',maxBuffer:10000000});
  const digest=sha(html),file=out+'/raw/'+digest+'.html';fs.writeFileSync(file,html,{flag:'wx'});
  const tree=parse5.parse(html),body=text(all(tree,n=>n.tagName==='main')[0]||tree),title=text(all(tree,n=>n.tagName==='h1')[0]);
  assert.equal(norm(title.replace(/\s*\(\d+\)$/,'')),norm(p.colour));
  let options=[],code='';
  if(avala){
   code=body.match(/Product Code:\s*(\d+)/)?.[1];assert(code);
   for(const width of [183,230]){
    const size=body.match(new RegExp('Dimensions \\('+width+'mm\\)\\s*(1524 x '+width+' x 6\\.5mm)'));
    const pack=body.match(new RegExp('Box Contains \\('+width+'mm\\)\\s*(\\d+\\.\\d+)m²\\s*\\/\\s*(\\d+)pcs'));
    assert(size&&pack,p.id+' width '+width);options.push({format:width+'mm plank',boardSize:size[1],packSizeM2:pack[1],piecesPerPack:Number(pack[2])});
   }
  }else{
   for(const m of body.matchAll(/(\d{3,4})x(\d{2,3})x(12)\s*\((Plank|Herringbone)\)/g)){
    const pack=body.match(new RegExp('(\\d+)pcs\\/(\\d+\\.\\d+)m\\s*2\\s*\\/box\\s*\\('+m[4]+'\\)'));
    assert(pack,p.id+' '+m[4]);options.push({format:m[4],boardSize:`${m[1]} x ${m[2]} x ${m[3]}mm`,packSizeM2:pack[2],piecesPerPack:Number(pack[1])});
   }assert.equal(options.length,/P&H/.test(p.colour)?2:1,p.id);
  }
  const formatSummary=options.map(o=>`${o.format}: ${o.boardSize}; ${o.packSizeM2} m² per pack (${o.piecesPerPack} pieces)`).join(' | ')+'. Confirm the chosen format and current stock before order.';
  const after={formatOptions:options,formatSummary};if(code)after.productCode=code;
  if(!p.boardSize)after.boardSize=options.map(o=>`${o.format}: ${o.boardSize}`).join(' or ');
  if(options.length===1&&!p.packSizeM2)after.packSizeM2=options[0].packSizeM2;
  const page=p.url.slice(1)+'index.html';fs.mkdirSync(path.dirname(out+'/before/'+page),{recursive:true});fs.copyFileSync(page,out+'/before/'+page);
  rows.push({id:p.id,route:p.url,source:url,sourceSha256:digest,file,title,after});console.log(p.id,options.length);
 }
 fs.copyFileSync('data/product-catalogue.json',out+'/before/catalogue.json');
 fs.writeFileSync(out+'/PLAN.json',JSON.stringify({at:new Date().toISOString(),scope:'Explicit format alternatives, not a selected SKU or stock guarantee; no retirement/indexation changes',rows},null,2),{flag:'wx'});process.exit(0);
}
const plan=json(out+'/PLAN.json');
if(process.argv[2]==='--patch'){
 const row=plan.rows[Number(process.argv[3])],before=data.products.find(p=>p.id===row.id);assert.equal(sha(read(row.file)),row.sourceSha256);
 const after={...before,...row.after},file=row.route.slice(1)+'index.html',html=read(file),tree=parse5.parse(html,{sourceCodeLocationInfo:true});
 const grid=all(tree,n=>attr(n,'class').split(' ').includes('spec-grid'))[0];assert(grid);const esc=s=>s.replaceAll('&','&amp;').replaceAll('<','&lt;');
 let next=html;const edits=[];
 for(const [field,label]of [['boardSize','Board size'],['packSizeM2','Pack size m²']])if(row.after[field]){
  const item=all(grid,n=>attr(n,'class')==='spec-item').find(n=>[label,field==='packSizeM2'?'Pack size':label].includes(text(all(n,c=>c.tagName==='span')[0])));
  if(item){const value=all(item,n=>n.tagName==='strong')[0],loc=value.sourceCodeLocation;assert(/confirm|^$|not specified/i.test(text(value))||text(value)===before[field]);edits.push({start:loc.startTag.endOffset,end:loc.endTag.startOffset,value:esc(row.after[field])});}
 }
 const end=grid.sourceCodeLocation.endTag.startOffset;edits.push({start:end,end,value:`<div class="spec-item"><span>Format options</span><strong>${esc(row.after.formatSummary)}</strong></div>`});
 for(const e of edits.sort((a,b)=>b.start-a.start))next=next.slice(0,e.start)+e.value+next.slice(e.end);
 const fmt=p=>JSON.stringify(p,null,2).split('\n').map(l=>'    '+l).join('\n'),hunk=(a,b)=>'@@\n'+a.split('\n').map(l=>'-'+l+'\n').join('')+b.split('\n').map(l=>'+'+l+'\n').join('');
 console.log('*** Begin Patch\n*** Update File: data/product-catalogue.json\n'+hunk(fmt(before)+',',fmt(after)+',')+'*** Update File: '+file+'\n'+hunk(html.trimEnd(),next.trimEnd())+'*** End Patch');
}
