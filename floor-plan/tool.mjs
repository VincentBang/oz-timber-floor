import {loadPlan} from './plan-loader.mjs';
import {saveAreaSummary, contactDestination} from './summary.mjs';
import {MAX_AREA, MAX_POINTS, MAX_ROOMS, metresPerPixel, roomArea, roomsOverlap} from './geometry.mjs';

const $ = id => document.getElementById(id);
const format = value => value.toFixed(2);
let file=null, plan=null, loading=false, loadController=null;
let scale=null, scalePoints=[], draft=[], rooms=[], editing=null, nextId=1;
let checking=false, checkPoints=[];
let viewZoom=1, panMode=false, panStart=null;

function updateView() {
  const viewport=$('plan-viewport');
  const fitWidth=plan?Math.min(viewport.clientWidth,viewport.clientHeight*plan.canvas.width/plan.canvas.height):viewport.clientWidth;
  $('stage').style.width=Math.max(1,fitWidth*viewZoom)+'px';
  $('zoom-level').textContent=Math.round(viewZoom*100)+'%';
  $('zoom-out').disabled=loading || viewZoom<=1;
  $('zoom-in').disabled=loading || viewZoom>=4;
  $('pan-plan').setAttribute('aria-pressed',String(panMode));
  $('plan-viewport').classList.toggle('pan-mode',panMode);
}
function focusNearby(element) {
  element.focus({preventScroll:true});
  const box=element.getBoundingClientRect();
  if(box.top<0 || box.bottom>window.innerHeight)element.scrollIntoView({block:'nearest',behavior:'instant'});
}
function focusTracing() {
  if(matchMedia('(max-width:999px)').matches) {
    document.querySelector('.drawing-panel').scrollIntoView({block:'start',behavior:'instant'});
    $('plan-viewport').focus({preventScroll:true});
  } else focusNearby($('room-name'));
}
$('choose-scale-points').addEventListener('click',()=>{scalePoints=[];$('known-distance').value='';invalidateConsent();redraw();announce('Choose the two scale points again.');document.querySelector('.drawing-panel').scrollIntoView({block:'start',behavior:'instant'});$('plan-viewport').focus({preventScroll:true});});
window.addEventListener('resize',updateView);
$('mode-scale').addEventListener('click',()=>{if(scale)$('change-scale').click();else{panMode=false;updateView();announce('Set scale: choose two ends of a known dimension on the plan.');}});
$('mode-trace').addEventListener('click',()=>{if(!scale||loading)return;if(checking)$('stop-check').click();panMode=false;updateView();focusTracing();});
function showReview(){if(!plan)return;$('review-panel').scrollIntoView({block:'start',behavior:'instant'});const heading=$('review-panel').querySelector('h2');heading.tabIndex=-1;heading.focus({preventScroll:true});}
$('review-estimate').addEventListener('click',showReview);
$('review-shortcut').addEventListener('click',event=>{event.preventDefault();showReview();});
$('back-to-plan').addEventListener('click',()=>{$('measurement-tool').scrollIntoView({block:'start',behavior:'instant'});focusNearby(scale?$('room-name'):$('mode-scale'));});
for (const [id,change] of [['zoom-in',.25],['zoom-out',-.25]]) $(id).addEventListener('click',()=>{viewZoom=Math.max(1,Math.min(4,viewZoom+change));updateView();});
$('fit-plan').addEventListener('click',()=>{viewZoom=1;panMode=false;updateView();$('plan-viewport').scrollTo(0,0);});
$('pan-plan').addEventListener('click',()=>{panMode=!panMode;panStart=null;updateView();announce(panMode?'Pan view on. Drag the drawing to move it; no points will be added.':'Room and scale point selection resumed.');});
$('plan-viewport').addEventListener('pointerdown',event=>{if(!panMode || !plan)return;panStart={id:event.pointerId,x:event.clientX,y:event.clientY,left:$('plan-viewport').scrollLeft,top:$('plan-viewport').scrollTop};$('plan-viewport').setPointerCapture(event.pointerId);});
$('plan-viewport').addEventListener('pointermove',event=>{if(!panStart||panStart.id!==event.pointerId)return;$('plan-viewport').scrollTo(panStart.left+panStart.x-event.clientX,panStart.top+panStart.y-event.clientY);});
for(const event of ['pointerup','pointercancel','lostpointercapture']) $('plan-viewport').addEventListener(event,()=>{panStart=null;});
for(const link of document.querySelectorAll('[data-review-link]')) {const destination=new URL(contactDestination(location.search),location.href);destination.searchParams.delete('floorplan');link.href=destination.pathname+destination.search;}
$('clear-rooms').addEventListener('click',()=>{if(loading||!rooms.length||!window.confirm('Clear all measured rooms? The loaded drawing and scale will be kept.'))return;rooms=[];draft=[];editing=null;nextId=1;$('room-name').value='';invalidateConsent();redraw();announce('Measured rooms cleared. Your scale is still set.');$('room-name').focus();});

