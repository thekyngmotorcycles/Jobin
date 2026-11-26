export const JCARD_NAME_BADGE_WIDTH=19;
export const JCARD_NAME_BADGE_GAP=4;
export const jcardProfileNameLimits=(cardWidth:number)=>cardWidth<350?{max:16,min:14}:{max:17,min:15};
/** Initial width estimate; native Text enforces final available width. */
export function estimateJCardNameWidth(value:string,size:number,scale:number){
 return Array.from(value).reduce((sum,c)=>sum+(/\s/u.test(c)?0.28:/[ilIíìï.,'!|]/u.test(c)?0.29:/[MW@%&]/u.test(c)?0.88:/[A-ZÁÉÍÓÚÑ]/u.test(c)?0.69:/[mw]/u.test(c)?0.8:/[\u0300-\u036f]/u.test(c)?0:/[^\u0000-\u024f]/u.test(c)?1:0.57),0)*size*Math.max(1,scale);
}
export function fitJCardProfileName(value:string,width:number,cardWidth:number,scale:number){
 const name=value.trim().replace(/\s+/gu," ");
 const {max,min}=jcardProfileNameLimits(cardWidth);
 const lastWidth=Math.max(1,width-JCARD_NAME_BADGE_WIDTH-JCARD_NAME_BADGE_GAP);
 const fits=(s:string,size:number,limit:number)=>estimateJCardNameWidth(s,size,scale)<=limit;
 for(let size=max;size>=min;size--)if(fits(name,size,lastWidth))return {lines:[name],fontSize:size,truncated:false,min,max};
 const chars=Array.from(name);
 const split=(size:number)=>{
  let cut=0;
  for(let i=1;i<chars.length&&fits(chars.slice(0,i).join(""),size,width);i++)cut=i;
  if(!cut)return ["",name];
  const prefix=chars.slice(0,cut).join("");
  const wordCut=prefix.lastIndexOf(" ");
  if(wordCut>0&&chars[cut]!==" "){const first=prefix.slice(0,wordCut);return [first,name.slice(first.length).trimStart()];}
  return [prefix.trimEnd(),chars.slice(cut).join("").trimStart()];
 };
 for(let size=max-1;size>=min;size--){
  const [first,last]=split(size);
  if(first&&last&&fits(last,size,lastWidth))return {lines:[first,last],fontSize:size,truncated:false,min,max};
 }
 const [first,remainder]=split(min);
 const tail=Array.from(remainder);let count=tail.length;
 while(count>0&&!fits(tail.slice(0,count).join("").trimEnd()+"…",min,lastWidth))count--;
 const last=tail.slice(0,count).join("").trimEnd()+"…";
 return {lines:first?[first,last]:[last],fontSize:min,truncated:true,min,max};
}
