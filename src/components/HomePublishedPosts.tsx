import {Ionicons} from "@expo/vector-icons";
import {router,useFocusEffect} from "expo-router";
import * as Linking from "expo-linking";
import {useCallback,useState} from "react";
import {ActivityIndicator,Alert,FlatList,Image,Pressable,Share,Text,TextInput,View,useWindowDimensions} from "react-native";
import {BottomSheet} from "./social-ui";
import {PublicProfileAvatar} from "./PublicProfileAvatar";
import {addHomePostComment,currentSocialUser,deleteHomePost,loadHomePostComments,loadHomePosts,recordHomePostShare,setHomePostLike,type FeedPost,type HomePostComment} from "../lib/social-content";
import {formatCount} from "../lib/feed";
import {useTheme} from "../state/ThemeProvider";
import {jobeenTokens} from "../theme/jobeen";

function PublishedPhotos({post}:{post:FeedPost}){
 const {theme}=useTheme();const t=jobeenTokens(theme);
 const {width}=useWindowDimensions();const [index,setIndex]=useState(0);
 const size=Math.min(width,900);const total=post.photoUrls.length;
 return <View style={{alignSelf:"center",width:"100%",maxWidth:900}}>
  <FlatList horizontal pagingEnabled showsHorizontalScrollIndicator={false} data={post.photoUrls}
   keyExtractor={(uri,i)=>uri+"-"+i}
   onMomentumScrollEnd={e=>setIndex(Math.max(0,Math.min(total-1,Math.round(e.nativeEvent.contentOffset.x/size))))}
   renderItem={({item,i})=><Image source={{uri:item}} accessibilityLabel={"Foto "+(i+1)+" de "+post.authorName}
    resizeMode="cover" style={{width:size,aspectRatio:1.1,backgroundColor:t.cream}}/>}
  />
  {total>1&&<>
   <View pointerEvents="none" style={{position:"absolute",right:14,top:13,backgroundColor:"rgba(0,0,0,0.64)",paddingHorizontal:11,paddingVertical:5,borderRadius:13}}>
    <Text style={{color:"#FFFFFF",fontSize:12,fontWeight:"700"}}>{index+1+" / "+total}</Text>
   </View>
   <View style={{flexDirection:"row",justifyContent:"center",gap:6,paddingVertical:9}}>
    {post.photoUrls.map((_,i)=><View key={i} style={{width:i===index?7:6,height:i===index?7:6,borderRadius:7,backgroundColor:i===index?t.ink:t.line}}/>)}
   </View>
  </>}
 </View>;
}

