// @netlify/blobs 11.1.6 labels every conditional-write status except412 as
// modified=true, including a real409 race loser. Normalize that conflict to a
// failed CAS; all other unexpected failures must throw, never authorize spend.
export function atomicBlobFetch(fetchImpl=fetch,{timeoutMs=3000,onResponse=()=>{}}={}){
 return async(url,options={})=>{
  const signal=options.signal?AbortSignal.any([options.signal,AbortSignal.timeout(timeoutMs)]):AbortSignal.timeout(timeoutMs);
  const response=await fetchImpl(url,{...options,signal}),method=String(options.method||'GET').toUpperCase(),headers=new Headers(options.headers);
  const conditional=method==='PUT'&&(headers.has('if-match')||headers.has('if-none-match'));
  onResponse({method,status:response.status,ifMatch:headers.has('if-match'),ifNoneMatch:headers.has('if-none-match')});
  if(conditional&&response.status===409){await response.body?.cancel();return new Response(null,{status:412});}
  if(!response.ok&&!((method==='GET'||method==='HEAD')&&response.status===404)&&!(conditional&&response.status===412)){
   await response.body?.cancel();throw Error('budget_store_unavailable');
  }
  return response;
 };
}
