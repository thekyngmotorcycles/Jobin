import * as ImagePicker from "expo-image-picker";
import {requireSupabase} from "./supabase";
const BUCKET="personal-jcard-avatars";
export async function replacePersonalJCardPhoto():Promise<string|null>{
 const permission=await ImagePicker.requestMediaLibraryPermissionsAsync();
 if(!permission.granted)throw new Error("Permite el acceso a tus fotos para cambiar la imagen.");
 const picked=await ImagePicker.launchImageLibraryAsync({mediaTypes:["images"],allowsMultipleSelection:false,allowsEditing:true,aspect:[1,1],quality:0.6});
 if(picked.canceled||!picked.assets.length)return null;
 const asset=picked.assets[0];
 const response=await fetch(asset.uri);
 if(!response.ok)throw new Error("No se pudo leer la fotografía.");
 const bytes=await response.arrayBuffer();
 if(!bytes.byteLength||bytes.byteLength>2097152)throw new Error("La fotografía debe pesar menos de 2 MB. Selecciona una imagen más pequeña.");
 const mime=asset.mimeType??"image/jpeg";
 if(!["image/jpeg","image/png","image/webp"].includes(mime))throw new Error("Selecciona una imagen JPG, PNG o WEBP.");
 const db=requireSupabase();const {data:{user},error:authError}=await db.auth.getUser();
 if(authError||!user)throw new Error("Inicia sesión para editar tu JCard.");
 const extension=mime==="image/png"?"png":mime==="image/webp"?"webp":"jpg";
 const path=user.id+"/"+Date.now()+"."+extension;
 const uploaded=await db.storage.from(BUCKET).upload(path,bytes,{contentType:mime,upsert:false,cacheControl:"31536000"});
 if(uploaded.error)throw uploaded.error;
 const {error}=await db.from("profiles").update({avatar_path:path}).eq("id",user.id);
 if(error)throw error;
 return db.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}
export function personalAvatarUrl(path:string|undefined|null):string|undefined{
 if(!path)return undefined;
 if(/^https:\/\//.test(path))return path;
 return requireSupabase().storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}
