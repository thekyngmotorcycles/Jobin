import {requireOptionalNativeModule} from "expo";
import {fetch as expoFetch} from "expo/fetch";
import {Platform} from "react-native";
import {assertMessageScope,captureMessageScope,type MessageScope} from "./message-session";
import {selectedBrowserVideo,selectedCachedVideo,type PickedVideo,type VideoFileSystem} from "./private-video-source";
import {createPrivateVideoTransfer} from "./private-video-transfer";
import {createPrivateVideoTus,type WorkVideoSubmission} from "./private-video-tus";
import {loadSafety} from "./safety-api";
import {sessionMarkerKey} from "./session-lifetime";
import {requireSupabase} from "./supabase";

const selections=new WeakMap<PickedVideo,{asset:PickedVideo;scope:MessageScope}>();

/** Capture picker provenance in memory. Deserialized drafts intentionally lose it. */
export function rememberWorkVideoSelection(asset:PickedVideo,scope:MessageScope){
 selections.set(asset,{asset:{uri:asset.uri,fileSize:asset.fileSize,mimeType:asset.mimeType,file:asset.file},scope:{...scope}});
}

export function createWorkVideoUpload(asset:PickedVideo,input:WorkVideoSubmission,expected:MessageScope){
 const origin=process.env.EXPO_PUBLIC_PRIVATE_VIDEO_UPLOAD_URL;
 if(process.env.EXPO_PUBLIC_JOBEEN_SECURITY_PILOT!=="1"||!origin)
  throw Error("La transferencia privada de video está pendiente de configuración.");
 const selected=selections.get(asset);
 if(!selected||selected.scope.owner!==expected.owner||selected.scope.session!==expected.session)
  throw Error("Vuelve a seleccionar el video para enviarlo desde esta sesión.");
 if(!input.consent)throw Error("Acepta las reglas de contenido profesional antes de enviar el video.");
 const scope={...expected};
 let stopped=false,run:ReturnType<typeof createPrivateVideoTransfer>|undefined;
 let channel:ReturnType<typeof createPrivateVideoTus>|undefined;
 return {
  stop(){stopped=true;run?.stop();channel?.stop();},
  async send(){
   await captureMessageScope(scope);
   if(stopped)throw Error("Transferencia cancelada.");
   const safety=await loadSafety(scope);
   if(!safety||safety.mediaBlocked||safety.accountBlocked)throw Error("La publicación está restringida. Consulta tus sanciones.");
   if(stopped)throw Error("Transferencia cancelada.");
   if(!run){
    const fs=Platform.OS==="web"?null:requireOptionalNativeModule<VideoFileSystem>("FileSystem");
    if(Platform.OS!=="web"&&!fs)throw Error("La aplicación instalada no admite lectura de video por segmentos.");
    const source=fs?selectedCachedVideo(selected.asset,fs):selectedBrowserVideo(selected.asset);
    channel=createPrivateVideoTus({
     origin,scope,source,submission:input,
     request:async(url,init)=>Platform.OS==="web"?fetch(url,init):expoFetch(url,{
      ...init,body:init.body??undefined,signal:init.signal??undefined,
     }),
     authorize:async actor=>{
      const {data,error}=await requireSupabase().auth.getSession();
      const session=data.session;
      if(error||session?.user.id!==actor.owner||sessionMarkerKey(actor.owner,session.access_token)!==actor.session)
       throw Error("La sesión cambió.");
      await assertMessageScope(actor);
      return session.access_token;
     },
    });
    run=createPrivateVideoTransfer(source,scope,channel.transport,assertMessageScope,channel.allocate);
   }
   await run.transfer();
   const result=channel?.receipt();
   if(!result)throw Error("El servidor no confirmó el video.");
   return result;
  },
 };
}