function announce(message, error=false) {
  $('status').classList.toggle('error',error);
  $('status').textContent=message;
}
function invalidateConsent() { $('share-consent').checked=false; }
function resetMeasurement() {
  scale=null; scalePoints=[]; draft=[]; rooms=[]; editing=null; nextId=1;
  checking=false; checkPoints=[]; $('check-result').textContent='';
  invalidateConsent();
  $('known-distance').value=''; $('room-name').value='';
  $('point-x').value=''; $('point-y').value='';
}
function hasWork() { return scalePoints.length>0 || rooms.length>0 || draft.length>0; }
function totals() {
  const included=rooms.filter(room=>room.included);
  return {area:included.reduce((sum,room)=>sum+room.area,0), count:included.length};
}
function svg(tag, attrs) {
  const node=document.createElementNS('http://www.w3.org/2000/svg',tag);
  for (const [key,value] of Object.entries(attrs)) node.setAttribute(key,String(value));
  return node;
}
const coordinates=points=>points.map(p=>p.x+','+p.y).join(' ');
function renderDiagram() {
  const overlay=$('overlay');
  overlay.replaceChildren();
  if (!plan) return;
  const {width,height}=plan.canvas;
  overlay.setAttribute('viewBox','0 0 '+width+' '+height);
  // The overlay is the exact same ratio as the canvas below it.
  const radius=Math.max(1,Math.min(10,width/140));
  for (const room of rooms) {
    if (room.id===editing) continue;
    const shape=svg('polygon',{points:coordinates(room.points),class:room.included?'room':'room excluded'});
    const label=svg('title',{}); label.textContent=room.name; shape.append(label);
    overlay.append(shape);
  }
  if (scalePoints.length) {
    overlay.append(svg('polyline',{points:coordinates(scalePoints),class:'scale-line'}));
    for (const point of scalePoints) overlay.append(svg('circle',{cx:point.x,cy:point.y,r:radius,class:'pin calibration'}));
  }
  if (checking) {
    overlay.append(svg('polyline',{points:coordinates(checkPoints),class:'scale-line'}));
    for (const point of checkPoints) overlay.append(svg('circle',{cx:point.x,cy:point.y,r:radius,class:'pin calibration'}));
  }
  if (draft.length) {
    overlay.append(svg('polyline',{points:coordinates(draft),class:'draft'}));
    for (const point of draft) overlay.append(svg('circle',{cx:point.x,cy:point.y,r:radius,class:'pin'}));
  }
}
function overlap(points,exceptId) {
  return rooms.find(room=>room.id!==exceptId && room.included && roomsOverlap(points,room.points));
}
function button(text, callback) {
  const element=document.createElement('button');
  element.type='button'; element.textContent=text; element.disabled=loading;
  element.addEventListener('click',callback); return element;
}
function displayRooms() {
  $('room-list').replaceChildren();
  for (const room of rooms) {
    const li=document.createElement('li'), label=document.createElement('label'), input=document.createElement('input');
    input.type='checkbox'; input.checked=room.included; input.disabled=loading || editing!==null || checking;
    input.addEventListener('change',()=>{
      if (input.checked) {
        const other=overlap(room.points,room.id);
        if (other) { input.checked=false; announce('This room overlaps '+other.name+'. Adjust its outline or exclude the other room first.',true); return; }
        if (totals().area+room.area>MAX_AREA) { input.checked=false; announce('The total would exceed 100,000 m². Check the scale.',true); return; }
      }
      room.included=input.checked; invalidateConsent(); redraw();
      document.querySelector(`[data-room-id="${room.id}"] input`)?.focus();
      announce(room.name+(room.included?' included in the estimate.':' excluded from the estimate.'));
    });
    li.dataset.roomId=String(room.id);
    label.append(input,' '+room.name+' · '+format(room.area)+' m²'); li.append(label);
    const edit=button('Edit',()=>{
      if ((draft.length || editing!==null) && !window.confirm('Discard the current unfinished trace to edit this room?')) return;
      draft=room.points.map(p=>({...p})); editing=room.id; $('room-name').value=room.name; invalidateConsent();
      redraw(); announce('Editing '+room.name+'. Undo corners or clear the points to redraw. Save room applies the edit.');
      $('undo-point').focus();
    });
    edit.disabled=loading || checking;
    edit.setAttribute('aria-label','Edit '+room.name);
    const remove=button('Remove',()=>{
      if (!window.confirm('Remove '+room.name+' from this plan?')) return;
      rooms=rooms.filter(item=>item.id!==room.id);
      if (room.id===editing) { editing=null; draft=[]; $('room-name').value=''; }
      invalidateConsent(); redraw(); announce('Room removed.'); $('room-name').focus();
    });
    remove.disabled=loading || checking;
    remove.setAttribute('aria-label','Remove '+room.name);
    li.append(edit,remove); $('room-list').append(li);
  }
}
function redraw() {
  $('workspace').hidden=!plan;
  // Changing a message must never move the drawing under the next tap.
  // Keep the live status in the control column, not above the precision canvas.
  if(plan && $('status').parentElement!==$('step-panel'))$('step-panel').prepend($('status'));
  if(!plan && $('status').parentElement===$('step-panel'))$('upload-panel').insertAdjacentElement('afterend',$('status'));
  $('review-panel').hidden=!plan;
  document.body.classList.toggle('plan-loaded',!!plan);
  document.body.classList.toggle('scale-is-set',!!scale);
  document.body.classList.toggle('is-checking',checking);
  $('scale-entry').hidden=!!scale || scalePoints.length!==2;
  $('trace-panel').hidden=!scale || checking;
  $('mode-scale').disabled=loading || !plan;
  $('mode-trace').disabled=loading || !scale;
  $('mode-scale').setAttribute('aria-pressed',String(!!plan&&!scale&&!checking));
  $('mode-trace').setAttribute('aria-pressed',String(!!scale&&!checking));
  $('review-estimate').disabled=loading || !totals().count || !!draft.length || editing!==null || checking;
  $('review-shortcut').hidden=$('review-estimate').disabled;
  $('page-controls').hidden=!plan || plan.pageCount===1;
  $('page-number').disabled=loading;
  const current=!plan?'open':!scale?'scale':rooms.length&&!draft.length&&editing===null&&!checking?'review':'trace';
  for(const step of ['open','scale','trace','review']) {const node=$('step-'+step);if(step===current)node.setAttribute('aria-current','step');else node.removeAttribute('aria-current');}
  $('summary-plan').textContent=plan?'Plan: page '+plan.pageNumber+' of '+plan.pageCount:'Plan: not loaded';
  $('summary-scale').textContent=scale?'Scale: set — check a second dimension':'Scale: not set';
  $('summary-readiness').textContent=!plan?'Next: open a plan to begin.':!scale?'Next: mark a known dimension and set its length.':draft.length||editing!==null?'Next: finish or cancel the current room.':checking?'Next: finish the scale check.':rooms.length?'Review included rooms before sharing your estimate.':'Next: trace your first room.';
  $('clear-rooms').disabled=loading||!rooms.length||checking;
  updateView();
  if (!plan) return;
  const available=!loading;
  $('known-distance').disabled=!available || !!scale;
  $('distance-unit').disabled=!available || !!scale;
  $('apply-scale').hidden=!!scale;
  $('apply-scale').disabled=!available || scalePoints.length!==2;
  $('change-scale').hidden=!scale; $('change-scale').disabled=!available;
  $('room-name').disabled=!scale || !available || checking;
  $('scale-check-controls').hidden=!scale;
  $('check-scale').disabled=!available || draft.length>0 || editing!==null;
  $('check-scale').hidden=checking; $('stop-check').hidden=!checking;
  $('stop-check').disabled=!available;
  $('scale-info').textContent=scale?'Calibration set for this page.':'Calibration points marked: '+scalePoints.length+' of 2.';
  $('point-count').textContent=scale?(editing===null?'New room':'Editing room')+' · '+draft.length+' corners marked.':'Place the two scale points on the drawing first.';
  if (checking) $('point-count').textContent='Checking the scale · '+checkPoints.length+' of 2 dimension points marked.';
  const points=checking?checkPoints:scale?draft:scalePoints;
  $('undo-point').disabled=!available || !points.length;
  $('clear-points').disabled=!available || !points.length;
  $('cancel-edit').hidden=editing===null; $('cancel-edit').disabled=!available;
  $('finish-room').disabled=!available || !scale || draft.length<3;
  $('add-point').disabled=!available || (!scale && scalePoints.length>=2) || (checking && checkPoints.length>=2);
  for (const id of ['point-x','point-y']) $(id).disabled=$('add-point').disabled;
  $('point-x').max=plan.canvas.width; $('point-y').max=plan.canvas.height;
  $('bounds').textContent='Enter coordinates in plan pixels from the top left. X runs from 0 to '+plan.canvas.width+' and Y runs from 0 to '+plan.canvas.height+'.';
  $('empty-rooms').hidden=rooms.length>0;
  const {area,count}=totals();
  $('area-output').textContent=format(area); $('room-count').textContent=count+(count===1?' room':' rooms');
  $('working-area').textContent=format(area); $('working-count').textContent=count+(count===1?' room':' rooms');
  const ready=available && count>0 && !draft.length && editing===null && !checking;
  $('share-consent').disabled=!ready;
  $('handoff').disabled=!ready || !$('share-consent').checked;
  renderDiagram(); displayRooms();
}

