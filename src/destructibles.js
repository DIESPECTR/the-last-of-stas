// Destructible yard props.
//
// A siege that leaves the scenery untouched reads as a fight happening on top of a photograph. Every
// prop here has three states — intact, damaged, ruined — and it changes state because something in the
// game actually hit it: a stray projectile, a backfire, a body clawing its way through, or a turret
// wreck going off. State is a discrete step rather than a continuous bar because the whole point is
// that the player can read the history of the night off the yard at a glance.
//
// Each state has a texture slot. When the photographic asset for a state is missing, the prop draws
// its procedural version instead, so nothing can ever blank the scene — the same contract as the
// environment layer. That is deliberate: it means the art can land in any order.

const STATES=['intact','damaged','ruined'];

// Prop archetypes. `hp` is per state step: a prop with hp 40 takes 40 damage to become damaged and
// another 40 to become ruined, so heavy weapons visibly wreck the yard faster than a nail thrower.
export const propKinds={
  car:{id:'car',name:'BURNT CAR',hp:70,width:96,height:46,cover:true},
  barrel:{id:'barrel',name:'OIL BARREL',hp:26,width:30,height:38,cover:true,volatile:true},
  crate:{id:'crate',name:'CRATE STACK',hp:20,width:38,height:34,cover:true,salvage:{metal_scrap:1}},
  fence:{id:'fence',name:'FENCE SECTION',hp:16,width:74,height:20,cover:false},
  lamp:{id:'lamp',name:'STREETLAMP',hp:34,width:18,height:64,cover:false,light:true}
};

// Texture slots follow one naming rule so the asset pipeline needs no lookup table:
//   assets/environment/destructibles/<kind>_<state>.png
export function textureKey(kind,state){return `${kind}_${state}`}
export const textureSlots=Object.keys(propKinds).flatMap(kind=>STATES.map(state=>textureKey(kind,state)));

export function createProp(kind,x,y,rotation=0){
  const spec=propKinds[kind];
  if(!spec)return null;
  return {
    kind,x,y,rotation,
    state:'intact',stateIndex:0,
    hp:spec.hp,maxHp:spec.hp,
    hitFlash:0,
    // Per-prop seed so the procedural damage marks are stable frame to frame instead of crawling
    seed:Math.random()*1000,
    // Set once when a prop reaches `ruined`, so the collapse only plays out a single time
    collapse:0,
    debris:[]
  };
}

export function createDestructibles(scenario={},shelter=null){
  const props=[];
  const list=scenario.props;
  if(Array.isArray(list)&&list.length){
    // Scenario-authored layout wins whenever the data provides one
    for(const entry of list){
      const prop=createProp(entry.kind,entry.x,entry.y,entry.rotation||0);
      if(prop)props.push(prop);
    }
  }else if(shelter){
    // Otherwise place a default set around the building. Positions are derived from the shelter so the
    // props frame the approaches instead of sitting at hardcoded pixels that drift when the house moves.
    const {x,y,width,height}=shelter;
    props.push(createProp('car',x-108,y+height*.28,-.12));
    props.push(createProp('barrel',x+width+44,y+height*.18));
    props.push(createProp('barrel',x+width+66,y+height*.34));
    props.push(createProp('crate',x-72,y+height+52));
    props.push(createProp('crate',x-44,y+height+66,.3));
    props.push(createProp('crate',x+width+52,y-38,-.2));
    props.push(createProp('fence',x+width*.24,y-72,.04));
    props.push(createProp('fence',x+width*.72,y-72,-.03));
    props.push(createProp('crate',x-36,y-168));
    props.push(createProp('barrel',x+width+28,y-150));
    props.push(createProp('fence',x+width*.22,y-210,.05));
    props.push(createProp('fence',x+width*.68,y-210,-.04));
    props.push(createProp('car',x+width+70,y+height+148,.18));
    props.push(createProp('crate',x-48,y+height+168));
    props.push(createProp('fence',x+width*.28,y+height+196,.03));
    props.push(createProp('fence',x+width*.74,y+height+196,-.02));
  }
  return {props:props.filter(Boolean),effects:[]};
}

export function propAt(destructibles,x,y,pad=0){
  for(const prop of destructibles.props){
    if(prop.state==='ruined')continue;
    const spec=propKinds[prop.kind];
    if(Math.abs(x-prop.x)<spec.width/2+pad&&Math.abs(y-prop.y)<spec.height/2+pad)return prop;
  }
  return null;
}

