import {useEffect,useState} from "react";
import {ActivityIndicator,Text,View} from "react-native";
import {getSavedPostIds,hidePostFromHome,setSavedPost} from "../lib/feed-preferences";
import {useTheme} from "../state/ThemeProvider";
import {jobeenModalTokens} from "../theme/modals";
import {JOBEEN_TYPE,JOBEEN_LINE_HEIGHT} from "../theme/typography";
import {BottomSheet} from "./social-ui";
import {SettingsMenuRow} from "./SettingsMenuRow";

export function FeedPostOptions({visible,onClose,postId,viewerId,onHidden,onShareLink,onSaveChanged}:{
 visible:boolean;onClose:()=>void;postId:string;viewerId:string;onHidden:()=>void;onShareLink:()=>Promise<void>;onSaveChanged?:(saved:boolean)=>void;
}){
 const {theme}=useTheme();const modal=jobeenModalTokens(theme);
 const [saved,setSaved]=useState(false);
 const [busy,setBusy]=useState(false);
 const [actionError,setActionError]=useState("");
 const [whyExpanded,setWhyExpanded]=useState(false);
 useEffect(()=>{
  let active=true;
  if(visible)void getSavedPostIds(viewerId).then(ids=>{if(active)setSaved(ids.includes(postId));}).catch(()=>{});
  return()=>{active=false;};
 },[visible,viewerId,postId]);
 const close=()=>{if(!busy){setWhyExpanded(false);setActionError("");onClose();}};
 function fail(e:unknown){setActionError(e instanceof Error?e.message:"No se pudo completar la acción.");}
 async function toggleSaved(){
  if(busy)return;
  setBusy(true);setActionError("");
  try{await setSavedPost(viewerId,postId,!saved);onSaveChanged?.(!saved);setSaved(v=>!v);onClose();}
  catch(e){fail(e);}
  finally{setBusy(false);}
 }
 async function hide(){
  if(busy)return;
  setBusy(true);setActionError("");
  try{await hidePostFromHome(viewerId,postId);onHidden();onClose();}
  catch(e){fail(e);}
  finally{setBusy(false);}
 }
 async function shareLink(){
  if(busy)return;
  setBusy(true);setActionError("");
  try{await onShareLink();onClose();}
  catch(e){fail(e);}
  finally{setBusy(false);}
 }
 return <BottomSheet visible={visible} onClose={close} title="Opciones de publicación">
  <View style={{gap:8,paddingVertical:8}}>
   <SettingsMenuRow variant="action" icon={saved?"bookmark":"bookmark-outline"}
    title={saved?"Quitar de guardados":"Guardar publicación"} disabled={busy} onPress={()=>void toggleSaved()}/>
   <SettingsMenuRow variant="action" icon="share-social-outline"
    title="Compartir enlace" disabled={busy} onPress={()=>void shareLink()}/>
   <SettingsMenuRow variant="action" icon="remove-circle-outline"
    title="Ocultar publicación" disabled={busy} onPress={()=>void hide()}/>
   <SettingsMenuRow variant="action" icon="information-circle-outline"
    title="¿Por qué veo esta publicación?" disabled={busy} onPress={()=>setWhyExpanded(v=>!v)}/>
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
