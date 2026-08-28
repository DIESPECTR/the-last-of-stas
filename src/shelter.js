// The shelter is a real building, not a circle with hit points: it has four walls, one door, seven
// windows, an interior floor with furniture, and a roof that lifts away when the survivor steps inside.
//
// The centrepiece is perspective visibility. Every opening projects a sight wedge from the survivor
// through the gap and outwards, so what you can see is decided by where you stand. From inside you only
// see the slices of yard your windows expose, and those slices sweep across the ground as you walk.
// From outside the roof hides the interior except for the slice each window happens to line up with.
// Boarding a window replaces its single wide gap with narrow slits between the planks, which shrinks
// the view without closing it — you can still watch the yard through a board seam.

const WALL_THICKNESS=13;
// Sight wedges are projected far enough to always leave the canvas
const SIGHT_REACH=1600;
// Minimum eye-to-opening distance used when projecting a sight wedge. Without it, hugging a window
// gives an almost 180° cone and every occluder collapses at once.
const MIN_STANDOFF=120;
// How deep a single opening lets you see before the view fades out. Tuned so one window shows a room
// slice, and you have to walk to sweep the rest.
const REVEAL_RADIUS=150;
// The same idea for looking out: the yard is open ground, so sight carries much further than indoors.
const YARD_REVEAL_RADIUS=340;
// Looking IN from the yard is the weakest sight in the game: a shallow slice right behind the glass.
const ROOF_REVEAL_RADIUS=92;
// A large standoff for that same pass keeps the fan tight, so a window shows one sliver, not a room.
const ROOF_STANDOFF=300;
// Beyond this distance an opening tells you nothing about the interior at all.
const PEEK_RANGE=190;
const MAX_BOARDS=3;

// Openings are declared as offsets along their wall, measured from the footprint origin of that side.
// Keeping them declarative means the layout can move into scenario data later without touching the maths.
const DEFAULT_LAYOUT={
  width:272,height:200,
  door:{side:'south',offset:110,span:54},
  windows:[
    {id:'n1',side:'north',offset:26,span:58},
    {id:'n2',side:'north',offset:188,span:58},
    {id:'w1',side:'west',offset:44,span:56},
    {id:'w2',side:'west',offset:124,span:44},
    {id:'e1',side:'east',offset:44,span:56},
    {id:'e2',side:'east',offset:124,span:44},
    {id:'s1',side:'south',offset:24,span:52},
    {id:'s2',side:'south',offset:200,span:52}
  ],
  // Interior props, in footprint-relative coordinates. Purely visual, but they are what makes the
  // inside read as a home instead of an empty box.
  furniture:[
    {kind:'bed',x:24,y:26,w:64,h:38},
    {kind:'table',x:112,y:34,w:62,h:40},
    {kind:'stove',x:206,y:24,w:42,h:40},
    {kind:'shelf',x:20,y:96,w:52,h:20},
    {kind:'crate',x:96,y:104,w:34,h:32},
    {kind:'crate',x:138,y:112,w:28,h:26},
    {kind:'barrel',x:210,y:104,w:32,h:34},
    {kind:'workbench',x:96,y:152,w:98,h:26}
  ],
  // Interior walls are cosmetic room dividers: they break the floor up without blocking movement,
  // because a single-room box would make the inside impossible to read at this scale.
  partitions:[{x:88,y:0,w:8,h:84},{x:0,y:84,w:200,h:8}]
};

export function createShelter(config={}){
  const layout={...DEFAULT_LAYOUT,...config};
  const width=layout.width,height=layout.height;
  const x=(config.x??480)-width/2,y=(config.y??480)-height/2;
  const shelter={
    x,y,width,height,
    centerX:x+width/2,centerY:y+height/2,
    thickness:WALL_THICKNESS,
    layout,
    hp:config.hp??500,maxHp:config.hp??500,
    reinforced:false,
    // Roof opacity is animated rather than switched, so stepping through the door feels like a camera move
    roof:1,
    door:{...layout.door,open:false},
    windows:layout.windows.map(w=>({...w,boards:0,boardHp:0,breach:0}))
  };
  return shelter;
}

// Convert an offset/span on a named wall into a world-space segment along the wall centreline.
// The returned segment also carries its outward normal, which every other system needs: light spills
// along it, boards are drawn across it, and zombies approach from it.
export function wallSegment(shelter,side,offset,span){
  const t=shelter.thickness/2;
  if(side==='north')return {x1:shelter.x+offset,y1:shelter.y+t,x2:shelter.x+offset+span,y2:shelter.y+t,nx:0,ny:-1,horizontal:true};
  if(side==='south')return {x1:shelter.x+offset,y1:shelter.y+shelter.height-t,x2:shelter.x+offset+span,y2:shelter.y+shelter.height-t,nx:0,ny:1,horizontal:true};
  if(side==='west')return {x1:shelter.x+t,y1:shelter.y+offset,x2:shelter.x+t,y2:shelter.y+offset+span,nx:-1,ny:0,horizontal:false};
  return {x1:shelter.x+shelter.width-t,y1:shelter.y+offset,x2:shelter.x+shelter.width-t,y2:shelter.y+offset+span,nx:1,ny:0,horizontal:false};
}

// A window's effective gaps. Unboarded it is one wide opening; every plank splits the remaining glass
// into narrower slits, so the view degrades gradually instead of snapping shut.
export function windowGaps(shelter,win){
  const boards=Math.min(MAX_BOARDS,win.boards);
  if(boards<=0)return [wallSegment(shelter,win.side,win.offset,win.span)];
  // Coverage scales with the number of planks. A flat 74% meant the very first board dropped a 56px
  // window to a 7px slit, which felt like bricking it up rather than boarding it.
  const slits=boards+1,covered=win.span*(.28+boards*.155),free=win.span-covered,slit=free/slits,step=win.span/slits;
  const gaps=[];
  for(let i=0;i<slits;i++)gaps.push(wallSegment(shelter,win.side,win.offset+i*step+(step-slit)/2,slit));
  return gaps;
}

