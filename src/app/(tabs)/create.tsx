import { WorkRulesFields,useWorkDraft } from "../../components/WorkRulesFields";
import { MyWorkMedia } from "../../components/MyWorkMedia";
import { uploadWorkVideo } from "../../lib/safety-api";
import { useEffect, useRef, useState } from "react";
import { Platform, Pressable, Text, TextInput, View } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { VideoView, useVideoPlayer } from "expo-video";
import { Button, Notice, Screen, useUi } from "../../components/ui";
import { CHAPTERS, CLIP_SECONDS, chapterAt, emptyClips, nextOpenSlot, type ChapterId, type SlotClips } from "../../lib/day";
function Editor({asset}:{asset:ImagePicker.ImagePickerAsset}){
 const {s,colors}=useUi();const [title,setTitle]=useState("");const [start,setStart]=useState("0");
 const [end,setEnd]=useState(String(Math.min(180,(asset.duration??180000)/1000)));const [notice,setNotice]=useState("");
 const draft=useWorkDraft();const [sending,setSending]=useState(false);const sendingGuard=useRef(false);
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
 <WorkRulesFields draft={draft} live={false}/>
 <Button title={sending?"Enviando a procesamiento…":"Enviar video a procesamiento y moderación"} onPress={()=>{if(sendingGuard.current)return;sendingGuard.current=true;void (async()=>{setSending(true);try{
 if(!valid||!title.trim()||to>player.duration)throw new Error("Completa un título y un intervalo válido de hasta 180 segundos.");
 await uploadWorkVideo(asset,{title,profession:draft.profession,activity:draft.activity,employer:draft.employer,consent:draft.consent,start_ms:Math.round(from*1000),end_ms:Math.round(to*1000)});
 setNotice("Video enviado de forma privada. Solo se publicará después del procesamiento, la moderación completa y la confirmación del proveedor.");
 }catch(e){setNotice(e instanceof Error?e.message:String(e));}finally{sendingGuard.current=false;setSending(false);}})();}}/>
 <Text style={s.muted}>El borrador es local. Enviar el video registra una solicitud real; no equivale a que haya sido analizado o publicado.</Text>
 {!!notice&&<Notice text={notice} onClose={()=>setNotice("")}/>}
 </View>;
}
export default function Create(){
 const {s,colors}=useUi();const [clips,setClips]=useState<SlotClips>(emptyClips());const [asset,setAsset]=useState<ImagePicker.ImagePickerAsset|null>(null);const [notice,setNotice]=useState("");
 const chapter=chapterAt(new Date());const open=nextOpenSlot(clips[chapter.id]);const slot=open>=0?chapter.slots[open]:null;
 async function record(camera:boolean){try{
  if(open<0){setNotice(chapter.title+" is full. Remove a clip to re-record.");return;}
  if(camera){const permission=await ImagePicker.requestCameraPermissionsAsync();if(!permission.granted){setNotice("Camera permission is needed to record your POV.");return;}}
  const options:ImagePicker.ImagePickerOptions={mediaTypes:["videos"],allowsEditing:false,videoMaxDuration:CLIP_SECONDS};
  const result=camera?await ImagePicker.launchCameraAsync(options):await ImagePicker.launchImageLibraryAsync(options);
  if(!result.canceled){const a=result.assets[0];setAsset(a);setClips(c=>({...c,[chapter.id]:c[chapter.id].map((x,i)=>i===open?a.uri:x)}));setNotice("");}
 }catch(error){setNotice(error instanceof Error?error.message:"Could not open the video.");}}
 function remove(id:ChapterId,index:number){setClips(c=>({...c,[id]:c[id].map((x,i)=>i===index?null:x)}));}
 return <Screen demo={false} title="A day in the life, POV." subtitle={"Film "+CLIP_SECONDS+"-second POV moments through your day. They are stitched into My Day, My Evening and My Night."}>
 {!!notice&&<Notice text={notice} onClose={()=>setNotice("")}/>}
 <View style={s.panel}>
 <Text style={s.eyebrow}>{chapter.title.toUpperCase()} · HORARIO SUGERIDO {chapter.publishLabel}</Text>
 <Text style={s.h2}>{slot?slot.prompt:"All moments filmed"}</Text>
 <View style={s.row}><Button title={slot?"Record POV":"Chapter full"} onPress={()=>void record(true)}/>{Platform.OS==="web"?null:<Button secondary title="From library" onPress={()=>void record(false)}/>}</View>
 </View>
 {CHAPTERS.map(ch=><View key={ch.id} style={s.panel}>
 <Text style={s.eyebrow}>{ch.title.toUpperCase()}{ch.id==="night"?" · OPTIONAL":""} · Horario sugerido {ch.publishLabel}</Text>
 <View style={s.row}>{ch.slots.map((sl,i)=>{const filled=!!clips[ch.id][i];return <Pressable key={sl.label} accessibilityRole="button" accessibilityLabel={filled?"Remove "+sl.label+" clip":sl.label+" moment, empty"} onPress={()=>filled&&remove(ch.id,i)}
  style={{width:72,height:96,borderRadius:10,borderWidth:1,borderStyle:filled?"solid":"dashed",borderColor:colors.line,backgroundColor:filled?colors.ink:colors.accent,alignItems:"center",justifyContent:"center",gap:4}}>
  <Text style={{color:filled?colors.inverse:colors.muted,fontSize:11,fontWeight:"700"}}>{filled?"✓ "+CLIP_SECONDS+"s":sl.label}</Text>{filled&&<Text style={{color:colors.inverse,fontSize:10}}>{sl.label}</Text>}</Pressable>;})}</View>
 </View>)}
 <Text style={s.muted}>Toca un clip para retirarlo. Los clips permanecen locales hasta que envíes el resumen; no se publican automáticamente.</Text>
 {asset&&<Editor key={asset.uri} asset={asset}/>}
 <MyWorkMedia/>
 </Screen>;
}
