import {jobeenTokens} from "../theme/jobeen";
import {jcardCommon} from "../theme/jcard";
import {useCallback,useEffect,useState} from "react";
import {Alert,Modal,Pressable,StyleSheet,Text,View} from "react-native";
import {useSafeAreaInsets} from "react-native-safe-area-context";
import {Ionicons} from "@expo/vector-icons";
import {router,useFocusEffect} from "expo-router";
import {contactState,inviteContact,replyContactRequest,removeContactRequest,type ContactRequest} from "../lib/professional-contacts";
import {requireSupabase} from "../lib/supabase";
import {useUi} from "./ui";
import {useTheme} from "../state/ThemeProvider";
import {JobeenShareSheet} from "./JCardShareSheet";
export function ProfileCommunityActions({user,name,url,menuOpen=false,onMenuClose}:{user:string;name:string;url:string;menuOpen?:boolean;onMenuClose?:()=>void}){
 const {s,colors}=useUi();const {theme}=useTheme();const insets=useSafeAreaInsets();const jobeen=jobeenTokens("light");const [shareOpen,setShareOpen]=useState(false);const [followed,setFollowed]=useState(false);const [busy,setBusy]=useState(false);const [message,setMessage]=useState("");
 const [contact,setContact]=useState<ContactRequest|null>(null),[viewer,setViewer]=useState("");
 useFocusEffect(useCallback(()=>{let active=true;void contactState(user).then(value=>{if(active){setContact(value.request);setViewer(value.mine);}}).catch(()=>{if(active)setContact(null);});return()=>{active=false;};},[user]));
 async function connect(){
  if(busy)return;
  setBusy(true);setMessage("");
  try{
   if(!contact)await inviteContact(user);
   else if(contact.status==="pending"&&contact.recipient_id===viewer)await replyContactRequest(contact.id,true);
   else if(contact.status==="pending"&&contact.requester_id===viewer)await removeContactRequest(contact.id);
   else if(contact.status==="accepted"){
    setBusy(false);
    Alert.alert("Eliminar contacto","La relación profesional se eliminará para ambos perfiles.",[
     {text:"Cancelar",style:"cancel"},{text:"Eliminar",style:"destructive",onPress:()=>{void (async()=>{
      setBusy(true);try{await removeContactRequest(contact.id);const value=await contactState(user);setContact(value.request);}
      catch(e){setMessage(e instanceof Error?e.message:"No se pudo eliminar el contacto.");}finally{setBusy(false);}
     })();}}
    ]);
    return;
   }else if(contact.status==="declined"){await removeContactRequest(contact.id);await inviteContact(user);}
   const value=await contactState(user);setContact(value.request);
  }catch(e){setMessage(e instanceof Error?e.message:"No se pudo gestionar el contacto.");}
  finally{setBusy(false);}
 }
 const contactLabel=!contact?"Conectar":contact.status==="accepted"?"Contacto":contact.status==="declined"?"Solicitar de nuevo":
  contact.recipient_id===viewer?"Aceptar":"Pendiente";
 useEffect(()=>{let active=true;void(async()=>{try{const db=requireSupabase();const {data:{user:me}}=await db.auth.getUser();if(!me||me.id===user)return;const {data}=await db.from("profile_follows" as never).select("followed_id").eq("follower_id",me.id).eq("followed_id",user).maybeSingle();if(active)setFollowed(!!data);}catch{}})();return()=>{active=false;};},[user]);
 async function toggleFollow(){
  setBusy(true);setMessage("");
  try{const db=requireSupabase();const {data:{user:me}}=await db.auth.getUser();if(!me)throw Error("Inicia sesión para seguir a este profesional.");
   if(me.id===user)throw Error("No puedes seguir tu propio perfil.");
   const request=followed?db.from("profile_follows" as never).delete().eq("follower_id",me.id).eq("followed_id",user):db.from("profile_follows" as never).insert({follower_id:me.id,followed_id:user} as never);
   const {error}=await request;if(error)throw error;setFollowed(!followed);
  }catch(e){setMessage(e instanceof Error?e.message:"No se pudo actualizar.");}finally{setBusy(false);}
 }
 async function block(){
  onMenuClose?.();
  Alert.alert("Bloquear perfil","Dejarás de ver e interactuar con este perfil.",[{text:"Cancelar",style:"cancel"},{text:"Bloquear",style:"destructive",onPress:()=>{void(async()=>{try{const db=requireSupabase();const {data:{user:me}}=await db.auth.getUser();if(!me||me.id===user)throw Error("No se puede bloquear este perfil.");const {error}=await db.from("blocks").insert({blocker_id:me.id,blocked_id:user});if(error)throw error;setMessage("Perfil bloqueado.");}catch(e){setMessage(e instanceof Error?e.message:"No se pudo bloquear.");}})();}}]);
 }
 return <View style={{gap:8,marginVertical:10}}>
  <View style={{flexDirection:"row",gap:10,alignItems:"center"}}>
   <Pressable accessibilityRole="button" disabled={busy} onPress={()=>void toggleFollow()} style={{flex:1,flexDirection:"row",justifyContent:"center",alignItems:"center",gap:6,paddingVertical:13,paddingHorizontal:8,minHeight:52,borderRadius:13,backgroundColor:colors.ink}}>
    <Ionicons name={followed?"checkmark":"heart-outline"} size={17} color={colors.paper}/><Text numberOfLines={1} style={{color:colors.paper,fontWeight:"700",fontSize:14}}>{followed?"Siguiendo":"Seguir"}</Text>
   </Pressable>
   <Pressable accessibilityRole="button" accessibilityLabel={contactLabel+" · "+name}
    disabled={busy} onPress={()=>void connect()} style={{flex:1,flexDirection:"row",justifyContent:"center",alignItems:"center",gap:6,paddingVertical:13,paddingHorizontal:8,minHeight:52,borderRadius:13,borderWidth:1,borderColor:jobeen.yellow,backgroundColor:jobeen.cream}}>
    <Ionicons name={contact?.status==="accepted"?"people":"person-add-outline"} size={17} color={jobeen.ink}/>
    <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75} style={{color:jobeen.ink,fontWeight:"700",fontSize:14}}>{contactLabel}</Text>
   </Pressable>
   <Pressable accessibilityRole="button" accessibilityLabel={"Enviar mensaje a "+name} onPress={()=>router.push({pathname:"/message",params:{user,name}})} style={{width:52,height:52,flexDirection:"row",justifyContent:"center",alignItems:"center",borderRadius:13,borderWidth:1,borderColor:jobeen.yellow,backgroundColor:jobeen.cream}}>
    <Ionicons name="paper-plane-outline" size={22} color={jobeen.ink}/>
   </Pressable>
  </View>
  <Modal visible={menuOpen} transparent animationType="fade" onRequestClose={()=>onMenuClose?.()}>
   <View style={{flex:1,backgroundColor:jcardCommon.scrim,paddingTop:insets.top+65,paddingHorizontal:16,alignItems:"flex-end"}}>
    <Pressable accessibilityLabel="Cerrar opciones del perfil" onPress={()=>onMenuClose?.()} style={StyleSheet.absoluteFill}/>
    <View style={{width:260,maxWidth:"85%",padding:10,borderWidth:1,borderColor:colors.line,backgroundColor:colors.paper,borderRadius:14,gap:5}}>
   <Pressable accessibilityRole="button" onPress={()=>{onMenuClose?.();setTimeout(()=>setShareOpen(true),350);}} style={{padding:12,flexDirection:"row",gap:12}}><Ionicons name="share-social-outline" size={21} color={colors.ink}/><Text style={s.text}>Compartir perfil</Text></Pressable>
   <Pressable accessibilityRole="button" onPress={()=>void block()} style={{padding:12,flexDirection:"row",gap:12}}><Ionicons name="ban-outline" size={21} color={colors.ink}/><Text style={s.text}>Bloquear perfil</Text></Pressable>
   <Pressable accessibilityRole="button" onPress={()=>{onMenuClose?.();router.push({pathname:"/report-profile",params:{user}});}} style={{padding:12,flexDirection:"row",gap:12}}><Ionicons name="flag-outline" size={21} color={colors.ink}/><Text style={s.text}>Denunciar perfil</Text></Pressable>
    </View>
   </View>
  </Modal>
  <JobeenShareSheet visible={shareOpen} onClose={()=>setShareOpen(false)} label={name} link={url} theme={theme}
   contentTitle="Compartir perfil" contentMessage={"JCard de "+name+" · "+url} onError={setMessage}/>
  {!!message&&<Text accessibilityLiveRegion="polite" style={s.muted}>{message}</Text>}
 </View>;
}
