/* Local-only preferences: no file, room, personal or pricing data. */
(function(){'use strict';
 var key='oz-enquiry-format-v1',params=new URLSearchParams(location.search),scope=document.querySelector('[data-product-formats]');
 if(scope){
  var select=scope.querySelector('[data-enquiry-format]'),status=scope.querySelector('[data-format-status]');
  // Warn while the customer is still choosing, not only as navigation begins.
  select.addEventListener('change',function(){try{if(select.value)sessionStorage.setItem(key,JSON.stringify({product:scope.dataset.productFormats,format:select.value,time:Date.now()}));else sessionStorage.removeItem(key);status.textContent='Your choice is a request to confirm, not a stock reservation.';}catch(e){status.textContent='Format sharing is unavailable in this browser. Mention your chosen format in the enquiry message.';}});
  document.querySelectorAll('a[href*="/contact/"]').forEach(function(link){link.addEventListener('click',function(){
   var destination=new URL(link.href,location.href);
   if(destination.origin!==location.origin||destination.searchParams.get('productSlug')!==scope.dataset.productFormats)return;
   try{if(select.value)sessionStorage.setItem(key,JSON.stringify({product:scope.dataset.productFormats,format:select.value,time:Date.now()}));else sessionStorage.removeItem(key);}catch(e){status.textContent='Format sharing is unavailable in this browser. Mention your chosen format in the enquiry message.';}
  });});
 }
 if(location.pathname==='/contact/'||location.pathname==='/contact.html'){
  var saved;try{saved=JSON.parse(sessionStorage.getItem(key));sessionStorage.removeItem(key);}catch(e){}
  var message=document.querySelector('textarea[name="message"]');
  if(message&&saved&&saved.product===params.get('productSlug')&&typeof saved.format==='string'&&/^[\w .–-]{1,80}$/.test(saved.format)&&Number.isFinite(saved.time)&&Date.now()-saved.time>=0&&Date.now()-saved.time<1800000){
   var note='Requested format (please confirm): '+saved.format+'.';
   // Never replace typed prose, duplicate a note or exceed a bounded message.
   if(!message.value.includes(note)&&message.value.length+note.length+2<=Math.min(message.maxLength>0?message.maxLength:4000,4000)){
    message.value+=(message.value?'\n\n':'')+note;
    delete message.dataset.enquiryDefault;
   }
  }
 }
 var panels=Array.from(document.querySelectorAll('details.audit-secondary')),media=matchMedia('(max-width:760px)'),states=new WeakMap();
 function reveal(){var id;try{id=decodeURIComponent(location.hash.slice(1));}catch(e){return;}var n=id&&document.getElementById(id);if(!n)return;var p=n;while(p){if(p.tagName==='DETAILS')p.open=true;p=p.parentElement;}n.querySelectorAll('details.audit-secondary').forEach(function(d){d.open=true;});}
 function layout(){panels.forEach(function(d){d.open=!media.matches||d.contains(document.activeElement)||Boolean(states.get(d));});reveal();}
 panels.forEach(function(d){d.addEventListener('toggle',function(){if(media.matches)states.set(d,d.open);});});
 media.addEventListener('change',layout);addEventListener('hashchange',reveal);layout();
})();
