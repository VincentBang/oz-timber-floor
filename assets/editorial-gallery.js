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
  var allCards=Array.from(document.querySelectorAll('main .range-summary-card, main .catalogue-products .product-card'));
  if(!allCards.length)return;
  var originals=new Map();allCards.forEach(function(c,i){originals.set(c,i);c.parentElement.classList.add('editorial-catalogue-grid');});
  function sortCards(cards,value){
   var groups=new Map();cards.forEach(function(c){if(!groups.has(c.parentElement))groups.set(c.parentElement,[]);groups.get(c.parentElement).push(c);});
   groups.forEach(function(group,parent){group.sort(function(a,b){if(value==='featured')return originals.get(a)-originals.get(b);var names=(a.querySelector('h3')?.textContent||a.textContent).localeCompare(b.querySelector('h3')?.textContent||b.textContent);return value==='za'?-names:names;});group.forEach(function(c){parent.appendChild(c);});});
  }
  function sortLabel(){var label=document.createElement('label');label.textContent='Sort by';var select=document.createElement('select');select.name='catalogue_sort';select.innerHTML='<option value="featured">Featured order</option><option value="az">Name A–Z</option><option value="za">Name Z–A</option>';label.appendChild(select);return label;}
  // The range hub retains its own search/category/count controller. Sorting is
  // inside that existing form, never a second filter scope or nested form.
  var existing=document.querySelector('[data-range-filter-form]');
  if(existing){var label=sortLabel(),sort=label.querySelector('select');existing.appendChild(label);var clear=document.querySelector('[data-range-clear]');sort.addEventListener('change',function(){sortCards(allCards,sort.value);if(clear&&sort.value!=='featured')clear.hidden=false;});if(clear){clear.addEventListener('click',function(){sort.value='featured';sortCards(allCards,'featured');});new MutationObserver(function(){if(sort.value!=='featured'&&clear.hidden)clear.hidden=false;}).observe(clear,{attributes:true,attributeFilter:['hidden']});}return;}
  function searchText(value){return value.normalize('NFKD').toLocaleLowerCase().replace(/[^\p{L}\p{N}]+/gu,' ').trim();}
  function rangeName(c){return c.getAttribute('data-catalogue-range-id')||'';}
  var primary=family==='range'?(document.querySelector('main #colours')||document.querySelector('main section.catalogue-products')):null;
  var sections=new Map();allCards.forEach(function(c){var section=c.closest('section');if(family==='range'&&section!==primary)return;if(!sections.has(section))sections.set(section,[]);sections.get(section).push(c);});
  if(family==='range'){
   var alternatives=allCards.filter(function(c){return c.closest('section')!==primary;}),nearby=new Map();alternatives.forEach(function(c){var section=c.closest('section');if(!nearby.has(section))nearby.set(section,[]);nearby.get(section).push(c);});
   nearby.forEach(function(cards,section){var count=document.createElement('p');count.className='editorial-alternatives-count';count.textContent=cards.length+' nearby '+(cards.every(function(c){return c.matches('.range-summary-card');})?'ranges':'options')+' — separate from the colour results.';cards[0].parentElement.before(count);});
  }
  sections.forEach(function(cards,section){
   var heading=section.querySelector('h2'),scope=heading?heading.textContent.trim():cards.every(function(c){return c.matches('.range-summary-card');})?'Ranges':'Colours';
   var form=document.createElement('form');form.className='editorial-filter';form.setAttribute('aria-label',scope+' search and sorting');form.dataset.catalogueScope=scope;
   var searchLabel=document.createElement('label');searchLabel.textContent='Search '+scope.toLocaleLowerCase();var input=document.createElement('input');input.type='search';input.name='catalogue_search';input.placeholder='Enter a range or colour';searchLabel.appendChild(input);
   var more=document.createElement('details');more.className='editorial-filter-disclosure';var summary=document.createElement('summary');summary.textContent='Filter & sort';more.appendChild(summary);
   var rangeLabel=document.createElement('label');rangeLabel.textContent='Range';var range=document.createElement('select');range.name='catalogue_range';range.innerHTML='<option value="">All ranges</option>';rangeLabel.appendChild(range);more.appendChild(rangeLabel);
   var names=new Map();cards.forEach(function(c){var id=rangeName(c),name=c.getAttribute('data-catalogue-range');if(id&&name)names.set(id,name);});Array.from(names).sort(function(a,b){return a[1].localeCompare(b[1]);}).forEach(function(pair){var option=document.createElement('option');option.value=pair[0];option.textContent=pair[1];range.appendChild(option);});if(names.size<2)rangeLabel.hidden=true;
   var order=sortLabel(),sort=order.querySelector('select');more.appendChild(order);var clear=document.createElement('button');clear.type='reset';clear.textContent='Clear filters';
   var status=document.createElement('p');status.className='editorial-filter-status';status.setAttribute('role','status');status.setAttribute('aria-live','polite');form.append(searchLabel,more,clear,status);
   var grid=cards[0].parentElement;grid.before(form);
   function apply(){var count=0,query=searchText(input.value);cards.forEach(function(c){var visible=(!query||searchText(c.textContent).includes(query))&&(!range.value||rangeName(c)===range.value);c.hidden=!visible;if(visible)count++;});sortCards(cards,sort.value);status.textContent=count+' of '+cards.length+' '+scope.toLocaleLowerCase()+' shown.'+(count?'':' No matches. Try another name or clear filters.');summary.textContent='Filter & sort'+(range.value||sort.value!=='featured'?' (active)':'');}
   form.addEventListener('submit',function(e){e.preventDefault();apply();});form.addEventListener('input',apply);form.addEventListener('change',apply);form.addEventListener('reset',function(){requestAnimationFrame(apply);});apply();
  });
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
