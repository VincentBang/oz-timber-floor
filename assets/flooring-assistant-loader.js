(function init() {
  'use strict';
  var config = window.OZ_FLOORING_ASSISTANT;
  if (!config || !config.enabled || !['mock','preview','production'].includes(config.mode)) return;
  if(config.mode==='production'){
    if(config.productionApproved!==true||location.origin!=='https://oztimberfloor.com.au')return;
  }else if (!['127.0.0.1','localhost','[::1]'].includes(location.hostname) && !/^[a-z0-9-]+--oztimberfloor\.netlify\.app$/.test(location.hostname)) return;
  if(!document.body){document.addEventListener('DOMContentLoaded',init,{once:true});return;}
  if(document.querySelector('.flooring-assistant-launcher'))return;
  var button=document.createElement('button');button.type='button';button.textContent='Ask about flooring';button.className='flooring-assistant-launcher';button.setAttribute('aria-haspopup','dialog');
  Object.assign(button.style,{position:'fixed',right:'16px',bottom:'16px',zIndex:'75',minHeight:'48px',padding:'10px 16px',border:'1px solid #ddd8cf',borderRadius:'24px',background:'#262827',color:'#fff',font:'700 15px system-ui',maxWidth:'calc(100vw - 32px)'});
  document.body.appendChild(button);
  function priority(){
    var blocked=document.querySelector('.site-header.is-open,.analytics-consent-banner,dialog[open]');
    var focused=document.activeElement;var hidden=!!blocked||!!(focused&&focused.closest('[data-contact-form]')&&focused.matches('input,select,textarea'));if(button.hidden!==hidden)button.hidden=hidden;
  }
  var watchedFrames=new WeakSet();
  function toolbarRect(frame){
    var r=frame.getBoundingClientRect(),style=getComputedStyle(frame);
    if(frame.hidden||style.display==='none'||style.visibility==='hidden'||style.pointerEvents==='none'||Number(style.opacity)===0||!r.width||!r.height)return null;
    // The owner toolbar may use a larger transparent frame. Prefer its visible
    // toolbar when same-origin access is available; cross-origin frames remain
    // opaque and use their public bounding box, never bypassing access checks.
    try{var toolbar=frame.contentDocument&&frame.contentDocument.querySelector('[role="toolbar"]');if(toolbar){var t=toolbar.getBoundingClientRect();if(t.width&&t.height)return{left:r.left+t.left,right:r.left+t.right,top:r.top+t.top,bottom:r.top+t.bottom,width:t.width,height:t.height};}}catch(error){}
    return r;
  }
  function watchToolbar(frame){
    if(watchedFrames.has(frame))return;watchedFrames.add(frame);
    new MutationObserver(schedule).observe(frame,{attributes:true,attributeFilter:['style','class','hidden']});
    if(window.ResizeObserver)new ResizeObserver(schedule).observe(frame);
    frame.addEventListener('load',schedule);
  }
  function place(){
    priority();
    if(button.hidden)return;
    var bottom=16;document.querySelectorAll('.mobile-sticky-cta,.mobile-context-dock').forEach(function(d){var r=d.getBoundingClientRect();if(getComputedStyle(d).display!=='none'&&getComputedStyle(d).visibility!=='hidden'&&d.getAttribute('aria-hidden')!=='true'&&r.height&&r.bottom>innerHeight-12&&r.top<innerHeight)bottom=Math.max(bottom,innerHeight-r.top+12);});
    var frames=Array.from(document.querySelectorAll('#nl-hud-frame'));frames.forEach(watchToolbar);
    var own=button.getBoundingClientRect(),height=own.height||48,right=innerWidth-16,left=right-own.width;
    for(var pass=0;pass<=frames.length;pass++)frames.forEach(function(frame){var r=toolbarRect(frame);if(!r||r.bottom<=0||r.top>=innerHeight||r.right<=left||r.left>=right)return;var edge=innerHeight-bottom;if(edge>r.top-12&&edge-height<r.bottom+12)bottom=Math.max(bottom,innerHeight-r.top+12);});
    button.style.bottom='calc('+bottom+'px + env(safe-area-inset-bottom))';
    // The assistant is secondary to visible page actions. Retain its geometry
    // while suppressed, so scroll/resize can restore it without observer loops.
    var placed=button.getBoundingClientRect(),coversAction=Array.from(document.querySelectorAll('main a.button,main a.button-secondary,main a.button-inline,main button,main input,main select,main textarea,main summary')).some(function(control){var r=control.getBoundingClientRect();return r.width&&r.height&&r.left<placed.right&&r.right>placed.left&&r.top<placed.bottom&&r.bottom>placed.top;});
    var visibility=coversAction?'hidden':'';if(button.style.visibility!==visibility)button.style.visibility=visibility;
  }
  var queued=false;function schedule(){if(queued)return;queued=true;requestAnimationFrame(function(){queued=false;place();});}
  // Priority UI must hide the launcher in the mutation microtask, even when a
  // background tab throttles animation frames. Only geometry waits for RAF.
  new MutationObserver(function(){priority();schedule();}).observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['class','hidden','aria-hidden','open']});
  ['scroll','resize','focusin','focusout'].forEach(function(e){window.addEventListener(e,schedule,{passive:true});});if(window.visualViewport){visualViewport.addEventListener('resize',schedule);}
  var pending=false;button.addEventListener('click',async function(){if(pending)return;pending=true;button.disabled=true;try{var module=await import('/assets/flooring-assistant.js');await module.openAssistant(button);}catch(error){button.textContent='Assistant unavailable — contact us';button.onclick=function(){location.href='/contact/';};}finally{pending=false;button.disabled=false;schedule();}});place();
})();
