import {Ionicons} from "@expo/vector-icons";
import {router,Stack,useLocalSearchParams,useNavigation} from "expo-router";
import {markPublishedPostForHome} from "../../lib/post-return";
import {usePreventRemove} from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import {useEffect,useRef,useState} from "react";
import {ActivityIndicator,AppState,Image,Keyboard,Modal,Pressable,ScrollView,Text,TextInput,View,useWindowDimensions} from "react-native";
import {SafeAreaView} from "react-native-safe-area-context";
import {PublicProfileAvatar} from "../../components/PublicProfileAvatar";
import {captureMessageScope,assertMessageScope,type MessageScope} from "../../lib/message-session";
import {publishHomePost,shareApprovedMedia,uploadPhoto,type FeedPostKind,type FeedAudience} from "../../lib/social-content";
import {PostComposerSheets} from "../../components/PostComposerSheets";
import {draftPhotoDisplayUri} from "../../lib/post-draft-photo";
import {DRAFT_PHOTO_BUCKET,emptyPostDraft,hasDraftContent,readPostDrafts,savePostDraft,deletePostDraft,restorePostDraftPhotoUrls,type PostDraft,type PostDraftPhoto} from "../../lib/post-drafts";
import {searchPostMentions,type PostMention,type PostBusinessMention} from "../../lib/post-mentions";
import {requireSupabase} from "../../lib/supabase";
import type {PublishedMedia} from "../../lib/safety-api";
import {useTheme} from "../../state/ThemeProvider";
import {jobeenTokens} from "../../theme/jobeen";
import {jobeenModalTokens} from "../../theme/modals";
import {JOBEEN_TYPE} from "../../theme/typography";

const kinds=[
 {kind:"photos",label:"Foto",icon:"image-outline"},
 {kind:"video",label:"Video",icon:"videocam-outline"},
 {kind:"live",label:"Clip de Live",icon:"radio-outline"},
] as const;

