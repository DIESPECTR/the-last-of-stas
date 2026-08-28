// Developer-only surface, imported exclusively when the page is opened with `?dev=1`.
//
// Everything here used to live in `game.js` behind `TEMP DEBUG` comments, which meant a normal play
// session still shipped a balance harness and mutable references to the whole game state. Keeping it
// in its own module makes the production path clean while the tooling stays available on demand.

export function installDevTools(api){
  const {scenario,zombieTypes,mouse,environment,getState,getHaterRaid,reset,update,reinforceHouse,boardWindow,totalBoards,setInstantSpawn,contextAction,canPlaceAt,getShake,startNextWave,speakers,showGameResult,showModeScene}=api;
  // Live inspection handles. `state` and `raid` are getters because sessions replace their objects,
  // and a plain copy would silently point at a previous attempt.
  window.__dev={get state(){return getState()},get raid(){return getHaterRaid?.()||null},environment,scenario,zombieTypes,speakers};
  window.__dev.scene=key=>{if(key==='menu')showModeScene();else showGameResult(key);return document.querySelector('#game-scene')?.hidden===false};
  window.__dev.startWave=index=>{
    const state=getState();
    if(Number.isInteger(index))state.wave=Math.max(0,Math.min(scenario.waves.length-1,index));
    startNextWave();
    return {wave:state.wave,phase:state.phase,boss:state.zombies.find(z=>z.id==='big_russian_boss')||null};
  };
  window.__dev.setBossHp=ratio=>{
    const state=getState(),boss=state.zombies.find(z=>z.id==='big_russian_boss');
    if(!boss)return null;
    boss.hp=Math.max(1,Math.round(zombieTypes.get('big_russian_boss').hp*Math.max(0,Math.min(1,ratio))));
    update(1/60);
    return {hp:boss.hp,phase:state.bossEncounter?.phase,friends:state.zombies.filter(z=>z.id!=='big_russian_boss').map(z=>z.id)};
  };

  // Camera shake / hit-stop, read directly off the module's own closures rather than by hooking a
  // canvas method: monkeypatching `ctx.translate` from a probe interacted badly with the render loop
  // (the loop kept running but subsequent draws misbehaved), which is a harness defect, not a game one.
  window.__dev.shake=()=>getShake();

  // What the F key would do right now, and the label the player is being shown above the survivor.
  // Exposed as a call rather than a value because the prompt is derived per frame and stored nowhere.
  window.__dev.prompt=()=>{
    const state=getState();
    const action=contextAction(state.interaction,state.shelter,state.player,state.salvage);
    return {kind:action.kind,label:action.label};
  };

  // Placement legality at an exact world position. A synthetic click cannot test a boundary because the
  // canvas is letterboxed (~1.54 world px per client px), so an integer offset never lands on the
  // threshold; this asks the same function the placement code asks, with no quantisation in between.
  window.__dev.canPlace=(x,y,kind='trap')=>{
    const state=getState();
    return canPlaceAt(state.interaction,state.shelter,state.player,x,y,kind);
  };

  // Deterministic balance harness. It steps the siege at a fixed dt with instant wave spawns, so a
  // whole night runs in milliseconds and the same seed always produces the same night. Real-time
  // tab-based balancing was unrepeatable: every run had a different frame budget and a different outcome.
  window.__dev.sim=(opts={})=>{
    const {defend=false,boards=0,reinforce=false,dt=1/60,seed=1}=opts;
    let seedState=seed>>>0||1;
    const realRandom=Math.random;
    Math.random=()=>{seedState=(seedState*1103515245+12345)%2147483648;return seedState/2147483648};
    reset();
    // The session object is rebuilt by reset(), so the reference has to be taken afterwards
    const state=getState();
    if(reinforce)reinforceHouse();
    for(let i=0;i<boards;i++)boardWindow(state.shelter,state.shelter.windows[i%state.shelter.windows.length]);
    state.running=true;state.phase='idle';state.elapsed=0;state.wave=0;
    setInstantSpawn(true);
    if(typeof startNextWave==='function')startNextWave();
    else state.phase='wave';
    const samples=[];let guard=0,nextSample=0;
    while((state.phase==='wave'||state.phase==='break')&&guard++<40000){
      if(state.phase==='break'){
        if(state.wave>=scenario.waves.length)break;
        if(typeof startNextWave==='function')startNextWave();
        else break;
      }
      if(defend){
        // The reference defender: stands in the middle of the floor, keeps the nearest body under the
        // cursor, holds the trigger and clears every jam the moment it happens.
        state.player.x=state.shelter.centerX;state.player.y=state.shelter.centerY;
        let best=null,bestDistance=1e9;
        for(const zombie of state.zombies){const d=Math.hypot(zombie.x-state.player.x,zombie.y-state.player.y);if(d<bestDistance){bestDistance=d;best=zombie}}
        if(best){mouse.x=best.x;mouse.y=best.y;mouse.down=true;if(state.player.failed){state.player.failed=false;state.player.heat*=.4}}
        else mouse.down=false;
      }else mouse.down=false;
      update(dt);
      if(state.elapsed>=nextSample){samples.push({t:Math.round(state.elapsed),hp:Math.ceil(state.shelter.hp),z:state.zombies.length,kills:state.kills});nextSample+=8}
    }
    mouse.down=false;setInstantSpawn(false);Math.random=realRandom;state.running=false;
    return {outcome:state.phase,at:+state.elapsed.toFixed(1),endHp:Math.ceil(state.shelter.hp),maxHp:Math.ceil(state.shelter.maxHp),kills:state.kills,planks:totalBoards(state.shelter),samples};
  };

  // Weapon-layer regression probe. It records, per frame, the ORDER in which the body sheet and the
  // weapon texture are drawn. An untagged capture is ambiguous, because an alternating stream reads the
  // same whichever element comes first, so every draw is stamped with a frame id.
  window.__dev.captureLayers=(frames=4)=>new Promise(resolve=>{
    const proto=CanvasRenderingContext2D.prototype,original=proto.drawImage;
    const log=[];let frameId=0,seen=0;
    proto.drawImage=function(image){
      const source=(image&&image.src)||'';
      if(this.canvas&&this.canvas.id==='game'){
        if(source.includes('/animations/sheets/survivor'))log.push([frameId,'BODY',source.split('/').pop()]);
        else if(source.includes('/weapons/'))log.push([frameId,'WEAPON',source.split('/').pop()]);
      }
      return original.apply(this,arguments);
    };
    const tick=()=>{
      frameId++;
      // The first captured frame is discarded: instrumentation can attach mid-frame
      if(++seen>frames+1){
        proto.drawImage=original;
        const byFrame=new Map();
        for(const [id,layer,file] of log){if(!byFrame.has(id))byFrame.set(id,[]);byFrame.get(id).push(layer+':'+file)}
        resolve([...byFrame.entries()].slice(1).map(([id,draws])=>({frame:id,order:draws.join(' > ')})));
        return;
      }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });

  // Weapon anchor probe: reports the transform the weapon layer is actually drawn with, so the hand
  // position and the aim rotation can be verified numerically instead of by eye.
  window.__dev.captureWeaponTransform=()=>new Promise(resolve=>{
    const proto=CanvasRenderingContext2D.prototype,original=proto.drawImage;
    const hits=[];
    proto.drawImage=function(image){
      const source=(image&&image.src)||'';
      if(source.includes('/weapons/')&&this.canvas&&this.canvas.id==='game'){
        const matrix=this.getTransform();
        hits.push({file:source.split('/').pop(),tx:+matrix.e.toFixed(1),ty:+matrix.f.toFixed(1),rot:+(Math.atan2(matrix.b,matrix.a)*180/Math.PI).toFixed(1)});
      }
      return original.apply(this,arguments);
    };
    requestAnimationFrame(()=>requestAnimationFrame(()=>{proto.drawImage=original;resolve(hits[hits.length-1]||null)}));
  });

  return window.__dev;
}
