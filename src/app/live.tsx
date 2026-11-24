import {useState} from "react";
import {router,useLocalSearchParams} from "expo-router";
import {Text,TextInput,View} from "react-native";
import {Button,Chips,Notice,PageFrame,PageState,useUi} from "../components/ui";
import {WorkRulesFields,useWorkDraft} from "../components/WorkRulesFields";
import {MyWorkMedia} from "../components/MyWorkMedia";
import {loadSafety,safetyMutation} from "../lib/safety-api";
import {livePreflight,liveVisibility,type LiveVisibility} from "../lib/live-preflight";
import {useScopedProfessionalAction,useProfessionalData} from "../state/useProfessionalData";

export default function Live(){
 const {s,colors}=useUi();const [visibility,setVisibility]=useState<LiveVisibility>("public");const [title,setTitle]=useState("");
 const draft=useWorkDraft(true);
 const {view}=useLocalSearchParams<{view?:string}>();
 const safety=useProfessionalData(loadSafety,false,true);const action=useScopedProfessionalAction(safety.reload,safety.scope);
 const interview=draft.activity==="interview";
 const selectedVisibility=liveVisibility(draft.activity,visibility);
 const readiness=livePreflight({
  safety:safety.data,options:draft.options.data,safetyScope:safety.scope,optionsScope:draft.options.scope,
  loading:safety.loading||draft.options.loading,error:!!safety.error||!!draft.options.error,title,
  profession:draft.profession,activity:draft.activity,employer:draft.employer,consent:draft.consent
 });
 function requestLive(){
  if(!readiness.ready||action.busy)return;
  const payload={title:title.trim(),profession:draft.profession,activity:draft.activity,employer:draft.employer,visibility:selectedVisibility,consent:draft.consent};
  void action.run(async(scope,check)=>{
   await check();
   await safetyMutation("jobin_request_work_live",payload,scope);
  },"Solicitud registrada. El estudio permanece privado hasta recibir supervisión válida.");
 }
 return <PageFrame kind="form">
  {!!action.notice&&<Notice text={action.notice} onClose={()=>action.setNotice("")}/>}
  {view==="studio"&&<MyWorkMedia kind="live"/>}
  <View style={{gap:12}}>
   <Text accessibilityRole="header" style={s.h3}>Preparar transmisión</Text>
   {safety.loading?<PageState kind="loading" message="Comprobando disponibilidad…"/>:
    safety.error?<PageState kind="error" message={safety.error} actionLabel="Reintentar" onAction={safety.reload}/>:
    safety.data?.mediaBlocked||safety.data?.accountBlocked||safety.data?.permanent?
     <PageState kind="info" message="Tu cuenta tiene una restricción de publicación." actionLabel="Ver mi sanción y apelaciones" onAction={()=>router.push("/safety")}/>:
    safety.data&&!safety.data.providersReady?
     <PageState kind="info" message="El servicio de video y moderación aún no está disponible. No se iniciará un Live sin supervisión." actionLabel="Comprobar disponibilidad" onAction={safety.reload}/>:null}
   <Text style={s.formLabel}>Título</Text>
   <TextInput accessibilityLabel="Título del Live" placeholder="¿En qué estás trabajando?" placeholderTextColor={colors.muted} value={title} onChangeText={setTitle} maxLength={160} editable={!action.busy} style={s.formInput}/>
   <Text style={s.formLabel}>Visibilidad</Text>
   {interview?<Text style={s.text}>Privado · Las entrevistas no pueden ser públicas.</Text>:
    <Chips values={["public","private"] as const} value={visibility} onChange={setVisibility} getLabel={item=>item==="public"?"Público":"Privado"} label="Visibilidad del Live"/>}
   <WorkRulesFields draft={draft} live/>
   {!readiness.ready&&safety.data?.providersReady&&!safety.data.mediaBlocked&&!safety.data.accountBlocked&&!safety.data.permanent&&<Text accessibilityLiveRegion="polite" style={s.muted}>{readiness.reason}</Text>}
   <Button title="Solicitar Live supervisado" busy={action.busy} busyLabel="Preparando…" disabled={!readiness.ready} onPress={requestLive}/>
   <Button variant="tertiary" title="Leer borrador de Términos" onPress={()=>router.push("/terms")}/>
  </View>
  {view!=="studio"&&<MyWorkMedia kind="live"/>}
 </PageFrame>;
}
