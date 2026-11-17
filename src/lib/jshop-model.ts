/** JShop presentation models shared by public listings and local drafts. */
export const JSHOP_CATEGORIES=["Todo","Herramientas","Tecnología","Vehículos","Hogar","Moda","Repuestos","Otros"] as const;
export type JShopCategory=Exclude<(typeof JSHOP_CATEGORIES)[number],"Todo">;
export const JSHOP_CONDITIONS=["Nuevo","Usado"] as const;
export type JShopCondition=(typeof JSHOP_CONDITIONS)[number];
export const JSHOP_CURRENCIES=["USD","ARS","PEN"] as const;
export type JShopCurrency=(typeof JSHOP_CURRENCIES)[number];
export type JShopOrder="recent"|"price_low"|"price_high";
export type JShopDraft={
 id:string;ownerId:string;title:string;description:string;category:JShopCategory;
 condition:JShopCondition;price:number|null;currency:JShopCurrency;location:string;locationLat?:number|null;locationLon?:number|null;
 photos:string[];createdAt:number;updatedAt:number;
};
export type JShopListing=Omit<JShopDraft,"ownerId">&{
 sellerId:string;sellerName:string;sellerHandle:string;locationLat?:number|null;locationLon?:number|null;photoPaths?:string[];status:"published"|"paused"|"sold";
};
export type JShopFilters={query:string;category:(typeof JSHOP_CATEGORIES)[number];condition:"Todas"|JShopCondition;location:string;minPrice:string;maxPrice:string;order:JShopOrder};
export const DEFAULT_JSHOP_FILTERS:JShopFilters={query:"",category:"Todo",condition:"Todas",location:"",minPrice:"",maxPrice:"",order:"recent"};
export function formatJShopPrice(price:number|null,currency:JShopCurrency):string{
 if(price===null||!Number.isFinite(price)||price<=0)return "Precio sin definir";
 return currency+" "+new Intl.NumberFormat("es",{maximumFractionDigits:2}).format(price);
}
export function parseJShopPrice(text:string):number|null{
 const value=text.trim().replace(/\s/g,"");
 if(!value||!/^[0-9.,]+$/.test(value))return null;
 const comma=value.lastIndexOf(","),dot=value.lastIndexOf(".");
 let normalized=value;
 if(comma>=0&&dot>=0){
  const decimal=comma>dot?",":".";
  const grouping=decimal===","?".":",";
  normalized=value.split(grouping).join("").replace(decimal,".");
 }else if(comma>=0||dot>=0){
  const separator=comma>=0?",":".";
  const parts=value.split(separator);
  if(parts.length>2||parts.length===2&&parts[1].length===3&&parts[0].length<=3)normalized=parts.join("");
  else normalized=parts.join(".");
 }
 const amount=Number(normalized);
 return Number.isFinite(amount)&&amount>0&&amount<=1000000000?Math.round(amount*100)/100:null;
}

export function filterJShopListings(items:readonly JShopListing[],filter:JShopFilters):JShopListing[]{
 const search=filter.query.trim().toLocaleLowerCase();
 const place=filter.location.trim().toLocaleLowerCase();
 const min=parseJShopPrice(filter.minPrice),max=parseJShopPrice(filter.maxPrice);
 const result=items.filter(item=>{
  if(filter.category!=="Todo"&&filter.category!==item.category)return false;
  if(filter.condition!=="Todas"&&filter.condition!==item.condition)return false;
  if(place&&!item.location.toLocaleLowerCase().includes(place))return false;
  if(search&&!(item.title+" "+item.description+" "+item.sellerName+" "+item.category).toLocaleLowerCase().includes(search))return false;
  if(min!==null&&(item.price===null||item.price<min))return false;
  if(max!==null&&(item.price===null||item.price>max))return false;
  return true;
 });
 return result.sort((a,b)=>{
  if(filter.order==="price_low")return (a.price??Number.MAX_SAFE_INTEGER)-(b.price??Number.MAX_SAFE_INTEGER);
  if(filter.order==="price_high")return (b.price??-1)-(a.price??-1);
  return b.createdAt-a.createdAt;
 });
}
