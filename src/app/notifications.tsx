import {Ionicons} from "@expo/vector-icons";
import {router,Stack,useFocusEffect} from "expo-router";
import {useCallback,useRef,useState,type ComponentProps} from "react";
import {ActivityIndicator,Pressable,ScrollView,Text,View} from "react-native";
import {SafeAreaView} from "react-native-safe-area-context";
import {useJobinNotices} from "../state/NoticeProvider";
import {cvRequests,respondCV,type CVRequest} from "../lib/cv-access";
import {myContacts,replyContactRequest,type ContactPerson} from "../lib/professional-contacts";
import {loadActivityNotifications,markActivityNotificationsRead,noticeDescription,type ActivityNotice} from "../lib/activity-notifications";
import {assertMessageScope,captureMessageScope,type MessageScope} from "../lib/message-session";
import {useTheme} from "../state/ThemeProvider";
import {jobeenTokens} from "../theme/jobeen";

type Tab="Todas"|"Solicitudes"|"Sistema";
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function payloadId(note:ActivityNotice,field:string){
 const value=note.payload[field];return typeof value==="string"&&uuid.test(value)?value:"";
}
function dateText(date:string){
 const d=new Date(date);
 return Number.isNaN(d.getTime())?"":d.toLocaleDateString("es",{day:"numeric",month:"short"});
}
export default function Notifications(){
 const {theme}=useTheme();const t=jobeenTokens(theme);
 const {notices:temporary,markActivityRead}=useJobinNotices();
 const scopeRef=useRef<MessageScope|null>(null),revision=useRef(0);
 const [tab,setTab]=useState<Tab>("Todas");
 const [items,setItems]=useState<ActivityNotice[]>([]);
 const [legacyCV,setLegacyCV]=useState<CVRequest[]>([]);
 const [pendingContacts,setPendingContacts]=useState<ContactPerson[]>([]);
 const [loading,setLoading]=useState(true),[error,setError]=useState(""),[busy,setBusy]=useState("");
 const load=useCallback(async()=>{
  const generation=++revision.current;scopeRef.current=null;setItems([]);setLegacyCV([]);setPendingContacts([]);setLoading(true);setError("");
  try{
   const scope=await captureMessageScope(),user={id:scope.owner};
   const [rows,requests,contacts]=await Promise.all([loadActivityNotifications(100,scope),cvRequests(scope),myContacts(scope)]);
   await assertMessageScope(scope);
   if(revision.current!==generation)return;
   scopeRef.current=scope;setItems(rows);
   setPendingContacts(contacts.filter(person=>person.direction==="incoming"));
   setLegacyCV(requests.filter(req=>req.owner_id===user.id&&req.status==="pending"&&
    !rows.some(n=>n.kind==="cv_request"&&payloadId(n,"request_id")===req.id)));
  }catch(e){if(revision.current===generation)setError(e instanceof Error?e.message:"No se pudieron cargar las notificaciones.");}
  finally{if(revision.current===generation)setLoading(false);}
 },[]);
 useFocusEffect(useCallback(()=>{void load();return()=>{revision.current++;scopeRef.current=null;};},[load]));
 async function markAll(){
  const scope=scopeRef.current;if(!scope)return;
  setBusy("all");
  try{
   await markActivityNotificationsRead(undefined,scope);
   if(scopeRef.current!==scope)return;
   setItems(current=>current.map(n=>({...n,readAt:n.readAt??new Date().toISOString()})));
   markActivityRead();
  }catch(e){setError(e instanceof Error?e.message:"No se pudieron marcar como leídas.");}
  finally{setBusy("");}
 }
 async function openNotice(n:ActivityNotice){
  const scope=scopeRef.current;if(!scope)return;
  try{await captureMessageScope(scope);}catch{return;}
  if(scopeRef.current!==scope)return;
  if(!n.readAt){
   try{await markActivityNotificationsRead([n.id],scope);if(scopeRef.current!==scope)return;setItems(current=>current.map(x=>x.id===n.id?{...x,readAt:new Date().toISOString()}:x));}
   catch(e){setError(e instanceof Error?e.message:"No se pudo marcar como leída.");}
  }
  try{await assertMessageScope(scope);}catch{return;}
  if(scopeRef.current!==scope)return;
  const actor=payloadId(n,"actor_id");
  const post=payloadId(n,"post_id");
  if((n.kind==="post_like"||n.kind==="post_comment")&&post)router.push({pathname:"/post/[id]",params:{id:post}});
  else if((n.kind==="new_follower"||n.kind==="contact_request"||n.kind==="contact_accepted")&&actor)router.push({pathname:"/jcard",params:{user:actor}});
  else if(n.kind==="cv_request")router.push({pathname:"/(tabs)/profile",params:{view:"cv"}});
  else if(n.kind==="cv_response"&&actor)router.push({pathname:"/jcard",params:{user:actor}});
  else if(n.kind==="message_request")router.push("/message-requests");
  else if(n.kind==="new_message"&&actor)router.push({pathname:"/message",params:{user:actor,name:n.actorName}});
  else if(n.kind==="identity_verification")router.push("/verify-identity");
 }
 async function respond(id:string,approve:boolean){
  const scope=scopeRef.current;
  if(!scope||busy||!legacyCV.some(r=>r.id===id&&r.owner_id===scope.owner&&r.status==="pending"))return;
  setBusy(id);setError("");
  try{await respondCV(id,approve,scope);if(scopeRef.current===scope)await load();}
  catch(e){setError(e instanceof Error?e.message:"No se pudo responder la solicitud.");}
  finally{setBusy("");}
 }
 async function respondContact(id:string,approve:boolean){
  const scope=scopeRef.current;
  if(!scope||busy||!pendingContacts.some(p=>p.requestId===id&&p.direction==="incoming"))return;
  setBusy(id);setError("");
  try{
   await replyContactRequest(id,approve,scope);
   if(scopeRef.current!==scope)return;
   const notices=items.filter(n=>n.kind==="contact_request"&&payloadId(n,"request_id")===id).map(n=>n.id);
   if(notices.length)await markActivityNotificationsRead(notices,scope);
   if(scopeRef.current===scope)await load();
  }catch(e){setError(e instanceof Error?e.message:"No se pudo responder la invitación.");}
  finally{setBusy("");}
 }
 const filtered=items.filter(n=>{
  const category=noticeDescription(n).category;
  return tab==="Todas"||tab==="Solicitudes"&&category==="requests"||tab==="Sistema"&&category==="system";
 });
 const unread=items.filter(n=>!n.readAt).length+temporary.filter(n=>!n.read).length;
 const pendingWithoutNotice=pendingContacts.filter(person=>!items.some(n=>n.kind==="contact_request"&&payloadId(n,"request_id")===person.requestId));
 return <>
  <Stack.Screen options={{title:"Notificaciones"}}/>
  <SafeAreaView edges={["bottom"]} style={{flex:1,backgroundColor:t.bg}}>
   <ScrollView contentContainerStyle={{paddingHorizontal:16,paddingTop:18,paddingBottom:40,gap:16}} showsVerticalScrollIndicator={false}>
    <View style={{flexDirection:"row",alignItems:"center",justifyContent:"space-between",gap:10}}>
     <View style={{flex:1,gap:3}}>
      <Text accessibilityRole="header" style={{fontSize:22,fontWeight:"800",color:t.ink}}>Notificaciones</Text>
      <Text style={{fontSize:13,color:t.ink2}}>{unread?unread+" sin leer":pendingContacts.length?"Solicitudes de contacto pendientes":"Todo al día"}</Text>
     </View>
     <Pressable accessibilityRole="button" accessibilityLabel="Marcar todas como leídas" disabled={!unread||busy==="all"} onPress={()=>void markAll()}
      style={{minHeight:44,alignItems:"center",justifyContent:"center",flexDirection:"row",gap:7,opacity:unread?1:0.45,paddingHorizontal:8}}>
      <Ionicons name="checkmark-done-outline" size={22} color={t.ink}/>
      <Text style={{fontSize:12,color:t.ink,fontWeight:"700"}}>Leer todas</Text>
     </Pressable>
    </View>
    <View accessibilityRole="tablist" style={{flexDirection:"row",gap:7}}>
     {(["Todas","Solicitudes","Sistema"] as const).map(option=><Pressable key={option} accessibilityRole="tab"
      accessibilityState={{selected:tab===option}} onPress={()=>setTab(option)}
      style={{flex:1,minHeight:43,borderWidth:1,borderColor:tab===option?t.yellow:t.line,
       borderRadius:15,backgroundColor:tab===option?t.cream:t.surface,alignItems:"center",justifyContent:"center"}}>
      <Text style={{fontSize:13,color:t.ink,fontWeight:tab===option?"800":"600"}}>{option}</Text>
     </Pressable>)}
    </View>
    {loading&&<ActivityIndicator color={t.yellow}/>}
    {!!error&&<Text accessibilityLiveRegion="polite" style={{color:t.ink,fontSize:13}}>{error}</Text>}
    {!loading&&tab!=="Sistema"&&legacyCV.map(req=><View key={"legacy-"+req.id} style={{borderRadius:17,borderWidth:1,borderColor:t.line,backgroundColor:t.surface,padding:14,gap:12}}>
     <Text style={{color:t.ink,fontWeight:"700",fontSize:15}}>Nueva solicitud de historial profesional</Text>
     <Text style={{color:t.ink2,fontSize:13}}>Una cuenta quiere consultar tu CV.</Text>
     <View style={{flexDirection:"row",gap:9}}>
      <Pressable accessibilityRole="button" disabled={busy===req.id} onPress={()=>void respond(req.id,true)} style={{flex:1,minHeight:44,borderRadius:12,backgroundColor:t.ink,alignItems:"center",justifyContent:"center"}}><Text style={{color:t.bg,fontWeight:"700"}}>Autorizar</Text></Pressable>
      <Pressable accessibilityRole="button" disabled={busy===req.id} onPress={()=>void respond(req.id,false)} style={{flex:1,minHeight:44,borderRadius:12,borderWidth:1,borderColor:t.line,alignItems:"center",justifyContent:"center"}}><Text style={{color:t.ink,fontWeight:"700"}}>Rechazar</Text></Pressable>
     </View>
    </View>)}
    {!loading&&tab!=="Sistema"&&pendingWithoutNotice.map(person=><View key={"contact-"+person.requestId}
      style={{borderRadius:17,borderWidth:1,borderColor:t.line,backgroundColor:t.surface,padding:14,gap:9}}>
     <Text style={{color:t.ink,fontWeight:"700",fontSize:14}}>{person.name+" quiere ser tu contacto profesional"}</Text>
     <View style={{flexDirection:"row",gap:9}}>
      <Pressable accessibilityRole="button" accessibilityLabel={"Aceptar contacto de "+person.name} disabled={!!busy}
       onPress={()=>void respondContact(person.requestId,true)}
       style={{flex:1,minHeight:44,borderRadius:12,backgroundColor:t.ink,alignItems:"center",justifyContent:"center"}}>
       <Text style={{color:t.surface,fontWeight:"700"}}>Aceptar</Text>
      </Pressable>
      <Pressable accessibilityRole="button" accessibilityLabel={"Rechazar contacto de "+person.name} disabled={!!busy}
       onPress={()=>void respondContact(person.requestId,false)}
       style={{flex:1,minHeight:44,borderRadius:12,borderWidth:1,borderColor:t.line,alignItems:"center",justifyContent:"center"}}>
       <Text style={{color:t.ink,fontWeight:"700"}}>Rechazar</Text>
      </Pressable>
     </View>
    </View>)}
    {!loading&&filtered.map(n=>{
     const details=noticeDescription(n);
     const icon:ComponentProps<typeof Ionicons>["name"]=n.kind==="new_follower"?"person-add-outline":
      n.kind==="post_like"?"heart-outline":n.kind==="post_comment"?"chatbubble-outline":
      n.kind==="message_request"||n.kind==="new_message"?"mail-unread-outline":
      n.kind==="cv_request"||n.kind==="cv_response"?"document-text-outline":n.kind==="contact_request"||n.kind==="contact_accepted"?"people-outline":"shield-checkmark-outline";
     const pendingContact=n.kind==="contact_request"?
      pendingContacts.find(person=>person.requestId===payloadId(n,"request_id")):undefined;
     return <View key={n.id} style={{gap:7}}><Pressable accessibilityRole="button" accessibilityLabel={details.title+", "+(n.readAt?"leída":"sin leer")}
      onPress={()=>void openNotice(n)}
      style={({pressed})=>({minHeight:83,flexDirection:"row",alignItems:"center",gap:12,padding:12,
       borderRadius:17,borderWidth:1,borderColor:t.line,backgroundColor:pressed?t.cream:n.readAt?t.surface:t.cream})}>
      <View style={{width:43,height:43,borderRadius:22,backgroundColor:t.surface,alignItems:"center",justifyContent:"center"}}>
       <Ionicons name={icon} size={21} color={t.ink}/>
      </View>
      <View style={{flex:1,gap:4}}>
       <Text style={{color:t.ink,fontSize:14,fontWeight:n.readAt?"600":"800",lineHeight:20}}>{details.title}</Text>
       <Text numberOfLines={2} style={{color:t.ink2,fontSize:12}}>{details.detail}</Text>
       <Text style={{color:t.ink2,fontSize:11}}>{dateText(n.createdAt)}</Text>
      </View>
      {!n.readAt&&<View style={{width:8,height:8,borderRadius:4,backgroundColor:t.yellow}}/>}
     </Pressable>
     {!!pendingContact&&<View style={{flexDirection:"row",gap:8,marginLeft:56}}>
      <Pressable accessibilityRole="button" accessibilityLabel={"Aceptar solicitud de "+pendingContact.name}
       disabled={!!busy} onPress={()=>void respondContact(pendingContact.requestId,true)}
       style={{flex:1,minHeight:44,borderRadius:12,backgroundColor:t.ink,alignItems:"center",justifyContent:"center"}}>
       <Text style={{fontSize:12,color:t.surface,fontWeight:"700"}}>Aceptar</Text>
      </Pressable>
      <Pressable accessibilityRole="button" accessibilityLabel={"Rechazar solicitud de "+pendingContact.name}
       disabled={!!busy} onPress={()=>void respondContact(pendingContact.requestId,false)}
       style={{flex:1,minHeight:44,borderRadius:12,borderWidth:1,borderColor:t.line,alignItems:"center",justifyContent:"center"}}>
       <Text style={{fontSize:12,color:t.ink,fontWeight:"700"}}>Rechazar</Text>
      </Pressable>
     </View>}
     </View>;
    })}
    {!loading&&tab!=="Solicitudes"&&temporary.filter(n=>tab==="Todas"||tab==="Sistema").map(n=><View key={"local-"+n.id} style={{borderRadius:17,padding:14,backgroundColor:t.surface,borderWidth:1,borderColor:t.line,gap:5}}>
     <Text style={{color:t.ink,fontWeight:"700"}}>{n.title}</Text><Text style={{color:t.ink2,fontSize:13}}>{n.detail}</Text>
    </View>)}
    {!loading&&filtered.length===0&&(tab!=="Solicitudes"||legacyCV.length===0)&&!pendingWithoutNotice.length&&!(tab==="Todas"&&temporary.length)&&<View style={{alignItems:"center",paddingVertical:36,gap:11}}>
     <Ionicons name="notifications-off-outline" size={34} color={t.ink2}/>
     <Text style={{color:t.ink,fontSize:16,fontWeight:"700"}}>No hay notificaciones</Text>
     <Text style={{color:t.ink2,fontSize:13,textAlign:"center"}}>Las novedades de tu cuenta aparecerán aquí.</Text>
    </View>}
   </ScrollView>
  </SafeAreaView>
 </>;
}
