import {requireSupabase} from "./supabase";
import {assertMessageScope,captureMessageScope,type MessageScope} from "./message-session";

const BUCKET="jobeen-jcard-covers",TABLE="jobeen_jcard_covers";
const MAX_BYTES=2*1024*1024;
const SIGNED_SECONDS=60;
export type SharedCover={path:string|null;url:string|null};

function ownedPath(owner:string,path:string):boolean{
 return path.startsWith(owner+"/")&&/^cover-[0-9]{10,16}-[a-z0-9]{6,24}[.]jpg$/.test(path.slice(owner.length+1));
}
function validSelectedPath(owner:string,path:string):boolean{
 return path.startsWith(owner+"/")&&/^cover-[0-9]{10,16}-[a-z0-9]{6,24}[.](jpg|png|webp)$/.test(path.slice(owner.length+1));
}
async function ownScope(target:string,expected:MessageScope){
 const origin=await captureMessageScope(expected);
 if(origin.owner!==target)throw Error("La cuenta cambió. Vuelve a abrir la portada.");
 return origin;
}
/** The metadata and object are separately authorized by RLS. Only current selection is signed. */
export async function readSharedCover(target:string,expected:MessageScope):Promise<SharedCover>{
 const scope=await captureMessageScope(expected),db=requireSupabase();
 const {data,error}=await db.from(TABLE as never).select("object_path").eq("owner_id",target).maybeSingle();
 if(error)throw error;
 await assertMessageScope(scope);
 const path=(data as {object_path:string}|null)?.object_path??null;
 if(!path)return {path:null,url:null};
 if(!validSelectedPath(target,path))throw Error("Portada no válida.");
 const signed=await db.storage.from(BUCKET).createSignedUrl(path,SIGNED_SECONDS);
 await assertMessageScope(scope);
 return {path,url:signed.error?null:signed.data?.signedUrl??null};
}
/** Only noncurrent immutable versions can be removed by the storage policies. */
async function cleanup(target:string,path:string|null,scope:MessageScope){
 if(!path||!validSelectedPath(target,path))return;
 try{await assertMessageScope(scope);await requireSupabase().storage.from(BUCKET).remove([path]);}catch{/* Safe orphan: inaccessible to other profiles, never delete a current object. */}
}
/** Upload after explicit confirmation; compare-and-swap protects edits on two devices. */
export async function publishSharedCover(target:string,expected:MessageScope,previous:string|null,uri:string):Promise<string>{
 const scope=await ownScope(target,expected),db=requireSupabase();
 if(previous&&!validSelectedPath(target,previous))throw Error("Vuelve a cargar la portada.");
 const response=await fetch(uri);
 if(!response.ok)throw Error("No se pudo leer la portada seleccionada.");
 const bytes=await response.arrayBuffer();
 if(bytes.byteLength===0||bytes.byteLength>MAX_BYTES)throw Error("La portada procesada debe pesar como máximo 2 MB.");
 const suffix=Math.random().toString(36).slice(2,14).padEnd(12,"0");
 const path=target+"/cover-"+Date.now()+"-"+suffix+".jpg";
 if(!ownedPath(target,path))throw Error("Ruta de portada inválida.");
 await assertMessageScope(scope);
 const upload=await db.storage.from(BUCKET).upload(path,bytes,{contentType:"image/jpeg",cacheControl:"0",upsert:false});
 if(upload.error)throw upload.error;
 await assertMessageScope(scope);
 // In a lost response, do not delete a potentially committed new selection.
 const write=previous
  ?await db.from(TABLE as never).update({object_path:path} as never).eq("owner_id",target).eq("object_path",previous).select("object_path").maybeSingle()
  :await db.from(TABLE as never).insert({owner_id:target,object_path:path} as never).select("object_path").maybeSingle();
 await assertMessageScope(scope);
 if(write.error)throw write.error;
 if(!write.data){await cleanup(target,path,scope);throw Error("La portada cambió en otro dispositivo. Vuelve a cargarla.");}
 await cleanup(target,previous,scope);
 return path;
}
export async function removeSharedCover(target:string,expected:MessageScope,previous:string){
 const scope=await ownScope(target,expected),db=requireSupabase();
 if(!validSelectedPath(target,previous))throw Error("Vuelve a cargar la portada.");
 await assertMessageScope(scope);
 const {data,error}=await db.from(TABLE as never).delete().eq("owner_id",target).eq("object_path",previous).select("object_path").maybeSingle();
 if(error)throw error;
 await assertMessageScope(scope);
 if(!data)throw Error("La portada cambió en otro dispositivo. Vuelve a cargarla.");
 await cleanup(target,previous,scope);
}
