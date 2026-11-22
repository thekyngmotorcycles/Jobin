import {requireSupabase,supabase} from "./supabase";
import {captureMessageScope,assertMessageScope,type MessageScope} from "./message-session";
import {sessionMarkerKey} from "./session-lifetime";
import {createBusinessSessionMemory} from "./business-session-memory";
import type {JShopPlace} from "./jshop-location-core";

/** Seller's private default and listing-specific one-time map choice.
 * Completely separate from the buyer's search center + radius. */
export type SaleLocation=Pick<JShopPlace,"city"|"label"|"lat"|"lon"|"zoom">;
type SaleRow={seller_id:string;city:string;label:string;location_lat:number;location_lon:number};
const select="seller_id,city,label,location_lat,location_lon";
// Temporary article locations belong to the exact authentication session and editor ID.
const pending=createBusinessSessionMemory<Map<string,SaleLocation>>();
let observed:string|null=null;
supabase?.auth.onAuthStateChange((event,session)=>{
 let next:string|null=null;
 try{if(session)next=sessionMarkerKey(session.user.id,session.access_token);}catch{}
 if(next!==observed||event==="SIGNED_OUT")pending.clear();
 observed=next;
});
async function confirm(owner:string,expectedScope:MessageScope){
 const scope=await captureMessageScope(expectedScope);
 if(scope.owner!==owner)throw Error("La cuenta cambió.");
 return scope;
}
function validEditor(editor:string){return typeof editor==="string"&&/^[a-zA-Z0-9_-]{1,119}$/.test(editor);}

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
export async function readDefaultSaleLocation(owner:string,expectedScope:MessageScope):Promise<SaleLocation|null>{
 const scope=await confirm(owner,expectedScope);
 const {data,error}=await requireSupabase().from("jshop_seller_locations" as never).select(select).eq("seller_id",owner).maybeSingle();
 if(error)throw error;
 await assertMessageScope(scope);
 if(!data)return null;
 const row=data as unknown as SaleRow;
 if(row.seller_id!==owner)throw Error("La ubicación pertenece a otra cuenta.");
 const place=fromRow(row);
 if(!validSaleLocation(place))throw Error("Ubicación de venta inválida.");
 return place;
}
export async function writeDefaultSaleLocation(owner:string,point:SaleLocation,expectedScope:MessageScope):Promise<void>{
 if(!validSaleLocation(point))throw Error("Ubicación de venta inválida.");
 const scope=await confirm(owner,expectedScope),db=requireSupabase();
 const values={city:point.city.trim(),label:point.label.trim(),
  location_lat:point.lat,location_lon:point.lon,updated_at:new Date().toISOString()};
 await assertMessageScope(scope);
 const update=async()=>{
  await assertMessageScope(scope);
  const {data,error}=await db.from("jshop_seller_locations" as never).update(values as never).eq("seller_id",owner).select("seller_id").single();
  if(error)throw error;
  await assertMessageScope(scope);
  if((data as unknown as {seller_id:string}|null)?.seller_id!==owner)throw Error("No se pudo confirmar la ubicación de venta.");
 };
 const existing=await readDefaultSaleLocation(owner,scope);
 if(existing){await update();return;}
 await assertMessageScope(scope);
 const {error}=await db.from("jshop_seller_locations" as never).insert({seller_id:owner,...values} as never);
 await assertMessageScope(scope);
 if(error?.code==="23505"){await update();return;}
 if(error)throw error;
}
export async function readPendingArticleLocation(owner:string,editor:string,expectedScope:MessageScope):Promise<SaleLocation|null>{
 const scope=await confirm(owner,expectedScope);
 if(!validEditor(editor))throw Error("Editor inválido.");
 const place=pending.read(scope)?.get(editor);
 return place?{...place}:null;
}
export async function writePendingArticleLocation(owner:string,editor:string,point:SaleLocation,expectedScope:MessageScope):Promise<void>{
 if(!validEditor(editor)||!validSaleLocation(point))throw Error("Ubicación del artículo inválida.");
 const scope=await confirm(owner,expectedScope);
 const entries=new Map(pending.read(scope)??[]);
 entries.set(editor,{...point});
 if(entries.size>20){const first=entries.keys().next().value;if(first!==undefined)entries.delete(first);}
 pending.write(scope,entries);
}
export async function clearPendingArticleLocation(owner:string,editor:string,expectedScope:MessageScope):Promise<void>{
 const scope=await confirm(owner,expectedScope);
 if(!validEditor(editor))throw Error("Editor inválido.");
 const entries=new Map(pending.read(scope)??[]);
 entries.delete(editor);pending.write(scope,entries);
}
