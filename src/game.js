import {createEnvironment,updateEnvironment,drawEnvironmentGround,drawLampPosts,drawEnvironmentOverlay,drawShelterBarricades,drawTrapSprite,drawShelterSprite,drawRoofSprite,drawDestructibleSprite,drawFenceTextureRow} from './environment.js';
import {createDestructibles,updateDestructibles,damageProp,propAt,blocksShot,drawDestructibles,propKinds} from './destructibles.js';
import {updateTurrets,damageTurret,turretNear,drawTurrets,turretStats,turretRange} from './turrets.js';
import {createAudio,playSound} from './audio.js';
import {createShelter,collideShelter,isInsideShelter,nearestWallPoint,damageShelter,boardWindow,drawShelterInterior,drawShelterWalls,drawShelterRoof,drawExteriorFog,drawWindowLight,drawWindowVeils,totalBoards} from './shelter.js';
import {createInteraction,addTrapToInventory,addTurretToInventory,beginPlacement,cancelPlacement,placeCarried,updateInteraction,triggerTraps,contextAction,canPlaceAt,performContext,drawTraps,drawPlacementGhost,drawPrompt} from './interaction.js';
import {drawCastShadows,drawInteriorLight,drawGrade,beginLightPass,endLightPass,LIGHT_EXPOSURE,INTERIOR_EXPOSURE} from './lighting.js';
import {createBlood,updateBlood,spurt,gush,splatterWall,dripTrail,drawBloodGround,drawBloodSplatter,drawBloodDrops} from './blood.js';
import {createSpeakers,blareSpeakers,stopSpeakers,updateSpeakers,drawSpeakers,drawSpeakerWaves,speakerNear,speakerPosition} from './music.js';
import {armTaunt,updateTaunts,drawTaunts,resetTaunts,TAUNT_LINES} from './taunts.js';
import {RAID_ROSTER,RAID_TABS,RAID_STAGES,raidStatsFor,createHaterRaid,updateHaterRaid,attackRaidSpeaker,shoutRaidTaunt} from './hater-raid.js';
import {wantsReel,isReel,frameRect,applyCanvasSize,worldFromClient,beginReelFrame,setReel,setReelUrl} from './reel.js';
const $=s=>document.querySelector(s),canvas=$('#game'),ctx=canvas.getContext('2d');
// Gameplay lives in a 960×960 WORLD. Desktop crops the middle 960×600; reel shows the full height.
// Backing store is the visible FRAME (960×600 desktop / 337.5×600 reel), not the whole world.
const WORLD={width:960,height:960};
const DPR=Math.min(2,Math.max(1,window.devicePixelRatio||1));
applyCanvasSize(canvas);
// Sample-first audio: WAVs in assets/sfx/, procedural fallback if a file is missing or AudioContext is blocked.
const audio=createAudio(),sfx=name=>playSound(audio,name);
// The speaker stack is created ONCE, outside the session state, unlike every other object in the game.
// `reset()` rebuilds the shelter, the yard and the props from scratch each attempt precisely so nothing
// leaks between nights — but an <audio> element is not session data, it is a decoded media resource. If
// it were rebuilt per session the track would restart from silence on every retry and, worse, each new
// element would need a fresh user gesture to be allowed to play. The playing STATE is reset in `reset()`;
// the element itself survives.
const speakers=createSpeakers(audio);
const load=p=>fetch(p).then(r=>{if(!r.ok)throw new Error(`Failed to load ${p}`);return r.json()});
const [componentData,weaponData,zombieData,scenario,i18n]=await Promise.all([load('../data/components/components.json'),load('../data/weapons/weapons.json'),load('../data/zombies/zombies.json'),load('../data/scenarios/first-night.json'),load('../locales/ru.json')]);
const components=new Map(componentData.components.map(x=>[x.id,x])),weapons=new Map(weaponData.weapons.map(x=>[x.id,x])),zombieTypes=new Map(zombieData.zombies.map(x=>[x.id,x]));
const t=(key,vars={})=>Object.entries(vars).reduce((s,[k,v])=>s.replaceAll(`{${k}}`,v),i18n[key]||key);
// Static markup hydration. index.html ships Russian literals so the page never flashes empty, but the
// locale file is the single source of truth: anything carrying data-i18n is overwritten from it here.
// A key missing from the JSON leaves the literal in place rather than printing the raw key name, which
// is the failure mode that makes a half-translated build look broken instead of merely incomplete.
// Data files stay in English — they are the schema, and renaming ids to Cyrillic would break every
// asset path derived from them. Display names are looked up by id instead, so the JSON keeps its
// stable machine identity while the player only ever sees Russian. A missing key falls back to the
// English display_name rather than showing `weapon_foo`, which is the difference between a build that
// looks incomplete and one that looks broken.
const weaponName=w=>i18n[`weapon_${w.id}`]||w.display_name;
const weaponDesc=w=>i18n[`desc_${w.id}`]||w.description;
const salvageName=key=>i18n[`salvage_${key}`]||key.replaceAll('_',' ');
const roleName=role=>i18n[`role_${role}`]||role.replaceAll('_',' ');
const failureName=kind=>i18n[`failure_${kind}`]||kind.toUpperCase();
function applyStaticStrings(){
  document.title=i18n.game_title||document.title;
  for(const node of document.querySelectorAll('[data-i18n]')){
    const value=i18n[node.dataset.i18n];
    if(typeof value==='string')node.textContent=value;
  }
}
applyStaticStrings();
for(const el of document.querySelectorAll('button,select'))el.tabIndex=-1;
canvas.tabIndex=0;
const keys={},held=new Set(),mouse={x:480,y:590,down:false};
const stick={dx:0,dy:0};
const environment=createEnvironment(WORLD,scenario.environment||{});
// Player hero is Stas. The 2×2 custom sheet is the fallback while animated 4×4 sheets are built.
// Original survivor_sheet_v2.png is left untouched so we can swap back in one line.
const PLAYER_CHARACTER='stas';
const survivorSheet=new Image();survivorSheet.src='../assets/characters/custom/sheet.png';
// Friendly zombie-ninja joins Stas from the first level. The static cutout is the production-safe
// fallback while the dedicated run / idle / spinning-kick sheets are generated from Kling clips.
const ninjaAllySprite=new Image();ninjaAllySprite.src='../assets/allies/ninja_parkour_zombie_runtime.png?v=1';
// Dedicated Kling sheets supersede the cutout once each is decoded. Static cutout remains only as a
// resilient loading fallback, so a slow asset never makes the ally disappear.
const NINJA_ANIMATION_REV='20260824-kling-alpha-v2';
const ninjaAnimationSheets=new Map();
function ninjaAnimationSheet(action,direction){
  const key=`${action}_${DIRECTION_NAMES[direction]}`;
  let image=ninjaAnimationSheets.get(key);
  if(!image){image=new Image();image.src=`../assets/allies/ninja/sheets/ninja_${key}.png?v=${NINJA_ANIMATION_REV}`;ninjaAnimationSheets.set(key,image)}
  return image;
}
// Support unit, not a wave-clearing carry: slower than Stas, modest kick damage and a long recovery.
// `houseLeash` is the extra patrol margin outside the shelter rectangle.
const NINJA_ALLY={speed:125,radius:10,damage:12,attackInterval:1.25,range:27,followDistance:54,houseLeash:105,maxSoloKillsPerWave:1};
// The third-wave defender mirrors Ninja's deliberately modest support numbers: she guards the house,
// contributes pressure, but cannot clear the horde without Stas.
const SECOND_DEFENDER_ALLY={...NINJA_ALLY};
const secondDefenderSprite=new Image();secondDefenderSprite.src='../assets/allies/second_defender_runtime.png?v=1';
const ZOMBIE_MASTERS={
  drifter:'../assets/zombies/drifter_sheet.png',
  runner:'../assets/zombies/runner_sheet.png',
  spitter:'../assets/zombies/spitter_sheet.png',
  glamour_drifter:'../assets/zombies/friends/glamour_drifter_master.png',
  office_runner:'../assets/zombies/friends/office_runner_master.png',
  heavy_spitter:'../assets/zombies/friends/heavy_spitter_master.png',
  silent_stalker:'../assets/zombies/friends/silent_stalker_master.png',
  boss_zombie:'../assets/zombies/friends/brunette_boss_master.png',
  bespectacled_teacher:'../assets/zombies/friends/bespectacled_teacher_master.png',
  communist_nikita:'../assets/zombies/new-batch-01/masters/communist_nikita_4dir_master_alpha.png',
  tattooed_crowd_zombie:'../assets/zombies/new-batch-01/masters/tattooed_crowd_zombie_4dir_master_alpha.png',
  blonde_crowd_zombie:'../assets/zombies/new-batch-01/masters/blonde_crowd_zombie_4dir_master_alpha.png',
  plaid_glasses_zombie:'../assets/zombies/new-batch-01/masters/plaid_glasses_zombie_4dir_master_alpha.png',
  brunette_crowd_zombie:'../assets/zombies/new-batch-01/masters/brunette_crowd_zombie_4dir_master_alpha.png',
  cat_keeper:'../assets/zombies/new-batch-01/masters/cat_keeper_zombie_4dir_master_alpha.png',
  dog_handler_zombie:'../assets/zombies/new-batch-01/masters/dog_handler_zombie_4dir_master_alpha.png',
  mommy_zombie:'../assets/zombies/new-batch-01/masters/mommy_zombie_4dir_master_alpha.png',
  vomiting_alexander:'../assets/zombies/new-batch-01/masters/vomiting_alexander_4dir_master_alpha.png',
  lilliput:'../assets/zombies/new-batch-01/masters/lilliput_zombie_4dir_master_alpha.png',
  lumberjack_zombie:'../assets/zombies/new-batch-01/masters/lumberjack_zombie_4dir_master_alpha.png',
  injured_kuok:'../assets/zombies/new-batch-01/masters/injured_kuok_4dir_master_alpha.png'
};
const zombieSheets=new Map(Object.entries(ZOMBIE_MASTERS).map(([id,path])=>{const image=new Image();image.src=path;return [id,image]}));
function directionCell(angle){return Math.abs(Math.cos(angle))>Math.abs(Math.sin(angle))?(Math.cos(angle)>0?3:2):(Math.sin(angle)>0?0:1)}
// Rim light: a pale halo drawn BEHIND each body so its silhouette separates from the dark yard.
// The halo is the sprite's own alpha dilated by a few offset stamps and flood-filled with the rim
// colour via source-in; drawn under the sprite only the ~1.5px of dilation past the edge survives.
// One shared 128² scratch canvas serves every entity — per-frame allocation would thrash the GC.
const rimScratch=document.createElement('canvas');rimScratch.width=rimScratch.height=128;
const rimContext=rimScratch.getContext('2d');
const RIM_OFFSETS=[[3,0],[-3,0],[0,3],[0,-3],[3,3],[-3,-3],[3,-3],[-3,3],[3,1],[-3,-1]];
function stampRim(target,image,sx,sy,sw,sh,dx,dy,dw,dh,color,alpha){
  rimContext.globalCompositeOperation='source-over';rimContext.clearRect(0,0,128,128);
  for(const [ox,oy] of RIM_OFFSETS)rimContext.drawImage(image,sx,sy,sw,sh,ox,oy,128,128);
  rimContext.globalCompositeOperation='source-in';
  rimContext.fillStyle=color;rimContext.fillRect(0,0,128,128);
  target.save();target.globalAlpha=alpha;target.drawImage(rimScratch,0,0,128,128,dx,dy,dw,dh);target.restore();
}
function drawDirectionSprite(target,image,direction,x,y,size,{tint=null,shadow=8,rim=null,rimAlpha=.45}={}){if(!image.complete||!image.naturalWidth)return false;const cellWidth=image.naturalWidth/2,cellHeight=image.naturalHeight/2,sx=(direction%2)*cellWidth,sy=Math.floor(direction/2)*cellHeight;if(rim)stampRim(target,image,sx,sy,cellWidth,cellHeight,x-size/2,y-size*.62,size,size,rim,rimAlpha);target.save();target.shadowColor='#000b';target.shadowBlur=rim?Math.min(shadow,3):shadow;target.drawImage(image,sx,sy,cellWidth,cellHeight,x-size/2,y-size*.62,size,size);target.shadowBlur=0;if(tint){target.globalCompositeOperation='source-atop';target.fillStyle=tint;target.fillRect(x-size/2,y-size*.62,size,size);target.globalCompositeOperation='source-over'}target.restore();return true}
const DIRECTION_NAMES=['down','up','left','right'],ANIM_TILE=128,ANIM_COLS=4,ANIM_FRAMES=16,ANIM_ANCHOR_Y=120,ANIM_FPS={idle:8,walk:13,attack:22};
const ANIMATED_CHARACTERS=new Set(['stas','survivor','drifter','runner','spitter','glamour_drifter','office_runner','heavy_spitter','silent_stalker','boss_zombie','bespectacled_teacher','communist_nikita','tattooed_crowd_zombie','blonde_crowd_zombie','plaid_glasses_zombie','brunette_crowd_zombie','cat_keeper','dog_handler_zombie','vomiting_alexander','lilliput','lumberjack_zombie','big_russian_boss','injured_kuok']);
const ANIM_SCALE={
  stas:1.08,survivor:1,
  drifter:1.08,runner:1.08,spitter:1.08,
  glamour_drifter:1.08,
  office_runner:1.08,
  heavy_spitter:1.08,
  silent_stalker:1.08,
  bespectacled_teacher:1.08,
  communist_nikita:1.08,
  tattooed_crowd_zombie:1.08,
  blonde_crowd_zombie:1.08,
  plaid_glasses_zombie:1.08,
  brunette_crowd_zombie:1.08,
  cat_keeper:1.08,
  dog_handler_zombie:1.18,
  mommy_zombie:1.14,
  vomiting_alexander:1.12,
  lilliput:.72,
  lumberjack_zombie:1.18,
  big_russian_boss:1.08,
  injured_kuok:1.2
};
const ZOMBIE_DRAW_SIZE={drifter:72,runner:64,spitter:82,glamour_drifter:72,office_runner:64,heavy_spitter:82,silent_stalker:68,boss_zombie:86,bespectacled_teacher:74,communist_nikita:76,tattooed_crowd_zombie:76,blonde_crowd_zombie:76,plaid_glasses_zombie:76,brunette_crowd_zombie:76,cat_keeper:76,dog_handler_zombie:96,mommy_zombie:90,vomiting_alexander:84,lilliput:50,lumberjack_zombie:92,big_russian_boss:142,injured_kuok:138};
const FRIEND_SUMMON_TYPES=['glamour_drifter','office_runner','heavy_spitter','silent_stalker','boss_zombie','bespectacled_teacher'];
const BOSS_PHASES=[.75,.5,.25];
const animationSheets=new Map();
const ANIMATION_ASSET_REV='20260828-kuok-alpha-v3';
function animationSheet(character,action,direction){const key=`${character}/${action}_${direction}`;let image=animationSheets.get(key);if(!image){image=new Image();image.src=`assets/animations/sheets/${key}.png?v=${ANIMATION_ASSET_REV}`;animationSheets.set(key,image)}return image}
function advanceAnimation(entity,action,dt){if(entity.animAction!==action){entity.animAction=action;entity.animTime=0}else entity.animTime=(entity.animTime||0)+dt;return action}
function drawAnimatedSprite(target,character,action,direction,x,y,size,time,{tint=null,shadow=8,rim=null,rimAlpha=.45}={}){
  if(!ANIMATED_CHARACTERS.has(character))return false;
  // KUOK's authored combat cycle is named crutch_smash; gameplay still asks all hostiles for `attack`.
  const sheetAction=character==='injured_kuok'&&action==='attack'?'crutch_smash':action;
  const image=animationSheet(character,sheetAction,DIRECTION_NAMES[direction]);
  if(!image.complete||!image.naturalWidth)return false;
  const frame=Math.floor((time||0)*(ANIM_FPS[action]||12))%ANIM_FRAMES,sx=(frame%ANIM_COLS)*ANIM_TILE,sy=Math.floor(frame/ANIM_COLS)*ANIM_TILE;
  const scale=size/ANIM_TILE,dx=x-size/2,dy=y+size*.38-ANIM_ANCHOR_Y*scale;
  if(rim)stampRim(target,image,sx,sy,ANIM_TILE,ANIM_TILE,dx,dy,size,size,rim,rimAlpha);
  // A drop shadow with its usual blur radius spreads dark past the 3px rim dilation and erases it, so
  // the shadow is narrowed whenever a rim is asked for — a night silhouette needs the light edge more
  // than it needs a wide soft shadow.
  target.save();target.shadowColor='#000b';target.shadowBlur=rim?Math.min(shadow,3):shadow;target.drawImage(image,sx,sy,ANIM_TILE,ANIM_TILE,dx,dy,size,size);target.shadowBlur=0;
  if(tint){target.globalCompositeOperation='source-atop';target.fillStyle=tint;target.fillRect(dx,dy,size,size);target.globalCompositeOperation='source-over'}
  target.restore();return true;
}
// Bloom: a small offscreen canvas holding a heavily downsampled copy of the live frame, thresholded
// and blurred by the browser's own canvas filter, then added back on top with 'lighter'. This is the
// one thing raw contrast/rim-light cannot fake — a muzzle flash or a lit window is supposed to bleed
// light into the dark air around it, not just sit there as a bright shape with a hard edge. Cheap
// because the filter and the blur both only ever run on a canvas a fraction of the real size: the
// downscale itself does most of the blur, the CSS filter just throws away everything BUT the bright
// pixels before that averaging happens, so dark yard and dark walls contribute almost nothing back.
// Light-layer switchboard. Overexposure in a stacked additive pipeline is never one pass: it is four
// passes each individually defensible landing on the same pixels. The only way to find the culprit is
// to be able to turn each one off at runtime and measure the frame, so every light/grade pass below is
// gated by a flag here. Defaults are all on; `window.__gfx.bloom=0` in the console kills just the bloom.
// ALL OFF. Every one of these is a pass that paints something on top of the finished artwork, and
// together they are what made the game read as one filtered image instead of as the textures we
// generated. They were each individually defensible and collectively fatal: bloom hazes anything
// bright, the grade vignette darkens the edges of the frame, crush pushes the mid-dark band to black,
// and the three interior/window/veil passes were fighting each other over the same 272×200 rectangle.
// The switchboard stays, so any single pass can be brought back and evaluated ON ITS OWN
// (`window.__gfx.bloom=1` in the console) rather than being tuned blind inside a stack of six.
const DEV_MODE=new URLSearchParams(location.search).has('dev');
const GFX={bloom:0,grade:0,interiorLight:0,windowLight:0,veils:0,lamp:0,crush:0};
if(DEV_MODE)window.__gfx=GFX;
const BLOOM_DOWNSCALE=7,BLOOM_STRENGTH=.55;
const bloomCanvas=document.createElement('canvas'),bloomContext=bloomCanvas.getContext('2d');
function applyBloom(){
  const bw=Math.max(1,Math.round(canvas.width/BLOOM_DOWNSCALE)),bh=Math.max(1,Math.round(canvas.height/BLOOM_DOWNSCALE));
  if(bloomCanvas.width!==bw||bloomCanvas.height!==bh){bloomCanvas.width=bw;bloomCanvas.height=bh}
  // Threshold happens BEFORE the resize blurs it: contrast pushes mid/dark tones towards black and
  // brightness dims the survivors slightly so three-ish additive passes a night don't blow out to white.
  bloomContext.filter='brightness(55%) contrast(280%)';
  bloomContext.drawImage(canvas,0,0,canvas.width,canvas.height,0,0,bw,bh);
  bloomContext.filter='none';
  // Drawn back in plain device-pixel space (identity transform), not the world/shake transform the
  // rest of the frame uses — the bloom canvas is already a pixel-for-pixel crop of the real backing
  // store, scaling it through DPR again would double-apply the ratio and misalign it against the scene.
  ctx.save();ctx.setTransform(1,0,0,1,0,0);ctx.globalCompositeOperation='lighter';ctx.globalAlpha=BLOOM_STRENGTH;
  ctx.drawImage(bloomCanvas,0,0,bw,bh,0,0,canvas.width,canvas.height);
  ctx.restore();
}
// Black point. Measured against the reference this was the ONE missing pass, and the measurement is
// unambiguous: the reference puts 80.5% of its pixels in the darkest tenth of the range and 1.01% above
// half brightness. The frame was putting only 52.5% in that darkest bin — and 39.5% into the 10–30%
// band, which the reference keeps at 15.1%. The amount of LIGHT in the two images was already identical
// (0.97% vs 1.01% bright pixels). The defect was never exposure, never hue, never any single light
// source: it was a mass of half-lit pixels sitting between black and lit, which is exactly what "grey
// mush" is. Nothing in the pipeline could remove it, because no pass owned the black point — every
// grade multiply scales the whole range down and drags the highlights along with the mush.
//
// The frame is composited onto itself with 'multiply' at partial alpha, which is a gamma curve built
// out of one drawImage: the result is base*(1-a) + base²*a. Squaring is brutal on low values and almost
// free on high ones — 15% luma falls to 8% (into the black bin) while 85% luma stays at 81%. So the
// mid-dark band collapses into the dark and every genuinely lit thing in the frame is left standing,
// which is the entire difference between the reference and what we had.
const crushCanvas=document.createElement('canvas'),crushContext=crushCanvas.getContext('2d');
const BLACK_POINT=.62;
function crushBlacks(){
  if(crushCanvas.width!==canvas.width||crushCanvas.height!==canvas.height){crushCanvas.width=canvas.width;crushCanvas.height=canvas.height}
  crushContext.setTransform(1,0,0,1,0,0);
  crushContext.globalCompositeOperation='source-over';
  crushContext.clearRect(0,0,canvas.width,canvas.height);
  crushContext.drawImage(canvas,0,0);
  // Identity transform for the same reason as the bloom: this is a pixel-for-pixel copy of the backing
  // store, so putting it back through the DPR/shake transform would scale and offset it against itself.
  ctx.save();ctx.setTransform(1,0,0,1,0,0);
  ctx.globalCompositeOperation='multiply';ctx.globalAlpha=BLACK_POINT;
  ctx.drawImage(crushCanvas,0,0);
  ctx.restore();
}
let state,sessionId=0;
let haterRaid=null,selectedRaidZombie='glamour_drifter',activeRaidTab='specials',raidTaunts=[];
const RAID_NAMES={
  communist_nikita:'КОММУНИСТ НИКИТА',tattooed_crowd_zombie:'ЗОМБИ С ТАТУ',blonde_crowd_zombie:'БЛОНДИНКА',plaid_glasses_zombie:'ОЧКИ И КЛЕТКА',brunette_crowd_zombie:'БРЮНЕТКА',cat_keeper:'ЗОМБИ С КОТОМ',dog_handler_zombie:'ЗОМБИ С СОБАКОЙ',mommy_zombie:'ЗОМБИ-МАМОЧКА',vomiting_alexander:'БЛЮЮЩИЙ АЛЕКСАНДР',lilliput:'ЛИЛИПУТ',lumberjack_zombie:'ДРОВОСЕК',injured_kuok:'КУОК НА КОСТЫЛЯХ',
  glamour_drifter:'ГЛАМУРНАЯ',office_runner:'ОФИСНЫЙ',heavy_spitter:'ТЯЖЁЛАЯ',silent_stalker:'ТИХОНЯ',bespectacled_teacher:'ОЧКАСТАЯ УЧИЛКА',boss_zombie:'БРЮНЕТКА-БОСС'
};
const RAID_PORTRAITS={
  glamour_drifter:'assets/promos/zombie-portraits/glamour_drifter.png',office_runner:'assets/promos/zombie-portraits/office_runner.png',heavy_spitter:'assets/promos/zombie-portraits/heavy_spitter.png',silent_stalker:'assets/promos/zombie-portraits/silent_stalker.png',bespectacled_teacher:'assets/promos/zombie-portraits/bespectacled_teacher.png',boss_zombie:'assets/promos/zombie-portraits/brunette_boss.png',
  communist_nikita:'assets/zombies/new-batch-01/communist_nikita.png',tattooed_crowd_zombie:'assets/zombies/new-batch-01/tattooed_crowd_zombie.png',blonde_crowd_zombie:'assets/zombies/new-batch-01/blonde_crowd_zombie.png',plaid_glasses_zombie:'assets/zombies/new-batch-01/plaid_glasses_zombie.png',brunette_crowd_zombie:'assets/zombies/new-batch-01/brunette_crowd_zombie.png',cat_keeper:'assets/zombies/new-batch-01/cat_keeper_zombie.png',dog_handler_zombie:'assets/zombies/new-batch-01/dog_handler_zombie.png',mommy_zombie:'assets/zombies/new-batch-01/mommy_zombie.png',vomiting_alexander:'assets/zombies/new-batch-01/vomiting_alexander.png',lilliput:'assets/zombies/new-batch-01/lilliput_zombie.png',lumberjack_zombie:'assets/zombies/new-batch-01/lumberjack_zombie.png',injured_kuok:'assets/zombies/new-batch-01/injured_kuok.png'
};
// Picker imagery is concept art, never runtime sprite sheets. A per-character fallback prevents a broken
// request or stale cache from producing an empty black card while keeping the primary art full-body.
const RAID_PORTRAIT_FALLBACKS={
  glamour_drifter:'assets/zombies/friends/glamour_drifter_initial.png',office_runner:'assets/zombies/friends/office_runner_initial.png',heavy_spitter:'assets/zombies/friends/heavy_spitter_initial.png',silent_stalker:'assets/zombies/friends/silent_stalker_initial.png',bespectacled_teacher:'assets/zombies/friends/bespectacled_teacher_initial.png',boss_zombie:'assets/zombies/friends/brunette_boss_initial.png',
  communist_nikita:'assets/zombies/new-batch-01/masters/communist_nikita_4dir_master_alpha.png',tattooed_crowd_zombie:'assets/zombies/new-batch-01/masters/tattooed_crowd_zombie_4dir_master_alpha.png',blonde_crowd_zombie:'assets/zombies/new-batch-01/masters/blonde_crowd_zombie_4dir_master_alpha.png',plaid_glasses_zombie:'assets/zombies/new-batch-01/masters/plaid_glasses_zombie_4dir_master_alpha.png',brunette_crowd_zombie:'assets/zombies/new-batch-01/masters/brunette_crowd_zombie_4dir_master_alpha.png',cat_keeper:'assets/zombies/new-batch-01/masters/cat_keeper_zombie_4dir_master_alpha.png',dog_handler_zombie:'assets/zombies/new-batch-01/masters/dog_handler_zombie_4dir_master_alpha.png',mommy_zombie:'assets/zombies/new-batch-01/masters/mommy_zombie_4dir_master_alpha.png',vomiting_alexander:'assets/zombies/new-batch-01/masters/vomiting_alexander_4dir_master_alpha.png',lilliput:'assets/zombies/new-batch-01/masters/lilliput_zombie_4dir_master_alpha.png',lumberjack_zombie:'assets/zombies/new-batch-01/masters/lumberjack_zombie_4dir_master_alpha.png',injured_kuok:'assets/zombies/new-batch-01/masters/injured_kuok_4dir_master_alpha.png'
};
const GAME_RESULTS={
  'stas-victory':{image:'assets/ui/endings/stas-victory.png',stamp:'РАССВЕТ',title:'ПЕСНЯ ДОИГРАЛА',copy:'Дом ещё стоит. Зомби закончились раньше, чем трек.',alt:'Стас победил зомби и сохранил колонку'},
  'stas-defeat':{image:'assets/ui/endings/stas-defeat.png',stamp:'КОЛОНКА ЗАМОЛЧАЛА',title:'НОЧЬ ЗАБРАЛА СВОЁ',copy:'Хейтеры прорвались. Но песню всегда можно включить ещё раз.',alt:'Стас проиграл оборону дома'},
  'zombie-victory':{image:'assets/ui/endings/zombie-victory.png',stamp:'ХЕЙТ ДОСТАВЛЕН',title:'ЗОМБИ ВЫКЛЮЧИЛИ ЗОМБИ',copy:'Колонка разрушена. Комментарий оказался громче припева.',alt:'Зомби разрушили колонку и победили'},
  'zombie-defeat':{image:'assets/ui/endings/zombie-defeat.png',stamp:'НЕ ДОШЁЛ',title:'СТАС ОТСТРЕЛЯЛСЯ',copy:'Хейт не прошёл модерацию. Попробуй другого зомби.',alt:'Стас победил атакующего зомби'}
};
let currentResult=null;
function syncSceneFocus(mode){
  for(const control of document.querySelectorAll('#game-scene [data-scene-action]')){
    const enabled=mode==='menu'?control.classList.contains('scene-card'):mode==='result'?control.closest('#scene-actions')!==null:false;
    control.tabIndex=enabled?0:-1;
  }
}
const modeScene=$('#game-scene');
function setModeSelection(side=''){
  if(side)modeScene.dataset.selection=side;
  else delete modeScene.dataset.selection;
}
for(const card of document.querySelectorAll('.scene-card')){
  const side=card.dataset.sceneAction;
  const activate=()=>setModeSelection(side);
  card.addEventListener('pointerenter',activate);
  card.addEventListener('pointerdown',activate);
  card.addEventListener('focusin',activate);
  card.addEventListener('pointerleave',()=>{if(!card.contains(document.activeElement))setModeSelection()});
  card.addEventListener('focusout',()=>{if(!card.matches(':hover'))setModeSelection()});
}
function showModeScene(){
  currentResult=null;setModeSelection();
  $('#scene-kicker').textContent='THE LAST OF STAS · ВЫБОР СТОРОНЫ';
  $('#scene-title').textContent='КТО ТЫ В ЭТОЙ ПЕСНЕ?';
  $('#scene-copy').textContent='Защити песню вместе со Стасом — или стань хейтером и доберись до колонки.';
  $('#scene-cards').hidden=false;$('#scene-result').hidden=true;$('#scene-actions').hidden=true;$('#game-scene').hidden=false;syncSceneFocus('menu');
}
function hideGameScene(){$('#game-scene').hidden=true;syncSceneFocus('hidden')}
function showGameResult(key){
  if(currentResult===key)return;
  const result=GAME_RESULTS[key];if(!result)return;
  currentResult=key;
  $('#scene-kicker').textContent=key.startsWith('stas')?'РЕЖИМ ЗА СТАСА · ФИНАЛ':'ХЕЙТЕРСКИЙ РЕЙД · ФИНАЛ';
  $('#scene-title').textContent='THE LAST OF STAS';$('#scene-copy').textContent='';$('#scene-cards').hidden=true;
  const panel=$('#scene-result');panel.hidden=false;panel.classList.toggle('is-defeat',key.endsWith('defeat'));
  const image=$('#scene-result-image');image.src=result.image;image.alt=result.alt;
  $('#scene-stamp').textContent=result.stamp;$('#scene-result-title').textContent=result.title;$('#scene-result-copy').textContent=result.copy;
  $('#scene-actions').hidden=false;$('#game-scene').hidden=false;syncSceneFocus('result');
}
function chooseStasMode(){
  currentResult=null;haterRaid=null;document.body.classList.remove('raid-mode');$('#raid-controls').hidden=true;closeHaterRaidPicker();
  reset();hideGameScene();canvas.focus({preventScroll:true});
}
function chooseZombieMode(){hideGameScene();openHaterRaid()}
function returnToModeScene(){
  haterRaid=null;document.body.classList.remove('raid-mode');$('#raid-controls').hidden=true;closeHaterRaidPicker();reset();showModeScene();
}
function retryGameResult(){
  if(currentResult?.startsWith('zombie')){startHaterRaid();hideGameScene()}
  else chooseStasMode();
}
function rollRaidTaunts(){
  raidTaunts=[...TAUNT_LINES].sort(()=>Math.random()-.5).slice(0,3);
  const box=$('#raid-taunts');if(!box)return;
  box.innerHTML=raidTaunts.map((line,index)=>`<button type="button" data-raid-taunt="${index}"><b>${index+1}</b> · ${line}</button>`).join('');
  for(const button of box.querySelectorAll('button'))button.onclick=()=>useRaidTaunt(+button.dataset.raidTaunt);
}
function setRaidTab(tab,{focus=false}={}){
  activeRaidTab=tab;
  for(const [name,label] of Object.entries({originals:$('#raid-tab-originals'),specials:$('#raid-tab-specials')})){
    const selected=name===tab;label.setAttribute('aria-selected',selected);label.tabIndex=selected?0:-1;
  }
  renderRaidRoster({resetScroll:true});
  if(focus)$('#raid-roster .raid-zombie')?.focus({preventScroll:true});
}
function renderRaidRoster({focusSelected=false,resetScroll=false}={}){
  const box=$('#raid-roster');if(!box)return;
  const ids=RAID_TABS[activeRaidTab]||RAID_ROSTER;
  box.setAttribute('aria-label',activeRaidTab==='originals'?'Новые зомби — выбери зомби':'Старые зомби — выбери зомби');
  box.innerHTML=ids.map(id=>{const z=zombieTypes.get(id),stats=raidStatsFor(z),selected=id===selectedRaidZombie,name=RAID_NAMES[id]||z.display_name,portrait=RAID_PORTRAITS[id],fallback=RAID_PORTRAIT_FALLBACKS[id];return `<button type="button" class="raid-zombie ${selected?'selected':''}" data-zombie="${id}" aria-pressed="${selected}"><span class="raid-zombie-preview"><img src="${portrait}?v=portrait-20260828-2" alt="${name} — концепт-портрет зомби" onerror="if(this.dataset.fallback!=='1'){this.dataset.fallback='1';this.src='${fallback}?v=portrait-fallback-1'}"></span><span class="raid-zombie-copy"><b>${name}</b><span>HP ${stats.maxHp} · СКОРОСТЬ ${z.speed}<br>УРОН ПО КОЛОНКЕ ${stats.attackDamage}</span></span></button>`}).join('');
  if(resetScroll)box.scrollTop=0;
  for(const button of box.querySelectorAll('button'))button.onclick=()=>{selectedRaidZombie=button.dataset.zombie;renderRaidRoster({focusSelected:true})};
  if(focusSelected)box.querySelector('[aria-pressed="true"]')?.focus({preventScroll:true});
}
function openHaterRaid(){
  activeRaidTab=RAID_TABS.originals.includes(selectedRaidZombie)?'originals':'specials';
  setRaidTab(activeRaidTab);$('#raid-picker').hidden=false;blurActive?.();
}
function closeHaterRaidPicker(){$('#raid-picker').hidden=true}
function startHaterRaid(){
  // The raid starts from this user gesture: unlock WebAudio first, then let Stas switch the song on.
  currentResult=null;audio.unlock?.();reset();closeHaterRaidPicker();
  // Never inherit held movement/fire from the menu or a previous run.
  mouse.down=false;held.clear();stick.dx=0;stick.dy=0;
  haterRaid=createHaterRaid(selectedRaidZombie,WORLD,state.shelter,speakerPosition(state.shelter),zombieTypes);
  blareSpeakers(speakers);
  state.player.x=haterRaid.stas.x;state.player.y=haterRaid.stas.y;state.player.heat=0;state.player.failed=false;
  document.body.classList.add('raid-mode');$('#raid-controls').hidden=false;rollRaidTaunts();
  canvas.focus({preventScroll:true});
  setStatus('ХЕЙТЕРСКИЙ РЕЙД · ДОБЕРИСЬ ДО КОЛОНКИ',2.4);sfx('growl');
}
function exitHaterRaid(){haterRaid=null;document.body.classList.remove('raid-mode');$('#raid-controls').hidden=true;reset()}
function useRaidTaunt(index){
  if(!haterRaid||!raidTaunts[index])return;
  if(shoutRaidTaunt(haterRaid,raidTaunts[index])){sfx('growl');setStatus(`ПРОВОКАЦИЯ +20 · СТАС СТРЕЛЯЕТ БЫСТРЕЕ`,1.1);rollRaidTaunts()}
}
if(DEV_MODE)window.__haterRaidState=()=>haterRaid;
if(DEV_MODE)window.__haterRaidDebug=()=>haterRaid?{
  active:haterRaid.active,phase:haterRaid.phase,type:haterRaid.type,stageIndex:haterRaid.stageIndex,
  player:{id:haterRaid.player.id,x:haterRaid.player.x,y:haterRaid.player.y,hp:haterRaid.player.hp,animAction:haterRaid.player.animAction,animTime:haterRaid.player.animTime},
  fence:{...haterRaid.fence},speaker:{...haterRaid.speaker},companions:haterRaid.companions.map(({id,x,y,hp,animAction,animTime})=>({id,x,y,hp,animAction,animTime}))
}:null;
// Screen shake and hit-stop: the cheapest juice in the genre. Shake is a decaying sine offset applied
// to the whole world transform — deterministic, so it cannot jitter differently on the two axes and
// read as a rendering fault. Hit-stop freezes the SIMULATION for a few frames while the renderer keeps
// running, which is what makes a kill land as a thump instead of a disappearance.
let shakeTime=0,shakeDuration=.28,shakePower=0,hitStop=0;
function addShake(power,duration=.28){if(power>=shakePower){shakePower=power;shakeDuration=duration}shakeTime=Math.max(shakeTime,duration)}
function addHitStop(seconds){hitStop=Math.max(hitStop,seconds)}
function shakeOffset(now){
  if(shakeTime<=0)return [0,0];
  const falloff=shakeTime/shakeDuration,amp=shakePower*falloff*falloff;
  return [Math.sin(now*.083)*amp,Math.cos(now*.107)*amp];
}
function syncStartButton(){
  const button=$('#start');if(!button||!state)return;
  if(state.phase==='wave'){
    button.disabled=true;
    button.textContent=t('btn_song_live');
    return;
  }
  button.disabled=false;
  if(state.phase==='break')button.textContent=t('btn_play_song_again');
  else if(state.phase==='idle')button.textContent=t('btn_play_song');
  else button.textContent=t('btn_again');
}
function findOpaqueBounds(image){
  const scan=document.createElement('canvas'),scanContext=scan.getContext('2d',{willReadFrequently:true});
  scan.width=image.naturalWidth;scan.height=image.naturalHeight;scanContext.drawImage(image,0,0);
  const {data,width,height}=scanContext.getImageData(0,0,scan.width,scan.height);let left=width,top=height,right=-1,bottom=-1;
  for(let y=0;y<height;y++)for(let x=0;x<width;x++)if(data[(y*width+x)*4+3]>12){left=Math.min(left,x);top=Math.min(top,y);right=Math.max(right,x);bottom=Math.max(bottom,y)}
  return right<left?null:{x:left,y:top,width:right-left+1,height:bottom-top+1};
}
const weaponVisuals=new Map([...weapons.values()].map(weapon=>{
  const image=new Image(),visual={image,status:'loading',bounds:null};
  image.onload=()=>{visual.bounds=findOpaqueBounds(image);visual.status=visual.bounds?'ready':'missing';renderWeaponPanels()};
  image.onerror=()=>{visual.status='missing';renderWeaponPanels()};
  image.src=weapon.assets?.world_sprite||`assets/weapons/${weapon.id}.png`;
  return [weapon.id,visual];
}));
function drawWeaponShape(target,weapon,scale=1){
  target.save();target.scale(scale,scale);target.lineCap='round';target.lineJoin='round';target.strokeStyle='#d8c68a';target.fillStyle='#37352e';target.lineWidth=3;
  if(weapon.id==='corpse_burner'){
    target.fillRect(-8,-8,21,16);target.strokeRect(-8,-8,21,16);target.beginPath();target.moveTo(11,-4);target.lineTo(35,-5);target.lineTo(44,0);target.lineTo(35,5);target.lineTo(11,4);target.stroke();target.strokeStyle='#8f3428';target.beginPath();target.moveTo(-3,-9);target.lineTo(-3,9);target.stroke();
  }else if(weapon.id==='crying_hedgehog'){
    target.beginPath();target.moveTo(-9,-6);target.lineTo(18,-11);target.lineTo(36,-16);target.lineTo(36,16);target.lineTo(18,11);target.lineTo(-9,6);target.closePath();target.fill();target.stroke();target.strokeStyle='#98a84f';for(let y=-11;y<=11;y+=7){target.beginPath();target.moveTo(34,y);target.lineTo(45,y*1.15);target.stroke()}
  }else{
    target.fillRect(-9,-5,31,10);target.strokeRect(-9,-5,31,10);target.beginPath();target.moveTo(22,0);target.lineTo(44,0);target.stroke();target.strokeStyle='#b9ad91';for(let y=-8;y<=8;y+=8){target.beginPath();target.moveTo(36,0);target.lineTo(47,y);target.stroke()}
  }
  target.restore();
}
function drawWeaponVisual(target,weapon,x,y,{maxWidth=58,maxHeight=36,fallbackScale=1}={},angle=0){
  const visual=weaponVisuals.get(weapon.id);target.save();target.translate(x,y);target.rotate(angle);
  if(visual?.status==='ready'&&visual.bounds){
    const bounds=visual.bounds,fit=Math.min(maxWidth/bounds.width,maxHeight/bounds.height);
    const width=bounds.width*fit,height=bounds.height*fit;
    target.drawImage(visual.image,bounds.x,bounds.y,bounds.width,bounds.height,-width*.17,-height*.5,width,height);
  }else drawWeaponShape(target,weapon,fallbackScale);
  target.restore();
}
function drawWeaponPreview(previewCanvas,weapon){
  if(!previewCanvas||!weapon)return;const preview=previewCanvas.getContext('2d'),visual=weaponVisuals.get(weapon.id);
  preview.clearRect(0,0,previewCanvas.width,previewCanvas.height);preview.fillStyle='#1b1b17';preview.fillRect(0,0,previewCanvas.width,previewCanvas.height);preview.strokeStyle='#4d493f';preview.lineWidth=1;
  for(let x=8;x<previewCanvas.width;x+=18){preview.beginPath();preview.moveTo(x,previewCanvas.height);preview.lineTo(x+28,0);preview.stroke()}
  const compact=previewCanvas.width<160;
  const renderOptions=compact?{maxWidth:72,maxHeight:32,fallbackScale:1.1}:{maxWidth:188,maxHeight:68,fallbackScale:2.2};
  drawWeaponVisual(preview,weapon,compact?previewCanvas.width*.43:previewCanvas.width*.46,previewCanvas.height*.58,renderOptions);preview.fillStyle='#bdb49f';preview.font=`bold ${compact?8:12}px Chivo Mono`;preview.fillText(weaponName(weapon).toUpperCase(),compact?5:10,compact?11:18);
  if(visual?.status!=='ready'){preview.fillStyle='#9f3f2d';preview.font='bold 9px Chivo Mono';preview.fillText(t('preview_missing'),10,previewCanvas.height-10)}
}
function renderWeaponPanels(){
  if(!state)return;const selected=weapons.get($('#weapon')?.value||state.player.weapon);drawWeaponPreview($('#chamber-preview'),selected);
  const equipped=weapons.get(state.player.weapon),visual=weaponVisuals.get(equipped.id),slot=$('#equipped-weapon');if(!slot)return;
  slot.innerHTML=`<canvas width="96" height="62"></canvas><div><b>${weaponName(equipped)}</b><small>${t('equipped_slot_hint')}</small>${visual?.status==='ready'?'':`<span class="asset-warning">${t('placeholder_asset')}</span>`}</div>`;drawWeaponPreview(slot.querySelector('canvas'),equipped);
}
// Assembled stats are memoized per weapon id: components never change at runtime, and the HUD now
// reads the heat limit every frame to render `heat / cap`.
const statsCache=new Map();
function weaponStats(w){
  if(statsCache.has(w.id))return statsCache.get(w.id);
  const stats={...w.base,heat_limit:60,failure_rate:.08,failure:'jam',spread:.06};for(const id of Object.values(w.components)){const c=components.get(id);if(!c)continue;for(const [k,v] of Object.entries(c.modifiers||{})){if(k==='range')stats.range+=v*10;else if(k!=='power_bonus')stats[k]=(stats[k]||0)+v}if(c.failure)stats.failure=c.failure}
  statsCache.set(w.id,stats);return stats;
}
// The track is gameplay timing, not decoration. Every 24-second loop has a readable verse → build →
// chorus → break arc. The audio may be absent during development, so elapsed wave time is the stable
// clock; visuals and weapon bonuses never depend on mp3 decode state.
const TRACK_CYCLE=24;
function trackBeat(){
  const position=((state?.elapsed||0)%TRACK_CYCLE)/TRACK_CYCLE;
  const phase=position<.42?'verse':position<.55?'build':position<.82?'chorus':'break';
  const phaseProgress=phase==='verse'?position/.42:phase==='build'?(position-.42)/.13:phase==='chorus'?(position-.55)/.27:(position-.82)/.18;
  return {position,phase,phaseProgress,chorus:phase==='chorus',pulse:.5+.5*Math.sin(position*Math.PI*16)};
}
function weaponCost(w){const cost={};for(const id of Object.values(w.components)){for(const [k,v] of Object.entries(components.get(id)?.cost||{}))cost[k]=(cost[k]||0)+v}return cost}
function canSpend(cost){return Object.entries(cost).every(([key,value])=>(state.salvage[key]||0)>=value)}
function spend(cost){for(const [key,value] of Object.entries(cost))state.salvage[key]-=value}
function syncPrepActions(){
  if(!state)return;
  const terminal=state.phase==='lost'||state.phase==='survived';
  const reinforceButton=$('#reinforce'),trapButton=$('#trap'),turretButton=$('#turret');
  if(reinforceButton)reinforceButton.disabled=terminal||!canPrepareHouse()||state.defenses.reinforced;
  // Traps are craftable at any point in a live attempt: mid-siege improvisation is the whole fantasy
  if(trapButton){
    trapButton.disabled=terminal;
    // The bag label carries the charges too: a recovered half-spent trap must not look like a fresh one
    const bagCharges=(state.interaction.bag?.trap||[]).reduce((sum,charges)=>sum+charges,0);
    trapButton.textContent=state.interaction.carry.trap>0
      ?t('btn_trap_bag',{count:state.interaction.carry.trap,charges:bagCharges})
      :t('btn_trap_empty');
  }
  // Same rule for the sentry: the label carries the remaining ammunition, because a recovered turret
  // that is nearly dry must not read as a fresh one sitting in the bag.
  if(turretButton){
    turretButton.disabled=terminal;
    const rounds=(state.interaction.bag?.turret||[]).reduce((sum,entry)=>sum+entry.ammo,0);
    turretButton.textContent=state.interaction.carry.turret>0
      ?t('btn_turret_bag',{count:state.interaction.carry.turret,rounds})
      :t('btn_turret_empty');
  }
}
function canPrepareHouse(){return state.phase==='idle'||state.phase==='break'||state.phase==='prep'}
function reinforceHouse(){const cost={metal_scrap:2,cloth:1};if(!canPrepareHouse()||state.defenses.reinforced)return;if(!canSpend(cost)){alertStatus(t('missing_salvage'));return}spend(cost);state.defenses.reinforced=true;state.house.maxHp+=100;state.house.hp+=100;renderSalvage();syncPrepActions();sfx('ui');alertStatus(t('barricades_reinforced'))}
// Crafting a trap now yields a carried object instead of a fixed installation. Where it ends up is
// the player's decision, and it can be picked back up with whatever charges it has left.
function craftTrap(){
  const cost={rotten_tissue:2,teeth:1};
  if(state.phase==='lost'||state.phase==='survived')return;
  if(!canSpend(cost)){alertStatus(t('missing_salvage'));return}
  spend(cost);addTrapToInventory(state.interaction);
  renderSalvage();syncPrepActions();sfx('ui');alertStatus(t('trap_in_bag'));
}
// Turrets cost real metal, which is the scarcest drop: one sentry is a night's worth of salvage, so the
// choice between a turret and a reinforced wall is the actual decision the prep phase is asking for.
function craftTurret(){
  const cost={metal_scrap:4,teeth:2};
  if(state.phase==='lost'||state.phase==='survived')return;
  if(!canSpend(cost)){alertStatus(t('missing_salvage'));return}
  spend(cost);addTurretToInventory(state.interaction);
  renderSalvage();syncPrepActions();sfx('ui');alertStatus(t('turret_in_bag'));
}
// Placement mode: G takes a trap out, T takes a turret out, the cursor previews the spot, left click
// drops it. Both share one carry slot, so asking for the other kind swaps what is in your hands.
function togglePlacement(kind='trap'){
  const interaction=state.interaction;
  // `placing` is an object, not a string: comparing it to the kind directly always failed, which made
  // T unable to cancel its own ghost and left the player stuck in placement mode.
  if(interaction.placing?.kind===kind){cancelPlacement(interaction);alertStatus(t('placement_cancelled'));return}
  if(!beginPlacement(interaction,kind)){alertStatus(t(kind==='turret'?'no_turret_in_bag':'no_trap_in_bag'));return}
  alertStatus(t(kind==='turret'?'choose_spot_turret':'choose_spot_trap'));
}
function commitPlacement(){
  const result=placeCarried(state.interaction,state.shelter,state.player,mouse.x,mouse.y);
  if(!result)return false;
  if(result.ok)sfx('place');
  syncPrepActions();alertStatus(t(result.message,result.vars||{}));
  return true;
}
// F is one contextual key: pick a trap up, board the window you are standing at, or pry it open again.
function currentAction(){
  if(!state)return {kind:'none',label:''};
  if((state.phase==='idle'||state.phase==='break')&&speakerNear(state.shelter,state.player.x,state.player.y)){
    return {kind:'play_song',label:t(state.phase==='break'?'prompt_play_song_again':'prompt_play_song')};
  }
  return contextAction(state.interaction,state.shelter,state.player,state.salvage,t);
}
function useContext(){
  const action=currentAction();
  if(action.kind==='play_song'){startNextWave();return}
  const result=performContext(state.interaction,state.shelter,state.player,state.salvage,t);
  if(!result.message)return;
  if(result.ok){renderSalvage();syncPrepActions();sfx('trap')}
  alertStatus(t(result.message,result.vars||{}));
}
function reset(){
  sessionId++;
  // Input state is module-level and outlives a session on purpose (a key still physically held
  // should keep moving the player across a restart) — but `keydown`/`keyup` can legitimately
  // desync from the real keyboard state at the exact moment a session ends: the tab can lose focus
  // mid-death, or the terminal-screen click that triggers `reset()` can itself eat the keyup for
  // whatever was held a frame earlier. A stale `keys.w===true` surviving into the next session
  // move the fresh survivor before the player has touched anything, which reads as broken input,
  // not as "the old key is still down". Every restart now starts from a hard-cleared input state;
  // a key that is genuinely still held will re-assert itself on the very next keydown repeat.
  Object.keys(keys).forEach(k=>keys[k]=false);held.clear();mouse.down=false;
  // The track is cut on restart for the same reason the input state is cleared: a new attempt must start
  // from silence, or the horde of the fresh night would be pulled onto the house by music the player
  // switched on during the previous one. The element survives (see the top of the file); only the state
  // is reset, so the next M press starts the song from the top with no new gesture needed.
  stopSpeakers(speakers);
  // The shelter is rebuilt from scratch every session, so boards, damage and the roof state can never
  // leak from a previous attempt into a new one.
  const shelter=createShelter(scenario.house);
  state={
    // running from the first frame so WASD works in the yard before any wave is armed.
    running:true,phase:'idle',prep:0,elapsed:0,last:performance.now(),wave:0,pendingSpawns:0,spawnSide:0,recentWaveTypes:[],
    // Latched night→dawn grade. A new session is a hard cut back to night, not a transition, so this
    // starts at 0 in the fresh state object rather than being eased down from the previous attempt.
    dawnGrade:0,
    zombies:[],shots:[],noise:[],effects:[],residue:[],
    // Blood is per session: the yard must be clean again on a new attempt, and it holds its own caps
    blood:createBlood(),
    salvage:{...scenario.starting_salvage},unlocked:new Set([scenario.starting_weapon]),
    player:{...scenario.player,heat:0,failed:false,failureKind:null,cooldown:0,weapon:scenario.starting_weapon},
    // Present immediately in level one: autonomous, friendly and never selectable as a hostile target.
    ninjaAlly:{x:scenario.player.x-42,y:scenario.player.y+22,followOffsetX:-38,followOffsetY:24,faceAngle:0,attack:0,attackTimer:0,hitFlash:0,animTime:0,kills:0},
    // Joins only when the third wave is armed. Kept null before then so the early yard stays readable.
    secondDefender:null,
    shelter,
    // The yard is rebuilt with the shelter, so a car wrecked last night is whole again this night.
    // Positions derive from the shelter rectangle rather than hardcoded pixels, so props keep framing
    // the approaches if the house ever moves.
    destructibles:createDestructibles(scenario,shelter),
    // `house` stays as the damage/aggro proxy so every existing system keeps one shared source of truth
    house:shelter,
    interaction:createInteraction(),
    defenses:{reinforced:false},
    bossEncounter:{active:false,phase:0,flash:0,defeated:false},
    musicPhase:'verse',chorusFlash:0,chorusCount:0,
    kills:0
  };
  // Both status guards must clear, or the previous attempt's terminal rank would silence the new HUD
  statusHold=0;statusRank=0;renderLab();renderSalvage();
  setStatus(t('yard_quiet'));
  syncStartButton();syncPrepActions();draw();
}
function spawn(typeId){
  if(state.phase!=='wave')return;
  const type=zombieTypes.get(typeId);
  if(!type)return;
  // Rotate N→S→W→E so a 4-body wave actually uses the new yards, not four rolls of the same edge.
  const side=(state.spawnSide||0)%4;
  state.spawnSide=side+1;
  const pad=20;
  let x,y;
  if(side<2){x=Math.random()*WORLD.width;y=side?WORLD.height+pad:-pad}
  else{x=side===2?-pad:WORLD.width+pad;y=Math.random()*WORLD.height}
  const zombie={...type,x,y,hp:type.hp,attack:0};
  if(typeId==='big_russian_boss'){
    zombie.isBonusBoss=true;
    state.bossEncounter.active=true;
    state.bossEncounter.phase=0;
    state.bossEncounter.flash=1;
  }
  armTaunt(zombie);
  state.zombies.push(zombie);
  sfx('growl');
}
// Waves trickle in over time so a spawn burst never reads as a teleport. The balance harness needs the
// same wave composition without the wall-clock stagger, so it can flip this to an instant spawn.
let instantSpawn=false;
const ORDINARY_BOSS_IDS=new Set(['boss_zombie','big_russian_boss','injured_kuok']);
const FRIEND_ZOMBIE_IDS=new Set(['communist_nikita','tattooed_crowd_zombie','blonde_crowd_zombie','plaid_glasses_zombie','brunette_crowd_zombie','cat_keeper','dog_handler_zombie','vomiting_alexander','lilliput','lumberjack_zombie']);
function shuffle(items){const result=[...items];for(let i=result.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[result[i],result[j]]=[result[j],result[i]]}return result}
function buildWaveRoster(w){
  // Bosses are encounter-only. Friend identities are unique within a wave; generic archetypes fill any overflow.
  const allowed=w.types.filter(id=>!ORDINARY_BOSS_IDS.has(id));
  const recent=new Set(state.recentWaveTypes||[]);
  const bag=shuffle((allowed.filter(id=>!recent.has(id)).length?allowed.filter(id=>!recent.has(id)):allowed));
  const roster=[],usedFriends=new Set();
  for(const id of bag){if(roster.length>=w.count)break;if(!FRIEND_ZOMBIE_IDS.has(id)||!usedFriends.has(id)){roster.push(id);if(FRIEND_ZOMBIE_IDS.has(id))usedFriends.add(id)}}
  const generic=allowed.filter(id=>!FRIEND_ZOMBIE_IDS.has(id));
  const fallback=generic.length?generic:allowed;
  while(roster.length<w.count)roster.push(fallback[Math.floor(Math.random()*fallback.length)]);
  state.recentWaveTypes=roster.filter(id=>FRIEND_ZOMBIE_IDS.has(id));
  return shuffle(roster);
}
function spawnWave(w){
  const roster=buildWaveRoster(w);
  state.pendingSpawns=(state.pendingSpawns||0)+roster.length;
  if(instantSpawn){for(const type of roster){spawn(type);state.pendingSpawns=Math.max(0,state.pendingSpawns-1)}return}
  const activeSession=sessionId;roster.forEach((type,i)=>setTimeout(()=>{if(activeSession===sessionId){spawn(type);state.pendingSpawns=Math.max(0,(state.pendingSpawns||1)-1)}},i*140));
}
function triggerBossPhases(){
  const encounter=state.bossEncounter;
  if(!encounter?.active||encounter.defeated)return;
  const boss=state.zombies.find(zombie=>zombie.id==='big_russian_boss'&&zombie.hp>0);
  if(!boss)return;
  const ratio=boss.hp/Math.max(1,zombieTypes.get('big_russian_boss')?.hp||boss.hp);
  while(encounter.phase<BOSS_PHASES.length&&ratio<=BOSS_PHASES[encounter.phase]){
    encounter.phase++;
    encounter.flash=1;
    for(const type of FRIEND_SUMMON_TYPES)spawn(type);
    addShake(8+encounter.phase*2,.65);
    sfx('backfire');
    alertStatus(t('boss_summons'));
  }
}
function startNextWave(){
  if(!state||state.wave>=scenario.waves.length){finish(true);return}
  const nextWave=scenario.waves[state.wave];
  state.phase='wave';
  state.elapsed=0;
  state.musicPhase='verse';state.chorusFlash=0;
  resetTaunts();
  if(nextWave.bonus){
    state.bossEncounter.active=true;
    state.bossEncounter.phase=0;
    state.bossEncounter.flash=1;
    addShake(12,.9);
    sfx('backfire');
  }
  spawnWave(nextWave);
  state.wave++;
  // Third armed wave is the escalation beat: the second defender enters beside the house, never at a map edge.
  if(state.wave===3&&!state.secondDefender){
    state.secondDefender={x:state.shelter.centerX+44,y:state.shelter.y+state.shelter.height+30,followOffsetX:38,followOffsetY:24,faceAngle:Math.PI,attack:0,attackTimer:0,hitFlash:0,animTime:0,kills:0};
    alertStatus('ПОДДЕРЖКА ПРИБЫЛА · ВТОРОЙ ЗАЩИТНИК');
  }
  audio.unlock?.();
  blareSpeakers(speakers);
  sfx('ui');
  syncStartButton();
  syncPrepActions();
  alertStatus(nextWave.bonus?t('bonus_incoming'):state.wave===1?t('night_started'):t('wave_incoming',{n:state.wave}));
}
function noise(x,y,radius){state.noise.push({x,y,radius,life:2});if(state.noise.length>12)state.noise.shift()}
function fire(){
  const p=state.player,w=weapons.get(p.weapon),s=weaponStats(w);
  if(!state.running||p.failed||p.cooldown>0)return;
  const beat=trackBeat(),liveChorus=state.phase==='wave'&&beat.chorus,songBlaster=w.id==='bone_sprayer';
  const rateBoost=liveChorus?(songBlaster?1.45:1.18):1;
  const damageBoost=liveChorus?(songBlaster?1.45:1.2):1;
  const heatScale=liveChorus?.76:1;
  p.cooldown=1/(s.fire_rate*rateBoost);
  p.heat=Math.min(s.heat_limit,p.heat+s.heat_per_shot*heatScale);
  let angle=Math.atan2(mouse.y-p.y,mouse.x-p.x);
  const risk=p.heat>s.heat_limit*.6?Math.min(.55,s.failure_rate*(p.heat/s.heat_limit)):0;
  if(Math.random()<risk){
    if(s.failure==='jam'){p.failed=true;p.failureKind='jam';p.failureFlash=.6;sfx('jam');alertStatus(t('weapon_jammed'));return}
    if(s.failure==='backfire'){angle+=Math.PI;p.failureFlash=.6;p.failureKind='backfire';state.effects.push({type:'backfire',x:p.x,y:p.y-3,angle,life:.34,maxLife:.34});sfx('backfire');addShake(5.5,.32);alertStatus(t('weapon_backfired'))}
    if(s.failure==='noise_spike'){noise(p.x,p.y,s.noise*2.5);p.failureFlash=.6;p.failureKind='noise_spike';state.effects.push({type:'scream',x:p.x,y:p.y-3,life:.7,maxLife:.7});sfx('noise_spike');alertStatus(t('weapon_noise_spike'))}
  }else sfx('stas_shot');
  addShake(Math.min(liveChorus?4.2:3.4,1+s.projectiles*.4+(liveChorus?.8:0)),liveChorus?.18:.14);
  const speed=songBlaster?(liveChorus?610:540):480,spread=s.spread*(liveChorus?.7:1);
  for(let i=0;i<s.projectiles;i++){
    const a=angle+(Math.random()-.5)*spread*2;
    state.shots.push({x:p.x,y:p.y,vx:Math.cos(a)*speed,vy:Math.sin(a)*speed,life:s.range/speed,damage:s.damage*damageBoost,weapon:w.id,chorus:liveChorus});
  }
  state.effects.push({type:songBlaster?'song_muzzle':'muzzle',x:p.x+Math.cos(angle)*40,y:p.y-3+Math.sin(angle)*40,angle,chorus:liveChorus,life:liveChorus?.16:.09,maxLife:liveChorus?.16:.09});
  p.attackTimer=.34;noise(p.x,p.y,s.noise*(liveChorus?1.2:1));
  if(p.heat>=s.heat_limit){p.failed=true;p.failureKind='overheat';p.failureFlash=.6;state.effects.push({type:'overheat',x:p.x,y:p.y-3,life:.5,maxLife:.5});sfx('jam');addShake(4,.26);alertStatus(t('weapon_overheated'))}
}
// A prop changing state is a GAME event, not a rendering one: it makes noise the horde can hear, it can
// pay out salvage, and a volatile barrel takes everything near it with it. All of that lives here rather
// than inside `destructibles.js`, which deliberately owns geometry and state and nothing else.
const BLAST_RADIUS=96,BLAST_DAMAGE=46;
function resolvePropBreak(result){
  // A prop coming apart is loud, and a total collapse is louder than a dent
  noise(result.x,result.y,result.state==='ruined'?110:60);
  sfx(result.state==='ruined'?'death':'impact');
  if(result.salvage){
    for(const [key,value] of Object.entries(result.salvage))state.salvage[key]=(state.salvage[key]||0)+value;
    renderSalvage();
  }
  if(result.state!=='ruined'||!result.volatile)return;
  // Barrel detonation. The blast is the reason to shoot a barrel at all, so it has to be worth doing:
  // it hurts every body in the radius, wrecks neighbouring props and screams loud enough to pull the
  // rest of the yard onto the crater.
  state.effects.push({type:'death',x:result.x,y:result.y,life:.5,maxLife:.5});
  noise(result.x,result.y,240);sfx('backfire');
  // A detonation is the loudest thing in the night, so it is also the biggest kick the camera takes
  addShake(9,.45);addHitStop(.07);
  for(const zombie of state.zombies){
    const distance=Math.hypot(zombie.x-result.x,zombie.y-result.y);
    if(distance>BLAST_RADIUS)continue;
    zombie.hp-=Math.round(BLAST_DAMAGE*(1-distance/BLAST_RADIUS));zombie.hitFlash=.2;
    gush(state.blood,zombie.x,zombie.y,zombie.radius*.7);
  }
  // Turrets are not immune to your own explosives. Parking a sentry next to a fuel barrel is a mistake
  // the game is allowed to punish.
  for(const turret of state.interaction.turrets){
    const distance=Math.hypot(turret.x-result.x,turret.y-result.y);
    if(distance<=BLAST_RADIUS)damageTurret(turret,Math.round(BLAST_DAMAGE*(1-distance/BLAST_RADIUS)));
  }
  // Chain reaction. This cannot loop forever: `damageProp` returns null for anything already ruined, so
  // a barrel that has gone off can never be re-detonated by its own neighbour.
  const neighbours=state.destructibles.props.filter(prop=>prop.state!=='ruined'&&Math.hypot(prop.x-result.x,prop.y-result.y)<=BLAST_RADIUS);
  for(const prop of neighbours){
    const chained=damageProp(state.destructibles,prop,BLAST_DAMAGE);
    if(chained)resolvePropBreak(chained);
  }
}
function updateNinjaAlly(dt){
  // `activeAlly` lets the second defender use the exact same safe support AI and tuning.
  const ally=state.activeAlly||state.ninjaAlly;if(!ally)return;
  ally.attack=Math.max(0,ally.attack-dt);ally.attackTimer=Math.max(0,ally.attackTimer-dt);ally.animTime+=dt;
  const shelter=state.shelter,leash=NINJA_ALLY.houseLeash;
  const patrol={minX:shelter.x-leash,maxX:shelter.x+shelter.width+leash,minY:shelter.y-leash,maxY:shelter.y+shelter.height+leash};
  const inPatrol=entity=>entity.x>=patrol.minX&&entity.x<=patrol.maxX&&entity.y>=patrol.minY&&entity.y<=patrol.maxY;
  const live=state.phase==='wave';
  if(ally.killWave!==state.wave){ally.killWave=state.wave;ally.waveKills=0}
  // He protects the house instead of hunting bodies across the whole map. After one solo kill in a
  // wave he may soften further targets to 1 HP, but Stas must finish them.
  const target=live?state.zombies.filter(z=>z.hp>0&&inPatrol(z)&&(ally.waveKills<NINJA_ALLY.maxSoloKillsPerWave||z.hp>1)).sort((a,b)=>Math.hypot(a.x-ally.x,a.y-ally.y)-Math.hypot(b.x-ally.x,b.y-ally.y))[0]:null;
  const followStas=inPatrol(state.player);
  // A fixed two-person formation stops the defender and ninja occupying the same pixel and hiding labels.
  let tx=target?.x??(followStas?state.player.x+(ally.followOffsetX??-38):shelter.centerX),ty=target?.y??(followStas?state.player.y+(ally.followOffsetY??24):shelter.y+shelter.height+32);
  // Route through the south doorway instead of trying to phase through a shelter wall.
  const allyInside=isInsideShelter(shelter,ally.x,ally.y),targetInside=isInsideShelter(shelter,tx,ty);
  if(allyInside!==targetInside){tx=shelter.centerX;ty=shelter.y+shelter.height+18}
  const dx=tx-ally.x,dy=ty-ally.y,distance=Math.hypot(dx,dy)||1;
  const stop=target&&allyInside===targetInside?NINJA_ALLY.range:NINJA_ALLY.followDistance;
  ally.moving=false;
  if(distance>stop){
    ally.x+=dx/distance*NINJA_ALLY.speed*dt;ally.y+=dy/distance*NINJA_ALLY.speed*dt;ally.faceAngle=Math.atan2(dy,dx);ally.moving=true;
    collideShelter(shelter,ally,NINJA_ALLY.radius*.7);
  }
  // Hard leash prevents accumulated steering/collision drift from taking him outside his guard zone.
  ally.x=Math.max(patrol.minX,Math.min(patrol.maxX,ally.x));ally.y=Math.max(patrol.minY,Math.min(patrol.maxY,ally.y));
  if(!target||allyInside!==targetInside||Math.hypot(target.x-ally.x,target.y-ally.y)>NINJA_ALLY.range||ally.attack>0)return;
  const chorus=trackBeat().chorus,damage=NINJA_ALLY.damage*(chorus?1.25:1),wasAlive=target.hp>0;
  const mayFinish=ally.waveKills<NINJA_ALLY.maxSoloKillsPerWave;
  const appliedDamage=mayFinish?damage:Math.min(damage,Math.max(0,target.hp-1));
  target.hp-=appliedDamage;target.hitFlash=.14;ally.attack=NINJA_ALLY.attackInterval;ally.attackTimer=.28;ally.faceAngle=Math.atan2(target.y-ally.y,target.x-ally.x);
  state.effects.push({type:'ninja_kick',x:target.x,y:target.y,angle:ally.faceAngle,life:.28,maxLife:.28});
  spurt(state.blood,target.x,target.y,ally.faceAngle,Math.min(1.45,appliedDamage/18));sfx('impact');addShake(chorus?2.6:1.5,.13);
  if(wasAlive&&target.hp<=0){ally.kills++;ally.waveKills++}
}
if(DEV_MODE){
  window.__zombieAnimationDebug=()=>state?.zombies.map(z=>({id:z.id,x:z.x,y:z.y,hp:z.hp,animAction:z.animAction,animTime:z.animTime||0,attack:z.attack||0}));
  window.__spawnZombieAnimationProbe=(id='brunette_crowd_zombie',distance='near')=>{
    state.phase='wave';
    spawn(id);
    const zombie=state.zombies.at(-1);
    if(zombie){zombie.x=state.shelter.centerX;zombie.y=state.shelter.y-(distance==='far'?220:56);}
    return window.__zombieAnimationDebug();
  };
}
if(DEV_MODE)window.__ninjaDebug=()=>{
  const ally=state?.ninjaAlly,shelter=state?.shelter;if(!ally||!shelter)return null;
  const leash=NINJA_ALLY.houseLeash,patrol={minX:shelter.x-leash,maxX:shelter.x+shelter.width+leash,minY:shelter.y-leash,maxY:shelter.y+shelter.height+leash};
  return {tuning:{...NINJA_ALLY},phase:state.phase,ally:{x:ally.x,y:ally.y,attack:ally.attack,attackTimer:ally.attackTimer,kills:ally.kills,waveKills:ally.waveKills||0,killWave:ally.killWave},player:{x:state.player.x,y:state.player.y},patrol,zombies:state.zombies.map(z=>({id:z.id,x:z.x,y:z.y,hp:z.hp,insidePatrol:z.x>=patrol.minX&&z.x<=patrol.maxX&&z.y>=patrol.minY&&z.y<=patrol.maxY}))};
};
if(DEV_MODE)window.__secondDefenderDebug=(spawn=false)=>{
  if(spawn&&!state.secondDefender)state.secondDefender={x:state.shelter.centerX+44,y:state.shelter.y+state.shelter.height+30,followOffsetX:38,followOffsetY:24,faceAngle:Math.PI,attack:0,attackTimer:0,hitFlash:0,animTime:0,kills:0};
  const ally=state?.secondDefender,shelter=state?.shelter;if(!ally||!shelter)return null;
  const leash=SECOND_DEFENDER_ALLY.houseLeash;
  return {tuning:{...SECOND_DEFENDER_ALLY},ally:{x:ally.x,y:ally.y,kills:ally.kills,attackTimer:ally.attackTimer},patrol:{minX:shelter.x-leash,maxX:shelter.x+shelter.width+leash,minY:shelter.y-leash,maxY:shelter.y+shelter.height+leash}};
};
if(DEV_MODE)window.__startThirdWaveProbe=()=>{
  if(state.phase==='wave')state.zombies.length=0;
  state.wave=2;state.phase='break';startNextWave();
  return window.__secondDefenderDebug?.();
};
function update(dt){
  if(haterRaid?.active){
    const dx=(held.has('KeyD')||held.has('ArrowRight')?1:0)-(held.has('KeyA')||held.has('ArrowLeft')?1:0)+stick.dx;
    const dy=(held.has('KeyS')||held.has('ArrowDown')?1:0)-(held.has('KeyW')||held.has('ArrowUp')?1:0)+stick.dy;
    updateHaterRaid(haterRaid,dt,{dx,dy},WORLD,(entity,radius)=>collideShelter(state.shelter,entity,radius),advanceAnimation);
    haterRaid.player.inside=isInsideShelter(state.shelter,haterRaid.player.x,haterRaid.player.y);
    // Hater Raid returns before the regular game update, so its speaker mix and impact queue live here.
    updateSpeakers(speakers,dt,state.shelter,haterRaid.player,null);
    for(const event of haterRaid.audioEvents?.splice(0)??[])sfx(event);
    mouse.x=haterRaid.player.x;mouse.y=haterRaid.player.y;
    state.player.x=haterRaid.stas.x;state.player.y=haterRaid.stas.y;state.player.attackTimer=haterRaid.stas.attackTimer;
    advanceAnimation(state.player,haterRaid.stas.attackTimer>0?'attack':'idle',dt);
    if(mouse.down&&attackRaidSpeaker(haterRaid)){addShake(3,.16)}
    if(haterRaid.phase==='won'){setStatus('КОЛОНКА РАЗНЕСЕНА · ХЕЙТЕРЫ ПОБЕДИЛИ',3600);showGameResult('zombie-victory')}
    else if(haterRaid.phase==='lost'){setStatus('СТАС ОТСТРЕЛЯЛСЯ · ХЕЙТ НЕ ПРОШЁЛ',3600);showGameResult('zombie-defeat')}
    else setStatus(`ХЕЙТЕРСКИЙ РЕЙД · ЗОМБИ ${Math.ceil(haterRaid.player.hp)} HP · КОЛОНКА ${Math.ceil(haterRaid.speaker.hp)} HP · ХЕЙТ ${haterRaid.provocation}%`);
    return;
  }
  const p=state.player;
  p.cooldown=Math.max(0,p.cooldown-dt);
  p.heat=Math.max(0,p.heat-dt*15);
  const dx=(held.has('KeyD')||held.has('ArrowRight')?1:0)-(held.has('KeyA')||held.has('ArrowLeft')?1:0)+stick.dx;
  const dy=(held.has('KeyS')||held.has('ArrowDown')?1:0)-(held.has('KeyW')||held.has('ArrowUp')?1:0)+stick.dy;
  const magnitude=Math.hypot(dx,dy)||1;
  p.x=Math.max(24,Math.min(WORLD.width-24,p.x+dx/magnitude*p.speed*dt));
  p.y=Math.max(24,Math.min(WORLD.height-24,p.y+dy/magnitude*p.speed*dt));
  // Walls are solid; the doorway is the only way through. Resolved after the move so the survivor
  // slides along a wall instead of sticking to it.
  collideShelter(state.shelter,p,13);
  p.inside=isInsideShelter(state.shelter,p.x,p.y);
  updateInteraction(state.interaction,dt);
  p.attackTimer=Math.max(0,(p.attackTimer||0)-dt);
  // Short red flash on any weapon failure, so a backfire or noise spike is visible on the survivor too
  p.failureFlash=Math.max(0,(p.failureFlash||0)-dt);
  advanceAnimation(p,p.attackTimer>0?'attack':(dx||dy)?'walk':'idle',dt);
  // Speakers always pulse. Noise lure only during a live wave — otherwise the rings are just the joke.
  updateSpeakers(speakers,dt,state.shelter,p,state.phase==='wave'?noise:null);
  state.activeAlly=state.ninjaAlly;updateNinjaAlly(dt);
  if(state.secondDefender){state.activeAlly=state.secondDefender;updateNinjaAlly(dt)}
  state.activeAlly=null;
  if(state.phase==='idle'||state.phase==='break'){
    updateDestructibles(state.destructibles,dt);
    for(const effect of state.effects)effect.life-=dt;
    state.effects=state.effects.filter(effect=>effect.life>0);
    for(const shot of state.shots){shot.x+=shot.vx*dt;shot.y+=shot.vy*dt;shot.life-=dt}
    // Cover is a decision before the song too — a barrel shot in the yard has to actually break.
    for(const shot of state.shots){
      if(shot.life<=0)continue;
      const prop=blocksShot(state.destructibles,shot.x,shot.y);
      if(!prop)continue;
      shot.life=0;
      state.effects.push({type:'impact',x:shot.x,y:shot.y,life:.16,maxLife:.16});sfx('impact');
      const broke=damageProp(state.destructibles,prop,shot.damage);
      if(broke)resolvePropBreak(broke);
    }
    state.shots=state.shots.filter(shot=>shot.life>0);
    if(mouse.down)fire();
    return;
  }
  if(state.phase!=='wave')return;
  if(mouse.down)fire();
  state.elapsed+=dt;
  const beat=trackBeat();
  state.chorusFlash=Math.max(0,(state.chorusFlash||0)-dt);
  if(beat.phase!==state.musicPhase){
    state.musicPhase=beat.phase;
    if(beat.chorus){
      state.chorusCount=(state.chorusCount||0)+1;state.chorusFlash=1;
      const source=speakerPosition(state.shelter);
      state.effects.push({type:'chorus',x:source.x,y:source.y,life:1.1,maxLife:1.1});
      addShake(5,.42);sfx('ui');alertStatus(t('chorus_hit'));
    }
  }
  for(const n of state.noise)n.life-=dt;
  state.noise=state.noise.filter(n=>n.life>0);
  for(const effect of state.effects)effect.life-=dt;
  state.effects=state.effects.filter(effect=>effect.life>0);
  for(const mark of state.residue)mark.life-=dt;
  state.residue=state.residue.filter(mark=>mark.life>0);
  // Debris and hit flashes keep settling regardless of whether anything is shooting at the props
  updateDestructibles(state.destructibles,dt);
  // Turrets fight on their own. Their shots are pushed into the same list the player's weapon fills, so
  // the projectile loop below resolves them against bodies and props with no special case at all.
  const turretShots=updateTurrets(state.interaction.turrets,dt,state.zombies,(x,y)=>isInsideShelter(state.shelter,x,y),noise);
  if(turretShots.length){for(const shot of turretShots)state.shots.push(shot);sfx('shot')}
  for(const shot of state.shots){shot.x+=shot.vx*dt;shot.y+=shot.vy*dt;shot.life-=dt}
  for(const zombie of state.zombies){
    // The horde walks to the nearest point of the actual outer wall, so bodies spread along the facade
    // they arrived at instead of collapsing onto one radius.
    const wall=nearestWallPoint(state.shelter,zombie.x,zombie.y);
    let target=wall;
    const heard=[...state.noise].reverse().find(n=>Math.hypot(zombie.x-n.x,zombie.y-n.y)<n.radius);
    if(heard)target=heard;
    const angle=Math.atan2(target.y-zombie.y,target.x-zombie.x);
    const reach=zombie.radius+4,atShelter=wall.distance<=reach;
    if(!atShelter||heard){zombie.x+=Math.cos(angle)*zombie.speed*dt;zombie.y+=Math.sin(angle)*zombie.speed*dt}
    // Bodies cannot walk through the walls either: they mass at the facade and in the doorway
    collideShelter(state.shelter,zombie,zombie.radius*.7);
    zombie.attack-=dt;zombie.hitFlash=Math.max(0,(zombie.hitFlash||0)-dt);zombie.faceAngle=angle;
    // A body below half health drips as it walks. Throttled per zombie rather than per frame, otherwise
    // a wounded horde produced hundreds of stains a second and the pool cap ate the death pools.
    const kind=zombieTypes.get(zombie.id);
    if(kind&&zombie.hp<kind.hp*.5){
      zombie.dripTimer=(zombie.dripTimer||0)-dt;
      if(zombie.dripTimer<=0){zombie.dripTimer=.22+Math.random()*.2;dripTrail(state.blood,zombie.x,zombie.y+zombie.radius*.5)}
    }
    advanceAnimation(zombie,zombie.attack>.55?'attack':atShelter?'idle':'walk',dt);
    // Carried traps: whichever one this body walked into fires and burns a charge
    const sprung=triggerTraps(state.interaction,zombie);
    if(sprung){noise(sprung.x,sprung.y,90);sfx('trap');syncPrepActions()}
    // A working turret in reach is attacked instead of the house. Bodies going for the machine that is
    // shooting them is what makes turret placement a decision: put it in the open and it gets eaten.
    const machine=turretNear(state.interaction.turrets,zombie.x,zombie.y,zombie.radius+6);
    if(machine&&!machine.destroyed&&zombie.attack<=0){
      zombie.attack=zombie.attack_interval||1.6;
      if(damageTurret(machine,zombie.damage)){alertStatus(t('turret_wrecked',{name:turretStats(machine).name}));sfx('death')}
    }
    // Standing props are also chewed through: cover that never breaks would let the player park behind
    // the car all night. A prop that is already rubble is skipped by `propAt`, so it stops being a wall.
    const obstacle=propAt(state.destructibles,zombie.x,zombie.y,zombie.radius*.6);
    if(obstacle&&zombie.attack<=0){
      zombie.attack=zombie.attack_interval||1.6;
      const broke=damageProp(state.destructibles,obstacle,zombie.damage);
      if(broke)resolvePropBreak(broke);
    }
    // Attack cadence comes from the zombie data, so a Runner scratches fast and a Spitter lands slow
    // heavy hits. A flat one-second swing for everybody was why the very first wave alone flattened the
    // house in twenty seconds: seven Drifters were dealing 49 damage per second to a 500 point building.
    if(atShelter&&zombie.attack<=0){
      const hit=damageShelter(state.shelter,wall,zombie.damage,{reinforced:state.defenses.reinforced});
      zombie.attack=zombie.attack_interval||1.6;
      sfx('house_hit');
      if(Math.random()<.35)sfx('growl');
      if(hit.splintered)alertStatus(t('plank_tore_off'));
    }
  }
  updateTaunts(state.zombies,state.shelter,dt);
  for(const shot of state.shots){
    if(shot.life<=0)continue;
    const hit=state.zombies.find(zombie=>zombie.hp>0&&Math.hypot(zombie.x-shot.x,zombie.y-shot.y)<zombie.radius+3);
    if(hit){
      hit.hp-=shot.damage;hit.hitFlash=.11;shot.life=0;
      state.effects.push({type:'impact',x:shot.x,y:shot.y,life:.16,maxLife:.16});sfx('impact');
      // Blood is thrown along the shot, not away from the body: a hit from behind sprays forwards, which
      // is the cue that tells the player which of the two overlapping bodies they actually hit.
      const angle=Math.atan2(shot.vy,shot.vx),power=Math.min(2.4,shot.damage/9);
      spurt(state.blood,shot.x,shot.y,angle,power);
      // Pressed against the facade? Then the wall behind it gets painted as well.
      const wall=nearestWallPoint(state.shelter,hit.x,hit.y);
      if(wall.distance<hit.radius+10)splatterWall(state.blood,wall.x,wall.y,angle,power);
      continue;
    }
    // Nothing hit? Then a standing prop may have eaten the shot. Cover works for both sides: the horde
    // shelters behind the wrecked car exactly as much as the player does, and either can shoot it apart.
    const prop=blocksShot(state.destructibles,shot.x,shot.y);
    if(!prop)continue;
    shot.life=0;
    state.effects.push({type:'impact',x:shot.x,y:shot.y,life:.16,maxLife:.16});sfx('impact');
    const broke=damageProp(state.destructibles,prop,shot.damage);
    if(broke)resolvePropBreak(broke);
  }
  state.shots=state.shots.filter(shot=>shot.life>0);
  // Phase thresholds are evaluated after every source of damage (weapon, turret, trap or explosion)
  // and before dead bodies are removed, so 75/50/25% cannot be skipped by a high-damage frame.
  triggerBossPhases();
  if(state.bossEncounter)state.bossEncounter.flash=Math.max(0,state.bossEncounter.flash-dt);
  const dead=state.zombies.filter(zombie=>zombie.hp<=0);
  for(const zombie of dead){
    state.kills++;
    if(zombie.id==='big_russian_boss'){
      state.bossEncounter.defeated=true;
      state.bossEncounter.active=false;
      state.bossEncounter.flash=1;
      addShake(16,1.1);addHitStop(.12);
      alertStatus(t('boss_defeated'));
    }
    gush(state.blood,zombie.x,zombie.y,zombie.radius);state.residue.push({x:zombie.x,y:zombie.y,size:zombie.radius*(1.7+Math.random()*.5),life:12,maxLife:12});state.effects.push({type:'death',x:zombie.x,y:zombie.y,life:.45,maxLife:.45});for(const [key,value] of Object.entries(zombie.drop||{}))state.salvage[key]=(state.salvage[key]||0)+value
  }
  // A kill lands as a thump: three-ish frames of frozen simulation plus a small kick. The stop is per
  // BATCH, not per body, so a shotgun blast clearing four drifters reads as one heavy beat, not a stutter.
  if(dead.length){renderSalvage();sfx('death');addHitStop(.055);addShake(2.6,.18)}
  state.zombies=state.zombies.filter(zombie=>zombie.hp>0);
  if(state.house.hp<=0||p.hp<=0){finish(false);return}
  if(state.zombies.length===0&&(state.pendingSpawns||0)===0){
    if(state.wave>=scenario.waves.length){finish(true);return}
    state.phase='break';
    state.noise=[];
    stopSpeakers(speakers);
    syncStartButton();
    syncPrepActions();
    alertStatus(t('wave_cleared'));
    setStatus(t('hud_break'));
    return;
  }
  const limit=weaponStats(weapons.get(p.weapon)).heat_limit;
  const heatRead=`${Math.ceil(p.heat)}/${limit}${p.failed?' · '+t(p.failureKind==='overheat'?'heat_overheated':'heat_jammed'):''}`;
  setStatus(`${t('hud_wave',{arrived:state.wave,total:scenario.waves.length})} · ${t('house')} ${Math.max(0,Math.ceil(state.house.hp))} · ${t('heat')} ${heatRead} · ${t('kills')} ${state.kills}`);
}
// Terminal messages outrank every other alert and stay until the next session starts
function finish(win){state.running=false;state.phase=win?'survived':'lost';syncStartButton();syncPrepActions();setStatus(win?t('night_survived'):t('house_lost'),3600);showGameResult(win?'stas-victory':'stas-defeat')}
// Interior layer: floor, dividers and furniture. Drawn before the entities, hidden afterwards by the
// roof mask whenever the survivor is outside and not lined up with a window.
// Texture hooks handed to the shelter renderer. Each one returns silently when its PNG is absent, so
// the procedural drawing stays the fallback and no code path depends on an asset existing.
// The generated artwork is a top-down CUTAWAY: floor, room dividers and furniture are already painted
// into it, so it belongs to the interior layer. Handing it to the roof instead made the interior
// permanently visible from the yard and silently disabled the entire window-peek occlusion.
const shelterTextures={
  interior:(target,shelter)=>drawShelterSprite(target,environment,shelter.x,shelter.y,shelter.width,shelter.height),
  // The roof was the LAST procedural surface left in the frame, and it was the single most visible
  // defect in it: a near-black gradient slab covering the whole 272×200 footprint with bright evenly
  // spaced tile courses stroked across it. Read literally, that is "a black rectangle with white
  // stripes lying on top of the house" — which is exactly what it looked like. It also could not be
  // fixed by tuning, because the slab is ALPHA-FADED as the survivor walks in and a fading fill loses
  // its dark tone faster than its bright lines, so the stripes always survived last.
  roof:(target,footprint)=>drawRoofSprite(target,environment,footprint.x,footprint.y,footprint.w,footprint.h)
};
function drawShelterFloor(){
  const shelter=state.shelter;
  const dawn=nightProgress();
  drawShelterInterior(ctx,shelter,shelterTextures);
  drawSpeakers(ctx,speakers,shelter,{hot:(state.phase==='idle'||state.phase==='break')&&speakerNear(shelter,state.player.x,state.player.y)});
  // The interior has its OWN bounded light buffer, composited here, before the walls and the roof mask.
  // It cannot share the scene buffer: that one is composited after the roof, and light for the inside of
  // the building added after the roof mask would shine straight through the roof when seen from the yard.
  // Both the lamp pool and the window shafts accumulate here, so the two of them together can never sum
  // past INTERIOR_EXPOSURE — which is the whole fix for the blown-white room.
  const interior=(GFX.interiorLight||GFX.veils)?beginLightPass(WORLD.width,WORLD.height,'interior'):null;
  if(interior&&GFX.interiorLight)drawInteriorLight(interior,shelter,1-dawn*.35);
  // Light coming IN through the openings, plus the gloom it is fighting. The gloom is a multiply and
  // stays on the frame; only the additive shafts go to the buffer. Drawn over the floor and the
  // furniture but under the entities, so the survivor walks THROUGH the shafts instead of under them.
  // The lamp term falls off as the sun rises: at night these are streetlamp bleed, by morning daylight.
  if(GFX.veils)drawWindowVeils(ctx,shelter,state.player,dawn,1-dawn*.6,interior);
  if(interior)endLightPass(ctx,INTERIOR_EXPOSURE,'interior');
}
// Shelter health bar and damage read, drawn above the walls so it survives every mask pass.
function drawShelterStatus(){
  const shelter=state.shelter,hp=Math.max(0,Math.min(1,shelter.hp/shelter.maxHp));
  const x=shelter.x,y=shelter.y,w=shelter.width;
  ctx.save();
  ctx.strokeStyle=hp<.35?'#8f3428':'#aaa18b';ctx.lineWidth=4;
  ctx.beginPath();ctx.moveTo(x,y-17);ctx.lineTo(x+w*hp,y-17);ctx.stroke();
  ctx.fillStyle='#b6ad97';ctx.font='11px Chivo Mono';
  const boards=totalBoards(shelter);
  ctx.fillText(`${t('hud_shelter')} ${Math.ceil(shelter.hp)}${boards?` · ${boards} ${t('hud_planks')}`:''}`,x,y-23);
  ctx.restore();
}