// Every gap light and sight can pass through: window slits plus the doorway itself.
export function shelterOpenings(shelter){
  const openings=[];
  for(const win of shelter.windows)for(const gap of windowGaps(shelter,win))openings.push({...gap,window:win});
  const door=shelter.door;
  openings.push({...wallSegment(shelter,door.side,door.offset,door.span),door:true});
  return openings;
}

// Solid wall bands used for collision. The doorway is the only hole: windows stop bodies but not light.
export function wallBands(shelter){
  const {x,y,width,height,thickness:t}=shelter,door=shelter.door;
  const bands=[
    {x,y,w:width,h:t,side:'north'},
    {x,y:y+t,w:t,h:height-t*2,side:'west'},
    {x:x+width-t,y:y+t,w:t,h:height-t*2,side:'east'}
  ];
  if(door.side==='south'){
    bands.push({x,y:y+height-t,w:door.offset,h:t,side:'south'});
    bands.push({x:x+door.offset+door.span,y:y+height-t,w:width-door.offset-door.span,h:t,side:'south'});
  }else bands.push({x,y:y+height-t,w:width,h:t,side:'south'});
  return bands;
}

// Inside means standing on the floor, past the wall bands. Used for the roof fade and for deciding
// whether the survivor is looking out of the windows or into them.
export function isInsideShelter(shelter,x,y){
  const t=shelter.thickness;
  return x>shelter.x+t&&x<shelter.x+shelter.width-t&&y>shelter.y+t&&y<shelter.y+shelter.height-t;
}

// Axis-aligned push-out against the wall bands. Resolving along the axis of least penetration lets the
// survivor slide along a wall instead of sticking to it, and keeps the narrow doorway walkable.
export function collideShelter(shelter,entity,radius){
  let blocked=false;
  for(const band of wallBands(shelter)){
    const nearestX=Math.max(band.x,Math.min(entity.x,band.x+band.w));
    const nearestY=Math.max(band.y,Math.min(entity.y,band.y+band.h));
    const dx=entity.x-nearestX,dy=entity.y-nearestY;
    if(dx*dx+dy*dy>=radius*radius)continue;
    blocked=true;
    // Penetration depth on each axis; the smaller one is the wall face we actually hit
    const left=entity.x-(band.x-radius),right=band.x+band.w+radius-entity.x;
    const top=entity.y-(band.y-radius),bottom=band.y+band.h+radius-entity.y;
    const min=Math.min(left,right,top,bottom);
    if(min===left)entity.x=band.x-radius;
    else if(min===right)entity.x=band.x+band.w+radius;
    else if(min===top)entity.y=band.y-radius;
    else entity.y=band.y+band.h+radius;
  }
  return blocked;
}

// The sight wedge for one opening: a quad that starts at the gap and spreads away from the viewer.
// Standing dead in front of a window gives a wide fan; standing off to the side collapses it to a
// sliver. That single rule is what makes the view sweep as the survivor walks along a wall.
export function sightWedge(viewer,gap,reach=SIGHT_REACH,revealRadius=REVEAL_RADIUS,standoffMin=MIN_STANDOFF){
  const ax=gap.x1,ay=gap.y1,bx=gap.x2,by=gap.y2;
  // Standing flat against an opening used to open the wedge to almost 180°, which revealed the whole
  // room at once and read as "the roof vanished". The eye point is pushed back to a minimum standoff
  // along the gap normal, so pressing your face to the glass no longer shows you the entire interior.
  const midX=(ax+bx)/2,midY=(ay+by)/2;
  const along=(viewer.x-midX)*gap.nx+(viewer.y-midY)*gap.ny,side=along>=0?1:-1;
  const standoff=Math.max(0,standoffMin-Math.abs(along));
  viewer={x:viewer.x+gap.nx*side*standoff,y:viewer.y+gap.ny*side*standoff};
  const a=Math.hypot(ax-viewer.x,ay-viewer.y)||1,b=Math.hypot(bx-viewer.x,by-viewer.y)||1;
  const points=[
    {x:ax,y:ay},
    {x:ax+(ax-viewer.x)/a*reach,y:ay+(ay-viewer.y)/a*reach},
    {x:bx+(bx-viewer.x)/b*reach,y:by+(by-viewer.y)/b*reach},
    {x:bx,y:by}
  ];
  // The wedge also carries where the sight starts and how far it stays useful. A hard-edged wedge made
  // three openings on one wall erase the whole roof at once, which read as "the roof disappeared".
  // Sight now fades with distance from the opening, so each window reveals a slice, not the building.
  const span=Math.hypot(bx-ax,by-ay);
  return {points,origin:{x:midX,y:midY},radius:revealRadius+span*1.4};
}

// Only openings the viewer can actually use. A window is unusable when the viewer stands on its blind
// side — outside a north window looking at the north wall, you see the wall, not the room.
export function visibleGaps(shelter,viewer){
  const inside=isInsideShelter(shelter,viewer.x,viewer.y);
  return shelterOpenings(shelter).filter(gap=>{
    const midX=(gap.x1+gap.x2)/2,midY=(gap.y1+gap.y2)/2;
    const towards=(viewer.x-midX)*gap.nx+(viewer.y-midY)*gap.ny;
    // Outward normal: positive means the viewer is on the outside of that wall
    return inside?towards<0:towards>0;
  });
}

function tracePolygon(ctx,points){
  ctx.beginPath();ctx.moveTo(points[0].x,points[0].y);
  for(let i=1;i<points.length;i++)ctx.lineTo(points[i].x,points[i].y);
  ctx.closePath();
}

// Scratch layer for the mask compositing. One canvas is reused for every frame and every mask pass.
let maskCanvas=null,maskContext=null;
function maskLayer(width,height){
  if(!maskCanvas){maskCanvas=document.createElement('canvas');maskContext=maskCanvas.getContext('2d')}
  if(maskCanvas.width!==width||maskCanvas.height!==height){maskCanvas.width=width;maskCanvas.height=height}
  maskContext.setTransform(1,0,0,1,0,0);
  maskContext.clearRect(0,0,width,height);
  return maskContext;
}

