import AsyncStorage from "@react-native-async-storage/async-storage";
import {requireSupabase} from "./supabase";
import type {JShopDraft} from "./jshop-model";

const draftsKey=(id:string)=>"jobeen.jshop.drafts.v1."+id;
const favoritesKey=(id:string)=>"jobeen.jshop.favorites.v1."+id;
/** All drafts and favorites are local and separated by authenticated account. */
export async function jshopAccountId():Promise<string>{
 const {data,error}=await requireSupabase().auth.getUser();
 if(error||!data.user)throw new Error("Inicia sesión para utilizar Mi JShop.");
 return data.user.id;
}
export async function readJShopDrafts(ownerId:string):Promise<JShopDraft[]>{
 const raw=await AsyncStorage.getItem(draftsKey(ownerId));
 if(!raw)return [];
 try{
  const parsed:unknown=JSON.parse(raw);
  if(!Array.isArray(parsed))return [];
  return parsed.filter((item):item is JShopDraft=>!!item&&typeof item==="object"&&item.ownerId===ownerId&&typeof item.id==="string"&&typeof item.title==="string"&&Array.isArray(item.photos))
   .sort((a,b)=>b.updatedAt-a.updatedAt);
 }catch{return [];}
}
export async function saveJShopDraft(ownerId:string,draft:JShopDraft):Promise<void>{
 if(draft.ownerId!==ownerId)throw new Error("No puedes modificar anuncios de otra cuenta.");
 const drafts=await readJShopDrafts(ownerId);
 await AsyncStorage.setItem(draftsKey(ownerId),JSON.stringify([draft,...drafts.filter(x=>x.id!==draft.id)]));
}
export async function deleteJShopDraft(ownerId:string,id:string):Promise<void>{
 const drafts=await readJShopDrafts(ownerId);
 await AsyncStorage.setItem(draftsKey(ownerId),JSON.stringify(drafts.filter(x=>x.id!==id)));
}
export async function readJShopFavorites(ownerId:string):Promise<string[]>{
 const raw=await AsyncStorage.getItem(favoritesKey(ownerId));
 if(!raw)return [];
 try{const ids:unknown=JSON.parse(raw);return Array.isArray(ids)?ids.filter((id):id is string=>typeof id==="string"):[];}catch{return [];}
}
export async function toggleJShopFavorite(ownerId:string,id:string):Promise<boolean>{
 const ids=await readJShopFavorites(ownerId);
 const has=ids.includes(id);
 await AsyncStorage.setItem(favoritesKey(ownerId),JSON.stringify(has?ids.filter(key=>key!==id):[id,...ids]));
 return !has;
}
