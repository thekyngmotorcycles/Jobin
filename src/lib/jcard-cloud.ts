import {requireSupabase} from "./supabase";
import {assertMessageScope,captureMessageScope,type MessageScope} from "./message-session";
import type {EmploymentEntry} from "./me";
import type {BusinessCardData} from "./jcard";
export const BUSINESS_HANDLE_PATTERN=/^[a-z][a-z0-9_.]{2,29}$/;
export async function cloudOwner(){const db=requireSupabase();const {data,error}=await db.auth.getUser();if(error)throw error;if(!data.user)throw new Error("Inicia sesión para sincronizar.");return data.user.id;}
export async function readCloudHistory(expectedOwner?:string,expectedScope?:MessageScope):Promise<EmploymentEntry[]>{
 return (await loadCloudHistory(expectedOwner,expectedScope)).rows;
}
export async function loadCloudHistory(expectedOwner?:string,expectedScope?:MessageScope):Promise<{rows:EmploymentEntry[];contactsAvailable:boolean;reviewPending:boolean}>{
 const db=requireSupabase(),scope=await captureMessageScope(expectedScope),owner=scope.owner;
 if(expectedOwner&&expectedOwner!==owner)throw Error("La sesión cambió.");
 const [history,details,review]=await Promise.all([
  (db as any).from("jcard_employment_history").select("owner_id,client_id,company,role,professions,from_year,from_month,to_year,to_month,verified_by").eq("owner_id",owner),
  (db as any).from("jobeen_employment_private_contact").select("owner_id,client_id,address,contact").eq("owner_id",owner),
  db.rpc("jobeen_own_employment_review_pending")
 ]);
 if(history.error)throw history.error;
 // Older backends and isolated fixtures may lack the optional review indicator.
 if(review.error?.code!=="PGRST202"&&typeof review.data!=="boolean")throw Error("No se pudo comprobar el estado del historial privado.");
 await assertMessageScope(scope);
 // The contacts table is supplemental and may not exist on the current backend.
 // Never read legacy contact columns or enable edits when these details are unavailable.
 const contactsAvailable=!details.error&&Array.isArray(details.data);
 const contacts=new Map<string,{address:string;contact:string}>((contactsAvailable?details.data:[]).filter((r:any)=>r.owner_id===owner).map((r:any)=>[r.client_id,{address:r.address,contact:r.contact}]));
 if(!Array.isArray(history.data))throw Error("El historial privado no está disponible.");
 const rows=history.data.filter((r:any)=>r.owner_id===owner).map((r:any)=>({id:r.client_id,company:r.company,role:r.role,professions:r.professions,from:r.from_year,fromMonth:r.from_month,to:r.to_year,toMonth:r.to_month,status:r.verified_by?"approved":"pending",verifiedBy:r.verified_by,...contacts.get(r.client_id)}));
 return {rows,contactsAvailable,reviewPending:review.data===true};
}
export async function writeCloudHistory(entry:EmploymentEntry,expectedOwner:string,expectedScope?:MessageScope){
 const db=requireSupabase(),scope=await captureMessageScope(expectedScope),owner=scope.owner;
 if(expectedOwner!==owner)throw Error("La sesión cambió.");
 await assertMessageScope(scope);
 const {error}=await db.rpc("jobeen_save_private_employment" as never,{
  p_expected_owner:owner,p_client_id:entry.id,p_company:entry.company,p_role:entry.role,p_professions:entry.professions??[],
  p_from_year:entry.from,p_from_month:entry.fromMonth??1,p_to_year:entry.to,p_to_month:entry.toMonth??12,
  p_address:entry.address??"",p_contact:entry.contact??""
 } as never);
 if(error)throw error;
 await assertMessageScope(scope);
}
export async function deleteCloudHistory(entryId:string,expectedOwner:string,expectedScope:MessageScope){
 const db=requireSupabase(),scope=await captureMessageScope(expectedScope),owner=scope.owner;
 if(expectedOwner!==owner)throw Error("La sesión cambió.");
 await assertMessageScope(scope);
 const {data,error}=await db.from("jcard_employment_history" as never).delete()
  .eq("owner_id",owner).eq("client_id",entryId).is("verified_by",null)
  .select("client_id").maybeSingle();
 if(error)throw error;
 await assertMessageScope(scope);
 if(!data)throw Error("Esta experiencia ya no se puede eliminar. Actualiza el historial.");
}
export async function readCloudBusiness(expectedOwner?:string,expectedScope?:MessageScope):Promise<Partial<BusinessCardData>|null>{const db=requireSupabase(),scope=await captureMessageScope(expectedScope),owner=scope.owner;if(expectedOwner&&expectedOwner!==owner)throw new Error("La sesión cambió.");const {data,error}=await (db as any).from("jcard_business_details").select("name,business_handle,opened,closed,services,location,category,email,email_secondary,phone,phone_secondary,phone_label,phone_secondary_label,banner_url,avatar_url").eq("owner_id",owner).maybeSingle();if(error)throw error;await assertMessageScope(scope);return data?{...data,businessHandle:data.business_handle??"",emailSecondary:data.email_secondary,phoneSecondary:data.phone_secondary,phoneLabel:data.phone_label,phoneSecondaryLabel:data.phone_secondary_label,bannerUrl:data.banner_url,avatarUrl:data.avatar_url}:null;}
export async function writeCloudBusiness(b:BusinessCardData,expectedOwner?:string,expectedScope?:MessageScope){const db=requireSupabase(),scope=await captureMessageScope(expectedScope),owner=scope.owner;if(expectedOwner&&expectedOwner!==owner)throw new Error("La sesión cambió. Vuelve a abrir la JCard antes de guardar.");await assertMessageScope(scope);const {error}=await (db as any).from("jcard_business_details").upsert({owner_id:owner,name:b.name,...(b.businessHandle!==undefined?{business_handle:b.businessHandle?.trim().toLowerCase()||null}:{}),opened:b.opened,closed:b.closed,services:b.services,location:b.location,category:b.category??null,email:b.email??null,email_secondary:b.emailSecondary??null,phone:b.phone??null,phone_secondary:b.phoneSecondary??null,phone_label:b.phoneLabel??null,phone_secondary_label:b.phoneSecondaryLabel??null,banner_url:b.bannerUrl??null,avatar_url:b.avatarUrl??null,updated_at:new Date().toISOString()},{onConflict:"owner_id"});if(error)throw error;await assertMessageScope(scope);}
export async function readBusinessRating(ownerId:string){const db=requireSupabase();const {data,error}=await (db as any).from("jcard_business_ratings").select("average_rating,review_count").eq("business_owner_id",ownerId).maybeSingle();if(error)throw error;return {rating:data?.average_rating??null,count:data?.review_count??0};}

