import test from 'node:test';import assert from 'node:assert/strict';import{canFillDraftField}from'../../assets/flooring-assistant-handoff.js';
test('reviewed draft can replace only blank or untouched generated form text',()=>{
 assert(canFillDraftField({value:'',dataset:{}}));
 assert(canFillDraftField({value:'Automatic template',dataset:{enquiryDefault:'Automatic template'}}));
 assert(!canFillDraftField({value:'Customer typed this',dataset:{}}));
 assert(!canFillDraftField({value:'Customer typed this',dataset:{enquiryDefault:'Automatic template'}}));
 assert(!canFillDraftField({value:'Reviewed draft already applied',dataset:{}}));
});
