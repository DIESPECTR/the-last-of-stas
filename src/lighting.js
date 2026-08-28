// Lighting and grade layer. The previous look failed for one reason: every pixel sat in the same
// narrow grey band, so nothing had weight. This pass fixes that with three cheap tools —
// real cast shadows from the building, a warm pool inside it, and a contrast/vignette grade that
// pushes the corners of the frame down and lets the lit areas actually read as light.

// Project the building footprint away from a light source into a shadow quad. A box lit from one side
// casts a hard quad; that single shape does more for depth than any amount of texture detail.
function projectShadow(rect,light,length){
  const corners=[
    {x:rect.x,y:rect.y},{x:rect.x+rect.w,y:rect.y},
    {x:rect.x+rect.w,y:rect.y+rect.h},{x:rect.x,y:rect.y+rect.h}
  ];
  const projected=corners.map(c=>{
    const dx=c.x-light.x,dy=c.y-light.y,d=Math.hypot(dx,dy)||1;
    return {x:c.x+dx/d*length,y:c.y+dy/d*length};
  });
  // Convex hull of the box plus its projection: the union reads as one solid shadow body
  return convexHull([...corners,...projected]);
}

function convexHull(points){
  const sorted=[...points].sort((a,b)=>a.x-b.x||a.y-b.y);
  const cross=(o,a,b)=>(a.x-o.x)*(b.y-o.y)-(a.y-o.y)*(b.x-o.x);
  const build=list=>{
    const stack=[];
    for(const point of list){
      while(stack.length>=2&&cross(stack[stack.length-2],stack[stack.length-1],point)<=0)stack.pop();
      stack.push(point);
    }
    return stack;
  };
  const lower=build(sorted),upper=build([...sorted].reverse());
  return [...lower.slice(0,-1),...upper.slice(0,-1)];
}

function fillPolygon(ctx,points){
  if(points.length<3)return;
  ctx.beginPath();ctx.moveTo(points[0].x,points[0].y);
  for(let i=1;i<points.length;i++)ctx.lineTo(points[i].x,points[i].y);
  ctx.closePath();ctx.fill();
}

// Shadows cast by the shelter and by every prop-sized obstacle, driven by the streetlamps.
// Drawn on the ground, under the characters.
export function drawCastShadows(ctx,shelter,lamps,dawn=0){
  const strength=(1-dawn)*.5;
  if(strength<=.02)return;
  const rect={x:shelter.x,y:shelter.y,w:shelter.width,h:shelter.height};
  ctx.save();
  ctx.globalCompositeOperation='multiply';
  for(const lamp of lamps){
    const distance=Math.hypot(shelter.centerX-lamp.x,shelter.centerY-lamp.y);
    // Shadows shorten as the light gets closer and fade out beyond the lamp's reach
    const reach=lamp.reach||150;
    const falloff=Math.max(0,1-distance/(reach*3.4));
    if(falloff<=.02)continue;
    ctx.fillStyle=`rgba(8,9,8,${(strength*falloff*.85).toFixed(3)})`;
    fillPolygon(ctx,projectShadow(rect,lamp,120+distance*.4));
  }
  ctx.restore();
}

// A soft contact shadow directly under a character or prop. Cheap, and it stops everything from
// looking like a sticker floating over the mud.
export function drawContactShadow(ctx,x,y,radius,alpha=.4){
  const glow=ctx.createRadialGradient(x,y,0,x,y,radius);
  glow.addColorStop(0,`rgba(8,9,8,${alpha})`);glow.addColorStop(1,'rgba(8,9,8,0)');
  ctx.save();ctx.globalCompositeOperation='multiply';
  ctx.fillStyle=glow;ctx.beginPath();ctx.ellipse(x,y,radius,radius*.45,0,0,Math.PI*2);ctx.fill();
  ctx.restore();
}

