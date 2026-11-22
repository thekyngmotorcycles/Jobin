import {privateMetadataStorage} from "./private-metadata-storage";
import {assertAccountOwner} from "./account-scope";
import {captureMessageScope,type MessageScope} from "./message-session";
import {serializePrivateWrite} from "./private-write-queue";
import type {JShopDraft} from "./jshop-model";

const draftsKey=(id:string)=>"jobeen.jshop.drafts.v1."+id;
const favoritesKey=(id:string)=>"jobeen.jshop.favorites.v1."+id;
export async function jshopAccountId():Promise<string>{return (await captureMessageScope()).owner;}
async function confirm(ownerId:string,scope:MessageScope){
 if(!scope||scope.owner!==ownerId)throw Error("La cuenta cambió.");
 await assertAccountOwner(ownerId,scope.session);
}
export async function readJShopDrafts(ownerId:string,scope:MessageScope):Promise<JShopDraft[]>{
 await confirm(ownerId,scope);
 const raw=await privateMetadataStorage.read("jshop-drafts",scope);
 await confirm(ownerId,scope);
 if(!raw)return [];
 const parsed:unknown=JSON.parse(raw);
 if(!Array.isArray(parsed)||parsed.some(item=>!item||typeof item!=="object"||item.ownerId!==ownerId||typeof item.id!=="string"||typeof item.title!=="string"||!Array.isArray(item.photos)))
  throw Error("Hay borradores que necesitan revisión de titularidad antes de recuperarse.");
 return (parsed as JShopDraft[]).sort((a,b)=>b.updatedAt-a.updatedAt);
}
export async function saveJShopDraft(ownerId:string,draft:JShopDraft,scope:MessageScope):Promise<void>{
 if(draft.ownerId!==ownerId)throw new Error("No puedes modificar anuncios de otra cuenta.");
 await confirm(ownerId,scope);
 await serializePrivateWrite(draftsKey(ownerId),async()=>{
  await confirm(ownerId,scope);
  const drafts=await readJShopDrafts(ownerId,scope);
  await confirm(ownerId,scope);
  await privateMetadataStorage.write("jshop-drafts",scope,JSON.stringify([draft,...drafts.filter(x=>x.id!==draft.id)]));
  await confirm(ownerId,scope);
 });
}
export async function deleteJShopDraft(ownerId:string,id:string,scope:MessageScope):Promise<void>{
 await confirm(ownerId,scope);
 await serializePrivateWrite(draftsKey(ownerId),async()=>{
  const drafts=await readJShopDrafts(ownerId,scope);
  await confirm(ownerId,scope);
  await privateMetadataStorage.write("jshop-drafts",scope,JSON.stringify(drafts.filter(x=>x.id!==id)));
  await confirm(ownerId,scope);
 });
}
export async function readJShopFavorites(ownerId:string,expectedScope?:MessageScope):Promise<string[]>{
 const scope=await captureMessageScope(expectedScope);await confirm(ownerId,scope);
 const raw=await privateMetadataStorage.read("jshop-favorites",scope);
 await confirm(ownerId,scope);
 if(!raw)return [];
 const ids:unknown=JSON.parse(raw);
 if(!Array.isArray(ids)||ids.some(id=>typeof id!=="string"))throw Error("Los favoritos requieren revisión.");
 return ids;
}
export async function toggleJShopFavorite(ownerId:string,id:string,expectedScope?:MessageScope):Promise<boolean>{
 const scope=await captureMessageScope(expectedScope);await confirm(ownerId,scope);
 return serializePrivateWrite(favoritesKey(ownerId),async()=>{
  const ids=await readJShopFavorites(ownerId,scope),has=ids.includes(id);
  await confirm(ownerId,scope);
  await privateMetadataStorage.write("jshop-favorites",scope,JSON.stringify(has?ids.filter(key=>key!==id):[id,...ids]));
  await confirm(ownerId,scope);return !has;
 });
}
