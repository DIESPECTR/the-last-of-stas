// Interaction layer: carried items, trap placement, boarding and the contextual prompt.
//
// The old defence model was a shop: click a button once and a trap appeared at a fixed spot forever.
// Here a trap is an object the survivor carries, drops where they choose, and can pick back up with its
// remaining charges intact. Boarding works the same way — it is an action performed at a window the
// survivor is standing next to, from either side, and it can be undone to reclaim the planks.

import {windowNear,canBoard,boardWindow,pryWindow,isInsideShelter,maxBoards} from './shelter.js';
import {createTurret,turretNear,turretStats,drawTurretGhost} from './turrets.js';

const TRAP_RADIUS=26,TRAP_CHARGES=3,REACH=42,MIN_TRAP_GAP=54,MIN_TURRET_GAP=62;
// How far from the survivor an object may be dropped. Deliberately larger than REACH: you can lob a
// trap a little further than you can bend down and retrieve it, so a trap placed at maximum range needs
// one step forward before F offers the pickup. Measured at the boundary: placing accepts 90 and refuses
// 92; the pickup radius is strictly-less-than, so a trap is offered below REACH + TRAP_RADIUS = 68 and a
// turret below REACH + turretRadius = 62 (68/62 exactly are already out of reach).
const PLACE_REACH=90;

export function createInteraction(){
  return {
    // Carried inventory. Traps and turrets are consumable objects, not one-shot purchases.
    carry:{trap:0,turret:0},
    // Remaining charges of every carried trap, newest last. A carried trap is a specific object with
    // its own wear, so a half-spent trap that goes back into the bag comes out half-spent. Keeping only
    // a count here was a real bug: picking a two-charge trap up and dropping it refilled it to three.
    // Turrets follow exactly the same rule, except the wear they carry is remaining ammunition.
    bag:{trap:[],turret:[]},
    // Ghost preview while in placement mode
    placing:null,
    traps:[],
    turrets:[]
    // No `prompt` / `promptKind` here on purpose. They used to sit in this object and were never
    // written to, so anything reading them saw a permanent 'none' while the real prompt was on screen —
    // a regression probe read exactly that and nearly reported a working feature as broken.
    // `contextAction` is the single source of truth and is recomputed once per frame.
  };
}

// --- Traps --------------------------------------------------------------------------------------

export function addTrapToInventory(interaction,count=1){
  for(let i=0;i<count;i++)interaction.bag.trap.push(TRAP_CHARGES);
  interaction.carry.trap+=count;
}

// A crafted turret enters the bag with a full magazine. What it carries back out again is whatever it
// had left when it was picked up, exactly like a trap's charges.
export function addTurretToInventory(interaction,kindId='scrap_sentry',count=1){
  const full=turretStats({kind:kindId}).ammo;
  for(let i=0;i<count;i++)interaction.bag.turret.push({kind:kindId,ammo:full});
  interaction.carry.turret+=count;
}

export function beginPlacement(interaction,kind='trap'){
  if((interaction.carry[kind]||0)<=0)return false;
  interaction.placing={kind};
  return true;
}
export function cancelPlacement(interaction){interaction.placing=null}

// A trap must sit on open ground: not inside the building, not on top of another trap, and within
// arm's reach of the survivor, so placement stays a physical act instead of a map click.
export function canPlaceAt(interaction,shelter,player,x,y,kind='trap'){
  // A turret is a machine on a tripod, not a buried spike: it may legitimately stand in a room and
  // cover the doorway. A trap is dug into the mud, so it stays outside.
  if(kind==='trap'&&isInsideShelter(shelter,x,y))return {ok:false,reason:'place_inside'};
  if(Math.hypot(x-player.x,y-player.y)>PLACE_REACH)return {ok:false,reason:'place_far'};
  for(const trap of interaction.traps)if(Math.hypot(x-trap.x,y-trap.y)<MIN_TRAP_GAP)return {ok:false,reason:'place_trap'};
  for(const turret of interaction.turrets)if(Math.hypot(x-turret.x,y-turret.y)<MIN_TURRET_GAP)return {ok:false,reason:'place_turret'};
  return {ok:true,reason:'place_ok'};
}

export function placeCarried(interaction,shelter,player,x,y){
  if(!interaction.placing)return null;
  const kind=interaction.placing.kind;
  if((interaction.carry[kind]||0)<=0)return {ok:false,message:'msg_nothing_place'};
  const check=canPlaceAt(interaction,shelter,player,x,y,kind);
  if(!check.ok)return {ok:false,message:check.reason};
  interaction.carry[kind]--;
  const stack=interaction.bag[kind];
  let message,vars={};
  if(kind==='turret'){
    const carried=stack&&stack.length?stack.pop():{kind:'scrap_sentry',ammo:turretStats({kind:'scrap_sentry'}).ammo};
    interaction.turrets.push(createTurret(x,y,carried.kind,carried.ammo));
    message='msg_turret_placed';vars={name:turretStats({kind:carried.kind}).name,ammo:carried.ammo};
  }else{
    const charges=stack&&stack.length?stack.pop():TRAP_CHARGES;
    interaction.traps.push({x,y,radius:TRAP_RADIUS,charges,armed:.4});
    message='msg_trap_placed';vars={charges};
  }
  if(interaction.carry[kind]<=0)interaction.placing=null;
  return {ok:true,message,vars};
}

