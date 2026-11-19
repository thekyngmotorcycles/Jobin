import {Ionicons} from "@expo/vector-icons";
import {router,useFocusEffect} from "expo-router";
import * as Linking from "expo-linking";
import {useCallback,useEffect,useState} from "react";
import {ActivityIndicator,Pressable,Share,Text,TextInput,View} from "react-native";
import {BottomSheet} from "./social-ui";
import {PhotoCarousel,PostEngagementRow} from "./PostCard";
import {PostCaption} from "./PostCaption";
import {useUi} from "./ui";
import {PublicProfileAvatar} from "./PublicProfileAvatar";
import {addHomePostComment,currentSocialUser,loadHomePostComments,loadHomePosts,recordHomePostShare,setHomePostLike,type FeedPost,type HomePostComment} from "../lib/social-content";
import {getHiddenPostIds,getSavedPostIds,setSavedPost} from "../lib/feed-preferences";
import {requireSupabase} from "../lib/supabase";
import type {HomeFeedFilter} from "./HomeFeedFilters";
import {FeedPostOptions} from "./FeedPostOptions";
import {formatCount} from "../lib/feed";
import {useTheme} from "../state/ThemeProvider";
import {jobeenTokens} from "../theme/jobeen";

export function HomePostCard({post,viewer,onHide,savedByViewer}:{post:FeedPost;viewer:string;onHide:(id:string)=>void;savedByViewer?:boolean}){
 const {theme}=useTheme();const t=jobeenTokens(theme);const {s,colors}=useUi();
 const [liked,setLiked]=useState(post.likedByViewer);
 const [likes,setLikes]=useState(post.likes);
 const [commentsCount,setCommentsCount]=useState(post.comments);
 const [shares,setShares]=useState(post.shares);
 const [saved,setSaved]=useState(savedByViewer??false);
 const [saving,setSaving]=useState(false);
 const [pending,setPending]=useState(false);
 const [error,setError]=useState("");
 const [commentsOpen,setCommentsOpen]=useState(false);
 const [commentsLoading,setCommentsLoading]=useState(false);
 const [comments,setComments]=useState<HomePostComment[]>([]);
 const [optionsOpen,setOptionsOpen]=useState(false);
 const [draft,setDraft]=useState("");
 const [sending,setSending]=useState(false);
 useEffect(()=>{
  setLiked(post.likedByViewer);setLikes(post.likes);setCommentsCount(post.comments);setShares(post.shares);
 },[post.likedByViewer,post.likes,post.comments,post.shares]);
 useEffect(()=>{
  if(savedByViewer!==undefined){setSaved(savedByViewer);return;}
  let active=true;
  if(viewer)void getSavedPostIds(viewer).then(ids=>{if(active)setSaved(ids.includes(post.id));}).catch(()=>{});
  return()=>{active=false;};
 },[savedByViewer,viewer,post.id]);
 async function toggleSaved(){
  if(saving)return;
  setSaving(true);setError("");
  try{await setSavedPost(viewer,post.id,!saved);setSaved(v=>!v);}
  catch(e){setError(e instanceof Error?e.message:"No se pudo guardar la publicación.");}
  finally{setSaving(false);}
 }
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
 async function sharePostLink(){
  setError("");
  try{
   const result=await Share.share({message:Linking.createURL("post/"+post.id)});
   if(result.action===Share.sharedAction){await recordHomePostShare(post.id);setShares(n=>n+1);}
  }catch(e){setError(e instanceof Error?e.message:"No se pudo compartir el enlace.");}
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
 const authorRow=<View style={{flexDirection:"row",alignItems:"center",gap:10,paddingHorizontal:16}}>
  <Pressable accessibilityRole="button" accessibilityLabel={"Ver perfil de "+post.authorName} onPress={profile}>
   <PublicProfileAvatar userId={post.authorId} name={post.authorName} size={34}/>
  </Pressable>
  <Pressable accessibilityRole="button" accessibilityLabel={"Ver perfil de "+post.authorName} onPress={profile} style={{flex:1}}>
   <Text numberOfLines={1} style={s.h3}>{post.authorName}</Text>
   {!!post.authorHandle&&<Text numberOfLines={1} style={s.muted}>{"@"+post.authorHandle}</Text>}
  </Pressable>
  <Pressable accessibilityRole="button" accessibilityLabel="Opciones de publicación"
   accessibilityState={{expanded:optionsOpen}} onPress={()=>setOptionsOpen(true)}
   style={{width:44,height:44,alignItems:"center",justifyContent:"center"}}>
   <Ionicons name="ellipsis-horizontal" size={20} color={colors.ink}/>
  </Pressable>
 </View>;
 return <View style={{gap:10}}>
  {authorRow}
  {post.kind==="photos"&&<PhotoCarousel post={{author:post.authorName,photos:post.photoUrls,altTexts:post.photoAltTexts}}/>}
  {(post.kind==="video"||post.kind==="live")&&<Pressable accessibilityRole="button" accessibilityLabel="Ver contenido profesional"
   onPress={()=>post.mediaId&&router.push({pathname:"/work-media/[id]",params:{id:post.mediaId}})}
   style={{minHeight:210,backgroundColor:colors.accent,alignItems:"center",justifyContent:"center",gap:10}}>
   <Ionicons name={post.kind==="live"?"radio-outline":"play-circle-outline"} size={52} color={colors.ink}/>
   <Text style={[s.text,{fontWeight:"700"}]}>{post.kind==="live"?"Ver grabación de Live":"Ver video aprobado"}</Text>
  </Pressable>}
  <PostCaption text={post.body} mentions={post.mentions}/>
  <PostEngagementRow likes={likes} comments={commentsCount} shares={shares} liked={liked}
   likeDisabled={pending} onLike={()=>void toggleLike()} onComments={()=>void openComments()} onShare={()=>void share()}
   saved={saved} onSave={()=>void toggleSaved()} saveDisabled={saving}/>
  {!!error&&!commentsOpen&&<Text accessibilityLiveRegion="polite" style={{paddingHorizontal:16,color:t.ink2,fontSize:12}}>{error}</Text>}
  <FeedPostOptions visible={optionsOpen} onClose={()=>setOptionsOpen(false)} viewerId={viewer} postId={post.id} onHidden={()=>onHide(post.id)} onShareLink={sharePostLink} onSaveChanged={setSaved}/>
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

export function HomePublishedPosts({filter="all",featuredPostId=""}:{filter?:HomeFeedFilter;featuredPostId?:string}){
 const {theme}=useTheme();const t=jobeenTokens(theme);
 const [posts,setPosts]=useState<FeedPost[]>([]);
 const [viewer,setViewer]=useState("");
 const [savedIds,setSavedIds]=useState<string[]>([]);
 const [followedIds,setFollowedIds]=useState<string[]>([]);
 const [businessIds,setBusinessIds]=useState<string[]>([]);
 const [loading,setLoading]=useState(true);
 const [error,setError]=useState("");
 const reload=useCallback(()=>{
  let active=true;setLoading(true);
  void(async()=>{
   try{
    const user=await currentSocialUser().catch(()=>"");
    const [loaded,hidden,savedPosts]=await Promise.all([loadHomePosts(user),getHiddenPostIds(user),getSavedPostIds(user)]);
    const authorIds=[...new Set(loaded.map(post=>post.authorId))];
    const db=requireSupabase();
    const [follows,businesses,businessCards]=await Promise.all([
     user?db.from("profile_follows" as never).select("followed_id").eq("follower_id",user):Promise.resolve({data:[],error:null}),
     authorIds.length?db.from("profiles").select("id").in("id",authorIds).eq("account_type","company"):Promise.resolve({data:[],error:null}),
     authorIds.length?db.from("jcard_business_details" as never).select("owner_id").in("owner_id",authorIds):Promise.resolve({data:[],error:null})
    ]);
    if(follows.error)throw follows.error;
    if(businesses.error)throw businesses.error;
    if(active){
     setPosts(loaded.filter(post=>!hidden.includes(post.id)));
     setSavedIds(savedPosts);
     setViewer(user);
     setFollowedIds(((follows.data??[]) as {followed_id:string}[]).map(row=>row.followed_id));
     setBusinessIds([...new Set([
      ...((businesses.data??[]) as {id:string}[]).map(row=>row.id),
      ...((businessCards.data??[]) as {owner_id:string}[]).map(row=>row.owner_id)
     ])]);
     setError("");
    }
   }catch(e){if(active)setError(e instanceof Error?e.message:"No se pudieron cargar las publicaciones.");}
   finally{if(active)setLoading(false);}
  })();
  return()=>{active=false;};
 },[]);
 useFocusEffect(reload);
 const visible=posts.filter(post=>filter==="all"||(filter==="following"?followedIds.includes(post.authorId):businessIds.includes(post.authorId)))
  .sort((a,b)=>a.id===featuredPostId?-1:b.id===featuredPostId?1:0);
 if(!posts.length&&!loading&&!error&&filter==="all")return null;
 return <View style={{gap:14}}>
  <View style={{paddingHorizontal:16,flexDirection:"row",alignItems:"center",justifyContent:"space-between"}}>
   <Text style={{color:t.ink,fontSize:18,fontWeight:"800"}}>{filter==="following"?"De las cuentas que sigues":filter==="companies"?"Publicaciones de empresas":"Publicaciones recientes"}</Text>
   <Pressable accessibilityRole="button" accessibilityLabel="Actualizar publicaciones" onPress={()=>{reload();}} style={{padding:8}}>
    <Ionicons name="refresh-outline" size={20} color={t.ink}/>
   </Pressable>
  </View>
  {loading&&<ActivityIndicator color={t.yellow}/>}
  {!!error&&<Text accessibilityLiveRegion="polite" style={{color:t.ink2,paddingHorizontal:16}}>{error}</Text>}
  {!loading&&!error&&filter!=="all"&&!visible.length&&<Text style={{color:t.ink2,fontSize:13,paddingHorizontal:16}}>
   {filter==="following"?"Aún no hay publicaciones recientes de las cuentas que sigues.":"Aún no hay publicaciones recientes de empresas."}
  </Text>}
  {visible.map(post=><View key={post.id}>
   {post.id===featuredPostId&&<Text style={{color:t.ink2,fontSize:12,fontWeight:"700",paddingHorizontal:16,paddingBottom:8}}>Tu publicación reciente</Text>}
   <HomePostCard post={post} viewer={viewer} savedByViewer={savedIds.includes(post.id)} onHide={id=>setPosts(items=>items.filter(post=>post.id!==id))}/>
  </View>)}
 </View>;
}
