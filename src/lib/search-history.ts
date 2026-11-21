import AsyncStorage from "@react-native-async-storage/async-storage";
import {assertAccountOwner} from "./account-scope";
import {mergeRecentSearches,normalizeRecentQuery} from "./search-history-core";

const keyFor=(ownerId:string)=>"jobeen.search-history.v1."+ownerId;
export async function readRecentSearches(ownerId:string):Promise<string[]>{
 if(!ownerId)return [];
 await assertAccountOwner(ownerId);
 const data=await AsyncStorage.getItem(keyFor(ownerId));
 await assertAccountOwner(ownerId);
 if(!data)return [];
 try{
  const parsed:unknown=JSON.parse(data);
  if(!Array.isArray(parsed))return [];
  return parsed.filter((value):value is string=>typeof value==="string").map(normalizeRecentQuery).filter(Boolean).slice(0,12);
 }catch{return [];}
}
export async function rememberRecentSearch(ownerId:string,query:string):Promise<string[]>{
 if(!ownerId)return [];
 await assertAccountOwner(ownerId);
 const prior=await readRecentSearches(ownerId);
 const next=mergeRecentSearches(prior,query);
 await assertAccountOwner(ownerId);
 await AsyncStorage.setItem(keyFor(ownerId),JSON.stringify(next));
 return next;
}
export async function clearRecentSearches(ownerId:string){
 if(ownerId){await assertAccountOwner(ownerId);await AsyncStorage.removeItem(keyFor(ownerId));}
}
