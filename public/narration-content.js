/* Fixed, public game text only. No names, journal, location or uploaded content. */
(function(root,factory){
  'use strict';
  if(typeof module==='object'&&module.exports)module.exports=factory(require('./engine.js'),require('./classic.js'));
  else root.WildNarrationContent=factory(root.WildEngine,root.WildClassic);
})(typeof globalThis!=='undefined'?globalThis:this,function(E,C){
  'use strict';
  const normalise=text=>String(text||'').normalize('NFC').replace(/\s+/g,' ').trim();
  const sentence=text=>normalise(text).replace(/[.!?]+$/,'')+'.';
  const DAY_SAFETY='Stay together on the safe path.';
  const NIGHT_SAFETY='Stay beside your grown-up. Stop walking before looking at the screen.';
  const READY='Your crystal is ready.';
  const CLASSIC_DONE='Your classic hunt is complete.';
  const ADVENTURE_DONE='Your discoveries brought the map together. Share your favourite memory.';
  const intro=card=>`${sentence(card.type)} ${sentence(card.title)} ${normalise(card.prompt)}`;
  const alternative=card=>'Safe alternative: '+normalise(card.alternative);
  const classicIntro=m=>`${sentence(m.title)} ${normalise(m.story)}`;
  const classicTask=(m,i,v)=>`${sentence(m.tasks[i][v])}${m.hints?.[i]?' '+normalise(m.hints[i]):''}`;
  function segments(state){
    const result=[];
    if(state?.mode==='classic'){
      const saved=state.classic||{},m=C.MISSIONS[saved.index];
      if(m){
        result.push(classicIntro(m));
        const i=(saved.checks||[]).findIndex(x=>!x);
        result.push(i>=0&&m.tasks[i]?classicTask(m,i,saved.variants?.[i]||0):READY);
      }else result.push(CLASSIC_DONE);
      result.push(DAY_SAFETY);
    }else{
      const card=E.getCurrentCard(state?.expedition),night=state?.expedition?.active?.options?.theme==='halloween';
      if(card){
        const base=E.CARD_BY_ID[card.id];
        result.push(intro(base));
        const extra=normalise(card.prompt.slice(base.prompt.length));
        if(extra)result.push(extra);
        result.push(alternative(base));
      }else result.push(ADVENTURE_DONE);
      result.push(night?NIGHT_SAFETY:DAY_SAFETY);
    }
    return result.map(normalise).filter(Boolean);
  }
  function catalog(){
    const texts=[DAY_SAFETY,NIGHT_SAFETY,READY,CLASSIC_DONE,ADVENTURE_DONE];
    for(const card of E.CARDS){
      texts.push(intro(card),alternative(card));
      for(const difficulty of E.DIFFICULTIES){
        const setting=card.settings?.[0]||'indoor';
        const sample={mode:'expedition',expedition:{active:{id:'fixed-narration-catalog',chapter:0,step:0,swaps:0,ended:false,deck:[[card.id]],options:{theme:card.theme,setting,habitat:card.habitats?.[0]||'woodland',season:card.seasons?.[0]||'autumn',difficulty}}}};
        texts.push(...segments(sample));
      }
    }
    for(const m of C.MISSIONS){texts.push(classicIntro(m));m.tasks.forEach((choices,i)=>choices.forEach((_,v)=>texts.push(classicTask(m,i,v))));}
    return [...new Set(texts.map(normalise).filter(Boolean))];
  }
  return {normalise,segments,catalog};
});