async function openPlan(nextFile, requestedPage) {
  if (!nextFile) return;
  if (hasWork() && !window.confirm('Changing the file or PDF page clears the current scale, traced rooms and unfinished points. Continue?')) {
    if (plan) $('page-number').value=String(plan.pageNumber);
    return;
  }
  loadController?.abort();
  const controller=new AbortController();
  loadController=controller; loading=true; invalidateConsent(); redraw(); announce('Opening the plan in your browser…');
  let opened=false;
  try {
    const next=await loadPlan(nextFile,requestedPage,controller.signal);
    if (controller.signal.aborted || loadController!==controller) {
      next.canvas.width=0; next.canvas.height=0; return;
    }
    if (plan) { plan.canvas.width=0; plan.canvas.height=0; }
    file=nextFile; plan=next;
    opened=true;
    viewZoom=1;panMode=false;panStart=null;
    resetMeasurement();
    $('raster').replaceChildren(next.canvas);
    next.canvas.setAttribute('aria-hidden','true');
    $('page-number').replaceChildren();
    for (let page=1; page<=next.pageCount; page++) $('page-number').append(new Option(String(page),String(page)));
    $('page-number').value=String(next.pageNumber);
    announce('Plan ready. Mark two ends of a known dimension, then enter its length.');
  } catch (error) {
    if (controller.signal.aborted || loadController!==controller) return;
    if (plan) $('page-number').value=String(plan.pageNumber);
    const recovery = plan ? ' The previous plan is still displayed; its measurements have not been replaced.' : '';
    announce((error.message || 'This file could not be opened. Choose a JPG, PNG or PDF plan.') + recovery,true);
  } finally {
    if (loadController===controller) { loading=false; loadController=null; redraw();if(opened){$('measurement-tool').scrollIntoView({block:'start',behavior:'instant'});$('mode-scale').focus({preventScroll:true});} }
  }
}
$('plan-file').addEventListener('change',event=>{
  const selected=event.target.files[0]; event.target.value='';
  if (selected) openPlan(selected,1);
});
$('page-number').addEventListener('change',()=>openPlan(file,Number($('page-number').value)));

