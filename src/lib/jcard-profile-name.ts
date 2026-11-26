export const JCARD_NAME_BADGE_WIDTH=19;
export const JCARD_NAME_BADGE_GAP=4;
export const JCARD_PROFILE_NAME_MAX=20;
export const jcardProfileNameLimits=(_cardWidth:number)=>({max:15,min:13});
/** Initial width estimate; native Text enforces final available width. */
export function estimateJCardNameWidth(value:string,size:number,scale:number){
 return Array.from(value).reduce((sum,c)=>sum+(/\s/u.test(c)?0.28:/[ilIíìï.,'!|]/u.test(c)?0.29:/[MW@%&]/u.test(c)?0.88:/[A-ZÁÉÍÓÚÑ]/u.test(c)?0.69:/[mw]/u.test(c)?0.8:/[\u0300-\u036f]/u.test(c)?0:/[^\u0000-\u024f]/u.test(c)?1:0.57),0)*size*Math.max(1,scale);
}
/** Limit the visible name, never change the stored legal or business name. */
export function fitJCardProfileName(value:string,width:number,cardWidth:number,scale:number){
 const chars=Array.from(value.trim().replace(/\s+/gu," "));
 const {max,min}=jcardProfileNameLimits(cardWidth);
 const limit=Math.max(1,width-JCARD_NAME_BADGE_WIDTH-JCARD_NAME_BADGE_GAP);
 const shortened=chars.length>JCARD_PROFILE_NAME_MAX;
 const display=shortened?chars.slice(0,JCARD_PROFILE_NAME_MAX-1).join("").trimEnd()+"…":chars.join("");
 const start=chars.length>=JCARD_PROFILE_NAME_MAX?max-1:max;
 const fits=(s:string,size:number)=>estimateJCardNameWidth(s,size,scale)<=limit;
 for(let size=start;size>=min;size--)if(fits(display,size))return {lines:[display],fontSize:size,truncated:shortened,min,max};
 const visible=Array.from(display.replace(/…$/u,""));let count=visible.length;
 while(count>0&&!fits(visible.slice(0,count).join("").trimEnd()+"…",min))count--;
 return {lines:[visible.slice(0,count).join("").trimEnd()+"…"],fontSize:min,truncated:true,min,max};
}
