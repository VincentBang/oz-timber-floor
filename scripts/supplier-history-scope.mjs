import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
// Same immutable source anchor used by the supplier catalogue/HTML evidence.
// Compare through HEAD AND the worktree so committing repairs cannot erase QA.
export const SUPPLIER_HISTORY_BASELINE='98624d3e';
export function supplierHistoryHTML(root,run=execFileSync) {
  const options={cwd:root,encoding:'utf8',maxBuffer:10e6};
  const deleted=run('git',['diff','--name-only','--diff-filter=D',SUPPLIER_HISTORY_BASELINE,'--','*.html'],options).trim();
  assert.equal(deleted,'','Historical HTML deletion needs a separately reviewed route decision');
  // Added audience pages have their own publication/content contract tests;
  // this comparison must have original HTML on both sides, never fabricate it.
  return run('git',['diff','--name-only','--diff-filter=M',SUPPLIER_HISTORY_BASELINE,'--','*.html'],options).trim().split('\n').filter(Boolean);
}
