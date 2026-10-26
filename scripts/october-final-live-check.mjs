import fs from 'node:fs';
const out='docs/migration-october-2026-final-repairs';
const audit=JSON.parse(fs.readFileSync('/Users/daibang/Documents/Codex/2026-10-07/referenced-chatgpt-conversation-this-is-an-2/outputs/migration-audit-evidence-2026-10-07.json'));
const rows=[...audit.legacy_routes.map(x=>({...x,kind:'legacy'})),...audit.sitemap_routes.map(x=>({...x,kind:'sitemap'}))],results=[];let next=0;
async function work(){while(next<rows.length){const row=rows[next++];try{
 let url=row.url,trail=[],response,body;
 for(let i=0;i<5;i++){response=await fetch(url,{redirect:'manual',signal:AbortSignal.timeout(20000)});body=await response.text();if(response.status>=300&&response.status<400){url=new URL(response.headers.get('location'),url).href;trail.push(url);}else break;}
 const canonical=(body.match(/<link\b[^>]*>/g)||[]).find(t=>/rel="canonical"/.test(t))?.match(/href="([^"]+)"/)?.[1];
 const ok=response.status===row.status&&trail.length===row.hops&&url===row.final&&/noindex/.test(response.headers.get('x-robots-tag')||'')&&(row.kind!=='sitemap'||canonical==='https://oztimberfloor.com.au'+new URL(row.url).pathname);
 results.push({kind:row.kind,url:row.url,status:response.status,hops:trail.length,final:url,canonical,noindex:response.headers.get('x-robots-tag'),ok});
 }catch(e){results.push({url:row.url,ok:false,error:e.message});}
 if(results.length%100===0)console.log(`${results.length}/${rows.length}`);
}}
await Promise.all(Array.from({length:8},work));
const report={at:new Date().toISOString(),scope:'Read-only HTTPS GET; currently deployed package, NOT the new local repairs',count:results.length,failures:results.filter(x=>!x.ok),results};fs.writeFileSync(out+'/live-routes.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({count:report.count,failures:report.failures}));if(report.failures.length)process.exitCode=1;
