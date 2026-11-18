import {Ionicons} from "@expo/vector-icons";
import {useEffect,useState,type ComponentProps} from "react";
import {ActivityIndicator,Alert,Pressable,Text,View} from "react-native";
import {getSavedPostIds,hidePostFromHome,setSavedPost} from "../lib/feed-preferences";
import {useTheme} from "../state/ThemeProvider";
import {jobeenTokens} from "../theme/jobeen";
import {BottomSheet} from "./social-ui";

export function FeedPostOptions({visible,onClose,postId,viewerId,onHidden,onShareLink}:{
 visible:boolean;onClose:()=>void;postId:string;viewerId:string;onHidden:()=>void;onShareLink:()=>Promise<void>;
}){
 const {theme}=useTheme();const t=jobeenTokens(theme);
 const [saved,setSaved]=useState(false);
 const [busy,setBusy]=useState(false);
 useEffect(()=>{
  let active=true;
  if(visible)void getSavedPostIds(viewerId).then(ids=>{if(active)setSaved(ids.includes(postId));}).catch(()=>{});
  return()=>{active=false;};
 },[visible,viewerId,postId]);
 function fail(e:unknown){
  Alert.alert("Opciones de publicación",e instanceof Error?e.message:"No se pudo completar la acción.");
 }
 async function toggleSaved(){
  if(busy)return;
  setBusy(true);
  try{await setSavedPost(viewerId,postId,!saved);setSaved(v=>!v);onClose();}
  catch(e){fail(e);}
  finally{setBusy(false);}
 }
 async function hide(){
  if(busy)return;
  setBusy(true);
  try{await hidePostFromHome(viewerId,postId);onHidden();onClose();}
  catch(e){fail(e);}
  finally{setBusy(false);}
 }
 async function shareLink(){
  if(busy)return;
  setBusy(true);
  try{
   await onShareLink();
   onClose();
  }catch(e){fail(e);}
  finally{setBusy(false);}
 }
 function whyVisible(){
  onClose();
  Alert.alert("¿Por qué veo esta publicación?","Home muestra publicaciones públicas relacionadas con el ámbito profesional o educativo. Las publicaciones recientes se ordenan por fecha.");
 }
 const option=(icon:ComponentProps<typeof Ionicons>["name"],label:string,run:()=>void)=>(
  <Pressable key={label} accessibilityRole="button" accessibilityLabel={label} disabled={busy} onPress={run}
   style={({pressed})=>({minHeight:54,flexDirection:"row",gap:14,alignItems:"center",paddingHorizontal:13,borderRadius:14,backgroundColor:pressed?t.cream:t.surface,opacity:busy?0.6:1})}>
   <Ionicons name={icon} size={22} color={t.ink}/>
   <Text style={{color:t.ink,fontSize:15,fontWeight:"600",flex:1}}>{label}</Text>
   {busy&&<ActivityIndicator color={t.ink} size="small"/>}
  </Pressable>
 );
 return <BottomSheet visible={visible} onClose={onClose} title="Opciones de publicación">
  <View style={{gap:3,paddingVertical:8}}>
   {option(saved?"bookmark":"bookmark-outline",saved?"Quitar de guardados":"Guardar publicación",()=>void toggleSaved())}
   {option("share-social-outline","Compartir enlace",()=>void shareLink())}
   {option("remove-circle-outline","Ocultar publicación",()=>void hide())}
   {option("information-circle-outline","¿Por qué veo esta publicación?",whyVisible)}
  </View>
 </BottomSheet>;
}
