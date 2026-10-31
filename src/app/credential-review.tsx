import { useCallback, useState } from "react";
import { Linking, Text, TextInput, View } from "react-native";
import { Button, Chips, Notice, Screen, useUi } from "../components/ui";
import { ProfessionalStatus } from "../components/ProfessionalStatus";
import { credentialPreview, loadQueue, professionalMutation } from "../lib/professional-api";
import { CREDENTIAL_STATUS } from "../lib/professional-types";
import { useProfessionalAction, useProfessionalData } from "../state/useProfessionalData";
export default function CredentialReview(){
 const {s,colors}=useUi();const [filter,setFilter]=useState<"pending"|"approved"|"rejected">("pending");
 const queue=useProfessionalData(useCallback(()=>loadQueue(filter),[filter]));const action=useProfessionalAction(queue.reload);
 const [reason,setReason]=useState("");
 return <Screen title="Revisión de acreditaciones." subtitle="Acceso reservado al equipo de revisión documental.">
 {!!action.notice&&<Notice text={action.notice} onClose={()=>action.setNotice("")}/>}
 {queue.loading||queue.error?<ProfessionalStatus loading={queue.loading} error={queue.error} retry={queue.reload}/>:<>
  <Chips values={["pending","approved","rejected"] as const} value={filter} onChange={setFilter} label="Estado de solicitudes"/>
  <View style={s.panel}><Text style={s.muted}>Hasta 200 solicitudes del estado seleccionado, en orden de llegada.</Text><Text style={s.h3}>Motivo de decisión</Text><TextInput accessibilityLabel="Motivo documentado de aprobación o rechazo" value={reason} onChangeText={setReason} multiline style={{padding:12,minHeight:80,color:colors.ink,borderColor:colors.line,borderWidth:1,borderRadius:10}}/>
  <Text style={s.muted}>Contrasta el documento con la autoridad emisora. En organizaciones, confirma también el tipo de institución y el alcance profesional solicitado.</Text></View>
  {queue.data?.filter(r=>r.status===filter).map(r=><View key={r.id} style={s.panel}>
   <Text style={s.h3}>{r.owner} · {r.label}</Text><Text style={s.tag}>{CREDENTIAL_STATUS[r.status]}</Text><Text style={s.muted}>{r.request_kind==="organization"?"Acreditación de organización":"Licencia personal"}</Text>
   <Button secondary title="Abrir documento privado (enlace temporal)" onPress={()=>void action.run(async()=>{await Linking.openURL(await credentialPreview(r.storage_path));},"Documento abierto.")}/>
   {!!r.reason&&<Text style={s.text}>{r.reason}</Text>}
   {r.status==="pending"&&<View style={{gap:8}}>
    <Button title={action.busy?"Procesando…":"Aprobar"} onPress={()=>void action.run(()=>professionalMutation("jobin_decide_credential",{request:r.id,approve:true,reason}),"Acreditación aprobada.")}/>
    <Button secondary title="Rechazar" onPress={()=>void action.run(()=>professionalMutation("jobin_decide_credential",{request:r.id,approve:false,reason}),"Solicitud rechazada con motivo.")}/>
   </View>}
  </View>)}
  {queue.data?.filter(r=>r.status===filter).length===0&&<Text style={s.muted}>No hay solicitudes en este estado.</Text>}
 </>}
 </Screen>;
}
