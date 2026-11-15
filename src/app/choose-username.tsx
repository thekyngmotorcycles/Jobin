import {useEffect,useState} from "react";
import {router} from "expo-router";
import {ActivityIndicator,KeyboardAvoidingView,Platform,Pressable,ScrollView,Text,TextInput,View} from "react-native";
import {SafeAreaView} from "react-native-safe-area-context";
import {Ionicons} from "@expo/vector-icons";
import {requireSupabase} from "../lib/supabase";
import {completeUsernameOnboarding} from "../components/AuthGate";
import {loginPalette as palette,accountSetupPalette as setup} from "../theme/auth-silver";
import {JobinWordmark} from "../components/JobinWordmark";

const VALID=/^[a-z][a-z0-9_]{2,29}$/;
const GOALS=[
 {id:"work",title:"Encontrar trabajo",detail:"Explorar oportunidades laborales",icon:"briefcase-outline"},
 {id:"clients",title:"Conseguir clientes",detail:"Dar a conocer mis servicios",icon:"people-outline"},
 {id:"learn",title:"Aprender nuevas habilidades",detail:"Crecer profesionalmente",icon:"school-outline"},
 {id:"hire",title:"Contratar profesionales",detail:"Encontrar personas con talento",icon:"person-add-outline"},
 {id:"grow",title:"Hacer crecer mi negocio",detail:"Descubrir nuevas oportunidades",icon:"storefront-outline"},
 {id:"connect",title:"Crear contactos profesionales",detail:"Conectar con mi sector",icon:"git-network-outline"}
] as const;
const {ink,muted,gold,paper}=setup;
export default function ChooseUsername(){
 const [step,setStep]=useState<1|2>(1);
 const [name,setName]=useState("");
 const [username,setUsername]=useState("");
 const [selected,setSelected]=useState<string[]>([]);
 const [busy,setBusy]=useState(false);
 const [message,setMessage]=useState("");
 useEffect(()=>{let active=true;void (async()=>{const client=requireSupabase();const {data:{user}}=await client.auth.getUser();if(!user)return;const {data:owned}=await client.from("usernames").select("username").eq("user_id",user.id).maybeSingle();if(active){if(owned?.username)setUsername(owned.username);const current=user.user_metadata?.display_name;if(typeof current==="string"&&!/^Nuevo usuario$/i.test(current))setName(current);}})().catch(()=>{});return()=>{active=false;};},[]);
 async function saveIdentity(){
  if(busy)return;
  const handle=username.trim().replace(/^@/,"").toLowerCase();
  const legal=name.trim().replace(/\s+/g," ");
  if(legal.length<2||legal.length>100){setMessage("Escribe tu nombre legal (entre 2 y 100 caracteres).");return;}
  if(!VALID.test(handle)){setMessage("El usuario debe tener entre 3 y 30 caracteres: letras minúsculas, números y guion bajo. Debe comenzar con una letra.");return;}
  setBusy(true);setMessage("");
  try{
   const client=requireSupabase();
   const {data:{user},error:userError}=await client.auth.getUser();
   if(userError||!user)throw new Error("La sesión ha expirado. Inicia sesión nuevamente.");
   const {data:owned,error:ownedError}=await client.from("usernames").select("username").eq("user_id",user.id).maybeSingle();
   if(ownedError)throw ownedError;
   if(owned && owned.username!==handle)throw new Error("Esta cuenta ya tiene un usuario asignado.");
   if(!owned){
    const {error}=await client.from("usernames").insert({user_id:user.id,username:handle});
    if(error?.code==="23505")throw new Error("Este nombre de usuario ya está ocupado. Prueba otro.");
    if(error)throw error;
   }
   const {error:profileError}=await client.from("profiles").update({display_name:legal}).eq("id",user.id);
   if(profileError)throw profileError;
   const {error:metadataError}=await client.auth.updateUser({data:{display_name:legal,username:handle}});
   if(metadataError)throw metadataError;
   setStep(2);
  }catch(error){setMessage(error instanceof Error?error.message:"No se pudo guardar tu identidad.");}
  finally{setBusy(false);}
 }
 async function finish(skip=false){
  if(busy)return;
  setBusy(true);setMessage("");
  try{
   const client=requireSupabase();
   const {error}=await client.auth.updateUser({data:{professional_goals:skip?[]:selected,account_setup_completed:true}});
   if(error)throw error;
   completeUsernameOnboarding();
   router.replace("/videos");
  }catch(error){setMessage(error instanceof Error?error.message:"No se pudieron guardar tus preferencias.");}
  finally{setBusy(false);}
 }
 function toggle(id:string){setSelected(prev=>prev.includes(id)?prev.filter(x=>x!==id):prev.length<3?[...prev,id]:prev);}
 return <SafeAreaView style={{flex:1,backgroundColor:paper}}>
  <KeyboardAvoidingView style={{flex:1}} behavior={Platform.OS==="ios"?"padding":undefined}>
   <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{flexGrow:1,paddingHorizontal:24,paddingTop:32,paddingBottom:28}}>
    <View style={{width:"100%",maxWidth:440,alignSelf:"center",flex:1}}>
     <View style={{flexDirection:"row",alignItems:"center",justifyContent:"space-between",marginBottom:32}}>
      <JobinWordmark width={155}/><Text style={{color:muted,fontSize:12,fontWeight:"600"}}>{step} / 2</Text>
     </View>
     <View style={{flexDirection:"row",gap:8,marginBottom:30}}><View style={{height:3,flex:1,backgroundColor:ink,borderRadius:4}}/><View style={{height:3,flex:1,backgroundColor:step===2?ink:setup.progressInactive,borderRadius:4}}/></View>
     <Text style={{color:gold,fontSize:11,fontWeight:"700",letterSpacing:2,marginBottom:12}}>{step===1?"TU IDENTIDAD":"PERSONALIZA TU EXPERIENCIA"}</Text>
     <Text style={{color:ink,fontSize:29,fontWeight:"700",letterSpacing:-0.7,marginBottom:12}}>{step===1?"Configura tu cuenta":"¿Qué buscas en Jobeen?"}</Text>
     <Text style={{color:muted,fontSize:15,lineHeight:23,marginBottom:28}}>{step===1?"Solo necesitamos dos datos para empezar. Podrás completar tu JCard más adelante.":"Selecciona hasta 3 objetivos. Puedes cambiarlos cuando quieras."}</Text>
     {step===1?<View style={{gap:10}}>
      <Text style={{color:ink,fontSize:14,fontWeight:"600"}}>Nombre legal</Text>
      <TextInput accessibilityLabel="Nombre legal" placeholder="Nombre y apellido" placeholderTextColor=setup.placeholder value={name} onChangeText={setName} autoCapitalize="words" maxLength={100} style={{backgroundColor:setup.fieldSoft,borderRadius:12,paddingHorizontal:16,minHeight:54,color:ink,fontSize:16}}/>
      <Text style={{color:muted,fontSize:12,marginBottom:18}}>El nombre que aparecerá en tu JCard.</Text>
      <Text style={{color:ink,fontSize:14,fontWeight:"600"}}>Nombre de usuario</Text>
      <TextInput accessibilityLabel="Nombre de usuario único" placeholder="@tu_usuario" placeholderTextColor=setup.placeholder value={username} onChangeText={v=>setUsername(v.toLowerCase().replace(/[^a-z0-9_@]/g,""))} autoCapitalize="none" autoCorrect={false} maxLength={31} style={{backgroundColor:setup.fieldSoft,borderRadius:12,paddingHorizontal:16,minHeight:54,color:ink,fontSize:16}}/>
      <Text style={{color:muted,fontSize:12,lineHeight:18}}>Entre 3 y 30 caracteres. Letras minúsculas, números y guion bajo. Debe ser único.</Text>
     </View>:<View style={{gap:10}}>{GOALS.map(goal=>{const checked=selected.includes(goal.id);return <Pressable key={goal.id} accessibilityRole="checkbox" accessibilityState={{checked}} onPress={()=>toggle(goal.id)} style={{flexDirection:"row",alignItems:"center",gap:12,borderWidth:1,borderColor:checked?gold:setup.outline,backgroundColor:checked?setup.selected:setup.white,borderRadius:12,padding:13,minHeight:75}}>
      <View style={{width:39,height:39,backgroundColor:setup.iconSurface,borderRadius:9,alignItems:"center",justifyContent:"center"}}><Ionicons name={goal.icon} size={20} color={ink}/></View>
      <View style={{flex:1}}><Text style={{color:ink,fontSize:14,fontWeight:"600"}}>{goal.title}</Text><Text style={{color:muted,fontSize:12,marginTop:4}}>{goal.detail}</Text></View>
      <View style={{width:22,height:22,borderWidth:1,borderColor:checked?ink:setup.checkboxOutline,backgroundColor:checked?ink:setup.white,borderRadius:5,alignItems:"center",justifyContent:"center"}}>{checked&&<Ionicons name="checkmark" size={16} color=setup.white/>}</View>
     </Pressable>;})}</View>}
     {!!message&&<Text accessibilityLiveRegion="polite" style={{color:palette.error,fontSize:13,marginTop:18}}>{message}</Text>}
     <View style={{marginTop:"auto",paddingTop:32}}>
      {step===2&&<Text style={{color:muted,fontSize:12,textAlign:"center",marginBottom:14}}>{selected.length} de 3 seleccionados</Text>}
      <Pressable accessibilityRole="button" disabled={busy} onPress={()=>void(step===1?saveIdentity():finish())} style={{backgroundColor:setup.button,borderRadius:12,minHeight:54,alignItems:"center",justifyContent:"center",opacity:busy?.6:1}}>{busy?<ActivityIndicator color=setup.white/>:<Text style={{color:setup.white,fontSize:16,fontWeight:"700"}}>{step===1?"Continuar":"Finalizar"}</Text>}</Pressable>
      {step===2&&<><Pressable accessibilityRole="button" disabled={busy} onPress={()=>void finish(true)} style={{paddingVertical:18,alignItems:"center"}}><Text style={{color:muted,fontSize:14}}>Omitir por ahora</Text></Pressable><Pressable accessibilityRole="button" onPress={()=>setStep(1)} style={{paddingVertical:8}}><Text style={{color:muted,fontSize:13}}>‹ Atrás</Text></Pressable></>}
     </View>
     <Text style={{color:setup.footer,fontSize:10,textAlign:"center",marginTop:28}}>JOBEEN · CONECTA. APRENDE. CRECE.</Text>
    </View>
   </ScrollView>
  </KeyboardAvoidingView>
 </SafeAreaView>;
}
