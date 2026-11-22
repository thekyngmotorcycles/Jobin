import {useEffect,useRef,useState} from "react";
import {ActivityIndicator,Text,View} from "react-native";
import {captureMessageScope,assertMessageScope,type MessageScope} from "../lib/message-session";
import {getSavedPostIds,hidePostFromHome,setSavedPost} from "../lib/feed-preferences";
import {useTheme} from "../state/ThemeProvider";
import {jobeenModalTokens} from "../theme/modals";
import {JOBEEN_TYPE,JOBEEN_LINE_HEIGHT} from "../theme/typography";
import {BottomSheet} from "./social-ui";
import {SettingsMenuRow} from "./SettingsMenuRow";

export function FeedPostOptions({visible,onClose,postId,viewerId,originScope,onHidden,onShareLink,onSaveChanged}:{
 visible:boolean;onClose:()=>void;postId:string;viewerId:string;originScope?:MessageScope|null;onHidden:()=>void;onShareLink:()=>Promise<void>;onSaveChanged?:(saved:boolean)=>void;
}){
 const {theme}=useTheme();const modal=jobeenModalTokens(theme);
 const [saved,setSaved]=useState(false);
 const [busy,setBusy]=useState(false);
 const [actionError,setActionError]=useState("");
 const [whyExpanded,setWhyExpanded]=useState(false);
 const activeScope=useRef<MessageScope|null>(null),[ready,setReady]=useState(false),busyRef=useRef(false);
 useEffect(()=>{
  let active=true;activeScope.current=null;setReady(false);setSaved(false);setWhyExpanded(false);setActionError("");
  if(visible)void(async()=>{try{
   const scope=await captureMessageScope(originScope??undefined);
   if(scope.owner!==viewerId)return;
   const ids=await getSavedPostIds(viewerId,scope);await assertMessageScope(scope);
   if(active){activeScope.current=scope;setSaved(ids.includes(postId));setReady(true);}
  }catch{if(active)setReady(false);}})();
  return()=>{active=false;activeScope.current=null;setReady(false);};
 },[visible,viewerId,postId,originScope]);
 const close=()=>{if(!busyRef.current){setWhyExpanded(false);setActionError("");onClose();}};
 function fail(e:unknown){setActionError(e instanceof Error?e.message:"No se pudo completar la acción.");}
 async function perform(action:(scope:MessageScope)=>Promise<void>){
  const scope=activeScope.current;if(!scope||busyRef.current)return;
  busyRef.current=true;setBusy(true);setActionError("");
  try{await captureMessageScope(scope);if(activeScope.current!==scope)return;await action(scope);}
  catch(e){if(activeScope.current===scope)fail(e);}
  finally{busyRef.current=false;setBusy(false);}
 }
 async function toggleSaved(){
  await perform(async scope=>{await setSavedPost(viewerId,postId,!saved,scope);await assertMessageScope(scope);
   if(activeScope.current===scope){onSaveChanged?.(!saved);setSaved(v=>!v);onClose();}});
 }
 async function hide(){
  await perform(async scope=>{await hidePostFromHome(viewerId,postId,scope);await assertMessageScope(scope);
   if(activeScope.current===scope){onHidden();onClose();}});
 }
 async function shareLink(){
  await perform(async scope=>{if(activeScope.current===scope){await onShareLink();if(activeScope.current===scope)onClose();}});
 }
 return <BottomSheet visible={visible} onClose={close} title="Opciones de publicación">
  <View style={{gap:8,paddingVertical:8}}>
   <SettingsMenuRow variant="action" icon={saved?"bookmark":"bookmark-outline"}
    title={saved?"Quitar de guardados":"Guardar publicación"} disabled={busy||!ready} onPress={()=>void toggleSaved()}/>
   <SettingsMenuRow variant="action" icon="share-social-outline"
    title="Compartir enlace" disabled={busy||!ready} onPress={()=>void shareLink()}/>
   <SettingsMenuRow variant="action" icon="remove-circle-outline"
    title="Ocultar publicación" disabled={busy||!ready} onPress={()=>void hide()}/>
   <SettingsMenuRow variant="action" icon="information-circle-outline"
    title="¿Por qué veo esta publicación?" disabled={busy||!ready} onPress={()=>setWhyExpanded(v=>!v)}/>
   {whyExpanded&&<View style={{backgroundColor:modal.inner,borderColor:modal.border,borderWidth:1,
    borderRadius:modal.radius.control,padding:12}}>
    <Text style={{color:modal.muted,fontSize:JOBEEN_TYPE.secondary,lineHeight:JOBEEN_LINE_HEIGHT.secondary}}>
     Home muestra publicaciones públicas relacionadas con el ámbito profesional o educativo. Las publicaciones recientes se ordenan por fecha.
    </Text>
   </View>}
   {!!actionError&&<Text accessibilityLiveRegion="polite" style={{color:modal.text,
    fontSize:JOBEEN_TYPE.secondary,lineHeight:JOBEEN_LINE_HEIGHT.secondary}}>{actionError}</Text>}
   {busy&&<ActivityIndicator color={modal.text} size="small"/>}
  </View>
 </BottomSheet>;
}
