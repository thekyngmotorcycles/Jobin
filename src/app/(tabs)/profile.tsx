import { useState } from "react";
import { KeyboardAvoidingView, Platform, Text, TextInput, View } from "react-native";
import { router } from "expo-router";
import { Button, Chips, Notice, Screen, useUi } from "../../components/ui";
import type { Relationship } from "../../lib/data";
import { useApp } from "../../state/AppProvider";
const statuses:readonly Relationship[]=["Prefiero no decirlo","Soltero/a","Casado/a","En una relación"];
export default function Profile(){
 const {s,colors}=useUi();const {name,setName,relationship,setRelationship}=useApp();
 const [draftName,setDraftName]=useState(name);const [status,setStatus]=useState(relationship);const [notice,setNotice]=useState("");
 function save(){if(!draftName.trim()){setNotice("Escribe tu nombre.");return;}setName(draftName.trim());setRelationship(status);setNotice("Perfil de demostración guardado en esta sesión.");}
 return <KeyboardAvoidingView style={{flex:1}} behavior={Platform.OS==="ios"?"padding":undefined}>
 <Screen title={name||"Tu trabajo, tu historia."} subtitle="Tu perfil es tu currículum vivo.">
 <View style={[s.row,{justifyContent:"space-between"}]}><View style={s.row}><View style={[s.avatar,{backgroundColor:colors.accent,width:64,height:64,borderRadius:32}]}><Text style={s.h2}>{name?name.slice(0,2).toUpperCase():"TÚ"}</Text></View>
 <View><Text style={s.h3}>☆ Sin puntuación</Text><Text style={s.muted}>0 contrataciones valoradas</Text></View></View>
 <Button secondary title="☰ Ajustes" onPress={()=>router.push("/settings")}/></View>
 {!!notice&&<Notice text={notice} onClose={()=>setNotice("")}/>}
 <View style={s.panel}><Text style={s.h2}>Editar perfil</Text><Text style={s.text}>Nombre público</Text>
 <TextInput accessibilityLabel="Nombre público" value={draftName} onChangeText={setDraftName} maxLength={80} placeholder="Tu nombre" placeholderTextColor={colors.muted} style={{color:colors.ink,borderColor:colors.line,borderWidth:1,padding:14,borderRadius:10}}/>
 <Text style={s.text}>Estado sentimental · opcional</Text><Chips values={statuses} value={status} onChange={setStatus} label="Estado sentimental"/>
 <Button title="Guardar perfil demo" onPress={save}/></View>
 <View style={s.panel}><Text style={s.h2}>Experiencia laboral</Text><Text style={s.muted}>Sin empresas confirmadas. Las experiencias aprobadas por la empresa aparecerán como actuales o anteriores y conservarán su historial.</Text><Button secondary title="Ver historial de compañía" onPress={()=>router.push("/company")}/></View>
 <View style={s.panel}><Text style={s.h2}>Constancia</Text><Text style={s.text}>0 días registrados · 0 recompensas</Text><Text style={s.muted}>La actividad y las pruebas de trabajo se mostrarán por separado. Abrir la app no acredita experiencia laboral.</Text></View>
 <View style={s.panel}><Text style={s.h2}>Reviews</Text><Text style={s.muted}>Solo quien te contrató puede valorar una contratación completada. Las puntuaciones de 1 a 3 estrellas requieren fotos y una descripción; puedes disputarlas.</Text></View>
 </Screen></KeyboardAvoidingView>;
}
