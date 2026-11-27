/** Private viewer return; never accepts arbitrary origins or routes, and never stores credentials. */
export const VIEWER_RETURN_KEY="jobeen:viewer-return:v1";
const pages=["/profile","/","/videos","/shop","/inbox"] as const;
const devices=["standard","iphone","galaxy","jelly","wide"] as const;
type Page=typeof pages[number];
export function viewerFramePage(parentPath:string,page:string|null):Page|null{
 return parentPath==="/device-preview.html"&&pages.some(value=>value===page)?page as Page:null;
}
export function readViewerReturn(raw:string|null,now:number):string|null{
 if(!raw||raw.length>512)return null;
 try{
  const value=JSON.parse(raw);
  if(!value||!Number.isFinite(value.created)||value.created>now||now-value.created>15*60*1000)return null;
  const page=viewerFramePage("/device-preview.html",value.page);
  if(!page||!devices.some(device=>device===value.device)||!Number.isInteger(value.width)||value.width<320||value.width>440)return null;
  return "/device-preview.html?device="+encodeURIComponent(value.device)+"&width="+value.width+"&page="+encodeURIComponent(page);
 }catch{return null;}
}
