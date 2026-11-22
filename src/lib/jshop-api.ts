import * as ImageManipulator from "expo-image-manipulator";
import {requireSupabase} from "./supabase";
import type {JShopDraft,JShopListing} from "./jshop-model";
import type {JShopPlace} from "./jshop-location-core";
import {readDefaultSaleLocation} from "./jshop-selling-location";
import {captureMessageScope,assertMessageScope,type MessageScope} from "./message-session";
import {insideJShopRadius} from "./jshop-geo";

const BUCKET="jshop-photos";
type ListingRow={
 id:string;seller_id:string;title:string;description:string;category:JShopListing["category"];
 item_condition:JShopListing["condition"];price:number|string;currency:JShopListing["currency"];
 location:string;location_lat:number|null;location_lon:number|null;photo_paths:string[];status:JShopListing["status"];created_at:string;updated_at:string;
};
function client(){return requireSupabase();}
function publicImage(path:string){return client().storage.from(BUCKET).getPublicUrl(path).data.publicUrl;}
async function hydrate(rows:ListingRow[],scope:MessageScope):Promise<JShopListing[]>{
 await assertMessageScope(scope);
 if(!rows.length)return [];
 const db=client();const sellers=[...new Set(rows.map(row=>row.seller_id))];
 const [profileRows,handles]=await Promise.all([
  db.from("profiles").select("id,display_name").in("id",sellers),
  db.from("jcard_profiles").select("profile_id,handle").in("profile_id",sellers)
 ]);
 await assertMessageScope(scope);
 if(profileRows.error)throw profileRows.error;
 if(handles.error)throw handles.error;
 const profiles=new Map((profileRows.data??[]).map(row=>[row.id,row.display_name??"Vendedor"]));
 const names=new Map((handles.data??[]).map(row=>[row.profile_id,row.handle??""]));
 return rows.map(row=>({
  id:row.id,sellerId:row.seller_id,sellerName:profiles.get(row.seller_id)??"Vendedor",
  sellerHandle:names.get(row.seller_id)??"",title:row.title,description:row.description,
  category:row.category,condition:row.item_condition,price:Number(row.price),
  currency:row.currency,location:row.location,locationLat:row.location_lat,locationLon:row.location_lon,photos:row.photo_paths.filter(path=>ownedPhotoPath(row.seller_id,path)).map(publicImage),
  photoPaths:row.photo_paths.filter(path=>ownedPhotoPath(row.seller_id,path)),createdAt:Date.parse(row.created_at),updatedAt:Date.parse(row.updated_at),
  status:row.status
 }));
}
const selection="id,seller_id,title,description,category,item_condition,price,currency,location,location_lat,location_lon,photo_paths,status,created_at,updated_at";
async function confirm(ownerId:string,expectedScope:MessageScope){
 const scope=await captureMessageScope(expectedScope);
 if(scope.owner!==ownerId)throw Error("La cuenta cambió.");
 return scope;
}
function ownedPhotoPath(owner:string,path:string){
 return typeof path==="string"&&path.startsWith(owner+"/")&&path.length>owner.length+1&&path.length<=260&&!path.includes("..")&&/^[a-zA-Z0-9_./-]+$/.test(path);
}
export async function loadJShopListings(expectedScope:MessageScope):Promise<JShopListing[]>{
 const scope=await captureMessageScope(expectedScope);
 const {data,error}=await client().from("jshop_listings" as never).select(selection).eq("status","published").order("created_at",{ascending:false}).limit(150);
 if(error)throw error;
 await assertMessageScope(scope);
 return hydrate((data??[]) as unknown as ListingRow[],scope);
}
/** Query actual physical distance in Postgres under the listing RLS. */
export async function loadJShopListingsNear(place:JShopPlace,expectedScope:MessageScope):Promise<JShopListing[]>{
 const scope=await captureMessageScope(expectedScope),radius=place.radiusMiles??10;
 const {data,error}=await client().rpc("jshop_listings_within_area" as never,
  {p_lat:place.lat,p_lon:place.lon,p_radius_miles:radius,p_limit:150} as never);
 if(error)throw error;
 await assertMessageScope(scope);
 const rows=(data??[]) as unknown as ListingRow[];
 return hydrate(rows.filter(row=>row.location_lat!==null&&row.location_lon!==null&&
  insideJShopRadius({lat:place.lat,lon:place.lon},{lat:row.location_lat,lon:row.location_lon},radius)),scope);
}
export async function loadMyJShopListings(ownerId:string,expectedScope:MessageScope):Promise<JShopListing[]>{
 const scope=await confirm(ownerId,expectedScope);
 const {data,error}=await client().from("jshop_listings" as never).select(selection).eq("seller_id",ownerId).order("created_at",{ascending:false}).limit(150);
 if(error)throw error;
 await assertMessageScope(scope);
 const rows=(data??[]) as unknown as ListingRow[];
 if(rows.some(row=>row.seller_id!==scope.owner))throw Error("No se pudo verificar la titularidad del anuncio.");
 return hydrate(rows,scope);
}
export async function loadJShopListing(id:string,expectedScope:MessageScope):Promise<JShopListing|null>{
 const scope=await captureMessageScope(expectedScope);
 if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id))return null;
 const {data,error}=await client().from("jshop_listings" as never).select(selection).eq("id",id).maybeSingle();
 if(error)throw error;
 await assertMessageScope(scope);
 if(data&&(data as unknown as ListingRow).id!==id)throw Error("No se pudo verificar el anuncio.");
 return data?(await hydrate([data as unknown as ListingRow],scope))[0]:null;
}
export async function loadJShopFavoriteIds(ownerId:string,expectedScope:MessageScope):Promise<string[]>{
 const scope=await confirm(ownerId,expectedScope);
 const {data,error}=await client().from("jshop_favorites" as never).select("listing_id,user_id").eq("user_id",ownerId).limit(500);
 if(error)throw error;
 await assertMessageScope(scope);
 const rows=(data??[]) as unknown as {listing_id:string;user_id:string}[];
 if(rows.some(row=>row.user_id!==scope.owner))throw Error("No se pudo verificar los favoritos.");
 return rows.map(x=>x.listing_id);
}
export async function loadFavoriteJShopListings(ownerId:string,expectedScope:MessageScope):Promise<JShopListing[]>{
 const scope=await confirm(ownerId,expectedScope),ids=await loadJShopFavoriteIds(ownerId,scope);
 if(!ids.length)return [];
 await assertMessageScope(scope);
 const {data,error}=await client().from("jshop_listings" as never).select(selection).in("id",ids).eq("status","published");
 if(error)throw error;
 await assertMessageScope(scope);
 return hydrate((data??[]) as unknown as ListingRow[],scope);
}
export async function setJShopFavorite(ownerId:string,listingId:string,saved:boolean,expectedScope:MessageScope){
 const scope=await confirm(ownerId,expectedScope),db=client();
 if(saved){
  const {error}=await db.from("jshop_favorites" as never).insert({user_id:scope.owner,listing_id:listingId} as never);
  if(error&&error.code!=="23505")throw error;
 }else{
  const {error}=await db.from("jshop_favorites" as never).delete().eq("user_id",scope.owner).eq("listing_id",listingId);
  if(error)throw error;
 }
 await assertMessageScope(scope);
}
export async function reportJShopListing(listingId:string,reporterId:string,reason:string,details:string,expectedScope:MessageScope){
 const scope=await confirm(reporterId,expectedScope);
 const {error}=await client().from("jshop_reports" as never).insert({listing_id:listingId,reporter_id:scope.owner,reason,details:details.trim()} as never);
 if(error)throw error;
 await assertMessageScope(scope);
}
export async function setJShopListingStatus(ownerId:string,id:string,status:"published"|"paused"|"sold",expectedScope:MessageScope){
 const scope=await confirm(ownerId,expectedScope);
 const {data,error}=await client().from("jshop_listings" as never).update({status} as never).eq("id",id).eq("seller_id",scope.owner).select("id").maybeSingle();
 if(error)throw error;
 await assertMessageScope(scope);
 if(!data)throw Error("No se pudo cambiar el estado de tu anuncio.");
}
export async function deleteJShopListing(ownerId:string,item:JShopListing,expectedScope:MessageScope){
 const scope=await confirm(ownerId,expectedScope);
 if(item.sellerId!==scope.owner)throw Error("El anuncio pertenece a otra cuenta.");
 const {data,error}=await client().from("jshop_listings" as never).delete().eq("id",item.id).eq("seller_id",scope.owner).select("id").maybeSingle();
 if(error)throw error;
 await assertMessageScope(scope);
 if(!data)throw Error("No se pudo eliminar el anuncio.");
 // Never delete user-supplied or cached object paths. Other listings may still
 // reference these files; reconcile orphaned objects on the server separately.
}
export async function publishJShopDraft(ownerId:string,draft:JShopDraft,expectedScope:MessageScope):Promise<string>{
 const scope=await captureMessageScope(expectedScope);
 if(scope.owner!==ownerId)throw Error("La cuenta cambió.");
 if(draft.ownerId!==ownerId)throw Error("Este borrador pertenece a otra cuenta.");
 if(draft.title.trim().length<3||!draft.description.trim()||draft.price===null||draft.price<=0||!draft.location.trim())
  throw Error("Completa título, descripción, precio y ubicación antes de publicar.");
 if(!draft.photos.length||draft.photos.length>5)throw Error("Añade entre 1 y 5 fotografías para publicar.");
 if(typeof draft.locationLat!=="number"||typeof draft.locationLon!=="number"
  ||!Number.isFinite(draft.locationLat)||!Number.isFinite(draft.locationLon)
  ||Math.abs(draft.locationLat)>90||Math.abs(draft.locationLon)>180)
  throw Error("Elige la ubicación del artículo en el mapa antes de publicar.");
 const saleDefault=await readDefaultSaleLocation(ownerId,scope);
 if(!saleDefault)throw Error("Configurá primero tu ubicación de venta en JShop.");
 const locationPoint={lat:Number(draft.locationLat.toFixed(2)),lon:Number(draft.locationLon.toFixed(2))};
 const db=client();const uploaded:string[]=[];let insertStarted=false;
 try{
  for(const [i,uri] of draft.photos.entries()){
   await assertMessageScope(scope);
   const normalized=await ImageManipulator.manipulateAsync(uri,[{resize:{width:1400}}],{compress:0.76,format:ImageManipulator.SaveFormat.JPEG,base64:true});
   if(!normalized.base64)throw Error("No se pudo leer una fotografía.");
   const decoded=atob(normalized.base64);const bytes=new Uint8Array(decoded.length);
   for(let n=0;n<decoded.length;n++)bytes[n]=decoded.charCodeAt(n);
   if(bytes.byteLength>6291456)throw Error("Una fotografía supera 6 MB.");
   const path=ownerId+"/"+Date.now()+"-"+i+"-"+Math.random().toString(36).slice(2,12)+".jpg";
   await assertMessageScope(scope);
   const {error}=await db.storage.from(BUCKET).upload(path,bytes,{contentType:"image/jpeg",upsert:false});
   if(error)throw error;
   uploaded.push(path);await assertMessageScope(scope);
  }
  await assertMessageScope(scope);insertStarted=true;
  const {data,error}=await db.from("jshop_listings" as never).insert({
   seller_id:ownerId,title:draft.title.trim(),description:draft.description.trim(),
   category:draft.category,item_condition:draft.condition,price:draft.price,currency:draft.currency,
   location:draft.location.trim(),location_lat:locationPoint.lat,location_lon:locationPoint.lon,photo_paths:uploaded,status:"published"
  } as never).select("id").single();
  if(error)throw error;
  await assertMessageScope(scope);
  return (data as unknown as {id:string}).id;
 }catch(e){
  // After an insert was attempted, do not delete possibly committed media.
  if(!insertStarted&&uploaded.length){try{await captureMessageScope(scope);await db.storage.from(BUCKET).remove(uploaded);}catch{/* retain for owner reconciliation */}}
  throw e;
 }
}
