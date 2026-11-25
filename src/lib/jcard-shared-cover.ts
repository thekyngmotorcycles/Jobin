import {requireSupabase} from "./supabase";
import {assertMessageScope,captureMessageScope,type MessageScope} from "./message-session";

const BUCKET="jobeen-jcard-covers",TABLE="jobeen_jcard_covers";
const MAX_BYTES=2*1024*1024;
const READER="jcard-cover-read";
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
/** Request the selected cover through the non-cacheable authorization gateway. No reusable Storage URL. */
export async function readSharedCover(target:string,expected:MessageScope):Promise<SharedCover>{
 const scope=await captureMessageScope(expected),db=requireSupabase();
 const session=await db.auth.getSession();
 if(session.error||!session.data.session||session.data.session.user.id!==scope.owner)throw Error("La sesión cambió.");
 await assertMessageScope(scope);
 const {data,error}=await db.functions.invoke<SharedCover>(READER,{body:{target},headers:{Authorization:"Bearer "+session.data.session.access_token,"Cache-Control":"no-store"}});
 await assertMessageScope(scope);
 if(error)throw Error("No se pudo cargar la portada.");
 if(data?.path===null&&data.url===null)return {path:null,url:null};
 if(!data||typeof data.path!=="string"||!validSelectedPath(target,data.path)||
  typeof data.url!=="string"||data.url.length>Math.ceil(MAX_BYTES/3)*4+64||
  !/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(data.url))throw Error("Portada no válida.");
 return {path:data.path,url:data.url};
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
