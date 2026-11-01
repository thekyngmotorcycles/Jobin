import {requireSupabase} from "./supabase";
export type ContactPreferences={show_email:boolean;show_phone:boolean};
export async function loadContactPreferences():Promise<ContactPreferences>{
 const db=requireSupabase();const {data:{user},error:authError}=await db.auth.getUser();
 if(authError||!user)throw new Error("Inicia sesión para configurar tu JCard.");
 const {data,error}=await (db as any).from("jcard_contact_preferences").select("show_email,show_phone").eq("owner_id",user.id).maybeSingle();
 if(error)throw error;return {show_email:!!data?.show_email,show_phone:!!data?.show_phone};
}
export async function saveContactPreferences(p:ContactPreferences){
 const db=requireSupabase();const {data:{user},error:authError}=await db.auth.getUser();
 if(authError||!user)throw new Error("Inicia sesión.");
 const {error}=await (db as any).from("jcard_contact_preferences").upsert({owner_id:user.id,...p,updated_at:new Date().toISOString()},{onConflict:"owner_id"});
 if(error)throw error;
}
export async function loadPublicContact(id:string):Promise<{email:string|null;phone:string|null}>{
 const {data,error}=await (requireSupabase() as any).rpc("jcard_public_contact",{target:id});
 if(error)throw error;return {email:data?.email??null,phone:data?.phone??null};
}
