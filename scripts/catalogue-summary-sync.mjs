// Synchronise embedded copies of the two reviewed range summaries without
// regenerating unrelated layouts, catalogue facts, SEO owners or hold policies.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
export function syncCatalogueSummaries({root, data, apply=false}) {
  const hardwood=data.ranges.find(r=>r.slug==='hardwood-collection');
  const aqua=data.ranges.find(r=>r.slug==='kronoswiss-aquastop');
  const sitemap=new Set([...fs.readFileSync(path.join(root,'sitemap.xml'),'utf8').matchAll(/<loc>(.*?)<\/loc>/g)].map(m=>m[1]));
  const normal=s=>String(s).replace(/^\/?products\//,'').replace(/\/$/,'');
  const members=[...new Set(hardwood.productSlugs.map(normal))].filter(slug=>{
    const url=`https://oztimberfloor.com.au/products/${slug}/`;
    const file=path.join(root,'products',slug,'index.html');
    if(!sitemap.has(url)||!fs.existsSync(file))return false;
    const html=fs.readFileSync(file,'utf8');
    return html.includes(`rel="canonical" href="${url}"`)&&!/<meta[^>]*name="robots"[^>]*content="[^"]*noindex/i.test(html);
  });
  assert.equal(hardwood.colourCount,members.length,'Data count must equal published membership');
  const changes=[];
  function walk(dir){for(const e of fs.readdirSync(dir,{withFileTypes:true})){
    if(e.name.startsWith('.')||['dist','node_modules','docs','migration','config','data','scripts'].includes(e.name))continue;
    const file=path.join(dir,e.name);
    if(e.isDirectory()){walk(file);continue;}
    if(!e.name.endsWith('.html'))continue;
    const before=fs.readFileSync(file,'utf8');
    let after=before.replace(/<a\b[^>]*>[\s\S]*?<\/a>/g,card=>{
      if(!/class="[^"]*(?:range-summary-card|range-card)/.test(card))return card;
      if(card.includes('href="/ranges/hardwood-collection/"'))return card.replace(/\d+ colours/g,`${members.length} colours`);
      if(card.includes('href="/ranges/kronoswiss-aquastop/"')){
        const badge=`<span class="pill">${aqua.thickness}</span>`;
        return /<span class="pill">[\d\s/.]+mm<\/span>/.test(card)
          ?card.replace(/<span class="pill">[\d\s/.]+mm<\/span>/g,badge)
          :card.replace('<p class="product-meta">',`<p class="product-meta">${badge}`);
      }
      return card;
    });
    // Relevant machine-readable values, if present, follow the same source.
    after=after.replace(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g,(whole,json)=>{
      const schema=JSON.parse(json);
      function visit(v){if(!v||typeof v!=='object')return;if(Array.isArray(v)){v.forEach(visit);return;}
        const identity=String(v.url||v['@id']||'');
        if(identity.includes('/ranges/hardwood-collection/')&&Object.hasOwn(v,'numberOfItems'))v.numberOfItems=members.length;
        if(identity.includes('/ranges/kronoswiss-aquastop/'))for(const prop of v.additionalProperty||[])if(prop.name==='Thickness')prop.value=aqua.thickness;
        Object.values(v).forEach(visit);
      }
      const old=JSON.stringify(schema);visit(schema);
      return old===JSON.stringify(schema)?whole:`<script type="application/ld+json">${JSON.stringify(schema)}</script>`;
    });
    if(before!==after){changes.push(path.relative(root,file));if(apply)fs.writeFileSync(file,after);}
  }}
  walk(root);return {publishedHardwoodColours:members.length,kronoswissThickness:aqua.thickness,changes};
}
