import fs from 'node:fs';
import path from 'node:path';
import {createServer} from 'node:http';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
export const base=process.env.OZ_QA_OUTPUT,root=process.env.OZ_QA_ROOT;
if(!base||!root||!path.isAbsolute(base)||!path.isAbsolute(root))throw Error('Run through scripts/floor-plan-qa.mjs with explicit isolated paths.');
export const browsers=require(process.env.OZ_PLAYWRIGHT_PATH||'playwright');
export async function launch(engine){
 if(!['chromium','firefox','webkit'].includes(engine))throw Error('Unknown browser engine');
 return browsers[engine].launch({headless:true,...(engine==='chromium'&&process.env.OZ_CHROME_PATH&&{executablePath:process.env.OZ_CHROME_PATH})});
}
export async function serve(){
 const server=createServer((req,res)=>{
  if(req.method!=='GET'){res.writeHead(405).end();return;}
  let uri;try{uri=decodeURIComponent(new URL(req.url,'http://localhost').pathname);}catch{res.writeHead(400).end();return;}
  let file;
  if(uri==='/qa/axe.js')file=process.env.OZ_AXE_PATH||require.resolve('axe-core/axe.min.js');
  else{
   const fixture=uri.startsWith('/fixtures/'),dir=fixture?base+'/fixtures':root+'/dist';
   file=path.resolve(dir,fixture?uri.slice('/fixtures/'.length):'.'+uri+(uri.endsWith('/')?'index.html':''));
   if(!file.startsWith(dir+'/')){res.writeHead(403).end();return;}
  }
  try{const ext=path.extname(file);res.writeHead(200,{'Content-Type':({'.html':'text/html','.mjs':'text/javascript','.js':'text/javascript','.css':'text/css','.png':'image/png','.jpg':'image/jpeg','.svg':'image/svg+xml','.wasm':'application/wasm'})[ext]||'application/octet-stream','X-Robots-Tag':'noindex, nofollow','Cache-Control':'no-store'}).end(fs.readFileSync(file));}catch{res.writeHead(404).end();}
 });await new Promise((r,j)=>{server.once('error',j);server.listen(0,'127.0.0.1',r);});
 return{origin:'http://127.0.0.1:'+server.address().port,close:()=>new Promise(r=>server.close(r))};
}
export const sample=base+'/samples/sample-room-5m-by-4m.png';
export async function point(p,x,y){if(!await p.locator('#coords').evaluate(e=>e.open))await p.locator('#coords summary').click();await p.locator('#point-x').fill(String(x));await p.locator('#point-y').fill(String(y));await p.locator('#add-point').focus();await p.keyboard.press('Enter');}
export async function open(p,origin){await p.goto(origin+'/floor-plan/');await p.locator('#plan-file').setInputFiles(sample);await p.waitForFunction(()=>document.querySelector('#status').textContent.startsWith('Plan ready'));}