export async function readBusinessExcellence(ownerId:string){const db=requireSupabase();const {data,error}=await (db as any).from("jcard_business_excellence").select("review_count,service_votes,prices_votes,punctuality_votes,professionalism_votes,tenure_votes").eq("business_owner_id",ownerId).maybeSingle();if(error)throw error;return {excellenceReviewCount:data?.review_count??0,excellenceVotes:{service:data?.service_votes??0,prices:data?.prices_votes??0,punctuality:data?.punctuality_votes??0,professionalism:data?.professionalism_votes??0,tenure:data?.tenure_votes??0}};}

/** Company handles are optional, case insensitive and distinct from personal handles. */
export async function checkBusinessHandleAvailable(handle:string,expectedScope?:MessageScope):Promise<boolean>{
 const candidate=handle.trim().toLowerCase().replace(/^@/,"");
 if(!BUSINESS_HANDLE_PATTERN.test(candidate))return false;
 const db=requireSupabase(),scope=await captureMessageScope(expectedScope);
 const {data,error}=await db.rpc("jobeen_business_handle_available" as never,{candidate} as never);
 if(error)throw error;
 await assertMessageScope(scope);
 return data===true;
}

/** The public JCard RPC returns the personal face; this loads the business face separately. */
export async function readPublicBusinessCard(ownerId:string,expectedScope?:MessageScope):Promise<BusinessCardData|null>{
 const db=requireSupabase(),scope=await captureMessageScope(expectedScope);
 const {data,error}=await db.from("jobeen_public_business_cards" as never)
  .select("name,business_handle,opened,closed,services,location,category,email,email_secondary,phone,phone_secondary,phone_label,phone_secondary_label,banner_url,avatar_url")
  .eq("owner_id",ownerId).maybeSingle();
 if(error)throw error;
 await assertMessageScope(scope);
 if(!data)return null;
 type B={name:string;business_handle:string|null;opened:string;closed:string;services:string[];location:string;category:string|null;email:string|null;email_secondary:string|null;phone:string|null;phone_secondary:string|null;phone_label:string|null;phone_secondary_label:string|null;banner_url:string|null;avatar_url:string|null};
 const b=data as unknown as B;
 const {rating,count}=await readBusinessRating(ownerId).catch(()=>({rating:null,count:0}));
 await assertMessageScope(scope);
 return {name:b.name,businessHandle:b.business_handle,opened:b.opened,closed:b.closed,
  services:b.services??[],location:b.location??"",category:b.category,
  email:b.email,emailSecondary:b.email_secondary,phone:b.phone,phoneSecondary:b.phone_secondary,
  phoneLabel:b.phone_label,phoneSecondaryLabel:b.phone_secondary_label,bannerUrl:b.banner_url,avatarUrl:b.avatar_url,
  licenseVerified:false,rating,reviewCount:count};
}
