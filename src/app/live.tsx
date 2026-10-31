import { useState } from "react";
import { router } from "expo-router";
import { Text,TextInput,View } from "react-native";
import { Button,Chips,Notice,Screen,useUi } from "../components/ui";
import { WorkRulesFields,useWorkDraft } from "../components/WorkRulesFields";
import { MyWorkMedia } from "../components/MyWorkMedia";
import { loadSafety,safetyMutation } from "../lib/safety-api";
import { useProfessionalAction,useProfessionalData } from "../state/useProfessionalData";
export default function Live(){
 const {s,colors}=useUi();const [visibility,setVisibility]=useState<"public"|"private">("public");const [title,setTitle]=useState("");
 const draft=useWorkDraft();const safety=useProfessionalData(loadSafety);const action=useProfessionalAction(safety.reload);
 return <Screen title="Tu trabajo, en vivo." subtitle="Hacer Live es opcional. Comparte tu labor profesional con supervisión activa.">
  {!!action.notice&&<Notice text={action.notice} onClose={()=>action.setNotice("")}/>}
  <View style={s.panel}>
   <TextInput accessibilityLabel="Título del Live" placeholder="¿En qué estás trabajando?" placeholderTextColor={colors.muted} value={title} onChangeText={setTitle} style={{color:colors.ink,padding:12,borderColor:colors.line,borderWidth:1,borderRadius:10}}/>
   <Chips values={["public","private"] as const} value={visibility} onChange={setVisibility} label="Live público o privado"/>
   <WorkRulesFields draft={draft} live/>
   {!!safety.error&&<Text style={s.muted}>{safety.error}</Text>}
   {safety.data&&!safety.data.providersReady&&<Text style={s.muted}>La transmisión está pendiente de conectar los proveedores de video y moderación. No se iniciará un Live sin supervisión.</Text>}
   {safety.data?.mediaBlocked&&<Button secondary title="Ver mi sanción y apelaciones" onPress={()=>router.push("/safety")}/>}
   <Button title={action.busy?"Preparando…":"Solicitar Live supervisado"} onPress={()=>void action.run(()=>safetyMutation("jobin_request_work_live",{title,profession:draft.profession,activity:draft.activity,employer:draft.employer,visibility,consent:draft.consent}),"Solicitud registrada. El estudio permanece privado hasta recibir supervisión válida.")}/>
   <Button secondary title="Leer borrador de Términos" onPress={()=>router.push("/terms")}/>
  </View>
  <MyWorkMedia/>
 </Screen>;
}
