import {useState} from "react";
import {Text} from "react-native";
import {router} from "expo-router";
import {AuthAction,AuthField,AuthShell} from "../components/AuthForms";
import {requireSupabase} from "../lib/supabase";
export default function ChangePassword(){
 const [password,setPassword]=useState(""),[confirm,setConfirm]=useState(""),[notice,setNotice]=useState(""),[busy,setBusy]=useState(false);
 async function save(){if(password.length<8||password!==confirm){setNotice("Las contraseñas deben coincidir y tener al menos 8 caracteres.");return;}setBusy(true);try{const {error}=await requireSupabase().auth.updateUser({password});if(error)throw error;setPassword("");setConfirm("");setNotice("Contraseña actualizada.");router.replace("/videos");}catch(e){setNotice(e instanceof Error?e.message:"No se pudo actualizar.");}finally{setBusy(false);}}
 return <AuthShell title="Nueva contraseña" footer={<AuthAction secondary label="Volver" onPress={()=>router.replace("/login")}/>}>
 <Text>Si recuperaste tu cuenta por SMS, puedes establecer una nueva contraseña aquí.</Text>
 <AuthField label="Nueva contraseña" value={password} onChangeText={setPassword} placeholder="Mínimo 8 caracteres" secure/>
 <AuthField label="Repetir contraseña" value={confirm} onChangeText={setConfirm} placeholder="Repetir contraseña" secure/>
 <AuthAction label={busy?"Guardando…":"Actualizar contraseña"} disabled={busy} onPress={()=>void save()}/>
 {!!notice&&<Text>{notice}</Text>}
 </AuthShell>;
}