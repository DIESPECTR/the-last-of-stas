// Environment rendering layer: streets, streetlamps, night/dawn cycle, rain, defense perimeter and wooden barricades.
// Every element renders procedurally in the charcoal / dirty-paper style and transparently upgrades to a PNG texture
// as soon as the matching file appears under assets/environment/ — no code change required.

import {textureSlots} from './destructibles.js';

// Every destructible state gets its own slot: 5 prop kinds × intact/damaged/ruined = 15 photographic
// cutouts under assets/environment/destructibles/. The names come from destructibles.js rather than
// being retyped here, so the renderer and the asset pipeline can never drift apart.
const DESTRUCTIBLE_FILES=Object.fromEntries(textureSlots.map(slot=>[slot,`../assets/environment/destructibles/${slot}.png`]));

const TEXTURE_FILES={
  ...DESTRUCTIBLE_FILES,
  ground:'../assets/environment/ground.png',
  asphalt:'../assets/environment/asphalt.png',
  lamp:'../assets/environment/streetlamp.png',
  barricade:'../assets/environment/barricade.png',
  debris:'../assets/environment/debris.png',
  trap:'../assets/environment/trap.png',
  shelter:'../assets/environment/shelter.png',
  // The roof is the occluder drawn over the footprint while the survivor is outside. It stayed
  // procedural far longer than anything else and that procedural version — a near-black gradient slab
  // with bright evenly-spaced tile courses stroked across it — is what read as "a black rectangle with
  // white stripes lying on the house". A photographic slab replaces both defects at once.
  roof:'../assets/environment/roof.png',
  // Neighbouring silhouettes that frame the yard; each slot stays procedural until its PNG lands
  house_left:'../assets/environment/house_left.png',
  house_right:'../assets/environment/house_right.png',
  house_top:'../assets/environment/house_top.png',
  house_bottom:'../assets/environment/house_bottom.png',
  fence:'../assets/environment/fence.png'
};
// Tiled surfaces are repeated as Canvas patterns instead of being stretched over the whole yard
const TILED=new Set(['ground','asphalt']);

// Transparent PNGs come out of rembg with wide empty margins. Measuring the opaque box once at load
// time lets every draw call use the real artwork bounds, so nothing is offset or squashed on screen.
// Accepts an Image OR a canvas: after keying, the source of truth is the keyed canvas, which has no
// naturalWidth. Reading the wrong property produced a zero-sized scan and silently marked every keyed
// slot as not ready, which looked exactly like a missing file.
function measureBounds(image){
  const scan=document.createElement('canvas'),scanContext=scan.getContext('2d',{willReadFrequently:true});
  scan.width=image.naturalWidth||image.width;scan.height=image.naturalHeight||image.height;scanContext.drawImage(image,0,0);
  const {data,width,height}=scanContext.getImageData(0,0,scan.width,scan.height);
  let left=width,top=height,right=-1,bottom=-1;
  for(let y=0;y<height;y++)for(let x=0;x<width;x++)if(data[(y*width+x)*4+3]>14){
    if(x<left)left=x;if(x>right)right=x;if(y<top)top=y;if(y>bottom)bottom=y;
  }
  return right<left?{x:0,y:0,width,height}:{x:left,y:top,width:right-left+1,height:bottom-top+1};
}

