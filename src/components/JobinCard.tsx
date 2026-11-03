import {BUSINESS_MEDAL_COLORS} from "../theme/business-medals";
import { useEffect, useId, useRef, useState } from "react";
import { router } from "expo-router";
import { Animated, Image, Linking, Modal, PanResponder, Pressable, Share, ScrollView, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import Svg, { Defs, LinearGradient, Rect, Stop, Path, Circle, SvgXml } from "react-native-svg";
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
import { businessCardPaper, jcardCommon, jcardLayout, jcardTokens } from "../theme/jcard";
import {businessCategoryArt} from "../lib/business-category-art";

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
  const finish = {...jcardTokens(theme, jcardTier(card.rating, card.reviewCount)),start:businessCardPaper.background,end:businessCardPaper.background,text:businessCardPaper.ink,secondary:businessCardPaper.secondary,line:businessCardPaper.border,sealFill:businessCardPaper.muted,pendingFill:businessCardPaper.muted};
  const rating = displayedRating(card.rating, card.reviewCount);
  const embossInk=finish.text;
  const embossStrength=finish.start===finish.end?0.20:0.12;
  const [info,setInfo]=useState<string|null>(null);
  const primaryProfession=card.role.trim().replace(/^Técnico HVAC\s*\/\s*climatización y aire acondicionado$/i,"Técnico HVAC").replace(/\s*[-–/]\s*aire acondicionado\s*$/i,"").trim();
  const primarySeal=card.seals.find(seal=>/hvac/i.test(primaryProfession)?/hvac|aire acondicionado/i.test(seal.profession):seal.profession.trim().toLocaleLowerCase()===primaryProfession.toLocaleLowerCase());
  const secondarySeals=card.seals.filter(seal=>!(/hvac/i.test(primaryProfession)&&/hvac|aire acondicionado/i.test(seal.profession))&&seal.profession.trim().toLocaleLowerCase()!==primaryProfession.toLocaleLowerCase());
  const sealCount = Math.max(card.languages.length, secondarySeals.length);
  const sealColumns = sealCount > 8 ? 4 : sealCount > 4 ? 3 : 2;
  const sealDiameter = sealCount > 12 ? 24 : sealCount > 8 ? 29 : sealCount > 4 ? 35 : 44;
  const sealGap = sealCount > 8 ? 2 : 5;
  const bodySize = Math.max(12, fs(expanded ? 14 : 13));
  const lineStyle = { color:finish.text, fontSize:bodySize, lineHeight:bodySize * 1.5 };
  return <View style={[s.panel, { flex:1, padding:0, gap:0, borderRadius:jcardLayout.radius, borderColor:finish.line, backgroundColor:finish.start, overflow:"hidden" }]}>
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
    <View style={{ padding:jcardLayout.padding, gap:10, flex:1, justifyContent:"space-between" }}>
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
          <Pressable accessibilityRole="button" accessibilityLabel="Información sobre disponibilidad" onPress={()=>setInfo(card.status==="ACTIVE"?"Trabajando actualmente\nLa persona indica que tiene un trabajo activo. Esto no significa que Jobin haya confirmado su relación laboral.":"Disponible para trabajar\nLa persona indica que está abierta a nuevas oportunidades laborales o solicitudes de clientes.")}><Text style={{color:finish.text,fontWeight:"700",fontSize:10,letterSpacing:0.7,textDecorationLine:"underline"}}>{card.status==="ACTIVE"?"TRABAJANDO":"DISPONIBLE"} ⓘ</Text></Pressable>
        </View>
        {!!contact?.email&&<Pressable accessibilityRole="link" accessibilityLabel={"Enviar correo a "+contact.email} onPress={()=>void Linking.openURL("mailto:"+encodeURIComponent(contact.email!)).catch(()=>setInfo("No se encontró una aplicación de correo disponible."))} onLongPress={()=>void Share.share({message:contact.email!})}><Text selectable style={[lineStyle,{textDecorationLine:"underline"}]}>{contact.email}</Text></Pressable>}
        {!!contact?.phone&&<Text selectable style={lineStyle}>{contact.phone}</Text>}

        {card.status==="ACTIVE"&&employerLink&&<Pressable accessibilityRole="link" onPress={()=>router.push({pathname:"/company",params:{id:employerLink.id}})}><Text style={[lineStyle,{textDecorationLine:"underline"}]}>Trabaja en {employerLink.name} · @{employerLink.handle} ↗</Text><Text style={{fontSize:10,color:finish.secondary}}>Vínculo laboral verificado por la empresa</Text></Pressable>}

      </View>
      <View style={{flexDirection:"row",borderTopWidth:1,borderTopColor:finish.line,paddingTop:8,minHeight:96}}>
        <View style={{flex:1,paddingRight:7,gap:10}}>
          <Text style={{fontSize:10,color:finish.secondary,textAlign:"center",letterSpacing:1.2}}>Idiomas</Text>
          <View style={{flexDirection:"row",flexWrap:"wrap",justifyContent:"center",gap:sealGap}}>
            {card.languages.map((language,index)=><Pressable key={language.name+index} accessibilityRole="button" accessibilityLabel={"Idioma "+language.name+", "+languageLabel(language.fluency)+". Ver detalles"} onPress={()=>setInfo(languageDetails(language.name,language.fluency))} style={{alignItems:"center",justifyContent:"center",width:`${100/sealColumns-3}%`,paddingVertical:1,transform:[{scale:sealDiameter/44}]}}>
              <LanguageRing name={language.name} value={language.fluency} color={finish.text} track={finish.line}/>
            </Pressable>)}
          </View>
        </View>
        <View style={{width:1,backgroundColor:finish.line,opacity:0.65,alignSelf:"stretch"}}/>
        <View style={{flex:1,paddingLeft:7,gap:10}}>
          <Text style={{fontSize:10,color:finish.secondary,textAlign:"center",letterSpacing:0.8}}>Otras profesiones</Text>
          <View style={{flexDirection:"row",flexWrap:"wrap",justifyContent:"center",gap:sealGap}}>
            {secondarySeals.map(seal=><Pressable key={seal.id} accessibilityRole="button" accessibilityLabel={"Información del sello "+seal.profession} onPress={()=>setInfo(seal.profession+"\nEspecialidades: "+(seal.specialties?.length?seal.specialties.join(", "):"No declaradas")+"\nExperiencia registrada: "+experienceLabel(seal.months??0)+".\n"+(seal.verified?"Acreditación verificada.":"Acreditación pendiente de verificación."))} style={{width:`${100/sealColumns-3}%`,height:sealDiameter+4,alignItems:"center",justifyContent:"center"}}>
              <View style={{width:sealDiameter,height:sealDiameter,borderRadius:sealDiameter/2,borderWidth:2,borderColor:seal.verified?finish.sealFill:finish.line,backgroundColor:finish.pendingFill,alignItems:"center",justifyContent:"center",elevation:4,shadowColor:finish.text,shadowOpacity:0.15,shadowRadius:5}}>
                <View style={{width:sealDiameter-8,height:sealDiameter-8,borderRadius:(sealDiameter-8)/2,borderWidth:1,borderColor:finish.line,alignItems:"center",justifyContent:"center",gap:0}}>
                  <ProfessionGlyph profession={seal.profession} fallback={seal.icon} size={Math.max(12,sealDiameter*0.48)} color={finish.text}/>
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

function BusinessAward({label,icon,level,finish}:{label:string;icon:React.ComponentProps<typeof Ionicons>["name"];level:number;finish:ReturnType<typeof jcardTokens>}){
 const tone=level===3?jcardCommon.businessGold:level===2?jcardCommon.businessSilver:level===1?jcardCommon.businessBronze:finish.secondary;
 const points=Array.from({length:48},(_,i)=>{const t=i*Math.PI/24-Math.PI/2;const radius=i%2?23:25;return (27+radius*Math.cos(t)).toFixed(2)+","+(27+radius*Math.sin(t)).toFixed(2);}).join(" ");
 const path="M"+points.replaceAll(" "," L")+" Z";
 return <View accessibilityLabel={label+": "+(level===0?"Sin acreditar":level===1?"Bronce":level===2?"Plata":"Oro")} style={{flex:1,minWidth:0,alignItems:"center",minHeight:83,marginHorizontal:1}}>
  <View style={{width:"100%",minHeight:45,aspectRatio:1,alignItems:"center",justifyContent:"center"}}>
   <Svg width="100%" height="100%" viewBox="0 0 54 54" style={{position:"absolute"}}><Defs><LinearGradient id={"metal-"+label.replace(/[^a-zA-Z0-9]/g,"")} x1="0%" y1="0%" x2="100%" y2="100%"><Stop offset="0%" stopColor={level===3?BUSINESS_MEDAL_COLORS[0]:level===2?BUSINESS_MEDAL_COLORS[1]:level===1?BUSINESS_MEDAL_COLORS[2]:BUSINESS_MEDAL_COLORS[3]}/><Stop offset="24%" stopColor={level===3?BUSINESS_MEDAL_COLORS[4]:level===2?BUSINESS_MEDAL_COLORS[5]:level===1?BUSINESS_MEDAL_COLORS[6]:BUSINESS_MEDAL_COLORS[7]}/><Stop offset="53%" stopColor={level===3?BUSINESS_MEDAL_COLORS[8]:level===2?BUSINESS_MEDAL_COLORS[9]:level===1?BUSINESS_MEDAL_COLORS[10]:BUSINESS_MEDAL_COLORS[11]}/><Stop offset="77%" stopColor={level===3?BUSINESS_MEDAL_COLORS[12]:level===2?BUSINESS_MEDAL_COLORS[13]:level===1?BUSINESS_MEDAL_COLORS[14]:BUSINESS_MEDAL_COLORS[15]}/><Stop offset="100%" stopColor={level===3?BUSINESS_MEDAL_COLORS[16]:level===2?BUSINESS_MEDAL_COLORS[17]:level===1?BUSINESS_MEDAL_COLORS[18]:BUSINESS_MEDAL_COLORS[19]}/></LinearGradient></Defs><Path d={path} fill={"url(#metal-"+label.replace(/[^a-zA-Z0-9]/g,"")+")"} stroke={tone} strokeWidth="1.4"/><Circle cx="27" cy="27" r="21" fill="none" stroke={BUSINESS_MEDAL_COLORS[1]} strokeOpacity="0.65" strokeWidth="1.3"/><Circle cx="27" cy="27" r="19.2" fill={finish.start} stroke={tone} strokeWidth="1.4"/><Path d="M 12 26 A 15 15 0 0 1 41 23" fill="none" stroke={BUSINESS_MEDAL_COLORS[1]} strokeOpacity="0.45" strokeWidth="2"/></Svg>
   <Ionicons name={icon} size={21} color={finish.text}/>
  </View>
  <View style={{marginTop:-3,width:"108%",minHeight:20,borderRadius:7,borderWidth:0.6,borderColor:finish.line,backgroundColor:finish.sealFill,justifyContent:"center",paddingHorizontal:1,elevation:1}}>
   <Text adjustsFontSizeToFit minimumFontScale={0.65} numberOfLines={2} style={{fontSize:6.3,fontWeight:"800",lineHeight:7.3,textAlign:"center",color:finish.text}}>{label.toUpperCase()}</Text>
  </View>
  <Text numberOfLines={1} style={{fontSize:10,color:tone,letterSpacing:-1}}>{level===0?"☆☆☆":"★".repeat(level)+"☆".repeat(3-level)}</Text>
 </View>;
}
function BusinessFace({card,theme,contact,onQr,canEditMedia=false,onEditMedia}:{card:CardData;theme:ThemeName;contact?:{email:string|null;phone:string|null};onQr?:()=>void;canEditMedia?:boolean;onEditMedia?:(slot:"banner"|"avatar")=>void}){
 const b=card.business;const finish={...jcardTokens(theme,jcardTier(b?.rating??null,b?.reviewCount??0)),start:businessCardPaper.background,end:businessCardPaper.background,text:businessCardPaper.ink,secondary:businessCardPaper.secondary,line:businessCardPaper.border,sealFill:businessCardPaper.muted};
 const company=!!b?.name.trim();const businessName=(company?b!.name:card.name).trim().slice(0,30);const [businessNameWidth,setBusinessNameWidth]=useState(180);const nameFontSize=Math.max(14,Math.min(21,Math.floor(businessNameWidth/Math.max(8,businessName.length)*1.65)));const rating=displayedRating(b?.rating??null,b?.reviewCount??0);
 const reviewCount=b?.reviewCount??0;const ratingUnlocked=reviewCount>=10&&rating!==null;const year=Number(b?.opened);const years=Number.isInteger(year)&&year>1900&&year<=new Date().getFullYear()?new Date().getFullYear()-year:0;
 const category=b?.category?.trim()||(/hvac|aire acondicionado|climatiz|refrigeraci/i.test([card.role,...(b?.services??[])].join(" "))?"Climatización":b?.services?.[0]||"Servicios profesionales");
 const art=businessCategoryArt(category);
 const voteLevel=(key:"service"|"prices"|"punctuality"|"professionalism"|"tenure")=>{const total=b?.excellenceReviewCount??0;const percent=total>0?100*(b?.excellenceVotes?.[key]??0)/total:0;return (b?.reviewCount??0)<20||!(b?.excellenceVotes?.[key]??0)?0:percent>63?3:percent>33?2:1;};
 const awards=[
  {label:"Atención al cliente",icon:"headset-outline" as const,level:voteLevel("service")},
  {label:"Precios competitivos",icon:"cash-outline" as const,level:voteLevel("prices")},
  {label:"Puntualidad",icon:"calendar-outline" as const,level:voteLevel("punctuality")},
  {label:"Profesionalismo",icon:"person-outline" as const,level:voteLevel("professionalism")},
  {label:"En el mercado",icon:"trophy-outline" as const,level:voteLevel("tenure")},
 ];
 return <View style={{flex:1,borderRadius:30,backgroundColor:businessCardPaper.background,borderWidth:2,borderColor:businessCardPaper.outerBorder,overflow:"hidden"}}>
  <Svg style={StyleSheet.absoluteFill} width="100%" height="100%" viewBox="0 0 400 650" preserveAspectRatio="none" pointerEvents="none">
   {Array.from({length:15},(_,i)=><Path key={"left"+i} d={`M ${-45+i*10} 330 C ${42+i*4} 235, ${-20+i*8} 116, ${78+i*7} -25`} stroke={finish.text} strokeOpacity={0.12+(i%3)*0.018} strokeWidth={0.8} fill="none"/>)}
   {Array.from({length:16},(_,i)=><Path key={"bottom"+i} d={`M ${-45+i*13} 675 C ${60+i*8} 540, ${235+i*4} 555, ${440+i*2} 395`} stroke={finish.text} strokeOpacity={0.13+(i%4)*0.018} strokeWidth={0.8} fill="none"/>)}
   <Path d="M-20 420 C105 250 225 300 420 95" stroke={finish.text} strokeOpacity={0.12} strokeWidth="2" fill="none"/>
  </Svg>
  <View pointerEvents="none" style={[StyleSheet.absoluteFillObject,{borderRadius:jcardLayout.radius-3,borderWidth:1,borderColor:finish.line,margin:4,opacity:0.42}]}/>
  <View style={{flex:1,padding:14,gap:5}}>
   <View style={{height:92,marginTop:0,marginHorizontal:0,position:"relative",flexDirection:"row",alignItems:"center"}}>
    <View style={{position:"absolute",left:58,right:0,height:82,top:2,borderRadius:24,borderWidth:1,borderColor:finish.line,overflow:"hidden",backgroundColor:finish.sealFill}}>
     {!!b?.bannerUrl?<Image source={{uri:b.bannerUrl}} resizeMode="cover" style={{width:"100%",height:"100%"}} accessibilityLabel="Banner del negocio"/>:
      <View style={{flex:1,backgroundColor:art.tint,alignItems:"flex-end",justifyContent:"center",paddingRight:20}}><Ionicons name={art.icon} size={66} color={BUSINESS_MEDAL_COLORS[1]} style={{opacity:0.55}}/></View>}
    </View>
    <View style={{position:"absolute",left:0,top:8,borderRadius:jcardLayout.avatar/2,borderWidth:0,padding:0,backgroundColor:finish.start,elevation:3}}>
     {b?.avatarUrl?<Avatar uri={b.avatarUrl} name={company?b!.name:card.name} size={jcardLayout.avatar}/>:<View style={{width:jcardLayout.avatar,height:jcardLayout.avatar,borderRadius:jcardLayout.avatar/2,backgroundColor:BUSINESS_MEDAL_COLORS[20],alignItems:"center",justifyContent:"center"}}><Ionicons name={art.icon} size={34} color={BUSINESS_MEDAL_COLORS[1]}/></View>}
    </View>
    {canEditMedia&&onEditMedia&&<><Pressable accessibilityRole="button" accessibilityLabel="Cambiar banner empresarial desde la galería" onPress={()=>onEditMedia("banner")} style={{position:"absolute",left:58,right:0,top:2,height:82,borderRadius:24,justifyContent:"flex-start",alignItems:"flex-end",padding:5}}><View style={{width:23,height:23,borderRadius:12,backgroundColor:"rgba(238,240,242,0.9)",alignItems:"center",justifyContent:"center"}}><Ionicons name="pencil-outline" size={13} color="#62676B"/></View></Pressable><Pressable accessibilityRole="button" accessibilityLabel="Cambiar foto empresarial desde la galería" onPress={()=>onEditMedia("avatar")} style={{position:"absolute",left:0,top:8,width:jcardLayout.avatar,height:jcardLayout.avatar,borderRadius:jcardLayout.avatar/2,justifyContent:"flex-start",alignItems:"flex-end",padding:1}}><View style={{width:22,height:22,borderRadius:11,backgroundColor:"rgba(238,240,242,0.9)",alignItems:"center",justifyContent:"center"}}><Ionicons name="pencil-outline" size={12} color="#62676B"/></View></Pressable></>}
   </View>
   <View style={{flexDirection:"row",alignItems:"flex-start",gap:6,marginTop:-2}}>
    <View style={{flex:1,minWidth:0}} onLayout={e=>{const w=Math.floor(e.nativeEvent.layout.width)-22;if(w>0&&Math.abs(w-businessNameWidth)>2)setBusinessNameWidth(w);}}>
     <View style={{flexDirection:"row",alignItems:"center",justifyContent:"flex-start",gap:3}}>
      <Text numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.9} style={{flexShrink:1,fontSize:nameFontSize,lineHeight:nameFontSize*1.2,fontWeight:"700",color:finish.text}}>{businessName}</Text>
      <Ionicons name={b?.licenseVerified?"checkmark-circle":"checkmark-circle-outline"} size={16} color={b?.licenseVerified?jcardCommon.verifiedBubble :jcardCommon.unverifiedBubble} accessibilityLabel={b?.licenseVerified?"Empresa verificada":"Empresa sin verificar"}/>
     </View>
    </View>
    <View style={{alignItems:"center",gap:4,width:"33%",marginRight:-4,marginTop:-2}}>
     <View style={{borderRadius:20,borderWidth:1,borderColor:finish.line,paddingVertical:4,paddingHorizontal:3,backgroundColor:finish.sealFill,alignItems:"center",elevation:2}}>
      <Text numberOfLines={1} adjustsFontSizeToFit style={{color:finish.text,fontSize:12,fontWeight:"700"}}>{ratingUnlocked?rating!.toFixed(1):"0.0"} <Text style={{color:ratingUnlocked?jcardCommon.businessGold:finish.secondary}}>{ratingUnlocked?"★★★★★":"☆☆☆☆☆"}</Text></Text>
     </View>
     <Text style={{color:finish.secondary,fontSize:10,textAlign:"center"}}>({reviewCount} {reviewCount===1?"reseña":"reseñas"})</Text>
     {!!b?.opened&&<View style={{flexDirection:"row",alignItems:"center",gap:4}}><Ionicons name="calendar-outline" size={13} color={finish.secondary}/><Text style={{color:finish.secondary,fontSize:10}}>Desde {b.opened}</Text></View>}
    </View>
   </View>
   <View style={{gap:6,alignSelf:"stretch"}}>
     <View style={{flexDirection:"row",alignItems:"center",gap:6}}><Ionicons name={art.icon} size={19} color={finish.secondary}/><Text numberOfLines={2} style={{flex:1,fontSize:14,fontWeight:"600",color:finish.secondary}}>{company?category:card.role}</Text></View>
     {!!b?.email&&<Pressable accessibilityRole="link" accessibilityLabel={"Enviar correo a "+b.email} onPress={()=>void Linking.openURL("mailto:"+encodeURIComponent(b.email!)).catch(()=>{})} style={{flexDirection:"row",alignItems:"center",gap:6}}><Ionicons name="mail-outline" size={16} color={finish.secondary}/><Text numberOfLines={2} style={{flex:1,fontSize:12,color:finish.text}}>{b.email}</Text></Pressable>}
     {!!b?.phone&&<Pressable accessibilityRole="link" onPress={()=>void Linking.openURL("tel:"+b.phone!.replace(/[^+\d]/g,"")).catch(()=>{})} style={{flexDirection:"row",alignItems:"center",gap:6}}><Ionicons name="call-outline" size={16} color={finish.secondary}/><Text numberOfLines={1} style={{flex:1,fontSize:12,color:finish.text}}>{b.phone}</Text></Pressable>}
     {!!b?.location&&<View style={{flexDirection:"row",alignItems:"center",gap:6}}><Ionicons name="location-outline" size={16} color={finish.secondary}/><Text numberOfLines={2} style={{flex:1,fontSize:12,color:finish.secondary}}>{b.location}</Text></View>}
   </View>
   {!!b?.services?.length&&<View style={{alignSelf:"stretch",alignItems:"center",justifyContent:"center",paddingHorizontal:8,marginTop:4}}><Text numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.85} style={{fontSize:11,lineHeight:15,textAlign:"center",color:finish.secondary}}>{b.services.join(" · ")}</Text></View>}
   <View style={{flex:1,minHeight:8}}/>
   <View style={{height:1,backgroundColor:finish.line,opacity:0.7,marginBottom:4}}/>
   <View style={{flexDirection:"row",alignItems:"center",gap:4,minHeight:100}}>
    <View style={{flex:1,minWidth:0,flexDirection:"row",alignItems:"flex-start",gap:2}}>
     {awards.map(a=><BusinessAward key={a.label} {...a} finish={finish}/>)}
    </View>
    <View style={{width:1,height:85,backgroundColor:finish.line,marginHorizontal:2}}/>
    <Pressable accessibilityRole="button" accessibilityLabel="Ampliar código QR del negocio" onPress={()=>onQr?.()} style={{padding:3,borderRadius:7,backgroundColor:jcardCommon.qrPaper,borderWidth:1,borderColor:jcardCommon.qrBorder,alignSelf:"center",flexShrink:0}}>
     <QRCode value={card.profileUrl} size={46} color={jcardCommon.qrInk} backgroundColor={jcardCommon.qrPaper}/>
    </Pressable>
   </View>
  </View>
 </View>;
}
export function JobinCard({card,previewTheme,onEditBusiness,onEditBusinessMedia,ownerId,showOwnerActions=false,employerLink}:{card:CardData;previewTheme?:ThemeName;onEditBusiness?:()=>void;onEditBusinessMedia?:(slot:"banner"|"avatar")=>void;ownerId?:string;showOwnerActions?:boolean;employerLink?:{id:string;name:string;handle:string}|null}){
 const {theme}=useTheme();const {colors}=useUi();const {width}=useWindowDimensions();
 const [contact,setContact]=useState<{email:string|null;phone:string|null}>({email:null,phone:null});
 useEffect(()=>{if(!ownerId){setContact({email:null,phone:null});return;}let live=true;void loadPublicContact(ownerId).then(value=>{if(live)setContact(value);}).catch(()=>{if(live)setContact({email:null,phone:null});});return()=>{live=false;};},[ownerId]);
 const [back,setBack]=useState(false),[shareOpen,setShareOpen]=useState(false),[qrOpen,setQrOpen]=useState(false);
 const cardHeight = 450;
 const rotation=useRef(new Animated.Value(0)).current;
 const angle=useRef(0);
 const rotate=(direction:number)=>{const next=angle.current+direction*180;angle.current=next;setBack(v=>!v);rotation.stopAnimation();Animated.timing(rotation,{toValue:next,useNativeDriver:true,duration:420}).start(({finished})=>{if(finished&&Math.abs(angle.current)>=1800){angle.current=angle.current%360;rotation.setValue(angle.current);}});};
 const toggle=()=>rotate(1);
 const responder=useRef(PanResponder.create({onMoveShouldSetPanResponder:(_,g)=>Math.abs(g.dx)>28&&Math.abs(g.dx)>Math.abs(g.dy)*1.5,onPanResponderRelease:(_,g)=>{if(Math.abs(g.dx)>65)toggleRef.current(g.dx<0?1:-1);}})).current;
 const toggleRef=useRef(rotate);toggleRef.current=rotate;
 const frontRotate=rotation.interpolate({inputRange:[-3600,3600],outputRange:["-3600deg","3600deg"],extrapolate:"extend"});
 const backRotate=rotation.interpolate({inputRange:[-3600,3600],outputRange:["-3420deg","3780deg"],extrapolate:"extend"});
 const cardTheme=previewTheme??theme;
 const share=()=>void Share.share({message:`JCard de ${card.name} · ${card.profileUrl}`,url:card.profileUrl,title:`JCard · ${card.name}`});
 return <>
  <View style={{width:"100%",maxWidth:520,alignSelf:"center"}}>
   <View {...responder.panHandlers}>
   <Animated.View pointerEvents={back?"none":"auto"} style={{height:cardHeight,backfaceVisibility:"hidden",transform:[{perspective:1000},{rotateY:frontRotate}]}}>
    <CardFace card={card} theme={cardTheme} contact={contact} employerLink={employerLink} onEdit={()=>router.push("/professional")} onQr={()=>setQrOpen(true)}/>
   </Animated.View>
   <Animated.View pointerEvents={back?"auto":"none"} style={{position:"absolute",top:0,left:0,right:0,backfaceVisibility:"hidden",transform:[{perspective:1000},{rotateY:backRotate}]}}>
    <View style={{height:cardHeight}}><BusinessFace card={card} theme={cardTheme} contact={contact} onQr={()=>setQrOpen(true)} canEditMedia={showOwnerActions&&!!onEditBusinessMedia} onEditMedia={onEditBusinessMedia}/></View>
   </Animated.View>

   </View>
   <Pressable accessibilityRole="button" accessibilityLabel={back?"Girar JCard a cara personal":"Girar JCard para ver el reverso"} accessibilityHint="Toca o desliza horizontalmente la tarjeta para girarla" onPress={toggle} style={{alignSelf:"center",width:"68%",height:31,justifyContent:"center",alignItems:"center",marginTop:1}}>
    <View pointerEvents="none" style={{position:"absolute",top:0,width:"90%",height:12,borderRadius:100,backgroundColor:theme==="dark"?jcardCommon.flipShadowDark:jcardCommon.flipShadow,transform:[{scaleX:0.92}]}}/>
    <View pointerEvents="none" style={{width:86,height:21,borderRadius:30,alignItems:"center",justifyContent:"center",backgroundColor:theme==="dark"?jcardCommon.flipSurfaceDark:jcardCommon.flipSurface,borderWidth:1,borderColor:theme==="dark"?jcardCommon.flipOutlineDark:jcardCommon.flipOutline}}>
      <Ionicons name="sync-outline" size={16} color={theme==="dark"?jcardCommon.flipInkDark:jcardCommon.editInk}/>
    </View>
   </Pressable>
   {showOwnerActions&&<View style={{flexDirection:"row",gap:10,paddingTop:10}}>
    <Pressable accessibilityRole="button" accessibilityLabel="Compartir JCard" onPress={()=>setShareOpen(true)} style={{flex:1,flexDirection:"row",alignItems:"center",justifyContent:"center",gap:9,paddingVertical:13,borderRadius:12,backgroundColor:colors.ink}}>
      <Ionicons name="share-social-outline" size={20} color={colors.paper}/><Text style={{color:colors.paper,fontWeight:"700"}}>Compartir</Text>
    </Pressable>
    <Pressable accessibilityRole="button" accessibilityLabel="Editar JCard" onPress={()=>back?onEditBusiness?.():router.push("/professional")} style={{flex:1,flexDirection:"row",alignItems:"center",justifyContent:"center",gap:9,paddingVertical:13,borderRadius:12,borderWidth:1,borderColor:colors.line}}>
      <Ionicons name="create-outline" size={20} color={colors.ink}/><Text style={{color:colors.ink,fontWeight:"700"}}>Editar JCard</Text>
    </Pressable>
   </View>}
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
