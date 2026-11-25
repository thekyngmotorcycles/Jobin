import {Ionicons} from "@expo/vector-icons";
import {router,useFocusEffect} from "expo-router";
import {createContext,useContext,useCallback,useImperativeHandle,useRef,useState,type Ref,type ReactNode} from "react";
import {CardFlipInteractionContext} from "./BusinessCard3D";
import {ActivityIndicator,Pressable,Text,TextInput,View} from "react-native";
import {requireSupabase} from "../lib/supabase";
import {assertMessageScope,captureMessageScope,type MessageScope} from "../lib/message-session";
import {contactCount,myContacts,replyContactRequest,removeContactRequest,type ContactPerson} from "../lib/professional-contacts";
import {useUi} from "./ui";
import {BottomSheet} from "./social-ui";
import {JobeenNoticeDialog} from "./JobeenNoticeDialog";
import {JOBEEN_CONTROL} from "../theme/control-metrics";
import {JOBEEN_TYPE,JOBEEN_LINE_HEIGHT} from "../theme/typography";
import {AccountAvatar} from "./AccountAvatar";
import {jobeenTokens} from "../theme/jobeen";
import {useTheme} from "../state/ThemeProvider";

type ListType="followers"|"following"|"contacts";
type Connection={id:string;name:string;following:boolean};
export type ProfileContactsHandle={openContacts:(expectedOwner:string)=>void};
type CountSummary={followers:number|null;contacts:number};
const ProfileCountContext=createContext<{counts:CountSummary|null;isOwner:boolean;openList:(kind:ListType)=>void}|null>(null);
/** Two visual rows can share one provider; no network or private lists in either face. */
export function ProfileConnectionCountRow({ink,muted,line}:{ink?:string;muted?:string;line?:string}){
 const context=useContext(ProfileCountContext),markInteractive=useContext(CardFlipInteractionContext);
 const {colors}=useUi(),{theme}=useTheme(),jt=jobeenTokens(theme);
 if(!context)return null;
 const {counts,isOwner,openList}=context;
 return <View style={{flexDirection:"row",alignItems:"center",justifyContent:"center",gap:6,minHeight:JOBEEN_CONTROL.touchTarget}}>
  {([{id:"followers",label:"Seguidores",value:counts?.followers},{id:"contacts",label:"Contactos",value:counts?.contacts}] as const).map((item,index)=>
   <View key={item.id} style={{flex:1,minWidth:0,flexDirection:"row",alignItems:"center",gap:5}}>
    {index>0&&<View style={{width:1,height:18,backgroundColor:line??jt.line}}/>}
    <Pressable accessibilityRole={isOwner?"button":undefined} accessibilityLabel={item.label+": "+(item.value??"no disponible")+(isOwner?", ver lista":"")}
     disabled={!isOwner} onTouchStart={isOwner?()=>markInteractive?.():undefined} onPress={event=>{event.stopPropagation();openList(item.id);}}
     style={{flex:1,minWidth:0,minHeight:JOBEEN_CONTROL.touchTarget,flexDirection:"row",gap:4,alignItems:"center",justifyContent:"center",paddingHorizontal:2}}>
     <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.85} style={{fontSize:14,fontWeight:"800",color:ink??colors.ink,flexShrink:1}}>{item.value==null?"—":new Intl.NumberFormat("es").format(item.value)}</Text>
     <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.85} style={{fontSize:12,color:muted??colors.muted,flexShrink:1}}>{item.label}</Text>
    </Pressable>
   </View>)}
 </View>;
}