// Background keying at load time.
//
// The generated prop cutouts arrived FULLY OPAQUE: every one of the fifteen files had a pure white
// background baked in (corner pixels measured 253,253,254,255 and the opaque area was 100%). Drawn as-is
// each prop was a white rectangle sitting on the mud, and `measureBounds` returned the whole image
// because every edge pixel counted as artwork. Keying here rather than re-cutting the files keeps the
// renderer safe against any future asset that arrives without an alpha channel.
//
// A flood fill from the border is used instead of a global "white is transparent" test on purpose: the
// props legitimately contain near-white pixels (a headlight, a cracked tile, a paint highlight), and a
// global test punches holes straight through the artwork. Only white REACHABLE FROM THE EDGE is
// background, which is exactly the definition the eye uses.
const KEY_LUMA=232,KEY_CHROMA=26;
function keyBackground(image){
  const width=image.naturalWidth,height=image.naturalHeight;
  const surface=document.createElement('canvas'),surfaceContext=surface.getContext('2d',{willReadFrequently:true});
  surface.width=width;surface.height=height;surfaceContext.drawImage(image,0,0);
  const frame=surfaceContext.getImageData(0,0,width,height),data=frame.data;
  const isBackground=index=>{
    const r=data[index],g=data[index+1],b=data[index+2];
    // Bright AND neutral: a bright warm highlight on the car body is not background
    return Math.min(r,g,b)>=KEY_LUMA&&Math.max(r,g,b)-Math.min(r,g,b)<=KEY_CHROMA;
  };
  // Iterative flood fill with a typed queue. A recursive fill overflows the stack on a 1536² image.
  const visited=new Uint8Array(width*height),queue=new Int32Array(width*height);
  let head=0,tail=0;
  const push=pixel=>{if(!visited[pixel]&&isBackground(pixel*4)){visited[pixel]=1;queue[tail++]=pixel}};
  for(let x=0;x<width;x++){push(x);push((height-1)*width+x)}
  for(let y=0;y<height;y++){push(y*width);push(y*width+width-1)}
  while(head<tail){
    const pixel=queue[head++],x=pixel%width,y=(pixel-x)/width;
    if(x>0)push(pixel-1);
    if(x<width-1)push(pixel+1);
    if(y>0)push(pixel-width);
    if(y<height-1)push(pixel+width);
  }
  if(!tail)return null;
  for(let pixel=0;pixel<visited.length;pixel++)if(visited[pixel])data[pixel*4+3]=0;
  // One-pixel feather so the cutout edge is not a hard aliased staircase against the dark yard
  for(let pixel=0;pixel<visited.length;pixel++){
    if(visited[pixel])continue;
    const x=pixel%width,y=(pixel-x)/width;
    let touching=0;
    if(x>0&&visited[pixel-1])touching++;
    if(x<width-1&&visited[pixel+1])touching++;
    if(y>0&&visited[pixel-width])touching++;
    if(y<height-1&&visited[pixel+width])touching++;
    if(touching)data[pixel*4+3]=Math.round(data[pixel*4+3]*(1-touching*.22));
  }
  surfaceContext.putImageData(frame,0,0);
  return surface;
}
// Slots that are opaque surfaces by design: keying a ground tile would eat its lightest gravel.
const OPAQUE_SLOTS=new Set(['ground','asphalt']);
// Does this image still carry a solid background? Four corners are enough to tell, and it keeps the
// expensive flood fill off files that were cut out properly.
// The four corners are copied ONE PIXEL AT A TIME. Downscaling the whole image into a 3×3 probe was
// tried first and failed on thirteen of fifteen files: each probe pixel becomes the average of a whole
// quadrant, so the dark subject dragged the "corner" far below the white threshold and the keyer decided
// the background was already transparent. Only real corner pixels answer this question.
function needsKeying(image){
  const width=image.naturalWidth||image.width,height=image.naturalHeight||image.height;
  const probe=document.createElement('canvas'),probeContext=probe.getContext('2d',{willReadFrequently:true});
  probe.width=2;probe.height=2;
  const corners=[[0,0,0,0],[width-1,0,1,0],[0,height-1,0,1],[width-1,height-1,1,1]];
  for(const [sx,sy,dx,dy] of corners)probeContext.drawImage(image,sx,sy,1,1,dx,dy,1,1);
  const data=probeContext.getImageData(0,0,2,2).data;
  for(let corner=0;corner<4;corner++){
    const index=corner*4;
    if(data[index+3]<250)return false;
    if(Math.min(data[index],data[index+1],data[index+2])<KEY_LUMA)return false;
  }
  return true;
}

// Optional texture hooks. A missing file simply leaves the procedural drawing in place.
function loadTextures(){
  const textures=new Map();
  for(const [key,src] of Object.entries(TEXTURE_FILES)){
    const image=new Image(),entry={image,ready:false,bounds:null,tiled:TILED.has(key)};
    image.onload=()=>{
      if(!image.naturalWidth)return;
      // Cut the background out first, otherwise the bounds below measure the white rectangle instead of
      // the artwork. `entry.image` becomes the keyed canvas, which drawImage accepts identically.
      if(!OPAQUE_SLOTS.has(key)&&needsKeying(image)){
        const keyed=keyBackground(image);
        if(keyed){entry.image=keyed;entry.keyed=true}
      }
      // Opaque tiles have no margin to trim, and scanning a 1024² tile every reload is wasted work
      entry.bounds=entry.tiled?{x:0,y:0,width:image.naturalWidth,height:image.naturalHeight}:measureBounds(entry.image);
      entry.ready=entry.bounds.width>0&&entry.bounds.height>0;
    };
    image.onerror=()=>{entry.ready=false};
    image.src=src;
    textures.set(key,entry);
  }
  return textures;
}
const texture=(env,key)=>{const entry=env.textures.get(key);return entry?.ready?entry:null};
// Asset hook report for IDE tooling: which environment slots are textured and which are still procedural
export const environmentTextureStatus=env=>Object.keys(TEXTURE_FILES).map(key=>({key,file:TEXTURE_FILES[key],ready:!!texture(env,key)}));

// Draw a texture inside a box using only its opaque area, preserving the source aspect ratio.
// mode 'contain' fits the whole artwork in the box; 'cover' fills the box and crops the overflow.
function drawTexture(ctx,entry,x,y,width,height,mode='contain'){
  const b=entry.bounds,ratio=b.width/b.height,boxRatio=width/height;
  let w=width,h=height;
  if(mode==='contain'){if(ratio>boxRatio)h=width/ratio;else w=height*ratio}
  ctx.drawImage(entry.image,b.x,b.y,b.width,b.height,x+(width-w)/2,y+(height-h)/2,w,h);
}

// Repeat a texture horizontally across a run, keeping every copy at its natural proportions.
// Every second section is mirrored so a long fence never reads as the same plank group stamped in a line.
function tileTextureRow(ctx,entry,x,y,width,height){
  const b=entry.bounds,step=Math.max(24,height*b.width/b.height);
  ctx.save();ctx.beginPath();ctx.rect(x,y,width,height);ctx.clip();
  for(let index=0,offset=0;offset<width;index++,offset+=step){
    ctx.save();
    if(index%2){ctx.translate(x+offset+step,y);ctx.scale(-1,1);ctx.drawImage(entry.image,b.x,b.y,b.width,b.height,0,0,step,height)}
    else ctx.drawImage(entry.image,b.x,b.y,b.width,b.height,x+offset,y,step,height);
    ctx.restore();
  }
  ctx.restore();
}