function drawNinjaAlly(){
  if(!state.ninjaAlly||haterRaid?.active)return;
  const ally=state.ninjaAlly,size=86,kicking=ally.attackTimer>0;
  const action=kicking?'kick':ally.moving?'run':'idle';
  const direction=directionCell(ally.faceAngle||0),sheet=ninjaAnimationSheet(action,direction);
  const frame=Math.floor(ally.animTime*(kicking?ANIM_FPS.attack:action==='run'?ANIM_FPS.walk:ANIM_FPS.idle))%ANIM_FRAMES;
  const sx=(frame%ANIM_COLS)*ANIM_TILE,sy=Math.floor(frame/ANIM_COLS)*ANIM_TILE;
  const scale=size/ANIM_TILE,dx=ally.x-size/2,dy=ally.y+size*.38-ANIM_ANCHOR_Y*scale;
  ctx.save();ctx.globalAlpha=.24;ctx.fillStyle='#62c8dc';ctx.beginPath();ctx.ellipse(ally.x,ally.y+5,24,10,0,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;
  if(sheet.complete&&sheet.naturalWidth){
    ctx.shadowColor='#071113cc';ctx.shadowBlur=3;ctx.drawImage(sheet,sx,sy,ANIM_TILE,ANIM_TILE,dx,dy,size,size);ctx.shadowBlur=0;
  }else if(ninjaAllySprite.complete&&ninjaAllySprite.naturalWidth){
    ctx.shadowColor='#071113cc';ctx.shadowBlur=8;ctx.drawImage(ninjaAllySprite,dx,dy,size,size);ctx.shadowBlur=0;
  }else{ctx.fillStyle='#24333a';ctx.beginPath();ctx.arc(ally.x,ally.y-18,11,0,Math.PI*2);ctx.fill();ctx.fillRect(ally.x-9,ally.y-8,18,31)}
  ctx.restore();
  if(kicking){ctx.save();ctx.globalAlpha=Math.min(1,ally.attackTimer*4);ctx.strokeStyle='#83f2ff';ctx.lineWidth=4;ctx.beginPath();ctx.arc(ally.x,ally.y-22,36,-1.15,2.25);ctx.stroke();ctx.strokeStyle='#ffffff';ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(ally.x,ally.y-22,29,-.8,1.8);ctx.stroke();ctx.restore()}
  // Marker sits below the feet: labels above a defender are masked by the house roof when they guard a window.
  ctx.save();ctx.textAlign='center';ctx.font='bold 9px "Chivo Mono",monospace';ctx.fillStyle='#9fe8f1';ctx.fillText('СОЮЗНИК · НИНДЗЯ',ally.x,ally.y+size*.56);ctx.restore();
}
function drawRaidFence(){
  if(!haterRaid?.active||!haterRaid.fence)return;
  const fence=haterRaid.fence;
  const sections=fence.sections||[{left:fence.x-fence.width/2,right:fence.x+fence.width/2,hp:fence.hp,maxHp:fence.maxHp,hitFlash:fence.hitFlash}];
  ctx.save();
  for(const section of sections){
    const width=section.right-section.left,ratio=Math.max(0,section.hp/section.maxHp);
    if(section.hp>0){
      if(!drawFenceTextureRow(ctx,environment,section.left,fence.y-46,width,52)){
        ctx.strokeStyle='#66553d';ctx.lineWidth=5;
        for(let x=section.left+10;x<section.right;x+=24){ctx.beginPath();ctx.moveTo(x,fence.y+4);ctx.lineTo(x+((x/24)%2?4:-4),fence.y-40);ctx.stroke()}
        ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(section.left,fence.y-12);ctx.lineTo(section.right,fence.y-16);ctx.stroke();
      }
      if(ratio<.67){ctx.fillStyle=`rgba(39,20,14,${.12+(1-ratio)*.32})`;ctx.fillRect(section.left,fence.y-46,width,50)}
      if(section.hitFlash>0){ctx.fillStyle='rgba(255,226,170,.28)';ctx.fillRect(section.left,fence.y-48,width,54)}
      if(ratio<.35){ctx.strokeStyle='#2a1812';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(section.left+width*.25,fence.y-42);ctx.lineTo(section.left+width*.55,fence.y-18);ctx.lineTo(section.left+width*.4,fence.y+2);ctx.stroke()}
    }else{
      ctx.fillStyle='rgba(70,52,35,.78)';
      ctx.fillRect(section.left+5,fence.y-4,width*.38,6);ctx.fillRect(section.left+width*.55,fence.y-2,width*.32,5);
    }
  }
  const ratio=Math.max(0,fence.hp/fence.maxHp);
  ctx.fillStyle='rgba(10,10,8,.82)';ctx.fillRect(fence.x-58,fence.y-62,116,15);
  ctx.fillStyle='#211d18';ctx.fillRect(fence.x-52,fence.y-57,104,5);
  ctx.fillStyle=ratio<.35?'#b44737':'#947348';ctx.fillRect(fence.x-52,fence.y-57,104*ratio,5);
  ctx.font='bold 9px "Chivo Mono",monospace';ctx.textAlign='center';ctx.fillStyle='#e6dfcb';ctx.fillText(`ЗАБОР ${sections.filter(section=>section.hp>0).length}/${sections.length}`,fence.x,fence.y-65);ctx.textAlign='start';
  ctx.restore();
}
function drawSecondDefender(){
  if(!state.secondDefender||haterRaid?.active)return;
  const ally=state.secondDefender,size=82;
  ctx.save();ctx.globalAlpha=.23;ctx.fillStyle='#62c8dc';ctx.beginPath();ctx.ellipse(ally.x,ally.y+5,23,9,0,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;
  if(secondDefenderSprite.complete&&secondDefenderSprite.naturalWidth){
    ctx.shadowColor='#071113cc';ctx.shadowBlur=3;ctx.drawImage(secondDefenderSprite,ally.x-size/2,ally.y-size*.92,size,size);ctx.shadowBlur=0;
  }else{ctx.fillStyle='#29404a';ctx.beginPath();ctx.arc(ally.x,ally.y-18,11,0,Math.PI*2);ctx.fill();ctx.fillRect(ally.x-9,ally.y-8,18,31)}
  ctx.restore();
  ctx.save();ctx.textAlign='center';ctx.font='bold 9px "Chivo Mono",monospace';ctx.fillStyle='#9fe8f1';ctx.fillText('СОЮЗНИК · ПОДДЕРЖКА',ally.x,ally.y+size*.56);ctx.restore();
}
function reelFocus(){
  if(!state)return {x:WORLD.width/2,y:WORLD.height/2};
  const s=state.shelter,p=state.player;
  return {x:s.centerX*.72+p.x*.28,y:s.centerY};
}
function draw(){
  // The frame transform carries DPR and the shake offset together: every draw call below stays in
  // 960×600 world coordinates and still lands on a crisp retina backing store. It lives HERE rather
  // than in loop() because reset() calls draw() directly for the idle frame, which would otherwise
  // render one identity-transform frame at half size in the corner of a retina canvas.
  // Reel mode keeps those same world coords and only slides a 9:16 window across them.
  const [shakeX,shakeY]=shakeOffset(performance.now());
  beginReelFrame(ctx,DPR,WORLD,reelFocus(),[shakeX,shakeY]);
  ctx.fillStyle='#0a0b09';ctx.fillRect(0,0,WORLD.width,WORLD.height);
  drawEnvironmentGround(ctx,environment);
  // Hard shadow cast by the building itself: the single cheapest thing that turns the flat grey yard
  // into a lit scene with a direction.
  drawCastShadows(ctx,state.shelter,environment.config.lamps||[],nightProgress());
  // Lamp posts are scenery: drawn before entities so a survivor walking past a pole passes in front of it
  drawLampPosts(ctx,environment);
  // Scavenged stakes along the four walls: they mark where the horde has to stop, without the old
  // dashed rings that made the defence read as a diagram instead of a yard.
  drawShelterBarricades(ctx,environment,state.shelter,state.defenses);
  // Hater Raid inserts one readable destructible lane between spawn and house using the existing fence art.
  drawRaidFence();
  // Yard props: the wrecked car, the fuel barrels, the crates and the fence. Drawn before the entities
  // so anybody walking past passes IN FRONT of them, and handed the environment's sprite hook so each
  // prop paints its photographic cutout for its current state and falls back to the procedural shape.
  drawDestructibles(ctx,state.destructibles,(target,kind,propState,width,height)=>drawDestructibleSprite(target,environment,kind,propState,width,height));
  for(const mark of state.residue){ctx.save();ctx.globalAlpha=Math.min(.42,mark.life/mark.maxLife*.42);ctx.fillStyle='#351b18';ctx.beginPath();ctx.ellipse(mark.x,mark.y+5,mark.size,mark.size*.42,-.2,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#141411';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(mark.x-mark.size*.8,mark.y+3);ctx.lineTo(mark.x+mark.size*.65,mark.y+8);ctx.stroke();ctx.restore()}
  // Pools go straight onto the ground, under everything else. They are the longest-lived layer in the
  // frame: by the end of a night the yard in front of the door should be visibly darker than the rest.
  drawBloodGround(ctx,state.blood);
  // The building is drawn as three separate layers around the entities: floor first, walls above the
  // entities so the silhouette is always solid, and the roof mask last of all.
  drawShelterFloor();
  drawTraps(ctx,state.interaction,(target,x,y,size)=>drawTrapSprite(target,environment,x,y,size));
  // Turrets are placed objects like traps, but they are taller: drawn after the traps and before the
  // entities, with their firing arc shown only while they still work.
  drawTurrets(ctx,state.interaction.turrets);
  drawPlacementGhost(ctx,state.interaction,state.shelter,state.player,mouse,t);
  for(const n of state.noise){
    // Speaker lure is a 900px radius — drawing it as a hard ring is the other half of the strobe.
    // The dedicated speaker waves already show that sound. Only local cues (shots, traps) stay.
    if(n.radius>280)continue;
    ctx.strokeStyle=`rgba(218,211,190,${n.life/6})`;ctx.lineWidth=1.4;ctx.beginPath();ctx.arc(n.x,n.y,n.radius*(1-n.life/2),0,Math.PI*2);ctx.stroke();
  }
  for(const b of [...state.shots,...(haterRaid?.shots||[])]){
    const speed=Math.hypot(b.vx,b.vy)||1,dx=b.vx/speed,dy=b.vy/speed;
    ctx.save();ctx.globalCompositeOperation=b.weapon==='bone_sprayer'?'lighter':'source-over';
    ctx.strokeStyle=b.weapon==='bone_sprayer'?(b.chorus?'#bdf7ff':'#64c9d4'):'#d5bf77cc';ctx.lineWidth=b.chorus?3.2:2;
    ctx.beginPath();ctx.moveTo(b.x-dx*(b.chorus?21:12),b.y-dy*(b.chorus?21:12));ctx.lineTo(b.x,b.y);ctx.stroke();
    if(b.weapon==='bone_sprayer'){
      ctx.globalAlpha=b.chorus?.72:.42;ctx.lineWidth=1;
      ctx.beginPath();ctx.moveTo(b.x-dx*18-dy*3,b.y-dy*18+dx*3);ctx.quadraticCurveTo(b.x-dx*9+dy*3,b.y-dy*9-dx*3,b.x,b.y);ctx.stroke();
    }
    ctx.restore();
  }
  // Rim colour is a role read, not decoration: the spitter's acid green marks the ranged threat, the
  // runner's hot amber marks the fast one, and the drifter gets the plain moon-pale edge. Alpha rises
  // as the night darkens, because the rim exists exactly to fight the dark — at dawn it fades out.
  // The permanent rim is GONE. It existed for exactly one reason — to keep a silhouette readable
  // against a near-black yard — and the yard is not near-black any more. What it actually produced was
  // a hard pale outline traced around every body: ten offset stamps of the sprite's own alpha, flood
  // filled with a solid colour, at up to .65 alpha. On a lit ground texture that does not read as rim
  // light, it reads as a sticker cut out with a white border, which is what was in the frame.
  // A rim is still stamped for the ~0.11s of a hit flash, because there it is doing a different job:
  // it is damage feedback, it is meant to be conspicuous, and it is gone again three frames later.
  const rimNight=0;
  for(const z of state.zombies){
    const moveAngle=z.faceAngle??Math.atan2(state.shelter.centerY-z.y,state.shelter.centerX-z.x);
    const direction=directionCell(moveAngle),size=ZOMBIE_DRAW_SIZE[z.id]||72,renderSize=size*(ANIM_SCALE[z.id]||1);
    const tint=z.hitFlash>0?'#e7d8bbaa':null,rim=z.hitFlash>0?'#f3e6c4':null;
    const animated=drawAnimatedSprite(ctx,z.id,z.animAction||'walk',direction,z.x,z.y,renderSize,z.animTime,{tint,shadow:9,rim,rimAlpha:z.hitFlash>0?.85:rimNight});
    // These two four-pose masters contain a dark baked matte. Never flash that rectangle while a real 4×4 sheet is loading.
    const skipMasterFallback=z.id==='vomiting_alexander'||z.id==='lumberjack_zombie';
    const rendered=animated||(!skipMasterFallback&&drawDirectionSprite(ctx,zombieSheets.get(z.id),direction,z.x,z.y,size,{tint,shadow:9,rim,rimAlpha:z.hitFlash>0?.85:rimNight}));
    if(!rendered){ctx.save();ctx.translate(z.x,z.y);ctx.fillStyle='#2b2c25';ctx.beginPath();ctx.ellipse(0,2,z.radius*.75,z.radius*1.25,0,0,Math.PI*2);ctx.fill();ctx.strokeStyle=z.color;ctx.lineWidth=2;ctx.stroke();ctx.restore()}
    const barY=z.y-(rendered?renderSize*.84:size*.58),kind=zombieTypes.get(z.id);
    ctx.fillStyle='#151512';ctx.fillRect(z.x-z.radius,barY,z.radius*2,3);
    ctx.fillStyle=z.id==='heavy_spitter'?'#82924c':z.id==='boss_zombie'?'#7d2e29':'#8e372a';
    ctx.fillRect(z.x-z.radius,barY,z.radius*2*(z.hp/(kind?.hp||z.hp||1)),3);
  }
  // In Hater Raid the selected zombie leads every other custom zombie into the house.
  if(haterRaid?.active){
    const raidBodies=[...(haterRaid.companions||[]),haterRaid.player];
    for(const rz of raidBodies){
      const selected=rz===haterRaid.player,direction=directionCell(rz.faceAngle),base=ZOMBIE_DRAW_SIZE[rz.id]||72;
      // KUOK is boss-sized only in Stas defence. In Hater Raid he is a normal playable body.
      const size=rz.id==='injured_kuok'?78:base*(ANIM_SCALE[rz.id]||1);
      drawAnimatedSprite(ctx,rz.id,rz.animAction||'idle',direction,rz.x,rz.y,size,rz.animTime,{tint:rz.hitFlash>0?'#e7d8bbaa':null,shadow:selected?10:8,rim:selected?'#b5d8a0':null,rimAlpha:selected?.42:0})
        ||drawDirectionSprite(ctx,zombieSheets.get(rz.id),direction,rz.x,rz.y,base,{tint:rz.hitFlash>0?'#e7d8bbaa':null,shadow:selected?10:8,rim:selected?'#b5d8a0':null,rimAlpha:selected?.42:0});
      const hp=Math.max(0,rz.hp/rz.maxHp),barWidth=selected?68:42,barHeight=selected?5:3;
      ctx.fillStyle='#111';ctx.fillRect(rz.x-barWidth/2,rz.y-size*.66,barWidth,barHeight);ctx.fillStyle=selected?'#b44737':'#7f8655';ctx.fillRect(rz.x-barWidth/2,rz.y-size*.66,barWidth*hp,barHeight);
    }
    const rs=haterRaid.speaker,shp=Math.max(0,rs.hp/rs.maxHp);ctx.fillStyle='#111';ctx.fillRect(rs.x-44,rs.y-46,88,6);ctx.fillStyle=rs.hitFlash>0?'#fff0bc':'#d35a43';ctx.fillRect(rs.x-44,rs.y-46,88*shp,6);
    ctx.fillStyle='#e6dfcb';ctx.font='bold 10px Chivo Mono';ctx.textAlign='center';ctx.fillText(`КОЛОНКА ${Math.ceil(rs.hp)}`,rs.x,rs.y-52);ctx.textAlign='start';
    for(const effect of haterRaid.effects){const alpha=effect.life/effect.maxLife;ctx.save();ctx.globalAlpha=alpha;ctx.strokeStyle=effect.type==='taunt'?'#d85843':'#f5dfaf';ctx.lineWidth=3;ctx.beginPath();ctx.arc(effect.x,effect.y,(1-alpha)*38+8,0,Math.PI*2);ctx.stroke();ctx.restore()}
  }
  const p=state.player,a=haterRaid?.active?haterRaid.stas.faceAngle:Math.atan2(mouse.y-p.y,mouse.x-p.x),playerDirection=directionCell(a),playerTint=p.failed?'#9f3f2d88':p.failureFlash>0?'#b6402c66':null;
  // Stas is a tall suited figure; the old survivor hand sat too high on him and the barrel poked
  // out of the skull when aiming up. Per-character reach keeps the original survivor numbers intact.
  const HAND=PLAYER_CHARACTER==='stas'?{y:12,reach:14}:{y:-3,reach:12};
  const drawEquippedWeapon=()=>drawWeaponVisual(ctx,weapons.get(p.weapon),p.x+Math.cos(a)*HAND.reach,p.y+HAND.y+Math.sin(a)*HAND.reach*.55,{maxWidth:56,maxHeight:32,fallbackScale:.86},a);
  if(playerDirection===1)drawEquippedWeapon();
  drawNinjaAlly();
  drawSecondDefender();
  const playerRendered=drawAnimatedSprite(ctx,PLAYER_CHARACTER,p.animAction||'idle',playerDirection,p.x,p.y,108,p.animTime,{tint:playerTint,shadow:11})||drawDirectionSprite(ctx,survivorSheet,playerDirection,p.x,p.y,164,{tint:playerTint,shadow:11});
  if(!playerRendered){ctx.save();ctx.translate(p.x,p.y);ctx.rotate(a);ctx.fillStyle=p.failed?'#9f3f2d':'#bdb6a0';ctx.beginPath();ctx.moveTo(12,0);ctx.lineTo(-7,-8);ctx.lineTo(-5,8);ctx.closePath();ctx.fill();ctx.restore()}
  if(playerDirection!==1)drawEquippedWeapon();
  // Every one-shot effect below now paints with 'lighter' instead of a flat fill/stroke. Against the
  // new contrast grade a flat-colour flash just sits there as a shape; an additive one actually looks
  // like it is throwing light, which is the entire point of a muzzle flash, a detonation ring or a
  // backfire flare. Costs nothing extra — same draw calls, different composite mode.
  for(const effect of state.effects){const alpha=effect.life/effect.maxLife;ctx.save();ctx.globalAlpha=alpha;ctx.globalCompositeOperation='lighter';if(effect.type==='muzzle'){
    // A small hot core behind the flash wedge: this is the actual "bloom" — the wedge alone reads as a
    // flat icon, the core behind it is what sells "this just lit up the dark".
    const core=ctx.createRadialGradient(effect.x,effect.y,0,effect.x,effect.y,26);
    core.addColorStop(0,'rgba(255,238,196,.9)');core.addColorStop(1,'rgba(255,238,196,0)');
    ctx.fillStyle=core;ctx.beginPath();ctx.arc(effect.x,effect.y,26,0,Math.PI*2);ctx.fill();
    ctx.translate(effect.x,effect.y);ctx.rotate(effect.angle);ctx.fillStyle='#ffdf9a';ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(17,-6);ctx.lineTo(11,0);ctx.lineTo(17,6);ctx.closePath();ctx.fill();ctx.strokeStyle='#fff6d8';ctx.beginPath();ctx.moveTo(2,0);ctx.lineTo(21,0);ctx.stroke()}else if(effect.type==='scream'){/* Noise spike: pale rings racing outward, mirroring the tripled noise radius */ctx.strokeStyle='#f3e8bf';ctx.lineWidth=2;for(let i=0;i<3;i++){const wave=(1-alpha)-i*.18;if(wave<=0)continue;ctx.globalAlpha=alpha*(1-i*.3);ctx.beginPath();ctx.arc(effect.x,effect.y,wave*150+8,0,Math.PI*2);ctx.stroke()}}else{ctx.strokeStyle=effect.type==='death'?'#e0483a':effect.type==='backfire'?'#ff6a45':effect.type==='overheat'?'#ffa054':'#f0dfa0';ctx.lineWidth=effect.type==='backfire'?4:3;const radius=(1-alpha)*(effect.type==='death'?28:effect.type==='backfire'?34:effect.type==='overheat'?26:15)+4;for(let i=0;i<6;i++){const angle=i*Math.PI/3;ctx.beginPath();ctx.moveTo(effect.x+Math.cos(angle)*radius*.3,effect.y+Math.sin(angle)*radius*.3);ctx.lineTo(effect.x+Math.cos(angle)*radius,effect.y+Math.sin(angle)*radius);ctx.stroke()}}ctx.restore()}
  // Walls above the entities: a zombie standing behind the north wall is hidden by it, which is what
  // makes the box read as a building rather than a floor decal.
  drawShelterWalls(ctx,state.shelter,1-Math.max(0,Math.min(1,state.shelter.hp/state.shelter.maxHp)));
  // Wall splatter is drawn ON the wall layer, so it sits on the facade rather than under it, and the
  // runs read as blood on a vertical surface instead of a stain on the floor.
  drawBloodSplatter(ctx,state.blood);
  // Airborne droplets are above every body: they are the frontmost thing in the frame at the moment of
  // a hit, which is exactly what makes the impact land.
  drawBloodDrops(ctx,state.blood);
  // Roof mask: opaque from outside, punched only by the wedges the survivor's position lines up with,
  // and eased away entirely once they step through the door.
  // The roof is now the photographic slab (assets/environment/roof.png), handed in through the same
  // texture-hook contract as the interior: the hook returns false while the PNG is still decoding, and
  // the procedural fallback covers that one frame instead of leaving a hole where the building is.
  drawShelterRoof(ctx,state.shelter,p,WORLD.width,WORLD.height,shelterTextures);
  // Sound rings sit ABOVE the roof so the yard reads "the house is blasting Зомбэ" even from the street.
  drawSpeakerWaves(ctx,speakers,state.shelter,{chorus:state.phase==='wave'&&trackBeat().chorus});
  // The other half of the perspective read: from inside, the yard exists only inside the window wedges.
  // The fog lifts with the grade: the yard is unreadable black at midnight and a thin haze at dawn.
  drawExteriorFog(ctx,state.shelter,p,WORLD.width,WORLD.height,nightProgress());
  drawShelterStatus();
  // Night grade, streetlamp pools and rain sit above every entity
  drawEnvironmentOverlay(ctx,environment);
  // The yard's own bounded light buffer. The window spill and the survivor's torch both land here and
  // are composited exactly once, AFTER the night tint so they still cut through it, but capped at
  // LIGHT_EXPOSURE so a survivor standing under a lit window can no longer stack two unbounded
  // additive passes on the same pixels and burn them to white.
  const scene=(GFX.windowLight||GFX.lamp)?beginLightPass(WORLD.width,WORLD.height,'scene'):null;
  // Warm spill out of every opening. It belongs to the scene buffer, not the interior one: it lands on
  // the yard and the facade, which are outside the roof mask.
  if(scene&&GFX.windowLight)drawWindowLight(scene,state.shelter,1-nightProgress()*.4);
  if(scene&&GFX.lamp){scene.save();scene.globalCompositeOperation='lighter';
  const g=scene.createRadialGradient(p.x,p.y,18,p.x,p.y,165);g.addColorStop(0,'rgba(206,191,141,.2)');g.addColorStop(1,'rgba(0,0,0,0)');scene.fillStyle=g;scene.fillRect(p.x-165,p.y-165,330,330);
  scene.restore()}
  if(scene)endLightPass(ctx,LIGHT_EXPOSURE,'scene');
  // Contrast, vignette and the danger cast: the pass that removes the flat grey wash
  if(GFX.grade)drawGrade(ctx,WORLD.width,WORLD.height,{dawn:nightProgress(),danger:1-Math.max(0,Math.min(1,state.shelter.hp/state.shelter.maxHp))});
  // Bloom runs AFTER the grade, not before: it needs to see the vignette-darkened frame so only what
  // actually reads as bright once graded (muzzle flashes, window light, embers) blooms — and the glow
  // is meant to punch OUT through that darkened vignette, which only works if it is drawn on top of it.
  // Order matters: crush first, bloom second. The bloom threshold selects what counts as a light
  // source, so it has to read the frame AFTER the mush has been pushed to black — otherwise half-lit
  // wall panels pass the threshold and get a glow, which is how a dim scene turns into a hazy one.
  if(GFX.crush!==0)crushBlacks();
  if(GFX.bloom)applyBloom();
  // The bonus grade is deliberately isolated from the normal GFX switchboard: it exists only while
  // Big Russian Boss is alive and fades immediately on defeat, so the standard scene remains clean.
  drawBossAtmosphere();
  // Roast bubbles in WORLD space, before HUD resets the transform. After HUD they landed in the
  // wrong coordinate system and vanished in cinema. Fog/grade/bloom stay under them so the line reads.
  drawTaunts(ctx,state.zombies);
  if(haterRaid?.bubble)drawTaunts(ctx,[{x:haterRaid.player.x,y:haterRaid.player.y,taunt:haterRaid.bubble}]);
  // Contextual prompt lives above the survivor, where the player is already looking
  if(!haterRaid?.active)drawPrompt(ctx,p,currentAction().label);
  drawHUD();
}
function drawBossAtmosphere(){
  const encounter=state.bossEncounter;
  if(!encounter?.active)return;
  const pulse=.5+.5*Math.sin(performance.now()*.0055);
  const intensity=.13+encounter.phase*.035+pulse*.035+encounter.flash*.18;
  ctx.save();
  ctx.globalCompositeOperation='source-over';
  const wash=ctx.createLinearGradient(0,0,WORLD.width,WORLD.height);
  wash.addColorStop(0,`rgba(20,46,104,${intensity*.82})`);
  wash.addColorStop(.52,'rgba(8,8,18,.04)');
  wash.addColorStop(1,`rgba(126,18,26,${intensity})`);
  ctx.fillStyle=wash;ctx.fillRect(0,0,WORLD.width,WORLD.height);
  const vignette=ctx.createRadialGradient(WORLD.width*.5,WORLD.height*.5,180,WORLD.width*.5,WORLD.height*.5,690);
  vignette.addColorStop(.45,'rgba(0,0,0,0)');
  vignette.addColorStop(1,`rgba(15,0,8,${.32+encounter.phase*.06+pulse*.06})`);
  ctx.fillStyle=vignette;ctx.fillRect(0,0,WORLD.width,WORLD.height);
  ctx.restore();
}
// In-canvas HUD: survivor vitals bottom-left, the night clock and wave count top-right. It resets the
// transform to plain DPR first, because instrument readouts must NOT shake with the camera — a trembling
// health bar reads as a rendering fault, not as impact. Written in the same field-journal palette the
// page chrome uses, so the frame and the canvas stay one object.
function drawRaidMeter(x,y,w,label,value,max,color,detail,thresholds=[]){
  const ratio=Math.max(0,Math.min(1,max>0?value/max:0));
  ctx.font='600 9px "Chivo Mono",monospace';ctx.fillStyle='#9ea294';ctx.fillText(label,x,y);
  ctx.textAlign='right';ctx.fillStyle='#e7e4da';ctx.fillText(detail,x+w,y);ctx.textAlign='left';
  ctx.fillStyle='#20231f';ctx.fillRect(x,y+5,w,8);
  ctx.fillStyle=color;ctx.fillRect(x,y+5,w*ratio,8);
  for(const threshold of thresholds){ctx.fillStyle='#d8d3c5';ctx.fillRect(x+w*threshold,y+4,1,6)}
  ctx.strokeStyle='#42473f';ctx.strokeRect(x+.5,y+5.5,w-1,7);
}
function drawRaidHUD(view,r){
  const compact=view.w<520,margin=compact?10:14,w=Math.min(compact?view.w-margin*2:430,view.w-margin*2),x=margin,y=compact?10:16;
  const rage=Math.max(0,Math.min(100,r.provocation)),danger=rage>=70,phaseText=r.phase==='active'?'РЕЙД ИДЁТ':r.phase==='won'?'ЦЕЛЬ УНИЧТОЖЕНА':'РЕЙД ПРОВАЛЕН';
  const stage=RAID_STAGES[r.stageIndex]||RAID_STAGES[0],boostText=r.boost?.time>0?`${r.boost.label} ${r.boost.time.toFixed(1)}с`:null;
  const h=compact?142:126;
  ctx.fillStyle='rgba(11,13,12,.92)';ctx.fillRect(x,y,w,h);
  ctx.strokeStyle=danger?'#a94734':'#50564c';ctx.lineWidth=danger?2:1;ctx.strokeRect(x+.5,y+.5,w-1,h-1);
  ctx.fillStyle=danger?'#a94734':'#8d9a68';ctx.fillRect(x,y,3,h);
  ctx.font='700 11px "Chivo Mono",monospace';ctx.fillStyle='#e7e4da';ctx.fillText(`${RAID_NAMES[r.type]||r.type} · ${phaseText}`,x+12,y+17);
  ctx.font='600 9px "Chivo Mono",monospace';ctx.fillStyle='#c1bcae';ctx.fillText(`ЭТАП ${r.stageIndex+1}/4 · ${stage.objective}`,x+12,y+33);
  ctx.textAlign='right';ctx.fillStyle=boostText?'#d8b86d':'#777d72';ctx.fillText(boostText||`КОМБО ×${r.combo||0}`,x+w-12,y+33);ctx.textAlign='left';
  const innerX=x+12,innerW=w-24,objective=r.stageIndex===1&&r.fence.hp>0?r.fence:r.speaker;
  const objectiveLabel=objective===r.fence?'ЗДОРОВЬЕ ЗАБОРА':'ЗДОРОВЬЕ КОЛОНКИ';
  if(compact){
    drawRaidMeter(innerX,y+49,innerW,'ЗДОРОВЬЕ ЗОМБИ',r.player.hp,r.player.maxHp,r.player.hp/r.player.maxHp<.3?'#a94734':'#8d9a68',`${Math.ceil(r.player.hp)} / ${r.player.maxHp}`,[.3]);
    drawRaidMeter(innerX,y+73,innerW,objectiveLabel,objective.hp,objective.maxHp,'#b65a43',`${Math.ceil(objective.hp)} / ${objective.maxHp}`);
    drawRaidMeter(innerX,y+97,innerW,'ПРОВОКАЦИЯ',rage,100,danger?'#c34c37':'#9b7d45',`${Math.round(rage)}%`,[.4,.7]);
    ctx.fillStyle=danger?'#d77560':'#999d91';ctx.fillText(danger?'СТАС В ЯРОСТИ · ОГОНЬ УСИЛЕН':'КОММЕНТАРИИ УСКОРЯЮТ ОГОНЬ СТАСА',innerX,y+132);
  }else{
    const gap=16,colW=(innerW-gap)/2;
    drawRaidMeter(innerX,y+51,colW,'ЗОМБИ',r.player.hp,r.player.maxHp,r.player.hp/r.player.maxHp<.3?'#a94734':'#8d9a68',`${Math.ceil(r.player.hp)} / ${r.player.maxHp}`,[.3]);
    drawRaidMeter(innerX+colW+gap,y+51,colW,objective===r.fence?'ЗАБОР':'КОЛОНКА',objective.hp,objective.maxHp,'#b65a43',`${Math.ceil(objective.hp)} / ${objective.maxHp}`);
    drawRaidMeter(innerX,y+79,innerW,'ПРОВОКАЦИЯ',rage,100,danger?'#c34c37':'#9b7d45',`${Math.round(rage)}%`,[.4,.7]);
    ctx.fillStyle=danger?'#d77560':'#999d91';ctx.fillText(danger?'СТАС В ЯРОСТИ · ОГОНЬ УСИЛЕН':'КОММЕНТАРИИ УСКОРЯЮТ ОГОНЬ СТАСА',innerX,y+116);
  }
  if(r.hint?.text){
    ctx.font='700 12px "Chivo Mono",monospace';
    const hintW=Math.min(view.w-24,Math.max(230,ctx.measureText(r.hint.text).width+32));
    const hintX=(view.w-hintW)/2,hintY=view.h-(compact?94:58);
    ctx.fillStyle='rgba(9,11,10,.9)';ctx.fillRect(hintX,hintY,hintW,34);
    ctx.strokeStyle='#a98b4d';ctx.strokeRect(hintX+.5,hintY+.5,hintW-1,33);
    ctx.fillStyle='#f0e7cc';ctx.textAlign='center';ctx.fillText(r.hint.text,view.w/2,hintY+22);ctx.textAlign='left';
  }
}
function drawHUD(){
  if(!state)return;
  const p=state.player;
  const view=frameRect();
  ctx.save();ctx.setTransform(DPR,0,0,DPR,0,0);
  if(haterRaid?.active){drawRaidHUD(view,haterRaid);ctx.restore();return;
  }
  const boss=state.zombies.find(zombie=>zombie.id==='big_russian_boss'&&zombie.hp>0);
  if(state.bossEncounter?.active&&boss){
    const maxBossHp=zombieTypes.get('big_russian_boss')?.hp||boss.hp;
    const ratio=Math.max(0,Math.min(1,boss.hp/maxBossHp));
    const bw=Math.min(520,view.w-40),bx=(view.w-bw)/2,by=72;
    ctx.fillStyle='rgba(7,7,12,.88)';ctx.fillRect(bx-10,by-9,bw+20,38);
    ctx.strokeStyle=state.bossEncounter.flash>0?'#f1d38d':'#6f2634';ctx.lineWidth=2;ctx.strokeRect(bx-9.5,by-8.5,bw+19,37);
    ctx.font='bold 12px "Chivo Mono",monospace';ctx.textAlign='center';ctx.fillStyle='#eee1c7';ctx.fillText(t('boss_name'),view.w/2,by+2);
    ctx.fillStyle='#17131a';ctx.fillRect(bx,by+9,bw,10);
    const gradient=ctx.createLinearGradient(bx,0,bx+bw,0);gradient.addColorStop(0,'#315ba8');gradient.addColorStop(1,'#a52835');
    ctx.fillStyle=gradient;ctx.fillRect(bx,by+9,bw*ratio,10);
    for(const threshold of BOSS_PHASES){const marker=bx+bw*threshold;ctx.fillStyle='#e8dcc4';ctx.fillRect(marker,by+8,2,12)}
    ctx.textAlign='left';
  }
  // The house-danger plates get a slow red pulse instead of a static border once the building is
  // genuinely close to falling. A flat red outline is a colour change the eye stops registering after
  // a second; a pulse keeps pulling attention back to the readout that actually matters at that point.
  const houseDanger=state.shelter?1-Math.max(0,Math.min(1,state.shelter.hp/state.shelter.maxHp)):0;
  const pulse=houseDanger>.55?.5+.5*Math.sin(performance.now()*.006):0;
  // --- Survivor plate: HP and weapon heat -------------------------------------------------------
  const x=14,w=Math.min(188,view.w-28),y=view.h-58;
  ctx.fillStyle='rgba(10,10,8,.74)';ctx.fillRect(x-8,y-16,w+16,62);
  ctx.strokeStyle=pulse>0?`rgba(184,52,36,${(.4+pulse*.6).toFixed(2)})`:'#5f594e';ctx.lineWidth=pulse>0?1+pulse:1;ctx.strokeRect(x-7.5,y-15.5,w+15,61);
  ctx.font='bold 10px "Chivo Mono",monospace';ctx.fillStyle='#b6ad97';
  ctx.fillText(t('hero_name'),x,y-4);
  const maxHp=scenario.player.hp||100,hp=Math.max(0,Math.min(1,p.hp/maxHp));
  ctx.fillStyle='#151512';ctx.fillRect(x,y,w,8);
  ctx.fillStyle=hp<.35?'#8f3428':'#7c8551';ctx.fillRect(x,y,w*hp,8);
  ctx.strokeStyle='#3a372e';ctx.strokeRect(x+.5,y+.5,w-1,7);
  // Heat against its cap, with the 60% risk threshold marked: past the notch every shot gambles
  const s=weaponStats(weapons.get(p.weapon)),heat=Math.max(0,Math.min(1,p.heat/s.heat_limit));
  const hy=y+18;
  ctx.fillStyle='#b6ad97';ctx.fillText(t(p.failed?(p.failureKind==='overheat'?'hud_heat_overheat':'hud_heat_jam'):'hud_heat'),x,hy-3);
  ctx.fillStyle='#151512';ctx.fillRect(x,hy,w,6);
  ctx.fillStyle=p.failed?'#8f3428':heat>.6?'#a5622c':'#6f6a55';ctx.fillRect(x,hy,w*heat,6);
  ctx.fillStyle='#c8bfaa';ctx.fillRect(x+w*.6,hy-1,1,8);
  ctx.strokeStyle='#3a372e';ctx.strokeRect(x+.5,hy+.5,w-1,5);
  // --- Night plate: clock, wave pips, kills ------------------------------------------------------
  const total=scenario.waves.length,arrived=Math.min(state.wave,total);
  const nw=Math.min(176,view.w-28),nx=view.w-nw-14,ny=26;
  ctx.fillStyle='rgba(10,10,8,.74)';ctx.fillRect(nx-8,ny-16,nw+16,64);
  ctx.strokeStyle=pulse>0?`rgba(184,52,36,${(.4+pulse*.6).toFixed(2)})`:'#5f594e';ctx.lineWidth=pulse>0?1+pulse:1;ctx.strokeRect(nx-7.5,ny-15.5,nw+15,63);
  ctx.fillStyle='#b6ad97';
  if(state.phase==='idle')ctx.fillText(t('hud_prep_free'),nx,ny-4);
  else if(state.phase==='break')ctx.fillText(t('hud_break'),nx,ny-4);
  else if(state.phase==='wave')ctx.fillText(t('hud_wave',{arrived,total}),nx,ny-4);
  else ctx.fillText(t(state.phase==='survived'?'hud_survived':'hud_lost'),nx,ny-4);
  // Wave progress towards dawn — no more 96s night clock
  ctx.fillStyle='#151512';ctx.fillRect(nx,ny,nw,5);
  ctx.fillStyle='#8a8168';ctx.fillRect(nx,ny,nw*Math.max(0,Math.min(1,state.phase==='survived'?1:state.wave/Math.max(1,total))),5);
  // One pip per wave: filled once it has arrived, hollow while it is still out in the dark
  ctx.fillStyle='#b6ad97';ctx.fillText(t('hud_wave',{arrived,total}),nx,ny+22);
  for(let i=0;i<total;i++){
    const px=nx+64+i*16;
    if(i<arrived){ctx.fillStyle='#8f3428';ctx.fillRect(px,ny+14,10,9)}
    else{ctx.strokeStyle='#6d6658';ctx.strokeRect(px+.5,ny+14.5,9,8)}
  }
  ctx.fillStyle='#847d6b';ctx.fillText(t('hud_kills',{count:state.kills}),nx,ny+38);
  ctx.restore();
}
// Night progress drives every colour decision in the frame: the sky tint, the lamp warmth, the rain
// intensity, the cast shadows and the interior veils. It is LATCHED into the state and rate limited
// instead of being recomputed from the phase, because reading it straight off `phase` snapped the grade
// on the transition frame: the instant the house fell the phase flipped to `lost`, this function
// returned 0, and a frame that was 90% of the way to dawn turned back into deep night in one frame.
// The reverse happened at dawn, where `survived` jumped straight to 1.
const GRADE_RATE=.34;
function nightProgress(){return state?state.dawnGrade||0:0}
// The value the grade is walking towards. Terminal phases hold whatever the night ended on, so the
// last colour the player saw is the colour that stays on screen with the outcome message.
function nightTarget(){
  if(state.phase==='wave'||state.phase==='break')return Math.max(0,Math.min(1,state.wave/Math.max(1,scenario.waves.length)));
  if(state.phase==='survived')return 1;
  if(state.phase==='lost')return state.dawnGrade||0;
  return 0;
}
// Called every frame, running or not: the grade must keep easing while the game sits on a terminal
// screen, and it must never move more than GRADE_RATE per second in either direction. The siege ramp
// itself is an order of magnitude slower than that limit, so normal play is completely unaffected —
// the clamp only ever bites on a phase change, which is exactly the frame that used to jump.
function advanceNightGrade(dt){
  if(!state)return;
  const current=state.dawnGrade||0,step=dt*GRADE_RATE;
  state.dawnGrade=current+Math.max(-step,Math.min(step,nightTarget()-current));
}
// dt is clamped on BOTH ends: a requestAnimationFrame timestamp can legitimately be older than a
// performance.now() captured inside a click handler, which produced a negative dt, ran every timer
// backwards and crashed the rain splashes with a negative ellipse radius.
function loop(now){const rawDt=Math.max(0,Math.min(.033,(now-state.last)/1000));state.last=now;
  // Hit-stop eats simulation time but never render time: the world freezes, the frame keeps drawing
  let dt=rawDt;
  if(hitStop>0){hitStop-=rawDt;dt=0}
  shakeTime=Math.max(0,shakeTime-rawDt);if(shakeTime<=0)shakePower=0;
  if(state.running&&dt>0)update(dt);
  // The grade advances before anything reads it, and it advances even while paused on a terminal screen
  advanceNightGrade(dt);
  // Blood keeps settling on a terminal screen too. Freezing it mid-arc left droplets hanging in the air
  // over the outcome message, which looked like a rendering fault rather than a paused game.
  if(state)updateBlood(state.blood,dt);
  updateEnvironment(environment,dt,nightProgress());draw();requestAnimationFrame(loop)}
function renderLab(){const select=$('#weapon');if(!select)return;select.innerHTML=[...weapons.values()].map(w=>`<option value="${w.id}">${weaponName(w)}</option>`).join('');select.value=state.player.weapon;showWeapon()}
function showWeapon(){const select=$('#weapon'),card=$('#weapon-card');if(!select||!card)return;const w=weapons.get(select.value),s=weaponStats(w),cost=weaponCost(w);card.innerHTML=`<p>${weaponDesc(w)}</p><div class="stat"><span>${t('stat_role')}</span><b>${roleName(w.role)}</b></div><div class="stat"><span>${t('stat_damage')}</span><b>${s.damage} × ${s.projectiles}</b></div><div class="stat"><span>${t('stat_noise')}</span><b>${s.noise}</b></div><div class="stat"><span>${t('stat_heat_limit')}</span><b>${s.heat_limit}</b></div><div class="stat"><span>${t('stat_failure')}</span><b>${failureName(s.failure)}</b></div><div class="tags">${Object.entries(cost).map(([k,v])=>`${v} ${salvageName(k)}`).join(' · ')||t('starter_weapon')}</div>`;renderWeaponPanels()}
function renderSalvage(){const salvage=$('#salvage');if(!salvage)return;salvage.innerHTML=Object.entries(state.salvage).map(([k,v])=>`<div class="loot"><span>${salvageName(k)}</span><b>${v}</b></div>`).join('')}
function craft(){const id=$('#weapon').value,w=weapons.get(id),cost=weaponCost(w);if(!state.unlocked.has(id)){if(Object.entries(cost).some(([k,v])=>(state.salvage[k]||0)<v)){alertStatus(t('missing_salvage'));return}for(const [k,v] of Object.entries(cost))state.salvage[k]-=v;state.unlocked.add(id)}// Swapping out of a locked barrel is a legitimate escape, so the whole failure state clears — including
// `failureKind`, which used to survive the swap and mislabel the next lock in the HUD.
state.player.weapon=id;state.player.failed=false;state.player.failureKind=null;state.player.heat=0;renderSalvage();renderWeaponPanels();sfx('ui');alertStatus(t('equipped',{weapon:weaponName(w)}))}
function testWeapon(){const w=weapons.get($('#weapon').value),s=weaponStats(w),safeShots=Math.ceil(s.heat_limit/s.heat_per_shot),expected=Math.max(safeShots,Math.ceil(1/s.failure_rate)),seconds=(expected/s.fire_rate).toFixed(1),dps=Math.round(s.damage*s.projectiles*s.fire_rate);$('#report').textContent=`${weaponName(w)}\n${t('report_damage')}: ${dps}\n${t('report_noise')}: ${s.noise}\n${t('report_burst')}: ${safeShots}\n${t('report_expected')}: ${seconds} с\n${t('report_failure')}: ${failureName(s.failure)}\n${t('report_verdict')}: ${t(dps/s.noise>.45?'verdict_efficient':'verdict_loud')}`}
// The HUD is rewritten every frame, so an event message used to survive for a single frame and was
// effectively invisible. Alerts now hold the line for a few seconds before the HUD resumes.
// Two guards, not one. `statusHold` keeps a short alert on screen against the per-frame HUD, and
// `statusRank` protects the terminal outcome against every later alert. With rank alone missing, an
// interactive debug session proved the defect: crafting a weapon after the house fell replaced
// `THE HOUSE IS LOST` with `Equipped: …`, so the player lost the only record of how the night ended.
// The rank has to EXPIRE with its hold. It did not, so `statusRank` latched at 1 on the very first
// alert and the `rank<statusRank` guard silenced the per-frame HUD for the rest of the session: an
// instrumented run showed the night readout never returning, the line frozen on a 2.4s alert for 6+
// seconds. Terminal rank 2 is the deliberate exception and stays until the next session resets it.
const TERMINAL_RANK=2;
let statusHold=0,statusRank=0;
function currentRank(){
  if(statusRank===TERMINAL_RANK)return TERMINAL_RANK;
  return statusHold>performance.now()?statusRank:0;
}
function setStatus(s,hold=0,rank=hold>=3600?TERMINAL_RANK:hold>0?1:0){
  const active=currentRank();
  if(rank<active)return;
  if(rank===0&&statusHold>performance.now())return;
  if(hold>0){statusHold=performance.now()+hold*1000;statusRank=rank}
  $('#status').textContent=s;
}
function alertStatus(s){setStatus(s,2.4)}
// Physical-key input: e.code stays stable on any keyboard layout (Cyrillic WASD produced ц/ф/ы/в and killed movement)
const MOVE_CODES=new Set(['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowLeft','ArrowDown','ArrowRight']);
const ACTION_CODES={KeyR:'r',KeyF:'f',KeyG:'g',KeyT:'t',KeyM:'m',Escape:'escape'};
function rememberKey(e,down){
  if(e.code){if(down)held.add(e.code);else held.delete(e.code)}
  const letter=e.key?.length===1?e.key.toLowerCase():'';
  if(letter==='a'||letter==='ф'){if(down)held.add('KeyA');else held.delete('KeyA')}
  if(letter==='d'||letter==='в'){if(down)held.add('KeyD');else held.delete('KeyD')}
  if(letter==='w'||letter==='ц'){if(down)held.add('KeyW');else held.delete('KeyW')}
  if(letter==='s'||letter==='ы'){if(down)held.add('KeyS');else held.delete('KeyS')}
}
addEventListener('keydown',e=>{
  rememberKey(e,true);
  if(MOVE_CODES.has(e.code)){e.preventDefault();return}
  if(haterRaid?.active){
    if(e.code==='Digit1'||e.code==='Digit2'||e.code==='Digit3'){e.preventDefault();if(!e.repeat)useRaidTaunt(+e.code.at(-1)-1);return}
    if(e.code==='Space'){e.preventDefault();if(!e.repeat&&attackRaidSpeaker(haterRaid)){addShake(3,.16)}return}
    if(e.code==='Escape'){e.preventDefault();if(!e.repeat)exitHaterRaid();return}
  }
  const name=ACTION_CODES[e.code]||(e.key==='Escape'?'escape':'');
  if(!name)return;
  if(document.activeElement&&document.activeElement!==document.body&&document.activeElement.tagName!=='CANVAS')document.activeElement.blur();
  if(e.repeat)return;
  if(name==='r'&&state.running&&state.phase!=='lost'&&state.phase!=='survived'){
    // R used to require phase==='wave'. Free-roam firing overheats the barrel in the yard, then the
    // only key that clears a lock did nothing — HUD sat on OVERHEAT at Heat 0 until a wave started.
    const p=state.player,s=weaponStats(weapons.get(p.weapon));
    p.failed=false;p.failureKind=null;p.heat=Math.min(p.heat,s.heat_limit*.4);
    sfx('ui');alertStatus(t('failure_cleared'));
  }
  if(name==='f')useContext();
  if(name==='g')togglePlacement('trap');
  if(name==='t')togglePlacement('turret');
  if(name==='m'){
    if(state.phase==='idle'||state.phase==='break'){
      if(speakerNear(state.shelter,state.player.x,state.player.y))startNextWave();
      else alertStatus(t('msg_come_to_speaker'));
    }
  }
  if(name==='escape'){
    if(state.interaction.placing){cancelPlacement(state.interaction);alertStatus(t('placement_cancelled'));return}
    if(isReel()){toggleReel();return}
    if(document.body.classList.contains('cinema'))toggleCinema();
  }
},true);
addEventListener('keyup',e=>rememberKey(e,false),true);
document.addEventListener('visibilitychange',()=>{if(document.hidden){held.clear();Object.keys(keys).forEach(k=>keys[k]=false);stick.dx=0;stick.dy=0}});
function aimFromEvent(e){
  const src=e.changedTouches?e.changedTouches[0]:e;
  if(!src)return;
  const point=worldFromClient(canvas,src.clientX,src.clientY,WORLD,reelFocus());
  mouse.x=point.x;mouse.y=point.y;
}
function setStickFromTouch(touch,origin){
  const reach=56;
  const dx=(touch.clientX-origin.x)/reach,dy=(touch.clientY-origin.y)/reach;
  const mag=Math.hypot(dx,dy)||1;
  const scale=Math.min(1,mag);
  stick.dx=dx/mag*scale;stick.dy=dy/mag*scale;
}
let stickTouch=null;
canvas.addEventListener('mousemove',aimFromEvent);
canvas.addEventListener('mousedown',()=>{
  audio.unlock?.();
  if(haterRaid?.active){mouse.down=true;if(attackRaidSpeaker(haterRaid)){addShake(3,.16)}return}
  if(commitPlacement())return;
  mouse.down=true;
  fire();
});
addEventListener('mouseup',()=>mouse.down=false);
canvas.addEventListener('touchstart',e=>{
  e.preventDefault();
  audio.unlock?.();
  const touch=e.changedTouches[0];
  if(!touch)return;
  const box=canvas.getBoundingClientRect();
  const localX=(touch.clientX-box.left)/Math.max(1,box.width);
  if(isReel()&&localX<.34&&!stickTouch){
    stickTouch={id:touch.identifier,x:touch.clientX,y:touch.clientY};
    setStickFromTouch(touch,stickTouch);
    return;
  }
  aimFromEvent(e);
  if(commitPlacement())return;
  mouse.down=true;
  fire();
},{passive:false});
canvas.addEventListener('touchmove',e=>{
  e.preventDefault();
  for(const touch of e.changedTouches){
    if(stickTouch&&touch.identifier===stickTouch.id){setStickFromTouch(touch,stickTouch);continue}
    aimFromEvent({changedTouches:[touch]});
  }
},{passive:false});
const endTouch=e=>{
  for(const touch of e.changedTouches){
    if(stickTouch&&touch.identifier===stickTouch.id){stickTouch=null;stick.dx=0;stick.dy=0}
    else mouse.down=false;
  }
};
canvas.addEventListener('touchend',endTouch,{passive:false});
canvas.addEventListener('touchcancel',endTouch,{passive:false});
// WASD is read as physical keys off `document`/`window`, which is correct — but a focused native
// <select> (the weapon dropdown) or <button> can eat plain letter keys as its own type-ahead/activation
// shortcut before a keydown ever reaches our listener. That is a real WebKit/Safari behaviour, not
// something a keydown handler can defend against: the event simply never fires while that control owns
// focus. Every control that can take focus blurs itself the instant it is used, so focus falls back to
// the page and WASD is live again immediately after picking a weapon or pressing any panel button —
// without ever having to click back into the canvas first.
const blurActive=()=>{if(document.activeElement&&document.activeElement!==document.body)document.activeElement.blur()};
const releaseFocus=fn=>(...args)=>{const result=fn(...args);blurActive();return result};
canvas.addEventListener('mousedown',blurActive);
$('#raid-open').onclick=releaseFocus(openHaterRaid);$('#raid-close').onclick=releaseFocus(()=>{closeHaterRaidPicker();showModeScene()});$('#raid-start').onclick=()=>{startHaterRaid();hideGameScene()};$('#raid-exit').onclick=releaseFocus(returnToModeScene);
for(const [tab,button] of Object.entries({originals:$('#raid-tab-originals'),specials:$('#raid-tab-specials')})){
  button.onclick=()=>setRaidTab(tab,{focus:true});
  button.onkeydown=event=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;event.preventDefault();const next=event.key==='ArrowLeft'||event.key==='Home'?'originals':'specials';setRaidTab(next);$('#raid-tab-'+next).focus({preventScroll:true})};
}
for(const button of document.querySelectorAll('[data-scene-action]'))button.onclick=releaseFocus(()=>{
  const action=button.dataset.sceneAction;
  if(action==='stas')chooseStasMode();
  else if(action==='zombie')chooseZombieMode();
  else if(action==='menu')returnToModeScene();
  else if(action==='retry')retryGameResult();
});
const bindOptional=(selector,event,handler)=>{const element=$(selector);if(element)element[event]=releaseFocus(handler)};
bindOptional('#weapon','onchange',showWeapon);bindOptional('#craft','onclick',craft);bindOptional('#test','onclick',testWeapon);bindOptional('#reinforce','onclick',reinforceHouse);bindOptional('#trap','onclick',craftTrap);bindOptional('#turret','onclick',craftTurret);$('#start').onclick=releaseFocus(()=>{
  audio.unlock?.();
  if(state.phase==='survived'||state.phase==='lost'){reset();return}
  if(state.phase==='idle'||state.phase==='break')startNextWave();
});
// Cinema / screencast: hide the weapon-notes sidebar and blow the yard up to the viewport.
// Fullscreen is requested as a bonus; if the browser refuses it the CSS still hides the chrome,
// which is the actual thing needed for a recording.
function isCinema(){return document.body.classList.contains('cinema')}
function syncCinema(on){
  document.body.classList.toggle('cinema',!!on);
  const exit=$('#cinema-exit');
  if(exit)exit.textContent=t('btn_cinema_exit');
  const enter=$('#cinema');
  if(enter)enter.textContent=t(on?'btn_cinema_exit':'btn_cinema');
}
async function toggleCinema(){
  audio.unlock?.();
  const want=!isCinema();
  syncCinema(want);
  try{
    if(want){if(!document.fullscreenElement)await document.documentElement.requestFullscreen?.()}
    else if(document.fullscreenElement)await document.exitFullscreen?.();
  }catch(e){}
  blurActive();
}
$('#cinema').onclick=releaseFocus(toggleCinema);
$('#cinema-exit').onclick=releaseFocus(()=>{
  if(isReel())toggleReel();
  else toggleCinema();
});
document.addEventListener('fullscreenchange',()=>{
  if(!document.fullscreenElement&&isCinema())syncCinema(false);
});
function syncReel(on){
  setReel(on);
  if(on)document.body.classList.remove('cinema');
  applyCanvasSize(canvas);
  const enter=$('#reel');
  if(enter)enter.textContent=t(on?'btn_reel_exit':'btn_reel');
  const exit=$('#cinema-exit');
  if(exit)exit.textContent=t(on?'btn_reel_exit':'btn_cinema_exit');
  setReelUrl(on);
  stick.dx=0;stick.dy=0;stickTouch=null;
}
function toggleReel(){
  audio.unlock?.();
  syncReel(!isReel());
  blurActive();
}
$('#reel').onclick=releaseFocus(toggleReel);
if(wantsReel())syncReel(true);

reset();showModeScene();requestAnimationFrame(loop);
// Developer tooling is opt-in: `index.html?dev=1` loads the balance harness and the render probes.
// A normal play session never fetches the module, so no debug surface exists in the production path.
if(DEV_MODE){
  const devtools=await import('./devtools.js');
  devtools.installDevTools({
    scenario,zombieTypes,mouse,environment,weapons,
    getState:()=>state,getHaterRaid:()=>haterRaid,reset,update,reinforceHouse,boardWindow,totalBoards,
    // The contextual prompt is computed once per frame and never stored, so a probe cannot read it off
    // the state. Handing the function itself over is the only honest way to assert what F would do.
    contextAction:currentAction,
    // Placement legality, for the same reason. Driving it through a synthetic click cannot measure a
    // boundary: the canvas is letterboxed, so one client pixel is ~1.54 world pixels and an integer
    // probe offset never lands on the threshold being tested.
    canPlaceAt,
    startNextWave,
    speakers,
    // `instantSpawn` is module-private, so the harness gets a setter instead of a live binding
    setInstantSpawn:value=>{instantSpawn=value},
    // Shake/hit-stop are module-private closures too. Hooking `ctx.translate` from outside to observe
    // them is exactly the kind of harness fragility this project has hit before (canvas-method
    // monkeypatching interacting badly with the render loop) — a direct read is honest and inert.
    getShake:()=>({shakeTime,shakePower,shakeDuration,hitStop}),
    showGameResult,showModeScene
  });
}
