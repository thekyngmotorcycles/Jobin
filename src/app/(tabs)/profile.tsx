import { ProfessionalTrustMark } from "../../components/ProfessionalTrustMark";
import { ProfessionalStatus } from "../../components/ProfessionalStatus";
import { loadWorkspace } from "../../lib/professional-api";
import { useProfessionalData } from "../../state/useProfessionalData";
import { useState } from "react";
import { Image, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { BottomSheet } from "../../components/social-ui";
import { JobinWordmark } from "../../components/JobinWordmark";
import { JobinCard } from "../../components/JobinCard";
import { Button, Notice, useUi } from "../../components/ui";
import { canSendHistory } from "../../lib/rules";
import { DEMO_HISTORY, DEMO_PROFILE, DEMO_REQUESTING_COMPANIES, DEMO_VIDEOS, type EmploymentEntry } from "../../lib/me";

type Mode = "grid" | "cv" | "videos";

export default function Profile() {
  const { s, colors } = useUi();
  const [mode, setMode] = useState<Mode>("grid");
  const [history, setHistory] = useState<EmploymentEntry[]>(DEMO_HISTORY);
  const [sendOpen, setSendOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [draft, setDraft] = useState({ company: "", role: "", from: "", to: "" });
  const [notice, setNotice] = useState("");
  const workspace = useProfessionalData(loadWorkspace);
  const p = DEMO_PROFILE;

  function openLive() {
    if (p.streamingNow) router.push({ pathname: "/stream/[id]", params: { id: p.streamId } });
  }

  function send(company: string) {
    if (!canSendHistory("company", p.isOwner, DEMO_REQUESTING_COMPANIES.includes(company))) {
      setNotice("Solo puedes enviar tu historial a empresas que lo hayan solicitado para contratarte.");
      return;
    }
    setSendOpen(false);
    setNotice("Historial enviado a " + company + " por mensajería interna.");
  }

  function add() {
    const from = Number(draft.from), to = draft.to ? Number(draft.to) : null;
    if (!draft.company.trim() || !draft.role.trim() || !Number.isFinite(from) || from < 1950) {
      setNotice("Completa empresa, cargo y año de inicio.");
      return;
    }
    setHistory(items => [...items, { id: Date.now() + "", company: draft.company.trim(), role: draft.role.trim(), from, to, status: "pending", verifiedBy: null }]);
    setDraft({ company: "", role: "", from: "", to: "" });
    setAddOpen(false);
    setNotice("Experiencia agregada. Quedará sin verificar hasta que la empresa la confirme.");
  }

  const tabIcon = (icon: keyof typeof Ionicons.glyphMap, label: string, value: Mode | "live", active: boolean) => (
    <Pressable accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ selected: active }}
      onPress={() => (value === "live" ? openLive() : setMode(value))}
      style={{ width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center", backgroundColor: active ? colors.ink : "transparent" }}>
      <Ionicons name={icon} size={22} color={value === "live" ? (p.streamingNow ? "#22c55e" : "#555") : active ? colors.inverse : colors.ink} />
    </Pressable>
  );

  return (
    <SafeAreaView edges={["top", "left", "right"]} style={s.screen}>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 8 }}>
        <JobinWordmark variant="ink" width={92} style={{ alignSelf: "flex-start" }} />
        <View style={{ flexDirection: "row", gap: 4 }}>
          {tabIcon("school-outline", "Historial profesional", "cv", mode === "cv")}
          {tabIcon("play-outline", "Videos", "videos", mode === "videos")}
          {tabIcon("radio-outline", p.streamingNow ? "Live now" : "Not live", "live", false)}
        </View>
      </View>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 18, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        {!!notice && <Notice text={notice} onClose={() => setNotice("")} />}
        {workspace.data?.card ? <View style={{gap:10}}>
          <JobinCard card={workspace.data.card}/>
          <ProfessionalTrustMark worker={workspace.data.card.id}/>
          <View style={{width:"100%",maxWidth:520,alignSelf:"center",gap:8}}>
            <Button secondary title="Editar JCard y formación" onPress={()=>router.push("/professional")}/>
            <Button secondary title="Certificados y sellos" onPress={()=>router.push("/certificates")}/>
            <Button secondary title="Oportunidades por ciudad y profesión" onPress={()=>router.push("/opportunities")}/>
            {!!workspace.data.organization&&<Button secondary title="Mi empresa o institución" onPress={()=>router.push("/company")}/>}
            {workspace.data.reviewer&&<Button secondary title="Revisar acreditaciones" onPress={()=>router.push("/credential-review")}/>}
          </View>
        </View> : <ProfessionalStatus loading={workspace.loading} error={workspace.error} retry={workspace.reload}/>}


        {mode === "cv" && (
          <View style={{ gap: 14 }}>
            <Text style={s.h2}>Historial profesional</Text>
            <Text style={s.muted}>Solo tú puedes ver este historial.</Text>
            {history.map(entry => (
              <View key={entry.id} style={[s.panel, { flexDirection: "row", gap: 12, alignItems: "center" }]}>
                <View style={{ flex: 1, gap: 4 }}>
                  <Text style={s.h3}>{entry.company} ({entry.from}–{entry.to ?? "actual"})</Text>
                  <Text style={s.muted}>{entry.role}</Text>
                </View>
                <View accessibilityLabel={entry.verifiedBy ? "Verificado por " + entry.verifiedBy : "No verificada"} style={{ alignItems: "center", gap: 2 }}>
                  <Ionicons name={entry.verifiedBy ? "checkmark-circle" : "ellipse-outline"} size={22} color={colors.ink} />
                  <Text style={[s.muted, { fontSize: 9 }]}>{entry.verifiedBy ? "Verificado" : "No verificada"}</Text>
                </View>
              </View>
            ))}
            <View style={s.row}>
              <Button secondary title="Enviar" onPress={() => setSendOpen(true)} />
              <Button title="Agregar" onPress={() => setAddOpen(true)} />
            </View>
          </View>
        )}

        {mode === "videos" && (
          <View style={{ gap: 14 }}>
            {DEMO_VIDEOS.map(video => (
              <View key={video.id} style={[s.panel, { flexDirection: "row", gap: 12, padding: 12, alignItems: "center" }]}>
                <Image source={{ uri: video.thumbnail }} accessibilityIgnoresInvertColors style={{ width: 84, height: 112, borderRadius: 10, backgroundColor: colors.accent }} />
                <View style={{ flex: 1, gap: 6 }}>
                  <Text style={s.h3}>{video.title}</Text>
                  <Text style={s.muted}>♡ {video.likes}   ▷ {video.views} vistas</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {mode === "grid" && (
          <View style={{ position: "relative" }}>
            <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
              {DEMO_VIDEOS.map(video => (
                <View key={video.id} style={{ width: "33.33%", aspectRatio: 3 / 4, padding: 1 }}>
                  <Image source={{ uri: video.thumbnail }} accessibilityLabel={video.title} style={{ flex: 1, backgroundColor: colors.accent }} />
                </View>
              ))}
            </View>
            <Pressable accessibilityRole="button" accessibilityLabel="Asistente de IA (próximamente)"
              style={{ position: "absolute", right: 8, bottom: 8, width: 44, height: 44, borderRadius: 22, backgroundColor: colors.ink, alignItems: "center", justifyContent: "center" }}>
              <Ionicons name="sparkles-outline" size={20} color={colors.inverse} />
            </Pressable>
          </View>
        )}
      </ScrollView>

      <BottomSheet visible={sendOpen} onClose={() => setSendOpen(false)} title="Enviar historial">
        <View style={{ gap: 14, paddingVertical: 16 }}>
          {DEMO_REQUESTING_COMPANIES.length === 0 ? (
            <Text style={s.muted}>Ninguna empresa ha solicitado tu historial todavía.</Text>
          ) : DEMO_REQUESTING_COMPANIES.map(company => <Button key={company} title={"Enviar a " + company} onPress={() => send(company)} />)}
        </View>
      </BottomSheet>

      <BottomSheet visible={addOpen} onClose={() => setAddOpen(false)} title="Agregar experiencia">
        <View style={{ gap: 12, paddingVertical: 16 }}>
          {(["company", "role", "from", "to"] as const).map(key => (
            <TextInput key={key} accessibilityLabel={({ company: "Empresa", role: "Cargo", from: "Año de inicio", to: "Año de término (opcional)" })[key]}
              placeholder={({ company: "Empresa", role: "Cargo", from: "Año de inicio", to: "Año de término (opcional)" })[key]}
              placeholderTextColor={colors.muted} value={draft[key]} onChangeText={v => setDraft(d => ({ ...d, [key]: v }))}
              keyboardType={key === "from" || key === "to" ? "number-pad" : "default"}
              style={{ color: colors.ink, borderColor: colors.line, borderWidth: 1, padding: 14, borderRadius: 10 }} />
          ))}
          <Text style={s.muted}>Las entradas nuevas quedan sin verificar hasta que la empresa las confirme.</Text>
          <Button title="Guardar" onPress={add} />
        </View>
      </BottomSheet>
    </SafeAreaView>
  );
}
