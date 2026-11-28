import {useRoyalHiveTypography} from "../theme/ProfileTypographyScope";
import {Ionicons} from "@expo/vector-icons";
import {router,useFocusEffect} from "expo-router";
import {useCallback,useRef,useState} from "react";
import {ActivityIndicator,Alert,Pressable,Text,View} from "react-native";
import {deleteHomePost,loadAllProfilePosts,loadHomePosts,type FeedPost} from "../lib/social-content";
import {loadPublishedMedia,type PublishedMedia} from "../lib/safety-api";
import {getSavedPostIds,setSavedPost} from "../lib/feed-preferences";
import {assertMessageScope,captureMessageScope} from "../lib/message-session";
import {useTheme} from "../state/ThemeProvider";
import {jobeenTokens} from "../theme/jobeen";
import {PageState,useUi} from "./ui";
import {ProfileMediaGrid,type ProfileTile} from "./ProfileSharedSections";
import {BottomSheet} from "./social-ui";

type Filter="all"|"videos"|"live";

/** Same mixed-media grid in own and public profiles; delete is owner-only. */
function ProfilePublicationGrid({userId,editable,filter,limit,heading,onSeeAll}:{
 userId?:string;editable:boolean;filter:Filter;limit?:number;heading?:string;onSeeAll?:()=>void;
}){
 const {theme}=useTheme();const t=jobeenTokens(theme);const {s}=useUi();const {type:JOBEEN_TYPE,lineHeight:JOBEEN_LINE_HEIGHT,adaptive}=useRoyalHiveTypography();
 const [savedView,setSavedView]=useState(false);
 const [posts,setPosts]=useState<FeedPost[]>([]);
 const [savedPosts,setSavedPosts]=useState<FeedPost[]>([]);
 const [workMedia,setWorkMedia]=useState<PublishedMedia[]>([]);
 const [selected,setSelected]=useState<FeedPost|null>(null);
 const [owner,setOwner]=useState("");
 const [loading,setLoading]=useState(true);
 const [error,setError]=useState("");
 const [request,setRequest]=useState(0);
 const retryRevision=useRef(0);
 const reload=useCallback(()=>{
  let active=true;setLoading(true);setError("");setSelected(null);
  const valid=()=>active&&request===retryRevision.current;
  const timeout=setTimeout(()=>{
   if(!valid())return;
   active=false;setLoading(false);setError("No se pudieron cargar las publicaciones. Vuelve a intentarlo.");
  },20_000);
  void(async()=>{
   try{
    const scope=await captureMessageScope();
    if(!valid())return;
    const viewer=scope.owner;
    const target=editable?viewer:userId??"";
    if(!target)throw Error("No se pudo identificar el perfil.");
    const ids=editable&&viewer?await getSavedPostIds(viewer):[];
    if(!valid())return;
    const [all,media,marked]=await Promise.all([
     loadAllProfilePosts(viewer,target,scope),
     loadPublishedMedia(scope).catch(()=>[] as PublishedMedia[]),
     editable&&ids.length?loadHomePosts(viewer,undefined,undefined,ids.slice(0,80),0,scope):Promise.resolve([] as FeedPost[])
    ]);
    await assertMessageScope(scope);
    if(valid()){
     setOwner(target);setPosts(all);
     setWorkMedia(media.filter(m=>m.creator_id===target));
     setSavedPosts(marked);setError("");
    }
   }catch{if(valid())setError("No se pudieron cargar las publicaciones. Vuelve a intentarlo.");}
   finally{clearTimeout(timeout);if(valid())setLoading(false);}
  })();
  return()=>{active=false;clearTimeout(timeout);};
 },[editable,userId,request]);
 useFocusEffect(reload);
 function openPost(post:FeedPost){
  router.push({pathname:"/post/[id]",params:{id:post.id}});
 }
 function confirmDelete(post:FeedPost){
  setSelected(null);
  Alert.alert("Eliminar publicación","¿Eliminar esta publicación de tu perfil y de Home? Esta acción no se puede deshacer.",[
   {text:"Cancelar",style:"cancel"},
   {text:"Eliminar",style:"destructive",onPress:()=>void remove(post)}
  ]);
 }
 async function remove(post:FeedPost){
  try{
   await deleteHomePost(post.id);
   setPosts(items=>items.filter(x=>x.id!==post.id));
   setSavedPosts(items=>items.filter(x=>x.id!==post.id));
   void setSavedPost(owner,post.id,false).catch(()=>{});
  }catch(e){Alert.alert("Eliminar publicación",e instanceof Error?e.message:"No se pudo eliminar la publicación.");}
 }
 async function unSave(post:FeedPost){
  try{await setSavedPost(owner,post.id,false);setSavedPosts(items=>items.filter(x=>x.id!==post.id));setSelected(null);}
  catch(e){Alert.alert("Guardados",e instanceof Error?e.message:"No se pudo quitar de guardados.");}
 }
 const showSaved=editable&&filter==="all"&&!limit&&savedView;
 const visiblePosts=(showSaved?savedPosts:posts).filter(post=>filter==="all"||post.kind===(filter==="videos"?"video":"live"));
 const linkedIds=new Set(posts.map(post=>post.mediaId).filter(Boolean));
 const additionalMedia=showSaved?[]:workMedia.filter(m=>
  (filter==="all"||m.kind===(filter==="videos"?"video":"live"))&&!linkedIds.has(m.id));
 const tiles:ProfileTile[]=[
  ...visiblePosts.map(post=>({
   id:post.id,title:post.body||post.kind,kind:post.kind,
   thumbnail:post.photoUrls[0]??null,photoCount:post.photoUrls.length,
   onPress:()=>openPost(post),
   onOptions:editable?()=>setSelected(post):undefined
  })),
  ...additionalMedia.map(item=>({
   id:"work-"+item.id,title:item.title,kind:item.kind,
   onPress:()=>router.push({pathname:"/work-media/[id]",params:{id:item.id}})
  }))
 ];
 const visibleTiles=limit?tiles.slice(0,limit):tiles;
 const emptyMessage=filter==="videos"?"Todavía no hay videos publicados.":filter==="live"?"Todavía no hay transmisiones publicadas.":showSaved?"Todavía no has guardado publicaciones.":"Todavía no hay publicaciones.";
 return <View style={{gap:12}}>
  <View style={{flexDirection:"row",justifyContent:"space-between",alignItems:"center",minHeight:40,gap:8}}>
   <Text style={s.h3}>{heading??(filter==="videos"?"Videos":filter==="live"?"Transmisiones":"Publicaciones")}</Text>
   {!!onSeeAll&&<Pressable accessibilityRole="button" accessibilityLabel="Ver todas las publicaciones" onPress={onSeeAll}
     style={{minHeight:44,paddingHorizontal:10,flexDirection:"row",gap:5,alignItems:"center",justifyContent:"center"}}>
     <Text style={{color:t.ink,fontSize:adaptive?JOBEEN_TYPE.action:13,fontWeight:adaptive?"500":"700",...(adaptive?{lineHeight:JOBEEN_LINE_HEIGHT.action}:{})}}>Ver todo</Text>
     <Ionicons name="chevron-forward" size={16} color={t.ink}/>
    </Pressable>}
   {editable&&filter==="all"&&!limit&&<Pressable accessibilityRole="button" accessibilityLabel={savedView?"Ver mis publicaciones":"Ver publicaciones guardadas"} accessibilityState={{selected:savedView}}
    onPress={()=>setSavedView(v=>!v)} style={{minHeight:44,paddingHorizontal:12,flexDirection:"row",gap:6,alignItems:"center",borderRadius:14,backgroundColor:savedView?t.cream:t.surface,borderWidth:1,borderColor:t.line}}>
    <Ionicons name={savedView?"grid-outline":"bookmark-outline"} size={18} color={t.ink}/>
    <Text style={[s.muted,{color:t.ink,fontWeight:"600"}]}>{savedView?"Mías":"Guardadas"}</Text>
   </Pressable>}
  </View>
  {loading&&<ActivityIndicator color={t.ink}/>}
  {!!error&&<PageState kind="error" message={error} actionLabel="Reintentar" onAction={()=>setRequest(++retryRevision.current)}/>}
  {!loading&&!error&&<ProfileMediaGrid items={visibleTiles} emptyMessage={emptyMessage}/>}
  <BottomSheet visible={!!selected} onClose={()=>setSelected(null)} title="Opciones de publicación">
   {!!selected&&<View style={{gap:5,paddingVertical:8}}>
    <Pressable accessibilityRole="button" onPress={()=>{const post=selected;setSelected(null);openPost(post);}}
     style={{minHeight:52,flexDirection:"row",alignItems:"center",gap:12,paddingHorizontal:12}}>
     <Ionicons name="eye-outline" size={22} color={t.ink}/><Text style={[s.text,{fontWeight:"600"}]}>Ver publicación</Text>
    </Pressable>
    {showSaved?
     <Pressable accessibilityRole="button" onPress={()=>void unSave(selected)}
      style={{minHeight:52,flexDirection:"row",alignItems:"center",gap:12,paddingHorizontal:12}}>
      <Ionicons name="bookmark-outline" size={22} color={t.ink}/><Text style={[s.text,{fontWeight:"600"}]}>Quitar de guardados</Text>
     </Pressable>:
     <Pressable accessibilityRole="button" onPress={()=>confirmDelete(selected)}
      style={{minHeight:52,flexDirection:"row",alignItems:"center",gap:12,paddingHorizontal:12}}>
      <Ionicons name="trash-outline" size={22} color={t.ink}/><Text style={[s.text,{fontWeight:"600"}]}>Eliminar publicación</Text>
     </Pressable>}
   </View>}
  </BottomSheet>
 </View>;
}
type ProfilePostsProps={filter?:Filter;limit?:number;heading?:string;onSeeAll?:()=>void};
export function ProfileOwnedPosts({filter="all",limit,heading,onSeeAll}:ProfilePostsProps){
 return <ProfilePublicationGrid filter={filter} editable limit={limit} heading={heading} onSeeAll={onSeeAll}/>;
}
export function ProfilePublicPosts({userId,filter="all",limit,heading,onSeeAll}:{userId:string}&ProfilePostsProps){
 return <ProfilePublicationGrid filter={filter} userId={userId} editable={false} limit={limit} heading={heading} onSeeAll={onSeeAll}/>;
}