function HomePostCard({post,viewer,onRemove}:{post:FeedPost;viewer:string;onRemove:(post:FeedPost)=>Promise<void>}){
 const {theme}=useTheme();const t=jobeenTokens(theme);
 const [liked,setLiked]=useState(post.likedByViewer);
 const [likes,setLikes]=useState(post.likes);
 const [commentsCount,setCommentsCount]=useState(post.comments);
 const [shares,setShares]=useState(post.shares);
 const [pending,setPending]=useState(false);
 const [error,setError]=useState("");
 const [commentsOpen,setCommentsOpen]=useState(false);
 const [commentsLoading,setCommentsLoading]=useState(false);
 const [comments,setComments]=useState<HomePostComment[]>([]);
 const [draft,setDraft]=useState("");
 const [sending,setSending]=useState(false);
 const media=post.kind==="photos"||post.kind==="video"||post.kind==="live";
 async function toggleLike(){
  if(pending)return;setPending(true);setError("");
  try{await setHomePostLike(post.id,!liked);setLiked(!liked);setLikes(count=>Math.max(0,count+(liked?-1:1)));}
  catch(e){setError(e instanceof Error?e.message:"No se pudo registrar Me gusta.");}
  finally{setPending(false);}
 }
 async function share(){
  try{
   const result=await Share.share({message:post.authorName+": "+post.body+(post.kind==="video"?" · Video profesional en Jobeen":"")});
   if(result.action===Share.sharedAction){
    await recordHomePostShare(post.id);
    setShares(n=>n+1);
   }
  }catch(e){setError(e instanceof Error?e.message:"No se pudo compartir.");}
 }
 async function openComments(){
  setCommentsOpen(true);setCommentsLoading(true);setError("");
  try{setComments(await loadHomePostComments(post.id));}
  catch(e){setError(e instanceof Error?e.message:"No se pudieron cargar los comentarios.");}
  finally{setCommentsLoading(false);}
 }
 async function sendComment(){
  if(!draft.trim()||sending)return;
  setSending(true);setError("");
  try{
   const next=await addHomePostComment(post.id,draft);
   setComments(items=>[...items,next]);setCommentsCount(n=>n+1);setDraft("");
  }catch(e){setError(e instanceof Error?e.message:"No se pudo enviar el comentario.");}
  finally{setSending(false);}
 }
 const profile=()=>router.push({pathname:"/jcard",params:{user:post.authorId}});
 const link=post.body.match(/https?:\/\/[^\s]+/i)?.[0];
 const authorRow=<View style={{paddingHorizontal:16,flexDirection:"row",alignItems:"center",gap:10,paddingVertical:5}}>
  <Pressable accessibilityRole="button" accessibilityLabel={"Ver perfil de "+post.authorName} onPress={profile}>
   <PublicProfileAvatar userId={post.authorId} name={post.authorName} size={43}/>
  </Pressable>
  <Pressable accessibilityRole="button" accessibilityLabel={"Ver perfil de "+post.authorName} onPress={profile} style={{flex:1,gap:2}}>
   <Text numberOfLines={1} style={{fontSize:15,color:t.ink,fontWeight:"800"}}>{post.authorName}</Text>
   <Text numberOfLines={1} style={{fontSize:12,color:t.ink2}}>{(post.authorHandle?"@"+post.authorHandle+" · ":"")+new Date(post.createdAt).toLocaleDateString("es")}</Text>
  </Pressable>
  {viewer===post.authorId&&<Pressable accessibilityRole="button" accessibilityLabel="Opciones de mi publicación"
   onPress={()=>Alert.alert("Eliminar publicación","¿Quitar esta publicación del feed?",[{text:"Cancelar",style:"cancel"},{text:"Eliminar",style:"destructive",onPress:()=>void onRemove(post)}])}
   style={{padding:10,minWidth:42,alignItems:"center"}}>
   <Ionicons name="ellipsis-horizontal" size={22} color={t.ink2}/>
  </Pressable>}
 </View>;
 return <View style={{backgroundColor:t.surface,borderTopWidth:1,borderBottomWidth:1,borderColor:t.line,paddingVertical:11,gap:10}}>
  {!media&&authorRow}
  {post.kind==="photos"&&<PublishedPhotos post={post}/>}
  {(post.kind==="video"||post.kind==="live")&&<Pressable accessibilityRole="button" accessibilityLabel="Ver contenido profesional"
   onPress={()=>post.mediaId&&router.push({pathname:"/work-media/[id]",params:{id:post.mediaId}})}
   style={{minHeight:210,backgroundColor:t.cream,alignItems:"center",justifyContent:"center",gap:10}}>
   <Ionicons name={post.kind==="live"?"radio-outline":"play-circle-outline"} size={52} color={t.ink}/>
   <Text style={{color:t.ink,fontWeight:"700"}}>{post.kind==="live"?"Ver grabación de Live":"Ver video aprobado"}</Text>
  </Pressable>}
  {media&&authorRow}
  {!!post.body&&<Text style={{paddingHorizontal:16,color:t.ink,fontSize:15,lineHeight:23}}>{post.body}</Text>}
  {!!link&&<Pressable accessibilityRole="link" accessibilityLabel="Abrir enlace compartido" onPress={()=>void Linking.openURL(link)}>
   <Text numberOfLines={1} style={{paddingHorizontal:16,color:t.ink2,fontSize:12,textDecorationLine:"underline"}}>{link}</Text>
  </Pressable>}
  <View style={{flexDirection:"row",paddingHorizontal:16,justifyContent:"space-between",alignItems:"center",borderTopWidth:1,borderColor:t.line,paddingTop:8}}>
   <Pressable accessibilityRole="button" accessibilityLabel={formatCount(likes)+" Me gusta"} accessibilityState={{selected:liked,disabled:pending}}
    onPress={()=>void toggleLike()} style={{minHeight:44,flex:1,flexDirection:"row",alignItems:"center",justifyContent:"center",gap:7}}>
    <Ionicons name={liked?"heart":"heart-outline"} size={22} color={liked?"#E64C5B":t.ink}/>
    <Text style={{color:t.ink2,fontSize:13,fontWeight:"600"}}>{formatCount(likes)}</Text>
   </Pressable>
   <Pressable accessibilityRole="button" accessibilityLabel={formatCount(commentsCount)+" comentarios"} onPress={()=>void openComments()}
    style={{minHeight:44,flex:1,flexDirection:"row",alignItems:"center",justifyContent:"center",gap:7}}>
    <Ionicons name="chatbubble-outline" size={21} color={t.ink}/><Text style={{color:t.ink2,fontSize:13,fontWeight:"600"}}>{formatCount(commentsCount)}</Text>
   </Pressable>
   <Pressable accessibilityRole="button" accessibilityLabel={formatCount(shares)+" compartidos"} onPress={()=>void share()}
    style={{minHeight:44,flex:1,flexDirection:"row",alignItems:"center",justifyContent:"center",gap:7}}>
    <Ionicons name="arrow-redo-outline" size={23} color={t.ink}/><Text style={{color:t.ink2,fontSize:13,fontWeight:"600"}}>{formatCount(shares)}</Text>
   </Pressable>
  </View>
  {!!error&&!commentsOpen&&<Text accessibilityLiveRegion="polite" style={{paddingHorizontal:16,color:t.ink2,fontSize:12}}>{error}</Text>}
  <BottomSheet visible={commentsOpen} onClose={()=>setCommentsOpen(false)} title={"Comentarios · "+formatCount(commentsCount)}>
   <View style={{gap:14,paddingVertical:10}}>
    {commentsLoading&&<ActivityIndicator color={t.yellow}/>}
    {!commentsLoading&&!comments.length&&<Text style={{color:t.ink2,textAlign:"center",paddingVertical:18}}>Todavía no hay comentarios. Sé el primero.</Text>}
    {comments.map(comment=><View key={comment.id} style={{flexDirection:"row",gap:10,alignItems:"flex-start"}}>
     <PublicProfileAvatar userId={comment.authorId} name={comment.authorName} size={34}/>
     <View style={{flex:1,backgroundColor:t.bg,borderRadius:14,padding:10,gap:4}}>
      <Text style={{color:t.ink,fontSize:13,fontWeight:"800"}}>{comment.authorName}</Text>
      <Text style={{color:t.ink,fontSize:13,lineHeight:19}}>{comment.body}</Text>
     </View>
    </View>)}
    {!!error&&<Text accessibilityLiveRegion="polite" style={{color:t.ink2,fontSize:12}}>{error}</Text>}
    <View style={{flexDirection:"row",alignItems:"center",gap:9,borderTopWidth:1,borderColor:t.line,paddingTop:12}}>
     <TextInput accessibilityLabel="Escribir comentario" placeholder="Escribe un comentario..." placeholderTextColor={t.ink2}
      value={draft} onChangeText={setDraft} maxLength={500} multiline
      style={{flex:1,minHeight:45,maxHeight:110,paddingHorizontal:13,paddingVertical:10,borderRadius:20,backgroundColor:t.bg,color:t.ink}}/>
     <Pressable accessibilityRole="button" accessibilityLabel="Enviar comentario" disabled={!draft.trim()||sending}
      onPress={()=>void sendComment()} style={{width:44,height:44,borderRadius:22,backgroundColor:t.ink,alignItems:"center",justifyContent:"center",opacity:!draft.trim()||sending?0.45:1}}>
      {sending?<ActivityIndicator color={t.bg}/>:<Ionicons name="arrow-up" color={t.bg} size={22}/>}
     </Pressable>
    </View>
   </View>
  </BottomSheet>
 </View>;
}

