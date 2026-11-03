import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {parse} from 'parse5';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const walk=n=>[n,...(n.childNodes||[]).flatMap(walk)],a=(n,k)=>n.attrs?.find(x=>x.name===k)?.value,has=(n,c)=>(a(n,'class')||'').split(/\s+/).includes(c),text=n=>n.nodeName==='#text'?n.value:(n.childNodes||[]).map(text).join('');

test('explicit process numbers do not acquire a second decorative counter',()=>{
 const css=fs.readFileSync(root+'/assets/editorial-gallery.css','utf8');
 const rule=css.match(/body\.editorial\s+\.process-step:has\(>\s*\.insight-label\)::before\s*\{([^}]+)\}/);
 assert(rule,'Suppress only the redundant pseudo-element when the original numbered label exists');
 assert.equal(rule[1].trim(),'content:none','Do not restyle or remove the actual number, instructions or card geometry');
 assert.match(fs.readFileSync(root+'/assets/site.css','utf8'),/\.process-step::before\s*\{\s*counter-increment:\s*process-step;\s*content:\s*counter\(process-step\)/,'Retain fallback counters for cards without an explicit label');
});

test('current process instructions retain one explicit number per step in source order',()=>{
 const files=[];function visit(dir){for(const e of fs.readdirSync(dir,{withFileTypes:true})){if(e.name.startsWith('.')||['node_modules','dist','docs','assistant','assets','data','config','migration'].includes(e.name))continue;const p=dir+'/'+e.name;if(e.isDirectory())visit(p);else if(e.name.endsWith('.html'))files.push(p);}}visit(root);
 let checked=0;for(const file of files){const nodes=walk(parse(fs.readFileSync(file,'utf8')));for(const group of nodes.filter(n=>has(n,'process-steps'))){const steps=(group.childNodes||[]).filter(n=>has(n,'process-step'));for(const [i,step] of steps.entries()){const labels=(step.childNodes||[]).filter(n=>has(n,'insight-label'));assert.equal(labels.length,1,file);assert.equal(text(labels[0]).trim(),String(i+1),file);assert(walk(step).some(n=>n.tagName==='h3'&&text(n).trim()));assert(walk(step).some(n=>n.tagName==='p'&&text(n).trim()));checked++;}}}
 assert(checked>0,'The regression must exercise real numbered process cards');
});
