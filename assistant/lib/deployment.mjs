// Context comes from Netlify, never request JSON/headers. Public configuration
// cannot turn a published deploy into a preview or select another project.
export function deploymentSettings(env,context,url){
 const common={enabled:false,mode:env.OZ_ASSISTANT_MODE||'off',context:'off',previewApproved:env.OZ_ASSISTANT_PREVIEW_APPROVED==='true',paidPreviewApproved:env.OZ_ASSISTANT_PAID_PREVIEW_APPROVED==='true',paidCallsEnabled:env.OZ_ASSISTANT_PAID_CALLS_ENABLED==='true',allowedOrigin:env.OZ_ASSISTANT_ORIGIN||'',signingSecret:env.OZ_ASSISTANT_SIGNING_SECRET||''};
 const local=['127.0.0.1','localhost','[::1]'].includes(new URL(url).hostname)&&env.CONTEXT==='local'&&!context.site&&!context.deploy;
 if(local)return {...common,enabled:env.OZ_ASSISTANT_ENABLED==='true',context:'local'};
 const approvedProject=context.site?.id==='fd68e39e-7863-4012-8a97-40bec59b23d9'&&context.site?.name==='oztimberfloor';
 const publicProduction=approvedProject&&context.deploy?.published===true&&context.deploy.context==='production'&&new URL(url).origin==='https://oztimberfloor.com.au'&&common.allowedOrigin==='https://oztimberfloor.com.au'&&common.mode==='production'&&env.OZ_ASSISTANT_PRODUCTION_APPROVED==='true';
 if(publicProduction)return {...common,enabled:env.OZ_ASSISTANT_ENABLED==='true',context:'production',productionApproved:true,signingSecret:env.OZ_ASSISTANT_PRODUCTION_SIGNING_SECRET||''};
 const protectedDraft=approvedProject&&context.deploy?.published===false&&['dev','deploy-preview'].includes(context.deploy?.context)&&typeof context.user?.id==='string';
 if(protectedDraft)return {...common,enabled:env.OZ_ASSISTANT_ENABLED==='true',context:'deploy-preview'};
 return common;
}