// Cached Canvas pattern for the ground and road tiles.
// A single repeated tile makes the yard read as a grid of identical slabs. Mirroring was tried first and
// was worse: flipped neighbours create obvious butterfly symmetry. Instead the pattern cell is a 3×3
// mosaic where every cell is rotated by a different multiple of 90° and takes a different square crop of
// the source. Rotation carries no symmetry axis, and the 3×3 cell triples the repeat period in both axes.
// A rotated crop of the source with its edges faded to nothing, so it can be stamped over the base
// without leaving a visible rectangular seam.
function featheredPatch(image,size,sx,sy,crop,turns){
  const patch=document.createElement('canvas');patch.width=patch.height=size;
  const patchContext=patch.getContext('2d');
  patchContext.save();patchContext.translate(size/2,size/2);patchContext.rotate(turns*Math.PI/2);
  patchContext.drawImage(image,sx,sy,crop,crop,-size/2,-size/2,size,size);patchContext.restore();
  const mask=patchContext.createRadialGradient(size/2,size/2,size*.18,size/2,size/2,size*.5);
  mask.addColorStop(0,'rgba(0,0,0,1)');mask.addColorStop(1,'rgba(0,0,0,0)');
  patchContext.globalCompositeOperation='destination-in';patchContext.fillStyle=mask;patchContext.fillRect(0,0,size,size);
  return patch;
}
// Deterministic patch placements inside the 3×3 pattern cell: position (0..3 cells), crop origin and rotation
const MOSAIC_PATCHES=[[.35,.20,.10,.55,1],[1.55,.55,.30,.05,3],[2.45,.30,.55,.35,2],[.80,1.45,.05,.30,3],[2.10,1.70,.40,.55,1],[1.25,2.35,.55,.10,2],[2.65,2.15,.20,.45,3],[.15,2.60,.35,.20,1]];
function surfacePattern(ctx,entry,scale){
  if(entry.pattern&&entry.patternScale===scale)return entry.pattern;
  const size=Math.max(32,Math.round(entry.image.naturalWidth*scale)),cell=size*3,tile=document.createElement('canvas');
  tile.width=tile.height=cell;
  const tileContext=tile.getContext('2d');
  // Base layer: the seamless source repeated 3×3, so the pattern cell itself still wraps perfectly
  for(let row=0;row<3;row++)for(let column=0;column<3;column++)tileContext.drawImage(entry.image,column*size,row*size,size,size);
  // Break-up layer: rotated, feathered crops stamped over the base. Each patch is also drawn at every
  // wrapped offset so a patch crossing the cell edge continues correctly on the opposite side.
  const source=Math.min(entry.image.naturalWidth,entry.image.naturalHeight),crop=Math.round(source*.55),span=source-crop;
  for(const [px,py,cx,cy,turns] of MOSAIC_PATCHES){
    const patch=featheredPatch(entry.image,size,Math.round(span*cx),Math.round(span*cy),crop,turns);
    const x=px*size-size/2,y=py*size-size/2;
    for(const dx of [-cell,0,cell])for(const dy of [-cell,0,cell])tileContext.drawImage(patch,x+dx,y+dy);
  }
  entry.pattern=ctx.createPattern(tile,'repeat');entry.patternScale=scale;
  return entry.pattern;
}

const DEFAULT_CONFIG={
  // The road runs along the upper yard so the shelter never sits on the asphalt
  streets:[{x:0,y:276,width:960,height:88,orientation:'horizontal'},{x:0,y:812,width:960,height:72,orientation:'horizontal'}],
  // No lamp above the shelter: light comes from the street, the yard corner and the far pavement
  lamps:[{x:132,y:272,reach:150},{x:672,y:272,reach:150},{x:868,y:650,reach:138},{x:210,y:48,reach:120},{x:740,y:848,reach:120}],
  weather:{rain:0.55,wind:-0.32},
  cycle:{dawn_from:0.62}
};

// Deterministic pseudo-random so ground scratches never flicker between frames
function seeded(seed){let value=seed;return()=>{value=(value*1664525+1013904223)%4294967296;return value/4294967296}}