// Pull the far edge of a wedge in towards its own centreline. Used to build a lateral falloff out of
// nested wedges: the opening stays full width, only the spread narrows.
function shrinkWedge(points,k){
  if(k<=0)return points;
  const [a,aFar,bFar,b]=points;
  const farX=(aFar.x+bFar.x)/2,farY=(aFar.y+bFar.y)/2;
  // The near edge is pulled in as well, at a third of the rate. Shrinking only the far edge left every
  // pass sharing the same mouth, so the nested wedges did not separate until well out into the yard and
  // the first ~40px in front of a window still had a knife edge. A slight taper at the mouth as well
  // gives the falloff somewhere to start, without narrowing the opening enough to be noticed.
  const nearK=k*.34,nearX=(a.x+b.x)/2,nearY=(a.y+b.y)/2;
  return [
    {x:a.x+(nearX-a.x)*nearK,y:a.y+(nearY-a.y)*nearK},
    {x:aFar.x+(farX-aFar.x)*k,y:aFar.y+(farY-aFar.y)*k},
    {x:bFar.x+(farX-bFar.x)*k,y:bFar.y+(farY-bFar.y)*k},
    {x:b.x+(nearX-b.x)*nearK,y:b.y+(nearY-b.y)*nearK}
  ];
}
// How many nested passes build the lateral gradient. A clipped polygon has perfectly hard sides, which
// is precisely why the yard read as a black star with sharp spokes rather than light through a window:
// the radial gradient softened the DEPTH of each wedge and nothing softened its WIDTH.
const LATERAL_PASSES=7;

// Paint an occluder over the canvas and punch the sight wedges out of it. Used twice per frame:
// once for the roof (hiding the interior from outside) and once for the yard fog (hiding everything
// the survivor cannot see from inside).
function drawOccluderWithHoles(ctx,width,height,wedges,paint,{clip=null,feather=0,soften=false}={}){
  const layer=maskLayer(width,height);
  layer.save();
  if(clip){layer.beginPath();layer.rect(clip.x,clip.y,clip.w,clip.h);layer.clip()}
  paint(layer);
  layer.restore();
  layer.save();
  layer.globalCompositeOperation='destination-out';
  for(const wedge of wedges){
    const points=wedge.points||wedge;
    if(wedge.origin){
      const {origin,radius}=wedge;
      // Clip to the wedge, then erase with a radial gradient anchored at the opening. The gradient is
      // what turns a stencil into perspective: the slice nearest the window is fully seen and the depth
      // behind it stays hidden until the survivor moves and the wedge sweeps over it.
      //
      // When softening, that erase is repeated over nested wedges instead of once over the full one.
      // Each pass is narrower and only partly transparent, so the erased alpha accumulates towards the
      // centreline and tapers off at the sides: the middle of the wedge ends up ~93% clear while the
      // outer sliver is only ~42% clear. That lateral ramp is what turns hard spokes into a light shaft.
      const passes=soften?LATERAL_PASSES:1,peak=soften?.42:1;
      for(let pass=0;pass<passes;pass++){
        const k=passes===1?0:pass/passes*.66;
        layer.save();
        tracePolygon(layer,shrinkWedge(points,k));
        layer.clip();
        const reveal=layer.createRadialGradient(origin.x,origin.y,Math.min(24,radius*.2),origin.x,origin.y,radius);
        reveal.addColorStop(0,`rgba(0,0,0,${peak})`);
        reveal.addColorStop(.55,`rgba(0,0,0,${(peak*.9).toFixed(3)})`);
        reveal.addColorStop(1,'rgba(0,0,0,0)');
        layer.fillStyle=reveal;
        layer.fillRect(origin.x-radius,origin.y-radius,radius*2,radius*2);
        layer.restore();
      }
    }else{
      layer.save();
      tracePolygon(layer,points);
      layer.clip();
      if(feather>0){layer.shadowColor='#000';layer.shadowBlur=feather}
      layer.fillStyle='#000';tracePolygon(layer,points);layer.fill();
      layer.restore();
    }
  }
  layer.restore();
  ctx.drawImage(maskCanvas,0,0);
}

// Interior floor, room dividers and furniture. Always drawn; whether the player gets to see it is
// decided afterwards by the roof mask.
export function drawShelterInterior(ctx,shelter,textures={}){
  const {x,y,width,height,thickness:t}=shelter;
  const floor={x:x+t,y:y+t,w:width-t*2,h:height-t*2};
  ctx.save();
  // A cutaway artwork already contains the floor, the dividers and the props, and it is drawn across
  // the whole footprint rather than the inset floor so its own walls line up with the wall bands.
  // It therefore replaces every procedural pass below, instead of being painted under them.
  if(textures.interior&&textures.interior(ctx,shelter)!==false){ctx.restore();return}
  ctx.beginPath();ctx.rect(floor.x,floor.y,floor.w,floor.h);ctx.clip();
  if(textures.floor)textures.floor(ctx,floor);
  else{
    // Warm boards, deliberately lighter and browner than the yard mud so inside reads as shelter
    const base=ctx.createLinearGradient(floor.x,floor.y,floor.x,floor.y+floor.h);
    base.addColorStop(0,'#5a4c37');base.addColorStop(.5,'#4c4030');base.addColorStop(1,'#413628');
    ctx.fillStyle=base;ctx.fillRect(floor.x,floor.y,floor.w,floor.h);
    ctx.strokeStyle='rgba(28,23,17,.55)';ctx.lineWidth=1;
    for(let px=floor.x;px<floor.x+floor.w;px+=27){ctx.beginPath();ctx.moveTo(px,floor.y);ctx.lineTo(px,floor.y+floor.h);ctx.stroke()}
    ctx.strokeStyle='rgba(126,106,76,.35)';
    for(let py=floor.y+9;py<floor.y+floor.h;py+=19){ctx.beginPath();ctx.moveTo(floor.x,py);ctx.lineTo(floor.x+floor.w,py);ctx.stroke()}
  }
  for(const wall of shelter.layout.partitions){
    const px=x+t+wall.x,py=y+t+wall.y;
    ctx.fillStyle='#3a3125';ctx.fillRect(px,py,wall.w,wall.h);
    ctx.fillStyle='#6b5b42';ctx.fillRect(px,py,wall.w,2);
  }
  for(const prop of shelter.layout.furniture)drawFurniture(ctx,x+t+prop.x,y+t+prop.y,prop);
  ctx.restore();
}

