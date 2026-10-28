import {readRequest,verifyToken,issueToken,ipKey,redact,hash} from './security.mjs';
import {buildIndex,retrieve} from './retrieval.mjs';
import {fallback,policyAnswer,renderPlan,avoidRepeatedAnswer} from './answers.mjs';
import {catalogueEnquiryContext,enquiryIntent} from './catalogue-context.mjs';
import {MockProvider,OpenAIResponsesProvider,PROMPT_VERSION} from './provider.mjs';
import {MockAtomicStore,reservationCost} from './budget.mjs';
import {AtomicBlobBudgetStore} from './atomic-budget.mjs';
const safeReasons=new Set(['method','content_type','too_large','request','session','origin','context','feature_off','provider_unavailable','budget_store_unavailable','budget_exhausted','rate_limit','busy','duplicate','idempotency_conflict','invalid_plan','invalid_citation','irrelevant_entity','rates_unavailable','consent_required']);
export function createHandler({corpus,policy,settings={},store,provider,paid={},now=()=>Date.now(),metadata=()=>{}}){
 const index=buildIndex(corpus),mockStore=store||new MockAtomicStore(),mockProvider=provider||new MockProvider();
 return async function handle(request,context={}){
  const start=now();let requestId='request',reservation,activeStore=mockStore;
  const respond=(data,status=200)=>new Response(JSON.stringify({...data,requestId,corpusVersion:corpus.corpusVersion}),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Robots-Tag':'noindex, nofollow','X-Content-Type-Options':'nosniff'}});
  try{
   const url=new URL(request.url),origin=request.headers.get('origin');
   if(!['/api/flooring-assistant','/.netlify/functions/flooring-assistant'].includes(url.pathname))throw Error('request');
   const loopback=['127.0.0.1','localhost','[::1]'].includes(url.hostname);
   const allowed=settings.allowedOrigin;
   if(!allowed||url.origin!==allowed||origin!==allowed)throw Error('origin');
   const local=settings.context==='local'&&loopback&&settings.mode==='mock';
   const preview=settings.context==='deploy-preview'&&settings.previewApproved===true&&['mock','preview'].includes(settings.mode)&&url.hostname.endsWith('--oztimberfloor.netlify.app');
   const production=settings.context==='production'&&settings.mode==='production'&&settings.productionApproved===true&&allowed==='https://oztimberfloor.com.au';
   const paidMode=['preview','production'].includes(settings.mode);
   if(!settings.enabled||!(local||preview||production))return respond(fallback('feature_off',corpus),503);
   if(paidMode&&(!(production?settings.productionApproved:settings.paidPreviewApproved)||!policy.paidActivationApproved||!(store instanceof AtomicBlobBudgetStore)))return respond(fallback('feature_off',corpus),503);
   if(hash(corpus.documents)!==corpus.corpusVersion)return respond(fallback('provider_unavailable',corpus),503);
   const input=await readRequest(request);requestId=input.requestId;
   if(production&&input.aiUseAcknowledged!==true)throw Error('consent_required');
   const trustedIp=context.ip;if(typeof trustedIp!=='string'||!trustedIp||trustedIp.length>64)throw Error('context');
   const ip=ipKey(trustedIp,settings.signingSecret,now());
   if(input.op==='session'){
    await activeStore.reserve({key:'issue:'+ip+':'+requestId,bodyHash:hash(input),session:'issue:'+ip,ip,limits:policy.limits,now:now()});
    await activeStore.settle('issue:'+ip+':'+requestId,0);
    return respond({sessionToken:issueToken(settings.signingSecret,now()),expiresIn:900,status:'answered',mode:paidMode?settings.mode:'mock'});
   }
   const session=verifyToken(input.sessionToken,settings.signingSecret,now());
   if(!corpus.documents.some(d=>d.canonicalPath===input.pagePath))return respond(fallback('invalid_context',corpus));
   const message=redact(input.message),bodyHash=hash({message,pagePath:input.pagePath,entityId:input.entityId});
   reservation=session.id+':'+requestId;
   let metered=false,usage={input_tokens:0,output_tokens:0},cost=0,usedModel=false;
   const reserveDeterministic=async()=>{await activeStore.reserve({key:reservation,bodyHash,session:session.id,ip,limits:policy.limits,now:now()});metered=true;};
   // Client history is validated for bounds, but never promoted into evidence or
   // forwarded as assistant/system instructions. Pronouns require clarification.
   let result=policyAnswer(message,corpus,{pagePath:input.pagePath});
   const evidence=result?null:retrieve(index,message,{pagePath:input.pagePath,entityId:input.entityId});
   if(!result){
    if(evidence.status!=='answered')result=fallback(evidence.reason,corpus);
    else{
     const constantFacts=evidence.facts.filter(f=>['phone','email','showroom'].includes(f.field));
     let generated;
     if(constantFacts.length&&/phone|call|email|address|showroom|contact/i.test(message))generated={plan:{status:'answered',factIds:constantFacts.slice(0,3).map(f=>f.id),reason:'supported'}};
     else if(paidMode){
      if(!settings.paidCallsEnabled)return respond(fallback('feature_off',corpus),503);
      generated=await approvedPaidGeneration({policy,store:activeStore,key:paid.key,model:paid.model,message,facts:evidence.facts,reservationKey:reservation,session:session.id,ip,bodyHash,fetchImpl:paid.fetchImpl,at:now()});
      metered=true;usedModel=true;usage=generated.usage;cost=generated.cost;
     }else{await reserveDeterministic();generated=await mockProvider.generate({message,facts:evidence.facts});}
     result=avoidRepeatedAnswer(renderPlan(generated.plan,evidence,corpus),input.history,message);
    }
   }
   // A confirmation response may still identify one exact current product.
   // Never silently choose the first product from a comparison or private query.
   const handoffAllowed=result.retirementStatus!=='retired'&&!['private_request','not_offered','retired','language','invalid_context'].includes(result.reason);
   const enquiryContext=handoffAllowed?catalogueEnquiryContext(corpus,message,input.pagePath):null;
   if(enquiryContext)result.enquiryContext=enquiryContext;
   result.enquiryIntent=result.retirementStatus==='retired'||result.reason==='retired'?'product':enquiryIntent(message,!!(enquiryContext||result.enquiryContext));
   if(!metered)await reserveDeterministic();
   if(!usedModel)await activeStore.settle(reservation,0);
   metadata({requestId,status:result.status,reason:result.reason||'supported',corpusVersion:corpus.corpusVersion,promptVersion:PROMPT_VERSION,modelVersion:usedModel?paid.model:'deterministic',evidenceCount:evidence?.facts.length||0,latencyMs:now()-start,inputTokens:usage.input_tokens,outputTokens:usage.output_tokens,cachedTokens:usage.input_tokens_details?.cached_tokens,cacheWriteTokens:usage.input_tokens_details?.cache_write_tokens||0,reasoningTokens:usage.output_tokens_details?.reasoning_tokens,estimatedCostUsd:cost});
   return respond({...result,mode:paidMode?settings.mode:'mock',reason:result.reason||'supported'});
  }catch(error){
   // Unknown failures retain a conservative reservation; never log exception text.
   const reason=safeReasons.has(error.message)?error.message:'provider_unavailable';
   const status=reason==='too_large'?413:reason==='origin'?403:reason==='method'?405:['rate_limit','busy','duplicate','idempotency_conflict'].includes(reason)?429:['request','session','content_type','context','consent_required'].includes(reason)?400:503;
   const diagnosticCode=['provider_input_limit','provider_incomplete','provider_usage','provider_invalid','provider_refusal'].includes(error.message)?error.message:null;
   metadata({requestId,status:'unavailable',reason,diagnosticCode,latencyMs:now()-start});return respond(fallback(reason,corpus),status);
  }
 };
}
// Protected evaluation only: exact profile approval, trusted deployment context,
// independent paid switch, fixed model/rates and durable reservations required.
export async function approvedPaidGeneration({policy,store,key,model,message,facts,reservationKey,session,ip,bodyHash,fetchImpl,at=Date.now()}){
 if(!policy.paidActivationApproved||!policy.reviewedModelId||model!==policy.reviewedModelId||!(store instanceof AtomicBlobBudgetStore)||!key||policy.rateTable?.modelId!==model)throw Error('paid_not_approved');
 const reservedUsd=reservationCost(policy.rateTable);
 await store.reserve({key:reservationKey,bodyHash,session,ip,limits:policy.limits,reservedUsd,now:at});
 const provider=new OpenAIResponsesProvider({key,model,fetchImpl});
 const result=await provider.generate({message:redact(message),facts});
 const actual=reservationCost(policy.rateTable,result.usage.input_tokens,result.usage.output_tokens);
 await store.settle(reservationKey,actual);return {...result,cost:actual};
}