export function createEnvironment(canvas,config={}){
  const merged={...DEFAULT_CONFIG,...config,weather:{...DEFAULT_CONFIG.weather,...config.weather},cycle:{...DEFAULT_CONFIG.cycle,...config.cycle}};
  const random=seeded(20260810);
  const env={
    width:canvas.width,height:canvas.height,
    config:merged,
    textures:loadTextures(),
    time:0,progress:0,dawn:0,rain:merged.weather.rain||0,
    drops:[],splashes:[],
    // Static scenery is generated once so the yard stays visually stable across frames
    scratches:Array.from({length:170},()=>({x:random()*canvas.width,y:random()*canvas.height,len:9+random()*16,angle:random()*Math.PI,bright:random()>.87})),
    // Puddles collect on the road and along the yard edges, never under the shelter footprint
    puddles:Array.from({length:16},()=>({x:random()*canvas.width,y:36+random()*(canvas.height-72),rx:14+random()*34,ry:5+random()*11})),
    // Large soft mud patches painted over the tiled ground: they hide the remaining repeat rhythm and
    // give the yard low-frequency variation that a single seamless tile can never provide
    mottles:Array.from({length:26},()=>({x:random()*canvas.width,y:random()*canvas.height,rx:70+random()*150,ry:40+random()*90,dark:random()>.42,alpha:.05+random()*.09})),
    // Wrecks and rubble pushed to the yard corners so the defended ground stays readable
    debris:[[46,476,92,54],[818,426,108,62],[92,678,98,55],[742,692,118,60],[80,36,88,48],[790,52,96,50],[60,880,100,52],[820,868,110,56]].map(([x,y,w,h])=>({x,y,w,h})),
    // Facades: original neighbours sit in the desktop crop; extra north/south fill the reel letterbox.
    facades:[
      {key:'house_top',x:18,y:0,w:400,h:118},
      {key:'house_top',x:542,y:4,w:400,h:114},
      {key:'house_left',x:22,y:182,w:266,h:92},
      {key:'house_right',x:602,y:180,w:318,h:94},
      {key:'house_bottom',x:14,y:836,w:420,h:118},
      {key:'house_bottom',x:508,y:840,w:438,h:116}
    ],
    // Broken fence marking the yard boundary; extra runs sit on the north/south yards
    fences:[{x:0,y:128,w:300},{x:660,y:128,w:300},{x:0,y:416,w:336},{x:636,y:416,w:324},{x:0,y:790,w:310},{x:650,y:790,w:310}]
  };
  // Two rain layers: a soft distant curtain and sharp close streaks, so the downpour reads as volume, not noise
  const density=Math.round(300*(merged.weather.rain||0));
  env.drops=Array.from({length:density},(_,i)=>{
    const near=i%3===0;
    return {x:random()*canvas.width,y:random()*canvas.height,len:near?16+random()*16:8+random()*9,speed:near?680+random()*320:420+random()*220,near,ground:150+random()*(canvas.height-150)};
  });
  return env;
}

// progress: 0 at the start of the night, 1 at dawn. Drives tint, lamp warmth and rain intensity.
export function updateEnvironment(env,dt,progress=0){
  env.time+=dt;
  env.progress=Math.max(0,Math.min(1,progress));
  const {dawn_from}=env.config.cycle;
  const raw=env.progress<=dawn_from?0:(env.progress-dawn_from)/(1-dawn_from);
  // Smoothstep easing: the sky must not snap from night to morning in a single frame
  env.dawn=raw*raw*(3-2*raw);
  // The storm dies down as the sky opens up
  env.rain=(env.config.weather.rain||0)*(1-env.dawn*.8);
  const wind=env.config.weather.wind||0,gust=1+.35*Math.sin(env.time*.6)*Math.sin(env.time*.21);
  for(const drop of env.drops){
    drop.y+=drop.speed*dt;
    drop.x+=drop.speed*wind*gust*dt;
    if(drop.y>drop.ground){
      // Recycle the drop and leave a short splash ring exactly where it landed
      if(env.splashes.length<90&&env.rain>.05)env.splashes.push({x:drop.x,y:drop.ground,life:.3,maxLife:.3,near:drop.near});
      drop.y=-drop.len;drop.x=Math.random()*env.width;drop.ground=150+Math.random()*(env.height-150);
    }
    if(drop.x<-20)drop.x=env.width+20;else if(drop.x>env.width+20)drop.x=-20;
  }
  for(const splash of env.splashes)splash.life-=dt;
  env.splashes=env.splashes.filter(splash=>splash.life>0);
}

// Soft dirt/wear blotches over the tiled ground. Radial gradients keep the edges invisible, so the yard
// gains large-scale variation and the eye stops locking onto the tile grid.
function drawGroundMottling(ctx,env){
  ctx.save();
  for(const patch of env.mottles){
    const glow=ctx.createRadialGradient(patch.x,patch.y,0,patch.x,patch.y,Math.max(patch.rx,patch.ry));
    const tone=patch.dark?'26,26,20':'118,110,92';
    glow.addColorStop(0,`rgba(${tone},${patch.alpha})`);glow.addColorStop(1,`rgba(${tone},0)`);
    ctx.fillStyle=glow;
    ctx.save();ctx.translate(patch.x,patch.y);ctx.scale(1,patch.ry/patch.rx);
    ctx.beginPath();ctx.arc(0,0,patch.rx,0,Math.PI*2);ctx.fill();ctx.restore();
  }
  ctx.restore();
}

