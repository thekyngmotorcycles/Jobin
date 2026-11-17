import {Ionicons} from "@expo/vector-icons";
import {router,Stack,useFocusEffect} from "expo-router";
import {useCallback,useState} from "react";
import {ActivityIndicator,Alert,Modal,Pressable,ScrollView,Text,View} from "react-native";
import {SafeAreaView} from "react-native-safe-area-context";
import {AccountAvatar} from "../components/AccountAvatar";
import {blockMessageUser,decideMessageRequest,loadIncomingRequests,loadMessagePrivacy,reportMessageUser,saveMessagePrivacy,
 type MessagePrivacy,type MessageRequest} from "../lib/message-requests";
import {useTheme} from "../state/ThemeProvider";
import {jobeenTokens} from "../theme/jobeen";

type Filter="Solicitudes"|"Spam";
export default function MessageRequests(){
 const {theme}=useTheme(),t=jobeenTokens(theme);
 const [filter,setFilter]=useState<Filter>("Solicitudes");
 const [rows,setRows]=useState<MessageRequest[]>([]);
 const [privacy,setPrivacy]=useState<MessagePrivacy>({requestsFrom:"all",filterSpam:true});
 const [settingsOpen,setSettingsOpen]=useState(false);
 const [busy,setBusy]=useState("");const [saving,setSaving]=useState(false);
 const [loading,setLoading]=useState(true);const [error,setError]=useState("");
 const reload=useCallback(async()=>{
  setLoading(true);
  try{
   const [inbox,preferences]=await Promise.all([loadIncomingRequests(),loadMessagePrivacy()]);
   setRows(inbox);setPrivacy(preferences);setError("");
  }catch(e){setError(e instanceof Error?e.message:"No se pudieron cargar las solicitudes.");}
  finally{setLoading(false);}
 },[]);
 useFocusEffect(useCallback(()=>{void reload();},[reload]));
 async function accept(request:MessageRequest){
  setBusy(request.id);setError("");
  try{
   await decideMessageRequest(request.id,"accepted");
   setRows(items=>items.filter(x=>x.id!==request.id));
   router.push({pathname:"/message",params:{user:request.senderId,name:request.senderName}});
  }catch(e){setError(e instanceof Error?e.message:"No se pudo aceptar la solicitud.");}
  finally{setBusy("");}
 }
 async function dismiss(request:MessageRequest){
  setBusy(request.id);setError("");
  try{await decideMessageRequest(request.id,"declined");setRows(items=>items.filter(x=>x.id!==request.id));}
  catch(e){setError(e instanceof Error?e.message:"No se pudo eliminar la solicitud.");}
  finally{setBusy("");}
 }
 async function classify(request:MessageRequest){
  setBusy(request.id);setError("");
  try{await decideMessageRequest(request.id,"spam");await reload();}
  catch(e){setError(e instanceof Error?e.message:"No se pudo mover a Spam.");}
  finally{setBusy("");}
 }
 async function block(request:MessageRequest){
  setBusy(request.id);setError("");
  try{
   await blockMessageUser(request.senderId);
   if(request.status==="pending"||request.status==="spam")await decideMessageRequest(request.id,"declined");
   setRows(items=>items.filter(x=>x.id!==request.id));
  }catch(e){setError(e instanceof Error?e.message:"No se pudo bloquear al usuario.");}
  finally{setBusy("");}
 }
 function report(request:MessageRequest){
  Alert.alert("Reportar mensaje","Selecciona el motivo. Revisaremos el reporte antes de tomar medidas sobre la cuenta.",[
   {text:"Cancelar",style:"cancel"},
   ...([{label:"Spam",reason:"spam"},{label:"Estafa",reason:"estafa"},{label:"Acoso",reason:"acoso"}] as const).map(item=>({
    text:item.label,onPress:()=>{void(async()=>{
     setBusy(request.id);setError("");
     try{await reportMessageUser(request.senderId,item.reason);await decideMessageRequest(request.id,"reported");setRows(all=>all.filter(x=>x.id!==request.id));}
     catch(e){setError(e instanceof Error?e.message:"No se pudo reportar.");}
     finally{setBusy("");}
    })();}
   }))
  ]);
 }
 async function updatePrivacy(next:MessagePrivacy){
  if(saving)return;
  setSaving(true);setError("");
  try{await saveMessagePrivacy(next);setPrivacy(next);}
  catch(e){setError(e instanceof Error?e.message:"No se pudo actualizar la privacidad.");}
  finally{setSaving(false);}
 }
 const visible=rows.filter(x=>filter==="Solicitudes"?x.status==="pending":x.status==="spam"||x.status==="reported");
 const unreviewed=rows.filter(x=>x.status==="pending").length;
 return <>
  <Stack.Screen options={{title:"Solicitudes de mensajes"}}/>
  <SafeAreaView edges={["bottom"]} style={{flex:1,backgroundColor:t.bg}}>
   <ScrollView contentContainerStyle={{padding:16,paddingBottom:45,gap:15}} keyboardShouldPersistTaps="handled">
    <View style={{flexDirection:"row",justifyContent:"space-between",alignItems:"center"}}>
     <View style={{gap:3,flex:1}}>
      <Text style={{fontSize:20,fontWeight:"800",color:t.ink}}>Solicitudes de mensajes</Text>
      <Text style={{fontSize:13,color:t.ink2}}>Contactos que todavía no aceptaste</Text>
     </View>
     <Pressable accessibilityRole="button" accessibilityLabel="Privacidad de mensajes" onPress={()=>setSettingsOpen(true)} style={{width:45,height:45,borderRadius:16,alignItems:"center",justifyContent:"center",backgroundColor:t.surface,borderWidth:1,borderColor:t.line}}>
      <Ionicons name="settings-outline" size={22} color={t.ink}/>
     </Pressable>
    </View>
    <View style={{flexDirection:"row",gap:10}}>
     {(["Solicitudes","Spam"] as const).map(value=><Pressable key={value} accessibilityRole="tab" accessibilityState={{selected:filter===value}} onPress={()=>setFilter(value)}
      style={{flex:1,minHeight:47,flexDirection:"row",alignItems:"center",justifyContent:"center",gap:7,
       borderRadius:16,backgroundColor:filter===value?t.cream:t.surface,borderWidth:1,borderColor:filter===value?t.yellow:t.line}}>
      <Ionicons name={value==="Spam"?"shield-outline":"mail-unread-outline"} size={20} color={t.ink}/>
      <Text style={{fontSize:14,fontWeight:filter===value?"800":"600",color:t.ink}}>{value}</Text>
      {value==="Solicitudes"&&unreviewed>0&&<Text style={{fontSize:12,color:t.ink}}>({unreviewed})</Text>}
     </Pressable>)}
    </View>
    {!!error&&<Text accessibilityLiveRegion="polite" style={{fontSize:13,color:t.ink}}>{error}</Text>}
    {loading?<ActivityIndicator color={t.yellow}/>:visible.length===0?<View style={{backgroundColor:t.surface,padding:24,gap:12,borderWidth:1,borderColor:t.line,borderRadius:20,alignItems:"center"}}>
     <Ionicons name={filter==="Spam"?"shield-checkmark-outline":"mail-open-outline"} size={36} color={t.ink2}/>
     <Text style={{color:t.ink,fontSize:16,fontWeight:"800"}}>{filter==="Spam"?"No hay mensajes marcados como spam":"No hay nuevas solicitudes"}</Text>
     <Text style={{color:t.ink2,textAlign:"center",fontSize:13,lineHeight:19}}>{filter==="Spam"?"Los mensajes potencialmente no deseados se mostrarán aquí. Podrás recuperarlos.":"Los nuevos contactos aparecerán aquí antes de entrar a tus chats."}</Text>
    </View>:visible.map(request=><View key={request.id} style={{padding:13,borderRadius:20,backgroundColor:t.surface,borderWidth:1,borderColor:t.line,gap:12}}>
     <View style={{flexDirection:"row",alignItems:"center",gap:11}}>
      <AccountAvatar accountId={request.senderId} fallbackName={request.senderName} size={46}/>
      <View style={{flex:1,gap:2}}>
       <Text numberOfLines={1} style={{color:t.ink,fontSize:15,fontWeight:"800"}}>{request.senderName}</Text>
       <Text style={{color:t.ink2,fontSize:11}}>{new Date(request.createdAt).toLocaleDateString("es")}</Text>
      </View>
      {request.status==="spam"&&<Ionicons name="shield-outline" size={22} color={t.ink2}/>}
     </View>
     <Text style={{fontSize:14,lineHeight:21,color:t.ink}}>{request.body}</Text>
     <Text style={{fontSize:12,color:t.ink2}}>Si aceptás, esta conversación pasará a Chats. No se han habilitado archivos ni llamadas.</Text>
     <View style={{flexDirection:"row",gap:8}}>
      <Pressable accessibilityRole="button" disabled={busy===request.id} onPress={()=>void accept(request)}
       style={{flex:1,minHeight:44,borderRadius:14,backgroundColor:t.ink,alignItems:"center",justifyContent:"center",opacity:busy===request.id?0.5:1}}>
       <Text style={{color:t.bg,fontWeight:"800"}}>Aceptar</Text>
      </Pressable>
      <Pressable accessibilityRole="button" disabled={busy===request.id}
       onPress={()=>Alert.alert("Eliminar solicitud","La persona no podrá enviarte otra solicitud sin tu autorización.",[
        {text:"Cancelar",style:"cancel"},{text:"Eliminar",style:"destructive",onPress:()=>void dismiss(request)}])}
       style={{flex:1,minHeight:44,borderRadius:14,borderWidth:1,borderColor:t.line,backgroundColor:t.bg,alignItems:"center",justifyContent:"center"}}>
       <Text style={{color:t.ink,fontWeight:"700"}}>Eliminar</Text>
      </Pressable>
     </View>
     <View style={{flexDirection:"row",gap:10,alignItems:"center",justifyContent:"space-between"}}>
      {request.status==="pending"&&<Pressable accessibilityRole="button" disabled={busy===request.id} onPress={()=>void classify(request)} style={{padding:9,flexDirection:"row",gap:6,alignItems:"center"}}>
       <Ionicons name="shield-outline" size={18} color={t.ink2}/><Text style={{color:t.ink2,fontSize:12}}>Mover a Spam</Text>
      </Pressable>}
      <Pressable accessibilityRole="button" disabled={busy===request.id}
       onPress={()=>Alert.alert("Bloquear usuario","Esta cuenta no podrá volver a enviarte mensajes.",[
        {text:"Cancelar",style:"cancel"},{text:"Bloquear",style:"destructive",onPress:()=>void block(request)}])}
       style={{padding:9,flexDirection:"row",gap:5,alignItems:"center"}}>
       <Ionicons name="ban-outline" color={t.ink2} size={17}/><Text style={{color:t.ink2,fontSize:12}}>Bloquear</Text>
      </Pressable>
      <Pressable accessibilityRole="button" disabled={busy===request.id} onPress={()=>report(request)} style={{padding:9,flexDirection:"row",gap:5,alignItems:"center"}}>
       <Ionicons name="flag-outline" color={t.ink2} size={17}/><Text style={{color:t.ink2,fontSize:12}}>Reportar</Text>
      </Pressable>
     </View>
    </View>)}
   </ScrollView>
   <Modal visible={settingsOpen} transparent animationType="slide" onRequestClose={()=>setSettingsOpen(false)}>
    <View style={{flex:1,backgroundColor:"rgba(0,0,0,0.45)",justifyContent:"flex-end"}}>
     <Pressable accessibilityRole="button" accessibilityLabel="Cerrar configuración de mensajes" onPress={()=>setSettingsOpen(false)} style={{flex:1}}/>
     <View style={{backgroundColor:t.bg,borderTopLeftRadius:24,borderTopRightRadius:24,padding:20,gap:14,paddingBottom:32}}>
      <View style={{flexDirection:"row",justifyContent:"space-between",alignItems:"center"}}>
       <Text style={{color:t.ink,fontSize:19,fontWeight:"800"}}>Privacidad de mensajes</Text>
       <Pressable accessibilityRole="button" accessibilityLabel="Cerrar" onPress={()=>setSettingsOpen(false)} style={{padding:7}}><Ionicons name="close" size={25} color={t.ink}/></Pressable>
      </View>
      <Text style={{color:t.ink2,fontSize:13}}>¿Quién puede enviarte una nueva solicitud?</Text>
      {([{id:"all",label:"Cualquier usuario"},{id:"following",label:"Solo personas que sigo"},{id:"none",label:"Nadie"}] as const).map(option=><Pressable key={option.id} accessibilityRole="radio"
       accessibilityState={{checked:privacy.requestsFrom===option.id}} onPress={()=>void updatePrivacy({...privacy,requestsFrom:option.id})}
       style={{minHeight:45,flexDirection:"row",gap:10,alignItems:"center",borderWidth:1,borderRadius:15,borderColor:privacy.requestsFrom===option.id?t.yellow:t.line,backgroundColor:privacy.requestsFrom===option.id?t.cream:t.surface,paddingHorizontal:12}}>
       <Ionicons name={privacy.requestsFrom===option.id?"radio-button-on":"radio-button-off"} size={21} color={t.ink}/>
       <Text style={{color:t.ink,fontSize:14}}>{option.label}</Text>
      </Pressable>)}
      <Pressable accessibilityRole="switch" accessibilityState={{checked:privacy.filterSpam}} onPress={()=>void updatePrivacy({...privacy,filterSpam:!privacy.filterSpam})}
       style={{minHeight:52,paddingHorizontal:12,borderRadius:15,backgroundColor:t.surface,borderWidth:1,borderColor:t.line,flexDirection:"row",alignItems:"center",gap:10}}>
       <Text style={{flex:1,color:t.ink,fontWeight:"700"}}>Filtrar automáticamente mensajes sospechosos</Text>
       <Ionicons name={privacy.filterSpam?"toggle":"toggle-outline"} size={32} color={t.ink}/>
      </Pressable>
      <Text style={{color:t.ink2,fontSize:12,lineHeight:18}}>El filtrado usa reglas de comportamiento y contenido; no supone que una persona desconocida sea spam. Los reportes no generan sanciones automáticas.</Text>
      {saving&&<ActivityIndicator color={t.yellow}/>}
     </View>
    </View>
   </Modal>
  </SafeAreaView>
 </>;
}
