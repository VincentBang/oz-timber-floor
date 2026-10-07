import fs from 'node:fs';
import path from 'node:path';
import {routing} from './october-route-fixture.mjs';
const out=path.resolve('docs/migration-october-2026-followup'),priv=out+'/private';fs.mkdirSync(priv,{recursive:true});
const input=JSON.parse(fs.readFileSync(priv+'/input-evidence.json')),r=routing('dist'),all=new Map();
const add=(route,source)=>{if(!all.has(route))all.set(route,new Set());all.get(route).add(source);};
for(const p of Object.keys(input.routes))for(const e of input.routes[p])add(p,e.source);
for(const name of ['post','page','product','product_cat'])for(const m of fs.readFileSync(`docs/migration-october-2026/source/${name}-sitemap.xml`,'utf8').matchAll(/<loc>(.*?)<\/loc>/g))add(new URL(m[1]).pathname,'WordPress '+name+' sitemap');
for(const rule of r.rules)if(!rule.from.includes('*'))add(rule.from,'redirect inventory');
const prior=JSON.parse(fs.readFileSync('docs/migration-october-2026/artisan-pending.json'));
const wrong=new Set(prior.map(x=>x.legacy));
const articles=JSON.parse(fs.readFileSync('config/october-article-routes.json'));
const repairs=JSON.parse(fs.readFileSync('config/october-followup-routes.json'));
const live=[...(fs.existsSync(out+'/live-observations.json')?JSON.parse(fs.readFileSync(out+'/live-observations.json')):[]),...(fs.existsSync(out+'/live-observations-initial.json')?JSON.parse(fs.readFileSync(out+'/live-observations-initial.json')):[])];
const broad=new Set(['/hybrid/','/laminate/','/engineered-timber-flooring/','/solid-timber/','/vinyl/','/products/']);
const knownHistorical=new Set(['/laminate-timber-flooring-sydney/','/infinite-bamboo/','/laminate/oak/','/product/pronto-spindrift/']);
const rows=[...all].sort(([a],[b])=>a.localeCompare(b)).map(([route,sources])=>{
 const first=r.step(route),final=r.resolve(route),ev=input.routes[route]||[],file=final.file?fs.readFileSync('dist/'+final.file,'utf8'):'';
 const held=/name="robots"[^>]*content="[^\"]*noindex/.test(file);
 const evidence=ev.filter(e=>/^GA4|^GSC/.test(e.kind));
 let semantic='NEEDS_SPECIFIC_EVIDENCE',remaining='Not independently adjudicated; transport pass is not semantic equivalence';
 if(wrong.has(route)){semantic='WRONG_FAMILY';remaining='Engineered Artisan Oak is mapped to Hybrid. Exact current destination needs validated catalogue/availability evidence.';}
 else if(route==='/innovakitchens/'){semantic='DELIBERATE_RETIREMENT_PRESERVED';remaining='Owner confirmation that service is retired; historical key event not ignored';}
 else if(Object.hasOwn(articles,route.slice(1,-1))){semantic='EQUIVALENT_ARTICLE';remaining='';}
 else if(Object.hasOwn(repairs,route)){semantic=route.startsWith('/author/')?'ARTICLE_ARCHIVE_TO_GUIDE_LIBRARY':'BYTE_IDENTICAL_LEGACY_IMAGE';remaining='';}
 else if(route==='/product/kronoswiss-aquastop-natural-oak-brown-8mm/'){semantic='PARTIAL_RANGE_NOT_EXACT';remaining='Exact held product uses Strasbourg artwork. Range fallback does not preserve verified Natural Oak Brown colour and 8mm intent.';}
 else if(route==='/product/kronoswiss-aquastop-interlaken/'){semantic='PARTIAL_RANGE_NOT_EXACT';remaining='Exact held product uses Strasbourg artwork and has no verified thickness. Current colour/product status needed.';}
 else if(route==='/product/stone-floor-oak-beige/'){semantic='NEEDS_SPECIFIC_EVIDENCE';remaining='Oak Beige equivalence to tile/marble collection not established; exact imported record has generic image and missing dimensions.';}
 else if(route==='/product-category/hybrid/stone-floor-marble/'){semantic='TILE_MARBLE_FAMILY_RETAINED';remaining='Family browsing intent retained; current colour and availability evidence remains incomplete.';}
 else if(route.startsWith('/product/etf-hybrid-spc-9mm-')||route==='/product-category/hybrid/etf-hybrid-spc-9mm/'){semantic=route.includes('helena')?'RANGE_FALLBACK_REVIEW':'ETF_FAMILY_RETAINED';remaining=route.includes('helena')?'Exact Helena product not established':'';}
 else if(/bamboo|stonewood|verdura/.test(route)){semantic='REVIEWED_BAMBOO_RETIREMENT';remaining='Preserved prior approved retirement; not an exact product equivalent';}
 else if(knownHistorical.has(route)){semantic='HISTORICAL_WORDPRESS_404';remaining='Historical cleanup; not labelled migration regression';}
 else if(final.status===404){semantic='UNRESOLVED_404';remaining='Compare live WordPress before classifying as migration regression';}
 else if(held){semantic='INTENTIONAL_NOINDEX_HOLD';remaining='Preserved catalogue-quality exclusion; not publication-ready';}
 else if(route.startsWith('/product/')&&broad.has(final.destination)){semantic='BROAD_CATEGORY_NEEDS_EVIDENCE';}
 const wp=live.find(x=>x.url===new URL('https://oztimberfloor.com.au'+route).href);
 if(final.status===404&&wp?.status===404){semantic='EXISTING_WORDPRESS_404';remaining='Existing failure, not a new migration regression';}
 if(route==='/cpanel/'){semantic='ADMIN_PATH_NOT_PUBLISHED';remaining='Intentionally not exposed';}
 return {legacy_url:'https://oztimberfloor.com.au'+route,sources:[...sources].join('; '),ga4_search_console_evidence:evidence.length?JSON.stringify(evidence):'Not present in supplied exports; not proof of zero traffic',current_status:first.status,redirect_hops:final.hops,final_destination:'https://oztimberfloor.com.au'+final.destination,final_status:final.status,semantic_relevance:semantic,action_taken:Object.hasOwn(repairs,route)?'Added exact 301 after live verification':Object.hasOwn(articles,route.slice(1,-1))?'Preserved implemented article repair':'Preserved pending evidence / existing decision',remaining_issue:remaining,live_wordpress_status:wp?.status??'not checked this run',noindex:held,loop:final.loop};
});
const keys=Object.keys(rows[0]),csv=v=>'"'+String(v??'').replaceAll('"','""')+'"';
fs.writeFileSync(priv+'/migration-url-review.csv',keys.join(',')+'\n'+rows.map(r=>keys.map(k=>csv(r[k])).join(',')).join('\n')+'\n');
fs.writeFileSync(priv+'/route-results.json',JSON.stringify(rows,null,2)+'\n');
const summary={generatedAt:new Date().toISOString(),scope:'union of supplied GA4/GSC routes, dated audit, WordPress sitemap, internal-link target export and exact redirect sources',uniquePaths:rows.length,ruleEntries:r.rules.length,wildcardRules:r.rules.filter(x=>x.from.includes('*')).length,finalStatus:rows.reduce((a,r)=>(a[r.final_status]=(a[r.final_status]||0)+1,a),{}),chains:rows.filter(r=>r.redirect_hops>1).length,loops:rows.filter(r=>r.loop).length,wrongFamily:rows.filter(r=>r.semantic_relevance==='WRONG_FAMILY').length,unresolved404s:rows.filter(r=>r.final_status===404).map(r=>({path:new URL(r.legacy_url).pathname,sources:r.sources})),backlinkLimit:'Latest links/More sample links name linking pages, not Oz target URLs. Top target pages is INTERNAL LINKS, not backlinks. No current external backlink-to-target inventory available.'};
fs.writeFileSync(out+'/route-summary.json',JSON.stringify(summary,null,2)+'\n');console.log(JSON.stringify(summary,null,2));
