import AsyncStorage from "@react-native-async-storage/async-storage";
import type {BusinessCardData} from "./jcard";

export const EMPTY_BUSINESS_CARD:BusinessCardData={
 name:"",businessHandle:"",category:"",opened:"",closed:"",services:[],
 location:"",email:"",emailSecondary:"",phone:"",phoneSecondary:"",
 phoneLabel:"",phoneSecondaryLabel:"",licenseVerified:false,rating:null,reviewCount:0
};
const OWNER_ID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export function businessCardCacheKey(owner:string){
 if(!OWNER_ID.test(owner))throw new Error("La sesión de empresa no es válida.");
 return "jobeen.business.card.v2."+owner;
}
/** Never read the legacy global key jobin.business.card.v1.
 * Its contents cannot be attributed reliably to any account and must never
 * be silently uploaded as a different person's business JCard. */
export async function readScopedBusinessCard(owner:string):Promise<BusinessCardData|null>{
 const raw=await AsyncStorage.getItem(businessCardCacheKey(owner));
 if(!raw)return null;
 try{
  const data:unknown=JSON.parse(raw);
  if(!data||typeof data!=="object")return null;
  const card=data as Partial<BusinessCardData>;
  if(typeof card.name!=="string"||!Array.isArray(card.services))return null;
  return {...EMPTY_BUSINESS_CARD,...card};
 }catch{return null;}
}
export async function writeScopedBusinessCard(owner:string,card:BusinessCardData){
 await AsyncStorage.setItem(businessCardCacheKey(owner),JSON.stringify(card));
}
