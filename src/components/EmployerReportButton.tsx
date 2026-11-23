import { useEffect,useRef,useState } from "react";
import {captureMessageScope,assertMessageScope,type MessageScope} from "../lib/message-session";
import {pickSecuredEvidence} from "../lib/private-attachment-android";
import type {PendingEvidence} from "../lib/private-attachment";
import { Text,TextInput,View } from "react-native";
import { BottomSheet } from "./social-ui";
import { Button,Notice,useUi } from "./ui";
import { loadWorkspace } from "../lib/professional-api";
import { submitEmployerReport } from "../lib/safety-api";
import { useScopedProfessionalAction,useProfessionalData } from "../state/useProfessionalData";
export function EmployerReportButton({mediaId,creatorId}:{mediaId:string;creatorId:string}){
 const {s,colors}=useUi();const workspace=useProfessionalData(loadWorkspace,false,true);
 const [open,setOpen]=useState(false);const [description,setDescription]=useState("");const [file,setFile]=useState<PendingEvidence|null>(null);
 const action=useScopedProfessionalAction(()=>{},workspace.scope);
 const reportScope=useRef<MessageScope|null>(null),picking=useRef(false),generation=useRef(0);
 const owner=workspace.scope?.owner,session=workspace.scope?.session;
 function close(){generation.current++;reportScope.current=null;setOpen(false);setDescription("");setFile(null);}
 useEffect(()=>{close();},[owner,session,mediaId,creatorId]);
 async function begin(){
  if(!workspace.scope||workspace.data?.card.id!==workspace.scope.owner)return;
  const revision=++generation.current;
  try{const scope=await captureMessageScope(workspace.scope);if(generation.current!==revision)return;reportScope.current=scope;setDescription("");setFile(null);setOpen(true);}
  catch{close();}
 }
 if(!workspace.data?.organization||workspace.data.card.id===creatorId)return null;
 async function pick(){
  const scope=reportScope.current,revision=generation.current;if(!scope||picking.current)return;picking.current=true;
  try{await captureMessageScope(scope);if(generation.current!==revision)return;
   const [selected]=await pickSecuredEvidence(scope,["application/pdf","image/jpeg","image/png"]);
   await assertMessageScope(scope);if(generation.current!==revision||reportScope.current!==scope)return;
   if(selected)setFile(selected);
  }catch(e){if(generation.current===revision)action.setNotice(e instanceof Error?e.message:"No se pudo abrir la prueba.");}
  finally{picking.current=false;}
 }
 return <>
  <Button secondary title="Denunciar suplantación de empleador" onPress={()=>void begin()}/>
  <BottomSheet visible={open} onClose={close} title="Denunciar suplantación">
   <View style={{gap:12}}>
    <Text style={s.muted}>Denuncias en nombre de {workspace.data.card.name}. Debes aportar pruebas de la afirmación en este Live o video. La denuncia no genera un strike automáticamente.</Text>
    <TextInput accessibilityLabel="Descripción de la suplantación" value={description} onChangeText={setDescription} multiline placeholder="Qué afirmó y por qué no era empleado en ese momento" placeholderTextColor={colors.muted} style={{color:colors.ink,borderColor:colors.line,borderWidth:1,borderRadius:10,padding:12,minHeight:90}}/>
    <Button secondary title={file?.name??"Adjuntar prueba privada · máx. 2 MiB"} onPress={()=>void pick()}/>
    <Button title={action.busy?"Enviando…":"Enviar denuncia a revisión"} onPress={()=>void action.run(async(scope,check)=>{const original=reportScope.current,revision=generation.current;if(!file||!original||original.owner!==scope.owner||original.session!==scope.session)throw new Error("Adjunta una prueba en esta sesión.");await check();if(generation.current!==revision)throw Error("La solicitud cambió.");await submitEmployerReport(mediaId,description,file,scope);await check();if(generation.current===revision)close();},"Denuncia enviada. El equipo revisará las pruebas y la aprobación laboral en el momento del contenido.")}/>
    {!!action.notice&&<Notice text={action.notice} onClose={()=>action.setNotice("")}/>}
   </View>
  </BottomSheet>
 </>;
}
