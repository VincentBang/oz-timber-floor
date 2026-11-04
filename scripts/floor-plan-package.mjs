import fs from 'node:fs';
import path from 'node:path';

export function localFloorPlanEnabled(env) {
  return env.OZ_FLOORPLAN_ENABLED === 'true' && ['dev','local'].includes(env.CONTEXT)
    && !env.NETLIFY && !env.DEPLOY_ID && !env.NETLIFY_LOCAL;
}

const guideLink = '<section class="section"><div class="shell"><h2>Measure a floor plan</h2><p>Open a plan on your device, trace the rooms and take your estimated floor area to an enquiry.</p><a href="/floor-plan/">Open the floor plan tool</a></div></section>';
const contactAdapter = '<script defer src="/floor-plan/contact-entry.js"></script>';
export function addFloorPlan(root, output) {
  const feature = path.join(root,'floor-plan');
  const target = path.join(output,'floor-plan');
  fs.mkdirSync(target,{recursive:true});
  fs.copyFileSync(path.join(feature,'page.template'),path.join(target,'index.html'));
  for (const file of ['tool.css','tool.mjs','plan-loader.mjs','geometry.mjs','summary.mjs','context.mjs','contact-entry.js','contact-review.mjs']) {
    fs.copyFileSync(path.join(feature,file),path.join(target,file));
  }
  fs.cpSync(path.join(feature,'vendor'),path.join(target,'vendor'),{recursive:true,filter:p=>!path.basename(p).startsWith('.')});
  for (const [file,marker,fragment] of [
    ['contact/index.html','</body>',contactAdapter], ['contact.html','</body>',contactAdapter],
    ['guides/index.html','</main>',guideLink], ['guides.html','</main>',guideLink],
  ]) {
    const destination = path.join(output,file);
    const before = fs.readFileSync(destination,'utf8');
    if (before.split(marker).length !== 2 || before.includes(fragment)) throw Error('Unexpected floor plan insertion point in '+file);
    fs.writeFileSync(destination,before.replace(marker,fragment+marker));
  }
}

export function checkFloorPlan(output, enabled) {
  if (fs.existsSync(path.join(output,'floor-plan')) !== enabled) throw Error('Unexpected floor plan package state');
  for (const file of ['contact/index.html','contact.html','guides/index.html','guides.html']) {
    const html=fs.readFileSync(path.join(output,file),'utf8');
    if (html.includes(file.startsWith('contact') ? contactAdapter : guideLink) !== enabled) throw Error('Unexpected floor plan entry in '+file);
  }
}
