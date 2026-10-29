import "react-native-url-polyfill/auto";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";
import { backendConfig } from "./backend-config";
import type { Database } from "./database.types";
const url=process.env.EXPO_PUBLIC_SUPABASE_URL || backendConfig.url;
const key=process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY || backendConfig.publishableKey;
export const supabase=url&&key?createClient<Database>(url,key,{
 auth:{storage:AsyncStorage,persistSession:true,autoRefreshToken:true,detectSessionInUrl:false}
}):null;
export function requireSupabase(){if(!supabase)throw new Error("Supabase todavía no está configurado. Puedes explorar la app en modo demo.");return supabase;}
