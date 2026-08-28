// In-house speakers. Two things live here and they are deliberately the same object: the audio playback
// of the track, and the GAMEPLAY consequence of playing it. The song is not background music — it is the
// loudest noise source in the yard, so switching the speakers on is an explicit decision to pull the
// whole horde onto the building. That is the entire event: Stas turns the track up and defends the house.
//
// The file is a real mp3 (`assets/audio/zombe.mp3`, ripped from the supplied recording). Playback still
// uses an HTMLAudioElement for decode/loop/seek, but the element is routed through the shared WebAudio
// graph from `audio.js` so we can do three things a raw <audio> cannot: a short fade-in when the song
// is switched on, volume that falls off with distance from the cabinet, and a low-pass "wall" filter
// that slams on when Stas steps outside and comes off when he walks back in.
const TRACK='../assets/audio/zombe.mp3';
// The speaker stack stands against the interior wall, offset from the shelter origin rather than pinned
// to world pixels, so it stays in the room if the house is ever moved or resized in the scenario.
const OFFSET={x:.22,y:.74};
// How loud the horde hears it. This is a noise RADIUS in world pixels, and it is larger than any weapon
// in the game (the Crying Hedgehog spikes to 775) because the whole point is that the track out-shouts
// everything else in the yard.
const NOISE_RADIUS=900;
// Visual swell, not a strobe. 0.22 Hz = one ring takes ~4.5s to dissolve. A 4.2 Hz pulse with five
// hard additive strokes was reading as a seizure, not as music.
const WAVE_HZ=.22;
const WAVE_RINGS=3;
const WAVE_SPREAD=.38;
// One noise event per bar-ish interval. Emitting per frame would flood the 12-entry noise list and
// starve every other cue out of it; the horde only needs a fresh lure a few times a second.
const NOISE_INTERVAL=1.15;

// Mix. Near the cabinet the track is almost dry; across the yard it is still there, just quiet.
// Inverse-square-ish so walking away from the box is the thing you hear, not a linear dip.
const FADE_IN=.9;
const NEAR_RADIUS=36;
const FAR_RADIUS=560;
const VOL_NEAR=.88;
const VOL_FAR=.16;
const OUTSIDE_VOL=.78;
// "Autofilter at ~50% cutoff": log-mid of 20 Hz–20 kHz is ~632 Hz. Parked at 900 so the song is still
// a song through the wall, just muffled, the way a real cabinet sounds from the yard.
const CUTOFF_INSIDE=18000;
const CUTOFF_OUTSIDE=900;
const FILTER_SLEW=.14;

export function createSpeakers(audio=null){
  const element=new Audio();
  element.src=TRACK;element.loop=true;element.preload='auto';element.volume=1;
  const speakers={
    element,audio,on:false,missing:false,ready:false,pulse:0,noiseTimer:0,plays:0,
    source:null,filter:null,gain:null,hooked:false,muffled:false,fade:0
  };
  // Missing mp3 is normal (the track is dropped in later). Keep the cabinet usable so the rings
  // still read as "the song is on" for the montage even when the file is not there yet.
  element.addEventListener('error',()=>{speakers.missing=true});
  element.addEventListener('canplaythrough',()=>{speakers.ready=true});
  return speakers;
}

function hookGraph(speakers){
  if(speakers.hooked)return speakers.gain;
  const context=speakers.audio?.unlock?.();
  if(!context)return null;
  try{
    const source=context.createMediaElementSource(speakers.element);
    const filter=context.createBiquadFilter();
    filter.type='lowpass';
    filter.Q.value=.75;
    filter.frequency.value=CUTOFF_INSIDE;
    const gain=context.createGain();
    gain.gain.value=0;
    source.connect(filter);filter.connect(gain);gain.connect(context.destination);
    speakers.source=source;speakers.filter=filter;speakers.gain=gain;speakers.hooked=true;
  }catch{
    // createMediaElementSource throws if the element is already hooked; treat that as success.
    speakers.hooked=!!speakers.gain;
  }
  return speakers.gain;
}

