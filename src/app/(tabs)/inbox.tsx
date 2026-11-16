import {useFocusEffect} from "expo-router";
import {useCallback} from "react";
import {requireSupabase} from "../../lib/supabase";
import {loadPublicCard} from "../../lib/professional-api";
import { useEffect } from "react";
import { useJobinNotices } from "../../state/NoticeProvider";
import { router } from "expo-router";
import { useTabClearance } from "../../theme/navigation";
import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AccountAvatar } from "../../components/AccountAvatar";
import { SocialHeader } from "../../components/SocialHeader";
import { Button, useUi } from "../../components/ui";
import { EXTENSION_MONTHS } from "../../lib/rules";

type Thread =
  | { id: string; name: string; accountId:string; kind: "text"; text: string }
  | { id: string; name: string; accountId:string; kind: "jobin_card"; text: string }
  | { id: string; name: string; accountId:string; kind: "history"; text: string }
  | { id: string; name: string; accountId:string; kind: "extension"; text: string; months: (typeof EXTENSION_MONTHS)[number]; status: "pending" | "accepted" | "rejected" };

const INITIAL: Thread[] = [
  { id: "t1", name: "Refri-Air", accountId:"refri", kind: "text", text: "Hola Luis, ¿podemos hablar de un puesto de técnico?" },
  { id: "t2", name: "Refri-Air", accountId:"refri", kind: "history", text: "Solicitó tu historial profesional" },
  { id: "t3", name: "Ana Rivera", accountId:"ana", kind: "jobin_card", text: "Compartió su JCard contigo." },
  { id: "t4", name: "Ana Rivera", accountId:"ana", kind: "extension", text: "Solicita ampliar tu autorización de reseña.", months: 3, status: "pending" },
];

export default function Messages() {
  const {markInboxRead}=useJobinNotices();
  useEffect(()=>{markInboxRead();},[]);
  const { s, colors } = useUi();const {contentBottom}=useTabClearance();
  const [threads, setThreads] = useState<Thread[]>(INITIAL);
  const [directThreads,setDirectThreads]=useState<{id:string;name:string;text:string}[]>([]);
  useFocusEffect(useCallback(()=>{
   let live=true;
   void (async()=>{
    try{
     const db=requireSupabase();const {data:{user}}=await db.auth.getUser();
     if(!user)return;
     const {data,error}=await db.from("jobeen_direct_messages" as never).select("sender_id,recipient_id,body,created_at").or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`).order("created_at",{ascending:false}).limit(100);
     if(error)throw error;
     const recent=new Map<string,string>();
     for(const row of (data??[]) as {sender_id:string;recipient_id:string;body:string}[]){
      const other=row.sender_id===user.id?row.recipient_id:row.sender_id;
      if(!recent.has(other))recent.set(other,row.body);
     }
     const conversations=await Promise.all([...recent].map(async ([id,body])=>{
      const card=await loadPublicCard(id).catch(()=>null);
      return {id,name:card?.name??"Profesional",text:body};
     }));
     if(live)setDirectThreads(conversations);
    }catch{if(live)setDirectThreads([]);}
   })();
   return()=>{live=false;};
  },[]));
  function decide(id: string, status: "accepted" | "rejected") {
    setThreads(items => items.map(t => (t.id === id && t.kind === "extension" ? { ...t, status } : t)));
  }
  return (
    <SafeAreaView edges={["top", "left", "right"]} style={s.screen}>
      <ScrollView contentContainerStyle={{ paddingBottom: contentBottom }} showsVerticalScrollIndicator={false}>
        <SocialHeader />
        <View style={{ paddingHorizontal: 16, gap: 4, marginTop: 8 }}>
          {directThreads.length>0&&<Text style={[s.h3,{marginVertical:12}]}>Conversaciones</Text>}
          {directThreads.map(thread=><Pressable key={thread.id} accessibilityRole="button" accessibilityLabel={"Abrir conversación con "+thread.name} onPress={()=>router.push({pathname:"/message",params:{user:thread.id,name:thread.name}})} style={{flexDirection:"row",alignItems:"center",gap:12,paddingVertical:14,borderBottomWidth:1,borderBottomColor:colors.line}}>
            <AccountAvatar accountId={thread.id} fallbackName={thread.name} size={44}/>
            <View style={{flex:1}}><Text style={s.h3}>{thread.name}</Text><Text numberOfLines={1} style={s.muted}>{thread.text}</Text></View>
          </Pressable>)}
          {threads.map(thread => (
            <View key={thread.id} accessibilityRole="none" style={{ flexDirection: "row", gap: 12, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.line }}>
              <AccountAvatar accountId={thread.accountId} fallbackName={thread.name} size={44}/>
              <View style={{ flex: 1, gap: 6 }}>
                <Text style={s.h3}>{thread.name}</Text>
                {thread.kind === "jobin_card" && <Text style={s.tag}>JCARD</Text>}
                {thread.kind === "history" && <Text style={s.tag}>SOLICITUD DE HISTORIAL</Text>}
                <Text style={s.muted}>{thread.text}</Text>
                {thread.kind==="history"&&<Button title="Enviar" onPress={()=>router.navigate({pathname:"/profile",params:{view:"cv"}})}/>}
                {thread.kind === "extension" && (thread.status === "pending" ? (
                  <View style={s.row}>
                    <Button title="Aceptar" onPress={() => decide(thread.id, "accepted")} />
                    <Button secondary title="Rechazar" onPress={() => decide(thread.id, "rejected")} />
                  </View>
                ) : (
                  <Text style={s.muted}>{thread.status === "accepted" ? "Aceptada" : "Rechazada"} · {thread.months} meses</Text>
                ))}
              </View>
            </View>
          ))}
          <Pressable accessibilityRole="none" style={{ paddingTop: 12 }}>
            <Text style={s.muted}>Las solicitudes de ampliación aceptadas las confirma el servidor antes de extender la autorización.</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
