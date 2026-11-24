import {useCallback,useRef,useState} from "react";
import {ActivityIndicator,Image,KeyboardAvoidingView,Platform,Pressable,ScrollView,Text,TextInput,View} from "react-native";
import {router,useFocusEffect,useLocalSearchParams} from "expo-router";
import {Ionicons} from "@expo/vector-icons";
import {SafeAreaView} from "react-native-safe-area-context";
import {requireSupabase} from "../lib/supabase";
import {assertMessageScope,captureMessageScope,type MessageScope} from "../lib/message-session";
import {useUi} from "../components/ui";
import {jobeenTokens} from "../theme/jobeen";
import {useTheme} from "../state/ThemeProvider";
import {JobeenActionDialog} from "../components/JobeenActionDialog";
import {JobeenNoticeDialog} from "../components/JobeenNoticeDialog";
import {loadJShopConversation,jshopConversationPrice,type JShopConversation} from "../lib/jshop-messaging";
import {blockMessageUser,loadContactAccess,loadJShopSpamIds,markJShopSpam,reportMessageUser,sendContactRequest,type ContactAccess} from "../lib/message-requests";

type Message={id:string;sender_id:string;recipient_id:string;body:string;created_at:string};
export default function DirectMessage(){
 const {user,name,conversation}=useLocalSearchParams<{user?:string;name?:string;conversation?:string}>();
 const {colors}=useUi();const {theme}=useTheme();const brand=jobeenTokens(theme);const buttonBackground=theme==="light"?brand.yellow:colors.ink;const buttonText=theme==="light"?brand.ink:colors.inverse;
 const scopeRef=useRef<MessageScope|null>(null),revision=useRef(0),threadRef=useRef("");
 const [me,setMe]=useState("");const [items,setItems]=useState<Message[]>([]);
 const [draft,setDraft]=useState("");const [busy,setBusy]=useState(false);const [loading,setLoading]=useState(true);const [error,setError]=useState("");
 const [listingThread,setListingThread]=useState<JShopConversation|null>(null);
 const [contactAccess,setContactAccess]=useState<ContactAccess>({kind:"none",request:null});
 const [jshopSpam,setJshopSpam]=useState(false);
 const [menuStep,setMenuStep]=useState<"options"|"report"|null>(null);
 const [menuBusy,setMenuBusy]=useState(false);const [menuError,setMenuError]=useState("");
 const [blockOpen,setBlockOpen]=useState(false);const [blockError,setBlockError]=useState("");
 const [notice,setNotice]=useState("");
 const valid=!!user&&/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(user);
 const validConversation=!conversation||/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(conversation);
 const canCompose=!!scopeRef.current&&!loading&&(!conversation?(contactAccess.kind==="none"||contactAccess.kind==="accepted"):!!listingThread);
 const reload=useCallback(async()=>{
  const generation=++revision.current;
  const active=()=>revision.current===generation;
  scopeRef.current=null;setItems([]);setListingThread(null);setMe("");
  const threadKey=String(user)+":"+String(conversation??"");
  if(threadRef.current!==threadKey){threadRef.current=threadKey;setDraft("");setContactAccess({kind:"none",request:null});}
  if(!valid||!validConversation){setError("Conversación inválida.");setLoading(false);return;}
  setLoading(true);
  try{
   const db=requireSupabase(),scope=await captureMessageScope();
   if(!active())return;
   const session={id:scope.owner};
   if(session.id===user)throw Error("No puedes enviarte mensajes a ti mismo.");
   let selected:JShopConversation|null=null;
   if(conversation){
    selected=await loadJShopConversation(conversation,scope);
    const other=selected.buyerId===session.id?selected.sellerId:selected.buyerId;
    if(other!==user)throw Error("La conversación no corresponde a este destinatario.");
   }
   let spam=false;
   let access:ContactAccess={kind:"accepted",request:null};
   if(conversation){
    const flags=await loadJShopSpamIds(scope);
    spam=flags.has(conversation);
   }else{
    access=await loadContactAccess(user!,scope);
   }
   await assertMessageScope(scope);
   if(!active())return;
   let query=db.from("jobeen_direct_messages" as never)
    .select("id,sender_id,recipient_id,body,created_at")
    .or(`and(sender_id.eq.${session.id},recipient_id.eq.${user}),and(sender_id.eq.${user},recipient_id.eq.${session.id})`);
   query=conversation?query.eq("jshop_conversation_id",conversation):query.is("jshop_conversation_id",null);
   const {data,error:readError}=await query.order("created_at",{ascending:true}).limit(200);
   if(readError)throw readError;
   const messages=((data??[]) as Message[]).filter(r=>(r.sender_id===session.id&&r.recipient_id===user)||(r.recipient_id===session.id&&r.sender_id===user));
   if(!conversation&&access.kind==="accepted"&&access.request){
    const r=access.request;
    messages.push({id:"request-"+r.id,sender_id:r.senderId,recipient_id:r.recipientId,body:r.body,created_at:r.createdAt});
    messages.sort((a,b)=>Date.parse(a.created_at)-Date.parse(b.created_at));
   }
   await assertMessageScope(scope);
   if(!active())return;
   scopeRef.current=scope;setMe(scope.owner);setListingThread(selected);setContactAccess(access);setJshopSpam(spam);setItems(messages);setError("");
  }catch(e){if(active()){scopeRef.current=null;setItems([]);setListingThread(null);setError(e instanceof Error?e.message:"No se pudo abrir la conversación.");}}
  finally{if(active())setLoading(false);}
 },[user,valid,conversation,validConversation]);
 useFocusEffect(useCallback(()=>{void reload();return()=>{revision.current++;scopeRef.current=null;};},[reload]));
 async function send(){
  const scope=scopeRef.current,generation=revision.current;
  const body=draft.trim();if(!scope||!body||!valid||!me||busy||loading||(!!conversation&&!listingThread))return;
  if(!conversation&&contactAccess.kind!=="accepted"&&contactAccess.kind!=="none")return;
  setBusy(true);setError("");
  try{
   const db=requireSupabase();
   await captureMessageScope(scope);
   if(revision.current!==generation||scope.owner!==me)return;
   if(!conversation){
    const fresh=await loadContactAccess(user!,scope);
    if(revision.current!==generation)return;
    if(fresh.kind!==contactAccess.kind){setContactAccess(fresh);throw Error("El permiso de mensajes cambió. Revisa la conversación y vuelve a enviar.");}
   }
   await assertMessageScope(scope);
   if(revision.current!==generation)return;
   if(!conversation&&contactAccess.kind==="none"){
    await sendContactRequest(user!,body,me,scope);
   }else{
    const {error:sendError}=await db.from("jobeen_direct_messages" as never).insert({sender_id:me,recipient_id:user,body,jshop_conversation_id:conversation||null} as never);
    if(sendError)throw sendError;
   }
   await assertMessageScope(scope);
   if(revision.current===generation){setDraft("");await reload();}
  }catch(e){setError(e instanceof Error?e.message:"No se pudo enviar el mensaje.");}
  finally{setBusy(false);}
 }
 async function toggleSpam(){
  const scope=scopeRef.current;
  if(!scope||!conversation||menuBusy)return;
  setMenuBusy(true);setMenuError("");
  try{
   await markJShopSpam(conversation,!jshopSpam,scope);
   setJshopSpam(!jshopSpam);setMenuStep(null);
  }catch(e){setMenuError(e instanceof Error?e.message:"No se pudo modificar la carpeta.");}
  finally{setMenuBusy(false);}
 }
 async function reportConversation(reason:"spam"|"estafa"|"acoso"){
  const scope=scopeRef.current;
  if(!scope||!user||menuBusy)return;
  setMenuBusy(true);setMenuError("");
  try{
   await reportMessageUser(user,reason,scope);
   let feedback="Reporte enviado. El reporte será revisado.";
   if(conversation){
    try{await markJShopSpam(conversation,true,scope);setJshopSpam(true);}
    catch{feedback="Reporte enviado, pero no se pudo mover esta conversación a Spam.";}
   }
   setNotice(feedback);setMenuStep(null);
  }catch(e){setMenuError(e instanceof Error?e.message:"No se pudo reportar.");}
  finally{setMenuBusy(false);}
 }
 function openBlockConfirmation(){
  setMenuStep(null);setBlockError("");
  setTimeout(()=>setBlockOpen(true),300);
 }
 async function blockConversation(){
  const scope=scopeRef.current;
  if(!scope||!user||menuBusy)return;
  setMenuBusy(true);setBlockError("");
  try{await blockMessageUser(user,scope);if(scopeRef.current===scope){setBlockOpen(false);router.back();}}
  catch(e){setBlockError(e instanceof Error?e.message:"No se pudo bloquear.");}
  finally{setMenuBusy(false);}
 }
 return <SafeAreaView style={{flex:1,backgroundColor:brand.bg}} edges={["top","left","right","bottom"]}>
  <KeyboardAvoidingView behavior={Platform.OS==="ios"?"padding":undefined} style={{flex:1}}>
   <View style={{paddingHorizontal:16,paddingVertical:12,flexDirection:"row",alignItems:"center",gap:12,borderBottomWidth:1,borderBottomColor:brand.line}}>
    <Pressable accessibilityRole="button" accessibilityLabel="Volver" onPress={()=>router.back()} style={{padding:6}}><Ionicons name="arrow-back" size={24} color={colors.ink}/></Pressable>
    <Text numberOfLines={1} style={{flex:1,fontSize:18,fontWeight:"700",color:colors.ink}}>{name||"Mensaje"}</Text>
    <Pressable accessibilityRole="button" accessibilityLabel="Opciones de seguridad del chat"
     onPress={()=>{setMenuError("");setMenuStep("options");}}
     style={{width:48,height:48,alignItems:"center",justifyContent:"center"}}>
     <Ionicons name="ellipsis-horizontal" size={24} color={brand.ink}/>
    </Pressable>
   </View>
   {!!notice&&<Text accessibilityLiveRegion="polite" style={{paddingHorizontal:16,paddingTop:8,
    color:brand.ink2,fontSize:12}}>{notice}</Text>}
   {listingThread&&<Pressable accessibilityRole="button" accessibilityLabel={listingThread.listingId?"Ver artículo "+listingThread.title:"Anuncio eliminado"}
    disabled={!listingThread.listingId}
    onPress={()=>listingThread.listingId&&router.push({pathname:"/jshop/item/[id]",params:{id:listingThread.listingId}})}
    style={{marginHorizontal:12,marginTop:10,padding:10,borderRadius:17,borderColor:brand.line,borderWidth:1,backgroundColor:brand.surface,
     flexDirection:"row",alignItems:"center",gap:12}}>
    {listingThread.photoUrl?<Image source={{uri:listingThread.photoUrl}} style={{width:64,height:64,borderRadius:12,backgroundColor:brand.cream}} resizeMode="cover"/>:
     <View style={{width:64,height:64,borderRadius:12,alignItems:"center",justifyContent:"center",backgroundColor:brand.cream}}>
      <Ionicons name="bag-handle-outline" size={25} color={brand.ink}/>
     </View>}
    <View style={{flex:1,gap:4}}>
     <Text numberOfLines={1} style={{color:brand.ink,fontSize:14,fontWeight:"800"}}>{listingThread.title}</Text>
     <Text style={{color:brand.ink,fontSize:14,fontWeight:"700"}}>{jshopConversationPrice(listingThread)}</Text>
     <Text style={{color:brand.ink2,fontSize:11}}>{listingThread.listingId?"Conversación de JShop":"Anuncio eliminado"}</Text>
    </View>
    {listingThread.listingId&&<Ionicons name="chevron-forward" size={21} color={brand.ink2}/>}
   </Pressable>}
   {!conversation&&contactAccess.kind!=="accepted"&&<View style={{marginHorizontal:14,marginTop:12,borderRadius:17,backgroundColor:brand.cream,padding:13,gap:6}}>
    <Text style={{fontWeight:"800",color:brand.ink,fontSize:14}}>{contactAccess.kind==="none"?"Nueva solicitud de mensajes":contactAccess.kind==="outgoing"?"Solicitud enviada":contactAccess.kind==="incoming"?"Solicitud recibida":"No se pueden enviar nuevos mensajes"}</Text>
    <Text style={{color:brand.ink2,fontSize:12,lineHeight:19}}>{contactAccess.kind==="none"?"Puedes enviar un único mensaje de texto (máximo 500 caracteres). La otra persona deberá aceptar para continuar.":contactAccess.kind==="outgoing"?"Esperá a que la otra persona acepte la solicitud. No puedes enviar más mensajes mientras tanto.":contactAccess.kind==="incoming"?"Revisa la solicitud y aceptala antes de comenzar el chat.":"Esta solicitud ya fue cerrada."}</Text>
    {contactAccess.kind==="incoming"&&<Pressable accessibilityRole="button" onPress={()=>router.push("/message-requests")} style={{alignSelf:"flex-start",padding:9,borderRadius:12,backgroundColor:brand.surface}}>
     <Text style={{color:brand.ink,fontWeight:"700"}}>Revisar solicitud</Text>
    </Pressable>}
   </View>}
   <ScrollView style={{flex:1}} contentContainerStyle={{padding:16,gap:10,flexGrow:1,justifyContent:"flex-end"}}>
    {loading?<ActivityIndicator color={brand.yellow}/>:items.length===0?<Text style={{color:colors.muted,textAlign:"center"}}>{conversation?"Preguntá por este artículo. El vendedor recibirá tu mensaje.":"Inicia una conversación profesional."}</Text>:items.map(item=><View key={item.id} style={{alignSelf:item.sender_id===me?"flex-end":"flex-start",maxWidth:"85%",padding:12,borderRadius:16,backgroundColor:item.sender_id===me?brand.cream:brand.surface,borderWidth:1,borderColor:brand.line}}>
      <Text style={{color:brand.ink}}>{item.body}</Text>
     </View>)}
    {!!error&&<Text accessibilityLiveRegion="polite" style={{color:colors.ink}}>{error}</Text>}
   </ScrollView>
   <View style={{flexDirection:"row",alignItems:"flex-end",gap:8,padding:12,borderTopWidth:1,borderTopColor:brand.line}}>
    <TextInput multiline editable={canCompose&&!busy} value={draft} onChangeText={setDraft} maxLength={!conversation&&contactAccess.kind==="none"?500:2000}
     placeholder={!canCompose?"Solicitud pendiente de aceptación":contactAccess.kind==="none"&&!conversation?"Escribe tu solicitud…":"Escribe un mensaje…"}
     placeholderTextColor={colors.muted} accessibilityLabel="Mensaje"
     style={{flex:1,minHeight:42,maxHeight:130,borderRadius:20,borderWidth:1,borderColor:brand.line,backgroundColor:brand.surface,paddingHorizontal:14,paddingVertical:9,color:brand.ink,opacity:canCompose?1:0.6}}/>
    <Pressable accessibilityRole="button" accessibilityLabel={!conversation&&contactAccess.kind==="none"?"Enviar solicitud":"Enviar mensaje"}
     disabled={busy||!draft.trim()||!me||!valid||!canCompose} onPress={()=>void send()}
     style={{width:44,height:44,borderRadius:22,backgroundColor:buttonBackground,alignItems:"center",justifyContent:"center",opacity:busy||!draft.trim()||!canCompose?0.6:1}}>
     {busy?<ActivityIndicator color={buttonText}/>:<Ionicons name="send" size={20} color={buttonText}/>}
    </Pressable>
   </View>
  </KeyboardAvoidingView>
  <JobeenActionDialog visible={menuStep!==null} title={menuStep==="report"?"Reportar conversación":"Opciones de conversación"}
   busy={menuBusy} error={menuError}
   onClose={()=>{setMenuError("");setMenuStep(null);}}
   actions={menuStep==="report"
    ?(["spam","estafa","acoso"] as const).map(reason=>({
      label:reason==="spam"?"Spam":reason==="estafa"?"Estafa":"Acoso",
      onPress:()=>void reportConversation(reason)
     }))
    :[
      ...(conversation?[{
       label:jshopSpam?"Quitar de Spam":"Mover a Spam",
       icon:"mail-unread-outline" as const,onPress:()=>void toggleSpam()
      }]:[]),
      {label:"Reportar",
       icon:"flag-outline" as const,onPress:()=>{setMenuError("");setMenuStep("report");}},
      {label:"Bloquear",
       icon:"ban-outline" as const,tone:"danger" as const,onPress:openBlockConfirmation}
     ]}/>
  <JobeenNoticeDialog visible={blockOpen} title="Bloquear usuario"
   description={blockError||"No podrá enviarte más mensajes."} tone="danger"
   confirmLabel="Bloquear" onConfirm={()=>void blockConversation()} busy={menuBusy}
   onCancel={()=>{setBlockOpen(false);setBlockError("");}}/>
 </SafeAreaView>;
}
