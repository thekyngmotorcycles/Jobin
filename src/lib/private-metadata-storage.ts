import {Platform} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {assertMessageScope,type MessageScope} from "./message-session";
import type {PrivateMetadataKind} from "./private-metadata-vault";
// Legacy web behavior is separate and does not provide encryption.
// Never resolve this implementation as a plaintext fallback on native.
const prefixes:Record<PrivateMetadataKind,string>={
 "post-drafts":"jobeen.post.drafts.v1.",
 "jshop-drafts":"jobeen.jshop.drafts.v1.",
 "jshop-favorites":"jobeen.jshop.favorites.v1.",
 "flash-draft":"jobeen.flash.draft.v1.",
 "reel-draft":"jobeen.reel.draft.v1."
};
async function key(kind:PrivateMetadataKind,scope:MessageScope){
 if(Platform.OS!=="web")throw Error("Almacenamiento privado nativo no disponible.");
 await assertMessageScope(scope);
 return prefixes[kind]+scope.owner;
}
export const privateMetadataStorage={
 async read(kind:PrivateMetadataKind,scope:MessageScope){
  const value=await AsyncStorage.getItem(await key(kind,scope));
  await assertMessageScope(scope);return value;
 },
 async write(kind:PrivateMetadataKind,scope:MessageScope,value:string){
  await AsyncStorage.setItem(await key(kind,scope),value);
  await assertMessageScope(scope);
 }
};

export async function restoreVerifiedNativePostDrafts(_scope:MessageScope,_payload:string,_revalidate:()=>Promise<void>):Promise<boolean>{
 throw Error("La recuperación requiere almacenamiento nativo seguro.");
}
