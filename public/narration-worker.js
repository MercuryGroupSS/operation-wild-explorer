/* Optional Bella pack. Never precache the audio during game installation. */
(function(root){
  'use strict';
  const CACHE='wild-narration-bella-v1';
  const matches=request=>/\/assets\/narration\/bella-v1\/[a-f0-9]{64}\.mp3$/.test(new URL(request.url).pathname);
  async function serve(request){
    let cached;
    try{const cache=await caches.open(CACHE);cached=await cache.match(request.url);}catch{/* Storage denial must not block online narration. */}
    if(!cached)return fetch(request); // Do not silently accumulate a large pack.
    const range=request.headers?.get('range');if(!range)return cached;
    const bytes=await cached.arrayBuffer(),length=bytes.byteLength;
    const match=/^bytes=(\d*)-(\d*)$/.exec(range);
    if(!match||(!match[1]&&!match[2]))return new Response(null,{status:416,headers:{'Content-Range':`bytes */${length}`}});
    let start=match[1]?Number(match[1]):Math.max(0,length-Number(match[2]));
    let end=match[1]?(match[2]?Math.min(Number(match[2]),length-1):length-1):length-1;
    if(!Number.isSafeInteger(start)||!Number.isSafeInteger(end)||start<0||start>=length||end<start)return new Response(null,{status:416,headers:{'Content-Range':`bytes */${length}`}});
    const headers=new Headers(cached.headers);headers.set('Content-Type','audio/mpeg');headers.set('Accept-Ranges','bytes');headers.set('Content-Range',`bytes ${start}-${end}/${length}`);headers.set('Content-Length',String(end-start+1));
    return new Response(bytes.slice(start,end+1),{status:206,headers});
  }
  root.WildNarrationWorker={matches,serve};
})(typeof self!=='undefined'?self:globalThis);
