'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm');
const {readFileSync}=require('node:fs'),{resolve}=require('node:path'),{createHash,webcrypto}=require('node:crypto');
const E=require('../public/engine.js'),C=require('../public/classic.js'),Content=require('../public/narration-content.js'),N=require('../public/narration.js');
const pub=resolve(__dirname,'../public'),manifestFile=resolve(pub,'narration-manifest.js');
const normal=text=>text.replace(/[.!?]+/g,'.').replace(/\s+/g,' ').trim();
function cardState(card,difficulty,setting){return {mode:'expedition',names:['PRIVATE-NAME-DO-NOT-READ'],journal:[{note:'PRIVATE-JOURNAL-DO-NOT-READ'}],expedition:{active:{id:'test',chapter:0,step:0,swaps:0,ended:false,deck:[[card.id]],options:{theme:card.theme,setting,habitat:card.habitats[0],season:card.seasons[0],difficulty}}}};}
function actualTexts(){
  const cases=[];
  for(const card of E.CARDS)for(const difficulty of E.DIFFICULTIES)for(const setting of card.settings||['indoor']){
    const state=cardState(card,difficulty,setting),actual=E.getCurrentCard(state.expedition);assert.ok(actual,`${card.id}/${difficulty}/${setting}`);
    const safety=card.theme==='halloween'?'Stay beside your grown-up. Stop walking before looking at the screen.':'Stay together on the safe path.';
    cases.push({state,expected:`${actual.type}. ${actual.title}. ${actual.prompt}. Safe alternative: ${actual.alternative} ${safety}`});
  }
  C.MISSIONS.forEach((m,index)=>{
    m.tasks.forEach((choices,i)=>choices.forEach((task,v)=>{
      const state={mode:'classic',classic:{index,checks:m.tasks.map((_,n)=>n<i),variants:m.tasks.map((_,n)=>n===i?v:0)}};
      cases.push({state,expected:`${m.title}. ${m.story}. ${task}. ${m.hints?.[i]||''} Stay together on the safe path.`});
    }));
    cases.push({state:{mode:'classic',classic:{index,checks:m.tasks.map(()=>true),variants:[]}},expected:`${m.title}. ${m.story}. Your crystal is ready. Stay together on the safe path.`});
  });
  cases.push({state:{mode:'classic',classic:{index:10}},expected:'Your classic hunt is complete. Stay together on the safe path.'});
  for(const theme of E.THEMES)cases.push({state:{mode:'expedition',expedition:{active:{ended:true,options:{theme}}}},expected:`Your discoveries brought the map together. Share your favourite memory. ${theme==='halloween'?'Stay beside your grown-up. Stop walking before looking at the screen.':'Stay together on the safe path.'}`});
  return cases;
}
test('Every actual fixed readQuest output is covered across all cards, night settings, difficulties and classic variants',()=>{
  const catalog=new Set(Content.catalog());let count=0;
  for(const {state,expected}of actualTexts()){
    const before=JSON.stringify(state),segments=Content.segments(state);
    assert.equal(normal(segments.join(' ')),normal(expected));assert.equal(JSON.stringify(state),before);
    assert.doesNotMatch(segments.join(' '),/PRIVATE-/);
    for(const text of segments)assert.ok(catalog.has(text),text);count++;
  }
  assert.ok(count>=470,`${count} actual output paths`);assert.ok(catalog.size<320,'Shared difficulty/safety clips avoid Cartesian duplication');
});
test('Manifest has exact, content-hashed local assets for every fixed narration segment',()=>{
  const m=require(manifestFile),byText=new Map(m.clips.map(c=>[c.text,c]));
  assert.equal(m.voice,'af_bella');assert.equal(m.speed,.9);assert.equal(m.gainDb,-2);assert.equal(m.dtype,'fp32');
  assert.equal(m.clips.length,Content.catalog().length);assert.equal(byText.size,m.clips.length);
  let bytes=0;
  for(const text of Content.catalog()){
    const c=byText.get(text);assert.ok(c,text);assert.equal(c.key,createHash('sha256').update(text).digest('hex'));
    assert.match(c.file,/^\.\/assets\/narration\/bella-v1\/[a-f0-9]{64}\.mp3$/);
    const data=readFileSync(resolve(pub,c.file));assert.equal(data.length,c.bytes);assert.ok(c.bytes>500);assert.equal(c.sha256,createHash('sha256').update(data).digest('hex'));assert.ok(c.seconds>0&&c.seconds<90);bytes+=c.bytes;
  }
  assert.equal(bytes,m.totalBytes);assert.ok(bytes<40_000_000,'Voice pack budget');
  for(const {state}of actualTexts())for(const text of Content.segments(state))assert.ok(byText.has(text),text);
  assert.ok(readFileSync(resolve(pub,'assets/narration/NOTICE.txt'),'utf8').includes('Apache'));
  assert.ok(readFileSync(resolve(pub,'assets/narration/LICENSE-APACHE-2.0.txt'),'utf8').includes('Version 2.0'));
});
const sampleText=['First little clue.','Stay together.'];
const sampleManifest={clips:sampleText.map((text,i)=>({text,key:String(i).repeat(64),file:'./assets/narration/bella-v1/'+String(i).repeat(64)+'.mp3'}))};
function playerFixture(options={}){
  const events=[],states=[],timers=new Map(),doc={hidden:false};let instance,id=0,rejectPlay;
  class Audio{constructor(){instance=this;events.push('create');}play(){events.push(['play',this.src]);if(options.defer)return new Promise((_,reject)=>rejectPlay=reject);if(options.reject)return Promise.reject(Object.assign(new Error('test'),{name:options.reject}));this.onplaying?.();return Promise.resolve();}pause(){events.push('pause');}}
  const synth={getVoices:()=>options.voices||[{name:'Online',lang:'en-US',localService:false},{name:'Local English',lang:'en-CA',localService:true}],speak:say=>{events.push(['speak',say]);synth.last=say;},cancel:()=>events.push('cancel')};
  const host={Audio:options.noAudio?undefined:Audio,document:doc,SpeechSynthesisUtterance:options.noSpeech?undefined:class{constructor(text){this.text=text;}},speechSynthesis:options.noSpeech?undefined:synth,setTimeout:fn=>{timers.set(++id,fn);return id;},clearTimeout:id=>timers.delete(id)};
  const player=N.createPlayer(host,options.manifest||sampleManifest,{beforePlay:()=>events.push('stop chimes'),onStatus:state=>states.push(state)});
  return {player,host,events,states,doc,timers,synth,get audio(){return instance;},reject:error=>rejectPlay(error)};
}
test('Bella plays only on request, inside the tap, and reuses one media element for the complete queue',async()=>{
  const q=playerFixture();assert.deepEqual(q.events,[]);assert.equal(q.player.play(sampleText),true);assert.equal(q.events.filter(e=>e==='create').length,1);assert.equal(q.events.filter(e=>Array.isArray(e)&&e[0]==='play').length,1);assert.ok(q.events.indexOf('stop chimes')<q.events.findIndex(e=>Array.isArray(e)&&e[0]==='play'));
  q.audio.onended();assert.equal(q.events.filter(e=>e==='create').length,1);assert.equal(q.events.filter(e=>Array.isArray(e)&&e[0]==='play').length,2);q.audio.onended();assert.equal(q.player.active(),false);assert.equal(q.events.filter(e=>Array.isArray(e)&&e[0]==='speak').length,0);
});
test('Stop, repeated play and stale events cannot overlap or restart an old narration',async()=>{
  const q=playerFixture({defer:true});q.player.play(sampleText);const oldEnd=q.audio.onended;q.player.stop();q.reject(new Error('late failure'));await Promise.resolve();oldEnd();assert.equal(q.player.active(),false);assert.equal(q.events.filter(e=>Array.isArray(e)&&e[0]==='speak').length,0);
  q.player.play(sampleText);const firstEnd=q.audio.onended;q.player.play([sampleText[1]]);const count=q.events.filter(e=>Array.isArray(e)&&e[0]==='play').length;firstEnd();assert.equal(q.events.filter(e=>Array.isArray(e)&&e[0]==='play').length,count);q.player.stop();assert.equal(q.timers.size,0);
});
test('Missing or failed clips use an explicitly labeled local device voice, never an unmarked cloud default',()=>{
  for(const kind of ['missing','error','timeout','noAudio']){
    const q=playerFixture({...(kind==='missing'?{manifest:{clips:[]}}:{}),noAudio:kind==='noAudio',defer:kind==='timeout'});q.player.play(sampleText);
    if(kind==='error')q.audio.onerror();if(kind==='timeout')[...q.timers.values()][0]();
    const say=q.events.find(e=>Array.isArray(e)&&e[0]==='speak')?.[1];assert.ok(say,kind);assert.equal(say.voice.localService,true);assert.equal(say.text,sampleText.join(' '));assert.ok(q.states.some(s=>s.source==='device'&&/device voice/i.test(s.message)));say.onend();assert.equal(q.player.active(),false);
  }
});
test('Unavailable speech and gesture denial explain the limitation without blocking the game',async()=>{
  for(const options of [{noAudio:true,noSpeech:true},{noAudio:true,voices:[{lang:'en-US',localService:false}]}]){const q=playerFixture(options);q.player.play(sampleText);assert.equal(q.player.active(),false);assert.match(q.states.at(-1).message,/grown-up can read/);}
  const q=playerFixture({reject:'NotAllowedError'});q.player.play(sampleText);await Promise.resolve();assert.equal(q.player.active(),false);assert.match(q.states.at(-1).message,/fresh tap/);assert.ok(!q.events.some(e=>Array.isArray(e)&&e[0]==='speak'));
});
test('Hidden documents do not start playback and explicit hide/navigation stop cancels device speech',()=>{
  const q=playerFixture();q.doc.hidden=true;assert.equal(q.player.play(sampleText),false);assert.ok(!q.events.some(e=>Array.isArray(e)&&e[0]==='play'));
  const p=playerFixture({noAudio:true});p.player.play(sampleText);const lateEnd=p.synth.last.onend;p.doc.hidden=true;p.player.stop();lateEnd();assert.equal(p.player.active(),false);
});
function cacheFixture(){const stores=new Map();const caches={open:async name=>{if(!stores.has(name))stores.set(name,new Map());const store=stores.get(name);return {match:async key=>store.get(key)?.clone(),put:async(key,response)=>store.set(key,response.clone())};}};return {caches,stores};}
test('Offline voice pack is opt-in, reports exact bytes, verifies content, resumes and refuses truncated files',async()=>{
  const q=cacheFixture(),bytes=new Uint8Array([1,2,3]),clip={...sampleManifest.clips[0],bytes:3,sha256:createHash('sha256').update(bytes).digest('hex')},manifest={totalBytes:3,clips:[clip]};let requests=0;
  const pack=N.createPack({...q,crypto:webcrypto,fetch:async()=>{requests++;return new Response(bytes);}},manifest);assert.equal(requests,0);assert.equal((await pack.status()).ready,false);const progress=[];assert.equal((await pack.download(p=>progress.push(p))).ready,true);assert.equal(requests,1);assert.equal(progress.at(-1).downloadedBytes,3);await pack.download();assert.equal(requests,1);
  const bad=N.createPack({...cacheFixture(),fetch:async()=>new Response(new Uint8Array([1]))},manifest);await assert.rejects(bad.download(),/could not be verified/);assert.equal((await bad.status()).ready,false);
});
test('Offline cancellation and storage failures retain a resumable partial pack with a useful message',async()=>{
  const bytes=new Uint8Array([1,2,3]),clips=sampleManifest.clips.map(c=>({...c,bytes:3})),q=cacheFixture();let requests=0;
  const pack=N.createPack({...q,fetch:async()=>{requests++;return new Response(bytes);}}, {totalBytes:6,clips});await assert.rejects(pack.download(()=>pack.cancel()),/paused/);assert.equal((await pack.status()).present,1);assert.equal(pack.downloading(),false);assert.equal((await pack.download()).ready,true);assert.equal(requests,2);
  const full=N.createPack({caches:{open:async()=>{throw Object.assign(new Error('full'),{name:'QuotaExceededError'});}},fetch:async()=>new Response(bytes)},{clips,totalBytes:6});await assert.rejects(full.download(),/not enough browser storage/);
});
test('Optional audio worker supports Safari byte ranges, full files and network fallback without automatic caching',async()=>{
  const bytes=new Uint8Array([0,1,2,3,4,5,6,7,8,9]),q=cacheFixture(),origin='https://example.invalid',url=origin+'/assets/narration/bella-v1/'+('0'.repeat(64))+'.mp3';let requests=0;
  const context={self:{},URL,Headers,Response,caches:q.caches,fetch:async()=>{requests++;return new Response('network');}};vm.runInNewContext(readFileSync(resolve(pub,'narration-worker.js'),'utf8'),context);const worker=context.self.WildNarrationWorker;
  const request=range=>({url,headers:new Headers(range?{Range:range}:{})});assert.equal(worker.matches(request()),true);assert.equal(worker.matches({url:origin+'/app.js'}),false);assert.equal(await (await worker.serve(request())).text(),'network');assert.equal((await q.caches.open(N.CACHE)).match(url) instanceof Promise,true);
  const cache=await q.caches.open(N.CACHE);assert.equal(await cache.match(url),undefined);await cache.put(url,new Response(bytes,{headers:{'Content-Type':'audio/mpeg'}}));
  for(const [range,expected]of [['bytes=0-1',[0,1]],['bytes=4-',[4,5,6,7,8,9]],['bytes=-3',[7,8,9]],['bytes=8-99',[8,9]]]){const response=await worker.serve(request(range));assert.equal(response.status,206);assert.deepEqual([...new Uint8Array(await response.arrayBuffer())],expected);assert.equal(response.headers.get('Accept-Ranges'),'bytes');}
  for(const range of ['bytes=20-','bytes=9-3','bytes=0-1,4-6','bytes=-'])assert.equal((await worker.serve(request(range))).status,416);
  assert.deepEqual([...new Uint8Array(await (await worker.serve(request())).arrayBuffer())],[...bytes]);assert.equal(requests,1);
});
test('Audio storage denial still permits an ordinary online MP3 request',async()=>{
  let requested=false;const context={self:{},URL,Headers,Response,caches:{open:async()=>{throw new Error('storage unavailable');}},fetch:async()=>{requested=true;return new Response('online audio');}};
  vm.runInNewContext(readFileSync(resolve(pub,'narration-worker.js'),'utf8'),context);
  const response=await context.self.WildNarrationWorker.serve({url:'https://example.invalid/assets/narration/bella-v1/'+('0'.repeat(64))+'.mp3',headers:new Headers()});
  assert.equal(await response.text(),'online audio');assert.equal(requested,true);
});
