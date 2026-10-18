/** Independent property/regression QA. No browser or runtime dependency. */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const E = require('../public/engine.js');
const copy = x => JSON.parse(JSON.stringify(x));
const checks = [];
let assertions = 0;
function check(name, fn) { try { fn(); checks.push({name, pass:true}); console.log('PASS:',name); } catch(error) { checks.push({name,pass:false,error:error.message}); console.error('FAIL:',name,error.message); } }
function ok(v, message) { assertions++; assert.ok(v,message); }
function eq(a,b,message) { assertions++; assert.deepEqual(a,b,message); }
function fresh(options = {}, seed='qa') { const e=E.normaliseExpansion(null,{}); e.active=E.createOuting(options,[],seed);e.options=e.active.options;return e; }
function finish(e, swap=false) {
  let guard=0, earned=0;
  while(!e.active.ended && guard++<40) {
    const card=E.getCurrentCard(e);
    if(card) {
      if(swap) {const r=E.swapChallenge(e,{cardId:card.id,challengeKey:card.challengeKey});e=r.expansion;}
      const c=E.getCurrentCard(e), before=JSON.stringify(e);
      const payload={cardId:c.id,expectedChapter:c.chapter,expectedStep:c.step,challengeKey:c.challengeKey,note:'Synthetic QA memory',at:'2026-10-18T12:00:00.000Z'};
      const r=E.completeChallenge(e,payload);ok(r.changed);eq(JSON.stringify(e),before,'challenge mutates input');e=r.expansion;
      const twice=E.completeChallenge(e,payload);ok(!twice.changed,'duplicate challenge accepted');eq(twice.expansion.lifetime,e.lifetime,'duplicate challenge changed lifetime');
    } else {
      ok(E.isChapterReady(e),'stuck without a challenge');
      const expected=e.active.chapter,r=E.finishChapter(e,expected);ok(r.changed);earned+=r.xp;e=r.expansion;
      const twice=E.finishChapter(e,expected);ok(!twice.changed,'duplicate reward accepted');eq(twice.expansion.lifetime,e.lifetime,'duplicate reward changed lifetime');
    }
    e=E.normaliseExpansion(copy(e));
  }
  ok(e.active.ended,'outing did not finish');eq(earned,440);eq(e.wallet,5);eq(e.postcards.length,1);eq(e.lifetime.outings,1);return e;
}

