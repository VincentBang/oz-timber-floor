import {projectAnswer} from '../lib/project-knowledge.mjs';
// The historical tuple stays immutable. Only this exact historical question and
// exact old assertion have a successor, requiring validated project evidence.
export function reviewedHoldoutExpectation(original,corpus){
 const [question,status,contains]=original;
 if(question!=='Is the project gallery proof of completed jobs?'||JSON.stringify(status)!=='["answered"]'||JSON.stringify(contains)!=='["planning examples","not verified"]'||projectAnswer(corpus).reason!=='reviewed_project_photos')return {tuple:original};
 return {tuple:[question,status,['photographs',"Oz Timber Floor's flooring work",'do not confirm the exact product','customer identity','individual suburb','suitability for another site']],reason:'reviewed_project_photos',source:'/projects/',prohibited:['planning examples, not verified','completed a project in'],basis:'2026-10-28 owner-approved photograph records and exact hashed image evidence; no product/client/suburb verification'};
}
