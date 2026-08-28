// Blood. Three separate systems, because they live on completely different timescales and the single
// fading ellipse the game had before could not stand in for any of them:
//
//   spray   — airborne droplets, gone in under a second, sells the moment of the hit
//   pool    — ground stain that spreads then dries; the record of where a body fell
//   splatter— droplets that landed on a wall and run downwards; the record of a fight in a room
//
// Everything is drawn under the entities so the survivor never wades on top of their own footprints,
// and every stain is capped so a long night cannot turn into an unbounded particle list.

// Blood darkens as it dries. Fresh arterial red is only correct for the first second or so; after that
// it goes to the brown-black that reads as old blood in a lightless yard.
const FRESH='#7d1712',DRY='#2e1210';
// Hard caps. A five minute night with a heavy weapon produced thousands of stains in testing, which
// cost more per frame than every entity combined.
const MAX_DROPS=260,MAX_POOLS=90,MAX_SPLATTERS=120;

export function createBlood(){
  return {drops:[],pools:[],splatters:[]};
}

function mix(a,b,k){
  const pa=parseInt(a.slice(1),16),pb=parseInt(b.slice(1),16);
  const r=Math.round((pa>>16)+(((pb>>16)-(pa>>16))*k));
  const g=Math.round(((pa>>8)&255)+((((pb>>8)&255)-((pa>>8)&255))*k));
  const bl=Math.round((pa&255)+(((pb&255)-(pa&255))*k));
  return `rgb(${r},${g},${bl})`;
}

// A hit: a cone of droplets thrown along the shot direction, plus a small immediate pool under the body.
// `power` scales both the count and the throw distance, so a shotgun hit reads heavier than a nail.
export function spurt(blood,x,y,angle,power=1){
  const count=Math.round(5+power*7);
  for(let i=0;i<count;i++){
    const spread=(Math.random()-.5)*1.15,speed=60+Math.random()*180*power;
    blood.drops.push({
      x,y,
      vx:Math.cos(angle+spread)*speed,
      vy:Math.sin(angle+spread)*speed,
      // Droplets are thrown up as well as out; `z` and `vz` give them an arc so they land rather than
      // sliding along the floor, which is what made the old flat particles read as sparks.
      z:6+Math.random()*7,vz:40+Math.random()*70,
      size:1+Math.random()*2.2*power,
      life:.9+Math.random()*.5,maxLife:1.4
    });
  }
  if(blood.drops.length>MAX_DROPS)blood.drops.splice(0,blood.drops.length-MAX_DROPS);
  addPool(blood,x,y,2.2+power*1.6,.5);
}

// A death: a wide pool and a heavy low spray in every direction.
export function gush(blood,x,y,radius){
  for(let i=0;i<22;i++){
    const angle=Math.random()*Math.PI*2,speed=40+Math.random()*150;
    blood.drops.push({x,y,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,z:3+Math.random()*5,vz:20+Math.random()*50,
      size:1.4+Math.random()*2.6,life:1+Math.random()*.6,maxLife:1.6});
  }
  if(blood.drops.length>MAX_DROPS)blood.drops.splice(0,blood.drops.length-MAX_DROPS);
  addPool(blood,x,y,radius*.55,1);
}

// Pools grow towards `size` instead of appearing at full width: blood spreading out from under a body
// over a second or two is most of what makes a kill feel weighty.
function addPool(blood,x,y,size,opacity){
  // Nearby pools merge rather than stack. Overlapping alpha built up to a solid black blob wherever the
  // horde bunched at a wall, which is exactly where most kills happen.
  const near=blood.pools.find(p=>Math.hypot(p.x-x,p.y-y)<p.size*.85);
  if(near){near.size=Math.min(34,Math.hypot(near.size,size*.8));near.age=Math.min(near.age,1.2);return}
  blood.pools.push({x,y,size:0,target:size,opacity,age:0,seed:Math.random()*6.283});
  if(blood.pools.length>MAX_POOLS)blood.pools.shift();
}

// A body that took a hit while pressed against a wall paints it. `nx,ny` is the wall normal, so the
// droplets run down the face the shot came from.
export function splatterWall(blood,x,y,angle,power=1){
  const count=Math.round(3+power*4);
  for(let i=0;i<count;i++){
    const spread=(Math.random()-.5)*.9;
    blood.splatters.push({
      x:x+Math.cos(angle+spread)*(4+Math.random()*14),
      y:y+Math.sin(angle+spread)*(4+Math.random()*10),
      size:1.2+Math.random()*2.6*power,
      // How far this droplet has run down the wall so far, and how far it will get before it dries.
      run:0,runTarget:3+Math.random()*16*power,
      age:0
    });
  }
  if(blood.splatters.length>MAX_SPLATTERS)blood.splatters.splice(0,blood.splatters.length-MAX_SPLATTERS);
}

