import { useState } from "react";
import { router } from "expo-router";
import { Text,TextInput,View } from "react-native";
import { Button,Notice,Screen,useUi } from "../components/ui";
import { ProfessionalStatus } from "../components/ProfessionalStatus";
import { loadSafety,SAFETY_LABELS,safetyEnd,safetyMutation } from "../lib/safety-api";
import { useProfessionalAction,useProfessionalData } from "../state/useProfessionalData";
export default function Safety(){
 const {s,colors}=useUi();const resource=useProfessionalData(loadSafety);const action=useProfessionalAction(resource.reload);
 const [incident,setIncident]=useState("");const [reason,setReason]=useState("");const status=resource.data;
 return <Screen demo={false} title="Seguridad y apelaciones." subtitle="Motivos, duración y estado de tus restricciones.">
 {!status?<ProfessionalStatus loading={resource.loading} error={resource.error} retry={resource.reload}/>:<>
  {!!action.notice&&<Notice text={action.notice} onClose={()=>action.setNotice("")}/>}
  <View style={s.panel}><Text style={s.h2}>{status.permanent?"Cuenta bloqueada permanentemente":status.accountBlocked?"Cuenta suspendida":status.mediaBlocked?"Publicación restringida":"Sin restricciones activas"}</Text>
   <Text style={s.h3}>Contenido · {status.contentCount} strikes confirmados</Text>
   <Text style={s.text}>{status.permanent?"Bloqueo permanente. No podrás registrar otra cuenta con el mismo correo o teléfono verificado.":status.contentUntil?"Restricción de Lives y subida de videos hasta "+safetyEnd(status.contentUntil):"Sin restricción por este contador."}</Text>
   <Text style={s.muted}>1.º: 30 días · 2.º: 6 meses calendario · 3.º: bloqueo permanente.</Text>
   <Text style={s.h3}>Suplantación de empleador · {status.employerCount}</Text>
   <Text style={s.text}>{status.employerUntil?"Suspensión de cuenta hasta "+safetyEnd(status.employerUntil):"El primer caso queda registrado; a partir del segundo se suspende la cuenta por un año."}</Text>
   <Text style={s.muted}>Este contador es independiente del de contenido. Las faltas confirmadas permanecen en el registro profesional mientras no sean revocadas.</Text>
   {!!status.reason&&<Text style={s.text}>Último motivo: {status.reason}</Text>}
  </View>
  <View style={s.panel}><Text style={s.h2}>Decisiones y apelaciones</Text>
   {!status.incidents.length&&<Text style={s.muted}>No hay decisiones registradas.</Text>}
   {status.incidents.map(i=>{
    const appeal=status.appeals.find(a=>a.incident_id===i.id);
    return <View key={i.id} style={{gap:8}}>
     <Text style={s.h3}>{SAFETY_LABELS[i.category]??i.category}{i.voided_at?" · Revocada":""}</Text><Text style={s.text}>{i.reason}</Text><Text style={s.muted}>{new Date(i.issued_at).toLocaleString()}</Text>
     {appeal?<><Text style={s.tag}>Apelación: {appeal.status==="pending"?"Pendiente":appeal.status==="accepted"?"Aceptada":"Rechazada"}</Text>{!!appeal.decision_reason&&<Text style={s.muted}>{appeal.decision_reason}</Text>}</>:!i.voided_at&&<Button secondary title="Apelar esta decisión" onPress={()=>{setIncident(i.id);setReason("");}}/>}
     {incident===i.id&&!appeal&&<><TextInput accessibilityLabel="Motivo de apelación" placeholder="Explica por qué consideras incorrecta la decisión (mínimo 20 caracteres)" placeholderTextColor={colors.muted} value={reason} onChangeText={setReason} multiline style={{color:colors.ink,borderColor:colors.line,borderWidth:1,padding:12,minHeight:100,borderRadius:10}}/><Button title={action.busy?"Enviando…":"Enviar apelación"} onPress={()=>void action.run(()=>safetyMutation("jobin_appeal_safety",{incident:i.id,reason}),"Apelación registrada para revisión independiente.")}/></>}
    </View>;
   })}
  </View>
  {status.moderator&&<Button secondary title="Revisar denuncias y apelaciones" onPress={()=>router.push("/safety-review")}/>}
 </>}
 <Button secondary title="Leer borrador de Términos" onPress={()=>router.push("/terms")}/>
 <Button secondary title="Cuenta e inicio de sesión" onPress={()=>router.push("/account")}/>
 </Screen>;
}
