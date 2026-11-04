// This adapter is inserted only in the explicitly enabled local package.
// The normal contact journey does not read a measurement or load the tool.
import('./context.mjs').then(({floorPlanDestination}) => {
  const area = document.querySelector('form[name="oz-flooring-enquiry"] [data-field="area"]');
  const type = document.querySelector('#enquiryType');
  if (!area || !type || document.querySelector('#floor-plan-entry')) return;
  const paragraph = document.createElement('p');
  const link = document.createElement('a');
  link.id = 'floor-plan-entry';
  link.target = '_blank';
  link.rel = 'noopener';
  link.textContent = 'Measure a floor plan (opens a new tab)';
  const sync = () => { link.href = floorPlanDestination(location.search, type.value); };
  // Refresh on activation as contact shortcuts may update the select value
  // without dispatching change. Do not carry any typed personal details.
  type.addEventListener('change', sync);
  link.addEventListener('click', sync);
  sync();
  paragraph.append(link, document.createTextNode('. Optional; your current enquiry stays open.'));
  area.append(paragraph);
}).catch(() => {}); // Measurement is optional; the existing form stays usable.
if (new URLSearchParams(location.search).get('floorplan') === '1') {
  import('./contact-review.mjs').then(({reviewSummary}) => reviewSummary()).catch(() => {});
}
