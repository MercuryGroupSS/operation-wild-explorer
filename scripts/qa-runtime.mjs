/** App logic integration under minimal DOM stubs, not browser/layout testing.
 * Only synthetic saves. App source is instrumented in memory; public is untouched.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { createRequire } from 'node:module';
const require=createRequire(import.meta.url), E=require('../public/engine.js');
const app=readFileSync(new URL('../public/app.js',import.meta.url),'utf8');
const fixture={version:2,index:2,checks:[true,false,true],variants:[1,0,2],xp:140,names:['QA A','QA B','QA C','QA D','QA E'],roles:['ranger','guardian','whisperer','wizard','hunter'],looks:Array.from({length:5},(_,i)=>({skin:i%4,hair:i%4,colour:i,long:!!(i%2)})),leader:4,park:'Synthetic QA Park',start:'Synthetic start',journal:[{category:'tree',note:'Synthetic <tree> memory',at:'2026-10-01T00:00:00.000Z'}],settings:{sound:false,motion:false}};
const copy=x=>JSON.parse(JSON.stringify(x));
class Element {
  constructor(id=''){this.id=id;this.innerHTML='';this.textContent='';this.value='';this.hidden=false;this.disabled=false;this.isConnected=true;this.dataset={};this.attributes={};this.listeners={};this.style={setProperty(){}};this.classes=new Set();this.classList={toggle:(name,on)=>{if(on)this.classes.add(name);else this.classes.delete(name);},add:(name)=>this.classes.add(name),remove:(name)=>this.classes.delete(name)};this.children=[];}
  addEventListener(type,fn){this.listeners[type]=fn;}
  setAttribute(key,v){this.attributes[key]=v;}
  removeAttribute(key){delete this.attributes[key];}
  querySelector(){return new Element();}querySelectorAll(){return [];}
  focus(){}scrollIntoView(){}append(...x){this.children.push(...x);}appendChild(x){this.children.push(x);}remove(){}replaceChildren(){this.children=[];}
  showModal(){this.open=true;}close(){this.open=false;this.listeners.close?.();}click(){this.clicked=true;}
  getBoundingClientRect(){return {left:0,top:0,right:390,bottom:844,width:390,height:844};}
}
function boot(initial={},options={}){
  const elements=new Map(),events={},windowEvents={},store=options.sharedStore||new Map(Object.entries(initial)),downloads=[];
  let now=Date.now();class ClockDate extends Date{constructor(...args){super(...(args.length?args:[now]));}static now(){return now;}}
  const el=id=>{if(!elements.has(id))elements.set(id,new Element(id));return elements.get(id);};
  const document={getElementById:el,querySelectorAll:()=>[],querySelector:()=>new Element(),createElement:()=>new Element(),body:new Element('body'),activeElement:new Element(),addEventListener:(type,fn)=>events[type]=fn,hidden:false};
  const localStorage={getItem:k=>{if(options.blockStorage)throw new Error('blocked');return store.get(k)||null;},setItem:(k,v)=>{if(options.blockStorage)throw new Error('blocked');store.set(k,v);options.writes?.push([k,v]);}};
  const navigator={onLine:true,geolocation:{getCurrentPosition:(success,error)=>{if(options.deferGPS)options.gpsCallback={success,error};else error({code:1});}}};
  const context={console,Date:ClockDate,Math,JSON,Number,String,Object,Array,Set,Map,Boolean,Promise,RegExp,URL:{createObjectURL:b=>{downloads.push(b);return 'blob:synthetic';},revokeObjectURL(){}},Blob,localStorage,navigator,document,setTimeout:()=>1,clearTimeout(){},WildPostcards:{},FormData:class{constructor(form){this.data=form.fields||{};}entries(){return Object.entries(this.data);}}};
  context.window=context;context.WildEngine=E;context.WildClassic=require('../public/classic.js');context.isSecureContext=true;context.matchMedia=()=>({matches:false});context.addEventListener=(type,fn)=>windowEvents[type]=fn;context.scrollTo=()=>{};
  const hooks=`\nObject.assign(globalThis,{__qa:{getState:()=>state,setState:v=>{state=normalise(v);},save,renderAll,renderQuest,renderTreasure,renderPostcards,openBuilder,openHero,startPlannedOuting,completeChallenge,claimCrystal,openFinishEarly,readQuest,requestGPS,openSettings,exportSave,openPostcard,getLocation:()=>locationFix,normalise,avatar,removePostcardPhoto}});\n`;
  const code=app.slice(0,app.lastIndexOf('})();'))+hooks+app.slice(app.lastIndexOf('})();'));
  vm.runInNewContext(code,context,{filename:'app.js'});
  const click=(action,value,extra={})=>{const button=new Element();button.parentElement=new Element();button.dataset={action,value,...extra};events.click({target:{closest:()=>button}});return button;};
  return {api:context.__qa,el,store,events,windowEvents,click,downloads,context,advance:(ms=600)=>now+=ms};
}
let passed=0,failed=0;
async function test(name,fn){try{await fn();passed++;console.log('PASS:',name);}catch(e){failed++;console.error('FAIL:',name,e.stack);}}
await test('Fresh app initialises all five screens and one challenge; preserves save-key mirror',()=>{
  const q=boot();for(const id of ['home','quest','heroes','treasure','trail'])assert.ok(q.el(id+'-screen').innerHTML.length>50,id);
  assert.equal(q.api.getState().names.length,5);assert.ok(q.el('quest-screen').innerHTML.includes('complete-challenge'));assert.ok(q.store.has('wildExplorerSaveV2'));assert.ok(q.store.has('wildExplorerSave'));
});
await test('v1/v2 and unreadable-v2 fallback preserve names, customisation, journal, XP and unfinished clues',()=>{
  for(const mode of ['v1','v2','corrupt']){
    const q=boot(mode==='v2'?{wildExplorerSaveV2:JSON.stringify(fixture)}:{wildExplorerSave:JSON.stringify(fixture),...(mode==='corrupt'?{wildExplorerSaveV2:'{broken synthetic JSON'}:{})});
    const s=q.api.getState();assert.deepEqual(copy(s.names),fixture.names);assert.deepEqual(copy(s.looks),fixture.looks);assert.equal(s.xp,140);assert.equal(s.expedition.wallet,2);assert.equal(s.expedition.active.step,1);assert.equal(s.journal[0].note,fixture.journal[0].note);
    const reload=boot(Object.fromEntries(q.store));assert.deepEqual(copy(reload.api.getState()),copy(s));
  }
});
await test('All 15 challenges rotate leader, tolerate stale double click, and five rewards give exactly 440 XP',()=>{
  const q=boot();let count=0;
  while(!q.api.getState().expedition.active.ended){
    const s=q.api.getState(),c=E.getCurrentCard(s.expedition);
    if(c){const button={dataset:{card:c.id,chapter:String(c.chapter),step:String(c.step)}};const leader=s.leader;q.api.completeChallenge(button);assert.equal(q.api.getState().leader,(leader+1)%5);const snapshot=copy(q.api.getState());q.api.completeChallenge(button);assert.deepEqual(copy(q.api.getState()),snapshot);q.advance();q.api.completeChallenge(button);assert.deepEqual(copy(q.api.getState()),snapshot);count++;}
    else{const chapter=s.expedition.active.chapter;q.api.claimCrystal(String(chapter));const snapshot=copy(q.api.getState());q.api.claimCrystal(String(chapter));assert.deepEqual(copy(q.api.getState()),snapshot);}
  }
  const s=q.api.getState();assert.equal(count,15);assert.equal(s.xp,440);assert.equal(s.expedition.wallet,5);assert.equal(s.expedition.postcards.length,1);assert.ok(s.expedition.postcards[0].date);assert.ok(q.el('quest-screen').innerHTML.includes('puzzle'));
});
await test('Hero name, role, outfit, specialty and leader are saved through the submit handler',()=>{
  const q=boot();q.api.openHero(2);q.el('hero-name').value='QA Custom';q.el('hero-role').value='wizard';q.el('hero-specialty').value='listener';q.click('swatch','4',{kind:'colour'});q.click('long-hair');q.events.submit({preventDefault(){},target:{id:'hero-form'}});
  const s=q.api.getState();assert.equal(s.names[2],'QA Custom');assert.equal(s.roles[2],'wizard');assert.equal(s.looks[2].colour,4);assert.equal(s.leader,2);assert.equal(s.specialties[2],'listener');
});
await test('Builder options, swaps, shorter ending and new outing preserve XP, journal and camp',()=>{
  const q=boot({wildExplorerSaveV2:JSON.stringify(fixture)});q.click('finish-confirmed');const before=copy(q.api.getState());q.api.startPlannedOuting({fields:{habitat:'neighbourhood',season:'winter',duration:'short',difficulty:'challenge'}});
  let s=q.api.getState();assert.equal(s.xp,before.xp);assert.equal(s.journal.length,1);assert.equal(s.expedition.active.deck.flat().length,5);assert.equal(s.expedition.active.options.habitat,'neighbourhood');assert.equal(s.expedition.active.options.difficulty,'challenge');
  q.click('confirm-camp','compass');s=q.api.getState();assert.equal(s.expedition.wallet,0);assert.equal(s.expedition.equipped.gear,'compass');const count=s.expedition.active.done.length;q.click('swap-challenge');assert.equal(q.api.getState().expedition.active.done.length,count);q.click('finish-confirmed');q.api.startPlannedOuting({fields:{duration:'medium'}});assert.equal(q.api.getState().expedition.equipped.gear,'compass');assert.equal(q.api.getState().xp,140);
});
await test('GPS refusal has manual fallback; stale callback cannot restore a cleared fix; coordinates never enter save/export',()=>{
  const q=boot();q.api.requestGPS();assert.match(q.el('trail-screen').innerHTML,/Location permission was not granted/);
  const options={deferGPS:true},p=boot({},options);p.api.requestGPS();p.click('clear-gps');options.gpsCallback.success({coords:{latitude:43.123456,longitude:-79.123456,accuracy:12},timestamp:Date.now()});assert.equal(p.api.getLocation(),null);
  p.api.requestGPS();options.gpsCallback.success({coords:{latitude:43.123456,longitude:-79.123456,accuracy:12},timestamp:Date.now()});assert.ok(p.api.getLocation());p.api.save();p.api.exportSave();assert.ok(![...p.store.values()].join('').includes('43.123456'));
});
await test('Unsupported speech and blocked browser storage remain playable and explain fallback',()=>{
  const q=boot();q.api.readQuest();assert.match(q.el('toast').textContent,/not available|unavailable/);
  const p=boot({}, {blockStorage:true});assert.match(p.el('save-warning').textContent,/could not be saved/);const c=E.getCurrentCard(p.api.getState().expedition);p.api.completeChallenge({dataset:{card:c.id,chapter:String(c.chapter),step:String(c.step)}});assert.equal(p.api.getState().expedition.active.done.length,1);
});
await test('Backup export excludes GPS/photo pixels; valid import needs explicit restore; malformed import changes nothing',async()=>{
  const q=boot({wildExplorerSaveV2:JSON.stringify(fixture)});q.api.exportSave();const saved=JSON.parse(await q.downloads[0].text());assert.equal(saved.app,'operation-wild-explorer');assert.equal(saved.version,3);assert.ok(!JSON.stringify(saved).includes('base64,'));
  const p=boot(),before=copy(p.api.getState());await p.el('import-file').listeners.change({target:{files:[{size:400,text:async()=>JSON.stringify(saved)}],value:'synthetic'}});assert.deepEqual(copy(p.api.getState()),before);assert.match(p.el('sheet-content').innerHTML,/Restore this backup/);p.click('restore-confirmed');assert.equal(p.api.getState().xp,140);assert.equal(p.api.getState().names[0],'QA A');
  const restored=copy(p.api.getState());await p.el('import-file').listeners.change({target:{files:[{size:10,text:async()=>'{oops'}],value:'synthetic'}});assert.deepEqual(copy(p.api.getState()),restored);assert.match(p.el('toast').textContent,/valid Wild Explorer/);
});
await test('Journal HTML is escaped and hazardous finds get safe-distance language without XP',()=>{
  const q=boot();q.el('discovery-note').value='Mushroom <img src=x onerror=bad>';q.events.submit({preventDefault(){},target:{id:'discovery-form',dataset:{category:'other'}}});assert.equal(q.api.getState().xp,0);assert.ok(q.el('treasure-screen').innerHTML.includes('&lt;img'));assert.ok(q.el('treasure-screen').innerHTML.includes('safe distance'));
});
await test('Completed v2 migration produces a usable postcard date and park',()=>{
  const q=boot({wildExplorerSaveV2:JSON.stringify({...fixture,index:5,xp:440})});const p=q.api.getState().expedition.postcards[0];assert.ok(p.date || p.createdAt,'completed legacy postcard has no date');assert.equal(p.park,'Synthetic QA Park');
});
await test('2.1 saves at all eleven positions preserve every classic check, crystal and XP through reload',()=>{
  for(let index=0;index<=10;index++){
    const count=index===10?0:index===5?5:3, checks=Array.from({length:count},(_,i)=>i%2===0),variants=checks.map((_,i)=>i%3);
    const q=boot({wildExplorerSaveV2:JSON.stringify({...fixture,version:3,index,xp:780,checks,variants})}),s=q.api.getState();
    assert.equal(s.mode,'classic');assert.equal(s.classic.index,index);assert.deepEqual(copy(s.classic.checks),checks);assert.deepEqual(copy(s.classic.variants),variants);assert.equal(s.xp,780);assert.equal(s.expedition.wallet,index);assert.equal(s.expedition.lifetime.crystals,index);
    const r=boot(Object.fromEntries(q.store));assert.deepEqual(copy(r.api.getState()),copy(s));assert.equal(r.api.getState().expedition.wallet,index);
  }
});
await test('Classic remaining 17 clues share rewards exactly once and keep both modes and camp independent',()=>{
  const q=boot({wildExplorerSaveV2:JSON.stringify({...fixture,version:3,index:5,xp:440,checks:[false,false,false,false,false],variants:[0,0,0,0,0]})});
  q.click('confirm-camp','leaf-cape');assert.equal(q.api.getState().expedition.wallet,2);
  let count=0;
  while(q.api.getState().classic.index<10){
    const c=q.api.getState().classic,i=c.checks.findIndex(x=>!x),chapter=String(c.index);
    if(i>=0){q.click('classic-check',String(i),{chapter});const after=copy(q.api.getState());q.click('classic-check',String(i),{chapter});assert.deepEqual(copy(q.api.getState()),after);q.advance();count++;}
    else{q.click('classic-claim',undefined,{chapter});const after=copy(q.api.getState());q.click('classic-claim',undefined,{chapter});assert.deepEqual(copy(q.api.getState()),after);}
  }
  let s=q.api.getState();assert.equal(count,17);assert.equal(s.xp,780);assert.equal(s.expedition.wallet,7);assert.equal(s.expedition.lifetime.crystals,10);assert.equal(s.classic.index,10);assert.equal(s.expedition.equipped.gear,'leaf-cape');
  q.click('expedition-mode');assert.equal(q.api.getState().mode,'expedition');q.api.startPlannedOuting({fields:{duration:'short'}});assert.equal(q.api.getState().classic.index,10);assert.equal(q.api.getState().xp,780);q.click('classic-mode');assert.match(q.el('quest-screen').innerHTML,/Ten crystals/);
  s=q.api.getState();assert.deepEqual(copy(boot(Object.fromEntries(q.store)).api.getState()),copy(s));
});
await test('2.1 complete backup restores all ten classic crystals only after confirmation',async()=>{
  const q=boot(),before=copy(q.api.getState()),raw={...fixture,version:3,index:10,xp:780,checks:[]};
  await q.el('import-file').listeners.change({target:{files:[{size:600,text:async()=>JSON.stringify(raw)}],value:'synthetic'}});
  assert.deepEqual(copy(q.api.getState()),before);q.click('restore-confirmed');assert.equal(q.api.getState().classic.index,10);assert.equal(q.api.getState().expedition.wallet,10);assert.equal(q.api.getState().xp,780);
});
await test('Night picker checks grown-up readiness and all four adventures retain their own place',()=>{
  const q=boot({wildExplorerSaveV2:JSON.stringify(fixture)}),day=copy(q.api.getState().expedition.active),original=copy(q.api.getState());
  q.click('night-picker');assert.match(q.el('sheet-content').innerHTML,/Cozy house/);assert.match(q.el('sheet-content').innerHTML,/Neighbourhood walk/);assert.match(q.el('sheet-content').innerHTML,/Nearby trail/);
  const saved={};
  for(const setting of E.NIGHT_SETTINGS){
    q.click('night-ready',setting);assert.match(q.el('sheet-content').innerHTML,/night-ready-check/);if(setting==='trail')assert.match(q.el('sheet-content').innerHTML,/open and suitable after dark/);
    const before=copy(q.api.getState());q.el('night-ready-check').checked=false;q.events.submit({target:{id:'night-ready-form',dataset:{setting}},preventDefault(){}});assert.deepEqual(copy(q.api.getState()),before);
    q.el('night-ready-check').checked=true;q.events.submit({target:{id:'night-ready-form',dataset:{setting}},preventDefault(){}});
    const a=q.api.getState().expedition.active;assert.equal(a.options.theme,'halloween');assert.equal(a.options.setting,setting);assert.equal(a.options.duration,'short');assert.equal(a.deck.flat().length,5);assert.ok(q.context.document.body.classes.has('night-theme'));
    assert.match(q.el('home-screen').innerHTML,/night-lanterns.svg/);assert.match(q.el('quest-screen').innerHTML,/The Pumpkin Invitation/);assert.match(q.el('quest-screen').innerHTML,/Stop together to play/);
    const c=E.getCurrentCard(q.api.getState().expedition);q.click('complete-challenge',undefined,{card:c.id,key:c.challengeKey,chapter:String(c.chapter),step:String(c.step)});q.advance();saved[setting]=copy(q.api.getState().expedition.active);
  }
  q.click('daylight-mode');assert.deepEqual(copy(q.api.getState().expedition.active),day);assert.equal(q.api.getState().xp,original.xp);assert.deepEqual(copy(q.api.getState().names),original.names);assert.deepEqual(copy(q.api.getState().journal),original.journal);assert.ok(!q.context.document.body.classes.has('night-theme'));
  const reloaded=boot(Object.fromEntries(q.store));
  for(const setting of E.NIGHT_SETTINGS){reloaded.click('night-ready',setting);reloaded.el('night-ready-check').checked=true;reloaded.events.submit({target:{id:'night-ready-form',dataset:{setting}},preventDefault(){}});assert.deepEqual(copy(reloaded.api.getState().expedition.active),saved[setting]);}
  reloaded.click('classic-mode');assert.equal(reloaded.api.getState().mode,'classic');assert.equal(reloaded.api.getState().expedition.active.options.theme,'daylight');assert.equal(reloaded.api.getState().classic.index,original.classic.index);
});
await test('Each night setting completes a cozy story with duplicate-safe rewards, postcard and preserved day save',()=>{
  for(const setting of E.NIGHT_SETTINGS){
    const q=boot(),day=copy(q.api.getState().expedition.active);q.click('night-ready',setting);q.el('night-ready-check').checked=true;q.events.submit({target:{id:'night-ready-form',dataset:{setting}},preventDefault(){}});
    while(!q.api.getState().expedition.active.ended){const e=q.api.getState().expedition,c=E.getCurrentCard(e);if(c){assert.equal(c.theme,'halloween');assert.ok(c.settings.includes(setting));q.click('complete-challenge',undefined,{card:c.id,key:c.challengeKey,chapter:String(c.chapter),step:String(c.step)});const once=copy(q.api.getState());q.click('complete-challenge',undefined,{card:c.id,key:c.challengeKey,chapter:String(c.chapter),step:String(c.step)});assert.deepEqual(copy(q.api.getState()),once);q.advance();}else{const chapter=String(e.active.chapter);q.click('claim',undefined,{chapter});const once=copy(q.api.getState());q.click('claim',undefined,{chapter});assert.deepEqual(copy(q.api.getState()),once);}}
    const s=q.api.getState();assert.equal(s.xp,440);assert.equal(s.expedition.wallet,5);assert.equal(s.expedition.postcards.length,1);assert.match(s.expedition.postcards[0].park,/Halloween night/);assert.ok(s.expedition.postcards[0].badges.includes('Little Lantern Keeper'));assert.match(q.el('quest-screen').innerHTML,/pumpkin party/);
    q.click('puzzle');for(const id of E.getPuzzle(s.expedition).answerIds)q.click('puzzle-choice',id);assert.equal(q.api.getState().expedition.active.puzzleSolved,true);assert.match(q.el('sheet-content').innerHTML,/Every hero belongs/);
    q.click('confirm-camp','moon-cape');assert.equal(q.api.getState().expedition.equipped.gear,'moon-cape');assert.ok(q.el('heroes-screen').innerHTML.includes('#7662ad'));
    q.click('daylight-mode');assert.deepEqual(copy(q.api.getState().expedition.active),day);assert.equal(q.api.getState().xp,440);
    const restored=boot(Object.fromEntries(q.store));assert.equal(restored.api.getState().expedition.equipped.gear,'moon-cape');assert.equal(restored.api.getState().expedition.postcards[0].options.setting,setting);
  }
});
await test('Night planner keeps context, lengths and safe alternatives; export/import retains paused stories',async()=>{
  const q=boot();q.click('night-ready','indoor');q.el('night-ready-check').checked=true;q.events.submit({target:{id:'night-ready-form',dataset:{setting:'indoor'}},preventDefault(){}});
  q.api.startPlannedOuting({fields:{duration:'long',difficulty:'curious'}});assert.equal(q.api.getState().expedition.active.options.theme,'halloween');assert.equal(q.api.getState().expedition.active.deck.flat().length,15);
  for(let i=0;i<20;i++){q.click('swap-challenge');const c=E.getCurrentCard(q.api.getState().expedition);assert.equal(c.theme,'halloween');assert.ok(c.settings.includes('indoor'));assert.match(q.el('quest-screen').innerHTML,/safe-alternative/);}
  const c=E.getCurrentCard(q.api.getState().expedition);q.click('complete-challenge',undefined,{card:c.id,key:c.challengeKey,chapter:String(c.chapter),step:String(c.step)});q.click('daylight-mode');q.api.exportSave();const backup=JSON.parse(await q.downloads.at(-1).text());assert.ok(backup.state.expedition.parkedOutings['halloween:indoor']);assert.ok(!JSON.stringify(backup).includes('data:image'));
  const restored=boot();await restored.el('import-file').listeners.change({target:{files:[{size:20000,text:async()=>JSON.stringify(backup)}],value:'synthetic'}});restored.click('restore-confirmed');assert.deepEqual(copy(restored.api.getState().expedition.parkedOutings),copy(q.api.getState().expedition.parkedOutings));
});

function addPlayer(q,name,kind='child',costume){
  q.click('add-player');q.el('hero-name').value=name;q.el('hero-role').value='ranger';q.el('hero-specialty').value='detective';
  q.events.change({target:{id:'hero-kind',value:kind}});assert.equal(q.el('hero-size-label').textContent,kind==='adult'?'GROWN-UP HERO':'LITTLE HERO');
  if(costume)q.events.change({target:{id:'hero-costume',value:costume}});
  q.events.submit({preventDefault(){},target:{id:'hero-form'}});
}
function enterNight(q,setting='indoor'){
  q.click('night-ready',setting);q.el('night-ready-check').checked=true;q.events.submit({target:{id:'night-ready-form',dataset:{setting}},preventDefault(){}});
}
await test('Add player stages edits, cancels safely, ignores duplicate submit and preserves existing progress',()=>{
  const q=boot({wildExplorerSaveV2:JSON.stringify(fixture)}),before=copy(q.api.getState());
  q.click('add-player');q.click('add-player');q.el('hero-name').value='Never saved';q.click('close-sheet');
  q.events.submit({preventDefault(){},target:{id:'hero-form'}});assert.deepEqual(copy(q.api.getState()),before);
  q.click('add-player');q.el('hero-name').value='  ';q.events.submit({preventDefault(){},target:{id:'hero-form'}});assert.deepEqual(copy(q.api.getState()),before);assert.match(q.el('toast').textContent,/name first/);
  addPlayer(q,'QA New grown-up','adult','ghost');const added=copy(q.api.getState());
  assert.equal(added.names.length,6);assert.deepEqual(added.names.slice(0,5),before.names);assert.equal(added.leader,before.leader);assert.equal(added.heroKinds[5],'adult');assert.equal(added.costumes[5],'ghost');assert.equal(added.specialties[5],'detective');
  for(const key of ['xp','classic','expedition','journal'])assert.deepEqual(added[key],before[key],key);
  q.events.submit({preventDefault(){},target:{id:'hero-form'}});assert.deepEqual(copy(q.api.getState()),added);
  q.api.openHero(5);q.el('hero-name').value='QA Sixth edited';q.el('hero-role').value='wizard';q.el('hero-specialty').value='listener';q.click('swatch','3',{kind:'skin'});q.events.submit({preventDefault(){},target:{id:'hero-form'}});
  const saved=q.api.getState();assert.equal(saved.names[5],'QA Sixth edited');assert.equal(saved.roles[5],'wizard');assert.equal(saved.looks[5].skin,3);assert.equal(saved.leader,5);assert.equal(saved.heroIds[5],added.heroIds[5]);assert.deepEqual(copy(boot(Object.fromEntries(q.store)).api.getState()),copy(saved));
});
await test('24-player creation guard is explicit and larger imported rosters are never truncated',async()=>{
  const q=boot();for(let i=5;i<24;i++)addPlayer(q,`QA Hero ${i+1}`,i%2?'adult':'child');
  const s=copy(q.api.getState());assert.equal(s.names.length,24);assert.equal(new Set(s.heroIds).size,24);assert.match(q.el('heroes-screen').innerHTML,/Add up to 24/);
  q.click('add-player');assert.deepEqual(copy(q.api.getState()),s);assert.match(q.el('toast').textContent,/up to 24/);
  const large={...s,names:Array.from({length:30},(_,i)=>`QA Imported ${i+1}`),leader:29};
  const p=boot({wildExplorerSaveV2:JSON.stringify(large)});assert.equal(p.api.getState().names.length,30);assert.equal(p.api.getState().leader,29);assert.equal(p.api.getState().looks.length,30);assert.equal(new Set(p.api.getState().heroIds).size,30);assert.match(p.el('heroes-screen').innerHTML,/larger saved team is kept/);
  p.api.exportSave();const backup=JSON.parse(await p.downloads.at(-1).text());const restored=boot();await restored.el('import-file').listeners.change({target:{files:[{size:30000,text:async()=>JSON.stringify(backup)}],value:'synthetic'}});restored.click('restore-confirmed');assert.deepEqual(copy(restored.api.getState()),copy(p.api.getState()));assert.deepEqual(copy(boot(Object.fromEntries(p.store)).api.getState()),copy(p.api.getState()));
});
await test('Legacy roster migration repairs duplicate or unsafe IDs without changing valid identities',()=>{
  const raw={...fixture,names:[...fixture.names,'QA F','QA G','QA H'],heroIds:['player-2','player-2','player-1','safe-custom','<unsafe>','player-8',null,'safe-tail'],costumes:['ghost','__proto__','bat'],heroKinds:['adult','child','adult']};
  const q=boot({wildExplorerSaveV2:JSON.stringify(raw)}),s=copy(q.api.getState());assert.equal(s.heroIds.length,8);assert.equal(new Set(s.heroIds).size,8);assert.equal(s.heroIds[0],'player-2');assert.equal(s.heroIds[2],'player-1');assert.equal(s.heroIds[3],'safe-custom');assert.equal(s.heroIds[5],'player-8');assert.equal(s.heroIds[7],'safe-tail');assert.ok(s.heroIds.every(id=>/^[A-Za-z0-9_-]{1,64}$/.test(id)));assert.equal(s.costumes[0],'ghost');assert.equal(s.costumes[1],'ghost');assert.equal(s.costumes[2],'bat');
  assert.deepEqual(copy(q.api.normalise(s)),s);assert.deepEqual(copy(boot(Object.fromEntries(q.store)).api.getState()),s);
  const fallback=boot({wildExplorerSaveV2:'{bad',wildExplorerSave:q.store.get('wildExplorerSave')}).api.getState();
  for(const key of ['names','heroIds','heroKinds','costumes','looks','specialties','leader'])assert.deepEqual(copy(fallback[key]),s[key],key);
});
await test('Manual, varied and classic leadership rotate through every added player',()=>{
  const q=boot();for(let i=5;i<8;i++)addPlayer(q,`QA Extra ${i}`);
  const start=q.api.getState().leader,seen=new Set();for(let i=0;i<8;i++){seen.add(q.api.getState().leader);q.click('pass-lead');}assert.equal(seen.size,8);assert.equal(q.api.getState().leader,start);
  const checkRotation=()=>{const s=q.api.getState(),c=E.getCurrentCard(s.expedition),lead=s.leader;q.click('complete-challenge',undefined,{card:c.id,key:c.challengeKey,chapter:String(c.chapter),step:String(c.step)});assert.equal(q.api.getState().leader,(lead+1)%8);q.advance();};
  q.api.getState().leader=7;checkRotation();q.api.getState().leader=5;checkRotation();
  q.click('classic-mode');q.api.getState().leader=7;q.click('classic-check','0',{chapter:'0'});assert.equal(q.api.getState().leader,0);q.advance();q.api.getState().leader=5;q.click('classic-check','1',{chapter:'0'});assert.equal(q.api.getState().leader,6);
});
await test('Every avatar wears a Halloween costume including new players; daytime looks return unchanged',()=>{
  const q=boot({wildExplorerSaveV2:JSON.stringify(fixture)});addPlayer(q,'QA Sixth','adult','ghost');addPlayer(q,'QA Seventh','child','wizard');
  const day=copy(q.api.getState()),dayArtwork=day.names.map((_,i)=>q.api.avatar(i).replace(/hero-\d+/g,'hero-ID'));
  for(const setting of E.NIGHT_SETTINGS){
    enterNight(q,setting);const s=q.api.getState();
    assert.equal((q.el('heroes-screen').innerHTML.match(/data-costume="(wizard|ghost|pumpkin|bat)"/g)||[]).length,7);
    assert.equal((q.el('home-screen').innerHTML.match(/data-costume="(wizard|ghost|pumpkin|bat)"/g)||[]).length,7);
    assert.match(q.el('quest-screen').innerHTML,/data-costume="(wizard|ghost|pumpkin|bat)"/);
    for(let i=0;i<7;i++){q.api.openHero(i);assert.ok(q.el('sheet-content').innerHTML.includes(`data-costume="${s.costumes[i]}"`));q.click('close-sheet');}
    for(const key of ['names','heroIds','heroKinds','looks','roles','xp','journal'])assert.deepEqual(copy(s[key]),day[key],key);
    q.click('daylight-mode');assert.deepEqual(day.names.map((_,i)=>q.api.avatar(i).replace(/hero-\d+/g,'hero-ID')),dayArtwork);
  }
  enterNight(q);addPlayer(q,'QA Added at night','child','bat');assert.match(q.el('heroes-screen').innerHTML,/QA Added at night/);assert.equal(q.api.getState().costumes[7],'bat');assert.equal((q.el('home-screen').innerHTML.match(/data-costume="(wizard|ghost|pumpkin|bat)"/g)||[]).length,8);
  q.api.openHero(7);q.events.change({target:{id:'hero-costume',value:'ghost'}});assert.match(q.el('avatar-preview').innerHTML,/data-costume="ghost"/);q.el('hero-name').value='QA Added at night';q.el('hero-role').value='ranger';q.el('hero-specialty').value='scout';q.events.submit({target:{id:'hero-form'},preventDefault(){}});assert.equal(q.api.getState().costumes[7],'ghost');
  q.click('classic-mode');assert.equal((q.el('heroes-screen').innerHTML.match(/data-costume="daylight"/g)||[]).length,8);assert.deepEqual(copy(q.api.getState().looks.slice(0,7)),day.looks);
});
await test('Completed postcards keep every roster name through save, reload and HTML export',async()=>{
  const q=boot();for(let i=5;i<12;i++)addPlayer(q,`QA Postcard ${i+1}`);
  const c=E.getCurrentCard(q.api.getState().expedition);q.click('complete-challenge',undefined,{card:c.id,key:c.challengeKey,chapter:String(c.chapter),step:String(c.step)});q.click('finish-confirmed');
  const s=q.api.getState();assert.equal(s.expedition.postcards[0].heroes.length,12);
  const reloaded=boot(Object.fromEntries(q.store)).api.getState();assert.deepEqual(copy(reloaded.expedition.postcards[0].heroes),copy(s.names));
  vm.runInNewContext(readFileSync(new URL('../public/postcards.js',import.meta.url),'utf8'),q.context,{filename:'postcards.js'});
  const result=await q.context.WildPostcards.exportPostcard(reloaded.expedition.postcards[0],{photoIds:[]});assert.equal(result.downloadRequested,true);const html=await q.downloads.at(-1).text();for(const name of s.names)assert.ok(html.includes(name),name);assert.match(html,/<!doctype html>/);assert.ok(!/https?:\/\//.test(html));
});

function firstCrystal(q){
  while(E.getCurrentCard(q.api.getState().expedition)){const c=E.getCurrentCard(q.api.getState().expedition);q.click('complete-challenge',undefined,{card:c.id,key:c.challengeKey,chapter:String(c.chapter),step:String(c.step)});q.advance();}
  q.click('claim',undefined,{chapter:'0'});assert.equal(q.api.getState().xp,60);
}
async function offerBackup(q,raw){await q.el('import-file').listeners.change({target:{files:[{size:10000,text:async()=>JSON.stringify(raw)}],value:'synthetic'}});}
await test('A stale window hiding or reloading cannot overwrite another window’s earned XP',()=>{
  const sharedStore=new Map(),writes=[];const stale=boot({}, {sharedStore,writes}),newer=boot({}, {sharedStore});firstCrystal(newer);
  const saved=sharedStore.get('wildExplorerSaveV2'),count=writes.length;assert.equal(stale.api.getState().xp,0);
  stale.context.document.hidden=true;stale.events.visibilitychange();stale.windowEvents.pagehide?.();assert.equal(sharedStore.get('wildExplorerSaveV2'),saved);assert.equal(writes.length,count);
  const reload=boot({}, {sharedStore});assert.equal(reload.api.getState().xp,60);assert.equal(reload.api.getState().expedition.wallet,1);
});
await test('Storage/focus/resume read the newest value without writing or trusting delayed events',()=>{
  const sharedStore=new Map(),writes=[];const a=boot({}, {sharedStore,writes}),b=boot({}, {sharedStore});const old=sharedStore.get('wildExplorerSaveV2');firstCrystal(b);const latest=sharedStore.get('wildExplorerSaveV2'),count=writes.length;
  a.api.openHero(2);a.windowEvents.storage({key:'unrelated-key',newValue:latest});assert.equal(a.api.getState().xp,0);
  a.windowEvents.storage({key:'wildExplorerSaveV2',newValue:old,storageArea:{}});assert.equal(a.api.getState().xp,0);
  a.windowEvents.storage({key:'wildExplorerSaveV2',newValue:old,storageArea:a.context.localStorage});assert.equal(a.api.getState().xp,60);assert.equal(a.el('sheet').open,false);assert.equal(a.el('sheet-content').innerHTML,'');
  a.windowEvents.storage({key:'wildExplorerSaveV2',newValue:'{stale bad event'});a.windowEvents.focus();a.windowEvents.pageshow();a.context.document.hidden=false;a.events.visibilitychange();assert.equal(sharedStore.get('wildExplorerSaveV2'),latest);assert.equal(writes.length,count);assert.equal(a.api.getState().xp,60);
  b.click('close-sheet');addPlayer(b,'QA Other window');a.windowEvents.pageshow();assert.equal(a.api.getState().names.length,6);assert.equal(writes.length,count);
});
await test('Stale actions and hero dialogs refresh first, then require a deliberate retry',()=>{
  const sharedStore=new Map(),a=boot({}, {sharedStore}),b=boot({}, {sharedStore});a.api.openHero(2);a.el('hero-name').value='Stale overwrite';a.el('hero-role').value='wizard';a.el('hero-specialty').value='listener';firstCrystal(b);const latest=sharedStore.get('wildExplorerSaveV2');
  a.events.submit({target:{id:'hero-form'},preventDefault(){}});assert.equal(sharedStore.get('wildExplorerSaveV2'),latest);assert.equal(a.api.getState().names[2],'Child 1');assert.equal(a.el('sheet').open,false);assert.match(a.el('toast').textContent,/updated in another window/);
  a.events.submit({target:{id:'hero-form'},preventDefault(){}});assert.equal(sharedStore.get('wildExplorerSaveV2'),latest);
  b.click('close-sheet');addPlayer(b,'QA Extra');const current=sharedStore.get('wildExplorerSaveV2'),leader=b.api.getState().leader;a.click('pass-lead');assert.equal(sharedStore.get('wildExplorerSaveV2'),current);assert.equal(a.api.getState().leader,leader);a.click('pass-lead');assert.equal(a.api.getState().leader,(leader+1)%6);assert.equal(a.api.getState().xp,60);
  b.api.getState().names[0]='Unsaved stale mutation';assert.equal(b.api.save(),false);assert.deepEqual(copy(b.api.getState()),copy(a.api.getState()));
});
await test('Cross-window changes invalidate pending restores; a fresh intentional restore can lower XP',async()=>{
  const sharedStore=new Map(),a=boot({}, {sharedStore}),b=boot({}, {sharedStore}),backup=copy(a.api.getState());await offerBackup(a,backup);firstCrystal(b);const latest=sharedStore.get('wildExplorerSaveV2');
  a.click('restore-confirmed');assert.equal(sharedStore.get('wildExplorerSaveV2'),latest);assert.equal(a.api.getState().xp,60);assert.equal(a.el('sheet').open,false);
  a.click('restore-confirmed');assert.equal(sharedStore.get('wildExplorerSaveV2'),latest);
  await offerBackup(a,backup);a.click('close-sheet');a.click('restore-confirmed');assert.equal(sharedStore.get('wildExplorerSaveV2'),latest);
  await offerBackup(a,backup);a.click('restore-confirmed');assert.equal(a.api.getState().xp,0);assert.equal(JSON.parse(sharedStore.get('wildExplorerSaveV2')).xp,0);b.windowEvents.storage({key:'wildExplorerSaveV2',newValue:latest});assert.equal(b.api.getState().xp,0);
});
await test('An in-flight backup read cannot reopen stale confirmation after another window advances',async()=>{
  const sharedStore=new Map(),a=boot({}, {sharedStore}),b=boot({}, {sharedStore}),backup=copy(a.api.getState());let finish;
  const task=a.el('import-file').listeners.change({target:{files:[{size:10000,text:()=>new Promise(resolve=>finish=resolve)}],value:'synthetic'}});firstCrystal(b);const latest=sharedStore.get('wildExplorerSaveV2');a.windowEvents.storage({key:'wildExplorerSaveV2'});finish(JSON.stringify(backup));await task;
  assert.ok(!a.el('sheet').open);a.click('restore-confirmed');assert.equal(sharedStore.get('wildExplorerSaveV2'),latest);assert.equal(a.api.getState().xp,60);
});
await test('An in-flight photo cannot attach to changed/restored state or overwrite newer progress',async()=>{
  const sharedStore=new Map(),a=boot({}, {sharedStore});const c=E.getCurrentCard(a.api.getState().expedition);a.click('complete-challenge',undefined,{card:c.id,key:c.challengeKey,chapter:String(c.chapter),step:String(c.step)});a.click('finish-confirmed');const id=a.api.getState().expedition.postcards[0].id;
  const b=boot({}, {sharedStore});await a.api.openPostcard(id);let finish;const deleted=[];
  a.context.WildPostcards={storePhoto:()=>new Promise(resolve=>finish=resolve),deletePhoto:async photo=>deleted.push(photo)};
  const task=a.el('postcard-photo').listeners.change({target:{files:[{}],value:'synthetic'}});addPlayer(b,'QA Added elsewhere');const latest=sharedStore.get('wildExplorerSaveV2');finish('photo-synthetic-delayed');await task;
  assert.deepEqual(deleted,['photo-synthetic-delayed']);assert.equal(sharedStore.get('wildExplorerSaveV2'),latest);assert.deepEqual(copy(a.api.getState().expedition.postcards[0].photoIds),[]);assert.equal(a.api.getState().names.length,6);assert.equal(a.el('sheet').open,false);
});

await test('Structurally invalid newer storage never replaces earned progress and fallback still works',async()=>{
  const q=boot();firstCrystal(q);const earned=copy(q.api.getState());
  for(const malformed of [{},{names:[],checks:[],index:0,xp:0},{names:['QA'],checks:[],index:0,xp:-1},{names:['QA'],checks:[],index:0,xp:'60'}]){
    const raw=JSON.stringify(malformed);q.store.set('wildExplorerSaveV2',raw);q.windowEvents.storage({key:'wildExplorerSaveV2'});assert.deepEqual(copy(q.api.getState()),earned);assert.equal(q.api.save(),false);assert.equal(q.store.get('wildExplorerSaveV2'),raw);assert.match(q.el('save-warning').textContent,/could not be read/);
  }
  q.click('settings');q.click('export');const backup=JSON.parse(await q.downloads.at(-1).text());assert.equal(backup.state.xp,60);
  const reload=boot(Object.fromEntries(q.store));assert.equal(reload.api.getState().xp,60);assert.equal(reload.api.getState().names[0],earned.names[0]);
});
await test('Dismissed or replaced backup reads stay dismissed, including out-of-order file choices',async()=>{
  for(const dismiss of ['close','replace']){
    const q=boot(),original=copy(q.api.getState());q.click('settings');let finish;
    const task=q.el('import-file').listeners.change({target:{files:[{size:1000,text:()=>new Promise(resolve=>finish=resolve)}],value:'synthetic'}});
    if(dismiss==='close')q.click('close-sheet');else q.api.openHero(0);
    const content=q.el('sheet-content').innerHTML;finish(JSON.stringify({...original,xp:20}));await task;
    assert.equal(q.el('sheet-content').innerHTML,content);if(dismiss==='close')assert.equal(q.el('sheet').open,false);else assert.match(content,/Choose your explorer/);
    q.click('restore-confirmed');assert.deepEqual(copy(q.api.getState()),original);
  }
  const q=boot(),backup=copy(q.api.getState());q.click('settings');let first,second;
  const a=q.el('import-file').listeners.change({target:{files:[{size:1000,text:()=>new Promise(resolve=>first=resolve)}],value:'one'}});
  const b=q.el('import-file').listeners.change({target:{files:[{size:1000,text:()=>new Promise(resolve=>second=resolve)}],value:'two'}});
  first(JSON.stringify(backup));await a;assert.match(q.el('sheet-content').innerHTML,/Grown-up corner/);
  second(JSON.stringify(backup));await b;assert.match(q.el('sheet-content').innerHTML,/Restore this adventure/);
});
await test('Delayed photo removal finishes without reopening a dismissed or replaced postcard',async()=>{
  for(const dismiss of ['close','replace']){
    const q=boot(),c=E.getCurrentCard(q.api.getState().expedition);q.click('complete-challenge',undefined,{card:c.id,key:c.challengeKey,chapter:String(c.chapter),step:String(c.step)});q.click('finish-confirmed');
    const p=q.api.getState().expedition.postcards[0];p.photoIds=['photo-synthetic-remove'];q.api.save();let finish;
    q.context.WildPostcards={loadPhoto:async()=>null,deletePhoto:()=>new Promise(resolve=>finish=resolve)};await q.api.openPostcard(p.id);
    const task=q.api.removePostcardPhoto(p.id,p.photoIds[0]);if(dismiss==='close')q.click('close-sheet');else q.api.openHero(0);const content=q.el('sheet-content').innerHTML;
    finish();await task;assert.deepEqual(copy(q.api.getState().expedition.postcards[0].photoIds),[]);assert.equal(q.el('sheet-content').innerHTML,content);
    if(dismiss==='close')assert.equal(q.el('sheet').open,false);else assert.match(content,/Choose your explorer/);
    assert.deepEqual(JSON.parse(q.store.get('wildExplorerSaveV2')).expedition.postcards[0].photoIds,[]);
  }
});

await test('A queued old dialog-close event cannot erase a newly opened hero draft',()=>{
  const q=boot(),queued=[],sheet=q.el('sheet');sheet.close=function(){this.open=false;queued.push(()=>this.listeners.close?.());};
  q.click('settings');q.click('close-sheet');q.click('hero','0');q.el('hero-name').value='QA Reopened hero';q.el('hero-role').value='wizard';q.el('hero-specialty').value='listener';
  queued.shift()();assert.equal(sheet.open,true);q.events.submit({target:{id:'hero-form'},preventDefault(){}});assert.equal(q.api.getState().names[0],'QA Reopened hero');assert.equal(q.api.getState().roles[0],'wizard');
});
console.log(`\nRuntime integration: ${passed} passed, ${failed} failed. DOM stubs do not validate visual layout, browser events, IndexedDB or real service workers.`);
if(failed)process.exitCode=1;
