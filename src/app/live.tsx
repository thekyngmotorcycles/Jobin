import { useState } from "react";
import { Text, View } from "react-native";
import { Button, Chips, Notice, Screen, useUi } from "../components/ui";
export default function Live(){
 const {s}=useUi();const [mode,setMode]=useState<"Público"|"Privado">("Público");const [notice,setNotice]=useState("");
 return <Screen title="Tu trabajo, en vivo." subtitle="Comparte tu día o conversa en privado.">
 <View style={s.panel}><Chips values={["Público","Privado"] as const} value={mode} onChange={setMode} label="Privacidad del live"/>
 <Text style={s.h2}>{mode==="Público"?"Muestra lo que sabes hacer.":"Una conversación, solo por invitación."}</Text>
 <Text style={s.muted}>{mode==="Público"?"Comparte tu rutina profesional con la comunidad.":"Entrevistas y consultas con participantes autorizados. Los enlaces públicos no darán acceso a una sala privada."}</Text>
 <Button title={mode==="Público"?"Preparar live público":"Preparar entrevista privada"} onPress={()=>setNotice("La transmisión aún no está habilitada. Las salas, permisos e invitaciones están contemplados en Supabase; falta conectar el proveedor de video en vivo.")}/></View>
 {!!notice&&<Notice text={notice} onClose={()=>setNotice("")}/>}
 </Screen>;
}