// --- Light buffer ---------------------------------------------------------------------------------
//
// Every additive light in the game used to be composited straight onto the frame with 'lighter'. Each
// one was individually reasonable. The problem is that 'lighter' has no ceiling: nine window spills, an
// interior pool, three lamp pools and the survivor's torch all land on the same few hundred pixels in
// the middle of the yard, and the sum saturates to white long before any single source is too strong.
// Tuning them down one by one never converged, because the failure is not in any source — it is in the
// fact that the pipeline had no total exposure at all.
//
// So every light now accumulates into ONE offscreen buffer, and that buffer is composited exactly once
// with a bounded alpha. The buffer may saturate internally; the amount of light that can ever reach the
// frame is capped at EXPOSURE, no matter how many sources fire. Adding a lamp can now redistribute
// light, but it can no longer blow out the picture — which is the property the old pipeline lacked.
// Buffers are keyed, because the frame has two points where light has to land and they are separated by
// occluders. The interior pool and the window shafts must be composited BEFORE the roof mask and the
// walls, or the building would glow through its own roof from the yard; the window spill, the survivor's
// torch and the street lamps must be composited AFTER them. One buffer would force one of those two to
// be in the wrong place. Two bounded composites still replace roughly a dozen unbounded ones.
const lightBuffers=new Map();
// How much of the accumulated light reaches the frame. This is the single exposure knob for the game.
// Raised .58 -> .80 together with the night tint rebuild. These two numbers are one setting read from
// both ends: the tint decides how dark the unlit frame is, this decides how much light is allowed back
// on top of it. The tint now multiplies the night down to roughly half its old level, so leaving the
// exposure where it was would simply have halved every light in the game along with it — the yard went
// correctly dark and the lamps went dark with it, which is not a night, it is an underexposed frame.
// Raised again .80 -> 1.0 once the black-point pass landed. The crush squares the frame, so a light
// that sat at 50% luma before it comes out at 25% after — measured, the bright fraction of the frame
// collapsed from 0.97% to 0.11% against the reference's 1.01%. Nothing about the lights changed; they
// are simply being read through a curve now, so the source values have to be higher to land in the
// same place. This is the correct pairing: the crush owns the shadows, the exposure owns the lights.
export const LIGHT_EXPOSURE=1.0;
// The interior is a smaller, more enclosed volume than the yard and it carries the game's only warm
// source, so it gets its own slightly higher ceiling. Still bounded — that is the entire point.
export const INTERIOR_EXPOSURE=.92;

export function beginLightPass(width,height,key='scene'){
  let buffer=lightBuffers.get(key);
  if(!buffer){const canvas=document.createElement('canvas');buffer={canvas,context:canvas.getContext('2d')};lightBuffers.set(key,buffer)}
  const {canvas,context}=buffer;
  if(canvas.width!==width||canvas.height!==height){canvas.width=width;canvas.height=height}
  context.setTransform(1,0,0,1,0,0);
  context.globalCompositeOperation='source-over';
  context.globalAlpha=1;
  context.filter='none';
  context.clearRect(0,0,width,height);
  return context;
}

export function endLightPass(ctx,exposure=LIGHT_EXPOSURE,key='scene'){
  const buffer=lightBuffers.get(key);
  if(!buffer)return;
  ctx.save();
  ctx.globalCompositeOperation='lighter';
  ctx.globalAlpha=Math.max(0,Math.min(1,exposure));
  ctx.drawImage(buffer.canvas,0,0);
  ctx.restore();
}

// Warm pool over the interior floor. Only meaningful while the roof is off, but drawing it always
// keeps the building glowing faintly through the windows from outside too.
// This is an oil lamp on a table, so it is modelled as one: a small, genuinely bright core with a fast
// falloff, not an even wash over the whole floor. The wash was the earlier mistake — it lifted the
// entire room by the same amount, which is not lighting, it is an exposure error, and it left the
// interior flat AND blown at the same time. A pool has dark around it; that contrast is the whole point.
//
// It is meant to be drawn into the light buffer (see beginLightPass), so the numbers here are source
// intensities, not final screen values — the buffer's single bounded composite decides what lands.
export function drawInteriorLight(ctx,shelter,intensity=1){
  if(intensity<=.02)return;
  const {x,y,width,height,thickness:t}=shelter;
  // Off-centre: the lamp sits on the table, and an off-centre source gives the room a light direction.
  const cx=x+width*.54,cy=y+height*.34;
  const radius=Math.max(width,height)*.40;
  const glow=ctx.createRadialGradient(cx,cy,4,cx,cy,radius);
  glow.addColorStop(0,`rgba(255,196,116,${(.62*intensity).toFixed(3)})`);
  glow.addColorStop(.28,`rgba(236,158,80,${(.26*intensity).toFixed(3)})`);
  glow.addColorStop(.62,`rgba(190,116,58,${(.08*intensity).toFixed(3)})`);
  glow.addColorStop(1,'rgba(160,98,52,0)');
  ctx.save();
  ctx.beginPath();ctx.rect(x+t,y+t,width-t*2,height-t*2);ctx.clip();
  ctx.globalCompositeOperation='lighter';
  ctx.fillStyle=glow;ctx.fillRect(x,y,width,height);
  ctx.restore();
}

