// Server-only, bounded status telemetry. Never log headers, keys, messages,
// evidence, response text or provider error messages.
export function authorizationDiagnostic(key){
 try{new Headers({Authorization:'Bearer '+key});return 'AUTH_HEADER_VALID';}catch{return 'AUTH_HEADER_INVALID';}
}
export function diagnosticProviderFetch(fetchImpl=fetch,record=()=>{}){
 return async(url,options)=>{
  let response;try{response=await fetchImpl(url,options);}catch(error){
   const safe=v=>typeof v==='string'&&/^[a-zA-Z0-9_.-]{1,80}$/.test(v)?v:null;
   const classification=/illegal invocation|invalid.*receiver/i.test(error?.message||'')?'INVALID_FETCH_RECEIVER':null;
   try{record({event:'oz_assistant_provider',stage:'fetch_failed',errorType:safe(error?.name),errorCode:safe(error?.cause?.code||error?.code)||classification});}catch{}
   throw error;
  }let body={};
  try{const reader=response.clone().body?.getReader();if(reader){const parts=[];let size=0;try{for(;;){const next=await reader.read();if(next.done)break;size+=next.value.byteLength;if(size>64000){void reader.cancel().catch(()=>{});break;}parts.push(Buffer.from(next.value));}if(size<=64000)body=JSON.parse(Buffer.concat(parts).toString('utf8'));}finally{reader.releaseLock();}}}catch{}
  const code=v=>typeof v==='string'&&/^[a-zA-Z0-9_.-]{1,80}$/.test(v)?v:null;
  try{record({event:'oz_assistant_provider',httpStatus:response.status,errorCode:code(body.error?.code),errorType:code(body.error?.type),errorParam:code(body.error?.param),completed:body.status==='completed'});}catch{}
  return response;
 };
}