// Ground, streets, puddles and debris. Drawn before every entity.
export function drawEnvironmentGround(ctx,env){
  const groundTexture=texture(env,'ground');
  if(groundTexture){
    // 13% scale keeps the tile around 130px: large enough to hide the seam, small enough that
    // gravel and cracks read as ground detail instead of giant slabs behind the characters
    ctx.fillStyle=surfacePattern(ctx,groundTexture,.13);ctx.fillRect(0,0,env.width,env.height);
    drawGroundMottling(ctx,env);
  }
  else{
    // Dirty-paper base is kept light enough to survive the night grade that is multiplied over it later
    const soil=ctx.createLinearGradient(0,0,0,env.height);
    soil.addColorStop(0,'#33322a');soil.addColorStop(.45,'#2a2922');soil.addColorStop(1,'#22221c');
    ctx.fillStyle=soil;ctx.fillRect(0,0,env.width,env.height);
    ctx.lineWidth=1;
    for(const s of env.scratches){
      ctx.strokeStyle=s.bright?'#615b4c':'#3c3a30';
      ctx.beginPath();ctx.moveTo(s.x-Math.cos(s.angle)*s.len,s.y-Math.sin(s.angle)*s.len);ctx.lineTo(s.x+Math.cos(s.angle)*s.len,s.y+Math.sin(s.angle)*s.len);ctx.stroke();
    }
  }
  drawNeighbourhood(ctx,env);
  const asphalt=texture(env,'asphalt');
  for(const street of env.config.streets){
    if(asphalt){
      // The roadway is only 88px tall, so the tile is scaled to roughly one road width per repeat
      ctx.save();ctx.fillStyle=surfacePattern(ctx,asphalt,.11);ctx.fillRect(street.x,street.y,street.width,street.height);ctx.restore();
      // These two kerbs and the centre dash below ARE the horizontal stripes lying across the frame.
      // The road spans the full 960px width, so anything stroked along it is a line from edge to edge;
      // at rgba(120,114,98,.75) over a 3px width that is a bright hard rule, and three of them at
      // y=96 / y=140 / y=184 read as banding rather than as a street. A real kerb is a shadow line, not
      // a highlight: it is now dark and thin, so it separates asphalt from mud without drawing itself.
      ctx.strokeStyle='rgba(22,20,16,.34)';ctx.lineWidth=1.5;
      ctx.beginPath();ctx.moveTo(street.x,street.y);ctx.lineTo(street.x+street.width,street.y);ctx.moveTo(street.x,street.y+street.height);ctx.lineTo(street.x+street.width,street.y+street.height);ctx.stroke();
    }
    else{
      ctx.fillStyle='#3a3931';ctx.fillRect(street.x,street.y,street.width,street.height);
      // Broken kerbs on both sides of the roadway
      ctx.strokeStyle='#6b6659';ctx.lineWidth=3;
      ctx.beginPath();ctx.moveTo(street.x,street.y);ctx.lineTo(street.x+street.width,street.y);ctx.moveTo(street.x,street.y+street.height);ctx.lineTo(street.x+street.width,street.y+street.height);ctx.stroke();
    }
    // The centre line is the third stripe. Kept, because a road with no marking stops reading as a
    // road at all, but dropped to a worn painted line: half the width, a third of the contrast, and
    // shorter dashes with wider gaps so the eye reads intermittent paint instead of a continuous rule.
    ctx.strokeStyle='rgba(150,142,120,.26)';ctx.lineWidth=1.5;ctx.setLineDash([14,26]);
    ctx.beginPath();ctx.moveTo(street.x,street.y+street.height/2);ctx.lineTo(street.x+street.width,street.y+street.height/2);ctx.stroke();ctx.setLineDash([]);
  }
  // Wet asphalt only reads as wet while it is actually raining
  if(env.rain>0){
    ctx.save();ctx.globalAlpha=.26*(1-env.dawn*.5);ctx.fillStyle='#6f7a88';
    for(const puddle of env.puddles){ctx.beginPath();ctx.ellipse(puddle.x,puddle.y,puddle.rx,puddle.ry,0,0,Math.PI*2);ctx.fill()}
    ctx.restore();
  }
  const debrisTexture=texture(env,'debris');
  for(const item of env.debris){
    if(debrisTexture){drawTexture(ctx,debrisTexture,item.x,item.y,item.w,item.h);continue}
    ctx.fillStyle='#2a2b24';ctx.fillRect(item.x,item.y,item.w,item.h);
    ctx.strokeStyle='#77705f';ctx.lineWidth=2;ctx.strokeRect(item.x,item.y,item.w,item.h);
    ctx.beginPath();ctx.moveTo(item.x,item.y);ctx.lineTo(item.x+item.w,item.y+item.h);ctx.moveTo(item.x+item.w,item.y);ctx.lineTo(item.x,item.y+item.h);ctx.stroke();
  }
}

// Background block: neighbouring facades around the yard and the broken fence.
// Texture slots: house_left / house_right / house_top / house_bottom / fence.
function drawNeighbourhood(ctx,env){
  for(const facade of env.facades){
    const facadeTexture=texture(env,facade.key);
    if(facadeTexture){drawTexture(ctx,facadeTexture,facade.x,facade.y,facade.w,facade.h);continue}
    ctx.fillStyle='#232419';ctx.fillRect(facade.x,facade.y,facade.w,facade.h);
    ctx.strokeStyle='#5d5749';ctx.lineWidth=3;ctx.strokeRect(facade.x,facade.y,facade.w,facade.h);
    // Dead windows: a couple still hold a faint reflection, the rest are boarded
    const columns=Math.max(3,Math.round(facade.w/78));
    for(let i=0;i<columns;i++){
      const wx=facade.x+16+i*(facade.w-30)/columns,wy=facade.y+facade.h*.42,ww=(facade.w-30)/columns-14,wh=facade.h*.34;
      ctx.fillStyle=i%3===1?'#463f2c':'#16170f';ctx.fillRect(wx,wy,ww,wh);
      ctx.strokeStyle='#6c6455';ctx.lineWidth=2;ctx.strokeRect(wx,wy,ww,wh);
      if(i%2===0){ctx.beginPath();ctx.moveTo(wx,wy+wh);ctx.lineTo(wx+ww,wy);ctx.stroke()}
    }
  }
  const fenceTexture=texture(env,'fence');
  for(const fence of env.fences){
    // Repeated at its natural 3:1 proportion instead of being stretched into one long smear
    if(fenceTexture){tileTextureRow(ctx,fenceTexture,fence.x,fence.y-46,fence.w,52);continue}
    ctx.strokeStyle='#5a5344';ctx.lineWidth=3;ctx.lineCap='round';
    for(let x=fence.x+8;x<fence.x+fence.w;x+=26){
      const lean=((x/26)%3-1)*3,height=17+((x/13)%3)*5;
      ctx.beginPath();ctx.moveTo(x,fence.y);ctx.lineTo(x+lean,fence.y-height);ctx.stroke();
    }
    ctx.beginPath();ctx.moveTo(fence.x+4,fence.y-11);ctx.lineTo(fence.x+fence.w-6,fence.y-13);ctx.stroke();
    ctx.lineCap='butt';
  }
}