// A wounded body drips as it walks. Called from the zombie update, throttled by the caller.
export function dripTrail(blood,x,y){
  blood.pools.push({x:x+(Math.random()-.5)*6,y:y+(Math.random()-.5)*4,size:0,target:1.2+Math.random()*1.8,opacity:.55,age:0,seed:Math.random()*6.283});
  if(blood.pools.length>MAX_POOLS)blood.pools.shift();
}

export function updateBlood(blood,dt){
  for(const d of blood.drops){
    d.x+=d.vx*dt;d.y+=d.vy*dt;
    d.z+=d.vz*dt;d.vz-=260*dt;
    // Drag, so droplets decelerate instead of flying at a constant speed until they expire
    d.vx*=1-2.4*dt;d.vy*=1-2.4*dt;
    if(d.z<=0&&d.vz<0){
      // Landed: becomes a permanent-ish mark on the ground and stops being a particle
      d.life=0;
      addPool(blood,d.x,d.y,d.size*.9,.5);
      continue;
    }
    d.life-=dt;
  }
  blood.drops=blood.drops.filter(d=>d.life>0);
  for(const p of blood.pools){p.age+=dt;p.size+=(p.target-p.size)*Math.min(1,dt*2.2)}
  for(const s of blood.splatters){s.age+=dt;s.run+=(s.runTarget-s.run)*Math.min(1,dt*1.1)}
}

// Ground layer: pools first, then the runs on the walls, then the airborne droplets on top.
export function drawBloodGround(ctx,blood){
  ctx.save();
  for(const p of blood.pools){
    if(p.size<.3)continue;
    // Drying: alpha settles rather than fading out completely, and the colour walks to DRY over 8s
    const dry=Math.min(1,p.age/8);
    ctx.globalAlpha=p.opacity*(.72-dry*.22);
    ctx.fillStyle=mix(FRESH,DRY,dry);
    ctx.beginPath();
    // Pools are not circles. Three overlapping ellipses at a fixed per-pool seed give an irregular edge
    // that stays stable frame to frame.
    for(let i=0;i<3;i++){
      const a=p.seed+i*2.1,r=p.size*(.7+((i*37)%11)/22);
      ctx.ellipse(p.x+Math.cos(a)*p.size*.3,p.y+Math.sin(a)*p.size*.18,r,r*.44,a,0,Math.PI*2);
    }
    ctx.fill();
  }
  ctx.restore();
}

export function drawBloodSplatter(ctx,blood){
  ctx.save();
  for(const s of blood.splatters){
    const dry=Math.min(1,s.age/10);
    ctx.globalAlpha=.66-dry*.2;
    ctx.fillStyle=mix(FRESH,DRY,dry);
    // The landing mark plus the streak below it, drawn as one tapering shape
    ctx.beginPath();
    ctx.ellipse(s.x,s.y,s.size,s.size*.9,0,0,Math.PI*2);
    ctx.fill();
    if(s.run>1){
      ctx.beginPath();
      ctx.moveTo(s.x-s.size*.45,s.y);
      ctx.lineTo(s.x+s.size*.45,s.y);
      ctx.lineTo(s.x+s.size*.14,s.y+s.run);
      ctx.lineTo(s.x-s.size*.14,s.y+s.run);
      ctx.closePath();
      ctx.fill();
      // The bead at the bottom of a run, which is what actually makes it read as wet
      ctx.beginPath();ctx.ellipse(s.x,s.y+s.run,s.size*.42,s.size*.55,0,0,Math.PI*2);ctx.fill();
    }
  }
  ctx.restore();
}

export function drawBloodDrops(ctx,blood){
  ctx.save();
  ctx.fillStyle=FRESH;
  for(const d of blood.drops){
    ctx.globalAlpha=Math.min(.9,d.life/d.maxLife+.25);
    // The shadow on the ground under an airborne droplet: the only cue that gives the arc any height
    ctx.globalAlpha*=.6;ctx.fillStyle='#1a0d0c';
    ctx.beginPath();ctx.ellipse(d.x,d.y,d.size*.7,d.size*.3,0,0,Math.PI*2);ctx.fill();
    ctx.globalAlpha=Math.min(.95,d.life/d.maxLife+.3);ctx.fillStyle=FRESH;
    // Droplets stretch along their own velocity: a round dot reads as a bubble, a streak reads as spray
    const speed=Math.hypot(d.vx,d.vy)||1;
    ctx.save();
    ctx.translate(d.x,d.y-d.z);
    ctx.rotate(Math.atan2(d.vy,d.vx));
    ctx.beginPath();ctx.ellipse(0,0,d.size*(1+speed/260),d.size*.72,0,0,Math.PI*2);ctx.fill();
    ctx.restore();
  }
  ctx.restore();
}
