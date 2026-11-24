import {Ionicons} from "@expo/vector-icons";
import {router,useFocusEffect} from "expo-router";
import {useCallback,useEffect,useImperativeHandle,useRef,useState,type Ref} from "react";
import {ActivityIndicator,Alert,Pressable,Text,TextInput,View} from "react-native";
import {requireSupabase} from "../lib/supabase";
import {assertMessageScope,captureMessageScope,type MessageScope} from "../lib/message-session";
import {contactCount,myContacts,replyContactRequest,removeContactRequest,type ContactPerson} from "../lib/professional-contacts";
import {useUi} from "./ui";
import {BottomSheet} from "./social-ui";
import {AccountAvatar} from "./AccountAvatar";
import {jobeenTokens} from "../theme/jobeen";
import {useTheme} from "../state/ThemeProvider";

type ListType="followers"|"following"|"contacts";
type Connection={id:string;name:string;following:boolean};
export type ProfileContactsHandle={openContacts:(expectedOwner:string)=>void};
export function ProfileFollowCounts({userId,refreshKey=0,contactsMenuRef}:{userId:string;refreshKey?:number;contactsMenuRef?:Ref<ProfileContactsHandle>}){
 const {colors,s}=useUi();const {theme}=useTheme();const jt=jobeenTokens(theme);
 const scopeRef=useRef<MessageScope|null>(null),countRevision=useRef(0),listRevision=useRef(0);
 const [viewer,setViewer]=useState("");
 const [counts,setCounts]=useState<{followers:number;following:number;contacts:number}|null>(null);
 const [sheet,setSheet]=useState(false);
 const [tab,setTab]=useState<ListType>("followers");
 const [rows,setRows]=useState<Connection[]>([]);
 const [contactRows,setContactRows]=useState<ContactPerson[]>([]);
 const [query,setQuery]=useState("");
 const [loading,setLoading]=useState(false);
 const [busy,setBusy]=useState("");
 const [error,setError]=useState("");
 const refreshCounts=useCallback(async()=>{
  const generation=++countRevision.current;
  if(!userId)return;
  try{
   const db=requireSupabase();
   const scope=await captureMessageScope();
   const [followers,following,contacts]=await Promise.all([
    db.from("profile_follows" as never).select("*",{head:true,count:"exact"}).eq("followed_id",userId),
    db.from("profile_follows" as never).select("*",{head:true,count:"exact"}).eq("follower_id",userId),
    contactCount(userId)
   ]);
   if(followers.error||following.error)throw new Error("No se pudieron cargar los contadores.");
   await assertMessageScope(scope);
   if(countRevision.current===generation){scopeRef.current=scope;setViewer(scope.owner);setCounts({followers:followers.count??0,following:following.count??0,contacts});}
  }catch{if(countRevision.current===generation){scopeRef.current=null;setViewer("");setCounts(null);}}
 },[userId]);
 useFocusEffect(useCallback(()=>{void refreshCounts();return()=>{scopeRef.current=null;countRevision.current++;listRevision.current++;setSheet(false);setRows([]);setContactRows([]);};},[refreshCounts]));
 useEffect(()=>{void refreshCounts();},[refreshCounts,refreshKey]);
 const isOwner=!!viewer&&viewer===userId;

 async function loadConnections(kind:ListType){
  const scope=scopeRef.current,generation=++listRevision.current;
  if(!isOwner||!scope||scope.owner!==userId)return;
  const active=()=>listRevision.current===generation&&scopeRef.current?.session===scope.session;
  setLoading(true);setError("");setRows([]);setContactRows([]);
  try{
   await captureMessageScope(scope);
   if(kind==="contacts"){
    const contacts=await myContacts(scope);
    if(active())setContactRows(contacts);
    return;
   }
   const db=requireSupabase();
   const col=kind==="followers"?"followed_id":"follower_id";
   const other=kind==="followers"?"follower_id":"followed_id";
   const {data:links,error:linkError}=await db.from("profile_follows" as never)
    .select("follower_id,followed_id,created_at").eq(col,userId)
    .order("created_at",{ascending:false}).limit(200);
   if(linkError)throw linkError;
   const ids=(links??[]).map((item:any)=>item[other] as string);
   if(!ids.length){if(active())setRows([]);return;}
   await assertMessageScope(scope);
   const [names,following]=await Promise.all([
    db.from("profiles").select("id,display_name").in("id",ids),
    db.from("profile_follows" as never).select("followed_id").eq("follower_id",viewer)
   ]);
   if(names.error||following.error)throw names.error??following.error;
   const byId=new Map((names.data??[]).map(x=>[x.id,x.display_name]));
   const followed=new Set(((following.data??[]) as unknown as {followed_id:string}[]).map(x=>x.followed_id));
   await assertMessageScope(scope);
   if(active())setRows(ids.map(id=>({id,name:byId.get(id)??"Usuario de Jobeen",following:followed.has(id)})));
  }catch(e){if(active())setError(e instanceof Error?e.message:"No se pudieron cargar las conexiones.");}
  finally{if(active())setLoading(false);}
 }
 function openList(kind:ListType){
  if(!isOwner)return;
  setTab(kind);setQuery("");setSheet(true);void loadConnections(kind);
 }
 useImperativeHandle(contactsMenuRef,()=>({openContacts(expectedOwner){if(expectedOwner===userId&&isOwner&&scopeRef.current?.owner===expectedOwner)openList("contacts");}}));
 async function toggleFollow(person:Connection){
  const scope=scopeRef.current;if(!scope||scope.owner!==viewer||scope.owner!==userId)return;
  setError("");
  try{
   const db=requireSupabase();
   await captureMessageScope(scope);
   if(scopeRef.current?.session!==scope.session)return;
   const request=person.following?
    db.from("profile_follows" as never).delete().eq("follower_id",viewer).eq("followed_id",person.id):
    db.from("profile_follows" as never).insert({follower_id:viewer,followed_id:person.id} as never);
   const {error:followError}=await request;
   if(followError)throw followError;
   await assertMessageScope(scope);
   if(scopeRef.current?.session!==scope.session)return;
   setRows(current=>current.map(row=>row.id===person.id?{...row,following:!person.following}:row));
   void refreshCounts();
  }catch(e){setError(e instanceof Error?e.message:"No se pudo actualizar el seguimiento.");}
 }
 async function contactAction(person:ContactPerson,approve?:boolean,expectedScope=scopeRef.current){
  const scope=expectedScope;
  if(!scope||scopeRef.current?.session!==scope.session||scope.owner!==userId||busy)return;
  setBusy(person.requestId);setError("");
  try{
   if(person.direction==="incoming")await replyContactRequest(person.requestId,approve===true,scope);
   else await removeContactRequest(person.requestId,scope);
   if(scopeRef.current?.session!==scope.session)return;
   await loadConnections("contacts");
   await refreshCounts();
  }catch(e){setError(e instanceof Error?e.message:"No se pudo actualizar la relación profesional.");}
  finally{setBusy("");}
 }
 function confirmRemove(person:ContactPerson){
  const scope=scopeRef.current;if(!scope)return;
  Alert.alert("Eliminar contacto","Se eliminará la relación profesional para ambos perfiles.",[
   {text:"Cancelar",style:"cancel"},
   {text:"Eliminar",style:"destructive",onPress:()=>void contactAction(person,undefined,scope)}
  ]);
 }
 function changeTab(next:ListType){setTab(next);setQuery("");void loadConnections(next);}
 const visible=rows.filter(r=>r.name.toLowerCase().includes(query.trim().toLowerCase()));
 const visibleContacts=contactRows.filter(r=>r.name.toLowerCase().includes(query.trim().toLowerCase()));
 return <>
  <View style={{flexDirection:"row",alignItems:"center",justifyContent:"center",gap:15,paddingVertical:3,minHeight:44}}>
   {([{id:"followers",label:"Seguidores",value:counts?.followers},{id:"contacts",label:"Contactos",value:counts?.contacts}] as const).map((item,index)=>
    <View key={item.id} style={{flexDirection:"row",alignItems:"center",gap:15}}>
     {index>0&&<View style={{width:1,height:18,backgroundColor:jt.line}}/>}
     <Pressable accessibilityRole={isOwner?"button":undefined}
      accessibilityLabel={item.label+": "+(item.value??"no disponible")+(isOwner?", ver lista":"")}
      disabled={!isOwner} onPress={()=>openList(item.id)}
      style={{minHeight:44,flexDirection:"row",gap:5,alignItems:"center",justifyContent:"center",paddingHorizontal:2}}>
      <Text style={{fontSize:14,fontWeight:"800",color:colors.ink}}>{item.value===undefined?"—":new Intl.NumberFormat("es").format(item.value)}</Text>
      <Text style={{fontSize:13,color:colors.muted}}>{item.label}</Text>
     </Pressable>
    </View>)}
  </View>
  <BottomSheet visible={sheet} onClose={()=>setSheet(false)} title="Mi red">
   <View style={{gap:12,paddingVertical:8}}>
    <View style={{flexDirection:"row",gap:5}}>
     {(["followers","following","contacts"] as const).map(option=><Pressable key={option} accessibilityRole="tab" accessibilityState={{selected:tab===option}}
      onPress={()=>changeTab(option)} style={{flex:1,minHeight:44,borderRadius:12,borderWidth:1,borderColor:tab===option?colors.ink:colors.line,
       backgroundColor:tab===option?colors.accent:colors.paper,alignItems:"center",justifyContent:"center",paddingHorizontal:3}}>
      <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.85}
       style={{color:colors.ink,fontWeight:tab===option?"800":"600",fontSize:12}}>
       {option==="followers"?"Seguidores":option==="following"?"Siguiendo":"Contactos"}
      </Text>
     </Pressable>)}
    </View>
    <TextInput accessibilityLabel="Buscar en mi red" value={query} onChangeText={setQuery} placeholder="Buscar personas" placeholderTextColor={colors.muted}
     style={{minHeight:44,borderRadius:13,borderWidth:1,borderColor:colors.line,paddingHorizontal:12,color:colors.ink}}/>
    {tab==="contacts"&&<Text style={{color:colors.muted,fontSize:12,lineHeight:17}}>Los contactos se crean cuando ambas personas aceptan relacionarse. Seguir una cuenta no la convierte en contacto.</Text>}
    {loading&&<ActivityIndicator color={colors.ink}/>}
    {!!error&&<Text accessibilityLiveRegion="polite" style={s.muted}>{error}</Text>}
    {!loading&&!(tab==="contacts"?visibleContacts:visible).length&&<Text style={[s.muted,{paddingVertical:16,textAlign:"center"}]}>
     {query.trim()?"No se encontraron personas.":tab==="contacts"?"Aún no tienes contactos ni solicitudes.":"Todavía no hay personas en esta lista."}
    </Text>}
    {tab==="contacts"?visibleContacts.map(person=><View key={person.requestId} style={{flexDirection:"row",alignItems:"center",gap:7,minHeight:60}}>
     <Pressable accessibilityRole="button" accessibilityLabel={"Ver perfil de "+person.name}
      onPress={()=>{setSheet(false);router.push({pathname:"/jcard",params:{user:person.id}});}}
      style={{flex:1,flexDirection:"row",alignItems:"center",gap:8}}>
      <AccountAvatar accountId={person.id} fallbackName={person.name} size={38}/>
      <View style={{flex:1,gap:2}}>
       <Text numberOfLines={1} style={[s.text,{fontWeight:"700",fontSize:13}]}>{person.name}</Text>
       <Text style={{color:colors.muted,fontSize:11}}>{person.direction==="incoming"?"Solicita conectar":person.direction==="outgoing"?"Pendiente de aceptación":"Contacto profesional"}</Text>
      </View>
     </Pressable>
     {person.direction==="incoming"?<View style={{flexDirection:"row",gap:4}}>
      <Pressable accessibilityRole="button" accessibilityLabel={"Aceptar invitación de "+person.name} disabled={!!busy}
       onPress={()=>void contactAction(person,true)} style={{minHeight:44,paddingHorizontal:9,alignItems:"center",justifyContent:"center",borderRadius:12,backgroundColor:colors.ink}}>
       <Ionicons name="checkmark" size={18} color={colors.paper}/>
      </Pressable>
      <Pressable accessibilityRole="button" accessibilityLabel={"Rechazar invitación de "+person.name} disabled={!!busy}
       onPress={()=>void contactAction(person,false)} style={{minHeight:44,paddingHorizontal:9,alignItems:"center",justifyContent:"center",borderRadius:12,backgroundColor:colors.accent}}>
       <Ionicons name="close" size={18} color={colors.ink}/>
      </Pressable>
     </View>:<Pressable accessibilityRole="button" disabled={!!busy}
      accessibilityLabel={person.direction==="outgoing"?"Cancelar solicitud de "+person.name:"Eliminar contacto "+person.name}
      onPress={()=>person.direction==="outgoing"?void contactAction(person):confirmRemove(person)}
      style={{minHeight:44,paddingHorizontal:10,alignItems:"center",justifyContent:"center",borderRadius:12,borderWidth:1,borderColor:colors.line}}>
      <Text style={{fontSize:11,color:colors.ink,fontWeight:"600"}}>{person.direction==="outgoing"?"Cancelar":"Eliminar"}</Text>
     </Pressable>}
    </View>):visible.map(person=><View key={person.id} style={{flexDirection:"row",alignItems:"center",gap:9,minHeight:58}}>
     <Pressable accessibilityRole="button" accessibilityLabel={"Ver perfil de "+person.name} onPress={()=>{setSheet(false);router.push({pathname:"/jcard",params:{user:person.id}});}}
      style={{flex:1,flexDirection:"row",alignItems:"center",gap:10}}>
      <AccountAvatar accountId={person.id} fallbackName={person.name} size={40}/>
      <Text numberOfLines={1} style={[s.text,{fontWeight:"700",flex:1}]}>{person.name}</Text>
     </Pressable>
     <Pressable accessibilityRole="button" accessibilityLabel={person.following?"Dejar de seguir a "+person.name:"Seguir a "+person.name}
      onPress={()=>void toggleFollow(person)} style={{minHeight:42,paddingHorizontal:12,borderRadius:13,
       backgroundColor:person.following?colors.accent:colors.ink,alignItems:"center",justifyContent:"center"}}>
      <Text style={{fontSize:12,fontWeight:"700",color:person.following?colors.ink:colors.paper}}>{person.following?"Siguiendo":"Seguir"}</Text>
     </Pressable>
    </View>)}
    {tab!=="contacts"&&rows.length>=200&&<Text style={s.muted}>Mostrando las primeras 200 conexiones.</Text>}
    {tab==="contacts"&&contactRows.length>=300&&<Text style={s.muted}>Mostrando las primeras 300 relaciones.</Text>}
   </View>
  </BottomSheet>
 </>;
}
