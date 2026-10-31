import { useEffect } from "react";
import { Linking,Text,View } from "react-native";
import { router } from "expo-router";
import { useIsFocused } from "@react-navigation/native";
import { Button,Notice,useUi } from "./ui";
import { loadMyMedia,safetyMutation } from "../lib/safety-api";
import { useProfessionalAction,useProfessionalData } from "../state/useProfessionalData";
const labels:Record<string,string>={pending:"Pendiente de procesamiento/proveedor",processing:"Procesando",moderating:"En moderación",live:"En vivo",published:"Publicado",held:"En revisión",blocked:"Contenido bloqueado",ended:"Finalizado",failed:"Procesamiento fallido"};
export function MyWorkMedia(){
 const {s}=useUi();const resource=useProfessionalData(loadMyMedia);const focused=useIsFocused();const action=useProfessionalAction(resource.reload);
 useEffect(()=>{if(!focused)return;const timer=setInterval(resource.reload,5000);return()=>clearInterval(timer);},[focused,resource.reload]);
 return <View style={s.panel}><Text style={s.h2}>Mis videos y lives</Text>
  {!!resource.error&&<Text style={s.muted}>{resource.error}</Text>}
  {!!action.notice&&<Notice text={action.notice} onClose={()=>action.setNotice("")}/>}
  {resource.data?.map(m=><View key={m.id} style={{gap:8}}>
   <Text style={s.h3}>{m.title}</Text><Text style={s.tag}>{labels[m.status]??m.status}</Text>
   {m.publisherUrl&&<Button title="Abrir estudio privado de transmisión" onPress={()=>void action.run(()=>Linking.openURL(m.publisherUrl!),"Estudio abierto. Solo se publica mientras exista supervisión activa.")}/>}
   {["live","published"].includes(m.status)&&<Button secondary title="Ver publicación" onPress={()=>router.push({pathname:"/work-media/[id]",params:{id:m.id}})}/>}
   {m.kind==="live"&&["pending","moderating","live"].includes(m.status)&&<Button secondary title="Finalizar solicitud o Live" onPress={()=>void action.run(()=>safetyMutation("jobin_end_work_live",{media:m.id}),"Live finalizado.")}/>}
  </View>)}
  {!resource.loading&&resource.data?.length===0&&<Text style={s.muted}>Todavía no hay solicitudes de publicación.</Text>}
  <Text style={s.muted}>Un estado pendiente no significa que el contenido haya sido analizado o publicado.</Text>
 </View>;
}
