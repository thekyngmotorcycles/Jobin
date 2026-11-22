import {assertMessageScope,captureMessageScope,type MessageScope} from "./message-session";
import {requireSupabase} from "./supabase";
export type ContactPreferences={show_email:boolean;show_phone:boolean};
export async function loadContactPreferences(expectedScope?:MessageScope):Promise<ContactPreferences>{
 const db=requireSupabase(),scope=await captureMessageScope(expectedScope),user={id:scope.owner};
 const {data,error}=await (db as any).from("jcard_contact_preferences").select("show_email,show_phone").eq("owner_id",user.id).maybeSingle();
 if(error)throw error;await assertMessageScope(scope);return {show_email:!!data?.show_email,show_phone:!!data?.show_phone};
}
export async function saveContactPreferences(p:ContactPreferences,expectedOwner?:string,expectedScope?:MessageScope){
 const db=requireSupabase(),scope=await captureMessageScope(expectedScope),user={id:scope.owner};
 if(expectedOwner&&user.id!==expectedOwner)throw new Error("La cuenta cambió.");
 await assertMessageScope(scope);
 const {error}=await (db as any).from("jcard_contact_preferences").upsert({owner_id:user.id,...p,updated_at:new Date().toISOString()},{onConflict:"owner_id"});
 if(error)throw error;
 await assertMessageScope(scope);
}
export async function loadPublicContact(id:string,expectedScope?:MessageScope):Promise<{email:string|null;phone:string|null}>{
 const scope=await captureMessageScope(expectedScope);
 const {data,error}=await (requireSupabase() as any).rpc("jcard_public_contact",{target:id});
 if(error)throw error;await assertMessageScope(scope);return {email:data?.email??null,phone:data?.phone??null};
}

export type PersonalContactDetails={email_primary:string;email_secondary:string;phone_primary:string;phone_secondary:string};
export async function loadPersonalContactDetails(ownerId?:string,expectedScope?:MessageScope):Promise<PersonalContactDetails>{
 const db=requireSupabase(),scope=await captureMessageScope(expectedScope),id=scope.owner;
 if(ownerId&&ownerId!==id)throw Error("La cuenta cambió.");
 await assertMessageScope(scope);
 const {data,error}=await (db as any).from("jcard_personal_contacts").select("email_primary,email_secondary,phone_primary,phone_secondary").eq("owner_id",id).maybeSingle();
 if(error)throw error;
 await assertMessageScope(scope);
 return {email_primary:data?.email_primary??"",email_secondary:data?.email_secondary??"",phone_primary:data?.phone_primary??"",phone_secondary:data?.phone_secondary??""};
}
export async function loadVisiblePersonalContactDetails(ownerId:string,expectedScope?:MessageScope):Promise<PersonalContactDetails>{
 const scope=await captureMessageScope(expectedScope);
 const {data,error}=await (requireSupabase() as any).rpc("jcard_public_contact_details",{target:ownerId});
 if(error)throw error;
 await assertMessageScope(scope);
 return {email_primary:data?.email_primary??"",email_secondary:data?.email_secondary??"",phone_primary:data?.phone_primary??"",phone_secondary:data?.phone_secondary??""};
}
export async function savePersonalContactDetails(details:PersonalContactDetails,expectedOwner?:string,expectedScope?:MessageScope):Promise<void>{
 const db=requireSupabase(),scope=await captureMessageScope(expectedScope),user={id:scope.owner};
 if(expectedOwner&&user.id!==expectedOwner)throw new Error("La cuenta cambió.");
 await assertMessageScope(scope);
 const {error}=await (db as any).from("jcard_personal_contacts").upsert({owner_id:user.id,...details,updated_at:new Date().toISOString()},{onConflict:"owner_id"});
 if(error)throw error;
 await assertMessageScope(scope);
}