function addPoint(x,y) {
  if (loading || !plan) return;
  if (!Number.isFinite(x) || !Number.isFinite(y) || x<0 || y<0 || x>plan.canvas.width || y>plan.canvas.height) {
    announce('Choose a coordinate within the plan dimensions shown.',true); return;
  }
  const points=checking?checkPoints:scale?draft:scalePoints;
  if (checking && points.length===2) { announce('Return to room tracing or undo a check point.'); return; }
  if (!scale && points.length===2) { announce('Enter the known distance and select Set scale.'); return; }
  if (scale && points.length===MAX_POINTS) { announce('A room can have at most '+MAX_POINTS+' corners.',true); return; }
  if (points.some(p=>Math.hypot(p.x-x,p.y-y)<0.001)) { announce('That point is already marked. Save the room to close its outline.',true); return; }
  points.push({x,y}); invalidateConsent(); redraw();
  if(!scale&&!checking&&points.length===2)focusNearby($('known-distance'));
  if (checking) {
    if (points.length===1) { announce('Choose the other end of the second dimension.'); return; }
    const [a,b]=points;
    const result='The second dimension measures '+format(Math.hypot(a.x-b.x,a.y-b.y)*scale)+' m at this scale. Compare it with the label before tracing.';
    $('check-result').textContent=result; announce(result); return;
  }
  announce(scale?'Corner '+points.length+' added.':points.length===2?'Two points marked. Enter the known distance and set the scale.':'First scale point marked. Choose the other end.');
}
$('add-point').addEventListener('click',()=>{
  const heldFocus=document.activeElement===$('add-point');
  addPoint($('point-x').valueAsNumber,$('point-y').valueAsNumber);
  if (heldFocus && $('add-point').disabled) (checking?$('stop-check'):$('known-distance')).focus();
});
$('overlay').addEventListener('click',event=>{
  if(panMode)return;
  const box=$('overlay').getBoundingClientRect();
  if (plan && box.width && box.height) addPoint((event.clientX-box.left)/box.width*plan.canvas.width,(event.clientY-box.top)/box.height*plan.canvas.height);
});
$('apply-scale').addEventListener('click',()=>{
  if (loading || scalePoints.length!==2) return;
  try { scale=metresPerPixel(scalePoints[0],scalePoints[1],$('known-distance').valueAsNumber,$('distance-unit').value); }
  catch (error) { announce(error.message,true); return; }
  redraw(); announce('Scale set. Trace your first room by marking its corners in order.');
  focusTracing();
});
$('change-scale').addEventListener('click',()=>{
  if (loading || !scale) return;
  if ((rooms.length || draft.length || editing!==null) && !window.confirm('Recalibrating clears all measured rooms on this page. Continue?')) return;
  resetMeasurement(); redraw(); announce('Choose two new calibration points.');
  $('coords').open=false;document.querySelector('.drawing-panel').scrollIntoView({block:'start',behavior:'instant'});$('plan-viewport').focus({preventScroll:true});
});
$('check-scale').addEventListener('click',()=>{
  if (!scale || loading || draft.length || editing!==null) return;
  checking=true; checkPoints=[]; $('check-result').textContent=''; invalidateConsent(); redraw();
  announce('Mark the ends of a second labelled dimension.');
  if(matchMedia('(max-width:999px)').matches)document.querySelector('.drawing-panel').scrollIntoView({block:'start',behavior:'instant'});
  focusNearby($('stop-check'));
});
$('stop-check').addEventListener('click',()=>{
  checking=false; checkPoints=[]; redraw(); announce('Room tracing resumed.');
  focusTracing();
});
$('undo-point').addEventListener('click',()=>{
  const heldFocus=document.activeElement===$('undo-point');
  (checking?checkPoints:scale?draft:scalePoints).pop();
  if (checking) $('check-result').textContent='';
  invalidateConsent(); redraw(); announce('Last point removed.');
  if (heldFocus && $('undo-point').disabled) $('coords').querySelector('summary').focus();
});
$('clear-points').addEventListener('click',()=>{
  const heldFocus=document.activeElement===$('clear-points');
  if (checking) { checkPoints=[]; $('check-result').textContent=''; }
  else if (scale) draft=[]; else scalePoints=[];
  invalidateConsent(); redraw(); announce('Points cleared.');
  if (heldFocus && $('clear-points').disabled) $('coords').querySelector('summary').focus();
});
$('cancel-edit').addEventListener('click',()=>{ editing=null; draft=[]; $('room-name').value=''; invalidateConsent(); redraw(); announce('Edit cancelled. The saved room was kept.'); $('room-name').focus(); });

