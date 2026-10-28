import assert from 'node:assert/strict';

// Shared simulated conditional-write service, NOT a real Netlify deployment.
// Yield at reads/writes so independent clients compete for stale ETags.
export class ConditionalBlobFixture {
 constructor(){this.data=null;this.version=0;this.writes=[];}
 async getWithMetadata(key,options){assert.equal(options.consistency,'strong');assert.equal(options.type,'json');const entry=this.data===null?null:{data:structuredClone(this.data),etag:'"'+this.version+'"'};await Promise.resolve();return entry;}
 async setJSON(key,data,options){await Promise.resolve();this.writes.push(options);if(options.onlyIfNew?this.data!==null:options.onlyIfMatch!=='"'+this.version+'"')return {modified:false};this.data=structuredClone(data);this.version++;return {modified:true,etag:'"'+this.version+'"'};}
}
