import {useState} from "react";
import {Text,View} from "react-native";
import {router} from "expo-router";
import {AuthAction,AuthField,AuthShell} from "../components/AuthForms";
import {requireSupabase} from "../lib/supabase";
import {startJobinSession} from "../components/AuthGate";
export default function RecoverAccount(){
 const [method,setMethod]=useState<"email"|"phone">("email"),[value,setValue]=useState(""),[code,setCode]=useState(""),[sent,setSent]=useState(false),[notice,setNotice]=useState(""),[busy,setBusy]=useState(false);
 async function send(){setBusy(true);setNotice("");try{const db=requireSupabase();if(method==="email"){const {error}=await db.auth.resetPasswordForEmail(value.trim().toLowerCase());if(error)throw error;setNotice("Si existe una cuenta asociada, recibirás instrucciones por correo.");}else{if(!/^\+[1-9]\d{7,14}$/.test(value.trim()))throw Error("Escribe tu número con código internacional, por ejemplo +15550000000.");const {error}=await db.auth.signInWithOtp({phone:value.trim(),options:{shouldCreateUser:false}});if(error)throw error;setSent(true);setNotice("Introduce el código SMS para recuperar el acceso.");}}catch(e){setNotice(e instanceof Error?e.message:"No se pudo enviar.");}finally{setBusy(false);}}
 async function verify(){setBusy(true);try{const db=requireSupabase();const {error}=await db.auth.verifyOtp({phone:value.trim(),token:code.trim(),type:"sms"});if(error)throw error;await startJobinSession();router.replace("/change-password");}catch(e){setNotice(e instanceof Error?e.message:"Código incorrecto.");}finally{setBusy(false);}}
 return <AuthShell title="Recuperar cuenta" footer={<AuthAction secondary label="Volver a iniciar sesión" onPress={()=>router.replace("/login")}/>}>
 <Text>Elige cómo recuperar tu acceso:</Text>
 <View style={{gap:8}}><AuthAction secondary label={(method==="email"?"✓ ":"")+"Correo electrónico"} onPress={()=>{setMethod("email");setSent(false);setValue("");}}/><AuthAction secondary label={(method==="phone"?"✓ ":"")+"Teléfono verificado"} onPress={()=>{setMethod("phone");setSent(false);setValue("");}}/></View>
 <AuthField label={method==="email"?"Correo registrado":"Teléfono registrado (+código de país)"} placeholder={method==="email"?"correo@ejemplo.com":"+15550000000"} value={value} onChangeText={setValue} keyboardType={method==="email"?"email-address":"phone-pad"}/>
 {!sent?<AuthAction label={busy?"Enviando…":"Enviar instrucciones"} disabled={busy} onPress={()=>void send()}/>:<><AuthField label="Código SMS" placeholder="Código recibido" value={code} onChangeText={setCode} keyboardType="number-pad"/><AuthAction label={busy?"Verificando…":"Recuperar acceso"} disabled={busy} onPress={()=>void verify()}/></>}
 {!!notice&&<Text accessibilityLiveRegion="polite">{notice}</Text>}
 </AuthShell>;
}