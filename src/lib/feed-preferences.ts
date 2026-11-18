import AsyncStorage from "@react-native-async-storage/async-storage";

const prefix="jobeen.home.preferences.v1";
type Preference="saved"|"hidden";
const key=(owner:string,kind:Preference)=>prefix+"."+owner+"."+kind;

async function readIds(owner:string,kind:Preference):Promise<string[]>{
 if(!owner)return [];
 const raw=await AsyncStorage.getItem(key(owner,kind));
 if(!raw)return [];
 try{
  const parsed:unknown=JSON.parse(raw);
  return Array.isArray(parsed)?parsed.filter((id):id is string=>typeof id==="string"):[];
 }catch{return [];}
}

export const getSavedPostIds=(owner:string)=>readIds(owner,"saved");
export const getHiddenPostIds=(owner:string)=>readIds(owner,"hidden");

export async function setSavedPost(owner:string,postId:string,saved:boolean):Promise<void>{
 if(!owner)throw Error("Inicia sesión para guardar una publicación.");
 const ids=await getSavedPostIds(owner);
 const updated=saved?[postId,...ids.filter(x=>x!==postId)]:ids.filter(x=>x!==postId);
 await AsyncStorage.setItem(key(owner,"saved"),JSON.stringify(updated));
}
export async function hidePostFromHome(owner:string,postId:string):Promise<void>{
 if(!owner)throw Error("Inicia sesión para ocultar una publicación.");
 const ids=await getHiddenPostIds(owner);
 await AsyncStorage.setItem(key(owner,"hidden"),JSON.stringify([...new Set([postId,...ids])]));
}
