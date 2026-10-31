export function rgba(value:string):[number,number,number,number] {
 if(value.startsWith("#")){
  const hex=value.slice(1);const h=hex.length<=4?[...hex].map(c=>c+c).join(""):hex;
  return [parseInt(h.slice(0,2),16),parseInt(h.slice(2,4),16),parseInt(h.slice(4,6),16),h.length===8?parseInt(h.slice(6,8),16)/255:1];
 }
 const parts=value.match(/[\d.]+/g)?.map(Number)??[];
 if(parts.length<3)throw new Error("Unsupported color token");
 return [parts[0],parts[1],parts[2],parts[3]??1];
}
export function opacity(color:string,alpha:number):string {
 const [r,g,b]=rgba(color);return "#"+[r,g,b,Math.round(Math.min(1,Math.max(0,alpha))*255)].map(v=>Math.round(v).toString(16).padStart(2,"0")).join("");
}
export function composite(color:string,background:string):string {
 const [r,g,b,a]=rgba(color);const [br,bg,bb]=rgba(background);
 return "#"+[r*a+br*(1-a),g*a+bg*(1-a),b*a+bb*(1-a)].map(v=>Math.round(v).toString(16).padStart(2,"0")).join("");
}
function luminance(color:string):number {
 const [r,g,b]=rgba(color);const c=[r,g,b].map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4;});
 return c[0]*.2126+c[1]*.7152+c[2]*.0722;
}
export function contrastRatio(foreground:string,background:string):number {
 const f=luminance(composite(foreground,background));const b=luminance(background);
 return (Math.max(f,b)+.05)/(Math.min(f,b)+.05);
}
export function secondaryText(foreground:string,backgrounds:string[]):string {
 for(let alpha=.64;alpha<=1;alpha+=.01){const c=opacity(foreground,alpha);if(backgrounds.every(bg=>contrastRatio(c,bg)>=4.5))return c;}
 return foreground;
}
export function readableInk(preferred:string,backgrounds:string[]):string {
 if(backgrounds.every(bg=>contrastRatio(preferred,bg)>=4.5))return preferred;
 const [r,g,b]=rgba(preferred);
 for(let factor=.95;factor>=0;factor-=.05){
  const candidate="#"+[r,g,b].map(v=>Math.round(v*factor).toString(16).padStart(2,"0")).join("");
  if(backgrounds.every(bg=>contrastRatio(candidate,bg)>=4.5))return candidate;
 }
 return preferred;
}
