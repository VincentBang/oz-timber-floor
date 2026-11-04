import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { createRequire } from 'node:module';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { before, after, test } from 'node:test';

// Optional browser QA dependency, kept out of the public package.
const browsers = createRequire(import.meta.url)(process.env.OZ_PLAYWRIGHT_PATH || 'playwright');
const engine = process.env.OZ_BROWSER || 'chromium';
assert(['chromium','firefox','webkit'].includes(engine),'Unsupported test browser');
const route = new URL('../floor-plan/', import.meta.url);
const fetched = [];
let browser, page, server, origin;

function pdfFixture(count, encrypted = false) {
  const objects = [], refs = Array.from({ length: count }, (_, i) => 4 + 2 * i);
  objects.push('<< /Type /Catalog /Pages 2 0 R /OpenAction << /S /URI /URI (https://floorplan-open-action.invalid/) >> >>',
    '<< /Type /Pages /Kids [' + refs.map(i => i + ' 0 R').join(' ') + '] /Count ' + count + ' >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');
  for (const [index, id] of refs.entries()) {
    const stream = (index % 2 ? '0 0 1' : '1 0 0') + ' rg 0 0 200 100 re f\nBT /F1 18 Tf 0 0 0 rg 10 20 Td (Test plan) Tj ET\n';
    objects.push('<< /Type /Page /Parent 2 0 R /MediaBox [0 0 200 100] /Resources << /Font << /F1 3 0 R >> >> /Contents ' + (id + 1) + ' 0 R >>',
      '<< /Length ' + stream.length + ' >>\nstream\n' + stream + 'endstream');
  }
  if (encrypted) objects.push('<< /Filter /Standard /V 1 /R 2 /Length 40 /O <' + '01'.repeat(32) + '> /U <' + '02'.repeat(32) + '> /P -4 >>');
  let text = '%PDF-1.4\n';
  const offsets = ['0000000000 65535 f '];
  for (const [index, obj] of objects.entries()) {
    offsets.push(String(text.length).padStart(10, '0') + ' 00000 n ');
    text += (index + 1) + ' 0 obj\n' + obj + '\nendobj\n';
  }
  const xref = text.length;
  text += 'xref\n0 ' + offsets.length + '\n' + offsets.join('\n') + '\ntrailer\n<< /Size ' + offsets.length + ' /Root 1 0 R ';
  if (encrypted) text += '/Encrypt ' + objects.length + ' 0 R /ID [<0123456789ABCDEF0123456789ABCDEF> <0123456789ABCDEF0123456789ABCDEF>]';
  return text + ' >>\nstartxref\n' + xref + '\n%%EOF\n';
}

before(async () => {
  server = createServer(async (req, res) => {
    fetched.push({ method: req.method, path: req.url });
    if (req.url === '/') { res.writeHead(200, {'Content-Type':'text/html'}); res.end('<!doctype html><title>Local file intake test</title>'); return; }
    const url = new URL(req.url, 'http://localhost');
    if (!url.pathname.startsWith('/floor-plan/')) { res.writeHead(404).end(); return; }
    const file = new URL('.' + url.pathname.slice('/floor-plan'.length), route);
    if (!file.href.startsWith(route.href)) { res.writeHead(403).end(); return; }
    try {
      const content = await readFile(fileURLToPath(file));
      const type = /\.m?js$/.test(file.pathname) ? 'text/javascript' : file.pathname.endsWith('.wasm') ? 'application/wasm' : 'application/octet-stream';
      res.writeHead(200, {'Content-Type':type}); res.end(content);
    } catch { res.writeHead(404).end(); }
  });
  await new Promise((resolve, reject) => { server.once('error', reject).listen(0, '127.0.0.1', resolve); });
  origin = 'http://127.0.0.1:' + server.address().port;
  browser = await browsers[engine].launch({headless:true, ...(engine==='chromium'&&process.env.OZ_CHROME_PATH && {executablePath:process.env.OZ_CHROME_PATH})});
  console.log('Local loader browser version: '+browser.version());
  const context = await browser.newContext();
  await context.route('**/*', async route => {
    if (new URL(route.request().url()).origin !== origin || route.request().method() !== 'GET') {
      fetched.push({ unexpected:route.request().url(), method:route.request().method() }); return route.abort();
    }
    return route.continue();
  });
  page = await context.newPage(); await page.goto(origin);
  await page.evaluate(async () => { window.openLocal = (await import('/floor-plan/plan-loader.mjs')).loadPlan; });
});
after(async () => {
  await browser?.close();
  if (server?.listening) await new Promise(resolve => server.close(resolve));
});

