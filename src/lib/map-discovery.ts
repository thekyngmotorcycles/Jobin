import {requireSupabase} from "./supabase";
import {assertMessageScope,captureMessageScope,type MessageScope} from "./message-session";
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
export async function discoverMapProfiles(center:MapPoint,radiusKm:number,query:string,kind:DiscoveryKind,expectedScope:MessageScope):Promise<DiscoveredProfile[]>{
 if(!valid(center))throw Error("Elige una zona válida.");
 const scope=await captureMessageScope(expectedScope),db=requireSupabase();
 if(!Number.isFinite(radiusKm)||radiusKm<1||radiusKm>200)throw Error("Radio de búsqueda inválido.");
 const {data,error}=await db.rpc("jobeen_find_profiles_on_map" as never,{
  p_lat:Number(center.lat.toFixed(2)),p_lon:Number(center.lon.toFixed(2)),p_radius_km:radiusKm,p_query:query.trim().slice(0,100),p_kind:kind
 } as never);
 if(error)throw Error(error.message);
 await assertMessageScope(scope);
 return (data??[]) as unknown as DiscoveredProfile[];
}
export async function myMapPresence(expectedScope:MessageScope):Promise<{presence:MapPresence|null;kind:"company"|"professional"|null;allowedKinds:("company"|"professional")[];profileId:string}>{
 const scope=await captureMessageScope(expectedScope),db=requireSupabase(),user={id:scope.owner};
 const [business,profession]=await Promise.all([
  db.from("jcard_business_details" as never).select("owner_id,name").eq("owner_id",user.id).limit(1),
  db.from("person_professions" as never).select("id").eq("worker_id",user.id).limit(1)
 ]);
 const allowedKinds:("company"|"professional")[]=[];
 if(business.error)throw business.error;
 if(profession.error)throw profession.error;
 const company=(business.data??[]) as unknown as {owner_id:string;name:string}[];
 if(company.some(row=>row.owner_id===user.id&&row.name?.trim()))allowedKinds.push("company");
 if(!profession.error&&(profession.data??[]).length>0)allowedKinds.push("professional");
 await assertMessageScope(scope);
 const {data:presence,error:presenceError}=await db.from("jobeen_map_presence" as never)
  .select("owner_id,kind,city,service,latitude,longitude,is_visible").eq("owner_id",user.id).maybeSingle();
 if(presenceError)throw presenceError;
 await assertMessageScope(scope);
 const mapped=(presence as unknown as MapPresence|null)??null;
 if(mapped&&mapped.owner_id!==scope.owner)throw Error("La zona no pertenece a esta cuenta.");
 const kind=mapped&&allowedKinds.includes(mapped.kind)?mapped.kind:allowedKinds[0]??null;
 return {kind,allowedKinds,profileId:user.id,presence:mapped};
}
export async function saveMapPresence(args:{city:string;service:string;center:MapPoint;kind:"company"|"professional"},expectedScope:MessageScope):Promise<void>{
 const city=args.city.trim().slice(0,100),service=args.service.trim().slice(0,120);
 if(city.length<2||service.length<2)throw Error("Indica una ciudad y tu servicio profesional.");
 if(!valid(args.center))throw Error("Selecciona una zona válida en el mapa.");
 const scope=await captureMessageScope(expectedScope),db=requireSupabase(),user={id:scope.owner};
 // Professional map pins are coarse by design: about one kilometre, never an exact home.
 const latitude=args.kind==="professional"?Number(args.center.lat.toFixed(2)):Number(args.center.lat.toFixed(5));
 const longitude=args.kind==="professional"?Number(args.center.lon.toFixed(2)):Number(args.center.lon.toFixed(5));
 await assertMessageScope(scope);
 const {error}=await db.from("jobeen_map_presence" as never).upsert({
  owner_id:user.id,kind:args.kind,city,service,latitude,longitude,is_visible:true,updated_at:new Date().toISOString()
 } as never,{onConflict:"owner_id"});
 if(error)throw Error(error.message);
 await assertMessageScope(scope);
}
export async function setMapPresenceVisible(visible:boolean,expectedScope:MessageScope):Promise<void>{
 const scope=await captureMessageScope(expectedScope),db=requireSupabase(),user={id:scope.owner};
 await assertMessageScope(scope);
 const {error}=await db.from("jobeen_map_presence" as never)
  .update({is_visible:visible,updated_at:new Date().toISOString()} as never).eq("owner_id",user.id).select("owner_id").single();
 if(error)throw Error(error.message);
 await assertMessageScope(scope);
}
