// Separate reverse-role mode: the player controls one of the existing animated zombies while
// Stas protects the speaker. Rendering stays in game.js so both modes share the same world and assets.
// Hater Raid picker: the friends/new originals are intentionally separate from the first six special archetypes.
// Every id remains playable; the compact second group stays the AI crowd so a raid does not turn into a 15-body rush.
export const RAID_TABS={
  originals:['communist_nikita','tattooed_crowd_zombie','blonde_crowd_zombie','plaid_glasses_zombie','brunette_crowd_zombie','cat_keeper','dog_handler_zombie','vomiting_alexander','lilliput','lumberjack_zombie','injured_kuok'],
  specials:['glamour_drifter','office_runner','heavy_spitter','silent_stalker','bespectacled_teacher','boss_zombie']
};
export const RAID_ROSTER=[...RAID_TABS.originals,...RAID_TABS.specials];
const RAID_COMPANION_ROSTER=RAID_TABS.specials;
const COMPANION_HP_SCALE=.72,COMPANION_DAMAGE_SCALE=.48,COMPANION_SPACING=44;

// Single tuning surface for the reverse-role mode. Regular bodies survive the approach, while bosses
// are capped so choosing one does not turn the raid into a two-minute walk through harmless bullets.
export const RAID_BALANCE={
  playerHpMultiplier:2.05,playerMinHp:110,playerMaxHp:650,
  speakerHp:260,attackRange:64,attackCooldown:.44,attackDamageMultiplier:4,
  moveMultiplier:1.42,tauntGain:20,tauntCooldown:.9,provocationHold:2.6,provocationDecay:6,
  stasRange:540,stasBaseCooldown:1.08,stasRageCooldown:.34,stasBaseDamage:7,stasRageDamage:14
};

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
  return {
    // The selected zombie leads; every other custom zombie enters as an AI companion.
    active:true,phase:'active',type:stats.id,player:{...stats,x:shelter.centerX,y:spawnY,hp:maxHp,maxHp,
      faceAngle:-Math.PI/2,animAction:'idle',animTime:0,attackTimer:0,hitFlash:0},companions,
    entry:{x:shelter.centerX,outsideY:shelter.y+shelter.height+18,insideY:shelter.y+shelter.height-32},
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
  const p=raid.player,s=raid.speaker;
  p.attackTimer=RAID_BALANCE.attackCooldown;
  p.faceAngle=Math.atan2(s.y-p.y,s.x-p.x);
  if(Math.hypot(s.x-p.x,s.y-p.y)>RAID_BALANCE.attackRange)return false;
  const damage=raidStatsFor(p).attackDamage;
  s.hp=Math.max(0,s.hp-damage);s.hitFlash=.18;
  raid.effects.push({type:'speakerHit',x:s.x,y:s.y,life:.3,maxLife:.3});
  raid.audioEvents?.push('speaker_hit');
  if(s.hp<=0)raid.phase='won';
  return true;
}

export function updateHaterRaid(raid,dt,input,world,collideShelter,advanceAnimation){
  if(!raid?.active)return;
  const p=raid.player;raid.elapsed+=dt;
  raid.tauntCooldown=Math.max(0,raid.tauntCooldown-dt);p.attackTimer=Math.max(0,p.attackTimer-dt);
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
  const oldX=p.x,oldY=p.y;
  p.x=Math.max(20,Math.min(world.width-20,p.x+dx/magnitude*p.speed*RAID_BALANCE.moveMultiplier*dt));
  p.y=Math.max(20,Math.min(world.height-20,p.y+dy/magnitude*p.speed*RAID_BALANCE.moveMultiplier*dt));
  collideShelter(p,p.radius*.7);
  if(dx||dy)p.faceAngle=Math.atan2(dy,dx);
  advanceAnimation(p,p.attackTimer>0?'attack':(Math.abs(p.x-oldX)+Math.abs(p.y-oldY)>.02?'walk':'idle'),dt);

  // Every non-selected custom zombie follows the south doorway and attacks the same speaker.
  for(const companion of raid.companions||[]){
    companion.attackTimer=Math.max(0,companion.attackTimer-dt);companion.hitFlash=Math.max(0,companion.hitFlash-dt);
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
        raid.speaker.hp=Math.max(0,raid.speaker.hp-damage);raid.speaker.hitFlash=.16;
        raid.effects.push({type:'speakerHit',x:raid.speaker.x,y:raid.speaker.y,life:.22,maxLife:.22});
        raid.audioEvents?.push('speaker_hit');
      }
      advanceAnimation(companion,'attack',dt);
    }
  }
  if(raid.speaker.hp<=0){raid.phase='won';return}

  const stas=raid.stas,bodies=[p,...(raid.companions||[])].filter(body=>body.hp>0);
  const target=bodies.reduce((nearest,body)=>!nearest||Math.hypot(body.x-stas.x,body.y-stas.y)<Math.hypot(nearest.x-stas.x,nearest.y-stas.y)?body:nearest,null);
  if(!target){raid.phase='lost';return}
  const angle=Math.atan2(target.y-stas.y,target.x-stas.x),distance=Math.hypot(target.x-stas.x,target.y-stas.y);
  stas.faceAngle=angle;stas.attackTimer=Math.max(0,stas.attackTimer-dt);stas.cooldown-=dt;
  const provoked=raid.provocation>0||distance<190;
  if(stas.cooldown<=0&&distance<RAID_BALANCE.stasRange&&provoked){
    const rage=raid.provocation/100;
    stas.cooldown=RAID_BALANCE.stasBaseCooldown-(RAID_BALANCE.stasBaseCooldown-RAID_BALANCE.stasRageCooldown)*rage;
    stas.attackTimer=.28;
    const spread=(Math.random()-.5)*2*((1-rage)*.18+.04),shotAngle=angle+spread;
    raid.shots.push({x:stas.x,y:stas.y-3,vx:Math.cos(shotAngle)*470,vy:Math.sin(shotAngle)*470,life:1.5,
      damage:RAID_BALANCE.stasBaseDamage+(RAID_BALANCE.stasRageDamage-RAID_BALANCE.stasBaseDamage)*rage});
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