// Wooden barricades planted along the shelter's real footprint. The old version drew two dashed rings
// around a circular house, which is exactly what made the defence read as an abstract diagram; the
// stakes now follow the four walls the zombies actually walk up to.
export function drawShelterBarricades(ctx,env,shelter,defenses={}){
  // The stakes must stand clear of the facade: at a 9px margin they were drawn straight onto the wall
  // layer and swallowed by it, so the defence line was invisible.
  const gap=defenses.reinforced?26:38,margin=defenses.reinforced?30:24;
  const left=shelter.x-margin,right=shelter.x+shelter.width+margin;
  const top=shelter.y-margin,bottom=shelter.y+shelter.height+margin;
  ctx.save();
  // Walk each side and drop a stake every `gap` pixels, angled along that wall
  for(let x=left;x<=right;x+=gap){
    drawBarricadeStake(ctx,env,x,top,0,defenses.reinforced);
    drawBarricadeStake(ctx,env,x,bottom,0,defenses.reinforced);
  }
  for(let y=top+gap;y<bottom;y+=gap){
    drawBarricadeStake(ctx,env,left,y,Math.PI/2,defenses.reinforced);
    drawBarricadeStake(ctx,env,right,y,Math.PI/2,defenses.reinforced);
  }
  ctx.restore();
}

// One scavenged stake. Reinforcing makes them bigger and denser rather than adding a second ring.
function drawBarricadeStake(ctx,env,x,y,angle,reinforced){
  const barricadeTexture=texture(env,'barricade');
  ctx.save();ctx.translate(x,y);ctx.rotate(angle);
  if(barricadeTexture){const w=reinforced?30:24,h=reinforced?18:14;drawTexture(ctx,barricadeTexture,-w/2,-h/2,w,h)}
  else{
    ctx.fillStyle=reinforced?'#6d6046':'#544a38';ctx.strokeStyle='#241f18';ctx.lineWidth=2;
    const w=reinforced?24:18,h=reinforced?9:7;
    ctx.fillRect(-w/2,-h/2,w,h);ctx.strokeRect(-w/2,-h/2,w,h);
    // Crossed board over each stake so the barricade reads as scavenged, not manufactured
    ctx.strokeStyle='#8b7d5e';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-w/2,h/2);ctx.lineTo(w/2,-h/2);ctx.stroke();
  }
  ctx.restore();
}

// Player shelter artwork. Returns false when the texture is absent so the caller keeps its procedural cutaway.
export function drawShelterSprite(ctx,env,x,y,width,height){
  const shelterTexture=texture(env,'shelter');
  if(!shelterTexture)return false;
  // 'cover' keeps the footprint exactly on the gameplay rectangle; the artwork already has clean margins
  drawTexture(ctx,shelterTexture,x,y,width,height,'cover');
  return true;
}

// Roof artwork. Same contract as drawShelterSprite: false means "no PNG, keep your procedural fallback".
// 'cover' rather than 'contain' on purpose — the roof is an OCCLUDER, and a contained draw would leave
// bare strips of lit interior showing along two edges of the footprint while the survivor is outside.
export function drawRoofSprite(ctx,env,x,y,width,height){
  const roofTexture=texture(env,'roof');
  if(!roofTexture)return false;
  drawTexture(ctx,roofTexture,x,y,width,height,'cover');
  return true;
}

// Destructible prop artwork, one slot per kind+state. Returns false when the PNG is absent, so the
// prop keeps its procedural silhouette — the same contract every other slot in this file uses.
//
// The caller has already translated and rotated into prop space, so this draws centred on the origin.
// It deliberately goes through drawTexture(): the generated cutouts come out of rembg with wide
// transparent margins, and drawing the raw image would shrink every prop inside its own empty border
// and knock it off its collision box. measureBounds() trimmed that margin at load time; this is where
// the measurement is spent.
export function drawDestructibleSprite(ctx,env,kind,state,width,height){
  const entry=texture(env,`${kind}_${state}`);
  if(!entry)return false;
  drawTexture(ctx,entry,-width/2,-height/2,width,height,'contain');
  return true;
}

// Which prop states are photographic and which are still procedural — for the IDE asset panel.
export const destructibleTextureStatus=env=>Object.keys(TEXTURE_FILES)
  .filter(key=>key in DESTRUCTIBLE_FILES)
  .map(key=>({key,file:TEXTURE_FILES[key],ready:!!texture(env,key)}));

// Gutter trap body. Returns false when the texture is absent so the caller keeps its procedural jaw ring.
export function drawTrapSprite(ctx,env,x,y,size){
  const trapTexture=texture(env,'trap');
  if(!trapTexture)return false;
  drawTexture(ctx,trapTexture,x-size/2,y-size/2,size,size);
  return true;
}

