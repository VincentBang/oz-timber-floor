import assert from 'node:assert/strict';
import {parse} from 'parse5';
export function enquiryAttachmentFact(html){
 const walk=n=>[n,...(n.childNodes||[]).flatMap(walk)],nodes=walk(parse(html));
 const attr=(n,k)=>n.attrs?.find(a=>a.name===k)?.value;
 const form=nodes.find(n=>n.tagName==='form'&&attr(n,'name')==='oz-flooring-enquiry');assert(form,'Expected existing enquiry form');
 assert.equal(attr(form,'enctype'),'multipart/form-data');assert.equal(attr(form,'action'),'/thank-you/');
 const inputs=walk(form).filter(n=>n.tagName==='input'&&attr(n,'type')==='file');assert.equal(inputs.length,3);
 for(const [name,accept]of [['floor_plan','.pdf,.jpg,.jpeg,.png,.webp'],['flooring_photo_1','.jpg,.jpeg,.png,.webp'],['flooring_photo_2','.jpg,.jpeg,.png,.webp']]){
  const field=inputs.find(n=>attr(n,'name')===name);assert(field);assert.equal(attr(field,'accept'),accept);assert.equal(attr(field,'required'),undefined);assert.equal(attr(field,'multiple'),undefined);
 }
 assert(html.includes('Maximum 7 MB combined.'));
 const guidance='You can optionally attach a floor plan or photos in the form. If a file is too large, mention it in your message so we can discuss another way to send it.';
 assert(html.includes(guidance),'Missing public attachment guidance outside controls');return guidance;
}
