import { useCallback,useRef,useState } from "react";
import {pickSecuredEvidence} from "../lib/private-attachment-android";
import type {PendingEvidence} from "../lib/private-attachment";
import { router,useFocusEffect } from "expo-router";
import { Text, View } from "react-native";
import { Button, Notice, Screen, useUi } from "../components/ui";
import { ProfessionPicker } from "../components/ProfessionPicker";
import { ProfessionalStatus } from "../components/ProfessionalStatus";
import { loadCatalog, loadWorkspace, uploadCredential } from "../lib/professional-api";
import {assertMessageScope,captureMessageScope,type MessageScope} from "../lib/message-session";
import { CREDENTIAL_STATUS } from "../lib/professional-types";
import { useProfessionalAction, useProfessionalData } from "../state/useProfessionalData";

export default function Certificates(){
 const {s}=useUi();const workspace=useProfessionalData(loadWorkspace);const catalog=useProfessionalData(loadCatalog);
 const action=useProfessionalAction(workspace.reload);
 const scopeRef=useRef<MessageScope|null>(null),revision=useRef(0),picking=useRef(false);
 const [scope,setScope]=useState<MessageScope|null>(null);
 const [profession,setProfession]=useState("");const [file,setFile]=useState<{asset:PendingEvidence;scope:MessageScope}|null>(null);
 const w=workspace.data?.card.id===scope?.owner?workspace.data:null;
 useFocusEffect(useCallback(()=>{
  const generation=++revision.current;scopeRef.current=null;setScope(null);setFile(null);setProfession("");
  void captureMessageScope().then(origin=>{if(revision.current===generation){scopeRef.current=origin;setScope(origin);}}).catch(()=>{});
  return()=>{revision.current++;scopeRef.current=null;setScope(null);setFile(null);setProfession("");};
 },[]));
 async function pick(){
  const origin=scopeRef.current;
  if(!origin||origin.owner!==w?.card.id||picking.current)return;
  picking.current=true;
  try{
   await captureMessageScope(origin);
   if(scopeRef.current!==origin)return;
   const [asset]=await pickSecuredEvidence(origin,["application/pdf","image/jpeg","image/png"]);
   await assertMessageScope(origin);
   if(scopeRef.current===origin&&asset)setFile({asset,scope:origin});
  }catch(e){if(scopeRef.current===origin)action.setNotice(e instanceof Error?e.message:String(e));}
  finally{picking.current=false;}
 }
 async function submit(){
  const origin=scopeRef.current,selected=file;
  if(!origin||origin.owner!==w?.card.id)return;
  await action.run(async()=>{
   if(!selected||selected.scope!==origin||!profession)throw Error("Selecciona una profesión y un documento.");
   await captureMessageScope(origin);
   if(scopeRef.current!==origin)throw Error("La sesión cambió.");
   await uploadCredential(selected.asset,profession,origin);
   await assertMessageScope(origin);
   if(scopeRef.current!==origin)throw Error("La sesión cambió.");
   setFile(null);
  },"Solicitud registrada como pendiente.");
 }
 return <Screen title="Certifica tu profesión." subtitle="Documentos privados. Ningún archivo concede un sello sin revisión.">
 {!w?<ProfessionalStatus loading={workspace.loading} error={workspace.error} retry={workspace.reload}/>:<>
  {!!action.notice&&<Notice text={action.notice} onClose={()=>action.setNotice("")}/>}
  <View style={s.panel}>
   <Text style={s.h2}>{w.organization?"Solicitar sello preaprobado":"Certificados y licencias personales"}</Text>
   <Text style={s.muted}>{w.organization?"La revisión acredita a esta organización para el rubro elegido. No permite otorgar otros sellos.":"Primero agrega la profesión a tu JCard. Los sellos aprobados por documentos propios se conservan al salir de una empresa."}</Text>
   {!!catalog.error&&<Text style={s.muted}>{catalog.error}</Text>}
   <ProfessionPicker catalog={catalog.data} value={profession} onChange={setProfession}/>
   <Button secondary title={file?.asset.name??"Seleccionar PDF, JPEG o PNG · máx. 2 MiB"} onPress={()=>void pick()}/>
   <Button title={action.busy?"Enviando…":"Enviar a revisión"} onPress={()=>void submit()}/>
   <Button secondary title="Editar mis profesiones" onPress={()=>router.push("/professional")}/>
  </View>
  <View style={s.panel}><Text style={s.h2}>Mis solicitudes</Text>
   {w.requests.length===0?<Text style={s.muted}>Aún no has enviado documentos.</Text>:w.requests.filter(r=>r.owner_id===scope?.owner).map(r=><View key={r.id} style={{gap:5}}>
    <Text style={s.h3}>{r.label}</Text><Text style={s.tag}>{CREDENTIAL_STATUS[r.status]}</Text>
    {!!r.reason&&<Text style={s.text}>{r.reason}</Text>}
    <Text style={s.muted}>{new Date(r.created_at).toLocaleDateString()}</Text>
   </View>)}
  </View>
 </>}
 </Screen>;
}
