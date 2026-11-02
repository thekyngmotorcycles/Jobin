import {useEffect,useState} from "react";
import {Alert,Pressable,Share,Text,View} from "react-native";
import {Ionicons} from "@expo/vector-icons";
import {router} from "expo-router";
import {requireSupabase} from "../lib/supabase";
import {useUi} from "./ui";
export function ProfileCommunityActions({user,name,url}:{user:string;name:string;url:string}){
 const {s,colors}=useUi();const [followed,setFollowed]=useState(false);const [menu,setMenu]=useState(false);const [busy,setBusy]=useState(false);const [message,setMessage]=useState("");
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
  setMenu(false);
  Alert.alert("Bloquear perfil","Dejarás de ver e interactuar con este perfil.",[{text:"Cancelar",style:"cancel"},{text:"Bloquear",style:"destructive",onPress:()=>{void(async()=>{try{const db=requireSupabase();const {data:{user:me}}=await db.auth.getUser();if(!me||me.id===user)throw Error("No se puede bloquear este perfil.");const {error}=await db.from("blocks").insert({blocker_id:me.id,blocked_id:user});if(error)throw error;setMessage("Perfil bloqueado.");}catch(e){setMessage(e instanceof Error?e.message:"No se pudo bloquear.");}})();}}]);
 }
 return <View style={{gap:8,marginVertical:10}}>
  <View style={{flexDirection:"row",gap:9}}>
   <Pressable accessibilityRole="button" disabled={busy} onPress={()=>void toggleFollow()} style={{flex:1,flexDirection:"row",justifyContent:"center",alignItems:"center",gap:7,padding:13,borderRadius:12,backgroundColor:colors.ink}}>
    <Ionicons name={followed?"checkmark":"heart-outline"} size={19} color={colors.paper}/><Text style={{color:colors.paper,fontWeight:"700"}}>{followed?"Siguiendo":"Seguir"}</Text>
   </Pressable>
   <Pressable accessibilityRole="button" onPress={()=>setMessage("Las suscripciones pagadas estarán disponibles cuando habilitemos pagos y beneficios para creadores. No se realizará ningún cobro.")} style={{flex:1,flexDirection:"row",justifyContent:"center",alignItems:"center",gap:7,padding:13,borderRadius:12,borderWidth:1,borderColor:colors.line}}>
    <Ionicons name="star-outline" size={19} color={colors.ink}/><Text style={s.text}>Suscribirse</Text>
   </Pressable>
   <Pressable accessibilityRole="button" accessibilityLabel="Más opciones del perfil" onPress={()=>setMenu(v=>!v)} style={{padding:12,borderWidth:1,borderColor:colors.line,borderRadius:12}}><Ionicons name="ellipsis-horizontal" size={22} color={colors.ink}/></Pressable>
  </View>
  {menu&&<View style={{padding:10,borderWidth:1,borderColor:colors.line,borderRadius:12,gap:5}}>
   <Pressable accessibilityRole="button" onPress={()=>{setMenu(false);void Share.share({message:"JCard de "+name+" · "+url,url});}} style={{padding:12,flexDirection:"row",gap:12}}><Ionicons name="share-social-outline" size={21} color={colors.ink}/><Text style={s.text}>Compartir perfil</Text></Pressable>
   <Pressable accessibilityRole="button" onPress={()=>void block()} style={{padding:12,flexDirection:"row",gap:12}}><Ionicons name="ban-outline" size={21} color={colors.ink}/><Text style={s.text}>Bloquear perfil</Text></Pressable>
   <Pressable accessibilityRole="button" onPress={()=>{setMenu(false);router.push({pathname:"/report-profile",params:{user}});}} style={{padding:12,flexDirection:"row",gap:12}}><Ionicons name="flag-outline" size={21} color={colors.ink}/><Text style={s.text}>Denunciar perfil</Text></Pressable>
  </View>}
  {!!message&&<Text accessibilityLiveRegion="polite" style={s.muted}>{message}</Text>}
 </View>;
}
