import {useState} from "react";
import {router} from "expo-router";
import {ActivityIndicator,Pressable,Text,TextInput,View} from "react-native";
import {SafeAreaView} from "react-native-safe-area-context";
import {requireSupabase} from "../lib/supabase";
import {completeUsernameOnboarding} from "../components/AuthGate";
import {loginPalette as palette} from "../theme/auth-silver";

const VALID=/^[a-z][a-z0-9_]{2,29}$/;
export default function ChooseUsername(){
 const [username,setUsername]=useState("");
 const [busy,setBusy]=useState(false);
 const [message,setMessage]=useState("");
 async function save(){
  if(busy)return;
  const handle=username.trim().replace(/^@/,"").toLowerCase();
  if(!VALID.test(handle)){setMessage("Usa de 3 a 30 caracteres: letras minúsculas, números y guion bajo. Debe comenzar con una letra.");return;}
  setBusy(true);setMessage("");
  try{
   const client=requireSupabase();
   const {data:{user},error:userError}=await client.auth.getUser();
   if(userError||!user)throw new Error("La sesión ha expirado. Inicia sesión nuevamente.");
   const {data:existing,error:existingError}=await client.from("usernames").select("username").eq("user_id",user.id).maybeSingle();
   if(existingError)throw existingError;
   if(!existing){
    const {error}=await client.from("usernames").insert({user_id:user.id,username:handle});
    if(error?.code==="23505")throw new Error("Este nombre de usuario ya está ocupado. Prueba otro.");
    if(error)throw error;
   }
   completeUsernameOnboarding();
   router.replace("/videos");
  }catch(error){setMessage(error instanceof Error?error.message:"No se pudo guardar el usuario.");}
  finally{setBusy(false);}
 }
 return <SafeAreaView style={{flex:1,backgroundColor:palette.background,justifyContent:"center",paddingHorizontal:26}}>
  <View style={{width:"100%",maxWidth:380,alignSelf:"center",gap:16}}>
   <Text style={{fontSize:24,fontWeight:"700",textAlign:"center",color:palette.black}}>Elige tu nombre de usuario</Text>
   <Text style={{fontSize:14,textAlign:"center",color:palette.muted}}>Tu cuenta de Google ya está conectada. Solo falta elegir un usuario único para Jobeen.</Text>
   <View style={{backgroundColor:palette.field,borderRadius:11,paddingHorizontal:16}}>
    <TextInput accessibilityLabel="Nombre de usuario único" placeholder="@usuario" placeholderTextColor={palette.muted} value={username} onChangeText={value=>setUsername(value.toLowerCase().replace(/[^a-z0-9_@]/g,""))} autoCapitalize="none" autoCorrect={false} maxLength={31} style={{fontSize:16,color:palette.black,minHeight:52}} onSubmitEditing={()=>void save()}/>
   </View>
   {!!message&&<Text accessibilityLiveRegion="polite" style={{color:palette.error,fontSize:13}}>{message}</Text>}
   <Pressable accessibilityRole="button" disabled={busy} onPress={()=>void save()} style={{backgroundColor:palette.black,minHeight:48,borderRadius:9,justifyContent:"center",alignItems:"center",opacity:busy?0.65:1}}>{busy?<ActivityIndicator color={palette.white}/>:<Text style={{fontSize:15,fontWeight:"700",color:palette.white}}>Guardar</Text>}</Pressable>
  </View>
 </SafeAreaView>;
}
