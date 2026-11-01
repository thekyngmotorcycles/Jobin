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
 const [kind,setKind]=useState<"personal"|"company"|"both">("personal");
 const [name,setName]=useState("");
 const [username,setUsername]=useState("");
 const [email,setEmail]=useState("");
 const [phone,setPhone]=useState("");
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
  if(!name.trim()||!email.trim()||!/^\+[1-9]\d{7,14}$/.test(phone.trim())||password.length<8){setNotice("Completa nombre, correo, teléfono internacional (+código de país) y contraseña de al menos 8 caracteres.");return;}
  if(!VALID_USERNAME.test(handle)){setNotice("El usuario debe tener 3 a 30 caracteres: letras minúsculas, números o guiones bajos; comienza con una letra.");return;}
  if(password!==confirmPassword){setNotice("Las contraseñas no coinciden.");return;}
  setBusy(true);
  try{
   const client=requireSupabase();
   const {data:existing,error:lookupError}=await client.from("usernames").select("username").eq("username",handle).maybeSingle();
   if(lookupError)throw lookupError;
   if(existing){setNotice("Ese nombre de usuario ya está en uso. Elige otro.");return;}
   const {data,error}=await client.auth.signUp({email:email.trim().toLowerCase(),password,options:{data:{display_name:name.trim(),username:handle,account_type:kind,profession_code:kind!=="company"?(profession||null):null,training_status:training,organization_kind:kind!=="personal"?organizationKind:null}}});
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
   const {error:phoneError}=await client.auth.updateUser({phone:phone.trim()});
   if(phoneError)throw new Error("Cuenta creada. No se pudo iniciar la verificación telefónica: "+phoneError.message);
   await startJobinSession();
   setPassword("");setConfirmPassword("");
   router.replace("/videos");
  }catch(error){setNotice(error instanceof Error?error.message:"No se pudo completar el registro.");}
  finally{setBusy(false);}
 }
 return <AuthShell title="Sign up" footer={<AuthAction secondary label="¿Ya tienes cuenta? Log in" onPress={()=>router.replace("/login")}/>}>
  <Text style={{fontSize:13,color:authSilver.tone1,textAlign:"center"}}>Crea tu cuenta ahora. Puedes completar tu JCard más adelante.</Text>
  <Text style={{fontWeight:"700",color:authSilver.tone2}}>Tipo de cuenta</Text>
  <View style={{gap:8}}>{([["personal","Solo personal"],["company","Solo empresa"],["both","Personal y empresa"]] as const).map(([value,label])=><AuthAction key={value} secondary label={(kind===value?"✓ ":"")+label} onPress={()=>setKind(value)}/>)}</View>
  {kind!=="personal"&&<View style={{gap:8}}>
   <Text style={{fontWeight:"700",color:authSilver.tone2}}>Tipo de organización</Text>
   {(["company","education","government"] as const).map(value=><AuthAction key={value} secondary label={(value===organizationKind?"✓ ":"")+ORGANIZATION_LABELS[value]} onPress={()=>setOrganizationKind(value)}/>)}
  </View>}
  {kind!=="company"&&<View style={{gap:8}}>
   <Text style={{fontWeight:"700",color:authSilver.tone2}}>Profesión (opcional)</Text>
   {!!catalog.error&&<Text style={{color:authSilver.tone3}}>{catalog.error}</Text>}
   <ProfessionPicker catalog={catalog.data} value={profession} onChange={setProfession}/>
   <Chips values={["graduado","in_academy"] as const} value={training} onChange={setTraining} label="Formación"/>
  </View>}
  <AuthField label="Nombre legal (obligatorio)" placeholder="Tu nombre" value={name} onChangeText={setName} autoCapitalize="words"/>
  <AuthField label="Nombre de usuario" placeholder="@usuario_en_minusculas" value={username} onChangeText={value=>setUsername(value.toLowerCase().replace(/[^a-z0-9_@]/g,""))}/>
  <AuthField label="Correo para iniciar sesión (obligatorio por ahora)" placeholder="Tu correo" value={email} onChangeText={setEmail} keyboardType="email-address"/>
  <AuthField label="Teléfono (obligatorio)" placeholder="+15550000000" value={phone} onChangeText={setPhone} keyboardType="phone-pad"/>
  <Text style={{color:authSilver.tone1,fontSize:12}}>La visibilidad del correo y teléfono se configura después, desde Editar JCard. Debes verificar ambos antes de publicar reseñas.</Text>
  <AuthField label="Contraseña" placeholder="Mínimo 8 caracteres" value={password} onChangeText={setPassword} secure/>
  <AuthField label="Confirmar contraseña" placeholder="Repite tu contraseña" value={confirmPassword} onChangeText={setConfirmPassword} secure/>
  {!!notice&&<Text accessibilityLiveRegion="polite" style={{color:authSilver.tone3}}>{notice}</Text>}
  <AuthAction label={busy?"CREANDO…":"SIGN UP"} onPress={()=>void submit()} disabled={busy}/>
 </AuthShell>;
}