type ProfileFollowCountsProps={userId:string;refreshKey?:number;contactsMenuRef?:Ref<ProfileContactsHandle>;children?:ReactNode;countsInCard?:boolean;expectedScope?:MessageScope|null};
export function ProfileFollowCounts(props:ProfileFollowCountsProps){
 // A new target or verified session must never inherit a previous owner's sheet or rows.
 const key=JSON.stringify([props.userId,props.expectedScope?.owner??null,props.expectedScope?.session??null,!!props.countsInCard]);
 return <ScopedProfileFollowCounts key={key} {...props}/>;
}
function ScopedProfileFollowCounts({userId,refreshKey=0,contactsMenuRef,children,countsInCard=false,expectedScope}:ProfileFollowCountsProps){
 const {colors,s}=useUi();
 const scopeRef=useRef<MessageScope|null>(null),countRevision=useRef(0),listRevision=useRef(0);
 const [summary,setSummary]=useState<{target:string;viewer:string;followers:number|null;contacts:number}|null>(null);
 const counts=summary?.target===userId?summary:null;
 const viewer=counts?.viewer??"";
 const [sheet,setSheet]=useState(false);
 const [tab,setTab]=useState<ListType>("followers");
 const [rows,setRows]=useState<Connection[]>([]);
 const [contactRows,setContactRows]=useState<ContactPerson[]>([]);
 const [query,setQuery]=useState("");
 const [loading,setLoading]=useState(false);
 const [busy,setBusy]=useState("");
 const [error,setError]=useState("");
 const [pendingRemove,setPendingRemove]=useState<{person:ContactPerson;scope:MessageScope}|null>(null);
 const contactMutation=useRef<object|null>(null);
 const refreshCounts=useCallback(async()=>{
  const generation=++countRevision.current;
  if(!userId||(countsInCard&&!expectedScope))return;
  try{
   const db=requireSupabase();
   const scope=await captureMessageScope(expectedScope??undefined);
   // Only request the two counts actually rendered. Following is loaded on demand in My network.
   const [followers,contacts]=await Promise.all([
    db.from("profile_follows" as never).select("*",{head:true,count:"exact"}).eq("followed_id",userId),
    contactCount(userId)
   ]);
   if(followers.error)throw new Error("No se pudieron cargar los contadores.");
   await assertMessageScope(scope);
   if(countRevision.current===generation){scopeRef.current=scope;setSummary({target:userId,viewer:scope.owner,followers:followers.count,contacts});}
  }catch{if(countRevision.current===generation){scopeRef.current=null;setSummary(null);}}
 },[userId,countsInCard,expectedScope?.owner,expectedScope?.session]);
 // Focus and explicit refresh share one trigger; do not also request on mount.
 useFocusEffect(useCallback(()=>{void refreshCounts();return()=>{scopeRef.current=null;countRevision.current++;listRevision.current++;setSummary(null);setSheet(false);setPendingRemove(null);contactMutation.current=null;setBusy("");setRows([]);setContactRows([]);};},[refreshCounts,refreshKey]));
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
  if(!scope||scopeRef.current?.session!==scope.session||scope.owner!==userId||contactMutation.current)return false;
  const operation={};contactMutation.current=operation;setBusy(person.requestId);setError("");
  const active=()=>contactMutation.current===operation&&scopeRef.current?.session===scope.session;
  try{
   await captureMessageScope(scope);if(!active())return false;
   if(person.direction==="incoming")await replyContactRequest(person.requestId,approve===true,scope);
   else await removeContactRequest(person.requestId,scope);
   if(!active())return false;
   await loadConnections("contacts");
   if(!active())return false;
   await refreshCounts();
   return active();
  }catch(e){if(active())setError(e instanceof Error?e.message:"No se pudo actualizar la relación profesional.");return false;}
  finally{if(contactMutation.current===operation){contactMutation.current=null;setBusy("");}}
 }
 function confirmRemove(person:ContactPerson){
  const scope=scopeRef.current;if(!scope||scope.owner!==userId||person.direction!=="accepted"||contactMutation.current)return;
  setError("");setPendingRemove({person,scope});
 }
 async function removeConfirmed(){
  if(!pendingRemove)return;
  const request=pendingRemove,{person,scope}=request;
  if(await contactAction(person,undefined,scope))setPendingRemove(current=>current===request?null:current);
 }
 function changeTab(next:ListType){setTab(next);setQuery("");void loadConnections(next);}
 const visible=rows.filter(r=>r.name.toLowerCase().includes(query.trim().toLowerCase()));
 const visibleContacts=contactRows.filter(r=>r.name.toLowerCase().includes(query.trim().toLowerCase()));
 return <ProfileCountContext.Provider value={{counts,isOwner,openList}}>
  {children}
  {!countsInCard&&<ProfileConnectionCountRow/>}
  <BottomSheet visible={sheet&&!pendingRemove} onClose={()=>{if(!contactMutation.current)setSheet(false);}} title="Mi red">
   <View style={{gap:12,paddingVertical:8}}>
    <View style={{flexDirection:"row",gap:5}}>
     {(["followers","following","contacts"] as const).map(option=><Pressable key={option} accessibilityRole="tab" accessibilityState={{selected:tab===option}}
      onPress={()=>changeTab(option)} style={{flex:1,minHeight:JOBEEN_CONTROL.touchTarget,borderRadius:12,borderWidth:1,borderColor:tab===option?colors.ink:colors.line,
       backgroundColor:tab===option?colors.accent:colors.paper,alignItems:"center",justifyContent:"center",paddingHorizontal:3}}>
      <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.85}
       style={{color:colors.ink,fontWeight:tab===option?"800":"600",fontSize:12}}>
       {option==="followers"?"Seguidores":option==="following"?"Siguiendo":"Contactos"}
      </Text>
     </Pressable>)}
    </View>
    <TextInput accessibilityLabel="Buscar en mi red" value={query} onChangeText={setQuery} placeholder="Buscar personas" placeholderTextColor={colors.muted}
     style={{minHeight:JOBEEN_CONTROL.inputHeight,borderRadius:JOBEEN_CONTROL.inputRadius,borderWidth:1,borderColor:colors.outline,paddingHorizontal:12,color:colors.ink,fontSize:JOBEEN_TYPE.input,lineHeight:JOBEEN_LINE_HEIGHT.input}}/>
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
       onPress={()=>void contactAction(person,true)} style={{minHeight:JOBEEN_CONTROL.touchTarget,minWidth:JOBEEN_CONTROL.touchTarget,paddingHorizontal:9,alignItems:"center",justifyContent:"center",borderRadius:12,backgroundColor:colors.ink}}>
       <Ionicons name="checkmark" size={18} color={colors.paper}/>
      </Pressable>
      <Pressable accessibilityRole="button" accessibilityLabel={"Rechazar invitación de "+person.name} disabled={!!busy}
       onPress={()=>void contactAction(person,false)} style={{minHeight:JOBEEN_CONTROL.touchTarget,paddingHorizontal:9,alignItems:"center",justifyContent:"center",borderRadius:12,backgroundColor:colors.accent}}>
       <Ionicons name="close" size={18} color={colors.ink}/>
      </Pressable>
     </View>:<Pressable accessibilityRole="button" disabled={!!busy}
      accessibilityLabel={person.direction==="outgoing"?"Cancelar solicitud de "+person.name:"Eliminar contacto "+person.name}
      onPress={()=>person.direction==="outgoing"?void contactAction(person):confirmRemove(person)}
      style={{minHeight:JOBEEN_CONTROL.touchTarget,paddingHorizontal:10,alignItems:"center",justifyContent:"center",borderRadius:12,borderWidth:1,borderColor:colors.line}}>
      <Text style={{fontSize:JOBEEN_TYPE.action,color:colors.ink,fontWeight:"600"}}>{person.direction==="outgoing"?"Cancelar":"Eliminar"}</Text>
     </Pressable>}
    </View>):visible.map(person=><View key={person.id} style={{flexDirection:"row",alignItems:"center",gap:9,minHeight:58}}>
     <Pressable accessibilityRole="button" accessibilityLabel={"Ver perfil de "+person.name} onPress={()=>{setSheet(false);router.push({pathname:"/jcard",params:{user:person.id}});}}
      style={{flex:1,flexDirection:"row",alignItems:"center",gap:10}}>
      <AccountAvatar accountId={person.id} fallbackName={person.name} size={40}/>
      <Text numberOfLines={1} style={[s.text,{fontWeight:"700",flex:1}]}>{person.name}</Text>
     </Pressable>
     <Pressable accessibilityRole="button" accessibilityLabel={person.following?"Dejar de seguir a "+person.name:"Seguir a "+person.name}
      onPress={()=>void toggleFollow(person)} style={{minHeight:JOBEEN_CONTROL.touchTarget,paddingHorizontal:12,borderRadius:JOBEEN_CONTROL.buttonRadius,
       backgroundColor:person.following?colors.accent:colors.ink,alignItems:"center",justifyContent:"center"}}>
      <Text style={{fontSize:JOBEEN_TYPE.action,fontWeight:"700",color:person.following?colors.ink:colors.paper}}>{person.following?"Siguiendo":"Seguir"}</Text>
     </Pressable>
    </View>)}
    {tab!=="contacts"&&rows.length>=200&&<Text style={s.muted}>Mostrando las primeras 200 conexiones.</Text>}
    {tab==="contacts"&&contactRows.length>=300&&<Text style={s.muted}>Mostrando las primeras 300 relaciones.</Text>}
   </View>
  </BottomSheet>
  <JobeenNoticeDialog visible={sheet&&pendingRemove!==null} title="Eliminar contacto"
   description={error||"Se eliminará la relación profesional para ambos perfiles."} tone="danger" confirmLabel="Eliminar"
   busy={!!busy} onCancel={()=>{if(!contactMutation.current){setPendingRemove(null);setError("");}}} onConfirm={()=>void removeConfirmed()}/>
 </ProfileCountContext.Provider>;
}
