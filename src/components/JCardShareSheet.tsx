import {useEffect,useRef,useState} from "react";
import {ActivityIndicator,Linking,Modal,Platform,Pressable,ScrollView,Share,Text,TextInput,View,useWindowDimensions} from "react-native";
import {Ionicons} from "@expo/vector-icons";
import {SafeAreaView} from "react-native-safe-area-context";
import QRCode from "react-native-qrcode-svg";
import {jobeenTokens} from "../theme/jobeen";
import {jobeenModalTokens} from "../theme/modals";
import {JOBEEN_TYPE,JOBEEN_LINE_HEIGHT} from "../theme/typography";
import {jcardCommon} from "../theme/jcard";
import {PublicProfileAvatar} from "./PublicProfileAvatar";
import {loadShareRecipients,sendToShareRecipients,type ShareRecipient} from "../lib/share-contacts";
import type {ThemeName} from "../state/ThemeProvider";

type ShareAction="qr"|"whatsapp"|"sms"|"more";
const OPTIONS=[
 {id:"qr",label:"Mi QR",icon:"qr-code-outline"},
 {id:"whatsapp",label:"WhatsApp",icon:"logo-whatsapp"},
 {id:"sms",label:"SMS",icon:"chatbubble-outline"},
 {id:"more",label:"Más opciones",icon:"ellipsis-horizontal"}
] as const;

