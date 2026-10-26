import fs from 'node:fs';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
const out='docs/migration-october-2026-final-repairs';
fs.mkdirSync(out,{recursive:true});
if(fs.existsSync(out+'/entry.json')&&!process.argv.includes('--live-only'))throw new Error('Entry evidence already exists');
const files=execFileSync('git',['ls-files','--cached','--others','--exclude-standard','-z']).toString().split('\0').filter(Boolean);
const hashes=Object.fromEntries(files.filter(f=>fs.existsSync(f)&&fs.statSync(f).isFile()).map(f=>[f,crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex')]));
if(!process.argv.includes('--live-only'))fs.writeFileSync(out+'/entry.json',JSON.stringify({at:new Date().toISOString(),head:execFileSync('git',['rev-parse','HEAD']).toString().trim(),status:execFileSync('git',['status','--short']).toString(),hashes},null,2)+'\n');
const observations=[];
for(const host of ['https://oztimberfloor.com.au','https://oztimberfloor.netlify.app']){
 for(const route of ['/','/hybrid/','/laminate/','/commercial-flooring/','/timber-floor-installation/','/engineered-timber-flooring/','/sitemap_index.xml']){
  const response=await fetch(host+route); const body=await response.text();
  const filename=(host.includes('netlify')?'netlify':'wordpress')+route.replaceAll('/','_')+'.html';
  fs.writeFileSync(out+'/'+filename,body);
  observations.push({url:host+route,status:response.status,final:response.url,noindex:response.headers.get('x-robots-tag'),sha256:crypto.createHash('sha256').update(body).digest('hex'),filename,hardwood188:body.includes('188 colours'),internalInstallationCopy:body.includes('Installation pages should')});
 }
}
fs.writeFileSync(out+'/live-before.json',JSON.stringify(observations,null,2)+'\n');
console.log(JSON.stringify(observations,null,2));
