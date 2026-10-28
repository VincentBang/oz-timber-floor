// Pure analysis: original export rows stay intact; no website/provider writes.
export function numeric(value,{integer=false,nullable=false}={}){
 if(value===null||value===undefined||String(value).trim()===''){if(nullable)return null;throw Error('Missing numeric metric');}
 const s=String(value).trim();if(!/^-?(?:\d{1,3}(?:,\d{3})+|\d+)(?:\.\d+)?%?$/.test(s))throw Error('Invalid numeric metric');
 const n=Number(s.replaceAll(',','').replace('%',''));if(!Number.isFinite(n)||n<0||integer&&!Number.isInteger(n))throw Error('Invalid metric domain');return s.endsWith('%')?n/100:n;
}
export function brandGroup(query){const q=query.toLowerCase().trim();return /\boz\s*timber\b|\boztimber\b/.test(q)?'brand':/\boz\s+floor(?:ing)?\b/.test(q)?'ambiguous_brand':'nonbrand';}
export function positionBand(p){if(p===null)return 'missing';if(p<4)return 'under_4';if(p<11)return '4_to_under_11';if(p<21)return '11_to_under_21';if(p<41)return '21_to_under_41';return '41_plus';}
export const CLUSTERS=[
 {name:'floor preparation',pattern:/levell?ing|self.?level|subfloor|concrete grind|floor prep/i,owner:'/floor-levelling/'},
 {name:'commercial and office',pattern:/commercial|office floor|builder.*floor|floor.*builder/i,owner:'/commercial-flooring/'},
 {name:'sanding and polishing',pattern:/sanding|polishing/i,owner:'/timber-floor-sanding-and-polishing-sydney/'},
 {name:'pattern installation',pattern:/herringbone|chevron|parquetry/i,owner:null},
 {name:'hybrid',pattern:/hybrid/i,owner:'/hybrid/'},
 {name:'engineered timber',pattern:/engineered/i,owner:'/engineered-timber-flooring/'},
 {name:'laminate',pattern:/laminate/i,owner:'/laminate/'},
 {name:'installation',pattern:/install|laying|flooring contractor/i,owner:'/timber-floor-installation/'},
 {name:'timber flooring',pattern:/timber floor|wood(?:en)? floor/i,owner:'/'},
];
export function prepareQueries(records){return records.map(r=>{const query=r['Top queries'];if(typeof query!=='string'||!query.trim())throw Error('Missing query key');const position=numeric(r.Position,{nullable:true});return {query,clicks:numeric(r.Clicks,{integer:true}),impressions:numeric(r.Impressions,{integer:true}),exportCtr:r.CTR===undefined?null:numeric(r.CTR),position,band:positionBand(position),brand:brandGroup(query),cluster:CLUSTERS.find(c=>c.pattern.test(query))?.name||'other'};});}
export function sumMetrics(rows){const clicks=rows.reduce((n,r)=>n+r.clicks,0),impressions=rows.reduce((n,r)=>n+r.impressions,0),withPosition=rows.filter(r=>r.position!==null);return {rows:rows.length,clicks,impressions,ctr:impressions?clicks/impressions:null,impressionWeightedPosition:withPosition.length&&withPosition.reduce((n,r)=>n+r.impressions,0)?withPosition.reduce((n,r)=>n+r.position*r.impressions,0)/withPosition.reduce((n,r)=>n+r.impressions,0):null};}
export function analyseGsc(tables){
 const chart=tables['Chart.csv'];if(!chart?.length)throw Error('Missing daily chart');
 const days=chart.map(r=>{if(!/^\d{4}-\d{2}-\d{2}$/.test(r.Date)||!Number.isFinite(Date.parse(r.Date))||new Date(r.Date).toISOString().slice(0,10)!==r.Date)throw Error('Invalid date');return {date:r.Date,clicks:numeric(r.Clicks,{integer:true}),impressions:numeric(r.Impressions,{integer:true}),position:numeric(r.Position,{nullable:true})};}).sort((a,b)=>a.date.localeCompare(b.date));
 if(new Set(days.map(r=>r.date)).size!==days.length)throw Error('Duplicate daily dates');
 const queries=prepareQueries(tables['Queries.csv']||[]);if(!queries.length)throw Error('Missing query rows');
 const dates={start:days[0].date,end:days.at(-1).date,days:days.length,containsPostMigration:days.some(r=>r.date>='2026-10-26')};
 const group=key=>Object.fromEntries([...new Set(queries.map(r=>r[key]))].map(v=>[v,sumMetrics(queries.filter(r=>r[key]===v))]));
 const devices=(tables['Devices.csv']||[]).map(r=>({device:r.Device,clicks:numeric(r.Clicks,{integer:true}),impressions:numeric(r.Impressions,{integer:true}),ctr:numeric(r.CTR),position:numeric(r.Position,{nullable:true})}));
 const pages=(tables['Pages.csv']||[]).map(r=>({url:r['Top pages'],clicks:numeric(r.Clicks,{integer:true}),impressions:numeric(r.Impressions,{integer:true}),ctr:numeric(r.CTR),position:numeric(r.Position,{nullable:true})}));
 if(pages.some(r=>!r.url?.startsWith('https://oztimberfloor.com.au/')))throw Error('Unexpected page property');
 return {dates,siteTotals:sumMetrics(days),querySubset:sumMetrics(queries),queryLimitOrPrivacyWarning:queries.length>=1000?'1000-row export ceiling reached; query totals are a visible subset':'Query tables can omit anonymised rows; not a site-total substitute',groups:{brand:group('brand'),cluster:group('cluster'),band:group('band')},devices,pages,queries,opportunities:queries.filter(r=>r.brand==='nonbrand'&&r.cluster!=='other'&&r.position!==null&&r.position>=4&&r.position<41).sort((a,b)=>b.impressions-a.impressions).slice(0,35),preMigrationDays:days.filter(r=>r.date<'2026-10-26').length,postMigrationDays:days.filter(r=>r.date>='2026-10-26').length};
}
