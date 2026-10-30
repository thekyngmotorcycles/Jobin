import { useState } from "react";
import * as DocumentPicker from "expo-document-picker";
import { Text, TextInput, View } from "react-native";
import { Button, Notice, Screen, useUi } from "../components/ui";
import { requireSupabase } from "../lib/supabase";
import { DEMO_PROFILE, DEMO_HISTORY } from "../lib/me";
export default function Company(){
 const {s,colors}=useUi();const [industry,setIndustry]=useState("");const [city,setCity]=useState("");const [state,setState]=useState("");
 const [notice,setNotice]=useState("");const [file,setFile]=useState<DocumentPicker.DocumentPickerAsset|null>(null);
 async function pick(){try{const result=await DocumentPicker.getDocumentAsync({type:["application/pdf","image/jpeg","image/png"],copyToCacheDirectory:true});if(!result.canceled)setFile(result.assets[0]);}catch(error){setNotice(String(error));}}
 async function request(){try{const client=requireSupabase();const {data:{user}}=await client.auth.getUser();
 if(!user)throw new Error("Inicia sesión con tu cuenta de compañía.");
 if(!industry.trim()||!city.trim()||!state.trim()||!file)throw new Error("Completa tu rubro, municipio, estado y selecciona un documento.");
 // Files stay local until the upload and human verification workflow is integrated.
 setNotice("Documento seleccionado: "+file.name+". Aún no se ha enviado. El flujo de revisión documental se encuentra preparado en la base de datos.");
 }catch(error){setNotice(error instanceof Error?error.message:String(error));}}
 const input={color:colors.ink,borderColor:colors.line,borderWidth:1,padding:14,borderRadius:10};
 return <Screen title="La confianza tiene historia." subtitle="Compañías, acreditaciones e historial laboral.">
 {!!notice&&<Notice text={notice} onClose={()=>setNotice("")}/>}
 <View style={s.panel}><Text style={s.h2}>Verificación de compañía</Text><Text style={s.tag}>Sin verificar</Text>
 <Text style={s.muted}>Las licencias y certificados se revisarán para el rubro, municipio y estado correspondientes. Adjuntar documentos no concede el sello automáticamente.</Text>
 <TextInput accessibilityLabel="Rubro" placeholder="Rubro" placeholderTextColor={colors.muted} value={industry} onChangeText={setIndustry} style={input}/>
 <TextInput accessibilityLabel="Municipio" placeholder="Municipio" placeholderTextColor={colors.muted} value={city} onChangeText={setCity} style={input}/>
 <TextInput accessibilityLabel="Estado" placeholder="Estado" placeholderTextColor={colors.muted} value={state} onChangeText={setState} style={input}/>
 <Button secondary title={file?file.name:"Adjuntar licencia o certificado"} onPress={()=>void pick()}/>
 <Button title="Preparar solicitud" onPress={()=>void request()}/></View>
 <View style={s.panel}><Text style={s.h2}>Empleados actuales · 1</Text>
 <View style={{flexDirection:"row",alignItems:"center",gap:12}}><Text style={s.h3}>{DEMO_PROFILE.name}</Text><Text style={s.tag}>Aprobado</Text></View>
 <Text style={s.muted}>Puede transmitir en vivo en nombre de la empresa solo con tu aprobación.</Text>
 <Text style={s.h2}>Ex empleados aprobados</Text>
 {DEMO_HISTORY.filter(entry=>entry.status==="approved"&&entry.verifiedBy&&entry.to!==null).map(entry=><View key={entry.id} style={{gap:4}}>
  <Text style={s.h3}>{DEMO_PROFILE.name} · {entry.role} ({entry.from}–{entry.to})</Text>
  <Text style={s.muted}>Registro permanente: no puede eliminarse del perfil de la empresa.</Text></View>)}
 </View>
</Screen>;
}
