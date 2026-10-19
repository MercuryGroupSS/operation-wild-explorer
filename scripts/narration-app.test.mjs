/** Reuses the release DOM-stub harness without changing its owned source file.
 * These are app integration tests, not physical-browser or audio listening QA. */
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import vm from 'node:vm';
const require=createRequire(import.meta.url),E=require('../public/engine.js'),N=require('../public/narration.js'),Content=require('../public/narration-content.js');
const source=readFileSync(new URL('./qa-runtime.mjs',import.meta.url),'utf8');
const app=readFileSync(new URL('../public/app.js',import.meta.url),'utf8');
let harness=source.slice(source.indexOf('const fixture='),source.indexOf('let passed=0,failed=0;'));
harness=harness.replace('  vm.runInNewContext(code,context', '  options.initContext?.(context);\n  vm.runInNewContext(code,context');
harness=harness.replace('openSettings,exportSave','openSettings,downloadVoice,voicePackControls,checkVoicePack,exportSave');
const boot=new Function('require','vm','app','E',harness+'\nreturn boot;')(require,vm,app,E);
const manifest={totalBytes:12345678,clips:Content.catalog().map((text,i)=>({text,file:'./assets/narration/bella-v1/'+i.toString(16).padStart(64,'0')+'.mp3'}))};
function fixture(extra={}){
  const events=[];let audio;
  class Audio{constructor(){audio=this;}play(){events.push(['play',this.src]);this.onplaying?.();return Promise.resolve();}pause(){events.push('pause');}}
  const q=boot({}, {initContext:context=>{context.Audio=Audio;context.WildNarrationManifest=manifest;extra.init?.(context);}});
  return {...q,eventsLog:events,get audio(){return audio;}};
}
test('App starts silently, initializes narration safely, and its read button plays and stops Bella',()=>{
  const q=fixture();assert.equal(q.eventsLog.length,0);q.api.readQuest();assert.equal(q.eventsLog.filter(e=>Array.isArray(e)).length,1);q.click('read');assert.equal(q.eventsLog.filter(e=>Array.isArray(e)).length,1);assert.match(q.el('toast').textContent,/stopped/);q.click('read');assert.equal(q.eventsLog.filter(e=>Array.isArray(e)).length,2);
});
test('Navigation, opening/closing sheets, swapping, hidden pages and pagehide cancel the active queue',()=>{
  for(const action of ['tab','settings','close-sheet','swap-challenge','hide','pagehide']){
    const q=fixture();q.api.readQuest();const staleEnd=q.audio.onended,before=q.eventsLog.filter(e=>e==='pause').length;
    if(action==='hide'){q.context.document.hidden=true;q.events.visibilitychange();}else if(action==='pagehide')q.windowEvents.pagehide();else q.click(action,action==='tab'?'heroes':undefined);
    assert.ok(q.eventsLog.filter(e=>e==='pause').length>before,action);const played=q.eventsLog.filter(e=>Array.isArray(e)).length;staleEnd();assert.equal(q.eventsLog.filter(e=>Array.isArray(e)).length,played,action);
  }
});
test('Classic read-aloud uses Bella and a changed clue cancels old speech before the next tap',()=>{
  const q=fixture();q.click('classic-mode');q.api.readQuest();const stale=q.audio.onended;assert.ok(q.audio.src.includes('/bella-v1/'));q.click('classic-swap','0',{chapter:'0'});const played=q.eventsLog.filter(e=>Array.isArray(e)).length;stale();assert.equal(q.eventsLog.filter(e=>Array.isArray(e)).length,played);q.api.readQuest();assert.equal(q.eventsLog.filter(e=>Array.isArray(e)).length,played+1);
});
test('Settings shows the optional voice MB, retains progress and never claims a failed final verification is ready',async()=>{
  const fakePack={info:{megabytes:'12.3',files:299},downloading:()=>false,status:async()=>({ready:false,present:298,files:299}),download:async()=>({ready:false,present:298,files:299}),cancel(){}};
  const q=fixture({init:context=>{context.WildNarration={...N,createPack:()=>fakePack};}}),before=JSON.stringify(q.api.getState());
  q.click('settings');assert.match(q.el('sheet-content').innerHTML,/12\.3 MB/);assert.match(q.el('sheet-content').innerHTML,/does not include Bella/);
  await q.api.downloadVoice();assert.match(q.el('toast').textContent,/could not be verified/);assert.doesNotMatch(q.el('toast').textContent,/ready for offline/);assert.equal(JSON.stringify(q.api.getState()),before);
});
test('Download cancellation is reported without losing progress or leaving a promise rejection unhandled',async()=>{
  const q=fixture({init:context=>{context.WildNarration={...N,createPack:()=>({info:{megabytes:'12.3'},downloading:()=>false,status:async()=>({ready:false,present:0}),download:async()=>{throw new Error('Voice download paused. Tap Download Bella to continue later.');},cancel(){}})};}});
  await q.api.downloadVoice();assert.match(q.el('toast').textContent,/paused/);assert.equal(q.api.getState().xp,0);
});
