/** Dependency-free regressions for the 2.1 family hunt and existing saves. */
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
const source=readFileSync(new URL('../public/app.js',import.meta.url),'utf8');
const marker="  let saveIssue='', importedLegacy=false;";
assert(source.includes(marker),'Save boundary missing; update the regression harness.');
const context={document:{querySelectorAll:()=>[]},console};
runInNewContext(source.slice(0,source.indexOf(marker))+`\nthis.huntTest={MISSIONS,freshState,normalise};\n})();`,context);
const {MISSIONS,freshState,normalise}=context.huntTest;
assert.equal(MISSIONS.length,10);
assert.equal(MISSIONS.slice(5).reduce((n,m)=>n+m.tasks.length,0),17);
assert.equal(MISSIONS.slice(0,5).reduce((n,m)=>n+m.xp,0),440);
assert.equal(MISSIONS.reduce((n,m)=>n+m.xp,0),780);
assert.equal(new Set(MISSIONS.map(m=>m.id)).size,MISSIONS.length);
for(const m of MISSIONS){
 assert.equal(m.symbols.length,m.tasks.length,m.id);
 assert(m.tasks.length>0);
 assert(m.tasks.every(choices=>choices.length===3&&choices.every(t=>typeof t==='string'&&t.length)));
}
for(let index=0;index<5;index++){
 const raw={...freshState(),version:2,index,xp:127,checks:[true,false,true],variants:[1,2,0],names:['A','B','C','D','E']};
 const restored=normalise(raw);
 assert.equal(restored.version,3);assert.equal(restored.index,index);assert.equal(restored.xp,127);
 assert.equal(JSON.stringify(restored.checks),'[true,false,true]');
 assert.equal(JSON.stringify(restored.variants),'[1,2,0]');
 assert.equal(restored.names[4],'E');assert.equal(restored.gems.length,index);
}
for(const version of [undefined,1,2]){
 const old=normalise({version,index:5,xp:440,checks:[true,true,true],variants:[2,2,2],names:['A','B','C','D','E'],journal:[{category:'leaf',note:'Test memory',at:'2026-10-18T12:00:00Z'}]});
 assert.equal(old.index,5);assert.equal(old.xp,440);assert.equal(old.gems.length,5);
 assert.equal(JSON.stringify(old.checks),'[false,false,false,false,false]');
 assert.equal(JSON.stringify(old.variants),'[0,0,0,0,0]');assert.equal(old.journal[0].note,'Test memory');
}
const current=normalise({...freshState(),version:3,index:5,xp:440,checks:[true,false,true,true,true],variants:[0,1,2,1,2]});
assert.equal(JSON.stringify(current.checks),'[true,false,true,true,true]');
assert.equal(JSON.stringify(normalise(JSON.parse(JSON.stringify(current)))),JSON.stringify(current));
const complete=normalise({...freshState(),version:3,index:10,xp:780});
assert.equal(complete.gems.length,10);assert.equal(complete.checks.length,0);
assert.equal(normalise({index:-9,xp:-1}).index,0);
assert.equal(normalise({index:999,xp:NaN}).xp,0);
assert(!/getUserMedia|watchPosition\s*\(/.test(source));
console.log('PASS: 17 new activities, 10 quests, 780 XP, original/2.0 save migration and schema-3 round trips.');