const FURNITURE_TONES={bed:['#6a5c46','#8d7a5a'],table:['#5d4e39','#87724f'],stove:['#3b3a34','#767063'],shelf:['#514431','#7d6a4b'],crate:['#5a4a33','#8a7350'],barrel:['#45402f','#6f6448'],workbench:['#4e4130','#9a8156']};
function drawFurniture(ctx,px,py,prop){
  const [body,edge]=FURNITURE_TONES[prop.kind]||['#4d4234','#7a6a4d'];
  // Drop shadow first: without it every prop looks pasted flat onto the floor
  ctx.fillStyle='rgba(14,12,9,.45)';ctx.fillRect(px+3,py+prop.h-3,prop.w,6);
  ctx.fillStyle=body;ctx.fillRect(px,py,prop.w,prop.h);
  ctx.strokeStyle='#221c14';ctx.lineWidth=2;ctx.strokeRect(px,py,prop.w,prop.h);
  ctx.fillStyle=edge;ctx.fillRect(px,py,prop.w,3);
  if(prop.kind==='bed'){ctx.fillStyle='#8e8874';ctx.fillRect(px+4,py+4,prop.w-8,14);ctx.fillStyle='#5d5342';ctx.fillRect(px+4,py+20,prop.w-8,prop.h-24)}
  if(prop.kind==='table'||prop.kind==='workbench'){ctx.strokeStyle='#2b2318';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(px+5,py+prop.h-4);ctx.lineTo(px+prop.w-5,py+prop.h-4);ctx.stroke()}
  // The only warm accent inside: a lit stove ring, so the eye has somewhere to land
  if(prop.kind==='stove'){ctx.fillStyle='#b4552f';ctx.beginPath();ctx.arc(px+prop.w/2,py+prop.h*.62,7,0,Math.PI*2);ctx.fill()}
  if(prop.kind==='crate'){ctx.strokeStyle='#8a7350';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(px,py);ctx.lineTo(px+prop.w,py+prop.h);ctx.moveTo(px+prop.w,py);ctx.lineTo(px,py+prop.h);ctx.stroke()}
  if(prop.kind==='barrel'){ctx.strokeStyle='#8b7c58';ctx.lineWidth=2;for(let i=1;i<3;i++){ctx.beginPath();ctx.moveTo(px,py+prop.h*i/3);ctx.lineTo(px+prop.w,py+prop.h*i/3);ctx.stroke()}}
  if(prop.kind==='shelf'){ctx.fillStyle='#2a2318';for(let i=0;i<4;i++)ctx.fillRect(px+4+i*12,py-8,8,8)}
}

// Walls, window frames, planks and the door. Drawn above the interior and above the roof mask so the
// building silhouette is always solid, whichever side the survivor is standing on.
export function drawShelterWalls(ctx,shelter,damage=0){
  ctx.save();
  for(const band of wallBands(shelter)){
    const shade=ctx.createLinearGradient(band.x,band.y,band.x+(band.w<band.h?band.w:0),band.y+(band.h<band.w?band.h:0));
    shade.addColorStop(0,'#6d5f48');shade.addColorStop(1,'#443a2b');
    ctx.fillStyle=shade;ctx.fillRect(band.x,band.y,band.w,band.h);
    ctx.strokeStyle='#191510';ctx.lineWidth=2;ctx.strokeRect(band.x,band.y,band.w,band.h);
  }
  // Window openings are cut visually by drawing the dark reveal and frame over the wall band
  for(const win of shelter.windows){
    const full=wallSegment(shelter,win.side,win.offset,win.span),t=shelter.thickness;
    const rect=full.horizontal?{x:full.x1,y:full.y1-t/2,w:win.span,h:t}:{x:full.x1-t/2,y:full.y1,w:t,h:win.span};
    ctx.fillStyle='#100f0c';ctx.fillRect(rect.x,rect.y,rect.w,rect.h);
    ctx.strokeStyle='#8a7a5b';ctx.lineWidth=2;ctx.strokeRect(rect.x,rect.y,rect.w,rect.h);
    for(let i=0;i<win.boards;i++){
      // Planks are drawn slightly askew: a nailed board is never square
      const p=(i+.6)/(win.boards+.2),lean=(i%2?1:-1)*2;
      ctx.save();ctx.strokeStyle='#a08a5f';ctx.lineWidth=6;ctx.lineCap='round';ctx.beginPath();
      if(full.horizontal){const bx=rect.x+rect.w*p;ctx.moveTo(bx+lean,rect.y-4);ctx.lineTo(bx-lean,rect.y+rect.h+4)}
      else{const by=rect.y+rect.h*p;ctx.moveTo(rect.x-4,by+lean);ctx.lineTo(rect.x+rect.w+4,by-lean)}
      ctx.stroke();ctx.restore();
    }
  }
  const door=shelter.door,seg=wallSegment(shelter,door.side,door.offset,door.span),t=shelter.thickness;
  ctx.fillStyle='#171410';ctx.fillRect(seg.x1,seg.y1-t/2,door.span,t);
  ctx.strokeStyle='#9b8760';ctx.lineWidth=3;ctx.strokeRect(seg.x1,seg.y1-t/2,door.span,t);
  // Door leaf swung open against the wall, so the entrance reads as an entrance
  ctx.fillStyle='#544629';ctx.fillRect(seg.x1-4,seg.y1+t/2,10,26);
  if(damage>.3){
    ctx.strokeStyle=damage>.65?'#7c3327':'#6d6658';ctx.lineWidth=3;
    ctx.beginPath();ctx.moveTo(shelter.x+shelter.width,shelter.y+40);ctx.lineTo(shelter.x+shelter.width-18,shelter.y+56);ctx.lineTo(shelter.x+shelter.width-4,shelter.y+72);ctx.stroke();
  }
  ctx.restore();
}

