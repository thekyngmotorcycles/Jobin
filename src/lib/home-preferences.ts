import {requireSupabase,supabase} from "./supabase";
import {captureMessageScope,assertMessageScope,type MessageScope} from "./message-session";
import {createBusinessSessionMemory} from "./business-session-memory";
import {sessionMarkerKey} from "./session-lifetime";
import {serializePrivateWrite} from "./private-write-queue";

// Cloud preference is authoritative. Local fallback is limited to the current
// verified session; never restore a previous account's plaintext cache.
const memory=createBusinessSessionMemory<boolean>();
let observed:string|null=null;
supabase?.auth.onAuthStateChange((event,session)=>{
 let next:string|null=null;try{if(session)next=sessionMarkerKey(session.user.id,session.access_token);}catch{}
 if(next!==observed||event==="SIGNED_OUT")memory.clear();
 observed=next;
});
async function confirm(owner:string,expectedScope?:MessageScope){
 const scope=await captureMessageScope(expectedScope);
 if(scope.owner!==owner)throw Error("La cuenta cambió.");
 return scope;
}
export async function loadQuickComposerPreference(owner:string,expectedScope?:MessageScope):Promise<boolean>{
 const scope=await confirm(owner,expectedScope),db=requireSupabase();
 return serializePrivateWrite("jobeen.home.quick-composer."+owner,async()=>{
  await assertMessageScope(scope);
  const {data,error}=await db.from("jobeen_home_preferences" as never)
   .select("profile_id,quick_composer_visible").eq("profile_id",owner).maybeSingle();
  await assertMessageScope(scope);
  if(error){const cached=memory.read(scope);if(cached!==null)return cached;throw Error(error.message);}
  const row=data as unknown as {profile_id:string;quick_composer_visible:boolean}|null;
  if(row&&row.profile_id!==owner)throw Error("No se pudo verificar la preferencia.");
  const enabled=row?.quick_composer_visible===true;
  memory.write(scope,enabled);return enabled;
 });
}
export async function saveQuickComposerPreference(owner:string,visible:boolean,expectedScope?:MessageScope):Promise<void>{
 const scope=await confirm(owner,expectedScope),db=requireSupabase();
 await serializePrivateWrite("jobeen.home.quick-composer."+owner,async()=>{
  await assertMessageScope(scope);
  const {error}=await db.from("jobeen_home_preferences" as never).upsert({
   profile_id:scope.owner,quick_composer_visible:visible,updated_at:new Date().toISOString()
  } as never,{onConflict:"profile_id"});
  if(error)throw Error(error.message);
  await assertMessageScope(scope);
  memory.write(scope,visible);
 });
}
