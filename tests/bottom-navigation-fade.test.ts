import assert from "node:assert/strict";
import test from "node:test";
import {bottomNavigationFade} from "../src/theme/navigation-fade.ts";

function alpha(stops:readonly {offset:number;opacity:number}[],offset:number){
 for(let i=1;i<stops.length;i++){
  const a=stops[i-1],b=stops[i];
  if(offset<=b.offset)return a.opacity+(b.opacity-a.opacity)*(offset-a.offset)/(b.offset-a.offset);
 }
 return stops[stops.length-1].opacity;
}

test("bottom navigation retains the exact original fade above the five-icon row",()=>{
 for(const inset of [0,12,24,34,48])for(const originalOpacity of [.46,.65,.85,1]){
  const row=58;
  const {height,stops}=bottomNavigationFade(row,inset,originalOpacity);
  assert.equal(height,row+inset+100);
  const center=(height-inset-row/2)/height;
  const original=[{offset:0,opacity:0},{offset:center*.4,opacity:.035},{offset:center,opacity:originalOpacity},{offset:1,opacity:1}];
  for(let y=0;y<=100;y++){
   assert.ok(Math.abs(alpha(stops,y/height)-alpha(original,y/height))<1e-10,`opacity changed above icons at ${y}dp, inset ${inset}`);
  }
  assert.equal(alpha(stops,center),1);
  assert.ok(stops.every((s,i)=>s.opacity>=0&&s.opacity<=1&&(i===0||s.offset>stops[i-1].offset)));
  for(let y=100;y<=height;y++)assert.ok(alpha(stops,y/height)+1e-10>=alpha(original,y/height));
 }
});