export function HomePublishedPosts(){
 const {theme}=useTheme();const t=jobeenTokens(theme);
 const [posts,setPosts]=useState<FeedPost[]>([]);
 const [viewer,setViewer]=useState("");
 const [loading,setLoading]=useState(true);
 const [error,setError]=useState("");
 const reload=useCallback(()=>{
  let active=true;setLoading(true);
  void(async()=>{
   try{
    const user=await currentSocialUser().catch(()=>"");
    const loaded=await loadHomePosts(user);
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
 if(!posts.length&&!loading&&!error)return null;
 return <View style={{gap:14}}>
  <View style={{paddingHorizontal:16,flexDirection:"row",alignItems:"center",justifyContent:"space-between"}}>
   <Text style={{color:t.ink,fontSize:18,fontWeight:"800"}}>Publicaciones recientes</Text>
   <Pressable accessibilityRole="button" accessibilityLabel="Actualizar publicaciones" onPress={()=>{reload();}} style={{padding:8}}>
    <Ionicons name="refresh-outline" size={20} color={t.ink}/>
   </Pressable>
  </View>
  {loading&&<ActivityIndicator color={t.yellow}/>}
  {!!error&&<Text accessibilityLiveRegion="polite" style={{color:t.ink2,paddingHorizontal:16}}>{error}</Text>}
  {posts.map(post=><HomePostCard key={post.id} post={post} viewer={viewer} onRemove={remove}/>)}
 </View>;
}
