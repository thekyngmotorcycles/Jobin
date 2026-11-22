import {Ionicons} from "@expo/vector-icons";
import {router,Stack,useFocusEffect,useLocalSearchParams} from "expo-router";
import {useCallback,useRef,useState} from "react";
import {ActivityIndicator,Alert,Image,Pressable,Text,View} from "react-native";
import {SafeAreaView} from "react-native-safe-area-context";
import {PublicProfileAvatar} from "../../components/PublicProfileAvatar";
import {captureMessageScope,assertMessageScope,type MessageScope} from "../../lib/message-session";
import {deleteStory,loadActiveStories,type SocialStory} from "../../lib/social-content";
import {useTheme} from "../../state/ThemeProvider";
import {jobeenTokens} from "../../theme/jobeen";

export default function StoryViewer(){
 const {id}=useLocalSearchParams<{id:string}>();
 const {theme}=useTheme();const t=jobeenTokens(theme);
 const [stories,setStories]=useState<SocialStory[]>([]);
 const [index,setIndex]=useState(0);
 const [viewer,setViewer]=useState("");
 const [busy,setBusy]=useState(false);const [loading,setLoading]=useState(true);const [error,setError]=useState("");
 const scopeRef=useRef<MessageScope|null>(null),generation=useRef(0),removing=useRef(false);
 useFocusEffect(useCallback(()=>{
  const rev=++generation.current;scopeRef.current=null;setStories([]);setViewer("");setIndex(0);setLoading(true);
  let active=true;
  void(async()=>{
   try{
    const scope=await captureMessageScope(),uid=scope.owner;const all=await loadActiveStories(scope);await assertMessageScope(scope);
    const chosen=all.find(s=>s.id===id);
    const authorStories=all.filter(s=>s.authorId===chosen?.authorId).sort((a,b)=>a.createdAt.localeCompare(b.createdAt));
    if(active&&generation.current===rev){scopeRef.current=scope;setStories(authorStories);setIndex(Math.max(0,authorStories.findIndex(x=>x.id===id)));setViewer(uid);setError("");}
   }catch(e){if(active)setError(e instanceof Error?e.message:"No se pudo abrir la historia.");}
   finally{if(active)setLoading(false);}
  })();
  return()=>{active=false;generation.current++;scopeRef.current=null;setStories([]);setViewer("");};
 },[id]));
 const current=stories[index];
 function next(){if(index+1<stories.length)setIndex(i=>i+1);else router.back();}
 function prev(){if(index>0)setIndex(i=>i-1);}
 function remove(){
  const scope=scopeRef.current,rev=generation.current;
  if(!scope||!current||current.authorId!==scope.owner||removing.current)return;
  Alert.alert("Eliminar historia","¿Eliminar esta historia ahora?",[
   {text:"Cancelar",style:"cancel"},{text:"Eliminar",style:"destructive",onPress:()=>{void(async()=>{
    if(scopeRef.current!==scope||generation.current!==rev||removing.current)return;
    removing.current=true;setBusy(true);
    try{await captureMessageScope(scope);if(scopeRef.current!==scope||generation.current!==rev)return;
     await deleteStory(current.id,scope);await assertMessageScope(scope);if(scopeRef.current!==scope||generation.current!==rev)return;
     const remaining=stories.filter(x=>x.id!==current.id);if(!remaining.length)router.back();else{setStories(remaining);setIndex(i=>Math.min(i,remaining.length-1));}}
    catch(e){if(scopeRef.current===scope)setError(e instanceof Error?e.message:"No se pudo eliminar.");}
    finally{removing.current=false;if(scopeRef.current===scope)setBusy(false);}
   })();}}
  ]);
 }
 return <>
  <Stack.Screen options={{headerShown:false}}/>
  <SafeAreaView edges={["top","bottom"]} style={{flex:1,backgroundColor:t.bg}}>
   {loading?<ActivityIndicator color={t.yellow} style={{marginTop:60}}/>:current?<View style={{flex:1,paddingHorizontal:12,paddingBottom:14,gap:11}}>
    <View style={{flexDirection:"row",gap:4,paddingTop:8}}>
     {stories.map((s,i)=><View key={s.id} style={{height:3,flex:1,borderRadius:3,backgroundColor:i<=index?t.ink:t.line}}/>)}
    </View>
    <View style={{minHeight:48,flexDirection:"row",alignItems:"center",gap:9}}>
     <PublicProfileAvatar userId={current.authorId} name={current.authorName} size={39}/>
     <View style={{flex:1,gap:2}}>
      <Text style={{fontWeight:"800",color:t.ink}}>{current.authorName}</Text>
      <Text style={{fontSize:11,color:t.ink2}}>{index+1} de {stories.length} · Historia temporal</Text>
     </View>
     {viewer===current.authorId&&<Pressable accessibilityRole="button" accessibilityLabel="Eliminar mi historia" onPress={remove} style={{padding:10}}>
      <Ionicons name="trash-outline" size={20} color={t.ink}/>
     </Pressable>}
     <Pressable accessibilityRole="button" accessibilityLabel="Cerrar historia" onPress={()=>router.back()} style={{padding:10}}>
      <Ionicons name="close" size={25} color={t.ink}/>
     </Pressable>
    </View>
    <View style={{flex:1,borderRadius:23,overflow:"hidden",backgroundColor:current.kind==="text"?t.cream:t.ink,justifyContent:"center",alignItems:"center",padding:current.kind==="text"?22:0}}>
     {current.kind==="photo"?<>
      {current.imageUrl?<Image source={{uri:current.imageUrl}} resizeMode="contain" style={{width:"100%",height:"100%"}}/>:<Text style={{color:t.bg,padding:20}}>La fotografía ya no está disponible.</Text>}
      {!!current.body&&<View style={{position:"absolute",bottom:25,left:15,right:15,borderRadius:15,backgroundColor:t.videoViewsOverlay,padding:13}}>
       <Text style={{fontSize:16,color:t.videoViewsText,fontWeight:"600",textAlign:"center"}}>{current.body}</Text>
      </View>}
     </>:current.kind==="video"?<View style={{alignItems:"center",gap:20,padding:24}}>
      <Ionicons name="videocam-outline" size={48} color={t.bg}/>
      <Text style={{color:t.bg,fontSize:18,fontWeight:"700",textAlign:"center"}}>{current.body||"Video profesional aprobado"}</Text>
      <Pressable accessibilityRole="button" onPress={()=>router.push({pathname:"/work-media/[id]",params:{id:current.mediaId??""}})} style={{minHeight:52,borderRadius:17,paddingHorizontal:24,alignItems:"center",justifyContent:"center",backgroundColor:t.cream}}>
       <Text style={{color:t.ink,fontWeight:"800"}}>Reproducir video</Text>
      </Pressable>
     </View>:<Text style={{color:t.ink,fontSize:26,lineHeight:36,fontWeight:"700",textAlign:"center"}}>{current.body}</Text>}
    </View>
    <View style={{flexDirection:"row",gap:10}}>
     <Pressable accessibilityRole="button" accessibilityLabel="Historia anterior" disabled={index===0} onPress={prev}
      style={{flex:1,minHeight:49,borderWidth:1,borderColor:t.line,borderRadius:16,justifyContent:"center",alignItems:"center",opacity:index===0?0.4:1}}>
      <Text style={{color:t.ink,fontWeight:"700"}}>Anterior</Text>
     </Pressable>
     <Pressable accessibilityRole="button" accessibilityLabel={index+1<stories.length?"Siguiente historia":"Cerrar"} onPress={next}
      style={{flex:1,minHeight:49,borderRadius:16,backgroundColor:t.ink,justifyContent:"center",alignItems:"center"}}>
      <Text style={{color:t.bg,fontWeight:"700"}}>{index+1<stories.length?"Siguiente":"Terminar"}</Text>
     </Pressable>
    </View>
    {!!error&&<Text accessibilityLiveRegion="polite" style={{color:t.ink}}>{error}</Text>}
   </View>:<View style={{padding:26,gap:16}}>
    <Text style={{color:t.ink,fontWeight:"800",fontSize:19}}>Historia no disponible</Text>
    <Text style={{color:t.ink2}}>{error||"La historia pudo haber caducado o fue eliminada."}</Text>
    <Pressable accessibilityRole="button" onPress={()=>router.back()} style={{backgroundColor:t.cream,padding:16,borderRadius:15}}>
     <Text style={{color:t.ink,textAlign:"center"}}>Volver</Text>
    </Pressable>
   </View>}
  </SafeAreaView>
 </>;
}
