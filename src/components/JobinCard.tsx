import {jobeenTokens} from "../theme/jobeen";
import {personalAvatarUrl} from "../lib/personal-jcard-photo";
import {readJCardVisibility,DEFAULT_JCARD_VISIBILITY} from "../lib/jcard-visibility";
import {useFocusEffect} from "expo-router";
import {readJCardAppearance} from "../lib/jcard-appearance";
import {getPremiumBackground,JCARD_PREMIUM_TRANSPARENT,type JCardPremiumBackgroundId} from "../theme/jcard-premium-backgrounds";
import {JCardPremiumTexture} from "./JCardPremiumTexture";
import {BUSINESS_BADGE_NEUTRAL,BUSINESS_MEDAL_COLORS} from "../theme/business-medals";
import { memo, useCallback, useEffect, useId, useRef, useState } from "react";
import { router } from "expo-router";
import { Animated, Image, Linking, Modal, PanResponder, Pressable, Share, ScrollView, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import Svg, { Defs, LinearGradient, Rect, Stop, Path, Circle, SvgXml, ClipPath, Image as SvgImage } from "react-native-svg";
import {WORDMARK_XML} from "../theme/wordmark";
import {JCARD_WORDMARK_XML} from "../theme/jcard-wordmark";
import QRCode from "react-native-qrcode-svg";
import { Avatar } from "./social-ui";
import { Button, useUi } from "./ui";
import { useTheme, type ThemeName } from "../state/ThemeProvider";
import { displayedRating, jcardTier, sealRows, type CardData, type BusinessCardData } from "../lib/jcard";
import {loadPublicContact,loadVisiblePersonalContactDetails,type PersonalContactDetails} from "../lib/jcard-contact";
import { experienceLabel } from "../lib/employment";
import {ProfessionGlyph} from "./ProfessionGlyph";
import { LanguageRing, languageLabel, LANGUAGE_LEVELS } from "./LanguageRing";
import { businessCardAccents, businessCardPaper, businessInformationSurface, jcardCommon, jcardFloating, jcardReviewGlass, jcardLayout, jcardTokens } from "../theme/jcard";
import {businessCategoryArt} from "../lib/business-category-art";
import {categoryGlyph} from "../lib/category-icons";

export type { CardData } from "../lib/jcard";
const wordmarkJ=WORDMARK_XML.replace('viewBox="0 0 1175 540"','viewBox="0 0 530 540"').replace(/<path d="M1166[\s\S]*?(?=<path d="M517)/, "").replace(/<path d="M517/, '<path d="M517');
function jobinGlyph(color:string){return wordmarkJ.replace('currentColor',color);}

/** Identity seal: subtle scalloped edge. Never show the J for an unverified account. */
const IDENTITY_BADGE_CONTOUR=(()=>{
 const waves=12,points=120;
 return Array.from({length:points+1},(_,i)=>{
  const angle=i*2*Math.PI/points-Math.PI/2;
  const radius=11.1+0.65*Math.cos(waves*angle);
  return (i?"L":"M")+(13+radius*Math.cos(angle)).toFixed(2)+" "+(13+radius*Math.sin(angle)).toFixed(2);
 }).join(" ")+" Z";
})();
const JCARD_LEFT_CURVES=Array.from({length:15},(_,i)=>({d:`M ${-45+i*10} 330 C ${42+i*4} 235, ${-20+i*8} 116, ${78+i*7} -25`,index:i}));
const JCARD_BOTTOM_CURVES=Array.from({length:16},(_,i)=>({d:`M ${-45+i*13} 675 C ${60+i*8} 540, ${235+i*4} 555, ${440+i*2} 395`,index:i}));
const AWARD_POINTS=Array.from({length:48},(_,i)=>{const t=i*Math.PI/24-Math.PI/2;const radius=i%2?23:25;return (27+radius*Math.cos(t)).toFixed(2)+","+(27+radius*Math.sin(t)).toFixed(2);}).join(" ");
const JCardQr=memo(function JCardQr({value,size}:{value:string;size:number}){
 return <QRCode value={value} size={size} color={jcardCommon.qrInk} backgroundColor={jcardCommon.qrPaper}/>;
});
function IdentityBadge({verified,ink,contrast}:{verified:boolean;ink:string;contrast:string}){
 return <Svg width={25} height={25} viewBox="0 0 26 26" accessible={false}>
  <Path d={IDENTITY_BADGE_CONTOUR} fill={verified?ink:"none"} stroke={ink} strokeWidth={verified?0.8:1.15} strokeDasharray={verified?undefined:"1.2 2.3"} strokeLinecap="round"/>
  {verified&&<Path d="M16.4 6.8C13.8 6.7 12.4 8.2 11.6 11.5L10.1 17.2C9.7 18.9 8.8 19.5 7.8 19.5C7 19.5 6.7 19 6.9 18.3C7.1 17.7 7.7 17.4 8.3 17.5" stroke={contrast} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none"/>}
 </Svg>;
}
function professionalIcon(profession:string, fallback:React.ComponentProps<typeof Ionicons>["name"]):React.ComponentProps<typeof Ionicons>["name"] {
  return /handyman|manitas|mantenimiento general|todero|multioficio/i.test(profession)?"construct-outline":fallback;
}
function languageDetails(name:string,fluency:number){
 const level=LANGUAGE_LEVELS.find(l=>l.value===fluency);
 const international=level?.code??(fluency<35?"A1–A2":fluency<55?"B1":fluency<75?"B2":fluency<95?"C1":"C2");
 return "Idioma: "+name+"\nNivel: "+languageLabel(fluency)+"\nReferencia internacional (MCER): "+international+".\nEl nivel es declarado por el usuario y no está verificado mediante examen.";
}
function CardFace({ card, theme, appearance="original", expanded = false, onEdit, onQr, onShare, onEditPhoto, contact, employerLink }: { card: CardData; theme: ThemeName; appearance?:JCardPremiumBackgroundId; expanded?: boolean; onEdit?: () => void; onQr?: () => void; onShare?: () => void; onEditPhoto?: () => void; contact?:{email:string|null;phone:string|null;details?:PersonalContactDetails}; employerLink?:{id:string;name:string;handle:string}|null }) {
  const { s, fs } = useUi();
  const jobeen=jobeenTokens(theme);
  const { fontScale } = useWindowDimensions();
  const gradientId = "jcard" + useId().replace(/[^a-zA-Z0-9]/g, "");
  const shineId=gradientId+"shine";
  const premium=appearance==="original"?null:getPremiumBackground(appearance);const showDecorativeCurves=false;
  const finish = {...jcardTokens(theme, jcardTier(card.rating, card.reviewCount)),start:premium?.base??jobeen.surface,end:premium?.base??jobeen.surface,text:premium?.ink??jobeen.ink,secondary:premium?.ink??jobeen.ink2,line:premium?.line??jobeen.line,sealFill:businessCardPaper.muted,pendingFill:businessCardPaper.muted};
  const [artSize,setArtSize]=useState({width:0,height:0});
 const [selectedAward,setSelectedAward]=useState<{label:string;level:number}|null>(null);
  const rating = displayedRating(card.rating, card.reviewCount);
  const embossInk=finish.text;
  const embossStrength=finish.start===finish.end?0.20:0.12;
  const [info,setInfo]=useState<string|null>(null);
  const primaryProfession=card.role.trim().replace(/^Técnico HVAC\s*\/\s*climatización y aire acondicionado$/i,"Técnico HVAC").replace(/\s*[-–/]\s*aire acondicionado\s*$/i,"").trim();
  const primarySeal=card.seals.find(seal=>/hvac/i.test(primaryProfession)?/hvac|aire acondicionado/i.test(seal.profession):seal.profession.trim().toLocaleLowerCase()===primaryProfession.toLocaleLowerCase());
  const secondarySeals=card.seals.filter(seal=>!(/hvac/i.test(primaryProfession)&&/hvac|aire acondicionado/i.test(seal.profession))&&seal.profession.trim().toLocaleLowerCase()!==primaryProfession.toLocaleLowerCase());
  const sealCount = Math.max(card.languages.length, Math.min(secondarySeals.length, 5));
  const sealColumns = sealCount > 8 ? 4 : sealCount > 4 ? 3 : 2;
  const sealDiameter = sealCount > 12 ? 24 : sealCount > 8 ? 29 : sealCount > 4 ? 32 : 36;
  const sealGap = sealCount > 8 ? 2 : 4;
  const bodySize = Math.max(12, fs(expanded ? 14 : 13));
  const lineStyle = { color:finish.text, fontSize:bodySize, lineHeight:bodySize * 1.5 };
  return <View onLayout={e=>{const {width,height}=e.nativeEvent.layout;setArtSize(prev=>prev.width===width&&prev.height===height?prev:{width,height});}} style={[s.panel, { flex:1, padding:0, gap:0, borderRadius:28, borderColor:finish.line, backgroundColor:finish.start, overflow:"hidden" }]}>
    <Svg style={StyleSheet.absoluteFill} width="100%" height="100%" viewBox="0 0 400 650" preserveAspectRatio="none" accessible={false} pointerEvents="none">
      <Defs><LinearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor={finish.start}/><Stop offset="100%" stopColor={finish.end}/>
      </LinearGradient><LinearGradient id={shineId} x1="0%" y1="0%" x2="100%" y2="100%"><Stop offset="0%" stopColor={finish.start} stopOpacity="0.34"/><Stop offset="34%" stopColor={finish.start} stopOpacity="0"/><Stop offset="70%" stopColor={finish.end} stopOpacity="0.08"/><Stop offset="100%" stopColor={finish.end} stopOpacity="0.26"/></LinearGradient></Defs>
      <Rect width="100%" height="100%" fill={"url(#" + gradientId + ")"}/>
      <Rect width="100%" height="100%" fill={"url(#" + shineId + ")"}/>

      {/* Fine flowing emboss lines, like the supplied satin-paper reference. Keep the QR zone clean. */}
      {showDecorativeCurves&&JCARD_LEFT_CURVES.map(({d,index:i})=><Path key={"left"+i} d={d} stroke={embossInk} strokeOpacity={embossStrength+(i%3)*0.018} strokeWidth={i%4===0?1.35:0.75} fill="none"/>)}
      {showDecorativeCurves&&JCARD_BOTTOM_CURVES.map(({d,index:i})=><Path key={"bottom"+i} d={d} stroke={embossInk} strokeOpacity={embossStrength+(i%4)*0.018} strokeWidth={i%5===0?1.45:0.75} fill="none"/>)}
      {showDecorativeCurves&&<Path d="M-20 420 C105 250 225 300 420 95" stroke={embossInk} strokeOpacity={embossStrength*0.7} strokeWidth="2" fill="none"/>}
    </Svg>
    {premium&&artSize.width>0&&<View pointerEvents="none" style={StyleSheet.absoluteFill}><JCardPremiumTexture id={appearance} width={artSize.width} height={artSize.height}/></View>}
    <View pointerEvents="none" style={[StyleSheet.absoluteFillObject,{borderRadius:25,borderWidth:1,borderColor:finish.line,margin:4,opacity:0.42}]}/>
    <View style={{ padding:theme==="light"?12:jcardLayout.padding, gap:theme==="light"?5:8, flex:1, justifyContent:"space-between" }}>
      <View style={{ paddingTop:theme==="light"?18:Math.max(22, 20 * fontScale), flexDirection:"row", alignItems:"flex-start", justifyContent:"space-between" }}>
        <View accessible accessibilityRole="header" accessibilityLabel="JCard Personal" style={{position:"absolute",top:0,left:theme==="light"?0:0,right:theme==="light"?undefined:0,alignItems:theme==="light"?"flex-start":"center",justifyContent:"center"}}>
          {theme==="light"?<View style={{flexDirection:"row",alignItems:"center",gap:6}}><Svg width={16} height={16} viewBox="0 0 22 22" accessible={false}><Path d="M11 1.5 19.2 6.2v9.6L11 20.5 2.8 15.8V6.2Z" fill={jobeen.hexFront} stroke={jobeen.ink} strokeWidth={1.5}/></Svg><Text style={{fontSize:11,fontWeight:"800",letterSpacing:2,color:jobeen.ink}}>JCARD · PERSONAL</Text></View>:<><SvgXml xml={JCARD_WORDMARK_XML.replace("currentColor",finish.text)} width={74} height={25} accessible={false}/><Text style={{fontFamily:"serif",fontStyle:"italic",fontSize:12,lineHeight:16,color:finish.text,textAlign:"center"}}>Personal</Text></>}
        </View>
        <Pressable disabled={!onEditPhoto} accessibilityRole={onEditPhoto?"button":undefined} accessibilityLabel={onEditPhoto?"Cambiar foto de JCard personal":undefined} onPress={event=>{event.stopPropagation();onEditPhoto?.();}} style={{width:theme==="light"?100:jcardLayout.avatar+8,height:theme==="light"?100:jcardLayout.qr+8,justifyContent:"center",alignItems:"center"}}>
          <View style={{borderRadius:52,borderWidth:theme==="light"?3:0,borderColor:jobeen.yellow,padding:theme==="light"?1:0}}><Avatar uri={personalAvatarUrl(card.avatar)} name={card.name} size={theme==="light"?92:jcardLayout.avatar}/></View>
        </Pressable>
        <View style={{alignItems:"center",gap:7,position:"relative"}}>
          {onShare&&<Pressable accessibilityRole="button" accessibilityLabel="Compartir JCard personal" onPress={event=>{event.stopPropagation();onShare();}} style={{position:"absolute",right:0,top:-30,width:28,height:28,alignItems:"center",justifyContent:"center",zIndex:2}}><Ionicons name="share-social-outline" size={18} color={finish.text}/></Pressable>}
          <Pressable accessibilityRole="button" accessibilityLabel="Ampliar código QR" onPress={event=>{event.stopPropagation();onQr?.();}} style={{ backgroundColor:jcardCommon.qrPaper, padding:jcardLayout.qrQuietZone, borderRadius:6 }}>
            <JCardQr value={card.profileUrl} size={theme==="light"?56:jcardLayout.qr}/>
          </Pressable>
        </View>
      </View>

      <View style={{flex:1,minHeight:0,justifyContent:"flex-start",gap:5,paddingTop:0,paddingBottom:4}}>
        <View style={{gap:0,marginTop:0}}>
        <View style={{flexDirection:"row",alignItems:"center",gap:8}}>
          <View style={{flex:1,minWidth:0,flexDirection:"row",alignItems:"center",gap:4}}><Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.65} style={[s.h3,{color:finish.text,fontSize:Math.max(20,fs(expanded?22:22)),lineHeight:Math.max(23,fs(expanded?26:25)),flexShrink:1}]}>{card.name}</Text><Pressable accessibilityRole="button" accessibilityLabel={card.identityVerified?"Persona verificada":"Persona sin verificar"} onPress={()=>setInfo(card.identityVerified?"Identidad verificada por Jobeen. Esta insignia no certifica licencias ni competencias profesionales.":"Identidad sin verificar. Para obtener la insignia se requerirá nombre legal, correo y teléfono confirmados, documento de identidad y validación de identidad.")} style={{width:19,height:19,alignItems:"center",justifyContent:"center",flexShrink:0}}><View style={{transform:[{scale:0.72}]}}><IdentityBadge verified={card.identityVerified===true} ink={finish.text} contrast={finish.start}/></View></Pressable></View>
          {false&&!!card.years&&<Pressable accessibilityRole="button" accessibilityLabel="Información sobre experiencia general" onPress={()=>setInfo("Experiencia general\nEs el tiempo total trabajado en todas las profesiones y sectores registrados. Los períodos que coinciden se cuentan una sola vez.")} style={{alignItems:"flex-end",maxWidth:"38%"}}>
            <Text style={{fontSize:11,fontWeight:"600",color:finish.secondary,textAlign:"right"}}>{card.years} {card.years===1?"año":"años"}</Text>
            <Text style={{fontSize:9,color:finish.secondary,textAlign:"right"}}>Experiencia general</Text>
          </Pressable>}
        </View>
        <Text numberOfLines={1} style={{color:finish.secondary,fontSize:14,lineHeight:19,marginTop:0}}>@{card.handle}</Text>
        {typeof card.followers==="number"&&<Text style={{color:finish.secondary,fontSize:10}}>{card.followers.toLocaleString()} seguidores</Text>}
        </View>
        <View style={{flex:1,minHeight:0,justifyContent:"center",gap:4,paddingTop:0}}>
        <View style={{flexDirection:"row",alignItems:"center",gap:7,width:"100%"}}>
          <Text textBreakStrategy="simple" android_hyphenationFrequency="none" style={[lineStyle,{fontWeight:"600",flexShrink:1,flexGrow:0}]}>{primaryProfession}{!!card.primarySpecialties?.length?" / Especializado":""}</Text>
          <Pressable accessibilityRole="button" accessibilityLabel="Detalles de la profesión principal" onPress={()=>setInfo("Profesión principal: "+primaryProfession+"\nEspecialidades: "+(card.primarySpecialties?.length?card.primarySpecialties.join(", "):"No declaradas")+"\nExperiencia en esta profesión: "+(primarySeal&&primarySeal.months?experienceLabel(primarySeal.months):"Sin experiencia registrada")+".\n"+(primarySeal?.verified?"Acreditación verificada.":"Acreditación pendiente de verificación."))} style={{padding:3,borderWidth:1,borderColor:finish.line,borderRadius:18,flexShrink:0}}>
            <ProfessionGlyph profession={card.role} fallback={primarySeal?.icon??"briefcase-outline"} size={19} color={finish.text}/>
          </Pressable>
        </View>
        <View style={{flexDirection:"row",alignItems:"center",flexWrap:"wrap",gap:8}}>
          {!!card.years&&<Text style={{backgroundColor:jobeen.cream,borderColor:jobeen.yellow,borderWidth:1,borderRadius:16,overflow:"hidden",paddingHorizontal:10,paddingVertical:5,color:jobeen.ink,fontSize:12}}>{card.years} {card.years===1?"año":"años"} de experiencia</Text>}
          <Pressable accessibilityRole="button" accessibilityLabel="Información sobre disponibilidad" onPress={()=>setInfo(card.status==="ACTIVE"?"Trabajando actualmente\nLa persona indica que tiene un trabajo activo. Esto no significa que Jobeen haya confirmado su relación laboral.":"Disponible para trabajar\nLa persona indica que está abierta a nuevas oportunidades laborales o solicitudes de clientes.")} style={{minHeight:44,justifyContent:"center"}}><View style={{flexDirection:"row",alignItems:"center",gap:5,backgroundColor:jobeen.okBackground,borderRadius:18,paddingHorizontal:10,paddingVertical:6}}><View style={{width:7,height:7,borderRadius:4,backgroundColor:jobeen.okDot}}/><Text style={{color:jobeen.okText,fontWeight:"700",fontSize:11}}>{card.status==="ACTIVE"?"Trabajando":"Disponible"}</Text></View></Pressable>
        </View>
        {false&&[contact?.details?.email_primary||contact?.email,contact?.details?.email_secondary].filter(Boolean).map((email,i)=><Pressable key={"email"+i} accessibilityRole="link" onPress={()=>void Linking.openURL("mailto:"+encodeURIComponent(email!)).catch(()=>setInfo("No se encontró una aplicación de correo disponible."))} style={{alignSelf:"stretch"}}><Text numberOfLines={1} ellipsizeMode="tail" style={[lineStyle,{textDecorationLine:"underline"}]}>{email}</Text></Pressable>)}
        {false&&!!(contact?.details?.phone_primary||contact?.phone||contact?.details?.phone_secondary)&&<View style={{flexDirection:"row",alignItems:"center",gap:5,alignSelf:"stretch"}}>{[contact?.details?.phone_primary||contact?.phone,contact?.details?.phone_secondary].filter(Boolean).map((phone,i)=><View key={"phone"+i} style={{flex:1,minWidth:0,flexDirection:"row",alignItems:"center",gap:4}}>{i>0&&<View style={{width:1,height:15,backgroundColor:finish.line}}/>}<Pressable accessibilityRole="link" style={{flex:1,minHeight:44,justifyContent:"center"}} onPress={()=>void Linking.openURL("tel:"+phone!.replace(/[^+\d]/g,"")).catch(()=>{})}><Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7} style={lineStyle}>{phone}</Text></Pressable></View>)}</View>}

        {card.status==="ACTIVE"&&employerLink&&<Pressable accessibilityRole="link" onPress={()=>router.push({pathname:"/company",params:{id:employerLink.id}})}><Text style={[lineStyle,{textDecorationLine:"underline"}]}>Trabaja en {employerLink.name} · @{employerLink.handle} ↗</Text><Text style={{fontSize:10,color:finish.secondary}}>Vínculo laboral verificado por la empresa</Text></Pressable>}

        </View>
      </View>
      <View style={{height:theme==="light"?76:(secondarySeals.length?166:92),borderTopWidth:1,borderTopColor:finish.line,paddingTop:theme==="light"?3:(secondarySeals.length?9:5),paddingBottom:theme==="light"?0:(secondarySeals.length?17:0),justifyContent:"space-evenly"}}>
        <View style={{minHeight:62,justifyContent:"center",gap:7}}>
          <Text style={{fontSize:11,color:finish.secondary,textAlign:"center",letterSpacing:1.2}}>Idiomas</Text>
          <View style={{flexDirection:"row",flexWrap:"wrap",justifyContent:"center",gap:sealGap}}>
            {card.languages.map((language,index)=><Pressable key={language.name+index} accessibilityRole="button" accessibilityLabel={"Idioma "+language.name+", "+languageLabel(language.fluency)+". Ver detalles"} onPress={()=>setInfo(languageDetails(language.name,language.fluency))} style={{alignItems:"center",justifyContent:"center",width:sealDiameter+4,height:sealDiameter+4,paddingVertical:0,transform:[{scale:sealDiameter/44}]}}>
              <LanguageRing name={language.name} value={language.fluency} color={finish.text} track={finish.line}/>
            </Pressable>)}
          </View>
        </View>

        {secondarySeals.length>0&&theme!=="light"&&<View style={{minHeight:62,justifyContent:"center",gap:7,marginTop:4,paddingTop:7,borderTopWidth:1,borderTopColor:finish.line}}>
          <Text style={{fontSize:11,color:finish.secondary,textAlign:"center",letterSpacing:0.8}}>Otras profesiones</Text>
          <View style={{flexDirection:"row",flexWrap:"wrap",justifyContent:"center",gap:sealGap}}>
            {secondarySeals.slice(0,5).map(seal=><Pressable key={seal.id} accessibilityRole="button" accessibilityLabel={"Información del sello "+seal.profession} onPress={()=>setInfo(seal.profession+"\nEspecialidades: "+(seal.specialties?.length?seal.specialties.join(", "):"No declaradas")+"\nExperiencia registrada: "+experienceLabel(seal.months??0)+".\n"+(seal.verified?"Acreditación verificada.":"Acreditación pendiente de verificación."))} style={{width:sealDiameter+4,height:sealDiameter+4,alignItems:"center",justifyContent:"center"}}>
              <View style={{width:sealDiameter,height:sealDiameter,borderRadius:sealDiameter/2,borderWidth:2,borderColor:seal.verified?finish.sealFill:finish.line,backgroundColor:finish.pendingFill,alignItems:"center",justifyContent:"center",elevation:4,shadowColor:finish.text,shadowOpacity:0.15,shadowRadius:5}}>
                <View style={{width:sealDiameter-8,height:sealDiameter-8,borderRadius:(sealDiameter-8)/2,borderWidth:1,borderColor:finish.line,alignItems:"center",justifyContent:"center",gap:0}}>
                  <ProfessionGlyph profession={seal.profession} fallback={seal.icon} size={Math.max(12,sealDiameter*0.48)} color={finish.text}/>
                </View>
              </View>
            </Pressable>)}
          </View>
          {secondarySeals.length>5&&<Pressable accessibilityRole="button" accessibilityLabel="Ver todas las profesiones secundarias" onPress={()=>setInfo("Profesiones secundarias ("+secondarySeals.length+"):\n"+secondarySeals.map((seal,index)=>(index+1)+". "+seal.profession+"\n   Especialidades: "+(seal.specialties?.length?seal.specialties.join(", "):"No declaradas")+"\n   Experiencia: "+experienceLabel(seal.months??0)+(seal.verified?" · Acreditación verificada":" · Sin acreditación verificada")).join("\n\n"))}><Text style={{fontSize:11,color:finish.text,textAlign:"center",textDecorationLine:"underline"}}>Ver todas ({secondarySeals.length})</Text></Pressable>}
        </View>}
      </View>
    </View>
    <Modal visible={info!==null} transparent animationType="fade" onRequestClose={()=>setInfo(null)}><View style={{flex:1,backgroundColor:jcardCommon.scrim,justifyContent:"center",padding:24}}><View style={{backgroundColor:jcardCommon.qrPaper,borderRadius:20,padding:24,gap:16}}><Text style={{fontSize:18,fontWeight:"700",color:jcardCommon.qrInk}}>Información</Text><ScrollView style={{maxHeight:440}} nestedScrollEnabled contentContainerStyle={{paddingBottom:8}}><Text style={{fontSize:15,lineHeight:23,color:jcardCommon.qrInk}}>{info}</Text></ScrollView><Button title="Entendido" onPress={()=>setInfo(null)}/></View></View></Modal>
  </View>;
}

