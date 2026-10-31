import { useState } from "react";
import * as DocumentPicker from "expo-document-picker";
import { router } from "expo-router";
import { Text, View } from "react-native";
import { Button, Notice, Screen, useUi } from "../components/ui";
import { ProfessionPicker } from "../components/ProfessionPicker";
import { ProfessionalStatus } from "../components/ProfessionalStatus";
import { loadCatalog, loadWorkspace, uploadCredential } from "../lib/professional-api";
import { CREDENTIAL_STATUS } from "../lib/professional-types";
import { useProfessionalAction, useProfessionalData } from "../state/useProfessionalData";

export default function Certificates(){
 const {s}=useUi();const workspace=useProfessionalData(loadWorkspace);const catalog=useProfessionalData(loadCatalog);
 const action=useProfessionalAction(workspace.reload);
 const [profession,setProfession]=useState("");const [file,setFile]=useState<DocumentPicker.DocumentPickerAsset|null>(null);
 const w=workspace.data;
 async function pick(){try{const result=await DocumentPicker.getDocumentAsync({type:["application/pdf","image/jpeg","image/png"],copyToCacheDirectory:true});if(!result.canceled)setFile(result.assets[0]);}catch(e){action.setNotice(e instanceof Error?e.message:String(e));}}
 return <Screen title="Certifica tu profesión." subtitle="Documentos privados. Ningún archivo concede un sello sin revisión.">
 {!w?<ProfessionalStatus loading={workspace.loading} error={workspace.error} retry={workspace.reload}/>:<>
  {!!action.notice&&<Notice text={action.notice} onClose={()=>action.setNotice("")}/>}
  <View style={s.panel}>
   <Text style={s.h2}>{w.organization?"Solicitar sello preaprobado":"Certificados y licencias personales"}</Text>
   <Text style={s.muted}>{w.organization?"La revisión acredita a esta organización para el rubro elegido. No permite otorgar otros sellos.":"Primero agrega la profesión a tu JCard. Los sellos aprobados por documentos propios se conservan al salir de una empresa."}</Text>
   {!!catalog.error&&<Text style={s.muted}>{catalog.error}</Text>}
   <ProfessionPicker catalog={catalog.data} value={profession} onChange={setProfession}/>
   <Button secondary title={file?.name??"Seleccionar PDF, JPEG o PNG · máx. 10 MB"} onPress={()=>void pick()}/>
   <Button title={action.busy?"Enviando…":"Enviar a revisión"} onPress={()=>void action.run(async()=>{if(!file||!profession)throw new Error("Selecciona una profesión y un documento.");await uploadCredential(file,profession);setFile(null);},"Solicitud registrada como pendiente.")}/>
   <Button secondary title="Editar mis profesiones" onPress={()=>router.push("/professional")}/>
  </View>
  <View style={s.panel}><Text style={s.h2}>Mis solicitudes</Text>
   {w.requests.length===0?<Text style={s.muted}>Aún no has enviado documentos.</Text>:w.requests.map(r=><View key={r.id} style={{gap:5}}>
    <Text style={s.h3}>{r.label}</Text><Text style={s.tag}>{CREDENTIAL_STATUS[r.status]}</Text>
    {!!r.reason&&<Text style={s.text}>{r.reason}</Text>}
    <Text style={s.muted}>{new Date(r.created_at).toLocaleDateString()}</Text>
   </View>)}
  </View>
 </>}
 </Screen>;
}