// This probe contains synthetic fixtures only. Keep the original PNG-then-JPEG
// sequence intact; run diagnostics afterwards so a source readback cannot flush
// the encoder before the original observation. Retain failed input bytes rather
// than attempting to diagnose a later, freshly encoded replacement.
async function syntheticImageProbe() {
    const canvas = document.createElement('canvas'); canvas.width = 100; canvas.height = 80;
    const ctx = canvas.getContext('2d'); ctx.fillStyle = 'rgb(200,0,0)'; ctx.fillRect(0, 0, 100, 80);
    const results = [], blobs = [];
    const good = p => p[0]>190 && p[1]<10 && p[2]<10 && p[3]===255;
    for (const type of ['image/png', 'image/jpeg']) {
      const blob = await new Promise(resolve => canvas.toBlob(resolve, type));
      const result = await window.openLocal(new File([blob], type === 'image/png' ? 'private-plan.png' : 'private-plan.jpg', { type }));
      blobs.push(blob);
      results.push({type,size:[result.canvas.width,result.canvas.height,result.pageCount,result.pageNumber],pixel:[...result.canvas.getContext('2d').getImageData(10,10,1,1).data]});
    }
    for (const [i,sample] of results.entries()) {
      sample.sourceAfter=[...ctx.getImageData(10,10,1,1).data];
      const url=URL.createObjectURL(blobs[i]);
      try {
        const image=new Image();image.src=url;await image.decode();
        const independent=document.createElement('canvas');independent.width=100;independent.height=80;
        independent.getContext('2d').drawImage(image,0,0);
        sample.independent=[...independent.getContext('2d').getImageData(10,10,1,1).data];
      } catch(error) { sample.independentError=error.message; }
      finally { URL.revokeObjectURL(url); }
      if(!good(sample.pixel)||!sample.independent||!good(sample.independent))sample.encodedBytes=Array.from(new Uint8Array(await blobs[i].arrayBuffer()));
    }
    return results;
}

test('JPG and PNG render locally without requesting PDF assets', async () => {
  const samples = await page.evaluate(syntheticImageProbe);
  for (const sample of samples) {
    assert.deepEqual(sample.size, [100,80,1,1]);
    for(const pixel of [sample.pixel,sample.independent])assert(pixel&&pixel[0]>190&&pixel[1]<10&&pixel[2]<10&&pixel[3]===255,'Expected the drawn red rectangle; retained synthetic diagnostic: '+JSON.stringify(samples));
  }
  assert(!fetched.some(x=>x.path?.includes('/vendor/')));
});

test('a blank render retains the original encoded fixture and distinguishes decoder output from input',async()=>{
  await page.evaluate(()=>{window.originalOpenLocal=window.openLocal;window.openLocal=async(...args)=>{const result=await window.originalOpenLocal(...args);const ctx=result.canvas.getContext('2d');ctx.fillStyle='black';ctx.fillRect(0,0,result.canvas.width,result.canvas.height);return result;};});
  let samples;try{samples=await page.evaluate(syntheticImageProbe);}finally{await page.evaluate(()=>{window.openLocal=window.originalOpenLocal;delete window.originalOpenLocal;});}
  for(const sample of samples){assert.deepEqual(sample.pixel,[0,0,0,255]);assert(sample.sourceAfter[0]>190);assert(sample.independent[0]>190);assert(sample.encodedBytes.length>100);}
  assert.deepEqual(samples[0].encodedBytes.slice(0,4),[137,80,78,71]);assert.deepEqual(samples[1].encodedBytes.slice(0,2),[255,216]);
});

