import {useCallback,useEffect,useRef,useState} from "react";
import {AppState,Platform,Text,View} from "react-native";
import {CameraView,Camera,type CameraType} from "expo-camera";
import {useFocusEffect,useIsFocused} from "@react-navigation/native";
import {Button,PageState,useUi} from "./ui";
import {canShowLivePreview,type PreviewScope} from "../lib/live-preview";
import {captureMessageScope,assertMessageScope} from "../lib/message-session";
import {requestJobinCameraAccess} from "../lib/native-camera";
import {supabase} from "../lib/supabase";

/** A local viewfinder only: no recording, network, file writes or audio capture. */
export function LiveDevicePreview({scope}:{scope:PreviewScope}){
 const {s,colors}=useUi();const focused=useIsFocused();
 const [foreground,setForeground]=useState(AppState.currentState==="active"||AppState.currentState===null);
 const [verified,setVerified]=useState<PreviewScope|null>(null);
 const [requested,setRequested]=useState(false);
 const [granted,setGranted]=useState(false);
 const [microphone,setMicrophone]=useState<boolean|null>(null);
 const [facing,setFacing]=useState<CameraType>("back");
 const [error,setError]=useState("");
 const [busy,setBusy]=useState(false);
 const [ready,setReady]=useState(false);
 const epoch=useRef(0),pending=useRef(false);
 const stop=useCallback(()=>{
  epoch.current++;setRequested(false);setVerified(null);setGranted(false);setReady(false);setMicrophone(null);setError("");
 },[]);
 useFocusEffect(useCallback(()=>{return()=>{stop();};},[stop]));
 useEffect(()=>{
  const sub=AppState.addEventListener("change",state=>{
   setForeground(state==="active");
   if(state!=="active")stop();
  });
  const auth=supabase?.auth.onAuthStateChange((_event,session)=>{
   if(!session||session.user.id!==scope.owner||_event==="SIGNED_OUT"||_event==="SIGNED_IN"||_event==="TOKEN_REFRESHED")stop();
  });
  return()=>{epoch.current++;sub.remove();auth?.data.subscription.unsubscribe();};
 },[scope.owner,scope.session,stop]);
 const show=Platform.OS!=="web"&&canShowLivePreview({focused,foreground,requested,cameraGranted:granted,verified,current:scope});
 async function open(){
  if(!focused||!foreground||pending.current||Platform.OS==="web")return;
  const revision=++epoch.current;pending.current=true;setBusy(true);setError("");setReady(false);
  try{
   const origin=await captureMessageScope(scope);
   if(revision!==epoch.current)return;
   const permission=await requestJobinCameraAccess(false);
   await assertMessageScope(origin);
   if(revision!==epoch.current)return;
   if(!permission.camera){setError("Permiso de cámara no concedido. Puedes habilitarlo en los ajustes del teléfono.");return;}
   setVerified(origin);setGranted(true);setRequested(true);
  }catch(e){if(revision===epoch.current)setError(e instanceof Error?e.message:"No se pudo abrir la cámara.");}
  finally{pending.current=false;setBusy(false);}
 }
 async function checkMicrophone(){
  if(!focused||!foreground||pending.current||Platform.OS==="web")return;
  const revision=++epoch.current;pending.current=true;setBusy(true);setError("");
  try{
   const origin=await captureMessageScope(scope);
   if(revision!==epoch.current)return;
   const permission=await Camera.requestMicrophonePermissionsAsync();
   await assertMessageScope(origin);
   if(revision!==epoch.current)return;
   setMicrophone(permission.granted);
  }catch(e){if(revision===epoch.current)setError(e instanceof Error?e.message:"No se pudo comprobar el micrófono.");}
  finally{pending.current=false;setBusy(false);}
 }
 return <View style={s.panel}>
  <Text accessibilityRole="header" style={s.h3}>Cámara y micrófono</Text>
  {Platform.OS==="web"?<PageState kind="info" message="Vista previa disponible en la aplicación móvil."/>:<>
   {show&&<View style={{width:"100%",aspectRatio:4/3,overflow:"hidden",borderRadius:12,backgroundColor:colors.ink}}>
    <CameraView facing={facing} mode="picture" style={{flex:1}} onCameraReady={()=>setReady(true)}
     onMountError={()=>{stop();setError("No se pudo iniciar la cámara. Comprueba que no esté siendo utilizada.");}}/>
   </View>}
   {show&&!ready&&<Text accessibilityLiveRegion="polite" style={s.muted}>Preparando cámara…</Text>}
   {show?<View style={s.row}>
    <Button secondary title="Cambiar cámara" onPress={()=>{setReady(false);setFacing(value=>value==="back"?"front":"back");}}/>
    <Button secondary title="Cerrar vista previa" onPress={stop}/>
   </View>:<Button secondary title="Activar vista previa" busy={busy} onPress={()=>void open()}/>}
   <Button secondary title={microphone===true?"Comprobar permiso de micrófono":microphone===false?"Permitir micrófono":"Comprobar micrófono"} disabled={busy} onPress={()=>void checkMicrophone()}/>
   {microphone!==null&&<Text accessibilityLiveRegion="polite" style={s.muted}>{microphone?"Permiso de micrófono concedido. No se está capturando audio.":"Permiso de micrófono no concedido."}</Text>}
   {!!error&&<Text accessibilityRole="alert" style={s.text}>{error}</Text>}
   <Text style={s.muted}>Vista previa local. No se graba ni se transmite.</Text>
  </>}
 </View>;
}