// Per-lamp flicker: independent phases keep the light nervous instead of uniform
const lampFlicker=(env,index)=>.88+.12*Math.sin(env.time*(5.5+index*1.7)+index*2.1)*Math.sin(env.time*2.3+index);

// Lamp posts belong to the scenery, not the light layer: they are drawn with the ground so
// characters walking past a pole correctly pass in front of it.
export function drawLampPosts(ctx,env){
  const lampTexture=texture(env,'lamp'),lit=1-env.dawn;
  for(const [index,lamp] of env.config.lamps.entries()){
    // Post base sits on the lamp's ground point; the artwork keeps its natural tall proportion
    if(lampTexture){const h=104,w=h*lampTexture.bounds.width/lampTexture.bounds.height;drawTexture(ctx,lampTexture,lamp.x-w*.42,lamp.y+12-h,w,h);continue}
    const flicker=lampFlicker(env,index);
    ctx.save();
    // Pole shadow on the wet ground
    ctx.strokeStyle='rgba(10,11,9,.45)';ctx.lineWidth=6;ctx.lineCap='round';
    ctx.beginPath();ctx.moveTo(lamp.x,lamp.y+10);ctx.lineTo(lamp.x+22,lamp.y+30);ctx.stroke();
    ctx.strokeStyle='#6d6757';ctx.lineWidth=4;
    ctx.beginPath();ctx.moveTo(lamp.x,lamp.y+10);ctx.lineTo(lamp.x,lamp.y-52);ctx.lineTo(lamp.x+14,lamp.y-58);ctx.stroke();
    ctx.fillStyle=lit>.02?`rgba(244,216,152,${(.6+.4*flicker*lit).toFixed(3)})`:'#46423a';
    ctx.beginPath();ctx.ellipse(lamp.x+17,lamp.y-56,7,4,0,0,Math.PI*2);ctx.fill();
    ctx.strokeStyle='#2a271f';ctx.lineWidth=2;ctx.stroke();
    ctx.restore();
  }
}

// Night → dawn gradation, as keyed stops rather than one linear blend between two colours.
// A single lerp from cold grey-blue to warm amber was the whole problem: the midpoint of that blend is
// a desaturated mud, so the interesting half of the transition — the moment the sky is still blue but
// the horizon has already turned — simply did not exist. Real dawn is not monotonic either: the sky
// goes DARKEST and coldest just before it breaks (the "false dawn"), then violet, then amber.
// Each stop carries its own tint colour, its own multiply strength, a horizon colour and a horizon
// weight, so the frame changes hue, contrast and light direction independently as the night ends.
// Alphas below were roughly HALVED from an earlier pass (.40/.44/.36/.26/.14/.06). That earlier tint
// was itself a full 'multiply' fill, stacked under drawGrade's own three passes — one multiply strong
// enough to read as "the tint" on its own, feeding into three more, is exactly how everything converged
// on one dark grey-blue regardless of what was underneath. This layer's job is now ONLY the cold cast at
// night and the colour handoff through dawn; drawGrade owns contrast and the vignette owns the rim.
// The night tint is not a colour wash on top of a day scene — it is the pass that DECIDES the scene's
// base exposure. That is the role it was not playing. Measured against the reference the frame sat at
// avgL .191 where the reference is .072, and disabling every single light pass moved it by less than
// .01: none of them were responsible. This tint was, by omission. At alpha .22 over a light grey-blue
// it multiplied the frame by roughly .88 — a 12% darkening, which is dusk, not night, and it left the
// warm ground textures reading at full strength (warmBias .197 against the reference's .054).
//
// Two changes, and they are the same change: the night stops are far DARKER and genuinely BLUE. A dark
// blue multiply sets the exposure and crushes red in the shadows in one pass, which is what stops the
// warm mud textures from tinting the entire frame orange. Everything warm in the picture now has to
// come from an actual light source through the bounded buffer — which is the correct order, and the
// only one where adding a lamp makes the yard read as lit instead of making the whole frame sepia.
// FLATTENED. Every previous version of this curve was an attempt to paint a mood on top of finished
// artwork, and each one failed the same way: a multiply fill over the whole frame cannot add anything,
// it can only take light away, so tuning it only ever chose between "washed out" and "black". The
// textures are photographic and already carry their own light, their own shadows and their own colour.
// The correct amount of tint on top of them is approximately none — the scene is lit by the assets.
// Alphas are near-zero at night and zero by dawn, and the colour is neutral grey rather than blue, so
// the tint can no longer push the frame towards any hue of its own. `glow` is off entirely: the horizon
// gradient was an invented light source painted over the sky, and it is exactly the kind of pass that
// makes everything read as one filtered photograph regardless of what the assets look like.
const DAWN_STOPS=[
  // at | tint rgb          | tint alpha | horizon rgb        | horizon weight
  {at:0,   tint:[226,226,226],alpha:.06,horizon:[70,84,120],  glow:.00},
  {at:.46, tint:[236,236,236],alpha:.04,horizon:[132,104,150],glow:.00},
  {at:1,   tint:[255,255,255],alpha:.00,horizon:[244,206,140],glow:.00}
];
const mix=(a,b,k)=>a+(b-a)*k;
// Linear interpolation between the two stops the current dawn value falls between
function dawnGrade(dawn){
  let lower=DAWN_STOPS[0],upper=DAWN_STOPS[DAWN_STOPS.length-1];
  for(let i=0;i<DAWN_STOPS.length-1;i++){
    if(dawn>=DAWN_STOPS[i].at&&dawn<=DAWN_STOPS[i+1].at){lower=DAWN_STOPS[i];upper=DAWN_STOPS[i+1];break}
  }
  const span=upper.at-lower.at,k=span<=0?0:(dawn-lower.at)/span;
  return {
    tint:lower.tint.map((c,i)=>Math.round(mix(c,upper.tint[i],k))),
    alpha:mix(lower.alpha,upper.alpha,k),
    horizon:lower.horizon.map((c,i)=>Math.round(mix(c,upper.horizon[i],k))),
    glow:mix(lower.glow,upper.glow,k)
  };
}
// Exposed so the interior veils and the IDE view can grade themselves from the same curve
export const environmentGrade=env=>dawnGrade(env.dawn);