/** Jobeen Premium: the approved universal share sheet with real contact selection. */
export function JCardShareSheet({visible,onClose,label,link="",theme,side="personal",contentTitle,contentMessage,onShared,onError}:{
 visible:boolean;onClose:()=>void;label:string;link?:string;theme:ThemeName;side?:"personal"|"business";
 contentTitle?:string;contentMessage?:string;onShared?:()=>void;onError?:(reason:string)=>void;
}){
 const t=jobeenTokens(theme);const modal=jobeenModalTokens(theme);
 const {width}=useWindowDimensions();
 const [query,setQuery]=useState("");
 const [showQr,setShowQr]=useState(false);
 const [contacts,setContacts]=useState<ShareRecipient[]>([]);
 const [selected,setSelected]=useState<string[]>([]);
 const [loading,setLoading]=useState(false);
 const [sending,setSending]=useState(false);
 const [status,setStatus]=useState("");
 const [contactError,setContactError]=useState("");
 const nativeSharePending=useRef(false);
 const cardType=side==="business"?"JCard de negocio":"JCard personal";
 const shareTitle=contentTitle??"Compartir "+cardType;
 const qrHeading=contentTitle?"Código QR":"Mi código QR";
 const qrLabel=contentTitle?"Código QR":"Mi QR";
 const message=contentMessage??(cardType+" de "+label+": "+link);
 const matchingContacts=contacts.filter(c=>c.name.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()));
 const options=OPTIONS.filter(item=>item.id!=="qr"||!!link.trim());
 const actionSize=Math.max(48,Math.min(56,(width-70)/4));
 useEffect(()=>{
  if(!visible)return;
  let active=true;
  setQuery("");setShowQr(false);setSelected([]);setStatus("");setContactError("");setLoading(true);
  void loadShareRecipients().then(rows=>{if(active)setContacts(rows);})
   .catch(error=>{if(active){setContacts([]);setContactError(error instanceof Error?error.message:"No se pudieron cargar los contactos.");}})
   .finally(()=>{if(active)setLoading(false);});
  return()=>{active=false;};
 },[visible]);
 function toggleRecipient(id:string){
  if(sending)return;
  setStatus("");
  setSelected(previous=>previous.includes(id)?previous.filter(x=>x!==id):[...previous,id]);
 }
 async function sendSelected(){
  if(sending||!selected.length)return;
  setSending(true);setStatus("");setContactError("");
  try{
   const result=await sendToShareRecipients(selected,message);
   const completed=[...result.sent,...result.requested];
   if(result.sent.length)onShared?.();
   setSelected(previous=>previous.filter(id=>!completed.includes(id)));
   const fragments=[
    result.sent.length?result.sent.length+" enviado(s) por mensajes.":"",
    result.requested.length?result.requested.length+" solicitud(es) enviada(s); pendiente de aceptación.":"",
    result.failed.length?result.failed.length+" sin enviar: "+result.failed.map(f=>contacts.find(c=>c.id===f.id)?.name??"Contacto").join(", ")+".":""
   ].filter(Boolean);
   setStatus(fragments.join(" "));
  }catch(error){setContactError(error instanceof Error?error.message:"No se pudo compartir con los contactos.");}
  finally{setSending(false);}
 }
 async function shareNative(){
  try{
   const result=await Share.share({message,title:shareTitle+" · "+label});
   if(result.action===Share.sharedAction)onShared?.();
  }catch{onError?.("No se pudo compartir. Inténtalo de nuevo.");}
 }
 async function openExternal(url:string){
  try{await Linking.openURL(url);}catch{if(Platform.OS==="android")setTimeout(()=>void shareNative(),400);else await shareNative();}
 }
 function dismiss(){setShowQr(false);setQuery("");onClose();}
 function choose(action:ShareAction){
  if(action==="qr"){if(link.trim())setShowQr(true);return;}
  if(action==="whatsapp"){dismiss();void openExternal("https://wa.me/?text="+encodeURIComponent(message));return;}
  if(action==="sms"){dismiss();void openExternal("sms:?body="+encodeURIComponent(message));return;}
  // The chooser opens only after Jobeen's modal closes; no overlapping sheets.
  if(Platform.OS==="android"){dismiss();setTimeout(()=>void shareNative(),400);return;}
  nativeSharePending.current=true;dismiss();
 }
 return <Modal visible={visible} transparent animationType="slide" statusBarTranslucent onRequestClose={dismiss}
  onDismiss={()=>{if(nativeSharePending.current){nativeSharePending.current=false;void shareNative();}}}>
  <View style={{flex:1,justifyContent:"flex-end"}}>
   <Pressable accessibilityRole="button" accessibilityLabel="Cerrar panel de compartir" onPress={dismiss}
    style={{position:"absolute",top:0,left:0,right:0,bottom:0,backgroundColor:modal.scrim}}/>
   <SafeAreaView edges={["bottom"]} style={{backgroundColor:modal.surface,borderTopLeftRadius:modal.radius.sheet,borderTopRightRadius:modal.radius.sheet,maxHeight:"88%",overflow:"hidden"}}>
    <View style={{alignItems:"center",paddingTop:10,paddingBottom:5}}>
     <View style={{width:42,height:5,borderRadius:3,backgroundColor:modal.handle}}/>
    </View>
    <View style={{paddingHorizontal:18,flexDirection:"row",alignItems:"center",gap:10,paddingTop:7,paddingBottom:9}}>
     <View style={{width:39,height:39,borderRadius:13,alignItems:"center",justifyContent:"center",backgroundColor:t.yellow}}>
      <Ionicons name="share-social-outline" color={t.ink} size={24}/>
     </View>
     <Text numberOfLines={2} style={{flex:1,fontSize:JOBEEN_TYPE.modalTitle,lineHeight:JOBEEN_LINE_HEIGHT.modalTitle,fontWeight:"800",color:t.ink}}>{showQr?qrHeading:shareTitle}</Text>
     <Pressable accessibilityRole="button" accessibilityLabel={showQr?"Volver a compartir":"Cerrar panel de compartir"}
      onPress={()=>showQr?setShowQr(false):dismiss()} style={{width:44,height:44,justifyContent:"center",alignItems:"center"}}>
      <Ionicons name={showQr?"arrow-back":"close"} size={24} color={t.ink}/>
     </Pressable>
    </View>
    {showQr?<View style={{alignItems:"center",gap:12,padding:20}}>
      <View style={{backgroundColor:jcardCommon.qrPaper,padding:15,borderRadius:19}}>
       <QRCode value={link} size={Math.min(width-92,250)} color={jcardCommon.qrInk} backgroundColor={jcardCommon.qrPaper}/>
      </View>
      <Text style={{color:t.ink,fontSize:15,fontWeight:"700"}}>{label}</Text>
     </View>:<>
     <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}
      style={{flexShrink:1}} contentContainerStyle={{paddingHorizontal:18,paddingBottom:18,gap:10}}>
      <View style={{minHeight:42,borderWidth:1,borderColor:t.line,borderRadius:22,backgroundColor:t.cream,
       flexDirection:"row",alignItems:"center",gap:10,paddingHorizontal:16}}>
       <Ionicons name="search-outline" size={20} color={t.ink2}/>
       <TextInput value={query} onChangeText={setQuery} placeholder="Buscar contactos de Jobeen"
        accessibilityLabel="Buscar contactos de Jobeen" placeholderTextColor={t.ink2}
        autoCapitalize="none" style={{flex:1,fontSize:JOBEEN_TYPE.input,color:t.ink,paddingVertical:7}}/>
      </View>
      <View style={{flexDirection:"row",alignItems:"center",justifyContent:"space-between",gap:8,marginTop:4}}>
       <View style={{flexDirection:"row",gap:8,alignItems:"center",flexShrink:1}}>
        <Ionicons name="people-outline" size={19} color={t.yellow}/>
        <Text numberOfLines={1} style={{fontSize:JOBEEN_TYPE.modalSectionTitle,fontWeight:"800",color:t.ink}}>Contactos Jobeen</Text>
       </View>
       <Text style={{fontSize:JOBEEN_TYPE.secondary,color:selected.length?t.ink:t.ink2,fontWeight:selected.length?"700":"500"}}>
        {selected.length?"Seleccionados: "+selected.length:"Seleccionar varios"}
       </Text>
      </View>
      {loading?<ActivityIndicator color={t.yellow} style={{height:76}}/>:matchingContacts.length?
       <ScrollView horizontal showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="handled"
        contentContainerStyle={{gap:14,paddingHorizontal:2,paddingTop:7,paddingBottom:6}}>
        {matchingContacts.map(contact=>{
         const active=selected.includes(contact.id);
         return <Pressable key={contact.id} accessibilityRole="checkbox"
          accessibilityLabel={"Seleccionar "+contact.name} accessibilityState={{checked:active}}
          onPress={()=>toggleRecipient(contact.id)} style={{width:72,alignItems:"center",gap:7,paddingVertical:2}}>
          <View style={{width:62,height:62,alignItems:"center",justifyContent:"center",
           borderRadius:31,borderWidth:active?3:2,borderColor:t.yellow,padding:2}}>
           <PublicProfileAvatar userId={contact.id} name={contact.name} size={52} framed={false}/>
           {active&&<View style={{position:"absolute",right:-4,top:-5,width:23,height:23,borderRadius:12,
            backgroundColor:t.yellow,borderWidth:2,borderColor:modal.surface,alignItems:"center",justifyContent:"center"}}>
            <Ionicons name="checkmark" color={t.ink} size={16}/>
           </View>}
          </View>
          <Text numberOfLines={2} style={{fontSize:JOBEEN_TYPE.modalRecipient,textAlign:"center",fontWeight:active?"800":"600",color:t.ink,lineHeight:15}}>{contact.name}</Text>
         </Pressable>;
        })}
       </ScrollView>:
       <Text style={{color:t.ink2,fontSize:13,paddingVertical:15}}>
        {query.trim()?"No hay contactos que coincidan con la búsqueda.":"Aún no tienes contactos aceptados de Jobeen."}
       </Text>}
      {!!contactError&&<Text accessibilityRole="alert" style={{fontSize:12,color:t.ink}}>{contactError}</Text>}
      {!!status&&<Text accessibilityLiveRegion="polite" style={{fontSize:12,color:t.ink}}>{status}</Text>}
      <View style={{height:1,backgroundColor:t.line,marginVertical:4}}/>
      <View style={{flexDirection:"row",alignItems:"center",gap:9}}>
       <Ionicons name="layers-outline" size={18} color={t.yellow}/>
       <Text style={{fontSize:JOBEEN_TYPE.modalSectionTitle,fontWeight:"800",color:t.ink}}>Compartir mediante</Text>
      </View>
      <View style={{flexDirection:"row",justifyContent:"space-between",gap:6,marginBottom:4}}>
       {options.map(option=><Pressable key={option.id} accessibilityRole="button"
        accessibilityLabel={option.id==="qr"?"Mostrar código QR":option.label} onPress={()=>choose(option.id)}
        style={{flex:1,minWidth:0,alignItems:"center",gap:7}}>
        <View style={{height:actionSize,width:actionSize,borderRadius:actionSize/2,
         borderWidth:option.id==="qr"?2:1,borderColor:option.id==="qr"?t.yellow:t.line,
         backgroundColor:option.id==="whatsapp"?t.okBackground:t.cream,alignItems:"center",justifyContent:"center"}}>
         <Ionicons name={option.icon} size={23} color={option.id==="whatsapp"?t.okText:t.ink}/>
        </View>
        <Text numberOfLines={2} style={{textAlign:"center",fontSize:JOBEEN_TYPE.modalRecipient,color:t.ink}}>{option.id==="qr"?qrLabel:option.label}</Text>
       </Pressable>)}
      </View>
     </ScrollView>
     {!!selected.length&&<Pressable accessibilityRole="button"
       accessibilityLabel={"Enviar a "+selected.length+" contactos"} disabled={sending}
       onPress={()=>void sendSelected()} style={{minHeight:48,marginHorizontal:13,marginTop:2,marginBottom:8,
        alignItems:"center",justifyContent:"center",opacity:sending?0.6:1}}>
       <View style={{height:40,width:"100%",backgroundColor:t.yellow,borderRadius:20,
        alignItems:"center",justifyContent:"center",flexDirection:"row",gap:8}}>
        {sending?<ActivityIndicator color={t.ink}/>:<Ionicons name="paper-plane-outline" color={t.ink} size={19}/>}
        <Text style={{fontSize:JOBEEN_TYPE.modalAction,fontWeight:"700",color:t.ink}}>{sending?"Enviando...":"Enviar a "+selected.length+" contacto"+(selected.length===1?"":"s")}</Text>
       </View>
      </Pressable>}
     </>}
   </SafeAreaView>
  </View>
 </Modal>;
}

/** Every Jobeen share button uses the same branded, accessible contact and external share surface. */
export const JobeenShareSheet=JCardShareSheet;
