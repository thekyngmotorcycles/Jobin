import AsyncStorage from "@react-native-async-storage/async-storage";
import { employmentMonths } from "../../lib/employment";
import { readCloudHistory,readCloudBusiness,writeCloudHistory,writeCloudBusiness,readBusinessRating } from "../../lib/jcard-cloud";
import { useTabClearance } from "../../theme/navigation";
import { MediaThumbnail } from "../../components/MediaThumbnail";
import { ProfessionalTrustMark } from "../../components/ProfessionalTrustMark";
import { ProfessionalStatus } from "../../components/ProfessionalStatus";
import { loadWorkspace } from "../../lib/professional-api";
import { useProfessionalData } from "../../state/useProfessionalData";
import { useEffect,useState } from "react";
import { Image, Keyboard, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router,useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { BottomSheet } from "../../components/social-ui";
import { JobinWordmark } from "../../components/JobinWordmark";
import { JobinCard } from "../../components/JobinCard";
import type { BusinessCardData, JCardSeal } from "../../lib/jcard";
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
  const [businessRating,setBusinessRating]=useState<{rating:number|null;count:number}>({rating:null,count:0});
  useEffect(()=>{let active=true;AsyncStorage.getItem("jobin.professional.history.v1").then(raw=>{if(active&&raw){const parsed:unknown=JSON.parse(raw);if(Array.isArray(parsed))setHistory(parsed as EmploymentEntry[]);}}).catch(()=>{}).finally(()=>{if(active)setHistoryLoaded(true);});return()=>{active=false;};},[]);
  useEffect(()=>{if(historyLoaded)void AsyncStorage.setItem("jobin.professional.history.v1",JSON.stringify(history)).catch(()=>setNotice("No se pudo guardar el historial en este dispositivo."));},[history,historyLoaded]);
  const [businessOpen,setBusinessOpen]=useState(false);
  const [business,setBusiness]=useState<BusinessCardData>({name:"",opened:"",closed:"",services:[],location:"",licenseVerified:false,rating:null,reviewCount:0});
  const [businessDraft,setBusinessDraft]=useState({name:"",opened:"",closed:"",services:"",location:""});
  useEffect(()=>{let live=true;void readCloudBusiness().then(async row=>{if(!live)return;if(row){setBusiness(b=>({...b,...row}));return;}const raw=await AsyncStorage.getItem("jobin.business.card.v1");if(raw){const local=JSON.parse(raw) as BusinessCardData;await writeCloudBusiness(local);if(live)setBusiness(local);}}).catch(()=>{AsyncStorage.getItem("jobin.business.card.v1").then(raw=>{if(live&&raw)setBusiness(JSON.parse(raw) as BusinessCardData);}).catch(()=>{});});return()=>{live=false;};},[]);
  function editBusiness(){setBusinessDraft({name:business.name,opened:business.opened,closed:business.closed,services:business.services.join(", "),location:business.location});setBusinessOpen(true);}
  function saveBusiness(){const services=businessDraft.services.split(",").map(x=>x.trim()).filter(Boolean);if(services.length>3){setNotice("Máximo tres servicios.");return;}const opened=businessDraft.opened.trim(),closed=businessDraft.closed.trim(),year=new Date().getFullYear();if((opened&&(!/^\\d{4}$/.test(opened)||Number(opened)>year||Number(opened)<1800))||(closed&&(!/^\\d{4}$/.test(closed)||Number(closed)>year||Number(closed)<Number(opened)))){setNotice("Revisa los años de apertura y cierre.");return;}const updated={...business,...businessDraft,services,licenseVerified:business.licenseVerified};setBusiness(updated);void AsyncStorage.setItem("jobin.business.card.v1",JSON.stringify(updated)).catch(()=>setNotice("No se pudo guardar el reverso."));void writeCloudBusiness(updated).catch(()=>setNotice("Guardado localmente, pero no se pudo sincronizar."));setBusinessOpen(false);}
  const [sendOpen, setSendOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [editingId,setEditingId] = useState<string|null>(null);
  const [formError,setFormError] = useState("");
  function openEmployment(entry?:EmploymentEntry){
    setEditingId(entry?.id??null);
    setDraft(entry?{company:entry.company,role:entry.role,from:String(entry.from),to:entry.to===null?"":String(entry.to),profession:(entry.professions??[]).join(", "),fromMonth:String(entry.fromMonth??1),toMonth:String(entry.toMonth??12),address:entry.address??"",contact:entry.contact??""}:{company:"",role:"",from:"",to:"",profession:"",fromMonth:"1",toMonth:"12",address:"",contact:""});
    setFormError("");setAddOpen(true);
  }
  const [draft, setDraft] = useState({ company: "", role: "", from: "", to: "", profession: "", fromMonth: "1", toMonth: "12", address:"", contact:"" });
  const [notice, setNotice] = useState("");
  const workspace = useProfessionalData(loadWorkspace);
  useEffect(()=>{let live=true;void readCloudHistory().then(async rows=>{if(!live)return;if(rows.length){const rawLocal=await AsyncStorage.getItem("jobin.professional.history.v1");const local=rawLocal?JSON.parse(rawLocal) as EmploymentEntry[]:[];setHistory(rows.map(row=>{const saved=local.find(entry=>entry.id===row.id);return {...row,address:saved?.address??row.address,contact:saved?.contact??row.contact};}));return;}const raw=await AsyncStorage.getItem("jobin.professional.history.v1");const local=raw?JSON.parse(raw) as EmploymentEntry[]:[];for(const item of local)await writeCloudHistory(item);if(live)setHistory(local);}).catch(()=>setNotice("No se pudo recuperar el historial en la nube."));return()=>{live=false;};},[]);
  useEffect(()=>{let live=true;void readBusinessRating(workspace.data?.card.id??"").then(value=>{if(live)setBusinessRating(value);}).catch(()=>{});return()=>{live=false;};},[workspace.data?.card.id]);
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
    if (to!==null && to===from && toMonth<fromMonth){setFormError("El mes de término debe ser posterior al de inicio.");return;}
    if (!draft.company.trim() || !draft.role.trim() || !draft.from.trim() || !Number.isInteger(from) || from < 1950 || from > currentYear || (to!==null&&(!Number.isInteger(to)||to<from||to>currentYear))) {
      setFormError("Completa empresa, cargo y años válidos (el final no puede ser anterior al inicio).");
      return;
    }
    Keyboard.dismiss();
    const updated:EmploymentEntry={id:editingId??Date.now()+"",company:draft.company.trim(),role:draft.role.trim(),professions:draft.profession.split(",").map(x=>x.trim()).filter(Boolean),fromMonth,toMonth,from,to,address:draft.address.trim(),contact:draft.contact.trim(),status:"pending",verifiedBy:null};
    setHistory(items=>editingId?items.map(entry=>entry.id===editingId?updated:entry):[...items,updated]);
    void writeCloudHistory(updated).catch(()=>setNotice("Guardado localmente, pero no se pudo sincronizar. Revisa la conexión."));
    setDraft({ company: "", role: "", from: "", to: "", profession: "", fromMonth: "1", toMonth: "12" });
    setAddOpen(false);setEditingId(null);setFormError("");
    setNotice("Experiencia guardada. Cualquier cambio requiere una nueva verificación de la empresa.");
  }

  const seals: JCardSeal[] = workspace.data?.card.seals.map(seal=>({...seal,icon:seal.profession.toLowerCase().includes("hvac")?"thermometer-outline":seal.profession.toLowerCase().includes("refrig")?"snow-outline":seal.icon,months:employmentMonths(history,seal.profession)}))??[];
  for(const entry of history)for(const profession of entry.professions??[]){if(!seals.some(s=>s.profession.toLowerCase()===profession.toLowerCase()))seals.push({id:profession,profession,label:profession,icon:/hvac/i.test(profession)?"thermometer-outline":/refrig/i.test(profession)?"snow-outline":/electr/i.test(profession)?"flash-outline":"briefcase-outline",verified:false,months:employmentMonths(history,profession)});}
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
          <JobinCard card={{...workspace.data.card,seals,rating:null,reviewCount:0,business:{...business,rating:businessRating.rating,reviewCount:businessRating.count},years:history.length?Math.floor(employmentMonths(history)/12):workspace.data.card.years}} onEditBusiness={editBusiness} ownerId={workspace.data.card.id}/>
          <ProfessionalTrustMark worker={workspace.data.card.id}/>
          <View style={{width:"100%",maxWidth:520,alignSelf:"center",gap:8}}>
            <Button title="Mi historial profesional · Agregar empleo" onPress={()=>{setMode("cv");openEmployment();}}/>
            <Button secondary title="Reseñas de empresas" onPress={()=>router.push("/reviews")}/>
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

      <BottomSheet visible={businessOpen} onClose={()=>setBusinessOpen(false)} title="Editar reverso de JCard">
       <View style={{gap:12,paddingVertical:12}}>
        <Text style={s.muted}>Si no tienes empresa, deja el nombre vacío y usa esta cara para presentarte profesionalmente.</Text>
        {(["name","opened","closed","services","location"] as const).map(key=><View key={key} style={{gap:4}}>
         <Text style={s.muted}>{{name:"Nombre de empresa (opcional)",opened:"Año de apertura",closed:"Año de cierre (opcional)",services:"Servicios (máximo 3, separados por comas)",location:"Dirección o localidad"}[key]}</Text>
         <TextInput accessibilityLabel={key} value={businessDraft[key]} onChangeText={v=>setBusinessDraft(d=>({...d,[key]:v}))} placeholderTextColor={colors.muted} style={{color:colors.ink,borderColor:colors.line,borderWidth:1,padding:12,borderRadius:10}}/>
        </View>)}
        <Text style={s.muted}>El check de licencia comercial solo se activa después de verificar la documentación, no al editar estos datos.</Text>
        <Button title="Guardar presentación o negocio" onPress={saveBusiness}/>
       </View>
      </BottomSheet>
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
          <Text style={[s.h3,{fontSize:15}]}>Meses de trabajo</Text>
          <Text style={s.muted}>Selecciona el mes de inicio y de finalización. Enero = 1; diciembre = 12.</Text>
          {(["fromMonth","toMonth"] as const).map(key=><View key={key} style={{gap:6}}>
           <Text style={s.muted}>{key==="fromMonth"?"Mes de inicio":"Mes de término"}</Text>
           <View style={{flexDirection:"row",flexWrap:"wrap",gap:6}}>{["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"].map((month,index)=><Pressable key={month} accessibilityRole="button" accessibilityState={{selected:Number(draft[key])===index+1}} onPress={()=>setDraft(d=>({...d,[key]:String(index+1)}))} style={{minWidth:"22%",minHeight:42,borderWidth:1,borderColor:colors.line,borderRadius:10,alignItems:"center",justifyContent:"center",backgroundColor:Number(draft[key])===index+1?colors.accent:colors.card}}><Text style={{color:colors.ink,fontWeight:Number(draft[key])===index+1?"700":"400"}}>{month}</Text></Pressable>)}</View>
          </View>)}
          <Text style={[s.h3,{fontSize:15}]}>Contacto de la empresa (opcional)</Text>
          <Text style={s.muted}>Estos datos ayudan a identificar a tu empleador. No implican que la experiencia esté verificada.</Text>
          <Text style={s.muted}>Dirección de la empresa</Text>
          <TextInput accessibilityLabel="Dirección de la empresa" placeholder="Calle, ciudad, estado" placeholderTextColor={colors.muted} value={draft.address} onChangeText={v=>setDraft(d=>({...d,address:v}))} style={{color:colors.ink,borderColor:colors.line,borderWidth:1,padding:14,borderRadius:10}}/>
          <Text style={s.muted}>Teléfono o correo de la empresa</Text>
          <TextInput accessibilityLabel="Teléfono o correo de la empresa" placeholder="Teléfono o email de contacto" placeholderTextColor={colors.muted} value={draft.contact} onChangeText={v=>setDraft(d=>({...d,contact:v}))} autoCapitalize="none" style={{color:colors.ink,borderColor:colors.line,borderWidth:1,padding:14,borderRadius:10}}/>
          <Text style={s.muted}>Puedes editar estos datos cuando quieras. Al modificarlos se reinicia la verificación de la empresa.</Text>
          <Button title="Guardar" onPress={add} />
        </View>
      </BottomSheet>
    </SafeAreaView>
  );
}
