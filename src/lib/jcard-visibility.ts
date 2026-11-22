import {assertMessageScope,captureMessageScope,type MessageScope} from "./message-session";
import {requireSupabase} from "./supabase";
export type JCardVisibility={personal_enabled:boolean;business_enabled:boolean;business_show_email:boolean;business_show_phone:boolean};
export const DEFAULT_JCARD_VISIBILITY:JCardVisibility={personal_enabled:true,business_enabled:true,business_show_email:false,business_show_phone:false};
export async function readJCardVisibility(ownerId:string,expectedScope?:MessageScope):Promise<JCardVisibility>{
 const scope=expectedScope?await captureMessageScope(expectedScope):null;
 const {data,error}=await (requireSupabase() as any).from("jcard_visibility").select("personal_enabled,business_enabled,business_show_email,business_show_phone").eq("owner_id",ownerId).maybeSingle();
 if(error)throw error;
 if(scope)await assertMessageScope(scope);
 return {...DEFAULT_JCARD_VISIBILITY,...(data??{})};
}
export async function saveJCardVisibility(value:JCardVisibility,expectedOwner?:string,expectedScope?:MessageScope):Promise<void>{
 if(!value.personal_enabled&&!value.business_enabled)throw new Error("Debes mantener al menos una JCard activa.");
 const db=requireSupabase(),scope=await captureMessageScope(expectedScope),user={id:scope.owner};
 if(expectedOwner&&user.id!==expectedOwner)throw new Error("La cuenta cambió.");
 await assertMessageScope(scope);
 const {error}=await (db as any).from("jcard_visibility").upsert({owner_id:user.id,...value,updated_at:new Date().toISOString()},{onConflict:"owner_id"});
 if(error)throw error;
 await assertMessageScope(scope);
}
