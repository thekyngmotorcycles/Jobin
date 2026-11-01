import AsyncStorage from "@react-native-async-storage/async-storage";
import { employmentMonths } from "../../lib/employment";
import { useTabClearance } from "../../theme/navigation";
import { MediaThumbnail } from "../../components/MediaThumbnail";
import { ProfessionalTrustMark } from "../../components/ProfessionalTrustMark";
import { ProfessionalStatus } from "../../components/ProfessionalStatus";
import { loadWorkspace } from "../../lib/professional-api";
import { useProfessionalData } from "../../state/useProfessionalData";
import { useEffect,useState } from "react";
import { Image, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router,useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { BottomSheet } from "../../components/social-ui";
import { JobinWordmark } from "../../components/JobinWordmark";
import { JobinCard } from "../../components/JobinCard";
import { Button, Notice, useUi } from "../../components/ui";
import { canSendHistory } from "../../lib/rules";
import { DEMO_PROFILE, DEMO_REQUESTING_COMPANIES, DEMO_VIDEOS, type EmploymentEntry } from "../../lib/me";

type Mode = "grid" | "cv" | "videos";

export default function Profile() {
  const { s, colors } = useUi();const {contentBottom}=useTabClearance();const {view}=useLocalSearchParams<{view?:string}>();
  const [mode, setMode] = useState<Mode>("grid");
  useEffect(()=>{if(view==="cv")setMode("cv");},[view]);
  const [history, setHistory] = useState<EmploymentEntry[]>([]);
  const [historyLoaded,setHistoryLoaded] = useState(false);
  useEffect(()=>{let active=true;AsyncStorage.getItem("jobin.professional.history.v1").then(raw=>{if(active&&raw){const parsed:unknown=JSON.parse(raw);if(Array.isArray(parsed))setHistory(parsed as EmploymentEntry[]);}}).catch(()=>{}).finally(()=>{if(active)setHistoryLoaded(true);});return()=>{active=false;};},[]);
  useEffect(()=>{if(historyLoaded)void AsyncStorage.setItem("jobin.professional.history.v1",JSON.stringify(history)).catch(()=>setNotice("No se pudo guardar el historial en este dispositivo."));},[history,historyLoaded]);
  const [sendOpen, setSendOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [editingId,setEditingId] = useState<string|null>(null);
  const [formError,setFormError] = useState("");
  function openEmployment(entry?:EmploymentEntry){
    setEditingId(entry?.id??null);
    setDraft(entry?{company:entry.company,role:entry.role,from:String(entry.from),to:entry.to===null?"":String(entry.to),profession:(entry.professions??[]).join(", "),fromMonth:String(entry.fromMonth??1),toMonth:String(entry.toMonth??12)}:{company:"",role:"",from:"",to:"",profession:"",fromMonth:"1",toMonth:"12"});
    setFormError("");setAddOpen(true);
  }
  const [draft, setDraft] = useState({ company: "", role: "", from: "", to: "", profession: "", fromMonth: "1", toMonth: "12" });
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
    const currentYear=new Date().getFullYear();
    const fromMonth=Number(draft.fromMonth),toMonth=Number(draft.toMonth);
    if(!Number.isInteger(fromMonth)||fromMonth<1||fromMonth>12||!Number.isInteger(toMonth)||toMonth<1||toMonth>12){setFormError("Los meses deben estar entre 1 y 12.");return;}
    if (!draft.company.trim() || !draft.role.trim() || !draft.from.trim() || !Number.isInteger(from) || from < 1950 || from > currentYear || (to!==null&&(!Number.isInteger(to)||to<from||to>currentYear))) {
      setFormError("Completa empresa, cargo y años válidos (el final no puede ser anterior al inicio).");
      return;
    }
    const updated:EmploymentEntry={id:editingId??Date.now()+"",company:draft.company.trim(),role:draft.role.trim(),professions:draft.profession.split(",").map(x=>x.trim()).filter(Boolean),fromMonth,toMonth,from,to,status:"pending",verifiedBy:null};
    setHistory(items=>editingId?items.map(entry=>entry.id===editingId?updated:entry):[...items,updated]);
    setDraft({ company: "", role: "", from: "", to: "", profession: "", fromMonth: "1", toMonth: "12" });
    setAddOpen(false);setEditingId(null);setFormError("");
    setNotice("Experiencia guardada. Cualquier cambio requiere una nueva verificación de la empresa.");
  }

  const tabIcon = (icon: keyof typeof Ionicons.glyphMap, label: string, value: Mode | "live", active: boolean) => (
    <Pressable accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ selected: active }}
      onPress={() => (value === "live" ? openLive() : setMode(value))}
      style={{ width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center", backgroundColor: active ? colors.ink : colors.transparent }}>
      <Ionicons name={icon} size={22} color={value === "live" ? (p.streamingNow ? colors.statusLive : colors.statusInactive) : active ? colors.inverse : colors.ink} />
    </Pressable>
  );

  return (
    <SafeAreaView edges={["top", "left", "right"]} style={s.screen}>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 8 }}>
        <JobinWordmark width={92} style={{ alignSelf: "flex-start" }} />
        <View style={{ flexDirection: "row", gap: 4 }}>
          {tabIcon("school-outline", "Historial profesional", "cv", mode === "cv")}
          {tabIcon("play-outline", "Videos", "videos", mode === "videos")}
          {tabIcon("radio-outline", p.streamingNow ? "Live now" : "Not live", "live", false)}
        </View>
      </View>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 18, paddingBottom: contentBottom }} showsVerticalScrollIndicator={false}>
        {!!notice && <Notice text={notice} onClose={() => setNotice("")} />}
        {workspace.data?.card ? <View style={{gap:10}}>
          <JobinCard card={{...workspace.data.card,years:history.length?Math.floor(employmentMonths(history)/12):workspace.data.card.years}}/>
          <ProfessionalTrustMark worker={workspace.data.card.id}/>
          <View style={{width:"100%",maxWidth:520,alignSelf:"center",gap:8}}>
            <Button title="Mi historial profesional · Agregar empleo" onPress={()=>{setMode("cv");openEmployment();}}/>
            <Button secondary title="Certificados y sellos" onPress={()=>router.push("/certificates")}/>
            <Button secondary title="Oportunidades por ciudad y profesión" onPress={()=>router.push("/opportunities")}/>
            {!!workspace.data.organization&&<Button secondary title="Mi empresa o institución" onPress={()=>router.push("/company")}/>}
            {workspace.data.reviewer&&<Button secondary title="Revisar acreditaciones" onPress={()=>router.push("/credential-review")}/>}
          </View>
        </View> : <ProfessionalStatus loading={workspace.loading} error={workspace.error} retry={workspace.reload}/>}


        {mode === "cv" && (
          <View style={{ gap: 14 }}>
            <Text style={s.h2}>Historial profesional</Text>
            <Text style={s.muted}>Experiencia total registrada: {Math.floor(employmentMonths(history)/12)} años y {employmentMonths(history)%12} meses. Agrega cada empresa, el cargo y los años trabajados. Los datos se guardan en este dispositivo; la verificación por la empresa aún no está conectada.</Text>
            {history.length===0&&<Text style={s.muted}>Todavía no agregaste empleos. Pulsa Agregar para comenzar.</Text>}
            {history.map(entry => (
              <View key={entry.id} style={[s.panel, { flexDirection: "row", gap: 12, alignItems: "center" }]}>
                <View style={{ flex: 1, gap: 4 }}>
                  <Text style={s.h3}>{entry.company} ({entry.from}–{entry.to ?? "actual"})</Text>
                  <Text style={s.muted}>{entry.role}</Text>
                </View>
                <Pressable accessibilityRole="button" accessibilityLabel={"Editar empleo en "+entry.company} onPress={()=>openEmployment(entry)} style={{padding:8}}><Ionicons name="create-outline" size={22} color={colors.ink}/></Pressable>
                <View accessibilityLabel={entry.verifiedBy ? "Verificado por " + entry.verifiedBy : "No verificada"} style={{ alignItems: "center", gap: 2 }}>
                  <Ionicons name={entry.verifiedBy ? "checkmark-circle" : "ellipse-outline"} size={22} color={colors.ink} />
                  <Text style={[s.muted, { fontSize: 9 }]}>{entry.verifiedBy ? "Verificado" : "No verificada"}</Text>
                </View>
              </View>
            ))}
            <View style={s.row}>
              <Button secondary title="Enviar" onPress={() => setSendOpen(true)} />
              <Button title="Agregar" onPress={() => openEmployment()} />
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
                  <MediaThumbnail uri={video.thumbnail} label={video.title}/>
                </View>
              ))}
            </View>

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

      <BottomSheet visible={addOpen} onClose={() => setAddOpen(false)} title={editingId?"Editar experiencia":"Agregar experiencia"}>
        <View style={{ gap: 12, paddingVertical: 16 }}>
          {(["company", "role", "from", "to"] as const).map(key => (
            <TextInput key={key} accessibilityLabel={({ company: "Empresa", role: "Cargo", from: "Año de inicio", to: "Año de término (opcional)" })[key]}
              placeholder={({ company: "Empresa", role: "Cargo", from: "Año de inicio", to: "Año de término (opcional)" })[key]}
              placeholderTextColor={colors.muted} value={draft[key]} onChangeText={v => setDraft(d => ({ ...d, [key]: v }))}
              keyboardType={key === "from" || key === "to" ? "number-pad" : "default"}
              style={{ color: colors.ink, borderColor: colors.line, borderWidth: 1, padding: 14, borderRadius: 10 }} />
          ))}
          {!!formError&&<Text accessibilityRole="alert" style={{color:colors.reaction}}>{formError}</Text>}
          <TextInput accessibilityLabel="Profesiones (separadas por coma)" placeholder="Profesiones: HVAC, Electricidad" placeholderTextColor={colors.muted} value={draft.profession} onChangeText={v=>setDraft(d=>({...d,profession:v}))} style={{color:colors.ink,borderColor:colors.line,borderWidth:1,padding:14,borderRadius:10}}/>
          {(["fromMonth","toMonth"] as const).map(key=><TextInput key={key} accessibilityLabel={key==="fromMonth"?"Mes de inicio":"Mes de término"} placeholder={key==="fromMonth"?"Mes de inicio (1-12)":"Mes de término (1-12)"} placeholderTextColor={colors.muted} keyboardType="number-pad" value={draft[key]} onChangeText={v=>setDraft(d=>({...d,[key]:v}))} style={{color:colors.ink,borderColor:colors.line,borderWidth:1,padding:14,borderRadius:10}}/>)}
          <Text style={s.muted}>Puedes editar estos datos cuando quieras. Al modificarlos se reinicia la verificación de la empresa.</Text>
          <Button title="Guardar" onPress={add} />
        </View>
      </BottomSheet>
    </SafeAreaView>
  );
}
