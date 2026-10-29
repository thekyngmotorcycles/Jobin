import "react-native-url-polyfill/auto";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";
const url=process.env.EXPO_PUBLIC_SUPABASE_URL;
const key=process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
export const supabase=url&&key?createClient(url,key,{
 auth:{storage:AsyncStorage,persistSession:true,autoRefreshToken:true,detectSessionInUrl:false}
}):null;
export function requireSupabase(){if(!supabase)throw new Error("Supabase todavía no está configurado. Puedes explorar la app en modo demo.");return supabase;}