function BusinessAwardGlyph({label,icon}:{label:string;icon:React.ComponentProps<typeof Ionicons>["name"]}){
 const ink=BUSINESS_BADGE_NEUTRAL.ink;
 if(label==="Profesionalismo")return <Svg width={25} height={25} viewBox="205 275 1125 810" accessible={false}><Path d="M214,760 226,789 316,841 341,834 361,804 371,806 407,850 394,878 399,920 417,942 452,960 458,987 472,1008 500,1025 526,1028 553,1065 574,1075 608,1076 632,1109 667,1122 696,1116 724,1090 812,1111 867,1102 908,1067 956,1053 969,1039 985,1005 1017,997 1034,983 1052,945 1075,942 1099,929 1113,911 1119,890 1114,852 1173,804 1202,838 1227,839 1305,792 1321,766 1307,728 1136,427 1118,414 1093,419 1011,472 1006,501 1017,524 1013,529 979,533 839,509 745,513 665,530 630,561 568,551 523,527 531,495 525,472 442,418 413,416 388,444Z M383,766 503,555 546,579 606,594 555,679 552,709 566,733 600,740 642,731 681,708 728,660 761,650 882,718 990,792 1079,865 1085,888 1068,909 1047,909 886,815 863,810 855,824 861,839 1004,926 1014,936 1014,949 1002,966 974,970 839,895 818,890 809,899 811,917 944,995 947,1005 935,1025 903,1028 773,972 762,982 766,1000 872,1054 841,1076 802,1076 746,1060 759,1031 751,987 737,970 705,952 701,923 690,902 670,885 646,875 636,840 611,815 589,808 562,810 543,821 528,840 509,819 480,806 454,807 428,822Z M585,698 598,669 674,564 688,557 761,546 848,543 975,567 1036,559 1154,769 1108,814 1087,824 928,707 762,613 709,630 668,674 636,696 586,706Z M428,449 495,495 321,803 315,804 251,759Z M1106,451 1128,481 1286,760 1220,804 1214,803 1042,494Z M594,845 610,865 607,885 528,990 515,993 500,987 487,969 499,938 571,844Z M653,915 668,932 668,951 600,1040 578,1040 562,1021 563,1002 630,914Z M703,989 723,1007 724,1025 681,1085 661,1086 646,1074 640,1052 676,1001 690,988Z M483,842 499,862 499,876 468,920 451,923 429,903 429,883 459,843Z" fill={ink} fillRule="evenodd"/></Svg>;
 if(label==="En el mercado")return <Svg width={24} height={24} viewBox="0.5 2 23 22" accessible={false}>
  <Path d="M4 10h16v11H4V10ZM3 7h18l-1.5 4H4.5L3 7ZM7 7l-1 4M12 7v4M17 7l1 4" fill="none" stroke={ink} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
  <Path d="M8 21v-7h5v7M16 14h3v3h-3" fill="none" stroke={ink} strokeWidth="1.6" strokeLinejoin="round"/>
  <Path d="M8 4h8" fill="none" stroke={ink} strokeWidth="1.6" strokeLinecap="round"/>
 </Svg>;
 return <Ionicons name={icon} size={21} color={ink}/>;
}
function BusinessAward({label,icon,level,finish,surface,onPress}:{label:string;icon:React.ComponentProps<typeof Ionicons>["name"];level:number;finish:ReturnType<typeof jcardTokens>;surface:ReturnType<typeof businessInformationSurface>;onPress:()=>void}){
 const tone=level===3?jcardCommon.businessGold:level===2?jcardCommon.businessSilver:level===1?jcardCommon.businessBronze:BUSINESS_BADGE_NEUTRAL.border;
 const points=AWARD_POINTS;
 const path="M"+points.replaceAll(" "," L")+" Z";
 return <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={label+": "+(level===0?"Sin acreditar":level===1?"Bronce":level===2?"Plata":"Oro")} style={{flex:1,minWidth:0,alignItems:"center",minHeight:83,marginHorizontal:1,overflow:"visible"}}>
  <View style={{width:"100%",minHeight:42,aspectRatio:1,alignItems:"center",justifyContent:"center",borderRadius:28,backgroundColor:jcardFloating.awardFill,shadowColor:jcardFloating.shadow,shadowOffset:{width:0,height:3},shadowOpacity:0.23,shadowRadius:5,elevation:4}}>
   <Svg width="100%" height="100%" viewBox="0 0 54 54" style={{position:"absolute"}}><Defs><LinearGradient id={"metal-"+label.replace(/[^a-zA-Z0-9]/g,"")} x1="0%" y1="0%" x2="100%" y2="100%"><Stop offset="0%" stopColor={level===3?BUSINESS_MEDAL_COLORS[0]:level===2?BUSINESS_MEDAL_COLORS[1]:level===1?BUSINESS_MEDAL_COLORS[2]:BUSINESS_MEDAL_COLORS[3]}/><Stop offset="24%" stopColor={level===3?BUSINESS_MEDAL_COLORS[4]:level===2?BUSINESS_MEDAL_COLORS[5]:level===1?BUSINESS_MEDAL_COLORS[6]:BUSINESS_MEDAL_COLORS[7]}/><Stop offset="53%" stopColor={level===3?BUSINESS_MEDAL_COLORS[8]:level===2?BUSINESS_MEDAL_COLORS[9]:level===1?BUSINESS_MEDAL_COLORS[10]:BUSINESS_MEDAL_COLORS[11]}/><Stop offset="77%" stopColor={level===3?BUSINESS_MEDAL_COLORS[12]:level===2?BUSINESS_MEDAL_COLORS[13]:level===1?BUSINESS_MEDAL_COLORS[14]:BUSINESS_MEDAL_COLORS[15]}/><Stop offset="100%" stopColor={level===3?BUSINESS_MEDAL_COLORS[16]:level===2?BUSINESS_MEDAL_COLORS[17]:level===1?BUSINESS_MEDAL_COLORS[18]:BUSINESS_MEDAL_COLORS[19]}/></LinearGradient></Defs><Path d={path} fill={"url(#metal-"+label.replace(/[^a-zA-Z0-9]/g,"")+")"} stroke={tone} strokeWidth="1.4"/><Circle cx="27" cy="27" r="21" fill="none" stroke={BUSINESS_MEDAL_COLORS[1]} strokeOpacity="0.65" strokeWidth="1.3"/><Circle cx="27" cy="27" r="19.2" fill={BUSINESS_BADGE_NEUTRAL.face} stroke={tone} strokeWidth="1.4"/><Path d="M 12 26 A 15 15 0 0 1 41 23" fill="none" stroke={BUSINESS_MEDAL_COLORS[1]} strokeOpacity="0.45" strokeWidth="2"/></Svg>
   <BusinessAwardGlyph label={label} icon={icon}/>
  </View>
  <Text numberOfLines={1} style={{fontSize:10,color:level===0?surface.pending:tone,letterSpacing:-1}}>{level===0?"☆☆☆":"★".repeat(level)+"☆".repeat(3-level)}</Text>
 </Pressable>;
}
export function BusinessFace({card,theme,appearance="original",contact,onQr,onShare,canEditMedia=false,onEditMedia,visibility=DEFAULT_JCARD_VISIBILITY}:{card:CardData;theme:ThemeName;appearance?:JCardPremiumBackgroundId;contact?:{email:string|null;phone:string|null};onQr?:()=>void;onShare?:()=>void;canEditMedia?:boolean;onEditMedia?:(slot:"banner"|"avatar")=>void;visibility?:typeof DEFAULT_JCARD_VISIBILITY}){
 const b=card.business;const jobeen=jobeenTokens(theme);const premium=appearance==="original"?null:getPremiumBackground(appearance);const showDecorativeCurves=false;const finish={...jcardTokens(theme,jcardTier(b?.rating??null,b?.reviewCount??0)),start:premium?.base??jobeen.biz,end:premium?.base??jobeen.biz,text:premium?.ink??jobeen.ink,secondary:premium?.ink??jobeen.textSoft,line:premium?.line??jobeen.bizBorder,sealFill:jobeen.surface};
 const [selectedAward,setSelectedAward]=useState<{label:string;level:number}|null>(null);
 const [artSize,setArtSize]=useState({width:0,height:0});
 const surface=businessInformationSurface(finish.start);
 const company=!!b?.name.trim();const businessName=(company?b!.name:card.name).trim().slice(0,30);const [businessNameWidth,setBusinessNameWidth]=useState(180);const nameFontSize=Math.max(14,Math.min(21,Math.floor(businessNameWidth/Math.max(8,businessName.length)*1.65)));const rating=displayedRating(b?.rating??null,b?.reviewCount??0);
 const reviewCount=b?.reviewCount??0;const ratingUnlocked=reviewCount>=10&&rating!==null;const year=Number(b?.opened);const years=Number.isInteger(year)&&year>1900&&year<=new Date().getFullYear()?new Date().getFullYear()-year:0;
 const category=b?.category?.trim()||(/hvac|aire acondicionado|climatiz|refrigeraci/i.test([card.role,...(b?.services??[])].join(" "))?"Climatización":b?.services?.[0]||"Servicios profesionales");
 const art=businessCategoryArt(category);
 const hvacCategory=/hvac|climatiz|aire acondicionado/i.test(category)&&!/refrigeraci/i.test(category);
 const refrigerationCategory=/refrigeraci/i.test(category)&&!/climatiz/i.test(category);
 const categoryIcon=hvacCategory?categoryGlyph("climate"):refrigerationCategory?categoryGlyph("refrigeration"):art.icon;
 const businessContactInk=premium?finish.text:jobeen.ink;
 const businessIconInk=premium?finish.text:jobeen.ink;
 const voteLevel=(key:"service"|"prices"|"punctuality"|"professionalism"|"tenure")=>{const total=b?.excellenceReviewCount??0;const percent=total>0?100*(b?.excellenceVotes?.[key]??0)/total:0;return (b?.reviewCount??0)<20||!(b?.excellenceVotes?.[key]??0)?0:percent>63?3:percent>33?2:1;};
 const awards=[
  {label:"Atención al cliente",icon:"headset-outline" as const,level:voteLevel("service")},
  {label:"Precios competitivos",icon:"cash-outline" as const,level:voteLevel("prices")},
  {label:"Puntualidad",icon:"calendar-outline" as const,level:voteLevel("punctuality")},
  {label:"Profesionalismo",icon:"people-outline" as const,level:voteLevel("professionalism")},
  {label:"En el mercado",icon:"storefront-outline" as const,level:voteLevel("tenure")},
 ];
 return <View onLayout={e=>{const {width,height}=e.nativeEvent.layout;setArtSize(prev=>prev.width===width&&prev.height===height?prev:{width,height});}} style={{flex:1,borderRadius:30,backgroundColor:finish.start,overflow:"hidden"}}>
  <Svg style={StyleSheet.absoluteFill} width="100%" height="100%" viewBox="0 0 400 650" preserveAspectRatio="none" pointerEvents="none">
   {showDecorativeCurves&&JCARD_LEFT_CURVES.map(({d,index:i})=><Path key={"left"+i} d={d} stroke={finish.text} strokeOpacity={0.12+(i%3)*0.018} strokeWidth={0.8} fill="none"/>)}
   {showDecorativeCurves&&JCARD_BOTTOM_CURVES.map(({d,index:i})=><Path key={"bottom"+i} d={d} stroke={finish.text} strokeOpacity={0.13+(i%4)*0.018} strokeWidth={0.8} fill="none"/>)}
   {showDecorativeCurves&&<Path d="M-20 420 C105 250 225 300 420 95" stroke={finish.text} strokeOpacity={0.12} strokeWidth="2" fill="none"/>}
  </Svg>

  {premium&&artSize.width>0&&<View pointerEvents="none" style={StyleSheet.absoluteFill}><JCardPremiumTexture id={appearance} width={artSize.width} height={artSize.height}/></View>}
  <View style={{flex:1,paddingHorizontal:0,paddingTop:0,paddingBottom:0,gap:0}}>
   <View style={{flex:1,marginTop:0,borderTopLeftRadius:26,borderTopRightRadius:26,backgroundColor:finish.start,overflow:"hidden",paddingHorizontal:14,paddingTop:theme==="light"?10:18,paddingBottom:theme==="light"?6:10,gap:theme==="light"?3:5,zIndex:2}}>
   {premium&&artSize.width>0&&<View pointerEvents="none" style={StyleSheet.absoluteFill}><JCardPremiumTexture id={appearance} width={artSize.width} height={artSize.height}/></View>}
   {theme==="light"&&<View style={{flexDirection:"row",alignItems:"center",gap:6,marginBottom:3}}><Svg width={16} height={16} viewBox="0 0 22 22" accessible={false}><Path d="M11 1.5 19.2 6.2v9.6L11 20.5 2.8 15.8V6.2Z" fill={jobeen.hexFront} stroke={jobeen.ink} strokeWidth={1.5}/></Svg><Text style={{fontSize:11,fontWeight:"800",letterSpacing:2,color:jobeen.ink}}>JCARD · NEGOCIOS</Text></View>}
   <View style={{flexDirection:"row",alignItems:"flex-start",gap:6,marginTop:-2}}>
    <View style={{flex:1,minWidth:0}} onLayout={e=>{const w=Math.floor(e.nativeEvent.layout.width)-22;if(w>0&&Math.abs(w-businessNameWidth)>2)setBusinessNameWidth(w);}}>
     <View style={{flexDirection:"row",alignItems:"center",justifyContent:"flex-start",gap:3}}>
      <Text numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.9} style={{flexShrink:1,fontSize:nameFontSize,lineHeight:nameFontSize*1.2,fontWeight:"700",color:premium?finish.text:theme==="light"?jobeen.ink:businessCardAccents.name}}>{businessName}</Text>
      <Ionicons name={b?.licenseVerified?"checkmark-circle":"checkmark-circle-outline"} size={16} color={b?.licenseVerified?jcardCommon.verifiedBubble :jcardCommon.unverifiedBubble} accessibilityLabel={b?.licenseVerified?"Empresa verificada":"Empresa sin verificar"}/>
     </View>
     <View style={{flexDirection:"row",alignItems:"center",gap:6,marginTop:5}}>{hvacCategory?<View style={{width:20,height:20,alignItems:"center",justifyContent:"center"}}><Ionicons name="snow-outline" size={20} color={businessIconInk}/><Ionicons name="aperture-outline" size={11} color={businessIconInk} style={{position:"absolute"}}/></View>:<Ionicons name={categoryIcon} size={18} color={businessIconInk}/>}<Text numberOfLines={2} style={{flex:1,fontSize:13,fontWeight:"600",color:premium?finish.text:theme==="light"?jobeen.textSoft:businessCardAccents.category}}>{company?category:card.role}</Text></View>
    </View>
    <View style={{alignItems:"center",gap:3,width:"33%",marginRight:-4,marginTop:-3}}>
     <View style={{borderRadius:22,borderWidth:1,borderColor:jcardReviewGlass.border,paddingVertical:5,paddingHorizontal:7,backgroundColor:jcardReviewGlass.fill,alignItems:"center",justifyContent:"center",overflow:"visible",shadowColor:jcardReviewGlass.shadow,shadowOffset:{width:0,height:5},shadowOpacity:0.25,shadowRadius:9,elevation:5}}>
      <Svg pointerEvents="none" width="100%" height="100%" style={StyleSheet.absoluteFill} preserveAspectRatio="none">
       <Defs><LinearGradient id="businessReviewGlass" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor={jcardReviewGlass.highlight} stopOpacity={0.88}/>
        <Stop offset="23%" stopColor={jcardReviewGlass.highlight} stopOpacity={0.4}/>
        <Stop offset="53%" stopColor={jcardReviewGlass.mid} stopOpacity={0.15}/>
        <Stop offset="82%" stopColor={jcardReviewGlass.shade} stopOpacity={0.27}/>
        <Stop offset="100%" stopColor={jcardReviewGlass.highlight} stopOpacity={0.52}/>
       </LinearGradient></Defs>
       <Rect width="100%" height="100%" rx={22} fill="url(#businessReviewGlass)"/>
       <Path d="M 8 5 Q 55 0 110 5" fill="none" stroke={jcardReviewGlass.highlight} strokeOpacity={0.55} strokeWidth="1.5"/>
      </Svg>
      <Text numberOfLines={1} adjustsFontSizeToFit style={{color:jcardReviewGlass.ink,fontSize:12,fontWeight:"700",textShadowColor:jcardReviewGlass.textHighlight,textShadowOffset:{width:0,height:1},textShadowRadius:1}}>{ratingUnlocked?rating!.toFixed(1):"0.0"} <Text style={{color:ratingUnlocked?jcardCommon.businessGold:jcardReviewGlass.pending}}>{ratingUnlocked?"★★★★★":"☆☆☆☆☆"}</Text></Text>
     </View>
     <Text style={{color:finish.secondary,fontSize:10,textAlign:"center"}}>({reviewCount} {reviewCount===1?"reseña":"reseñas"})</Text>
     {!!b?.opened&&<View style={{flexDirection:"row",alignItems:"center",gap:4}}><Ionicons name="calendar-outline" size={13} color={finish.secondary}/><Text style={{color:finish.secondary,fontSize:10}}>Desde {b.opened}</Text></View>}
    </View>
   </View>
   {!!b?.services?.length&&<View style={{alignSelf:"stretch",paddingHorizontal:8,marginTop:4}}><Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.85} style={{fontSize:13,color:finish.secondary}}>{b.services.filter(Boolean).join(" · ")}</Text></View>}
   <View style={{flex:1,justifyContent:"space-evenly",paddingVertical:7,minHeight:0,alignSelf:"stretch"}}>\n    <View style={{gap:5,alignSelf:"stretch"}}>
     {(visibility.business_show_email?[b?.email,b?.emailSecondary]:[]).filter(Boolean).map((email,i)=><Pressable key={"business-email"+i} accessibilityRole="link" accessibilityLabel={"Enviar correo a "+email} onPress={()=>void Linking.openURL("mailto:"+encodeURIComponent(email!)).catch(()=>{})} style={{flexDirection:"row",alignItems:"center",gap:6,alignSelf:"stretch",minHeight:44}}><Ionicons name="mail-outline" size={14} color={businessIconInk}/><Text numberOfLines={1} ellipsizeMode="tail" style={{flex:1,fontSize:11,color:businessContactInk}}>{email}</Text></Pressable>)}
     {visibility.business_show_phone&&!!(b?.phone||b?.phoneSecondary)&&<View style={{flexDirection:"row",alignItems:"center",gap:4,alignSelf:"stretch",minHeight:44}}><Ionicons name="call-outline" size={14} color={businessIconInk}/>{[{number:b?.phone,label:b?.phoneLabel},{number:b?.phoneSecondary,label:b?.phoneSecondaryLabel}].filter(x=>!!x.number).map((item,i)=><View key={"business-phone"+i} style={{flex:1,minWidth:0,flexDirection:"row",alignItems:"center",gap:3}}>{i>0&&<View style={{height:16,width:1,backgroundColor:finish.line,marginHorizontal:2}}/>}<Pressable accessibilityRole="link" style={{flex:1}} onPress={()=>void Linking.openURL("tel:"+item.number!.replace(/[^+\d]/g,"")).catch(()=>{})}><Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.65} style={{fontSize:11,color:businessContactInk}}>{item.label?item.label+" ":""}{item.number}</Text></Pressable></View>)}</View>}
     {!!b?.location&&<View style={{flexDirection:"row",alignItems:"center",gap:6}}><Ionicons name="location-outline" size={15} color={businessIconInk}/><Text numberOfLines={2} style={{flex:1,fontSize:11,color:businessContactInk}}>{b.location}</Text></View>}
   </View>
   </View>
   <View style={{height:1,backgroundColor:finish.line,opacity:0.7,marginBottom:4}}/>
   <View style={{flexDirection:"row",alignItems:"center",gap:3,minHeight:theme==="light"?82:110}}>
    <View style={{flex:1,minWidth:0,flexDirection:"row",alignItems:"flex-start",gap:1}}>
     {awards.map(a=><BusinessAward key={a.label} {...a} finish={finish} surface={surface} onPress={()=>setSelectedAward({label:a.label,level:a.level})}/>)}
    </View>
    <View style={{width:1,height:85,backgroundColor:finish.line,marginHorizontal:1}}/>
    <View style={{position:"relative",alignSelf:"center"}}>
     {onShare&&<Pressable accessibilityRole="button" accessibilityLabel="Compartir JCard de negocio" onPress={event=>{event.stopPropagation();onShare();}} style={{position:"absolute",right:2,top:-30,width:28,height:28,alignItems:"center",justifyContent:"center",zIndex:2}}><Ionicons name="share-social-outline" size={18} color={businessContactInk}/></Pressable>}
    <Pressable accessibilityRole="button" accessibilityLabel="Ampliar código QR del negocio" onPress={()=>onQr?.()} style={{padding:3,borderRadius:7,backgroundColor:jcardCommon.qrPaper,borderWidth:1,borderColor:jobeen.qrBorder,alignSelf:"center",flexShrink:0}}>
     <JCardQr value={card.profileUrl} size={theme==="light"?64:46}/>
    </Pressable>
    {theme==="light"&&<Text numberOfLines={1} style={{fontSize:9,fontWeight:"600",color:jobeen.textSoft,textAlign:"center",marginTop:3}}>Guardar contacto</Text>}
    </View>
   </View>
  </View>
  </View>
 <Modal visible={selectedAward!==null} transparent animationType="fade" onRequestClose={()=>setSelectedAward(null)}><View style={{flex:1,justifyContent:"center",padding:24,backgroundColor:jcardFloating.modalBackdrop}}><Pressable style={StyleSheet.absoluteFill} onPress={()=>setSelectedAward(null)} accessibilityLabel="Cerrar información"/><View style={{backgroundColor:finish.start,borderRadius:20,padding:22,borderWidth:1,borderColor:finish.line}}><View style={{flexDirection:"row",justifyContent:"space-between",alignItems:"center"}}><Text style={{fontSize:19,fontWeight:"800",color:finish.text,flex:1}}>{selectedAward?.label}</Text><Pressable onPress={()=>setSelectedAward(null)} accessibilityRole="button" accessibilityLabel="Cerrar"><Ionicons name="close-circle-outline" size={27} color={finish.text}/></Pressable></View><Text style={{fontSize:15,fontWeight:"700",color:finish.text,marginTop:12}}>{selectedAward?.level===3?"Oro":selectedAward?.level===2?"Plata":selectedAward?.level===1?"Bronce":"Sin color"}</Text><Text style={{fontSize:14,lineHeight:21,color:finish.secondary,marginTop:8}}>{selectedAward?.level===0?"Este negocio aún no reúne suficientes reseñas para obtener un sello de color. No significa que su servicio sea malo.":selectedAward?.level===1?"Bronce: los clientes han reconocido esta cualidad en sus reseñas.":selectedAward?.level===2?"Plata: una proporción importante de las reseñas reconoce esta cualidad.":"Oro: una proporción destacada de las reseñas reconoce esta cualidad."}</Text><Text style={{fontSize:12,lineHeight:18,color:finish.secondary,marginTop:12}}>Los sellos se calculan a partir de reseñas de usuarios y no son certificaciones profesionales de Jobeen.</Text></View></View></Modal>
 </View>;
}
export function JobinCard({card,previewTheme,onEditBusiness,onEditBusinessMedia,onEditPersonalPhoto,ownerId,showOwnerActions=false,initialSide="personal",employerLink}:{card:CardData;previewTheme?:ThemeName;onEditBusiness?:()=>void;onEditBusinessMedia?:(slot:"banner"|"avatar")=>void;onEditPersonalPhoto?:()=>void;ownerId?:string;showOwnerActions?:boolean;initialSide?:"personal"|"business";employerLink?:{id:string;name:string;handle:string}|null}){
 const {theme}=useTheme();const {colors}=useUi();const {width}=useWindowDimensions();
 const [contact,setContact]=useState<{email:string|null;phone:string|null;details?:PersonalContactDetails}>({email:null,phone:null});
 useEffect(()=>{if(!ownerId){setContact({email:null,phone:null});return;}let live=true;void Promise.all([loadPublicContact(ownerId),loadVisiblePersonalContactDetails(ownerId)]).then(([value,details])=>{if(live)setContact({...value,details});}).catch(()=>{if(live)setContact({email:null,phone:null});});return()=>{live=false;};},[ownerId]);
 const [appearance,setAppearance]=useState<JCardPremiumBackgroundId>("original");
 const [businessAppearance,setBusinessAppearance]=useState<JCardPremiumBackgroundId>("original");
 useFocusEffect(useCallback(()=>{let live=true;if(ownerId)void Promise.all([readJCardAppearance(ownerId),readJCardAppearance(ownerId,"business")]).then(([personal,business])=>{if(live){setAppearance(personal);setBusinessAppearance(business);}}).catch(()=>{});return()=>{live=false;};},[ownerId]));
 const [visibility,setVisibility]=useState(DEFAULT_JCARD_VISIBILITY);
 useFocusEffect(useCallback(()=>{let live=true;if(ownerId)void readJCardVisibility(ownerId).then(v=>{if(live)setVisibility(v);}).catch(()=>{});return()=>{live=false;};},[ownerId]));
 const [back,setBack]=useState(initialSide==="business"),[qrOpen,setQrOpen]=useState(false);
 const canFlip=showOwnerActions||(visibility.personal_enabled&&visibility.business_enabled);
 const activeBusiness=!visibility.personal_enabled&&visibility.business_enabled;
 const cardHeight = (previewTheme??theme)==="light"?364:450;
 const rotation=useRef(new Animated.Value(initialSide==="business"?180:0)).current;
 const angle=useRef(initialSide==="business"?180:0);
 useEffect(()=>{if(!canFlip){setBack(activeBusiness);angle.current=activeBusiness?180:0;rotation.stopAnimation();rotation.setValue(angle.current);}},[canFlip,activeBusiness,rotation]);
 const rotate=(direction:number)=>{if(!canFlip)return;const next=angle.current+direction*180;angle.current=next;setBack(v=>!v);rotation.stopAnimation();Animated.timing(rotation,{toValue:next,useNativeDriver:true,duration:420}).start(({finished})=>{if(finished&&Math.abs(angle.current)>=1800){angle.current=angle.current%360;rotation.setValue(angle.current);}});};
 const toggle=()=>rotate(1);
 const responder=useRef(PanResponder.create({onMoveShouldSetPanResponder:(_,g)=>Math.abs(g.dx)>28&&Math.abs(g.dx)>Math.abs(g.dy)*1.5,onPanResponderRelease:(_,g)=>{if(Math.abs(g.dx)>65)toggleRef.current(g.dx<0?1:-1);}})).current;
 const toggleRef=useRef(rotate);toggleRef.current=rotate;
 const frontRotate=rotation.interpolate({inputRange:[-3600,3600],outputRange:["-3600deg","3600deg"],extrapolate:"extend"});
 const backRotate=rotation.interpolate({inputRange:[-3600,3600],outputRange:["-3420deg","3780deg"],extrapolate:"extend"});
 const cardTheme=previewTheme??theme;
 const cardColors=jobeenTokens(cardTheme);
 const share=async (side:"personal"|"business")=>{
  const label=side==="business"?(card.business?.name?.trim()||card.name):card.name;
  const separator=card.profileUrl.includes("?")?"&":"?";
  const link=card.profileUrl+separator+"card="+side;
  try {await Share.share({message:`JCard ${side==="business"?"de negocio":"personal"} de ${label}: ${link}`,title:`JCard ${side==="business"?"de negocio":"personal"} · ${label}`});} catch(error){console.warn("No se pudo abrir el menú para compartir la JCard",error);}
 };
 return <>
  <View style={{width:"100%",maxWidth:520,alignSelf:"center"}}>
   <View style={{borderRadius:30,backgroundColor:jcardCommon.cardShadowSurface,shadowColor:jcardCommon.cardShadowColor,shadowOffset:{width:0,height:7},shadowOpacity:0.27,shadowRadius:16,elevation:9}} {...(canFlip?responder.panHandlers:{})}>
   <Animated.View pointerEvents={back?"none":"auto"} style={{height:cardHeight,backfaceVisibility:"hidden",transform:[{perspective:1000},{rotateY:frontRotate}]}}>
    {(showOwnerActions||visibility.personal_enabled)&&<CardFace card={card} theme={cardTheme} appearance={appearance} contact={contact} employerLink={employerLink} onEdit={()=>router.push("/professional")} onEditPhoto={showOwnerActions?onEditPersonalPhoto:undefined} onQr={()=>setQrOpen(true)} onShare={!showOwnerActions?()=>void share("personal"):undefined}/>}
   </Animated.View>
   <Animated.View pointerEvents={back?"auto":"none"} style={{position:"absolute",top:0,left:0,right:0,backfaceVisibility:"hidden",transform:[{perspective:1000},{rotateY:backRotate}]}}>
    <View style={{height:cardHeight}}>{(showOwnerActions||visibility.business_enabled)&&<BusinessFace card={card} theme={cardTheme} appearance={businessAppearance} contact={contact} onQr={()=>setQrOpen(true)} onShare={!showOwnerActions?()=>void share("business"):undefined} canEditMedia={showOwnerActions&&!!onEditBusinessMedia} onEditMedia={onEditBusinessMedia} visibility={visibility}/>}</View>
   </Animated.View>

   </View>
   {canFlip&&<Pressable accessibilityRole="button" accessibilityLabel={back?"Volver a la JCard personal":"Ver datos de negocios"} accessibilityHint="Toca o desliza horizontalmente la tarjeta para girarla" onPress={toggle} style={{alignSelf:"center",minHeight:44,flexDirection:"row",alignItems:"center",justifyContent:"center",gap:7,paddingHorizontal:12}}>
    <Ionicons name="sync-outline" size={17} color={cardColors.ink2}/>
    <Text style={{fontSize:12,color:cardColors.ink2}}>{back?"Toca la tarjeta para ver los datos personales":"Toca la tarjeta para ver los datos de negocios"}</Text>
   </Pressable>}
   {showOwnerActions&&<View style={{flexDirection:"row",gap:10,paddingTop:10}}>
    <Pressable accessibilityRole="button" accessibilityLabel={back?"Compartir JCard de negocio":"Compartir JCard personal"} onPress={()=>void share(back?"business":"personal")} style={{flex:1,flexDirection:"row",alignItems:"center",justifyContent:"center",gap:9,paddingVertical:13,borderRadius:12,backgroundColor:cardColors.ink}}>
      <Ionicons name="share-social-outline" size={20} color={cardColors.surface}/><Text style={{color:cardColors.surface,fontWeight:"700"}}>Compartir</Text>
    </Pressable>
    <Pressable accessibilityRole="button" accessibilityLabel="Editar JCard" onPress={()=>back?onEditBusiness?.():router.push("/professional")} style={{flex:1,flexDirection:"row",alignItems:"center",justifyContent:"center",gap:9,paddingVertical:13,borderRadius:12,borderWidth:1,borderColor:cardColors.yellow,backgroundColor:cardColors.cream}}>
      <Ionicons name="create-outline" size={20} color={cardColors.ink}/><Text style={{color:cardColors.ink,fontWeight:"700"}}>Editar JCard</Text>
    </Pressable>
   </View>}
  </View>
  <Modal visible={qrOpen} transparent animationType="fade" onRequestClose={()=>setQrOpen(false)}>
   <SafeAreaView style={{flex:1,backgroundColor:jcardCommon.scrim,justifyContent:"center",alignItems:"center",padding:16}}>
    <Pressable accessibilityRole="button" accessibilityLabel="Cerrar QR" onPress={()=>setQrOpen(false)} style={StyleSheet.absoluteFill}/>
    <View style={{padding:12,backgroundColor:jcardCommon.qrPaper,borderRadius:14,maxWidth:"100%"}}><JCardQr value={card.profileUrl} size={Math.min(width-56,480)}/></View>
    <Pressable accessibilityRole="button" accessibilityLabel="Cerrar QR ampliado" onPress={()=>setQrOpen(false)} style={{padding:16}}><Ionicons name="close-circle" size={32} color={jcardCommon.qrPaper}/></Pressable>
   </SafeAreaView>
  </Modal>
 </>;
}

