import fs from 'node:fs';
import assert from 'node:assert/strict';
const escape=value=>String(value).replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;').replaceAll('>','&gt;');
export function preAudienceHTML(html,file,root) {
 const pages=JSON.parse(fs.readFileSync(root+'/data/audience-service-pages.json')).pages;
 const cards=pages.map(p=>`<a class="card link-card" href="${p.route}"><h3>${escape(p.hubCard.heading)}</h3><p>${escape(p.hubCard.description)}</p><p>${escape(p.hubCard.linklabel)}</p><span class="card-arrow" aria-hidden="true">→</span></a>`).join('');
 const blocks=[
  {files:['services.html','services/index.html'],name:'service-cards',html:cards},
  {files:['builder-flooring-contractor-sydney.html','builder-flooring-contractor-sydney/index.html'],name:'insurance-link',html:'<section class="section"><div class="shell text-block"><h2>Flooring work for insurance repair projects</h2><p>For repairs managed through an insurance builder, see our <a href="/insurance-flooring-repairs/">insurance flooring repairs and replacement service</a> and send the flooring scope, property suburb and access requirements.</p></div></section>'},
  {files:['commercial-flooring.html','commercial-flooring/index.html','commercial-flooring-sydney.html','commercial-flooring-sydney/index.html'],name:'property-link',html:'<section class="section"><div class="shell text-block"><h2>Manage flooring work for a rental property</h2><p>For tenancy changeovers, small repairs or replacement flooring, see our <a href="/property-manager-flooring/">flooring service for property managers and rental properties</a>, including tenant and agency key coordination.</p></div></section>'},
 ];
 for(const block of blocks){const open='<!-- audience-'+block.name+' -->';if(!html.includes(open))continue;assert(block.files.includes(file),'Audience block on an unreviewed page');const exact=open+block.html+'<!-- /audience-'+block.name+' -->';assert.equal(html.split(exact).length,2,'Audience discovery must exactly match reviewed copy and destinations');assert.equal(html.split(open).length,2,'Duplicate audience block');html=html.replace(exact,'');}
 return html;
}
