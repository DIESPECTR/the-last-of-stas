// Automated turrets: a carried object that fights on its own once it is on the ground.
//
// The point of a turret is that it covers an angle the survivor is not looking at. That only works if
// it is a real thing in the yard: it has to spin up, run out of ammunition, make noise that pulls the
// horde towards it, and be destroyed by the bodies that reach it. A turret that cannot die would just
// be a free wall, so damage is the core of the design, not an afterthought.

const RADIUS=20,RANGE=210,SPIN_UP=1.1,SHOT_SPEED=470;

// One scavenged frame, three loadouts. Ammo is deliberately small: a turret is a burst of covering
// fire on one approach, not a permanent solution to a direction.
export const turretKinds={
  scrap_sentry:{id:'scrap_sentry',name:'SCRAP SENTRY',ammo:26,damage:9,interval:.34,noise:22,hp:80,spread:.05,arc:Math.PI*2},
  nail_thrower:{id:'nail_thrower',name:'NAIL THROWER',ammo:40,damage:5,interval:.13,noise:14,hp:64,spread:.13,arc:Math.PI*2}
};

export function createTurret(x,y,kindId='scrap_sentry',ammo=null){
  const kind=turretKinds[kindId]||turretKinds.scrap_sentry;
  return {
    kind:kind.id,x,y,radius:RADIUS,
    angle:-Math.PI/2,
    ammo:ammo==null?kind.ammo:ammo,
    hp:kind.hp,maxHp:kind.hp,
    // Spin-up exists so a turret dropped on top of a body does not instantly delete it, and so the
    // player can hear that the thing has started working before it starts costing ammunition.
    spinUp:SPIN_UP,
    cooldown:0,flash:0,hitFlash:0,
    destroyed:false,
    // Sweep angle when idle, so an unengaged turret is visibly alive rather than frozen
    sweep:Math.random()*Math.PI*2
  };
}

export function turretStats(turret){return turretKinds[turret.kind]||turretKinds.scrap_sentry}

// Targeting: nearest body inside range that is not behind the facade. A turret in the yard shooting a
// zombie that has already broken into the house looked like a bug the first time it happened, so the
// inside/outside test is part of acquisition rather than a filter on the shot.
function acquire(turret,zombies,isInside){
  let best=null,bestDistance=RANGE;
  const turretInside=isInside(turret.x,turret.y);
  for(const zombie of zombies){
    if(zombie.hp<=0)continue;
    if(isInside(zombie.x,zombie.y)!==turretInside)continue;
    const distance=Math.hypot(zombie.x-turret.x,zombie.y-turret.y);
    if(distance<bestDistance){bestDistance=distance;best=zombie}
  }
  return best;
}

// The turret turns at a finite rate. Instant snapping made it read as a hitscan script; a visible
// traverse means a body that comes in from the flank genuinely gets a few free steps.
const TRAVERSE=3.4;
function turnToward(turret,target,dt){
  const wanted=Math.atan2(target.y-turret.y,target.x-turret.x);
  let delta=wanted-turret.angle;
  while(delta>Math.PI)delta-=Math.PI*2;
  while(delta<-Math.PI)delta+=Math.PI*2;
  const step=Math.max(-TRAVERSE*dt,Math.min(TRAVERSE*dt,delta));
  turret.angle+=step;
  return Math.abs(delta-step)<.22;
}

// Returns the shots fired this frame in the same shape the player's weapon produces, so the existing
// projectile loop handles turret fire with no special case at all.
export function updateTurrets(turrets,dt,zombies,isInside,noise){
  const shots=[];
  for(const turret of turrets){
    turret.flash=Math.max(0,turret.flash-dt);
    turret.hitFlash=Math.max(0,turret.hitFlash-dt);
    if(turret.destroyed)continue;
    if(turret.spinUp>0){turret.spinUp=Math.max(0,turret.spinUp-dt);turret.sweep+=dt*2.6;turret.angle=turret.sweep;continue}
    turret.cooldown=Math.max(0,turret.cooldown-dt);
    const stats=turretStats(turret);
    const target=turret.ammo>0?acquire(turret,zombies,isInside):null;
    if(!target){
      // Idle sweep, slow enough to look like a mechanism searching rather than a spinning prop
      turret.sweep+=dt*.85;turret.angle=Math.sin(turret.sweep)*1.15-Math.PI/2;
      continue;
    }
    const onTarget=turnToward(turret,target,dt);
    if(!onTarget||turret.cooldown>0)continue;
    const angle=turret.angle+(Math.random()-.5)*stats.spread*2;
    shots.push({x:turret.x+Math.cos(angle)*turret.radius,y:turret.y+Math.sin(angle)*turret.radius,
      vx:Math.cos(angle)*SHOT_SPEED,vy:Math.sin(angle)*SHOT_SPEED,life:RANGE/SHOT_SPEED,damage:stats.damage,fromTurret:true});
    turret.ammo--;turret.cooldown=stats.interval;turret.flash=.07;
    // Turret fire is loud. This is the honest cost of the thing: it draws the horde onto itself, which
    // is useful when you want it to and fatal when you placed it next to the door.
    noise?.(turret.x,turret.y,stats.noise);
  }
  return shots;
}

// Bodies chew through a turret. A destroyed turret is left in place as a wreck rather than deleted,
// because a pile of scrap where your cover used to be tells the story better than an empty patch.
export function damageTurret(turret,amount){
  if(turret.destroyed)return false;
  turret.hp-=amount;turret.hitFlash=.14;
  if(turret.hp<=0){turret.hp=0;turret.destroyed=true;return true}
  return false;
}

export function turretNear(turrets,x,y,reach){
  let best=null,bestDistance=reach+RADIUS;
  for(const turret of turrets){
    const distance=Math.hypot(x-turret.x,y-turret.y);
    if(distance<bestDistance){bestDistance=distance;best=turret}
  }
  return best;
}

