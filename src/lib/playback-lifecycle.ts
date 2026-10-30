export interface PlaybackControl { play():void; pause():void }
export type PlaybackState=string|null;
export type SubscribeToAppState=(listener:(state:PlaybackState)=>void)=>()=>void;

/**
 * Manage playback while mounted, without owning the native player's lifetime.
 * useVideoPlayer releases its shared object during unmount before later effect
 * cleanups. Teardown must only detach our listener, never call the native player.
 */
export function bindPlaybackLifecycle(player:PlaybackControl,wantsPlayback:boolean,initialState:PlaybackState,subscribe:SubscribeToAppState):()=>void {
 let disposed=false;
 function sync(state:PlaybackState){
  if(disposed)return;
  if(wantsPlayback&&(state==="active"||state===null))player.play();
  else player.pause();
 }
 sync(initialState);
 const unsubscribe=subscribe(sync);
 return()=>{
  disposed=true;
  unsubscribe();
 };
}
