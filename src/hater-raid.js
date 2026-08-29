// Separate reverse-role mode: the player controls one of the existing animated zombies while
// Stas protects the speaker. Rendering stays in game.js so both modes share the same world and assets.
// Hater Raid picker: the friends/new originals are intentionally separate from the first six special archetypes.
// Every id remains playable; the compact second group stays the AI crowd so a raid does not turn into a 15-body rush.
export const RAID_TABS={
  originals:['communist_nikita','injured_kuok','tattooed_crowd_zombie','blonde_crowd_zombie','plaid_glasses_zombie','brunette_crowd_zombie','cat_keeper','dog_handler_zombie','mommy_zombie','main_hater','vomiting_alexander','lilliput','lumberjack_zombie'],
  specials:['glamour_drifter','office_runner','heavy_spitter','silent_stalker','bespectacled_teacher','boss_zombie']
};
export const RAID_ROSTER=[...RAID_TABS.originals,...RAID_TABS.specials];
const RAID_COMPANION_ROSTER=RAID_TABS.specials;
const COMPANION_HP_SCALE=.72,COMPANION_DAMAGE_SCALE=.48,COMPANION_SPACING=44;
const FENCE_SECTION_COUNT=8,IDLE_HINT_DELAY=4;
const RAID_HINTS=[
  'WASD — ИДИ К ЗАБОРУ',
  'SPACE / ЛКМ — ЛОМАЙ СЕКЦИЮ ЗАБОРА',
  'НАЙДИ ПРОЛОМ И ИДИ К ДВЕРИ ДОМА',
  'SPACE / ЛКМ — ЛОМАЙ КОЛОНКУ'
];
function fenceSectionAt(fence,x){
  return fence.sections?.find(section=>x>=section.left&&x<section.right)||fence.sections?.at(-1)||null;
}
function syncFenceHealth(fence){
  fence.hp=fence.sections.reduce((sum,section)=>sum+section.hp,0);
  fence.maxHp=fence.sections.reduce((sum,section)=>sum+section.maxHp,0);
  fence.breached=fence.sections.some(section=>section.hp<=0);
}
function damageFenceSection(raid,section,damage,x,playerDriven=false){
  if(!section||section.hp<=0)return false;
  section.hp=Math.max(0,section.hp-damage);section.hitFlash=.18;
  syncFenceHealth(raid.fence);raid.fence.hitFlash=.18;
  raid.effects.push({type:'fenceHit',x,y:raid.fence.y,life:.3,maxLife:.3});
  raid.audioEvents?.push('speaker_hit');
  if(playerDriven){raid.idleTime=0;raid.hint=null}
  if(section.hp<=0&&!raid.fence.breachAnnounced){
    raid.fence.breachAnnounced=true;setRaidStage(raid,2);raid.audioEvents?.push('backfire');
  }
  return true;
}

// Single tuning surface for the reverse-role mode. Regular bodies survive the approach, while bosses
// are capped so choosing one does not turn the raid into a two-minute walk through harmless bullets.
export const RAID_BALANCE={
  playerHpMultiplier:2.05,playerMinHp:110,playerMaxHp:650,
  speakerHp:260,fenceHp:150,attackRange:64,attackCooldown:.44,attackDamageMultiplier:4,
  moveMultiplier:1.42,tauntGain:20,tauntCooldown:.9,provocationHold:2.6,provocationDecay:6,
  stasRange:540,stasBaseCooldown:1.08,stasRageCooldown:.34,stasBaseDamage:7,stasRageDamage:14,
  comboWindow:1.05,comboStep:.22,maxCombo:4
};
export const RAID_STAGES=[
  {id:'yard',label:'ДВОР',objective:'ДОБЕРИСЬ ДО ЗАБОРА'},
  {id:'fence',label:'ЗАБОР',objective:'СЛОМАЙ ПРОХОД'},
  {id:'house',label:'ДОМ',objective:'ПРОРВИСЬ ВНУТРЬ'},
  {id:'speaker',label:'КОЛОНКА',objective:'ВЫКЛЮЧИ ПЕСНЮ'}
];
const RAID_STAGE_PRESSURE=[
  {cooldown:1.35,damage:.68},{cooldown:1.16,damage:.82},{cooldown:1,damage:1},{cooldown:.86,damage:1.12}
];
function grantStageBoost(raid,label,duration,speed=1,damage=1,heal=0){
  raid.boost={label,time:duration,maxTime:duration,speed,damage};
  if(heal)raid.player.hp=Math.min(raid.player.maxHp,raid.player.hp+heal);
  raid.stageBanner={text:`${label} · БУСТ`,life:1.7,maxLife:1.7};
}
function setRaidStage(raid,index){
  if(index<=raid.stageIndex)return;
  raid.stageIndex=Math.min(RAID_STAGES.length-1,index);
  raid.idleTime=0;raid.hint=null;
  if(raid.stageIndex===1)grantStageBoost(raid,'РАЗБЕГ',2.8,1.24,1,6);
  else if(raid.stageIndex===2)grantStageBoost(raid,'ПРОРЫВ',4,1.18,1.45,12);
  else if(raid.stageIndex===3)grantStageBoost(raid,'НАПРОЛОМ',4.5,1.12,1.55,16);
}

