import AsyncStorage from "@react-native-async-storage/async-storage";
import {assertAccountOwner} from "./account-scope";
import {captureMessageScope,type MessageScope} from "./message-session";
import {serializePrivateWrite} from "./private-write-queue";

const prefix="jobeen.home.preferences.v1";
type Preference="saved"|"hidden";
const key=(owner:string,kind:Preference)=>prefix+"."+owner+"."+kind;
async function confirm(owner:string,expectedScope?:MessageScope){
 const scope=await captureMessageScope(expectedScope);
 if(scope.owner!==owner)throw Error("La cuenta cambió.");
 await assertAccountOwner(owner,scope.session);
 return scope;
}
async function readIds(owner:string,kind:Preference,scope:MessageScope):Promise<string[]>{
 if(!owner||owner!==scope.owner)throw Error("La cuenta cambió.");
 await assertAccountOwner(owner,scope.session);
 const raw=await AsyncStorage.getItem(key(owner,kind));
 await assertAccountOwner(owner,scope.session);
 if(!raw)return [];
 const parsed:unknown=JSON.parse(raw);
 if(!Array.isArray(parsed)||parsed.some(id=>typeof id!=="string"))throw Error("Las preferencias necesitan recuperación.");
 return parsed;
}
export const getSavedPostIds=async(owner:string,expectedScope?:MessageScope)=>readIds(owner,"saved",await confirm(owner,expectedScope));
export const getHiddenPostIds=async(owner:string,expectedScope?:MessageScope)=>readIds(owner,"hidden",await confirm(owner,expectedScope));
export async function setSavedPost(owner:string,postId:string,saved:boolean,expectedScope?:MessageScope):Promise<void>{
 const scope=await confirm(owner,expectedScope);
 await serializePrivateWrite(key(owner,"saved"),async()=>{
  const ids=await readIds(owner,"saved",scope);
  const updated=saved?[postId,...ids.filter(x=>x!==postId)]:ids.filter(x=>x!==postId);
  await assertAccountOwner(owner,scope.session);
  await AsyncStorage.setItem(key(owner,"saved"),JSON.stringify(updated));
  await assertAccountOwner(owner,scope.session);
 });
}
export async function hidePostFromHome(owner:string,postId:string,expectedScope?:MessageScope):Promise<void>{
 const scope=await confirm(owner,expectedScope);
 await serializePrivateWrite(key(owner,"hidden"),async()=>{
  const ids=await readIds(owner,"hidden",scope);
  await assertAccountOwner(owner,scope.session);
  await AsyncStorage.setItem(key(owner,"hidden"),JSON.stringify([...new Set([postId,...ids])]));
  await assertAccountOwner(owner,scope.session);
 });
}
