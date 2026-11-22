import {Ionicons} from "@expo/vector-icons";
import {router,Stack,useLocalSearchParams} from "expo-router";
import * as ImagePicker from "expo-image-picker";
import {useEffect,useRef,useState} from "react";
import {ActivityIndicator,Alert,Image,Pressable,ScrollView,Text,TextInput,View} from "react-native";
import {SafeAreaView} from "react-native-safe-area-context";
import {captureMessageScope,assertMessageScope,type MessageScope} from "../../lib/message-session";
import {publishStory,shareApprovedMedia,type StoryKind} from "../../lib/social-content";
import type {PublishedMedia} from "../../lib/safety-api";
import {useTheme} from "../../state/ThemeProvider";
import {jobeenTokens} from "../../theme/jobeen";

const modes=[{id:"text",label:"Texto",icon:"text-outline"},{id:"photo",label:"Foto",icon:"image-outline"},{id:"video",label:"Video",icon:"videocam-outline"}] as const;
export default function StoryCreate(){
 const params=useLocalSearchParams<{kind?:string}>();
 const {theme}=useTheme();const t=jobeenTokens(theme);
 const [kind,setKind]=useState<StoryKind>(params.kind==="photo"?"photo":params.kind==="video"?"video":"text");
 const [userId,setUserId]=useState("");
 const [caption,setCaption]=useState("");
 const [photoUri,setPhotoUri]=useState("");
 const [videos,setVideos]=useState<PublishedMedia[]>([]);
 const [mediaId,setMediaId]=useState("");
 const [consent,setConsent]=useState(false);
 const [loading,setLoading]=useState(true);const [busy,setBusy]=useState(false);const [error,setError]=useState("");
 const scopeRef=useRef<MessageScope|null>(null),submitting=useRef(false),picking=useRef(false);
 useEffect(()=>{let live=true;void(async()=>{
  try{const scope=await captureMessageScope(),owner=scope.owner;const published=await shareApprovedMedia("video",owner);await assertMessageScope(scope);if(live){scopeRef.current=scope;setUserId(owner);setVideos(published);}}
  catch(e){if(live)setError(e instanceof Error?e.message:"No se pudo cargar el editor.");}
  finally{if(live)setLoading(false);}
 })();return()=>{live=false;scopeRef.current=null;};},[]);
 async function choosePhoto(){
  const scope=scopeRef.current;if(!scope||submitting.current||picking.current)return;
  picking.current=true;
  try{await captureMessageScope(scope);if(scopeRef.current!==scope)return;
   const result=await ImagePicker.launchImageLibraryAsync({mediaTypes:["images"],quality:0.85});
   await assertMessageScope(scope);if(scopeRef.current!==scope)return;
   if(!result.canceled&&result.assets[0]){setPhotoUri(result.assets[0].uri);setError("");}
  }catch(e){if(scopeRef.current===scope)setError(e instanceof Error?e.message:"No se pudo abrir la galería.");}
  finally{picking.current=false;}
 }
 async function submit(scope:MessageScope){
  if(scopeRef.current!==scope||scope.owner!==userId||submitting.current||!consent)return;
  submitting.current=true;setBusy(true);setError("");
  try{
   await captureMessageScope(scope);if(scopeRef.current!==scope)return;
   await publishStory({kind,body:caption,photoUri:kind==="photo"?photoUri:undefined,mediaId:kind==="video"?mediaId:null},scope);
   await assertMessageScope(scope);if(scopeRef.current===scope)router.back();
  }catch(e){if(scopeRef.current===scope)setError(e instanceof Error?e.message:"No se pudo compartir la historia.");}
  finally{submitting.current=false;if(scopeRef.current===scope)setBusy(false);}
 }
 const ready=kind==="text"?!!caption.trim():kind==="photo"?!!photoUri:!!mediaId;
 return <>
  <Stack.Screen options={{title:"Crear historia"}}/>
  <SafeAreaView edges={["bottom"]} style={{flex:1,backgroundColor:t.bg}}>
   <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={{padding:18,paddingBottom:50,gap:17}}>
    <View style={{gap:6}}>
     <Text accessibilityRole="header" style={{color:t.ink,fontSize:23,fontWeight:"800"}}>Tu historia</Text>
     <Text style={{color:t.ink2,fontSize:13,lineHeight:19}}>Comparte un momento de tu trabajo. Las historias desaparecen después de 24 horas.</Text>
    </View>
    <View style={{flexDirection:"row",gap:9}}>
     {modes.map(m=><Pressable key={m.id} accessibilityRole="button" accessibilityState={{selected:m.id===kind}} onPress={()=>{setKind(m.id);setError("");}}
      style={{flex:1,flexDirection:"row",justifyContent:"center",alignItems:"center",gap:6,minHeight:46,borderRadius:17,backgroundColor:kind===m.id?t.cream:t.surface,borderColor:kind===m.id?t.yellow:t.line,borderWidth:1}}>
      <Ionicons name={m.icon} size={17} color={t.ink}/><Text style={{fontSize:13,color:t.ink,fontWeight:"700"}}>{m.label}</Text>
     </Pressable>)}
    </View>
    {kind==="text"&&<View style={{aspectRatio:9/12,borderRadius:25,backgroundColor:t.cream,padding:24,justifyContent:"center"}}>
     <TextInput accessibilityLabel="Texto de tu historia" value={caption} onChangeText={setCaption} placeholder="Una idea de tu día profesional..." placeholderTextColor={t.ink2} multiline maxLength={280}
      textAlign="center" style={{fontSize:24,fontWeight:"700",lineHeight:32,color:t.ink,maxHeight:310}}/>
    </View>}
    {kind==="photo"&&<View style={{gap:12}}>
     <Pressable accessibilityRole="button" accessibilityLabel="Seleccionar fotografía de la historia" onPress={()=>void choosePhoto()}
      style={{aspectRatio:9/11,borderRadius:23,overflow:"hidden",backgroundColor:t.cream,alignItems:"center",justifyContent:"center",gap:10}}>
      {photoUri?<Image source={{uri:photoUri}} resizeMode="cover" style={{height:"100%",width:"100%"}}/>:<><Ionicons name="camera-outline" size={45} color={t.ink}/><Text style={{fontWeight:"700",color:t.ink}}>Seleccionar foto</Text></>}
     </Pressable>
     <TextInput accessibilityLabel="Texto de la foto" value={caption} onChangeText={setCaption} maxLength={280} placeholder="Añadir texto a la historia" placeholderTextColor={t.ink2}
      style={{minHeight:50,borderRadius:16,borderColor:t.line,borderWidth:1,padding:14,backgroundColor:t.surface,color:t.ink}}/>
    </View>}
    {kind==="video"&&<View style={{backgroundColor:t.surface,borderRadius:22,borderWidth:1,borderColor:t.line,padding:16,gap:12}}>
     <Ionicons name="videocam-outline" size={32} color={t.ink}/>
     <Text style={{color:t.ink,fontWeight:"800",fontSize:16}}>Elegir video aprobado</Text>
     <Text style={{color:t.ink2,fontSize:13,lineHeight:20}}>Las historias de video utilizan tus videos profesionales que ya superaron moderación. No se puede publicar un archivo sin revisar.</Text>
     {videos.map(video=><Pressable key={video.id} accessibilityRole="radio" accessibilityState={{checked:mediaId===video.id}} onPress={()=>setMediaId(video.id)}
      style={{minHeight:50,borderRadius:15,backgroundColor:mediaId===video.id?t.cream:t.bg,padding:11,flexDirection:"row",alignItems:"center",gap:10}}>
      <Ionicons name={mediaId===video.id?"radio-button-on":"radio-button-off"} size={21} color={t.ink}/>
      <Text style={{color:t.ink,flex:1}}>{video.title}</Text>
     </Pressable>)}
     {!videos.length&&<Text style={{color:t.ink2,fontSize:12}}>No hay videos aprobados todavía.</Text>}
     <Pressable accessibilityRole="button" onPress={()=>router.push("/create")} style={{minHeight:46,borderRadius:16,alignItems:"center",justifyContent:"center",backgroundColor:t.cream}}>
      <Text style={{color:t.ink,fontWeight:"700"}}>Enviar video a revisión</Text>
     </Pressable>
    </View>}
    <Pressable accessibilityRole="checkbox" accessibilityState={{checked:consent}} onPress={()=>setConsent(!consent)} style={{backgroundColor:t.surface,borderWidth:1,borderColor:t.line,borderRadius:15,padding:12,flexDirection:"row",alignItems:"center",gap:9}}>
     <Ionicons name={consent?"checkbox":"square-outline"} size={23} color={t.ink}/>
     <Text style={{color:t.ink2,fontSize:12,lineHeight:18,flex:1}}>Este contenido está relacionado con trabajo o educación y cumple las normas de Jobeen.</Text>
    </Pressable>
    {loading&&<ActivityIndicator color={t.yellow}/>}
    {!!error&&<Text accessibilityLiveRegion="polite" style={{color:t.ink,fontSize:13}}>{error}</Text>}
    <Pressable accessibilityRole="button" disabled={busy||!userId||!ready||!consent}
     onPress={()=>{const scope=scopeRef.current;if(scope)Alert.alert("Publicar historia","Tu historia será visible durante 24 horas en Casa y Mensajes.",[{text:"Cancelar",style:"cancel"},{text:"Publicar",onPress:()=>void submit(scope)}]);}}
     style={({pressed})=>({minHeight:53,borderRadius:18,backgroundColor:t.ink,justifyContent:"center",alignItems:"center",opacity:busy||!userId||!ready||!consent?0.45:pressed?0.72:1})}>
     <Text style={{fontWeight:"800",color:t.bg}}>{busy?"Publicando...":"Compartir historia"}</Text>
    </Pressable>
   </ScrollView>
  </SafeAreaView>
 </>;
}
