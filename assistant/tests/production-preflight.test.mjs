import test from 'node:test';
import assert from 'node:assert/strict';
import {productionPreflight} from '../lib/production-preflight.mjs';
test('zero-generation preflight rejects anonymous, wrong-origin, published and paid-enabled contexts before store access',async()=>{
 const names=['OZ_ASSISTANT_ENABLED','OZ_ASSISTANT_MODE','OZ_ASSISTANT_ORIGIN','OZ_ASSISTANT_PREVIEW_APPROVED','OZ_ASSISTANT_PAID_CALLS_ENABLED'],saved=Object.fromEntries(names.map(k=>[k,process.env[k]])),origin='https://oz-prod-check-123456abcdef--oztimberfloor.netlify.app';
 const context={site:{id:'fd68e39e-7863-4012-8a97-40bec59b23d9',name:'oztimberfloor'},deploy:{published:false,context:'deploy-preview'},user:{id:'offline-team-user'}};
 const apply=()=>Object.assign(process.env,{OZ_ASSISTANT_ENABLED:'true',OZ_ASSISTANT_MODE:'mock',OZ_ASSISTANT_ORIGIN:origin,OZ_ASSISTANT_PREVIEW_APPROVED:'true',OZ_ASSISTANT_PAID_CALLS_ENABLED:'false'});
 const request=(url=origin,header=origin)=>new Request(url+'/api/flooring-assistant',{method:'POST',headers:{Origin:header,'Content-Type':'application/json'},body:JSON.stringify({op:'suite'})});
 try{apply();const handler=productionPreflight('oz-prod-check-123456abcdef');for(const [req,ctx]of [[request(),{...context,user:undefined}],[request(),{...context,deploy:{published:true,context:'production'}}],[request('https://oztimberfloor.com.au'),context],[request(origin,'https://other.example'),context]])assert.equal((await handler(req,ctx)).status,403);process.env.OZ_ASSISTANT_PAID_CALLS_ENABLED='true';assert.equal((await handler(request(),context)).status,403);assert.throws(()=>productionPreflight('arbitrary-store-selector'));}
 finally{for(const [k,v]of Object.entries(saved))if(v===undefined)delete process.env[k];else process.env[k]=v;}
});