// Roof over the footprint, punched by the sight wedges. Fully opaque while the survivor is outside and
// out of line with any window; fading to nothing once they step in through the door.
export function drawShelterRoof(ctx,shelter,viewer,width,height,textures={}){
  const inside=isInsideShelter(shelter,viewer.x,viewer.y);
  // Ease the roof rather than switch it: the transition is the moment the game feels like a camera
  shelter.roof+=((inside?0:1)-shelter.roof)*.16;
  if(shelter.roof<=.02)return;
  // Peeking in from the yard is deliberately much weaker than looking out. Three openings on one wall
  // used to project three wide fans that together erased the whole roof, which read as "the roof
  // disappeared". Outside wedges are narrow (a large standoff keeps the fan tight), shallow, and they
  // shrink further the further away the survivor stands: you have to walk up to a window to see in.
  const wedges=inside?[]:visibleGaps(shelter,viewer).map(gap=>{
    const midX=(gap.x1+gap.x2)/2,midY=(gap.y1+gap.y2)/2;
    const distance=Math.hypot(viewer.x-midX,viewer.y-midY);
    const proximity=Math.max(0,1-distance/PEEK_RANGE);
    if(proximity<=.02)return null;
    const wedge=sightWedge(viewer,gap,SIGHT_REACH,ROOF_REVEAL_RADIUS,ROOF_STANDOFF);
    // The whole reveal depth is scaled by proximity, not just its base term: the opening-span bonus used
    // to survive the falloff, so a window two metres away still showed a wide slab of floor.
    wedge.radius*=proximity;
    return wedge;
  }).filter(Boolean);
  const footprint={x:shelter.x,y:shelter.y,w:shelter.width,h:shelter.height};
  const alpha=shelter.roof;
  drawOccluderWithHoles(ctx,width,height,wedges,layer=>{
    layer.globalAlpha=alpha;
    // A texture hook reports failure by returning false — an image that has not decoded yet must not
    // leave a hole where the roof should be, so the procedural slab is drawn instead.
    // Whether the photographic slab actually landed this frame. The two branches need different
    // finishing: the PNG is a real roof photo that only needs seating into the yard, while the
    // procedural fallback is already a dark gradient and must not be darkened twice.
    const textured=!!textures.roof&&textures.roof(layer,footprint)!==false;
    if(!textured){
      const tiles=layer.createLinearGradient(footprint.x,footprint.y,footprint.x+footprint.w*.4,footprint.y+footprint.h);
      tiles.addColorStop(0,'#3b3327');tiles.addColorStop(.5,'#2e2820');tiles.addColorStop(1,'#251f19');
      layer.fillStyle=tiles;layer.fillRect(footprint.x,footprint.y,footprint.w,footprint.h);
      // Tile courses. These used to be drawn at rgba(120,104,78,.4) over a 2px line every 16px, plus a
      // 3px ridge at .55 — bright, hard-edged, evenly spaced lines. While the roof is fully opaque that
      // is just texture, but the roof is ALPHA-FADED as the survivor steps in, and a fading slab does
      // not fade its own contrast: the dark tile fill drops out first and the bright lines survive as a
      // ladder of hard white stripes lying across the revealed interior. That ladder is the artifact.
      // Held just above the tile fill instead of well above it, so the courses read as a surface at full
      // opacity and have nothing left to stand out with once the slab fades.
      layer.strokeStyle='rgba(74,66,52,.30)';layer.lineWidth=1;
      for(let py=footprint.y+12;py<footprint.y+footprint.h;py+=16){layer.beginPath();layer.moveTo(footprint.x,py);layer.lineTo(footprint.x+footprint.w,py);layer.stroke()}
      // Ridge line, so the roof is not a flat grey slab. Same reasoning: barely above the fill.
      layer.strokeStyle='rgba(92,82,64,.38)';layer.lineWidth=2;
      layer.beginPath();layer.moveTo(footprint.x+6,footprint.y+footprint.h*.5);layer.lineTo(footprint.x+footprint.w-6,footprint.y+footprint.h*.5);layer.stroke();
      // Weathering was a hard-edged triangle fixed at one corner of the footprint. That corner sits
      // inside window n2's peek zone, so every time a door/window wedge punched a soft hole nearby, the
      // triangle's crisp silhouette survived just outside the erase radius and read as a black artifact
      // floating in mid-air over the revealed interior — the "giant black triangle" defect. A soft radial
      // smudge with no hard edge either blends into the soft hole falloff (erased along with it) or, if
      // just outside the radius, fades into the tile gradient instead of standing out as a shape.
      const wear=layer.createRadialGradient(footprint.x+footprint.w-34,footprint.y+30,2,footprint.x+footprint.w-34,footprint.y+30,30);
      wear.addColorStop(0,'rgba(15,13,10,.5)');wear.addColorStop(1,'rgba(15,13,10,0)');
      layer.fillStyle=wear;layer.fillRect(footprint.x+footprint.w-64,footprint.y,64,60);
    }
    if(textured){
      // Two artifacts are fixed here, and both are edge artifacts of pasting a rectangular photo onto
      // the yard.
      //
      // 1. EXPOSURE. Measured across all 26 environment assets the palette band is L .112-.252, and the
      //    roof sits at .230 — the third brightest thing in the game, brighter than the mud it is
      //    standing on (ground .147, asphalt .133). The house therefore read as a bright slab pasted on
      //    a dark yard: the house region measured avgL .215 against .167 for the frame around it. A
      //    neutral multiply pulls the slab back into the band without touching its hue, so the roof
      //    stops being the brightest surface in a night scene while keeping its own material light.
      //
      // 2. THE EDGE. A photo drawn with 'cover' ends on four mathematically straight lines, which is
      //    exactly what "прямоугольник лежит на земле" is. A real roof has an overhang, and an overhang
      //    reads as a band of shade around its own perimeter where the eave turns away from the sky.
      //    Four linear gradients — one per side, dark at the edge and gone a few pixels in — give the
      //    slab that band, so the silhouette is a shaded lip instead of a cut. It also hides the seam
      //    where the crop of roof.png meets the wall band underneath.
      layer.save();
      layer.globalCompositeOperation='multiply';
      // Measured after the first pass at .22: the house region still sat at avgL .200 against .155 for
      // the yard around it — a 29% bright slab. Deepened to .36, which lands the footprint inside the
      // yard's own band instead of above it.
      layer.fillStyle='rgba(146,138,124,.36)';
      layer.fillRect(footprint.x,footprint.y,footprint.w,footprint.h);
      // Eave shade. The band is proportional to the footprint so it holds at any building size.
      const eave=Math.max(6,Math.min(footprint.w,footprint.h)*.075);
      const sides=[
        [footprint.x,footprint.y,footprint.w,eave,0,1],
        [footprint.x,footprint.y+footprint.h-eave,footprint.w,eave,0,-1],
        [footprint.x,footprint.y,eave,footprint.h,1,0],
        [footprint.x+footprint.w-eave,footprint.y,eave,footprint.h,-1,0]
      ];
      for(const [bx,by,bw,bh,dx,dy] of sides){
        const from={x:dx>0?bx:dx<0?bx+bw:bx,y:dy>0?by:dy<0?by+bh:by};
        const to={x:dx>0?bx+bw:dx<0?bx:bx,y:dy>0?by+bh:dy<0?by:by};
        const shade=layer.createLinearGradient(from.x,from.y,to.x,to.y);
        shade.addColorStop(0,'rgba(58,52,44,.62)');
        shade.addColorStop(1,'rgba(58,52,44,0)');
        layer.fillStyle=shade;layer.fillRect(bx,by,bw,bh);
      }
      layer.restore();
    }
    // Softened for the same reason as the yard fog: a peek slice with hard sides looks like a hole cut
    // in the roof, a softened one looks like the interior catching the light through the glass.
  },{clip:footprint,feather:10,soften:true});
}

