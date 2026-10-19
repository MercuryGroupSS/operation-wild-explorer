/* Bella playback and opt-in offline audio. No runtime synthesis service. */
(function(root,factory){'use strict';const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.WildNarration=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const CACHE='wild-narration-bella-v1';
  const normalise=text=>String(text||'').normalize('NFC').replace(/\s+/g,' ').trim();
  const validFile=file=>/^\.\/assets\/narration\/bella-v1\/[a-f0-9]{64}\.mp3$/.test(file||'');
  function createPlayer(host={},manifest={},options={}){
    const byText=new Map((manifest.clips||[]).filter(c=>validFile(c.file)).map(c=>[normalise(c.text),c]));
    let audio=null,epoch=0,busy=false,timer=null,source='bella';
    const clear=()=>{if(timer!=null){host.clearTimeout?.(timer);timer=null;}};
    const status=(state,message='')=>options.onStatus?.({state,source,message});
    const hidden=()=>host.document?.hidden===true;
    function stop(){
      epoch++;busy=false;clear();
      if(audio){audio.onended=null;audio.onerror=null;audio.onplaying=null;try{audio.pause();audio.currentTime=0;}catch{}}
      try{host.speechSynthesis?.cancel();}catch{}
      status('stopped');
    }
    function unavailable(message){stop();status('unavailable',message||'Read-aloud is unavailable here. A grown-up can read the card.');}
    function device(parts,token){
      if(token!==epoch||hidden())return;
      clear();if(audio){audio.onended=null;audio.onerror=null;audio.onplaying=null;try{audio.pause();}catch{}}
      const synth=host.speechSynthesis,Utterance=host.SpeechSynthesisUtterance;
      let voice;try{voice=synth?.getVoices?.().find(v=>v.localService===true&&/^en(?:-|$)/i.test(v.lang));}catch{}
      if(!synth||!Utterance||!voice){unavailable('Bella is unavailable here, and no local device voice is ready. A grown-up can read the card.');return;}
      try{
        const say=new Utterance(parts.join(' '));say.voice=voice;say.lang=voice.lang;say.rate=.85;say.pitch=1.04;
        source='device';busy=true;status('playing','Using device voice because Bella is unavailable.');
        say.onend=()=>{if(token===epoch){busy=false;status('stopped');}};
        say.onerror=()=>{if(token===epoch)unavailable('Device voice is unavailable. A grown-up can read the card.');};
        synth.cancel();synth.speak(say);
      }catch{unavailable('Device voice is unavailable. A grown-up can read the card.');}
    }
    function play(texts){
      stop();if(hidden())return false;
      const parts=(Array.isArray(texts)?texts:[]).map(normalise).filter(Boolean);if(!parts.length)return false;
      const token=epoch;source='bella';busy=true;options.beforePlay?.();
      if(!host.Audio){device(parts,token);return busy;}
      if(!audio){try{audio=new host.Audio();audio.preload='none';audio.playsInline=true;}catch{device(parts,token);return busy;}}
      function next(index){
        if(token!==epoch||hidden())return;
        clear();if(index>=parts.length){busy=false;status('stopped');return;}
        const clip=byText.get(parts[index]);if(!clip){device(parts.slice(index),token);return;}
        source='bella';busy=true;
        audio.onended=()=>{if(token===epoch)next(index+1);};
        audio.onerror=()=>{if(token===epoch)device(parts.slice(index),token);};
        audio.onplaying=()=>{if(token===epoch){clear();status('playing');}};
        audio.src=clip.file;audio.volume=1; // Same −2 dB master as the approved audition.
        status('loading');
        if(host.setTimeout)timer=host.setTimeout(()=>{if(token===epoch)device(parts.slice(index),token);},12000);
        try{
          // First play is synchronous inside the user's tap. Reuse this one
          // unlocked media element for every later segment, including Safari.
          const promise=audio.play();
          promise?.catch(error=>{
            if(token!==epoch)return;
            if(error?.name==='NotAllowedError')unavailable('Tap Read aloud again to start Bella. Your browser needs a fresh tap.');
            else device(parts.slice(index),token);
          });
        }catch{device(parts.slice(index),token);}
      }
      next(0);return busy;
    }
    return {play,stop,active:()=>busy,source:()=>source};
  }
  function createPack(host={},manifest={}){
    const clips=(manifest.clips||[]).filter(c=>validFile(c.file));
    let working=null,cancelled=false,controller=null;
    const info={bytes:manifest.totalBytes||0,megabytes:((manifest.totalBytes||0)/1000000).toFixed(1),files:clips.length};
    async function status(){
      if(!host.caches||!clips.length)return {...info,ready:false,present:0,supported:false};
      try{const cache=await host.caches.open(CACHE);let present=0;for(const clip of clips)if(await cache.match(clip.file))present++;return {...info,ready:present===clips.length,present,supported:true};}
      catch{return {...info,ready:false,present:0,supported:false};}
    }
    async function download(progress=()=>{}){
      if(working)return working;
      if(!host.caches||!host.fetch||!clips.length)throw new Error('Offline voice storage is unavailable in this browser. Bella can still play online.');
      cancelled=false;controller=host.AbortController?new host.AbortController():null;
      working=(async()=>{
        const cache=await host.caches.open(CACHE);let present=0,bytes=0;
        for(const clip of clips){
          if(cancelled)throw new Error('Voice download paused. Tap Download Bella to continue later.');
          if(!await cache.match(clip.file)){
            const response=await host.fetch(clip.file,{cache:'no-store',signal:controller?.signal});
            if(!response.ok||response.status===206)throw new Error('Bella’s download is incomplete. Keep internet on and try again.');
            const data=await response.clone().arrayBuffer();
            if(data.byteLength!==clip.bytes)throw new Error('A voice file could not be verified. Try again online.');
            if(host.crypto?.subtle){const hash=Array.from(new Uint8Array(await host.crypto.subtle.digest('SHA-256',data)),b=>b.toString(16).padStart(2,'0')).join('');if(hash!==clip.sha256)throw new Error('A voice file changed. Check for a game update and try again.');}
            await cache.put(clip.file,response);
          }
          present++;bytes+=clip.bytes;progress({...info,present,downloadedBytes:bytes,ready:present===clips.length});
        }
        return await status();
      })();
      try{return await working;}catch(error){if(cancelled)throw new Error('Voice download paused. Tap Download Bella to continue later.');if(error?.name==='QuotaExceededError')throw new Error('There is not enough browser storage for Bella. The adventure still works; try again after freeing storage.');throw error;}finally{working=null;controller=null;}
    }
    function cancel(){cancelled=true;controller?.abort();}
    return {info,status,download,cancel,downloading:()=>!!working};
  }
  return {CACHE,createPlayer,createPack};
});
