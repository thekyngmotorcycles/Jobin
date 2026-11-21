import {Ionicons} from "@expo/vector-icons";
import {router,useFocusEffect} from "expo-router";
import {useCallback,useEffect,useState} from "react";
import {ActivityIndicator,Image,Pressable,ScrollView,Text,View} from "react-native";
import {SafeAreaView} from "react-native-safe-area-context";
import {AccountAvatar} from "../../components/AccountAvatar";
import {JobeenMessageIcon} from "../../components/JobeenMessageIcon";
import {SocialHeader} from "../../components/SocialHeader";
import {Button,useUi} from "../../components/ui";
import {loadPublicCard} from "../../lib/professional-api";
import {loadJShopInbox,jshopConversationPrice,type JShopInboxThread} from "../../lib/jshop-messaging";
import {loadIncomingRequests,loadJShopSpamIds} from "../../lib/message-requests";
import {EXTENSION_MONTHS} from "../../lib/rules";
import {requireSupabase} from "../../lib/supabase";
import {useJobinNotices} from "../../state/NoticeProvider";
import {useTabClearance} from "../../theme/navigation";
import {jobeenTokens} from "../../theme/jobeen";
import {useTheme} from "../../state/ThemeProvider";

type Thread=
 |{id:string;name:string;accountId:string;kind:"text";text:string}
 |{id:string;name:string;accountId:string;kind:"jobin_card";text:string}
 |{id:string;name:string;accountId:string;kind:"history";text:string}
 |{id:string;name:string;accountId:string;kind:"extension";text:string;months:(typeof EXTENSION_MONTHS)[number];status:"pending"|"accepted"|"rejected"};

const EXAMPLES:Thread[]=[
 {id:"t1",name:"Refri-Air",accountId:"refri",kind:"text",text:"Hola Luis, ¿podemos hablar de un puesto de técnico?"},
 {id:"t2",name:"Refri-Air",accountId:"refri",kind:"history",text:"Solicitó tu historial profesional"},
 {id:"t3",name:"Ana Rivera",accountId:"ana",kind:"jobin_card",text:"Compartió su JCard contigo."},
 {id:"t4",name:"Ana Rivera",accountId:"ana",kind:"extension",text:"Solicita ampliar tu autorización de reseña.",months:3,status:"pending"},
];
type DirectThread={id:string;name:string;text:string;createdAt:string};
type InboxTab="chats"|"jshop";
type ShopFilter="Todo"|"Compras"|"Ventas"|"Spam";

