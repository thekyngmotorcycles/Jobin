import {useCallback,useEffect,useState} from "react";
import {ActivityIndicator,KeyboardAvoidingView,Platform,Pressable,ScrollView,Text,TextInput,View} from "react-native";
import {router,useLocalSearchParams} from "expo-router";
import {Ionicons} from "@expo/vector-icons";
import {SafeAreaView} from "react-native-safe-area-context";
import {requireSupabase} from "../lib/supabase";
import {useUi} from "../components/ui";
import {jobeenTokens} from "../theme/jobeen";

type Message={id:string;sender_id:string;recipient_id:string;body:string;created_at:string};
export default function DirectMessage(){
 const {user,name}=useLocalSearchParams<{user?:string;name?:string}>();
 const {colors}=useUi();const brand=jobeenTokens("light");
 const [me,setMe]=useState("");const [items,setItems]=useState<Message[]>([]);
 const [draft,setDraft]=useState("");const [busy,setBusy]=useState(false);const [loading,setLoading]=useState(true);const [error,setError]=useState("");
 const valid=!!user&&/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(user);
 const reload=useCallback(async()=>{
  if(!valid){setError("Destinatario inválido.");setLoading(false);return;}
  try{
   const db=requireSupabase();const {data:{user:session},error:authError}=await db.auth.getUser();
   if(authError||!session)throw Error("Inicia sesión para enviar mensajes.");
   setMe(session.id);
   if(session.id===user)throw Error("No puedes enviarte mensajes a ti mismo.");
   const {data,error:readError}=await db.from("jobeen_direct_messages" as never).select("id,sender_id,recipient_id,body,created_at").or(`and(sender_id.eq.${session.id},recipient_id.eq.${user}),and(sender_id.eq.${user},recipient_id.eq.${session.id})`).order("created_at",{ascending:true}).limit(200);
   if(readError)throw readError;
   setItems((data??[]) as Message[]);setError("");
  }catch(e){setError(e instanceof Error?e.message:"No se pudo abrir la conversación.");}
  finally{setLoading(false);}
 },[user,valid]);
 useEffect(()=>{void reload();},[reload]);
 async function send(){
  const body=draft.trim();if(!body||!valid||!me||busy)return;
  setBusy(true);setError("");
  try{
   const {error:sendError}=await requireSupabase().from("jobeen_direct_messages" as never).insert({sender_id:me,recipient_id:user,body} as never);
   if(sendError)throw sendError;
   setDraft("");await reload();
  }catch(e){setError(e instanceof Error?e.message:"No se pudo enviar el mensaje.");}
  finally{setBusy(false);}
 }
 return <SafeAreaView style={{flex:1,backgroundColor:colors.paper}} edges={["top","left","right","bottom"]}>
  <KeyboardAvoidingView behavior={Platform.OS==="ios"?"padding":undefined} style={{flex:1}}>
   <View style={{paddingHorizontal:16,paddingVertical:12,flexDirection:"row",alignItems:"center",gap:12,borderBottomWidth:1,borderBottomColor:colors.line}}>
    <Pressable accessibilityRole="button" accessibilityLabel="Volver" onPress={()=>router.back()} style={{padding:6}}><Ionicons name="arrow-back" size={24} color={colors.ink}/></Pressable>
    <Text numberOfLines={1} style={{flex:1,fontSize:18,fontWeight:"700",color:colors.ink}}>{name||"Mensaje"}</Text>
   </View>
   <ScrollView style={{flex:1}} contentContainerStyle={{padding:16,gap:10,flexGrow:1,justifyContent:"flex-end"}}>
    {loading?<ActivityIndicator color={brand.yellow}/>:items.length===0?<Text style={{color:colors.muted,textAlign:"center"}}>Inicia una conversación profesional.</Text>:items.map(item=><View key={item.id} style={{alignSelf:item.sender_id===me?"flex-end":"flex-start",maxWidth:"85%",padding:12,borderRadius:16,backgroundColor:item.sender_id===me?brand.cream:colors.card}}>
      <Text style={{color:colors.ink}}>{item.body}</Text>
     </View>)}
    {!!error&&<Text accessibilityLiveRegion="polite" style={{color:colors.ink}}>{error}</Text>}
   </ScrollView>
   <View style={{flexDirection:"row",alignItems:"flex-end",gap:8,padding:12,borderTopWidth:1,borderTopColor:colors.line}}>
    <TextInput multiline value={draft} onChangeText={setDraft} maxLength={2000} placeholder="Escribe un mensaje…" placeholderTextColor={colors.muted} accessibilityLabel="Mensaje" style={{flex:1,minHeight:42,maxHeight:130,borderRadius:20,borderWidth:1,borderColor:colors.line,paddingHorizontal:14,paddingVertical:9,color:colors.ink}}/>
    <Pressable accessibilityRole="button" accessibilityLabel="Enviar mensaje" disabled={busy||!draft.trim()||!me||!valid} onPress={()=>void send()} style={{width:44,height:44,borderRadius:22,backgroundColor:brand.yellow,alignItems:"center",justifyContent:"center",opacity:busy||!draft.trim()?0.6:1}}>
     {busy?<ActivityIndicator color={brand.ink}/>:<Ionicons name="send" size={20} color={brand.ink}/>}
    </Pressable>
   </View>
  </KeyboardAvoidingView>
 </SafeAreaView>;
}
