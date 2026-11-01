import { useEffect, useId, useRef, useState } from "react";
import { router } from "expo-router";
import { Animated, Modal, PanResponder, Pressable, Share, ScrollView, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import Svg, { Defs, LinearGradient, Rect, Stop, Path } from "react-native-svg";
import QRCode from "react-native-qrcode-svg";
import { Avatar } from "./social-ui";
import { Button, useUi } from "./ui";
import { useTheme, type ThemeName } from "../state/ThemeProvider";
import { displayedRating, jcardTier, sealRows, type CardData, type BusinessCardData } from "../lib/jcard";
import {loadPublicContact} from "../lib/jcard-contact";
import { experienceLabel } from "../lib/employment";
import { LanguageRing } from "./LanguageRing";
import { jcardCommon, jcardLayout, jcardTokens } from "../theme/jcard";

export type { CardData } from "../lib/jcard";

function CardFace({ card, theme, expanded = false, onEdit, onQr, contact }: { card: CardData; theme: ThemeName; expanded?: boolean; onEdit?: () => void; onQr?: () => void; contact?:{email:string|null;phone:string|null} }) {
  const { s, fs } = useUi();
  const { fontScale } = useWindowDimensions();
  const [contentWidth, setContentWidth] = useState(0);
  const gradientId = "jcard" + useId().replace(/[^a-zA-Z0-9]/g, "");
  const shineId=gradientId+"shine";
  const finish = jcardTokens(theme, jcardTier(card.rating, card.reviewCount));
  const rating = displayedRating(card.rating, card.reviewCount);
  const [info,setInfo]=useState<string|null>(null);
  const rows = sealRows(card.seals);
  const columns = Math.max(1, ...rows.map(row => row.length));
  const sealWidth = Math.max(Math.max(jcardLayout.minimumSealWidth, ...card.seals.map(seal => seal.label.length * 6 + 8)) * fontScale, (contentWidth - (columns - 1) * jcardLayout.gap) / columns);
  const bodySize = Math.max(12, fs(expanded ? 14 : 13));
  const lineStyle = { color:finish.text, fontSize:bodySize, lineHeight:bodySize * 1.5 };
  return <View style={[s.panel, { padding:0, gap:0, borderRadius:jcardLayout.radius, borderColor:finish.line, backgroundColor:finish.start, overflow:"hidden" }]}>
    <Svg style={StyleSheet.absoluteFill} width="100%" height="100%" accessible={false} pointerEvents="none">
      <Defs><LinearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor={finish.start}/><Stop offset="100%" stopColor={finish.end}/>
      </LinearGradient><LinearGradient id={shineId} x1="0%" y1="0%" x2="100%" y2="100%"><Stop offset="0%" stopColor={finish.start} stopOpacity="0.34"/><Stop offset="34%" stopColor={finish.start} stopOpacity="0"/><Stop offset="70%" stopColor={finish.end} stopOpacity="0.08"/><Stop offset="100%" stopColor={finish.end} stopOpacity="0.26"/></LinearGradient></Defs>
      <Rect width="100%" height="100%" fill={"url(#" + gradientId + ")"}/>
      <Rect width="100%" height="100%" fill={"url(#" + shineId + ")"}/>
      <Rect x="5" y="5" width="calc(100% - 10px)" height="calc(100% - 10px)" rx="22" fill="none" stroke={finish.line} strokeOpacity="0.4" strokeWidth="0.8"/>
      <Path d="M0 95 Q90 20 205 0" stroke={finish.line} strokeOpacity="0.17" strokeWidth="1.5" fill="none"/>
      <Path d="M0 118 Q110 35 240 0" stroke={finish.line} strokeOpacity="0.12" strokeWidth="1" fill="none"/>
    </Svg>
    <View style={{ padding:jcardLayout.padding, gap:14 }}>
      <View style={{ paddingTop:Math.max(22, 20 * fontScale), flexDirection:"row", alignItems:"flex-start", justifyContent:"space-between" }}>
        <Text accessibilityRole="header" style={[s.h3, { position:"absolute", top:0, left:0, right:0, textAlign:"center", fontSize:Math.max(13,fs(14)), letterSpacing:0.3, fontStyle:"italic",fontFamily:"serif",fontWeight:"600",lineHeight:19,color:finish.text }]}>{"JCard\nPersonal"}</Text>
        <View style={{ width:jcardLayout.avatar + 8, height:jcardLayout.qr + 8 }}>
          <Avatar uri={card.avatar} name={card.name} size={jcardLayout.avatar}/>
          <Pressable accessibilityRole="button" accessibilityLabel="Información sobre verificación de identidad" onPress={()=>setInfo("La identidad todavía no está verificada. La insignia de verificación se otorgará tras revisar documentación válida según el país y la región.")} style={{position:"absolute",right:0,top:jcardLayout.avatar-17,width:25,height:25,borderRadius:13,backgroundColor:finish.sealFill,borderWidth:2,borderColor:finish.start,alignItems:"center",justifyContent:"center"}}>
           <Svg width={19} height={19} viewBox="0 0 40 40"><Path d="M20 2 L34 9 L38 23 L29 36 L13 37 L2 25 L5 10 Z" fill={finish.sealText}/><Path d="M20 7 L30 12 L33 23 L27 31 L14 32 L7 24 L10 12 Z" fill={finish.start}/><Path d="M25 12 V23 Q25 29 18 29 Q13 29 12 24" stroke={finish.sealText} strokeWidth="4" fill="none" strokeLinecap="round"/></Svg>
          </Pressable>
        </View>
        <View style={{alignItems:"center",gap:7}}>
          <Pressable accessibilityRole="button" accessibilityLabel="Ampliar código QR" onPress={event=>{event.stopPropagation();onQr?.();}} style={{ backgroundColor:jcardCommon.qrPaper, padding:jcardLayout.qrQuietZone, borderRadius:6 }}>
            <QRCode value={card.profileUrl} size={jcardLayout.qr} color={jcardCommon.qrInk} backgroundColor={jcardCommon.qrPaper}/>
          </Pressable>
        </View>
      </View>

      <View style={{ gap:5 }}>
        <Text textBreakStrategy="simple" android_hyphenationFrequency="none" style={[s.h3, { color:finish.text, fontSize:Math.max(13,fs(expanded ? 16 : 14)), lineHeight:Math.max(21,fs(expanded ? 24 : 22)) }]}>
          {card.name}
        </Text>
        <Text style={{color:finish.secondary,fontSize:11}}>@{card.handle}</Text>
        <Text style={{ color:finish.text, fontWeight:"700", fontSize:11, letterSpacing:1.2 }}>{card.status==="ACTIVE"?"TRABAJANDO":"DISPONIBLE"}</Text>
        {!!contact?.email&&<Text selectable style={lineStyle}>{contact.email}</Text>}
        {!!contact?.phone&&<Text selectable style={lineStyle}>{contact.phone}</Text>}
        <Text textBreakStrategy="simple" android_hyphenationFrequency="none" style={lineStyle}>{card.role}{card.inAcademy ? " · En formación" : ""}{card.inAcademy && card.trainingVerified ? " ✓" : ""}</Text>

        {card.status === "ACTIVE" && card.employer && <Text textBreakStrategy="simple" android_hyphenationFrequency="none" style={lineStyle}>Trabaja en @{card.employer}</Text>}
        <View style={{flexDirection:"row",flexWrap:"wrap",gap:10,paddingTop:7}}>{card.languages.map((language,index)=><View key={language.name+index} style={{alignItems:"center",gap:3}}><LanguageRing name={language.name} value={language.fluency} color={finish.text} track={finish.line}/><Text style={{fontSize:10,color:finish.secondary}}>{language.name}</Text></View>)}</View>
      </View>

      <View onLayout={event => setContentWidth(event.nativeEvent.layout.width)} style={{ paddingTop:12, borderTopWidth:1, borderTopColor:finish.line }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} accessibilityLabel="Sellos profesionales; desliza horizontalmente si necesitas más espacio" contentContainerStyle={{ minWidth:"100%" }}>
          <View style={{ gap:jcardLayout.gap }}>
            {rows.map((row, index) => <View key={index} style={{ flexDirection:"row", gap:jcardLayout.gap }}>
              {row.map(seal => <Pressable key={seal.id} accessibilityRole="button" accessibilityLabel={"Información del sello "+seal.profession} onPress={()=>setInfo(seal.profession+"\n"+experienceLabel(seal.months??0)+" de experiencia registrada.\n"+(seal.verified?"Acreditación verificada.":"Acreditación pendiente de verificación."))} style={{width:Math.min(112,Math.max(82,sealWidth)),height:100,alignItems:"center",justifyContent:"center",gap:4}}>
                <View style={{width:70,height:70,borderRadius:35,borderWidth:3,borderColor:seal.verified?finish.sealFill:finish.line,backgroundColor:finish.pendingFill,alignItems:"center",justifyContent:"center",elevation:4,shadowColor:finish.text,shadowOpacity:0.15,shadowRadius:5}}>
                 <View style={{width:56,height:56,borderRadius:28,borderWidth:1,borderColor:finish.line,alignItems:"center",justifyContent:"center",gap:3}}>
                  <Ionicons name={seal.verified?"shield-checkmark-outline":seal.icon} size={23} color={finish.text}/>
                  <Text style={{fontSize:10,fontWeight:"800",color:finish.text}}>{experienceLabel(seal.months??0)}</Text>
                 </View>
                </View>
                <Text style={{fontSize:9,color:finish.secondary}}>{seal.verified?"VERIFICADO":"SIN VERIFICAR"}</Text>
              </Pressable>)}
            </View>)}
          </View>
        </ScrollView>
      </View>
    </View>
    <Modal visible={info!==null} transparent animationType="fade" onRequestClose={()=>setInfo(null)}><View style={{flex:1,backgroundColor:jcardCommon.scrim,justifyContent:"center",padding:24}}><View style={{backgroundColor:jcardCommon.qrPaper,borderRadius:20,padding:24,gap:16}}><Text style={{fontSize:18,fontWeight:"700",color:jcardCommon.qrInk}}>Información de la insignia</Text><Text style={{fontSize:15,lineHeight:23,color:jcardCommon.qrInk}}>{info}</Text><Button title="Entendido" onPress={()=>setInfo(null)}/></View></View></Modal>
  </View>;
}

function BusinessFace({card,theme,onEdit}:{card:CardData;theme:ThemeName;onEdit?:()=>void}){
 const {s}=useUi();const b=card.business;const finish=jcardTokens(theme,jcardTier(b?.rating??null,b?.reviewCount??0));
 const company=!!b?.name.trim();
 return <View style={[s.panel,{flex:1,padding:22,borderRadius:jcardLayout.radius,backgroundColor:finish.start,borderColor:finish.line,gap:15,justifyContent:"space-between"}]}>
  <View style={{gap:10}}>
   <Text style={{fontSize:19,fontWeight:"700",color:finish.text,textAlign:"center"}}>{company?"JCard · Negocio":"JCard · Presentación profesional"}</Text>
   <Text style={{fontSize:23,fontWeight:"700",color:finish.text}}>{company?b?.name:card.name}</Text>
   {company?<Text style={{color:finish.secondary}}>{b?.opened||"Apertura no indicada"} – {b?.closed||"Actualidad"}</Text>:<Text style={{color:finish.secondary}}>{card.role}</Text>}
   <Text style={{color:finish.text}}>{b?.services.length?b.services.join(" · "):"Agrega hasta tres servicios que ofreces"}</Text>
   <Text style={{color:finish.secondary}}>{b?.location||"Ubicación por completar"}</Text>
   <Text style={{color:finish.secondary}}>★ {displayedRating(b?.rating??null,b?.reviewCount??0)?.toFixed(1)??"Sin categoría"} · {b?.reviewCount??0} reseñas del negocio</Text>
  </View>
  <View style={{flexDirection:"row",justifyContent:"space-between",alignItems:"center"}}>
   <View/>
   {b?.licenseVerified&&<View accessibilityLabel="Licencia empresarial verificada" style={{width:28,height:28,borderRadius:14,backgroundColor:jcardCommon.verifiedBubble,alignItems:"center",justifyContent:"center"}}><Ionicons name="checkmark" size={19} color={jcardCommon.qrPaper}/></View>}
  </View>
 </View>;
}
export function JobinCard({card,previewTheme,onEditBusiness,ownerId}:{card:CardData;previewTheme?:ThemeName;onEditBusiness?:()=>void;ownerId?:string}){
 const {theme}=useTheme();const {width}=useWindowDimensions();
 const [contact,setContact]=useState<{email:string|null;phone:string|null}>({email:null,phone:null});
 useEffect(()=>{if(!ownerId){setContact({email:null,phone:null});return;}let live=true;void loadPublicContact(ownerId).then(value=>{if(live)setContact(value);}).catch(()=>{if(live)setContact({email:null,phone:null});});return()=>{live=false;};},[ownerId]);
 const [back,setBack]=useState(false),[shareOpen,setShareOpen]=useState(false),[qrOpen,setQrOpen]=useState(false),[faceHeight,setFaceHeight]=useState(340);
 const rotation=useRef(new Animated.Value(0)).current;
 const toggle=()=>{const next=!back;setBack(next);Animated.timing(rotation,{toValue:next?180:0,useNativeDriver:true,duration:500}).start();};
 const responder=useRef(PanResponder.create({onMoveShouldSetPanResponder:(_,g)=>Math.abs(g.dx)>28&&Math.abs(g.dx)>Math.abs(g.dy)*1.5,onPanResponderRelease:(_,g)=>{if(Math.abs(g.dx)>65)toggleRef.current();}})).current;
 const toggleRef=useRef(toggle);toggleRef.current=toggle;
 const frontRotate=rotation.interpolate({inputRange:[0,180],outputRange:["0deg","180deg"]});
 const backRotate=rotation.interpolate({inputRange:[0,180],outputRange:["180deg","360deg"]});
 const cardTheme=previewTheme??theme;
 const share=()=>void Share.share({message:`JCard de ${card.name} · ${card.profileUrl}`,url:card.profileUrl,title:`JCard · ${card.name}`});
 return <>
  <View style={{width:"100%",maxWidth:520,alignSelf:"center"}}>
   <View style={{flexDirection:"row",justifyContent:"flex-end",gap:10,paddingBottom:8}}>
    <Pressable accessibilityRole="button" accessibilityLabel="Compartir JCard" onPress={()=>setShareOpen(true)} style={{padding:9}}><Ionicons name="share-social-outline" size={23} color={jcardCommon.editInk}/></Pressable>
    <Pressable accessibilityRole="button" accessibilityLabel="Editar JCard" onPress={()=>back?onEditBusiness?.():router.push("/professional")} style={{padding:9}}><Ionicons name="create-outline" size={23} color={jcardCommon.editInk}/></Pressable>
   </View>
   <View {...responder.panHandlers}>
   <Animated.View onLayout={e=>setFaceHeight(e.nativeEvent.layout.height)} pointerEvents={back?"none":"auto"} style={{backfaceVisibility:"hidden",transform:[{perspective:1000},{rotateY:frontRotate}]}}>
    <CardFace card={card} theme={cardTheme} contact={contact} onEdit={()=>router.push("/professional")} onQr={()=>setQrOpen(true)}/>
   </Animated.View>
   <Animated.View pointerEvents={back?"auto":"none"} style={{position:"absolute",top:0,left:0,right:0,backfaceVisibility:"hidden",transform:[{perspective:1000},{rotateY:backRotate}]}}>
    <View style={{height:faceHeight}}><BusinessFace card={card} theme={cardTheme} onEdit={onEditBusiness}/></View>
   </Animated.View>
   </View>
   <Pressable accessibilityRole="button" accessibilityLabel={back?"Ver cara personal":"Ver reverso de JCard"} onPress={toggle} style={{alignSelf:"center",padding:8,flexDirection:"row",gap:6,alignItems:"center"}}>
    <Ionicons name="sync-outline" size={18} color={jcardCommon.editInk}/><Text style={{color:jcardCommon.editInk,fontSize:12}}>{back?"Negocio / Presentación · Ver personal":"Personal · Ver reverso"}</Text>
   </Pressable>
  </View>
  <Modal visible={shareOpen} transparent animationType="fade" onRequestClose={()=>setShareOpen(false)}>
   <SafeAreaView style={{flex:1,backgroundColor:jcardCommon.scrim,justifyContent:"center",padding:24}}>
    <View style={{padding:22,borderRadius:18,backgroundColor:jcardCommon.qrPaper,gap:14}}>
     <Text style={{fontSize:20,fontWeight:"700",color:jcardCommon.qrInk}}>Compartir JCard</Text>
     <Button title="Compartir enlace" onPress={()=>{setShareOpen(false);share();}}/>
     <Text style={{color:jcardCommon.qrInk}}>Guardar imagen JPG — disponible próximamente</Text>
     <Text style={{color:jcardCommon.qrInk}}>Agregar a Apple Wallet — requiere un pase digital firmado</Text>
     <Button title="Cerrar" onPress={()=>setShareOpen(false)}/>
    </View>
   </SafeAreaView>
  </Modal>
  <Modal visible={qrOpen} transparent animationType="fade" onRequestClose={()=>setQrOpen(false)}>
   <SafeAreaView style={{flex:1,backgroundColor:jcardCommon.scrim,justifyContent:"center",alignItems:"center",padding:16}}>
    <Pressable accessibilityRole="button" accessibilityLabel="Cerrar QR" onPress={()=>setQrOpen(false)} style={StyleSheet.absoluteFill}/>
    <View style={{padding:12,backgroundColor:jcardCommon.qrPaper,borderRadius:14,maxWidth:"100%"}}><QRCode value={card.profileUrl} size={Math.min(width-56,480)} color={jcardCommon.qrInk} backgroundColor={jcardCommon.qrPaper}/></View>
    <Pressable accessibilityRole="button" accessibilityLabel="Cerrar QR ampliado" onPress={()=>setQrOpen(false)} style={{padding:16}}><Ionicons name="close-circle" size={32} color={jcardCommon.qrPaper}/></Pressable>
   </SafeAreaView>
  </Modal>
 </>;
}
