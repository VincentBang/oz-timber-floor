/* Progressive enhancements only: the entire catalogue remains available without JS. */
(function(){'use strict';
 function init(){
  if(!document.body.classList.contains('editorial'))return;
  var family=document.body.dataset.editorialFamily;
  var header=document.querySelector('.site-header'),isolated=[];
  document.addEventListener('oz:mobile-menu-state',function(e){
   if(e.detail.open){
    isolated=Array.from(document.body.children).filter(function(n){return n!==header&&!n.matches('script,link,.skip-link');}).map(function(n){var prior=n.inert;n.inert=true;return[n,prior];});
    var products=Array.from(header.querySelectorAll('.nav-item')).find(function(n){return n.querySelector('a[href="/products/"]');});
    if(products){products.classList.add('is-expanded');var button=products.querySelector('button');if(button)button.setAttribute('aria-expanded','true');}
   }else{isolated.forEach(function(pair){pair[0].inert=pair[1];});isolated=[];}
  });
  if(!['range','discovery'].includes(family))return;
  // The existing range hub already owns search/category interactions; add sorting only.
  var existing=document.querySelector('[data-range-filter-form]');
  var cards=Array.from(document.querySelectorAll('main .range-summary-card, main .catalogue-products .product-card'));
  if(!cards.length)return;
  var originals=new Map();cards.forEach(function(c,i){originals.set(c,i);c.parentElement.classList.add('editorial-catalogue-grid');});
  var form=document.createElement('form');form.className='editorial-filter';form.setAttribute('aria-label','Catalogue search and sorting');
  form.innerHTML=(existing?'':'<label>Search ranges and colours<input type="search" name="catalogue_search" placeholder="Enter a range or colour"></label><label>Range<select name="catalogue_range"><option value="">All ranges</option></select></label>')+'<label>Sort by<select name="catalogue_sort"><option value="featured">Featured order</option><option value="az">Name A–Z</option><option value="za">Name Z–A</option></select></label>'+(existing?'':'<button type="reset">Clear filters</button><p class="editorial-filter-status" role="status" aria-live="polite"></p>');
  var insertion=cards[0].closest('section').querySelector('.shell');insertion.insertBefore(form,insertion.firstChild);
  var input=form.elements.catalogue_search,range=form.elements.catalogue_range,sort=form.elements.catalogue_sort,status=form.querySelector('[role="status"]');
  function rangeName(c){return (c.querySelector('.catalogue-overline')?.textContent||c.querySelector('h3')?.textContent||'').trim();}
  if(range){Array.from(new Set(cards.map(rangeName).filter(Boolean))).sort().forEach(function(value){var option=document.createElement('option');option.value=value;option.textContent=value;range.appendChild(option);});if(range.options.length<3)range.parentElement.hidden=true;}
  function apply(){var count=0,query=input?input.value.trim().toLocaleLowerCase():'';if(!existing)cards.forEach(function(c){var visible=(!query||c.textContent.toLocaleLowerCase().includes(query))&&(!range.value||rangeName(c)===range.value);c.hidden=!visible;if(visible)count++;});
   var groups=new Map();cards.forEach(function(c){if(!groups.has(c.parentElement))groups.set(c.parentElement,[]);groups.get(c.parentElement).push(c);});
   groups.forEach(function(group,parent){group.sort(function(a,b){if(sort.value==='featured')return originals.get(a)-originals.get(b);var names=(a.querySelector('h3')?.textContent||a.textContent).localeCompare(b.querySelector('h3')?.textContent||b.textContent);return sort.value==='za'?-names:names;});group.forEach(function(c){parent.appendChild(c);});});
   if(status)status.textContent=count?count+' of '+cards.length+' ranges and colours shown.':'No matching ranges or colours. Try another name or clear filters.';
  }
  var controls=document.createElement('details');controls.className='editorial-filter-disclosure';controls.open=window.matchMedia('(min-width:761px)').matches;var summary=document.createElement('summary');summary.textContent='Search & sort';controls.appendChild(summary);Array.from(form.children).filter(function(n){return n!==status;}).forEach(function(n){controls.appendChild(n);});form.insertBefore(controls,form.firstChild);
  form.addEventListener('submit',function(e){e.preventDefault();apply();});form.addEventListener('input',apply);form.addEventListener('change',apply);form.addEventListener('reset',function(){requestAnimationFrame(apply);});apply();
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
