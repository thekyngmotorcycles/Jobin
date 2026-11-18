import AsyncStorage from "@react-native-async-storage/async-storage";
import {requireSupabase} from "./supabase";

// Cache per account, but sync the durable choice to Supabase across devices.
const key=(owner:string)=>"jobeen.home.quick-composer.v2."+(owner||"guest");
export async function loadQuickComposerPreference(owner:string):Promise<boolean>{
 if(!owner)return false;
 const db=requireSupabase();
 const {data,error}=await db.from("jobeen_home_preferences" as never)
  .select("quick_composer_visible").eq("profile_id",owner).maybeSingle();
 if(!error&&data){
  const enabled=Boolean((data as unknown as {quick_composer_visible:boolean}).quick_composer_visible);
  await AsyncStorage.setItem(key(owner),enabled?"1":"0").catch(()=>{});
  return enabled;
 }
 const cached=await AsyncStorage.getItem(key(owner)).catch(()=>null);
 if(error&&!cached)throw Error(error.message);
 return cached==="1";
}
export async function saveQuickComposerPreference(owner:string,visible:boolean):Promise<void>{
 if(!owner)throw Error("Inicia sesión para guardar esta preferencia.");
 const db=requireSupabase();
 const {error}=await db.from("jobeen_home_preferences" as never).upsert({
  profile_id:owner,quick_composer_visible:visible,updated_at:new Date().toISOString()
 } as never,{onConflict:"profile_id"});
 if(error)throw Error(error.message);
 await AsyncStorage.setItem(key(owner),visible?"1":"0").catch(()=>{});
}