// Night tint, streetlamp pools and rain. Drawn last, over every entity.
export function drawEnvironmentOverlay(ctx,env){
  const dawn=env.dawn,grade=dawnGrade(dawn);
  // Base tint. Kept deliberately light: the scene must stay readable at gameplay scale.
  ctx.save();
  ctx.globalCompositeOperation='multiply';
  const [tr,tg,tb]=grade.tint;
  ctx.fillStyle=`rgba(${tr},${tg},${tb},${grade.alpha.toFixed(3)})`;ctx.fillRect(0,0,env.width,env.height);
  ctx.restore();
  if(grade.glow>.002){
    // Horizon glow rising from the top of the yard. Its colour comes from the same curve, so the light
    // is violet while the sky is violet and amber only once the sky is amber — a fixed warm gradient
    // faded in over a blue night was the other half of why the midpoint read as mud.
    const [hr,hg,hb]=grade.horizon;
    ctx.save();ctx.globalCompositeOperation='lighter';
    ctx.globalAlpha=grade.glow;
    const sky=ctx.createLinearGradient(0,0,0,env.height*.6);
    sky.addColorStop(0,`rgba(${hr},${hg},${hb},.95)`);
    sky.addColorStop(.5,`rgba(${Math.round(hr*.72)},${Math.round(hg*.76)},${Math.round(hb*.82)},.35)`);
    sky.addColorStop(1,`rgba(${hr},${hg},${hb},0)`);
    ctx.fillStyle=sky;ctx.fillRect(0,0,env.width,env.height*.6);
    // Ambient lift, weakest at the false dawn and strongest once the sun is actually up
    ctx.globalAlpha=Math.max(0,dawn-.4)*.2;ctx.fillStyle='rgba(168,176,188,1)';ctx.fillRect(0,0,env.width,env.height);
    ctx.restore();
  }
  drawLampLight(ctx,env);
  drawRain(ctx,env);
}

// Strengthened from .46/.2 to .72/.34: with the base night tint above now roughly half as strong, the
// lamps are what has to carry "this is a LIT street" on its own. A pool that only nudges the multiply
// tint reads as a dim smear; a pool that visibly overpowers it near the bulb reads as a light source.
// DISABLED. These were the bright blobs sitting on an otherwise dark frame — three additive radial
// pools at .72 alpha, which is what "точки света на чёрном" literally was. Once the tint above stopped
// darkening the yard there is nothing left for a lamp pool to cut through: it can only bleach the
// ground texture it sits on. The lamp POSTS are still drawn as scenery in drawLampPosts(); what is gone
// is the invented glow around them. Kept as a function rather than deleted so the call site and the
// GFX switchboard stay intact, and so turning yard lighting back on later is one edit in one place.
function drawLampLight(ctx,env){
  return;
}

function drawRain(ctx,env){
  if(env.rain<=.02)return;
  const wind=env.config.weather.wind||0,intensity=env.rain/(env.config.weather.rain||1);
  ctx.save();ctx.lineCap='round';
  // Far curtain: thin, low contrast, reads as depth
  ctx.strokeStyle=`rgba(150,166,182,${(.16*intensity).toFixed(3)})`;ctx.lineWidth=1;
  ctx.beginPath();
  for(const drop of env.drops){if(drop.near)continue;ctx.moveTo(drop.x,drop.y);ctx.lineTo(drop.x+drop.len*wind,drop.y+drop.len)}
  ctx.stroke();
  // Near streaks: brighter and thicker, they sell the downpour
  ctx.strokeStyle=`rgba(206,220,232,${(.34*intensity).toFixed(3)})`;ctx.lineWidth=1.8;
  ctx.beginPath();
  for(const drop of env.drops){if(!drop.near)continue;ctx.moveTo(drop.x,drop.y);ctx.lineTo(drop.x+drop.len*wind,drop.y+drop.len)}
  ctx.stroke();
  // Impact rings expand and fade where each drop actually hit the ground
  ctx.lineWidth=1.4;
  for(const splash of env.splashes){
    // Clamped: Canvas throws IndexSizeError on a negative radius, which kills the whole render loop
    const age=Math.max(0,Math.min(1,1-splash.life/splash.maxLife));
    ctx.strokeStyle=`rgba(198,214,228,${((1-age)*(splash.near?.42:.24)*intensity).toFixed(3)})`;
    ctx.beginPath();ctx.ellipse(splash.x,splash.y,3+age*(splash.near?9:6),1.2+age*(splash.near?3.4:2.2),0,0,Math.PI*2);ctx.stroke();
  }
  ctx.restore();
}