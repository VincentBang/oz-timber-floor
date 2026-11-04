// Oz-only safety, accessibility and browser-session boundary. No network writes.
import {roomArea,roomsOverlap} from './geometry.mjs';
import {contactDestination} from './context.mjs';
const draftKey='oz-source-floorplan-draft-v1',ttl=15*60*1000;
export function validDraft(d,now=Date.now()) {
  if(!d||d.v!==1||!Number.isSafeInteger(d.savedAt)||d.savedAt>now||d.savedAt<=now-ttl||!Number.isInteger(d.pageNumber)||d.pageNumber<1||d.pageNumber>30||typeof d.planHash!=='string'||!/^[a-f0-9]{64}$/.test(d.planHash)||!Array.isArray(d.rooms)||!d.rooms.length||d.rooms.length>250)return false;
  if(!Number.isFinite(d.pixelsPerMetre)||d.pixelsPerMetre<=0||!Number.isInteger(d.canvasWidth)||!Number.isInteger(d.canvasHeight)||d.canvasWidth<1||d.canvasHeight<1||d.canvasWidth*d.canvasHeight>8_000_000)return false;
  try{const ids=new Set();for(const room of d.rooms){if(!/^room-[a-zA-Z0-9-]{1,100}$/.test(room.id)||ids.has(room.id)||typeof room.name!=='string'||room.name.length>100||!['manual_trace','quick_room'].includes(room.source)||typeof room.includeInQuote!=='boolean'||!Array.isArray(room.points))return false;ids.add(room.id);if(room.points.some(p=>p.x<0||p.y<0||p.x>d.canvasWidth||p.y>d.canvasHeight))return false;const area=roomArea(room.points,1/d.pixelsPerMetre);if(Math.abs(area-room.areaM2)>.011)return false;}for(let i=0;i<d.rooms.length;i++)for(let j=i+1;j<d.rooms.length;j++)if(roomsOverlap(d.rooms[i].points,d.rooms[j].points))return false;}catch{return false;}return true;
}
export function readDraft(storage,now=Date.now()){try{const tab=storage??sessionStorage,raw=tab.getItem(draftKey);if(!raw||raw.length>2_000_000)return null;const d=JSON.parse(raw);if(validDraft(d,now))return d;tab.removeItem(draftKey);}catch{}return null;}
export function writeDraft(d,storage,now=Date.now()){try{const tab=storage??sessionStorage,record={...d,v:1,savedAt:now};if(!validDraft(record,now)){tab.removeItem(draftKey);return false;}tab.setItem(draftKey,JSON.stringify(record));return true;}catch{return false;}}
export function clearDraft(){try{sessionStorage.removeItem(draftKey);}catch{}}
export function clearAreaSummary(){try{sessionStorage.removeItem('oz-floorplan-handoff-v1');}catch{}}

