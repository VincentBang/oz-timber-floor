// Protected internal-evaluation instrumentation. Not used by the normal entry.
// Exposes only aggregate counters and numeric/model metadata, never credentials,
// raw IPs, sessions, stored questions or private corpus content.
import {createHandler} from './handler.mjs';
import {runtimeOptions} from './runtime.mjs';
export async function evaluationHandler(request,context,{corpus,policy,profile}){
 const options=await runtimeOptions({env:process.env,context,url:request.url,corpus,policy,profile});
 const trusted=options.settings.enabled&&options.settings.context==='deploy-preview'&&options.settings.mode==='preview'&&options.settings.allowedOrigin===new URL(request.url).origin&&request.headers.get('origin')===options.settings.allowedOrigin;
 const raw=await request.clone().text();let body;try{if(raw.length<=12288)body=JSON.parse(raw);}catch{}
 if(body?.op==='evaluation-budget'){
  const headers={'Content-Type':'application/json','Cache-Control':'no-store','X-Robots-Tag':'noindex, nofollow'};
  if(!trusted||!options.store)return new Response(JSON.stringify({status:'REFUSED'}),{status:403,headers});
  try{const state=await options.store.blob.get('state-v1',{type:'json',consistency:'strong'});
   const c=state?.counters||{};return new Response(JSON.stringify({status:'PASS',paidCallsEnabled:options.settings.paidCallsEnabled,model:profile.candidateModelId,evaluationCalls:c['ge:internal-evaluation']?.value||0,evaluationReservedUsd:(c['be:internal-evaluation']?.value||0)/1e9,maxCalls:profile.evaluation.maxCalls,maxUsd:profile.evaluation.maxUsd}),{headers});
  }catch{return new Response(JSON.stringify({status:'STORE_UNAVAILABLE'}),{status:503,headers});}
 }
 let metadata;const handler=createHandler({corpus,...options,metadata:value=>{metadata=value;}});
 const response=await handler(request,{ip:context.ip});
 if(trusted&&metadata){for(const [key,value]of Object.entries({model:metadata.modelVersion,input:metadata.inputTokens,output:metadata.outputTokens,cached:metadata.cachedTokens,written:metadata.cacheWriteTokens,reasoning:metadata.reasoningTokens,cost:metadata.estimatedCostUsd,reason:metadata.reason})){if(value!==undefined)response.headers.set('X-Oz-Evaluation-'+key,String(value));}}
 return response;
}