// Yard fog: while inside, everything outside the walls is unseen except the slices framed by the
// windows. This is the other half of the perspective read — the yard opens and closes as you move.
export function drawExteriorFog(ctx,shelter,viewer,width,height,dawn=0){
  // OFF. Softening this from an opaque black field to a light haze fixed the "black screen with dots of
  // light" read, but it exposed what the haze is actually made of: eight sight wedges, each 1600px long,
  // each erased through seven nested passes. The west and east windows fire theirs horizontally, so their
  // erase boundaries land as thin near-horizontal seams stretching the full width of the canvas — the
  // stripes lying across the frame. At 16% density the haze contributes almost nothing to the image, and
  // the seams are the only thing anyone can actually see it doing, so the whole pass is now skipped.
  // The perspective read it was built for still exists and still works: it lives in the ROOF mask
  // (drawShelterRoof), which is the half of the mechanic that decides whether you see the interior.
  // What is lost is only the reverse — dimming the yard you cannot see from indoors — and dimming the
  // yard is exactly what we have spent this whole pass removing.
  return;
  if(!isInsideShelter(shelter,viewer.x,viewer.y))return;
  // The yard reads further than a room does: an open doorway or window shows a good stretch of street
  // before the dark closes in, so the reveal radius here is more than double the interior one.
  const wedges=visibleGaps(shelter,viewer).map(gap=>sightWedge(viewer,gap,SIGHT_REACH,YARD_REVEAL_RADIUS));
  // The unseen yard is not pure black once the sun is coming up — it is a pale haze. Holding it at
  // near-black through dawn was the second reason the interior read as a hard black star: an almost
  // opaque black field with soft holes in it still looks like a black field.
  // This fill WAS the black. At .9 density over near-black tone it covered the entire yard, and the
  // sight wedges punched holes in it — which is literally "чёрный экран с точками света": the holes were
  // the only places any texture survived. Fog of war is a stealth-game mechanic and this is not a
  // stealth game; hiding the artwork we generated behind an opaque field cannot look good no matter how
  // the holes are shaped. It is now a light haze that dims the unseen yard slightly instead of deleting
  // it, so the ground, fence and street textures stay readable everywhere and the wedges only add a
  // gentle lift where you happen to be looking.
  const tone=[Math.round(96+dawn*40),Math.round(96+dawn*40),Math.round(100+dawn*40)];
  const density=(.16-dawn*.10).toFixed(3);
  drawOccluderWithHoles(ctx,width,height,wedges,layer=>{
    layer.fillStyle=`rgba(${tone[0]},${tone[1]},${tone[2]},${density})`;layer.fillRect(0,0,width,height);
    // The wall band itself must stay visible, so the building never dissolves into the fog
    layer.globalCompositeOperation='destination-out';
    layer.fillRect(shelter.x,shelter.y,shelter.width,shelter.height);
  },{feather:22,soften:true});
}

// Warm light spilling out of every unboarded opening onto the yard, and the matching cold shaft of
// street light falling inside. Cheap, and it does more for the mood than any texture.
// Strengthened from .3 to .52, to match the interior pool and the lamp pools: a house with people still
// alive inside it should be visibly the warmest object in a dark yard, not a rectangle with a suggestion
// of light near the glass.
export function drawWindowLight(ctx,shelter,intensity=1){
  if(intensity<=.02)return;
  ctx.save();ctx.globalCompositeOperation='lighter';
  for(const gap of shelterOpenings(shelter)){
    const midX=(gap.x1+gap.x2)/2,midY=(gap.y1+gap.y2)/2,span=Math.hypot(gap.x2-gap.x1,gap.y2-gap.y1);
    // Reach was 38+span*1.5 — about 125px for a standard window. The building is only 272×200, so nine
    // of those haloes did not spill ONTO the yard, they covered the whole house and each other, and the
    // sum read as a milky rectangle sitting where the interior should be. Light from a window is a pool
    // on the ground right under the glass, roughly the width of the opening; it is not a lantern.
    const reach=14+span*.55,cx=midX+gap.nx*reach*.62,cy=midY+gap.ny*reach*.62;
    const glow=ctx.createRadialGradient(cx,cy,1,cx,cy,reach);
    // Nine openings each fire this additively and they overlap along every wall, so the per-opening
    // figure is not the figure that lands on screen — the facade was receiving two or three of these
    // stacked, then the bloom pass on top. Pulled .52 -> .38 and warmed towards orange so the spill
    // still reads as the warmest thing in the yard without burning the wall it is spilling from.
    glow.addColorStop(0,`rgba(255,190,104,${(.38*intensity).toFixed(3)})`);
    glow.addColorStop(1,'rgba(214,168,96,0)');
    ctx.fillStyle=glow;ctx.beginPath();ctx.arc(cx,cy,reach,0,Math.PI*2);ctx.fill();
  }
  ctx.restore();
}

