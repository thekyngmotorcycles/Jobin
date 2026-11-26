/** Shared personal portrait proportion; business selection remains square. */
export const JCARD_PERSONAL_PORTRAIT_HEIGHT_RATIO=1.1;
export type AvatarSize={width:number;height:number};
export type AvatarOffset={x:number;y:number};
export function avatarEditorFrame(width:number,business:boolean):AvatarSize{
 return {width,height:Math.round(width*(business?1:JCARD_PERSONAL_PORTRAIT_HEIGHT_RATIO))};
}
export function avatarEditorLayout(frame:AvatarSize,source:AvatarSize,zoom:number,offset:AvatarOffset){
 const scale=Math.max(frame.width/source.width,frame.height/source.height)*zoom;
 const displayWidth=source.width*scale,displayHeight=source.height*scale;
 const maxX=Math.max(0,(displayWidth-frame.width)/2),maxY=Math.max(0,(displayHeight-frame.height)/2);
 const dx=Math.max(-maxX,Math.min(maxX,offset.x)),dy=Math.max(-maxY,Math.min(maxY,offset.y));
 return {scale,displayWidth,displayHeight,dx,dy,maxX,maxY};
}
export function avatarEditorCrop(frame:AvatarSize,source:AvatarSize,zoom:number,offset:AvatarOffset){
 const {scale,dx,dy}=avatarEditorLayout(frame,source,zoom,offset);
 const width=Math.max(1,Math.min(source.width,Math.floor(frame.width/scale)));
 const height=Math.max(1,Math.min(source.height,Math.floor(frame.height/scale)));
 const originX=Math.max(0,Math.min(source.width-width,Math.round((source.width-width)/2-dx/scale)));
 const originY=Math.max(0,Math.min(source.height-height,Math.round((source.height-height)/2-dy/scale)));
 return {originX,originY,width,height};
}
