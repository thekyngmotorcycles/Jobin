import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import {createAndroidPrivateFileStorage} from "./android-private-file-storage";
import {assertMessageScope, type MessageScope} from "./message-session";
import {assertEvidenceSession,attachmentExtension,createPrivateAttachments,type PrivateAttachment,type PendingEvidence} from "./private-attachment";
import type {PrivateFileKind} from "./private-file-vault";
import {requireSupabase,supabase} from "./supabase";
import {sessionExitFence} from "./session-exit-fence";
import {sessionMarkerKey} from "./session-lifetime";

function attachments(){
 return createPrivateAttachments(createAndroidPrivateFileStorage(),assertMessageScope);
}
export async function pickSecuredPhotos(scope:MessageScope,kind:PrivateFileKind,options:ImagePicker.ImagePickerOptions,camera=false,maxFiles=5){
 await assertMessageScope(scope);
 const store=attachments();
 const settings={...options,mediaTypes:["images"] as ImagePicker.MediaType[],base64:false,exif:false};
 const result=camera?await ImagePicker.launchCameraAsync(settings):await ImagePicker.launchImageLibraryAsync(settings);
 return result.canceled?[]:store.protect(scope,kind,result.assets,"image",undefined,maxFiles);
}
export async function pickSecuredEvidence(scope:MessageScope,categories:string[],multiple=false):Promise<PendingEvidence[]>{
 await assertMessageScope(scope);
 const store=attachments();
 const result=await DocumentPicker.getDocumentAsync({type:categories,multiple,copyToCacheDirectory:false});
 if(result.canceled)return [];
 if(result.assets.length>5)throw Error("Puedes adjuntar hasta cinco archivos.");
 const files=await store.protect(scope,"report-evidence",result.assets,"document",categories);
 return files.map((file,i)=>({...file,name:result.assets[i].name,session:scope.session}));
}
export async function previewSecuredPhoto(scope:MessageScope,kind:PrivateFileKind,file:PrivateAttachment){
 return attachments().use(scope,kind,file,(bytes,mime)=>{
  if(mime==="application/pdf")throw Error("No es una fotografía.");
  // Only for an on-screen preview. Never write this string to metadata or disk.
  let binary="";
  for(let start=0;start<bytes.length;start+=8192)binary+=String.fromCharCode(...bytes.subarray(start,start+8192));
  return "data:"+mime+";base64,"+btoa(binary);
 });
}
export async function uploadSecuredFile(scope:MessageScope,kind:PrivateFileKind,file:PrivateAttachment,bucket:string,prefix=""){
 if(kind==="report-evidence")assertEvidenceSession(file as PendingEvidence,scope);
 return attachments().use(scope,kind,file,async(bytes,mime)=>{
  if(prefix&&!/^[0-9a-f-]{36}\/$/.test(prefix))throw Error("Destino privado no disponible.");
  const path=scope.owner+"/"+prefix+createAndroidPrivateFileStorage().randomId()+"."+attachmentExtension[mime];
  const client=requireSupabase();
  const {data:{session},error:authError}=await client.auth.getSession();
  if(authError||session?.user.id!==scope.owner||sessionMarkerKey(scope.owner,session.access_token)!==scope.session)
   throw Error("La sesión cambió.");
  await assertMessageScope(scope);
  const {error}=await client.storage.from(bucket).upload(path,bytes,{contentType:mime,upsert:false,cacheControl:"0",
   headers:{Authorization:"Bearer "+session.access_token}});
  if(error)throw Error("No se pudo enviar el archivo privado.");
  return path;
 });
}

/** Clear in-memory attachments as soon as an editor's exact session closes. */
export function watchAttachmentScope(getScope:()=>MessageScope|null,onClose:()=>void){
 const stop=sessionExitFence.subscribe(()=>{
  if(getScope()?.session===sessionExitFence.current()&&getScope())onClose();
 });
 const subscription=supabase?.auth.onAuthStateChange((_event,session)=>{
  const scope=getScope();
  if(!scope)return;
  let valid=false;
  try{valid=session?.user.id===scope.owner&&sessionMarkerKey(scope.owner,session.access_token)===scope.session;}
  catch{/* An invalid session cannot retain a preview. */}
  if(!valid)onClose();
 }).data.subscription;
 return ()=>{stop();subscription?.unsubscribe();};
}
