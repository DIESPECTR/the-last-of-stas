// Sample-first audio. Generated WAVs live in assets/sfx/. If a file is missing or the
// AudioContext is blocked, every cue falls back to the procedural voice so the game
// never throws inside the render loop.
const AudioContextClass=globalThis.AudioContext||globalThis.webkitAudioContext;

const SAMPLES={
  shot:'../assets/sfx/shot.wav',
  stas_shot:'../assets/sfx/stas_shot.wav?v=5',
  impact:'../assets/sfx/impact.wav',
  death:'../assets/sfx/death.wav',
  growl:'../assets/sfx/growl.wav',
  house_hit:'../assets/sfx/house_hit.wav',
  speaker_hit:'../assets/sfx/house_hit.wav',
  trap:'../assets/sfx/trap.wav',
  jam:'../assets/sfx/jam.wav',
  ui:'../assets/sfx/ui.wav',
  backfire:'../assets/sfx/backfire.wav',
  place:'../assets/sfx/place.wav',
  noise_spike:'../assets/sfx/backfire.wav'
};

export function createAudio(){
  const audio={context:null,master:null,noise:null,muted:false,lastAt:new Map(),raw:new Map(),samples:new Map()};
  if(!AudioContextClass)return audio;
  audio.unlock=()=>{
    if(audio.context){if(audio.context.state==='suspended')audio.context.resume();decodePending(audio);return audio.context}
    try{
      const context=new AudioContextClass(),master=context.createGain();
      master.gain.value=.55;master.connect(context.destination);
      audio.context=context;audio.master=master;audio.noise=makeNoiseBuffer(context);
      decodePending(audio);
    }catch{audio.context=null}
    return audio.context;
  };
  fetchSamples(audio);
  return audio;
}

function fetchSamples(audio){
  for(const [name,url] of Object.entries(SAMPLES)){
    fetch(url).then(r=>r.ok?r.arrayBuffer():null).then(buf=>{if(buf){audio.raw.set(name,buf);decodePending(audio)}}).catch(()=>{});
  }
}
function decodePending(audio){
  const context=audio.context;if(!context)return;
  for(const [name,buf] of audio.raw){
    if(audio.samples.has(name))continue;
    context.decodeAudioData(buf.slice(0)).then(decoded=>audio.samples.set(name,decoded)).catch(()=>{});
  }
}

function makeNoiseBuffer(context){
  const buffer=context.createBuffer(1,context.sampleRate,context.sampleRate),data=buffer.getChannelData(0);
  for(let i=0;i<data.length;i++)data[i]=Math.random()*2-1;
  return buffer;
}
function noiseVoice(audio,{duration=.2,type='bandpass',frequency=900,q=1,gain=.4,sweepTo=null}={}){
  const context=audio.context,now=context.currentTime;
  const source=context.createBufferSource(),filter=context.createBiquadFilter(),level=context.createGain();
  source.buffer=audio.noise;source.loop=true;filter.type=type;filter.Q.value=q;
  filter.frequency.setValueAtTime(frequency,now);
  if(sweepTo)filter.frequency.exponentialRampToValueAtTime(Math.max(40,sweepTo),now+duration);
  level.gain.setValueAtTime(gain,now);level.gain.exponentialRampToValueAtTime(.0008,now+duration);
  source.connect(filter);filter.connect(level);level.connect(audio.master);
  source.start(now);source.stop(now+duration+.02);
}
function toneVoice(audio,{duration=.25,type='sine',from=220,to=90,gain=.3,delay=0}={}){
  const context=audio.context,now=context.currentTime+delay;
  const oscillator=context.createOscillator(),level=context.createGain();
  oscillator.type=type;oscillator.frequency.setValueAtTime(from,now);
  oscillator.frequency.exponentialRampToValueAtTime(Math.max(20,to),now+duration);
  level.gain.setValueAtTime(0,now);level.gain.linearRampToValueAtTime(gain,now+.012);
  level.gain.exponentialRampToValueAtTime(.0008,now+duration);
  oscillator.connect(level);level.connect(audio.master);
  oscillator.start(now);oscillator.stop(now+duration+.02);
}

