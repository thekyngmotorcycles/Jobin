import { useState } from "react";
import { Linking,Pressable,Text,TextInput,View } from "react-native";
import { router } from "expo-router";
import { Button,Notice,Screen,useUi } from "../components/ui";
import { ProfessionalStatus } from "../components/ProfessionalStatus";
import { loadSafetyQueue,moderationPreview,reportEvidencePreview,safetyMutation,SAFETY_LABELS } from "../lib/safety-api";
import { useProfessionalAction,useProfessionalData } from "../state/useProfessionalData";
export default function SafetyReview(){
 const {s,colors}=useUi();const resource=useProfessionalData(loadSafetyQueue);const action=useProfessionalAction(resource.reload);
 const [reviewedAll,setReviewedAll]=useState<Record<string,boolean>>({});const [reason,setReason]=useState("");const [incidentTime,setIncidentTime]=useState("");const [category,setCategory]=useState("violence");
 return <Screen demo={false} title="Revisión de seguridad." subtitle="Decisiones independientes, documentadas y verificadas en el servidor.">
 {!!action.notice&&<Notice text={action.notice} onClose={()=>action.setNotice("")}/>}
 {!resource.data?<ProfessionalStatus loading={resource.loading} error={resource.error} retry={resource.reload}/>:<>
  <View style={s.panel}><Text style={s.h3}>Motivo documentado de la decisión</Text><TextInput accessibilityLabel="Motivo de decisión de moderación" value={reason} onChangeText={setReason} multiline style={{color:colors.ink,borderColor:colors.line,borderWidth:1,padding:12,minHeight:90,borderRadius:10}}/>
  <TextInput accessibilityLabel="Momento de grabación verificado para el video" placeholder="Grabación verificada: YYYY-MM-DDTHH:mm:ssZ" placeholderTextColor={colors.muted} value={incidentTime} onChangeText={setIncidentTime} style={{color:colors.ink,borderColor:colors.line,borderWidth:1,padding:12,borderRadius:10}}/>
  <Text style={s.muted}>Para videos, verifica cuándo se grabaron: publicar después de salir de una empresa no demuestra suplantación. La ausencia de un registro tampoco prueba por sí sola que no existió empleo.</Text>
  <Text style={s.muted}>Una denuncia no demuestra suplantación. Revisa las pruebas y la aprobación laboral en el momento del contenido. No puedes resolver tu propio caso.</Text></View>
  <Text style={s.h2}>Denuncias de empleador</Text>
  {resource.data.reports.map(r=><View key={r.id} style={s.panel}>
   <Text style={s.text}>{r.description}</Text>
   <Button secondary title="Abrir prueba privada" onPress={()=>void action.run(async()=>{await Linking.openURL(await reportEvidencePreview(r.evidence_path));},"Prueba abierta con acceso temporal.")}/>
   <Button secondary title="Ver contenido" onPress={()=>router.push({pathname:"/work-media/[id]",params:{id:r.work_media_id}})}/>
   <Button title="Confirmar suplantación" onPress={()=>void action.run(()=>safetyMutation("jobin_review_employer_report",{report:r.id,uphold:true,reason,incident_time:incidentTime.trim()?new Date(incidentTime).toISOString():undefined}),"Decisión registrada.")}/>
   <Button secondary title="Desestimar denuncia" onPress={()=>void action.run(()=>safetyMutation("jobin_review_employer_report",{report:r.id,uphold:false,reason}),"Denuncia desestimada.")}/>
  </View>)}
  {!resource.data.reports.length&&<Text style={s.muted}>Sin denuncias pendientes.</Text>}
  <Text style={s.h2}>Apelaciones</Text>
  {resource.data.appeals.map(a=><View key={a.id} style={s.panel}><Text style={s.text}>{a.reason}</Text>
   <Button title="Aceptar apelación y recalcular sanción" onPress={()=>void action.run(()=>safetyMutation("jobin_review_safety_appeal",{appeal:a.id,accept:true,reason}),"Apelación aceptada. El contenido no se republica automáticamente.")}/>
   <Button secondary title="Rechazar apelación" onPress={()=>void action.run(()=>safetyMutation("jobin_review_safety_appeal",{appeal:a.id,accept:false,reason}),"Apelación resuelta.")}/>
  </View>)}
  {!resource.data.appeals.length&&<Text style={s.muted}>Sin apelaciones pendientes.</Text>}
  <Text style={s.h2}>Hallazgos de baja confianza</Text>
  <Text style={s.muted}>Se mantienen fuera de publicación. No generan un strike automático.</Text>
  {resource.data.held.map(m=><View key={m.id} style={s.panel}><Text style={s.h3}>{m.title}</Text>
   <Button secondary title="Abrir contenido para revisión privada" onPress={()=>void action.run(async()=>{await Linking.openURL(await moderationPreview(m.id));},"Vista privada abierta.")}/>
   {["nudity","sexual_content","minors","blood","violence"].map(c=><Button key={c} secondary title={(category===c?"✓ ":"")+SAFETY_LABELS[c]} onPress={()=>setCategory(c)}/>)}
   <Pressable accessibilityRole="checkbox" accessibilityState={{checked:!!reviewedAll[m.id]}} onPress={()=>setReviewedAll(values=>({...values,[m.id]:!values[m.id]}))} style={{minHeight:44,justifyContent:"center"}}><Text style={s.text}>{reviewedAll[m.id]?"☑":"☐"} Revisé el contenido completo y las cinco categorías prohibidas.</Text></Pressable>
   <Button secondary title="Descartar hallazgo tras revisión humana" onPress={()=>void action.run(()=>safetyMutation("jobin_clear_held_media",{media:m.id,reviewed_all:!!reviewedAll[m.id],reason}),"Revisión humana registrada. Un Live no se reinicia; el video aún requiere confirmación del proveedor.")}/>
   <Button title="Confirmar infracción tras revisar las pruebas" onPress={()=>void action.run(()=>safetyMutation("jobin_confirm_held_media",{media:m.id,category,reason}),"Infracción confirmada.")}/>
  </View>)}
 </>}
 </Screen>;
}
