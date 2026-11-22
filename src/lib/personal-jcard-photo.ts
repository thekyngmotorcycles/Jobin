import {requireSupabase,supabase} from "./supabase";
import {createBusinessSessionMemory} from "./business-session-memory";
import {sessionMarkerKey} from "./session-lifetime";
import {assertMessageScope,captureMessageScope,type MessageScope} from "./message-session";
const BUCKET="personal-jcard-avatars";
const photoChanged=createBusinessSessionMemory<boolean>();
let observed:string|null=null;
supabase?.auth.onAuthStateChange((event,session)=>{
 let next:string|null=null;try{if(session)next=sessionMarkerKey(session.user.id,session.access_token);}catch{}
 if(next!==observed||event==="SIGNED_OUT")photoChanged.clear();
 observed=next;
});
export function consumePersonalPhotoChange(scope:MessageScope):boolean{
 const changed=photoChanged.read(scope)===true;photoChanged.clear();return changed;
}
export async function uploadPersonalJCardPhoto(base64:string,mime="image/jpeg",expectedOwner?:string,expectedScope?:MessageScope):Promise<string>{
 if(!base64)throw new Error("No se pudo leer la fotografía procesada.");
 const decoded=atob(base64);
 const bytes=new Uint8Array(decoded.length);
 for(let i=0;i<decoded.length;i++)bytes[i]=decoded.charCodeAt(i);
 if(!bytes.byteLength||bytes.byteLength>2097152)throw new Error("La fotografía debe pesar menos de 2 MB. Selecciona una imagen más pequeña.");

 if(!["image/jpeg","image/png","image/webp"].includes(mime))throw new Error("Selecciona una imagen JPG, PNG o WEBP.");
 const db=requireSupabase(),scope=await captureMessageScope(expectedScope),user={id:scope.owner};
 if(expectedOwner&&user.id!==expectedOwner)throw new Error("La cuenta cambió.");
 await assertMessageScope(scope);
 const extension=mime==="image/png"?"png":mime==="image/webp"?"webp":"jpg";
 const path=user.id+"/"+Date.now()+"."+extension;
 const uploaded=await db.storage.from(BUCKET).upload(path,bytes,{contentType:mime,upsert:false,cacheControl:"0"});
 if(uploaded.error)throw uploaded.error;
 await assertMessageScope(scope);
 const {error}=await db.from("profiles").update({avatar_path:path}).eq("id",user.id);
 if(error)throw error;
 await assertMessageScope(scope);
 photoChanged.write(scope,true);
 return db.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}
export function personalAvatarUrl(path:string|undefined|null):string|undefined{
 if(!path)return undefined;
 if(/^https:\/\//.test(path))return path;
 return requireSupabase().storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}
