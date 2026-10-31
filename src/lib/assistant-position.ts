export const ASSISTANT_SIZE=56;
export interface AssistantBounds {minX:number;maxX:number;minY:number;maxY:number}
export interface AssistantPosition {edge:"left"|"right";fraction:number}
export function assistantBounds(width:number,height:number,inset:{top:number;bottom:number;left:number;right:number},navigationHeight:number):AssistantBounds{
 const minX=inset.left+8,minY=inset.top+8;
 return {minX,maxX:Math.max(minX,width-inset.right-ASSISTANT_SIZE-8),minY,maxY:Math.max(minY,height-navigationHeight-ASSISTANT_SIZE-8)};
}
export function clampAssistant(point:{x:number;y:number},bounds:AssistantBounds){
 return {x:Math.min(bounds.maxX,Math.max(bounds.minX,point.x)),y:Math.min(bounds.maxY,Math.max(bounds.minY,point.y))};
}
export function restoreAssistant(value:AssistantPosition,bounds:AssistantBounds){
 return {x:value.edge==="left"?bounds.minX:bounds.maxX,y:bounds.minY+(bounds.maxY-bounds.minY)*Math.min(1,Math.max(0,value.fraction))};
}
export function snapAssistant(point:{x:number;y:number},bounds:AssistantBounds){
 const clamped=clampAssistant(point,bounds);const edge=clamped.x<=(bounds.minX+bounds.maxX)/2?"left":"right";
 const fraction=bounds.maxY===bounds.minY?0:(clamped.y-bounds.minY)/(bounds.maxY-bounds.minY);
 const saved:AssistantPosition={edge,fraction};
 return {point:restoreAssistant(saved,bounds),saved};
}
export function parseAssistantPosition(value:string|null):AssistantPosition|null{
 if(!value)return null;try{const data=JSON.parse(value);return data&&(data.edge==="left"||data.edge==="right")&&typeof data.fraction==="number"&&Number.isFinite(data.fraction)?{edge:data.edge,fraction:Math.min(1,Math.max(0,data.fraction))}:null;}catch{return null;}
}
