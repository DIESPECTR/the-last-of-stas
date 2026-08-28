// Comic roast bubbles over approaching zombies. The horde is here because the house is blasting
// «Зомбэ», so they talk like comment-section haters, not like undead. Lines stay in this module
// (diegetic jokes, not HUD copy) so they never collide with i18n keys.

// Approved Russian comments only. They are selected randomly without duplicating a line that is
// already visible over another zombie.
// This line is character-locked: only the Lumberjack may say it, and the Lumberjack may say nothing else.
export const LUMBERJACK_LINE='Привет, чем заинтересовал?';
const LUMBERJACK_ID='lumberjack_zombie';

export const TAUNT_LINES=[
  'Молодец. Несмотря на то, что хуйня — ну молодец прям.',
  'На этот раз очень даже хуёво.',
  'Ну артист, ну талант — прямо немощь.',
  'Тоже мне критики диванные.',
  'Кто бы что ни говорил, а Стас делает хуйню.',
  'Стас спел хуйню. Позор. Что за говно? А ты попробуй спеть такую залупку.',
  'Это насколько надо быть смелым. Молодец, Стас.',
  'Кстати, очень даже хуёво.',
  'Музыка для секса не по желанию.',
  'С днём зомби всех.'
];

const MAX_LIVE=3;
const SHOW_FOR=4.8;
const APPROACH_NEAR=92;
const APPROACH_FAR=360;
const CHANCE=.7;

function pickLine(used){
  const free=TAUNT_LINES.filter(line=>!used.has(line));
  const pool=free.length?free:TAUNT_LINES;
  return pool[Math.floor(Math.random()*pool.length)];
}

function wrapText(ctx,text,maxWidth){
  const words=text.split(' ');
  const lines=[];
  let current='';
  for(const word of words){
    const trial=current?`${current} ${word}`:word;
    if(current&&ctx.measureText(trial).width>maxWidth){lines.push(current);current=word}
    else current=trial;
  }
  if(current)lines.push(current);
  return lines;
}

export function resetTaunts(){
  // Taunts are stateless between waves; each armed zombie gets a fresh random delay.
}

export function armTaunt(zombie){
  zombie.taunt=null;
  zombie.tauntDelay=.5+Math.random()*1.8;
  zombie.tauntMode=zombie.id===LUMBERJACK_ID?'lumberjack':'roast';
}

export function updateTaunts(zombies,shelter,dt){
  if(!zombies?.length)return;
  let live=0;
  const used=new Set();
  for(const zombie of zombies){
    if(zombie.taunt){live++;used.add(zombie.taunt.text)}
  }
  for(const zombie of zombies){
    if(zombie.taunt){
      zombie.taunt.life-=dt;
      if(zombie.taunt.life<=0)zombie.taunt=null;
      continue;
    }
    zombie.tauntDelay=(zombie.tauntDelay??1.2)-dt;
    if(live>=MAX_LIVE||zombie.tauntDelay>0)continue;
    const distance=Math.hypot(zombie.x-shelter.centerX,zombie.y-shelter.centerY);
    if(distance<APPROACH_NEAR||distance>APPROACH_FAR){zombie.tauntDelay=.4+Math.random();continue}
    // Lumberjack bypasses the roast lottery and owns one exact phrase. The phrase is intentionally
    // absent from TAUNT_LINES, making it impossible for any other zombie to receive it.
    if(zombie.tauntMode!=='lumberjack'&&Math.random()>CHANCE){zombie.tauntDelay=.6+Math.random()*1.2;continue}
    zombie.taunt={text:zombie.tauntMode==='lumberjack'?LUMBERJACK_LINE:pickLine(used),life:SHOW_FOR,maxLife:SHOW_FOR};
    used.add(zombie.taunt.text);
    zombie.tauntDelay=5+Math.random()*4;
    live++;
  }
}

export function drawTaunts(ctx,zombies){
  if(!zombies?.length)return;
  ctx.save();
  ctx.globalCompositeOperation='source-over';
  ctx.filter='none';
  ctx.shadowBlur=0;
  ctx.font='bold 13px "Chivo Mono",monospace';
  ctx.textAlign='center';
  ctx.textBaseline='middle';
  for(const zombie of zombies){
    const taunt=zombie.taunt;
    if(!taunt)continue;
    const lines=wrapText(ctx,taunt.text,168);
    const padX=10,padY=7,lineH=15;
    const width=Math.max(36,...lines.map(line=>ctx.measureText(line).width))+padX*2;
    const height=lines.length*lineH+padY*2;
    const t=1-taunt.life/taunt.maxLife;
    // Never start invisible. Old pop went 0→1 over 0.4s and cinema ate the line.
    const fadeOut=taunt.life<.4?Math.max(.55,taunt.life/.4):1;
    const pop=t<.08?.85+t/.08*.15:1;
    const alpha=fadeOut*pop;
    const x=zombie.x;
    const y=zombie.y-62-height*.5;
    ctx.save();
    ctx.translate(x,y);
    ctx.scale(.88+.12*pop,.88+.12*pop);
    ctx.globalAlpha=alpha;
    ctx.shadowColor='#000c';
    ctx.shadowBlur=10;
    ctx.shadowOffsetY=3;
    ctx.fillStyle='#efe6cc';
    ctx.strokeStyle='#1a1814';
    ctx.lineWidth=2;
    const left=-width/2,top=-height/2,r=8;
    ctx.beginPath();
    ctx.moveTo(left+r,top);
    ctx.lineTo(left+width-r,top);
    ctx.quadraticCurveTo(left+width,top,left+width,top+r);
    ctx.lineTo(left+width,top+height-r);
    ctx.quadraticCurveTo(left+width,top+height,left+width-r,top+height);
    ctx.lineTo(8,top+height);
    ctx.lineTo(0,top+height+9);
    ctx.lineTo(-8,top+height);
    ctx.lineTo(left+r,top+height);
    ctx.quadraticCurveTo(left,top+height,left,top+height-r);
    ctx.lineTo(left,top+r);
    ctx.quadraticCurveTo(left,top,left+r,top);
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur=0;
    ctx.shadowOffsetY=0;
    ctx.stroke();
    ctx.fillStyle='#1a1814';
    lines.forEach((line,i)=>ctx.fillText(line,0,top+padY+lineH*(i+.5)));
    ctx.restore();
  }
  ctx.restore();
}
