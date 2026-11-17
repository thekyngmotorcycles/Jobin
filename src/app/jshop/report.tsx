import {Ionicons} from "@expo/vector-icons";
import {router,Stack,useLocalSearchParams} from "expo-router";
import {useState} from "react";
import {ActivityIndicator,Pressable,Text,TextInput,View} from "react-native";
import {JShopButton,JShopPage,JShopTitle} from "../../components/JShopUI";
import {jshopAccountId} from "../../lib/jshop-local";
import {reportJShopListing} from "../../lib/jshop-api";
import {useTheme} from "../../state/ThemeProvider";
import {jobeenTokens} from "../../theme/jobeen";

const REASONS=["Fraude o estafa","Artículo prohibido","Información falsa","Contenido inapropiado","Otro"] as const;
export default function ReportJShopItem(){
 const {listing}=useLocalSearchParams<{listing:string}>();
 const {theme}=useTheme();const t=jobeenTokens(theme);
 const [reason,setReason]=useState<(typeof REASONS)[number]|"">("");
 const [details,setDetails]=useState("");
 const [busy,setBusy]=useState(false);const [error,setError]=useState("");const [sent,setSent]=useState(false);
 async function send(){
  if(!listing||!reason||details.trim().length<10){setError("Seleccioná un motivo y explicá qué ocurrió (mínimo 10 caracteres).");return;}
  setBusy(true);setError("");
  try{
   const user=await jshopAccountId();
   await reportJShopListing(listing,user,reason,details);
   setSent(true);
  }catch(e){setError(e instanceof Error?e.message:"No se pudo enviar la denuncia.");}
  finally{setBusy(false);}
 }
 return <>
  <Stack.Screen options={{title:"Denunciar artículo"}}/>
  <JShopPage>
   <JShopTitle title="Denunciar publicación" subtitle="Ayudanos a identificar artículos que incumplen las reglas de Jobeen."/>
   {sent?<View style={{padding:22,borderWidth:1,borderColor:t.line,borderRadius:20,backgroundColor:t.surface,gap:12}}>
    <Ionicons name="checkmark-circle-outline" size={40} color={t.okText}/>
    <Text style={{fontWeight:"800",fontSize:17,color:t.ink}}>Denuncia enviada</Text>
    <Text style={{fontSize:13,lineHeight:20,color:t.ink2}}>Tu reporte quedó registrado. No garantiza una resolución inmediata.</Text>
    <JShopButton title="Volver al artículo" onPress={()=>router.back()}/>
   </View>:<>
    <Text style={{color:t.ink,fontWeight:"700"}}>Motivo</Text>
    <View style={{gap:8}}>
     {REASONS.map(item=><Pressable key={item} accessibilityRole="radio" accessibilityState={{checked:reason===item}} onPress={()=>setReason(item)}
      style={{flexDirection:"row",gap:12,minHeight:50,borderWidth:1,borderColor:t.line,backgroundColor:reason===item?t.cream:t.surface,borderRadius:17,padding:12,alignItems:"center"}}>
      <Ionicons name={reason===item?"radio-button-on":"radio-button-off"} size={22} color={t.ink}/>
      <Text style={{color:t.ink,flex:1}}>{item}</Text>
     </Pressable>)}
    </View>
    <Text style={{color:t.ink,fontWeight:"700"}}>¿Qué ocurrió?</Text>
    <TextInput accessibilityLabel="Descripción de la denuncia" multiline value={details} onChangeText={setDetails} maxLength={1000} placeholder="Describí el problema con este artículo" placeholderTextColor={t.ink2} textAlignVertical="top"
     style={{borderWidth:1,borderColor:t.line,backgroundColor:t.surface,borderRadius:17,minHeight:140,padding:13,color:t.ink}}/>
    <Text style={{fontSize:12,color:t.ink2}}>{details.length}/1000 caracteres</Text>
    {!!error&&<Text accessibilityLiveRegion="polite" style={{color:t.ink,fontWeight:"700"}}>{error}</Text>}
    <JShopButton title={busy?"Enviando...":"Enviar denuncia"} disabled={busy} onPress={()=>void send()}/>
    <JShopButton title="Cancelar" secondary onPress={()=>router.back()}/>
   </>}
  </JShopPage>
 </>;
}