export function raidStatsFor(stats){
  return {
    maxHp:Math.max(RAID_BALANCE.playerMinHp,Math.min(RAID_BALANCE.playerMaxHp,Math.round(stats.hp*RAID_BALANCE.playerHpMultiplier))),
    attackDamage:Math.max(14,Math.min(46,Math.round((stats.damage||4)*RAID_BALANCE.attackDamageMultiplier)))
  };
}

export function createHaterRaid(type,world,shelter,speaker,zombieTypes){
  const stats=zombieTypes.get(type)||zombieTypes.get(RAID_ROSTER[0]),tuned=raidStatsFor(stats);
  const maxHp=tuned.maxHp,spawnY=Math.min(world.height-62,shelter.centerY+250);
  const companions=RAID_COMPANION_ROSTER.filter(id=>id!==stats.id).map((id,index)=>{
    const kind=zombieTypes.get(id),side=index%2===0?-1:1,row=Math.floor(index/2)+1;
    return {...kind,x:Math.max(28,Math.min(world.width-28,shelter.centerX+side*row*COMPANION_SPACING)),y:Math.min(world.height-34,spawnY+row*28),
      hp:Math.max(28,Math.round(kind.hp*COMPANION_HP_SCALE)),maxHp:Math.max(28,Math.round(kind.hp*COMPANION_HP_SCALE)),
      faceAngle:-Math.PI/2,animAction:'idle',animTime:0,attackTimer:0,hitFlash:0,entered:false,slot:index};
  });
  const fenceY=shelter.y+shelter.height+88,sectionWidth=world.width/FENCE_SECTION_COUNT;
  const fenceSections=Array.from({length:FENCE_SECTION_COUNT},(_,index)=>({
    index,left:index*sectionWidth,right:(index+1)*sectionWidth,
    hp:RAID_BALANCE.fenceHp,maxHp:RAID_BALANCE.fenceHp,hitFlash:0
  }));
  return {
    // The selected zombie leads; every other custom zombie enters as an AI companion.
    active:true,phase:'active',type:stats.id,player:{...stats,x:shelter.centerX,y:spawnY,hp:maxHp,maxHp,
      faceAngle:-Math.PI/2,animAction:'idle',animTime:0,attackTimer:0,hitFlash:0},companions,
    entry:{x:shelter.centerX,outsideY:shelter.y+shelter.height+18,insideY:shelter.y+shelter.height-32},
    fence:{x:shelter.centerX,y:fenceY,width:world.width,sections:fenceSections,
      hp:RAID_BALANCE.fenceHp*FENCE_SECTION_COUNT,maxHp:RAID_BALANCE.fenceHp*FENCE_SECTION_COUNT,
      hitFlash:0,breached:false,breachAnnounced:false},
    stageIndex:0,stageBanner:{text:'ЭТАП 1 · ДВОР',life:1.8,maxLife:1.8},boost:null,combo:0,comboLife:0,
    idleTime:0,hint:null,
    stas:{x:shelter.centerX,y:shelter.centerY+24,cooldown:.8,attackTimer:0,faceAngle:Math.PI/2},
    speaker:{x:speaker.x,y:speaker.y,hp:RAID_BALANCE.speakerHp,maxHp:RAID_BALANCE.speakerHp,hitFlash:0},
    shots:[],effects:[],audioEvents:[],provocation:0,provocationHold:0,tauntCooldown:0,bubble:null,elapsed:0
  };
}

