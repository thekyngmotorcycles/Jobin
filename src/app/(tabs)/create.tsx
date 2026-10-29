import { useEffect, useState } from "react";
import { Platform, Text, TextInput, View } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { VideoView, useVideoPlayer } from "expo-video";
import { Button, Notice, Screen, useUi } from "../../components/ui";
function Editor({asset}:{asset:ImagePicker.ImagePickerAsset}){
 const {s,colors}=useUi();const [title,setTitle]=useState("");const [start,setStart]=useState("0");
 const [end,setEnd]=useState(String(Math.min(180,(asset.duration??180000)/1000)));const [notice,setNotice]=useState("");
 const player=useVideoPlayer(asset.uri,p=>{p.timeUpdateEventInterval=0.25;});
 const from=Number(start),to=Number(end),valid=Number.isFinite(from)&&Number.isFinite(to)&&from>=0&&to>from&&to-from<=180;
 useEffect(()=>{const sub=player.addListener("timeUpdate",e=>{if(e.currentTime>=to&&to>0)player.pause();});return()=>sub.remove();},[player,to]);
 const input={borderWidth:1,borderColor:colors.line,color:colors.ink,padding:12,borderRadius:10};
 return <View style={s.panel}><Text style={s.h2}>Tu resumen del día</Text>
 <VideoView player={player} style={{height:280,width:"100%",borderRadius:12}} nativeControls contentFit="contain"/>
 <TextInput accessibilityLabel="Título del video" placeholder="¿Qué lograste hoy?" placeholderTextColor={colors.muted} value={title} onChangeText={setTitle} style={input}/>
 <Text style={s.muted}>Selecciona el inicio y final en segundos. Máximo 180 segundos.</Text>
 <View style={s.row}><Text style={s.text}>Desde</Text><TextInput accessibilityLabel="Inicio en segundos" keyboardType="decimal-pad" value={start} onChangeText={setStart} style={[input,{minWidth:70}]}/>
 <Text style={s.text}>Hasta</Text><TextInput accessibilityLabel="Final en segundos" keyboardType="decimal-pad" value={end} onChangeText={setEnd} style={[input,{minWidth:70}]}/></View>
 <Button secondary title="Ver recorte" onPress={()=>{if(!valid||to>player.duration){setNotice("Selecciona un intervalo válido dentro del video de hasta 180 segundos.");return;}player.currentTime=from;player.play();}}/>
 <Button title="Guardar borrador local" onPress={()=>{if(!valid||!title.trim()||to>player.duration){setNotice("Añade un título y un recorte válido de hasta 180 segundos.");return;}setNotice("Borrador preparado en esta pantalla: "+title.trim()+", "+(to-from).toFixed(1)+" segundos. No se ha exportado ni publicado. El procesamiento final necesita el servicio de video.");}}/>
 <Text style={s.muted}>El recorte es una previsualización. La exportación, los subtítulos y la publicación requieren el procesamiento del servidor. Este borrador no persiste al salir.</Text>
 {!!notice&&<Notice text={notice} onClose={()=>setNotice("")}/>}
 </View>;
}
export default function Create(){
 const {s}=useUi();const [asset,setAsset]=useState<ImagePicker.ImagePickerAsset|null>(null);const [notice,setNotice]=useState("");
 async function choose(camera:boolean){try{
  if(camera){const permission=await ImagePicker.requestCameraPermissionsAsync();if(!permission.granted){setNotice("Necesitamos permiso para abrir la cámara.");return;}}
  const options:ImagePicker.ImagePickerOptions={mediaTypes:["videos"],allowsEditing:false,videoMaxDuration:180};
  const result=camera?await ImagePicker.launchCameraAsync(options):await ImagePicker.launchImageLibraryAsync(options);
  if(!result.canceled){setAsset(result.assets[0]);setNotice("");}
 }catch(error){setNotice(error instanceof Error?error.message:"No se pudo abrir el video.");}}
 return <Screen title="Lo que haces merece verse." subtitle="Crea un video de tu día de trabajo. Todas las cuentas pueden publicar clips de hasta 3 minutos.">
 {!!notice&&<Notice text={notice} onClose={()=>setNotice("")}/>}
 <View style={s.row}><Button title="Elegir video" onPress={()=>void choose(false)}/>{Platform.OS!=="web"&&<Button secondary title="Grabar" onPress={()=>void choose(true)}/>}</View>
 {asset?<Editor key={asset.uri} asset={asset}/>:<View style={s.panel}><Text style={s.h2}>Un día. Una historia.</Text><Text style={s.text}>1. Tu preparación\n2. El problema o proyecto\n3. El resultado y lo que aprendiste</Text><Text style={s.muted}>Elige un video para previsualizar y ajustar su duración.</Text></View>}
 </Screen>;
}
