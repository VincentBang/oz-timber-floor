import assert from 'node:assert/strict';
import {hash} from './security.mjs';

// Existing owner decision, not an inference from a missing supplier listing.
export const OAK_BEIGE_ROUTE='/products/stone-floor-oak-beige/';
export const OAK_BEIGE_CONTROL_HASH='9ebd2ec03d737a011cca6a05ac53154e7e7ab121bbd4b5feeab19df151f373d5';
export function reviewedOakBeigeRetirement({control,product}){
 assert.equal(hash(control),OAK_BEIGE_CONTROL_HASH,'Oak Beige owner decision changed; review required');
 assert.equal(product?.id,'stone-floor-oak-beige');
 assert.equal(product.name,'Stone Floor Oak Beige');
 assert.equal(product.url,OAK_BEIGE_ROUTE);
 return {name:product.name,path:OAK_BEIGE_ROUTE,expectedStatus:200,
  alternativesPath:'/ranges/stone-floor/',retirementBasis:'owner-business-retirement',
  authorityHash:OAK_BEIGE_CONTROL_HASH,
  // Keep the existing API reason contract. The explicit retirementStatus and
  // customer-facing notice distinguish retirement from uncertain availability.
  responseReason:'confirmation'};
}
