import fs from 'node:fs';
import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {recordedPackAnswer} from '../lib/recorded-pack.mjs';
const root=new URL('../../',import.meta.url).pathname,load=f=>JSON.parse(fs.readFileSync(root+f));
const rows=load('docs/seo-growth/evidence/2026-10-28-exact-formats/PLAN.json').rows,data=load('data/product-catalogue.json');
test('all 34 colour pages retain independently labelled source-bound format alternatives',()=>{
 assert.equal(rows.length,34);
 for(const r of rows){
  assert.equal(crypto.createHash('sha256').update(fs.readFileSync(root+r.file)).digest('hex'),r.sourceSha256);
  const p=data.products.find(p=>p.id===r.id);assert(p);assert.equal(p.url,r.route);
  assert.deepEqual(p.formatOptions,r.after.formatOptions);assert.equal(p.formatSummary,r.after.formatSummary);
  const html=fs.readFileSync(root+r.route.slice(1)+'index.html','utf8');assert(html.includes(p.formatSummary));
  assert(!p.publicCatalogueStatus||p.publicCatalogueStatus!=='retired');
  if(p.formatOptions.length>1)assert.equal(p.packSizeM2,'','No single pack inferred for multiple formats');
 }
});
test('Avala widths keep separate coverages and colour code is not invented as a width SKU',()=>{
 for(const p of data.products.filter(p=>p.range==='Avala')){
  assert.deepEqual(p.formatOptions,[{format:'183mm plank',boardSize:'1524 x 183 x 6.5mm',packSizeM2:'2.2311',piecesPerPack:8},{format:'230mm plank',boardSize:'1524 x 230 x 6.5mm',packSizeM2:'2.10312',piecesPerPack:6}]);
  assert(/^16\d{2}$/.test(p.productCode));
 }
});
test('Aqua Wood Plus separates 18 dual-format and six plank-only colours without fabricated SKUs',()=>{
 const products=data.products.filter(p=>p.range==='Aqua Wood Plus 12mm');
 assert.equal(products.filter(p=>p.formatOptions.length===2).length,18);assert.equal(products.filter(p=>p.formatOptions.length===1).length,6);
 for(const p of products){assert.equal(p.productCode,'');assert.deepEqual(p.formatOptions[0],{format:'Plank',boardSize:'1830 x 196 x 12mm',packSizeM2:'2.152',piecesPerPack:6});if(p.formatOptions.length===2)assert.deepEqual(p.formatOptions[1],{format:'Herringbone',boardSize:'600 x 127 x 12mm',packSizeM2:'1.524',piecesPerPack:20});}
});
test('assistant returns both labelled alternatives, never a single pack guess or quantity calculation',()=>{
 for(const row of rows){const p=data.products.find(p=>p.id===row.id),doc={entityId:p.id,documentId:p.id,entityType:'product',canonicalPath:p.url,title:p.name,facts:[{id:'range',field:'range',value:p.range},{id:'formats',field:'formatSummary',value:p.formatSummary}]},corpus={documents:[doc],corpusVersion:'offline'};
  for(const question of [`What is the pack size of ${p.name}?`,`What formats does ${p.name} come in?`]){const answer=recordedPackAnswer(question,corpus),choiceNeeded=question.includes('pack size')&&p.formatOptions.length>1;assert.equal(answer.reason,choiceNeeded?'confirmation':'recorded_format_alternatives');assert.equal(answer.status,choiceNeeded?'needs_confirmation':'answered');assert(answer.segments[0].text.includes(p.formatSummary));assert.deepEqual(answer.segments[0].evidenceIds,['formats']);}
  for(const question of [`Calculate packs for 60m2 of ${p.name}`,`What is the stock and pack size of ${p.name}?`,`What is the pack size of another product?`])assert.equal(recordedPackAnswer(question,corpus),null);
 }
});