export function shoutRaidTaunt(raid,line){
  if(!raid||raid.phase!=='active'||raid.tauntCooldown>0||!line)return false;
  raid.bubble={text:line,life:3.3,maxLife:3.3};
  raid.provocation=Math.min(100,raid.provocation+RAID_BALANCE.tauntGain);
  raid.provocationHold=RAID_BALANCE.provocationHold;
  raid.tauntCooldown=RAID_BALANCE.tauntCooldown;
  raid.effects.push({type:'taunt',x:raid.player.x,y:raid.player.y,life:.55,maxLife:.55});
  return true;
}

export function attackRaidSpeaker(raid){
  if(!raid||raid.phase!=='active'||raid.player.attackTimer>0)return false;
  const p=raid.player,section=fenceSectionAt(raid.fence,p.x);
  const nearFence=Math.abs(p.y-raid.fence.y)<=RAID_BALANCE.attackRange;
  const fenceTarget=nearFence&&section?.hp>0;
  const target=fenceTarget?section:raid.speaker;
  const targetX=fenceTarget?p.x:target.x,targetY=fenceTarget?raid.fence.y:target.y;
  p.attackTimer=RAID_BALANCE.attackCooldown;
  p.faceAngle=Math.atan2(targetY-p.y,targetX-p.x);
  if(!fenceTarget&&raid.stageIndex<3){
    raid.hint={text:RAID_HINTS[raid.stageIndex],life:3};
    return false;
  }
  if(Math.hypot(targetX-p.x,targetY-p.y)>RAID_BALANCE.attackRange){
    raid.hint={text:raid.stageIndex<3?RAID_HINTS[raid.stageIndex]:'ПОДОЙДИ БЛИЖЕ К КОЛОНКЕ',life:3};
    return false;
  }
  raid.combo=raid.comboLife>0?Math.min(RAID_BALANCE.maxCombo,raid.combo+1):1;
  raid.comboLife=RAID_BALANCE.comboWindow;
  const comboMultiplier=1+(raid.combo-1)*RAID_BALANCE.comboStep;
  const boostMultiplier=raid.boost?.time>0?(raid.boost.damage||1):1;
  const damage=Math.round(raidStatsFor(p).attackDamage*comboMultiplier*boostMultiplier);
  if(fenceTarget)return damageFenceSection(raid,section,damage,targetX,true);
  target.hp=Math.max(0,target.hp-damage);target.hitFlash=.18;
  raid.effects.push({type:'speakerHit',x:targetX,y:targetY,life:.3,maxLife:.3});
  raid.audioEvents?.push('speaker_hit');raid.idleTime=0;raid.hint=null;
  if(target.hp<=0)raid.phase='won';
  return true;
}

