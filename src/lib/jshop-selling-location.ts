import AsyncStorage from "@react-native-async-storage/async-storage";
import {requireSupabase} from "./supabase";
import type {JShopPlace} from "./jshop-location-core";

/** Seller's private default and listing-specific one-time map choice.
 * Completely separate from the buyer's search center + radius. */
export type SaleLocation=Pick<JShopPlace,"city"|"label"|"lat"|"lon"|"zoom">;
type SaleRow={seller_id:string;city:string;label:string;location_lat:number;location_lon:number};
const select="seller_id,city,label,location_lat,location_lon";
const pendingKey=(owner:string,session:string)=>"jobeen.jshop.sale-location.pending.v1."+owner+"."+session;
export function validSaleLocation(value:unknown):value is SaleLocation{
 if(!value||typeof value!=="object")return false;
 const p=value as Partial<SaleLocation>;
 return typeof p.city==="string"&&p.city.trim().length>=2&&p.city.length<=90
  &&typeof p.label==="string"&&p.label.trim().length>=2&&p.label.length<=120
  &&typeof p.lat==="number"&&Number.isFinite(p.lat)&&Math.abs(p.lat)<=90
  &&typeof p.lon==="number"&&Number.isFinite(p.lon)&&Math.abs(p.lon)<=180
  &&typeof p.zoom==="number"&&p.zoom>=1&&p.zoom<=18;
}
function fromRow(r:SaleRow):SaleLocation{
 return {city:r.city,label:r.label,lat:r.location_lat,lon:r.location_lon,zoom:11};
}
export async function readDefaultSaleLocation(owner:string):Promise<SaleLocation|null>{
 if(!owner||owner==="guest")return null;
 const {data,error}=await requireSupabase().from("jshop_seller_locations" as never).select(select).eq("seller_id",owner).maybeSingle();
 if(error)throw error;
 return data?fromRow(data as unknown as SaleRow):null;
}
export async function writeDefaultSaleLocation(owner:string,point:SaleLocation):Promise<void>{
 if(!owner||owner==="guest"||!validSaleLocation(point))throw Error("Ubicación de venta inválida.");
 const db=requireSupabase();
 const values={seller_id:owner,city:point.city.trim(),label:point.label.trim(),
  location_lat:point.lat,location_lon:point.lon,updated_at:new Date().toISOString()};
 const {error}=await db.from("jshop_seller_locations" as never).upsert(values as never,{onConflict:"seller_id"});
 if(error)throw error;
}
export async function readPendingArticleLocation(owner:string,session:string):Promise<SaleLocation|null>{
 if(!owner||!session)return null;
 try{const raw=await AsyncStorage.getItem(pendingKey(owner,session));
  if(!raw)return null;
  const p:unknown=JSON.parse(raw);
  return validSaleLocation(p)?p:null;
 }catch{return null;}
}
export async function writePendingArticleLocation(owner:string,session:string,point:SaleLocation):Promise<void>{
 if(!owner||!session||!validSaleLocation(point))throw Error("Ubicación del artículo inválida.");
 await AsyncStorage.setItem(pendingKey(owner,session),JSON.stringify(point));
}
export async function clearPendingArticleLocation(owner:string,session:string):Promise<void>{
 if(owner&&session)await AsyncStorage.removeItem(pendingKey(owner,session));
}
