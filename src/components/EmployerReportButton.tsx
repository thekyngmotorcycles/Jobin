import { useState } from "react";
import * as DocumentPicker from "expo-document-picker";
import { Text,TextInput,View } from "react-native";
import { BottomSheet } from "./social-ui";
import { Button,Notice,useUi } from "./ui";
import { loadWorkspace } from "../lib/professional-api";
import { submitEmployerReport } from "../lib/safety-api";
import { useProfessionalAction,useProfessionalData } from "../state/useProfessionalData";
export function EmployerReportButton({mediaId,creatorId}:{mediaId:string;creatorId:string}){
 const {s,colors}=useUi();const workspace=useProfessionalData(loadWorkspace);
 const [open,setOpen]=useState(false);const [description,setDescription]=useState("");const [file,setFile]=useState<DocumentPicker.DocumentPickerAsset|null>(null);
 const action=useProfessionalAction(()=>{});
 if(!workspace.data?.organization||workspace.data.card.id===creatorId)return null;
 async function pick(){try{const result=await DocumentPicker.getDocumentAsync({type:["application/pdf","image/jpeg","image/png"],copyToCacheDirectory:true});if(!result.canceled)setFile(result.assets[0]);}catch(e){action.setNotice(String(e));}}
 return <>
  <Button secondary title="Denunciar suplantación de empleador" onPress={()=>setOpen(true)}/>
  <BottomSheet visible={open} onClose={()=>setOpen(false)} title="Denunciar suplantación">
   <View style={{gap:12}}>
    <Text style={s.muted}>Denuncias en nombre de {workspace.data.card.name}. Debes aportar pruebas de la afirmación en este Live o video. La denuncia no genera un strike automáticamente.</Text>
    <TextInput accessibilityLabel="Descripción de la suplantación" value={description} onChangeText={setDescription} multiline placeholder="Qué afirmó y por qué no era empleado en ese momento" placeholderTextColor={colors.muted} style={{color:colors.ink,borderColor:colors.line,borderWidth:1,borderRadius:10,padding:12,minHeight:90}}/>
    <Button secondary title={file?.name??"Adjuntar prueba privada · máx. 10 MB"} onPress={()=>void pick()}/>
    <Button title={action.busy?"Enviando…":"Enviar denuncia a revisión"} onPress={()=>void action.run(async()=>{if(!file)throw new Error("Adjunta una prueba.");await submitEmployerReport(mediaId,description,file);},"Denuncia enviada. El equipo revisará las pruebas y la aprobación laboral en el momento del contenido.")}/>
    {!!action.notice&&<Notice text={action.notice} onClose={()=>action.setNotice("")}/>}
   </View>
  </BottomSheet>
 </>;
}
