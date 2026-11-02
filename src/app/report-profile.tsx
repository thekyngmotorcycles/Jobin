import {useState} from "react";
import {ActivityIndicator,Pressable,ScrollView,Text,TextInput} from "react-native";
import {useLocalSearchParams,router} from "expo-router";
import * as ImagePicker from "expo-image-picker";
import {Ionicons} from "@expo/vector-icons";
import {Screen,useUi} from "../components/ui";
import {requireSupabase} from "../lib/supabase";
const reasons=["Acoso o amenazas","Suplantación de identidad","Estafa o publicidad engañosa","Contenido peligroso o ilegal","Discriminación u odio","Otro motivo"];
export default function ReportProfile(){
 const {user}=useLocalSearchParams<{user?:string}>();
 const {s,colors}=useUi();
 const [reason,setReason]=useState("");const [details,setDetails]=useState("");
 const [proof,setProof]=useState<{base64:string;mime:string;name:string}|null>(null);
 const [busy,setBusy]=useState(false);const [status,setStatus]=useState("");
 async function pick(){
  const result=await ImagePicker.launchImageLibraryAsync({mediaTypes:["images"],base64:true,quality:0.7,allowsEditing:false});
  if(result.canceled||!result.assets[0]?.base64)return;
  const asset=result.assets[0];setProof({base64:asset.base64!,mime:asset.mimeType??"image/jpeg",name:asset.fileName??"captura.jpg"});
 }
 async function submit(){
  if(!user||!/^[-0-9a-f]{36}$/i.test(user)){setStatus("El perfil no es válido.");return;}
  if(!reason||details.trim().length<15){setStatus("Selecciona un motivo y explica qué ocurrió (mínimo 15 caracteres).");return;}
  setBusy(true);setStatus("");
  try{
   const client=requireSupabase();const {data:{user:me},error:authError}=await client.auth.getUser();
   if(authError||!me)throw Error("Debes iniciar sesión para denunciar.");
   if(me.id===user)throw Error("No puedes denunciar tu propio perfil.");
   let evidence="";
   if(proof){
    const bytes=Uint8Array.from(atob(proof.base64),ch=>ch.charCodeAt(0));
    if(bytes.byteLength>10*1024*1024)throw Error("La imagen supera 10 MB.");
    const ext=proof.mime==="image/png"?"png":proof.mime==="image/webp"?"webp":"jpg";
    const path=me.id+"/"+Date.now()+"-"+Math.random().toString(36).slice(2)+"."+ext;
    const {error}=await client.storage.from("profile-report-evidence").upload(path,bytes,{contentType:proof.mime,upsert:false});
    if(error)throw error;
    evidence="\nPrueba adjunta (almacenamiento privado): "+path;
   }
   const {error}=await client.from("reports").insert({reporter_id:me.id,subject_id:user,reason:reason+"\n"+details.trim().slice(0,1800)+evidence} as never);
   if(error)throw error;
   setStatus("Denuncia enviada para revisión. Gracias por aportar información.");setReason("");setDetails("");setProof(null);
  }catch(e){setStatus(e instanceof Error?e.message:"No se pudo enviar la denuncia.");}
  finally{setBusy(false);}
 }
 return <Screen demo={false} title="Denunciar perfil" subtitle="El equipo de seguridad revisará tu denuncia. Las pruebas se almacenan de forma privada.">
  <ScrollView contentContainerStyle={{gap:15,paddingBottom:45}}>
   <Text style={s.h3}>¿Por qué denuncias este perfil?</Text>
   {reasons.map(item=><Pressable key={item} accessibilityRole="radio" accessibilityState={{checked:reason===item}} onPress={()=>setReason(item)} style={{flexDirection:"row",alignItems:"center",gap:10,padding:12,borderWidth:1,borderColor:reason===item?colors.ink:colors.line,borderRadius:12}}>
    <Ionicons name={reason===item?"radio-button-on":"radio-button-off"} size={21} color={colors.ink}/><Text style={[s.text,{flex:1}]}>{item}</Text>
   </Pressable>)}
   <Text style={s.h3}>Explica lo ocurrido</Text>
   <TextInput accessibilityLabel="Detalles de la denuncia" multiline value={details} onChangeText={setDetails} maxLength={1800} placeholder="Describe lo sucedido, fechas y cualquier información que ayude a verificarlo." placeholderTextColor={colors.muted} style={{minHeight:135,textAlignVertical:"top",padding:14,borderWidth:1,borderColor:colors.line,borderRadius:12,color:colors.ink}}/>
   <Pressable accessibilityRole="button" onPress={()=>void pick()} style={{padding:15,borderWidth:1,borderColor:colors.line,borderRadius:12,flexDirection:"row",gap:10,alignItems:"center"}}>
    <Ionicons name="image-outline" size={23} color={colors.ink}/><Text style={s.text}>{proof?"Prueba seleccionada: "+proof.name:"Adjuntar captura o fotografía (opcional)"}</Text>
   </Pressable>
   <Text style={s.muted}>No publiques datos privados de terceros. Solo se aceptan imágenes de hasta 10 MB.</Text>
   {busy&&<ActivityIndicator color={colors.ink}/>}
   {!!status&&<Text accessibilityLiveRegion="polite" style={s.text}>{status}</Text>}
   <Pressable accessibilityRole="button" disabled={busy} onPress={()=>void submit()} style={{padding:15,backgroundColor:colors.ink,borderRadius:12,alignItems:"center"}}><Text style={{color:colors.paper,fontWeight:"700"}}>Enviar denuncia</Text></Pressable>
   <Pressable accessibilityRole="button" onPress={()=>router.back()} style={{padding:10,alignItems:"center"}}><Text style={s.muted}>Volver</Text></Pressable>
  </ScrollView>
 </Screen>;
}
