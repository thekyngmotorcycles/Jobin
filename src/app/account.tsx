import { loginPalette as palette } from "../theme/auth-silver";
import { ProfessionPicker } from "../components/ProfessionPicker";
import { loadCatalog } from "../lib/professional-api";
import { useProfessionalData } from "../state/useProfessionalData";
import { ORGANIZATION_LABELS, type OrganizationKind } from "../lib/professional-types";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View, useWindowDimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { JobinWordmark } from "../components/JobinWordmark";
import { router } from "expo-router";
import { AuthField } from "../components/AuthForms";
import { startJobinSession } from "../components/AuthGate";
import { Chips } from "../components/ui";
import { requireSupabase } from "../lib/supabase";

const VALID_USERNAME = /^[a-z][a-z0-9_]{2,29}$/;
export default function Account() {
 const {width}=useWindowDimensions();
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
   const {data,error}=await client.auth.signUp({email:email.trim().toLowerCase(),password,options:{data:{display_name:name.trim(),username:handle,account_type:kind,registration_phone:phone.trim(),profession_code:kind!=="company"?(profession||null):null,training_status:training,organization_kind:kind!=="personal"?organizationKind:null}}});
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
   router.replace("/verify-phone");
  }catch(error){setNotice(error instanceof Error?error.message:"No se pudo completar el registro.");}
  finally{setBusy(false);}
 }
 const option=(label:string,selected:boolean,onPress:()=>void)=><Pressable key={label} accessibilityRole="button" accessibilityState={{selected}} onPress={onPress} style={{minHeight:46,borderRadius:9,borderWidth:1,borderColor:selected?palette.black:palette.border,backgroundColor:selected?palette.field:palette.background,justifyContent:"center",alignItems:"center",paddingHorizontal:12}}><Text style={{fontSize:15,fontWeight:selected?"700":"500",color:palette.black}}>{selected?"✓  ":""}{label}</Text></Pressable>;
 const heading=(label:string)=><Text style={{fontSize:15,fontWeight:"700",color:palette.black,marginBottom:4}}>{label}</Text>;
 return <SafeAreaView style={{flex:1,backgroundColor:palette.background}}>
  <KeyboardAvoidingView behavior={Platform.OS==="ios"?"padding":undefined} style={{flex:1}}>
   <ScrollView keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" contentContainerStyle={{paddingHorizontal:26,paddingTop:30,paddingBottom:36}}>
    <View style={{width:"100%",maxWidth:380,alignSelf:"center",gap:14}}>
     <View style={{alignItems:"center",marginBottom:18}}><JobinWordmark width={width<370?112:124}/></View>
     <Text style={{textAlign:"center",fontSize:width<370?22:24,fontWeight:"700",color:palette.black,marginBottom:2}}>Regístrate</Text>
     <Text style={{fontSize:13,color:palette.muted,textAlign:"center",marginBottom:6}}>Crea tu cuenta ahora. Puedes completar tu JCard más adelante.</Text>
     <View style={{gap:9}}>{heading("Tipo de cuenta")}{([["personal","Solo personal"],["company","Solo empresa"],["both","Personal y empresa"]] as const).map(([value,label])=>option(label,kind===value,()=>setKind(value)))}</View>
     {kind!=="personal"&&<View style={{gap:9}}>{heading("Tipo de organización")}{(["company","education","government"] as const).map(value=>option(ORGANIZATION_LABELS[value],value===organizationKind,()=>setOrganizationKind(value)))}</View>}
     {kind!=="company"&&<View style={{gap:10}}>{heading("Profesión (opcional)")}{!!catalog.error&&<Text style={{color:palette.error,fontSize:13}}>{catalog.error}</Text>}<ProfessionPicker catalog={catalog.data} value={profession} onChange={setProfession}/><Chips values={["graduado","in_academy"] as const} value={training} onChange={setTraining} label="Formación"/></View>}
     <AuthField label="Nombre legal (obligatorio)" placeholder="Tu nombre" value={name} onChangeText={setName} autoCapitalize="words"/>
     <AuthField label="Nombre de usuario" placeholder="@usuario_en_minusculas" value={username} onChangeText={value=>setUsername(value.toLowerCase().replace(/[^a-z0-9_@]/g,""))}/>
     <AuthField label="Correo electrónico (obligatorio)" placeholder="Tu correo" value={email} onChangeText={setEmail} keyboardType="email-address"/>
     <AuthField label="Teléfono (obligatorio)" placeholder="+15550000000" value={phone} onChangeText={setPhone} keyboardType="phone-pad"/>
     <Text style={{color:palette.muted,fontSize:12}}>La visibilidad del correo y teléfono se configura desde Editar JCard. Debes verificar ambos antes de publicar reseñas.</Text>
     <AuthField label="Contraseña" placeholder="Mínimo 8 caracteres" value={password} onChangeText={setPassword} secure/>
     <AuthField label="Confirmar contraseña" placeholder="Repite tu contraseña" value={confirmPassword} onChangeText={setConfirmPassword} secure/>
     {!!notice&&<Text accessibilityLiveRegion="polite" style={{color:palette.error,fontSize:13}}>{notice}</Text>}
     <Pressable accessibilityRole="button" accessibilityLabel="Registrarse" disabled={busy} onPress={()=>void submit()} style={{minHeight:47,borderRadius:9,backgroundColor:palette.black,alignItems:"center",justifyContent:"center",opacity:busy?0.6:1,marginTop:4}}><Text style={{fontSize:15,fontWeight:"700",color:palette.white}}>{busy?"Creando cuenta…":"Registrarse"}</Text></Pressable>
     <Pressable accessibilityRole="button" onPress={()=>router.replace("/login")} style={{paddingVertical:12,alignItems:"center"}}><Text style={{fontSize:13,color:palette.black}}>¿Ya tienes cuenta? <Text style={{fontWeight:"700"}}>Iniciar sesión</Text></Text></Pressable>
    </View>
   </ScrollView>
  </KeyboardAvoidingView>
 </SafeAreaView>;
}
