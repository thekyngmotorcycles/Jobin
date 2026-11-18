import {Ionicons} from "@expo/vector-icons";
import {router,useFocusEffect} from "expo-router";
import {useCallback,useState} from "react";
import {ActivityIndicator,Alert,Image,Pressable,Text,View} from "react-native";
import {deleteHomePost,currentSocialUser,loadHomePosts,type FeedPost} from "../lib/social-content";
import {getSavedPostIds,setSavedPost} from "../lib/feed-preferences";
import {useTheme} from "../state/ThemeProvider";
import {jobeenTokens} from "../theme/jobeen";
import {useUi} from "./ui";
import {BottomSheet} from "./social-ui";

export function ProfileOwnedPosts(){
 const {theme}=useTheme();const t=jobeenTokens(theme);const {s}=useUi();
 const [tab,setTab]=useState<"mine"|"saved">("mine");
 const [mine,setMine]=useState<FeedPost[]>([]);
 const [saved,setSaved]=useState<FeedPost[]>([]);
 const [selected,setSelected]=useState<FeedPost|null>(null);
 const [loading,setLoading]=useState(true);
 const [owner,setOwner]=useState("");
 const [error,setError]=useState("");
 const reload=useCallback(()=>{
  let active=true;setLoading(true);
  void (async()=>{
   try{
    const viewer=await currentSocialUser();
    const ids=await getSavedPostIds(viewer);
    const [owned,savedPosts]=await Promise.all([
     loadHomePosts(viewer,viewer),
     ids.length?loadHomePosts(viewer,undefined,undefined,ids.slice(0,80)):Promise.resolve([] as FeedPost[])
    ]);
    if(active){setOwner(viewer);setMine(owned);setSaved(savedPosts);setError("");}
   }catch(e){if(active)setError(e instanceof Error?e.message:"No se pudieron cargar las publicaciones.");}
   finally{if(active)setLoading(false);}
  })();
  return()=>{active=false;};
 },[]);
 useFocusEffect(reload);
 function openPost(post:FeedPost){
  router.push({pathname:"/post/[id]",params:{id:post.id}});
 }
 function confirmDelete(post:FeedPost){
  setSelected(null);
  Alert.alert("Eliminar publicación","¿Quieres eliminar esta publicación de tu perfil y de Home? Esta acción no se puede deshacer.",[
   {text:"Cancelar",style:"cancel"},
   {text:"Eliminar",style:"destructive",onPress:()=>void remove(post)}
  ]);
 }
 async function remove(post:FeedPost){
  try{
   await deleteHomePost(post.id);
   setMine(posts=>posts.filter(x=>x.id!==post.id));
   setSaved(posts=>posts.filter(x=>x.id!==post.id));
   await setSavedPost(owner,post.id,false);
  }catch(e){Alert.alert("Eliminar publicación",e instanceof Error?e.message:"No se pudo eliminar la publicación.");}
 }
 async function unSave(post:FeedPost){
  try{await setSavedPost(owner,post.id,false);setSaved(posts=>posts.filter(x=>x.id!==post.id));setSelected(null);}
  catch(e){Alert.alert("Guardados",e instanceof Error?e.message:"No se pudo quitar de guardados.");}
 }
 const items=tab==="mine"?mine:saved;
 return <View style={{gap:12}}>
  <View style={{flexDirection:"row",alignItems:"center",justifyContent:"space-between",gap:10}}>
   <Text style={s.h3}>Publicaciones</Text>
   <View style={{flexDirection:"row",gap:6}}>
    {([{key:"mine",text:"Mías"},{key:"saved",text:"Guardadas"}] as const).map(option=>
     <Pressable key={option.key} accessibilityRole="button" accessibilityLabel={option.text}
      accessibilityState={{selected:tab===option.key}} onPress={()=>setTab(option.key)}
      style={{paddingHorizontal:11,minHeight:40,borderRadius:15,alignItems:"center",justifyContent:"center",backgroundColor:tab===option.key?t.cream:t.surface,borderWidth:1,borderColor:t.line}}>
      <Text style={[s.muted,{color:t.ink,fontWeight:tab===option.key?"700":"500"}]}>{option.text}</Text>
     </Pressable>
    )}
   </View>
  </View>
  {loading&&<ActivityIndicator color={t.ink}/>}
  {!!error&&<Text accessibilityLiveRegion="polite" style={s.muted}>{error}</Text>}
  {!loading&&!error&&!items.length&&<Text style={[s.muted,{paddingVertical:14}]}>{tab==="mine"?"Todavía no tienes publicaciones.":"Todavía no has guardado publicaciones."}</Text>}
  {!loading&&<View style={{flexDirection:"row",flexWrap:"wrap"}}>
   {items.map((post,index)=><View key={post.id} style={{width:"33.33%",padding:2}}>
    <Pressable accessibilityRole="button" accessibilityLabel={"Ver publicación: "+(post.body||post.kind)} onPress={()=>openPost(post)}
     style={{height:160,borderRadius:10,backgroundColor:[t.videoTile1,t.videoTile2,t.videoTile3][index%3],overflow:"hidden",alignItems:"center",justifyContent:"center"}}>
     {post.photoUrls[0]?<Image source={{uri:post.photoUrls[0]}} style={{height:"100%",width:"100%"}} resizeMode="cover"/>:
      <Ionicons name={post.kind==="text"?"document-text-outline":post.kind==="live"?"radio-outline":"play-circle-outline"} size={28} color={t.ink2}/>}
     {!post.photoUrls.length&&!!post.body&&<Text numberOfLines={3} style={[s.muted,{textAlign:"center",padding:8}]}>{post.body}</Text>}
    </Pressable>
    <Pressable accessibilityRole="button" accessibilityLabel={"Opciones de publicación "+(post.body||post.kind)} onPress={()=>setSelected(post)}
     style={{position:"absolute",right:7,top:7,width:42,height:42,borderRadius:21,alignItems:"center",justifyContent:"center",backgroundColor:t.surface}}>
     <Ionicons name="ellipsis-horizontal" size={20} color={t.ink}/>
    </Pressable>
   </View>)}
  </View>}
  <BottomSheet visible={!!selected} onClose={()=>setSelected(null)} title="Opciones de publicación">
   {!!selected&&<View style={{gap:5,paddingVertical:8}}>
    <Pressable accessibilityRole="button" onPress={()=>{const post=selected;setSelected(null);openPost(post);}}
     style={{minHeight:52,flexDirection:"row",alignItems:"center",gap:12,paddingHorizontal:12}}>
     <Ionicons name="eye-outline" size={22} color={t.ink}/><Text style={[s.text,{fontWeight:"600"}]}>Ver publicación</Text>
    </Pressable>
    {tab==="mine"?
     <Pressable accessibilityRole="button" onPress={()=>confirmDelete(selected)}
      style={{minHeight:52,flexDirection:"row",alignItems:"center",gap:12,paddingHorizontal:12}}>
      <Ionicons name="trash-outline" size={22} color={t.ink}/><Text style={[s.text,{fontWeight:"600"}]}>Eliminar publicación</Text>
     </Pressable>:
     <Pressable accessibilityRole="button" onPress={()=>void unSave(selected)}
      style={{minHeight:52,flexDirection:"row",alignItems:"center",gap:12,paddingHorizontal:12}}>
      <Ionicons name="bookmark-outline" size={22} color={t.ink}/><Text style={[s.text,{fontWeight:"600"}]}>Quitar de guardados</Text>
     </Pressable>}
   </View>}
  </BottomSheet>
 </View>;
}
