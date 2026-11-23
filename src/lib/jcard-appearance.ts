import AsyncStorage from "@react-native-async-storage/async-storage";
import {captureMessageScope,assertMessageScope,type MessageScope} from "./message-session";
import {serializePrivateWrite} from "./private-write-queue";
import {getPremiumBackground,type JCardPremiumBackgroundId} from "../theme/jcard-premium-backgrounds";

/** Development-only free appearance access. No billing or production entitlement is granted.
 * Local preferences are own-account only; visitor cards cannot read them.
 */
const prefix="jobin.jcard.appearance.dev.v1.";
export type AppearanceSide="personal"|"business";
const key=(owner:string,side:AppearanceSide)=>prefix+(side==="business"?"business.":"")+owner;
export async function appearanceOwner():Promise<string>{return (await captureMessageScope()).owner;}
async function confirm(owner:string,expectedScope?:MessageScope){
 const scope=await captureMessageScope(expectedScope);
 if(scope.owner!==owner)throw Error("La cuenta cambió.");
 return scope;
}
export async function readJCardAppearance(owner:string,side:AppearanceSide="personal",expectedScope?:MessageScope):Promise<JCardPremiumBackgroundId>{
 const scope=await confirm(owner,expectedScope);
 const value=await AsyncStorage.getItem(key(owner,side));
 await assertMessageScope(scope);
 return value&&getPremiumBackground(value as JCardPremiumBackgroundId)?value as JCardPremiumBackgroundId:"original";
}
export async function saveJCardAppearance(owner:string,id:JCardPremiumBackgroundId,side:AppearanceSide="personal",expectedScope?:MessageScope):Promise<void>{
 if(!getPremiumBackground(id))throw new Error("El fondo seleccionado no existe.");
 const scope=await confirm(owner,expectedScope);
 await serializePrivateWrite(key(owner,side),async()=>{
  await assertMessageScope(scope);
  await AsyncStorage.setItem(key(owner,side),id);
  await assertMessageScope(scope);
 });
}
