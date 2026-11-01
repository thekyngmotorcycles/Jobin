import { authSilver } from "../theme/auth-silver";
import { router } from "expo-router";
import { useState } from "react";
import { Text } from "react-native";
import { AuthAction, AuthField, AuthShell } from "../components/AuthForms";
import { requireSupabase } from "../lib/supabase";
import { startJobinSession } from "../components/AuthGate";

export default function Login() {
 const [email,setEmail]=useState("");
 const [password,setPassword]=useState("");
 const [error,setError]=useState("");
 const [busy,setBusy]=useState(false);
 async function submit() {
  if(busy)return;
  setError("");
  if(!email.trim()||!password){setError("Escribe tu correo y contraseña.");return;}
  setBusy(true);
  try {
   const {data,error:authError}=await requireSupabase().auth.signInWithPassword({email:email.trim().toLowerCase(),password});
   if(authError)throw authError;
   if(!data.session)throw new Error("No se pudo iniciar la sesión.");
   await startJobinSession();
   setPassword("");
   router.replace("/videos");
  }catch(e){setError(e instanceof Error?e.message:"Error al iniciar sesión.");}
  finally{setBusy(false);}
 }
 return <AuthShell title="Log in" footer={<AuthAction secondary label="¿No tienes cuenta? Sign up" onPress={()=>router.replace("/account")}/>}>
  <AuthField label="Email" placeholder="Tu correo electrónico" value={email} onChangeText={setEmail} keyboardType="email-address"/>
  <AuthField label="Password" placeholder="Tu contraseña" value={password} onChangeText={setPassword} secure/>
  {!!error&&<Text accessibilityLiveRegion="polite" style={{color:authSilver.tone3}}>{error}</Text>}
  <AuthAction secondary label="¿Olvidaste tu contraseña? Recuperar cuenta" onPress={()=>router.push("/recover-account")}/>
  <AuthAction label={busy?"ENTRANDO…":"LOG IN"} disabled={busy} onPress={()=>void submit()}/>
 </AuthShell>;
}