// Scratch layer the shafts are drawn on before they are blurred onto the target in one pass.
// Blurring each beam individually would mean nine `filter` changes and nine composites per frame;
// gathering them first costs one.
let beamCanvas=null,beamContext=null;
function beamLayer(width,height){
  if(!beamCanvas){beamCanvas=document.createElement('canvas');beamContext=beamCanvas.getContext('2d')}
  if(beamCanvas.width!==width||beamCanvas.height!==height){beamCanvas.width=width;beamCanvas.height=height}
  beamContext.setTransform(1,0,0,1,0,0);
  beamContext.globalCompositeOperation='source-over';
  beamContext.filter='none';
  beamContext.clearRect(0,0,width,height);
  return beamContext;
}
// How much the gathered beams are blurred on the way out. This is the single reason the old shafts
// looked wrong: they were flat-shaded polygons with mathematically hard sides, so nine of them read as
// a bicycle wheel of grey spokes rather than as light. Light through a gap has no edge you can point
// at; the blur is not a decoration here, it is what makes the shape read as light at all.
const SHAFT_BLUR=11;

// How far a shaft of outside light reaches across the floor before it dies.
const SHAFT_DEPTH=136;
// Night and dawn ends of the shaft colour. At night the only light outside is the streetlamps and it
// arrives cold and weak; by morning the same openings are the brightest thing in the building.
const SHAFT_NIGHT=[132,152,182],SHAFT_DAWN=[244,212,154];

// Interior lighting veils. Two passes over the floor, in this order:
//
//   1. an occlusion veil that drops the whole room into gloom, and
//   2. one additive shaft per opening, spreading inwards from the gap.
//
// Together they are what makes an interior read as a lived-in room rather than a lit rectangle: the
// floor is dark, and the light you get is the light your own windows let in. Because the shafts are
// built from windowGaps(), boarding a window automatically converts its single wide shaft into a set
// of thin slit shafts — the room dims as you nail it shut, without a single extra line of code here.
// `light` is the bounded light buffer (see lighting.js). When it is supplied the additive shafts are
// accumulated there instead of being fired straight at the frame, which is what stops nine overlapping
// beams from summing past white. Passing nothing keeps the old single-context behaviour for tests.
export function drawWindowVeils(ctx,shelter,viewer,dawn=0,lamp=1,light=null){
  // The occlusion veil used to be gated on standing inside. That was the single biggest cause of the
  // "whitewashed interior" defect: from the yard the room got NO gloom pass at all, so every peek slice
  // the roof punched exposed the interior artwork at full brightness, sitting under the grade's central
  // amber punch and the bloom. A room is dark whether or not you happen to be standing in it — the veil
  // is a property of the building, not of the camera. It now runs unconditionally, and the shafts with
  // it, so a peek through the glass shows the same lit room the survivor sees from the inside.
  const t=shelter.thickness;
  const floor={x:shelter.x+t,y:shelter.y+t,w:shelter.width-t*2,h:shelter.height-t*2};
  let shafts=0;
  ctx.save();
  ctx.beginPath();ctx.rect(floor.x,floor.y,floor.w,floor.h);ctx.clip();
  // Occlusion veil. It lifts as the sun comes up, so the room is not permanently in a cave.
  ctx.globalCompositeOperation='multiply';
  // Warm, not blue. A blue-grey multiply over warm brown boards cancels the hue and leaves the exact
  // desaturated sludge this whole pass exists to kill; a warm-brown multiply darkens while KEEPING the
  // saturation, which is what a room lit only by an oil lamp actually looks like. Deepened .46 -> .60
  // to match the interior artwork now being a lit photo rather than a dim drawing.
  // Neutral shade, not a brown wash. This fill covers the whole interior floor, so any hue in it is a
  // tint over every asset in the room — that is how the interior ended up rust-coloured. It now only
  // takes light away; the warmth in the room comes from the lamp, which is an actual light source.
  // Was .58 — a 58% black multiply over the entire interior. The interior artwork is a lit cutaway photo
  // that already contains its own lamp, its own shadows and its own falloff; multiplying it by a dark
  // rectangle does not "add gloom", it destroys the lighting that is painted into the asset and leaves a
  // flat murk that then needed window light and interior light passes to dig back out of — which is how
  // three passes ended up fighting over the same 272×200 rectangle. Dropped to a token 8% so the room
  // sits a hair below the yard in brightness and nothing more; the mood comes from the photo.
  ctx.fillStyle=`rgba(20,20,22,${(.08-dawn*.08).toFixed(3)})`;
  ctx.fillRect(floor.x,floor.y,floor.w,floor.h);
  ctx.restore();
  // The shafts are gathered on their own layer, blurred once, and only then composited. Drawing them
  // straight onto the frame as flat polygons is what made them read as grey spokes: a clipped polygon
  // has mathematically hard sides, and nine hard-sided quads meeting at a building look like a wheel,
  // not like light. Light coming through a gap has no edge you can point at, so the blur is the effect.
  // Sized against the buffer the beams will land in, not against the frame. The frame's backing store
  // is multiplied by the device pixel ratio while the light buffer is in world units, so measuring the
  // wrong one produces a beam layer at 2× on a retina display and the shafts land at half scale.
  const target=light||ctx;
  const width=target.canvas.width,height=target.canvas.height;
  const layer=beamLayer(width,height);
  const tint=SHAFT_NIGHT.map((c,i)=>Math.round(c+(SHAFT_DAWN[i]-c)*dawn));
  // A shaft is brightest at dawn and only a faint spill at night, when it is streetlamp bleed
  const strength=(.13*lamp+.30*dawn);
  layer.save();
  layer.globalCompositeOperation='lighter';
  for(const gap of shelterOpenings(shelter)){
    const dx=gap.x2-gap.x1,dy=gap.y2-gap.y1,span=Math.hypot(dx,dy);
    // A fully boarded window can leave sub-pixel slits; drawing those wastes a gradient per frame
    if(span<3)continue;
    const alongX=dx/span,alongY=dy/span;
    // Light enters against the wall's outward normal
    const inX=-gap.nx,inY=-gap.ny;
    const depth=SHAFT_DEPTH*(gap.door?1.3:1),spread=span*.6+10;
    const midX=(gap.x1+gap.x2)/2,midY=(gap.y1+gap.y2)/2;
    // The far end is drawn as a rounded cap rather than a straight cut. A quad ends on a hard chord,
    // and once the beam fades to zero alpha that chord is still a straight line across the floor —
    // the "shaft stops dead in mid-room" artifact. Sampling the spread along an arc removes it.
    const points=[{x:gap.x1,y:gap.y1}];
    const ARC=6;
    for(let i=0;i<=ARC;i++){
      const k=i/ARC,bow=Math.sin(k*Math.PI)*depth*.16;
      const lateral=(k*2-1)*spread;
      points.push({
        x:gap.x1+alongX*span*k+inX*(depth+bow)+alongX*lateral,
        y:gap.y1+alongY*span*k+inY*(depth+bow)+alongY*lateral
      });
    }
    points.push({x:gap.x2,y:gap.y2});
    const beam=layer.createLinearGradient(midX,midY,midX+inX*depth,midY+inY*depth);
    beam.addColorStop(0,`rgba(${tint[0]},${tint[1]},${tint[2]},${strength.toFixed(3)})`);
    beam.addColorStop(.45,`rgba(${tint[0]},${tint[1]},${tint[2]},${(strength*.42).toFixed(3)})`);
    beam.addColorStop(1,`rgba(${tint[0]},${tint[1]},${tint[2]},0)`);
    layer.fillStyle=beam;
    tracePolygon(layer,points);layer.fill();
    shafts++;
  }
  layer.restore();
  if(shafts){
    // One composite, blurred, clipped to the floor so the blur cannot bleed the room's light out over
    // the yard. Accumulated into the bounded light buffer when one is supplied.
    target.save();
    target.beginPath();target.rect(floor.x,floor.y,floor.w,floor.h);target.clip();
    target.globalCompositeOperation='lighter';
    target.filter=`blur(${SHAFT_BLUR}px)`;
    target.drawImage(beamCanvas,0,0);
    target.filter='none';
    target.restore();
  }
  return shafts;
}

