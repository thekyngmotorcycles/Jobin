import {useRef,useState} from "react";
import {Linking,Modal,Platform,Pressable,ScrollView,Share,Text,TextInput,View,useWindowDimensions} from "react-native";
import {Ionicons} from "@expo/vector-icons";
import {SafeAreaView} from "react-native-safe-area-context";
import QRCode from "react-native-qrcode-svg";
import {jobeenTokens} from "../theme/jobeen";
import {jcardCommon} from "../theme/jcard";
import type {ThemeName} from "../state/ThemeProvider";

type ShareAction="qr"|"whatsapp"|"sms"|"more";
const OPTIONS=[
 {id:"qr",label:"Mi QR",icon:"qr-code-outline"},
 {id:"whatsapp",label:"WhatsApp",icon:"logo-whatsapp"},
 {id:"sms",label:"SMS",icon:"chatbubble-outline"},
 {id:"more",label:"Más opciones",icon:"share-social-outline"}
] as const;

/** Jobeen-owned bottom share sheet with real URL and QR. No invented contacts. */
export function JCardShareSheet({visible,onClose,label,link="",theme,side="personal",contentTitle,contentMessage,onShared,onError}:{
 visible:boolean;onClose:()=>void;label:string;link?:string;theme:ThemeName;side?:"personal"|"business";
 contentTitle?:string;contentMessage?:string;onShared?:()=>void;onError?:(reason:string)=>void;
}){
 const t=jobeenTokens(theme);
 const {width}=useWindowDimensions();
 const [query,setQuery]=useState("");
 const [showQr,setShowQr]=useState(false);
 const nativeSharePending=useRef(false);
 const cardType=side==="business"?"JCard de negocios":"JCard personal";
 const shareTitle=contentTitle??cardType;
 const options=OPTIONS.filter(item=>(item.id!=="qr"||!!link.trim())&&item.label.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()));
 const message=contentMessage??(cardType+" de "+label+": "+link);
 async function shareNative(){
  try{
   const result=await Share.share({message,title:shareTitle+" · "+label});
   if(result.action===Share.sharedAction)onShared?.();
  }catch{onError?.("No se pudo compartir. Inténtalo de nuevo.");}
 }
 async function openExternal(url:string){
  try{await Linking.openURL(url);}catch{await shareNative();}
 }
 function dismiss(){setShowQr(false);setQuery("");onClose();}
 function choose(action:ShareAction){
  if(action==="qr"){if(link.trim())setShowQr(true);return;}
  if(action==="whatsapp"){dismiss();void openExternal("https://wa.me/?text="+encodeURIComponent(message));return;}
  if(action==="sms"){dismiss();void openExternal("sms:?body="+encodeURIComponent(message));return;}
  // Android doesn't reliably fire Modal.onDismiss, so defer the native
 // system chooser until the Jobeen modal closing animation has completed.
 // The Android chooser itself supplies installed apps and suggested recipients.
 if(Platform.OS==="android"){dismiss();setTimeout(()=>void shareNative(),400);return;}
 nativeSharePending.current=true;
 dismiss();
 }
 return <Modal visible={visible} transparent animationType="slide" statusBarTranslucent onRequestClose={dismiss}
  onDismiss={()=>{if(nativeSharePending.current){nativeSharePending.current=false;void shareNative();}}}>
  <View style={{flex:1,justifyContent:"flex-end"}}>
   <Pressable accessibilityRole="button" accessibilityLabel="Cerrar panel de compartir" onPress={dismiss}
    style={{position:"absolute",top:0,left:0,right:0,bottom:0,backgroundColor:jcardCommon.scrim}}/>
   <SafeAreaView edges={["bottom"]} style={{backgroundColor:t.surface,borderTopLeftRadius:30,borderTopRightRadius:30,maxHeight:"85%",overflow:"hidden"}}>
    <View style={{alignItems:"center",paddingTop:13,paddingBottom:8}}>
     <View style={{width:42,height:5,borderRadius:3,backgroundColor:t.silver}}/>
    </View>
    <View style={{paddingHorizontal:20,gap:14,paddingTop:10,paddingBottom:20}}>
     <View style={{flexDirection:"row",alignItems:"center",justifyContent:"space-between"}}>
      <Text style={{fontSize:19,fontWeight:"800",color:t.ink}}>{showQr?"Mi código QR":shareTitle}</Text>
      <Pressable accessibilityRole="button" accessibilityLabel={showQr?"Volver a compartir":"Cerrar panel de compartir"}
       onPress={()=>showQr?setShowQr(false):dismiss()} style={{width:44,height:44,alignItems:"center",justifyContent:"center"}}>
       <Ionicons name={showQr?"arrow-back":"close"} size={23} color={t.ink}/>
      </Pressable>
     </View>
     {showQr?
      <View style={{alignItems:"center",gap:12,paddingVertical:12}}>
       <View style={{backgroundColor:jcardCommon.qrPaper,padding:15,borderRadius:17}}>
        <QRCode value={link} size={Math.min(width-92,260)} color={jcardCommon.qrInk} backgroundColor={jcardCommon.qrPaper}/>
       </View>
       <Text style={{color:t.ink,fontWeight:"700",fontSize:15}}>{label}</Text>
       <Text style={{color:t.ink2,fontSize:12,textAlign:"center"}}>Mostrá este código para compartir el enlace.</Text>
      </View>:
      <>
       <View style={{flexDirection:"row",alignItems:"center",gap:10,borderRadius:16,
        backgroundColor:t.cream,borderColor:t.line,borderWidth:1,paddingHorizontal:15,minHeight:49}}>
        <Ionicons name="search-outline" size={21} color={t.ink2}/>
        <TextInput value={query} onChangeText={setQuery} placeholder="Buscar opción para compartir"
         placeholderTextColor={t.ink2} accessibilityLabel="Buscar opción para compartir"
         style={{flex:1,color:t.ink,fontSize:15,paddingVertical:10}}/>
       </View>
       <ScrollView horizontal showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="handled"
        contentContainerStyle={{gap:16,paddingVertical:4,paddingRight:12}}>
        {options.map(option=><Pressable key={option.id} accessibilityRole="button"
         accessibilityLabel={option.id==="qr"?"Mostrar mi código QR":option.label}
         onPress={()=>choose(option.id)} style={{width:76,alignItems:"center",gap:8,minHeight:100}}>
         <View style={{width:62,height:62,borderRadius:31,justifyContent:"center",alignItems:"center",
          backgroundColor:option.id==="whatsapp"?t.okBackground:t.cream,
          borderColor:option.id==="qr"?t.yellow:t.line,borderWidth:option.id==="qr"?2:1}}>
          <Ionicons name={option.icon} size={27} color={option.id==="whatsapp"?t.okText:t.ink}/>
         </View>
         <Text numberOfLines={2} style={{fontSize:12,color:t.ink,textAlign:"center"}}>{option.label}</Text>
        </Pressable>)}
        {options.length===0&&<Text style={{color:t.ink2,paddingVertical:24}}>No hay opciones con ese nombre.</Text>}
       </ScrollView>
       <Text style={{fontSize:12,color:t.ink2}}>Para ver los contactos sugeridos y todas las apps instaladas, elegí Más opciones.</Text>
      </>}
    </View>
   </SafeAreaView>
  </View>
 </Modal>;
}

/** The same approved Jobeen share surface for profiles, posts, videos, JShop and CV. */
export const JobeenShareSheet=JCardShareSheet;