export function updateHaterRaid(raid,dt,input,world,collideShelter,advanceAnimation){
  if(!raid?.active)return;
  const p=raid.player;raid.elapsed+=dt;
  raid.tauntCooldown=Math.max(0,raid.tauntCooldown-dt);p.attackTimer=Math.max(0,p.attackTimer-dt);
  raid.comboLife=Math.max(0,(raid.comboLife||0)-dt);if(raid.comboLife<=0)raid.combo=0;
  if(raid.boost){raid.boost.time=Math.max(0,raid.boost.time-dt);if(raid.boost.time<=0)raid.boost=null}
  if(raid.stageBanner){raid.stageBanner.life-=dt;if(raid.stageBanner.life<=0)raid.stageBanner=null}
  raid.fence.hitFlash=Math.max(0,(raid.fence.hitFlash||0)-dt);
  for(const section of raid.fence.sections||[])section.hitFlash=Math.max(0,(section.hitFlash||0)-dt);
  if(raid.hint?.life!=null){raid.hint.life-=dt;if(raid.hint.life<=0)raid.hint=null}
  raid.provocationHold=Math.max(0,(raid.provocationHold||0)-dt);
  if(raid.provocationHold<=0)raid.provocation=Math.max(0,raid.provocation-RAID_BALANCE.provocationDecay*dt);
  p.hitFlash=Math.max(0,p.hitFlash-dt);raid.speaker.hitFlash=Math.max(0,raid.speaker.hitFlash-dt);
  if(raid.bubble){raid.bubble.life-=dt;if(raid.bubble.life<=0)raid.bubble=null}
  for(const effect of raid.effects)effect.life-=dt;
  raid.effects=raid.effects.filter(effect=>effect.life>0);
  if(raid.phase!=='active'){
    advanceAnimation(p,'idle',dt);
    for(const companion of raid.companions||[])advanceAnimation(companion,'idle',dt);
    return;
  }
  const dx=input.dx||0,dy=input.dy||0,magnitude=Math.hypot(dx,dy)||1;
  const oldX=p.x,oldY=p.y,speedBoost=raid.boost?.time>0?(raid.boost.speed||1):1;
  p.x=Math.max(20,Math.min(world.width-20,p.x+dx/magnitude*p.speed*RAID_BALANCE.moveMultiplier*speedBoost*dt));
  p.y=Math.max(20,Math.min(world.height-20,p.y+dy/magnitude*p.speed*RAID_BALANCE.moveMultiplier*speedBoost*dt));
  // Only the intact section under the body blocks movement; every destroyed section is a real passage.
  const fenceRadius=Math.max(10,p.radius*.7),playerSection=fenceSectionAt(raid.fence,p.x);
  if(playerSection?.hp>0){
    if(oldY>=raid.fence.y&&p.y<raid.fence.y+fenceRadius)p.y=raid.fence.y+fenceRadius;
    else if(oldY<=raid.fence.y&&p.y>raid.fence.y-fenceRadius)p.y=raid.fence.y-fenceRadius;
  }
  if(raid.stageIndex===0&&p.y<=raid.fence.y+RAID_BALANCE.attackRange)setRaidStage(raid,1);
  if(raid.fence.breached&&raid.stageIndex<2)setRaidStage(raid,2);
  collideShelter(p,p.radius*.7);
  if(raid.stageIndex===2&&p.y<=raid.entry.insideY&&Math.abs(p.x-raid.entry.x)<48)setRaidStage(raid,3);
  const moved=Math.abs(p.x-oldX)+Math.abs(p.y-oldY)>.02;
  if(dx||dy)p.faceAngle=Math.atan2(dy,dx);
  if(moved){raid.idleTime=0;if(raid.hint?.idle)raid.hint=null}
  else if(p.attackTimer<=0){
    raid.idleTime=(raid.idleTime||0)+dt;
    if(raid.idleTime>=IDLE_HINT_DELAY&&!raid.hint)raid.hint={text:RAID_HINTS[raid.stageIndex],idle:true};
  }
  advanceAnimation(p,p.attackTimer>0?'attack':(moved?'walk':'idle'),dt);

  // The crowd gathers behind the gate but lets the selected zombie break it, keeping stage two interactive.
  for(const companion of raid.companions||[]){
    companion.attackTimer=Math.max(0,companion.attackTimer-dt);companion.hitFlash=Math.max(0,companion.hitFlash-dt);
    const sections=raid.fence.sections||[];
    const assignedSection=sections.length?sections[(companion.slot+1)%sections.length]:null;
    if(assignedSection?.hp>0){
      const queueX=(assignedSection.left+assignedSection.right)/2;
      const queueY=raid.fence.y+Math.min(32,RAID_BALANCE.attackRange*.48);
      const queueDistance=Math.hypot(queueX-companion.x,queueY-companion.y);
      if(queueDistance>8){
        const queueAngle=Math.atan2(queueY-companion.y,queueX-companion.x);
        companion.x+=Math.cos(queueAngle)*companion.speed*dt;companion.y+=Math.sin(queueAngle)*companion.speed*dt;
        companion.faceAngle=queueAngle;advanceAnimation(companion,'walk',dt);
      }else{
        companion.faceAngle=-Math.PI/2;
        if(companion.attackTimer<=0){
          companion.attackTimer=companion.attack_interval||1.7;
          const damage=Math.max(2,Math.round((companion.damage||4)*COMPANION_DAMAGE_SCALE));
          damageFenceSection(raid,assignedSection,damage,companion.x);
        }
        advanceAnimation(companion,'attack',dt);
      }
      continue;
    }
    if(companion.y<=raid.entry.insideY+2)companion.entered=true;
    const aligned=Math.abs(companion.x-raid.entry.x)<=10;
    const slotAngles=[-1.18,-.58,0,.58,1.18],slotAngle=slotAngles[companion.slot%slotAngles.length];
    const attackSlot={x:raid.speaker.x+Math.cos(slotAngle)*RAID_BALANCE.attackRange*.76,y:raid.speaker.y+Math.sin(slotAngle)*RAID_BALANCE.attackRange*.76};
    const target=companion.entered
      ?attackSlot
      :!aligned||companion.y>raid.entry.outsideY
        ?{x:raid.entry.x,y:raid.entry.outsideY}
        :{x:raid.entry.x,y:raid.entry.insideY};
    const angle=Math.atan2(target.y-companion.y,target.x-companion.x);
    const speakerDistance=Math.hypot(raid.speaker.x-companion.x,raid.speaker.y-companion.y);
    if(speakerDistance>RAID_BALANCE.attackRange*.82){
      companion.x+=Math.cos(angle)*companion.speed*RAID_BALANCE.moveMultiplier*dt;
      companion.y+=Math.sin(angle)*companion.speed*RAID_BALANCE.moveMultiplier*dt;
      collideShelter(companion,companion.radius*.7);companion.faceAngle=angle;
      advanceAnimation(companion,'walk',dt);
    }else{
      companion.faceAngle=Math.atan2(raid.speaker.y-companion.y,raid.speaker.x-companion.x);
      if(companion.attackTimer<=0){
        companion.attackTimer=companion.attack_interval||1.7;
        const damage=Math.max(2,Math.round((companion.damage||4)*COMPANION_DAMAGE_SCALE));
        // The crowd helps, but the controlled zombie must land the final blow. Without this floor the
        // companions could destroy the speaker while the player was still walking through the house,
        // producing a passive victory with no interaction at the actual raid objective.
        raid.speaker.hp=Math.max(1,raid.speaker.hp-damage);raid.speaker.hitFlash=.16;
        raid.effects.push({type:'speakerHit',x:raid.speaker.x,y:raid.speaker.y,life:.22,maxLife:.22});
        raid.audioEvents?.push('speaker_hit');
      }
      advanceAnimation(companion,'attack',dt);
    }
  }
  if(raid.speaker.hp<=0){raid.phase='won';return}

  const stas=raid.stas,bodies=[p,...(raid.companions||[])].filter(body=>body.hp>0);
  // Focus fire keeps the controlled zombie under pressure instead of hiding it behind the crowd.
  const target=p.hp>0?p:bodies[0];
  if(!target){raid.phase='lost';return}
  const angle=Math.atan2(target.y-stas.y,target.x-stas.x),distance=Math.hypot(target.x-stas.x,target.y-stas.y);
  stas.faceAngle=angle;stas.attackTimer=Math.max(0,stas.attackTimer-dt);stas.cooldown-=dt;
  const provoked=raid.elapsed>.65||raid.provocation>0;
  if(stas.cooldown<=0&&distance<RAID_BALANCE.stasRange&&provoked){
    const rage=raid.provocation/100,pressure=RAID_STAGE_PRESSURE[raid.stageIndex]||RAID_STAGE_PRESSURE[0];
    stas.cooldown=(RAID_BALANCE.stasBaseCooldown-(RAID_BALANCE.stasBaseCooldown-RAID_BALANCE.stasRageCooldown)*rage)*pressure.cooldown;
    stas.attackTimer=.28;
    const spread=(Math.random()-.5)*2*((1-rage)*.18+.04),shotAngle=angle+spread;
    raid.shots.push({x:stas.x,y:stas.y-3,vx:Math.cos(shotAngle)*470,vy:Math.sin(shotAngle)*470,life:1.5,
      damage:(RAID_BALANCE.stasBaseDamage+(RAID_BALANCE.stasRageDamage-RAID_BALANCE.stasBaseDamage)*rage)*pressure.damage});
    raid.audioEvents?.push('stas_shot');
  }
  for(const shot of raid.shots){
    shot.x+=shot.vx*dt;shot.y+=shot.vy*dt;shot.life-=dt;
    const hit=shot.life>0?bodies.find(body=>Math.hypot(shot.x-body.x,shot.y-body.y)<body.radius+5):null;
    if(hit){
      shot.life=0;hit.hp=Math.max(0,hit.hp-shot.damage);hit.hitFlash=.16;
      raid.effects.push({type:'hit',x:hit.x,y:hit.y,life:.24,maxLife:.24});
    }
  }
  raid.shots=raid.shots.filter(shot=>shot.life>0);
  raid.companions=(raid.companions||[]).filter(companion=>companion.hp>0);
  if(p.hp<=0)raid.phase='lost';
}