// Picking a trap up returns the object itself, so an unused trap loses nothing and a half-spent one
// stays half-spent. Charges surviving the round trip is the whole point of a carried item.
export function trapNear(interaction,x,y,reach=REACH){
  let best=null,bestDistance=reach+TRAP_RADIUS;
  for(const trap of interaction.traps){
    const distance=Math.hypot(x-trap.x,y-trap.y);
    if(distance<bestDistance){bestDistance=distance;best=trap}
  }
  return best;
}

export function pickUpTrap(interaction,trap){
  const index=interaction.traps.indexOf(trap);
  if(index<0)return {ok:false,message:'msg_nothing_pickup'};
  interaction.traps.splice(index,1);
  interaction.bag.trap.push(trap.charges);
  interaction.carry.trap++;
  return {ok:true,message:trap.charges>0?'msg_trap_recovered':'msg_trap_spent_recovered',vars:{charges:trap.charges}};
}

// A wrecked turret cannot be picked up as a working machine, but it is not simply deleted either: the
// frame is salvage. Returning it to the bag with a full magazine would be the same bug the traps had.
export function pickUpTurret(interaction,turret){
  const index=interaction.turrets.indexOf(turret);
  if(index<0)return {ok:false,message:'msg_nothing_pickup'};
  interaction.turrets.splice(index,1);
  if(turret.destroyed)return {ok:true,message:'msg_wreck_stripped',salvage:{metal_scrap:1}};
  interaction.bag.turret.push({kind:turret.kind,ammo:turret.ammo});
  interaction.carry.turret++;
  return {ok:true,message:turret.ammo>0?'msg_turret_recovered':'msg_turret_dry',vars:{ammo:turret.ammo}};
}

// Called from the zombie update: the first body to enter an armed trap takes the hit and burns a charge.
export function triggerTraps(interaction,zombie,damage=36){
  for(const trap of interaction.traps){
    if(trap.charges<=0||trap.armed>0)continue;
    if(Math.hypot(zombie.x-trap.x,zombie.y-trap.y)>trap.radius+zombie.radius)continue;
    if(zombie.trappedBy===trap)continue;
    trap.charges--;trap.flash=.3;zombie.trappedBy=trap;zombie.hp-=damage;
    return trap;
  }
  return null;
}

export function updateInteraction(interaction,dt){
  for(const trap of interaction.traps){
    trap.armed=Math.max(0,(trap.armed||0)-dt);
    trap.flash=Math.max(0,(trap.flash||0)-dt);
  }
  interaction.traps=interaction.traps.filter(trap=>trap.charges>0||trap.flash>0);
}

// --- Contextual action --------------------------------------------------------------------------

// One reach check per frame decides what the F key does and what the prompt says. Priority order:
// a placed trap under your feet, then a window frame, then nothing.
export function contextAction(interaction,shelter,player,salvage={},translate=null){
  const tr=(key,vars={})=>translate?translate(key,vars):key;
  const trap=trapNear(interaction,player.x,player.y);
  if(trap)return {kind:'pickup',trap,label:tr('prompt_pickup_trap',{charges:trap.charges})};
  const turret=turretNear(interaction.turrets,player.x,player.y,REACH);
  if(turret)return {kind:'pickup_turret',turret,
    label:turret.destroyed?tr('prompt_strip_wreck'):tr('prompt_pickup_turret',{ammo:turret.ammo})};
  const win=windowNear(shelter,player.x,player.y,REACH);
  if(win){
    if(canBoard(win)){
      const affordable=(salvage.metal_scrap||0)>=1;
      return {kind:'board',window:win,affordable,label:affordable?tr('prompt_board',{boards:win.boards,max:maxBoards}):tr('prompt_no_scrap')};
    }
    return {kind:'pry',window:win,label:tr('prompt_pry',{boards:win.boards,max:maxBoards})};
  }
  if(interaction.carry.trap>0&&!interaction.placing)return {kind:'hint',label:tr('prompt_hint_trap',{count:interaction.carry.trap})};
  if(interaction.carry.turret>0&&!interaction.placing)return {kind:'hint',label:tr('prompt_hint_turret',{count:interaction.carry.turret})};
  return {kind:'none',label:''};
}

