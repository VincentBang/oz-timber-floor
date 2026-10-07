// Preserve the exact owned legacy image referenced in the supplied GSC Pages export.
import fs from 'node:fs';
import crypto from 'node:crypto';
const source='https://oztimberfloor.com.au/wp-content/uploads/2020/05/solid_hardwood_flooring_nsw_spotted_gum_lifestyle_2.jpg';
const file='assets/legacy/solid_hardwood_flooring_nsw_spotted_gum_lifestyle_2.jpg';
const r=await fetch(source,{signal:AbortSignal.timeout(30000)});if(r.status!==200||!r.headers.get('content-type')?.startsWith('image/'))throw new Error('Legacy image is not currently available');
const bytes=Buffer.from(await r.arrayBuffer());if(bytes[0]!==255||bytes[1]!==216)throw new Error('Expected original JPEG');
if(fs.existsSync(file)&&!fs.readFileSync(file).equals(bytes))throw new Error('Existing local resource differs; do not overwrite');
fs.mkdirSync('assets/legacy',{recursive:true});fs.writeFileSync(file,bytes);
const record={source,file,checkedAt:new Date().toISOString(),bytes:bytes.length,sha256:crypto.createHash('sha256').update(bytes).digest('hex'),treatment:'byte-identical owned legacy image; no colour or content editing'};
fs.writeFileSync('docs/migration-october-2026-followup/legacy-image.json',JSON.stringify(record,null,2)+'\n');console.log(JSON.stringify(record,null,2));
