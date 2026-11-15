import {router} from "expo-router";
import {useState} from "react";
import {ActivityIndicator,KeyboardAvoidingView,Platform,Pressable,ScrollView,Text,TextInput,View,useWindowDimensions} from "react-native";
import {SafeAreaView} from "react-native-safe-area-context";
import {Ionicons} from "@expo/vector-icons";
import {JobinWordmark} from "../components/JobinWordmark";
import {loginPalette as palette} from "../theme/auth-silver";
import {requireSupabase} from "../lib/supabase";
import {startJobinSession} from "../components/AuthGate";


export default function Login(){
 const {width}=useWindowDimensions();
 const [email,setEmail]=useState("");
 const [password,setPassword]=useState("");
 const [step,setStep]=useState<"email"|"password">("email");
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState("");
 const [visible,setVisible]=useState(false);
 function continueEmail(){
  setError("");
  if(!/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(email.trim())){setError("Escribe un correo electrónico válido.");return;}
  setStep("password");
 }
 async function submit(){
  if(busy)return;
  if(!password){setError("Escribe tu contraseña.");return;}
  setBusy(true);setError("");
  try{
   const {data,error:authError}=await requireSupabase().auth.signInWithPassword({email:email.trim().toLowerCase(),password});
   if(authError)throw authError;
   if(!data.session)throw new Error("No se pudo iniciar la sesión.");
   await startJobinSession();setPassword("");router.replace("/videos");
  }catch(e){setError(e instanceof Error?e.message:"No se pudo iniciar sesión.");}
  finally{setBusy(false);}
 }
 function social(provider:"Google"|"Apple"){setError("El acceso con "+provider+" requiere configurar el proveedor OAuth y su retorno seguro en Supabase. Por ahora, utiliza tu correo y contraseña.");}
 const button=(label:string,onPress:()=>void,secondary=false)=> <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} disabled={busy} style={{minHeight:52,borderRadius:11,backgroundColor:secondary?palette.background:palette.black,borderWidth:secondary?1:0,borderColor:palette.border,justifyContent:"center",alignItems:"center",opacity:busy?0.65:1}}><Text style={{fontSize:17,fontWeight:"700",color:secondary?palette.black:palette.white}}>{label}</Text></Pressable>;
 return <SafeAreaView style={{flex:1,backgroundColor:palette.background}}>
  <KeyboardAvoidingView behavior={Platform.OS==="ios"?"padding":undefined} style={{flex:1}}>
   <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{flexGrow:1,justifyContent:"center",paddingHorizontal:26,paddingVertical:32}}>
    <View style={{width:"100%",maxWidth:440,alignSelf:"center"}}>
     <View style={{alignItems:"center",marginBottom:42}}><JobinWordmark width={width<350?135:160}/></View>
     <Text style={{fontSize:width<350?28:31,fontWeight:"700",color:palette.black,textAlign:"center",marginBottom:25}}>{step==="email"?"Inicia sesión o regístrate":"Introduce tu contraseña"}</Text>
     <View style={{gap:14}}>
      {step==="email"?<View style={{backgroundColor:palette.field,borderRadius:11,minHeight:55,flexDirection:"row",alignItems:"center",paddingHorizontal:16}}>
       <TextInput accessibilityLabel="Correo electrónico" placeholder="Correo electrónico" placeholderTextColor={palette.muted} autoCapitalize="none" autoCorrect={false} keyboardType="email-address" textContentType="emailAddress" autoComplete="email" value={email} onChangeText={setEmail} onSubmitEditing={continueEmail} returnKeyType="next" style={{flex:1,color:palette.black,fontSize:17,paddingVertical:12}}/>
       {!!email&&<Pressable accessibilityRole="button" accessibilityLabel="Borrar correo" onPress={()=>setEmail("")} style={{padding:7}}><Ionicons name="close-circle" size={21} color="#ADADAD"/></Pressable>}
      </View>:<><Text style={{fontSize:15,color:palette.muted,textAlign:"center"}}>{email}</Text><View style={{backgroundColor:palette.field,borderRadius:11,minHeight:55,flexDirection:"row",alignItems:"center",paddingHorizontal:16}}><TextInput accessibilityLabel="Contraseña" placeholder="Contraseña" placeholderTextColor={palette.muted} secureTextEntry={!visible} textContentType="password" autoComplete="current-password" value={password} onChangeText={setPassword} onSubmitEditing={()=>void submit()} style={{flex:1,color:palette.black,fontSize:17,paddingVertical:12}}/><Pressable accessibilityLabel={visible?"Ocultar contraseña":"Mostrar contraseña"} onPress={()=>setVisible(v=>!v)} style={{padding:8}}><Ionicons name={visible?"eye-off-outline":"eye-outline"} size={22} color={palette.muted}/></Pressable></View></>}
      {!!error&&<Text accessibilityLiveRegion="polite" style={{color:palette.error,fontSize:13}}>{error}</Text>}
      {button(step==="email"?"Continuar":busy?"Entrando…":"Iniciar sesión",()=>step==="email"?continueEmail():void submit())}
      {step==="password"&&<><Pressable onPress={()=>router.push("/recover-account")} style={{paddingVertical:8,alignItems:"center"}}><Text style={{color:palette.black}}>¿Olvidaste tu contraseña?</Text></Pressable><Pressable onPress={()=>setStep("email")} style={{alignItems:"center",paddingVertical:5}}><Text style={{color:palette.muted}}>Cambiar correo</Text></Pressable></>}
      {step==="email"&&<><Text style={{textAlign:"center",color:palette.muted,fontSize:16,marginVertical:2}}>o</Text>
       <Pressable accessibilityRole="button" onPress={()=>social("Google")} style={{minHeight:54,borderRadius:11,borderWidth:1,borderColor:palette.border,flexDirection:"row",alignItems:"center",justifyContent:"center",gap:12}}><Text style={{fontSize:23,fontWeight:"700",color:palette.google}}>G</Text><Text style={{fontSize:17,fontWeight:"700",color:palette.black}}>Continuar con Google</Text></Pressable>
       {Platform.OS==="ios"&&<Pressable accessibilityRole="button" onPress={()=>social("Apple")} style={{minHeight:54,borderRadius:11,borderWidth:1,borderColor:palette.border,flexDirection:"row",alignItems:"center",justifyContent:"center",gap:12}}><Ionicons name="logo-apple" size={23} color={palette.black}/><Text style={{fontSize:17,fontWeight:"700",color:palette.black}}>Continuar con Apple</Text></Pressable>}
       <Pressable onPress={()=>router.push("/account")} style={{alignItems:"center",paddingVertical:15}}><Text style={{fontSize:15,color:palette.black}}>¿No tienes cuenta? <Text style={{fontWeight:"700"}}>Regístrate</Text></Text></Pressable>
      </>}
     </View>
    </View>
   </ScrollView>
  </KeyboardAvoidingView>
 </SafeAreaView>;
}
