import {useState} from "react";
import {Linking,Modal,Pressable,ScrollView,Share,Text,TextInput,View,useWindowDimensions} from "react-native";
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
 {id:"more",label:"Compartir",icon:"share-social-outline"}
] as const;

/** Jobeen-owned bottom share sheet with real URL and QR. No invented contacts. */
export function JCardShareSheet({visible,onClose,label,link,theme}:{
 visible:boolean;onClose:()=>void;label:string;link:string;theme:ThemeName
}){
 const t=jobeenTokens(theme);
 const {width}=useWindowDimensions();
 const [query,setQuery]=useState("");
 const [showQr,setShowQr]=useState(false);
 const options=OPTIONS.filter(item=>item.label.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()));
 const message="JCard de "+label+": "+link;
 async function shareNative(){
  try{await Share.share({message,title:"Compartir JCard · "+label});}catch{}
 }
 async function openExternal(url:string){
  try{await Linking.openURL(url);}catch{await shareNative();}
 }
 function dismiss(){setShowQr(false);setQuery("");onClose();}
 function choose(action:ShareAction){
  if(action==="qr"){setShowQr(true);return;}
  dismiss();
  if(action==="whatsapp"){void openExternal("https://wa.me/?text="+encodeURIComponent(message));return;}
  if(action==="sms"){void openExternal("sms:?body="+encodeURIComponent(message));return;}
  void shareNative();
 }
 return <Modal visible={visible} transparent animationType="slide" statusBarTranslucent onRequestClose={dismiss}>
  <View style={{flex:1,justifyContent:"flex-end"}}>
   <Pressable accessibilityRole="button" accessibilityLabel="Cerrar Compartir JCard" onPress={dismiss}
    style={{position:"absolute",top:0,left:0,right:0,bottom:0,backgroundColor:jcardCommon.scrim}}/>
   <SafeAreaView edges={["bottom"]} style={{backgroundColor:t.surface,borderTopLeftRadius:30,borderTopRightRadius:30,maxHeight:"85%",overflow:"hidden"}}>
    <View style={{alignItems:"center",paddingTop:13,paddingBottom:8}}>
     <View style={{width:42,height:5,borderRadius:3,backgroundColor:t.silver}}/>
    </View>
    <View style={{paddingHorizontal:20,gap:14,paddingTop:10,paddingBottom:20}}>
     <View style={{flexDirection:"row",alignItems:"center",justifyContent:"space-between"}}>
      <Text style={{fontSize:19,fontWeight:"800",color:t.ink}}>{showQr?"Mi código QR":"Compartir JCard"}</Text>
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
       <Text style={{color:t.ink2,fontSize:12,textAlign:"center"}}>Mostrá este código para compartir tu JCard.</Text>
      </View>:
      <>
       <View style={{flexDirection:"row",alignItems:"center",gap:10,borderRadius:16,
        backgroundColor:t.cream,borderColor:t.line,borderWidth:1,paddingHorizontal:15,minHeight:49}}>
        <Ionicons name="search-outline" size={21} color={t.ink2}/>
        <TextInput value={query} onChangeText={setQuery} placeholder="Buscar opción para compartir"
         placeholderTextColor={t.ink2} accessibilityLabel="Buscar opción para compartir"
         style={{flex:1,color:t.ink,fontSize:15,paddingVertical:10}}/>
       </View>
       <Text numberOfLines={1} style={{fontSize:13,color:t.ink2}}>Compartir {label}</Text>
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
       <Text style={{fontSize:12,color:t.ink2}}>Mostrá tu QR o compartí tu JCard por WhatsApp, SMS y otras aplicaciones.</Text>
      </>}
    </View>
   </SafeAreaView>
  </View>
 </Modal>;
}