export default function PostCreate(){
 const {kind:requested}=useLocalSearchParams<{kind?:string}>();
 const navigation=useNavigation();
 const {theme}=useTheme();const t=jobeenTokens(theme);const modal=jobeenModalTokens(theme);
 const {width:windowWidth,height:windowHeight}=useWindowDimensions();
 const [kind,setKind]=useState<FeedPostKind>(requested==="photo"?"photos":requested==="video"?"video":requested==="live"?"live":"text");
 const [author,setAuthor]=useState("");
 const [authorName,setAuthorName]=useState("Tu perfil");
 const [authorHandle,setAuthorHandle]=useState("");
 const [body,setBody]=useState("");
 const [composerHeight,setComposerHeight]=useState(56);
 const [mediaHelpOpen,setMediaHelpOpen]=useState(false);
 const [termsExpanded,setTermsExpanded]=useState(false);
 const [photos,setPhotos]=useState<PostDraftPhoto[]>([]);
 const [media,setMedia]=useState<PublishedMedia[]>([]);
 const [mediaId,setMediaId]=useState("");
 const [consent,setConsent]=useState(false);
 const [audience,setAudience]=useState<FeedAudience>("public");
 const [audienceMenuOpen,setAudienceMenuOpen]=useState(false);
 const privateButtonRef=useRef<View>(null);
 const [audienceAnchor,setAudienceAnchor]=useState({top:130,left:16});
 const [audienceFollowers,setAudienceFollowers]=useState(true);
 const [audienceContacts,setAudienceContacts]=useState(false);
 const [busy,setBusy]=useState(false);const [loading,setLoading]=useState(true);const [error,setError]=useState("");
 const [draftId,setDraftId]=useState(()=>emptyPostDraft().id);
 const [drafts,setDrafts]=useState<PostDraft[]>([]);
 const [draftCount,setDraftCount]=useState(0);
 const [hydrated,setHydrated]=useState(false);
 const [draftsOpen,setDraftsOpen]=useState(false);
 const [previewOpen,setPreviewOpen]=useState(false);
 const [altPhotoId,setAltPhotoId]=useState<string|null>(null);
 const [exitOpen,setExitOpen]=useState(false);
 const [editingDone,setEditingDone]=useState(false);
 const [destination,setDestination]=useState<string|null>(null);
 const [mentionQuery,setMentionQuery]=useState("");
 const [mentionResults,setMentionResults]=useState<PostMention[]>([]);
 const [mentionSearching,setMentionSearching]=useState(false);
 const [mentionedProfileIds,setMentionedProfileIds]=useState<string[]>([]);
 const [businessMentions,setBusinessMentions]=useState<PostBusinessMention[]>([]);
 const draftSnapshotRef=useRef<PostDraft>(emptyPostDraft());
 const savingChainRef=useRef<Promise<void>>(Promise.resolve());
 const pendingUploadsRef=useRef<Promise<void>[]>([]);
 const autosaveEnabledRef=useRef(true);
 const scopeRef=useRef<MessageScope|null>(null),submitting=useRef(false);
 const liveScope=(scope:MessageScope)=>scopeRef.current===scope;
 function editorScope(){const scope=scopeRef.current;if(!scope||scope.owner!==author)throw Error("La sesión del editor cambió.");return scope;}

 const snapshot:PostDraft={
  id:draftId,updatedAt:Date.now(),body,kind,photos,mediaId,audience,
  audienceFollowers,audienceContacts,consent,mentionedProfileIds,businessMentions
 };
 draftSnapshotRef.current=snapshot;
 const hasWork=hasDraftContent(snapshot);
 function persistSnapshot(value:PostDraft){
  const scope=scopeRef.current;
  if(!scope||scope.owner!==author||!hydrated||!autosaveEnabledRef.current||!hasDraftContent(value))return savingChainRef.current;
  savingChainRef.current=savingChainRef.current.catch(()=>{}).then(async()=>{
   if(autosaveEnabledRef.current&&liveScope(scope)){
    await savePostDraft(author,value,scope);
    const saved=await readPostDrafts(author,scope);
    if(liveScope(scope))setDraftCount(count=>count===saved.length?count:saved.length);
   }
  });
  return savingChainRef.current;
 }
 function applyDraft(d:PostDraft){
  setDraftId(d.id);setBody(d.body);setKind(d.kind);
  setPhotos(d.photos);setMediaId(d.mediaId);setAudience(d.audience);
  setAudienceFollowers(d.audienceFollowers);setAudienceContacts(d.audienceContacts);
  setConsent(d.consent);setMentionedProfileIds(d.mentionedProfileIds??[]);setBusinessMentions(d.businessMentions??[]);
  refreshDraftPhotoPreviews(d.photos);
 }
 function refreshDraftPhotoPreviews(selectedPhotos:PostDraftPhoto[]){
  const scope=scopeRef.current;if(!scope||!selectedPhotos.some(photo=>photo.backupPath))return;
  void restorePostDraftPhotoUrls(selectedPhotos,author,scope).then(restored=>{if(liveScope(scope))setPhotos(current=>current.map(photo=>{
   const refreshed=restored.find(item=>item.id===photo.id&&item.backupPath===photo.backupPath);
   return refreshed?{...photo,previewUri:refreshed.previewUri}:photo;
  }));}).catch(()=>{
   if(liveScope(scope))setError("Algunas fotos necesitan conexión o volver a seleccionarse.");
  });
 }
 useEffect(()=>{let active=true;void(async()=>{
  try{
   const scope=await captureMessageScope(),uid=scope.owner;
   if(!active)return;
   const saved=await readPostDrafts(uid,scope);
   await assertMessageScope(scope);
   if(!active)return;
   scopeRef.current=scope;setAuthor(uid);setDrafts(saved);
   setDraftCount(saved.length);
   // New publication always starts empty; drafts are opened explicitly from Borradores.
   void Promise.all([
    requireSupabase().from("profiles").select("display_name").eq("id",uid).maybeSingle(),
    requireSupabase().from("jcard_profiles").select("handle").eq("profile_id",uid).maybeSingle()
   ]).then(async([person,card])=>{
    await assertMessageScope(scope);if(!active||!liveScope(scope))return;
    if(person.data?.display_name)setAuthorName(person.data.display_name);
    if(card.data?.handle)setAuthorHandle(card.data.handle.replace(/^@/,""));
   }).catch(()=>{});
   const approved=await Promise.all([shareApprovedMedia("video",uid),shareApprovedMedia("live",uid)]);
   await assertMessageScope(scope);if(active&&liveScope(scope))setMedia([...approved[0],...approved[1]]);
  }catch(e){if(active)setError(e instanceof Error?e.message:"No se pudo cargar la cuenta.");}
  finally{if(active){setHydrated(!!scopeRef.current);setLoading(false);}}
 })();return()=>{active=false;scopeRef.current=null;autosaveEnabledRef.current=false;};},[]);
 useEffect(()=>{
  if(!hydrated||!author||!hasWork||!autosaveEnabledRef.current)return;
  const timer=setTimeout(()=>{
   void persistSnapshot(draftSnapshotRef.current).catch(e=>setError(e instanceof Error?e.message:"No se pudo guardar el borrador."));
  },180);
  return()=>clearTimeout(timer);
 },[author,hydrated,draftId,body,kind,photos,mediaId,audience,audienceFollowers,audienceContacts,consent,mentionedProfileIds,businessMentions]);
 useEffect(()=>{
  const subscription=AppState.addEventListener("change",status=>{
   if(status!=="active")void persistSnapshot(draftSnapshotRef.current).catch(()=>{});
  });
  return()=>{subscription.remove();void persistSnapshot(draftSnapshotRef.current).catch(()=>{});};
 },[author,hydrated]);
 useEffect(()=>{
  const match=body.endsWith(" ")?null:body.match(/(?:^|\s)@([\p{L}\p{N}_. -]{1,60})$/u);
  setMentionQuery(match?.[1]??"");
 },[body]);
 useEffect(()=>{
  if(mentionQuery.trim().length<2){setMentionResults([]);return;}
  let active=true;const timer=setTimeout(()=>{
   setMentionSearching(true);
   void searchPostMentions(mentionQuery).then(list=>{if(active)setMentionResults(list);})
    .catch(e=>{if(active)setError(e instanceof Error?e.message:"No se pudieron buscar cuentas.");})
    .finally(()=>{if(active)setMentionSearching(false);});
  },320);
  return()=>{active=false;clearTimeout(timer);};
 },[mentionQuery]);
 useEffect(()=>{
  if(!editingDone||destination===null)return;
  // The post screen sits above the existing tab navigator. Allow React to
  // release the unsaved-draft guard and Android to dismiss native Modal windows
  // before popping only this screen. InteractionManager can wait indefinitely
  // while an animated interaction remains active, leaving a blank gray view.
  const scope=scopeRef.current;if(!scope)return;
  const timer=setTimeout(()=>{
   void captureMessageScope(scope).then(()=>{if(!liveScope(scope))return;
   if(destination)markPublishedPostForHome(destination,scope);
   if(navigation.canGoBack())navigation.goBack();
   else router.replace("/(tabs)/index");}).catch(()=>{});
  },350);
  return()=>clearTimeout(timer);
 },[editingDone,destination,navigation]);
 // Only intercept removal when there is actually content to preserve.
 // An empty composer should use the ordinary native Back behavior.
 usePreventRemove(hasWork&&!editingDone,()=>{
  setExitOpen(true);
 });
 function finishHome(published:string){
  autosaveEnabledRef.current=false;
  Keyboard.dismiss();
  setExitOpen(false);setDraftsOpen(false);setPreviewOpen(false);
  setAltPhotoId(null);setAudienceMenuOpen(false);
  setEditingDone(true);setDestination(published);
 }
 function requestExit(){
  if(hasDraftContent(draftSnapshotRef.current)){
   Keyboard.dismiss();
   setExitOpen(true);
  }else if(navigation.canGoBack()){
   navigation.goBack();
  }else{
   router.replace("/videos");
  }
 }
 async function saveDraftNow(){
  const scope=editorScope();
  await Promise.allSettled(pendingUploadsRef.current);await assertMessageScope(scope);if(!liveScope(scope))throw Error("El editor cambió.");
  await persistSnapshot(draftSnapshotRef.current);
  const saved=await readPostDrafts(author,scope);await assertMessageScope(scope);if(!liveScope(scope))throw Error("El editor cambió.");setDrafts(saved);setDraftCount(saved.length);
 }
 async function saveAndExit(){
  try{const scope=editorScope();await saveDraftNow();if(liveScope(scope))finishHome("");}
  catch(e){setError(e instanceof Error?e.message:"No se pudo guardar el borrador.");setExitOpen(false);}
 }
 async function discardAndExit(){
  try{
   const scope=editorScope();autosaveEnabledRef.current=false;
   await savingChainRef.current.catch(()=>{});await assertMessageScope(scope);if(!liveScope(scope))return;
   await deletePostDraft(author,draftSnapshotRef.current.id,scope);
   if(liveScope(scope))finishHome("");
  }catch(e){autosaveEnabledRef.current=true;setError(e instanceof Error?e.message:"No se pudo descartar el borrador.");setExitOpen(false);}
 }
 async function openDrafts(){
  try{const scope=editorScope();
   if(hasDraftContent(draftSnapshotRef.current)){
    await saveDraftNow().catch(e=>setError(e instanceof Error?e.message:"No se pudo guardar el borrador actual."));
   }
   const saved=await readPostDrafts(author,scope);if(!liveScope(scope))return;
   setDrafts(saved);setDraftCount(saved.length);setDraftsOpen(true);
   // Private draft photos may have temporary local URIs; refresh covers without
   // delaying opening the gallery or exposing any private bucket publicly.
   void Promise.all(saved.map(async draft=>{
    try{return {...draft,photos:await restorePostDraftPhotoUrls(draft.photos,author,scope)};}
    catch{return draft;}
   })).then(refreshed=>{if(liveScope(scope))setDrafts(current=>current.map(draft=>{
    const match=refreshed.find(item=>item.id===draft.id&&item.updatedAt===draft.updatedAt);
    return match??draft;
   }));}).catch(()=>{});
  }catch(e){setError(e instanceof Error?e.message:"No se pudieron cargar los borradores.");}
 }
 async function deleteDraft(d:PostDraft){
  // A queued background save must not recreate a draft the user explicitly deletes.
  const scope=scopeRef.current;if(!scope||scope.owner!==author||!drafts.some(item=>item.id===d.id))return;
  autosaveEnabledRef.current=false;
  try{
   await savingChainRef.current.catch(()=>{});
   await assertMessageScope(scope);if(!liveScope(scope))return;
   await deletePostDraft(author,d.id,scope);if(!liveScope(scope))return;
   if(d.id===draftSnapshotRef.current.id){
    const empty=emptyPostDraft();
    draftSnapshotRef.current=empty;
    setDraftId(empty.id);setBody("");setKind("text");setPhotos([]);setMediaId("");
    setAudience("public");setAudienceFollowers(true);setAudienceContacts(false);
    setConsent(false);setMentionedProfileIds([]);setBusinessMentions([]);
   }
   const saved=await readPostDrafts(author,scope);if(!liveScope(scope))return;
   setDrafts(saved);setDraftCount(saved.length);
  }catch(e){setError(e instanceof Error?e.message:"No se pudo eliminar el borrador.");}
  finally{if(liveScope(scope))autosaveEnabledRef.current=true;}
 }
 function chooseMention(person:PostMention){
  const token="@"+(person.handle.replace(/^@/,"")||(person.kind==="business"?person.name.trim():person.name.trim().replace(/\s+/g,"")));
  setBody(current=>{
   const match=current.match(/(?:^|\s)@([\p{L}\p{N}_. -]{1,60})$/u);
   return match?current.slice(0,current.length-match[1].length-1)+token+" ":current;
  });
  if(person.kind==="business"){
   setBusinessMentions(current=>current.some(item=>item.ownerId===person.id&&item.label===token)
    ?current:[...current.filter(item=>item.ownerId!==person.id),{ownerId:person.id,label:token}].slice(0,20));
  }else setMentionedProfileIds(current=>current.includes(person.id)?current:[...current,person.id]);
  setMentionQuery("");setMentionResults([]);
 }
 async function choosePhotos(){
  const scope=scopeRef.current;if(!scope||scope.owner!==author||submitting.current||photos.length>=5)return;
  try{await captureMessageScope(scope);if(!liveScope(scope))return;
   const result=await ImagePicker.launchImageLibraryAsync({mediaTypes:["images"],allowsMultipleSelection:true,selectionLimit:Math.max(1,5-photos.length),quality:0.8});
   await assertMessageScope(scope);if(!liveScope(scope))return;
   if(!result.canceled){
    const fresh:PostDraftPhoto[]=result.assets.map(asset=>({
     id:Date.now().toString(36)+"-"+Math.random().toString(36).slice(2),
     uri:asset.uri,altText:""
    }));
    setPhotos(current=>[...current,...fresh].slice(0,5));setError("");
    const tasks=fresh.map(photo=>uploadPhoto(author,photo.uri,DRAFT_PHOTO_BUCKET,scope).then(path=>{
     if(liveScope(scope))setPhotos(current=>current.map(p=>p.id===photo.id?{...p,backupPath:path}:p));
    }).catch(()=>{
     if(liveScope(scope))setError("El texto se guardará automáticamente. Algunas fotos no tienen respaldo y podrían requerir volver a seleccionarse.");
    }));
    pendingUploadsRef.current=[...pendingUploadsRef.current,...tasks.map(task=>task.then(()=>{}))];
   }
  }catch(e){setError(e instanceof Error?e.message:"No se pudieron seleccionar fotos.");}
 }
 function switchKind(next:FeedPostKind){
  // The text field is always present; tapping the selected media type again returns to text only.
  const selected=kind===next?"text":next;
  setKind(selected);setError("");setMediaId("");setMediaHelpOpen(false);
  if(selected==="text"&&next==="photos")setPhotos([]);
  if(selected==="video"||selected==="live"){setAudience("public");setAudienceMenuOpen(false);}
 }
 function toggleAudienceMenu(){
  if(audienceMenuOpen){setAudienceMenuOpen(false);return;}
  Keyboard.dismiss();
  const cardWidth=Math.min(270,windowWidth-28);
  const openAt=(x:number,y:number,w:number,h:number)=>{
   const left=Math.max(14,Math.min(x+w-cardWidth,windowWidth-cardWidth-14));
   const below=y+h+8;
   const top=below+238>windowHeight?Math.max(12,y-243):below;
   setAudienceAnchor({left,top});
   setAudienceMenuOpen(true);
  };
  if(privateButtonRef.current)privateButtonRef.current.measureInWindow(openAt);
  else openAt(windowWidth-120,100,100,36);
 }
 async function submit(){
  const scope=scopeRef.current;if(!scope||scope.owner!==author||submitting.current)return;
  if(!consent){setError("Confirma que la publicación cumple las normas de contenido profesional.");return;}
  if(audience==="private"&&!audienceFollowers&&!audienceContacts){setError("Selecciona seguidores, contactos o ambos.");return;}
  submitting.current=true;setBusy(true);setError("");
  try{
   await captureMessageScope(scope);if(!liveScope(scope))return;
   await Promise.allSettled(pendingUploadsRef.current);await assertMessageScope(scope);if(!liveScope(scope))return;
   await persistSnapshot(draftSnapshotRef.current);
   const selected=draftSnapshotRef.current.photos;
   const publishedId=await publishHomePost({
    body,kind,photos:kind==="photos"?selected.map(p=>p.uri):[],
    photoDraftPaths:kind==="photos"?selected.map(p=>p.backupPath??null):[],
    photoAltTexts:kind==="photos"?selected.map(p=>p.altText):[],
    mentionedProfileIds,businessMentions,
    mediaId:(kind==="video"||kind==="live")?mediaId:null,
    audience,audienceFollowers:audience==="private"&&audienceFollowers,
    audienceContacts:audience==="private"&&audienceContacts
   },scope);await assertMessageScope(scope);if(!liveScope(scope))return;
   // The post now exists. Do not keep the editor busy while remote draft
   // photos are deleted: a slow Storage request must never block navigation.
   autosaveEnabledRef.current=false;
   await savingChainRef.current.catch(()=>{});
   await deletePostDraft(author,draftSnapshotRef.current.id,scope,false).catch(()=>{});await assertMessageScope(scope);if(!liveScope(scope))return;
   finishHome(publishedId);
   const draftPaths=[...new Set(selected.map(photo=>photo.backupPath)
    .filter((path):path is string=>!!path&&path.startsWith(author+"/")))];
   // Retain possibly shared backup references for owner-only reconciliation.
   void draftPaths;
  }catch(e){setError(e instanceof Error?e.message:"No se pudo publicar.");}
  finally{submitting.current=false;if(liveScope(scope))setBusy(false);}
 }
 const eligible=(kind==="text"?!!body.trim():kind==="photos"?photos.length>0:!!mediaId)&&(audience==="public"||audienceFollowers||audienceContacts);
 return <>
  <Stack.Screen options={{title:"Crear publicación",
   headerLeft:()=>(
    <Pressable accessibilityRole="button" accessibilityLabel="Volver a inicio"
     onPress={requestExit} style={{width:46,height:44,alignItems:"center",justifyContent:"center"}}>
     <Ionicons name="arrow-back" size={24} color={t.ink}/>
    </Pressable>
   )}}/>
  <SafeAreaView edges={["bottom"]} style={{flex:1,backgroundColor:t.bg}}>
   <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{padding:18,paddingBottom:46,gap:17}}>
    <View style={{gap:9}}>
     <View style={{flexDirection:"row",alignItems:"center",gap:12}}>
      {!!author?<PublicProfileAvatar userId={author} name="Mi perfil" size={48}/>:<Ionicons name="person-circle-outline" size={45} color={t.ink}/>}
      <View style={{flex:1,flexDirection:"row",alignItems:"center",justifyContent:"center",gap:7,flexWrap:"wrap"}}>
       <Pressable accessibilityRole="button" accessibilityState={{selected:audience==="public"}} accessibilityLabel="Publicación pública" hitSlop={{top:4,bottom:4}}
        onPress={()=>{setAudience("public");setAudienceMenuOpen(false);setError("");}}
        style={{minHeight:37,paddingHorizontal:9,borderRadius:12,borderWidth:1,borderColor:audience==="public"?t.yellow:t.line,
         backgroundColor:audience==="public"?t.cream:t.surface,flexDirection:"row",alignItems:"center",gap:6}}>
        <Ionicons name="globe-outline" size={15} color={t.ink}/><Text style={{fontSize:12,fontWeight:audience==="public"?"700":"500",color:t.ink}}>Público</Text>
       </Pressable>
       <Pressable ref={privateButtonRef} accessibilityRole="button" accessibilityState={{selected:audience==="private",expanded:audienceMenuOpen}}
        accessibilityLabel="Elegir destinatarios privados" hitSlop={{top:4,bottom:4}}
        disabled={kind==="video"||kind==="live"}
        onPress={toggleAudienceMenu}
        style={{minHeight:37,paddingHorizontal:9,borderRadius:12,borderWidth:1,borderColor:audience==="private"?t.yellow:t.line,
         backgroundColor:audience==="private"?t.cream:t.surface,opacity:kind==="video"||kind==="live"?0.45:1,
         flexDirection:"row",alignItems:"center",gap:6}}>
        <Ionicons name="lock-closed-outline" size={15} color={t.ink}/><Text style={{fontSize:12,fontWeight:audience==="private"?"700":"500",color:t.ink}}>Privado</Text>
        <Ionicons name={audienceMenuOpen?"chevron-up":"chevron-down"} size={13} color={t.ink}/>
       </Pressable>
      </View>
     </View>
     {(kind==="video"||kind==="live")&&<Text style={{color:t.ink2,fontSize:12,paddingLeft:60}}>
      Los videos y Lives aprobados solo pueden compartirse públicamente.
     </Text>}
    </View>
    <View style={{position:"relative",zIndex:3}}>
    <TextInput accessibilityLabel="Texto de la publicación" value={body} onChangeText={setBody} multiline textAlignVertical="top" maxLength={2000}
      placeholder="Muestra tu trabajo" placeholderTextColor={t.ink2}
      onContentSizeChange={event=>{
       const next=Math.max(56,Math.min(240,Math.ceil(event.nativeEvent.contentSize.height)+14));
       setComposerHeight(previous=>Math.abs(previous-next)>2?next:previous);
      }} scrollEnabled={composerHeight>=240}
      style={{backgroundColor:t.surface,borderWidth:1,borderColor:t.line,borderRadius:17,
       paddingHorizontal:15,paddingVertical:12,height:composerHeight,color:t.ink,fontSize:15,lineHeight:22}}/>
     {!!mentionQuery&&mentionQuery.length>=2&&(mentionSearching||mentionResults.length>0)&&<View
      style={{position:"absolute",top:composerHeight+5,left:0,right:0,zIndex:9,elevation:12,
       maxHeight:215,borderRadius:14,overflow:"hidden",backgroundColor:t.surface,
       borderWidth:1,borderColor:t.line,shadowColor:t.floatingCardShadow,
       shadowOpacity:0.12,shadowRadius:10}}>
      <ScrollView keyboardShouldPersistTaps="always" nestedScrollEnabled>
       {mentionSearching&&<Text style={{fontSize:12,padding:12,color:t.ink2}}>Buscando profesionales...</Text>}
       {mentionResults.map(person=><Pressable key={person.id} accessibilityRole="button"
        accessibilityLabel={"Mencionar "+person.name} onPress={()=>chooseMention(person)}
        style={{minHeight:48,paddingHorizontal:12,flexDirection:"row",alignItems:"center",gap:10}}>
        <Ionicons name={person.kind==="business"||person.company?"business-outline":"person-outline"} size={19} color={t.ink}/>
        <View style={{flex:1}}>
         <Text numberOfLines={1} style={{fontSize:13,fontWeight:"600",color:t.ink}}>{person.name}</Text>
         <Text numberOfLines={2} style={{fontSize:11,color:t.ink2}}>{person.kind==="business"?["JCard de negocio",person.handle?"@"+person.handle:person.ownerHandle?"de @"+person.ownerHandle:"Sin usuario empresarial",person.category].filter(Boolean).join(" · "):person.handle?"@"+person.handle:"Cuenta personal"}</Text>
        </View>
       </Pressable>)}
      </ScrollView>
     </View>}
     {body.length>=1800&&<Text style={{fontSize:11,color:t.ink2,textAlign:"right",paddingTop:3}}>
      {body.length} / 2000 caracteres
     </Text>}
    </View>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{gap:8}}>
     {kinds.map(option=><Pressable key={option.kind} accessibilityRole="button" accessibilityState={{selected:kind===option.kind}} accessibilityLabel={kind===option.kind?"Quitar "+option.label:"Añadir "+option.label} onPress={()=>switchKind(option.kind)}
      style={{flexDirection:"row",alignItems:"center",gap:7,paddingHorizontal:12,minHeight:45,borderRadius:18,borderWidth:1,borderColor:kind===option.kind?t.yellow:t.line,backgroundColor:kind===option.kind?t.cream:t.surface}}>
      <Ionicons name={option.icon} size={18} color={t.ink}/>
      <Text style={{color:t.ink,fontWeight:kind===option.kind?"700":"500",fontSize:13}}>{option.label}</Text>
     </Pressable>)}
    </ScrollView>
    {kind==="photos"&&<View style={{gap:11}}>
     <View style={{flexDirection:"row",justifyContent:"space-between",alignItems:"center"}}>
      <Text style={{color:t.ink,fontWeight:"700"}}>Fotografías ({photos.length}/5)</Text>
      {photos.length<5&&<Pressable accessibilityRole="button" accessibilityLabel="Añadir fotografías" onPress={()=>void choosePhotos()}
       style={{paddingHorizontal:12,minHeight:44,backgroundColor:t.cream,borderRadius:14,flexDirection:"row",alignItems:"center",gap:6}}>
       <Ionicons name="add" size={17} color={t.ink}/><Text style={{color:t.ink,fontWeight:"700"}}>Añadir</Text>
      </Pressable>}
     </View>
     <ScrollView horizontal showsHorizontalScrollIndicator={false} nestedScrollEnabled
      accessibilityLabel="Fotografías seleccionadas, deslizar horizontalmente"
      contentContainerStyle={{flexDirection:"row",gap:9,paddingVertical:2}}>
      {photos.map((photo,i)=><View key={photo.id} style={{width:104,height:104,borderRadius:13,overflow:"hidden"}}>
       <Image source={{uri:draftPhotoDisplayUri(photo)}} accessibilityLabel={photo.altText||"Foto "+(i+1)} style={{width:104,height:104}} resizeMode="cover"/>
       <Pressable accessibilityRole="button" accessibilityLabel={"Quitar foto "+(i+1)}
        onPress={()=>setPhotos(current=>current.filter((_,j)=>j!==i))}
        style={{position:"absolute",top:4,right:4,width:34,height:34,alignItems:"center",
         justifyContent:"center",borderRadius:20,backgroundColor:t.surface}}>
        <Ionicons name="close" size={19} color={t.ink}/>
       </Pressable>
       <Pressable accessibilityRole="button" accessibilityLabel={"Describir foto "+(i+1)}
        onPress={()=>setAltPhotoId(photo.id)}
        style={{position:"absolute",bottom:4,left:4,backgroundColor:t.surface,
         borderRadius:8,minHeight:29,paddingHorizontal:6,flexDirection:"row",alignItems:"center",gap:3}}>
        <Ionicons name={photo.altText?"checkmark-circle":"accessibility-outline"} size={14} color={t.ink}/>
        <Text style={{color:t.ink,fontSize:10,fontWeight:"700"}}>Describir</Text>
       </Pressable>
      </View>)}
      {!photos.length&&<Pressable accessibilityRole="button" accessibilityLabel="Seleccionar fotografías"
       onPress={()=>void choosePhotos()} style={{width:158,height:104,borderRadius:16,borderWidth:1,
        borderStyle:"dashed",borderColor:t.line,backgroundColor:t.cream,alignItems:"center",justifyContent:"center",gap:4}}>
       <Ionicons name="image-outline" color={t.ink} size={25}/>
       <Text style={{color:t.ink,fontSize:13}}>Seleccionar fotos</Text>
      </Pressable>}
     </ScrollView>
    </View>}
    {(kind==="video"||kind==="live")&&<View style={{gap:10,borderRadius:18,backgroundColor:t.surface,borderWidth:1,borderColor:t.line,padding:15}}>
     <Pressable accessibilityRole="button" accessibilityState={{expanded:mediaHelpOpen}} accessibilityLabel="Información sobre publicaciones de video y Live" onPress={()=>setMediaHelpOpen(v=>!v)}
      style={{minHeight:44,flexDirection:"row",alignItems:"center",gap:10}}>
      <View style={{flex:1,gap:3}}>
       <Text numberOfLines={1} style={{color:t.ink,fontWeight:"800",fontSize:15}}>{kind==="video"?"Video publicado · Solo aprobados":"Live pasado · Clips aprobados"}</Text>
       {mediaHelpOpen&&<Text style={{color:t.ink2,fontSize:12,lineHeight:18}}>{kind==="video"?"Selecciona uno de tus videos aprobados. Los archivos nuevos pasan primero por moderación.":"Comparte la vista previa de un Live publicado. Los recortes editables estarán disponibles cuando el proveedor entregue grabaciones."}</Text>}
      </View>
      <Ionicons name={mediaHelpOpen?"chevron-up":"chevron-down"} size={19} color={t.ink2}/>
     </Pressable>
     {media.filter(x=>x.kind===kind).map(x=><Pressable key={x.id} accessibilityRole="radio" accessibilityState={{checked:mediaId===x.id}} onPress={()=>setMediaId(x.id)}
      style={{minHeight:50,borderRadius:15,padding:10,flexDirection:"row",gap:10,alignItems:"center",backgroundColor:mediaId===x.id?t.cream:t.bg}}>
      <Ionicons name={mediaId===x.id?"radio-button-on":"radio-button-off"} size={22} color={t.ink}/>
      <Text numberOfLines={2} style={{color:t.ink,flex:1}}>{x.title}</Text>
     </Pressable>)}
     {!media.some(x=>x.kind===kind)&&<Text style={{color:t.ink2,fontSize:12}}>Aún no tienes {kind==="video"?"videos":"Lives"} aprobados para compartir.</Text>}
     <Pressable accessibilityRole="button" onPress={()=>router.push(kind==="video"?"/create":"/live")} style={{minHeight:47,backgroundColor:t.cream,borderRadius:15,justifyContent:"center",alignItems:"center"}}>
      <Text style={{fontWeight:"700",color:t.ink}}>{kind==="video"?"Preparar video para revisión":"Solicitar Live"}</Text>
     </Pressable>
    </View>}

    <View style={{flexDirection:"row",gap:12,alignItems:"center"}}>
     <Pressable accessibilityRole="button" accessibilityLabel={"Borradores. Pendientes: "+draftCount}
      onPress={()=>void openDrafts()}
      style={{minHeight:49,flex:1,flexDirection:"row",alignItems:"center",justifyContent:"center",
       gap:6,borderRadius:15,borderWidth:1,borderColor:t.silver,backgroundColor:t.surface,paddingHorizontal:6}}>
      <Ionicons name="albums-outline" size={18} color={t.ink}/>
      <Text numberOfLines={1} style={{fontSize:12,fontWeight:"600",color:t.ink}}>Borradores</Text>
      {draftCount>0&&<View style={{minWidth:19,height:19,paddingHorizontal:3,alignItems:"center",
       justifyContent:"center",borderRadius:10,backgroundColor:t.cream}}>
       <Text style={{fontSize:11,fontWeight:"800",color:t.ink}}>{draftCount}</Text>
      </View>}
     </Pressable>
     <Pressable accessibilityRole="button" accessibilityLabel="Vista previa" onPress={()=>{refreshDraftPhotoPreviews(photos);setPreviewOpen(true);}}
      style={{minHeight:49,flex:1,flexDirection:"row",alignItems:"center",justifyContent:"center",
       gap:7,borderRadius:15,borderWidth:1,borderColor:t.silver,backgroundColor:t.surface,paddingHorizontal:8}}>
      <Ionicons name="eye-outline" size={19} color={t.ink}/>
      <Text numberOfLines={1} style={{fontSize:12,fontWeight:"600",color:t.ink}}>Vista previa</Text>
     </Pressable>
    </View>
    <View style={{borderWidth:1,borderColor:t.line,borderRadius:16,backgroundColor:t.surface,paddingHorizontal:12,paddingVertical:7}}>
     <View style={{flexDirection:"row",alignItems:"center",gap:8}}>
      <Pressable accessibilityRole="checkbox" accessibilityLabel="Acepto las normas de publicación" accessibilityState={{checked:consent}} onPress={()=>setConsent(value=>!value)}
       style={{flex:1,flexDirection:"row",alignItems:"center",minHeight:44,gap:8}}>
       <Ionicons name={consent?"checkbox":"square-outline"} size={23} color={t.ink}/>
       <Text numberOfLines={1} style={{flex:1,fontSize:13,fontWeight:"600",color:t.ink}}>Acepto las normas de Jobeen</Text>
      </Pressable>
      <Pressable accessibilityRole="button" accessibilityLabel={termsExpanded?"Ocultar normas":"Leer normas"} accessibilityState={{expanded:termsExpanded}} onPress={()=>setTermsExpanded(value=>!value)}
       style={{minWidth:44,minHeight:44,alignItems:"center",justifyContent:"center"}}>
       <Ionicons name={termsExpanded?"chevron-up":"chevron-down"} size={20} color={t.ink2}/>
      </Pressable>
     </View>
     {termsExpanded&&<Text style={{fontSize:12,lineHeight:18,color:t.ink2,paddingBottom:10}}>
      Confirmo que el contenido es laboral o educativo y cumple las normas de Jobeen. No publicaré contenido privado de otras personas.
     </Text>}
    </View>
    {loading&&<ActivityIndicator color={t.yellow}/>}
    {!!error&&<Text accessibilityLiveRegion="polite" style={{color:t.ink,fontSize:13}}>{error}</Text>}
    <Pressable accessibilityRole="button" disabled={busy||!author||!eligible||!consent} onPress={()=>void submit()}
     style={({pressed})=>({minHeight:52,borderRadius:18,backgroundColor:t.ink,justifyContent:"center",alignItems:"center",opacity:busy||!author||!eligible||!consent?0.45:pressed?0.75:1})}>
     <Text style={{color:t.bg,fontWeight:"800"}}>{busy?"Publicando...":"Publicar"}</Text>
    </Pressable>
    <Pressable accessibilityRole="button" onPress={requestExit} style={{minHeight:44,alignItems:"center",justifyContent:"center"}}><Text style={{color:t.ink2}}>Cancelar</Text></Pressable>
   </ScrollView>
   {busy&&<View accessibilityLiveRegion="polite" style={{position:"absolute",top:0,bottom:0,left:0,right:0,backgroundColor:modal.scrim,alignItems:"center",justifyContent:"center"}}>
    <View style={{backgroundColor:t.surface,borderRadius:20,paddingHorizontal:32,paddingVertical:23,alignItems:"center",gap:13}}>
     <ActivityIndicator color={t.ink} size="large"/>
     <Text style={{color:t.ink,fontSize:15,fontWeight:"700"}}>Publicando...</Text>
    </View>
   </View>}
  </SafeAreaView>
  <PostComposerSheets
   exitOpen={exitOpen} onContinue={()=>setExitOpen(false)}
   onSaveExit={()=>void saveAndExit()} onDiscardExit={()=>void discardAndExit()}
   previewOpen={previewOpen} onClosePreview={()=>setPreviewOpen(false)}
   draftsOpen={draftsOpen} onCloseDrafts={()=>setDraftsOpen(false)}
   drafts={drafts}
   onRestore={d=>{
    const current=draftSnapshotRef.current;
    void (current.id!==d.id&&hasDraftContent(current)?saveDraftNow():Promise.resolve())
     .then(()=>{applyDraft(d);setDraftsOpen(false);setError("");})
     .catch(e=>setError(e instanceof Error?e.message:"No se pudo recuperar el borrador."));
   }}
   onDelete={d=>void deleteDraft(d)}
   body={body} kind={kind} mediaTitle={media.find(item=>item.id===mediaId)?.title??""}
   photos={photos} audience={audience} followers={audienceFollowers} contacts={audienceContacts}
   authorId={author} authorName={authorName} authorHandle={authorHandle}
   altPhotoId={altPhotoId} onCloseAlt={()=>setAltPhotoId(null)}
   onAlt={(id,value)=>setPhotos(current=>current.map(p=>p.id===id?{...p,altText:value}:p))}
  />
  <Modal transparent visible={audienceMenuOpen} animationType="fade" statusBarTranslucent={false}
   onRequestClose={()=>setAudienceMenuOpen(false)}>
   <View style={{flex:1}}>
    <Pressable accessibilityRole="button" accessibilityLabel="Cerrar opciones de privacidad"
     onPress={()=>setAudienceMenuOpen(false)}
     style={{position:"absolute",top:0,bottom:0,left:0,right:0,backgroundColor:t.uploadScrim}}/>
    <View accessibilityViewIsModal style={{position:"absolute",top:audienceAnchor.top,left:audienceAnchor.left,
     width:Math.min(270,windowWidth-28),maxWidth:"95%",borderWidth:1,borderColor:modal.border,
     borderRadius:modal.radius.popover,backgroundColor:modal.surface,paddingHorizontal:15,paddingVertical:14,gap:8,
     shadowColor:t.floatingCardShadow,shadowOpacity:0.24,shadowRadius:18,shadowOffset:{width:0,height:9},elevation:18}}>
     <View style={{width:34,height:3,borderRadius:3,backgroundColor:modal.accent,marginBottom:4}}/>
     <Text style={{fontSize:JOBEEN_TYPE.sectionTitle,fontWeight:"700",color:modal.text}}>Compartir con</Text>
     <Pressable accessibilityRole="checkbox" accessibilityState={{checked:audienceFollowers}}
      accessibilityLabel="Compartir con mis seguidores" onPress={()=>setAudienceFollowers(current=>!current)}
      style={{flexDirection:"row",alignItems:"center",minHeight:44,gap:10}}>
      <Ionicons name={audienceFollowers?"checkmark-circle":"ellipse-outline"} size={23} color={audienceFollowers?t.ink:t.ink2}/>
      <Text style={{fontSize:13,color:t.ink}}>Mis seguidores</Text>
     </Pressable>
     <Pressable accessibilityRole="checkbox" accessibilityState={{checked:audienceContacts}}
      accessibilityLabel="Compartir con mis contactos" onPress={()=>setAudienceContacts(current=>!current)}
      style={{flexDirection:"row",alignItems:"center",minHeight:44,gap:10}}>
      <Ionicons name={audienceContacts?"checkmark-circle":"ellipse-outline"} size={23} color={audienceContacts?t.ink:t.ink2}/>
      <Text style={{fontSize:13,color:t.ink}}>Mis contactos</Text>
     </Pressable>
     <Pressable accessibilityRole="button" accessibilityLabel="Aplicar audiencia privada"
      disabled={!audienceFollowers&&!audienceContacts}
      onPress={()=>{setAudience("private");setAudienceMenuOpen(false);setError("");}}
      style={{minHeight:44,borderRadius:13,backgroundColor:t.ink,justifyContent:"center",alignItems:"center",
       opacity:audienceFollowers||audienceContacts?1:0.4}}>
      <Text style={{color:t.surface,fontWeight:"700",fontSize:13}}>Aplicar</Text>
     </Pressable>
    </View>
   </View>
  </Modal>
 </>;
}
