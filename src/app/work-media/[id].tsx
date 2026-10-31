import { useEffect,useState } from "react";
import { AppState,Text,View } from "react-native";
import { router,useLocalSearchParams } from "expo-router";
import { useIsFocused } from "@react-navigation/native";
import { useVideoPlayer,VideoView } from "expo-video";
import { Screen,Button,useUi } from "../../components/ui";
import { EmployerReportButton } from "../../components/EmployerReportButton";
import { loadMedia,type MediaView } from "../../lib/safety-api";
import { bindPlaybackLifecycle } from "../../lib/playback-lifecycle";
function Playback({url}:{url:string}){
 const focused=useIsFocused();const player=useVideoPlayer(url,p=>{p.muted=false;});
 useEffect(()=>bindPlaybackLifecycle(player,focused,AppState.currentState,listener=>{const sub=AppState.addEventListener("change",listener);return()=>sub.remove();}),[player,focused]);
 return <VideoView player={player} nativeControls contentFit="contain" style={{width:"100%",aspectRatio:9/16}}/>;
}
export default function WorkMediaRoom(){
 const {id}=useLocalSearchParams<{id:string}>();const focused=useIsFocused();const {s}=useUi();
 const [media,setMedia]=useState<MediaView|null>(null);const [error,setError]=useState("");const [loading,setLoading]=useState(true);
 useEffect(()=>{
  let current=true;let reading=false;setMedia(null);setLoading(true);
  async function refresh(){if(reading||!focused)return;reading=true;try{const value=await loadMedia(id);if(current){setMedia(value);setError("");}}catch(e){if(current){setMedia(null);setError(e instanceof Error?e.message:String(e));}}finally{reading=false;if(current)setLoading(false);}}
  void refresh();const timer=setInterval(()=>void refresh(),2000);
  return()=>{current=false;clearInterval(timer);};
 },[id,focused]);
 return <Screen title={media?.title??"Trabajo profesional."} subtitle={media?.author??"Contenido con controles de seguridad."}>
  {media?.playbackUrl?<Playback key={id+media.playbackUrl} url={media.playbackUrl}/>:<View style={s.notice}><Text style={s.text}>{loading?"Consultando estado de publicación…":error||"Este contenido no está disponible para reproducir. Puede estar pendiente, finalizado o retirado."}</Text></View>}
  {media&&<EmployerReportButton mediaId={media.id} creatorId={media.creatorId}/>}
  <Button secondary title="Volver" onPress={()=>router.canGoBack()?router.back():router.replace("/streams")}/>
 </Screen>;
}