// Damage steps the state instead of scaling a bar. Returns what happened so the caller can spawn the
// noise, the salvage and the fire that belong to the game rather than to this module.
export function damageProp(destructibles,prop,amount){
  if(prop.state==='ruined')return null;
  prop.hp-=amount;prop.hitFlash=.13;
  if(prop.hp>0)return null;
  prop.stateIndex=Math.min(2,prop.stateIndex+1);
  prop.state=STATES[prop.stateIndex];
  const spec=propKinds[prop.kind];
  prop.hp=spec.hp;
  // Debris is thrown at every step, not only on destruction: a damaged prop that produced nothing
  // looked like the hit had been swallowed.
  const count=prop.state==='ruined'?14:7;
  for(let i=0;i<count;i++){
    const angle=Math.random()*Math.PI*2,speed=30+Math.random()*130;
    prop.debris.push({x:prop.x,y:prop.y,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,
      size:1.4+Math.random()*3,life:.7+Math.random()*.8,maxLife:1.5,spin:(Math.random()-.5)*9,rot:Math.random()*6.28});
  }
  if(prop.state==='ruined')prop.collapse=.55;
  return {state:prop.state,volatile:spec.volatile===true,salvage:spec.salvage||null,kind:prop.kind,x:prop.x,y:prop.y};
}

export function updateDestructibles(destructibles,dt){
  for(const prop of destructibles.props){
    prop.hitFlash=Math.max(0,prop.hitFlash-dt);
    prop.collapse=Math.max(0,prop.collapse-dt);
    for(const piece of prop.debris){
      piece.x+=piece.vx*dt;piece.y+=piece.vy*dt;
      piece.vx*=1-3.2*dt;piece.vy*=1-3.2*dt;
      piece.rot+=piece.spin*dt;piece.life-=dt;
    }
    prop.debris=prop.debris.filter(piece=>piece.life>0);
  }
}

// Props block projectiles while they are still standing. A ruined prop is rubble on the ground, so it
// stops blocking — which is the tactical consequence of losing your cover.
export function blocksShot(destructibles,x,y){
  const prop=propAt(destructibles,x,y);
  if(!prop)return null;
  return propKinds[prop.kind].cover?prop:null;
}

// --- Rendering ----------------------------------------------------------------------------------

// `drawSprite(ctx,kind,state,width,height)` is supplied by the environment layer and returns true when
// it painted the photographic cutout for that exact kind+state. Returning false leaves the procedural
// silhouette in place, so the art can land one file at a time without ever blanking a prop.
//
// The callback is used instead of handing this module a texture map because the trimmed opaque bounds of
// each PNG live in the environment layer. Drawing the raw image here would place every prop inside its
// own transparent margin and desync the artwork from the collision box that `propAt` tests against.
export function drawDestructibles(ctx,destructibles,drawSprite=null){
  for(const prop of destructibles.props){
    const spec=propKinds[prop.kind];
    ctx.save();
    ctx.translate(prop.x,prop.y);
    // A collapsing prop drops and tilts for half a second: the movement is what sells the destruction
    if(prop.collapse>0){
      const k=prop.collapse/.55;
      ctx.translate(0,(1-k)*3);
      ctx.rotate(prop.rotation+Math.sin(k*9)*.05*k);
    }else ctx.rotate(prop.rotation);
    // Contact shadow so the prop is planted rather than pasted
    ctx.fillStyle='rgba(8,9,7,.38)';
    ctx.beginPath();ctx.ellipse(2,spec.height*.42,spec.width*.5,spec.height*.2,0,0,Math.PI*2);ctx.fill();
    // A ruined prop is rubble: it spreads out a little. The scale is UNIFORM on purpose.
    // An anisotropic 1.12 × .72 footprint was tried first and was measurably wrong: the generated
    // cutouts keep roughly the framing of their intact state (measured aspect ratios 0.76 vs 0.81 for
    // the barrel, 0.99 vs 1.03 for the crate), and `drawTexture` fits them with 'contain'. Squashing
    // the box therefore fitted the artwork by its width and drew a ruined barrel 20.8px wide against
    // an intact one at 30px — the rubble came out SMALLER than the thing that produced it.
    const spread=prop.state==='ruined'?1.06:1;
    if(!drawSprite?.(ctx,prop.kind,prop.state,spec.width*spread,spec.height*spread))drawPropShape(ctx,prop,spec);
    if(prop.hitFlash>0){
      ctx.globalCompositeOperation='lighter';
      ctx.fillStyle=`rgba(214,164,110,${(prop.hitFlash/.13*.35).toFixed(2)})`;
      ctx.fillRect(-spec.width/2,-spec.height/2,spec.width,spec.height);
      ctx.globalCompositeOperation='source-over';
    }
    ctx.restore();
    // Debris is in world space, not prop space, so it does not rotate with the collapse
    ctx.save();
    for(const piece of prop.debris){
      ctx.globalAlpha=Math.min(.85,piece.life/piece.maxLife);
      ctx.fillStyle='#3a352c';
      ctx.save();ctx.translate(piece.x,piece.y);ctx.rotate(piece.rot);
      ctx.fillRect(-piece.size/2,-piece.size/2,piece.size,piece.size*.7);
      ctx.restore();
    }
    ctx.restore();
  }
}

