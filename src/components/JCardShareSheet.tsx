import {Ionicons} from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {useCallback,useEffect,useMemo,useState} from "react";
import {ActivityIndicator,Alert,Linking,Modal,Platform,Pressable,ScrollView,Share,Text,TextInput,View,useWindowDimensions} from "react-native";
import {useSafeAreaInsets} from "react-native-safe-area-context";
import {useTheme} from "../state/ThemeProvider";
import {jobeenTokens} from "../theme/jobeen";
import {jcardSharingColors} from "../theme/jcard-share";
import {readJCardVisibility} from "../lib/jcard-visibility";
import {buildSharedJCard,MAX_SHARE_RECIPIENTS,sendJCardToContacts,shareContactSuggestions,type ShareRecipient,type SharedJCardSide} from "../lib/jcard-sharing";

type ExternalAction="whatsapp"|"sms"|"copy"|"more";
const PREFERENCE_KEY="jobeen.jcard.share.external-use.v1";
const externals=[
 {id:"whatsapp" as const,label:"WhatsApp",icon:"logo-whatsapp" as const,color:jcardSharingColors.whatsapp},
 {id:"sms" as const,label:"Mensajes",icon:"chatbubble-ellipses-outline" as const,color:jcardSharingColors.messages},
 {id:"copy" as const,label:"Copiar",icon:"copy-outline" as const,color:jcardSharingColors.neutral},
 {id:"more" as const,label:"Más",icon:"ellipsis-horizontal" as const,color:jcardSharingColors.neutral}
];
const initials=(name:string)=>name.trim().split(/\s+/).slice(0,2).map(s=>s.charAt(0)).join("").toUpperCase()||"J";

