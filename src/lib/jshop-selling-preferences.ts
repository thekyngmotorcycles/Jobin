import AsyncStorage from "@react-native-async-storage/async-storage";
import {assertAccountOwner} from "./account-scope";
import type {MessageScope} from "./message-session";
import {JSHOP_CURRENCIES,type JShopCurrency} from "./jshop-model";

const key=(owner:string)=>"jobeen.jshop.seller.currency.v1."+(owner||"guest");
export function isJShopCurrency(value:unknown):value is JShopCurrency{
 return typeof value==="string"&&(JSHOP_CURRENCIES as readonly string[]).includes(value);
}
/** Seller's convenience default on this device; individual listing currency remains editable. */
export async function readSellerCurrency(owner:string,scope:MessageScope):Promise<JShopCurrency>{
 if(scope.owner!==owner)throw Error("La cuenta cambió.");
 await assertAccountOwner(owner,scope.session);
 try{
  const value=await AsyncStorage.getItem(key(owner));
  await assertAccountOwner(owner,scope.session);
  return isJShopCurrency(value)?value:"USD";
 }catch(e){await assertAccountOwner(owner,scope.session);return "USD";}
}
export async function writeSellerCurrency(owner:string,currency:JShopCurrency,scope:MessageScope):Promise<void>{
 if(scope.owner!==owner)throw Error("La cuenta cambió.");
 await assertAccountOwner(owner,scope.session);
 if(!owner||owner==="guest"||!isJShopCurrency(currency))throw Error("Moneda de venta inválida.");
 await AsyncStorage.setItem(key(owner),currency);
 await assertAccountOwner(owner,scope.session);
}
