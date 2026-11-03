import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {repairLegacyGuideImages} from './legacy-guide-images.mjs';
const placeholder = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
const image = src => '<article><img src="'+placeholder+'" data-src="'+src+'" width="600" height="400" alt="" fetchpriority="high"></article>';
test('native lazy loading restores only the verified local article image', () => {
  const src='/assets/guides/legacy-wp/test.jpg';
  const result=repairLegacyGuideImages(image(src), p=>p===src);
  assert.equal(result.repaired,1);
  assert(result.html.includes('src="'+src+'"'));
  assert(!result.html.includes('src="'+placeholder+'"'));
  assert(result.html.includes('loading="lazy"'));
  assert(!result.html.includes('fetchpriority'));
  assert(result.html.includes('width="600" height="400" alt=""'));
  assert.deepEqual(repairLegacyGuideImages(result.html,()=>true),{html:result.html,repaired:0});
  const reordered=image(src).replace('src="'+placeholder+'" data-src="'+src+'"','data-src="'+src+'" src="'+placeholder+'"');
  const reorderedResult=repairLegacyGuideImages(reordered,()=>true).html;
  assert(!reorderedResult.includes(placeholder));
  assert(reorderedResult.includes('data-src="'+src+'" src="'+src+'"'));
});
test('external, traversal and missing assets fail closed', () => {
  for(const src of ['https://example.com/photo.jpg','/assets/guides/legacy-wp/../photo.jpg','/assets/guides/legacy-wp/missing.jpg'])
    assert.throws(()=>repairLegacyGuideImages(image(src),()=>false),/verified existing local asset/);
});
test('hero and genuine image attributes stay byte-identical', () => {
  const html='<img src="/assets/hero.webp" loading="eager" fetchpriority="high" width="900" height="600">';
  assert.equal(repairLegacyGuideImages(html,()=>true).html,html);
  assert.throws(()=>repairLegacyGuideImages(image('/assets/guides/legacy-wp/test.jpg').replace(/<\/?article>/g,''),()=>true),/outside article/);
});
test('every guide is already free of inert legacy image placeholders', () => {
  const root=new URL('../guides/',import.meta.url);
  for(const entry of fs.readdirSync(root,{withFileTypes:true})) {
    const file=new URL(entry.name+'/index.html',root);
    if(entry.isDirectory()&&fs.existsSync(file))assert(!fs.readFileSync(file,'utf8').includes('src="'+placeholder+'"'),entry.name);
  }
});