test('large drawings are scaled uniformly and camera JPEG orientation is respected', async () => {
  const result = await page.evaluate(async () => {
    const c = document.createElement('canvas'); c.width=5000; c.height=2500;
    const large=await window.openLocal(new File([await new Promise(resolve=>c.toBlob(resolve))],'wide.png'));
    c.width=120; c.height=80;
    const jpeg = new Uint8Array(await (await new Promise(resolve=>c.toBlob(resolve,'image/jpeg'))).arrayBuffer());
    // A valid APP1 EXIF record with orientation 6 (rotate 90° clockwise).
    const exif=new Uint8Array([255,225,0,34,69,120,105,102,0,0,73,73,42,0,8,0,0,0,1,0,18,1,3,0,1,0,0,0,6,0,0,0,0,0,0,0]);
    const rotated=await window.openLocal(new File([jpeg.subarray(0,2),exif,jpeg.subarray(2)],'rotated.jpg'));
    return [large.canvas.width,large.canvas.height,rotated.canvas.width,rotated.canvas.height];
  });
  assert(result[0]*result[1] <= 8_000_000); assert(Math.abs(result[0]/result[1]-2)<0.001);
  assert.deepEqual(result.slice(2), [80,120]);
});

test('bitmap decode rejection uses the native decoder without bypassing validation or cancellation',async()=>{
 const result=await page.evaluate(async()=>{
  const c=document.createElement('canvas');c.width=120;c.height=80;
  const ctx=c.getContext('2d');ctx.fillStyle='rgb(200,0,0)';ctx.fillRect(0,0,120,80);
  const jpeg=new Uint8Array(await(await new Promise(r=>c.toBlob(r,'image/jpeg'))).arrayBuffer());
  const exif=new Uint8Array([255,225,0,34,69,120,105,102,0,0,73,73,42,0,8,0,0,0,1,0,18,1,3,0,1,0,0,0,6,0,0,0,0,0,0,0]);
  const file=new File([jpeg.subarray(0,2),exif,jpeg.subarray(2)],'camera.jpg',{type:'image/jpeg'});
  const original=window.createImageBitmap,create=URL.createObjectURL,revoke=URL.revokeObjectURL;
  let created=0,revoked=0,calls=0,cancelled='',invalid='';
  try{
   URL.createObjectURL=(...args)=>{created++;return create.apply(URL,args);};URL.revokeObjectURL=(...args)=>{revoked++;return revoke.apply(URL,args);};
   window.createImageBitmap=async()=>{calls++;throw new DOMException('Synthetic bitmap rejection','InvalidStateError');};
   const loaded=await window.openLocal(file);const pixels=[...loaded.canvas.getContext('2d').getImageData(10,10,1,1).data];
   try{await window.openLocal(new File([jpeg.slice(0,-20)],'broken.jpg'));}catch(e){invalid=e.message;}
   let entered,release;const ready=new Promise(r=>entered=r),gate=new Promise(r=>release=r);
   window.createImageBitmap=async()=>{entered();await gate;throw new DOMException('Synthetic rejection after cancellation','InvalidStateError');};
   const controller=new AbortController(),pending=window.openLocal(file,1,controller.signal);await ready;controller.abort();release();try{await pending;}catch(e){cancelled=e.message;}
   await Promise.resolve();await Promise.resolve();
   return {size:[loaded.canvas.width,loaded.canvas.height],pixels,created,revoked,calls,cancelled,invalid};
  }finally{window.createImageBitmap=original;URL.createObjectURL=create;URL.revokeObjectURL=revoke;}
 });
 assert.deepEqual(result.size,[80,120]);assert(result.pixels[0]>190&&result.pixels[1]<10&&result.pixels[2]<10&&result.pixels[3]===255);
 assert.equal(result.created,1);assert.equal(result.revoked,1);assert.equal(result.calls,1);
 assert.match(result.cancelled,/cancelled/);assert.match(result.invalid,/incomplete|damaged/);
});

