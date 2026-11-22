import { useCallback,useRef,useState } from "react";
import {useFocusEffect} from "expo-router";
import { Linking, Text, TextInput, View } from "react-native";
import { Button, Chips, Notice, Screen, useUi } from "../components/ui";
import { ProfessionalStatus } from "../components/ProfessionalStatus";
import { credentialPreview, loadQueue, professionalMutation } from "../lib/professional-api";
import {assertMessageScope,captureMessageScope,type MessageScope} from "../lib/message-session";
import { CREDENTIAL_STATUS } from "../lib/professional-types";
import { useProfessionalAction, useProfessionalData } from "../state/useProfessionalData";
import type {CredentialRequest} from "../lib/professional-types";
export default function CredentialReview(){
 const {s,colors}=useUi();const [filter,setFilter]=useState<"pending"|"approved"|"rejected">("pending");
 const scopeRef=useRef<MessageScope|null>(null),revision=useRef(0);
 const [scope,setScope]=useState<MessageScope|null>(null);
 const [reason,setReason]=useState("");
 useFocusEffect(useCallback(()=>{
  const generation=++revision.current;scopeRef.current=null;setScope(null);setReason("");
  void captureMessageScope().then(origin=>{if(revision.current===generation){scopeRef.current=origin;setScope(origin);}}).catch(()=>{});
  return()=>{revision.current++;scopeRef.current=null;setScope(null);setReason("");};
 },[]));
 const queue=useProfessionalData(useCallback(async()=>{
  if(!scope)return null;
  const rows=await loadQueue(filter,scope);
  if(scopeRef.current!==scope)throw Error("La sesión cambió.");
  return {scope,filter,rows};
 },[filter,scope]));
 const action=useProfessionalAction(queue.reload);
 const rows=scope&&queue.data?.scope===scope&&queue.data.filter===filter?queue.data.rows:[];
 async function openDocument(r:CredentialRequest){
  const origin=scopeRef.current;
  if(!origin||!rows.some(row=>row.id===r.id&&row.storage_path===r.storage_path))return;
  await action.run(async()=>{
   const url=await credentialPreview(r.storage_path,origin);
   await assertMessageScope(origin);
   if(scopeRef.current!==origin)throw Error("La sesión cambió.");
   await Linking.openURL(url);
  },"Documento abierto.");
 }
 async function decide(r:CredentialRequest,approve:boolean){
  const origin=scopeRef.current;
  if(!origin||!rows.some(row=>row.id===r.id&&row.status==="pending"))return;
  await action.run(async()=>{
   await captureMessageScope(origin);
   if(scopeRef.current!==origin)throw Error("La sesión cambió.");
   await professionalMutation("jobin_decide_credential",{request:r.id,approve,reason},origin);
   await assertMessageScope(origin);
   if(scopeRef.current!==origin)throw Error("La sesión cambió.");
  },approve?"Acreditación aprobada.":"Solicitud rechazada con motivo.");
 }
 return <Screen title="Revisión de acreditaciones." subtitle="Acceso reservado al equipo de revisión documental.">
 {!!action.notice&&<Notice text={action.notice} onClose={()=>action.setNotice("")}/>}
 {!scope||queue.loading||queue.error?<ProfessionalStatus loading={queue.loading} error={queue.error} retry={queue.reload}/>:<>
  <Chips values={["pending","approved","rejected"] as const} value={filter} onChange={setFilter} label="Estado de solicitudes"/>
  <View style={s.panel}><Text style={s.muted}>Hasta 200 solicitudes del estado seleccionado, en orden de llegada.</Text><Text style={s.h3}>Motivo de decisión</Text><TextInput accessibilityLabel="Motivo documentado de aprobación o rechazo" value={reason} onChangeText={setReason} multiline style={{padding:12,minHeight:80,color:colors.ink,borderColor:colors.line,borderWidth:1,borderRadius:10}}/>
  <Text style={s.muted}>Contrasta el documento con la autoridad emisora. En organizaciones, confirma también el tipo de institución y el alcance profesional solicitado.</Text></View>
  {rows.map(r=><View key={r.id} style={s.panel}>
   <Text style={s.h3}>{r.owner} · {r.label}</Text><Text style={s.tag}>{CREDENTIAL_STATUS[r.status]}</Text><Text style={s.muted}>{r.request_kind==="organization"?"Acreditación de organización":"Licencia personal"}</Text>
   <Button secondary title="Abrir documento privado (enlace temporal)" onPress={()=>void openDocument(r)}/>
   {!!r.reason&&<Text style={s.text}>{r.reason}</Text>}
   {r.status==="pending"&&<View style={{gap:8}}>
    <Button title={action.busy?"Procesando…":"Aprobar"} onPress={()=>void decide(r,true)}/>
    <Button secondary title="Rechazar" onPress={()=>void decide(r,false)}/>
   </View>}
  </View>)}
  {rows.length===0&&<Text style={s.muted}>No hay solicitudes en este estado.</Text>}
 </>}
 </Screen>;
}
