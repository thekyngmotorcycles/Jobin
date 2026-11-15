import {router} from "expo-router";
import {useEffect,useRef,useState} from "react";
import * as Linking from "expo-linking";
import {KeyboardAvoidingView,Keyboard,Platform,Pressable,ScrollView,Text,TextInput,View,useWindowDimensions} from "react-native";
import Svg,{Path} from "react-native-svg";
import {SafeAreaView} from "react-native-safe-area-context";
import {Ionicons} from "@expo/vector-icons";
import {JobinWordmark} from "../components/JobinWordmark";
import {loginPalette as palette} from "../theme/auth-silver";
import {requireSupabase} from "../lib/supabase";
import {startJobinSession} from "../components/AuthGate";


function GoogleMark(){return <Svg width={21} height={21} viewBox="0 0 48 48" accessibilityLabel="Google"><Path fill={palette.googleRed} d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><Path fill={palette.googleBlue} d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.25 5.48-4.76 7.18l7.73 6C44.42 38.03 46.98 31.88 46.98 24.55z"/><Path fill={palette.googleYellow} d="M10.53 28.59A14.4 14.4 0 0 1 9.75 24c0-1.59.27-3.13.76-4.59l-7.98-6.2A23.9 23.9 0 0 0 0 24c0 3.87.93 7.51 2.56 10.78l7.97-6.19z"/><Path fill={palette.googleGreen} d="M24 48c6.48 0 11.93-2.13 15.91-5.8l-7.73-6c-2.15 1.45-4.92 2.3-8.18 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.97 6.19C6.51 42.62 14.62 48 24 48z"/></Svg>}
export default function Login(){
 const {width}=useWindowDimensions();
 const compact=width<370;
 const [email,setEmail]=useState("");
 const [password,setPassword]=useState("");
 const [step,setStep]=useState<"email"|"password">("email");
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState("");
 const [visible,setVisible]=useState(false);
 const [lastTyped,setLastTyped]=useState("");
 useEffect(()=>{if(!lastTyped)return;const timeout=setTimeout(()=>setLastTyped(""),850);return()=>clearTimeout(timeout);},[lastTyped]);
 function updatePassword(value:string){setPassword(previous=>{setLastTyped(value.length>previous.length?value.slice(-1):"");return value;});}
 const scrollRef=useRef<ScrollView>(null);
 const [keyboardVisible,setKeyboardVisible]=useState(false);
 function continueEmail(){
  setError("");
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())){setError("Escribe un correo electrónico válido.");return;}
  Keyboard.dismiss();setKeyboardVisible(false);setStep("password");
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
 async function social(provider:"Google"){
  if(busy)return;
  setBusy(true);setError("");
  try{
   const {data,error:oauthError}=await requireSupabase().auth.signInWithOAuth({
    provider:"google",
    options:{redirectTo:"jobin://",skipBrowserRedirect:true}
   });
   if(oauthError)throw oauthError;
   if(!data.url)throw new Error(`${provider} no devolvió la dirección de acceso.`);
   await Linking.openURL(data.url);
  }catch(e){setError(e instanceof Error?e.message:`No se pudo abrir el acceso con ${provider}.`);setBusy(false);}
 }
 const button=(label:string,onPress:()=>void,secondary=false)=> <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} disabled={busy} style={{minHeight:46,borderRadius:9,backgroundColor:secondary?palette.background:palette.black,borderWidth:secondary?1:0,borderColor:palette.border,justifyContent:"center",alignItems:"center",opacity:busy?0.65:1}}><Text style={{fontSize:15,fontWeight:"700",color:secondary?palette.black:palette.white}}>{label}</Text></Pressable>;
 return <SafeAreaView style={{flex:1,backgroundColor:palette.background}}>
  <KeyboardAvoidingView behavior={Platform.OS==="ios"?"padding":"height"} style={{flex:1}}>
   <ScrollView ref={scrollRef} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" automaticallyAdjustKeyboardInsets={Platform.OS==="ios"} contentContainerStyle={{flexGrow:1,justifyContent:keyboardVisible?"flex-start":"center",paddingHorizontal:26,paddingVertical:24}}>
    <View style={{width:"100%",maxWidth:380,alignSelf:"center"}}>
     <View style={{alignItems:"center",marginBottom:38}}><JobinWordmark width={compact?112:124}/></View>
     <Text style={{fontSize:compact?19:21,fontWeight:"700",color:palette.black,textAlign:"center",marginBottom:20}}>{step==="email"?"Inicia sesión o regístrate":"Introduce tu contraseña"}</Text>
     <View style={{gap:11}}>
      {step==="email"?<View style={{backgroundColor:palette.field,borderRadius:11,minHeight:46,flexDirection:"row",alignItems:"center",paddingHorizontal:16}}>
       <TextInput accessibilityLabel="Correo electrónico" placeholder="Correo electrónico" placeholderTextColor={palette.muted} autoCapitalize="none" autoCorrect={false} keyboardType="email-address" textContentType="emailAddress" autoComplete="email" value={email} onChangeText={setEmail} onFocus={()=>{setKeyboardVisible(true);scrollRef.current?.scrollTo({y:0,animated:true});}} onBlur={()=>setKeyboardVisible(false)} onSubmitEditing={continueEmail} returnKeyType="next" style={{flex:1,color:palette.black,fontSize:15,paddingVertical:10}}/>
       {!!email&&<Pressable accessibilityRole="button" accessibilityLabel="Borrar correo" onPress={()=>setEmail("")} style={{padding:7}}><Ionicons name="close-circle" size={21} color={palette.clear}/></Pressable>}
      </View>:<><Text style={{fontSize:15,color:palette.muted,textAlign:"center"}}>{email}</Text><View style={{backgroundColor:palette.field,borderRadius:11,minHeight:55,flexDirection:"row",alignItems:"center",paddingHorizontal:16}}><TextInput accessibilityLabel="Contraseña" placeholder="Contraseña" placeholderTextColor={palette.muted} secureTextEntry={!visible} textContentType="password" autoComplete="current-password" value={password} onChangeText={updatePassword} onFocus={()=>{setKeyboardVisible(true);scrollRef.current?.scrollTo({y:0,animated:true});}} onBlur={()=>setKeyboardVisible(false)} onSubmitEditing={()=>void submit()} style={{flex:1,color:palette.black,fontSize:17,paddingVertical:12}}/>{!visible&&!!lastTyped&&<Text accessible={false} style={{fontSize:16,color:palette.muted,minWidth:15,textAlign:"center"}}>{lastTyped}</Text>}<Pressable accessibilityLabel={visible?"Ocultar contraseña":"Mostrar contraseña"} onPress={()=>setVisible(v=>!v)} style={{padding:8}}><Ionicons name={visible?"eye-off-outline":"eye-outline"} size={22} color={palette.muted}/></Pressable></View></>}
      {!!error&&<Text accessibilityLiveRegion="polite" style={{color:palette.error,fontSize:13}}>{error}</Text>}
      {button(step==="email"?"Continuar":busy?"Entrando…":"Iniciar sesión",()=>step==="email"?continueEmail():void submit())}
      {step==="password"&&<><Pressable onPress={()=>router.push("/recover-account")} style={{paddingVertical:8,alignItems:"center"}}><Text style={{color:palette.black}}>¿Olvidaste tu contraseña?</Text></Pressable><Pressable onPress={()=>setStep("email")} style={{alignItems:"center",paddingVertical:5}}><Text style={{color:palette.muted}}>Cambiar correo</Text></Pressable></>}
      {step==="email"&&<><Text style={{textAlign:"center",color:palette.muted,fontSize:14,marginVertical:1}}>o</Text>
       <Pressable accessibilityRole="button" onPress={()=>social("Google")} style={{minHeight:47,borderRadius:9,borderWidth:1,borderColor:palette.border,flexDirection:"row",alignItems:"center",justifyContent:"center",gap:12}}><GoogleMark/><Text style={{fontSize:15,fontWeight:"700",color:palette.black}}>Continuar con Google</Text></Pressable>
       <Pressable onPress={()=>router.push("/account")} style={{alignItems:"center",paddingVertical:10}}><Text style={{fontSize:13,color:palette.black}}>¿No tienes cuenta? <Text style={{fontWeight:"700"}}>Regístrate</Text></Text></Pressable>
      </>}
     </View>
    </View>
   </ScrollView>
  </KeyboardAvoidingView>
 </SafeAreaView>;
}
