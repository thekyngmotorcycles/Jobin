import {requireSupabase} from "./supabase";
import {assertMessageScope,captureMessageScope,type MessageScope} from "./message-session";

export type SavedJCardSide="personal"|"business";
export type SavedJCard={
 targetId:string;side:SavedJCardSide;favorite:boolean;savedAt:string;
 title:string;subtitle:string;available:boolean;
};

type SavedRow={saver_id:string;target_id:string;card_side:SavedJCardSide;favorite:boolean;created_at:string;title:string;subtitle:string;available:boolean};
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function assertTarget(id:string){if(!UUID.test(id))throw new Error("La JCard no tiene un identificador válido.");}
async function sessionUser(expectedOwner:string,expectedScope:MessageScope){
 const scope=await captureMessageScope(expectedScope);
 if(scope.owner!==expectedOwner)throw new Error("La cuenta cambió.");
 return scope;
}
function assertSide(side:SavedJCardSide){if(side!=="personal"&&side!=="business")throw Error("La cara de JCard no es válida.");}
/** Public JCards need no owner acceptance. SQL RLS verifies that the face is visible. */
export async function saveVisibleJCard(targetId:string,side:SavedJCardSide,expectedOwner:string,expectedScope:MessageScope):Promise<void>{
 assertTarget(targetId);assertSide(side);const scope=await sessionUser(expectedOwner,expectedScope),uid=scope.owner;
 const db=requireSupabase() as any;
 if(side==="business"){
  const {data:business,error:businessError}=await db.from("jobeen_public_business_cards")
   .select("name").eq("owner_id",targetId).maybeSingle();
  if(businessError)throw new Error(businessError.message);
  if(!business?.name?.trim())throw new Error("Esta cuenta no tiene una JCard empresarial pública disponible.");
 }
 await assertMessageScope(scope);
 const {error}=await db.from("jobeen_saved_jcards")
  .insert({target_id:targetId,card_side:side,saver_id:uid});
 await assertMessageScope(scope);
 if(error && error.code!=="23505")throw new Error(error.message||"No se pudo guardar la JCard pública.");
}
export async function removeSavedJCard(targetId:string,side:SavedJCardSide,expectedOwner:string,expectedScope:MessageScope):Promise<void>{
 assertTarget(targetId);assertSide(side);
 const scope=await sessionUser(expectedOwner,expectedScope),uid=scope.owner;
 await assertMessageScope(scope);
 const {error}=await (requireSupabase() as any).from("jobeen_saved_jcards").delete()
  .eq("saver_id",uid).eq("target_id",targetId).eq("card_side",side);
 await assertMessageScope(scope);
 if(error)throw new Error(error.message);
}
export async function setSavedJCardFavorite(targetId:string,side:SavedJCardSide,favorite:boolean,expectedOwner:string,expectedScope:MessageScope):Promise<void>{
 assertTarget(targetId);assertSide(side);
 const scope=await sessionUser(expectedOwner,expectedScope),uid=scope.owner;
 await assertMessageScope(scope);
 const {error}=await (requireSupabase() as any).from("jobeen_saved_jcards").update({favorite})
  .eq("saver_id",uid).eq("target_id",targetId).eq("card_side",side);
 await assertMessageScope(scope);
 if(error)throw new Error(error.message);
}
export async function isSavedJCard(targetId:string,side:SavedJCardSide,expectedOwner:string,expectedScope:MessageScope):Promise<boolean>{
 assertTarget(targetId);assertSide(side);
 const scope=await sessionUser(expectedOwner,expectedScope),uid=scope.owner;
 const {data,error}=await (requireSupabase() as any).from("jobeen_saved_jcards")
  .select("target_id").eq("saver_id",uid).eq("target_id",targetId).eq("card_side",side).maybeSingle();
 await assertMessageScope(scope);
 if(error)throw new Error(error.message);
 return !!data;
}
/** Never retain contact details in favorites: fetch only current public identities.
 * If the owner disables a face, show an unavailable placeholder with a remove action.
 */
export async function listSavedJCards(expectedOwner:string,expectedScope:MessageScope):Promise<SavedJCard[]>{
 const scope=await sessionUser(expectedOwner,expectedScope),uid=scope.owner;
 const {data,error}=await requireSupabase().rpc("jobeen_saved_jcard_previews" as never);
 await assertMessageScope(scope);
 if(error)throw new Error(error.message);
 const saved=((data??[]) as SavedRow[]).filter(r=>r.saver_id===uid&&UUID.test(r.target_id)&&(r.card_side==="personal"||r.card_side==="business"));
 return saved.map(item=>({
  targetId:item.target_id,side:item.card_side,favorite:item.favorite,savedAt:item.created_at,
  title:!item.available?"JCard no disponible":item.title,
  subtitle:!item.available?"El propietario ocultó la tarjeta o la cuenta ya no está disponible.":item.subtitle,
  available:item.available===true
 }));
}
