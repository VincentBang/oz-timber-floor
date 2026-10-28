// Manifest-backed recovery of the already-published bytes, not a new release.
// Never merges inherited local UI work or enables production configuration.
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {htmlFacts,readUrl,ORIGIN} from './seo-growth-health.mjs';

const out=path.resolve(process.argv[2]),root=process.cwd(),read=p=>JSON.parse(fs.readFileSync(p)),hash=b=>crypto.createHash('sha256').update(b).digest('hex');
if(process.argv[3]==='--restore'){
 const recovery=out+'/published-recovery',m=read(recovery+'/MANIFEST.json'),destination=fs.mkdtempSync(path.join(os.tmpdir(),'oz-published-offline-recovery-'));
 for(const f of m.files){const source=f.source==='verified-source-file'?root+'/'+f.file:recovery+'/overrides/'+f.file;assert.equal(hash(fs.readFileSync(source)),f.sha256,'Source drift: '+f.file);const target=destination+'/static/'+f.file;fs.mkdirSync(path.dirname(target),{recursive:true});fs.copyFileSync(source,target);}
 for(const f of m.functions){const source=recovery+'/'+f.name+'.zip';assert.equal(hash(fs.readFileSync(source)),f.sealedSha256);fs.mkdirSync(destination+'/functions',{recursive:true});fs.copyFileSync(source,destination+'/functions/'+f.name+'.zip');}
 console.log(JSON.stringify({destination,filesVerified:m.files.length,functionsVerified:m.functions.length,networkCalls:0,deployed:false}));process.exit(0);
}
const record=read(out+'/RECONCILIATION.json'),packagePath=root+'/docs/flooring-assistant/public-release-2026-10-28/attempt-v7/PACKAGE.json',p=read(packagePath),recovery=out+'/published-recovery';
assert(!fs.existsSync(recovery),'Preserve previous recovery');fs.mkdirSync(recovery,{recursive:true});
const changes=[];
for(const f of record.files.filter(f=>!f.localMatches)){
 const from=p.staticDirectory+'/'+f.file,to=recovery+'/overrides/'+f.file;
 assert.equal(hash(fs.readFileSync(from)),f.sealedSha256);fs.mkdirSync(path.dirname(to),{recursive:true});fs.copyFileSync(from,to);
 const before=fs.readFileSync(from,'utf8'),after=fs.readFileSync(root+'/'+f.file,'utf8');
 const category=f.file==='netlify.toml'?'provider-compiled-rules-vs-source-build-config':f.file==='assets/contact-config.js'?'production-GA4-vs-safe-local-disabled':f.file==='assets/flooring-assistant-config.js'?'production-activation-vs-safe-local-disabled':f.file.startsWith('privacy')?'published-approved-assistant-disclosure-absent-locally':'inherited-mobile-UX-branch-delta';
 let protectedFields=null;
 if(f.file.endsWith('.html')){
  const a=htmlFacts(before),b=htmlFacts(after),keys=['titles','h1s','descriptions','robots','canonicals','verification','schema','forms'];
  protectedFields={changed:keys.filter(k=>JSON.stringify(a[k])!==JSON.stringify(b[k])),addedHrefs:b.hrefs.filter(h=>!a.hrefs.includes(h)),removedHrefs:a.hrefs.filter(h=>!b.hrefs.includes(h))};
 }
 changes.push({file:f.file,category,protectedFields,localSha256:hash(fs.readFileSync(root+'/'+f.file)),publishedSha256:f.sealedSha256});
}
for(const f of [p.form,p.assistant]){assert.equal(hash(fs.readFileSync(f.path)),f.sha256);fs.copyFileSync(f.path,recovery+'/'+f.name+'.zip');}
const manifest={at:new Date().toISOString(),deployId:record.deploy.id,sourceHead:record.head,sourceManifestSha256:hash(fs.readFileSync(packagePath)),files:record.files.map(f=>({file:f.file,sha256:f.sealedSha256,source:f.localMatches?'verified-source-file':'archived-published-override'})),functions:record.functions,scope:'Exact already-published package reconstruction only; not clean npm-build equivalence or authorisation to deploy',changes};
fs.writeFileSync(recovery+'/MANIFEST.json',JSON.stringify(manifest,null,2),{flag:'wx'});
const destination=fs.mkdtempSync(path.join(os.tmpdir(),'oz-published-reproduced-'));
for(const f of manifest.files){const source=f.source==='verified-source-file'?root+'/'+f.file:recovery+'/overrides/'+f.file,target=destination+'/'+f.file;assert.equal(hash(fs.readFileSync(source)),f.sha256,'Source drift: '+f.file);fs.mkdirSync(path.dirname(target),{recursive:true});fs.copyFileSync(source,target);}
// Retain all literal compiled rules as provenance; never copy compiled TOML
// over the repository's source configuration or infer aliases as new owners.
const toml=fs.readFileSync(destination+'/netlify.toml','utf8');
const compiledRules=toml.split('[[redirects]]').slice(1).map(block=>({from:JSON.parse(block.match(/^from = (".*")$/m)?.[1]||'null'),to:JSON.parse(block.match(/^to = (".*")$/m)?.[1]||'null'),status:Number(block.match(/^status = (\d+)$/m)?.[1]),force:block.match(/^force = (true|false)$/m)?.[1]==='true'}));
const sourceRules=fs.readFileSync('_redirects','utf8').split(/\r?\n/).filter(l=>l.trim()&&!l.trim().startsWith('#')).map(line=>{const [from,to,code='301']=line.trim().split(/\s+/);return {from,to,status:parseInt(code),force:code.endsWith('!')};});
const sameOrderedRules=JSON.stringify(sourceRules)===JSON.stringify(compiledRules);
fs.writeFileSync(out+'/COMPILED_RULE_COMPARISON.json',JSON.stringify({sourceCount:sourceRules.length,compiledCount:compiledRules.length,sameOrderedRules,sourceRules,compiledRules},null,2),{flag:'wx'});
const live=[];
for(const route of ['/oak-flooring-sydney/','/oak-flooring-sydney.html','/oak-flooring-sydney/index.html',...['oak-beige','blackbutt','bianco-white','snow-white','stone-oak','white-wash'].map(s=>'/product/stone-floor-'+s+'/')]){
 const r=await readUrl(ORIGIN+route);live.push({route,status:r.status,hops:r.hops,finalUrl:r.finalUrl,error:r.error||null,canonical:htmlFacts(r.body||'').canonicals,robotsHeader:r.robotsHeader});
}
const result={at:new Date().toISOString(),reproducedDirectory:destination,verifiedStaticFiles:manifest.files.length,archivedPublishedOverrides:changes.length,functions:record.functions,sameOrderedRules,sourceRuleCount:sourceRules.length,compiledRuleCount:compiledRules.length,changes,live,noPaidRequests:true,noFormSubmissions:true,noDeployment:true};
fs.writeFileSync(out+'/PUBLISHED_REPRODUCTION.json',JSON.stringify(result,null,2),{flag:'wx'});
console.log(JSON.stringify({reproducedDirectory:destination,verifiedStaticFiles:manifest.files.length,archivedPublishedOverrides:changes.length,sameOrderedRules,live:live.map(r=>({route:r.route,status:r.status,hops:r.hops.length,destination:r.finalUrl})),protectedFieldChanges:changes.filter(c=>c.protectedFields?.changed.length)},null,2));
