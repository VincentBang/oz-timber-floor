import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';import{parse}from'parse5';
const root=process.cwd(),base=process.argv[2],out=process.argv[3];if(!base||!out)throw Error('Provide immutable baseline directory and external report path');
const attr=(n,k)=>n.attrs?.find(a=>a.name===k)?.value;
const all=(n,test,out=[])=>{if(test(n))out.push(n);for(const c of n.childNodes||[])all(c,test,out);return out;};
const text=n=>n.nodeName==='#text'?n.value:(n.childNodes||[]).map(text).join(' ');
const norm=s=>s.replace(/\s+/g,' ').trim(),sort=v=>v.map(x=>JSON.stringify(x)).sort();
const hash=f=>crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');
function facts(file){const dom=parse(fs.readFileSync(file,'utf8'));const body=all(dom,n=>n.tagName==='body')[0];const main=all(dom,n=>n.tagName==='main')[0];return{
 title:all(dom,n=>n.tagName==='title').map(n=>norm(text(n))),metadata:sort(all(dom,n=>n.tagName==='meta'||n.tagName==='link'&&attr(n,'rel')==='canonical').map(n=>Object.fromEntries(n.attrs.map(a=>[a.name,a.value])))),
 headings:sort(all(dom,n=>/^h[1-6]$/.test(n.tagName)).map(n=>[n.tagName,norm(text(n))])),
 schema:sort(all(dom,n=>n.tagName==='script'&&attr(n,'type')==='application/ld+json').map(n=>JSON.parse(text(n)))),
 links:sort(all(body,n=>n.tagName==='a'&&!(attr(n,'class')||'').includes('skip-link')).map(n=>[attr(n,'href'),norm(text(n))])),
 forms:sort(all(body,n=>['form','input','select','textarea','option'].includes(n.tagName)).map(n=>[n.tagName,sort((n.attrs||[]).filter(a=>!['class','style'].includes(a.name)))])),
 text:sort(all(main||body,n=>n.nodeName==='#text'&&!['script','style'].includes(n.parentNode?.tagName)&&norm(n.value)).map(n=>norm(n.value)).filter(s=>!['A beautiful floor.','A considered','beginning.','More product photos','More enquiry options','Flooring inspiration','Material image'].includes(s))),
 images:sort(all(body,n=>n.tagName==='img').map(n=>[attr(n,'src'),attr(n,'alt'),attr(n,'srcset')])),
 anchors:sort(all(body,n=>attr(n,'id')&&attr(n,'id')!=='main-content').map(n=>attr(n,'id'))),
 family:attr(body,'data-editorial-family')||'redirect/verification'
};}
const files=[];function walk(dir,rel=''){for(const e of fs.readdirSync(dir,{withFileTypes:true})){if(e.name.startsWith('.')||['node_modules','dist','docs','assistant','data','migration'].includes(e.name))continue;const r=rel?rel+'/'+e.name:e.name;if(e.isDirectory())walk(path.join(dir,e.name),r);else if(e.name.endsWith('.html'))files.push(r);}}walk(base);
const diffs=[],coverage={};for(const f of files){const a=facts(path.join(base,f)),b=facts(path.join(root,f));coverage[b.family]=(coverage[b.family]||0)+1;for(const k of ['title','metadata','headings','schema','links','forms','text','images','anchors'])if(JSON.stringify(a[k])!==JSON.stringify(b[k]))diffs.push({file:f,field:k,before:a[k],after:b[k]});}
const protectedFiles=['_redirects','sitemap.xml','robots.txt','netlify.toml','assets/contact-config.js','assets/site.js','assets/flooring-assistant-config.js','assets/flooring-assistant.js','assets/flooring-assistant-handoff.js','data/product-catalogue.json','data/catalogue-quality-overrides.json','data/projects.json','assistant/config/production.json','assistant/config/paid-preview.json'];
const protectedDiffs=protectedFiles.filter(f=>hash(path.join(base,f))!==hash(path.join(root,f)));
const result={htmlFiles:files.length,coverage,semanticDifferences:diffs,protectedDifferences:protectedDiffs,approvedAdditions:['visible home editorial display paragraph; original H1 unchanged','skip link and main focus target','native more-photo/enquiry/inspiration disclosure labels'],pass:!diffs.length&&!protectedDiffs.length};fs.writeFileSync(out,JSON.stringify(result,null,2));console.log(JSON.stringify({files:files.length,coverage,differences:diffs.map(d=>({file:d.file,field:d.field})),protectedDiffs,pass:result.pass}));if(!result.pass)process.exitCode=1;
