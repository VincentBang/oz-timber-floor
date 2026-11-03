import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
export const rangeSprintContract=JSON.parse(fs.readFileSync(new URL('./range-sprint-contract.json',import.meta.url),'utf8'));
const hash=value=>crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex');
export function repairReviewedRangeReferences(catalogue){
 const result=structuredClone(catalogue);
 for(const change of rangeSprintContract.changes){
  const records=result[change.collection].filter(r=>r.id===change.id);
  assert.equal(records.length,1,'Reviewed range identity drift: '+change.id);
  const record=records[0];
  if(JSON.stringify(record[change.field])===JSON.stringify(change.after))continue;
  assert.equal(hash(record[change.field]),change.beforeHash,'Reviewed membership baseline drift: '+change.id);
  record[change.field]=structuredClone(change.after);
 }
 return result;
}
export function assertReviewedRangeReferences(catalogue){assert.deepEqual(repairReviewedRangeReferences(catalogue),catalogue,'Reviewed membership references need reconciliation');}
export function repairReviewedRangeHTML(html,route){
 const page=rangeSprintContract.pages.find(p=>p.route===route);if(!page)return html;
 for(const edit of page.edits){
  if(edit.kind==='mobile-name-wrap'&&html.includes('data-range-sprint-wrap'))continue;
  const count=html.split(edit.before).length-1;
  if(count===0){assert.equal(html.split(edit.after).length-1,edit.count,'Reviewed range content drift: '+route+' '+edit.kind);continue;}
  assert.equal(count,edit.count,'Reviewed range edit count drift: '+route+' '+edit.kind);
  html=html.split(edit.before).join(edit.after);
 }
 return html;
}
