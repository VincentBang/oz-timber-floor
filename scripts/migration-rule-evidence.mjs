import crypto from 'node:crypto';
import {approvedStonefloorSource} from './approved-stonefloor-legacy-retirement.mjs';

// Keep literal aliases distinct: /x.html, /x/index.html and /x/ are not
// three rules for one request. Canonical route normalisation is for owners.
export function parseMigrationRules(text, normalizeRoute) {
  return text.split(/\r?\n/).flatMap((raw,index)=>{
    const line=raw.trim();
    if(!line||line.startsWith('#'))return [];
    const [rawSource,rawDestination,statusText='301',...conditions]=line.split(/\s+/);
    return [{line:index+1,rawSource,rawDestination,source:normalizeRoute(rawSource),destination:normalizeRoute(rawDestination),status:Number.parseInt(statusText,10),statusText,force:statusText.endsWith('!'),conditions,raw}];
  });
}

export function indexLiteralRules(rules) {
  const index=new Map();
  for(const rule of rules){const items=index.get(rule.rawSource)||[];items.push(rule);index.set(rule.rawSource,items);}
  return index;
}

// A dated supplier-backed, family-qualified colour is stronger lineage than
// the old generic import parent. Exact colour equality only; White Wash is
// deliberately NOT treated as Washed Oak, nor Stone Oak as another oak.
export function stoneFloorFamilyCandidates(legacy,products) {
  if(legacy?.rangeSlug!=='stone-floor'||!legacy.colour)return [];
  return [...new Set(products.filter(p=>
    ['stone-floor-timber','stone-floor-tile'].includes(p.rangeSlug)
    && p.id===`${p.rangeSlug}-${legacy.slug?.replace(/^stone-floor-/,'')}`
    && p.category===legacy.category
    && p.colour?.trim().toLowerCase()===legacy.colour.trim().toLowerCase()
    && p.sourceUrl==='https://stonefloor.com.au/products/'
    && p.supplierListingStatus==='listed'
    && p.lastSupplierListingCheck==='2026-10-08'
    && p.publicCatalogueStatus!=='retired'
  ).map(p=>p.rangeSlug))];
}

// The September export remains immutable. Three existing exact successors
// are retained below; two additional colour retirements require the exact
// October 28 owner receipt, not merely an updated expectation.
export function supersededHistoricalTarget({bytes,source,csvTarget,actualTarget,approvalBytes}) {
  if(crypto.createHash('sha256').update(bytes).digest('hex')!=='f146b8ff214207bf0068b7062cdfbf038d8b8d57ecae9becae7d4f7a0581e715')return false;
  if(source==='/oak-flooring-sydney/'&&csvTarget==='/engineered-timber-flooring/'&&actualTarget==='/oak-flooring-sydney/')return true;
  if(csvTarget!=='/ranges/stone-floor-tile/')return false;
  if(approvedStonefloorSource(source,approvalBytes)&&actualTarget==='/ranges/stone-floor/')return true;
  return source==='/product/stone-floor-oak-beige/'&&actualTarget==='/ranges/stone-floor/'
    ||source==='/product/stone-floor-blackbutt/'&&actualTarget==='/ranges/stone-floor-timber/';
}