// --- Boarding -----------------------------------------------------------------------------------

// The window whose frame the survivor is standing next to, from either side.
export function windowNear(shelter,x,y,reach=34){
  let best=null,bestDistance=reach;
  for(const win of shelter.windows){
    const seg=wallSegment(shelter,win.side,win.offset,win.span);
    const distance=distanceToSegment(x,y,seg);
    if(distance<bestDistance){bestDistance=distance;best=win}
  }
  return best;
}

function distanceToSegment(px,py,seg){
  const dx=seg.x2-seg.x1,dy=seg.y2-seg.y1,length=dx*dx+dy*dy||1;
  const t=Math.max(0,Math.min(1,((px-seg.x1)*dx+(py-seg.y1)*dy)/length));
  return Math.hypot(px-(seg.x1+dx*t),py-(seg.y1+dy*t));
}

export function canBoard(win){return win&&win.boards<MAX_BOARDS}
export function boardWindow(shelter,win){
  if(!canBoard(win))return false;
  win.boards++;win.boardHp+=40;
  // Planks are structure: they raise what the building can take before it falls
  shelter.maxHp+=40;shelter.hp=Math.min(shelter.maxHp,shelter.hp+40);
  return true;
}
export function pryWindow(shelter,win){
  if(!win||win.boards<=0)return false;
  win.boards--;win.boardHp=Math.max(0,win.boardHp-40);
  shelter.maxHp=Math.max(1,shelter.maxHp-40);shelter.hp=Math.min(shelter.hp,shelter.maxHp);
  return true;
}
export const maxBoards=MAX_BOARDS;
export const totalBoards=shelter=>shelter.windows.reduce((sum,win)=>sum+win.boards,0);

// Damage is routed through the fabric of the building instead of straight into one health pool.
// Planks nailed over the nearest window soak the hit first and splinter off when spent, and a
// reinforced barricade shaves the remainder. Without this, boarding a window changed nothing about
// how fast the house fell, which made the whole preparation phase pointless.
export function damageShelter(shelter,point,amount,{reinforced=false}={}){
  const win=windowNear(shelter,point.x,point.y,64);
  let remaining=amount,splintered=false;
  if(win&&win.boardHp>0){
    const soak=Math.min(win.boardHp,amount*.72);
    win.boardHp-=soak;remaining-=soak;
    // A plank that runs out of hit points is torn off, and the structure it added goes with it
    if(win.boardHp<=0&&win.boards>0){
      win.boards--;win.boardHp=Math.max(0,win.boardHp);splintered=true;
      shelter.maxHp=Math.max(1,shelter.maxHp-40);shelter.hp=Math.min(shelter.hp,shelter.maxHp);
    }
  }
  if(reinforced)remaining*=.82;
  shelter.hp-=remaining;
  return {absorbed:+(amount-remaining).toFixed(2),dealt:+remaining.toFixed(2),window:win||null,splintered};
}

// Nearest point on the outer wall for a zombie to walk up to and hit. Replaces the old stop-radius
// circle, which was the main reason the defence read as an abstract diagram.
export function nearestWallPoint(shelter,x,y){
  const clampedX=Math.max(shelter.x,Math.min(x,shelter.x+shelter.width));
  const clampedY=Math.max(shelter.y,Math.min(y,shelter.y+shelter.height));
  const inside=x>shelter.x&&x<shelter.x+shelter.width&&y>shelter.y&&y<shelter.y+shelter.height;
  if(!inside)return {x:clampedX,y:clampedY,distance:Math.hypot(x-clampedX,y-clampedY)};
  // Inside the footprint: push out to the closest face
  const left=x-shelter.x,right=shelter.x+shelter.width-x,top=y-shelter.y,bottom=shelter.y+shelter.height-y;
  const min=Math.min(left,right,top,bottom);
  if(min===left)return {x:shelter.x,y,distance:0};
  if(min===right)return {x:shelter.x+shelter.width,y,distance:0};
  if(min===top)return {x,y:shelter.y,distance:0};
  return {x,y:shelter.y+shelter.height,distance:0};
}