test('decoded PNG and JPEG pixels survive decoder cleanup under concurrent loads', async () => {
  const failures = await page.evaluate(async () => {
    const source=document.createElement('canvas');source.width=100;source.height=80;
    const ctx=source.getContext('2d');ctx.fillStyle='rgb(200,0,0)';ctx.fillRect(0,0,100,80);
    const blobs=await Promise.all(['image/png','image/jpeg'].map(type=>new Promise(resolve=>source.toBlob(resolve,type))));
    const failures=[];
    for(let batch=0;batch<25;batch++)await Promise.all(Array.from({length:8},async(_,i)=>{
      const type=i%2?'jpeg':'png',blob=blobs[i%2];
      const result=await window.openLocal(new File([blob],'private-plan.'+type,{type:blob.type}));
      const data=[...result.canvas.getContext('2d').getImageData(10,10,1,1).data];
      if(!(data[0]>190&&data[1]<10&&data[2]<10&&data[3]===255))failures.push({batch,i,type,data});
      result.canvas.width=0;result.canvas.height=0;
    }));return failures;
  });
  assert.deepEqual(failures,[]);
});

test('a two-page vector PDF renders the requested page, including font and coloured drawing', async () => {
  const result = await page.evaluate(async (source) => {
    const file = new File([source],'private-plan.pdf',{type:'application/pdf'});
    const results=[];
    for (const n of [1,2]) {
      const { canvas, pageNumber, pageCount } = await window.openLocal(file,n);
      const ctx = canvas.getContext('2d'), image = ctx.getImageData(0,0,canvas.width,canvas.height).data;
      let black = 0; for (let i=0;i<image.length;i+=4) if (image[i]<10 && image[i+1]<10 && image[i+2]<10) black++;
      results.push({pageNumber,pageCount,width:canvas.width,height:canvas.height,pixel:[...ctx.getImageData(5,5,1,1).data],black});
    }
    return results;
  }, pdfFixture(2));
  for (const [index, r] of result.entries()) {
    assert.deepEqual([r.pageNumber,r.pageCount,r.width,r.height],[index+1,2,400,200]);
    assert.deepEqual(r.pixel,index ? [0,0,255,255] : [255,0,0,255]); assert(r.black>20, 'actual page text rendered');
  }
  assert(fetched.some(x=>x.path?.endsWith('pdf.worker.min.mjs')));
});

test('unsupported, damaged, disguised, oversized, animated and cancelled files fail closed', async () => {
  const failures = await page.evaluate(async () => {
    const errors = {};
    const failure = async (id, file, n=1, signal) => {
      try { await window.openLocal(file,n,signal); return; } catch (error) { errors[id] = error.message; }
    };
    const canvas=document.createElement('canvas');canvas.width=100;canvas.height=100;
    const png=new Uint8Array(await (await new Promise(r=>canvas.toBlob(r))).arrayBuffer());
    const huge=png.slice();new DataView(huge.buffer).setUint32(16,50000);
    const animated=png.slice(); animated.set([97,99,84,76],37);
    const truncated=new File([png.slice(0,-20)],'no.png',{type:'image/png'});
    await failure('empty',new File([],'unknown.png'));
    await failure('huge',new Blob([new Uint8Array(20*1024*1024+1)]));
    await failure('magic',new File(['<svg/>'],'fake.png',{type:'image/png'}));
    await failure('mime',new File([png],'fake.jpg',{type:'image/jpeg'}));
    await failure('svg-name',new File([png],'fake.svg'));
    await failure('exe-name',new File([png],'fake.exe'));
    await failure('dimensions',new File([huge],'huge.png'));
    await failure('truncated',truncated);
    await failure('animated',new File([animated],'animated.png'));
    await failure('range',new File([png],'plan.png'),0);
    await failure('image-page',new File([png],'plan.png'),2);
    await failure('cancelled',new File([png],'plan.png'),1,AbortSignal.abort());
    return errors;
  });
  assert.deepEqual(Object.keys(failures), ['empty','huge','magic','mime','svg-name','exe-name','dimensions','truncated','animated','range','image-page','cancelled']);
  assert.match(failures.animated,/Animated PNG/); assert.match(failures.dimensions,/megapixels/);
  assert.match(failures['svg-name'],/does not match/); assert.match(failures['exe-name'],/does not match/);
  const extensionless = await page.evaluate(async () => {
    const canvas = document.createElement('canvas'); canvas.width = 50; canvas.height = 40;
    const png = await new Promise(resolve => canvas.toBlob(resolve));
    const results = [];
    for (const type of ['', 'image/png']) {
      const result = await window.openLocal(new File([png], 'plan', { type }));
      results.push([result.canvas.width, result.canvas.height]);
    }
    return results;
  });
  assert.deepEqual(extensionless, [[50, 40], [50, 40]]);
});

