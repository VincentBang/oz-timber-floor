import corpus from '../../assistant/generated/corpus.json' with {type:'json'};
import policy from '../../assistant/config/policy.json' with {type:'json'};
import profile from '../../assistant/config/paid-preview.json' with {type:'json'};
import productionProfile from '../../assistant/config/production.json' with {type:'json'};
import {createHandler} from '../../assistant/lib/handler.mjs';
import {runtimeOptions} from '../../assistant/lib/runtime.mjs';
import {diagnosticProviderFetch,authorizationDiagnostic} from '../../assistant/lib/provider-diagnostics.mjs';
const handlers=new Map();
export default async (request,context)=>{
 const options=await runtimeOptions({env:process.env,context,url:request.url,corpus,policy,profile,productionProfile}),key=JSON.stringify([options.settings.enabled,options.settings.context,options.settings.mode,options.settings.paidCallsEnabled]);
 // Production control is strongly read by runtimeOptions on every invocation;
 // do not retain an old production policy/credential through a cache entry.
 if(options.settings.context==='production'){
  console.info(JSON.stringify({event:'oz_assistant_configuration',diagnosticCode:authorizationDiagnostic(process.env.OZ_ASSISTANT_OPENAI_API_KEY)}));
  if(options.paid)options.paid.fetchImpl=diagnosticProviderFetch(fetch,value=>console.info(JSON.stringify(value)));
  return createHandler({corpus,...options,metadata:({status,reason,diagnosticCode,latencyMs,inputTokens,outputTokens,estimatedCostUsd})=>console.info(JSON.stringify({event:'oz_assistant_request',status,reason,diagnosticCode,latencyMs,inputTokens,outputTokens,estimatedCostUsd}))})(request,{ip:context.ip});
 }
 if(!handlers.has(key))handlers.set(key,createHandler({corpus,...options}));
 return handlers.get(key)(request,{ip:context.ip});
};
export const config={path:'/api/flooring-assistant',method:'POST',rateLimit:{windowLimit:12,windowSize:60,aggregateBy:['ip','domain']}};
