import {useEffect,useRef,useState} from "react";
import {captureMessageScope,assertMessageScope,type MessageScope} from "../lib/message-session";
import {ActivityIndicator,KeyboardAvoidingView,Linking,Modal,Platform,Pressable,ScrollView,Share,Text,TextInput,View,useWindowDimensions} from "react-native";
import {Ionicons} from "@expo/vector-icons";
import {SafeAreaView} from "react-native-safe-area-context";
import QRCode from "react-native-qrcode-svg";
import {jobeenTokens} from "../theme/jobeen";
import {jobeenModalTokens} from "../theme/modals";
import {JOBEEN_TYPE,JOBEEN_LINE_HEIGHT} from "../theme/typography";
import {JOBEEN_CONTROL,royalHiveLayout} from "../theme/control-metrics";
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
 const {width,fontScale}=useWindowDimensions();
 const [query,setQuery]=useState("");
 const [showQr,setShowQr]=useState(false);
 const [contacts,setContacts]=useState<ShareRecipient[]>([]);
 const [selected,setSelected]=useState<string[]>([]);
 const [loading,setLoading]=useState(false);
 const [sending,setSending]=useState(false);
 const [status,setStatus]=useState("");
 const [contactError,setContactError]=useState("");
 const nativeSharePending=useRef(false);
 const scopeRef=useRef<MessageScope|null>(null),generation=useRef(0),mounted=useRef(true),sendGuard=useRef(false),timer=useRef<ReturnType<typeof setTimeout>|null>(null);
 const deferred=useRef<{scope:MessageScope;revision:number;message:string;title:string}|null>(null);
 const [ready,setReady]=useState(false);
 useEffect(()=>{mounted.current=true;return()=>{mounted.current=false;scopeRef.current=null;deferred.current=null;generation.current++;if(timer.current)clearTimeout(timer.current);};},[]);
 const cardType=side==="business"?"JCard de negocio":"JCard personal";
 const shareTitle=contentTitle??"Compartir "+cardType;
 const qrHeading=contentTitle?"Código QR":"Mi código QR";
 const qrLabel=contentTitle?"Código QR":"Mi QR";
 const message=contentMessage??(cardType+" de "+label+": "+link);
 const matchingContacts=contacts.filter(c=>c.name.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()));
 const options=OPTIONS.filter(item=>item.id!=="qr"||!!link.trim());
 // Preserve the four logical methods; allow horizontal scroll at accessible text sizes.
 const layout=royalHiveLayout(Math.min(width,700),fontScale,options.length);
 const {actionSize,avatarSize,recipientCell,methodCell}=layout;
 useEffect(()=>{
  if(!visible){scopeRef.current=null;setReady(false);setContacts([]);setSelected([]);setQuery("");setShowQr(false);return;}
  const revision=++generation.current;deferred.current=null;nativeSharePending.current=false;if(timer.current)clearTimeout(timer.current);
  let active=true;scopeRef.current=null;setReady(false);setContacts([]);
  setQuery("");setShowQr(false);setSelected([]);setStatus("");setContactError("");setLoading(true);
  void(async()=>{try{
   const scope=await captureMessageScope();
   const rows=await loadShareRecipients(scope);
   await assertMessageScope(scope);
   if(active&&generation.current===revision){scopeRef.current=scope;setContacts(rows);setReady(true);}
  }catch(error){if(active&&generation.current===revision)setContactError(error instanceof Error?error.message:"No se pudieron cargar los contactos.");}
  finally{if(active&&generation.current===revision)setLoading(false);}})();
  return()=>{active=false;scopeRef.current=null;};
 },[visible,link,contentMessage,label,side]);
 function toggleRecipient(id:string){
  if(sending||!ready||!scopeRef.current)return;
  setStatus("");
  setSelected(previous=>previous.includes(id)?previous.filter(x=>x!==id):[...previous,id]);
 }
 async function sendSelected(){
  const scope=scopeRef.current,revision=generation.current;
  if(!scope||sendGuard.current||!selected.length)return;
  const live=()=>mounted.current&&generation.current===revision&&scopeRef.current===scope;
  sendGuard.current=true;setSending(true);setStatus("");setContactError("");
  try{
   await captureMessageScope(scope);if(!live())return;
   const result=await sendToShareRecipients(selected,message,scope);
   await assertMessageScope(scope);if(!live())return;
   const completed=[...result.sent,...result.requested];
   if(result.sent.length)onShared?.();
   setSelected(previous=>previous.filter(id=>!completed.includes(id)));
   const fragments=[
    result.sent.length?result.sent.length+" enviado(s) por mensajes.":"",
    result.requested.length?result.requested.length+" solicitud(es) enviada(s); pendiente de aceptación.":"",
    result.failed.length?result.failed.length+" sin enviar: "+result.failed.map(f=>contacts.find(c=>c.id===f.id)?.name??"Contacto").join(", ")+".":""
   ].filter(Boolean);
   setStatus(fragments.join(" "));
  }catch(error){if(live())setContactError(error instanceof Error?error.message:"No se pudo compartir con los contactos.");}
  finally{sendGuard.current=false;if(mounted.current)setSending(false);}
 }
 async function verifyDeferred(task:NonNullable<typeof deferred.current>){
  await captureMessageScope(task.scope);
  return mounted.current&&generation.current===task.revision&&deferred.current===task;
 }
 async function shareNative(){
  const task=deferred.current;if(!task)return;
  try{
   if(!await verifyDeferred(task))return;
   const result=await Share.share({message:task.message,title:task.title});
   if(result.action===Share.sharedAction&&await verifyDeferred(task))onShared?.();
  }catch{if(mounted.current&&deferred.current===task)onError?.("No se pudo compartir. Inténtalo de nuevo.");}
  finally{if(deferred.current===task)deferred.current=null;}
 }
 async function openExternal(url:string){
  const task=deferred.current;if(!task)return;
  try{if(!await verifyDeferred(task))return;await Linking.openURL(url);if(deferred.current===task)deferred.current=null;}
  catch{if(!mounted.current||deferred.current!==task)return;if(Platform.OS==="android")timer.current=setTimeout(()=>void shareNative(),400);else await shareNative();}
 }
 function dismiss(){setShowQr(false);setQuery("");onClose();}
 function choose(action:ShareAction){
  const scope=scopeRef.current;if(!scope||!ready)return;
  if(action==="qr"){if(link.trim())setShowQr(true);return;}
  deferred.current={scope,revision:generation.current,message,title:shareTitle+" · "+label};
  if(action==="whatsapp"){dismiss();void openExternal("https://wa.me/?text="+encodeURIComponent(message));return;}
  if(action==="sms"){dismiss();void openExternal("sms:?body="+encodeURIComponent(message));return;}
  // The chooser opens only after Jobeen's modal closes; no overlapping sheets.
  if(Platform.OS==="android"){dismiss();timer.current=setTimeout(()=>void shareNative(),400);return;}
  nativeSharePending.current=true;dismiss();
 }
 return <Modal visible={visible} transparent animationType="slide" statusBarTranslucent onRequestClose={dismiss}
  onDismiss={()=>{if(nativeSharePending.current){nativeSharePending.current=false;void shareNative();}}}>
  <KeyboardAvoidingView style={{flex:1,justifyContent:"flex-end"}} behavior={Platform.OS==="ios"?"padding":undefined}>
   <Pressable accessibilityRole="button" accessibilityLabel="Cerrar panel de compartir" onPress={dismiss}
    style={{position:"absolute",top:0,left:0,right:0,bottom:0,backgroundColor:modal.scrim}}/>
   <SafeAreaView edges={["bottom","left","right"]} style={{width:"100%",maxWidth:700,alignSelf:"center",backgroundColor:modal.surface,borderTopLeftRadius:modal.radius.sheet,borderTopRightRadius:modal.radius.sheet,maxHeight:"88%",overflow:"hidden"}}>
    <View style={{alignItems:"center",paddingTop:10,paddingBottom:5}}>
     <View style={{width:42,height:5,borderRadius:3,backgroundColor:modal.handle}}/>
    </View>
    <ScrollView keyboardShouldPersistTaps="handled" nestedScrollEnabled style={{flexShrink:1}} contentContainerStyle={{paddingHorizontal:layout.margin,paddingBottom:16,gap:JOBEEN_CONTROL.modalContentGap}}>
    <View style={{flexDirection:"row",alignItems:"center",gap:8,paddingTop:4,paddingBottom:4}}>
     <View style={{width:39,height:39,borderRadius:13,alignItems:"center",justifyContent:"center",backgroundColor:t.yellow}}>
      <Ionicons name="share-social-outline" color={t.onYellow} size={24}/>
     </View>
     <Text accessibilityRole="header" style={{flex:1,minWidth:0,fontSize:JOBEEN_TYPE.modalTitle,lineHeight:JOBEEN_LINE_HEIGHT.modalTitle,fontWeight:"800",color:t.ink}}>{showQr?qrHeading:shareTitle}</Text>
     <Pressable accessibilityRole="button" accessibilityLabel={showQr?"Volver a compartir":"Cerrar panel de compartir"}
      onPress={()=>showQr?setShowQr(false):dismiss()} style={{width:JOBEEN_CONTROL.touchTarget,height:JOBEEN_CONTROL.touchTarget,justifyContent:"center",alignItems:"center"}}>
      <Ionicons name={showQr?"arrow-back":"close"} size={24} color={t.ink}/>
     </Pressable>
    </View>
    {showQr?<View style={{alignItems:"center",gap:12,padding:20}}>
      <View style={{backgroundColor:jcardCommon.qrPaper,padding:15,borderRadius:19}}>
       <QRCode value={link} size={Math.max(48,Math.min(layout.available-30,250))} color={jcardCommon.qrInk} backgroundColor={jcardCommon.qrPaper}/>
      </View>
      <Text style={{color:t.ink,fontSize:15,fontWeight:"700"}}>{label}</Text>
     </View>:<>

      <View style={{minHeight:JOBEEN_CONTROL.inputHeight,borderWidth:1,borderColor:t.outline,borderRadius:JOBEEN_CONTROL.inputRadius,backgroundColor:t.surface,
       flexDirection:"row",alignItems:"center",gap:10,paddingHorizontal:16}}>
       <Ionicons name="search-outline" size={20} color={t.ink2}/>
       <TextInput value={query} onChangeText={setQuery} placeholder="Buscar contactos de Jobeen"
        accessibilityLabel="Buscar contactos de Jobeen" placeholderTextColor={t.ink2}
        autoCapitalize="none" style={{flex:1,fontSize:JOBEEN_TYPE.input,color:t.ink,paddingVertical:7}}/>
      </View>
      <View style={{flexDirection:"row",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:8,marginTop:4}}>
       <View style={{flexDirection:"row",gap:8,alignItems:"center",flexShrink:1}}>
        <Ionicons name="people-outline" size={JOBEEN_CONTROL.secondaryIcon} color={t.accentText}/>
        <Text style={{flexShrink:1,fontSize:JOBEEN_TYPE.modalSectionTitle,fontWeight:"800",color:t.ink}}>Contactos Jobeen</Text>
       </View>
       <Text style={{fontSize:JOBEEN_TYPE.secondary,color:selected.length?t.ink:t.accentText,fontWeight:selected.length?"700":"700"}}>
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
          onPress={()=>toggleRecipient(contact.id)} style={{width:recipientCell,minHeight:JOBEEN_CONTROL.touchTarget,alignItems:"center",gap:8,paddingVertical:2}}>
          <View style={{width:avatarSize+8,height:avatarSize+8,alignItems:"center",justifyContent:"center",
           borderRadius:(avatarSize+8)/2,borderWidth:active?3:2,borderColor:active?t.yellow:t.outline,padding:2}}>
           <PublicProfileAvatar userId={contact.id} name={contact.name} size={avatarSize} framed={false}/>
           {active&&<View style={{position:"absolute",right:-4,top:-5,width:23,height:23,borderRadius:12,
            backgroundColor:t.yellow,borderWidth:2,borderColor:modal.surface,alignItems:"center",justifyContent:"center"}}>
            <Ionicons name="checkmark" color={t.onYellow} size={16}/>
           </View>}
          </View>
          <Text numberOfLines={fontScale<=1?2:undefined} style={{fontSize:JOBEEN_TYPE.modalRecipient,textAlign:"center",fontWeight:active?"800":"600",color:t.ink,lineHeight:JOBEEN_LINE_HEIGHT.modalRecipient}}>{contact.name}</Text>
         </Pressable>;
        })}
       </ScrollView>:
       <Text style={{color:t.ink2,fontSize:JOBEEN_TYPE.body,paddingVertical:12}}>
        {query.trim()?"No hay contactos que coincidan con la búsqueda.":"Aún no tienes contactos aceptados de Jobeen."}
       </Text>}
      {!!contactError&&<Text accessibilityRole="alert" style={{fontSize:12,color:t.ink}}>{contactError}</Text>}
      {!!status&&<Text accessibilityLiveRegion="polite" style={{fontSize:12,color:t.ink}}>{status}</Text>}
      <View style={{height:1,backgroundColor:t.line,marginVertical:4}}/>
      <View style={{flexDirection:"row",alignItems:"center",gap:9}}>
       <Ionicons name="layers-outline" size={JOBEEN_CONTROL.secondaryIcon} color={t.accentText}/>
       <Text style={{fontSize:JOBEEN_TYPE.modalSectionTitle,fontWeight:"800",color:t.ink}}>Compartir mediante</Text>
      </View>
      <ScrollView horizontal nestedScrollEnabled scrollEnabled={layout.methodsNeedScroll} showsHorizontalScrollIndicator={layout.methodsNeedScroll} keyboardShouldPersistTaps="handled" contentContainerStyle={{width:layout.methodsWidth,flexDirection:"row",gap:layout.gap,paddingBottom:4}}>
       {options.map(option=><Pressable key={option.id} accessibilityRole="button"
        accessibilityLabel={option.id==="qr"?"Mostrar código QR":option.label} disabled={!ready} onPress={()=>choose(option.id)}
        style={{width:methodCell,minHeight:JOBEEN_CONTROL.touchTarget,alignItems:"center",gap:8}}>
        <View style={{height:actionSize,width:actionSize,borderRadius:actionSize/2,
         borderWidth:option.id==="qr"?2:1,borderColor:option.id==="qr"?t.accentText:t.outline,
         backgroundColor:option.id==="whatsapp"?t.okBackground:t.cream,alignItems:"center",justifyContent:"center"}}>
         <Ionicons name={option.icon} size={JOBEEN_CONTROL.shareIcon} color={option.id==="whatsapp"?t.okText:t.ink}/>
        </View>
        <Text style={{textAlign:"center",fontSize:JOBEEN_TYPE.modalRecipient,lineHeight:JOBEEN_LINE_HEIGHT.modalRecipient,color:t.ink}}>{option.id==="qr"?qrLabel:option.label}</Text>
       </Pressable>)}
      </ScrollView>
     {!!selected.length&&<Pressable accessibilityRole="button"
       accessibilityLabel={"Enviar a "+selected.length+" contactos"} disabled={sending||!ready}
       onPress={()=>void sendSelected()} style={{minHeight:JOBEEN_CONTROL.touchTarget,marginTop:2,marginBottom:8,
        alignItems:"center",justifyContent:"center",opacity:sending?0.6:1}}>
       <View style={{minHeight:JOBEEN_CONTROL.visualAction,width:"100%",backgroundColor:t.yellow,borderRadius:24,paddingHorizontal:12,paddingVertical:10,
        alignItems:"center",justifyContent:"center",flexDirection:"row",gap:8}}>
        {sending?<ActivityIndicator color={t.onYellow}/>:<Ionicons name="paper-plane-outline" color={t.onYellow} size={19}/>}
        <Text style={{flexShrink:1,textAlign:"center",fontSize:JOBEEN_TYPE.modalAction,lineHeight:JOBEEN_LINE_HEIGHT.modalAction,fontWeight:"700",color:t.onYellow}}>{sending?"Enviando...":"Enviar a "+selected.length+" contacto"+(selected.length===1?"":"s")}</Text>
       </View>
      </Pressable>}
     </>}
    </ScrollView>
   </SafeAreaView>
  </KeyboardAvoidingView>
 </Modal>;
}

/** Every Jobeen share button uses the same branded, accessible contact and external share surface. */
export const JobeenShareSheet=JCardShareSheet;
