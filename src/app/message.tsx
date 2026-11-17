import {useCallback,useEffect,useState} from "react";
import {ActivityIndicator,Alert,Image,KeyboardAvoidingView,Platform,Pressable,ScrollView,Text,TextInput,View} from "react-native";
import {router,useLocalSearchParams} from "expo-router";
import {Ionicons} from "@expo/vector-icons";
import {SafeAreaView} from "react-native-safe-area-context";
import {requireSupabase} from "../lib/supabase";
import {useUi} from "../components/ui";
import {jobeenTokens} from "../theme/jobeen";
import {useTheme} from "../state/ThemeProvider";
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
 return <SafeAreaView style={{flex:1,backgroundColor:brand.bg}} edges={["top","left","right","bottom"]}>
  <KeyboardAvoidingView behavior={Platform.OS==="ios"?"padding":undefined} style={{flex:1}}>
   <View style={{paddingHorizontal:16,paddingVertical:12,flexDirection:"row",alignItems:"center",gap:12,borderBottomWidth:1,borderBottomColor:brand.line}}>
    <Pressable accessibilityRole="button" accessibilityLabel="Volver" onPress={()=>router.back()} style={{padding:6}}><Ionicons name="arrow-back" size={24} color={colors.ink}/></Pressable>
    <Text numberOfLines={1} style={{flex:1,fontSize:18,fontWeight:"700",color:colors.ink}}>{name||"Mensaje"}</Text>
    <Pressable accessibilityRole="button" accessibilityLabel="Opciones de seguridad del chat"
     onPress={()=>Alert.alert("Opciones de conversación","Elegí cómo gestionar esta conversación.",[
      {text:"Cancelar",style:"cancel"},
      ...(conversation?[{text:jshopSpam?"Quitar de Spam":"Mover a Spam",onPress:()=>{void(async()=>{
       try{await markJShopSpam(conversation,!jshopSpam);setJshopSpam(!jshopSpam);}catch(e){setError(e instanceof Error?e.message:"No se pudo modificar la carpeta.");}
      })();}}]:[]),
      {text:"Reportar",onPress:()=>Alert.alert("Reportar","¿Por qué quieres reportar esta conversación?",[
       {text:"Cancelar",style:"cancel"},
       ...(["spam","estafa","acoso"] as const).map(reason=>({text:reason,onPress:()=>{void(async()=>{
        try{await reportMessageUser(user!,reason);if(conversation){await markJShopSpam(conversation,true);setJshopSpam(true);}Alert.alert("Reporte enviado","El reporte será revisado.");}
        catch(e){setError(e instanceof Error?e.message:"No se pudo reportar.");}
       })();}}))
      ])},
      {text:"Bloquear",style:"destructive",onPress:()=>Alert.alert("Bloquear usuario","No podrá enviarte más mensajes.",[
       {text:"Cancelar",style:"cancel"},{text:"Bloquear",style:"destructive",onPress:()=>{void(async()=>{
        try{await blockMessageUser(user!);router.back();}
        catch(e){setError(e instanceof Error?e.message:"No se pudo bloquear.");}
       })();}}
      ])}
     ])} style={{padding:8}}>
     <Ionicons name="ellipsis-horizontal" size={24} color={brand.ink}/>
    </Pressable>
   </View>
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
    <Text style={{color:brand.ink2,fontSize:12,lineHeight:19}}>{contactAccess.kind==="none"?"Podés enviar un único mensaje de texto (máximo 500 caracteres). La otra persona deberá aceptar para continuar.":contactAccess.kind==="outgoing"?"Esperá a que la otra persona acepte la solicitud. No podés enviar más mensajes mientras tanto.":contactAccess.kind==="incoming"?"Revisá la solicitud y aceptala antes de comenzar el chat.":"Esta solicitud ya fue cerrada."}</Text>
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
 </SafeAreaView>;
}
