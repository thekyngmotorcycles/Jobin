/** Present company names on the business JCard in at most two balanced
 * lines. Prefer a word boundary; never split a word when a valid break fits. */
export function wrapBusinessCardName(value:string,maxLine=15,balanced=false):string{
 const normalized=value.trim().replace(/\s+/g," ");
 const name=balanced?normalized:Array.from(normalized).slice(0,maxLine*2).join("");
 if(name.length<=maxLine)return name;
 const boundaries:number[]=[];
 for(let i=1;i<name.length-1;i++)if(name[i]===" "&&i<=maxLine&&name.length-i-1<=maxLine)boundaries.push(i);
 if(balanced&&!boundaries.length)return name;
 const target=balanced?name.length/2:maxLine;
 const split=boundaries.length?boundaries.reduce((best,i)=>Math.abs(target-i)<Math.abs(target-best)?i:best):maxLine;
 return name.slice(0,split).trimEnd()+"\n"+name.slice(split).trimStart();
}
