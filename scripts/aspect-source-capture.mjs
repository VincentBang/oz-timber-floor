import fs from 'node:fs';
import crypto from 'node:crypto';
const names=['acacia','alpine-snow','blackbutt-3','chablis','hazelnut','heron-grey','honeybee','moonstone','sandalwood','silverwood','spotted-gum-2','stone-grey','surfside','wattleseed','wide-plank-copper-brown','wide-plank-dusk-grey','wide-plank-matterhorn','wide-plank-polar-ice'];
const records=[];let next=0;
await Promise.all(Array.from({length:4},async()=>{while(next<names.length){const slug=names[next++],url=`https://preferencefloors.com.au/floor/${slug}/`;const r=await fetch(url,{signal:AbortSignal.timeout(30000)}),html=await r.text();if(!r.ok)throw Error(url+': '+r.status);const plain=html.replace(/<script\b[\s\S]*?<\/script>/gi,'').replace(/<style\b[\s\S]*?<\/style>/gi,'').replace(/<[^>]*>/g,' ').replace(/&nbsp;|&#160;/g,' ').replace(/\s+/g,' ');const dimension=plain.match(/ Dimension (.*?) Pack /)?.[1],pack=plain.match(/ Pack (.*?) Finish /)?.[1],brand=plain.match(/ Brand (.*?) (?:Find your nearest store|Details)/)?.[1];
if(!dimension||!pack||!brand)throw Error('Missing product facts '+slug);
records.push({slug,url,status:r.status,retrievedAt:new Date().toISOString(),sha256:crypto.createHash('sha256').update(html).digest('hex'),dimension,pack,brand});
}}));records.sort((a,b)=>a.slug.localeCompare(b.slug));fs.mkdirSync('docs/aspect-correction',{recursive:true});fs.writeFileSync('docs/aspect-correction/supplier-evidence.json',JSON.stringify(records,null,2)+'\n');console.log(JSON.stringify(records.map(({slug,dimension,pack,brand})=>({slug,dimension,pack,brand})),null,2));
