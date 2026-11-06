import {takeAreaSummary} from './summary.mjs';

export function reviewSummary() {
  const summary = takeAreaSummary();
  const form = document.querySelector('form[name="oz-flooring-enquiry"]');
  const area = form?.querySelector('#area');
  const type = form?.querySelector('#enquiryType');
  if (!summary || !area || !type) return;

  const card = document.createElement('section');
  card.className = 'enquiry-area-review';
  card.setAttribute('aria-label', 'Floor plan estimate');
  const heading = document.createElement('h3');
  heading.textContent = 'Use your floor plan estimate';
  const description = document.createElement('p');
  const amount = summary.totalAreaM2 + ' m²';
  description.textContent = amount + (summary.method === 'reviewed_suggestion' ? ' reviewed across ' : ' traced across ') + summary.includedRoomCount +
    (summary.includedRoomCount === 1 ? ' included room.' : ' included rooms.') +
    ' This is a planning estimate. The team will confirm the site measurements.';
  const note = document.createElement('p');
  note.setAttribute('role', 'status');
  const apply = document.createElement('button');
  const dismiss = document.createElement('button');
  apply.type = dismiss.type = 'button';
  apply.className = 'button';
  dismiss.className = 'button-secondary';
  dismiss.textContent = 'Dismiss';
  const hidden = () => area.disabled || Boolean(area.closest('[hidden]'));
  let reviewedValue;
  function sync() {
    apply.hidden = hidden();
    reviewedValue = area.value;
    const existing = reviewedValue.trim();
    apply.textContent = existing ? 'Replace existing area with ' + amount : 'Apply ' + amount;
    note.textContent = hidden() ? 'This enquiry type does not use an area. Choose a different enquiry type if you want to apply the measurement.' :
      existing ? 'The area field already contains “' + existing + '”. Dismiss to keep it.' : '';
  }
  const visibility = new MutationObserver(sync);
  const field = area.closest('[data-field]');
  if (field) visibility.observe(field,{attributes:true,attributeFilter:['hidden']});
  function remove() {
    visibility.disconnect();
    type.removeEventListener('change', sync);
    area.removeEventListener('input', sync);
    window.removeEventListener('pagehide', remove);
    card.remove();
  }
  apply.addEventListener('click', () => {
    if (hidden()) { sync(); return; }
    // Review the new replacement label if autofill or another script changed
    // the field while the customer was reading the card.
    if (area.value !== reviewedValue) { sync(); return; }
    area.value = amount;
    area.dispatchEvent(new Event('input', {bubbles: true}));
    area.dispatchEvent(new Event('change', {bubbles: true}));
    remove();
    area.focus();
  });
  dismiss.addEventListener('click', () => { remove(); type.focus(); });
  type.addEventListener('change', sync);
  area.addEventListener('input', sync);
  window.addEventListener('pagehide', remove, {once: true});
  const actions = document.createElement('div');
  actions.className = 'button-row';
  actions.append(apply, dismiss);
  card.append(heading, description, note, actions);
  form.before(card);
  sync();
}
