import fs from 'node:fs';
import path from 'node:path';
import {renderFloorPlanPage,floorPlanThemeCSS,floorPlanSharedThemeCSS} from './floor-plan-site-shell.mjs';
import {groupedHeaderHTML} from './header-grouping.mjs';

export function localFloorPlanEnabled(env) {
  return env.OZ_FLOORPLAN_ENABLED === 'true' && ['dev','local'].includes(env.CONTEXT)
    && !env.NETLIFY && !env.DEPLOY_ID && !env.NETLIFY_LOCAL;
}

const guideLink = '<section class="section"><div class="shell"><h2>Measure a floor plan</h2><p>Open a plan on your device, trace the rooms and take your estimated floor area to an enquiry.</p><a href="/floor-plan/">Open the floor plan tool</a></div></section>';
const contactAdapter = '<script defer src="/floor-plan/contact-entry.js"></script>';
const floorPlanLink = '<a href="/floor-plan/">Floor Area Tool</a>';
const homeEntry = '<section class="section" aria-labelledby="home-floorplan-title"><div class="shell"><p class="eyebrow">Plan your flooring</p><h2 id="home-floorplan-title">Have a floor plan? Start with your area.</h2><p>Open your drawing, set its scale and trace the rooms receiving flooring. Bring your estimate to an enquiry, or ask our team to review your plan.</p><div class="button-row"><a class="button" href="/floor-plan/">Measure my floor plan</a><a class="button-secondary" href="/contact/?enquiry=supply-install&amp;source=home-floorplan">Ask for plan review</a></div></div></section>';
export function removeFloorPlanDiscovery(html) {return html.replaceAll('<a href="/floor-plan/">Floor Plan</a>',floorPlanLink).replace(/(<nav\b[^>]*class="arch-primary"[^>]*>)([\s\S]*?)(<\/nav>)/,(whole,open,links,close)=>open+links.replace(/<a href="\/floor-plan\/"(?: aria-current="page")?>(?:Floor Plan|Floor Area Tool)<\/a>/g,'')+close).replaceAll(floorPlanLink+'<a href="/guides/">Guides</a>','<a href="/guides/">Guides</a>').replaceAll(floorPlanLink+'<a href="/guides/">Flooring guides</a>','<a href="/guides/">Flooring guides</a>').replace(homeEntry,'');}
export function addFloorPlanDiscovery(output) {
  function visit(dir) {for(const entry of fs.readdirSync(dir,{withFileTypes:true})) {const file=path.join(dir,entry.name);if(entry.isDirectory()){if(entry.name!=='floor-plan')visit(file);continue;}if(!entry.name.endsWith('.html'))continue;let html=fs.readFileSync(file,'utf8');const before=html;
    html=groupedHeaderHTML(html,{floorPlan:true}).replaceAll('<a href="/floor-plan/">Floor Plan</a>',floorPlanLink);
    for(const label of ['Guides','Flooring guides']){const guide='<a href="/guides/">'+label+'</a>';html=html.replaceAll(floorPlanLink+guide,guide).replaceAll(guide,floorPlanLink+guide);}
    if(path.relative(output,file)==='index.html'&&!html.includes('id="home-floorplan-title"')) {if(html.split('</main>').length!==2)throw Error('Unexpected homepage main boundary');html=html.replace('</main>',homeEntry+'</main>');}
    if(html!==before)fs.writeFileSync(file,html);
  }}visit(output);
}
export function addFloorPlan(root, output) {
  const feature = path.join(root,'floor-plan');
  const target = path.join(output,'floor-plan');
  fs.mkdirSync(target,{recursive:true});
  // Keep measurement layout intact; draw chrome/theme from the current Oz shell.
  fs.writeFileSync(path.join(target,'index.html'),renderFloorPlanPage(root));
  fs.writeFileSync(path.join(target,'site-tool.css'),floorPlanThemeCSS(root));
  fs.writeFileSync(path.join(target,'site-theme.css'),floorPlanSharedThemeCSS(root));
  for (const file of ['tool.css','tool.mjs','plan-loader.mjs','geometry.mjs','summary.mjs','context.mjs','contact-entry.js','contact-review.mjs','operon-runtime.mjs','operon-quick-room.js','operon-mobile-nav.js','operon-base.css','operon-page.css','port-inline-layout.css','port-accessibility.css','port-adapter.mjs']) {
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
  addFloorPlanDiscovery(output);
}

export function checkFloorPlan(output, enabled) {
  if (fs.existsSync(path.join(output,'floor-plan')) !== enabled) throw Error('Unexpected floor plan package state');
  for (const file of ['contact/index.html','contact.html','guides/index.html','guides.html']) {
    const html=fs.readFileSync(path.join(output,file),'utf8');
    if (html.includes(file.startsWith('contact') ? contactAdapter : guideLink) !== enabled) throw Error('Unexpected floor plan entry in '+file);
  }
  const home=fs.readFileSync(path.join(output,'index.html'),'utf8');
  if(home.includes('id="home-floorplan-title"')!==enabled)throw Error('Unexpected homepage floorplan discovery state');
  if(enabled&&!home.includes(floorPlanLink))throw Error('Missing homepage floorplan navigation');
}
