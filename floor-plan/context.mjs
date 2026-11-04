// Public catalogue/attribution context only. Never read form text, plan data,
// storage, or room names when creating the measurement entry link.
function context(search) {
  const from = new URLSearchParams(search);
  const to = new URLSearchParams();
  const enquiry = from.get('enquiry');
  to.set('enquiry', ['supply-install','supply-only','stock','product','commercial','service'].includes(enquiry) ? enquiry : 'supply-install');
  for (const field of ['product','range','brand','category','productSlug','product_slug','source','topic','utm_source','utm_medium','utm_campaign','utm_content','utm_term','gclid','fbclid']) {
    const value = from.get(field);
    if (field === 'source' && value && !/^(?:\/(?!\/)[a-z0-9/_-]*|[a-z][a-z0-9_-]*)$/i.test(value)) continue;
    if (value && value.length <= 180 && !/[\u0000-\u001f\u007f<>]/u.test(value)) to.set(field, value);
  }
  if (!to.has('source')) to.set('source', 'floor-plan');
  return to;
}

export function contactDestination(search = '') {
  const to = new URLSearchParams({floorplan: '1'});
  for (const [key, value] of context(search)) to.set(key, value);
  return '/contact/?' + to;
}

export function floorPlanDestination(search = '', enquiry) {
  const from = new URLSearchParams(search);
  if (enquiry !== undefined) from.set('enquiry', enquiry);
  return '/floor-plan/?' + context(from);
}