test('reject a missing page, excessive PDF pages, broken document and encrypted plan', async () => {
  const results=await page.evaluate(async (sources) => {
    const errors=[];
    for (const [source,n] of sources) {
      try { await window.openLocal(new File([source],'private-plan.pdf',{type:'application/pdf'}),n); errors.push('Unexpected success'); }
      catch (e) {errors.push(e.message);}
    }
    return errors;
  },[[pdfFixture(2),3],[pdfFixture(31),1],['%PDF-broken',1],[pdfFixture(1,true),1]]);
  assert.match(results[0],/not in this PDF/); assert.match(results[1],/more than 30 pages/);
  assert.match(results[2],/could not be drawn/); assert.match(results[3],/password-protected/);
});

test('superseding a worker load cancels cleanly and a later PDF can still open', async () => {
  const result=await page.evaluate(async (source)=>{
    const file=new File([source],'private-plan.pdf');
    const cancel = new AbortController();
    const loading=window.openLocal(file,1,cancel.signal);
    setTimeout(()=>cancel.abort(),0);
    let message=''; try { await loading; } catch (e) { message=e.message; }
    const next=await window.openLocal(file,2);
    return [message,next.pageNumber,next.pageCount];
  },pdfFixture(2));
  assert.match(result[0],/cancelled/);assert.deepEqual(result.slice(1),[2,2]);
});

test('only same-origin static resources were requested, without filenames, submissions or client storage',async()=>{
  assert(!fetched.some(x=>x.unexpected || x.method!=='GET' || x.path.includes('private-plan') || x.path.includes('?')));
  assert.deepEqual(await page.evaluate(()=>[sessionStorage.length,localStorage.length]),[0,0]);
});

test('image fallback renders pixels and delayed bitmap cancellation closes the resource',async()=>{
 const result=await page.evaluate(async()=>{
  const c=document.createElement('canvas');c.width=100;c.height=80;const ctx=c.getContext('2d');ctx.fillStyle='rgb(200,0,0)';ctx.fillRect(0,0,100,80);
  const file=new File([await new Promise(r=>c.toBlob(r,'image/jpeg'))],'synthetic.jpg',{type:'image/jpeg'});
  const original=window.createImageBitmap;
  let fallback,closed=0,message='';
  try{
   window.createImageBitmap=undefined;fallback=await window.openLocal(file);
   let entered,release;const ready=new Promise(r=>entered=r),gate=new Promise(r=>release=r);
   window.createImageBitmap=async(...args)=>{const bitmap=await original(...args);const close=bitmap.close.bind(bitmap);bitmap.close=()=>{closed++;close()};entered();await gate;return bitmap;};
   const controller=new AbortController(),pending=window.openLocal(file,1,controller.signal);await ready;controller.abort();release();try{await pending;}catch(e){message=e.message;}
   // Let the already-resolved decoder continuation complete; no wall-clock delay or retry.
   await Promise.resolve();await Promise.resolve();
  }finally{window.createImageBitmap=original;}
  const next=await window.openLocal(file);
  return {closed,message,fallback:[...fallback.canvas.getContext('2d').getImageData(10,10,1,1).data],next:[...next.canvas.getContext('2d').getImageData(10,10,1,1).data]};
 });
 assert.equal(result.closed,1);assert.match(result.message,/cancelled/);
 for(const pixel of [result.fallback,result.next]){assert(pixel[0]>190);assert(pixel[1]<10&&pixel[2]<10);assert.equal(pixel[3],255);}
});
