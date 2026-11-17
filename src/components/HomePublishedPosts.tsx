import {Ionicons} from "@expo/vector-icons";
import {router,useFocusEffect} from "expo-router";
import * as Linking from "expo-linking";
import {useCallback,useState} from "react";
import {ActivityIndicator,Alert,Image,Pressable,ScrollView,Share,Text,View,useWindowDimensions} from "react-native";
import {PublicProfileAvatar} from "./PublicProfileAvatar";
import {currentSocialUser,deleteHomePost,loadHomePosts,type FeedPost} from "../lib/social-content";
import {useTheme} from "../state/ThemeProvider";
import {jobeenTokens} from "../theme/jobeen";

export function HomePublishedPosts(){
 const {theme}=useTheme();const t=jobeenTokens(theme);
 const [posts,setPosts]=useState<FeedPost[]>([]);
 const [viewer,setViewer]=useState("");
 const [loading,setLoading]=useState(true);
 const [error,setError]=useState("");
 const {width}=useWindowDimensions();
 const cardWidth=Math.min(Math.max(250,width-32),900);
 const reload=useCallback(()=>{
  let active=true;setLoading(true);
  void(async()=>{
   try{
    const [loaded,user]=await Promise.all([loadHomePosts(),currentSocialUser().catch(()=>"")]);
    if(active){setPosts(loaded);setViewer(user);setError("");}
   }catch(e){if(active)setError(e instanceof Error?e.message:"No se pudieron cargar las publicaciones.");}
   finally{if(active)setLoading(false);}
  })();
  return()=>{active=false;};
 },[]);
 useFocusEffect(reload);
 async function remove(post:FeedPost){
  try{await deleteHomePost(post.id);setPosts(items=>items.filter(x=>x.id!==post.id));}
  catch(e){setError(e instanceof Error?e.message:"No se pudo eliminar la publicación.");}
 }
 async function share(post:FeedPost){
  try{await Share.share({message:post.authorName+": "+post.body+(post.mediaId?"\nVideo profesional en Jobeen":"")});}
  catch(e){setError(e instanceof Error?e.message:"No se pudo compartir.");}
 }
 if(!posts.length&&!loading&&!error)return null;
 return <View style={{gap:14}}>
  <View style={{paddingHorizontal:16,flexDirection:"row",alignItems:"center",justifyContent:"space-between"}}>
   <Text style={{color:t.ink,fontSize:18,fontWeight:"800"}}>Publicaciones recientes</Text>
   <Pressable accessibilityRole="button" onPress={()=>{reload();}} style={{padding:8}}>
    <Ionicons name="refresh-outline" size={20} color={t.ink}/>
   </Pressable>
  </View>
  {loading&&<ActivityIndicator color={t.yellow}/>}
  {!!error&&<Text accessibilityLiveRegion="polite" style={{color:t.ink2,paddingHorizontal:16}}>{error}</Text>}
  {posts.map(post=>{
   const url=post.body.match(/https?:\/\/[^\s]+/i)?.[0];
   return <View key={post.id} style={{backgroundColor:t.surface,borderTopWidth:1,borderBottomWidth:1,borderColor:t.line,paddingVertical:13,gap:11}}>
    <View style={{paddingHorizontal:16,flexDirection:"row",alignItems:"center",gap:10}}>
     <PublicProfileAvatar userId={post.authorId} name={post.authorName} size={43}/>
     <Pressable accessibilityRole="button" accessibilityLabel={"Ver perfil de "+post.authorName} onPress={()=>router.push({pathname:"/jcard",params:{user:post.authorId}})} style={{flex:1,gap:2}}>
      <Text style={{fontSize:14,color:t.ink,fontWeight:"800"}}>{post.authorName}</Text>
      <Text style={{fontSize:11,color:t.ink2}}>{post.authorHandle?"@"+post.authorHandle+" · ":""}{new Date(post.createdAt).toLocaleDateString("es")}</Text>
     </Pressable>
     {viewer===post.authorId&&<Pressable accessibilityRole="button" accessibilityLabel="Eliminar mi publicación"
       onPress={()=>Alert.alert("Eliminar publicación","¿Quitar esta publicación del feed?",[{text:"Cancelar",style:"cancel"},{text:"Eliminar",style:"destructive",onPress:()=>void remove(post)}])} style={{padding:8}}>
      <Ionicons name="ellipsis-horizontal" size={23} color={t.ink}/>
     </Pressable>}
    </View>
    {!!post.body&&<Text style={{paddingHorizontal:16,color:t.ink,fontSize:15,lineHeight:23}}>{post.body}</Text>}
    {!!url&&<Pressable accessibilityRole="link" accessibilityLabel="Abrir enlace compartido" onPress={()=>void Linking.openURL(url)}>
     <Text numberOfLines={1} style={{paddingHorizontal:16,color:t.ink2,textDecorationLine:"underline",fontSize:12}}>{url}</Text>
    </Pressable>}
    {post.kind==="photos"&&<ScrollView horizontal showsHorizontalScrollIndicator={false} pagingEnabled contentContainerStyle={{gap:4}}>
     {post.photoUrls.map((uri,i)=><Image key={uri+i} source={{uri}} accessibilityLabel={"Foto "+(i+1)+" de "+post.authorName} resizeMode="cover"
      style={{width:cardWidth,aspectRatio:1.18,backgroundColor:t.cream}}/>)}
    </ScrollView>}
    {(post.kind==="video"||post.kind==="live")&&<Pressable accessibilityRole="button" accessibilityLabel="Ver contenido profesional aprobado"
      onPress={()=>post.mediaId&&router.push({pathname:"/work-media/[id]",params:{id:post.mediaId}})}
      style={{marginHorizontal:16,minHeight:155,borderRadius:18,backgroundColor:t.cream,alignItems:"center",justifyContent:"center",gap:9}}>
      <Ionicons name={post.kind==="live"?"radio-outline":"play-circle-outline"} size={44} color={t.ink}/>
      <Text style={{color:t.ink,fontWeight:"700"}}>{post.kind==="live"?"Ver grabación de Live":"Ver video aprobado"}</Text>
     </Pressable>}
    <View style={{flexDirection:"row",alignItems:"center",gap:20,paddingHorizontal:17}}>
     <Pressable accessibilityRole="button" onPress={()=>void share(post)} style={{minHeight:42,flexDirection:"row",alignItems:"center",gap:7}}>
      <Ionicons name="share-outline" size={20} color={t.ink}/>
      <Text style={{color:t.ink2,fontSize:13}}>Compartir</Text>
     </Pressable>
     <Pressable accessibilityRole="button" onPress={()=>router.push({pathname:"/jcard",params:{user:post.authorId}})} style={{minHeight:42,flexDirection:"row",alignItems:"center",gap:7}}>
      <Ionicons name="person-outline" size={19} color={t.ink}/>
      <Text style={{color:t.ink2,fontSize:13}}>JCard</Text>
     </Pressable>
    </View>
   </View>;
  })}
 </View>;
}
