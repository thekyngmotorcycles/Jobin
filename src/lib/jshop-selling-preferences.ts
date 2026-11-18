import AsyncStorage from "@react-native-async-storage/async-storage";
import {JSHOP_CURRENCIES,type JShopCurrency} from "./jshop-model";

const key=(owner:string)=>"jobeen.jshop.seller.currency.v1."+(owner||"guest");
export function isJShopCurrency(value:unknown):value is JShopCurrency{
 return typeof value==="string"&&(JSHOP_CURRENCIES as readonly string[]).includes(value);
}
/** Seller's convenience default on this device; individual listing currency remains editable. */
export async function readSellerCurrency(owner:string):Promise<JShopCurrency>{
 try{
  const value=await AsyncStorage.getItem(key(owner));
  return isJShopCurrency(value)?value:"USD";
 }catch{return "USD";}
}
export async function writeSellerCurrency(owner:string,currency:JShopCurrency):Promise<void>{
 if(!owner||owner==="guest"||!isJShopCurrency(currency))throw Error("Moneda de venta inválida.");
 await AsyncStorage.setItem(key(owner),currency);
}
