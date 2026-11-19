import AsyncStorage from "@react-native-async-storage/async-storage";
import {Ionicons} from "@expo/vector-icons";
import {router,useFocusEffect} from "expo-router";
import {usePreventRemove} from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import {VideoView,useVideoPlayer} from "expo-video";
import {useCallback,useEffect,useRef,useState} from "react";
import {ActivityIndicator,AppState,Pressable,ScrollView,Text,TextInput,View} from "react-native";
import {SafeAreaView} from "react-native-safe-area-context";
import {BottomSheet} from "./social-ui";
import {requireSupabase} from "../lib/supabase";
import {useTheme} from "../state/ThemeProvider";
import {jobeenTokens} from "../theme/jobeen";

type FlashDraft={title:string;videoUri:string;savedAt:number};
const key=(id:string)=>"jobeen.flash.draft.v1."+id;

function FlashPreview({uri}:{uri:string}){
 const player=useVideoPlayer(uri);
 return <VideoView player={player} style={{width:"100%",aspectRatio:9/14,borderRadius:18}} nativeControls contentFit="contain"/>;
}

/** Flash is a distinct local draft flow until server-side Flash moderation/publishing exists. */
export function FlashComposer(){
 const {theme}=useTheme();const t=jobeenTokens(theme);
 const [userId,setUserId]=useState("");
 const [title,setTitle]=useState("");
 const [uri,setUri]=useState("");
 const [savedAt,setSavedAt]=useState<number|null>(null);
 const [loading,setLoading]=useState(true);
 const [busy,setBusy]=useState(false);
 const [notice,setNotice]=useState("");
 const [exitOpen,setExitOpen]=useState(false);
 const [exitAllowed,setExitAllowed]=useState(false);
 const [goHome,setGoHome]=useState(false);
 const suppressAutosave=useRef(false);
 const snapshotRef=useRef({title:"",uri:""});
 snapshotRef.current={title,uri};
 async function persist(){
  if(!userId||loading||suppressAutosave.current)return;
  const value=snapshotRef.current;
  if(!value.uri&&!value.title.trim())return;
  const saved=Date.now();
  await AsyncStorage.setItem(key(userId),JSON.stringify({...value,savedAt:saved} satisfies FlashDraft));
  setSavedAt(saved);
 }
 function home(){suppressAutosave.current=true;setExitOpen(false);setExitAllowed(true);setGoHome(true);}
 function requestExit(){
  if(snapshotRef.current.uri||snapshotRef.current.title.trim())setExitOpen(true);
  else home();
 }
 usePreventRemove(!exitAllowed,()=>requestExit());
 useEffect(()=>{if(goHome)router.replace("/(tabs)/index");},[goHome]);
 useEffect(()=>{
  if(!userId||loading||(!title.trim()&&!uri)||suppressAutosave.current)return;
  const timer=setTimeout(()=>{void persist().catch(()=>{});},180);
  return()=>clearTimeout(timer);
 },[title,uri,userId,loading]);
 useEffect(()=>{
  const sub=AppState.addEventListener("change",status=>{if(status!=="active")void persist().catch(()=>{});});
  return()=>{sub.remove();void persist().catch(()=>{});};
 },[userId,loading]);
 async function discardAndExit(){
  suppressAutosave.current=true;
  try{if(userId)await AsyncStorage.removeItem(key(userId));home();}
  catch(e){suppressAutosave.current=false;setNotice(e instanceof Error?e.message:"No se pudo descartar el borrador.");setExitOpen(false);}
 }
 useFocusEffect(useCallback(()=>{
  let active=true;setLoading(true);
  void(async()=>{
   try{
    const {data:{user}}=await requireSupabase().auth.getUser();
    if(!user)throw Error("Inicia sesión para crear contenido.");
    const raw=await AsyncStorage.getItem(key(user.id));
    if(!active)return;
    setUserId(user.id);
    if(raw){
     const draft=JSON.parse(raw) as FlashDraft;
     if(typeof draft.videoUri==="string"&&typeof draft.title==="string"){
      setUri(draft.videoUri);setTitle(draft.title);setSavedAt(draft.savedAt);
     }
    }
   }catch(e){if(active)setNotice(e instanceof Error?e.message:"No se pudo cargar el borrador.");}
   finally{if(active)setLoading(false);}
  })();
  return()=>{active=false;};
 },[]));
 async function pick(camera:boolean){
  try{
   if(camera){
    const permission=await ImagePicker.requestCameraPermissionsAsync();
    if(!permission.granted){setNotice("Autoriza el acceso a la cámara para grabar.");return;}
   }
   const opts:ImagePicker.ImagePickerOptions={mediaTypes:["videos"],allowsEditing:false};
   const result=camera?await ImagePicker.launchCameraAsync(opts):await ImagePicker.launchImageLibraryAsync(opts);
   if(!result.canceled&&result.assets[0]){setUri(result.assets[0].uri);setSavedAt(null);setNotice("");}
  }catch(e){setNotice(e instanceof Error?e.message:"No se pudo abrir el video.");}
 }
 async function save(){
  if(!userId||!uri||!title.trim()||busy){
   setNotice("Selecciona un video y escribe un título antes de guardar.");return;
  }
  setBusy(true);
  try{
   const saved=Date.now();
   await AsyncStorage.setItem(key(userId),JSON.stringify({title:title.trim(),videoUri:uri,savedAt:saved} satisfies FlashDraft));
   setSavedAt(saved);setNotice("Borrador guardado en este dispositivo. Todavía no se ha publicado.");
  }catch(e){setNotice(e instanceof Error?e.message:"No se pudo guardar el borrador.");}
  finally{setBusy(false);}
 }
 return <SafeAreaView edges={["top","left","right"]} style={{flex:1,backgroundColor:t.bg}}>
  <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{padding:18,paddingBottom:60,gap:18}} showsVerticalScrollIndicator={false}>
   <View style={{flexDirection:"row",alignItems:"center",gap:12}}>
    <Pressable accessibilityRole="button" accessibilityLabel="Volver" onPress={requestExit} style={{minHeight:48,minWidth:48,alignItems:"center",justifyContent:"center"}}>
     <Ionicons name="arrow-back" size={24} color={t.ink}/>
    </Pressable>
    <View style={{flex:1,gap:2}}><Text accessibilityRole="header" style={{fontSize:22,fontWeight:"800",color:t.ink}}>Crear Flash</Text>
     <Text style={{fontSize:13,color:t.ink2}}>Video corto de contenido profesional</Text>
    </View>
   </View>
   {loading?<ActivityIndicator color={t.yellow}/>:<>
    <View style={{gap:10}}>
     <View style={{flexDirection:"row",gap:10}}>
      <Pressable accessibilityRole="button" onPress={()=>void pick(true)} style={{flex:1,minHeight:50,flexDirection:"row",alignItems:"center",justifyContent:"center",gap:8,borderRadius:18,backgroundColor:t.ink}}>
       <Ionicons name="videocam-outline" size={20} color={t.bg}/><Text style={{color:t.bg,fontWeight:"700"}}>Grabar</Text>
      </Pressable>
      <Pressable accessibilityRole="button" onPress={()=>void pick(false)} style={{flex:1,minHeight:50,flexDirection:"row",alignItems:"center",justifyContent:"center",gap:8,borderRadius:18,borderWidth:1,borderColor:t.line,backgroundColor:t.surface}}>
       <Ionicons name="images-outline" size={20} color={t.ink}/><Text style={{color:t.ink,fontWeight:"700"}}>Galería</Text>
      </Pressable>
     </View>
     {uri?<FlashPreview key={uri} uri={uri}/>:<View style={{height:205,borderRadius:20,borderWidth:1,borderColor:t.line,backgroundColor:t.cream,alignItems:"center",justifyContent:"center",gap:8}}>
      <Ionicons name="flash-outline" size={42} color={t.ink}/><Text style={{color:t.ink2}}>Selecciona o graba tu Flash</Text>
     </View>}
    </View>
    <View style={{gap:8}}>
     <Text style={{color:t.ink,fontWeight:"700"}}>Título</Text>
     <TextInput accessibilityLabel="Título de Flash" value={title} onChangeText={setTitle} placeholder="¿Qué estás mostrando de tu trabajo?" placeholderTextColor={t.ink2} maxLength={100}
      style={{color:t.ink,backgroundColor:t.surface,minHeight:50,borderWidth:1,borderColor:t.line,borderRadius:16,paddingHorizontal:14}}/>
    </View>
    <View style={{backgroundColor:t.cream,borderRadius:18,padding:14,gap:6}}>
     <Text style={{color:t.ink,fontWeight:"800"}}>Flash en preparación</Text>
     <Text style={{color:t.ink2,fontSize:13,lineHeight:20}}>El formato Flash necesita su propia duración máxima, clasificación y moderación del servidor. Por ahora puedes preparar y guardar un borrador local, pero no publicarlo. No se enviará como un video normal.</Text>
    </View>
    {!!savedAt&&<Text style={{color:t.ink2,fontSize:12}}>Borrador local guardado: {new Date(savedAt).toLocaleString("es")}</Text>}
    {!!notice&&<Text accessibilityLiveRegion="polite" style={{fontSize:13,color:t.ink}}>{notice}</Text>}
    <Pressable accessibilityRole="button" accessibilityLabel="Guardar borrador Flash" disabled={busy||!userId} onPress={()=>void save()} style={({pressed})=>({minHeight:50,borderRadius:18,backgroundColor:t.ink,alignItems:"center",justifyContent:"center",opacity:busy||!userId?0.4:pressed?0.7:1})}>
     <Text style={{color:t.bg,fontWeight:"700"}}>{busy?"Guardando...":"Guardar borrador"}</Text>
    </Pressable>
    <Text style={{color:t.ink2,fontSize:12,lineHeight:18}}>Los archivos seleccionados pueden dejar de estar disponibles si el sistema elimina sus copias temporales. Los borradores no se sincronizan entre dispositivos.</Text>
   </>}
  </ScrollView>
 <BottomSheet visible={exitOpen} onClose={()=>setExitOpen(false)} title="¿Qué deseas hacer con tu Flash?">
  <View style={{gap:11,paddingTop:9}}>
   <Text style={{color:t.ink2,fontSize:13}}>Tu video aún no se ha publicado. Puedes conservar un borrador local o descartarlo.</Text>
   <Pressable accessibilityRole="button" onPress={()=>void persist().then(home).catch(e=>setNotice(String(e)))}
    style={{backgroundColor:t.ink,minHeight:50,borderRadius:15,alignItems:"center",justifyContent:"center"}}>
    <Text style={{color:t.surface,fontWeight:"700"}}>Guardar borrador</Text>
   </Pressable>
   <Pressable accessibilityRole="button" onPress={()=>void discardAndExit()}
    style={{backgroundColor:t.cream,minHeight:50,borderRadius:15,alignItems:"center",justifyContent:"center"}}>
    <Text style={{color:t.ink,fontWeight:"700"}}>Descartar cambios</Text>
   </Pressable>
   <Pressable accessibilityRole="button" onPress={()=>setExitOpen(false)} style={{minHeight:44,alignItems:"center",justifyContent:"center"}}>
    <Text style={{color:t.ink2,fontWeight:"600"}}>Continuar editando</Text>
   </Pressable>
  </View>
 </BottomSheet>
 </SafeAreaView>;
}
