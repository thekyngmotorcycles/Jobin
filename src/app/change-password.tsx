import {useEffect,useRef,useState} from "react";
import {Text} from "react-native";
import {router} from "expo-router";
import {AuthAction,AuthField,AuthShell} from "../components/AuthForms";
import {confirmPasswordChange,currentPasswordSession,requestPasswordConfirmation} from "../lib/password-reauth";
export default function ChangePassword(){
 const [password,setPassword]=useState(""),[confirm,setConfirm]=useState(""),[nonce,setNonce]=useState(""),[notice,setNotice]=useState("");
 const [ownerSession,setOwnerSession]=useState(""),[sent,setSent]=useState(false),[busy,setBusy]=useState(false);
 const running=useRef(false),mounted=useRef(true);
 useEffect(()=>{
  mounted.current=true;
  void currentPasswordSession().then(session=>{if(mounted.current)setOwnerSession(session);}).catch(()=>{if(mounted.current)setNotice("Inicia sesión para cambiar tu contraseña.");});
  return()=>{mounted.current=false;};
 },[]);
 async function send(){
  if(running.current||!ownerSession)return;running.current=true;setBusy(true);setNotice("");setNonce("");setSent(false);
  try{await requestPasswordConfirmation(ownerSession);if(mounted.current){setSent(true);setNotice("Introduce el código enviado a tu correo o teléfono registrado.");}}
  catch(e){if(mounted.current)setNotice(e instanceof Error?e.message:"No se pudo enviar el código.");}
  finally{running.current=false;if(mounted.current)setBusy(false);}
 }
 async function save(){
  if(running.current||!ownerSession||!sent)return;
  if(password.length<8||password.length>128||password!==confirm){setNotice("Las contraseñas deben coincidir y tener entre 8 y 128 caracteres.");return;}
  running.current=true;setBusy(true);setNotice("");
  try{await confirmPasswordChange(ownerSession,nonce,password);if(mounted.current){setPassword("");setConfirm("");setNonce("");setSent(false);setNotice("Contraseña actualizada.");router.replace("/videos");}}
  catch(e){if(mounted.current)setNotice(e instanceof Error?e.message:"No se pudo actualizar.");}
  finally{running.current=false;if(mounted.current)setBusy(false);}
 }
 return <AuthShell title="Nueva contraseña" footer={<AuthAction secondary label="Volver" onPress={()=>router.back()}/>}>
 <Text>Confirma tu identidad con un código enviado al método de acceso registrado de tu cuenta.</Text>
 <AuthAction secondary label={busy?"Procesando…":sent?"Reenviar código":"Enviar código de verificación"} disabled={busy||!ownerSession} onPress={()=>void send()}/>
 {sent&&<>
 <AuthField label="Código de verificación" value={nonce} onChangeText={setNonce} placeholder="Código recibido" keyboardType="number-pad"/>
 <AuthField label="Nueva contraseña" value={password} onChangeText={setPassword} placeholder="Mínimo 8 caracteres" secure/>
 <AuthField label="Repetir contraseña" value={confirm} onChangeText={setConfirm} placeholder="Repetir contraseña" secure/>
 <AuthAction label={busy?"Guardando…":"Actualizar contraseña"} disabled={busy||!nonce.trim()} onPress={()=>void save()}/>
 </>}
 {!!notice&&<Text accessibilityLiveRegion="polite">{notice}</Text>}
 </AuthShell>;
}
