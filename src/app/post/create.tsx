import {Ionicons} from "@expo/vector-icons";
import {router,Stack,useLocalSearchParams} from "expo-router";
import * as ImagePicker from "expo-image-picker";
import {useEffect,useState} from "react";
import {ActivityIndicator,Image,Pressable,ScrollView,Text,TextInput,View} from "react-native";
import {SafeAreaView} from "react-native-safe-area-context";
import {PublicProfileAvatar} from "../../components/PublicProfileAvatar";
import {currentSocialUser,publishHomePost,shareApprovedMedia,type FeedPostKind} from "../../lib/social-content";
import type {PublishedMedia} from "../../lib/safety-api";
import {useTheme} from "../../state/ThemeProvider";
import {jobeenTokens} from "../../theme/jobeen";

const kinds=[
 {kind:"text",label:"Texto",icon:"create-outline"},
 {kind:"photos",label:"Foto",icon:"image-outline"},
 {kind:"video",label:"Video",icon:"videocam-outline"},
 {kind:"live",label:"Clip de Live",icon:"radio-outline"},
] as const;

export default function PostCreate(){
 const {kind:requested}=useLocalSearchParams<{kind?:string}>();
 const {theme}=useTheme();const t=jobeenTokens(theme);
 const [kind,setKind]=useState<FeedPostKind>(requested==="photo"?"photos":requested==="video"?"video":requested==="live"?"live":"text");
 const [author,setAuthor]=useState("");
 const [body,setBody]=useState("");
 const [photos,setPhotos]=useState<string[]>([]);
 const [media,setMedia]=useState<PublishedMedia[]>([]);
 const [mediaId,setMediaId]=useState("");
 const [consent,setConsent]=useState(false);
 const [busy,setBusy]=useState(false);const [loading,setLoading]=useState(true);const [error,setError]=useState("");
 useEffect(()=>{let active=true;void(async()=>{
  try{
   const uid=await currentSocialUser();
   if(!active)return;
   setAuthor(uid);
   const approved=await Promise.all([shareApprovedMedia("video",uid),shareApprovedMedia("live",uid)]);
   if(active)setMedia([...approved[0],...approved[1]]);
  }catch(e){if(active)setError(e instanceof Error?e.message:"No se pudo cargar la cuenta.");}
  finally{if(active)setLoading(false);}
 })();return()=>{active=false;};},[]);
 async function choosePhotos(){
  try{
   const result=await ImagePicker.launchImageLibraryAsync({mediaTypes:["images"],allowsMultipleSelection:true,selectionLimit:Math.max(1,5-photos.length),quality:0.8});
   if(!result.canceled){setPhotos(current=>[...current,...result.assets.map(x=>x.uri)].slice(0,5));setError("");}
  }catch(e){setError(e instanceof Error?e.message:"No se pudieron seleccionar fotos.");}
 }
 function switchKind(next:FeedPostKind){
  setKind(next);setError("");setMediaId("");
 }
 async function submit(){
  if(busy)return;
  if(!consent){setError("Confirmá que la publicación cumple las reglas de contenido profesional.");return;}
  setBusy(true);setError("");
  try{
   await publishHomePost({body,kind,photos:kind==="photos"?photos:[],mediaId:(kind==="video"||kind==="live")?mediaId:null});
   router.replace("/(tabs)/index");
  }catch(e){setError(e instanceof Error?e.message:"No se pudo publicar.");}
  finally{setBusy(false);}
 }
 const eligible=kind==="text"?!!body.trim():kind==="photos"?photos.length>0:!!mediaId;
 return <>
  <Stack.Screen options={{title:"Nueva publicación"}}/>
  <SafeAreaView edges={["bottom"]} style={{flex:1,backgroundColor:t.bg}}>
   <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{padding:18,paddingBottom:46,gap:17}}>
    <View style={{flexDirection:"row",alignItems:"center",gap:11}}>
     {!!author?<PublicProfileAvatar userId={author} name="Mi perfil" size={48}/>:<Ionicons name="person-circle-outline" size={45} color={t.ink}/>}
     <View style={{flex:1,gap:3}}>
      <Text accessibilityRole="header" style={{color:t.ink,fontWeight:"800",fontSize:19}}>Crear publicación</Text>
      <View style={{alignSelf:"flex-start",borderRadius:10,borderWidth:1,borderColor:t.line,paddingHorizontal:9,paddingVertical:4,flexDirection:"row",alignItems:"center",gap:5}}>
       <Ionicons name="globe-outline" size={13} color={t.ink2}/>
       <Text style={{color:t.ink2,fontSize:12}}>Público</Text>
      </View>
     </View>
    </View>
    <TextInput accessibilityLabel="Texto de la publicación" value={body} onChangeText={setBody} multiline textAlignVertical="top" maxLength={2000}
     placeholder="¿Qué quieres compartir de tu trabajo?" placeholderTextColor={t.ink2}
     style={{backgroundColor:t.surface,borderWidth:1,borderColor:t.line,borderRadius:19,padding:16,minHeight:150,color:t.ink,fontSize:17,lineHeight:25}}/>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{gap:8}}>
     {kinds.map(option=><Pressable key={option.kind} accessibilityRole="button" accessibilityState={{selected:kind===option.kind}} onPress={()=>switchKind(option.kind)}
      style={{flexDirection:"row",alignItems:"center",gap:7,paddingHorizontal:12,minHeight:45,borderRadius:18,borderWidth:1,borderColor:kind===option.kind?t.yellow:t.line,backgroundColor:kind===option.kind?t.cream:t.surface}}>
      <Ionicons name={option.icon} size={18} color={t.ink}/>
      <Text style={{color:t.ink,fontWeight:kind===option.kind?"700":"500",fontSize:13}}>{option.label}</Text>
     </Pressable>)}
    </ScrollView>
    {kind==="photos"&&<View style={{gap:12}}>
     <View style={{flexDirection:"row",justifyContent:"space-between",alignItems:"center"}}>
      <Text style={{color:t.ink,fontWeight:"700"}}>Fotografías ({photos.length}/5)</Text>
      <Pressable accessibilityRole="button" onPress={()=>void choosePhotos()} style={{padding:9,backgroundColor:t.cream,borderRadius:14,flexDirection:"row",gap:6}}>
       <Ionicons name="add" size={17} color={t.ink}/><Text style={{color:t.ink,fontWeight:"700"}}>Añadir</Text>
      </Pressable>
     </View>
     <View style={{flexDirection:"row",flexWrap:"wrap",gap:8}}>
      {photos.map((uri,i)=><View key={uri+"-"+i} style={{width:105,height:108,borderRadius:13,overflow:"hidden"}}>
       <Image source={{uri}} style={{width:105,height:108}} resizeMode="cover"/>
       <Pressable accessibilityRole="button" accessibilityLabel={"Quitar foto "+(i+1)} onPress={()=>setPhotos(current=>current.filter((_,j)=>j!==i))}
        style={{position:"absolute",top:5,right:5,padding:6,borderRadius:20,backgroundColor:t.surface}}>
        <Ionicons name="close" size={17} color={t.ink}/>
       </Pressable>
      </View>)}
      {!photos.length&&<Pressable accessibilityRole="button" onPress={()=>void choosePhotos()} style={{width:"100%",height:130,borderRadius:18,borderWidth:1,borderStyle:"dashed",borderColor:t.line,backgroundColor:t.cream,alignItems:"center",justifyContent:"center",gap:6}}>
       <Ionicons name="image-outline" color={t.ink} size={28}/>
       <Text style={{color:t.ink}}>Seleccionar fotos</Text>
      </Pressable>}
     </View>
    </View>}
    {(kind==="video"||kind==="live")&&<View style={{gap:10,borderRadius:18,backgroundColor:t.surface,borderWidth:1,borderColor:t.line,padding:15}}>
     <Text style={{color:t.ink,fontWeight:"800",fontSize:16}}>{kind==="video"?"Video publicado":"Live pasado"}</Text>
     <Text style={{color:t.ink2,fontSize:13,lineHeight:19}}>{kind==="video"?"Elegí uno de tus videos aprobados. Los archivos nuevos pasan primero por moderación.":"Compartí la vista previa de un Live publicado. Los recortes editables se incorporarán cuando el proveedor entregue grabaciones."}</Text>
     {media.filter(x=>x.kind===kind).map(x=><Pressable key={x.id} accessibilityRole="radio" accessibilityState={{checked:mediaId===x.id}} onPress={()=>setMediaId(x.id)}
      style={{minHeight:50,borderRadius:15,padding:10,flexDirection:"row",gap:10,alignItems:"center",backgroundColor:mediaId===x.id?t.cream:t.bg}}>
      <Ionicons name={mediaId===x.id?"radio-button-on":"radio-button-off"} size={22} color={t.ink}/>
      <Text numberOfLines={2} style={{color:t.ink,flex:1}}>{x.title}</Text>
     </Pressable>)}
     {!media.some(x=>x.kind===kind)&&<Text style={{color:t.ink2,fontSize:12}}>Todavía no tenés {kind==="video"?"videos":"Lives"} aprobados para compartir.</Text>}
     <Pressable accessibilityRole="button" onPress={()=>router.push(kind==="video"?"/create":"/live")} style={{minHeight:47,backgroundColor:t.cream,borderRadius:15,justifyContent:"center",alignItems:"center"}}>
      <Text style={{fontWeight:"700",color:t.ink}}>{kind==="video"?"Preparar video para revisión":"Solicitar Live"}</Text>
     </Pressable>
    </View>}
    <Pressable accessibilityRole="checkbox" accessibilityState={{checked:consent}} onPress={()=>setConsent(!consent)}
     style={{flexDirection:"row",alignItems:"center",gap:10,padding:12,borderWidth:1,borderColor:t.line,borderRadius:16,backgroundColor:t.surface}}>
     <Ionicons name={consent?"checkbox":"square-outline"} size={22} color={t.ink}/>
     <Text style={{flex:1,fontSize:12,lineHeight:18,color:t.ink2}}>Confirmo que el contenido es laboral o educativo y cumple las normas de Jobeen. No publicaré contenido privado de otras personas.</Text>
    </Pressable>
    {loading&&<ActivityIndicator color={t.yellow}/>}
    {!!error&&<Text accessibilityLiveRegion="polite" style={{color:t.ink,fontSize:13}}>{error}</Text>}
    <Pressable accessibilityRole="button" disabled={busy||!author||!eligible||!consent} onPress={()=>void submit()}
     style={({pressed})=>({minHeight:52,borderRadius:18,backgroundColor:t.ink,justifyContent:"center",alignItems:"center",opacity:busy||!author||!eligible||!consent?0.45:pressed?0.75:1})}>
     <Text style={{color:t.bg,fontWeight:"800"}}>{busy?"Publicando...":"Publicar"}</Text>
    </Pressable>
    <Pressable accessibilityRole="button" onPress={()=>router.back()} style={{minHeight:44,alignItems:"center",justifyContent:"center"}}><Text style={{color:t.ink2}}>Cancelar</Text></Pressable>
   </ScrollView>
   {busy&&<View accessibilityLiveRegion="polite" style={{position:"absolute",top:0,bottom:0,left:0,right:0,backgroundColor:"rgba(0,0,0,0.36)",alignItems:"center",justifyContent:"center"}}>
    <View style={{backgroundColor:t.surface,borderRadius:20,paddingHorizontal:32,paddingVertical:23,alignItems:"center",gap:13}}>
     <ActivityIndicator color={t.ink} size="large"/>
     <Text style={{color:t.ink,fontSize:15,fontWeight:"700"}}>Publicando...</Text>
    </View>
   </View>}
  </SafeAreaView>
 </>;
}
