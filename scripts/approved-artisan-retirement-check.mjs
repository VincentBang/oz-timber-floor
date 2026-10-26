import crypto from 'node:crypto';
// Exact owner-approved GSC category retirement, not an exception for all 410s.
export function artisanRetirementIssues({source,rule,approvalBytes,range,html,sitemapRoutes,publicationRoutes}) {
  if(source!=='/product-category/engineered-timber/artisan-oak/')return null;
  const issues=[];
  if(crypto.createHash('sha256').update(approvalBytes).digest('hex')!=='a3b78f51320f3fca5c1de8fae9fe566b545826a4b57dd4f01fe9b8011d8be124')issues.push('approved-retirement-contract-drift');
  if(rule?.status!==410||rule?.statusText!=='410!'||rule?.destination!=='/ranges/artisan-oak/')issues.push('approved-retirement-rule-drift');
  if(range?.status!=='retired'||range?.publicCatalogueStatus!=='retired'||range?.visibleInRangeLibrary!==false)issues.push('approved-retirement-record-drift');
  if(!/name="robots" content="noindex,follow"/.test(html)||!html.includes('Artisan Oak has been discontinued')||/"@type"\s*:\s*"Product"/.test(html))issues.push('approved-retirement-page-drift');
  if(sitemapRoutes.includes('/ranges/artisan-oak/')||publicationRoutes.includes('/ranges/artisan-oak/'))issues.push('approved-retirement-indexation-drift');
  return issues;
}
