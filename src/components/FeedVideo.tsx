import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { useVideoPlayer, VideoView } from "expo-video";
import { Button, useUi } from "./ui";
const SAMPLE="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4";
export function FeedVideo({active,height,index}:{active:boolean;height:number;index:number}) {
 const {s}=useUi(); const [error,setError]=useState(""); const [muted,setMuted]=useState(true);
 const player=useVideoPlayer(SAMPLE,p=>{p.loop=true;p.muted=true;});
 useEffect(()=>{
  const listener=player.addListener("statusChange",event=>{
   if(event.status==="error")setError("No se pudo cargar el video. Comprueba tu conexión.");
   if(event.status==="readyToPlay"&&player.duration>180){player.pause();setError("Video no disponible: supera los 3 minutos.");}
  });
  return()=>listener.remove();
 },[player]);
 useEffect(()=>{if(active&&!error)player.play();else player.pause();},[active,error,player]);
 useEffect(()=>{player.muted=muted;},[muted,player]);
 return <View style={{height,backgroundColor:"#080808",overflow:"hidden",borderRadius:18}}>
  <VideoView player={player} style={{flex:1}} contentFit="cover" nativeControls={false}/>
  <View style={{position:"absolute",top:18,left:18,right:18,flexDirection:"row",justifyContent:"space-between"}}>
   <Text style={{color:"#fff",fontSize:11,backgroundColor:"#0009",padding:8,borderRadius:12}}>VIDEO DE MUESTRA · ≤ 3 MIN</Text>
   <Button secondary title={muted?"Activar audio":"Silenciar"} onPress={()=>setMuted(!muted)}/>
  </View>
  <View style={{position:"absolute",bottom:28,left:22,right:22,gap:12}}>
   {!!error&&<Text accessibilityLiveRegion="polite" style={{color:"#fff",backgroundColor:"#000",padding:12}}>{error}</Text>}
   <Text style={[s.h2,{color:"#fff"}]}>{["Tu trabajo cuenta una historia.","Una mirada a tu día.","El talento se demuestra."][index%3]}</Text>
   <Text style={{color:"#fff",fontSize:13,lineHeight:21}}>Aquí verás los días de trabajo de la comunidad. Este clip de prueba muestra la reproducción del feed; no es un profesional de Jobin.</Text>
   <View style={{flexDirection:"row",gap:10}}><Button secondary title="Pausar" onPress={()=>player.pause()}/><Button title="Reproducir" onPress={()=>{if(!error)player.play();}}/></View>
  </View>
 </View>;
}