export default function Messages(){
 
 const {markInboxRead}=useJobinNotices();
 useEffect(()=>{markInboxRead();},[]);
 const {s,colors}=useUi(),{theme}=useTheme(),t=jobeenTokens(theme),{contentBottom}=useTabClearance();
 const [tab,setTab]=useState<InboxTab>("chats");
 const [shopFilter,setShopFilter]=useState<ShopFilter>("Todo");
 const [threads,setThreads]=useState<Thread[]>(EXAMPLES);
 const [directThreads,setDirectThreads]=useState<DirectThread[]>([]);
 const [shopThreads,setShopThreads]=useState<JShopInboxThread[]>([]);
 const [requestCounts,setRequestCounts]=useState({pending:0,spam:0});
 const [shopSpamIds,setShopSpamIds]=useState<Set<string>>(new Set());
 const [loading,setLoading]=useState(true);
 const [error,setError]=useState("");

 useFocusEffect(useCallback(()=>{
  let active=true;setLoading(true);setError("");
  void(async()=>{
   try{
    const db=requireSupabase();const {data:{user},error:authError}=await db.auth.getUser();
    if(authError||!user){if(active){setDirectThreads([]);setShopThreads([]);setRequestCounts({pending:0,spam:0});setShopSpamIds(new Set());}return;}
    const [direct,shop,incoming,spamFolders]=await Promise.allSettled([
     (async()=>{
      const {data,error:readError}=await db.from("jobeen_direct_messages" as never)
       .select("sender_id,recipient_id,body,created_at").is("jshop_conversation_id",null)
       .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
       .order("created_at",{ascending:false}).limit(160);
      if(readError)throw readError;
      const recent=new Map<string,{body:string;createdAt:string}>();
      for(const row of (data??[]) as unknown as {sender_id:string;recipient_id:string;body:string;created_at:string}[]){
       const other=row.sender_id===user.id?row.recipient_id:row.sender_id;
       if(!recent.has(other))recent.set(other,{body:row.body,createdAt:row.created_at});
      }
      return await Promise.all([...recent].map(async([id,value])=>{
       const card=await loadPublicCard(id).catch(()=>null);
       return {id,name:card?.name??"Usuario de Jobeen",text:value.body,createdAt:value.createdAt};
      }));
     })(),
     loadJShopInbox(),
     loadIncomingRequests(),
     loadJShopSpamIds()
    ]);
    if(!active)return;
    if(direct.status==="fulfilled")setDirectThreads(direct.value);else setError("No se pudieron cargar los chats personales.");
    if(shop.status==="fulfilled")setShopThreads(shop.value);else setError(prev=>[prev,"No se pudieron cargar los mensajes de JShop."].filter(Boolean).join(" "));
    if(incoming.status==="fulfilled")setRequestCounts({pending:incoming.value.filter(r=>r.status==="pending").length,spam:incoming.value.filter(r=>r.status==="spam"||r.status==="reported").length});
    else setError(prev=>[prev,"No se pudieron cargar las solicitudes."].filter(Boolean).join(" "));
    if(spamFolders.status==="fulfilled")setShopSpamIds(spamFolders.value);else setError(prev=>[prev,"No se pudo cargar Spam de JShop."].filter(Boolean).join(" "));
   }catch(e){if(active){setError(e instanceof Error?e.message:"No se pudieron cargar los mensajes.");setDirectThreads([]);setShopThreads([]);}}
   finally{if(active)setLoading(false);}
  })();
  return()=>{active=false;};
 },[]));

 function decide(id:string,status:"accepted"|"rejected"){
  setThreads(items=>items.map(thread=>thread.id===id&&thread.kind==="extension"?{...thread,status}:thread));
 }
 const visibleShopThreads=shopThreads.filter(thread=>shopFilter==="Spam"?shopSpamIds.has(thread.id):!shopSpamIds.has(thread.id)&&(shopFilter==="Todo"||thread.side===shopFilter));
 const tabBackground=(selected:boolean)=>selected?t.cream:t.surface;
 return <SafeAreaView edges={["top","left","right"]} style={s.screen}>
  <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{paddingBottom:contentBottom,gap:10}} showsVerticalScrollIndicator={false}>
   <SocialHeader />
   <View style={{paddingHorizontal:16,gap:14,marginTop:8}}>
    <View accessibilityRole="tablist" style={{flexDirection:"row",gap:10}}>
     {([{key:"chats",label:"Chats"},{key:"jshop",label:"JShop"}] as const).map(option=>{
      const selected=tab===option.key;
      return <Pressable key={option.key} accessibilityRole="tab" accessibilityState={{selected}}
       accessibilityLabel={option.label} onPress={()=>setTab(option.key)}
       style={({pressed})=>({flex:1,minHeight:53,flexDirection:"row",alignItems:"center",justifyContent:"center",gap:10,
        borderWidth:1,borderColor:selected?t.yellow:t.line,borderRadius:18,backgroundColor:tabBackground(selected),
        opacity:pressed?0.75:1})}>
       {option.key==="chats"?<JobeenMessageIcon size={22} color={t.ink} filled={false}/>:<Ionicons name="bag-handle-outline" size={22} color={t.ink}/>}
       <Text numberOfLines={1} style={{fontSize:15,fontWeight:selected?"800":"600",color:t.ink}}>{option.label}</Text>
      </Pressable>;
     })}
    </View>
    {!!error&&<Text accessibilityLiveRegion="polite" style={{fontSize:12,color:t.ink2}}>{error}</Text>}
    {loading&&<ActivityIndicator color={t.yellow}/>}
    {tab==="chats"?<View style={{gap:10}}>
     <Pressable accessibilityRole="button" accessibilityLabel={"Abrir solicitudes de mensajes, "+(requestCounts.pending+requestCounts.spam)+" pendientes"}
      onPress={()=>router.push("/message-requests")}
      style={({pressed})=>({minHeight:72,flexDirection:"row",alignItems:"center",gap:12,padding:13,borderRadius:18,
       borderWidth:1,borderColor:t.line,backgroundColor:pressed?t.cream:t.surface})}>
      <View style={{width:42,height:42,alignItems:"center",justifyContent:"center",backgroundColor:t.cream,borderRadius:14}}>
       <Ionicons name="mail-unread-outline" size={22} color={t.ink}/>
      </View>
      <View style={{flex:1,gap:3}}>
       <Text style={{color:t.ink,fontSize:15,fontWeight:"800"}}>Solicitudes de mensajes</Text>
       <Text style={{color:t.ink2,fontSize:12}}>{requestCounts.spam?"Incluye "+requestCounts.spam+" posible(s) spam":"Revisar contactos que no has aceptado"}</Text>
      </View>
      {requestCounts.pending+requestCounts.spam>0&&<View style={{borderRadius:16,backgroundColor:t.cream,paddingHorizontal:10,paddingVertical:5}}>
       <Text style={{fontSize:12,color:t.ink,fontWeight:"800"}}>{requestCounts.pending+requestCounts.spam}</Text>
      </View>}
      <Ionicons name="chevron-forward" size={18} color={t.ink2}/>
     </Pressable>
     <Text accessibilityRole="header" style={{fontSize:17,fontWeight:"800",color:t.ink}}>Mensajes personales</Text>
     {!loading&&directThreads.length===0&&<View style={{backgroundColor:t.surface,padding:18,borderWidth:1,borderColor:t.line,borderRadius:18,gap:5}}>
      <Text style={{color:t.ink,fontWeight:"700"}}>Todavía no tienes conversaciones</Text>
      <Text style={{color:t.ink2,fontSize:13}}>Los mensajes profesionales que recibas aparecerán aquí.</Text>
     </View>}
     {directThreads.map(thread=><Pressable key={thread.id} accessibilityRole="button"
      accessibilityLabel={"Abrir conversación con "+thread.name}
      onPress={()=>router.push({pathname:"/message",params:{user:thread.id,name:thread.name}})}
      style={({pressed})=>({flexDirection:"row",alignItems:"center",gap:12,padding:12,borderRadius:18,
       backgroundColor:pressed?t.cream:t.surface,borderWidth:1,borderColor:t.line})}>
      <AccountAvatar accountId={thread.id} fallbackName={thread.name} size={46}/>
      <View style={{flex:1,gap:4}}>
       <Text numberOfLines={1} style={{fontSize:15,fontWeight:"800",color:t.ink}}>{thread.name}</Text>
       <Text numberOfLines={1} style={{fontSize:13,color:t.ink2}}>{thread.text}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={t.ink2}/>
     </Pressable>)}
     <Text style={{fontSize:12,fontWeight:"700",color:t.ink2,marginTop:14}}>CONVERSACIONES DE EJEMPLO</Text>
     {threads.map(thread=><View key={thread.id} style={{flexDirection:"row",gap:12,padding:12,borderRadius:18,
      backgroundColor:theme==="light"?t.surface:colors.card,borderWidth:1,borderColor:t.line}}>
      <AccountAvatar accountId={thread.accountId} fallbackName={thread.name} size={44}/>
      <View style={{flex:1,gap:6}}>
       <Text style={{fontWeight:"800",fontSize:15,color:t.ink}}>{thread.name}</Text>
       {thread.kind==="jobin_card"&&<Text style={s.tag}>JCARD</Text>}
       {thread.kind==="history"&&<Text style={s.tag}>SOLICITUD DE HISTORIAL</Text>}
       <Text style={s.muted}>{thread.text}</Text>
       {thread.kind==="history"&&<Button title="Enviar" onPress={()=>router.navigate({pathname:"/profile",params:{view:"cv"}})}/>}
       {thread.kind==="extension"&&(thread.status==="pending"?<View style={s.row}>
        <Button title="Aceptar" onPress={()=>decide(thread.id,"accepted")}/>
        <Button secondary title="Rechazar" onPress={()=>decide(thread.id,"rejected")}/>
       </View>:<Text style={s.muted}>{thread.status==="accepted"?"Aceptada":"Rechazada"} · {thread.months} meses</Text>)}
      </View>
     </View>)}
     <Text style={{fontSize:12,color:t.ink2,marginTop:6}}>Los mensajes de ejemplo no son conversaciones reales.</Text>
    </View>:<View style={{gap:12}}>
     <Text accessibilityRole="header" style={{fontSize:17,fontWeight:"800",color:t.ink}}>Mensajes de JShop</Text>
     <View accessibilityRole="tablist" style={{flexDirection:"row",gap:7}}>
      {(["Todo","Compras","Ventas"] as const).map(filter=><Pressable key={filter} accessibilityRole="tab"
       accessibilityLabel={"Filtrar "+filter} accessibilityState={{selected:shopFilter===filter}}
       onPress={()=>setShopFilter(filter)}
       style={({pressed})=>({flex:1,minHeight:42,alignItems:"center",justifyContent:"center",borderRadius:16,
        borderWidth:1,borderColor:shopFilter===filter?t.yellow:t.line,
        backgroundColor:shopFilter===filter?t.cream:t.surface,opacity:pressed?0.75:1})}>
       <Text style={{color:t.ink,fontSize:13,fontWeight:shopFilter===filter?"800":"500"}}>{filter}</Text>
      </Pressable>)}
     </View>
     <Pressable accessibilityRole="button" accessibilityState={{selected:shopFilter==="Spam"}}
      onPress={()=>setShopFilter(shopFilter==="Spam"?"Todo":"Spam")}
      style={({pressed})=>({alignSelf:"flex-start",minHeight:39,paddingHorizontal:12,gap:7,flexDirection:"row",alignItems:"center",borderRadius:14,
       backgroundColor:shopFilter==="Spam"?t.cream:pressed?t.cream:t.surface,borderWidth:1,borderColor:shopFilter==="Spam"?t.yellow:t.line})}>
      <Ionicons name="shield-outline" size={18} color={t.ink}/>
      <Text style={{fontSize:12,fontWeight:"700",color:t.ink}}>Spam de JShop</Text>
      {shopSpamIds.size>0&&<Text style={{color:t.ink2,fontSize:12}}>{shopSpamIds.size}</Text>}
     </Pressable>
     {!loading&&visibleShopThreads.length===0&&<View style={{borderRadius:18,backgroundColor:t.surface,borderWidth:1,borderColor:t.line,padding:20,gap:8,alignItems:"center"}}>
      <Ionicons name="chatbubbles-outline" size={31} color={t.ink2}/>
      <Text style={{color:t.ink,fontWeight:"800",fontSize:15}}>No hay conversaciones de {shopFilter==="Todo"?"JShop":shopFilter==="Spam"?"spam":shopFilter.toLowerCase()}</Text>
      <Text style={{color:t.ink2,textAlign:"center",lineHeight:20,fontSize:13}}>Al contactar a un vendedor o recibir preguntas sobre tus anuncios, verás aquí los mensajes vinculados a cada artículo.</Text>
     </View>}
     {visibleShopThreads.map(thread=><Pressable key={thread.id} accessibilityRole="button"
      accessibilityLabel={"Abrir mensaje con "+thread.otherName+" sobre "+thread.title}
      onPress={()=>router.push({pathname:"/message",params:{user:thread.otherId,name:thread.otherName,conversation:thread.id}})}
      style={({pressed})=>({padding:12,borderRadius:19,backgroundColor:pressed?t.cream:t.surface,borderWidth:1,borderColor:t.line,gap:10})}>
      <View style={{flexDirection:"row",alignItems:"center",gap:11}}>
       <AccountAvatar accountId={thread.otherId} fallbackName={thread.otherName} size={43}/>
       <View style={{flex:1,gap:3}}>
        <Text numberOfLines={1} style={{color:t.ink,fontSize:15,fontWeight:"800"}}>{thread.otherName}</Text>
        <Text numberOfLines={1} style={{color:t.ink2,fontSize:12}}>{thread.lastMessage}</Text>
       </View>
       <Ionicons name="chevron-forward" size={19} color={t.ink2}/>
      </View>
      <View style={{borderRadius:14,padding:8,backgroundColor:t.bg,flexDirection:"row",gap:10,alignItems:"center"}}>
       {thread.photoUrl?<Image source={{uri:thread.photoUrl}} style={{width:55,height:55,borderRadius:10,backgroundColor:t.cream}} resizeMode="cover"/>:
        <View style={{width:55,height:55,borderRadius:10,backgroundColor:t.cream,justifyContent:"center",alignItems:"center"}}>
         <Ionicons name="bag-handle-outline" size={24} color={t.ink}/>
        </View>}
       <View style={{flex:1,gap:4}}>
        <Text numberOfLines={1} style={{fontWeight:"700",fontSize:13,color:t.ink}}>{thread.title}</Text>
        <Text numberOfLines={1} style={{fontWeight:"800",fontSize:13,color:t.ink}}>{jshopConversationPrice(thread)}</Text>
       </View>
       <View style={{borderRadius:12,backgroundColor:t.cream,paddingHorizontal:9,paddingVertical:6}}>
        <Text style={{fontSize:11,fontWeight:"700",color:t.ink}}>{thread.side}</Text>
       </View>
      </View>
     </Pressable>)}
    </View>}
   </View>
  </ScrollView>
 </SafeAreaView>;
}
