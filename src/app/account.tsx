import { loginPalette as palette } from "../theme/auth-silver";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View, useWindowDimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { AuthField } from "../components/AuthForms";
import { startJobinSession } from "../components/AuthGate";
import { requireSupabase } from "../lib/supabase";
import {runSignedOutAuth,cancelPendingGoogle} from "../lib/auth-entry";
import {captureMessageScope,assertMessageScope} from "../lib/message-session";

const VALID_USERNAME = /^[a-z][a-z0-9_]{2,29}$/;
export default function Account() {
 const {width}=useWindowDimensions();
 const [name,setName]=useState("");
 const [username,setUsername]=useState("");
 const [email,setEmail]=useState("");
 const [password,setPassword]=useState("");
 const [confirmPassword,setConfirmPassword]=useState("");
 const [notice,setNotice]=useState("");
 const [busy,setBusy]=useState(false);
 async function submit(){
  if(busy)return;
  setNotice("");
  const handle=username.trim().replace(/^@/,"").toLowerCase();
  if(!name.trim()||!email.trim()||password.length<8||password.length>128){setNotice("Completa nombre, correo y contraseña de entre 8 y 128 caracteres.");return;}
  if(!VALID_USERNAME.test(handle)){setNotice("El usuario debe tener 3 a 30 caracteres: letras minúsculas, números o guiones bajos; comienza con una letra.");return;}
  if(password!==confirmPassword){setNotice("Las contraseñas no coinciden.");return;}
  setBusy(true);
  try{
   cancelPendingGoogle();
   await runSignedOutAuth(async()=>{
   const client=requireSupabase();
   const {data:existing,error:lookupError}=await client.from("usernames").select("username").eq("username",handle).maybeSingle();
   if(lookupError)throw lookupError;
   if(existing){setNotice("Ese nombre de usuario ya está en uso. Elige otro.");return;}
   const {data,error}=await client.auth.signUp({email:email.trim().toLowerCase(),password,options:{data:{display_name:name.trim(),username:handle,account_type:"both"}}});
   if(error)throw error;
   if(!data.user)throw new Error("No se pudo crear la cuenta.");
   let session=data.session;
   if(!session){
    const signed=await client.auth.signInWithPassword({email:email.trim().toLowerCase(),password});
    if(signed.error||!signed.data.session)throw new Error("La cuenta fue registrada, pero no se pudo iniciar sesión. Intenta entrar desde Log in.");
    session=signed.data.session;
   }
   await startJobinSession(session.user.id,session.access_token);
   const scope=await captureMessageScope();if(scope.owner!==session.user.id)throw Error("La cuenta cambió.");
   const {error:claimError}=await client.from("usernames").insert({user_id:session.user.id,username:handle});
   await assertMessageScope(scope);
   if(claimError && claimError.code!=="23505")throw claimError;
   if(claimError) {
    const {data:owned}=await client.from("usernames").select("username").eq("user_id",session.user.id).maybeSingle();
    if(owned?.username!==handle)throw new Error("El nombre de usuario ya está ocupado. Cambia tu usuario desde el perfil.");
   }
   await assertMessageScope(scope);
   });setPassword("");setConfirmPassword("");
  }catch(error){setNotice(error instanceof Error?error.message:"No se pudo completar el registro.");}
  finally{setBusy(false);}
 }
 return <SafeAreaView style={{flex:1,backgroundColor:palette.background}}>
  <KeyboardAvoidingView behavior={Platform.OS==="ios"?"padding":undefined} style={{flex:1}}>
   <ScrollView keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" contentContainerStyle={{paddingHorizontal:26,paddingTop:30,paddingBottom:36}}>
    <View style={{width:"100%",maxWidth:380,alignSelf:"center",gap:14}}>
     <Text style={{textAlign:"center",fontSize:width<370?22:24,fontWeight:"700",color:palette.black,marginBottom:14}}>Regístrate</Text>
     <AuthField label="Nombre legal (obligatorio)" placeholder="Tu nombre" value={name} onChangeText={setName} autoCapitalize="words"/>
     <AuthField label="Nombre de usuario" placeholder="@usuario_en_minusculas" value={username} onChangeText={value=>setUsername(value.toLowerCase().replace(/[^a-z0-9_@]/g,""))}/>
     <AuthField label="Correo electrónico (obligatorio)" placeholder="Tu correo" value={email} onChangeText={setEmail} keyboardType="email-address"/>
     <Text style={{color:palette.muted,fontSize:12}}>Podrás añadir y verificar tu teléfono más adelante. La verificación es necesaria para determinadas funciones.</Text>
     <AuthField label="Contraseña" placeholder="Entre 8 y 128 caracteres" value={password} onChangeText={setPassword} secure/>
     <AuthField label="Confirmar contraseña" placeholder="Repite tu contraseña" value={confirmPassword} onChangeText={setConfirmPassword} secure/>
     {!!notice&&<Text accessibilityLiveRegion="polite" style={{color:palette.error,fontSize:13}}>{notice}</Text>}
     <Pressable accessibilityRole="button" accessibilityLabel="Registrarse" disabled={busy} onPress={()=>void submit()} style={{minHeight:47,borderRadius:9,backgroundColor:palette.black,alignItems:"center",justifyContent:"center",opacity:busy?0.6:1,marginTop:4}}><Text style={{fontSize:15,fontWeight:"700",color:palette.white}}>{busy?"Creando cuenta…":"Registrarse"}</Text></Pressable>
     <Pressable accessibilityRole="button" onPress={()=>router.replace("/login")} style={{paddingVertical:12,alignItems:"center"}}><Text style={{fontSize:13,color:palette.black}}>¿Ya tienes cuenta? <Text style={{fontWeight:"700"}}>Iniciar sesión</Text></Text></Pressable>
    </View>
   </ScrollView>
  </KeyboardAvoidingView>
 </SafeAreaView>;
}
