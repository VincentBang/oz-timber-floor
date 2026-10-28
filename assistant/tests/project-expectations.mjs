import {projectAnswer} from '../lib/project-knowledge.mjs';
// Only three historical project questions have a later, owner-evidenced state.
// All other expectations and every negative constraint remain unchanged.
const successors=new Map([
 ['business-5','Tell me about your completed projects'],
 ['business-6','Show client jobs in your projects'],
 ['business-7','Are these project examples completed jobs?']
]);
export function reviewedExpectation(original,corpus){
 if(successors.get(original.id)!==original.message||original.reason!=='planning_examples'||projectAnswer(corpus).reason!=='reviewed_project_photos')return original;
 return {...original,reason:'reviewed_project_photos',contains:['photographs',"Oz Timber Floor's flooring work",'do not confirm the exact product'],not:[...(original.not||[]),'planning examples, not verified','completed a project in'],paths:['/projects/'],expectationBasis:'2026-10-28-owner-approved-project-photo-successor'};
}
