import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { useVideoPlayer, VideoView } from "expo-video";
import type { FeedClip } from "../lib/feed";
import { Button, useUi } from "./ui";
const MAX_SECONDS = 180;
export function FeedVideo({active,height,clip}:{active:boolean;height:number;clip:FeedClip}) {
 const {s,fs}=useUi(); const [error,setError]=useState(""); const [muted,setMuted]=useState(true);
 const player=useVideoPlayer(clip.video,p=>{p.loop=true;p.muted=true;});
 useEffect(()=>{
  const listener=player.addListener("statusChange",event=>{
   if(event.status==="error")setError("No se pudo cargar el video. Comprueba tu conexión.");
   if(event.status==="readyToPlay"&&player.duration>MAX_SECONDS){player.pause();setError("Video no disponible: supera los 3 minutos.");}
  });
  return()=>listener.remove();
 },[player]);
 useEffect(()=>{if(active&&!error)player.play();else player.pause();},[active,error,player]);
 useEffect(()=>{player.muted=muted;},[muted,player]);
 return <View style={{height,backgroundColor:"#080808",overflow:"hidden",borderRadius:18}}>
  <VideoView player={player} style={{flex:1}} contentFit="cover" nativeControls={false}/>
  <View style={{position:"absolute",top:fs(14),left:fs(14),right:fs(14),flexDirection:"row",justifyContent:"space-between",gap:8}}>
   <Text style={{color:"#fff",fontSize:fs(11),backgroundColor:"#0009",padding:fs(8),borderRadius:12}}>VIDEO DE MUESTRA · ≤ 3 MIN</Text>
   <Button secondary title={muted?"Activar audio":"Silenciar"} onPress={()=>setMuted(!muted)}/>
  </View>
  <View style={{position:"absolute",bottom:fs(24),left:fs(18),right:fs(18),gap:fs(10)}}>
   {!!error&&<Text accessibilityLiveRegion="polite" style={{color:"#fff",backgroundColor:"#000",padding:12}}>{error}</Text>}
   <Text style={[s.h2,{color:"#fff"}]}>{clip.author}</Text>
   <Text style={{color:"#fff",fontSize:fs(13),lineHeight:fs(20)}}>{clip.caption}</Text>
   <Text style={{color:"#ffffffb3",fontSize:fs(11),lineHeight:fs(16)}}>Clip de ejemplo. No es una publicación real de Jobin.</Text>
   <View style={{flexDirection:"row",gap:10}}><Button secondary title="Pausar" onPress={()=>player.pause()}/><Button title="Reproducir" onPress={()=>{if(!error)player.play();}}/></View>
  </View>
 </View>;
}