export function JCardShareSheet({visible,onClose,ownerId,name,side}:{visible:boolean;onClose:()=>void;ownerId?:string;name:string;side:SharedJCardSide}){
 const {theme}=useTheme(),color=jobeenTokens(theme),insets=useSafeAreaInsets(),{width}=useWindowDimensions();
 const [contacts,setContacts]=useState<ShareRecipient[]>([]);
 const [query,setQuery]=useState("");
 const [selected,setSelected]=useState<string[]>([]);
 const [loading,setLoading]=useState(false);
 const [sending,setSending]=useState(false);
 const [contactError,setContactError]=useState("");
 const [usage,setUsage]=useState<Partial<Record<ExternalAction,number>>>({});
 const share=useMemo(()=>{try{return ownerId?buildSharedJCard(ownerId,side,name):null;}catch{return null;}},[ownerId,side,name]);
 const load=useCallback(()=>{
  let live=true;
  setLoading(true);setContactError("");
  void shareContactSuggestions().then(items=>{if(live)setContacts(items);})
   .catch(e=>{if(live){setContacts([]);setContactError(e instanceof Error?e.message:"No se pudieron cargar tus contactos.");}})
   .finally(()=>{if(live)setLoading(false);});
  return()=>{live=false;};
 },[]);
 useEffect(()=>{
  if(!visible)return;
  setQuery("");setSelected([]);
  const cancel=load();
  let live=true;
  void AsyncStorage.getItem(PREFERENCE_KEY).then(value=>{
   if(!live||!value)return;
   try{const parsed=JSON.parse(value) as Record<string,unknown>;
    const safe:Partial<Record<ExternalAction,number>>={};
    for(const option of externals){const count=parsed[option.id];if(typeof count==="number"&&Number.isFinite(count)&&count>=0)safe[option.id]=Math.min(10000,count);}
    setUsage(safe);
   }catch{/* Don't block the share sheet if preferences are damaged. */}
  }).catch(()=>{});
  return()=>{cancel();live=false;};
 },[visible,load]);
 const matches=useMemo(()=>contacts.filter(c=>c.name.toLocaleLowerCase("es").includes(query.trim().toLocaleLowerCase("es"))),[contacts,query]);
 const apps=useMemo(()=>[...externals].sort((a,b)=>(usage[b.id]??0)-(usage[a.id]??0)||externals.indexOf(a)-externals.indexOf(b)),[usage]);
 const remember=(id:ExternalAction)=>{
  const next={...usage,[id]:Math.min(10000,(usage[id]??0)+1)};setUsage(next);
  void AsyncStorage.setItem(PREFERENCE_KEY,JSON.stringify(next)).catch(()=>{});
 };
 const toggle=(id:string)=>{
  setSelected(previous=>{
   if(previous.includes(id))return previous.filter(v=>v!==id);
   if(previous.length>=MAX_SHARE_RECIPIENTS){Alert.alert("Compartir JCard","Puedes elegir hasta cinco contactos por envío.");return previous;}
   return [...previous,id];
  });
 };
 const ensurePublic=async()=>{
  if(!share)throw new Error("No se puede compartir esta JCard.");
  const flags=await readJCardVisibility(share.userId);
  if(!(share.side==="personal"?flags.personal_enabled:flags.business_enabled))throw new Error("El propietario ha ocultado esta JCard. No se puede compartir mientras permanezca oculta.");
 };
 const send=async()=>{
  if(!share||sending||!selected.length)return;
  setSending(true);
  try{
   await ensurePublic();
   const recipients=contacts.filter(c=>selected.includes(c.id));
   const result=await sendJCardToContacts(share,recipients);
   if(result.failed.length){
    setSelected(result.failed.map(x=>x.id));
    Alert.alert("Compartir JCard",
     (result.sent.length?`Enviadas: ${result.sent.length}. `:"")+
     `No enviadas: ${result.failed.length}. `+
     result.failed.map(f=>f.name+": "+f.reason).join("\n").slice(0,750));
   }else{
    onClose();
    Alert.alert("JCard compartida",
     result.requests.length
      ?`Enviada a ${result.sent.length} contacto(s). ${result.requests.length} envío(s) quedaron como solicitud de mensaje hasta que el destinatario las acepte.`
      :`Enviada a ${result.sent.length} contacto(s) de Jobeen.`);
   }
  }catch(e){Alert.alert("No se pudo compartir",e instanceof Error?e.message:"Comprueba tu conexión.");}
  finally{setSending(false);}
 };
 const external=async(id:ExternalAction)=>{
  if(!share)return;
  remember(id);
  try{
   await ensurePublic();
   if(id==="whatsapp"){
    await Linking.openURL("https://wa.me/?text="+encodeURIComponent(share.message));
   }else if(id==="sms"){
    const separator=Platform.OS==="ios"?"&":"?";
    await Linking.openURL("sms:"+separator+"body="+encodeURIComponent(share.message));
   }else if(id==="copy"){
    // Android's existing chooser includes a Copy action, as in the user's APK.
    // A one-tap clipboard write would require a native clipboard module/build.
    Alert.alert("Copiar enlace","Selecciona «Copiar» en el menú de compartir de tu teléfono.",[
     {text:"Cancelar",style:"cancel"},
     {text:"Abrir menú",onPress:()=>{void Share.share({message:share.url,title:"Enlace de JCard"}).catch(()=>Alert.alert("Copiar enlace",share.url));}}
    ]);
   }else{
    await Share.share({message:share.message,title:`JCard de ${share.name}`});
   }
  }catch(e){Alert.alert("Compartir JCard",e instanceof Error?e.message:"No se pudo abrir esta aplicación.");}
 };
 return <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
  <View style={{flex:1,justifyContent:"flex-end",backgroundColor:jcardSharingColors.scrim}}>
   <Pressable accessibilityRole="button" accessibilityLabel="Cerrar compartir JCard" onPress={onClose} style={{flex:1}}/>
   <View style={{backgroundColor:color.surface,borderTopLeftRadius:26,borderTopRightRadius:26,paddingHorizontal:16,paddingTop:10,
     paddingBottom:Math.max(12,insets.bottom),gap:14,maxHeight:"90%"}}>
    <View style={{width:38,height:5,borderRadius:10,backgroundColor:color.line,alignSelf:"center"}}/>
    <View style={{flexDirection:"row",alignItems:"center",justifyContent:"space-between"}}>
     <Text accessibilityRole="header" style={{color:color.ink,fontSize:18,fontWeight:"800"}}>Compartir JCard {side==="business"?"empresarial":"personal"}</Text>
     <Pressable accessibilityRole="button" accessibilityLabel="Cerrar" onPress={onClose} style={{width:44,height:44,alignItems:"center",justifyContent:"center"}}><Ionicons name="close" size={23} color={color.ink}/></Pressable>
    </View>
    <View style={{borderRadius:13,backgroundColor:color.cream,padding:12,flexDirection:"row",gap:8,alignItems:"center"}}>
     <Ionicons name="id-card-outline" size={19} color={color.ink}/>
     <Text numberOfLines={2} style={{flex:1,fontSize:12,color:color.ink}}>{share?.name??"Tarjeta no disponible"}</Text>
    </View>
    <View style={{flexDirection:"row",alignItems:"center",borderWidth:1,borderColor:color.line,borderRadius:14,minHeight:48,paddingHorizontal:12,gap:8}}>
     <Ionicons name="search-outline" size={20} color={color.ink2}/>
     <TextInput value={query} onChangeText={setQuery} accessibilityLabel="Buscar contactos de Jobeen" placeholder="Buscar contactos de Jobeen" placeholderTextColor={color.ink2}
      style={{flex:1,color:color.ink,fontSize:14,paddingVertical:8}} autoCapitalize="none"/>
     {!!query&&<Pressable accessibilityRole="button" accessibilityLabel="Borrar búsqueda" onPress={()=>setQuery("")} style={{width:40,height:40,alignItems:"center",justifyContent:"center"}}><Ionicons name="close-circle" size={18} color={color.ink2}/></Pressable>}
    </View>
    <Text style={{color:color.ink,fontSize:14,fontWeight:"700"}}>Contactos de Jobeen</Text>
    {loading?<ActivityIndicator color={color.ink}/>:!!contactError?<Text style={{color:color.ink2,fontSize:12}}>{contactError}</Text>:
     matches.length===0?<Text style={{color:color.ink2,fontSize:12}}>{contacts.length?"No hay coincidencias.":"Todavía no tienes contactos aceptados para sugerir."}</Text>:
     <ScrollView style={{maxHeight:200}} nestedScrollEnabled keyboardShouldPersistTaps="handled">
      <View style={{flexDirection:"row",flexWrap:"wrap",rowGap:12}}>
       {matches.map(person=>{const active=selected.includes(person.id);
        return <Pressable key={person.id} accessibilityRole="checkbox" accessibilityState={{checked:active}} accessibilityLabel={"Enviar a "+person.name}
         onPress={()=>toggle(person.id)} style={{width:width<350?"33.333%":"25%",alignItems:"center",gap:5,paddingHorizontal:3,minHeight:102}}>
         <View style={{width:56,height:56,borderRadius:28,backgroundColor:color.cream,borderWidth:active?3:1,borderColor:active?color.yellow:color.line,alignItems:"center",justifyContent:"center"}}>
          <Text style={{fontWeight:"800",fontSize:16,color:color.ink}}>{initials(person.name)}</Text>
          {active&&<View style={{position:"absolute",bottom:-3,right:-4,backgroundColor:color.yellow,width:20,height:20,borderRadius:10,alignItems:"center",justifyContent:"center"}}><Ionicons name="checkmark" size={15} color={color.ink}/></View>}
         </View>
         <Text numberOfLines={2} style={{textAlign:"center",fontSize:11,lineHeight:14,color:color.ink}}>{person.name}</Text>
        </Pressable>;
       })}
      </View>
     </ScrollView>}
    {selected.length>0&&<Pressable accessibilityRole="button" accessibilityLabel={"Enviar JCard a "+selected.length+" contactos"} disabled={sending||!share}
     onPress={()=>void send()} style={{minHeight:48,borderRadius:14,backgroundColor:color.yellow,alignItems:"center",justifyContent:"center",flexDirection:"row",gap:8,opacity:sending?0.6:1}}>
     {sending?<ActivityIndicator color={color.ink}/>:<Ionicons name="send-outline" size={18} color={color.ink}/>}
     <Text style={{fontWeight:"800",color:color.ink}}>Enviar a {selected.length} contacto{selected.length===1?"":"s"}</Text>
    </Pressable>}
    <View style={{height:1,backgroundColor:color.line}}/>
    <Text style={{color:color.ink,fontSize:14,fontWeight:"700"}}>Compartir fuera de Jobeen</Text>
    <View style={{flexDirection:"row",justifyContent:"space-around",gap:5}}>
     {apps.map(app=><Pressable key={app.id} accessibilityRole="button" accessibilityLabel={app.id==="copy"?"Copiar enlace mediante Android":app.label+" · Compartir JCard"}
      disabled={!share} onPress={()=>void external(app.id)} style={{flex:1,alignItems:"center",gap:7,minHeight:96,opacity:share?1:0.45}}>
       <View style={{width:55,height:55,borderRadius:28,backgroundColor:app.color,alignItems:"center",justifyContent:"center"}}>
        <Ionicons name={app.icon} size={25} color={jcardSharingColors.white}/>
       </View>
       <Text numberOfLines={1} style={{fontSize:11,color:color.ink}}>{app.label}</Text>
      </Pressable>)}
    </View>
   </View>
  </View>
 </Modal>;
}
