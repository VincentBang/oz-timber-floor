const prefix='oz-assistant-draft-v1:',ttl=15*60*1000;
const intents=['stock','supply-only','supply-install','product','commercial','service'];
export const fields=['suburb','area','timing','property_type','service_type','current_flooring','company_project','access_constraints','message'];
const safePath=s=>typeof s==='string'&&/^\/(?!\/)[a-z0-9\-/]*$/.test(s);
const plain=value=>value!==null&&typeof value==='object'&&!Array.isArray(value)&&Object.getPrototypeOf(value)===Object.prototype;
function clean(value,max=500){return typeof value==='string'?value.replace(/[\u0000-\u001f]/g,' ').slice(0,max):'';}
export function canFillDraftField(field){return !field.value.trim()||Boolean(field.dataset?.enquiryDefault&&field.value===field.dataset.enquiryDefault);}
export function validateDraft(d,now=Date.now()){
 if(!plain(d)||d.version!==1||!Number.isFinite(d.createdAt)||d.createdAt>now||now-d.createdAt>ttl||!intents.includes(d.intent)||!plain(d.context)||!safePath(d.context?.pagePath)||!plain(d.values)||Object.keys(d.values).some(k=>!fields.includes(k)))throw Error('draft_invalid');
 if(Object.keys(d).some(k=>!['version','createdAt','intent','context','values'].includes(k))||Object.keys(d.context).some(k=>!['entityId','pagePath','product','range','category','productSlug'].includes(k)))throw Error('draft_invalid');
 for(const [k,v]of Object.entries(d.values))if(typeof v!=='string'||v.length>500)throw Error('draft_invalid');
 for(const [k,v]of Object.entries(d.context))if(typeof v!=='string'||v.length>240||/[<>\u0000-\u001f]/.test(v))throw Error('draft_invalid');return d;
}
export function makeHandoff({intent,context,values},storage=sessionStorage,now=Date.now()){
 const draft=validateDraft({version:1,createdAt:now,intent,context,values:Object.fromEntries(fields.filter(k=>values[k]).map(k=>[k,clean(values[k])]))},now);
 const u=new URL('/contact/',location.origin);u.searchParams.set('enquiry',intent);
 for(const k of ['product','range','category','productSlug'])if(context[k])u.searchParams.set(k,context[k]);u.searchParams.set('source',context.pagePath);
 const marker=crypto.randomUUID();try{storage.setItem(prefix+marker,JSON.stringify(draft));u.hash='oz-assistant-draft='+marker;return{href:u.pathname+u.search+u.hash,stored:true};}catch{return{href:u.pathname+u.search,stored:false,summary:Object.entries(draft.values).map(([k,v])=>k+': '+v).join('\n')};}
}
export function clearDrafts(storage){try{storage=storage||sessionStorage;for(let i=storage.length-1;i>=0;i--){const k=storage.key(i);if(k?.startsWith(prefix))storage.removeItem(k);}}catch{}}
function element(tag,text){const n=document.createElement(tag);if(text)n.textContent=text;return n;}
export function receiveHandoff(storage,now=Date.now()){
 const match=location.hash.match(/^#oz-assistant-draft=([a-f0-9-]{36})$/);if(!location.hash.startsWith('#oz-assistant-draft'))return;
 history.replaceState(history.state,'',location.pathname+location.search);if(!match)return;
 let draft;try{storage=storage||sessionStorage;const value=storage.getItem(prefix+match[1]);storage.removeItem(prefix+match[1]);draft=validateDraft(JSON.parse(value),now);}catch{return;}
 const form=document.querySelector('[data-contact-form]');if(!form)return;
 const dialog=element('dialog');dialog.className='flooring-assistant-review';dialog.setAttribute('aria-labelledby','assistant-draft-title');
 const title=element('h2','Review your enquiry draft');title.id='assistant-draft-title';dialog.append(title,element('p','Review and edit these optional details. Existing form values will be kept. Nothing is sent until you use Send enquiry and accept the form consent.'));
 const controls=[];for(const field of fields){if(!draft.values[field])continue;const label=element('label',field.replaceAll('_',' ')),input=element('textarea');input.value=draft.values[field];input.maxLength=500;label.append(input);dialog.append(label);controls.push([field,input]);}
 const apply=element('button','Apply reviewed details'),cancel=element('button','Discard draft');apply.type=cancel.type='button';dialog.append(apply,cancel);document.body.append(dialog);
 const restoreFocus=()=>{const target=[...form.querySelectorAll('input[required],textarea[required]')].find(n=>n.type!=='checkbox'&&!n.value.trim())||form.elements.namedItem('message');target?.focus();};
 apply.addEventListener('click',()=>{for(const [field,input]of controls){const target=form.elements.namedItem(field);if(!target||!canFillDraftField(target))continue;const value=clean(input.value);if(target.tagName==='SELECT'&&![...target.options].some(o=>o.value===value))continue;target.value=value;delete target.dataset.enquiryDefault;target.dispatchEvent(new Event('change',{bubbles:true}));}dialog.close();dialog.remove();restoreFocus();});cancel.addEventListener('click',()=>{dialog.close();dialog.remove();restoreFocus();});dialog.addEventListener('cancel',()=>{dialog.remove();restoreFocus();});dialog.showModal();
}
