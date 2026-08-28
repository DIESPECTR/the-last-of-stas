// Temporary 9:16 Reels / phone crop.
// Gameplay lives in a TALL world (960×960). Desktop shows the
// middle 960×600 window. Reel shows a 9:16 slice of the FULL height so
// the extra north/south yards are visible and zombies walk in from there.
// Toggle: ?reel=1 or the РЕЛСЫ button. Rollback = turn it off.

const ASPECT=9/16;
const DESKTOP={width:960,height:600};
// Phone view is 9:16 of the tall world: 540×960. House (~272) is ~50% of width.
const REEL_VIEW_W=540;

let active=false;

export function wantsReel(){
  return new URLSearchParams(location.search).get('reel')==='1';
}
export function isReel(){return active}

export function viewRect(world,focus){
  if(active){
    const w=Math.min(world.width,REEL_VIEW_W);
    const h=world.height;
    const cx=focus?.x??world.width/2;
    return {x:Math.max(0,Math.min(world.width-w,cx-w/2)),y:0,w,h};
  }
  const w=Math.min(world.width,DESKTOP.width);
  const h=Math.min(world.height,DESKTOP.height);
  return {x:0,y:Math.max(0,(world.height-h)/2),w,h};
}

export function frameRect(){
  if(active)return {x:0,y:0,w:DESKTOP.height*ASPECT,h:DESKTOP.height};
  return {x:0,y:0,w:DESKTOP.width,h:DESKTOP.height};
}

export function applyCanvasSize(canvas){
  const frame=frameRect();
  const dpr=Math.max(1,Math.min(2,window.devicePixelRatio||1));
  canvas.width=Math.round(frame.w*dpr);
  canvas.height=Math.round(frame.h*dpr);
  return dpr;
}

export function worldFromClient(canvas,clientX,clientY,world,focus){
  const rect=canvas.getBoundingClientRect();
  const frame=frameRect();
  const view=viewRect(world,focus);
  const sx=frame.w/rect.width,sy=frame.h/rect.height;
  const layout=fit(view,frame);
  return {
    x:view.x+(clientX-rect.left)*sx/layout.scale-layout.ox/layout.scale,
    y:view.y+(clientY-rect.top)*sy/layout.scale-layout.oy/layout.scale
  };
}

function fit(view,frame){
  const scale=Math.min(frame.w/view.w,frame.h/view.h);
  return {scale,ox:(frame.w-view.w*scale)/2,oy:(frame.h-view.h*scale)/2};
}

export function beginReelFrame(ctx,dpr,world,focus,shake){
  const frame=frameRect();
  const view=viewRect(world,focus);
  const {scale,ox,oy}=fit(view,frame);
  const pair=Array.isArray(shake)?shake:[0,0];
  const sx=+pair[0]||0,sy=+pair[1]||0;
  ctx.setTransform(dpr,0,0,dpr,0,0);
  ctx.clearRect(0,0,frame.w,frame.h);
  if(ox>0.5||oy>0.5){
    ctx.fillStyle='#050504';
    ctx.fillRect(0,0,frame.w,frame.h);
  }
  ctx.setTransform(dpr*scale,0,0,dpr*scale,dpr*(ox-view.x*scale+sx),dpr*(oy-view.y*scale+sy));
}

export function setReel(on){
  active=!!on;
  document.body.classList.toggle('reel',active);
  document.documentElement.classList.toggle('reel',active);
}

export function toggleReel(){setReel(!active);return active}

export function setReelUrl(on){
  const url=new URL(location.href);
  if(on)url.searchParams.set('reel','1');
  else url.searchParams.delete('reel');
  history.replaceState(null,'',url);
}