export const turretRadius=RADIUS;
export const turretRange=RANGE;

// --- Rendering ----------------------------------------------------------------------------------

// Drawn procedurally: base plate, traverse housing, barrel along the current angle. The barrel is the
// readable part — the whole reason to look at a turret is to see where it is currently pointing.
export function drawTurrets(ctx,turrets,drawSprite){
  for(const turret of turrets){
    ctx.save();ctx.translate(turret.x,turret.y);
    // Ground shadow keeps it planted instead of floating over the mud
    ctx.fillStyle='rgba(8,9,7,.42)';ctx.beginPath();ctx.ellipse(2,6,turret.radius*1.05,turret.radius*.5,0,0,Math.PI*2);ctx.fill();
    if(!drawSprite?.(ctx,turret,turret.radius*2.6)){
      const dead=turret.destroyed;
      // Tripod legs
      ctx.strokeStyle=dead?'#4a463c':'#6e6552';ctx.lineWidth=3;
      for(let i=0;i<3;i++){const a=turret.sweep*0+i*Math.PI*2/3+.4;ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(Math.cos(a)*turret.radius,Math.sin(a)*turret.radius*.62);ctx.stroke()}
      // Housing
      ctx.fillStyle=dead?'#2b2924':'#3b3830';ctx.strokeStyle=dead?'#514c40':'#8d8676';ctx.lineWidth=2;
      ctx.beginPath();ctx.arc(0,-2,turret.radius*.62,0,Math.PI*2);ctx.fill();ctx.stroke();
      if(!dead){
        // Barrel
        ctx.rotate(turret.angle);
        ctx.fillStyle='#6f6553';ctx.fillRect(0,-3.5,turret.radius*1.45,7);
        ctx.fillStyle='#221f1a';ctx.fillRect(turret.radius*1.1,-2.5,6,5);
        if(turret.flash>0){
          ctx.fillStyle=`rgba(255,214,140,${(turret.flash/.07*.9).toFixed(2)})`;
          ctx.beginPath();ctx.moveTo(turret.radius*1.45,-5);ctx.lineTo(turret.radius*1.45+14,0);ctx.lineTo(turret.radius*1.45,5);ctx.closePath();ctx.fill();
        }
        ctx.rotate(-turret.angle);
      }else{
        // Wreck: collapsed barrel and a scorch
        ctx.strokeStyle='#3a352d';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(-2,0);ctx.lineTo(turret.radius*.9,turret.radius*.5);ctx.stroke();
        ctx.fillStyle='rgba(18,16,13,.5)';ctx.beginPath();ctx.ellipse(0,4,turret.radius*.9,turret.radius*.45,0,0,Math.PI*2);ctx.fill();
      }
    }
    if(turret.hitFlash>0){ctx.fillStyle=`rgba(214,120,86,${(turret.hitFlash/.14*.5).toFixed(2)})`;ctx.beginPath();ctx.arc(0,-2,turret.radius*.8,0,Math.PI*2);ctx.fill()}
    // Readout: ammunition, spin-up or wreck state, plus a health bar once it has been hurt
    ctx.font='bold 11px Chivo Mono';ctx.lineWidth=3;ctx.strokeStyle='#12130f';
    const label=turret.destroyed?'WRECKED':turret.spinUp>0?'SPIN UP':turret.ammo>0?`${turret.ammo}`:'DRY';
    ctx.fillStyle=turret.destroyed?'#8d8676':turret.ammo>0?'#e2d8bc':'#c8a24a';
    ctx.strokeText(label,-ctx.measureText(label).width/2,turret.radius+14);
    ctx.fillText(label,-ctx.measureText(label).width/2,turret.radius+14);
    if(!turret.destroyed&&turret.hp<turret.maxHp){
      const w=turret.radius*1.8,ratio=turret.hp/turret.maxHp;
      ctx.fillStyle='rgba(12,13,10,.75)';ctx.fillRect(-w/2,-turret.radius-12,w,4);
      ctx.fillStyle=ratio>.5?'#9fb05a':'#b6402c';ctx.fillRect(-w/2,-turret.radius-12,w*ratio,4);
    }
    ctx.restore();
  }
}

// Placement ghost, including the range ring: where a turret can see is the only thing that matters
// when deciding where to put it, so the radius is shown before it is committed.
export function drawTurretGhost(ctx,x,y,ok,reason,kindId='scrap_sentry'){
  ctx.save();ctx.translate(x,y);ctx.globalAlpha=.8;
  ctx.setLineDash([7,6]);ctx.lineWidth=1.5;ctx.strokeStyle=ok?'rgba(159,176,90,.55)':'rgba(182,64,44,.5)';
  ctx.beginPath();ctx.arc(0,0,RANGE,0,Math.PI*2);ctx.stroke();
  ctx.lineWidth=2;ctx.strokeStyle=ok?'#9fb05a':'#b6402c';
  ctx.beginPath();ctx.arc(0,0,RADIUS,0,Math.PI*2);ctx.stroke();
  ctx.setLineDash([]);
  for(let i=0;i<3;i++){const a=i*Math.PI*2/3+.4;ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(Math.cos(a)*RADIUS,Math.sin(a)*RADIUS*.62);ctx.stroke()}
  ctx.font='bold 10px Chivo Mono';ctx.fillStyle=ok?'#c3cf90':'#d98a76';
  const name=(turretKinds[kindId]||turretKinds.scrap_sentry).name;
  ctx.fillText(name,-ctx.measureText(name).width/2,-RADIUS-20);
  ctx.fillText(reason,-ctx.measureText(reason).width/2,-RADIUS-8);
  ctx.restore();
}
