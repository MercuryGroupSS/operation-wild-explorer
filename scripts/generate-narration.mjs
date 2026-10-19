/** Offline build tool, never shipped to a browser. Reuses an approved local
 * kokoro-js 1.2.1 installation. KOKORO_WORKSPACE=/path/to/voice-auditions node
 * scripts/generate-narration.mjs. All input comes from fixed game content. */
import {createRequire} from 'node:module';
import {createHash} from 'node:crypto';
import {readFile,writeFile,mkdir,unlink,stat} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {resolve,dirname} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const workspace=process.env.KOKORO_WORKSPACE;
if(!workspace)throw new Error('Set KOKORO_WORKSPACE to the approved local kokoro-js installation.');
const localRequire=createRequire(resolve(workspace,'package.json'));
const {KokoroTTS}=await import(pathToFileURL(localRequire.resolve('kokoro-js').replace(/kokoro\.cjs$/,'kokoro.js')));
const {env}=await import(pathToFileURL(localRequire.resolve('@huggingface/transformers').replace(/\.cjs$/,'.mjs')));
env.allowRemoteModels=false; // All model files were downloaded for the approved audition.
env.backends.onnx.logLevel='error';
const require=createRequire(import.meta.url),content=require('../public/narration-content.js');
const destination=resolve(root,'public/assets/narration/bella-v1');
await mkdir(destination,{recursive:true});
const model='onnx-community/Kokoro-82M-v1.0-ONNX',voice='af_bella',speed=.9;
const manifest={schema:1,pack:'bella-v1',voice,label:'Bella',model,dtype:'fp32',speed,gainDb:-2,format:'mp3',sampleRate:24000,generatedAt:new Date().toISOString(),clips:[],totalBytes:0,totalSeconds:0};
let previous={};try{previous=JSON.parse(await readFile(resolve(destination,'build-metadata.json'),'utf8'));}catch{}
console.log('Loading cached Kokoro model for local CPU inference.');
const tts=await KokoroTTS.from_pretrained(model,{dtype:'fp32',device:'cpu',local_files_only:true});
const texts=content.catalog();
for(const [index,text]of texts.entries()){
  const key=createHash('sha256').update(text).digest('hex');
  const mp3=resolve(destination,key+'.mp3'),wav=resolve(destination,key+'.wav');
  let clip=previous.clips?.find(item=>item.key===key);
  if(clip){try{if((await stat(mp3)).size!==clip.bytes)clip=null;}catch{clip=null;}}
  if(!clip){
    const started=Date.now(),audio=await tts.generate(text,{voice,speed});
    let peak=0,sum=0;for(const value of audio.audio){if(!Number.isFinite(value))throw new Error('Non-finite waveform: '+key);peak=Math.max(peak,Math.abs(value));sum+=value*value;}
    const rms=Math.sqrt(sum/audio.audio.length);if(rms<.0001)throw new Error('Silent waveform: '+key);
    await audio.save(wav);
    execFileSync('ffmpeg',['-nostdin','-v','error','-y','-i',wav,'-af','volume=-2dB','-codec:a','libmp3lame','-q:a','2','-map_metadata','-1',mp3]);
    await unlink(wav);
    const bytes=await readFile(mp3);
    clip={key,text,file:'./assets/narration/bella-v1/'+key+'.mp3',bytes:bytes.length,seconds:Number((audio.audio.length/audio.sampling_rate).toFixed(3)),sha256:createHash('sha256').update(bytes).digest('hex'),sourcePeak:Number(peak.toFixed(6)),sourceRms:Number(rms.toFixed(6))};
    console.log(`${index+1}/${texts.length} ${clip.seconds}s ${(Date.now()-started)/1000}s ${text.slice(0,70)}`);
  }else console.log(`${index+1}/${texts.length} reusing ${key}`);
  manifest.clips.push(clip);manifest.totalBytes+=clip.bytes;manifest.totalSeconds+=clip.seconds;
  await writeFile(resolve(destination,'build-metadata.json'),JSON.stringify(manifest,null,2)+'\n');
}
manifest.totalSeconds=Number(manifest.totalSeconds.toFixed(3));
manifest.fingerprint=createHash('sha256').update(manifest.clips.map(c=>c.sha256).join('')).digest('hex');
const publicManifest={...manifest,clips:manifest.clips.map(({sourcePeak,sourceRms,...clip})=>clip)};
await writeFile(resolve(root,'public/narration-manifest.js'),`/* Generated fixed-text Bella narration. See assets/narration/NOTICE.txt. */\n(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.WildNarrationManifest=factory();})(typeof globalThis!=='undefined'?globalThis:this,function(){return ${JSON.stringify(publicManifest)};});\n`);
await writeFile(resolve(destination,'build-metadata.json'),JSON.stringify(manifest,null,2)+'\n');
console.log(`DONE ${texts.length} clips, ${(manifest.totalBytes/1e6).toFixed(2)} MB, ${(manifest.totalSeconds/60).toFixed(1)} minutes.`);
