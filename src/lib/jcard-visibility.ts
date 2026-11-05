import {requireSupabase} from "./supabase";
export type JCardVisibility={personal_enabled:boolean;business_enabled:boolean;business_show_email:boolean;business_show_phone:boolean};
export const DEFAULT_JCARD_VISIBILITY:JCardVisibility={personal_enabled:true,business_enabled:true,business_show_email:true,business_show_phone:true};
export async function readJCardVisibility(ownerId:string):Promise<JCardVisibility>{
 const {data,error}=await requireSupabase().from("jcard_visibility").select("personal_enabled,business_enabled,business_show_email,business_show_phone").eq("owner_id",ownerId).maybeSingle();
 if(error)throw error;
 return {...DEFAULT_JCARD_VISIBILITY,...(data??{})};
}
export async function saveJCardVisibility(value:JCardVisibility):Promise<void>{
 if(!value.personal_enabled&&!value.business_enabled)throw new Error("Debes mantener al menos una JCard activa.");
 const db=requireSupabase();const {data:{user},error:authError}=await db.auth.getUser();
 if(authError||!user)throw new Error("Inicia sesión para configurar la privacidad.");
 const {error}=await db.from("jcard_visibility").upsert({owner_id:user.id,...value,updated_at:new Date().toISOString()},{onConflict:"owner_id"});
 if(error)throw error;
}