// Boarding costs salvage and gives some of it back when pried off, so hoarding planks on one window
// is a real decision instead of a free upgrade.
export function performContext(interaction,shelter,player,salvage,translate=null){
  const action=contextAction(interaction,shelter,player,salvage,translate);
  if(action.kind==='pickup')return pickUpTrap(interaction,action.trap);
  if(action.kind==='pickup_turret'){
    const result=pickUpTurret(interaction,action.turret);
    if(result.salvage)for(const [key,value] of Object.entries(result.salvage))salvage[key]=(salvage[key]||0)+value;
    return result;
  }
  if(action.kind==='board'){
    if(!action.affordable)return {ok:false,message:'msg_no_scrap'};
    salvage.metal_scrap--;
    boardWindow(shelter,action.window);
    return {ok:true,message:'msg_boarded',vars:{boards:action.window.boards,max:maxBoards}};
  }
  if(action.kind==='pry'){
    pryWindow(shelter,action.window);
    salvage.metal_scrap=(salvage.metal_scrap||0)+1;
    return {ok:true,message:'msg_pried'};
  }
  return {ok:false,message:''};
}

// --- Rendering ----------------------------------------------------------------------------------

export function drawTraps(ctx,interaction,drawSprite){
  for(const trap of interaction.traps){
    ctx.save();ctx.translate(trap.x,trap.y);
    if(trap.flash>0){
      // A trap firing has to be unmistakable at gameplay scale
      ctx.strokeStyle=`rgba(196,86,58,${(trap.flash/.3).toFixed(2)})`;ctx.lineWidth=3;
      ctx.beginPath();ctx.arc(0,0,trap.radius*(1.2+(1-trap.flash/.3)),0,Math.PI*2);ctx.stroke();
    }
    if(!drawSprite?.(ctx,0,0,trap.radius*2.2)){
      ctx.strokeStyle='#a99c7d';ctx.fillStyle='#27251f';ctx.lineWidth=3;
      ctx.beginPath();ctx.arc(0,0,trap.radius,0,Math.PI*2);ctx.stroke();
      for(let i=0;i<8;i++){const a=i*Math.PI/4;ctx.beginPath();ctx.moveTo(Math.cos(a)*8,Math.sin(a)*8);ctx.lineTo(Math.cos(a)*trap.radius,Math.sin(a)*trap.radius);ctx.stroke()}
      ctx.fillRect(-8,-8,16,16);
    }
    // Arming delay is shown, so a freshly dropped trap does not look broken
    ctx.fillStyle=trap.armed>0?'#c8a24a':'#e2d8bc';
    ctx.strokeStyle='#12130f';ctx.lineWidth=3;ctx.font='bold 12px Chivo Mono';
    const label=trap.armed>0?'ARMING':`${trap.charges}×`;
    ctx.strokeText(label,-ctx.measureText(label).width/2,5);ctx.fillText(label,-ctx.measureText(label).width/2,5);
    ctx.restore();
  }
}

// Ghost preview under the cursor: green-ish when the spot is legal, rust red when it is not.
export function drawPlacementGhost(ctx,interaction,shelter,player,mouse,translate=null){
  if(!interaction.placing)return;
  const kind=interaction.placing.kind;
  const check=canPlaceAt(interaction,shelter,player,mouse.x,mouse.y,kind);
  const reason=translate?translate(check.reason):check.reason;
  if(kind==='turret'){
    const carried=interaction.bag.turret[interaction.bag.turret.length-1];
    drawTurretGhost(ctx,mouse.x,mouse.y,check.ok,reason,carried?.kind||'scrap_sentry');
    return;
  }
  ctx.save();ctx.globalAlpha=.75;ctx.translate(mouse.x,mouse.y);
  ctx.setLineDash([6,5]);ctx.lineWidth=2;
  ctx.strokeStyle=check.ok?'#9fb05a':'#b6402c';
  ctx.beginPath();ctx.arc(0,0,TRAP_RADIUS,0,Math.PI*2);ctx.stroke();
  ctx.setLineDash([]);
  for(let i=0;i<8;i++){const a=i*Math.PI/4;ctx.beginPath();ctx.moveTo(Math.cos(a)*8,Math.sin(a)*8);ctx.lineTo(Math.cos(a)*TRAP_RADIUS*.9,Math.sin(a)*TRAP_RADIUS*.9);ctx.stroke()}
  ctx.font='bold 10px Chivo Mono';ctx.fillStyle=check.ok?'#c3cf90':'#d98a76';
  ctx.fillText(reason,-ctx.measureText(reason).width/2,-TRAP_RADIUS-8);
  ctx.restore();
}

// The prompt is drawn above the survivor rather than in the sidebar: at this scale the eye never
// leaves the character, and a prompt in a panel would simply not be read.
export function drawPrompt(ctx,player,label){
  if(!label)return;
  ctx.save();ctx.font='bold 11px Chivo Mono';
  const width=ctx.measureText(label).width+14,x=player.x-width/2,y=player.y-72;
  ctx.fillStyle='rgba(14,15,12,.82)';ctx.fillRect(x,y,width,18);
  ctx.strokeStyle='rgba(168,154,116,.7)';ctx.lineWidth=1;ctx.strokeRect(x,y,width,18);
  ctx.fillStyle='#ded3b4';ctx.fillText(label,x+7,y+13);
  ctx.restore();
}
