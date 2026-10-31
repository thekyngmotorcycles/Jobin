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
  function decide(id: string, status: "accepted" | "rejected") {
    setThreads(items => items.map(t => (t.id === id && t.kind === "extension" ? { ...t, status } : t)));
  }
  return (
    <SafeAreaView edges={["top", "left", "right"]} style={s.screen}>
      <ScrollView contentContainerStyle={{ paddingBottom: contentBottom }} showsVerticalScrollIndicator={false}>
        <SocialHeader />
        <View style={{ paddingHorizontal: 16, gap: 4, marginTop: 8 }}>
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
