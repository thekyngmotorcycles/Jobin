import {requireSupabase} from "./supabase";
import type {MapPoint} from "./jshop-location-core";

export type DiscoveryKind="all"|"company"|"professional";
export type DiscoveredProfile={
 id:string;name:string;kind:"company"|"professional";city:string;service:string;
 latitude:number;longitude:number;distance_km:number;
};
export type MapPresence={
 owner_id:string;kind:"company"|"professional";city:string;service:string;
 latitude:number;longitude:number;is_visible:boolean;
};
function valid(point:MapPoint){
 return Number.isFinite(point.lat)&&Number.isFinite(point.lon)&&Math.abs(point.lat)<=85&&Math.abs(point.lon)<=180;
}
export async function discoverMapProfiles(center:MapPoint,radiusKm:number,query:string,kind:DiscoveryKind):Promise<DiscoveredProfile[]>{
 if(!valid(center))throw Error("Elige una zona válida.");
 const db=requireSupabase();
 const {data,error}=await db.rpc("jobeen_find_profiles_on_map" as never,{
  p_lat:center.lat,p_lon:center.lon,p_radius_km:radiusKm,p_query:query.trim().slice(0,100),p_kind:kind
 } as never);
 if(error)throw Error(error.message);
 return (data??[]) as unknown as DiscoveredProfile[];
}
export async function myMapPresence():Promise<{presence:MapPresence|null;kind:"company"|"professional"|null;allowedKinds:("company"|"professional")[];profileId:string}>{
 const db=requireSupabase();const {data:{user},error:authError}=await db.auth.getUser();
 if(authError)throw authError;
 if(!user)throw Error("Inicia sesión para publicar tu zona profesional.");
 const {data:profile,error}=await db.from("profiles").select("account_type").eq("id",user.id).single();
 if(error)throw error;
 const [business,profession]=await Promise.all([
  db.from("jcard_business_details" as never).select("owner_id").eq("owner_id",user.id).limit(1),
  db.from("person_professions" as never).select("id").eq("worker_id",user.id).limit(1)
 ]);
 const allowedKinds:("company"|"professional")[]=[];
 if(profile.account_type==="company"||!business.error&&(business.data??[]).length>0)allowedKinds.push("company");
 if(!profession.error&&(profession.data??[]).length>0)allowedKinds.push("professional");
 const {data:presence,error:presenceError}=await db.from("jobeen_map_presence" as never)
  .select("owner_id,kind,city,service,latitude,longitude,is_visible").eq("owner_id",user.id).maybeSingle();
 if(presenceError)throw presenceError;
 const mapped=(presence as unknown as MapPresence|null)??null;
 const kind=mapped&&allowedKinds.includes(mapped.kind)?mapped.kind:allowedKinds[0]??null;
 return {kind,allowedKinds,profileId:user.id,presence:mapped};
}
export async function saveMapPresence(args:{city:string;service:string;center:MapPoint;kind:"company"|"professional"}):Promise<void>{
 const city=args.city.trim().slice(0,100),service=args.service.trim().slice(0,120);
 if(city.length<2||service.length<2)throw Error("Indica una ciudad y tu servicio profesional.");
 if(!valid(args.center))throw Error("Selecciona una zona válida en el mapa.");
 const db=requireSupabase();const {data:{user}}=await db.auth.getUser();
 if(!user)throw Error("Inicia sesión para aparecer en el mapa.");
 // Professional map pins are coarse by design: about one kilometre, never an exact home.
 const latitude=args.kind==="professional"?Number(args.center.lat.toFixed(2)):Number(args.center.lat.toFixed(5));
 const longitude=args.kind==="professional"?Number(args.center.lon.toFixed(2)):Number(args.center.lon.toFixed(5));
 const {error}=await db.from("jobeen_map_presence" as never).upsert({
  owner_id:user.id,kind:args.kind,city,service,latitude,longitude,is_visible:true,updated_at:new Date().toISOString()
 } as never,{onConflict:"owner_id"});
 if(error)throw Error(error.message);
}
export async function setMapPresenceVisible(visible:boolean):Promise<void>{
 const db=requireSupabase();const {data:{user}}=await db.auth.getUser();
 if(!user)throw Error("Inicia sesión.");
 const {error}=await db.from("jobeen_map_presence" as never)
  .update({is_visible:visible,updated_at:new Date().toISOString()} as never).eq("owner_id",user.id);
 if(error)throw Error(error.message);
}
