import {requireSupabase} from "./supabase";
import {DEFAULT_JCARD_VISIBILITY,type JCardVisibility} from "./jcard-visibility";

export type SavedJCardSide="personal"|"business";
export type SavedJCard={
 targetId:string;side:SavedJCardSide;favorite:boolean;savedAt:string;
 title:string;subtitle:string;available:boolean;
};

type SavedRow={target_id:string;card_side:SavedJCardSide;favorite:boolean;created_at:string};
type TargetProfile={id:string;display_name:string|null;deactivated_at:string|null};
type TargetBusiness={owner_id:string;name:string;category:string|null};
type TargetVisibility={owner_id:string}&JCardVisibility;
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function assertTarget(id:string){if(!UUID.test(id))throw new Error("La JCard no tiene un identificador válido.");}
async function sessionUser(){
 const {data:{user},error}=await requireSupabase().auth.getUser();
 if(error)throw error;
 if(!user)throw new Error("Inicia sesión para guardar JCards.");
 return user.id;
}
/** Public JCards need no owner acceptance. SQL RLS verifies that the face is visible. */
export async function saveVisibleJCard(targetId:string,side:SavedJCardSide):Promise<void>{
 assertTarget(targetId);await sessionUser();
 const {error}=await (requireSupabase() as any).from("jobeen_saved_jcards")
  .insert({target_id:targetId,card_side:side,saver_id:(await sessionUser())});
 if(error && error.code!=="23505")throw new Error(error.message||"No se pudo guardar la JCard pública.");
}
export async function removeSavedJCard(targetId:string,side:SavedJCardSide):Promise<void>{
 assertTarget(targetId);
 const uid=await sessionUser();
 const {error}=await (requireSupabase() as any).from("jobeen_saved_jcards").delete()
  .eq("saver_id",uid).eq("target_id",targetId).eq("card_side",side);
 if(error)throw new Error(error.message);
}
export async function setSavedJCardFavorite(targetId:string,side:SavedJCardSide,favorite:boolean):Promise<void>{
 assertTarget(targetId);
 const uid=await sessionUser();
 const {error}=await (requireSupabase() as any).from("jobeen_saved_jcards").update({favorite})
  .eq("saver_id",uid).eq("target_id",targetId).eq("card_side",side);
 if(error)throw new Error(error.message);
}
export async function isSavedJCard(targetId:string,side:SavedJCardSide):Promise<boolean>{
 assertTarget(targetId);
 const uid=await sessionUser();
 const {data,error}=await (requireSupabase() as any).from("jobeen_saved_jcards")
  .select("target_id").eq("saver_id",uid).eq("target_id",targetId).eq("card_side",side).maybeSingle();
 if(error)throw new Error(error.message);
 return !!data;
}
/** Never retain contact details in favorites: fetch only current public identities.
 * If the owner disables a face, show an unavailable placeholder with a remove action.
 */
export async function listSavedJCards():Promise<SavedJCard[]>{
 const uid=await sessionUser();
 const db=requireSupabase() as any;
 const {data,error}=await db.from("jobeen_saved_jcards")
  .select("target_id,card_side,favorite,created_at").eq("saver_id",uid)
  .order("favorite",{ascending:false}).order("created_at",{ascending:false}).limit(250);
 if(error)throw new Error(error.message);
 const saved=(data??[]) as SavedRow[];
 if(!saved.length)return [];
 const ids=[...new Set(saved.map(item=>item.target_id))];
 const [profiles,visibilities]=await Promise.all([
  db.from("profiles").select("id,display_name,deactivated_at").in("id",ids),
  db.from("jcard_visibility").select("owner_id,personal_enabled,business_enabled,business_show_email,business_show_phone").in("owner_id",ids)
 ]);
 if(profiles.error)throw new Error(profiles.error.message);
 if(visibilities.error)throw new Error(visibilities.error.message);
 const byProfile=new Map<string,TargetProfile>((profiles.data??[] as TargetProfile[]).map((p:TargetProfile)=>[p.id,p]));
 const byVisibility=new Map<string,JCardVisibility>((visibilities.data??[] as TargetVisibility[]).map((v:TargetVisibility)=>[v.owner_id,v]));
 const live=saved.filter(item=>{
  const profile=byProfile.get(item.target_id);
  const visibility=byVisibility.get(item.target_id)??DEFAULT_JCARD_VISIBILITY;
  return !!profile&&!profile.deactivated_at&&(item.card_side==="personal"?visibility.personal_enabled:visibility.business_enabled);
 });
 const businessIds=[...new Set(live.filter(x=>x.card_side==="business").map(x=>x.target_id))];
 let businesses:TargetBusiness[]=[];
 if(businessIds.length){
  const {data:biz,error:businessError}=await db.from("jcard_business_details")
   .select("owner_id,name,category").in("owner_id",businessIds);
  if(businessError)throw new Error(businessError.message);
  businesses=(biz??[]) as TargetBusiness[];
 }
 const byBusiness=new Map(businesses.map(item=>[item.owner_id,item]));
 return saved.map(item=>{
  const profile=byProfile.get(item.target_id);
  const visibility=byVisibility.get(item.target_id)??DEFAULT_JCARD_VISIBILITY;
  const business=item.card_side==="business"?byBusiness.get(item.target_id):undefined;
  const available=!!profile&&!profile.deactivated_at&&
   (item.card_side==="personal"?visibility.personal_enabled:visibility.business_enabled&&!!business?.name.trim());
  return {targetId:item.target_id,side:item.card_side,favorite:item.favorite,savedAt:item.created_at,
   title:!available?"JCard no disponible":item.card_side==="business"?business!.name:profile!.display_name||"Profesional de Jobeen",
   subtitle:!available?"El propietario ocultó la tarjeta o la cuenta ya no está disponible.":
    item.card_side==="business"?business?.category||"Negocio":"JCard personal",
   available};
 });
}