export function installAccessibility({canvas,dom,getState,point,loadPage}){
  for(const id of ['uploadStatus','globalStatus','traceStatus','canvasStatus']){const e=document.getElementById(id);if(e){e.setAttribute('role','status');e.setAttribute('aria-live','polite');e.setAttribute('aria-atomic','true');}}
  const consent=document.createElement('label');consent.className='port-consent';
  const check=document.createElement('input');check.type='checkbox';check.id='oz-share-area';
  consent.append(check,document.createTextNode('Share only my reviewed area estimate and included-room count with the Oz enquiry form. My plan, filenames, room labels and outlines are not sent.'));
  dom.useAreaInQuoteButton.before(consent);
  const handoffStatus=document.createElement('p');handoffStatus.id='port-handoff-status';handoffStatus.setAttribute('role','status');handoffStatus.setAttribute('aria-live','polite');dom.useAreaInQuoteButton.before(handoffStatus);
  const fallback=document.createElement('a');fallback.href=contactDestination(location.search);fallback.textContent='Continue with an enquiry without sharing measurements';fallback.className='port-enquiry-fallback';dom.useAreaInQuoteButton.after(fallback);
  fallback.addEventListener('click',clearAreaSummary);for(const link of document.querySelectorAll('[data-quote-return-link]'))link.addEventListener('click',clearAreaSummary);
  const details=document.createElement('details');details.className='port-keyboard summary-box';const summary=document.createElement('summary');summary.textContent='Enter plan points using the keyboard';details.append(summary);
  const help=document.createElement('p');help.textContent='Enter coordinates in the plan canvas. This is an alternative to pointer input, not a non-visual plan interpretation service.';details.append(help);
  const row=document.createElement('div');row.className='form-grid';const inputs=[];
  for(const axis of ['X','Y']){const label=document.createElement('label');label.textContent=axis+' position';const input=document.createElement('input');input.type='number';input.min='0';input.step='any';input.id='port-point-'+axis.toLowerCase();input.inputMode='decimal';label.append(input);row.append(label);inputs.push(input);}
  const button=document.createElement('button');button.type='button';button.className='button-secondary';button.textContent='Add point';button.addEventListener('click',()=>{const p={x:Number(inputs[0].value),y:Number(inputs[1].value)};if(inputs.some(i=>i.value==='')||!Number.isFinite(p.x)||!Number.isFinite(p.y)||p.x<0||p.y<0||p.x>canvas.width||p.y>canvas.height){dom.canvasStatus.textContent='Use coordinates within the plan: X 0–'+canvas.width+', Y 0–'+canvas.height+'.';return;}point(p);});row.append(button);details.append(row);dom.canvasShell.after(details);
  canvas.addEventListener('keydown',event=>{if(event.key==='Escape'){dom.clearTraceButton.click();dom.startTraceButton.focus();}});
  dom.scaleModal.addEventListener('cancel',event=>{event.preventDefault();dom.cancelScaleButton.click();});
  dom.scaleModal.addEventListener('keydown',event=>{if(event.key==='Tab'){const controls=[...dom.scaleModal.querySelectorAll('input,button')].filter(e=>!e.disabled);if(event.shiftKey&&document.activeElement===controls[0]){event.preventDefault();controls.at(-1).focus();}else if(!event.shiftKey&&document.activeElement===controls.at(-1)){event.preventDefault();controls[0].focus();}}});
  const developer=new URLSearchParams(location.search).get('devFloorplan')==='1'||new URLSearchParams(location.search).get('floorplanDev')==='1';
  if(developer){document.querySelector('.mode-row')?.removeAttribute('aria-hidden');const quick=document.querySelector('#quickPanel');const sync=()=>{quick?.setAttribute('aria-hidden',String(!quick.classList.contains('active')));for(const button of dom.modeButtons)button.setAttribute('aria-pressed',String(button.classList.contains('active')));};const observer=new MutationObserver(sync);for(const button of dom.modeButtons)observer.observe(button,{attributes:true,attributeFilter:['class']});sync();}
  let selectedFile,pageCount=1,currentPage=1;
  const pages=document.createElement('label');pages.className='port-pdf-pages';pages.hidden=true;pages.textContent='PDF page';const select=document.createElement('select');select.id='port-pdf-page';pages.append(select);dom.planUpload.closest('.field')?.after(pages);
  select.addEventListener('change',async()=>{const next=Number(select.value);if(getState().rooms.length&&!confirm('Changing PDF page clears this page’s measurements. Continue?')){select.value=String(currentPage);return;}select.disabled=true;try{await loadPage(selectedFile,next);}finally{select.value=String(currentPage);select.disabled=false;}});
  return (count,current,file)=>{selectedFile=file;pageCount=count;currentPage=current;pages.hidden=count<=1;select.replaceChildren(...Array.from({length:pageCount},(_,i)=>{const option=document.createElement('option');option.value=String(i+1);option.textContent=String(i+1);return option;}));select.value=String(current);};
}
