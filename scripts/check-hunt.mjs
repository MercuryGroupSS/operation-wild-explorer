/** Classic 2.1 hunt compatibility, pure rewards, and safe activity alternatives. */
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url), C=require('../public/classic.js');
const {MISSIONS}=C;
assert.equal(MISSIONS.length,10);
assert.equal(MISSIONS.slice(5).reduce((n,m)=>n+m.tasks.length,0),17);
assert.equal(MISSIONS.slice(0,5).reduce((n,m)=>n+m.xp,0),440);
assert.equal(MISSIONS.reduce((n,m)=>n+m.xp,0),780);
assert.equal(new Set(MISSIONS.map(m=>m.id)).size,10);
for(const m of MISSIONS){assert.equal(m.symbols.length,m.tasks.length);assert(m.tasks.every(c=>c.length===3&&c.every(t=>typeof t==='string'&&t.length)));}
for(const version of [undefined,1,2]){
 for(let index=0;index<=5;index++){
  const c=C.normalise(null,{version,index,checks:[true,false,true],variants:[1,2,0]});
  assert.equal(c.index,index);assert.deepEqual(c.checks,index===5?[false,false,false,false,false]:[true,false,true]);
  assert.deepEqual(c.variants,index===5?[0,0,0,0,0]:[1,2,0]);
 }
}
for(let index=0;index<=10;index++){
 const count=MISSIONS[index]?.tasks.length||0,checks=Array.from({length:count},(_,i)=>i%2===0),variants=checks.map((_,i)=>i%3);
 const c=C.normalise(null,{version:3,index,checks,variants});
 assert.deepEqual(c.checks,checks);assert.deepEqual(c.variants,variants);assert.equal(c.claimed.filter(Boolean).length,index);
 assert.deepEqual(C.normalise(JSON.parse(JSON.stringify(c))),c);
}
const interim=C.normalise(null,{version:3,index:5,checks:[true,true,true],expedition:{active:{claimedChapters:[0,1,2,3,4]}}});
assert.deepEqual(interim.checks,[false,false,false,false,false]);
let c=C.normalise(null,{}),xp=0,crystals=0,tasks=0;
for(let chapter=0;chapter<10;chapter++){
 assert.equal(C.claim(c,chapter).changed,false);
 for(let i=0;i<c.checks.length;i++){
  const before=JSON.stringify(c),swapped=C.swap(c,i,chapter);assert.equal(JSON.stringify(c),before);assert.equal(swapped.changed,true);c=swapped.state;
  assert.equal(C.mark(c,i,chapter+1).changed,false);
  const r=C.mark(c,i,chapter);assert(r.changed);c=r.state;tasks++;
  assert.equal(C.mark(c,i,chapter).changed,false);assert.equal(C.swap(c,i,chapter).changed,false);
 }
 const r=C.claim(c,chapter);assert(r.changed);xp+=r.xp;crystals+=r.crystals;c=r.state;
 assert.equal(C.claim(c,chapter).changed,false);
}
assert.equal(tasks,32);assert.equal(xp,780);assert.equal(crystals,10);assert.equal(c.index,10);assert.equal(C.claim(c,10).changed,false);
const photos=MISSIONS.find(m=>m.id==='photos');assert(photos.hints.every(h=>/ground|bench/.test(h)));assert(photos.hints[2].includes('No jumping'));
assert(MISSIONS.find(m=>m.id==='wildlife').hints.join(' ').includes('Do not feed, call, follow or chase'));
console.log('PASS: classic 10 chapters, 17 bonus activities, 32 clues, 780 XP, all legacy/version-3 positions, stale-action and duplicate-reward guards.');
