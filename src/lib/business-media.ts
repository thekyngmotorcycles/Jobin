import * as DocumentPicker from "expo-document-picker";
import {requireSupabase} from "./supabase";
export type PickedPhoto={uri:string;name:string;mimeType:string;size:number};
export async function pickBusinessPhotos(max:number):Promise<PickedPhoto[]>{
 const result=await DocumentPicker.getDocumentAsync({type:["image/jpeg","image/png","image/webp"],multiple:max>1,copyToCacheDirectory:true});
 if(result.canceled)return [];
 const photos=result.assets.map(a=>({uri:a.uri,name:a.name,mimeType:a.mimeType??"",size:a.size??0}));
 if(photos.length>max||photos.some(p=>p.size>10485760||p.size===0||!["image/jpeg","image/png","image/webp"].includes(p.mimeType)))throw Error("Selecciona hasta "+max+" fotos JPG, PNG o WEBP, máximo 10 MB por foto.");
 return photos;
}
export async function uploadBusinessPhoto(bucket:"business-profile-media"|"business-review-photos",owner:string,photo:PickedPhoto,slot:string){
 const extension=photo.mimeType==="image/png"?"png":photo.mimeType==="image/webp"?"webp":"jpg";
 const path=owner+"/"+slot+"-"+Date.now()+"-"+Math.random().toString(36).slice(2)+"."+extension;
 const response=await fetch(photo.uri);if(!response.ok)throw Error("No se pudo leer la foto.");
 const bytes=await response.arrayBuffer();
 const db=requireSupabase(),result=await db.storage.from(bucket).upload(path,bytes,{contentType:photo.mimeType,upsert:false});
 if(result.error)throw result.error;
 return {path,url:db.storage.from(bucket).getPublicUrl(path).data.publicUrl};
}
