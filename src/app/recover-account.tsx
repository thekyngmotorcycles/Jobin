import {useRef,useState} from "react";
import {runSignedOutAuth} from "../lib/auth-entry";
import {Text,View} from "react-native";
import {router} from "expo-router";
import {AuthAction,AuthField,AuthShell} from "../components/AuthForms";
import {requireSupabase} from "../lib/supabase";
import {startJobinSession} from "../components/AuthGate";
export default function RecoverAccount(){
 const [method,setMethod]=useState<"email"|"phone">("email"),[value,setValue]=useState(""),[code,setCode]=useState(""),[sent,setSent]=useState(false),[notice,setNotice]=useState(""),[busy,setBusy]=useState(false);
 const running=useRef(false),requestedPhone=useRef("");
 async function send(){
  if(running.current)return;running.current=true;setBusy(true);setNotice("");setSent(false);requestedPhone.current="";
  const requestedMethod=method,address=value.trim();
  try{await runSignedOutAuth(async()=>{
   const db=requireSupabase();
   if(requestedMethod==="email"){
    const {error}=await db.auth.resetPasswordForEmail(address.toLowerCase());if(error)throw error;
    setNotice("Si existe una cuenta asociada, recibirás instrucciones por correo.");
   }else{
    if(!/^\+[1-9]\d{7,14}$/.test(address))throw Error("Escribe tu número con código internacional.");
    const {error}=await db.auth.signInWithOtp({phone:address,options:{shouldCreateUser:false}});if(error)throw error;
    requestedPhone.current=address;setSent(true);setNotice("Introduce el código SMS para recuperar el acceso.");
   }
  });}catch{setNotice("No se pudo iniciar la recuperación.");}finally{running.current=false;setBusy(false);}
 }
 async function verify(){
  if(running.current||method!=="phone"||!sent||requestedPhone.current!==value.trim()||!/^\d{6,10}$/.test(code.trim()))return;
  running.current=true;setBusy(true);const phone=requestedPhone.current,token=code.trim();
  try{await runSignedOutAuth(async()=>{
   const {data,error}=await requireSupabase().auth.verifyOtp({phone,token,type:"sms"});
   if(error||!data.session)throw Error("No se pudo recuperar la sesión.");
   await startJobinSession(data.session.user.id,data.session.access_token);
  });setCode("");}
  catch{setNotice("No se pudo verificar el código.");}finally{running.current=false;setBusy(false);}
 }
 return <AuthShell title="Recuperar cuenta" footer={<AuthAction secondary label="Volver a iniciar sesión" onPress={()=>router.replace("/login")}/>}>
 <Text>Elige cómo recuperar tu acceso:</Text>
 <View style={{gap:8}}><AuthAction secondary label={(method==="email"?"✓ ":"")+"Correo electrónico"} disabled={busy} onPress={()=>{requestedPhone.current="";setCode("");setMethod("email");setSent(false);setValue("");}}/><AuthAction secondary label={(method==="phone"?"✓ ":"")+"Teléfono verificado"} disabled={busy} onPress={()=>{requestedPhone.current="";setCode("");setMethod("phone");setSent(false);setValue("");}}/></View>
 <AuthField label={method==="email"?"Correo registrado":"Teléfono registrado (+código de país)"} placeholder={method==="email"?"correo@ejemplo.com":"+15550000000"} value={value} onChangeText={v=>{if(running.current)return;requestedPhone.current="";setSent(false);setCode("");setValue(v);}} keyboardType={method==="email"?"email-address":"phone-pad"}/>
 {!sent?<AuthAction label={busy?"Enviando…":"Enviar instrucciones"} disabled={busy} onPress={()=>void send()}/>:<><AuthField label="Código SMS" placeholder="Código recibido" value={code} onChangeText={setCode} keyboardType="phone-pad"/><AuthAction label={busy?"Verificando…":"Recuperar acceso"} disabled={busy} onPress={()=>void verify()}/></>}
 {!!notice&&<Text accessibilityLiveRegion="polite">{notice}</Text>}
 </AuthShell>;
}
