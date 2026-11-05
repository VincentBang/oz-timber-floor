// Request identity survives an uncertain failure. Never auto-retry or create a
// new request/session merely to escape the server's duplicate/cost controls.
export class GuideRequest {
 constructor(){this.version=0;this.active=null;this.pending=null;}
 begin(){if(this.active)return null;const request={version:++this.version,controller:new AbortController()};this.active=request;return request;}
 current(request){return this.active===request&&request.version===this.version;}
 finish(request){if(!this.current(request))return false;this.active=null;return true;}
 cancel(){this.version++;this.active?.controller.abort();this.active=null;}
 reset(){this.cancel();this.pending=null;}
 envelope(value){if(!this.pending||this.pending.message!==value.message)this.pending=Object.freeze({...value});return this.pending;}
 accepted(){this.pending=null;}
}
export function boundedHistoryRequest(value){const result={...value,history:value.history.map(t=>({...t}))};while(new TextEncoder().encode(JSON.stringify(result)).length>11500&&result.history.length)result.history.shift();return result;}
// Never display arbitrary backend/exception text. No branch retries automatically.
export function guideFailure(reason){
 const messages={budget_exhausted:'The assistant has reached its usage allowance. You can still browse the source pages or contact Oz Timber Floor.',rate_limit:'Please wait before asking another question, or contact Oz Timber Floor.',busy:'The assistant is busy. Please try again shortly, or contact Oz Timber Floor.',invalid_plan:'I could not verify that answer. Please review the source pages or ask Oz Timber Floor.'};
 return {text:messages[reason]||"I couldn't load an answer just now. Try again, or contact Oz Timber Floor.",retry:reason!=='budget_exhausted'};
}
