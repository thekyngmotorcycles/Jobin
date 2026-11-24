export const POST_PHOTO_LIMIT=10;
export const FEED_VISIBLE_PHOTOS=4;
export type PhotoTile={index:number;x:number;y:number;width:number;height:number};
export function feedPhotoTiles(count:number,width:number,gap=3):{height:number;tiles:PhotoTile[]}{
 if(!Number.isInteger(count)||count<1||!Number.isFinite(width)||width<=0)return {height:0,tiles:[]};
 const height=Math.round(width*0.75),n=Math.min(count,FEED_VISIBLE_PHOTOS),half=(width-gap)/2,halfH=(height-gap)/2;
 const tile=(index:number,x:number,y:number,w:number,h:number)=>({index,x,y,width:w,height:h});
 if(n===1)return {height,tiles:[tile(0,0,0,width,height)]};
 if(n===2)return {height,tiles:[tile(0,0,0,half,height),tile(1,half+gap,0,half,height)]};
 if(n===3){const lead=Math.round((width-gap)*0.65),side=width-gap-lead;return {height,tiles:[tile(0,0,0,lead,height),tile(1,lead+gap,0,side,halfH),tile(2,lead+gap,halfH+gap,side,halfH)]};}
 return {height,tiles:[tile(0,0,0,half,halfH),tile(1,half+gap,0,half,halfH),tile(2,0,halfH+gap,half,halfH),tile(3,half+gap,halfH+gap,half,halfH)]};
}
