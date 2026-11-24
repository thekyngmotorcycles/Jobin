export function playbackFraction(position:number,duration:number):number {
 if(!Number.isFinite(position)||!Number.isFinite(duration)||duration<=0)return 0;
 return Math.min(1,Math.max(0,position/duration));
}
export function seekPosition(x:number,width:number,duration:number):number {
 if(!Number.isFinite(duration)||duration<=0)return 0;
 return playbackFraction(x,width)*duration;
}
export function playbackTime(seconds:number):string {
 const safe=Number.isFinite(seconds)?Math.max(0,Math.floor(seconds)):0;
 return Math.floor(safe/60)+":"+String(safe%60).padStart(2,"0");
}
