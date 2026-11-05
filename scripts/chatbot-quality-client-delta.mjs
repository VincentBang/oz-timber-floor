// A local source-delta check, NOT production/corpus/activation approval. Replay
// only the reviewed error-copy/retry change against the immutable Gallery source.
import {execFileSync} from 'node:child_process';
const replacement=` }catch(error){if(version===epoch&&requests.current(attempt)){
  if(input.value.trim()===text||!input.value.trim())input.value=text;
  const reason=error.message,uncertain=['duplicate','idempotency_conflict'].includes(reason),expired=['session','conversation'].includes(reason),failure=guideFailure(reason);
  const item=message(uncertain?'This request may already have been processed. No new AI request was created. Please contact Oz Timber Floor if you still need help.':expired?'Your conversation has expired. Renew it to keep your question and review the acknowledgement, or contact Oz Timber Floor.':failure.text,'error');
  if(expired){const renew=el('button','Renew conversation');renew.type='button';renew.addEventListener('click',()=>{const kept=input.value;clear();composer().value=kept;(dialog.querySelector('[data-ai-ack]')||composer()).focus();});item.append(renew);}
  else if(!uncertain&&failure.retry){const retry=el('button','Try again');retry.type='button';retry.addEventListener('click',()=>{input.value=text;item.remove();dialog.querySelector('form').requestSubmit();});item.append(retry);}
  dialog.querySelector('[data-status]').textContent=uncertain?'Question kept. A timeout or retry may still have used AI once.':expired?'Question kept. Renewing requires fresh acknowledgement and does not send automatically.':'Question kept. No automatic retry was made.';emit('assistant_fallback','unavailable');
 }}\n`;
export function reviewedQualityClient(root,bytes){
 const baseline=execFileSync('git',['show','67f71ea86ac0ddd63e38b1f992c474e0ffb9d679:assets/flooring-assistant.js'],{cwd:root,encoding:'utf8'});
 const original=baseline.match(/^ }catch\(error\)\{if\(version===epoch&&requests.current\(attempt\)\)\{[^\n]+\n/m)?.[0];if(!original)return false;
 const from="import {GuideRequest,boundedHistoryRequest} from './flooring-guide-request.js';",to="import {GuideRequest,boundedHistoryRequest,guideFailure} from './flooring-guide-request.js';";if(!baseline.includes(from))return false;
 return bytes.equals(Buffer.from(baseline.replace(from,to).replace(original,replacement)));
}
