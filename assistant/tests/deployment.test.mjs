import test from 'node:test';
import assert from 'node:assert/strict';
import {deploymentSettings} from '../lib/deployment.mjs';
test('trusted Netlify context is mandatory; published/wrong-project/guest cannot activate',()=>{
 const env={OZ_ASSISTANT_ENABLED:'true',OZ_ASSISTANT_MODE:'mock',OZ_ASSISTANT_PREVIEW_APPROVED:'true',OZ_ASSISTANT_ORIGIN:'https://oz-review--oztimberfloor.netlify.app'},context={site:{id:'fd68e39e-7863-4012-8a97-40bec59b23d9',name:'oztimberfloor'},deploy:{published:false,context:'dev'},user:{id:'authorised-team-user'}};
 assert(deploymentSettings(env,context,env.OZ_ASSISTANT_ORIGIN).enabled);
 for(const c of [{...context,deploy:{published:true,context:'production'}},{...context,deploy:{published:false,context:'production'}},{...context,site:{id:'other',name:'oztimberfloor'}},{...context,user:undefined},{}])assert(!deploymentSettings(env,c,env.OZ_ASSISTANT_ORIGIN).enabled);
 assert(!deploymentSettings({...env,CONTEXT:'local'},context,'http://127.0.0.1:8840').context.includes('local'));
});