function distanceVolume(listener,shelter){
  if(!listener||!shelter)return VOL_NEAR;
  const {x,y}=speakerPosition(shelter);
  const dist=Math.hypot(listener.x-x,listener.y-y);
  const t=Math.max(0,Math.min(1,(dist-NEAR_RADIUS)/(FAR_RADIUS-NEAR_RADIUS)));
  const fall=(1-t)*(1-t);
  const vol=VOL_FAR+(VOL_NEAR-VOL_FAR)*fall;
  return listener.inside===false?vol*OUTSIDE_VOL:vol;
}

function applyMix(speakers,listener,shelter){
  const target=speakers.fade*distanceVolume(listener,shelter);
  if(speakers.gain&&speakers.audio?.context){
    const now=speakers.audio.context.currentTime;
    speakers.gain.gain.setTargetAtTime(target,now,.045);
  }else{
    try{speakers.element.volume=Math.max(0,Math.min(1,target))}catch(e){}
  }
  const wantMuffle=listener?listener.inside===false:false;
  if(speakers.filter&&wantMuffle!==speakers.muffled){
    speakers.muffled=wantMuffle;
    const now=speakers.audio.context.currentTime;
    const freq=wantMuffle?CUTOFF_OUTSIDE:CUTOFF_INSIDE;
    const current=Math.max(80,speakers.filter.frequency.value||CUTOFF_INSIDE);
    speakers.filter.frequency.cancelScheduledValues(now);
    speakers.filter.frequency.setValueAtTime(current,now);
    speakers.filter.frequency.exponentialRampToValueAtTime(freq,now+FILTER_SLEW);
  }
  speakers.mix={
    fade:+speakers.fade.toFixed(3),
    vol:+target.toFixed(3),
    muffled:!!speakers.muffled,
    cutoff:speakers.filter?Math.round(speakers.filter.frequency.value):null,
    hooked:!!speakers.hooked,
    inside:listener?listener.inside!==false:null
  };
}

// Visual ON is independent of whether the file decoded. The rings are the joke; the mp3 is optional.
export function blareSpeakers(speakers){
  if(!speakers)return false;
  speakers.on=true;speakers.plays++;speakers.pulse=0;speakers.fade=0;speakers.muffled=false;
  if(speakers.missing)return true;
  hookGraph(speakers);
  if(speakers.filter&&speakers.audio?.context){
    const now=speakers.audio.context.currentTime;
    speakers.filter.frequency.cancelScheduledValues(now);
    speakers.filter.frequency.setValueAtTime(CUTOFF_INSIDE,now);
  }
  if(speakers.gain&&speakers.audio?.context){
    const now=speakers.audio.context.currentTime;
    speakers.gain.gain.cancelScheduledValues(now);
    speakers.gain.gain.setValueAtTime(0,now);
  }
  try{speakers.element.currentTime=0}catch(e){}
  speakers.element.play()?.catch?.(()=>{speakers.missing=true});
  return true;
}

export function toggleSpeakers(speakers){
  if(!speakers)return null;
  if(speakers.on){stopSpeakers(speakers);return false}
  return blareSpeakers(speakers);
}

export function restartSpeakers(speakers){return blareSpeakers(speakers)}

export function stopSpeakers(speakers){
  if(!speakers)return;
  speakers.fade=0;
  if(speakers.gain&&speakers.audio?.context){
    const now=speakers.audio.context.currentTime;
    speakers.gain.gain.cancelScheduledValues(now);
    speakers.gain.gain.setTargetAtTime(0,now,.03);
  }
  try{speakers.element.pause()}catch(e){}
  speakers.on=false;speakers.pulse=0;speakers.muffled=false;
}

export function speakerPosition(shelter){
  return {x:shelter.x+shelter.width*OFFSET.x,y:shelter.y+shelter.height*OFFSET.y};
}

export function speakerNear(shelter,x,y,reach=52){
  const p=speakerPosition(shelter);
  return Math.hypot(x-p.x,y-p.y)<reach;
}