check('144 option combinations × 30 seeds: context, length, uniqueness, all five types, alternating types',()=>{
  for(const habitat of E.HABITATS)for(const season of E.SEASONS)for(const duration of Object.keys(E.DURATIONS))for(const difficulty of E.DIFFICULTIES)for(let seed=0;seed<30;seed++){
    const opts={habitat,season,duration,difficulty},a=E.createOuting(opts,[],seed),ids=a.deck.flat(),cards=ids.map(id=>E.CARD_BY_ID[id]);
    eq(a.deck.length,5);eq(ids.length,5*E.DURATIONS[duration]);eq(new Set(ids).size,ids.length);
    eq(new Set(cards.map(c=>c.type)).size,5);
    cards.forEach((c,i)=>{ok(c.habitats.includes(habitat));ok(c.seasons.includes(season));ok(c.alternative.length>10);if(i)ok(c.type!==cards[i-1].type,'adjacent repeated type');});
    eq(E.createOuting(opts,[],seed),a,'same seed should be deterministic');
  }
});
check('All outing lengths complete through reloads; completion and rewards are idempotent',()=>{
  for(const duration of Object.keys(E.DURATIONS)) {const e=finish(fresh({duration},duration));eq(e.active.done.length,5*E.DURATIONS[duration]);eq(e.lifetime.xp,440);}
});
check('Safe swaps: no earned reward, no lost records, valid context, no same or adjacent card types',()=>{
  let e=fresh({habitat:'garden',season:'winter',duration:'long'},'swaps');
  const original=copy(e);
  for(let i=0;i<100;i++){const before=E.getCurrentCard(e),r=E.swapChallenge(e,{cardId:before.id,challengeKey:before.challengeKey});ok(r.changed);eq(r.xp,0);eq(r.crystals,0);e=r.expansion;const after=E.getCurrentCard(e);ok(after.id!==before.id);eq(e.wallet,0);eq(e.active.done,[]);ok(after.habitats.includes('garden'));ok(after.seasons.includes('winter'));const flat=e.active.deck.flat().map(id=>E.CARD_BY_ID[id]);flat.forEach((c,j)=>{if(j)ok(c.type!==flat[j-1].type);});}
  eq(original.wallet,0);finish(e,true);
});
check('Recent-card avoidance where alternatives exist; later outings preserve the lifetime and camp',()=>{
  let e=finish(fresh({duration:'short'},'recent-1'));
  e=E.buyItem(e,'compass').expansion;eq(e.wallet,3);eq(e.equipped.gear,'compass');
  const again=E.buyItem(e,'compass');ok(!again.changed);eq(again.expansion.wallet,3);
  const recent=new Set(e.recentIds),next=E.startNext(e,{duration:'short'},'recent-2');ok(next.changed);e=next.expansion;
  eq(e.lifetime.xp,440);eq(e.wallet,3);eq(e.owned,['compass']);eq(e.equipped.gear,'compass');eq(e.postcards.length,1);
  ok(e.active.deck.flat().every(id=>!recent.has(id)),'repeated a recent short-outing card');
  ok(!E.equipItem(e,'cosy-tent').changed);ok(!E.buyItem(e,'cosy-tent').changed);ok(!E.startNext(e,{},'skip').changed);
});
check('Shorter ending preserves earned progress, snapshots once, gives no unearned rewards',()=>{
  let e=fresh({duration:'short'},'early');const c=E.getCurrentCard(e);e=E.completeChallenge(e,{cardId:c.id}).expansion;e=E.finishChapter(e,0).expansion;
  const before=copy(e),r=E.finishEarly(e);ok(r.changed);e=r.expansion;eq(e.wallet,1);eq(e.lifetime.xp,60);eq(e.active.done,before.active.done);eq(e.postcards.length,1);ok(e.postcards[0].endedEarly);ok(!E.getPuzzle(e).available);
  eq(E.finishEarly(e).expansion,e);ok(!E.finishChapter(e,1).changed);ok(!E.completeChallenge(e,{}).changed);
});
check('Discovery-order map puzzle has retry without penalty and completes once',()=>{
  let e=finish(fresh({duration:'short'},'puzzle')),p=E.getPuzzle(e);ok(p.available);eq(p.answerIds.length,3);eq(new Set(p.answerIds).size,3);
  const before=copy(e),wrong=E.solvePuzzle(e,[...p.answerIds].reverse());ok(!wrong.changed);ok(!wrong.correct);eq(wrong.expansion,before);
  const solved=E.solvePuzzle(e,p.answerIds);ok(solved.changed);ok(solved.correct);e=solved.expansion;ok(e.active.puzzleSolved);ok(e.postcards[0].puzzleSolved);eq(e.lifetime,before.lifetime);eq(e.wallet,before.wallet);ok(!E.solvePuzzle(e,p.answerIds).changed);
});
check('All v2 chapter positions and all unfinished checkbox combinations migrate without double-funding',()=>{
  for(let index=0;index<=5;index++)for(let mask=0;mask<8;mask++){
    const checks=[0,1,2].map(i=>!!(mask & 1<<i)),xp=E.CHAPTER_XP.slice(0,index).reduce((a,b)=>a+b,0);
    const e=E.normaliseExpansion(undefined,{index,checks,xp});eq(e.active.chapter,index);eq(e.wallet,index);eq(e.lifetime.xp,xp);eq(e.lifetime.crystals,index);eq(e.active.done.length,index*3+(index<5?checks.filter(Boolean).length:0));
    const reloaded=E.normaliseExpansion(copy(e));eq(reloaded,e,'migration changes on reload');
  }
});
check('Normalisation bounds hostile data and excludes photo pixels and location coordinates',()=>{
  const e=fresh();e.wallet=-100;e.owned=['compass','compass','bad'];e.equipped={gear:'cosy-tent',camp:'compass'};e.location={lat:43.1};e.photo='data:image/jpeg;base64,AAAA';e.lifetime.xp=Infinity;e.active.done=[{chapter:9,step:9,cardId:'bad'}];
  const n=E.normaliseExpansion(e);eq(n.wallet,0);eq(n.owned,['compass']);ok(Object.values(n.equipped).every(v=>v===null));eq(n.lifetime.xp,0);ok(!JSON.stringify(n).includes('43.1'));ok(!JSON.stringify(n).includes('base64'));
});
check('Postcard text/photo references persist across JSON reload and camp actions',()=>{
  let e=finish(fresh({duration:'short'},'postcard'));e.postcards[0].park='Synthetic QA Park';e.postcards[0].favorite='Synthetic favourite <script>';e.postcards[0].heroes=['QA A','QA B','QA C','QA D','QA E'];e.postcards[0].photoIds=['photo-test'];
  e=E.normaliseExpansion(copy(e));e=E.buyItem(e,'compass').expansion;eq(e.postcards[0].favorite,'Synthetic favourite <script>');eq(e.postcards[0].photoIds,['photo-test']);eq(e.postcards[0].heroes.length,5);eq(e.postcards[0].done.length,5);
});
console.log(`\n${checks.filter(x=>x.pass).length}/${checks.length} groups passed; ${assertions} assertions.`);
if(checks.some(x=>!x.pass))process.exitCode=1;
