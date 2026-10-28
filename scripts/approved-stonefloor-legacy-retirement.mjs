import crypto from 'node:crypto';
export const STONEFLOOR_RETIREMENT_SHA256='8e63c2d45d67434453855401e6b942e5e90ca12a6d84363ed81a3c074848a993';
export const STONEFLOOR_RETIRED_IDS=Object.freeze(['stone-floor-stone-oak','stone-floor-white-wash']);
export function approvedStonefloorSource(source,approvalBytes){
 return STONEFLOOR_RETIRED_IDS.some(id=>source===`/product/${id}/`)
  && !!approvalBytes && crypto.createHash('sha256').update(approvalBytes).digest('hex')===STONEFLOOR_RETIREMENT_SHA256;
}
export function stonefloorRetirementIssues({source,rule,approvalBytes,product,control,html,sitemapRoutes,publicationRoutes}){
 const id=STONEFLOOR_RETIRED_IDS.find(id=>source===`/product/${id}/`);if(!id)return null;
 const issues=[],held=`/products/${id}/`,target='/ranges/stone-floor/';
 if(!approvedStonefloorSource(source,approvalBytes))issues.push('stonefloor-retirement-approval-drift');
 if(rule?.status!==301||(rule.destination??rule.to)!==target||rule.force!==false||(rule.conditions||[]).length)issues.push('stonefloor-retirement-rule-drift');
 if(product?.id!==id||product.publicCatalogueStatus!=='retired'||product.retirementDate!=='2026-10-28'||product.stockStatusLabel!=='No longer offered by Oz Timber Floor'||product.retirementBasis!=='Owner business retirement; not a manufacturer discontinuation claim')issues.push('stonefloor-retirement-record-drift');
 if(control?.applyNoindex!==true||control.directRedirect!==false||control.replacementRoute!==target||control.replacementBasis!=='owner-approved-retirement-alternatives')issues.push('stonefloor-retirement-control-drift');
 const main=html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i)?.[1]||'';
 if(!/name="robots" content="noindex,follow"/.test(html)||!main.includes('This legacy colour is no longer offered by Oz Timber Floor.')||!main.includes('not an exact replacement')||/"@type"\s*:\s*"(?:Product|Offer)"/.test(html)||/Check stock|Request supply price|has been discontinued/i.test(main))issues.push('stonefloor-retirement-page-drift');
 if(!html.includes(`href="https://oztimberfloor.com.au${held}"`))issues.push('stonefloor-retirement-canonical-drift');
 if(sitemapRoutes.includes(held)||publicationRoutes.includes(held))issues.push('stonefloor-retirement-indexation-drift');
 if(!sitemapRoutes.includes(target)||!publicationRoutes.includes(target))issues.push('stonefloor-retirement-alternatives-owner-drift');
 return issues;
}