// Final grade: raise contrast, crush the corners, and keep a cold cast on the night while the
// warm sources stay warm.
//
// This pass used to be TWO stacked 'multiply' fills (a depth gradient, then a vignette) on top of a
// THIRD multiply already applied by the night tint in environment.js. Multiply can only ever subtract
// light — it has no floor below "no change" and no way to lift anything — so three of them stacked
// converge on one flat dark grey-blue tone wherever they overlap, which is most of the frame. That
// convergence, not underexposure, was the actual cause of the "washed-out grey mush" complaint: the
// scene wasn't too dark, it had lost the local contrast that makes light read as light.
//
// The fix is an 'overlay' punch first. Overlay's neutral point is 50% grey: push a colour above it and
// the base LIFTS, push it below and the base darkens — the only cheap way to gain real contrast in a
// Canvas 2D pipeline without a per-pixel curve pass. Centring the lift on the yard and letting it fall
// to a hard dark rim is what turns a flat frame into one with a real hot spot.
const clamp255=v=>Math.max(0,Math.min(255,Math.round(v)));
export function drawGrade(ctx,width,height,{dawn=0,danger=0}={}){
  // ONE multiply, not three. The previous version ran an amber 'overlay' punch centred on the frame,
  // then a vertical multiply, then a vignette multiply — on top of a fourth multiply already applied by
  // the environment tint. Two problems, both fatal:
  //   * three multiplies stacked converge on the same flat dark tone wherever they overlap, which is
  //     most of the frame, and that convergence is what "grey mush" actually is; and
  //   * the amber punch was centred at .5/.47 — exactly where the house is — so it re-lit the one part
  //     of the frame that was already the brightest, and the bloom then fed on the result.
  // Hue and vignette are now the same gradient, so they can never fight each other, and the grade only
  // ever DARKENS the unlit base. Light is added afterwards from the bounded light buffer, which is the
  // right order: you cannot grade a scene into having a light source, you can only grade what is lit.
  ctx.save();
  ctx.globalCompositeOperation='multiply';
  // NEUTRAL. Every tinted stop below has been removed. The colour of the frame now comes from the
  // generated artwork and from the actual light sources, and from nothing else. A grade that paints
  // its own hue over finished photographic assets is just a filter, and a filter is exactly what made
  // the whole game read as one orange sepia photograph regardless of what the textures looked like.
  // What is left is a plain luminance vignette: it darkens the edges of the frame and does not touch
  // hue at all (r=g=b at every stop), so the assets come through with their own colour intact.
  const vignette=ctx.createRadialGradient(width/2,height*.52,Math.min(width,height)*.34,width/2,height*.52,Math.max(width,height)*.76);
  const rim=clamp255(150+dawn*70);
  vignette.addColorStop(0,'rgba(255,255,255,1)');
  vignette.addColorStop(.55,`rgba(${clamp255(214+dawn*30)},${clamp255(214+dawn*30)},${clamp255(214+dawn*30)},1)`);
  vignette.addColorStop(1,`rgba(${rim},${rim},${rim},1)`);
  ctx.fillStyle=vignette;ctx.fillRect(0,0,width,height);
  ctx.restore();
  if(danger>.02){
    ctx.save();ctx.globalCompositeOperation='overlay';
    ctx.fillStyle=`rgba(184,46,30,${(danger*.4).toFixed(3)})`;ctx.fillRect(0,0,width,height);
    ctx.restore();
  }
}

// REMOVED: the old tinted grade — warm centre punch, blue-dominant rim, cold shadow lift, S-curve. Not
// kept as a reference copy: it is the exact stack that made every frame read as one orange sepia
// photograph regardless of what the generated textures actually looked like, and a dead copy of a
// rejected look only invites it back into the pipeline. Git history has it if it is ever needed.