// Procedural fallback per kind and state. Damage is drawn as a step change in the silhouette, not as a
// tint: a darker version of the same shape does not read as damage at gameplay scale.
function drawPropShape(ctx,prop,spec){
  const w=spec.width,h=spec.height,state=prop.state;
  const rnd=(i)=>{const v=Math.sin(prop.seed+i*12.9898)*43758.5453;return v-Math.floor(v)};
  ctx.lineJoin='round';ctx.lineCap='round';
  if(prop.kind==='car'){
    if(state==='ruined'){
      // Burnt-out shell: collapsed roof, no glass, sitting on the rims
      ctx.fillStyle='#1c1a16';ctx.fillRect(-w/2,-h*.18,w,h*.5);
      ctx.strokeStyle='#332f27';ctx.lineWidth=2;
      for(let i=0;i<5;i++){const x=-w/2+w*(i+.5)/5;ctx.beginPath();ctx.moveTo(x,-h*.18);ctx.lineTo(x+rnd(i)*8-4,h*.3);ctx.stroke()}
      ctx.fillStyle='#141310';ctx.beginPath();ctx.ellipse(-w*.3,h*.3,7,4,0,0,Math.PI*2);ctx.ellipse(w*.3,h*.3,7,4,0,0,Math.PI*2);ctx.fill();
    }else{
      ctx.fillStyle=state==='damaged'?'#2b2a24':'#35342c';
      ctx.beginPath();
      ctx.moveTo(-w/2,h*.2);ctx.lineTo(-w*.38,-h*.1);ctx.lineTo(-w*.16,-h*.42);
      ctx.lineTo(w*.16,-h*.42);ctx.lineTo(w*.38,-h*.1);ctx.lineTo(w/2,h*.2);ctx.closePath();ctx.fill();
      ctx.fillStyle='#4c4a3f';ctx.fillRect(-w*.5,h*.08,w,h*.16);
      // Windows: intact reads as pale glass, damaged as shattered gaps
      ctx.fillStyle=state==='damaged'?'#17160f':'#5b6068';
      if(state==='damaged'){for(let i=0;i<3;i++)ctx.fillRect(-w*.28+i*w*.2,-h*.34,w*.13,h*.2)}
      else ctx.fillRect(-w*.3,-h*.36,w*.6,h*.22);
      ctx.fillStyle='#131210';ctx.beginPath();ctx.ellipse(-w*.3,h*.28,8,5,0,0,Math.PI*2);ctx.ellipse(w*.3,h*.28,8,5,0,0,Math.PI*2);ctx.fill();
      if(state==='damaged'){ctx.strokeStyle='#20201a';ctx.lineWidth=2;for(let i=0;i<4;i++){ctx.beginPath();ctx.moveTo(-w*.3+rnd(i)*w*.6,-h*.2);ctx.lineTo(-w*.3+rnd(i+9)*w*.6,h*.16);ctx.stroke()}}
    }
  }else if(prop.kind==='barrel'){
    if(state==='ruined'){
      // Split open and lying flat, with a spill under it
      ctx.fillStyle='rgba(20,17,12,.55)';ctx.beginPath();ctx.ellipse(0,h*.24,w*.9,h*.2,0,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='#241f19';ctx.fillRect(-w*.62,-h*.06,w*1.24,h*.28);
      ctx.strokeStyle='#3d372c';ctx.lineWidth=2;ctx.strokeRect(-w*.62,-h*.06,w*1.24,h*.28);
    }else{
      ctx.fillStyle=state==='damaged'?'#3a3226':'#45412f';
      ctx.fillRect(-w/2,-h/2,w,h);
      ctx.strokeStyle='#6a6247';ctx.lineWidth=2;
      ctx.beginPath();ctx.moveTo(-w/2,-h*.22);ctx.lineTo(w/2,-h*.22);ctx.moveTo(-w/2,h*.22);ctx.lineTo(w/2,h*.22);ctx.stroke();
      ctx.strokeStyle='#25231c';ctx.strokeRect(-w/2,-h/2,w,h);
      if(state==='damaged'){
        // A punctured barrel leaks, and the leak is the tell that it is about to go
        ctx.fillStyle='#191510';ctx.beginPath();ctx.arc(w*.16,-h*.1,3.2,0,Math.PI*2);ctx.fill();
        ctx.strokeStyle='rgba(26,22,15,.8)';ctx.lineWidth=2;
        ctx.beginPath();ctx.moveTo(w*.16,-h*.06);ctx.lineTo(w*.2,h*.5);ctx.stroke();
      }
    }
  }else if(prop.kind==='crate'){
    if(state==='ruined'){
      ctx.strokeStyle='#4a422f';ctx.lineWidth=3;
      for(let i=0;i<5;i++){const a=rnd(i)*3.14,l=w*.36;ctx.beginPath();ctx.moveTo(-Math.cos(a)*l,h*.2+rnd(i+3)*6-3);ctx.lineTo(Math.cos(a)*l,h*.2+rnd(i+7)*6-3);ctx.stroke()}
    }else{
      ctx.fillStyle=state==='damaged'?'#443a26':'#4f4530';
      ctx.fillRect(-w/2,-h/2,w,h);
      ctx.strokeStyle='#2a2419';ctx.lineWidth=2;ctx.strokeRect(-w/2,-h/2,w,h);
      ctx.beginPath();ctx.moveTo(-w/2,-h/2);ctx.lineTo(w/2,h/2);ctx.moveTo(w/2,-h/2);ctx.lineTo(-w/2,h/2);ctx.stroke();
      if(state==='damaged'){ctx.fillStyle='#1b1710';ctx.beginPath();ctx.moveTo(w*.1,-h/2);ctx.lineTo(w/2,-h*.1);ctx.lineTo(w*.2,h*.05);ctx.closePath();ctx.fill()}
    }
  }else if(prop.kind==='fence'){
    const planks=6;
    for(let i=0;i<planks;i++){
      const x=-w/2+w*(i+.5)/planks;
      // Damaged loses roughly a third of its planks, ruined keeps only the odd stump
      if(state==='damaged'&&rnd(i)<.34)continue;
      if(state==='ruined'&&rnd(i)<.72)continue;
      const lean=state==='intact'?0:(rnd(i+5)-.5)*.5;
      ctx.save();ctx.translate(x,0);ctx.rotate(lean);
      ctx.fillStyle='#4a4231';ctx.fillRect(-3,-h/2,6,state==='ruined'?h*.45:h);
      ctx.strokeStyle='#241f17';ctx.lineWidth=1;ctx.strokeRect(-3,-h/2,6,state==='ruined'?h*.45:h);
      ctx.restore();
    }
    if(state!=='ruined'){ctx.strokeStyle='#3d3527';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(-w/2,-h*.16);ctx.lineTo(w/2,-h*.16);ctx.stroke()}
  }else if(prop.kind==='lamp'){
    if(state==='ruined'){
      // Toppled pole: the light is gone, which the lighting layer reads separately
      ctx.strokeStyle='#3f3a30';ctx.lineWidth=5;
      ctx.beginPath();ctx.moveTo(-w,h*.4);ctx.lineTo(w*2.4,h*.1);ctx.stroke();
      ctx.fillStyle='#1a1814';ctx.beginPath();ctx.arc(w*2.6,h*.1,6,0,Math.PI*2);ctx.fill();
    }else{
      ctx.strokeStyle='#4b4539';ctx.lineWidth=5;
      ctx.beginPath();ctx.moveTo(0,h/2);ctx.lineTo(0,-h/2);ctx.stroke();
      ctx.fillStyle=state==='damaged'?'#2b2620':'#7a6b45';
      ctx.beginPath();ctx.ellipse(0,-h/2,9,5,0,0,Math.PI*2);ctx.fill();
      if(state==='damaged'){ctx.strokeStyle='#241f19';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-6,-h/2);ctx.lineTo(7,-h/2+4);ctx.stroke()}
    }
  }
}