$('finish-room').addEventListener('click',()=>{
  if (loading || !scale) return;
  const original=rooms.find(room=>room.id===editing);
  try {
    if (!original && rooms.length>=MAX_ROOMS) throw Error('This tool can keep up to '+MAX_ROOMS+' rooms.');
    const area=roomArea(draft,scale), included=original?.included ?? true;
    if (included) {
      const other=overlap(draft,editing);
      if (other) throw Error('This trace overlaps '+other.name+'. Trace each included floor area only once.');
      if (totals().area-(original?.included?original.area:0)+area>MAX_AREA) throw Error('The included area exceeds 100,000 m². Check the scale.');
    }
    const id=original?.id ?? nextId++;
    const name=$('room-name').value.trim() || 'Room '+id;
    const room={id,name,area,points:draft,included};
    if (original) rooms=rooms.map(item=>item.id===id?room:item); else rooms.push(room);
    draft=[]; editing=null; $('room-name').value=''; invalidateConsent(); redraw();
    announce(name+' saved at '+format(area)+' m². Trace another room or review your estimate.');
    focusTracing();
  } catch (error) { announce(error.message,true); }
});
$('share-consent').addEventListener('change',redraw);
$('handoff').addEventListener('click',()=>{
  if (loading || checking || draft.length || editing!==null || !$('share-consent').checked) return;
  const {area,count}=totals();
  if (!count || !saveAreaSummary(Number(format(area)),count)) {
    announce('Your area could not be carried across. You can open Contact and enter '+format(area)+' m² yourself.',true); return;
  }
  window.location.assign(contactDestination(window.location.search));
});
window.addEventListener('pagehide',()=>{
  loadController?.abort(); loadController=null; loading=false;
  if (plan) { plan.canvas.width=0; plan.canvas.height=0; }
  file=null; plan=null; $('raster').replaceChildren(); $('overlay').replaceChildren(); $('room-list').replaceChildren();
  resetMeasurement(); $('page-number').replaceChildren(); $('plan-file').value='';
  for (const id of ['scale-info','point-count','bounds','check-result']) $(id).textContent='';
  $('area-output').textContent='0.00'; $('room-count').textContent='0 rooms';
  $('empty-rooms').hidden=false; $('share-consent').disabled=true; $('handoff').disabled=true;
  $('coords').open=false; redraw(); announce('Choose a plan to begin.');
});
redraw();
// Only expose file selection after every handler is registered. Selecting a
// file while module imports are pending would otherwise lose the change event.
$('plan-file').disabled=false;
$('plan-file').removeAttribute('aria-describedby');
$('tool-readiness').hidden=true;
