'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const Q=require('../public/quest-magic.js'),C=require('../public/classic.js');
const missions=C.MISSIONS.slice(0,5);
const fixture=(overrides={})=>({mode:'expedition',classic:{index:0,checks:[true,false,false]},expedition:{active:{chapter:0,claimedChapters:[],done:[],deck:Array.from({length:5},()=>['a','b','c']),options:{theme:'daylight'},ended:false}},...overrides});
const snapshot=x=>JSON.stringify(x);
test('Fantasy map follows five daytime chapters without mutating game state',()=>{
 const s=fixture(),before=snapshot(s),m=Q.model(s,missions,C.MISSIONS);assert.equal(m.nodes.length,5);assert.equal(m.nodes[0].status,'current');assert.equal(m.nodes[1].status,'locked');assert.equal(m.nodes[0].length,3);assert.equal(m.claimed,0);assert.equal(m.finale.status,'locked');assert.equal(snapshot(s),before);assert.match(Q.map(m),/Interactive fantasy treasure map/);assert.match(Q.map(m),/aria-current="step"/);
});
test('Collected nodes, chapter discovery count, notes and current marker use earned state',()=>{
 const s=fixture();Object.assign(s.expedition.active,{chapter:2,claimedChapters:[0,1],done:[{chapter:0,note:'A striped leaf'},{chapter:2,note:'Quiet wind'}]});const m=Q.model(s,missions,C.MISSIONS);assert.deepEqual(m.nodes.map(n=>n.status),['complete','complete','current','locked','locked']);assert.equal(m.nodes[0].note,'A striped leaf');assert.equal(m.nodes[2].count,1);assert.match(Q.map(m),/qm-route-earned/);assert.equal((Q.map(m).match(/aria-current="step"/g)||[]).length,1);
});
test('Every Halloween setting uses moonlit flavor and its active slot, with no GPS input',()=>{
 for(const setting of ['indoor','neighbourhood','trail']){const s=fixture();s.expedition.active.options={theme:'halloween',setting};s.expedition.active.chapter=1;s.expedition.active.claimedChapters=[0];const m=Q.model(s,missions,C.MISSIONS);assert.equal(m.night,true);assert.equal(m.nodes[1].place,'Shadow Garden');assert.equal(m.nodes[1].status,'current');assert.match(Q.map(m),/qm-map-night/);assert.doesNotMatch(Q.map(m),/latitude|longitude|geolocation/);}
});
test('Classic mode uses all ten original crystals, not the expedition index',()=>{
 const s=fixture({mode:'classic',index:4,classic:{index:7,checks:[true,false,true]}});s.expedition.active.chapter=4;s.expedition.active.claimedChapters=[0,1,2,3];const m=Q.model(s,missions,C.MISSIONS);assert.equal(m.nodes.length,10);assert.equal(m.claimed,7);assert.equal(m.nodes[7].status,'current');assert.equal(m.nodes[7].count,2);assert.equal(m.nodes[7].mission.id,'tiny');assert.equal(m.finale.status,'locked');assert.equal(m.night,false);
});
test('Ending early preserves discoveries and locks the finale without inviting continuation',()=>{
 const s=fixture();Object.assign(s.expedition.active,{chapter:2,claimedChapters:[0,1],ended:true});const m=Q.model(s,missions,C.MISSIONS);assert.equal(m.paused,true);assert.equal(m.finale.status,'locked');assert.ok(!m.nodes.some(n=>n.status==='current'));assert.match(Q.map(m),/A lovely place to pause/);assert.doesNotMatch(Q.map(m),/aria-current/);
});
test('The finale opens only after all crystals and tracks puzzle solution separately',()=>{
 const s=fixture();Object.assign(s.expedition.active,{chapter:5,claimedChapters:[0,1,2,3,4],ended:true,puzzleSolved:false});let m=Q.model(s,missions,C.MISSIONS);assert.equal(m.finale.status,'open');assert.equal(m.finale.solved,false);assert.match(Q.map(m),/final treasure puzzle/);s.expedition.active.puzzleSolved=true;m=Q.model(s,missions,C.MISSIONS);assert.equal(m.finale.solved,true);assert.match(Q.map(m),/Your treasure is revealed/);s.mode='classic';s.classic.index=10;m=Q.model(s,missions,C.MISSIONS);assert.equal(m.finale.solved,true);assert.equal(m.claimed,10);
});
test('Invalid duplicate claimed indexes cannot prematurely reveal treasure',()=>{
 const s=fixture();s.expedition.active.claimedChapters=[0,0,0,0,0,-1,6,'1'];const m=Q.model(s,missions,C.MISSIONS);assert.equal(m.claimed,1);assert.equal(m.finale.status,'locked');
});
test('Presentation escapes text, validates colors/classes, and keeps SVG IDs unique',()=>{
 const bad={gem:'Crystal <img src=x onerror=bad>',light:'red; }',colour:'" onload="bad',dark:'#ffffff',title:'<script>bad</script>',short:'<svg/onload=bad>'};const a=Q.gem(bad,'good\" onclick=bad'),b=Q.gem(bad);assert.ok(!a.includes('<img'));assert.match(a,/&lt;img/);assert.doesNotMatch(a,/onload="bad|onclick=bad|red; }/);assert.notEqual(a.match(/id="([^"]+)/)[1],b.match(/id="([^"]+)/)[1]);const html=Q.map(Q.model(fixture(),[bad,...missions.slice(1)],C.MISSIONS));assert.ok(!html.includes('<script>'));assert.match(html,/&lt;svg/);
});
test('Scenes show discovery progress, awakened state and night flavor without a claim action',()=>{
 const html=Q.crystalScene(missions[0],{count:2,length:3,night:true});assert.match(html,/2 of 3 discoveries gathered/);assert.match(html,/qm-crystal-night/);assert.doesNotMatch(html,/data-action="claim"/);assert.match(Q.crystalScene(missions[0],{ready:true}),/THE CRYSTAL IS AWAKE/);
});
function audioFixture({resumeDeferred=false}={}) {
 const events=[],doc={hidden:false};let instance,resolveResume;
 class Audio {constructor(){instance=this;this.state='suspended';this.currentTime=1;this.destination={};events.push('create');}resume(){events.push('resume');if(resumeDeferred)return new Promise(r=>resolveResume=()=>{this.state='running';r();});this.state='running';return Promise.resolve();}suspend(){events.push('suspend');this.state='suspended';return Promise.resolve();}createGain(){return {gain:{setValueAtTime(){},linearRampToValueAtTime:value=>events.push(['gain',value]),exponentialRampToValueAtTime(){}},connect(){},disconnect(){}};}createOscillator(){return {frequency:{value:0},connect(){},disconnect(){events.push('disconnect');},start(){events.push('start');},stop(){events.push('stop');}};}}
 return {engine:Q.createSoundEngine({AudioContext:Audio,document:doc}),events,doc,resume:()=>resolveResume(),get context(){return instance;}};
}
test('Audio is silent by default, when muted, at zero volume, unsupported, or hidden',()=>{
 const q=audioFixture();assert.equal(q.engine.play('reward'),false);assert.equal(q.engine.play('reward',{enabled:false}),false);assert.equal(q.engine.play('reward',{enabled:true,volume:0}),false);q.doc.hidden=true;assert.equal(q.engine.play('reward',{enabled:true}),false);assert.equal(q.events.length,0);assert.equal(Q.createSoundEngine({}).play('reward',{enabled:true}),false);
});
test('Reward sound is gesture-driven, gently bounded, and stops every voice on hide',async()=>{
 const q=audioFixture();assert.equal(q.events.length,0);assert.equal(q.engine.play('reward',{enabled:true,volume:55}),true);await Promise.resolve();assert.equal(q.events.filter(x=>x==='start').length,10);assert.ok(q.events.filter(x=>Array.isArray(x)).every(x=>x[1]<=.05));q.doc.hidden=true;q.engine.stop();assert.equal(q.context.state,'suspended');assert.equal(q.events.filter(x=>x==='disconnect').length,10);
});
test('A pending audio resume cannot start sound after hiding or muting',async()=>{
 for(const hidden of [true,false]){const q=audioFixture({resumeDeferred:true});q.engine.play('reward',{enabled:true});q.doc.hidden=hidden;q.engine.stop();q.resume();await Promise.resolve();assert.equal(q.events.filter(x=>x==='start').length,0);}
});
test('Only the latest pending audio request is scheduled and unavailable resume is harmless',async()=>{
 const q=audioFixture({resumeDeferred:true});q.engine.play('reward',{enabled:true});q.engine.play('discovery',{enabled:true});q.resume();await Promise.resolve();assert.equal(q.events.filter(x=>x==='start').length,4);
 const bad=Q.createSoundEngine({AudioContext:class {constructor(){throw new Error('blocked');}}});assert.equal(bad.play('reward',{enabled:true}),false);
});
