/* Operation Wild Explorer 2.0.0 — static, camera-free, mobile-first.
   No API keys, analytics, remote scripts, or location uploads.
   New saves migrate from and mirror the original wildExplorerSave key. */
'use strict';
(() => {
  const VERSION = '3.0.0';
  const E = window.WildEngine;
  const SPECIALTIES = {scout:{label:'Scout',emoji:'🔎',hint:'Point out a colour, shape or tiny detail.'},listener:{label:'Listener',emoji:'👂',hint:'Invite everyone to pause and notice a quiet sound.'},detective:{label:'Detective',emoji:'🧩',hint:'Ask a curious question and connect two discoveries.'}};
  const DEFAULT_SPECIALTIES = ['scout','listener','detective','scout','listener'];
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
    {id:'wizard',label:'Nature Wizard',emoji:'🧙',power:'Wonder magic',description:'You turn ordinary discoveries into extraordinary stories.'},
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
      tasks:[['Spot a rock with a pattern','Find a patterned tree trunk','Look for something with stripes or spots'],['Find a round-looking stone','Find a round shape in nature','Make a pretend round stone with your hands'],['Point to a rock bigger than your shoe','Find a tree trunk wider than your shoe','Make a big shape with your arms']],
      symbols:['🪨','⭕','👟'],celebrate:'You solved the stone giant’s riddle. The Stone Crystal is yours!'},
    {id:'sound',title:'The Whispering Woodland',short:'Forest sounds',icon:'bird',colour:'#eaba31',light:'#fff096',dark:'#a27812',xp:80,gem:'💛 Sound Crystal',
      story:'Shhh… the forest has a message. Stand safely beside a grown-up, use your listening ears, and keep your eyes open.',
      tasks:[['Listen for a bird call','Listen for any quiet outdoor sound','Make a tiny pretend bird sound'],['Listen for rustling leaves','Listen to the breeze','Listen to your own gentle footsteps'],['Listen quietly for 10 seconds','Count to five together in whispers','Name one sound you heard today']],
      symbols:['🐦','🍃','👂'],celebrate:'Your super listening unlocked the shimmering Sound Crystal!'},
    {id:'sky',title:'The Escarpment Lookout',short:'Treetop wonders',icon:'tree',colour:'#329dcd',light:'#97eaff',dark:'#2469a0',xp:100,gem:'💙 Sky Crystal',
      story:'Our lookout is right here on the safe path! Look for tall trees and funny branch shapes. No stairs, edges, or climbing needed.',
      tasks:[['Spot a tree taller than a house','Find the tallest tree you can see','Stretch up tall like a tree'],['Find interesting tree bark','Find a tree with two colours','Look for a bumpy pattern in nature'],['Spot a branch shaped like a letter','Find a branch that makes a Y','Make a Y with your arms']],
      symbols:['🌳','🔍','🙌'],celebrate:'Your wonderful noticing brought the Sky Crystal back to life!'},
    {id:'guardian',title:'The Guardian’s Final Spell',short:'Our magic finale',icon:'sparkles',colour:'#ed967b',light:'#ffdf9e',dark:'#b75c8d',xp:120,gem:'🌈 Guardian Crystal',
      story:'One final crystal needs all five heroes! Share your favourite discoveries and give the forest a friendly thank-you.',
      tasks:[['Everyone shares a favourite find','Everyone points to something they like','Each explorer chooses a favourite colour'],['Count five trees together','Count five leaves without picking them','Hold up five fingers for your five heroes'],['Give the forest a thank-you wave','Give your team a gentle high-five','Say a quiet thank-you to the forest']],
      symbols:['💬','🌳','👋'],celebrate:'All five crystals are home! Your family are the new Forest Guardians.'}
  ];
  const CATEGORIES = {
    leaf:{emoji:'🍃',label:'Leaf',idea:'Imagine a tiny forest dragon lives under that leaf. What colour would its wings be?'},
    bird:{emoji:'🐦',label:'Bird',idea:'Watch from a distance. Can your team make up a whispery name for the bird’s song?'},
    stone:{emoji:'🪨',label:'Rock',idea:'Leave the rock where it is. Does its shape remind you of a sleeping giant?'},
    bug:{emoji:'🐞',label:'Bug',idea:'Give the little bug lots of space. Imagine it is a royal messenger—what is its message?'},
    tree:{emoji:'🌳',label:'Tree',idea:'This could be the Forest Guardian’s home! What friendly name would you give the tree?'},
    sound:{emoji:'👂',label:'Sound',idea:'Make up a quiet story about that sound. Was it a secret forest hello?'},
    flower:{emoji:'🌼',label:'Flower',idea:'Leave the flower growing. Imagine it is a tiny lantern. What colour does it glow?'},
    other:{emoji:'✨',label:'Wonder',idea:'What could this discovery become in our magical story? Share one silly idea each!'}
  };
  const freshState = () => ({version:3,expedition:null,specialties:[...DEFAULT_SPECIALTIES],index:0,checks:[false,false,false],variants:[0,0,0],xp:0,gems:[],
    names:['Adult 1','Adult 2','Child 1','Child 2','Child 3'],roles:ROLES.map(r=>r.id),
    looks:[{skin:1,hair:0,colour:0,long:false},{skin:2,hair:1,colour:1,long:true},{skin:0,hair:0,colour:2,long:false},{skin:2,hair:1,colour:3,long:true},{skin:1,hair:2,colour:4,long:false}],
    leader:2,park:'Chedoke Radial Recreational Trail',start:'120 Beddoe Dr, Hamilton',journal:[],settings:{sound:false,motion:true}});
  function normalise(raw) {
    const d=freshState();
    if(!raw || typeof raw !== 'object' || Array.isArray(raw)) return d;
    d.index=clampInt(raw.index,0,5); d.xp=clampInt(raw.xp,0,1000000);
    d.checks=[0,1,2].map(i=>raw.checks?.[i] === true); if(d.index===5) d.checks=[false,false,false];
    d.variants=[0,1,2].map(i=>clampInt(raw.variants?.[i],0,2));
    d.gems=MISSIONS.slice(0,d.index).map(m=>m.gem);
    d.names=d.names.map((name,i)=>clean(raw.names?.[i],24)||name);
    d.roles=d.roles.map((role,i)=>raw.roles?.[i] ? ROLE(raw.roles[i]).id : role);
    d.looks=d.looks.map((look,i)=>{const r=raw.looks?.[i];return r && typeof r==='object'?{skin:clampInt(r.skin,0,3,look.skin),hair:clampInt(r.hair,0,3,look.hair),colour:clampInt(r.colour,0,4,look.colour),long:typeof r.long==='boolean'?r.long:look.long}:look;});
    d.leader=clampInt(raw.leader,0,4,2);
    d.park=clean(raw.park,100)||d.park;d.start=clean(raw.start,120)||d.start;
    d.settings={sound:raw.settings?.sound===true,motion:raw.settings?.motion!==false};
    if(Array.isArray(raw.journal)) d.journal=raw.journal.slice(-150).filter(e=>e&&typeof e==='object'&&CATEGORIES[e.category]&&clean(e.note,280)).map(e=>({category:e.category,note:clean(e.note,280),at:Number.isFinite(new Date(e.at).getTime())?new Date(e.at).toISOString():new Date().toISOString()}));
    d.specialties=DEFAULT_SPECIALTIES.map((x,i)=>SPECIALTIES[raw.specialties?.[i]]?raw.specialties[i]:x);
    d.expedition=E.normaliseExpansion(raw.expedition,d);
    return d;
  }
  let saveIssue='', importedLegacy=false;
  function loadState(){
    try{
      for(const key of [SAVE_KEY,OLD_KEY]){
        const raw=localStorage.getItem(key);if(!raw)continue;
        try{const parsed=JSON.parse(raw);if(parsed&&typeof parsed==='object'&&!Array.isArray(parsed)){importedLegacy=key===OLD_KEY;return normalise(parsed);}}catch{/* Try the original save next, without destroying the unreadable copy. */}
      }
    }catch{saveIssue='This browser is blocking saved progress. You can play, but use Settings → Export backup before closing.';}
    return freshState();
  }
  let state=loadState();
  state.expedition=E.normaliseExpansion(state.expedition,state);
  function showSaveIssue(){const el=$('save-warning');el.textContent=saveIssue;el.hidden=!saveIssue;}
  function save(){
    try{
      localStorage.setItem(SAVE_KEY,JSON.stringify(state));
      // Mirror only the fields the original release understands.
      localStorage.setItem(OLD_KEY,JSON.stringify({index:state.index,checks:state.checks,xp:state.xp,gems:state.gems,names:state.names,roles:state.roles.map(r=>ROLE(r).emoji+' '+ROLE(r).label),park:state.park,start:state.start}));
      saveIssue='';
    }catch{saveIssue='Progress could not be saved on this device. Use Settings → Export backup before closing the game.';}
    showSaveIssue();
  }
  let activeTab='home', treasureTab='crystals', toastTimer=null, audioContext=null, sheetReturn=null, draftHero=null, speechActive=false;
  let locationFix=null,gpsBusy=false,gpsError='',gpsRequestId=0,swRegistration=null;
  let uid=0, offlineReady=false, photoBusy=false, viewedPostcardId=null, challengeTapUntil=0;
  const active=()=>state.expedition.active;
  const currentCard=()=>E.getCurrentCard(state.expedition);
  const specialty=i=>SPECIALTIES[state.specialties[i]]||SPECIALTIES.scout;
  const completedCount=()=>active().done.length;
  const optionLabel=value=>String(value).replace(/\b\w/g,c=>c.toUpperCase());
  const currentMission=()=>MISSIONS[Math.min(state.index,4)];
  const taskText=i=>currentMission().tasks[i][state.variants[i]||0];
  const isChedoke=()=>/chedoke/i.test(state.park);
  const storyTitle=()=>isChedoke()?'THE LOST CRYSTALS OF CHEDOKE':'THE LOST FOREST CRYSTALS';
  const fox = () => `<svg class="fox" viewBox="0 0 100 108" aria-hidden="true"><path d="M15 66 7 11l31 19c12-5 21-5 31 0l24-19-6 55c3 24-18 34-37 38C25 99 9 88 15 66Z" fill="#e9974c" stroke="#a86737" stroke-width="3" stroke-linejoin="round"/><path d="m15 22 7 31 15-17Zm69 0-6 31-14-17Z" fill="#753f31"/><path d="M15 66c9-10 26-3 35 8 12-14 27-16 36-8 3 17-17 31-36 37C27 97 13 84 15 66" fill="#fff4d7"/><ellipse cx="31" cy="58" rx="5" ry="6" fill="#324333"/><ellipse cx="68" cy="58" rx="5" ry="6" fill="#324333"/><circle cx="32" cy="56" r="1.5" fill="white"/><circle cx="69" cy="56" r="1.5" fill="white"/><path d="M43 75q7-6 14 0l-7 8Z" fill="#364535"/><path d="M50 81v7m-8-1q8 8 16 0" fill="none" stroke="#694b35" stroke-width="2.5" stroke-linecap="round"/><ellipse cx="26" cy="70" rx="6" ry="3" fill="#eeb187"/><ellipse cx="74" cy="70" rx="6" ry="3" fill="#eeb187"/></svg>`;
  function gem(m,className=''){
    const id='gem-'+(++uid);return `<svg class="${className}" viewBox="0 0 80 128" role="img" aria-label="${esc(m.gem.replace(/^[^A-Za-z]+/,''))}"><defs><linearGradient id="${id}" x2="1" y2="1"><stop stop-color="${m.light}"/><stop offset=".55" stop-color="${m.colour}"/><stop offset="1" stop-color="${m.dark}"/></linearGradient></defs><path d="M40 4 68 33 65 88 40 123 15 88 12 33Z" fill="url(#${id})" stroke="${m.dark}" stroke-width="3" stroke-linejoin="round"/><path d="M40 4 29 37 40 123 51 37Z" fill="${m.light}" opacity=".65"/><path d="m12 33 17 4 11 86-25-35Z" fill="${m.dark}" opacity=".45"/><path d="m51 37 17-4-3 55-25 35Z" fill="${m.dark}" opacity=".75"/><path d="m40 4 11 33 17-4Z" fill="${m.light}" opacity=".5"/><path d="m12 33 17 4 22 0 17-4M29 37l11-33M51 37 40 123" fill="none" stroke="white" stroke-opacity=".35" stroke-width="1.5"/><path d="m25 29 9-13-4 20Z" fill="white" opacity=".9"/></svg>`;
  }
  function avatar(index,look=state.looks[index]){
    const adult=index<2, colour=PALETTE[look.colour],skin=SKINS[look.skin],hair=HAIR[look.hair];
    const id='hero-'+(++uid),stroke='#3e5141';
    const bodyY=adult?144:150, footY=adult?237:230;
    return `<svg viewBox="0 0 180 264" aria-hidden="true" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="${id}-shirt" x2="0" y2="1"><stop stop-color="${colour}"/><stop offset="1" stop-color="${colour}" stop-opacity=".78"/></linearGradient><linearGradient id="${id}-skin" x2="0" y2="1"><stop stop-color="${skin}"/><stop offset="1" stop-color="${skin}"/></linearGradient></defs><g transform="${adult?'translate(0 0)':'translate(9 24) scale(.9)'}">
    <ellipse cx="90" cy="251" rx="51" ry="7" fill="#5a744b" opacity=".16"/>
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
    <path d="M43 52 49 24q9-10 25-9l15 4 14-4q23-2 29 11l8 30Z" fill="${colour}" stroke="${stroke}" stroke-width="3" stroke-linejoin="round"/>
    <path d="m44 45 95 2 1 12-99-2Z" fill="#455b3d"/>
    <path d="M25 54q-8 11 11 14 60 8 112-1 16-4 8-13-7-9-30-3-37 9-74 0-17-4-27 3Z" fill="${colour}" stroke="${stroke}" stroke-width="3"/>
    <path d="M32 56q57 20 115 0" fill="none" stroke="#fffce2" stroke-opacity=".35" stroke-width="3"/>
    <path d="m91 23-10 11 6-1-8 9h24l-9-9 7 1Z" fill="#fbe389" stroke="${stroke}" stroke-width="1.5"/>
    <path d="m156 ${bodyY-18} 1 10m8-12-2 11" stroke="#ae7a53" stroke-width="1.5" stroke-linecap="round"/></g>
    </svg>`;
  }
  const motionAllowed=()=>state.settings.motion&&!window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function toast(message){clearTimeout(toastTimer);$('toast').textContent=message;$('toast').hidden=false;toastTimer=setTimeout(()=>$('toast').hidden=true,3200);}
  function playSound(win=false){
    if(!state.settings.sound)return;
    try{
      const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio)return;
      audioContext ||= new Audio();
      const play=()=>{const notes=win?[523.25,659.25,783.99,1046.5]:[659.25];const base=audioContext.currentTime;notes.forEach((freq,i)=>{const o=audioContext.createOscillator(),g=audioContext.createGain();o.type='sine';o.frequency.value=freq;g.gain.setValueAtTime(0,base+i*.12);g.gain.linearRampToValueAtTime(.045,base+i*.12+.015);g.gain.exponentialRampToValueAtTime(.001,base+i*.12+.24);o.connect(g);g.connect(audioContext.destination);o.start(base+i*.12);o.stop(base+i*.12+.27);});};
      if(audioContext.state==='suspended')audioContext.resume().then(play).catch(()=>{});else play();
    }catch{/* Sound is optional; no game action depends on it. */}
  }
  function confetti(){if(!motionAllowed())return;const box=$('confetti');box.replaceChildren();['#efbf4c','#6bb765','#75bed0','#c999d4','#ed9d82'].forEach((c,k)=>{for(let i=0;i<6;i++){const el=document.createElement('i');el.style.setProperty('--piece',c);el.style.setProperty('--left',`${Math.random()*100}%`);el.style.setProperty('--delay',`${Math.random()*.35}s`);box.append(el);}});setTimeout(()=>box.replaceChildren(),2800);}
  function readQuest(){
    if(!('speechSynthesis' in window)||typeof SpeechSynthesisUtterance==='undefined'){toast('Read-aloud is unavailable here. A grown-up can read the card.');return;}
    if(speechActive){speechSynthesis.cancel();speechActive=false;toast('Narration stopped.');return;}
    const card=currentCard();
    const text=card?`${card.type}. ${card.title}. ${card.prompt}. ${card.alternativeActive?card.alternative:''}`:'Your discoveries brought the map together. Share your favourite memory.';
    try{speechSynthesis.cancel();const say=new SpeechSynthesisUtterance(text+' Stay together on the safe path.');say.lang='en-CA';say.rate=.85;say.pitch=1.04;
      const voices=speechSynthesis.getVoices(),voice=voices.find(v=>v.localService&&/^en/.test(v.lang));if(voice)say.voice=voice;
      say.onend=()=>{speechActive=false;};say.onerror=()=>{speechActive=false;toast('That voice is unavailable. A grown-up can read the card.');};speechActive=true;speechSynthesis.speak(say);
    }catch{speechActive=false;toast('Read-aloud is unavailable. The text card is ready to read.');}
  }
  const safetyTip=()=>`<div class="guardian-tip">${fox()}<p><b>The Guardian’s golden rule</b>Stay together on marked paths. Look, don’t pick. Grown-ups choose where to walk.</p></div>`;
  function renderStatus(){
    $('level-text').textContent='Family level '+(1+Math.floor(state.xp/100));$('xp-text').textContent=state.xp+' XP';
    const percent=state.xp%100;$('xp-fill').style.width=percent+'%';$('xp-meter').setAttribute('aria-valuenow',String(percent));$('xp-meter').setAttribute('aria-valuetext',`${percent} of 100 XP towards the next level`);
    $('gem-count').textContent=state.index+'/5';$('tiny-gem').innerHTML=gem(MISSIONS[0]);
    document.body.classList.toggle('motion-off',!state.settings.motion);
    showSaveIssue();
  }
  function partyRow(){return `<div class="party-row">${state.names.map((name,i)=>`<button class="party-member ${i===state.leader?'chosen':''}" data-action="hero" data-value="${i}" aria-label="Choose or customise ${esc(name)}, ${i<2?'adult':'child'}, ${esc(ROLE(state.roles[i]).label)}">${i===state.leader?'<span class="leader-dot" aria-label="Current leader">★</span>':''}<div class="avatar">${avatar(i)}</div><b>${esc(name)}</b></button>`).join('')}</div>`;}
  function renderHome(){
    const a=active(),complete=a.ended,started=a.done.length>0||a.chapter>0;
    $('home-screen').innerHTML=`<div class="storybook"><div class="scene-heading"><span class="eyebrow">A LITTLE QUEST. A BIG ADVENTURE.</span><h1>${complete?'Home with<br>new stories!':'Adventure is<br>calling!'}</h1></div><img class="cover-art" src="./assets/forest-friends-v2.webp" width="803" height="298" alt="Cheerful storybook forest friends in explorer hats with their playful dog"><div class="story-label">${esc(storyTitle())}</div></div>
      <div class="location-pill">${icon('pin')}<span>${esc(state.park)}</span></div>
      <button class="btn full" data-action="${complete?'postcards':'tab'}" ${complete?'':'data-value="quest"'}>${icon(complete?'book':'play')} ${complete?'Our adventure postcard':started?'Continue our adventure':'Let’s explore!'} ${icon('arrow')}</button>
      <div class="quick-actions"><button class="btn quiet" data-action="builder">${icon('compass')} ${complete?'Plan our next outing':'Plan this outing'}</button><button class="btn quiet" data-action="camp">⛺ Base camp</button></div>
      <p class="muted-note">${esc(optionLabel(a.options.habitat))} · ${esc(optionLabel(a.options.season))} · ${esc(optionLabel(a.options.duration))} · ${esc(optionLabel(a.options.difficulty))}</p>
      <div class="section-heading"><h2>Your little adventure team</h2><span>2 adults · 3 kids</span></div>${partyRow()}
      <p class="muted-note">Pass the pretend lead after each challenge. A grown-up guides the real walk.</p>
      <div class="mini-progress" aria-label="${a.claimedChapters.length} of 5 map pieces">${MISSIONS.map((m,i)=>`<span class="${a.claimedChapters.includes(i)?'won':i===a.chapter?'now':''}"></span>`).join('')}</div>
      <button class="btn quiet full" data-action="download-adventure">${icon('download')} ${offlineReady?'Adventure ready offline':'Download adventure for offline play'}</button>
      <p class="muted-note" id="home-offline-note">${offlineReady?'Game and artwork checked on this device. Keep this browser’s site data.':'Do this online before leaving. Progress saves after every challenge.'}</p>${safetyTip()}`;
  }
  function renderQuest(){
    const el=$('quest-screen'),a=active(),m=MISSIONS[Math.min(a.chapter,4)],card=currentCard();
    if(a.ended){el.innerHTML=`<span class="eyebrow">${a.claimedChapters.length===5?'FIVE PIECES. ONE FAMILY STORY.':'A LITTLE ADVENTURE COUNTS.'}</span><div class="complete-scene"><div class="trophy" aria-hidden="true">${a.claimedChapters.length===5?'🏆':'🌿'}</div><h2>${a.claimedChapters.length===5?'The forest is full<br>of your discoveries!':'A lovely place<br>to pause.'}</h2><p>${a.done.length} challenges explored together.<br>Your XP, crystals and base camp stay with you.</p></div>${a.claimedChapters.length===5&&!a.puzzleSolved?`<button class="btn gold full" data-action="puzzle">${icon('map')} Solve our discovery map</button>`:''}<button class="btn full" data-action="postcards">${icon('book')} Make our private postcard</button><button class="btn quiet full" data-action="builder">Plan another adventure</button>${safetyTip()}`;return;}
    const ready=E.isChapterReady(state.expedition),lead=specialty(state.leader),length=a.deck[a.chapter].length;
    el.innerHTML=`<div class="quest-head"><span class="eyebrow">CHAPTER ${a.chapter+1} OF 5 · ${esc(state.names[state.leader])} LEADS</span><button class="audio-button" data-action="read" aria-label="Read the challenge aloud, or stop narration">${icon('sound')}</button></div><h1 class="page-title">${esc(m.title)}</h1>
      <div class="chapter-strip">${MISSIONS.map((x,i)=>`<span class="map-piece ${a.claimedChapters.includes(i)?'found':''}" aria-label="Map piece ${i+1}${a.claimedChapters.includes(i)?' found':''}">${a.claimedChapters.includes(i)?'🧩':i+1}</span>`).join('')}</div>
      <div class="lead-banner"><div class="lead-avatar">${avatar(state.leader)}</div><p><b>${esc(state.names[state.leader])} · ${lead.emoji} ${lead.label}</b><span>${esc(lead.hint)}</span></p><button class="subtle-button" data-action="pass-lead">Pass lead</button></div>
      ${ready?`<div class="challenge-card ready"><span class="challenge-symbol">🧩</span><span class="eyebrow">YOUR MAP PIECE IS READY</span><h2>Wonderful teamwork!</h2><p>Your discoveries light up another piece of the Guardian’s map.</p><button class="btn gold full" data-action="claim" data-chapter="${a.chapter}">${icon('sparkles')} Claim crystal + ${m.xp} XP</button></div>`:card?`<article class="challenge-card"><div class="card-meta"><span class="type-chip type-${esc(card.type.toLowerCase())}">${esc(card.type)}</span><span>Challenge ${a.step+1} / ${length}</span></div><span class="challenge-symbol" aria-hidden="true">${card.emoji}</span><h2>${esc(card.title)}</h2><p class="challenge-prompt">${esc(card.prompt)}</p><details class="safe-alternative"><summary>No need to find it: a safe alternative</summary><p>${esc(card.alternative)}</p></details><p class="challenge-help">${esc(card.difficultyPrompt||'Point, describe or pretend. Everyone can join in their own way.')}</p><label class="field-label" for="clue-memory">What did we notice? <small>Optional</small></label><input class="text-field" id="clue-memory" maxlength="140" placeholder="A word, a colour, a little wonder…"><button class="btn full" data-action="complete-challenge" data-card="${esc(card.id)}" data-chapter="${a.chapter}" data-step="${a.step}">${icon('check')} We explored it!</button><button class="subtle-button wide" data-action="swap-challenge">Can’t find it? Try an easier way</button></article>`:''}
      <p class="story-connection">${esc(chapterStory(a.chapter))}</p><div class="quick-actions"><button class="btn quiet" data-action="rest">Take a break</button><button class="btn quiet" data-action="finish-early">Finish for today</button></div>${safetyTip()}`;
  }
  function chapterStory(chapter){
    const first=active().done.find(x=>x.note)?.note;
    return ['The Guardian’s map has scattered into five pieces. Each discovery brings a piece home.',first?`Your memory of “${first}” guides the stone giant. Now add a new kind of wonder.`:'Your colour clues helped the Guardian. What other wonders belong on the map?','The woodland adds its quiet voice to your map. Notice with more than your eyes.','Your map reaches the treetops in our imagination. Our feet stay on the safe path.','Bring your discoveries together. The final spell is a story only your family can tell.'][chapter]||'';
  }
  function renderHeroes(){
    $('heroes-screen').innerHTML=`<span class="eyebrow">FIVE HEROES. ONE GREAT TEAM.</span><h1 class="page-title">Meet your explorers</h1><p class="intro">Everyone has a special power. Tap a character to dress them up and choose who leads the next quest.</p><div class="hero-grid">${state.names.map((name,i)=>`<button class="hero-card ${i===state.leader?'selected':''}" data-action="hero" data-value="${i}"><span class="hero-type">${i<2?'GROWN-UP':'LITTLE HERO'}</span>${i===state.leader?'<span class="hero-selected" aria-label="Current leader">★</span>':''}<div class="hero-stage">${avatar(i)}</div><div class="hero-copy"><b>${esc(name)}</b><small>${specialty(i).emoji} ${specialty(i).label}</small></div></button>`).join('')}</div><div class="trophy-small"><span aria-hidden="true">🤝</span><p><b>Teamwork is our superpower.</b>All five explorers share ${state.xp} lifetime family XP. The pretend lead rotates after each challenge. No racing, no winners and losers—just exploring together.</p></div>${safetyTip()}`;
  }
  function renderTreasure(){
    const modes=[['crystals','Crystals'],['journal','Journal'],['camp','Base camp'],['postcards','Postcards']];
    $('treasure-screen').innerHTML=`<span class="eyebrow">LITTLE WONDERS, BIG MEMORIES</span><h1 class="page-title">Our treasure chest</h1><div class="tab-switch treasure-switch">${modes.map(([id,label])=>`<button data-action="treasure-tab" data-value="${id}" aria-pressed="${treasureTab===id}">${label}</button>`).join('')}</div>${treasureTab==='journal'?renderJournal():treasureTab==='camp'?renderCamp():treasureTab==='postcards'?renderPostcards():`<div class="treasure-chest-scene">${icon('chest','big-chest')}<div><b>${state.index} crystals this outing</b><small>${state.xp} lifetime family XP</small></div></div><div class="gem-grid">${MISSIONS.map((m,i)=>`<button class="gem-card ${i>=state.index?'locked':''}" data-action="gem" data-value="${i}" aria-label="${esc(m.gem.replace(/^[^A-Za-z]+/,''))}, ${i<state.index?'collected':'locked'}">${gem(m)}<b>${esc(m.gem.replace(/^[^A-Za-z]+/,''))}</b><small>${i<state.index?'Collected together':'Chapter '+(i+1)}</small></button>`).join('')}</div><p class="muted-note">Collected crystals also give one spendable camp crystal each. Your crystal trophies always stay in the collection.</p><button class="btn full" data-action="camp">⛺ Visit our family base camp · ${state.expedition.wallet} to spend</button>`}`;
  }
  function renderJournal(){
    return `<p class="intro">What did your family discover? Tap a picture and let a grown-up write a tiny memory.</p><div class="discovery-grid">${Object.entries(CATEGORIES).map(([key,c])=>`<button data-action="discovery" data-value="${key}"><span aria-hidden="true">${c.emoji}</span>${c.label}</button>`).join('')}</div>
      ${state.journal.length?[...state.journal].reverse().map(e=>`<article class="journal-note"><header><span aria-hidden="true">${CATEGORIES[e.category].emoji}</span>${CATEGORIES[e.category].label}<time datetime="${esc(e.at)}">${esc(new Date(e.at).toLocaleDateString('en-CA',{month:'short',day:'numeric'}))}</time></header><p>${esc(e.note)}</p><small>Guardian’s story idea: ${esc(discoveryIdea(e.category,e.note))}</small></article>`).join(''):'<div class="empty-box"><span class="empty-icon" aria-hidden="true">📖</span>Your first forest memory belongs here.<br>Look around—what makes you smile?</div>'}
      <p class="muted-note">Memories stay on this device. Guardian ideas are playful offline prompts, not AI species identification.</p>`;
  }
  function renderTrail(){
    $('trail-screen').innerHTML=`<span class="eyebrow">OUR FIVE-CRYSTAL JOURNEY</span><h1 class="page-title">The story trail</h1><p class="intro">Collect five map pieces, then solve a puzzle with your own discoveries. This is your <b>story map</b>, not a walking route or a map of real landmarks.</p>
      <div class="story-map">${icon('leaf','map-leaf')}${MISSIONS.map((m,i)=>`<button class="map-stop ${i<state.index?'completed':i===state.index?'current':'locked'}" data-action="map-stop" data-value="${i}" aria-label="Quest ${i+1}: ${esc(m.short)}, ${i<state.index?'complete':i===state.index?'current':'locked'}"><span class="node">${icon(i<state.index?'check':i===state.index?m.icon:'lock')}</span><span class="map-label"><b>${esc(m.short)}</b><small>${i<state.index?'Map piece + crystal found':i===state.index?'Your next story chapter':'Complete earlier chapters to reveal'}</small></span><span class="map-arrow" aria-hidden="true">${i===state.index?'›':''}</span></button>`).join('')}</div>
      ${active().claimedChapters.length===5?`<button class="btn gold full" data-action="puzzle">${icon('map')} ${active().puzzleSolved?'Our completed discovery map':'Solve the final map puzzle'}</button>`:''}<form id="place-form" class="panel"><h3>${icon('pin')} Our exploring spot</h3><label class="field-label" for="park-name">Park or trail</label><input class="text-field" id="park-name" name="park" value="${esc(state.park)}" maxlength="100" required><label class="field-label" for="start-point">Starting point</label><input class="text-field" id="start-point" name="start" value="${esc(state.start)}" maxlength="120"><button class="btn quiet full" type="submit" style="margin-top:14px">Save this adventure location</button><p class="small">The name personalises your story. The woodland clues are pre-written; this version doesn’t research parks or generate GPS-based quests.</p></form>
      <section class="panel"><h3>Optional explorer GPS</h3><p class="small">Take one location reading when you ask. There is no background tracking, no stored location history, and no coordinate upload.</p><div class="gps-box" id="gps-display" role="status" aria-live="polite">${gpsDisplay()}</div><div class="gps-actions"><button class="btn blue" data-action="gps" ${gpsBusy?'disabled':''}>${icon('pin')} ${gpsBusy?'Finding you…':locationFix?'Update location':'Use my GPS'}</button><button class="btn quiet" data-action="clear-gps" ${!locationFix&&!gpsBusy?'disabled':''}>Clear</button></div><p class="small">GPS cannot tell you whether a route is safe. Follow posted signs and a grown-up’s judgement. The game works without location permission.</p></section>
      <div class="safe-note"><b>Safe exploring at Chedoke or any park:</b> stay on marked paths, away from cliff edges, water and wildlife. Do not climb or enter closed trails to finish a mission. Swap a clue instead.</div>`;
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
    if('speechSynthesis'in window)speechSynthesis.cancel();speechActive=false;
    activeTab=tab;renderAll();
    document.querySelectorAll('[data-screen]').forEach(el=>el.hidden=el.dataset.screen!==tab);
    document.querySelectorAll('.bottom-nav [data-action="tab"]').forEach(el=>{if(el.dataset.value===tab)el.setAttribute('aria-current','page');else el.removeAttribute('aria-current');});
    window.scrollTo({top:0,behavior:'auto'});
  }
  function openSheet(content){
    const dialog=$('sheet');if(!dialog.open)sheetReturn=document.activeElement;
    $('sheet-content').innerHTML=content;
    if(!dialog.open)dialog.showModal();
    dialog.scrollTop=0;
  }
  const sheetHeader=title=>`<div class="sheet-top"><h2 id="sheet-title">${esc(title)}</h2><button data-action="close-sheet" aria-label="Close">${icon('close')}</button></div>`;
  function closeSheet(){const dialog=$('sheet');if(dialog.open)dialog.close();}
  $('sheet').addEventListener('close',()=>{draftHero=null;const target=sheetReturn;if(target?.isConnected)target.focus({preventScroll:true});else $('settings-button').focus({preventScroll:true});});
  $('sheet').addEventListener('click',e=>{if(e.target===$('sheet')){const r=$('sheet').getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)closeSheet();}});
  function openHero(index){
    index=clampInt(index,0,4);
    draftHero={index,name:state.names[index],role:state.roles[index],specialty:state.specialties[index],look:{...state.looks[index]}};
    const r=ROLE(draftHero.role);
    openSheet(sheetHeader('Choose your explorer')+`<form class="sheet-body" id="hero-form"><div class="hero-preview"><div id="avatar-preview">${avatar(index,draftHero.look)}</div><div class="power"><span class="eyebrow">${index<2?'GROWN-UP HERO':'LITTLE HERO'}</span><b id="hero-power">${esc(r.power)}</b><p id="hero-power-desc">${esc(r.description)}</p></div></div>
      <label class="field-label" for="hero-name">Explorer name</label><input class="text-field" id="hero-name" name="name" value="${esc(draftHero.name)}" maxlength="24" autocomplete="off" required>
      <label class="field-label" for="hero-role">Special role</label><select class="text-field" id="hero-role" name="role">${ROLES.map(role=>`<option value="${role.id}" ${draftHero.role===role.id?'selected':''}>${role.emoji} ${role.label}</option>`).join('')}</select>
      <label class="field-label" for="hero-specialty">Team specialty</label><select class="text-field" id="hero-specialty">${Object.entries(SPECIALTIES).map(([id,s])=>`<option value="${id}" ${draftHero.specialty===id?'selected':''}>${s.emoji} ${s.label}</option>`).join('')}</select><p class="helper">Scout spots details, Listener notices sounds, Detective connects clues. No one is locked out of any challenge.</p>
      <label class="field-label">Outfit colour</label><div class="swatch-row" id="outfit-swatches">${PALETTE.map((c,i)=>`<button type="button" data-action="swatch" data-kind="colour" data-value="${i}" style="--swatch:${c}" aria-label="${['Sky blue','Berry pink','Leaf green','Violet purple','Sunshine yellow'][i]} outfit" aria-pressed="${i===draftHero.look.colour}">${i===draftHero.look.colour?'✓':''}</button>`).join('')}</div>
      <label class="field-label">Skin tone</label><div class="swatch-row" id="skin-swatches">${SKINS.map((c,i)=>`<button type="button" data-action="swatch" data-kind="skin" data-value="${i}" style="--swatch:${c}" aria-label="Skin tone ${i+1}" aria-pressed="${i===draftHero.look.skin}">${i===draftHero.look.skin?'✓':''}</button>`).join('')}</div>
      <label class="field-label">Hair colour</label><div class="swatch-row" id="hair-swatches">${HAIR.map((c,i)=>`<button type="button" data-action="swatch" data-kind="hair" data-value="${i}" style="--swatch:${c}" aria-label="${['Brown','Dark brown','Auburn','Golden'][i]} hair" aria-pressed="${i===draftHero.look.hair}">${i===draftHero.look.hair?'✓':''}</button>`).join('')}</div>
      <div class="settings-row"><div><b>Longer hair</b><small>Change your character’s look</small></div><button type="button" class="switch" role="switch" aria-label="Longer hair" aria-checked="${draftHero.look.long}" data-action="long-hair"></button></div>
      <button class="btn full" type="submit">${icon('star')} Save & make me the leader</button><p class="helper">A grown-up still leads the real walk. Names and character choices are saved only on this device.</p></form>`);
  }
  function updateHeroPreview(){if(!draftHero)return;$('avatar-preview').innerHTML=avatar(draftHero.index,draftHero.look);const r=ROLE(draftHero.role);$('hero-power').textContent=r.power;$('hero-power-desc').textContent=r.description;}
  function claimCrystal(expectedChapter){
    const before=active().chapter;if(expectedChapter!==undefined&&Number(expectedChapter)!==before)return;
    const result=E.finishChapter(state.expedition,before);if(!result.changed)return;
    state.expedition=result.expansion;state.xp+=result.xp;state.index=active().claimedChapters.length;state.gems=MISSIONS.slice(0,state.index).map(m=>m.gem);state.checks=[false,false,false];state.variants=[0,0,0];
    enrichLatestPostcard();save();renderAll();playSound(true);confetti();const m=MISSIONS[before];
    openSheet(`<div class="sheet-top"><span class="eyebrow">A MAP PIECE AND A CRYSTAL!</span><button data-action="close-sheet" aria-label="Close reward">${icon('close')}</button></div><div class="reward-body">${gem(m,'reward-crystal')}<h2 id="sheet-title">Piece ${before+1} is home!</h2><p>${esc(m.celebrate)}</p><div class="xp-reward">${icon('star')} +${result.xp} family XP · +1 camp crystal</div><button class="btn full" data-action="next-quest">${active().ended?'Bring our map together':'On to the next chapter'} ${icon('arrow')}</button><button class="subtle-button wide" data-action="camp">Visit base camp</button></div>`);
  }
  function openGem(index){const m=MISSIONS[index];if(!m)return;if(index>=state.index){toast(`Finish quest ${index+1} to unlock this crystal.`);return;}openSheet(sheetHeader('A treasure you earned')+`<div class="reward-body">${gem(m,'reward-crystal')}<h2>${esc(m.gem.replace(/^[^A-Za-z]+/,''))}</h2><p>${esc(m.celebrate)}</p><span class="badge">Earned together · ${m.xp} XP</span><button class="btn quiet full" data-action="close-sheet">Back to our treasures</button></div>`);}
  function discoveryIdea(category,note){if(/mushroom|fungus|berry|berries|poison|snake|cliff|edge|waterfall/i.test(note))return 'A wonderful thing to notice from a safe distance. Stay on the path, don’t touch or taste it, and ask a grown-up before getting closer. What name would you give it in a pretend story?';return CATEGORIES[category].idea;}
  function openDiscovery(category){if(!CATEGORIES[category])return;const c=CATEGORIES[category];openSheet(sheetHeader(c.emoji+' A forest discovery')+`<form class="sheet-body" id="discovery-form" data-category="${category}"><p>Tell us about your ${c.label.toLowerCase()}. A word, a colour, or a little story is perfect.</p><label class="field-label" for="discovery-note">What did your family notice?</label><textarea class="text-field" id="discovery-note" name="note" rows="3" maxlength="280" placeholder="We spotted…" required></textarea><div class="bonus-idea"><b>The Guardian’s story idea</b><br>${esc(c.idea)}</div><button class="btn full" type="submit">${icon('book')} Save our discovery</button><p class="helper">This is a memory, not a species identification. Do not taste or handle unknown plants or animals.</p></form>`);}
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
    openSheet(sheetHeader('Grown-up corner')+`<div class="sheet-body"><div class="settings-row"><div><b>Celebration sounds</b><small>Short, gentle game sounds</small></div><button class="switch" role="switch" aria-label="Celebration sounds" aria-checked="${state.settings.sound}" data-action="setting" data-value="sound"></button></div><div class="settings-row"><div><b>Animations</b><small>Bouncing crystals and confetti</small></div><button class="switch" role="switch" aria-label="Animations" aria-checked="${state.settings.motion}" data-action="setting" data-value="motion"></button></div><button class="btn quiet full" data-action="download-adventure">${icon('download')} Download and verify offline adventure</button><button class="btn quiet full" data-action="install">${icon('home')} Play from your Home Screen</button><button class="btn quiet full" data-action="export">${icon('download')} Export progress backup</button><button class="btn quiet full" data-action="import">${icon('refresh')} Restore a progress backup</button><button class="btn quiet full" data-action="check-update">${icon('refresh')} Check for a game update</button><button class="subtle-button wide" data-action="new-adventure">Start a fresh adventure</button>
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
  function completeChallenge(button){
    if(Date.now()<challengeTapUntil)return;
    const a=active(),card=currentCard();if(!card)return;
    const r=E.completeChallenge(state.expedition,{cardId:button.dataset.card,expectedChapter:Number(button.dataset.chapter),expectedStep:Number(button.dataset.step),at:new Date().toISOString(),note:clean($('clue-memory')?.value,140),specialty:state.specialties[state.leader]});
    if(!r.changed)return;challengeTapUntil=Date.now()+500;state.expedition=r.expansion;state.leader=(state.leader+1)%5;
    state.checks=[0,1,2].map(i=>active().done.some(x=>x.chapter===active().chapter&&x.step===i));save();renderAll();playSound();
    toast(`${state.names[state.leader]} gets the next pretend lead!`);$('quest-screen').querySelector('.challenge-card')?.scrollIntoView({block:'nearest',behavior:'auto'});
  }
  function openFinishEarly(){
    openSheet(sheetHeader('A good ending for today')+`<div class="sheet-body"><p>Keep every discovery, crystal and XP you’ve already earned. There is no penalty for a shorter adventure.</p><p>The Guardian can finish the story right here: your family brought ${active().done.length} little wonders back to base camp.</p><p class="helper">Unfinished chapters don’t grant an extra crystal. You can also take a break and resume this exact challenge later.</p><button class="btn full" data-action="finish-confirmed">Finish our story & make a postcard</button><button class="btn quiet full" data-action="close-sheet">Keep our place and continue later</button></div>`);
  }
  function openBuilder(){
    const a=active(),o=a.options,hasProgress=a.done.length>0||a.claimedChapters.length>0;
    openSheet(sheetHeader(a.ended?'Plan our next adventure':'Shape our adventure')+`<form id="outing-form" class="sheet-body"><p>Five story chapters, with a mix of Find, Listen, Move, Imagine and Solve. Everything has an easy alternative.</p><div class="builder-grid">${[['habitat','Where',['woodland','park','garden','neighbourhood']],['season','Season',['spring','summer','autumn','winter']],['duration','Adventure length',['short','medium','long']],['difficulty','Challenge style',['gentle','curious','challenge']]].map(([name,label,values])=>`<label class="field-label" for="outing-${name}">${label}<select class="text-field" name="${name}" id="outing-${name}">${values.map(v=>`<option value="${v}" ${o[name]===v?'selected':''}>${name==='duration'?{short:'Short · 5 challenges · about 10–15 min',medium:'Medium · 10 challenges · about 20–30 min',long:'Long · 15 challenges · about 35–50 min'}[v]:optionLabel(v)}</option>`).join('')}</select></label>`).join('')}</div><p class="helper">Times are a loose guide, never a timer. Gentle uses one simple idea, Curious adds noticing, Challenge adds a little reasoning. Recent cards are avoided when there are enough choices.</p>${!a.ended&&hasProgress?'<p class="safe-note">Your current outing has discoveries. Finish it first to keep its postcard, or close this planner to continue it.</p><button class="btn quiet full" type="button" data-action="finish-early">Finish the current outing first</button>':`<button class="btn full" type="submit">${icon('compass')} ${a.ended?'Start our next adventure':'Build this adventure'}</button>`}<p class="helper">Heroes, lifetime XP, journal, camp purchases and previous postcards stay with you. No species sighting is ever required.</p></form>`);
  }
  function startPlannedOuting(form){
    const o=Object.fromEntries(new FormData(form).entries());let exp=state.expedition;
    if(active().ended){const r=E.startNext(exp,o,Date.now());if(!r.changed){toast('Finish the current outing first.');return;}exp=r.expansion;}
    else{if(active().done.length||active().claimedChapters.length){toast('Finish your current outing before planning another.');return;}exp={...exp,options:E.normaliseOptions(o),active:E.createOuting(o,exp.recentIds,Date.now())};}
    state.expedition=exp;state.index=0;state.gems=[];state.checks=[false,false,false];state.variants=[0,0,0];save();closeSheet();setTab('quest');toast('Your next five-chapter story is ready.');
  }
  function renderCamp(){
    const e=state.expedition,owned=e.owned||[],equipped=Object.values(e.equipped||{}),items=E.SHOP;
    const chosen=items.filter(x=>equipped.includes(x.id));
    return `<div class="camp-scene"><span class="camp-sun">☀️</span><div class="camp-trees">🌲 🌳 🌲</div><div class="camp-decor">${chosen.map(x=>`<span title="${esc(x.name)}">${x.emoji}</span>`).join('')||'⛺'}</div><b>Our family base camp</b><p>${chosen.map(x=>esc(x.name)).join(' · ')||'A cosy place for our next story'}</p></div><div class="wallet-line"><b>💎 ${e.wallet} camp crystals</b><span>Earned together · no real money</span></div><p class="intro">Spend crystal tokens to make camp your own. Your collected crystal trophies and family XP stay safe.</p><div class="camp-shop">${items.map(item=>{const has=owned.includes(item.id),on=equipped.includes(item.id);return `<article class="shop-card"><span class="shop-emoji" aria-hidden="true">${item.emoji}</span><h3>${esc(item.name)}</h3><p>${esc(item.description)}</p><button class="btn quiet full" data-action="${has?'equip-camp':'buy-camp'}" data-value="${esc(item.id)}" ${on||(!has&&e.wallet<item.cost)?'disabled':''}>${on?'At our camp':has?'Use at camp':`${item.cost} 💎 · Choose`}</button></article>`;}).join('')}</div><p class="helper">Camp and companions are pretend. We watch real animals from a distance.</p>`;
  }
  function buyCampItem(id){
    const item=E.SHOP.find(x=>x.id===id);if(!item)return;
    openSheet(sheetHeader('A little something for camp')+`<div class="reward-body"><span class="shop-emoji">${item.emoji}</span><h2>${esc(item.name)}</h2><p>Spend ${item.cost} of your ${state.expedition.wallet} camp crystals?</p><p class="helper">Pretend currency only. This stays in your family camp across outings.</p><button class="btn full" data-action="confirm-camp" data-value="${esc(id)}">Spend ${item.cost} camp crystals</button><button class="btn quiet full" data-action="close-sheet">Keep our crystals</button></div>`);
  }
  function equipCampItem(id){const r=E.equipItem(state.expedition,id);if(r.changed){state.expedition=r.expansion;save();renderTreasure();toast('Your camp has a new look.');}}
  function enrichLatestPostcard(){
    const p=state.expedition.postcards.find(x=>x.id===active().id)||state.expedition.postcards.at(-1);if(!p)return;
    p.park=p.park||state.park;p.date=p.date||p.createdAt||new Date().toISOString();p.heroes=p.heroes?.length?p.heroes:[...state.names];p.favorite=p.favorite||'';p.photoIds=p.photoIds||[];
    p.discoveries=p.done.map(d=>{const c=E.CARD_BY_ID[d.cardId];return {id:d.cardId,title:c?.title||'A little wonder',note:d.note||'',type:c?.type||'Find',emoji:c?.emoji||'🌿'};});
    p.badges=[p.endedEarly?'Little Adventure':'Five-piece Explorer',...new Set(p.done.map(d=>E.CARD_BY_ID[d.cardId]?.type).filter(Boolean)),...(p.puzzleSolved?['Map Storyteller']:[])];
  }
  function renderPostcards(){
    const cards=state.expedition.postcards;
    return `<p class="intro">A little keepsake from each outing. Postcards and chosen photos stay in this browser until you export a copy. Nothing is posted online.</p>${cards.length?`<div class="postcard-list">${[...cards].reverse().map(p=>`<button class="postcard-summary" data-action="view-postcard" data-value="${esc(p.id)}"><span aria-hidden="true">${p.endedEarly?'🌿':'💌'}</span><div><b>${esc(p.park||'Our family adventure')}</b><small>${esc(new Date(p.date||p.createdAt).toLocaleDateString('en-CA'))} · ${p.done.length} discoveries</small><p>${esc(p.favorite||'Add our favourite moment')}</p></div><span aria-hidden="true">›</span></button>`).join('')}</div>`:`<div class="empty-box"><span class="empty-icon">💌</span>Finish a full or shorter outing to make your first postcard.</div><button class="btn full" data-action="tab" data-value="quest">Back to our adventure</button>`}<p class="helper">Export your favourites before clearing website data. JSON backups keep postcard text and photo references, but not the photos themselves.</p>`;
  }
  async function openPostcard(id){
    const p=state.expedition.postcards.find(x=>x.id===id);if(!p)return;viewedPostcardId=id;
    openSheet(sheetHeader('Our private adventure postcard')+`<div class="sheet-body"><div class="postcard-preview"><span class="eyebrow">A LITTLE QUEST. A BIG MEMORY.</span><h2>${esc(p.park||'Our family adventure')}</h2><p>${esc(new Date(p.date||p.createdAt).toLocaleDateString('en-CA'))}</p><div class="postcard-badges">${(p.badges||[]).map(b=>`<span class="badge">${esc(b)}</span>`).join('')}</div><ul class="postcard-discoveries">${(p.discoveries||[]).map(d=>`<li><b>${esc(d.emoji||'🌿')} ${esc(d.title)}</b>${d.note?`<span>${esc(d.note)}</span>`:''}</li>`).join('')}</ul><div id="postcard-photos" class="postcard-photos"></div></div><form id="postcard-form" data-id="${esc(id)}"><label class="field-label" for="postcard-favorite">Our favourite moment</label><textarea class="text-field" id="postcard-favorite" rows="3" maxlength="280">${esc(p.favorite||'')}</textarea><button class="btn quiet full" type="submit">Save favourite moment</button></form><button class="btn quiet full" data-action="add-photo" data-value="${esc(id)}" ${photoBusy||p.photoIds.length>=4?'disabled':''}>${photoBusy?'Saving photo…':'Choose an optional photo'} (${p.photoIds.length}/4)</button><p class="helper">Grown-up choice: choose a JPEG, PNG or WebP image from this device. No photo is needed to complete any challenge. Images stay here, with location metadata removed. HEIC may need conversion first.</p><button class="btn full" data-action="export-postcard" data-value="${esc(id)}">${icon('download')} Download a private postcard</button><p class="helper">The downloaded HTML keepsake includes your text and any available photos. Open it in a browser; you choose whether to share it. No automatic sharing.</p></div>`);
    for(const photoId of p.photoIds){try{const data=await WildPostcards.loadPhoto(photoId);if(viewedPostcardId!==id||!$('postcard-photos'))return;const div=document.createElement('div');div.className='postcard-photo';if(data){const img=document.createElement('img');img.src=data;img.alt='Your chosen adventure photo';div.append(img);}else{div.textContent='This photo is unavailable on this browser. Add it again from your device.';}const button=document.createElement('button');button.type='button';button.className='subtle-button';button.dataset.action='remove-photo';button.dataset.value=id;button.dataset.photo=photoId;button.textContent='Remove photo';div.append(button);$('postcard-photos').append(div);}catch{toast('Photo storage is unavailable. Your postcard text is safe.');}}
  }
  async function removePostcardPhoto(id,photoId){const p=state.expedition.postcards.find(x=>x.id===id);if(!p)return;p.photoIds=p.photoIds.filter(x=>x!==photoId);save();try{await WildPostcards.deletePhoto(photoId);}catch{}void openPostcard(id);}
  async function exportPostcard(id){
    const p=state.expedition.postcards.find(x=>x.id===id);if(!p)return;
    if($('postcard-favorite')&&viewedPostcardId===id){p.favorite=clean($('postcard-favorite').value,280);save();}
    try{const result=await WildPostcards.exportPostcard(p,{photoIds:p.photoIds});toast(result?.missingPhotoIds?.length?'Postcard downloaded; some photos were unavailable.':'Your private postcard is ready to save.');}catch(error){toast(error.message||'Could not export. Your postcard is still on this device.');}
  }
  let puzzlePicked=[];
  function openPuzzle(){
    const puzzle=E.getPuzzle(state.expedition);if(!puzzle.available){toast('Bring home all five map pieces first.');return;}puzzlePicked=[];
    const done=active().puzzleSolved;
    openSheet(sheetHeader('The Guardian’s discovery map')+`<div class="sheet-body"><div class="puzzle-map">🧩 🌳 🧩<br>🧩 🦊 🧩</div><p>${done?'Your discoveries made the Guardian’s map whole. You are family storytellers!':'The last spell uses your own adventure. Put these three discoveries in the order you explored them.'}</p><p class="helper">No wrong-answer penalty. Tell the story together, or use your journey notes below.</p><div id="puzzle-progress" class="puzzle-progress" role="status">${done?'Map complete!':'First → Then → Last'}</div>${done?'':`<div class="puzzle-choices">${puzzle.choices.map(c=>`<button class="btn quiet full" data-action="puzzle-choice" data-value="${esc(c.id)}">${c.emoji} ${esc(c.title)}</button>`).join('')}</div>`}<details><summary>Our journey notes</summary><ol>${active().done.map(d=>`<li>${esc(E.CARD_BY_ID[d.cardId]?.title||'A little wonder')}${d.note?': '+esc(d.note):''}</li>`).join('')}</ol></details><button class="btn full" data-action="postcards">Our adventure postcard</button></div>`);
  }
  function choosePuzzle(id){
    const p=E.getPuzzle(state.expedition);if(!p.choices.some(c=>c.id===id)||puzzlePicked.includes(id))return;puzzlePicked.push(id);
    const button=$('sheet-content').querySelector(`[data-action="puzzle-choice"][data-value="${id}"]`);if(button)button.disabled=true;
    $('puzzle-progress').textContent=puzzlePicked.map(x=>E.CARD_BY_ID[x]?.emoji||'🧩').join(' → ');
    if(puzzlePicked.length!==p.answerIds.length)return;const r=E.solvePuzzle(state.expedition,puzzlePicked);
    if(r.changed){state.expedition=r.expansion;enrichLatestPostcard();save();confetti();openPuzzle();toast('Your family’s story made the map whole!');}
    else{puzzlePicked=[];$('puzzle-progress').textContent='Let’s try the story order again. Check our journey notes below.';$('sheet-content').querySelectorAll('[data-action="puzzle-choice"]').forEach(x=>x.disabled=false);}
  }
  async function verifyOffline(showMessage=true){
    if(!('serviceWorker'in navigator)||!window.isSecureContext){if(showMessage)toast('Offline play needs the HTTPS site in a supported browser.');return false;}
    try{
      const ready=await Promise.race([navigator.serviceWorker.ready,new Promise((_,reject)=>setTimeout(()=>reject(new Error('Offline setup is still running. Try again online in a moment.')),12000))]);
      swRegistration=ready;const worker=ready.active;if(!worker)throw new Error('Offline setup has not finished yet.');
      const result=await new Promise((resolve,reject)=>{const channel=new MessageChannel();const timer=setTimeout(()=>reject(new Error('Offline verification timed out. Try again while online.')),12000);channel.port1.onmessage=e=>{clearTimeout(timer);resolve(e.data);};worker.postMessage({type:'CHECK_OFFLINE'},[channel.port2]);});
      offlineReady=result.ready===true&&result.version===VERSION;if(!offlineReady)throw new Error('Offline files are incomplete. Stay online and try again, or install the waiting game update.');
      save();renderHome();if(showMessage)toast('Adventure and artwork are ready offline on this device.');return true;
    }catch(error){offlineReady=false;if(showMessage)toast(error.message||'Could not confirm offline files. Keep internet on for now.');return false;}
  }
  async function downloadAdventure(){const b=document.querySelector('[data-action="download-adventure"]');if(b)b.disabled=true;toast('Checking the game, challenge deck and artwork for offline use…');await verifyOffline(true);if(b?.isConnected)b.disabled=false;}
  $('postcard-photo').addEventListener('change',async event=>{
    const file=event.target.files?.[0];event.target.value='';const id=viewedPostcardId,p=state.expedition.postcards.find(x=>x.id===id);if(!file||!p||photoBusy||p.photoIds.length>=4)return;photoBusy=true;
    try{const photoId=await WildPostcards.storePhoto(file);const target=state.expedition.postcards.find(x=>x.id===id);if(target){target.photoIds.push(photoId);save();toast('Photo saved only on this device.');}else await WildPostcards.deletePhoto(photoId);}
    catch(error){toast(error.message||'Could not save the photo. The postcard still works without it.');}
    finally{photoBusy=false;if(viewedPostcardId===id)void openPostcard(id);}
  });

  document.addEventListener('click',e=>{
    const button=e.target.closest('button[data-action]');if(!button||button.disabled)return;
    const a=button.dataset.action,v=button.dataset.value;
    switch(a){
      case 'tab':setTab(v);break;
      case 'settings':openSettings();break;
      case 'builder':openBuilder();break;
      case 'complete-challenge':completeChallenge(button);break;
      case 'swap-challenge':{const r=E.swapChallenge(state.expedition);if(r.changed){state.expedition=r.expansion;save();renderQuest();toast('An easier way, with the same reward.');}break;}
      case 'pass-lead':state.leader=(state.leader+1)%5;save();renderQuest();renderHome();break;
      case 'finish-early':openFinishEarly();break;
      case 'finish-confirmed':{const r=E.finishEarly(state.expedition);if(r.changed){state.expedition=r.expansion;enrichLatestPostcard();save();}closeSheet();setTab('quest');break;}
      case 'camp':closeSheet();treasureTab='camp';setTab('treasure');break;
      case 'buy-camp':buyCampItem(v);break;
      case 'confirm-camp':{const r=E.buyItem(state.expedition,v);if(r.changed){state.expedition=r.expansion;save();closeSheet();renderTreasure();toast('A new treasure for your family base camp!');}else toast('That item is already owned or needs more crystals.');break;}
      case 'equip-camp':equipCampItem(v);break;
      case 'postcards':closeSheet();treasureTab='postcards';setTab('treasure');break;
      case 'view-postcard':void openPostcard(v);break;
      case 'add-photo':if(!photoBusy){viewedPostcardId=v;$('postcard-photo').click();}break;
      case 'remove-photo':void removePostcardPhoto(v,button.dataset.photo);break;
      case 'export-postcard':void exportPostcard(v);break;
      case 'download-adventure':void downloadAdventure();break;
      case 'puzzle':openPuzzle();break;
      case 'puzzle-choice':choosePuzzle(v);break;
      case 'close-sheet':closeSheet();break;
      case 'hero':openHero(Number(v));break;
      case 'swatch':{if(!draftHero)return;const kind=button.dataset.kind;if(!['skin','colour','hair'].includes(kind))return;draftHero.look[kind]=clampInt(v,0,kind==='colour'?4:3);button.parentElement.querySelectorAll('button').forEach(b=>{const picked=b===button;b.setAttribute('aria-pressed',String(picked));b.textContent=picked?'✓':'';});updateHeroPreview();break;}
      case 'long-hair':if(draftHero){draftHero.look.long=!draftHero.look.long;button.setAttribute('aria-checked',String(draftHero.look.long));updateHeroPreview();}break;
      case 'check':{const i=Number(v);if(state.index>=5||![0,1,2].includes(i))return;state.checks[i]=!state.checks[i];save();renderQuest();renderStatus();renderHome();const newButton=$('quest-screen').querySelector(`[data-action="check"][data-value="${i}"]`);newButton?.focus({preventScroll:true});if(state.checks[i]){playSound();if(state.checks.every(Boolean))toast('All three clues found! Your crystal is ready.');}break;}
      case 'swap':{const i=Number(v);if(state.index>=5||![0,1,2].includes(i)||state.checks[i])return;state.variants[i]=(state.variants[i]+1)%3;save();renderQuest();$('quest-screen').querySelector(`[data-action="swap"][data-value="${i}"]`)?.focus({preventScroll:true});toast('A new clue! Stay right on your safe path.');break;}
      case 'claim':claimCrystal(button.dataset.chapter);break;
      case 'next-quest':closeSheet();setTab('quest');break;
      case 'reward-bag':closeSheet();treasureTab='crystals';setTab('treasure');break;
      case 'gem':openGem(Number(v));break;
      case 'treasure-tab':treasureTab=['journal','camp','postcards'].includes(v)?v:'crystals';renderTreasure();break;
      case 'discovery':openDiscovery(v);break;
      case 'read':readQuest();break;
      case 'rest':openSheet(sheetHeader('Little explorer pause')+`<div class="reward-body">${fox()}<p>Find a safe spot with your grown-ups. Have a sip of water, take a rest, and decide together whether to keep exploring.</p><p><b>${saveIssue?'Use Export backup to keep your adventure.':'Your adventure is saved.'}</b> You can finish another day. There’s no timer to beat!</p><button class="btn full" data-action="close-sheet">Ready when we are</button></div>`);break;
      case 'map-stop':{const i=Number(v);if(i<state.index)openGem(i);else if(i===state.index)setTab('quest');else toast('Finish your current quest to open the next chapter.');break;}
      case 'gps':requestGPS();break;
      case 'clear-gps':gpsRequestId++;locationFix=null;gpsBusy=false;gpsError='';renderTrail();toast('Location reading cleared.');break;
      case 'setting':if(v==='sound'||v==='motion'){state.settings[v]=!state.settings[v];save();renderStatus();button.setAttribute('aria-checked',String(state.settings[v]));if(v==='sound'&&state.settings.sound)playSound();}break;
      case 'install':openInstall();break;
      case 'export':exportSave();break;
      case 'import':$('import-file').click();break;
      case 'restore-confirmed':if(pendingRestore){state=pendingRestore;pendingRestore=null;save();closeSheet();renderAll();toast('Your saved family adventure is restored.');}break;
      case 'new-adventure':newAdventurePrompt();break;
      case 'reset-confirmed':openBuilder();break;
      case 'check-update':void checkForUpdate();break;
      case 'update':if(swRegistration?.waiting)swRegistration.waiting.postMessage({type:'SKIP_WAITING'});else{toast('Checking for an update…');void checkForUpdate();}break;
    }
  });
  document.addEventListener('change',e=>{if(e.target.id==='hero-role'&&draftHero){draftHero.role=ROLE(e.target.value).id;updateHeroPreview();}});
  document.addEventListener('submit',e=>{
    const form=e.target;
    if(form.id==='outing-form'){
      e.preventDefault();startPlannedOuting(form);
    }else if(form.id==='postcard-form'){
      e.preventDefault();const card=state.expedition.postcards.find(x=>x.id===form.dataset.id);if(card){card.favorite=clean($('postcard-favorite').value,280);save();toast('Favourite moment saved on this device.');}
    }else if(form.id==='hero-form'){
      e.preventDefault();if(!draftHero)return;const i=draftHero.index;state.names[i]=clean($('hero-name').value,24)||freshState().names[i];state.roles[i]=ROLE($('hero-role').value).id;state.specialties[i]=SPECIALTIES[$('hero-specialty').value]?$('hero-specialty').value:'scout';state.looks[i]={...draftHero.look};state.leader=i;save();closeSheet();renderAll();toast(`${state.names[i]} is ready to lead the pretend quest!`);
    }else if(form.id==='place-form'){
      e.preventDefault();state.park=clean($('park-name').value,100)||freshState().park;state.start=clean($('start-point').value,120);save();renderAll();toast('Your adventure location is saved.');
    }else if(form.id==='discovery-form'){
      e.preventDefault();const note=clean($('discovery-note').value,280),category=form.dataset.category;if(!note||!CATEGORIES[category])return;
      if(state.journal.length>=150)state.journal.shift();state.journal.push({category,note,at:new Date().toISOString()});save();closeSheet();treasureTab='journal';setTab('treasure');toast('A little forest memory, saved!');
    }
  });
  let pendingRestore=null;
  $('import-file').addEventListener('change',async e=>{
    const file=e.target.files?.[0];e.target.value='';if(!file)return;if(file.size>2000000){toast('That file is too large. Choose a Wild Explorer JSON progress backup.');return;}
    try{
      const data=JSON.parse(await file.text());const raw=data?.app==='operation-wild-explorer'?data.state:data;
      if(!raw||typeof raw!=='object'||!Array.isArray(raw.names)||raw.names.length!==5||!Array.isArray(raw.checks)||!Number.isInteger(raw.index)||raw.index<0||raw.index>5||typeof raw.xp!=='number'||!Number.isFinite(raw.xp))throw new Error('Invalid save');
      pendingRestore=normalise(raw);
      openSheet(sheetHeader('Restore this adventure?')+`<div class="sheet-body"><p>This backup has <b>${pendingRestore.xp} XP</b>, <b>${pendingRestore.index} crystals</b> and <b>${pendingRestore.journal.length} memories</b>.</p><p>Restoring replaces the current progress, heroes and journal on this device. Export your current adventure first to keep both.</p><button class="btn quiet full" data-action="export">Export current progress first</button><button class="btn full" data-action="restore-confirmed">Restore this backup</button><button class="subtle-button wide" data-action="close-sheet">Keep current progress</button></div>`);
    }catch{pendingRestore=null;toast('That isn’t a valid Wild Explorer progress backup. Nothing was changed.');}
  });
  document.addEventListener('visibilitychange',()=>{if(document.hidden){if('speechSynthesis'in window)speechSynthesis.cancel();speechActive=false;save();}});
  window.addEventListener('pagehide',save);
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
