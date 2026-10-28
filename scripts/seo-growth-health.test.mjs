import test from 'node:test';import assert from 'node:assert/strict';
import {ORIGIN,htmlFacts,assessPage,readUrl,runHealth} from './seo-growth-health.mjs';
const html=(route='/',extra='')=>`<html><head><title>Flooring</title><meta name="description" content="Useful flooring description"><link rel="canonical" href="${ORIGIN+route}">${extra}</head><body><h1>Flooring</h1></body></html>`;
test('parser and canonical/indexation checks fail on real regressions',()=>{
 const row={status:200,finalUrl:ORIGIN+'/',html:htmlFacts(html())};assert.deepEqual(assessPage('/',row),[]);
 assert(assessPage('/',{...row,robotsHeader:'noindex'}).includes('unexpected_noindex'));
 assert(assessPage('/',{...row,html:htmlFacts(html('/wrong/','<script type="application/ld+json">bad</script><meta name="robots" content="noindex">'))}).includes('canonical'));
 assert(assessPage('/',{...row,html:htmlFacts(html().replace('</body>','<h1>Duplicate</h1></body>'))}).includes('h1'));
 assert(assessPage('/contact/',{status:200,finalUrl:ORIGIN+'/contact/',html:htmlFacts(html('/contact/'))}).includes('form_contract'));
});
test('redirect loops, missing locations and external owners are not success',async()=>{
 assert.equal((await readUrl(ORIGIN+'/',async()=>new Response('',{status:301,headers:{location:'/'}}))).error,'redirect_loop');
 assert.equal((await readUrl(ORIGIN+'/',async()=>new Response('',{status:301,headers:{location:'https://example.com/'}}))).error,'external_redirect');
 assert.equal((await readUrl(ORIGIN+'/',async()=>new Response('',{status:301}))).error,'missing_location');
});
test('only POST is consent-rejected health probe; failures not suppressed',async()=>{
 const seen=[];const fetchImpl=async(url,options)=>{seen.push({url,options});
  if(url.endsWith('/robots.txt'))return new Response('User-agent: *\nDisallow: /\n');
  if(url.endsWith('/sitemap.xml'))return new Response('<urlset><url><loc>https://preview.netlify.app/</loc></url></urlset>');
  if(url.endsWith('.js'))return new Response('enabled:false');
  return new Response('',{status:503});};
 const r=await runHealth({fetchImpl,routes:[]});assert.equal(seen.length,5);const posts=seen.filter(x=>x.options.method==='POST');assert.equal(posts.length,1);assert(posts[0].url.endsWith('/api/flooring-assistant'));assert.equal(JSON.parse(posts[0].options.body).aiUseAcknowledged,false);assert.equal(r.failures.length,4);
});
test('valid monitor fixture passes without credentials or generation',async()=>{
 const fetchImpl=async(url,options)=>url.endsWith('/robots.txt')?new Response('User-agent: *\nAllow: /\nSitemap: '+ORIGIN+'/sitemap.xml'):url.endsWith('/sitemap.xml')?new Response('<urlset><url><loc>'+ORIGIN+'/</loc></url></urlset>'):url.endsWith('.js')?new Response('enabled:true'):url.endsWith('/api/flooring-assistant')?options.method==='POST'?new Response(JSON.stringify({reason:'consent_required'}),{status:400}):new Response('',{status:404}):new Response(html(),{headers:{'Content-Type':'text/html'}});
 assert.deepEqual((await runHealth({fetchImpl,routes:['/']})).failures,[]);
});
