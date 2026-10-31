import { ProfessionPicker } from "../components/ProfessionPicker";
import { loadCatalog } from "../lib/professional-api";
import { useProfessionalData } from "../state/useProfessionalData";
import { ORGANIZATION_LABELS, type OrganizationKind } from "../lib/professional-types";
import { useState } from "react";
import { Text, TextInput, View } from "react-native";
import { Button, Chips, Notice, Screen, useUi } from "../components/ui";
import { requireSupabase } from "../lib/supabase";
export default function Account(){
 const {s,colors}=useUi();const [kind,setKind]=useState<"personal"|"company">("personal");
 const [name,setName]=useState("");const [email,setEmail]=useState("");const [password,setPassword]=useState("");const [confirmPassword,setConfirmPassword]=useState("");
 const catalog=useProfessionalData(loadCatalog);const [profession,setProfession]=useState("");const [training,setTraining]=useState<"graduado"|"in_academy">("graduado");const [organizationKind,setOrganizationKind]=useState<OrganizationKind>("company");
 const [notice,setNotice]=useState("");const [busy,setBusy]=useState(false);
 async function submit(login:boolean){if(busy)return;setBusy(true);try{
  const client=requireSupabase();
  if(!email.trim()||password.length<8||(!login&&!name.trim()))throw new Error("Completa el nombre, email y una contraseña de al menos 8 caracteres.");
  if(!login && password!==confirmPassword)throw new Error("Las contraseñas no coinciden. Vuelve a escribirlas.");
  if(!login && kind==="personal"&&!profession)throw new Error("Selecciona tu profesión en el catálogo.");
  const result=login?await client.auth.signInWithPassword({email:email.trim(),password}):await client.auth.signUp({email:email.trim(),password,options:{data:{display_name:name.trim(),account_type:kind,profession_code:kind==="personal"?profession:null,training_status:training,organization_kind:kind==="company"?organizationKind:null}}});
  if(result.error)throw result.error;
  setPassword("");setConfirmPassword("");setNotice(login?"Sesión iniciada.":result.data.session?"Cuenta creada correctamente. Ya puedes usar Jobin.":"Cuenta creada, pero todavía no hay una sesión activa. Revisa la configuración de autenticación de Supabase.");
 }catch(error){setNotice(error instanceof Error?error.message:"No se pudo completar la operación.");}finally{setBusy(false);}}
 const input={borderWidth:1,borderColor:colors.line,color:colors.ink,padding:14,borderRadius:10,minHeight:48};
 return <Screen title="Empieza con tu historia." subtitle="Elige cómo participarás en Jobin.">
 {!!notice&&<Notice text={notice} onClose={()=>setNotice("")}/>}
 <View style={s.panel}><Text style={s.h2}>Tipo de cuenta</Text><Chips values={["personal","company"] as const} value={kind} onChange={setKind} label="Tipo de cuenta"/>
 <Text style={s.muted}>{kind==="personal"?"Personal: muestra tus habilidades, experiencia y servicios.":"Compañía: publica tu trabajo, acredita empleados y solicita verificación con tus licencias."}</Text>
 {kind==="company"?<View style={{gap:10}}><Text style={s.h3}>Tipo de organización</Text>{(["company","education","government"] as const).map(value=><Button key={value} secondary title={(value===organizationKind?"✓ ":"")+ORGANIZATION_LABELS[value]} onPress={()=>setOrganizationKind(value)}/>)}</View>:<View style={{gap:10}}><Text style={s.h3}>Profesión</Text>{!!catalog.error&&<Text style={s.muted}>{catalog.error}</Text>}<ProfessionPicker catalog={catalog.data} value={profession} onChange={setProfession}/><Chips values={["graduado","in_academy"] as const} value={training} onChange={setTraining} label="Formación: Graduado/Recibido o In academy"/></View>}
 <TextInput style={input} accessibilityLabel="Nombre personal o compañía" value={name} onChangeText={setName} placeholder="Nombre o razón social" placeholderTextColor={colors.muted} autoComplete="name"/>
 <TextInput style={input} accessibilityLabel="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoComplete="email" placeholder="Email" placeholderTextColor={colors.muted}/>
 <TextInput style={input} accessibilityLabel="Contraseña" value={password} onChangeText={setPassword} secureTextEntry autoComplete="new-password" placeholder="Contraseña" placeholderTextColor={colors.muted}/>
 <TextInput style={input} accessibilityLabel="Confirmar contraseña" value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry autoComplete="new-password" placeholder="Confirmar contraseña" placeholderTextColor={colors.muted}/>
 <Button title={busy?"Procesando…":"Crear cuenta"} onPress={()=>void submit(false)}/>
 <Button secondary title="Ya tengo cuenta · Entrar" onPress={()=>void submit(true)}/>
 <Button secondary title="Cerrar sesión" onPress={()=>{void (async()=>{try{const {error}=await requireSupabase().auth.signOut();setNotice(error?error.message:"Sesión cerrada.");}catch(error){setNotice(String(error));}})();}}/>
 </View></Screen>;
}
