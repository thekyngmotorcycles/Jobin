import AsyncStorage from "@react-native-async-storage/async-storage";
import {requireSupabase} from "./supabase";
import {getPremiumBackground,type JCardPremiumBackgroundId} from "../theme/jcard-premium-backgrounds";

/** Development-only free appearance access. No billing or production entitlement is granted. */
const prefix="jobin.jcard.appearance.dev.v1.";
export async function appearanceOwner():Promise<string>{
 const {data,error}=await requireSupabase().auth.getUser();
 if(error||!data.user)throw new Error("Inicia sesión para personalizar tu JCard.");
 return data.user.id;
}
export async function readJCardAppearance(owner:string):Promise<JCardPremiumBackgroundId>{
 const value=await AsyncStorage.getItem(prefix+owner);
 return value&&getPremiumBackground(value as JCardPremiumBackgroundId)?value as JCardPremiumBackgroundId:"original";
}
export async function saveJCardAppearance(owner:string,id:JCardPremiumBackgroundId):Promise<void>{
 if(!getPremiumBackground(id))throw new Error("El fondo seleccionado no existe.");
 await AsyncStorage.setItem(prefix+owner,id);
}
