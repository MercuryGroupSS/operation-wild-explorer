/* Fantasy map + crystal presentation. No permissions, network, or reward writes. */
(function (root, factory) {
  'use strict';
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.WildQuestMagic = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  let sequence = 0;
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const integer = (value, low, high, fallback = low) => Number.isFinite(Number(value)) ? Math.max(low, Math.min(high, Math.floor(Number(value)))) : fallback;
  const colour = (value, fallback) => /^#[0-9a-f]{6}$/i.test(value || '') ? value : fallback;
  const DAY_PLACES = ['Emerald Glade', 'Whispering Stones', 'Echo Falls', 'Skywatch Grove', 'Guardian’s Gate'];
  const NIGHT_PLACES = ['Pumpkin Hollow', 'Shadow Garden', 'Moonlit Pool', 'Lantern Bridge', 'Starlight Gathering'];
  const CLASSIC_PLACES = ['Emerald Glade', 'Whispering Stones', 'Echo Falls', 'Skywatch Grove', 'Guardian’s Gate', 'Rainbow Vale', 'Sunbeam Meadow', 'Moonstone Cove', 'Kindness Garden', 'Crystal Summit'];
  const DAY_CLUES = ['Colours wake the first crystal.', 'A shape is hidden in plain sight.', 'A quiet discovery has a voice.', 'Look closely. Something small matters.', 'Your family’s discoveries hold the key.'];
  const NIGHT_CLUES = ['An invitation waits in the glow.', 'A friendly shape will join the parade.', 'The moon is listening for your discovery.', 'Something you made holds a clue.', 'There is a place for every hero.'];
  const POINTS = [[75,348],[251,294],[103,220],[253,145],[122,88]];
  const CLASSIC_POINTS = [[74,551],[251,501],[92,450],[252,398],[97,347],[253,297],[101,246],[252,195],[103,143],[244,91]];
  const miniIcon = name => {
    const paths = {check:'<path d="m6 12 4 4 8-9"/>',lock:'<rect x="6" y="10" width="12" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',compass:'<circle cx="12" cy="12" r="9"/><path d="m16 7-2 7-7 3 3-7Z"/>',chest:'<path d="M3 10V8a5 5 0 0 1 5-5h8a5 5 0 0 1 5 5v2ZM3 10h18v11H3ZM9 12h6v6H9Z"/>',x:'<path d="m6 5 12 14M18 5 6 19"/>'};
    return `<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${paths[name] || paths.compass}</svg>`;
  };
  function model(state, missions, classicMissions) {
    const classic = state?.mode === 'classic';
    const active = state?.expedition?.active || {};
    const night = !classic && active.options?.theme === 'halloween';
    const source = (classic ? classicMissions : missions) || [];
    const total = classic ? 10 : 5;
    const claimed = classic ? Array.from({length:integer(state?.classic?.index,0,10)},(_,i)=>i) : Array.from(new Set((active.claimedChapters || []).filter(x=>Number.isInteger(x)&&x>=0&&x<5)));
    const complete = claimed.length === total;
    const chapter = classic ? integer(state?.classic?.index,0,10) : integer(active.chapter,0,5);
    const ended = !classic && active.ended === true;
    const paused = ended && !complete;
    const points = classic ? CLASSIC_POINTS : POINTS;
    const names = classic ? CLASSIC_PLACES : night ? NIGHT_PLACES : DAY_PLACES;
    const nodes = Array.from({length:total},(_,index)=>{
      const mission = source[index] || {};
      const done = claimed.includes(index);
      const status = done ? 'complete' : index === chapter && !ended ? 'current' : 'locked';
      const discoveries = classic ? [] : (active.done || []).filter(item=>item.chapter===index);
      const count = classic ? index===chapter?(state.classic?.checks || []).filter(Boolean).length:done?(mission.tasks || []).length:0 : discoveries.length;
      const length = classic ? (mission.tasks || []).length : (active.deck?.[index] || []).length;
      const note = discoveries.find(item=>typeof item.note==='string'&&item.note.trim())?.note || '';
      return {index,status,place:names[index],title:mission.title || `Chapter ${index+1}`,short:mission.short || names[index],mission,count,length,note,point:points[index],clue:(night?NIGHT_CLUES:DAY_CLUES)[index%5]};
    });
    return {classic,night,total,chapter,complete,paused,claimed:claimed.length,nodes,height:classic?630:430,
      finale:{status:complete?'open':'locked',solved:complete&&(classic||active.puzzleSolved===true),point:classic?[164,30]:[252,30]},
      title:classic?'The ten-crystal treasure map':night?'The moonlit treasure map':'The Guardian’s treasure map'};
  }
  function route(points) {
    return points.map(([x,y],i)=>i===0?`M${x} ${y}`:`Q${points[i-1][0]} ${y} ${x} ${y}`).join(' ');
  }
  function landscape(height, night) {
    const y=height-430;
    return `<g class="qm-contours" fill="none" stroke="currentColor" stroke-width="1"><path d="M-30 110Q25 10 90 30T260 72T390 18M-20 123Q25 28 90 45T260 87T390 32M-20 137Q25 44 90 60T260 102T390 46"/><path d="M-40 ${316+y}Q40 ${250+y} 80 ${303+y}T242 ${354+y}T390 ${307+y}M-40 ${330+y}Q40 ${264+y} 80 ${317+y}T242 ${368+y}T390 ${321+y}M-40 ${344+y}Q40 ${278+y} 80 ${331+y}T242 ${382+y}T390 ${335+y}"/></g>
      <path d="M334 121Q249 179 287 213T210 273Q169 301 176 ${height-5}" class="qm-river-shadow"/><path d="M334 121Q249 179 287 213T210 273Q169 301 176 ${height-5}" class="qm-river"/><path d="M334 121Q249 179 287 213T210 273Q169 301 176 ${height-5}" class="qm-river-glint"/>
      <g class="qm-mountains"><path d="m20 166 35-59 45 63Z"/><path d="m62 171 35-49 35 48Z"/><path class="qm-snow" d="m42 130 13-23 17 23-9-3-8 7-6-5Z"/></g>
      <g class="qm-trees">${[[26,height-73],[43,height-59],[27,height-44],[309,71],[326,86],[310,101],[40,226],[56,240],[316,height-121]].map(([x,y])=>`<path d="m${x} ${y} -11 20h6l-8 13h10v8h6v-8h10l-8-13h6Z"/>`).join('')}</g>
      <g class="qm-map-sketch" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M193 172q8-9 16 0m7-1q8-9 16 0M52 48q8-7 16 0m3-3q6-5 12 0"/><path d="M44 ${height-23}q7-11 15 0m-5 0q7-11 15 0"/></g>
      <g class="qm-compass-rose" transform="translate(292 ${height-45})"><circle r="20" fill="none" stroke="currentColor" stroke-width=".7"/><path d="M0-29 5-5 29 0 5 5 0 29-5 5-29 0-5-5Z" fill="currentColor" opacity=".22"/><path d="M0-22 5 0 0 22-5 0Z" fill="currentColor"/><text y="-32" text-anchor="middle">${night?'✦':'N'}</text></g>
      ${night?'<g class="qm-map-stars" fill="currentColor"><circle cx="175" cy="59" r="1.8"/><circle cx="41" cy="85" r="1.4"/><circle cx="304" cy="222" r="1.7"/><circle cx="153" cy="178" r="1.5"/><path d="M197 19a15 15 0 1 0 12 25 19 19 0 0 1-12-25Z"/></g>':''}`;
  }
  function map(view) {
    const allPoints=[...view.nodes.map(node=>node.point),view.finale.point];
    const activeNode=view.nodes.find(node=>node.status==='current');
    const travelled=view.nodes.filter(node=>node.status==='complete').map(node=>node.point);
    if(activeNode)travelled.push(activeNode.point);else if(view.complete)travelled.push(view.finale.point);
    const pos=point=>`--qm-x:${point[0]/3.6}%;--qm-y:${point[1]/view.height*100}%`;
    return `<section class="qm-map${view.night?' qm-map-night':''}${view.classic?' qm-map-classic':''}" aria-label="Interactive fantasy treasure map">
      <div class="qm-map-top"><span>${view.night?'A QUEST BY STARLIGHT':'THE PATH OF DISCOVERIES'}</span><b>${view.claimed} / ${view.total} crystals</b></div>
      <div class="qm-map-board" style="--qm-ratio:360/${view.height}">
        <svg class="qm-cartography" viewBox="0 0 360 ${view.height}" aria-hidden="true" preserveAspectRatio="none">${landscape(view.height,view.night)}<path class="qm-route-under" d="${route(allPoints)}"/><path class="qm-route" d="${route(allPoints)}"/>${travelled.length>1?`<path class="qm-route-earned" d="${route(travelled)}"/>`:''}<text class="qm-land-label" x="104" y="${view.height-26}">${view.night?'THE LANTERN WOODS':'THE HIDDEN WOODLAND'}</text></svg>
        ${view.nodes.map(node=>`<button class="qm-map-node qm-node-${node.status}" data-action="quest-map-node" data-value="${node.index}" style="${pos(node.point)}" aria-label="Chapter ${node.index+1}: ${esc(node.place)}. ${node.status==='complete'?'Crystal earned. Review your discovery.':node.status==='current'?'Your current quest. Tap to continue.':'Locked. Tap for a hint.'}"${node.status==='current'?' aria-current="step"':''}><span class="qm-node-disc">${node.status==='complete'?miniIcon('check'):node.status==='locked'?miniIcon('lock'):`<b>${node.index+1}</b>`}</span><span class="qm-node-number" aria-hidden="true">${node.index+1}</span><span class="qm-node-place" aria-hidden="true">${esc(node.place)}</span>${node.status==='current'?'<span class="qm-you-marker" aria-hidden="true">✦</span>':''}</button>`).join('')}
        <button class="qm-map-finale ${view.complete?'qm-finale-open':''}" data-action="quest-map-finale" style="${pos(view.finale.point)}" aria-label="${view.complete?(view.finale.solved?'Open your discovered treasure':'All crystals earned. Open the final treasure puzzle'):'X marks the hidden treasure. Tap for a hint'}">${miniIcon(view.complete?'chest':'x')}</button>
      </div>
      <div class="qm-map-key"><span><i class="qm-key-earned"></i>Discovered</span><span><i class="qm-key-current"></i>Your quest</span><span><i class="qm-key-locked"></i>Still hidden</span></div>
      <div class="qm-map-caption"><span class="qm-caption-compass">${miniIcon(view.complete?'chest':'compass')}</span><p><b>${view.complete?(view.finale.solved?'Your treasure is revealed':'X marks your final discovery'):view.paused?'A lovely place to pause':esc(activeNode?.place || 'Your next discovery')}</b><span>${view.complete?(view.finale.solved?'Tap the chest to revisit your story.':'Every crystal is home. Tap the chest to bring your clues together.'):view.paused?'Your earned crystals are safe. Plan another outing whenever you’re ready.':`Chapter ${(activeNode?.index||0)+1} · ${esc(activeNode?.short||'Explore together')}. Tap the glowing marker.`}</span></p></div>
    </section>`;
  }
  function gem(mission={}, className='') {
    const id=`qm-gem-${++sequence}`;
    const light=colour(mission.light,'#b4f8e3'),base=colour(mission.colour,'#38b69a'),dark=colour(mission.dark,'#136a72');
    const classes=String(className).split(/\s+/).filter(x=>/^[a-zA-Z0-9_-]+$/.test(x)).join(' ');
    return `<span class="qm-crystal ${classes}" style="--qm-tint:${base}" role="img" aria-label="${esc(String(mission.gem||'Magical crystal').replace(/^[^A-Za-z]+/,''))}"><span class="qm-crystal-aura" aria-hidden="true"></span><span class="qm-crystal-shadow" aria-hidden="true"></span><svg class="qm-crystal-prism" viewBox="0 0 160 210" aria-hidden="true"><defs>
      <linearGradient id="${id}-body" x1="0" y1="0" x2="1" y2="1"><stop stop-color="${light}"/><stop offset=".26" stop-color="${base}"/><stop offset=".58" stop-color="${dark}"/><stop offset=".82" stop-color="${base}"/><stop offset="1" stop-color="#082b38"/></linearGradient>
      <linearGradient id="${id}-light" x1="0" x2="1" y2="1"><stop stop-color="#fff" stop-opacity=".98"/><stop offset=".32" stop-color="${light}" stop-opacity=".9"/><stop offset="1" stop-color="${base}" stop-opacity=".12"/></linearGradient>
      <linearGradient id="${id}-edge" x1="0" y1="0" x2="1" y2=".6"><stop stop-color="${dark}"/><stop offset=".58" stop-color="${base}"/><stop offset="1" stop-color="#f0fffb" stop-opacity=".85"/></linearGradient>
      <linearGradient id="${id}-core" x1="0" y1="0" x2=".25" y2="1"><stop stop-color="#f5fff9"/><stop offset=".35" stop-color="${light}" stop-opacity=".65"/><stop offset="1" stop-color="${dark}" stop-opacity=".35"/></linearGradient>
    </defs><g class="qm-cut-stone"><path d="m79 12 39 30 15 81-52 73-54-65 10-84Z" fill="url(#${id}-body)"/><path d="m79 12-23 53-19-18Z" fill="url(#${id}-light)"/><path d="m79 12 18 53 21-23Z" fill="${light}" opacity=".7"/><path d="m37 47 19 18-9 66-20 0Z" fill="url(#${id}-edge)"/><path d="m56 65 41 0 10 60-26 71-34-65Z" fill="url(#${id}-core)"/><path d="m97 65 21-23 15 81-26 2Z" fill="url(#${id}-edge)"/><path d="m27 131 20 0 34 65Z" fill="${dark}" opacity=".9"/><path d="m107 125 26-2-52 73Z" fill="${dark}" opacity=".85"/><path d="m56 65 25 131 16-131Z" fill="${light}" opacity=".26"/><path d="m37 47 19 18 41 0 21-23M56 65l-9 66 34 65 26-71-10-60M47 131l60-6M79 12 56 65" fill="none" stroke="#f3fffd" stroke-opacity=".48" stroke-width=".75"/><path d="m43 53 7 8-9 54Z" fill="#fff" opacity=".7"/><path d="m99 71 6 43 4-30Z" fill="#fff" opacity=".58"/><path class="qm-crystal-glint" d="m64 58 5 14 14 5-14 4-5 14-4-14-14-4 14-5Z" fill="#fff"/></g></svg><span class="qm-crystal-motes" aria-hidden="true">${[0,1,2,3,4,5].map(i=>`<i style="--qm-i:${i}"></i>`).join('')}</span></span>`;
  }
  function crystalScene(mission, {ready=false,count=0,length=0,night=false}={}) {
    const safeCount=integer(count,0,99),safeLength=integer(length,0,99);
    return `<div class="qm-crystal-scene${ready?' qm-crystal-ready':''}${night?' qm-crystal-night':''}">${gem(mission,'qm-quest-crystal')}<div class="qm-crystal-caption"><span>${ready?'THE CRYSTAL IS AWAKE':'A CRYSTAL IS STIRRING'}</span><b>${ready?'Your discoveries brought it to life':`${safeCount} of ${safeLength} discoveries gathered`}</b><small>${ready?'Claim your earned treasure below.':'Every real discovery adds a little magic.'}</small></div></div>`;
  }
  function createSoundEngine(host={}) {
    let context=null,epoch=0;
    const voices=new Set();
    const hidden=()=>host.document?.hidden===true;
    function stop() {
      epoch++;
      for(const voice of voices){try{voice.stop();}catch{}try{voice.disconnect();}catch{}}
      voices.clear();
      if(context&&context.state==='running')try{const result=context.suspend();result?.catch(()=>{});}catch{}
    }
    function play(kind='discovery', options={}) {
      if(options.enabled!==true||hidden())return false;
      const volume=integer(options.volume,0,100,55)/100;if(volume===0)return false;
      const Audio=host.AudioContext||host.webkitAudioContext;if(!Audio)return false;
      try {
        if(!context||context.state==='closed')context=new Audio();
        const token=++epoch;
        const perform=()=>{
          if(token!==epoch||hidden()||context.state==='closed')return;
          const notes=kind==='reward'?[392,523.25,659.25,783.99,1046.5]:kind==='reveal'?[523.25,783.99]:[659.25,987.77];
          const now=context.currentTime;
          notes.forEach((frequency,i)=>{
            const start=now+i*(kind==='reward'?.14:.09),duration=kind==='reward'?1.15:.55;
            [[1,.09],[2.005,.018]].forEach(([ratio,gain])=>{
              const oscillator=context.createOscillator(),envelope=context.createGain();
              oscillator.type='sine';oscillator.frequency.value=frequency*ratio;
              envelope.gain.setValueAtTime(0,start);envelope.gain.linearRampToValueAtTime(gain*volume,start+.025);envelope.gain.exponentialRampToValueAtTime(.0001,start+duration);
              oscillator.connect(envelope);envelope.connect(context.destination);voices.add(oscillator);
              oscillator.onended=()=>{voices.delete(oscillator);try{oscillator.disconnect();envelope.disconnect();}catch{}};
              oscillator.start(start);oscillator.stop(start+duration+.03);
            });
          });
        };
        if(context.state==='suspended')Promise.resolve(context.resume()).then(perform).catch(()=>{});else perform();
        return true;
      }catch{return false;}
    }
    return {play,stop};
  }
  return {model,map,gem,crystalScene,createSoundEngine};
});
