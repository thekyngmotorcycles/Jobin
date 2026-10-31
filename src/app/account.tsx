import { authSilver } from "../theme/auth-silver";
import { ProfessionPicker } from "../components/ProfessionPicker";
import { loadCatalog } from "../lib/professional-api";
import { useProfessionalData } from "../state/useProfessionalData";
import { ORGANIZATION_LABELS, type OrganizationKind } from "../lib/professional-types";
import { useState } from "react";
import { Text, View } from "react-native";
import { router } from "expo-router";
import { AuthAction, AuthField, AuthShell } from "../components/AuthForms";
import { startJobinSession } from "../components/AuthGate";
import { Chips, useUi } from "../components/ui";
import { requireSupabase } from "../lib/supabase";

const VALID_USERNAME = /^[a-z][a-z0-9_]{2,29}$/;
export default function Account() {
 const {colors,s}=useUi();
 const [kind,setKind]=useState<"personal"|"company">("personal");
 const [name,setName]=useState("");
 const [username,setUsername]=useState("");
 const [email,setEmail]=useState("");
 const [password,setPassword]=useState("");
 const [confirmPassword,setConfirmPassword]=useState("");
 const [profession,setProfession]=useState("");
 const [training,setTraining]=useState<"graduado"|"in_academy">("graduado");
 const [organizationKind,setOrganizationKind]=useState<OrganizationKind>("company");
 const catalog=useProfessionalData(loadCatalog);
 const [notice,setNotice]=useState("");
 const [busy,setBusy]=useState(false);
 async function submit(){
  if(busy)return;
  setNotice("");
  const handle=username.trim().replace(/^@/,"").toLowerCase();
  if(!name.trim()||!email.trim()||password.length<8){setNotice("Completa nombre, email y contraseña de al menos 8 caracteres.");return;}
  if(!VALID_USERNAME.test(handle)){setNotice("El usuario debe tener 3 a 30 caracteres: letras minúsculas, números o guiones bajos; comienza con una letra.");return;}
  if(password!==confirmPassword){setNotice("Las contraseñas no coinciden.");return;}
  if(kind==="personal"&&!profession){setNotice("Selecciona tu profesión en el catálogo.");return;}
  setBusy(true);
  try{
   const client=requireSupabase();
   const {data:existing,error:lookupError}=await client.from("usernames").select("username").eq("username",handle).maybeSingle();
   if(lookupError)throw lookupError;
   if(existing){setNotice("Ese nombre de usuario ya está en uso. Elige otro.");return;}
   const {data,error}=await client.auth.signUp({email:email.trim().toLowerCase(),password,options:{data:{display_name:name.trim(),username:handle,account_type:kind,profession_code:kind==="personal"?profession:null,training_status:training,organization_kind:kind==="company"?organizationKind:null}}});
   if(error)throw error;
   if(!data.user)throw new Error("No se pudo crear la cuenta.");
   let session=data.session;
   if(!session){
    const signed=await client.auth.signInWithPassword({email:email.trim().toLowerCase(),password});
    if(signed.error||!signed.data.session)throw new Error("La cuenta fue registrada, pero no se pudo iniciar sesión. Intenta entrar desde Log in.");
    session=signed.data.session;
   }
   const {error:claimError}=await client.from("usernames").insert({user_id:session.user.id,username:handle});
   if(claimError && claimError.code!=="23505")throw claimError;
   if(claimError) {
    const {data:owned}=await client.from("usernames").select("username").eq("user_id",session.user.id).maybeSingle();
    if(owned?.username!==handle)throw new Error("El nombre de usuario ya está ocupado. Cambia tu usuario desde el perfil.");
   }
   await startJobinSession();
   setPassword("");setConfirmPassword("");
   router.replace("/videos");
  }catch(error){setNotice(error instanceof Error?error.message:"No se pudo completar el registro.");}
  finally{setBusy(false);}
 }
 return <AuthShell title="Sign up" footer={<AuthAction secondary label="¿Ya tienes cuenta? Log in" onPress={()=>router.replace("/login")}/>}>
  <Text style={{fontSize:13,color:authSilver.tone1,textAlign:"center"}}>Crea tu identidad profesional en Jobin.</Text>
  <Text style={{fontWeight:"700",color:authSilver.tone2}}>Tipo de cuenta</Text>
  <Chips values={["personal","company"] as const} value={kind} onChange={setKind} label="Tipo de cuenta"/>
  {kind==="company"?<View style={{gap:8}}>
   <Text style={{fontWeight:"700",color:authSilver.tone2}}>Tipo de organización</Text>
   {(["company","education","government"] as const).map(value=><AuthAction key={value} secondary label={(value===organizationKind?"✓ ":"")+ORGANIZATION_LABELS[value]} onPress={()=>setOrganizationKind(value)}/>)}
  </View>:<View style={{gap:8}}>
   <Text style={{fontWeight:"700",color:authSilver.tone2}}>Profesión</Text>
   {!!catalog.error&&<Text style={{color:authSilver.tone3}}>{catalog.error}</Text>}
   <ProfessionPicker catalog={catalog.data} value={profession} onChange={setProfession}/>
   <Chips values={["graduado","in_academy"] as const} value={training} onChange={setTraining} label="Formación"/>
  </View>}
  <AuthField label="Nombre completo / empresa" placeholder="Tu nombre" value={name} onChangeText={setName} autoCapitalize="words"/>
  <AuthField label="Nombre de usuario" placeholder="@usuario_en_minusculas" value={username} onChangeText={value=>setUsername(value.toLowerCase().replace(/[^a-z0-9_@]/g,""))}/>
  <AuthField label="Email" placeholder="Tu correo" value={email} onChangeText={setEmail} keyboardType="email-address"/>
  <AuthField label="Contraseña" placeholder="Mínimo 8 caracteres" value={password} onChangeText={setPassword} secure/>
  <AuthField label="Confirmar contraseña" placeholder="Repite tu contraseña" value={confirmPassword} onChangeText={setConfirmPassword} secure/>
  {!!notice&&<Text accessibilityLiveRegion="polite" style={{color:authSilver.tone3}}>{notice}</Text>}
  <AuthAction label={busy?"CREANDO…":"SIGN UP"} onPress={()=>void submit()} disabled={busy}/>
 </AuthShell>;
}
