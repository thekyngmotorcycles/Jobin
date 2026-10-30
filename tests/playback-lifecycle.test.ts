import assert from "node:assert/strict";
import test from "node:test";
import { bindPlaybackLifecycle,type PlaybackState } from "../src/lib/playback-lifecycle.ts";

function harness(){
 const calls:string[]=[];let released=false;let removed=false;
 let listener:((state:PlaybackState)=>void)|undefined;
 const player={
  play(){if(released)throw new Error("Cannot use shared object that was already released");calls.push("play");},
  pause(){if(released)throw new Error("Cannot use shared object that was already released");calls.push("pause");}
 };
 return{player,calls,release(){released=true;},emit(state:PlaybackState){listener?.(state);},get removed(){return removed;},
 subscribe(callback:(state:PlaybackState)=>void){listener=callback;return()=>{removed=true;};}
 };
}
test("active playback pauses in background and resumes only when foregrounded",()=>{
 const h=harness();const cleanup=bindPlaybackLifecycle(h.player,true,"active",h.subscribe);
 h.emit("background");h.emit("active");
 assert.deepEqual(h.calls,["play","pause","play"]);
 cleanup();assert.equal(h.removed,true);
});
test("a hidden or paused card never starts playing on foreground events",()=>{
 const h=harness();const cleanup=bindPlaybackLifecycle(h.player,false,"active",h.subscribe);
 h.emit("background");h.emit("active");
 assert.ok(h.calls.every(call=>call==="pause"));
 cleanup();
 const background=harness();const stop=bindPlaybackLifecycle(background.player,true,"background",background.subscribe);
 assert.deepEqual(background.calls,["pause"]);stop();
});
test("Expo may release the player before effect cleanup; cleanup and late callbacks must not touch it",()=>{
 const h=harness();const cleanup=bindPlaybackLifecycle(h.player,true,"active",h.subscribe);
 h.release();
 assert.doesNotThrow(cleanup);
 assert.equal(h.removed,true);
 assert.doesNotThrow(()=>h.emit("background"));
 assert.doesNotThrow(()=>h.emit("active"));
 assert.deepEqual(h.calls,["play"]);
});
test("rapidly replacing the active card does not let old foreground listeners restart it",()=>{
 const old=harness();const stopOld=bindPlaybackLifecycle(old.player,true,"active",old.subscribe);
 stopOld();old.release();
 const next=harness();const stopNext=bindPlaybackLifecycle(next.player,false,"active",next.subscribe);
 old.emit("active");next.emit("active");
 assert.deepEqual(old.calls,["play"]);
 assert.deepEqual(next.calls,["pause","pause"]);
 stopNext();
});
