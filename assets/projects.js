/* Progressive enhancement only. No tracking, storage, form or backend calls. */
document.addEventListener('DOMContentLoaded', function () {
  var gallery=document.querySelector('[data-project-gallery]');
  if(!gallery)return;
  var cards=Array.from(gallery.querySelectorAll('[data-project-tags]'));
  var controls=document.querySelector('[data-project-filters]');
  var status=document.querySelector('[data-project-status]');
  if(controls){
    controls.hidden=false;
    controls.addEventListener('click',function(event){
      var button=event.target.closest('button[data-project-filter]');if(!button)return;
      var filter=button.dataset.projectFilter;
      controls.querySelectorAll('button').forEach(function(b){b.setAttribute('aria-pressed',String(b===button));});
      cards.forEach(function(card){card.hidden=filter!=='all'&&!card.dataset.projectTags.split(' ').includes(filter);});
      status.textContent=cards.filter(function(card){return !card.hidden;}).length+' photographs · '+button.textContent;
    });
  }
  var dialog=document.querySelector('[data-project-lightbox]');
  if(!dialog||typeof dialog.showModal!=='function')return;
  var image=dialog.querySelector('img'),caption=dialog.querySelector('[data-project-caption]'),opener=null,current=0,previousOverflow='';
  function links(){return cards.filter(function(c){return !c.hidden;}).map(function(c){return c.querySelector('a');});}
  function show(index){var items=links();if(!items.length)return;current=(index+items.length)%items.length;var link=items[current];image.src=link.href;image.alt=link.querySelector('img').alt;caption.textContent=(current+1)+' of '+items.length+' · '+link.dataset.caption;}
  gallery.addEventListener('click',function(event){var link=event.target.closest('a[data-project-photo]');if(!link)return;event.preventDefault();opener=link;show(links().indexOf(link));previousOverflow=document.body.style.overflow;document.body.style.overflow='hidden';dialog.showModal();});
  dialog.querySelector('[data-project-close]').addEventListener('click',function(){dialog.close();});
  dialog.querySelector('[data-project-prev]').addEventListener('click',function(){show(current-1);});
  dialog.querySelector('[data-project-next]').addEventListener('click',function(){show(current+1);});
  dialog.addEventListener('keydown',function(event){if(event.key==='ArrowRight'){event.preventDefault();show(current+1);}if(event.key==='ArrowLeft'){event.preventDefault();show(current-1);}});
  dialog.addEventListener('click',function(event){if(event.target===dialog){var r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();}});
  dialog.addEventListener('close',function(){image.removeAttribute('src');document.body.style.overflow=previousOverflow;if(opener)opener.focus();});
});
