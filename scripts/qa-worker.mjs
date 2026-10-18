/** Service-worker lifecycle/update tests with explicit mock cache/network APIs. */
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const script=readFileSync(new URL('../public/sw.js',import.meta.url),'utf8');
const origin='https://synthetic-qa.invalid';
function harness(active=false,remoteScript=script){
  const handlers={},stores=new Map(),events={skip:0,claim:0,network:0};let online=true;
  const key=url=>new URL(typeof url==='string'?url:url.url,origin+'/').href;
  const response=(body,status=200)=>({ok:status>=200&&status<300,status,type:'basic',text:async()=>body,clone:()=>response(body,status)});
  const caches={open:async name=>{if(!stores.has(name))stores.set(name,new Map());const map=stores.get(name);return {addAll:async urls=>{for(const url of urls)map.set(key(url),response('cached:'+url));},match:async url=>map.get(key(url)),put:async(url,r)=>map.set(key(url),r),delete:async url=>map.delete(key(url))};},keys:async()=>[...stores.keys()],delete:async name=>stores.delete(name)};
  const self={registration:{active},location:{origin},addEventListener:(name,fn)=>handlers[name]=fn,skipWaiting:async()=>events.skip++,clients:{claim:async()=>events.claim++}};
  vm.runInNewContext(script,{self,caches,URL,Response,fetch:async request=>{events.network++;if(!online)throw new Error('synthetic offline');return response(key(request).endsWith('/sw.js')?remoteScript:'network:'+key(request));}},{filename:'sw.js'});
  async function fire(type,input={}){let pending;handlers[type]({...input,waitUntil:p=>pending=p,respondWith:p=>pending=p});return await pending;}
  return {handlers,stores,events,caches,fire,offline:()=>online=false};
}
let passed=0;
async function test(name,fn){await fn();passed++;console.log('PASS:',name);}
await test('First install precaches all 12 assets and activates; update waits for explicit action',async()=>{
  const h=harness();await h.fire('install');assert.equal(h.events.skip,1);assert.equal([...h.stores.values()][0].size,12);
  const update=harness(true);await update.fire('install');assert.equal(update.events.skip,0);await update.fire('message',{data:{type:'SKIP_WAITING'}});assert.equal(update.events.skip,1);
});
await test('Offline verification checks every required asset and reports missing files',async()=>{
  const h=harness();await h.fire('install');let reply;await h.fire('message',{data:{type:'CHECK_OFFLINE'},ports:[{postMessage:r=>reply=r}]});assert.equal(reply.ready,true);assert.equal(reply.files,12);assert.equal(reply.version,'3.0.1');
  const cache=await h.caches.open('wild-explorer-3.0.1');await cache.delete('./engine.js?v=3.0.1');await h.fire('message',{data:{type:'CHECK_OFFLINE'},ports:[{postMessage:r=>reply=r}]});assert.equal(reply.ready,false);assert.equal(reply.files,11);
});
await test('Installed HTML stays paired with cached JS, and all required files work offline',async()=>{
  const h=harness();await h.fire('install');h.offline();const nav=await h.fire('fetch',{request:{method:'GET',url:origin+'/',mode:'navigate'}});assert.match(await nav.text(),/cached:.\/index.html/);assert.equal(h.events.network,0);
  for(const file of ['styles.css','app.js','engine.js','postcards.js']){const response=await h.fire('fetch',{request:{method:'GET',url:origin+'/'+file+'?v=3.0.1',mode:'cors'}});assert.equal(response.status,200);}
  assert.equal(h.events.network,0);
});
await test('Activation removes only older game caches and preserves unrelated sites',async()=>{
  const h=harness();await h.caches.open('wild-explorer-2.0.0');await h.caches.open('other-app-cache');await h.fire('install');await h.fire('activate');assert.deepEqual(await h.caches.keys(),['other-app-cache','wild-explorer-3.0.1']);assert.equal(h.events.claim,1);
});
await test('Uncached offline navigation gives clear 503; POST and cross-origin requests are untouched',async()=>{
  const h=harness();h.offline();const response=await h.fire('fetch',{request:{method:'GET',url:origin+'/',mode:'navigate'}});assert.equal(response.status,503);assert.match(await response.text(),/once with internet/);
  assert.equal(await h.fire('fetch',{request:{method:'POST',url:origin+'/',mode:'cors'}}),undefined);assert.equal(await h.fire('fetch',{request:{method:'GET',url:'https://other.invalid/',mode:'cors'}}),undefined);
});
await test('Explicit offline download repairs missing assets only for the matching release',async()=>{
  const h=harness();await h.fire('install');const cache=await h.caches.open('wild-explorer-3.0.1');await cache.delete('./engine.js?v=3.0.1');let reply;
  await h.fire('message',{data:{type:'PREPARE_OFFLINE'},ports:[{postMessage:r=>reply=r}]});assert.equal(reply.ready,true);assert.equal(reply.files,12);
  const newer=harness(false,script.replace("const VERSION = '3.0.1'", "const VERSION = '3.1.0'"));await newer.fire('install');const old=await newer.caches.open('wild-explorer-3.0.1');await old.delete('./app.js?v=3.0.1');
  await newer.fire('message',{data:{type:'PREPARE_OFFLINE'},ports:[{postMessage:r=>reply=r}]});assert.equal(reply.ready,false);assert.match(reply.error,/different game release/);assert.equal(await old.match('./app.js?v=3.0.1'),undefined);
  const offline=harness();await offline.fire('install');const incomplete=await offline.caches.open('wild-explorer-3.0.1');await incomplete.delete('./postcards.js?v=3.0.1');offline.offline();
  await offline.fire('message',{data:{type:'PREPARE_OFFLINE'},ports:[{postMessage:r=>reply=r}]});assert.equal(reply.ready,false);assert.match(reply.error,/offline/);
});
console.log(`\n${passed} service-worker groups passed. These are mocks; an installed browser worker still needs end-to-end QA.`);
