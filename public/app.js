/* Operation Wild Explorer 2.0.0 — static, camera-free, mobile-first.
   No API keys, analytics, remote scripts, or location uploads.
   New saves migrate from and mirror the original wildExplorerSave key. */
'use strict';
(() => {
  const VERSION = '3.3.0';
  const E = window.WildEngine;
  const C = window.WildClassic;
  const G = window.WildGear;
  const Q = window.WildQuestMagic;
  const magicSound = Q.createSoundEngine(window);
  const narrationManifest = window.WildNarrationManifest || {};
  const narrator = window.WildNarration?.createPlayer(window, narrationManifest, {
    beforePlay: () => magicSound.stop(),
    onStatus: info => {
      speechActive = info.state === 'playing' || info.state === 'loading';
      document.querySelectorAll('[data-action="read"]').forEach(button => {
        button.setAttribute('aria-pressed', String(speechActive));
        button.setAttribute('aria-label', speechActive ? 'Stop narration' : 'Read aloud with Bella');
      });
      document.querySelectorAll('[data-narration-status]').forEach(el => { el.textContent = speechActive ? (info.source === 'device' ? 'Device voice · tap the speaker to stop' : 'Bella · tap the speaker to stop') : 'Bella · gentle read-aloud'; });
      if(info.message)toast(info.message);
    }
  });
  const voicePack = window.WildNarration?.createPack(window, narrationManifest);
  const SPECIALTIES = {scout:{label:'Scout',emoji:'🔎',hint:'Point out a colour, shape or tiny detail.'},listener:{label:'Listener',emoji:'👂',hint:'Invite everyone to pause and notice a quiet sound.'},detective:{label:'Detective',emoji:'🧩',hint:'Ask a curious question and connect two discoveries.'}};
  const DEFAULT_SPECIALTIES = ['scout','listener','detective','scout','listener'];
  const MAX_NEW_PLAYERS = 24;
  const COSTUMES = {wizard:{label:'Moon wizard',emoji:'🧙'},ghost:{label:'Friendly ghost',emoji:'👻'},pumpkin:{label:'Pumpkin pal',emoji:'🎃'},bat:{label:'Cozy bat',emoji:'🦇'}};
  const defaultCostume = index => Object.keys(COSTUMES)[index % Object.keys(COSTUMES).length];
  const defaultLook = index => ({skin:index%4,hair:index%4,colour:index%5,long:index%2===1});
  const defaultName = index => ['Adult 1','Adult 2','Child 1','Child 2','Child 3'][index] || `Explorer ${index+1}`;
  const SAVE_KEY = 'wildExplorerSaveV2';
  const OLD_KEY = 'wildExplorerSave';
  const $ = id => document.getElementById(id);
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const clean = (value, limit = 80) => typeof value === 'string' ? value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '').trim().slice(0, limit) : '';
  const clampInt = (value, min, max, fallback = min) => Number.isFinite(Number(value)) ? Math.max(min, Math.min(max, Math.floor(Number(value)))) : fallback;
  const ICONS = {
    leaf:'<path d="M5 19C1 9 8 3 21 3c0 12-6 18-14 14"/><path d="m3 22 14-15M9 16l-1-6m5 2 5 1"/>',
    home:'<path d="m3 11 9-8 9 8M5 10v11h5v-7h4v7h5V10"/>',
    compass:'<circle cx="12" cy="12" r="9"/><path d="m16 8-3 5-5 3 3-5z"/>',
    heroes:'<circle cx="9" cy="7" r="3"/><path d="M3 21v-3a6 6 0 0 1 12 0v3zM17 4a3 3 0 0 1 0 6m1 4a5 5 0 0 1 4 5v2h-4"/>',
    chest:'<path fill="#d7a559" d="M3 10V8a5 5 0 0 1 5-5h8a5 5 0 0 1 5 5v2Z"/><path fill="#e8bd73" d="M3 10h18v10H3z"/><path d="M7 4v6m10-6v6M3 15h6m6 0h6"/><path fill="#fff2aa" d="M9 12h6v6H9z"/>',
    map:'<path d="m3 5 6-2 6 2 6-2v16l-6 2-6-2-6 2zm6-2v16m6-14v16"/><path d="m6 10 2 1m4-1 2 1m4-1 1-1"/>',
    star:'<path d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8-6.2-3.2L5.8 21 7 14.2 2 9.3l6.9-1z"/>',
    settings:'<path d="m9 2-1 3-3 1-2 3 2 3-1 3 2 3 3 1 2 3 3-1 1-3 3-1 2-3-2-3 1-3-2-3-3-1-2-2z"/><circle cx="12" cy="12" r="3.5"/>',
    play:'<path fill="currentColor" stroke="none" d="M6 3.5c0-1 1-1.5 1.9-1L21 11a1.2 1.2 0 0 1 0 2L7.9 21.5c-.9.5-1.9 0-1.9-1z"/>',
    pin:'<path d="M19 9c0 5-7 12-7 12S5 14 5 9a7 7 0 0 1 14 0z"/><circle cx="12" cy="9" r="2"/>',
    sound:'<path d="M3 9h4l5-5v16l-5-5H3zm13-3a8 8 0 0 1 0 12m3-15a12 12 0 0 1 0 18"/>',
    arrow:'<path d="M4 12h15m-6-6 6 6-6 6"/>',
    check:'<path d="m5 12 4 4L19 6"/>',
    close:'<path d="m6 6 12 12M6 18 18 6"/>',
    lock:'<rect x="5" y="10" width="14" height="11" rx="3"/><path d="M8 10V6a4 4 0 0 1 8 0v4m-4 5v2"/>',
    stone:'<path fill="#a9b8bb" d="m3 16 3-9 7-4 7 5 2 10-8 4z"/><path d="m6 7 8 5 6-4m-6 4v10M3 16l11-4"/>',
    tree:'<path fill="#b2d893" d="m12 2-6 7h3l-6 7h7v6h4v-6h7l-6-7h3z"/>',
    bird:'<path d="M3 16c9 5 18 0 16-8l3-2-5-1a5 5 0 0 0-8 4L2 7l3 6-3 3z"/><path d="m9 13 4-3m2-3h.1"/>',
    sparkles:'<path fill="#f4cd69" d="m10 3 2 6 6 2-6 2-2 6-2-6-6-2 6-2zm10 11 1 3 3 1-3 1-1 3-1-3-3-1 3-1z"/>',
    refresh:'<path d="M20 8a8 8 0 0 0-14-3L3 8m0-5v5h5m-4 8a8 8 0 0 0 14 3l3-3m0 5v-5h-5"/>',
    download:'<path d="M12 3v12m-5-5 5 5 5-5M3 16v5h18v-5"/>',
    book:'<path d="M12 5c-3-3-7-3-10-2v16c4-1 7-1 10 2 3-3 6-3 10-2V3c-3-1-7-1-10 2zm0 0v16"/>',
    shield:'<path d="m12 2 9 4v6c0 5-5 8-9 10-4-2-9-5-9-10V6z"/><path d="m7 12 3 3 7-7"/>'
  };
  const icon = (name, className='') => `<svg class="${className}" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${ICONS[name] || ICONS.leaf}</svg>`;
  document.querySelectorAll('[data-icon]').forEach(el => { el.innerHTML = icon(el.dataset.icon); });
  const PALETTE = ['#3298c5','#e77383','#58a967','#a87ace','#e1b139'];
  const SKINS = ['#f6caa5','#e4ae80','#be865e','#885f45'];
  const HAIR = ['#603d2b','#35322b','#a75b31','#d7a345'];
  const ROLES = [
    {id:'ranger',label:'Ranger',emoji:'🏹',power:'Super spotting',description:'You notice tiny details. Help the team spot shapes and colours.'},
    {id:'guardian',label:'Guardian',emoji:'🛡️',power:'Team togetherness',description:'You help everyone feel brave. Keep your explorer team together.'},
    {id:'whisperer',label:'Animal Whisperer',emoji:'🦊',power:'Quiet listening',description:'Your quiet ears discover forest sounds. Watch animals from far away.'},
    {id:'wizard',label:'Nature Wizard',emoji:'🧙',power:'Wonder magic',description:'You copy shapes with your hands and turn real discoveries into stories.'},
    {id:'hunter',label:'Treasure Hunter',emoji:'💎',power:'Colour finding',description:'You find nature’s colourful clues. The crystals are pretend treasure!'}
  ];
  const ROLE = value => ROLES.find(r => r.id === value || String(value).includes(r.label)) || ROLES[0];
  const MISSIONS = [
    {id:'emerald',title:'The Emerald Crystal',short:'Forest colours',icon:'leaf',colour:'#36b879',light:'#8ff2ac',dark:'#117459',xp:60,gem:'💚 Emerald Crystal',
      story:'Our first crystal is sleeping! Three forest colours will wake it up. Look with your eyes and point from the path.',
      tasks:[['Spot something green','Spot a green leaf on a tree','Point to any colour you can see'],['Spot yellow or orange','Look for a yellow or orange leaf','Find something lighter than a tree trunk'],['Spot something brown','Look for a brown tree trunk','Find a darker colour in nature']],
      symbols:['🍃','🍂','🪵'],celebrate:'Your colour-finding magic woke up the Emerald Crystal!'},
    {id:'stone',title:'The Ancient Stone Kingdom',short:'Stone shapes',icon:'stone',colour:'#9874d6',light:'#d4b8ff',dark:'#684697',xp:80,gem:'💜 Stone Crystal',
      story:'A gentle stone giant has a riddle. Find shapes and patterns you can see safely from the path. No picking up rocks or climbing!',
      tasks:[['Spot a rock with a pattern','Find a patterned tree trunk','Look for something with stripes or spots'],['Find a round-looking stone','Find a round shape in nature','Make a round stone shape with your hands'],['Point to a rock bigger than your shoe','Find a tree trunk wider than your shoe','Make a big shape with your arms']],
      symbols:['🪨','⭕','👟'],celebrate:'You solved the stone giant’s riddle. The Stone Crystal is yours!'},
    {id:'sound',title:'The Whispering Woodland',short:'Forest sounds',icon:'bird',colour:'#eaba31',light:'#fff096',dark:'#a27812',xp:80,gem:'💛 Sound Crystal',
      story:'Shhh… the forest has a message. Stand safely beside a grown-up, use your listening ears, and keep your eyes open.',
      tasks:[['Listen for a bird call','Listen for any quiet outdoor sound','Rub your palms gently and listen to the sound'],['Listen for rustling leaves','Listen to the breeze','Listen to your own gentle footsteps'],['Listen quietly for 10 seconds','Count to five together in whispers','Listen to a grown-up softly tap their own palm']],
      symbols:['🐦','🍃','👂'],celebrate:'Your super listening unlocked the shimmering Sound Crystal!'},
    {id:'sky',title:'The Escarpment Lookout',short:'Treetop wonders',icon:'tree',colour:'#329dcd',light:'#97eaff',dark:'#2469a0',xp:100,gem:'💙 Sky Crystal',
      story:'Our lookout is right here on the safe path! Look for tall trees and funny branch shapes. No stairs, edges, or climbing needed.',
      tasks:[['Spot a tree taller than a house','Find the tallest tree you can see','Stretch up tall like a tree'],['Find interesting tree bark','Find a tree with two colours','Look for a bumpy pattern in nature'],['Spot a branch shaped like a letter','Find a branch that makes a Y','Make a Y with your arms']],
      symbols:['🌳','🔍','🙌'],celebrate:'Your wonderful noticing brought the Sky Crystal back to life!'},
    {id:'guardian',title:'The Guardian’s Final Spell',short:'Our magic finale',icon:'sparkles',colour:'#ed967b',light:'#ffdf9e',dark:'#b75c8d',xp:120,gem:'🌈 Guardian Crystal',
      story:'One final crystal needs the whole team! Share your favourite discoveries and give the forest a friendly thank-you.',
      tasks:[['Everyone shares a favourite find','Everyone points to something they like','Each explorer points to a favourite colour nearby'],['Count five trees together','Count five leaves without picking them','Count your explorers together; point to each person as you go'],['Give the forest a thank-you wave','Give your team a gentle high-five','Say a quiet thank-you to the forest']],
      symbols:['💬','🌳','👋'],celebrate:'All five crystals are home! Your family are the new Forest Guardians.'}
  ];
  const CATEGORIES = {
    leaf:{emoji:'🍃',label:'Leaf',idea:'Leave the leaf where it is. Look at its edge, then trace its shape on your own palm with a finger.'},
    bird:{emoji:'🐦',label:'Bird',idea:'Watch from a distance. Notice one movement, then copy it quietly with a hand. Do not call to the bird.'},
    stone:{emoji:'🪨',label:'Rock',idea:'Leave the rock where it is. Trace its outline in the air. Is it round, pointy or a bit of both?'},
    bug:{emoji:'🐞',label:'Bug',idea:'Give the little bug lots of space. Watch how it moves, then walk two fingers across your own palm.'},
    tree:{emoji:'🌳',label:'Tree',idea:'Stay on the path. Find a fork in the branches and make the same shape with your arms or fingers.'},
    sound:{emoji:'👂',label:'Sound',idea:'Pause with your eyes open and listen. Is the sound long or short? Tap a finger softly on your palm to copy its rhythm.'},
    flower:{emoji:'🌼',label:'Flower',idea:'Leave the flower growing. Notice its colour, then open your hand like its petals.'},
    other:{emoji:'✨',label:'Wonder',idea:'Point to one real detail you noticed. Show its shape or movement with your hands for the family to copy.'}
  };
  const freshState = () => ({version:3,classic:null,mode:'expedition',expedition:null,specialties:[...DEFAULT_SPECIALTIES],index:0,checks:[false,false,false],variants:[0,0,0],xp:0,gems:[],
    names:['Adult 1','Adult 2','Child 1','Child 2','Child 3'],roles:ROLES.map(r=>r.id),
    heroIds:[1,2,3,4,5].map(i=>`player-${i}`),heroKinds:['adult','adult','child','child','child'],costumes:[0,1,2,3,4].map(defaultCostume),
    looks:[{skin:1,hair:0,colour:0,long:false},{skin:2,hair:1,colour:1,long:true},{skin:0,hair:0,colour:2,long:false},{skin:2,hair:1,colour:3,long:true},{skin:1,hair:2,colour:4,long:false}],
    leader:2,park:'Chedoke Radial Recreational Trail',start:'120 Beddoe Dr, Hamilton',journal:[],settings:{sound:false,motion:true,volume:55},tools:{lanternOn:false,lanternLevel:60,lanternId:null}});
  function normalise(raw) {
    const d=freshState();
    if(!raw || typeof raw !== 'object' || Array.isArray(raw)) return d;
    d.index=clampInt(raw.index,0,5); d.xp=clampInt(raw.xp,0,1000000);
    d.checks=[0,1,2].map(i=>raw.checks?.[i] === true); if(d.index===5) d.checks=[false,false,false];
    d.variants=[0,1,2].map(i=>clampInt(raw.variants?.[i],0,2));
    d.gems=MISSIONS.slice(0,d.index).map(m=>m.gem);
    // Additive roster migration: keep the original five and every extra saved player.
    // The creation limit is a UI guard only; loading never truncates a larger roster.
    const count=Math.max(d.names.length,Array.isArray(raw.names)?raw.names.length:0);
    const indices=Array.from({length:count},(_,i)=>i),usedIds=new Set();
    const reservedIds=new Set((Array.isArray(raw.heroIds)?raw.heroIds:[]).filter(id=>typeof id==='string'&&/^[A-Za-z0-9_-]{1,64}$/.test(id)));
    d.heroIds=indices.map(i=>{let id=raw.heroIds?.[i];if(typeof id!=='string'||!/^[A-Za-z0-9_-]{1,64}$/.test(id)||usedIds.has(id)){let n=i+1;do{id=`player-${n++}`;}while(usedIds.has(id)||reservedIds.has(id));}usedIds.add(id);return id;});
    d.names=indices.map(i=>clean(raw.names?.[i],24)||defaultName(i));
    d.roles=indices.map(i=>raw.roles?.[i]?ROLE(raw.roles[i]).id:ROLES[i%ROLES.length].id);
    d.heroKinds=indices.map(i=>['adult','child'].includes(raw.heroKinds?.[i])?raw.heroKinds[i]:i<2?'adult':'child');
    d.costumes=indices.map(i=>Object.hasOwn(COSTUMES,raw.costumes?.[i])?raw.costumes[i]:defaultCostume(i));
    d.looks=indices.map(i=>{const look=d.looks[i]||defaultLook(i),r=raw.looks?.[i];return r&&typeof r==='object'?{skin:clampInt(r.skin,0,3,look.skin),hair:clampInt(r.hair,0,3,look.hair),colour:clampInt(r.colour,0,4,look.colour),long:typeof r.long==='boolean'?r.long:look.long}:look;});
    d.leader=clampInt(raw.leader,0,count-1,2);
    d.park=clean(raw.park,100)||d.park;d.start=clean(raw.start,120)||d.start;
    d.settings={sound:raw.settings?.sound===true,motion:raw.settings?.motion!==false,volume:clampInt(raw.settings?.volume,0,100,55)};
    if(Array.isArray(raw.journal)) d.journal=raw.journal.slice(-150).filter(e=>e&&typeof e==='object'&&CATEGORIES[e.category]&&clean(e.note,280)).map(e=>({category:e.category,note:clean(e.note,280),at:Number.isFinite(new Date(e.at).getTime())?new Date(e.at).toISOString():new Date().toISOString()}));
    d.specialties=indices.map(i=>Object.hasOwn(SPECIALTIES,raw.specialties?.[i])?raw.specialties[i]:DEFAULT_SPECIALTIES[i%DEFAULT_SPECIALTIES.length]);
    d.classic=C.normalise(raw.classic,raw);
    d.mode=raw.mode==='classic'||(!raw.expedition&&raw.version===3)?'classic':'expedition';
    d.expedition=E.normaliseExpansion(raw.expedition,d);
    if(!raw.expedition){d.expedition.wallet=d.classic.index;d.expedition.lifetime.crystals=d.classic.index;}
    const lanternId=['explorer-lantern','pumpkin-lantern'].includes(raw.tools?.lanternId)&&d.expedition.owned.includes(raw.tools.lanternId)?raw.tools.lanternId:null;
    d.tools={lanternOn:!!lanternId&&raw.tools?.lanternOn===true,lanternLevel:clampInt(raw.tools?.lanternLevel,20,100,60),lanternId};
    d.index=d.expedition.active.claimedChapters.length;
    d.gems=MISSIONS.slice(0,d.index).map(m=>m.gem);
    d.xp=d.expedition.lifetime.xp;
    d.checks=[0,1,2].map(i=>d.expedition.active.done.some(r=>r.chapter===d.expedition.active.chapter&&r.step===i));
    return d;
  }
  const validSaveData=raw=>raw&&typeof raw==='object'&&!Array.isArray(raw)&&Array.isArray(raw.names)&&raw.names.length>0&&Array.isArray(raw.checks)&&Number.isInteger(raw.index)&&raw.index>=0&&raw.index<=10&&typeof raw.xp==='number'&&Number.isFinite(raw.xp)&&raw.xp>=0;
  let saveIssue='', importedLegacy=false, lastSavedValue=null;
  function loadState(){
    try{
      for(const key of [SAVE_KEY,OLD_KEY]){
        const raw=localStorage.getItem(key);if(key===SAVE_KEY)lastSavedValue=raw;if(!raw)continue;
        try{const parsed=JSON.parse(raw);if(validSaveData(parsed)){importedLegacy=key===OLD_KEY;return normalise(parsed);}}catch{/* Try the original save next, without destroying the unreadable copy. */}
      }
    }catch{saveIssue='This browser is blocking saved progress. You can play, but use Settings → Export backup before closing.';}
    return freshState();
  }
  let state=loadState();
  state.classic=C.normalise(state.classic,state);
  state.expedition=E.normaliseExpansion(state.expedition,state);
  function showSaveIssue(){const el=$('save-warning');el.textContent=saveIssue;el.hidden=!saveIssue;}
  function save(){
    // A stale window must never replace progress written by another window.
    if(syncFromStorage())return false;
    try{
      const value=JSON.stringify(state);localStorage.setItem(SAVE_KEY,value);lastSavedValue=value;
      // Keep the original fields readable, plus additive roster data for fallback recovery.
      localStorage.setItem(OLD_KEY,JSON.stringify({index:state.index,checks:state.checks,xp:state.xp,gems:state.gems,names:state.names,roles:state.roles.map(r=>ROLE(r).emoji+' '+ROLE(r).label),looks:state.looks,heroIds:state.heroIds,heroKinds:state.heroKinds,costumes:state.costumes,specialties:state.specialties,leader:state.leader,park:state.park,start:state.start}));
      saveIssue='';
    }catch{saveIssue='Progress could not be saved on this device. Use Settings → Export backup before closing the game.';}
    showSaveIssue();return true;
  }
  let activeTab='home', treasureTab='crystals', toastTimer=null, audioContext=null, sheetReturn=null, draftHero=null, speechActive=false;
  let locationFix=null,gpsBusy=false,gpsError='',gpsRequestId=0,swRegistration=null;
  let gearItem=null,gearStep=0,compassSession=0,compassTimer=null,compassStaleTimer=null,compassListening=false;
  let compassEnableAfter=0,compassMode='practice',compassHeading=null,practiceHeading=0,compassMessage='Practice dial: you choose the direction. This is not a real heading.';
  let uid=0, offlineReady=false, photoBusy=false, viewedPostcardId=null, challengeTapUntil=0, sheetEpoch=0;
  function syncFromStorage(showMessage=true){
    let value;
    try{value=localStorage.getItem(SAVE_KEY);}catch{return false;}
    if(value===lastSavedValue)return false;
    // A cleared key has no newer progress to adopt. Keep the current in-memory
    // adventure available for export; only a later explicit action can save it.
    if(value===null){lastSavedValue=null;return false;}
    let latest;
    try{const parsed=JSON.parse(value);if(!validSaveData(parsed))throw new Error('Invalid save');latest=normalise(parsed);}
    catch{saveIssue='Saved progress changed in another window but could not be read. Export your current backup, then reload before playing.';showSaveIssue();return true;}
    magicSound.stop();state=latest;lastSavedValue=value;saveIssue='';
    draftHero=null;pendingRestore=null;puzzlePicked=[];viewedPostcardId=null;challengeTapUntil=0;
    closeSheet();$('sheet-content').innerHTML='';
    stopNarration();
    renderAll();
    if(showMessage)toast('Your adventure was updated in another window. Please try your action again.');
    return true;
  }
  const active=()=>state.expedition.active;
  const currentCard=()=>E.getCurrentCard(state.expedition);
  const specialty=i=>SPECIALTIES[state.specialties[i]]||SPECIALTIES.scout;
  const completedCount=()=>active().done.length;
  const optionLabel=value=>String(value).replace(/\b\w/g,c=>c.toUpperCase());
  const currentMission=()=>MISSIONS[Math.min(state.index,4)];
  const taskText=i=>currentMission().tasks[i][state.variants[i]||0];
  const isChedoke=()=>/chedoke/i.test(state.park);
  const isNight=()=>state.mode!=='classic'&&active().options.theme==='halloween';
  const NIGHT_PLACES={indoor:{name:'Cozy house',emoji:'🏠',detail:'Make, dress up and discover with things already at home.'},neighbourhood:{name:'Neighbourhood walk',emoji:'🏘️',detail:'Look from a safe sidewalk stop. No door visits or road-crossing clues.'},trail:{name:'Nearby trail',emoji:'🌲',detail:'Only a familiar trail a grown-up confirms is open and safe after dark.'}};
  const NIGHT_CHAPTERS=[['The Pumpkin Invitation','A friendly invitation','The pumpkin friends sent a little invitation. Your noticing brings the first lantern home!'],['The Friendly Shadow Parade','Gentle shadow shapes','Your gentle shapes gave our pretend shadow friends something to smile about.'],['The Moon’s Quiet Orchestra','Quiet night sounds','Your kind listening added a soft note to the moon’s make-believe song.'],['The Little Lantern Mystery','Connect our clues','Your real discoveries brought the next lantern to our story.'],['The Cozy Pumpkin Party','Our cozy story ending','All five lanterns are glowing in our story. The pumpkin friends made a cozy place for every hero!']];
  const storyMissions=()=>isNight()?MISSIONS.map((m,i)=>({...m,title:NIGHT_CHAPTERS[i][0],short:NIGHT_CHAPTERS[i][1],celebrate:NIGHT_CHAPTERS[i][2]})):MISSIONS;
  const adventureSummary=()=>isNight()?`Halloween night · ${NIGHT_PLACES[active().options.setting].name} · ${optionLabel(active().options.duration)}`:`${optionLabel(active().options.habitat)} · ${optionLabel(active().options.season)} · ${optionLabel(active().options.duration)} · ${optionLabel(active().options.difficulty)}`;
  const storyTitle=()=>isNight()?'THE FIVE LITTLE LANTERNS':isChedoke()?'THE LOST CRYSTALS OF CHEDOKE':'THE LOST FOREST CRYSTALS';
  const fox = () => `<svg class="fox" viewBox="0 0 100 108" aria-hidden="true"><path d="M15 66 7 11l31 19c12-5 21-5 31 0l24-19-6 55c3 24-18 34-37 38C25 99 9 88 15 66Z" fill="#e9974c" stroke="#a86737" stroke-width="3" stroke-linejoin="round"/><path d="m15 22 7 31 15-17Zm69 0-6 31-14-17Z" fill="#753f31"/><path d="M15 66c9-10 26-3 35 8 12-14 27-16 36-8 3 17-17 31-36 37C27 97 13 84 15 66" fill="#fff4d7"/><ellipse cx="31" cy="58" rx="5" ry="6" fill="#324333"/><ellipse cx="68" cy="58" rx="5" ry="6" fill="#324333"/><circle cx="32" cy="56" r="1.5" fill="white"/><circle cx="69" cy="56" r="1.5" fill="white"/><path d="M43 75q7-6 14 0l-7 8Z" fill="#364535"/><path d="M50 81v7m-8-1q8 8 16 0" fill="none" stroke="#694b35" stroke-width="2.5" stroke-linecap="round"/><ellipse cx="26" cy="70" rx="6" ry="3" fill="#eeb187"/><ellipse cx="74" cy="70" rx="6" ry="3" fill="#eeb187"/></svg>`;
  function gem(m,className=''){return Q.gem(m,className);}
  function avatar(index,look=state.looks[index],appearance={}){
    const adult=(appearance.kind||state.heroKinds[index])==='adult', costume=isNight()?(appearance.costume||state.costumes[index]||defaultCostume(index)):'daylight';
    const colour=PALETTE[look.colour],skin=SKINS[look.skin],hair=HAIR[look.hair];
    const id='hero-'+(++uid),stroke='#3e5141';
    const bodyY=adult?144:150, footY=adult?237:230;
    return `<svg viewBox="0 0 180 264" data-costume="${costume}" aria-hidden="true" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="${id}-shirt" x2="0" y2="1"><stop stop-color="${colour}"/><stop offset="1" stop-color="${colour}" stop-opacity=".78"/></linearGradient><linearGradient id="${id}-skin" x2="0" y2="1"><stop stop-color="${skin}"/><stop offset="1" stop-color="${skin}"/></linearGradient></defs><g transform="${adult?'translate(0 0)':'translate(9 24) scale(.9)'}">
    <ellipse cx="90" cy="251" rx="51" ry="7" fill="#5a744b" opacity=".16"/>
    ${costume==='wizard'?`<path d="M62 136Q33 170 27 231Q90 251 153 231Q144 170 118 136Z" fill="#7662ad" stroke="#48375e" stroke-width="3"/><path d="m42 199 3 7 8 1-6 5 2 8-7-4-7 4 2-8-6-5 8-1Z" fill="#ffe3a2"/>`:''}
    ${costume==='bat'?`<path d="M66 146Q39 129 14 140L22 209Q35 187 49 218Q63 196 79 229L101 229Q117 196 131 218Q145 187 158 209L166 140Q140 129 114 146Z" fill="#6b5599" stroke="#403353" stroke-width="3"/><path d="m23 149 26 60m17-57 13 66m78-69-26 60m-17-57-13 66" fill="none" stroke="#a68ac9" stroke-width="3"/>`:''}
    ${costume==='ghost'?`<path d="M28 121V75Q28 18 90 14Q152 18 152 75V130Q133 159 90 155Q46 158 28 133Z" fill="#f8f6ff" stroke="#77839d" stroke-width="3"/>`:''}
    ${state.expedition?.equipped?.gear==='moon-cape'?`<path d="M62 139Q31 182 29 221Q90 244 151 221Q143 173 116 139Z" fill="#7662ad" stroke="#3e355e" stroke-width="3"/><path d="M48 184a15 15 0 1 0 10 26 17 17 0 0 1-10-26" fill="#ffde8b"/><path d="m127 189 3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1Z" fill="#ffe9b0"/>`:''}
    ${state.expedition?.equipped?.gear==='leaf-cape'?`<path d="M62 139Q31 182 29 221Q90 244 151 221Q143 173 116 139Z" fill="#7cba59" stroke="#3e5141" stroke-width="3"/><path d="M90 148v87m0-42-30-18m30 38 32-22" fill="none" stroke="#426f39" stroke-width="3"/>`:''}
    <path d="M56 147q-15-2-15 14v36q1 8 13 7m70-57q16-2 16 14v36q-1 8-13 7" fill="#c48c49" stroke="${stroke}" stroke-width="3"/>
    ${look.long?`<path d="M37 86q-5 30 0 58l-9 12q15 16 34 1h57q15 16 33-2l-9-16q9-41-5-66Z" fill="${hair}" stroke="${stroke}" stroke-width="3"/>`:''}
    <path d="M59 ${bodyY+10} 37 ${bodyY+44}q-10 3-12-4l19-41q5-8 15 0m62 1 19 20q7 2 11-7l4-13q1-9 8-9t5 14l-4 18q-5 14-20 14l-24-19" fill="${skin}" stroke="${stroke}" stroke-width="3" stroke-linejoin="round"/>
    <path d="M62 197 60 ${footY}h25l6-29 5 29h25l-4-40Z" fill="#627e68" stroke="${stroke}" stroke-width="3"/>
    <path d="M60 ${footY-3}h25v13q-19 9-35 1 0-8 10-14Zm36 0h25q12 3 13 13-17 9-38 1Z" fill="#68543d" stroke="${stroke}" stroke-width="3" stroke-linejoin="round"/>
    <path d="m53 ${bodyY} 21-10h32l22 10-1 58q-35 14-73 0Z" fill="url(#${id}-shirt)" stroke="${stroke}" stroke-width="3"/>
    <path d="m57 ${bodyY+1} 12 12-3 44m57-56-12 12 3 44" fill="none" stroke="#f5e7ac" stroke-width="6"/>
    <path d="m74 134 16 16 16-16v-16H74Z" fill="${skin}" stroke="${stroke}" stroke-width="3"/><path d="m69 137 21 19 21-19-8 26-13-7-13 7Z" fill="#f4d178" stroke="${stroke}" stroke-width="2"/>
    <path d="m89 157-3 19 7 3 2-22" fill="#e9b652" stroke="${stroke}" stroke-width="1.8"/>
    <rect x="103" y="176" width="15" height="14" rx="3" fill="#fff0be" stroke="${stroke}" stroke-width="2"/><path d="m107 183 3 2 4-5" fill="none" stroke="#6c9154" stroke-width="2"/>
    ${costume==='wizard'?`<path d="M58 ${bodyY} 75 140 90 152 105 140 122 ${bodyY} 137 234Q90 248 43 234Z" fill="#65539b" stroke="#443558" stroke-width="3"/><path d="m75 146 15 12 15-12-15 39Z" fill="#d2b2e7"/><path d="m105 185 3 7 8 1-6 6 1 8-6-4-7 4 2-8-6-6 8-1Z" fill="#ffe3a2"/><path d="M66 201a13 13 0 1 0 9 23 15 15 0 0 1-9-23" fill="#ffe3a2"/>`:''}
    ${costume==='ghost'?`<path d="M52 ${bodyY}Q90 133 128 ${bodyY}L144 234Q133 221 122 237Q111 223 100 239Q90 224 79 239Q67 223 56 237Q44 222 36 234Z" fill="#f8f6ff" stroke="#77839d" stroke-width="3"/><path d="M57 157 49 217m74-60 8 60" fill="none" stroke="#d9dcef" stroke-width="4"/><ellipse cx="78" cy="180" rx="5" ry="7" fill="#666b91"/><ellipse cx="103" cy="180" rx="5" ry="7" fill="#666b91"/><path d="M78 196q12 11 25 0" fill="none" stroke="#666b91" stroke-width="4" stroke-linecap="round"/><ellipse cx="68" cy="192" rx="6" ry="3" fill="#edb8cb"/><ellipse cx="112" cy="192" rx="6" ry="3" fill="#edb8cb"/>`:''}
    ${costume==='pumpkin'?`<path d="M59 145Q90 136 121 145Q154 165 140 202Q125 228 90 222Q54 228 40 202Q26 165 59 145Z" fill="#f4a64c" stroke="#975c36" stroke-width="3"/><path d="M69 146q-22 37-5 69m47-69q22 37 5 69M90 150v70" fill="none" stroke="#d9843e" stroke-width="4"/><path d="m65 145 12 15 13-11 13 11 12-15" fill="#81b86a" stroke="#4d7446" stroke-width="2"/><ellipse cx="74" cy="176" rx="5" ry="7" fill="#755442"/><ellipse cx="106" cy="176" rx="5" ry="7" fill="#755442"/><path d="M76 193q14 13 28 0" fill="none" stroke="#755442" stroke-width="4" stroke-linecap="round"/>`:''}
    ${costume==='bat'?`<path d="M56 ${bodyY} 75 140 90 153 105 140 124 ${bodyY} 124 205Q90 222 56 205Z" fill="#514567" stroke="#403353" stroke-width="3"/><path d="M66 179q12-10 24 0 12-10 24 0l-5 12-8-4-11 11-11-11-8 4Z" fill="#d9bce9"/><path d="M70 146 90 161 110 146" fill="none" stroke="#ad91c9" stroke-width="5"/>`:''}
    <ellipse cx="38" cy="96" rx="12" ry="15" fill="${skin}" stroke="${stroke}" stroke-width="3"/><ellipse cx="142" cy="96" rx="12" ry="15" fill="${skin}" stroke="${stroke}" stroke-width="3"/>
    <path d="M39 73q2-40 51-40t51 40v33q-1 37-51 39-49-2-51-39Z" fill="url(#${id}-skin)" stroke="${stroke}" stroke-width="3"/>
    <path d="M38 85Q23 37 65 31q59-17 79 27l-2 31-10-26q-10 0-22-17-23 32-49 21l-19 27Z" fill="${hair}" stroke="${stroke}" stroke-width="2.5"/>
    <path d="M57 83q9-6 18-1m30 0q10-5 18 1" fill="none" stroke="${hair}" stroke-width="3.5" stroke-linecap="round"/>
    <ellipse cx="66" cy="99" rx="12" ry="14" fill="#fffdf0"/><ellipse cx="114" cy="99" rx="12" ry="14" fill="#fffdf0"/>
    <ellipse cx="68" cy="100" rx="7.2" ry="9" fill="#46665c"/><ellipse cx="112" cy="100" rx="7.2" ry="9" fill="#46665c"/><ellipse cx="69" cy="101" rx="4.5" ry="6.5" fill="#263c37"/><ellipse cx="111" cy="101" rx="4.5" ry="6.5" fill="#263c37"/><circle cx="70" cy="96" r="3" fill="white"/><circle cx="113" cy="96" r="3" fill="white"/>
    <ellipse cx="50" cy="117" rx="9" ry="4.5" fill="#e88f7d" opacity=".45"/><ellipse cx="130" cy="117" rx="9" ry="4.5" fill="#e88f7d" opacity=".45"/>
    <path d="m89 109-3 6q5 4 10 0" fill="none" stroke="#a46d4d" stroke-opacity=".65" stroke-width="2" stroke-linecap="round"/>
    <path d="M74 122q16 6 32 0-5 17-16 17-10 0-16-17Z" fill="#864936" stroke="#684a36" stroke-width="2"/><path d="M77 123q13 4 26 0l-3 6H80Z" fill="#fffcef"/><path d="M84 135q6-5 12 0" fill="#eb9585"/>
    ${adult&&index===0?`<path d="M44 114q13 36 45 36 35-1 48-36-5 41-47 39-43 1-46-39" fill="${hair}" opacity=".17"/>`:''}
    ${costume==='daylight'?`<path d="M43 52 49 24q9-10 25-9l15 4 14-4q23-2 29 11l8 30Z" fill="${colour}" stroke="${stroke}" stroke-width="3" stroke-linejoin="round"/>
    <path d="m44 45 95 2 1 12-99-2Z" fill="#455b3d"/>
    <path d="M25 54q-8 11 11 14 60 8 112-1 16-4 8-13-7-9-30-3-37 9-74 0-17-4-27 3Z" fill="${colour}" stroke="${stroke}" stroke-width="3"/>
    <path d="M32 56q57 20 115 0" fill="none" stroke="#fffce2" stroke-opacity=".35" stroke-width="3"/>
    <path d="m91 23-10 11 6-1-8 9h24l-9-9 7 1Z" fill="#fbe389" stroke="${stroke}" stroke-width="1.5"/>`:costume==='wizard'?`<path d="M43 56 77 9Q82 3 90 7L126 53Z" fill="#7662ad" stroke="#443558" stroke-width="3"/><path d="m69 23 4 9 9 1-7 6 2 9-8-4-8 4 2-9-7-6 9-1Z" fill="#ffe3a2"/><path d="M30 56Q90 40 150 56Q160 68 90 72Q20 68 30 56Z" fill="#65539b" stroke="#443558" stroke-width="3"/><path d="m47 51 77 0" stroke="#d6b6eb" stroke-width="6"/>`:costume==='pumpkin'?`<path d="M40 53Q90 33 140 53" fill="none" stroke="#81b86a" stroke-width="10"/><path d="M83 43q-8-16 4-27l10 5q-9 10-4 22" fill="#658b51" stroke="#4d7446" stroke-width="3"/><path d="M93 36q8-26 31-20-3 25-31 20Z" fill="#81b86a" stroke="#4d7446" stroke-width="2"/>`:costume==='bat'?`<path d="M40 55 40 13Q61 19 71 47m38 0q10-28 31-34v42" fill="#6b5599" stroke="#403353" stroke-width="3"/><path d="m48 45-1-20 15 21m56 0 15-21-1 20" fill="#c09bcd"/><path d="M40 53Q90 38 140 53" fill="none" stroke="#6b5599" stroke-width="10"/>`:''}
    <path d="m156 ${bodyY-18} 1 10m8-12-2 11" stroke="#ae7a53" stroke-width="1.5" stroke-linecap="round"/></g>
    </svg>`;
  }
  const motionAllowed=()=>state.settings.motion&&!window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function toast(message){clearTimeout(toastTimer);$('toast').textContent=message;$('toast').hidden=false;toastTimer=setTimeout(()=>$('toast').hidden=true,3200);}
  function playSound(win=false){if(speechActive)return;magicSound.play(win?'reward':'discovery',{enabled:state.settings.sound,volume:state.settings.volume});}
  function confetti(){if(!motionAllowed())return;const box=$('confetti');box.replaceChildren();['#efbf4c','#6bb765','#75bed0','#c999d4','#ed9d82'].forEach((c,k)=>{for(let i=0;i<6;i++){const el=document.createElement('i');el.style.setProperty('--piece',c);el.style.setProperty('--left',`${Math.random()*100}%`);el.style.setProperty('--delay',`${Math.random()*.35}s`);box.append(el);}});setTimeout(()=>box.replaceChildren(),2800);}
  function stopNarration(){
    narrator?.stop();
    if(!narrator&&'speechSynthesis' in window)speechSynthesis.cancel();
    speechActive=false;
  }
  function readQuest(){
    if(speechActive){stopNarration();toast('Narration stopped.');return;}
    if(!narrator||!window.WildNarrationContent){toast('Read-aloud is unavailable here. A grown-up can read the card.');return;}
    narrator.play(window.WildNarrationContent.segments(state));
  }
  function voicePackControls(){
    const mb=voicePack?.info.megabytes||'0';
    return `<div class="panel"><h3>Bella read-aloud</h3><p class="helper">Your gentle narrator plays when you tap the speaker. Phone volume controls her voice. If a recording is unavailable, a local device voice may be used and will be labeled.</p><button class="btn quiet full" data-action="download-voice" ${voicePack?.downloading()?'disabled':''}>Download Bella for offline play · ${mb} MB</button><button class="subtle-button wide" data-action="cancel-voice-download" ${voicePack?.downloading()?'':'hidden'}>Pause voice download</button><p class="muted-note" data-voice-pack-note aria-live="polite">Optional audio download. The adventure download does not include Bella. Keep this browser’s site data.</p><p class="helper"><a href="./assets/narration/NOTICE.txt" target="_blank" rel="noopener">Voice credits and license</a></p></div>`;
  }
  function voicePackProgress(info){
    document.querySelectorAll('[data-voice-pack-note]').forEach(el=>{el.textContent=info.ready?'Bella is ready offline on this device. Browser storage can still be cleared.':`${info.present} of ${info.files} voice clips saved · ${voicePack?.info.megabytes} MB total`;});
  }
  async function checkVoicePack(){if(voicePack){const status=await voicePack.status();if(status.present)voicePackProgress(status);}}
  async function downloadVoice(){
    if(!voicePack){toast('Offline voice download is unavailable in this browser.');return;}
    document.querySelectorAll('[data-action="download-voice"]').forEach(el=>el.disabled=true);
    document.querySelectorAll('[data-action="cancel-voice-download"]').forEach(el=>el.hidden=false);
    try{const info=await voicePack.download(voicePackProgress);voicePackProgress(info);if(!info.ready)throw new Error('Bella’s offline download could not be verified. Keep internet on and try again.');toast('Bella is ready for offline read-aloud.');}
    catch(error){toast(error.message||'Could not finish downloading Bella. Try again online.');}
    finally{document.querySelectorAll('[data-action="download-voice"]').forEach(el=>el.disabled=false);document.querySelectorAll('[data-action="cancel-voice-download"]').forEach(el=>el.hidden=true);}
  }
  const safetyTip=()=>isNight()?`<div class="guardian-tip night-safety">${fox()}<p><b>Little lantern rule</b>${active().options.setting==='indoor'?'Keep room lights on and floors clear. No flames, hiding in darkness or climbing.':active().options.setting==='neighbourhood'?'A grown-up leads on familiar sidewalks. Stay together; stop somewhere safe before using the screen. No clue needs a road crossing or a door visit.':'A grown-up checks this familiar trail is open and suitable after dark. Stay on marked paths, together, away from water, edges and wildlife. Stop before using the screen.'} Use your own flashlight if helpful, pointed down and away from eyes, traffic, homes and animals. Choose the simpler action or let a grown-up help.</p></div>`:`<div class="guardian-tip">${fox()}<p><b>The Guardian’s golden rule</b>Stay together on marked paths. Look, don’t pick. Grown-ups choose where to walk.</p></div>`;
  function renderStatus(){
    $('level-text').textContent='Family level '+(1+Math.floor(state.xp/100));$('xp-text').textContent=state.xp+' XP';
    const percent=state.xp%100;$('xp-fill').style.width=percent+'%';$('xp-meter').setAttribute('aria-valuenow',String(percent));$('xp-meter').setAttribute('aria-valuetext',`${percent} of 100 XP towards the next level`);
    $('gem-count').textContent=state.mode==='classic'?state.classic.index+'/10':state.index+'/5';$('tiny-gem').innerHTML=gem(MISSIONS[0]);
    document.body.classList.toggle('motion-off',!state.settings.motion);
    document.body.classList.toggle('night-theme',isNight());
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content',isNight()?'#171d35':'#edf5dc');
    renderEquipment();
    showSaveIssue();
  }
  function partyRow(){return `<div class="party-row">${state.names.map((name,i)=>`<button class="party-member ${i===state.leader?'chosen':''}" data-action="hero" data-value="${i}" aria-label="Choose or customise ${esc(name)}, ${state.heroKinds[i]==='adult'?'grown-up':'child'}, ${esc(ROLE(state.roles[i]).label)}">${i===state.leader?'<span class="leader-dot" aria-label="Current leader">★</span>':''}<div class="avatar">${avatar(i)}</div><b>${esc(name)}</b></button>`).join('')}</div>`;}
  function renderHome(){
    const a=active(),complete=a.ended,started=a.done.length>0||a.chapter>0;
    $('home-screen').innerHTML=`<div class="storybook"><div class="scene-heading"><span class="eyebrow">${isNight()?'GENTLE MAGIC. TOGETHER AFTER DARK.':'A LITTLE QUEST. A BIG ADVENTURE.'}</span><h1>${isNight()?(complete?'A cozy ending,<br>a little magic!':'Hello, little<br>night explorers!'):complete?'Home with<br>new stories!':'Adventure is<br>calling!'}</h1></div><img class="cover-art" src="./assets/${isNight()?'night-lanterns.svg':'forest-friends-v2.webp'}" width="803" height="298" alt="${isNight()?'A smiling moon, friendly bat and glowing storybook pumpkins beneath the stars':'Cheerful storybook forest friends in explorer hats with their playful dog'}"><div class="story-label">${esc(storyTitle())}</div></div>
      <div class="location-pill">${icon('pin')}<span>${esc(isNight()?NIGHT_PLACES[a.options.setting].name:state.park)}</span></div>
      <button class="btn full" data-action="${state.mode==='classic'?'classic-mode':complete?'postcards':'tab'}" ${state.mode==='classic'||complete?'':'data-value="quest"'}>${icon(complete?'book':'play')} ${state.mode==='classic'?'Continue our classic hunt':complete?'Our adventure postcard':started?'Continue our adventure':'Let’s explore!'} ${icon('arrow')}</button>
      <div class="adventure-toggle"><button class="btn ${isNight()?'quiet':'night-entry'}" data-action="night-picker">🌙 ${isNight()?'Choose a night setting':'Halloween night adventures'}</button>${isNight()?'<button class="subtle-button wide" data-action="daylight-mode">☀️ Return to our daytime adventure</button>':''}</div>
      <div class="quick-actions"><button class="btn quiet" data-action="builder">${icon('compass')} ${complete?'Plan our next outing':'Plan this outing'}</button><button class="btn quiet" data-action="camp">⛺ Base camp</button></div>
      <button class="subtle-button wide" data-action="classic-mode">Original 10-crystal hunt · ${state.classic.index}/10 collected</button><p class="muted-note">${esc(adventureSummary())}</p>
      <div class="section-heading team-heading"><h2>Your little adventure team</h2><span>${state.names.length} players</span></div>${partyRow()}<button class="subtle-button wide" data-action="add-player" ${state.names.length>=MAX_NEW_PLAYERS?'disabled':''}>${state.names.length>=MAX_NEW_PLAYERS?'Your team is full':'+ Add player'}</button>
      <p class="muted-note">Pass the pretend lead after each challenge. A grown-up guides the real walk.</p>
      <div class="mini-progress" aria-label="${a.claimedChapters.length} of 5 map pieces">${MISSIONS.map((m,i)=>`<span class="${a.claimedChapters.includes(i)?'won':i===a.chapter?'now':''}"></span>`).join('')}</div>
      <button class="btn quiet full" data-action="download-adventure">${icon('download')} ${offlineReady?'Adventure ready offline':'Download adventure for offline play'}</button>
      <p class="muted-note" id="home-offline-note">${offlineReady?'Game and artwork checked on this device. Keep this browser’s site data.':'Do this online before leaving. Progress saves after every challenge.'}</p>${safetyTip()}`;
  }
  function renderClassicQuest(){
    const c=state.classic,m=C.MISSIONS[c.index],i=c.checks.findIndex(x=>!x),el=$('quest-screen');
    if(!m){el.innerHTML=`<span class="eyebrow">THE ORIGINAL TEN-CRYSTAL HUNT</span><div class="complete-scene"><div class="trophy">🏆</div><h2>Ten crystals,<br>one wonderful family!</h2><p>Your original story, all seventeen bonus activities, and every earned reward are safe.</p></div>${classicCollection()}<button class="btn full" data-action="expedition-mode">Explore our varied adventures</button><button class="btn quiet full" data-action="builder">Plan a new outing</button>${safetyTip()}`;return;}
    el.innerHTML=`<div class="quest-head"><span class="eyebrow">CLASSIC CHAPTER ${c.index+1} OF 10 · ${esc(state.names[state.leader])} LEADS</span><button class="audio-button" data-action="read" aria-label="Read aloud with Bella" aria-pressed="false">${icon('sound')}</button></div><p class="helper" data-narration-status aria-live="polite">Bella · gentle read-aloud</p><h1 class="page-title">${esc(m.title)}</h1><p class="intro">${esc(m.story)}</p><button class="qm-quest-link" data-action="tab" data-value="trail">${icon('map')} Open our treasure map ${icon('arrow')}</button><div class="challenge-card"><div class="card-meta"><span class="type-chip">Classic hunt</span><span>${c.checks.filter(Boolean).length}/${m.tasks.length} explored</span></div>${i<0?`${Q.crystalScene(m,{ready:true,count:m.tasks.length,length:m.tasks.length})}<h2>Our crystal is ready!</h2><button class="btn gold full" data-action="classic-claim" data-chapter="${c.index}">Claim crystal + ${m.xp} XP</button>`:`${Q.crystalScene(m,{count:c.checks.filter(Boolean).length,length:m.tasks.length})}<h2>${esc(m.tasks[i][c.variants[i]||0])}</h2>${m.hints?.[i]?`<p class="challenge-prompt">${esc(m.hints[i])}</p>`:''}<button class="btn full" data-action="classic-check" data-value="${i}" data-chapter="${c.index}">We explored it!</button><button class="subtle-button wide" data-action="classic-swap" data-value="${i}" data-chapter="${c.index}">Try a safe alternative</button>`}</div><p class="helper">Your original ten-chapter progress is saved separately, with shared family XP and camp crystals. You can pause at any time.</p><div class="quick-actions"><button class="btn quiet" data-action="rest">Take a break</button><button class="btn quiet" data-action="expedition-mode">Varied adventures</button></div>${safetyTip()}`;
  }
  function classicCollection(){return `<section class="panel"><h3>Original crystal collection · ${state.classic.index}/10</h3><div class="classic-gems">${C.MISSIONS.map((m,i)=>`<span class="badge" title="${esc(m.gem)}">${i<state.classic.index?esc(m.gem):'🔒 '+esc(m.short)}</span>`).join('')}</div><button class="subtle-button wide" data-action="classic-mode">${state.classic.index===10?'See our classic celebration':'Continue the original hunt'}</button></section>`;}
  function classicCheck(button){if(syncFromStorage())return;
    if(Date.now()<challengeTapUntil)return;const r=C.mark(state.classic,Number(button.dataset.value),Number(button.dataset.chapter));if(!r.changed)return;state.classic=r.state;challengeTapUntil=Date.now()+500;state.leader=(state.leader+1)%state.names.length;if(!save())return;renderAll();playSound();toast(`${state.names[state.leader]} leads the next clue.`);
  }
  function classicClaim(expected){if(syncFromStorage())return;
    const m=C.MISSIONS[expected],r=C.claim(state.classic,expected);if(!r.changed)return;state.classic=r.state;state.xp+=r.xp;state.expedition.lifetime.xp+=r.xp;state.expedition.wallet+=r.crystals;state.expedition.lifetime.crystals+=r.crystals;if(!save())return;renderAll();confetti();playSound(true);
    openSheet(sheetHeader('An original crystal is yours!')+`<div class="reward-body">${gem(m,'reward-crystal')}<h2>${esc(m.gem)}</h2><p>${esc(m.celebrate)}</p><div class="xp-reward">+${r.xp} family XP · +1 camp crystal</div><button class="btn full" data-action="next-quest">Continue the classic story</button></div>`);
  }

  function renderQuest(){
    stopNarration();
    if(state.mode==='classic'){renderClassicQuest();return;}
    const el=$('quest-screen'),a=active(),m=storyMissions()[Math.min(a.chapter,4)],card=currentCard();
    if(a.ended){el.innerHTML=`<span class="eyebrow">${a.claimedChapters.length===5?'FIVE PIECES. ONE FAMILY STORY.':'A LITTLE ADVENTURE COUNTS.'}</span><div class="complete-scene"><div class="trophy" aria-hidden="true">${a.claimedChapters.length===5?'🏆':'🌿'}</div><h2>${isNight()?(a.claimedChapters.length===5?'The pumpkin party<br>is glowing!':'A cozy place<br>to pause.'):(a.claimedChapters.length===5?'The forest is full<br>of your discoveries!':'A lovely place<br>to pause.')}</h2><p>${isNight()?'Our pretend friends are tucked in under the smiling moon. Your family brought all the kindness they needed.<br>':''}${a.done.length} challenges explored together.<br>Your XP, crystals and base camp stay with you.</p></div>${a.claimedChapters.length===5&&!a.puzzleSolved?`<button class="btn gold full" data-action="puzzle">${icon('map')} Solve our discovery map</button>`:''}<button class="btn full" data-action="postcards">${icon('book')} Make our private postcard</button><button class="btn quiet full" data-action="builder">Plan another adventure</button>${safetyTip()}`;return;}
    const ready=E.isChapterReady(state.expedition),lead=specialty(state.leader),length=a.deck[a.chapter].length;
    el.innerHTML=`<div class="quest-head"><span class="eyebrow">CHAPTER ${a.chapter+1} OF 5 · ${esc(state.names[state.leader])} LEADS</span><button class="audio-button" data-action="read" aria-label="Read aloud with Bella" aria-pressed="false">${icon('sound')}</button></div><p class="helper" data-narration-status aria-live="polite">Bella · gentle read-aloud</p><h1 class="page-title">${esc(m.title)}</h1>${isNight()?`<p class="night-context">${NIGHT_PLACES[a.options.setting].emoji} ${esc(NIGHT_PLACES[a.options.setting].name)} · Stop together to play</p>`:''}
      <div class="chapter-strip">${MISSIONS.map((x,i)=>`<span class="map-piece ${a.claimedChapters.includes(i)?'found':''}" aria-label="Map piece ${i+1}${a.claimedChapters.includes(i)?' found':''}">${a.claimedChapters.includes(i)?(isNight()?'🏮':'🧩'):i+1}</span>`).join('')}</div>
      <button class="qm-quest-link" data-action="tab" data-value="trail">${icon('map')} Open our treasure map ${icon('arrow')}</button><div class="lead-banner"><div class="lead-avatar">${avatar(state.leader)}</div><p><b>${esc(state.names[state.leader])} · ${lead.emoji} ${lead.label}</b><span>${esc(lead.hint)}</span></p><button class="subtle-button" data-action="pass-lead">Pass lead</button></div>
      ${ready?`<div class="challenge-card ready">${Q.crystalScene(m,{ready:true,count:length,length,night:isNight()})}<span class="eyebrow">${isNight()?'A LITTLE LANTERN IS READY':'YOUR MAP PIECE IS READY'}</span><h2>Wonderful teamwork!</h2><p>${isNight()?'Your kindness lights another lantern for our pretend pumpkin party.':'Your discoveries light up another piece of the Guardian’s map.'}</p><button class="btn gold full" data-action="claim" data-chapter="${a.chapter}">${icon('sparkles')} Claim crystal + ${m.xp} XP</button></div>`:card?`<article class="challenge-card"><div class="card-meta"><span class="type-chip type-${esc(card.type.toLowerCase())}">${esc(card.type==='Imagine'?'Make & tell':card.type)}</span><span>Challenge ${a.step+1} / ${length}</span></div>${Q.crystalScene(m,{count:a.step,length,night:isNight()})}<h2>${esc(card.title)}</h2><p class="challenge-prompt">${esc(card.prompt)}</p><details class="safe-alternative"><summary>${isNight()?'Try a simpler hands-on way':'No need to find it: a safe alternative'}</summary><p>${esc(card.alternative)}</p></details><p class="challenge-help">${esc(card.difficultyPrompt||'Make, notice or choose. Grown-up help counts too.')}</p><label class="field-label" for="clue-memory">${isNight()?'What did we make or notice?':'What did we notice?'} <small>Optional</small></label><input class="text-field" id="clue-memory" maxlength="140" placeholder="${isNight()?'Our paper hat, a sound, a shape…':'A word, a colour, a little wonder…'}"><button class="btn full" data-action="complete-challenge" data-card="${esc(card.id)}" data-key="${esc(card.challengeKey)}" data-chapter="${a.chapter}" data-step="${a.step}">${icon('check')} We explored it!</button><button class="subtle-button wide" data-action="swap-challenge">${isNight()?'Need different materials? Swap this challenge':'Can’t find it? Try an easier way'}</button></article>`:''}
      <p class="story-connection">${esc(chapterStory(a.chapter))}</p><div class="quick-actions"><button class="btn quiet" data-action="rest">Take a break</button><button class="btn quiet" data-action="finish-early">Finish for today</button></div>${safetyTip()}`;
  }
  function chapterStory(chapter){
    const first=active().done.find(x=>x.note)?.note;
    if(isNight())return ['Five little lanterns are waiting for your creations and discoveries. Make something, try something and notice what is really around you. Our pumpkin host will bring it all into the story.',first?`Your memory of “${first}” gave our pumpkin host a smile. What friendly shape comes next?`:'The first lantern glows! Bring the shapes you make and find into our friendly parade.','The smiling moon is listening. Every quiet discovery adds a note to our pretend party song.','A friendly bat has a puzzle. Use something you made or noticed to help solve the next clue.','Bring your discoveries together. Our pumpkin party ends with a cozy story and a kind goodnight.'][chapter]||'';
    return ['The Guardian’s map has scattered into five pieces. Each discovery brings a piece home.',first?`Your memory of “${first}” guides the stone giant. Now add a new kind of wonder.`:'Your colour clues helped the Guardian. What other wonders belong on the map?','The woodland adds its quiet voice to your map. Notice with more than your eyes.','Your map reaches the treetops in our imagination. Our feet stay on the safe path.','Bring your discoveries together. The final spell is a story only your family can tell.'][chapter]||'';
  }
  function renderHeroes(){
    $('heroes-screen').innerHTML=`<span class="eyebrow">${state.names.length} HEROES. ONE GREAT TEAM.</span><h1 class="page-title">Meet your explorers</h1><p class="intro">Everyone has a special power. Tap a character to dress them up and choose who leads the next quest.${isNight()?' Everyone is dressed for Halloween! Their daytime outfits are safely saved.':''}</p><button class="btn full" data-action="add-player" ${state.names.length>=MAX_NEW_PLAYERS?'disabled':''}>${icon('heroes')} Add player</button><p class="helper roster-count">${state.names.length} players · Add up to ${MAX_NEW_PLAYERS}. ${state.names.length>MAX_NEW_PLAYERS?'Everyone in this larger saved team is kept.':'Your existing heroes and progress stay with you.'}</p><div class="hero-grid">${state.names.map((name,i)=>`<button class="hero-card ${i===state.leader?'selected':''}" data-action="hero" data-value="${i}" data-player-id="${esc(state.heroIds[i])}"><span class="hero-type">${state.heroKinds[i]==='adult'?'GROWN-UP':'LITTLE HERO'}</span>${i===state.leader?'<span class="hero-selected" aria-label="Current leader">★</span>':''}<div class="hero-stage">${avatar(i)}</div><div class="hero-copy"><b>${esc(name)}</b><small>${specialty(i).emoji} ${specialty(i).label}</small>${isNight()?`<small class="costume-label">${COSTUMES[state.costumes[i]].emoji} ${COSTUMES[state.costumes[i]].label}</small>`:''}</div></button>`).join('')}</div><div class="trophy-small"><span aria-hidden="true">🤝</span><p><b>Teamwork is our superpower.</b>All ${state.names.length} explorers share ${state.xp} lifetime family XP. The pretend lead rotates after each challenge. No racing, no winners and losers, just exploring together.</p></div>${safetyTip()}`;
  }
  function renderTreasure(){
    const modes=[['crystals','Crystals'],['journal','Journal'],['camp','Base camp'],['postcards','Postcards']];
    $('treasure-screen').innerHTML=`<span class="eyebrow">LITTLE WONDERS, BIG MEMORIES</span><h1 class="page-title">Our treasure chest</h1><div class="tab-switch treasure-switch">${modes.map(([id,label])=>`<button data-action="treasure-tab" data-value="${id}" aria-pressed="${treasureTab===id}">${label}</button>`).join('')}</div>${treasureTab==='journal'?renderJournal():treasureTab==='camp'?renderCamp():treasureTab==='postcards'?renderPostcards():`<div class="treasure-chest-scene">${icon('chest','big-chest')}<div><b>${state.index} crystals this outing</b><small>${state.xp} lifetime family XP</small></div></div><div class="gem-grid">${MISSIONS.map((m,i)=>`<button class="gem-card ${i>=state.index?'locked':''}" data-action="gem" data-value="${i}" aria-label="${esc(m.gem.replace(/^[^A-Za-z]+/,''))}, ${i<state.index?'collected':'locked'}">${gem(m)}<b>${esc(m.gem.replace(/^[^A-Za-z]+/,''))}</b><small>${i<state.index?'Collected together':'Chapter '+(i+1)}</small></button>`).join('')}</div><p class="muted-note">Collected crystals also give one spendable camp crystal each. Your crystal trophies always stay in the collection.</p><button class="btn full" data-action="camp">⛺ Visit our family base camp · ${state.expedition.wallet} to spend</button>${classicCollection()}`}`;
  }
  function renderJournal(){
    return `<p class="intro">What did your family discover? Tap a picture and let a grown-up write a tiny memory.</p><div class="discovery-grid">${Object.entries(CATEGORIES).map(([key,c])=>`<button data-action="discovery" data-value="${key}"><span aria-hidden="true">${c.emoji}</span>${c.label}</button>`).join('')}</div>
      ${state.journal.length?[...state.journal].reverse().map(e=>`<article class="journal-note"><header><span aria-hidden="true">${CATEGORIES[e.category].emoji}</span>${CATEGORIES[e.category].label}<time datetime="${esc(e.at)}">${esc(new Date(e.at).toLocaleDateString('en-CA',{month:'short',day:'numeric'}))}</time></header><p>${esc(e.note)}</p><small>Guardian’s try-it idea: ${esc(discoveryIdea(e.category,e.note))}</small></article>`).join(''):'<div class="empty-box"><span class="empty-icon" aria-hidden="true">📖</span>Your first forest memory belongs here.<br>Look around—what makes you smile?</div>'}
      <p class="muted-note">Memories stay on this device. Guardian ideas are playful offline prompts, not AI species identification.</p>`;
  }
  const questMapModel=()=>Q.model(state,storyMissions(),C.MISSIONS);
  function renderTrail(){
    const view=questMapModel();
    $('trail-screen').innerHTML=`<span class="eyebrow">${view.classic?'TEN CRYSTALS. ONE GREAT QUEST.':view.night?'FIVE LANTERNS. ONE COZY STORY.':'FOLLOW YOUR FAMILY’S DISCOVERIES'}</span><h1 class="page-title">${esc(view.title)}</h1><p class="intro">A make-believe land, a hidden treasure, and a quest of your own. Tap a marker to reveal its clue. This is a story map, never a real walking route. Stay together where your grown-up says it is safe.</p>${Q.map(view)}<button class="subtle-button wide" data-action="settings">${icon('sound')} Magic sounds ${state.settings.sound?'on':'off'} · sound & motion settings</button>${view.paused?'<button class="btn quiet full" data-action="builder">Plan another little adventure</button>':''}${view.night?`<p class="night-context">${esc(NIGHT_PLACES[active().options.setting].name)} · Your lantern story is saved separately.</p><button class="btn quiet full" data-action="night-picker">Choose another night setting</button><p class="safe-note">The game does not know your home, street, trail, local opening times or conditions. A grown-up chooses the real place. Use the cozy house whenever outdoor exploring does not feel right.</p>${safetyTip()}`:`<form id="place-form" class="panel"><h3>${icon('pin')} Our exploring spot</h3><label class="field-label" for="park-name">Daytime park or trail</label><input class="text-field" id="park-name" name="park" value="${esc(state.park)}" maxlength="100" required><label class="field-label" for="start-point">Starting point</label><input class="text-field" id="start-point" name="start" value="${esc(state.start)}" maxlength="120"><button class="btn quiet full" type="submit" style="margin-top:14px">Save this adventure location</button><p class="small">The name personalises your story. The woodland clues are pre-written; this version doesn’t research parks or generate GPS-based quests.</p></form>
      <section class="panel"><h3>Optional explorer GPS</h3><p class="small">Take one location reading when you ask. There is no background tracking, no stored location history, and no coordinate upload.</p><div class="gps-box" id="gps-display" role="status" aria-live="polite">${gpsDisplay()}</div><div class="gps-actions"><button class="btn blue" data-action="gps" ${gpsBusy?'disabled':''}>${icon('pin')} ${gpsBusy?'Finding you…':locationFix?'Update location':'Use my GPS'}</button><button class="btn quiet" data-action="clear-gps" ${!locationFix&&!gpsBusy?'disabled':''}>Clear</button></div><p class="small">GPS cannot tell you whether a route is safe. Follow posted signs and a grown-up’s judgement. The game works without location permission.</p></section>
      <div class="safe-note"><b>Safe exploring at Chedoke or any park:</b> stay on marked paths, away from cliff edges, water and wildlife. Do not climb or enter closed trails to finish a mission. Swap a clue instead.</div>`}`;
  }
  function openQuestMapNode(index){
    const view=questMapModel(),node=view.nodes[index];if(!node)return;
    const completed=node.status==='complete',current=node.status==='current';
    const detail=completed?(view.classic?'A crystal earned in your original hunt.':`${node.count} real discoveries brought this crystal home.`):current?`${node.count} of ${node.length} discoveries gathered. ${node.clue}`:view.paused?'This outing has ended. The crystals you earned are safe. Plan another outing to begin a new quest.':`${node.clue} Finish the earlier chapters to open this part of the map.`;
    openSheet(sheetHeader(node.place)+`<div class="qm-map-detail"><span class="eyebrow">CHAPTER ${node.index+1} · ${completed?'DISCOVERED':current?'YOUR CURRENT QUEST':'STILL HIDDEN'}</span>${completed?gem(node.mission):''}<h3>${esc(node.title)}</h3><p>${esc(detail)}</p>${completed&&node.note?`<p class="qm-clue-note">Your discovery: “${esc(node.note)}”</p>`:''}${completed?`<p>${esc(node.mission.celebrate||'Your family found this treasure together.')}</p><span class="badge">Already earned · ${Number(node.mission.xp)||0} family XP</span>`:''}${current?'<button class="btn full" data-action="quest-map-continue">Continue this quest</button>':''}<button class="btn quiet full" data-action="close-sheet">Back to our map</button></div>`);
  }
  function openQuestMapFinale(){
    const view=questMapModel();
    if(!view.complete){openSheet(sheetHeader('X marks the treasure')+`<div class="qm-map-detail"><p>${view.paused?'This little outing has ended. Your earned crystals stay with you.':`A hidden chest waits beyond the last crystal. Bring home ${view.total-view.claimed} more ${view.total-view.claimed===1?'crystal':'crystals'} to reveal its secret.`}</p><p>${view.night?'Your lanterns will light a cozy gathering for every hero.':'The treasure is the story your family discovers together.'}</p><button class="btn quiet full" data-action="close-sheet">Keep exploring the map</button></div>`);return;}
    if(!view.classic){openPuzzle();return;}
    openSheet(sheetHeader('The treasure is yours')+`<div class="reward-body">${gem(C.MISSIONS[9],'reward-crystal')}<h2>Ten crystals. One family story.</h2><p>Every crystal on your original treasure map is home. Your discoveries and earned rewards are safe.</p><button class="btn full" data-action="quest-map-continue">Our classic celebration</button><button class="btn quiet full" data-action="close-sheet">Back to our map</button></div>`);
  }
  function gpsDisplay(){
    if(gpsBusy)return 'Asking your phone for a location reading…';
    if(gpsError)return esc(gpsError);
    if(!locationFix)return 'GPS is off. Your chosen park is all you need to play.';
    return `<b>Location reading</b><span class="coordinates">${locationFix.lat.toFixed(5)}, ${locationFix.lon.toFixed(5)}</span>Accuracy reported by your phone: ±${Math.round(locationFix.accuracy)} m.<br>Read at ${esc(new Date(locationFix.time).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'}))}. This is a snapshot, not continuous tracking.`;
  }
  function renderAll(){renderStatus();renderHome();renderQuest();renderHeroes();renderTreasure();renderTrail();}
  function setTab(tab){
    if(!['home','quest','heroes','treasure','trail'].includes(tab))return;
    stopNarration();
    magicSound.stop();activeTab=tab;renderAll();
    document.querySelectorAll('[data-screen]').forEach(el=>el.hidden=el.dataset.screen!==tab);
    document.querySelectorAll('.bottom-nav [data-action="tab"]').forEach(el=>{if(el.dataset.value===tab)el.setAttribute('aria-current','page');else el.removeAttribute('aria-current');});
    window.scrollTo({top:0,behavior:'auto'});
  }
  function openSheet(content){
    stopNarration();
    stopCompass();gearItem=null;
    sheetEpoch++;
    const dialog=$('sheet');if(!dialog.open)sheetReturn=document.activeElement;
    $('sheet-content').innerHTML=content;
    if(!dialog.open)dialog.showModal();
    dialog.scrollTop=0;
    dialog.querySelector('button, input, select, textarea')?.focus({preventScroll:true});
  }
  const sheetHeader=title=>`<div class="sheet-top"><h2 id="sheet-title">${esc(title)}</h2><button data-action="close-sheet" aria-label="Close">${icon('close')}</button></div>`;
  function closeSheet(){stopNarration();stopCompass();gearItem=null;sheetEpoch++;draftHero=null;pendingRestore=null;puzzlePicked=[];viewedPostcardId=null;const dialog=$('sheet');if(dialog.open)dialog.close();}
  $('sheet').addEventListener('close',()=>{if($('sheet').open)return;stopCompass();gearItem=null;sheetEpoch++;draftHero=null;pendingRestore=null;puzzlePicked=[];viewedPostcardId=null;const target=sheetReturn;if(target?.isConnected)target.focus({preventScroll:true});else $('settings-button').focus({preventScroll:true});});
  $('sheet').addEventListener('click',e=>{if(e.target===$('sheet')){const r=$('sheet').getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)closeSheet();}});
  function openHero(index,adding=false){
    if(adding&&state.names.length>=MAX_NEW_PLAYERS){toast(`You can add up to ${MAX_NEW_PLAYERS} players. Your whole saved team is kept.`);return;}
    index=adding?state.names.length:clampInt(index,0,state.names.length-1);
    draftHero={index,adding,name:adding?'':state.names[index],role:adding?ROLES[index%ROLES.length].id:state.roles[index],specialty:adding?DEFAULT_SPECIALTIES[index%DEFAULT_SPECIALTIES.length]:state.specialties[index],look:adding?defaultLook(index):{...state.looks[index]},kind:adding?'child':state.heroKinds[index],costume:adding?defaultCostume(index):state.costumes[index]};
    const r=ROLE(draftHero.role);
    openSheet(sheetHeader(adding?'Add a player':'Choose your explorer')+`<form class="sheet-body" id="hero-form"><div class="hero-preview"><div id="avatar-preview">${avatar(index,draftHero.look,draftHero)}</div><div class="power"><span class="eyebrow" id="hero-size-label">${adding?'NEW EXPLORER':draftHero.kind==='adult'?'GROWN-UP HERO':'LITTLE HERO'}</span><b id="hero-power">${esc(r.power)}</b><p id="hero-power-desc">${esc(r.description)}</p></div></div>
      <label class="field-label" for="hero-name">Explorer name</label><input class="text-field" id="hero-name" name="name" value="${esc(draftHero.name)}" maxlength="24" autocomplete="off" required>
      <label class="field-label" for="hero-kind">Explorer size</label><select class="text-field" id="hero-kind"><option value="child" ${draftHero.kind==='child'?'selected':''}>Little hero</option><option value="adult" ${draftHero.kind==='adult'?'selected':''}>Grown-up hero</option></select>
      <label class="field-label" for="hero-costume">Halloween costume</label><select class="text-field" id="hero-costume">${Object.entries(COSTUMES).map(([id,c])=>`<option value="${id}" ${draftHero.costume===id?'selected':''}>${c.emoji} ${c.label}</option>`).join('')}</select><p class="helper">Everyone puts on their costume automatically in a Halloween adventure. Their daytime outfit returns when you switch back.</p>
      <label class="field-label" for="hero-role">Special role</label><select class="text-field" id="hero-role" name="role">${ROLES.map(role=>`<option value="${role.id}" ${draftHero.role===role.id?'selected':''}>${role.emoji} ${role.label}</option>`).join('')}</select>
      <label class="field-label" for="hero-specialty">Team specialty</label><select class="text-field" id="hero-specialty">${Object.entries(SPECIALTIES).map(([id,s])=>`<option value="${id}" ${draftHero.specialty===id?'selected':''}>${s.emoji} ${s.label}</option>`).join('')}</select><p class="helper">Scout spots details, Listener notices sounds, Detective connects clues. No one is locked out of any challenge.</p>
      <label class="field-label">${isNight()?'Daytime outfit colour':'Outfit colour'}</label><div class="swatch-row" id="outfit-swatches">${PALETTE.map((c,i)=>`<button type="button" data-action="swatch" data-kind="colour" data-value="${i}" style="--swatch:${c}" aria-label="${['Sky blue','Berry pink','Leaf green','Violet purple','Sunshine yellow'][i]} outfit" aria-pressed="${i===draftHero.look.colour}">${i===draftHero.look.colour?'✓':''}</button>`).join('')}</div>
      <label class="field-label">Skin tone</label><div class="swatch-row" id="skin-swatches">${SKINS.map((c,i)=>`<button type="button" data-action="swatch" data-kind="skin" data-value="${i}" style="--swatch:${c}" aria-label="Skin tone ${i+1}" aria-pressed="${i===draftHero.look.skin}">${i===draftHero.look.skin?'✓':''}</button>`).join('')}</div>
      <label class="field-label">Hair colour</label><div class="swatch-row" id="hair-swatches">${HAIR.map((c,i)=>`<button type="button" data-action="swatch" data-kind="hair" data-value="${i}" style="--swatch:${c}" aria-label="${['Brown','Dark brown','Auburn','Golden'][i]} hair" aria-pressed="${i===draftHero.look.hair}">${i===draftHero.look.hair?'✓':''}</button>`).join('')}</div>
      <div class="settings-row"><div><b>Longer hair</b><small>Change your character’s look</small></div><button type="button" class="switch" role="switch" aria-label="Longer hair" aria-checked="${draftHero.look.long}" data-action="long-hair"></button></div>
      <button class="btn full" type="submit">${icon('star')} ${adding?'Add player':'Save & make me the leader'}</button><button class="subtle-button wide" type="button" data-action="close-sheet">Cancel</button><p class="helper">A grown-up still leads the real walk. Names and character choices are saved only on this device.</p></form>`);
  }
  function updateHeroPreview(){if(!draftHero)return;$('hero-size-label').textContent=draftHero.kind==='adult'?'GROWN-UP HERO':'LITTLE HERO';$('avatar-preview').innerHTML=avatar(draftHero.index,draftHero.look,draftHero);const r=ROLE(draftHero.role);$('hero-power').textContent=r.power;$('hero-power-desc').textContent=r.description;}
  function claimCrystal(expectedChapter){if(syncFromStorage())return;
    const before=active().chapter;if(expectedChapter!==undefined&&Number(expectedChapter)!==before)return;
    const result=E.finishChapter(state.expedition,before);if(!result.changed)return;
    state.expedition=result.expansion;state.xp+=result.xp;state.index=active().claimedChapters.length;state.gems=MISSIONS.slice(0,state.index).map(m=>m.gem);state.checks=[false,false,false];state.variants=[0,0,0];
    enrichLatestPostcard();if(!save())return;renderAll();playSound(true);confetti();const m=storyMissions()[before];
    openSheet(`<div class="sheet-top"><span class="eyebrow">A MAP PIECE AND A CRYSTAL!</span><button data-action="close-sheet" aria-label="Close reward">${icon('close')}</button></div><div class="reward-body">${gem(m,'reward-crystal')}<h2 id="sheet-title">${isNight()?'Lantern':'Piece'} ${before+1} is home!</h2><p>${esc(m.celebrate)}</p><div class="xp-reward">${icon('star')} +${result.xp} family XP · +1 camp crystal</div><button class="btn full" data-action="next-quest">${active().ended?'Bring our map together':'On to the next chapter'} ${icon('arrow')}</button><button class="subtle-button wide" data-action="camp">Visit base camp</button></div>`);
  }
  function openGem(index){const m=storyMissions()[index];if(!m)return;if(index>=state.index){toast(`Finish quest ${index+1} to unlock this crystal.`);return;}openSheet(sheetHeader('A treasure you earned')+`<div class="reward-body">${gem(m,'reward-crystal')}<h2>${esc(m.gem.replace(/^[^A-Za-z]+/,''))}</h2><p>${esc(m.celebrate)}</p><span class="badge">Earned together · ${m.xp} XP</span><button class="btn quiet full" data-action="close-sheet">Back to our treasures</button></div>`);}
  function discoveryIdea(category,note){if(/mushroom|fungus|berry|berries|poison|snake|cliff|edge|waterfall/i.test(note))return 'A wonderful thing to notice from a safe distance. Stay beside your grown-up on the path, away from edges and water. Do not move closer, touch or taste it. Point to a colour you can already see, or copy a simple shape with your hands.';return CATEGORIES[category].idea;}
  function openDiscovery(category){if(!CATEGORIES[category])return;const c=CATEGORIES[category];openSheet(sheetHeader(c.emoji+' A forest discovery')+`<form class="sheet-body" id="discovery-form" data-category="${category}"><p>Tell us about your ${c.label.toLowerCase()}. A word, a colour, or a little story is perfect.</p><label class="field-label" for="discovery-note">What did your family notice?</label><textarea class="text-field" id="discovery-note" name="note" rows="3" maxlength="280" placeholder="We spotted…" required></textarea><div class="bonus-idea"><b>The Guardian’s try-it idea</b><br>${esc(c.idea)}</div><button class="btn full" type="submit">${icon('book')} Save our discovery</button><p class="helper">This is a memory, not a species identification. Do not taste or handle unknown plants or animals.</p></form>`);}
  function requestGPS(){
    if(!window.isSecureContext){gpsError='Location needs the HTTPS Netlify site. The rest of the adventure works without GPS.';renderTrail();return;}
    if(!navigator.geolocation){gpsError='Your browser does not offer GPS. Choose a park name instead.';renderTrail();return;}
    const id=++gpsRequestId;gpsBusy=true;gpsError='';locationFix=null;renderTrail();
    navigator.geolocation.getCurrentPosition(p=>{
      if(id!==gpsRequestId)return;gpsBusy=false;
      const {latitude:lat,longitude:lon,accuracy}=p.coords;
      if(!Number.isFinite(lat)||!Number.isFinite(lon)||!Number.isFinite(accuracy)||Math.abs(lat)>90||Math.abs(lon)>180){gpsError='The phone returned an invalid location. You can keep playing without GPS.';renderTrail();return;}
      locationFix={lat,lon,accuracy:Math.max(0,accuracy),time:p.timestamp||Date.now()};renderTrail();
    },error=>{if(id!==gpsRequestId)return;gpsBusy=false;locationFix=null;gpsError=error.code===1?'Location permission was not granted. No problem—use your park name and keep exploring.':error.code===3?'The location request timed out. Try again outdoors when it is safe, or play without GPS.':'Your phone could not find a location. The adventure still works without GPS.';renderTrail();},{enableHighAccuracy:true,timeout:12000,maximumAge:30000});
  }
  function openSettings(){
    openSheet(sheetHeader('Grown-up corner')+`<div class="sheet-body">${voicePackControls()}<div class="settings-row"><div><b>Celebration sounds</b><small>Soft crystal chimes, only after you tap</small></div><button class="switch" role="switch" aria-label="Celebration sounds" aria-checked="${state.settings.sound}" data-action="setting" data-value="sound"></button></div><div class="settings-row"><div><b>Animations</b><small>Floating crystals and map markers. Turn off to pause.</small></div><button class="switch" role="switch" aria-label="Animations" aria-checked="${state.settings.motion}" data-action="setting" data-value="motion"></button></div><label class="qm-sound-level" for="magic-volume"><span>Magic sound volume <b id="magic-volume-label">${state.settings.volume}%</b></span><input id="magic-volume" type="range" min="0" max="100" step="5" value="${state.settings.volume}" aria-label="Magic sound volume"><small>Sound starts muted. Your phone’s volume also applies.</small></label><button class="btn quiet full" data-action="download-adventure">${icon('download')} Download and verify offline adventure</button><button class="btn quiet full" data-action="install">${icon('home')} Play from your Home Screen</button><button class="btn quiet full" data-action="export">${icon('download')} Export progress backup</button><button class="btn quiet full" data-action="import">${icon('refresh')} Restore a progress backup</button><button class="btn quiet full" data-action="check-update">${icon('refresh')} Check for a game update</button><button class="subtle-button wide" data-action="new-adventure">Start a fresh adventure</button>
      <p class="backup-note"><b>Saved on this device:</b> names, outfits, XP, crystals and journal. No account, ads, microphone or analytics. Photos are optional local files chosen by a grown-up; the game never opens a camera or uploads them. GPS is optional, never saved, and never uploaded. Backups contain chosen names, park, progress and postcard text, but no GPS readings or photo pixels. Export each photo postcard separately to keep its pictures.</p><p class="helper">Clearing website data or changing browsers can remove progress. Export a backup first. Safari and a Home Screen web app may have separate saved data; use export/restore to transfer it.</p><p class="helper">Guardian stories are offline prompts. There is no live AI service, plant recognition, researched trail map, or automatic location-based mission generation in this version.</p><span class="badge">Version ${VERSION} · ${navigator.onLine?'Online':'Offline'}</span><span class="badge" id="offline-status">${offlineReady?'Offline files verified':'Offline files not yet verified'}</span></div>`);
  }
  function openInstall(){openSheet(sheetHeader('A little app of your own')+`<div class="sheet-body"><p>Open your published Netlify address in <b>Safari</b>, then:</p><ol class="install-steps"><li>Open the Safari <b>Share</b> menu.</li><li>Choose <b>Add to Home Screen</b>.</li><li>Turn on <b>Open as Web App</b> when shown, then tap <b>Add</b>.</li><li>Launch <b>Wild Explorer</b> from its new leaf icon.</li></ol><p class="helper">The Home Screen version removes Safari’s browser bars. This button cannot install it automatically on iPhone.</p><p class="helper">Open the app once with internet and wait for its offline cache to finish before your hike. Device storage settings can still remove cached data.</p><button class="btn full" data-action="close-sheet">Got it!</button></div>`);}
  function exportSave(){
    const content=JSON.stringify({app:'operation-wild-explorer',version:3,exportedAt:new Date().toISOString(),state},null,2);
    const blob=new Blob([content],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`wild-explorer-progress-${new Date().toISOString().slice(0,10)}.json`;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);toast('Progress backup prepared. Keep the JSON file somewhere safe.');
  }
  function newAdventurePrompt(){openBuilder();}
  async function checkForUpdate(){
    if(!swRegistration){toast('Open the HTTPS site online to enable updates.');return;}
    try{await swRegistration.update();if(swRegistration.waiting){$('update-banner').hidden=false;closeSheet();toast('A new version is ready. Tap Update game.');}else toast('Update check complete. New versions appear in the banner when ready.');}catch{toast('Could not check for updates. Your saved adventure is unchanged.');}
  }
  function completeChallenge(button){if(syncFromStorage())return;
    if(Date.now()<challengeTapUntil)return;
    const a=active(),card=currentCard();if(!card)return;
    const r=E.completeChallenge(state.expedition,{cardId:button.dataset.card,challengeKey:button.dataset.key,expectedChapter:Number(button.dataset.chapter),expectedStep:Number(button.dataset.step),at:new Date().toISOString(),note:clean($('clue-memory')?.value,140),specialty:state.specialties[state.leader]});
    if(!r.changed)return;challengeTapUntil=Date.now()+500;state.expedition=r.expansion;state.leader=(state.leader+1)%state.names.length;
    state.checks=[0,1,2].map(i=>active().done.some(x=>x.chapter===active().chapter&&x.step===i));if(!save())return;renderAll();playSound();
    toast(`${state.names[state.leader]} gets the next pretend lead!`);$('quest-screen').querySelector('.challenge-card')?.scrollIntoView({block:'nearest',behavior:'auto'});
  }
  function openFinishEarly(){
    openSheet(sheetHeader('A good ending for today')+`<div class="sheet-body"><p>Keep every discovery, crystal and XP you’ve already earned. There is no penalty for a shorter adventure.</p><p>The Guardian can finish the story right here: your family brought ${active().done.length} little wonders back to base camp.</p><p class="helper">Unfinished chapters don’t grant an extra crystal. You can also take a break and resume this exact challenge later.</p><button class="btn full" data-action="finish-confirmed">Finish our story & make a postcard</button><button class="btn quiet full" data-action="close-sheet">Keep our place and continue later</button></div>`);
  }
  function openNightPicker(){
    openSheet(sheetHeader('Choose our little night adventure')+`<div class="sheet-body"><p>Friendly Halloween magic for ages 3–5: five little lanterns, one cozy ending. New night stories start with five gentle challenges; the planner can make them longer. No scares, countdown or darkness needed.</p><div class="night-setting-list">${Object.entries(NIGHT_PLACES).map(([setting,p])=>{const key='halloween:'+setting,outing=active().options.theme==='halloween'&&active().options.setting===setting?active():state.expedition.parkedOutings?.[key];return `<button class="night-setting" data-action="night-ready" data-value="${setting}"><span aria-hidden="true">${p.emoji}</span><span><b>${p.name}</b><small>${p.detail}</small><em>${outing&&!outing.ended?'Resume our saved story':'Choose this setting'}</em></span></button>`;}).join('')}</div><p class="helper">Each setting and the daytime adventure keep their own place. All your heroes share your earned XP, crystals, camp and memories.</p><button class="btn quiet full" data-action="close-sheet">Back to our adventure</button></div>`);
  }
  function openNightReady(setting){
    if(!NIGHT_PLACES[setting])return;
    const p=NIGHT_PLACES[setting];
    openSheet(sheetHeader(p.emoji+' '+p.name)+`<form id="night-ready-form" class="sheet-body" data-setting="${setting}"><p><b>A quick grown-up check</b></p><ul class="night-checklist"><li>${setting==='indoor'?'Keep comfortable room lighting on. Clear the floor and stay away from stairs, hot things and flames.':setting==='neighbourhood'?'Choose a familiar, safe sidewalk route. Stay beside your grown-ups. No clue requires crossing a road, approaching a home or speaking to a stranger.':'Confirm the familiar trail is open after dark and safe for your children today. If you cannot confirm, choose the cozy house instead.'}</li>${setting!=='indoor'?'<li>Bring suitable lights and visible clothing. Stop in a safe place before reading or tapping the screen. Stay together on the marked path or sidewalk, away from roads, water and edges.</li>':''}<li>Use a separate flashlight if you want. Keep beams low and away from eyes, traffic, homes and wildlife. This game does not switch on your phone’s flashlight.</li><li>Use what you already have; no purchases needed. Every challenge has a simpler seated indoors option, and a grown-up can help while a child chooses or directs. Swap any activity that does not fit your materials or family.</li>${setting==='indoor'?'<li>Grown-ups handle any cutting. Keep hats above eyes, faces uncovered and fabric short; never tie or fasten costumes around the neck. Remove loose costumes before moving. No candles or flames.</li>':'<li>If you want a homemade costume, make and check it indoors before the walk. Keep faces and hands clear; remove loose fabric before walking. Outdoor clues need no craft supplies or collecting.</li>'}<li>No need to find a real animal, pick plants, run, climb or enter darkness.</li></ul><label class="night-ready-check"><input type="checkbox" id="night-ready-check" required> <span>${setting==='trail'?'I’ve checked this trail is open and suitable after dark, and I’ll lead our family.':'Our space is safe and comfortable, and a grown-up will lead.'}</span></label><button class="btn full" type="submit">🏮 Start or resume our lantern story</button>${setting!=='indoor'?'<button class="btn quiet full" type="button" data-action="night-ready" data-value="indoor">🏠 Choose the cozy house instead</button>':''}<button class="subtle-button wide" type="button" data-action="night-picker">Choose another setting</button><p class="helper">The pictures are pretend. The game does not research opening times, weather or safe routes.</p></form>`);
  }
  function switchAdventure(theme,setting){if(syncFromStorage())return;
    const r=E.switchAdventure(state.expedition,theme,setting,Date.now());
    if(r.changed)state.expedition=r.expansion;
    state.mode='expedition';state.index=active().claimedChapters.length;state.gems=MISSIONS.slice(0,state.index).map(m=>m.gem);state.checks=[0,1,2].map(i=>active().done.some(x=>x.chapter===active().chapter&&x.step===i));state.variants=[0,0,0];
    if(!save())return;closeSheet();setTab('quest');toast(theme==='halloween'?'Your little lantern story is ready.':'Your daytime adventure is right where you left it.');
  }
  function openBuilder(){
    const a=active(),o=a.options,hasProgress=a.done.length>0||a.claimedChapters.length>0;
    const fields=isNight()?[['duration','Adventure length',['short','medium','long']],['difficulty','Challenge style',['gentle','curious','challenge']]]:[['habitat','Where',['woodland','park','garden','neighbourhood']],['season','Season',['spring','summer','autumn','winter']],['duration','Adventure length',['short','medium','long']],['difficulty','Challenge style',['gentle','curious','challenge']]];
    openSheet(sheetHeader(a.ended?'Plan our next adventure':'Shape our adventure')+`<form id="outing-form" class="sheet-body"><p>${isNight()?'Five little lanterns in our '+esc(NIGHT_PLACES[o.setting].name.toLowerCase())+' story.':'Five story chapters,'} with a mix of Find, Listen, Move, Make & tell and Solve. Everything has an easy alternative.</p><div class="builder-grid">${fields.map(([name,label,values])=>`<label class="field-label" for="outing-${name}">${label}<select class="text-field" name="${name}" id="outing-${name}">${values.map(v=>`<option value="${v}" ${o[name]===v?'selected':''}>${name==='duration'?{short:'Short · 5 challenges · about 10–15 min',medium:'Medium · 10 challenges · about 20–30 min',long:'Long · 15 challenges · about 35–50 min'}[v]:optionLabel(v)}</option>`).join('')}</select></label>`).join('')}</div><p class="helper">Times are a loose guide, never a timer. Gentle uses one simple idea, Curious adds noticing, Challenge adds a little reasoning. Recent cards are avoided when there are enough choices.</p>${!a.ended&&hasProgress?'<p class="safe-note">Your current outing has discoveries. Finish it first to keep its postcard, or close this planner to continue it.</p><button class="btn quiet full" type="button" data-action="finish-early">Finish the current outing first</button>':`<button class="btn full" type="submit">${icon('compass')} ${a.ended?'Start our next adventure':'Build this adventure'}</button>`}<button class="btn quiet full" type="button" data-action="night-picker">🌙 ${isNight()?'Change night setting':'Choose a Halloween night adventure'}</button>${isNight()?'<button class="subtle-button wide" type="button" data-action="daylight-mode">Return to our saved daytime adventure</button>':''}<p class="helper">Heroes, lifetime XP, journal, camp purchases and previous postcards stay with you. Switching day/night or night settings saves your place.</p></form>`);
  }
  function startPlannedOuting(form){if(syncFromStorage())return;
    const o={...active().options,...Object.fromEntries(new FormData(form).entries())};let exp=state.expedition;
    if(active().ended){const r=E.startNext(exp,o,Date.now());if(!r.changed){toast('Finish the current outing first.');return;}exp=r.expansion;}
    else{if(active().done.length||active().claimedChapters.length){toast('Finish your current outing before planning another.');return;}exp={...exp,options:E.normaliseOptions(o),active:E.createOuting(o,exp.recentIds,Date.now())};}
    state.mode='expedition';state.expedition=exp;state.index=0;state.gems=[];state.checks=[false,false,false];state.variants=[0,0,0];if(!save())return;closeSheet();setTab('quest');toast('Your next five-chapter story is ready.');
  }
  function renderCamp(){
    const e=state.expedition,owned=e.owned||[],equipped=Object.values(e.equipped||{}),items=E.SHOP;
    const chosen=items.filter(x=>equipped.includes(x.id));
    return `<div class="camp-scene"><span class="camp-sun">${isNight()?'🌙':'☀️'}</span><div class="camp-trees">🌲 🌳 🌲</div><div class="camp-decor">${chosen.map(x=>`<span title="${esc(x.name)}">${x.emoji}</span>`).join('')||'⛺'}</div><b>Our family base camp</b><p>${chosen.map(x=>esc(x.name)).join(' · ')||'A cosy place for our next story'}</p></div><div class="wallet-line"><b>💎 ${e.wallet} camp crystals</b><span>Earned together · no real money</span></div><p class="intro">Buy once, play whenever you like. Use your compass, light a warm screen lantern, wear a cape or play with your camp treasures. Your crystal trophies and family XP stay safe.</p><div class="camp-shop">${items.map(item=>{const has=owned.includes(item.id),on=equipped.includes(item.id);return `<article class="shop-card"><span class="shop-emoji" aria-hidden="true">${item.emoji}</span><h3>${esc(item.name)}</h3><p>${esc(item.description)}</p>${has?`<span class="owned-label">✓ Yours forever${on?' · Equipped':''}</span><button class="btn full" data-action="use-gear" data-value="${esc(item.id)}">${item.id.includes('cape')?'Wear & play':'Use '+esc(item.name)}</button>`:`<button class="btn quiet full" data-action="buy-camp" data-value="${esc(item.id)}" ${e.wallet<item.cost?'disabled':''}>${item.cost} 💎 · Choose</button>`}</article>`;}).join('')}</div><p class="helper">Camp and companions are pretend. We watch real animals from a distance.</p>`;
  }
  function buyCampItem(id){
    const item=E.SHOP.find(x=>x.id===id);if(!item)return;
    openSheet(sheetHeader('A little something for camp')+`<div class="reward-body"><span class="shop-emoji">${item.emoji}</span><h2>${esc(item.name)}</h2><p>Spend ${item.cost} of your ${state.expedition.wallet} camp crystals?</p><p class="helper">Pretend currency only. This stays in your family camp across outings.</p><button class="btn full" data-action="confirm-camp" data-value="${esc(id)}">Spend ${item.cost} camp crystals</button><button class="btn quiet full" data-action="close-sheet">Keep our crystals</button></div>`);
  }
  function equipCampItem(id){if(syncFromStorage())return;const r=E.equipItem(state.expedition,id);if(r.changed){state.expedition=r.expansion;if(!save())return;renderAll();toast('Your camp has a new look.');}}

  // Purchased tools never award XP or spend again. Sensor readings stay in memory.
  const ownsGear=id=>state.expedition.owned.includes(id);
  const lanternOwned=()=>ownsGear('explorer-lantern')||ownsGear('pumpkin-lantern');
  function applyLantern(){
    const lit=state.tools.lanternOn&&lanternOwned();
    document.body.classList.toggle('lantern-lit',lit);
    // Lantern uses its own light, high-contrast palette; restore night colours when off.
    document.body.classList.toggle('night-theme',isNight()&&!lit);
    document.body.style.setProperty('--lantern-strength',String(state.tools.lanternLevel/100));
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content',lit?'#ed872d':isNight()?'#171d35':'#edf5dc');
  }
  function renderEquipment(){
    applyLantern();const el=$('equipment-bar');if(!el)return;
    el.hidden=!state.expedition.owned.length;
    el.innerHTML=`<button class="btn quiet" data-action="gear-pack">🎒 Use our gear</button>${ownsGear('compass')?'<button class="btn quiet" data-action="use-gear" data-value="compass">🧭 Compass</button>':''}${state.tools.lanternOn&&lanternOwned()?'<button class="btn quiet" data-action="lantern-off">🏮 Turn glow off</button>':lanternOwned()?`<button class="btn quiet" data-action="use-gear" data-value="${ownsGear('explorer-lantern')?'explorer-lantern':'pumpkin-lantern'}">🏮 Lantern</button>`:''}`;
  }
  function openGearPack(){
    const items=E.SHOP.filter(x=>ownsGear(x.id));
    openSheet(sheetHeader('Our adventure gear')+`<div class="sheet-body"><p>Everything here is already yours. Use it as often as you like, with no crystal cost.</p><div class="gear-pack">${items.map(x=>`<button class="btn quiet full" data-action="use-gear" data-value="${x.id}">${x.emoji} ${esc(x.name)}</button>`).join('')}</div><button class="subtle-button wide" data-action="camp">Visit the crystal shop</button></div>`);
  }
  function openGear(id){
    if(syncFromStorage()||!ownsGear(id))return;
    const item=E.SHOP.find(x=>x.id===id);if(!item)return;
    const r=E.equipItem(state.expedition,id);if(r.changed){state.expedition=r.expansion;if(!save())return;renderAll();}
    if(id==='compass'){openCompass();return;}
    if(id.includes('lantern')){openLantern(id);return;}
    gearStep=0;openSheet(sheetHeader(item.emoji+' '+item.name)+'<div class="sheet-body" id="gear-activity"></div>');gearItem=id;renderGearActivity();
  }
  const GEAR_PLAY={
    'leaf-cape':[['Leaf stretch','Your explorers are wearing their leaf cape. Seated, open one hand like a leaf. Let everyone copy its shape.'],['Tiny leaf patterns','Trace a line down your own palm, then add tiny branches with your finger.'],['Leaf hello','Choose a slow hand-wave for your caped team. Everyone can join or direct a grown-up.']],
    'moon-cape':[['Moon hands','Your whole team is wearing a Moon cape. Seated, curve your hands into a crescent shape.'],['Star fingers','Spread your fingers like a star. Compare the shape with a grown-up’s hand.'],['Moon-team greeting','Make up a gentle two-movement hand greeting for your team to copy.']],
    'fox-friend':[['Fox’s colour clue','Our storybook fox wants to play. Point to something orange or brown on your own clothes, or choose another colour.'],['Fox’s quiet beat','Tap your own palm softly twice. Can your family copy the pattern?'],['Fox’s thank-you','Give your pretend fox a tiny wave, then tell a real explorer something kind. Real foxes need space; never approach or call them.']],
    'bat-friend':[['Bat-wing hands','Our pretend bat opens its wings. Seated, open both hands slowly and compare their shapes.'],['Bat’s listening game','Keep eyes open. Listen together for one quiet sound, then describe it. Do not call to real bats.'],['Bat’s shape puzzle','Make a small triangle with your fingers. Can a grown-up copy your shape? Real wildlife stays wild.']],
    'bunting':[['Start our colour pattern','Point to red, yellow, then blue on the flags. Say the colours together.'],['Finish our pattern','Red, yellow, blue… what colour comes next? Point to the first flag to begin again.'],['Make a hand pattern','Tap one finger, then two, then one. Invite someone to continue your repeating pattern.']],
    'cosy-tent':[['Open our story tent','Everyone can stay seated where they are. Choose one real thing you noticed today to start a tiny story.'],['Add a story sound','Invite the next explorer to add a soft sound or hand movement to your story.'],['Tell our ending','Choose a kind ending together. Close your hands like a little book. Your pretend tent stays ready for another story.']],
    'guardian-flag':[['Choose a team signal','Point to a symbol on the flag, then make a matching shape with your hands.'],['Teach your signal','Show your hand signal slowly. Let your team copy it while staying safely seated or still.'],['Raise a kind message','Say one thing your team did together today. Give a gentle thank-you wave. This is a story signal, never a road or safety signal.']]
  };
  function renderGearActivity(){
    const id=gearItem,steps=GEAR_PLAY[id];if(!steps||!ownsGear(id))return;
    const item=E.SHOP.find(x=>x.id===id),[title,prompt]=steps[gearStep],keepNextFocus=document.activeElement?.dataset?.action==='gear-next';
    const scene=id.includes('cape')?`<div class="gear-avatar">${avatar(state.leader)}</div>`:id==='bunting'?'<div class="play-bunting" aria-label="Red, yellow, blue, red, yellow, blue flags">🔴 🟡 🔵<br>🔴 🟡 🔵</div>':id==='guardian-flag'?'<div class="play-prop">🚩 <span>★ ♥ 🍃</span></div>':`<div class="play-prop" aria-hidden="true">${item.emoji}</div>`;
    $('gear-activity').innerHTML=`${scene}<span class="eyebrow">ALREADY YOURS · PLAY ${gearStep+1} OF 3</span><h3>${esc(title)}</h3><p>${esc(prompt)}</p><button class="btn full" data-action="gear-next">${gearStep===2?'Play again':'Next little game'} ${icon('arrow')}</button><p class="helper">Free play. No extra crystals or XP. Stay with your grown-up; choose or direct any action.</p><button class="btn quiet full" data-action="close-sheet">Back to our adventure</button>`;
    if(keepNextFocus)$('gear-activity').querySelector('[data-action="gear-next"]')?.focus({preventScroll:true});
  }
  function openLantern(id){
    openSheet(sheetHeader(E.SHOP.find(x=>x.id===id).name)+`<div class="sheet-body lantern-tool"><div class="lantern-window" id="lantern-window"><span aria-hidden="true">${id==='pumpkin-lantern'?'🎃':'🏮'}</span><b id="lantern-state"></b></div><p>A cozy orange glow for your whole game screen. Keep playing with it on, even while you use other gear.</p><button class="btn full" id="lantern-toggle" data-action="lantern-toggle" data-value="${id}"></button><label class="field-label" for="lantern-strength">Glow strength <output id="lantern-level"></output></label><input class="gear-range" type="range" id="lantern-strength" min="20" max="100" step="10" value="${state.tools.lanternLevel}"><p class="safe-note">Screen colour only. This does not operate the phone flashlight or change device brightness. Keep room lights on and bring a real light outdoors. A grown-up leads; stop before using the screen.</p><button class="btn quiet full" data-action="close-sheet">Keep playing</button></div>`);
    gearItem=id;updateLantern();
  }
  function toggleLantern(id){
    if(!['explorer-lantern','pumpkin-lantern'].includes(id)||!ownsGear(id))return;
    state.tools.lanternId=id;state.tools.lanternOn=!state.tools.lanternOn;if(!save())return;renderEquipment();updateLantern();
  }
  function updateLantern(){
    if(!gearItem?.includes('lantern'))return;const on=state.tools.lanternOn;
    $('lantern-toggle').textContent=on?'Turn off warm glow':'Turn on warm glow';$('lantern-toggle').setAttribute('aria-pressed',String(on));
    $('lantern-state').textContent=on?'Your warm glow is on':'Ready to glow';$('lantern-window').classList.toggle('on',on);
    $('lantern-level').textContent=state.tools.lanternLevel+'%';$('lantern-strength').value=state.tools.lanternLevel;
  }
  function stopCompass(){
    compassSession++;clearTimeout(compassTimer);clearTimeout(compassStaleTimer);compassTimer=null;compassStaleTimer=null;
    if(compassListening){window.removeEventListener('deviceorientation',receiveHeading);window.removeEventListener('deviceorientationabsolute',receiveHeading);compassListening=false;}
    compassHeading=null;
  }
  function pauseCompass(){
    if(gearItem==='compass'&&compassMode!=='practice'){stopCompass();compassMode='idle';compassMessage='Compass paused while the game is hidden. Tap Enable phone compass to start again.';updateCompass();}
  }
  function openCompass(){
    compassEnableAfter=Date.now()+600;
    compassMode='practice';practiceHeading=0;compassMessage='Practice dial: you choose the direction. This is not a real heading.';
    openSheet(sheetHeader('Star compass')+`<div class="sheet-body compass-tool"><p class="gear-mode" id="compass-mode"></p><div class="compass-case"><span class="compass-pointer" aria-hidden="true">▼</span><div class="compass-dial" id="compass-dial" aria-hidden="true"><b class="north">N</b><b class="east">E</b><b class="south">S</b><b class="west">W</b><span class="compass-needle">✦</span></div></div><p class="heading-readout" id="compass-reading"></p><p class="helper" id="compass-message" role="status"></p><button class="btn full" id="compass-enable" data-action="compass-enable">Enable phone compass</button><p class="helper">With your permission, a supported phone can share compass readings with this page. Readings stay on this device and are never saved or uploaded. Hold the phone flat, face up, in portrait. Nearby metal may affect it.</p><div id="compass-practice"><label class="field-label" for="compass-practice-dial">Turn the practice dial</label><input class="gear-range" id="compass-practice-dial" type="range" min="0" max="359" value="0"><div class="gear-turns"><button class="btn quiet" data-action="compass-turn" data-value="-45">↶ Turn left</button><button class="btn quiet" data-action="compass-turn" data-value="45">Turn right ↷</button></div><p class="helper">Try pointing the top marker at E, then S. You can stay seated.</p></div><button class="btn quiet full" id="compass-manual" data-action="compass-practice">Use practice dial instead</button><p class="safe-note">A direction-learning toy, never a navigation or safety tool. A grown-up chooses the real route. Stay still together while looking at the screen.</p></div>`);
    gearItem='compass';updateCompass();
  }
  function updateCompass(){
    if(gearItem!=='compass')return;const practice=compassMode==='practice',heading=practice?practiceHeading:compassHeading;
    $('compass-mode').textContent=practice?'PRACTICE · NOT YOUR REAL DIRECTION':compassMode==='live'?'LIVE PHONE READING · APPROXIMATE':'PHONE COMPASS · NO READING';
    $('compass-reading').textContent=heading===null?'Waiting for a reliable heading':`${practice?'Practice':'Approx.'} ${Math.round(heading)%360}° · ${G.cardinal(heading)}`;
    $('compass-dial').style.transform=heading===null?'':`rotate(${-heading}deg)`;$('compass-dial').hidden=heading===null;
    if($('compass-message').textContent!==compassMessage)$('compass-message').textContent=compassMessage;$('compass-practice').hidden=!practice;$('compass-manual').hidden=practice;
    $('compass-practice-dial').value=practiceHeading;$('compass-enable').disabled=['requesting','waiting','live'].includes(compassMode);
    $('compass-enable').textContent=compassMode==='live'?'Phone compass is on':compassMode==='requesting'?'Waiting for permission…':compassMode==='waiting'?'Listening for a heading…':'Enable phone compass';
  }
  function compassFallback(message){stopCompass();compassMode='practice';compassMessage=message+' Practice dial only: you control it; it is not your real direction.';updateCompass();}
  async function enableCompass(){
    if(Date.now()<compassEnableAfter){toast('Read the compass note, then tap Enable phone compass when you are ready.');return;}
    if(gearItem!=='compass'||!ownsGear('compass')||['requesting','waiting','live'].includes(compassMode))return;
    stopCompass();const request=compassSession;
    if(!window.isSecureContext||!window.DeviceOrientationEvent){compassFallback('This browser cannot provide a phone compass.');return;}
    compassMode='requesting';compassMessage='Choose whether to allow your phone’s orientation sensor.';updateCompass();
    try{
      // Called synchronously from the explicit button tap to preserve user activation.
      const permission=typeof window.DeviceOrientationEvent.requestPermission==='function'?await window.DeviceOrientationEvent.requestPermission(true):'granted';
      if(request!==compassSession||gearItem!=='compass'||document.hidden)return;
      if(permission!=='granted'){compassFallback('Sensor permission was not granted. You can still play.');return;}
      compassMode='waiting';compassMessage='Hold the phone flat, face up, in portrait. Waiting for an absolute compass reading…';
      window.addEventListener('deviceorientationabsolute',receiveHeading);window.addEventListener('deviceorientation',receiveHeading);compassListening=true;
      compassTimer=setTimeout(()=>{if(request===compassSession)compassFallback('No reliable compass reading arrived. This device or browser may not support it.');},7000);updateCompass();
    }catch{if(request===compassSession&&gearItem==='compass')compassFallback('The phone compass could not be enabled.');}
  }
  function receiveHeading(event){
    if(!compassListening||gearItem!=='compass'||document.hidden)return;
    // Relative events can arrive beside absolute ones; never substitute them as north.
    if(event.absolute!==true&&typeof event.webkitCompassHeading!=='number')return;
    const angle=window.screen?.orientation?.angle??window.orientation??0;
    const portrait=!String(window.screen?.orientation?.type||'').startsWith('landscape')&&!(window.innerWidth>window.innerHeight);
    const reading=portrait?G.readHeading(event,angle):null;
    if(!reading){compassHeading=null;compassMode='waiting';compassMessage='No reliable heading. Hold the phone flat, face up, in portrait, away from metal. You can use the practice dial.';updateCompass();return;}
    clearTimeout(compassTimer);clearTimeout(compassStaleTimer);compassHeading=reading.heading;compassMode='live';
    compassMessage=reading.source==='webkit'?`Phone compass estimate${Number.isFinite(reading.accuracy)?' · accuracy ±'+Math.round(reading.accuracy)+'°':''}. Nearby metal can change the reading.`:'Absolute device orientation estimate. Accuracy is not supplied by this browser.';
    const request=compassSession;compassStaleTimer=setTimeout(()=>{if(request===compassSession)compassFallback('The compass stopped updating. Its old reading has been cleared.');},3500);updateCompass();
  }

  function enrichLatestPostcard(){
    const p=state.expedition.postcards.find(x=>x.id===active().id)||state.expedition.postcards.at(-1);if(!p)return;
    p.park=p.park||(p.options.theme==='halloween'?`Halloween night · ${NIGHT_PLACES[p.options.setting].name}`:state.park);p.date=p.date||p.createdAt||new Date().toISOString();p.createdAt=p.createdAt||p.date;p.heroes=p.heroes?.length?p.heroes:[...state.names];p.favorite=p.favorite||'';p.photoIds=p.photoIds||[];
    p.discoveries=p.done.map(d=>{const c=E.CARD_BY_ID[d.cardId];return {...d,id:d.cardId,title:c?.title||'A little wonder',note:d.note||'',type:c?.type||'Find',emoji:c?.emoji||'🌿'};});
    p.badges=[...(p.options.theme==='halloween'?['Little Lantern Keeper']:[]),p.endedEarly?'Little Adventure':'Five-piece Explorer',...new Set(p.done.map(d=>E.CARD_BY_ID[d.cardId]?.type).filter(Boolean)),...(p.puzzleSolved?['Map Storyteller']:[])];
  }
  function renderPostcards(){
    const cards=state.expedition.postcards;
    return `<p class="intro">A little keepsake from each outing. Postcards and chosen photos stay in this browser until you export a copy. Nothing is posted online.</p>${cards.length?`<div class="postcard-list">${[...cards].reverse().map(p=>`<button class="postcard-summary" data-action="view-postcard" data-value="${esc(p.id)}"><span aria-hidden="true">${p.endedEarly?'🌿':'💌'}</span><div><b>${esc(p.park||'Our family adventure')}</b><small>${esc(new Date(p.date||p.createdAt).toLocaleDateString('en-CA'))} · ${p.done.length} discoveries</small><p>${esc(p.favorite||'Add our favourite moment')}</p></div><span aria-hidden="true">›</span></button>`).join('')}</div>`:`<div class="empty-box"><span class="empty-icon">💌</span>Finish a full or shorter outing to make your first postcard.</div><button class="btn full" data-action="tab" data-value="quest">Back to our adventure</button>`}<p class="helper">Export your favourites before clearing website data. JSON backups keep postcard text and photo references, but not the photos themselves.</p>`;
  }
  async function openPostcard(id){
    const p=state.expedition.postcards.find(x=>x.id===id);if(!p)return;viewedPostcardId=id;
    openSheet(sheetHeader('Our private adventure postcard')+`<div class="sheet-body"><div class="postcard-preview"><span class="eyebrow">A LITTLE QUEST. A BIG MEMORY.</span><h2>${esc(p.park||'Our family adventure')}</h2><p>${esc(new Date(p.date||p.createdAt).toLocaleDateString('en-CA'))}</p><div class="postcard-badges">${(p.badges||[]).map(b=>`<span class="badge">${esc(b)}</span>`).join('')}</div><ul class="postcard-discoveries">${(p.discoveries||[]).map(d=>`<li><b>${esc(d.emoji||'🌿')} ${esc(d.title)}</b>${d.note?`<span>${esc(d.note)}</span>`:''}</li>`).join('')}</ul><div id="postcard-photos" class="postcard-photos"></div></div><form id="postcard-form" data-id="${esc(id)}"><label class="field-label" for="postcard-favorite">Our favourite moment</label><textarea class="text-field" id="postcard-favorite" rows="3" maxlength="280">${esc(p.favorite||'')}</textarea><button class="btn quiet full" type="submit">Save favourite moment</button></form><button class="btn quiet full" data-action="add-photo" data-value="${esc(id)}" ${photoBusy||p.photoIds.length>=4?'disabled':''}>${photoBusy?'Saving photo…':'Choose an optional photo'} (${p.photoIds.length}/4)</button><p class="helper">Grown-up choice: choose a JPEG, PNG or WebP image from this device. No photo is needed to complete any challenge. Images stay here, with location metadata removed. HEIC may need conversion first.</p><button class="btn full" data-action="export-postcard" data-value="${esc(id)}">${icon('download')} Download a private postcard</button>${p.photoIds.length?`<button class="subtle-button wide" data-action="export-postcard-text" data-value="${esc(id)}">Download text-only postcard instead</button>`:''}<p class="helper">The downloaded HTML keepsake includes your text and any available photos. Open it in a browser; you choose whether to share it. No automatic sharing.</p></div>`);
    for(const photoId of p.photoIds){try{const data=await WildPostcards.loadPhoto(photoId);if(viewedPostcardId!==id||!$('postcard-photos'))return;const div=document.createElement('div');div.className='postcard-photo';if(data){const img=document.createElement('img');img.src=data;img.alt='Your chosen adventure photo';div.append(img);}else{div.textContent='This photo is unavailable on this browser. Add it again from your device.';}const button=document.createElement('button');button.type='button';button.className='subtle-button';button.dataset.action='remove-photo';button.dataset.value=id;button.dataset.photo=photoId;button.textContent='Remove photo';div.append(button);$('postcard-photos').append(div);}catch{toast('Photo storage is unavailable. Your postcard text is safe.');}}
  }
  async function removePostcardPhoto(id,photoId){
    if(syncFromStorage())return;const expectedState=state,expectedSave=lastSavedValue,expectedSheet=sheetEpoch;
    const p=state.expedition.postcards.find(x=>x.id===id);if(!p||!p.photoIds.includes(photoId))return;
    const shared=state.expedition.postcards.some(x=>x.id!==id&&x.photoIds.includes(photoId));
    if(!shared){try{await WildPostcards.deletePhoto(photoId);}catch(error){toast(error.message||'Could not remove the stored photo. Please try again.');return;}}
    if(syncFromStorage()||state!==expectedState||lastSavedValue!==expectedSave){toast('Your adventure changed. Please check this postcard again.');return;}
    p.photoIds=p.photoIds.filter(x=>x!==photoId);if(!save())return;
    if(viewedPostcardId===id&&sheetEpoch===expectedSheet&&$('sheet').open)void openPostcard(id);
  }
  async function exportPostcard(id,withoutPhotos=false){
    if(syncFromStorage())return;
    const p=state.expedition.postcards.find(x=>x.id===id);if(!p)return;
    if($('postcard-favorite')&&viewedPostcardId===id){p.favorite=clean($('postcard-favorite').value,280);if(!save())return;}
    try{const result=await WildPostcards.exportPostcard(p,{photoIds:withoutPhotos?[]:p.photoIds});toast(result?.missingPhotoIds?.length?'Postcard downloaded; some photos were unavailable.':'Your private postcard is ready to save.');}catch(error){toast(error.message||'Could not export. Your postcard is still on this device.');}
  }
  let puzzlePicked=[];
  function openPuzzle(){
    const puzzle=E.getPuzzle(state.expedition);if(!puzzle.available){toast('Bring home all five map pieces first.');return;}puzzlePicked=[];
    const done=active().puzzleSolved;
    openSheet(sheetHeader(isNight()?'The cozy lantern finale':'The Guardian’s discovery map')+`<div class="sheet-body"><div class="puzzle-map">${isNight()?'🏮 🌙 🏮<br>🏮 🎃 🏮':'🧩 🌳 🧩<br>🧩 🦊 🧩'}</div><p>${done?(isNight()?'The five lanterns glow. Our friendly bat folds its wings, the pumpkin host gives a tiny wave, and the moon says: “Every hero belongs.” Tell your favourite memory, then say a gentle goodnight.':'Your discoveries made the Guardian’s map whole. You are family storytellers!'):'The last spell uses your own adventure. Put these three discoveries in the order you explored them.'}</p><p class="helper">No wrong-answer penalty. Tell the story together, or use your journey notes below.</p><div id="puzzle-progress" class="puzzle-progress" role="status">${done?'Map complete!':'First → Then → Last'}</div>${done?'':`<div class="puzzle-choices">${puzzle.choices.map(c=>`<button class="btn quiet full" data-action="puzzle-choice" data-value="${esc(c.id)}">${c.emoji} ${esc(c.title)}</button>`).join('')}</div>`}<details><summary>Our journey notes</summary><ol>${active().done.map(d=>`<li>${esc(E.CARD_BY_ID[d.cardId]?.title||'A little wonder')}${d.note?': '+esc(d.note):''}</li>`).join('')}</ol></details><button class="btn full" data-action="postcards">Our adventure postcard</button></div>`);
  }
  function choosePuzzle(id){if(syncFromStorage())return;
    const p=E.getPuzzle(state.expedition);if(!p.choices.some(c=>c.id===id)||puzzlePicked.includes(id))return;puzzlePicked.push(id);
    const button=$('sheet-content').querySelector(`[data-action="puzzle-choice"][data-value="${id}"]`);if(button)button.disabled=true;
    $('puzzle-progress').textContent=puzzlePicked.map(x=>E.CARD_BY_ID[x]?.emoji||'🧩').join(' → ');
    if(puzzlePicked.length!==p.answerIds.length)return;const r=E.solvePuzzle(state.expedition,puzzlePicked);
    if(r.changed){state.expedition=r.expansion;enrichLatestPostcard();if(!save())return;confetti();openPuzzle();toast('Your family’s story made the map whole!');}
    else{puzzlePicked=[];$('puzzle-progress').textContent='Let’s try the story order again. Check our journey notes below.';$('sheet-content').querySelectorAll('[data-action="puzzle-choice"]').forEach(x=>x.disabled=false);}
  }
  async function verifyOffline(showMessage=true,repair=false){
    if(!('serviceWorker'in navigator)||!window.isSecureContext){if(showMessage)toast('Offline play needs the HTTPS site in a supported browser.');return false;}
    try{
      const ready=await Promise.race([navigator.serviceWorker.ready,new Promise((_,reject)=>setTimeout(()=>reject(new Error('Offline setup is still running. Try again online in a moment.')),12000))]);
      swRegistration=ready;const worker=ready.active;if(!worker)throw new Error('Offline setup has not finished yet.');
      const result=await new Promise((resolve,reject)=>{const channel=new MessageChannel();const timer=setTimeout(()=>reject(new Error('Offline verification timed out. Try again while online.')),12000);channel.port1.onmessage=e=>{clearTimeout(timer);resolve(e.data);};worker.postMessage({type:repair?'PREPARE_OFFLINE':'CHECK_OFFLINE'},[channel.port2]);});
      offlineReady=result.ready===true&&result.version===VERSION;if(!offlineReady)throw new Error(result.error||'Offline files are incomplete. Stay online and try again, or install the waiting game update.');
      syncFromStorage(false);renderHome();if(showMessage)toast('Adventure and artwork are ready offline on this device.');return true;
    }catch(error){offlineReady=false;if(showMessage)toast(error.message||'Could not confirm offline files. Keep internet on for now.');return false;}
  }
  async function downloadAdventure(){const b=document.querySelector('[data-action="download-adventure"]');if(b)b.disabled=true;toast('Checking the game, challenge deck and artwork for offline use…');await verifyOffline(true,true);if(b?.isConnected)b.disabled=false;}
  $('postcard-photo').addEventListener('change',async event=>{
    const file=event.target.files?.[0];event.target.value='';if(syncFromStorage())return;
    const id=viewedPostcardId,p=state.expedition.postcards.find(x=>x.id===id);if(!file||!p||photoBusy||p.photoIds.length>=4)return;
    const expectedState=state,expectedSave=lastSavedValue;photoBusy=true;
    try{
      const photoId=await WildPostcards.storePhoto(file),changed=syncFromStorage(),target=state.expedition.postcards.find(x=>x.id===id);
      if(changed||state!==expectedState||lastSavedValue!==expectedSave||target!==p||viewedPostcardId!==id){await WildPostcards.deletePhoto(photoId);toast('Your adventure changed while the photo was saving. Choose it again on the right postcard.');return;}
      target.photoIds.push(photoId);if(!save())return;toast('Photo saved only on this device.');
    }catch(error){toast(error.message||'Could not save the photo. The postcard still works without it.');}
    finally{photoBusy=false;if(viewedPostcardId===id&&state===expectedState)void openPostcard(id);}
  });

  document.addEventListener('click',e=>{
    const button=e.target.closest('button[data-action]');if(!button||button.disabled||button.isConnected===false)return;
    const a=button.dataset.action,v=button.dataset.value;
    if(syncFromStorage()&&!['settings','export','close-sheet'].includes(a))return;
    switch(a){
      case 'tab':setTab(v);break;
      case 'settings':openSettings();void checkVoicePack();break;
      case 'builder':openBuilder();break;
      case 'night-picker':openNightPicker();break;
      case 'night-ready':openNightReady(v);break;
      case 'daylight-mode':switchAdventure('daylight','indoor');break;
      case 'classic-mode':{const r=E.switchAdventure(state.expedition,'daylight','indoor',Date.now());if(r.changed){state.expedition=r.expansion;state.index=active().claimedChapters.length;state.gems=MISSIONS.slice(0,state.index).map(m=>m.gem);state.checks=[0,1,2].map(i=>active().done.some(x=>x.chapter===active().chapter&&x.step===i));state.variants=[0,0,0];}state.mode='classic';if(!save())return;closeSheet();setTab('quest');break;}
      case 'expedition-mode':state.mode='expedition';if(!save())return;closeSheet();setTab('quest');break;
      case 'classic-check':classicCheck(button);break;
      case 'classic-swap':{const r=C.swap(state.classic,Number(v),Number(button.dataset.chapter));if(r.changed){state.classic=r.state;if(!save())return;renderQuest();}break;}
      case 'classic-claim':classicClaim(Number(button.dataset.chapter));break;
      case 'complete-challenge':completeChallenge(button);break;
      case 'swap-challenge':{const r=E.swapChallenge(state.expedition);if(r.changed){state.expedition=r.expansion;if(!save())return;renderQuest();toast('An easier way, with the same reward.');}break;}
      case 'pass-lead':state.leader=(state.leader+1)%state.names.length;if(!save())return;renderQuest();renderHome();break;
      case 'finish-early':openFinishEarly();break;
      case 'finish-confirmed':{const r=E.finishEarly(state.expedition);if(r.changed){state.expedition=r.expansion;enrichLatestPostcard();if(!save())return;}closeSheet();setTab('quest');break;}
      case 'camp':closeSheet();treasureTab='camp';setTab('treasure');break;
      case 'buy-camp':buyCampItem(v);break;
      case 'confirm-camp':{const r=E.buyItem(state.expedition,v);if(r.changed){state.expedition=r.expansion;if(!save())return;closeSheet();renderAll();openGear(v);toast('It’s yours! Use it again anytime, for free.');}else toast('That item is already owned or needs more crystals.');break;}
      case 'equip-camp':equipCampItem(v);break;
      case 'use-gear':openGear(v);break;
      case 'gear-pack':openGearPack();break;
      case 'gear-next':if(gearItem&&state.expedition.owned.includes(gearItem)){gearStep=(gearStep+1)%3;renderGearActivity();}break;
      case 'lantern-toggle':toggleLantern(v);break;
      case 'lantern-off':state.tools.lanternOn=false;if(!save())return;renderEquipment();if(gearItem?.includes('lantern'))updateLantern();break;
      case 'compass-enable':void enableCompass();break;
      case 'compass-practice':stopCompass();compassMode='practice';compassMessage='Practice dial: you choose the direction. This is not a real heading.';updateCompass();break;
      case 'compass-turn':if(gearItem==='compass'&&compassMode==='practice'){practiceHeading=G.normalizeDegrees(practiceHeading+Number(v));updateCompass();}break;
      case 'postcards':closeSheet();treasureTab='postcards';setTab('treasure');break;
      case 'view-postcard':void openPostcard(v);break;
      case 'add-photo':if(!photoBusy){viewedPostcardId=v;$('postcard-photo').click();}break;
      case 'remove-photo':void removePostcardPhoto(v,button.dataset.photo);break;
      case 'export-postcard':void exportPostcard(v);break;
      case 'export-postcard-text':void exportPostcard(v,true);break;
      case 'download-adventure':void downloadAdventure();break;
      case 'download-voice':void downloadVoice();break;
      case 'cancel-voice-download':voicePack?.cancel();break;
      case 'puzzle':openPuzzle();break;
      case 'puzzle-choice':choosePuzzle(v);break;
      case 'close-sheet':closeSheet();break;
      case 'hero':openHero(Number(v));break;
      case 'add-player':openHero(state.names.length,true);break;
      case 'swatch':{if(!draftHero)return;const kind=button.dataset.kind;if(!['skin','colour','hair'].includes(kind))return;draftHero.look[kind]=clampInt(v,0,kind==='colour'?4:3);button.parentElement.querySelectorAll('button').forEach(b=>{const picked=b===button;b.setAttribute('aria-pressed',String(picked));b.textContent=picked?'✓':'';});updateHeroPreview();break;}
      case 'long-hair':if(draftHero){draftHero.look.long=!draftHero.look.long;button.setAttribute('aria-checked',String(draftHero.look.long));updateHeroPreview();}break;
      case 'check':{const i=Number(v);if(state.index>=5||![0,1,2].includes(i))return;state.checks[i]=!state.checks[i];if(!save())return;renderQuest();renderStatus();renderHome();const newButton=$('quest-screen').querySelector(`[data-action="check"][data-value="${i}"]`);newButton?.focus({preventScroll:true});if(state.checks[i]){playSound();if(state.checks.every(Boolean))toast('All three clues found! Your crystal is ready.');}break;}
      case 'swap':{const i=Number(v);if(state.index>=5||![0,1,2].includes(i)||state.checks[i])return;state.variants[i]=(state.variants[i]+1)%3;if(!save())return;renderQuest();$('quest-screen').querySelector(`[data-action="swap"][data-value="${i}"]`)?.focus({preventScroll:true});toast('A new clue! Stay right on your safe path.');break;}
      case 'claim':claimCrystal(button.dataset.chapter);break;
      case 'next-quest':closeSheet();setTab('quest');break;
      case 'reward-bag':closeSheet();treasureTab='crystals';setTab('treasure');break;
      case 'gem':openGem(Number(v));break;
      case 'treasure-tab':treasureTab=['journal','camp','postcards'].includes(v)?v:'crystals';renderTreasure();break;
      case 'discovery':openDiscovery(v);break;
      case 'read':readQuest();break;
      case 'rest':openSheet(sheetHeader('Little explorer pause')+`<div class="reward-body">${fox()}<p>Find a safe spot with your grown-ups. Have a sip of water, take a rest, and decide together whether to keep exploring.</p><p><b>${saveIssue?'Use Export backup to keep your adventure.':'Your adventure is saved.'}</b> You can finish another day. There’s no timer to beat!</p><button class="btn full" data-action="close-sheet">Ready when we are</button></div>`);break;
      case 'map-stop':case 'quest-map-node':openQuestMapNode(Number(v));break;
      case 'quest-map-finale':openQuestMapFinale();break;
      case 'quest-map-continue':closeSheet();setTab('quest');break;
      case 'gps':requestGPS();break;
      case 'clear-gps':gpsRequestId++;locationFix=null;gpsBusy=false;gpsError='';renderTrail();toast('Location reading cleared.');break;
      case 'setting':if(v==='sound'||v==='motion'){state.settings[v]=!state.settings[v];if(!save())return;renderStatus();button.setAttribute('aria-checked',String(state.settings[v]));if(v==='sound'){if(state.settings.sound)playSound();else magicSound.stop();}renderQuest();renderTrail();}break;
      case 'install':openInstall();break;
      case 'export':exportSave();break;
      case 'import':$('import-file').click();break;
      case 'restore-confirmed':if(pendingRestore){state=pendingRestore;pendingRestore=null;enrichLatestPostcard();if(!save())return;closeSheet();renderAll();toast('Your saved family adventure is restored.');}break;
      case 'new-adventure':newAdventurePrompt();break;
      case 'reset-confirmed':openBuilder();break;
      case 'check-update':void checkForUpdate();break;
      case 'update':stopNarration();if(swRegistration?.waiting)swRegistration.waiting.postMessage({type:'SKIP_WAITING'});else{toast('Checking for an update…');void checkForUpdate();}break;
    }
  });
  document.addEventListener('input',e=>{
    if(e.target.id==='magic-volume'){if(syncFromStorage())return;state.settings.volume=clampInt(e.target.value,0,100,55);magicSound.stop();if(!save())return;$('magic-volume-label').textContent=state.settings.volume+'%';}
    if(e.target.id==='compass-practice-dial'&&gearItem==='compass'&&compassMode==='practice'){practiceHeading=clampInt(e.target.value,0,359);updateCompass();}
    if(e.target.id==='lantern-strength'&&gearItem?.includes('lantern')){if(syncFromStorage())return;state.tools.lanternLevel=clampInt(e.target.value,20,100,60);if(!save())return;applyLantern();updateLantern();}
  });
  document.addEventListener('change',e=>{if(syncFromStorage()||!draftHero)return;if(e.target.id==='hero-role')draftHero.role=ROLE(e.target.value).id;else if(e.target.id==='hero-kind'&&['adult','child'].includes(e.target.value))draftHero.kind=e.target.value;else if(e.target.id==='hero-costume'&&Object.hasOwn(COSTUMES,e.target.value))draftHero.costume=e.target.value;else return;updateHeroPreview();});
  document.addEventListener('submit',e=>{
    const form=e.target;
    if(form.isConnected===false||syncFromStorage()){e.preventDefault();return;}
    if(form.id==='night-ready-form'){
      e.preventDefault();if(!$('night-ready-check').checked){toast('Please check your space with a grown-up first.');return;}if(NIGHT_PLACES[form.dataset.setting])switchAdventure('halloween',form.dataset.setting);
    }else if(form.id==='outing-form'){
      e.preventDefault();startPlannedOuting(form);
    }else if(form.id==='postcard-form'){
      e.preventDefault();const card=state.expedition.postcards.find(x=>x.id===form.dataset.id);if(card){card.favorite=clean($('postcard-favorite').value,280);if(!save())return;toast('Favourite moment saved on this device.');}
    }else if(form.id==='hero-form'){
      e.preventDefault();if(!draftHero)return;
      const i=draftHero.index,adding=draftHero.adding,name=clean($('hero-name').value,24);
      if(!name){toast('Give your explorer a name first.');$('hero-name').focus();return;}
      if(adding&&(i!==state.names.length||state.names.length>=MAX_NEW_PLAYERS))return;
      if(adding){const used=new Set(state.heroIds);let next=1;while(used.has(`player-${next}`))next++;state.heroIds.push(`player-${next}`);}
      state.names[i]=name;state.roles[i]=ROLE($('hero-role').value).id;state.specialties[i]=Object.hasOwn(SPECIALTIES,$('hero-specialty').value)?$('hero-specialty').value:draftHero.specialty;state.looks[i]={...draftHero.look};state.heroKinds[i]=draftHero.kind;state.costumes[i]=draftHero.costume;
      if(!adding)state.leader=i;if(!save())return;closeSheet();renderAll();toast(adding?`${name} joined your adventure team!`:`${name} is ready to lead the pretend quest!`);

    }else if(form.id==='place-form'){
      e.preventDefault();state.park=clean($('park-name').value,100)||freshState().park;state.start=clean($('start-point').value,120);if(!save())return;renderAll();toast('Your adventure location is saved.');
    }else if(form.id==='discovery-form'){
      e.preventDefault();const note=clean($('discovery-note').value,280),category=form.dataset.category;if(!note||!CATEGORIES[category])return;
      if(state.journal.length>=150)state.journal.shift();state.journal.push({category,note,at:new Date().toISOString()});if(!save())return;closeSheet();treasureTab='journal';setTab('treasure');toast('A little forest memory, saved!');
    }
  });
  let pendingRestore=null,importRequest=0;
  $('import-file').addEventListener('change',async e=>{
    const file=e.target.files?.[0];e.target.value='';if(!file||syncFromStorage())return;const expectedState=state,expectedSave=lastSavedValue,expectedSheet=sheetEpoch,wasSheetOpen=$('sheet').open,request=++importRequest;pendingRestore=null;if(file.size>10000000){toast('That file is too large. Choose a Wild Explorer JSON progress backup.');return;}
    try{
      const text=await file.text();if(request!==importRequest||sheetEpoch!==expectedSheet||(wasSheetOpen&&!$('sheet').open))return;
      if(syncFromStorage()||state!==expectedState||lastSavedValue!==expectedSave){toast('Your adventure changed while the backup was opening. Choose the backup again to review it.');return;}
      const data=JSON.parse(text);const raw=data?.app==='operation-wild-explorer'?data.state:data;
      if(!validSaveData(raw))throw new Error('Invalid save');
      pendingRestore=normalise(raw);
      openSheet(sheetHeader('Restore this adventure?')+`<div class="sheet-body"><p>This backup has <b>${pendingRestore.names.length} players</b>, <b>${pendingRestore.xp} XP</b>, <b>${pendingRestore.classic.index}/10 original crystals</b> and <b>${pendingRestore.index}/5 outing crystals</b> and <b>${pendingRestore.journal.length} memories</b>.</p><p>Restoring replaces the current progress, heroes and journal on this device. Export your current adventure first to keep both.</p><button class="btn quiet full" data-action="export">Export current progress first</button><button class="btn full" data-action="restore-confirmed">Restore this backup</button><button class="subtle-button wide" data-action="close-sheet">Keep current progress</button></div>`);
    }catch{if(request!==importRequest||sheetEpoch!==expectedSheet||(wasSheetOpen&&!$('sheet').open))return;pendingRestore=null;toast('That isn’t a valid Wild Explorer progress backup. Nothing was changed.');}
  });
  // Actions save immediately. Unload/background saves can overwrite a newer tab.
  window.addEventListener('pagehide',()=>{stopNarration();magicSound.stop();voicePack?.cancel();pauseCompass();});
  document.addEventListener('visibilitychange',()=>{document.body.classList.toggle('qm-effects-paused',document.hidden);if(document.hidden){magicSound.stop();pauseCompass();stopNarration();}else syncFromStorage();});
  window.addEventListener('focus',()=>syncFromStorage());
  window.addEventListener('pageshow',()=>syncFromStorage());
  window.addEventListener('orientationchange',()=>{if(compassListening){compassHeading=null;compassMode='waiting';compassMessage='Orientation changed. Hold the phone flat, face up, in portrait for a fresh reading.';updateCompass();}});
  window.addEventListener('storage',event=>{if((!event.storageArea||event.storageArea===localStorage)&&(event.key===SAVE_KEY||event.key===null))syncFromStorage();});
  // First-launch migration is non-destructive; the original save fields remain usable.
  if(importedLegacy)save();
  enrichLatestPostcard();
  save();
  renderAll();
  if(importedLegacy)setTimeout(()=>toast('Your original heroes, XP and crystals are back. Welcome to the new forest!'),700);
  if('serviceWorker'in navigator && window.isSecureContext){
    let hadController=!!navigator.serviceWorker.controller,reloading=false;
    navigator.serviceWorker.addEventListener('controllerchange',()=>{if(hadController&&!reloading){reloading=true;window.location.reload();}hadController=true;});
    window.addEventListener('load',async()=>{
      try{
        swRegistration=await navigator.serviceWorker.register('./sw.js',{updateViaCache:'none'});
        if(swRegistration.waiting)$('update-banner').hidden=false;
        swRegistration.addEventListener('updatefound',()=>{const worker=swRegistration.installing;worker?.addEventListener('statechange',()=>{if(worker.state==='installed'&&navigator.serviceWorker.controller)$('update-banner').hidden=false;});});
        await navigator.serviceWorker.ready;
        void verifyOffline(false);
      }catch{/* An unavailable offline cache must never prevent online gameplay. */}
    });
  }
})();
