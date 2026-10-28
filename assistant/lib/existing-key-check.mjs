// Temporary protected verifier, not imported by the normal public function.
import {deploymentSettings} from './deployment.mjs';
export async function existingKeyCheck(request,context,{env=process.env,fetchImpl=fetch}={}){
 const reply=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json','Cache-Control':'no-store','X-Robots-Tag':'noindex, nofollow'}}),settings=deploymentSettings(env,context,request.url);
 if(settings.context!=='deploy-preview'||!settings.enabled||!settings.previewApproved||settings.mode!=='mock'||!context.user?.id||request.method!=='POST'||new URL(request.url).origin!==settings.allowedOrigin||request.headers.get('origin')!==settings.allowedOrigin||env.OZ_ASSISTANT_PAID_CALLS_ENABLED!=='false')return reply({status:'REFUSED'},403);
 try{
  const raw=await request.text();if(raw.length>100)return reply({status:'REFUSED'},400);const body=JSON.parse(raw);if(Object.keys(body).length!==1||body.op!=='model')return reply({status:'REFUSED'},400);
  const key=env.OZ_ASSISTANT_OPENAI_API_KEY;if(!/^sk-/.test(key||''))return reply({status:'FAIL',reason:'existing_key_missing',generationCalls:0},503);
  const r=await fetchImpl('https://api.openai.com/v1/models/gpt-6-luna',{headers:{Authorization:'Bearer '+key},signal:AbortSignal.timeout(15000)}),value=await r.json(),ok=r.ok&&value.id==='gpt-6-luna';
  return reply({status:ok?'PASS':'FAIL',keyVariable:'OZ_ASSISTANT_OPENAI_API_KEY',model:'gpt-6-luna',httpStatus:r.status,modelAccessible:ok,errorCode:/^[a-z_]+$/.test(value.error?.code||'')?value.error.code:null,generationCalls:0,productionActivation:false,scope:'Authenticated protected model-metadata access, not generation or production-context proof'},ok?200:503);
 }catch{return reply({status:'FAIL',reason:'model_access_unverified',generationCalls:0},503);}
}
