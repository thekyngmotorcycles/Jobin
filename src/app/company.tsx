import { useState } from "react";
import * as DocumentPicker from "expo-document-picker";
import { Text, TextInput, View } from "react-native";
import { Button, Notice, Screen, useUi } from "../components/ui";
import { requireSupabase } from "../lib/supabase";
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
 <View style={s.panel}><Text style={s.h2}>Personas verificadas · 0</Text><Text style={s.h3}>Trabajadores actuales</Text><Text style={s.muted}>Sin registros confirmados.</Text>
 <Text style={s.h3}>Trabajaron aquí</Text><Text style={s.muted}>Sin registros anteriores. Las relaciones laborales con consentimiento del trabajador y aprobación de la compañía conservarán su historial; no podrán eliminarse desde las cuentas.</Text></View>
 </Screen>;
}