const VOICES={
  shot:audio=>{noiseVoice(audio,{duration:.11,frequency:1700,q:.8,gain:.32,sweepTo:420});toneVoice(audio,{duration:.1,type:'triangle',from:190,to:70,gain:.2})},
  // Immediate fallback while the real WAV is still fetching/decoding. It must read as a
  // heavy shotgun under the loud speaker track, never as silence or a sci-fi blip.
  stas_shot:audio=>{
    noiseVoice(audio,{duration:.18,type:'lowpass',frequency:2400,q:.55,gain:.82,sweepTo:110});
    noiseVoice(audio,{duration:.075,type:'bandpass',frequency:3600,q:.7,gain:.46,sweepTo:760});
    toneVoice(audio,{duration:.2,type:'triangle',from:145,to:38,gain:.48});
  },
  backfire:audio=>{
    noiseVoice(audio,{duration:.46,type:'lowpass',frequency:1500,q:.7,gain:.5,sweepTo:120});
    toneVoice(audio,{duration:.5,type:'sawtooth',from:300,to:42,gain:.34});
    toneVoice(audio,{duration:.32,type:'square',from:120,to:38,gain:.18,delay:.06});
  },
  noise_spike:audio=>{
    toneVoice(audio,{duration:.85,type:'sawtooth',from:260,to:1500,gain:.3});
    toneVoice(audio,{duration:.9,type:'square',from:130,to:760,gain:.14,delay:.04});
    noiseVoice(audio,{duration:.95,frequency:600,q:.6,gain:.26,sweepTo:3200});
  },
  jam:audio=>{noiseVoice(audio,{duration:.06,frequency:2600,q:6,gain:.34});noiseVoice(audio,{duration:.09,frequency:1200,q:5,gain:.26,sweepTo:700})},
  impact:audio=>noiseVoice(audio,{duration:.07,frequency:3200,q:2,gain:.16,sweepTo:1200}),
  death:audio=>{noiseVoice(audio,{duration:.3,type:'lowpass',frequency:700,q:.6,gain:.3,sweepTo:110});toneVoice(audio,{duration:.28,type:'sine',from:150,to:44,gain:.2})},
  trap:audio=>{noiseVoice(audio,{duration:.14,frequency:2100,q:4,gain:.36,sweepTo:520});toneVoice(audio,{duration:.2,type:'square',from:230,to:60,gain:.2})},
  growl:audio=>{toneVoice(audio,{duration:.42,type:'sawtooth',from:90,to:46,gain:.22});noiseVoice(audio,{duration:.38,type:'lowpass',frequency:380,q:.8,gain:.18,sweepTo:90})},
  house_hit:audio=>{noiseVoice(audio,{duration:.16,type:'lowpass',frequency:900,q:.9,gain:.34,sweepTo:140});toneVoice(audio,{duration:.14,type:'triangle',from:140,to:50,gain:.16})},
  ui:audio=>{toneVoice(audio,{duration:.07,type:'triangle',from:520,to:280,gain:.12})},
  place:audio=>{noiseVoice(audio,{duration:.12,frequency:700,q:1.4,gain:.22,sweepTo:180});toneVoice(audio,{duration:.1,type:'square',from:160,to:70,gain:.1})}
};
const THROTTLE={shot:.05,stas_shot:.12,impact:.04,death:.08,backfire:.25,noise_spike:.6,jam:.2,trap:.12,growl:.35,house_hit:.12,speaker_hit:.1,ui:.08,place:.1};
const SAMPLE_GAIN={stas_shot:1.35,speaker_hit:.9};

function playSample(audio,name){
  const buffer=audio.samples.get(name);if(!buffer)return false;
  const source=audio.context.createBufferSource(),level=audio.context.createGain();
  source.buffer=buffer;level.gain.value=SAMPLE_GAIN[name]??.72;
  source.connect(level);level.connect(audio.master);source.start();
  return true;
}

export function playSound(audio,name){
  if(!audio||audio.muted||(!VOICES[name]&&!SAMPLES[name]))return false;
  const context=audio.context||audio.unlock?.();
  if(!context||context.state!=='running')return false;
  const gap=THROTTLE[name]??.08,previous=audio.lastAt.has(name)?audio.lastAt.get(name):-Infinity;
  if(context.currentTime-previous<gap)return false;
  audio.lastAt.set(name,context.currentTime);
  try{
    if(playSample(audio,name))return true;
    if(VOICES[name]){VOICES[name](audio);return true}
  }catch{return false}
  return false;
}
