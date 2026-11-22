import "react-native-url-polyfill/auto";
import { Platform } from "react-native";
import {createAuthStorage} from "./auth-storage";
import { createClient } from "@supabase/supabase-js";
import { backendConfig } from "./backend-config";
import type { Database } from "./database.types";
const pilot=process.env.EXPO_PUBLIC_JOBEEN_SECURITY_PILOT==="1";
const candidateUrl=process.env.EXPO_PUBLIC_SUPABASE_URL;
const candidateKey=process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
// A pilot must never silently reach the production project via a fallback.
let pilotValid=false;
if(pilot){
 try{
  const u=new URL(candidateUrl??"");
  pilotValid=u.protocol==="https:"&&!u.port&&!u.username&&!u.password&&
   /^[a-z0-9]{20}\.supabase\.co$/.test(u.hostname)&&
   u.hostname!==new URL(backendConfig.url).hostname&&u.pathname==="/"&&!u.search&&!u.hash&&
   !!candidateKey?.startsWith("sb_publishable_")&&candidateKey.length>=24;
 }catch{/* No valid isolated backend: deny all data access. */}
}
const url=pilot?(pilotValid?candidateUrl:""):(candidateUrl||backendConfig.url);
const key=pilot?(pilotValid?candidateKey:""):(candidateKey||backendConfig.publishableKey);
// Static web export runs in Node, where browser storage is unavailable.
const canPersist = Platform.OS !== "web" || typeof window !== "undefined";
const storageKey=url?"sb-"+new URL(url).hostname.split(".")[0]+"-auth-token":"";
export const supabase=url&&key?createClient<Database>(url,key,{
 auth:{storageKey,storage:canPersist ? createAuthStorage(storageKey) : undefined,persistSession:canPersist,autoRefreshToken:canPersist,detectSessionInUrl:false,flowType:"pkce"}
}):null;
export function requireSupabase(){if(!supabase)throw new Error("Supabase todavía no está configurado. Puedes explorar la app en modo demo.");return supabase;}
