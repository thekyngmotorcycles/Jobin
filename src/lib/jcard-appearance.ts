import AsyncStorage from "@react-native-async-storage/async-storage";
import {requireSupabase} from "./supabase";
import {getPremiumBackground,type JCardPremiumBackgroundId} from "../theme/jcard-premium-backgrounds";

/** Development-only free appearance access. No billing or production entitlement is granted. */
const prefix="jobin.jcard.appearance.dev.v1.";
export type AppearanceSide="personal"|"business";
const key=(owner:string,side:AppearanceSide)=>prefix+(side==="business"?"business.":"")+owner;
export async function appearanceOwner():Promise<string>{
 const {data,error}=await requireSupabase().auth.getUser();
 if(error||!data.user)throw new Error("Inicia sesión para personalizar tu JCard.");
 return data.user.id;
}
export async function readJCardAppearance(owner:string,side:AppearanceSide="personal"):Promise<JCardPremiumBackgroundId>{
 const value=await AsyncStorage.getItem(key(owner,side));
 return value&&getPremiumBackground(value as JCardPremiumBackgroundId)?value as JCardPremiumBackgroundId:"original";
}
export async function saveJCardAppearance(owner:string,id:JCardPremiumBackgroundId,side:AppearanceSide="personal"):Promise<void>{
 if(!getPremiumBackground(id))throw new Error("El fondo seleccionado no existe.");
 await AsyncStorage.setItem(key(owner,side),id);
}
