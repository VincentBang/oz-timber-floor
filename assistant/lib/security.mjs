import crypto from 'node:crypto';
export const hash = value => crypto.createHash('sha256').update(typeof value === 'string' || value instanceof Uint8Array ? value : JSON.stringify(value)).digest('hex');
export const isObject = value => value !== null && typeof value === 'object' && !Array.isArray(value) && Object.getPrototypeOf(value) === Object.prototype;
export function exactKeys(value, allowed) { return isObject(value) && Object.keys(value).every(k => allowed.includes(k) && !['__proto__','constructor','prototype'].includes(k)); }
export function redact(text) {
  return String(text).replace(/[\w.+-]+@[\w.-]+\.[a-z]{2,}/gi,'[email removed]').replace(/(?:\+?\d[\d ()-]{7,}\d)/g,'[phone removed]').replace(/\b\d{1,5}\s+[\w '-]{1,60}\s(?:street|st|road|rd|avenue|ave|drive|dr|lane|ln)\b/gi,'[address removed]').replace(/\b(?:my name is|i am called)\s+[^,.!?\n]{1,60}/gi,'[name removed]');
}
export function issueToken(secret, now = Date.now()) {
  if (!secret || secret.length < 32) throw Error('configuration');
  const value = Buffer.from(JSON.stringify({id:crypto.randomUUID(),exp:now+900000})).toString('base64url');
  return value+'.'+crypto.createHmac('sha256',secret).update(value).digest('base64url');
}
export function verifyToken(token, secret, now = Date.now()) {
  if(typeof token!=='string'||token.length>512||!secret||secret.length<32)throw Error('session');
  const [value,signature,...extra]=token.split('.');if(extra.length||!signature)throw Error('session');
  const expected=crypto.createHmac('sha256',secret).update(value).digest('base64url');
  if(signature.length!==expected.length||!crypto.timingSafeEqual(Buffer.from(signature),Buffer.from(expected)))throw Error('session');
  const data=JSON.parse(Buffer.from(value,'base64url'));if(!exactKeys(data,['id','exp'])||!/^[\da-f-]{36}$/.test(data.id)||!Number.isFinite(data.exp)||data.exp<=now||data.exp>now+900000)throw Error('session');return data;
}
export function ipKey(ip, secret, now = Date.now()) {return crypto.createHmac('sha256',secret).update(new Date(now).toISOString().slice(0,10)+':'+ip).digest('hex');}
export async function readRequest(request) {
  if(request.method!=='POST')throw Error('method');
  if(!/^application\/json(?:\s*;|$)/i.test(request.headers.get('content-type')||''))throw Error('content_type');
  if(Number(request.headers.get('content-length'))>12288)throw Error('too_large');
  const reader=request.body?.getReader();if(!reader)throw Error('request');let bytes=0,parts=[];
  try{for(;;){const {done,value}=await reader.read();if(done)break;bytes+=value.byteLength;if(bytes>12288){await reader.cancel();throw Error('too_large');}parts.push(Buffer.from(value));}}finally{reader.releaseLock();}
  let value;try{value=JSON.parse(Buffer.concat(parts).toString('utf8'));}catch{throw Error('request');}
  if(!exactKeys(value,['op','message','history','pagePath','entityId','sessionToken','requestId','aiUseAcknowledged']))throw Error('request');
  if(value.aiUseAcknowledged!==undefined&&typeof value.aiUseAcknowledged!=='boolean')throw Error('request');
  if(!['session','message'].includes(value.op)||typeof value.requestId!=='string'||!/^[A-Za-z0-9_-]{8,80}$/.test(value.requestId))throw Error('request');
  if(value.op==='session'){if(Object.keys(value).some(k=>!['op','requestId','aiUseAcknowledged'].includes(k)))throw Error('request');return value;}
  if(typeof value.message!=='string'||!value.message.trim()||value.message.length>2000||/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u202a-\u202e]/.test(value.message))throw Error('request');
  if(typeof value.pagePath!=='string'||value.pagePath.length>240||!/^\/(?!\/)[^?#\\]*$/.test(value.pagePath))throw Error('request');
  if(value.entityId!==undefined&&(typeof value.entityId!=='string'||!/^[\da-f]{24}$/.test(value.entityId)))throw Error('request');
  if(!Array.isArray(value.history)||value.history.length>6||!value.history.every(t=>exactKeys(t,['role','content'])&&['user','assistant'].includes(t.role)&&typeof t.content==='string'&&t.content.length<=2000))throw Error('request');
  return value;
}
