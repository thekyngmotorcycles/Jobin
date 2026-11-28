import {useRoyalHiveTypography} from "../theme/ProfileTypographyScope";
import {jobeenTokens} from "../theme/jobeen";
import {jobeenModalTokens} from "../theme/modals";
import {JOBEEN_CONTROL} from "../theme/control-metrics";
import {useCallback,useEffect,useRef,useState} from "react";
import {Modal,Pressable,ScrollView,StyleSheet,Text,View,useWindowDimensions} from "react-native";
import {useSafeAreaInsets} from "react-native-safe-area-context";
import {Ionicons} from "@expo/vector-icons";
import {router,useFocusEffect} from "expo-router";
import {contactState,inviteContact,replyContactRequest,removeContactRequest,type ContactRequest} from "../lib/professional-contacts";
import {requireSupabase} from "../lib/supabase";
import {assertMessageScope,captureMessageScope,type MessageScope} from "../lib/message-session";
import {useUi} from "./ui";
import {useTheme} from "../state/ThemeProvider";
import {JobeenShareSheet} from "./JCardShareSheet";
import {JobeenNoticeDialog} from "./JobeenNoticeDialog";
import {SettingsMenuRow} from "./SettingsMenuRow";
export function ProfileCommunityActions({user,name,url,menuOpen=false,onMenuClose,onToggleSaved,onSaveContact,savedJCard=false,savingJCard=false,visibleCardSide="personal"}:{user:string;name:string;url:string;menuOpen?:boolean;onMenuClose?:()=>void;onToggleSaved?:()=>void;onSaveContact?:()=>void;savedJCard?:boolean;savingJCard?:boolean;visibleCardSide?:"personal"|"business"}){
 const {s,colors}=useUi();const {type:JOBEEN_TYPE,lineHeight:JOBEEN_LINE_HEIGHT,adaptive}=useRoyalHiveTypography();const {theme}=useTheme();const modal=jobeenModalTokens(theme);const insets=useSafeAreaInsets();const {width,height}=useWindowDimensions();const jobeen=jobeenTokens("light");const [shareOpen,setShareOpen]=useState(false);const [confirm,setConfirm]=useState<"remove"|"block"|null>(null);const [followed,setFollowed]=useState(false);const [busy,setBusy]=useState(false);const [message,setMessage]=useState("");
 const scopeRef=useRef<MessageScope|null>(null);
 const [contact,setContact]=useState<ContactRequest|null>(null),[viewer,setViewer]=useState("");
 useFocusEffect(useCallback(()=>{
  let active=true;scopeRef.current=null;setContact(null);setViewer("");setConfirm(null);
  void(async()=>{try{
   const scope=await captureMessageScope(),value=await contactState(user,scope);
   await assertMessageScope(scope);
   if(active){scopeRef.current=scope;setContact(value.request);setViewer(value.mine);}
  }catch{if(active){setContact(null);setViewer("");}}})();
  return()=>{active=false;scopeRef.current=null;};
 },[user]));
 async function connect(){
  const scope=scopeRef.current;
  if(!scope||scope.owner!==viewer||busy)return;
  setBusy(true);setMessage("");
  try{
   if(!contact)await inviteContact(user,scope);
   else if(contact.status==="pending"&&contact.recipient_id===viewer)await replyContactRequest(contact.id,true,scope);
   else if(contact.status==="pending"&&contact.requester_id===viewer)await removeContactRequest(contact.id,scope);
   else if(contact.status==="accepted"){
    setBusy(false);
    setConfirm("remove");
    return;
   }else if(contact.status==="declined"){await removeContactRequest(contact.id,scope);if(scopeRef.current!==scope)return;await inviteContact(user,scope);}
   const value=await contactState(user,scope);if(scopeRef.current===scope)setContact(value.request);
  }catch(e){setMessage(e instanceof Error?e.message:"No se pudo gestionar el contacto.");}
  finally{setBusy(false);}
 }
 const contactLabel=!contact?"Conectar":contact.status==="accepted"?"Contacto":contact.status==="declined"?"Solicitar de nuevo":
  contact.recipient_id===viewer?"Aceptar":"Pendiente";
 useEffect(()=>{let active=true;void(async()=>{try{const db=requireSupabase();const {data:{user:me}}=await db.auth.getUser();if(!me||me.id===user)return;const {data}=await db.from("profile_follows" as never).select("followed_id").eq("follower_id",me.id).eq("followed_id",user).maybeSingle();if(active)setFollowed(!!data);}catch{}})();return()=>{active=false;};},[user]);
 async function toggleFollow(){
  const scope=scopeRef.current;if(!scope||scope.owner!==viewer)return;
  setBusy(true);setMessage("");
  try{const db=requireSupabase();await captureMessageScope(scope);if(scopeRef.current!==scope)return;const me={id:scope.owner};
   if(me.id===user)throw Error("No puedes seguir tu propio perfil.");
   const request=followed?db.from("profile_follows" as never).delete().eq("follower_id",me.id).eq("followed_id",user):db.from("profile_follows" as never).insert({follower_id:me.id,followed_id:user} as never);
   const {error}=await request;if(error)throw error;await assertMessageScope(scope);if(scopeRef.current===scope)setFollowed(!followed);
  }catch(e){setMessage(e instanceof Error?e.message:"No se pudo actualizar.");}finally{setBusy(false);}
 }
 function block(){
  onMenuClose?.();
  setTimeout(()=>setConfirm("block"),350);
 }
 async function confirmRemove(){
  const scope=scopeRef.current;
  if(!scope||scope.owner!==viewer||!contact||contact.status!=="accepted"){setConfirm(null);return;}
  setBusy(true);
  try{await removeContactRequest(contact.id,scope);const value=await contactState(user,scope);if(scopeRef.current===scope)setContact(value.request);}
  catch(e){setMessage(e instanceof Error?e.message:"No se pudo eliminar el contacto.");}
  finally{setBusy(false);setConfirm(null);}
 }
 async function confirmBlock(){
  const scope=scopeRef.current;if(!scope||scope.owner!==viewer)return;
  setBusy(true);
  try{
   const db=requireSupabase();await captureMessageScope(scope);if(scopeRef.current!==scope)return;const me={id:scope.owner};
   if(me.id===user)throw Error("No se puede bloquear este perfil.");
   const {error}=await db.from("blocks").insert({blocker_id:me.id,blocked_id:user});
   if(error)throw error;await assertMessageScope(scope);if(scopeRef.current===scope)setMessage("Perfil bloqueado.");
  }catch(e){setMessage(e instanceof Error?e.message:"No se pudo bloquear.");}
  finally{setBusy(false);setConfirm(null);}
 }
 return <View>
  <View style={{flexDirection:"row",gap:8,alignItems:"stretch"}}>
   <Pressable accessibilityRole="button" disabled={busy} onPress={()=>void toggleFollow()} style={{flex:1,minWidth:48,flexDirection:"row",justifyContent:"center",alignItems:"center",gap:5,paddingVertical:10,paddingHorizontal:5,minHeight:JOBEEN_CONTROL.touchTarget,borderRadius:JOBEEN_CONTROL.buttonRadius,backgroundColor:colors.ink}}>
    <Ionicons name={followed?"checkmark":"heart-outline"} size={18} color={colors.paper}/><Text numberOfLines={adaptive?undefined:1} adjustsFontSizeToFit={!adaptive} minimumFontScale={0.85} style={{flexShrink:1,color:colors.paper,fontWeight:adaptive?"500":"700",fontSize:adaptive?JOBEEN_TYPE.action:14,...(adaptive?{lineHeight:JOBEEN_LINE_HEIGHT.action}:{})}}>{followed?"Siguiendo":"Seguir"}</Text>
   </Pressable>
   <Pressable accessibilityRole="button" accessibilityLabel={contactLabel+" · "+name}
    disabled={busy} onPress={()=>void connect()} style={{flex:1,minWidth:48,flexDirection:"row",justifyContent:"center",alignItems:"center",gap:5,paddingVertical:10,paddingHorizontal:5,minHeight:JOBEEN_CONTROL.touchTarget,borderRadius:JOBEEN_CONTROL.buttonRadius,borderWidth:1,borderColor:jobeen.yellow,backgroundColor:jobeen.cream}}>
    <Ionicons name={contact?.status==="accepted"?"people":"person-add-outline"} size={18} color={jobeen.ink}/>
    <Text numberOfLines={adaptive?undefined:1} adjustsFontSizeToFit={!adaptive} minimumFontScale={0.75} style={{flexShrink:1,color:jobeen.ink,fontWeight:adaptive?"500":"700",fontSize:adaptive?JOBEEN_TYPE.action:14,...(adaptive?{lineHeight:JOBEEN_LINE_HEIGHT.action}:{})}}>{contactLabel}</Text>
   </Pressable>
   <Pressable accessibilityRole="button" accessibilityLabel={"Enviar mensaje a "+name} onPress={()=>router.push({pathname:"/message",params:{user,name}})} style={{width:JOBEEN_CONTROL.touchTarget,minHeight:JOBEEN_CONTROL.touchTarget,flexDirection:"row",justifyContent:"center",alignItems:"center",borderRadius:JOBEEN_CONTROL.buttonRadius,borderWidth:1,borderColor:jobeen.yellow,backgroundColor:jobeen.cream}}>
    <Ionicons name="paper-plane-outline" size={22} color={jobeen.ink}/>
   </Pressable>
  </View>
  <Modal visible={menuOpen} transparent animationType="fade" onRequestClose={()=>onMenuClose?.()}>
   <View style={{flex:1,backgroundColor:modal.scrim,paddingTop:insets.top+65,paddingHorizontal:16,alignItems:"flex-end"}}>
    <Pressable accessibilityLabel="Cerrar opciones del perfil" onPress={()=>onMenuClose?.()} style={StyleSheet.absoluteFill}/>
    <View style={{width:Math.min(330,width-32),padding:8,borderWidth:1,borderColor:modal.border,
     backgroundColor:modal.surface,borderRadius:modal.radius.popover,maxHeight:Math.max(0,height-insets.top-insets.bottom-81)}}>
     <ScrollView keyboardShouldPersistTaps="handled" style={{flexShrink:1}} contentContainerStyle={{gap:2}}>
     {onToggleSaved&&<SettingsMenuRow variant="action" title={savingJCard?"Actualizando…":savedJCard?"Quitar de mis JCards":visibleCardSide==="business"?"Guardar JCard empresarial":"Guardar JCard personal"} icon={savedJCard?"bookmark":"bookmark-outline"} disabled={savingJCard} onPress={()=>{onMenuClose?.();onToggleSaved();}}/>}
     {onSaveContact&&<SettingsMenuRow variant="action" title="Guardar contacto" icon="person-add-outline" onPress={()=>{onMenuClose?.();onSaveContact();}}/>}
     <SettingsMenuRow variant="action" title="Compartir perfil"
      icon="share-social-outline"
      onPress={()=>{onMenuClose?.();setTimeout(()=>setShareOpen(true),350);}}/>
     <SettingsMenuRow variant="action" tone="danger" title="Bloquear perfil"
      icon="ban-outline" onPress={block}/>
     <SettingsMenuRow variant="action" title="Denunciar perfil"
      icon="flag-outline"
      onPress={()=>{onMenuClose?.();router.push({pathname:"/report-profile",params:{user}});}}/>
     </ScrollView>
    </View>
   </View>
  </Modal>
  <JobeenShareSheet visible={shareOpen} onClose={()=>setShareOpen(false)} label={name} link={url} theme={theme}
   contentTitle="Compartir perfil" contentMessage={"JCard de "+name+" · "+url} onError={setMessage}/>
  <JobeenNoticeDialog visible={confirm!==null}
   title={confirm==="remove"?"Eliminar contacto":"Bloquear perfil"}
   description={confirm==="remove"?"La relación profesional se eliminará para ambos perfiles.":"Dejarás de ver e interactuar con este perfil."}
   tone="danger" confirmLabel={confirm==="remove"?"Eliminar":"Bloquear"}
   onCancel={()=>setConfirm(null)} onConfirm={()=>void (confirm==="remove"?confirmRemove():confirmBlock())} busy={busy}/>
  {!!message&&<Text accessibilityLiveRegion="polite" style={s.muted}>{message}</Text>}
 </View>;
}
