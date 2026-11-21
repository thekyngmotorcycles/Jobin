import {useCallback,useEffect,useState} from "react";
import {ActivityIndicator,Image,KeyboardAvoidingView,Platform,Pressable,ScrollView,Text,TextInput,View} from "react-native";
import {router,useLocalSearchParams} from "expo-router";
import {Ionicons} from "@expo/vector-icons";
import {SafeAreaView} from "react-native-safe-area-context";
import {requireSupabase} from "../lib/supabase";
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
 const canCompose=!!conversation?!!listingThread:contactAccess.kind==="none"||contactAccess.kind==="accepted";
 const reload=useCallback(async()=>{
  if(!valid||!validConversation){setError("Conversación inválida.");setLoading(false);return;}
  setLoading(true);
  try{
   const db=requireSupabase();const {data:{user:session},error:authError}=await db.auth.getUser();
   if(authError||!session)throw Error("Inicia sesión para enviar mensajes.");
   setMe(session.id);
   if(session.id===user)throw Error("No puedes enviarte mensajes a ti mismo.");
   let selected:JShopConversation|null=null;
   if(conversation){
    selected=await loadJShopConversation(conversation);
    const other=selected.buyerId===session.id?selected.sellerId:selected.buyerId;
    if(other!==user)throw Error("La conversación no corresponde a este destinatario.");
   }
   setListingThread(selected);
   let access:ContactAccess={kind:"accepted",request:null};
   if(conversation){
    const flags=await loadJShopSpamIds();
    setJshopSpam(flags.has(conversation));
   }else{
    access=await loadContactAccess(user!);
    setContactAccess(access);
   }
   let query=db.from("jobeen_direct_messages" as never)
    .select("id,sender_id,recipient_id,body,created_at")
    .or(`and(sender_id.eq.${session.id},recipient_id.eq.${user}),and(sender_id.eq.${user},recipient_id.eq.${session.id})`);
   query=conversation?query.eq("jshop_conversation_id",conversation):query.is("jshop_conversation_id",null);
   const {data,error:readError}=await query.order("created_at",{ascending:true}).limit(200);
   if(readError)throw readError;
   const messages=(data??[]) as Message[];
   if(!conversation&&access.kind==="accepted"&&access.request){
    const r=access.request;
    messages.push({id:"request-"+r.id,sender_id:r.senderId,recipient_id:r.recipientId,body:r.body,created_at:r.createdAt});
    messages.sort((a,b)=>Date.parse(a.created_at)-Date.parse(b.created_at));
   }
   setItems(messages);setError("");
  }catch(e){setError(e instanceof Error?e.message:"No se pudo abrir la conversación.");}
  finally{setLoading(false);}
 },[user,valid,conversation,validConversation]);
 useEffect(()=>{void reload();},[reload]);
 async function send(){
  const body=draft.trim();if(!body||!valid||!me||busy||(!!conversation&&!listingThread))return;
  if(!conversation&&contactAccess.kind!=="accepted"&&contactAccess.kind!=="none")return;
  setBusy(true);setError("");
  try{
   if(!conversation&&contactAccess.kind==="none"){
    await sendContactRequest(user!,body);
   }else{
    const {error:sendError}=await requireSupabase().from("jobeen_direct_messages" as never).insert({sender_id:me,recipient_id:user,body,jshop_conversation_id:conversation||null} as never);
    if(sendError)throw sendError;
   }
   setDraft("");await reload();
  }catch(e){setError(e instanceof Error?e.message:"No se pudo enviar el mensaje.");}
  finally{setBusy(false);}
 }
 async function toggleSpam(){
  if(!conversation||menuBusy)return;
  setMenuBusy(true);setMenuError("");
  try{
   await markJShopSpam(conversation,!jshopSpam);
   setJshopSpam(!jshopSpam);setMenuStep(null);
  }catch(e){setMenuError(e instanceof Error?e.message:"No se pudo modificar la carpeta.");}
  finally{setMenuBusy(false);}
 }
 async function reportConversation(reason:"spam"|"estafa"|"acoso"){
  if(!user||menuBusy)return;
  setMenuBusy(true);setMenuError("");
  try{
   await reportMessageUser(user,reason);
   let feedback="Reporte enviado. El reporte será revisado.";
   if(conversation){
    try{await markJShopSpam(conversation,true);setJshopSpam(true);}
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
  if(!user||menuBusy)return;
  setMenuBusy(true);setBlockError("");
  try{await blockMessageUser(user);setBlockOpen(false);router.back();}
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
   description={menuStep==="report"?"Selecciona el motivo del reporte.":"Gestiona esta conversación profesional."}
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
       description:jshopSpam?"Devuelve el chat a JShop.":"Oculta esta conversación de la bandeja principal.",
       icon:"mail-unread-outline" as const,onPress:()=>void toggleSpam()
      }]:[]),
      {label:"Reportar",description:"Informa sobre Spam, estafa o acoso.",
       icon:"flag-outline" as const,onPress:()=>{setMenuError("");setMenuStep("report");}},
      {label:"Bloquear",description:"Evita que esta cuenta vuelva a escribirte.",
       icon:"ban-outline" as const,tone:"danger" as const,onPress:openBlockConfirmation}
     ]}/>
  <JobeenNoticeDialog visible={blockOpen} title="Bloquear usuario"
   description={blockError||"No podrá enviarte más mensajes."} tone="danger"
   confirmLabel="Bloquear" onConfirm={()=>void blockConversation()} busy={menuBusy}
   onCancel={()=>{setBlockOpen(false);setBlockError("");}}/>
 </SafeAreaView>;
}
