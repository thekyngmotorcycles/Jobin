import {useState} from "react";
import {Text,TextInput,View} from "react-native";
import {router} from "expo-router";
import {SafeAreaView} from "react-native-safe-area-context";
import {Button,useUi} from "../components/ui";
import {requireSupabase} from "../lib/supabase";
export default function VerifyPhone(){
 const {s,colors}=useUi();const [code,setCode]=useState(""),[notice,setNotice]=useState(""),[busy,setBusy]=useState(false);
 async function verify(){setBusy(true);try{const db=requireSupabase();const {data:{user}}=await db.auth.getUser();const phone=user?.phone||user?.user_metadata?.registration_phone;if(!phone)throw Error("No hay un número pendiente de verificación.");const {error}=await db.auth.verifyOtp({phone,token:code.trim(),type:"phone_change"});if(error)throw error;setNotice("Teléfono verificado.");router.replace("/videos");}catch(e){setNotice(e instanceof Error?e.message:"No se pudo verificar.");}finally{setBusy(false);}}
 return <SafeAreaView style={s.screen}><View style={{padding:24,gap:14}}><Text style={s.h2}>Verificar teléfono</Text><Text style={s.muted}>Introduce el código SMS enviado al número registrado. La verificación del correo se realiza desde el enlace recibido por email.</Text><TextInput accessibilityLabel="Código SMS" value={code} onChangeText={setCode} keyboardType="number-pad" placeholder="Código SMS" placeholderTextColor={colors.muted} style={{padding:14,borderWidth:1,borderColor:colors.line,color:colors.ink,borderRadius:12}}/><Button title={busy?"Verificando…":"Verificar número"} onPress={()=>void verify()}/>{!!notice&&<Text style={s.muted}>{notice}</Text>}</View></SafeAreaView>;
}