function easeOutCubic(t){return 1-Math.pow(1-t,3)}
function easeInQuad(t){return t*t}

// Soft double stroke: a wide faint halo (air pressure) plus a thin core. Linear 2px additive
// circles were the epileptic part — they popped on and vanished. These swell out and dissolve.
function paintRing(ctx,x,y,t,inner,travel,maxAlpha,rgb){
  const fade=1-easeInQuad(t);
  if(fade<=.02)return;
  const r=inner+easeOutCubic(t)*travel;
  const [cr,cg,cb]=rgb;
  ctx.strokeStyle=`rgb(${cr},${cg},${cb})`;
  ctx.globalAlpha=maxAlpha*fade*.26;
  ctx.lineWidth=12+easeOutCubic(t)*8;
  ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.stroke();
  ctx.globalAlpha=maxAlpha*fade;
  ctx.lineWidth=1.4;
  ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.stroke();
}

// Called every frame with the shelter, the listener (player) and the game's own `noise` emitter.
// The lure is throttled here rather than at the call site so the caller cannot flood the noise list.
export function updateSpeakers(speakers,dt,shelter,listener,emitNoise){
  if(!speakers)return;
  if(!speakers.on){speakers.pulse=0;speakers.fade=0;return}
  if(!speakers.hooked)hookGraph(speakers);
  speakers.fade=Math.min(1,speakers.fade+dt/FADE_IN);
  applyMix(speakers,listener,shelter);
  const playing=speakers.element&&!speakers.element.paused&&!speakers.missing;
  speakers.pulse=playing?(speakers.element.currentTime*WAVE_HZ)%1:(speakers.pulse+dt*WAVE_HZ)%1;
  if(!emitNoise||typeof emitNoise!=='function')return;
  speakers.noiseTimer-=dt;
  if(speakers.noiseTimer>0)return;
  speakers.noiseTimer=NOISE_INTERVAL;
  const {x,y}=speakerPosition(shelter);
  emitNoise(x,y,NOISE_RADIUS);
}

export function drawSpeakerWaves(ctx,speakers,shelter,{chorus=false}={}){
  if(!speakers?.on||!shelter)return;
  const {x,y}=speakerPosition(shelter);
  const pulse=speakers.pulse||0;
  const breath=.74+.26*Math.sin(pulse*Math.PI*2);
  const color=chorus?[112,226,239]:[255,184,103];
  ctx.save();ctx.globalCompositeOperation='lighter';
  for(let i=0;i<WAVE_RINGS+(chorus?1:0);i++){
    paintRing(ctx,x,y,(pulse+i*(chorus?.27:WAVE_SPREAD))%1,20,chorus?190:150,(chorus?.18:.14)*breath,color);
  }
  ctx.restore();
}

export function drawSpeakers(ctx,speakers,shelter,{hot=false}={}){
  if(!speakers)return;
  const {x,y}=speakerPosition(shelter);
  ctx.save();ctx.translate(x,y);
  ctx.fillStyle='#141310';ctx.fillRect(-13,-27,26,54);
  ctx.strokeStyle=hot?'#d4a45a':'#3b3529';ctx.lineWidth=hot?2:1;ctx.strokeRect(-12.5,-26.5,25,53);
  ctx.fillStyle='#241f19';ctx.beginPath();ctx.arc(0,-13,8.5,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#241f19';ctx.beginPath();ctx.arc(0,11,10.5,0,Math.PI*2);ctx.fill();
  ctx.strokeStyle='#4a4133';ctx.beginPath();ctx.arc(0,-13,8.5,0,Math.PI*2);ctx.stroke();
  ctx.beginPath();ctx.arc(0,11,10.5,0,Math.PI*2);ctx.stroke();
  if(speakers.on){
    const pulse=speakers.pulse||0;
    const breath=.74+.26*Math.sin(pulse*Math.PI*2);
    ctx.globalCompositeOperation='lighter';
    for(let i=0;i<2;i++){
      paintRing(ctx,0,0,(pulse+i*.46)%1,11,34,.18*breath,[255,184,103]);
    }
  }
  ctx.restore();
}
