import { useEffect, useId, useRef, useState } from "react";
import { router } from "expo-router";
import { Animated, Linking, Modal, PanResponder, Pressable, Share, ScrollView, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import Svg, { Defs, LinearGradient, Rect, Stop, Path, SvgXml } from "react-native-svg";
import {WORDMARK_XML} from "../theme/wordmark";
import QRCode from "react-native-qrcode-svg";
import { Avatar } from "./social-ui";
import { Button, useUi } from "./ui";
import { useTheme, type ThemeName } from "../state/ThemeProvider";
import { displayedRating, jcardTier, sealRows, type CardData, type BusinessCardData } from "../lib/jcard";
import {loadPublicContact} from "../lib/jcard-contact";
import { experienceLabel } from "../lib/employment";
import {ProfessionGlyph} from "./ProfessionGlyph";
import { LanguageRing, languageLabel, LANGUAGE_LEVELS } from "./LanguageRing";
import { jcardCommon, jcardLayout, jcardTokens } from "../theme/jcard";

export type { CardData } from "../lib/jcard";
const wordmarkJ=WORDMARK_XML.replace('viewBox="300 76 616 275"','viewBox="300 76 160 275"').replace(/(<path[^>]*\/>)[\s\S]*?(<\/g>)/,"$1$2");
function jobinGlyph(color:string){return wordmarkJ.replace('currentColor',color);}

function professionalIcon(profession:string, fallback:React.ComponentProps<typeof Ionicons>["name"]):React.ComponentProps<typeof Ionicons>["name"] {
  return /handyman|manitas|mantenimiento general|todero|multioficio/i.test(profession)?"construct-outline":fallback;
}
function languageDetails(name:string,fluency:number){
 const level=LANGUAGE_LEVELS.find(l=>l.value===fluency);
 const international=level?.code??(fluency<35?"A1–A2":fluency<55?"B1":fluency<75?"B2":fluency<95?"C1":"C2");
 return "Idioma: "+name+"\nNivel: "+languageLabel(fluency)+"\nReferencia internacional (MCER): "+international+".\nEl nivel es declarado por el usuario y no está verificado mediante examen.";
}
function CardFace({ card, theme, expanded = false, onEdit, onQr, contact, employerLink }: { card: CardData; theme: ThemeName; expanded?: boolean; onEdit?: () => void; onQr?: () => void; contact?:{email:string|null;phone:string|null}; employerLink?:{id:string;name:string;handle:string}|null }) {
  const { s, fs } = useUi();
  const { fontScale } = useWindowDimensions();
  const gradientId = "jcard" + useId().replace(/[^a-zA-Z0-9]/g, "");
  const shineId=gradientId+"shine";
  const finish = jcardTokens(theme, jcardTier(card.rating, card.reviewCount));
  const rating = displayedRating(card.rating, card.reviewCount);
  const embossInk=finish.text;
  const embossStrength=finish.start===finish.end?0.20:0.12;
  const [info,setInfo]=useState<string|null>(null);
  const primaryProfession=card.role.trim().replace(/^Técnico HVAC\s*\/\s*climatización y aire acondicionado$/i,"Técnico HVAC").replace(/\s*[-–/]\s*aire acondicionado\s*$/i,"").trim();
  const primarySeal=card.seals.find(seal=>/hvac/i.test(primaryProfession)?/hvac|aire acondicionado/i.test(seal.profession):seal.profession.trim().toLocaleLowerCase()===primaryProfession.toLocaleLowerCase());
  const secondarySeals=card.seals.filter(seal=>!(/hvac/i.test(primaryProfession)&&/hvac|aire acondicionado/i.test(seal.profession))&&seal.profession.trim().toLocaleLowerCase()!==primaryProfession.toLocaleLowerCase());
  const bodySize = Math.max(12, fs(expanded ? 14 : 13));
  const lineStyle = { color:finish.text, fontSize:bodySize, lineHeight:bodySize * 1.5 };
  return <View style={[s.panel, { padding:0, gap:0, borderRadius:jcardLayout.radius, borderColor:finish.line, backgroundColor:finish.start, overflow:"hidden" }]}>
    <Svg style={StyleSheet.absoluteFill} width="100%" height="100%" viewBox="0 0 400 650" preserveAspectRatio="none" accessible={false} pointerEvents="none">
      <Defs><LinearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor={finish.start}/><Stop offset="100%" stopColor={finish.end}/>
      </LinearGradient><LinearGradient id={shineId} x1="0%" y1="0%" x2="100%" y2="100%"><Stop offset="0%" stopColor={finish.start} stopOpacity="0.34"/><Stop offset="34%" stopColor={finish.start} stopOpacity="0"/><Stop offset="70%" stopColor={finish.end} stopOpacity="0.08"/><Stop offset="100%" stopColor={finish.end} stopOpacity="0.26"/></LinearGradient></Defs>
      <Rect width="100%" height="100%" fill={"url(#" + gradientId + ")"}/>
      <Rect width="100%" height="100%" fill={"url(#" + shineId + ")"}/>

      {/* Fine flowing emboss lines, like the supplied satin-paper reference. Keep the QR zone clean. */}
      {Array.from({length:15},(_,i)=><Path key={"left"+i} d={`M ${-45+i*10} 330 C ${42+i*4} 235, ${-20+i*8} 116, ${78+i*7} -25`} stroke={embossInk} strokeOpacity={embossStrength+(i%3)*0.018} strokeWidth={i%4===0?1.35:0.75} fill="none"/>)}
      {Array.from({length:16},(_,i)=><Path key={"bottom"+i} d={`M ${-45+i*13} 675 C ${60+i*8} 540, ${235+i*4} 555, ${440+i*2} 395`} stroke={embossInk} strokeOpacity={embossStrength+(i%4)*0.018} strokeWidth={i%5===0?1.45:0.75} fill="none"/>)}
      <Path d="M-20 420 C105 250 225 300 420 95" stroke={embossInk} strokeOpacity={embossStrength*0.7} strokeWidth="2" fill="none"/>
    </Svg>
    <View pointerEvents="none" style={[StyleSheet.absoluteFillObject,{borderRadius:jcardLayout.radius-3,borderWidth:1,borderColor:finish.line,margin:4,opacity:0.42}]}/>
    <View style={{ padding:jcardLayout.padding, gap:14 }}>
      <View style={{ paddingTop:Math.max(22, 20 * fontScale), flexDirection:"row", alignItems:"flex-start", justifyContent:"space-between" }}>
        <View accessible accessibilityRole="header" accessibilityLabel="JCard Personal" style={{position:"absolute",top:0,left:0,right:0,alignItems:"center",justifyContent:"center"}}>
          <Text style={{fontFamily:"cursive",fontWeight:"700",fontSize:24,lineHeight:29,color:finish.text}}>JCard</Text>
          <Text style={{fontFamily:"serif",fontStyle:"italic",fontSize:15,lineHeight:21,color:finish.text}}>Personal</Text>
        </View>
        <View style={{ width:jcardLayout.avatar + 8, height:jcardLayout.qr + 8 }}>
          <Avatar uri={card.avatar} name={card.name} size={jcardLayout.avatar}/>
          <Pressable accessibilityRole="button" accessibilityLabel="Información sobre verificación de identidad" onPress={()=>setInfo("La identidad todavía no está verificada. La insignia de verificación se otorgará tras revisar documentación válida según el país y la región.")} style={{position:"absolute",right:0,top:jcardLayout.avatar-17,width:25,height:25,borderRadius:13,backgroundColor:finish.sealFill,borderWidth:2,borderColor:finish.start,alignItems:"center",justifyContent:"center"}}>
           <SvgXml xml={jobinGlyph(finish.sealText)} width={22} height={22}/>
          </Pressable>
        </View>
        <View style={{alignItems:"center",gap:7}}>
          <Pressable accessibilityRole="button" accessibilityLabel="Ampliar código QR" onPress={event=>{event.stopPropagation();onQr?.();}} style={{ backgroundColor:jcardCommon.qrPaper, padding:jcardLayout.qrQuietZone, borderRadius:6 }}>
            <QRCode value={card.profileUrl} size={jcardLayout.qr} color={jcardCommon.qrInk} backgroundColor={jcardCommon.qrPaper}/>
          </Pressable>
        </View>
      </View>

      <View style={{ gap:5 }}>
        <View style={{flexDirection:"row",alignItems:"center",gap:8}}>
          <Text textBreakStrategy="simple" android_hyphenationFrequency="none" style={[s.h3,{color:finish.text,fontSize:Math.max(18,fs(expanded?20:19)),lineHeight:Math.max(25,fs(expanded?28:27)),flex:1,flexShrink:1}]}>{card.name}</Text>
          {!!card.years&&<Pressable accessibilityRole="button" accessibilityLabel="Información sobre experiencia general" onPress={()=>setInfo("Experiencia general\nEs el tiempo total trabajado en todas las profesiones y sectores registrados. Los períodos que coinciden se cuentan una sola vez.")} style={{alignItems:"flex-end",maxWidth:"38%"}}>
            <Text style={{fontSize:11,fontWeight:"600",color:finish.secondary,textAlign:"right"}}>{card.years} {card.years===1?"año":"años"}</Text>
            <Text style={{fontSize:9,color:finish.secondary,textAlign:"right"}}>Experiencia general</Text>
          </Pressable>}
        </View>
        <Text style={{color:finish.secondary,fontSize:11}}>@{card.handle}</Text>
        <View style={{flexDirection:"row",alignItems:"center",gap:7,width:"100%"}}>
          <Text textBreakStrategy="simple" android_hyphenationFrequency="none" style={[lineStyle,{fontWeight:"600",flexShrink:1,flexGrow:0}]}>{primaryProfession}{!!card.primarySpecialties?.length?" / Especializado":""}</Text>
          <Pressable accessibilityRole="button" accessibilityLabel="Detalles de la profesión principal" onPress={()=>setInfo("Profesión principal: "+primaryProfession+"\nEspecialidades: "+(card.primarySpecialties?.length?card.primarySpecialties.join(", "):"No declaradas")+"\nExperiencia en esta profesión: "+(primarySeal&&primarySeal.months?experienceLabel(primarySeal.months):"Sin experiencia registrada")+".\n"+(primarySeal?.verified?"Acreditación verificada.":"Acreditación pendiente de verificación."))} style={{padding:3,borderWidth:1,borderColor:finish.line,borderRadius:18,flexShrink:0}}>
            <ProfessionGlyph profession={card.role} fallback={primarySeal?.icon??"briefcase-outline"} size={19} color={finish.text}/>
          </Pressable>
        </View>
        <View style={{flexDirection:"row",alignItems:"center",flexWrap:"wrap",gap:8}}>
          <Pressable accessibilityRole="button" accessibilityLabel="Experiencia en la profesión principal" onPress={()=>setInfo("Experiencia en "+primaryProfession+"\n"+(primarySeal?.months?experienceLabel(primarySeal.months):"Sin experiencia registrada")+"\nSe calcula a partir de los períodos laborales asociados a esta profesión, sin duplicar meses coincidentes.")}>
            <Text style={{color:finish.secondary,fontSize:11,textDecorationLine:"underline"}}>{primarySeal?.months?experienceLabel(primarySeal.months):"Sin experiencia registrada"} · Profesión principal</Text>
          </Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel="Información sobre disponibilidad" onPress={()=>setInfo(card.status==="ACTIVE"?"Trabajando actualmente\nLa persona indica que tiene un trabajo activo. Esto no significa que Jobin haya confirmado su relación laboral.":"Disponible para trabajar\nLa persona indica que está abierta a nuevas oportunidades laborales o solicitudes de clientes.")}><Text style={{color:finish.text,fontWeight:"700",fontSize:10,letterSpacing:0.7,textDecorationLine:"underline"}}>{card.status==="ACTIVE"?"TRABAJANDO":"DISPONIBLE"} ⓘ</Text></Pressable>
        </View>
        {!!contact?.email&&<Pressable accessibilityRole="link" accessibilityLabel={"Enviar correo a "+contact.email} onPress={()=>void Linking.openURL("mailto:"+encodeURIComponent(contact.email!)).catch(()=>setInfo("No se encontró una aplicación de correo disponible."))} onLongPress={()=>void Share.share({message:contact.email!})}><Text selectable style={[lineStyle,{textDecorationLine:"underline"}]}>{contact.email}</Text></Pressable>}
        {!!contact?.phone&&<Text selectable style={lineStyle}>{contact.phone}</Text>}

        {card.status==="ACTIVE"&&employerLink&&<Pressable accessibilityRole="link" onPress={()=>router.push({pathname:"/company",params:{id:employerLink.id}})}><Text style={[lineStyle,{textDecorationLine:"underline"}]}>Trabaja en {employerLink.name} · @{employerLink.handle} ↗</Text><Text style={{fontSize:10,color:finish.secondary}}>Vínculo laboral verificado por la empresa</Text></Pressable>}

      </View>
      <View style={{flexDirection:"row",borderTopWidth:1,borderTopColor:finish.line,paddingTop:12,minHeight:105}}>
        <View style={{flex:1,paddingRight:7,gap:10}}>
          <Text style={{fontSize:10,color:finish.secondary,textAlign:"center",letterSpacing:1.2}}>Idiomas</Text>
          <View style={{flexDirection:"row",flexWrap:"wrap",justifyContent:"center",gap:8}}>
            {card.languages.map((language,index)=><Pressable key={language.name+index} accessibilityRole="button" accessibilityLabel={"Idioma "+language.name+", "+languageLabel(language.fluency)+". Ver detalles"} onPress={()=>setInfo(languageDetails(language.name,language.fluency))} style={{alignItems:"center",justifyContent:"center",width:"44%",paddingVertical:3}}>
              <LanguageRing name={language.name} value={language.fluency} color={finish.text} track={finish.line}/>
            </Pressable>)}
          </View>
        </View>
        <View style={{width:1,backgroundColor:finish.line,opacity:0.65,alignSelf:"stretch"}}/>
        <View style={{flex:1,paddingLeft:7,gap:10}}>
          <Text style={{fontSize:10,color:finish.secondary,textAlign:"center",letterSpacing:0.8}}>Otras profesiones</Text>
          <View style={{flexDirection:"row",flexWrap:"wrap",justifyContent:"center",gap:8}}>
            {secondarySeals.map(seal=><Pressable key={seal.id} accessibilityRole="button" accessibilityLabel={"Información del sello "+seal.profession} onPress={()=>setInfo(seal.profession+"\nEspecialidades: "+(seal.specialties?.length?seal.specialties.join(", "):"No declaradas")+"\nExperiencia registrada: "+experienceLabel(seal.months??0)+".\n"+(seal.verified?"Acreditación verificada.":"Acreditación pendiente de verificación."))} style={{width:"44%",height:56,alignItems:"center",justifyContent:"center"}}>
              <View style={{width:52,height:52,borderRadius:26,borderWidth:2,borderColor:seal.verified?finish.sealFill:finish.line,backgroundColor:finish.pendingFill,alignItems:"center",justifyContent:"center",elevation:4,shadowColor:finish.text,shadowOpacity:0.15,shadowRadius:5}}>
                <View style={{width:44,height:44,borderRadius:22,borderWidth:1,borderColor:finish.line,alignItems:"center",justifyContent:"center",gap:0}}>
                  <ProfessionGlyph profession={seal.profession} fallback={seal.icon} size={23} color={finish.text}/>
                  <Text adjustsFontSizeToFit numberOfLines={1} minimumFontScale={0.7} style={{fontSize:7,fontWeight:"700",color:finish.text,textAlign:"center",maxWidth:40}}>{experienceLabel(seal.months??0)}</Text>
                </View>
              </View>
            </Pressable>)}
          </View>
        </View>
      </View>
    </View>
    <Modal visible={info!==null} transparent animationType="fade" onRequestClose={()=>setInfo(null)}><View style={{flex:1,backgroundColor:jcardCommon.scrim,justifyContent:"center",padding:24}}><View style={{backgroundColor:jcardCommon.qrPaper,borderRadius:20,padding:24,gap:16}}><Text style={{fontSize:18,fontWeight:"700",color:jcardCommon.qrInk}}>Información</Text><Text style={{fontSize:15,lineHeight:23,color:jcardCommon.qrInk}}>{info}</Text><Button title="Entendido" onPress={()=>setInfo(null)}/></View></View></Modal>
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
export function JobinCard({card,previewTheme,onEditBusiness,ownerId,employerLink}:{card:CardData;previewTheme?:ThemeName;onEditBusiness?:()=>void;ownerId?:string;employerLink?:{id:string;name:string;handle:string}|null}){
 const {theme}=useTheme();const {width}=useWindowDimensions();
 const [contact,setContact]=useState<{email:string|null;phone:string|null}>({email:null,phone:null});
 useEffect(()=>{if(!ownerId){setContact({email:null,phone:null});return;}let live=true;void loadPublicContact(ownerId).then(value=>{if(live)setContact(value);}).catch(()=>{if(live)setContact({email:null,phone:null});});return()=>{live=false;};},[ownerId]);
 const [back,setBack]=useState(false),[shareOpen,setShareOpen]=useState(false),[qrOpen,setQrOpen]=useState(false),[faceHeight,setFaceHeight]=useState(340);
 const rotation=useRef(new Animated.Value(0)).current;
 const idleTilt=useRef(new Animated.Value(0)).current;
 const idleShine=useRef(new Animated.Value(0)).current;
 useEffect(()=>{const loop=Animated.loop(Animated.sequence([Animated.delay(2200),Animated.parallel([Animated.sequence([Animated.timing(idleTilt,{toValue:1,duration:480,useNativeDriver:true}),Animated.timing(idleTilt,{toValue:0,duration:560,useNativeDriver:true})]),Animated.sequence([Animated.timing(idleShine,{toValue:1,duration:480,useNativeDriver:true}),Animated.timing(idleShine,{toValue:0,duration:560,useNativeDriver:true})])]) ]));loop.start();return()=>loop.stop();},[idleTilt,idleShine]);
 const toggle=()=>{const next=!back;setBack(next);Animated.timing(rotation,{toValue:next?180:0,useNativeDriver:true,duration:500}).start();};
 const responder=useRef(PanResponder.create({onMoveShouldSetPanResponder:(_,g)=>Math.abs(g.dx)>28&&Math.abs(g.dx)>Math.abs(g.dy)*1.5,onPanResponderRelease:(_,g)=>{if(Math.abs(g.dx)>65)toggleRef.current();}})).current;
 const toggleRef=useRef(toggle);toggleRef.current=toggle;
 const frontRotate=rotation.interpolate({inputRange:[0,180],outputRange:["0deg","180deg"]});
 const backRotate=rotation.interpolate({inputRange:[0,180],outputRange:["180deg","360deg"]});
 const cardTheme=previewTheme??theme;
 const idleAngle=idleTilt.interpolate({inputRange:[0,1],outputRange:["0deg","2deg"]});
 const shineOpacity=idleShine.interpolate({inputRange:[0,1],outputRange:[0,0.48]});
 const share=()=>void Share.share({message:`JCard de ${card.name} · ${card.profileUrl}`,url:card.profileUrl,title:`JCard · ${card.name}`});
 return <>
  <View style={{width:"100%",maxWidth:520,alignSelf:"center"}}>
   <Animated.View {...responder.panHandlers} style={{transform:[{perspective:1100},{rotateY:idleAngle}]}}>
   <Animated.View onLayout={e=>setFaceHeight(e.nativeEvent.layout.height)} pointerEvents={back?"none":"auto"} style={{backfaceVisibility:"hidden",transform:[{perspective:1000},{rotateY:frontRotate}]}}>
    <CardFace card={card} theme={cardTheme} contact={contact} employerLink={employerLink} onEdit={()=>router.push("/professional")} onQr={()=>setQrOpen(true)}/>
   </Animated.View>
   <Animated.View pointerEvents={back?"auto":"none"} style={{position:"absolute",top:0,left:0,right:0,backfaceVisibility:"hidden",transform:[{perspective:1000},{rotateY:backRotate}]}}>
    <View style={{height:faceHeight}}><BusinessFace card={card} theme={cardTheme} onEdit={onEditBusiness}/></View>
   </Animated.View>
   <Animated.View pointerEvents="none" style={{position:"absolute",top:0,left:0,right:0,height:faceHeight,opacity:shineOpacity,borderRadius:jcardLayout.radius,overflow:"hidden"}}><Svg width="100%" height="100%" viewBox="0 0 320 420" preserveAspectRatio="none"><Defs><LinearGradient id="jcardIdleGlint" x1="0" y1="0" x2="1" y2="0"><Stop offset="0" stopColor={jcardCommon.glintEdge} stopOpacity="0"/><Stop offset="0.46" stopColor={jcardCommon.glintCenter} stopOpacity="0.06"/><Stop offset="0.52" stopColor={jcardCommon.glintCenter} stopOpacity="0.35"/><Stop offset="0.60" stopColor={jcardCommon.glintCenter} stopOpacity="0.03"/><Stop offset="1" stopColor={jcardCommon.glintEdge} stopOpacity="0"/></LinearGradient></Defs><Rect width="320" height="420" fill="url(#jcardIdleGlint)"/></Svg></Animated.View>
   </Animated.View>
   <Pressable accessibilityRole="button" accessibilityLabel={back?"Girar JCard a cara personal":"Girar JCard para ver el reverso"} accessibilityHint="Toca o desliza horizontalmente la tarjeta para girarla" onPress={toggle} style={{alignSelf:"center",width:"68%",height:31,justifyContent:"center",alignItems:"center",marginTop:1}}>
    <View pointerEvents="none" style={{position:"absolute",top:0,width:"90%",height:12,borderRadius:100,backgroundColor:theme==="dark"?jcardCommon.flipShadowDark:jcardCommon.flipShadow,transform:[{scaleX:0.92}]}}/>
    <View pointerEvents="none" style={{width:86,height:21,borderRadius:30,alignItems:"center",justifyContent:"center",backgroundColor:theme==="dark"?jcardCommon.flipSurfaceDark:jcardCommon.flipSurface,borderWidth:1,borderColor:theme==="dark"?jcardCommon.flipOutlineDark:jcardCommon.flipOutline}}>
      <Ionicons name="sync-outline" size={16} color={theme==="dark"?jcardCommon.flipInkDark:jcardCommon.editInk}/>
    </View>
   </Pressable>
   <View style={{flexDirection:"row",gap:10,paddingTop:10}}>
    <Pressable accessibilityRole="button" accessibilityLabel="Compartir JCard" onPress={()=>setShareOpen(true)} style={{flex:1,flexDirection:"row",alignItems:"center",justifyContent:"center",gap:9,paddingVertical:13,borderRadius:12,backgroundColor:colors.ink}}>
      <Ionicons name="share-social-outline" size={20} color={colors.paper}/><Text style={{color:colors.paper,fontWeight:"700"}}>Compartir</Text>
    </Pressable>
    <Pressable accessibilityRole="button" accessibilityLabel="Editar JCard" onPress={()=>back?onEditBusiness?.():router.push("/professional")} style={{flex:1,flexDirection:"row",alignItems:"center",justifyContent:"center",gap:9,paddingVertical:13,borderRadius:12,borderWidth:1,borderColor:colors.line}}>
      <Ionicons name="create-outline" size={20} color={colors.ink}/><Text style={{color:colors.ink,fontWeight:"700"}}>Editar JCard</Text>
    </Pressable>
   </View>
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
