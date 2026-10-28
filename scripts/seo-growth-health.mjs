// Manual/read-only technical monitor. No scheduler, paid AI calls or form POSTs.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {parse} from 'parse5';
export const ORIGIN='https://oztimberfloor.com.au';
export const ROUTES=['/','/timber-floor-installation/','/hybrid/','/engineered-timber-flooring/','/laminate/','/floor-levelling/','/commercial-flooring/','/office-flooring/','/timber-floor-sanding-and-polishing-sydney/','/products/avala-blackbutt/','/ranges/avala/','/contact/','/privacy/'];
export function htmlFacts(html){
 const elements=[];const visit=n=>{if(n.tagName)elements.push(n);for(const c of n.childNodes||[])visit(c);};visit(parse(html));
 const attr=(n,k)=>n.attrs?.find(a=>a.name===k)?.value||'',text=n=>(n.childNodes||[]).map(c=>c.nodeName==='#text'?c.value:text(c)).join(' ').replace(/\s+/g,' ').trim();
 const metas=name=>elements.filter(n=>n.tagName==='meta'&&attr(n,'name').toLowerCase()===name).map(n=>attr(n,'content'));
 const schema=elements.filter(n=>n.tagName==='script'&&attr(n,'type')==='application/ld+json').map(n=>{try{return {valid:true,value:JSON.parse(text(n))};}catch{return {valid:false};}});
 return {titles:elements.filter(n=>n.tagName==='title').map(text),h1s:elements.filter(n=>n.tagName==='h1').map(text),descriptions:metas('description'),robots:metas('robots'),canonicals:elements.filter(n=>n.tagName==='link'&&attr(n,'rel').split(/\s+/).includes('canonical')).map(n=>attr(n,'href')),verification:metas('google-site-verification'),schema,hrefs:[...new Set(elements.filter(n=>n.tagName==='a').map(n=>attr(n,'href')).filter(Boolean))],forms:elements.filter(n=>n.tagName==='form').map(n=>({name:attr(n,'name'),action:attr(n,'action'),method:attr(n,'method')}))};
}
export function assessPage(route,row){
 const failures=[];if(row.status!==200)failures.push('http_status');if(row.finalUrl!==ORIGIN+route)failures.push('unexpected_owner');
 if(!row.html)return [...failures,'non_html'];const f=row.html;
 if(f.titles.length!==1||!f.titles[0])failures.push('title');if(f.h1s.length!==1||!f.h1s[0])failures.push('h1');
 if(f.descriptions.length!==1||!f.descriptions[0])failures.push('description');
 if(f.canonicals.length!==1||f.canonicals[0]!==ORIGIN+route)failures.push('canonical');
 if(/\bnoindex\b/i.test([row.robotsHeader,...f.robots].join(',')))failures.push('unexpected_noindex');
 if(f.schema.some(s=>!s.valid))failures.push('invalid_json_ld');
 if(route==='/contact/'&&!f.forms.some(x=>x.name==='oz-flooring-enquiry'&&x.action==='/thank-you/'&&x.method.toUpperCase()==='POST'))failures.push('form_contract');
 return failures;
}
export async function readUrl(url,fetchImpl=fetch){
 const hops=[];let current=url;
 for(let i=0;i<8;i++){
  const r=await fetchImpl(current,{redirect:'manual',signal:AbortSignal.timeout(15000)});
  if([301,302,303,307,308].includes(r.status)){
   const location=r.headers.get('location');if(!location)return {status:r.status,finalUrl:current,hops,error:'missing_location'};
   const next=new URL(location,current);if(!['oztimberfloor.com.au','www.oztimberfloor.com.au'].includes(next.hostname)||!['http:','https:'].includes(next.protocol))return {status:r.status,finalUrl:current,hops,error:'external_redirect'};
   hops.push({from:current,status:r.status,to:next.href});if(hops.some(h=>h.from===next.href))return {status:r.status,finalUrl:current,hops,error:'redirect_loop'};current=next.href;continue;
  }
  const body=await r.text();return {status:r.status,finalUrl:current,hops,robotsHeader:r.headers.get('x-robots-tag')||'',type:r.headers.get('content-type')||'',body};
 }
 return {status:0,finalUrl:current,hops,error:'too_many_redirects'};
}
export async function runHealth({fetchImpl=fetch,routes=ROUTES}={}){
 const rows=[];for(const route of routes){try{const r=await readUrl(ORIGIN+route,fetchImpl),row={route,...r};if(row.type?.includes('text/html'))row.html=htmlFacts(row.body);delete row.body;row.failures=assessPage(route,row);rows.push(row);}catch{rows.push({route,failures:['network_or_timeout']});}}
 const extras=[];for(const route of ['/robots.txt','/sitemap.xml','/assets/flooring-assistant-config.js','/api/flooring-assistant']){
  try{const r=await readUrl(ORIGIN+route,fetchImpl),e={route,status:r.status,failures:[]};
   if(route==='/api/flooring-assistant'){
    // The configured route is POST-only (GET404 is normal). Refuse consent
    // deliberately: real handler rejects this before any session reservation.
    const probe=await fetchImpl(ORIGIN+route,{method:'POST',headers:{Origin:ORIGIN,'Content-Type':'application/json'},body:JSON.stringify({op:'session',requestId:'health_probe_no_consent',aiUseAcknowledged:false}),signal:AbortSignal.timeout(15000)});
    const body=await probe.json();e.getStatus=r.status;e.status=probe.status;e.reason=body.reason;e.paidRequests=0;e.sessionCreated=false;
    if(probe.status!==400||body.reason!=='consent_required')e.failures.push(probe.status===503?'assistant_unavailable':'unexpected_api_status');
   }else if(r.status!==200)e.failures.push('http_status');
   else if(route==='/sitemap.xml'){
    e.urls=[...r.body.matchAll(/<loc>\s*([^<]+)\s*<\/loc>/g)].map(m=>m[1].trim());e.count=e.urls.length;
    if(!e.count)e.failures.push('empty_sitemap');if(new Set(e.urls).size!==e.urls.length)e.failures.push('duplicate_sitemap');if(e.urls.some(u=>!u.startsWith(ORIGIN+'/')||/[?#]/.test(u)))e.failures.push('noncanonical_sitemap');
    if(/noindex/i.test(r.robotsHeader))e.failures.push('sitemap_noindex');
   }else if(route==='/robots.txt'){
    e.body=r.body;if(/^\s*Disallow:\s*\/\s*$/im.test(r.body))e.failures.push('global_disallow_review');if(!r.body.includes(ORIGIN+'/sitemap.xml'))e.failures.push('sitemap_not_advertised');
   }else {e.enabled=/enabled\s*:\s*true/.test(r.body);if(!e.enabled)e.failures.push('assistant_launcher_off');}
   extras.push(e);
  }catch{extras.push({route,failures:['network_or_timeout']});}
 }
 return {at:new Date().toISOString(),mode:'get-plus-consent-rejected-api-probe-no-ai-no-forms',rows,extras,failures:[...rows,...extras].filter(r=>r.failures.length).map(r=>({route:r.route,failures:r.failures})),fullSiteCrawl:false,searchConsoleOrAnalyticsAccess:false};
}
if(process.argv[1]&&fileURLToPath(import.meta.url)===path.resolve(process.argv[1])){
 const report=await runHealth(),out=process.argv[2];if(out){fs.mkdirSync(path.dirname(out),{recursive:true});fs.writeFileSync(out,JSON.stringify(report,null,2),{flag:'wx'});}
 console.log(JSON.stringify({at:report.at,routes:report.rows.length,sitemapCount:report.extras.find(e=>e.route==='/sitemap.xml')?.count,failures:report.failures},null,2));if(report.failures.length)process.exitCode=1;
}
