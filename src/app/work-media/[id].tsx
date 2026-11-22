import { useEffect,useState } from "react";
import { AppState,Text,View } from "react-native";
import { router,useLocalSearchParams } from "expo-router";
import { useIsFocused } from "@react-navigation/native";
import { useVideoPlayer,VideoView } from "expo-video";
import { Screen,Button,useUi } from "../../components/ui";
import { EmployerReportButton } from "../../components/EmployerReportButton";
import { loadMedia,type MediaView } from "../../lib/safety-api";
import {captureMessageScope,assertMessageScope,type MessageScope} from "../../lib/message-session";
import { bindPlaybackLifecycle } from "../../lib/playback-lifecycle";
function Playback({url}:{url:string}){
 const focused=useIsFocused();const player=useVideoPlayer({uri:url,useCaching:false},p=>{p.muted=false;});
 useEffect(()=>bindPlaybackLifecycle(player,focused,AppState.currentState,listener=>{const sub=AppState.addEventListener("change",listener);return()=>sub.remove();}),[player,focused]);
 return <VideoView player={player} nativeControls contentFit="contain" style={{width:"100%",aspectRatio:9/16}}/>;
}
export default function WorkMediaRoom(){
 const {id}=useLocalSearchParams<{id:string}>();const focused=useIsFocused();const {s}=useUi();
 const [media,setMedia]=useState<MediaView|null>(null);const [error,setError]=useState("");const [loading,setLoading]=useState(true);
 useEffect(()=>{
  let current=true,reading=false,generation=0,scope:MessageScope|null=null;
  let foreground=AppState.currentState==="active"||AppState.currentState===null;
  let freshness:ReturnType<typeof setTimeout>|null=null;
  const clearLease=()=>{if(freshness)clearTimeout(freshness);freshness=null;};
  const invalidate=()=>{generation++;clearLease();setMedia(null);};
  setMedia(null);setLoading(!!focused);
  async function refresh(){
   if(reading||!current||!focused||!foreground)return;
   reading=true;const revision=generation;
   const valid=()=>current&&foreground&&focused&&generation===revision;
   try{
    const origin=scope??await captureMessageScope();if(!valid())return;
    scope=origin;
    const value=await loadMedia(id,origin);await assertMessageScope(origin);
    if(valid()){
     clearLease();setMedia(value);setError("");
     // A stalled request or offline state must not keep playing a previously authorized URL.
     freshness=setTimeout(()=>{if(valid()){setMedia(null);setError("No se pudo renovar el permiso de reproducción.");}},5000);
    }
   }catch(e){if(valid()){clearLease();setMedia(null);setError(e instanceof Error?e.message:"Contenido no disponible.");}}
   finally{reading=false;if(valid())setLoading(false);}
  }
  if(!focused)return;
  const app=AppState.addEventListener("change",state=>{
   foreground=state==="active";
   invalidate();
   if(foreground){setLoading(true);void refresh();}
  });
  void refresh();const timer=setInterval(()=>void refresh(),2000);
  return()=>{current=false;generation++;clearLease();clearInterval(timer);app.remove();};

 },[id,focused]);
 return <Screen demo={false} title={media?.title??"Trabajo profesional."} subtitle={media?.author??"Contenido con controles de seguridad."}>
  {media?.playbackUrl?<Playback key={id+media.playbackUrl} url={media.playbackUrl}/>:<View style={s.notice}><Text style={s.text}>{loading?"Consultando estado de publicación…":error||"Este contenido no está disponible para reproducir. Puede estar pendiente, finalizado o retirado."}</Text></View>}
  {media&&<EmployerReportButton mediaId={media.id} creatorId={media.creatorId}/>}
  <Button secondary title="Volver" onPress={()=>router.canGoBack()?router.back():router.replace("/streams")}/>
 </Screen>;
}
