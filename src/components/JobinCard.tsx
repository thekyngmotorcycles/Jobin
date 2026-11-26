import {presentJCardContact} from "../lib/jcard-save-contact";
import {BusinessCard3D,CardFlipInteractionContext} from "./BusinessCard3D";
import {ProfileConnectionCountRow} from "./ProfileFollowCounts";
import {JCardSharedCover} from "./JCardSharedCover";
import {JCardProfileLayers} from "./JCardProfileLayers";
import {jobeenTokens,jcardArtTokens} from "../theme/jobeen";
import {JOBEEN_CONTROL} from "../theme/control-metrics";
import {personalAvatarUrl} from "../lib/personal-jcard-photo";
import {readJCardVisibility,DEFAULT_JCARD_VISIBILITY,type JCardVisibility} from "../lib/jcard-visibility";
import {assertMessageScope,captureMessageScope,type MessageScope} from "../lib/message-session";
import {useFocusEffect} from "expo-router";
import {readJCardAppearance} from "../lib/jcard-appearance";
import {getPremiumBackground,JCARD_PREMIUM_TRANSPARENT,type JCardPremiumBackgroundId} from "../theme/jcard-premium-backgrounds";
import {JCardPremiumTexture} from "./JCardPremiumTexture";
import {BUSINESS_BADGE_NEUTRAL,BUSINESS_MEDAL_COLORS} from "../theme/business-medals";
import { memo, useCallback, useContext, useEffect, useId, useRef, useState } from "react";
import { router } from "expo-router";
import { Alert, Animated, Image, Linking, Modal, Pressable as NativePressable, ScrollView, StyleSheet, Text, View, useWindowDimensions, type LayoutChangeEvent } from "react-native";
import {JCardShareSheet} from "./JCardShareSheet";

import { Ionicons } from "@expo/vector-icons";
import Svg, { Defs, LinearGradient, Rect, Stop, Path, Circle, SvgXml, ClipPath, Image as SvgImage } from "react-native-svg";
import {WORDMARK_XML} from "../theme/wordmark";

import { Avatar } from "./social-ui";
import { Button, useUi } from "./ui";
import { useTheme, type ThemeName } from "../state/ThemeProvider";
import { displayedRating, jcardTier, sealRows, type CardData, type BusinessCardData } from "../lib/jcard";
import {loadPublicContact,loadVisiblePersonalContactDetails,type PersonalContactDetails} from "../lib/jcard-contact";
import { experienceLabel } from "../lib/employment";
import {ProfessionGlyph} from "./ProfessionGlyph";
import { LanguageRing, languageLabel, LANGUAGE_LEVELS } from "./LanguageRing";
import { businessCardAccents, businessCardPaper, businessInformationSurface, jcardCommon, jcardFloating, jcardReviewGlass, jcardLayout, jcardTokens, jcardSurfaceSize, jcardSurfaceMetrics, jcardProfilePortraitMetrics,jcardProfileIdentitySpace,jcardBusinessLogoMetrics,type JCardProfilePortraitMetrics } from "../theme/jcard";
import {businessCategoryArt} from "../lib/business-category-art";
import {wrapBusinessCardName} from "../lib/business-card-layout";
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
/** Subtle honeycomb motif from the approved Light JCard references. */
const HONEYCOMB_CELLS=Array.from({length:9},(_,row)=>Array.from({length:8},(_,col)=>{
 const x=col*24+(row%2?12:0)-5,y=row*21-6;
 const vertices=Array.from({length:6},(_,side)=>{
  const angle=Math.PI/3*side-Math.PI/6;
  return (x+13*Math.cos(angle)).toFixed(1)+","+(y+13*Math.sin(angle)).toFixed(1);
 }).join(" L");
 const fade=Math.max(0,Math.min(1,(x+20)/125))*Math.max(0,Math.min(1,(165-y)/115));
 return {key:row+"-"+col,d:"M"+vertices+" Z",opacity:fade*0.45};
})).flat();
function JobeenHoneycomb({color,compact=false}:{color:string;compact?:boolean}){
 return <View pointerEvents="none" style={{position:"absolute",top:0,right:0,width:compact?150:190,height:compact?118:150,overflow:"hidden"}}>
  <Svg width="100%" height="100%" viewBox="0 0 190 150" accessible={false}>
   {HONEYCOMB_CELLS.map(cell=><Path key={cell.key} d={cell.d} stroke={color} strokeWidth="1.1" strokeOpacity={cell.opacity} fill="none"/>)}
  </Svg>
 </View>;
}
const AWARD_POINTS=Array.from({length:48},(_,i)=>{const t=i*Math.PI/24-Math.PI/2;const radius=i%2?23:25;return (27+radius*Math.cos(t)).toFixed(2)+","+(27+radius*Math.sin(t)).toFixed(2);}).join(" ");

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
/** Interactive controls take priority over the parent JCard tap gesture. */
const Pressable:typeof NativePressable = ((props:React.ComponentProps<typeof NativePressable>)=>{
 const markInteractive=useContext(CardFlipInteractionContext);
 return <NativePressable {...props} onTouchStart={event=>{if(!props.disabled&&typeof props.onPress==="function")markInteractive?.();props.onTouchStart?.(event);}}/>;
}) as typeof NativePressable;

function primaryCardProfession(card:CardData){
 return card.role.trim().replace(/^Técnico HVAC\s*\/\s*climatización y aire acondicionado$/i,"Técnico HVAC").replace(/\s*[-–/]\s*aire acondicionado\s*$/i,"").trim();
}
function secondaryCardSeals(card:CardData){
 const primaryProfession=primaryCardProfession(card);
 return card.seals.filter(seal=>!(/hvac/i.test(primaryProfession)&&/hvac|aire acondicionado/i.test(seal.profession))&&seal.profession.trim().toLocaleLowerCase()!==primaryProfession.toLocaleLowerCase());
}
function CardFace({ card, theme, appearance="original", expanded = false, onEdit, onShare, onEditPhoto, onSaveContact, contact, employerLink,profilePortrait,onProfileLayout }: { card: CardData; theme: ThemeName; appearance?:JCardPremiumBackgroundId; expanded?: boolean; onEdit?: () => void; onShare?: () => void; onEditPhoto?: () => void; onSaveContact?:()=>void; contact?:{email:string|null;phone:string|null;details?:PersonalContactDetails}; employerLink?:{id:string;name:string;handle:string}|null;profilePortrait?:JCardProfilePortraitMetrics;onProfileLayout?:(event:LayoutChangeEvent)=>void }) {
  const { s, fs } = useUi();
  const inlineIdentity=theme==="light";
  const jobeen=jcardArtTokens(theme);
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
  const [experienceOpen,setExperienceOpen]=useState(false);
  // Keep the verification seal beside the final visible name line, even for long legal names.
  const fullDisplayName=card.name.trim().replace(/\s+/g," ");
  const visibleName=Array.from(fullDisplayName).slice(0,25).join("")+(Array.from(fullDisplayName).length>25?"…":"");
  const nameFontSize=visibleName.length>22?15:visibleName.length>17?17:19;
  const nameBreakAt=visibleName.length>17?visibleName.lastIndexOf(" ",17):-1;
  const firstNameLine=nameBreakAt>5?visibleName.slice(0,nameBreakAt):visibleName;
  const lastNameLine=nameBreakAt>5?visibleName.slice(nameBreakAt+1):null;
  const primaryProfession=primaryCardProfession(card);
  const primarySeal=card.seals.find(seal=>/hvac/i.test(primaryProfession)?/hvac|aire acondicionado/i.test(seal.profession):seal.profession.trim().toLocaleLowerCase()===primaryProfession.toLocaleLowerCase());
  const primarySealMonths=card.primaryExperienceMonths??primarySeal?.months;
  const secondarySeals=secondaryCardSeals(card);
  const sealCount = Math.max(card.languages.length, Math.min(secondarySeals.length, 5));
  const sealColumns = sealCount > 8 ? 4 : sealCount > 4 ? 3 : 2;
  const sealDiameter = sealCount > 12 ? 24 : sealCount > 8 ? 29 : sealCount > 4 ? 32 : 36;
  const sealGap = sealCount > 8 ? 2 : 4;
  const bodySize = Math.max(12, fs(expanded ? 14 : 13));
  const lineStyle = { color:finish.text, fontSize:bodySize, lineHeight:bodySize * 1.5 };
  const compactNameFont=profilePortrait&&profilePortrait.cardWidth<jcardSurfaceMetrics.compactThreshold?17:18;
  const identitySpace=profilePortrait?jcardProfileIdentitySpace(profilePortrait,fullDisplayName.length,compactNameFont,fontScale):undefined;
  const months=card.primaryExperienceMonths;
  const years=Math.floor((months??0)/12);
  const experience=years>0
    ? years+((months??0)%12?"+":"")+(years===1?" Año de experiencia":" Años de experiencia")
    : months&&months>0?months+(months===1?" Mes de experiencia":" Meses de experiencia"):"Sin experiencia";
  const working=card.status==="ACTIVE";
  const experienceAndAvailability=<View style={{
    flexDirection:"row",flexWrap:profilePortrait?"wrap":"nowrap",alignItems:"center",justifyContent:"center",
    gap:8,minWidth:0,width:"100%",marginTop:!profilePortrait&&theme==="light"?10:0
  }}>
    {months!==undefined&&<Pressable accessibilityRole="button" accessibilityLabel="Ver experiencia por profesión"
     onPress={event=>{event.stopPropagation();setExperienceOpen(true);}}
     style={{flexShrink:1,maxWidth:"100%",backgroundColor:jobeen.cream,borderColor:jobeen.yellow,borderWidth:1,
      borderRadius:16,paddingHorizontal:10,paddingVertical:5,minHeight:profilePortrait?JOBEEN_CONTROL.touchTarget:40,
      alignItems:"center",justifyContent:"center"}}>
      <Text numberOfLines={profilePortrait?undefined:1} adjustsFontSizeToFit={!profilePortrait} minimumFontScale={0.85}
       style={{color:jobeen.ink,fontSize:12,fontWeight:"600",textAlign:"center"}}>{experience}</Text>
    </Pressable>}
    <Pressable accessibilityRole="button" accessibilityLabel="Información sobre disponibilidad"
     onPress={()=>setInfo(working
      ?"Trabajando actualmente\nLa persona indica que tiene un trabajo activo. Esto no significa que Jobin haya confirmado su relación laboral."
      :"Disponible para trabajar\nLa persona indica que está abierta a nuevas oportunidades laborales o solicitudes de clientes.")}
     style={{minHeight:profilePortrait?JOBEEN_CONTROL.touchTarget:44,justifyContent:"center",flexShrink:1,maxWidth:"100%"}}>
      <View style={{flexDirection:"row",alignItems:"center",gap:5,backgroundColor:jobeen.okBackground,
       borderRadius:18,paddingHorizontal:10,paddingVertical:6}}>
        <View style={{width:7,height:7,borderRadius:4,backgroundColor:jobeen.okDot}}/>
        <Text style={{flexShrink:1,color:jobeen.okText,fontWeight:"700",fontSize:11}}>{working?"Trabajando":"Disponible"}</Text>
      </View>
    </Pressable>
  </View>;
  const personalActions=<>
    {onSaveContact&&<Pressable accessibilityRole="button" accessibilityLabel="Guardar contacto personal" onPress={event=>{event.stopPropagation();onSaveContact();}} style={{alignSelf:"center",flexDirection:"row",alignItems:"center",justifyContent:"center",gap:5,backgroundColor:jobeen.yellow,borderRadius:20,paddingHorizontal:10,paddingVertical:4,minHeight:profilePortrait?JOBEEN_CONTROL.touchTarget:28,marginTop:0,marginBottom:theme==="light"?12:0,transform:[{translateY:theme==="light"?-6:0}],...(profilePortrait?{marginBottom:0,transform:[]}: {})}}>
          <Ionicons name="person-add-outline" size={12} color={jobeen.ink}/><Text style={{fontSize:profilePortrait?12:10,fontWeight:"700",color:jobeen.ink}}>Guardar contacto</Text>
        </Pressable>}
        {card.status==="ACTIVE"&&employerLink&&<Pressable accessibilityRole="link" accessibilityLabel={"Ver empresa "+employerLink.name} onPress={()=>router.push({pathname:"/company",params:{id:employerLink.id}})} style={{alignSelf:profilePortrait?"center":"flex-start",maxWidth:"100%",minHeight:profilePortrait?JOBEEN_CONTROL.touchTarget:undefined,justifyContent:"center"}}><Text style={[lineStyle,{textDecorationLine:"underline"}]}>Trabaja en {employerLink.name} · @{employerLink.handle} ↗</Text><Text style={{fontSize:10,color:finish.secondary}}>Vínculo laboral verificado por la empresa</Text></Pressable>}
  </>;
  const secondaryProfessions=secondarySeals.length>0&&theme!=="light"&&<View style={{minHeight:62,justifyContent:"center",gap:7,marginTop:4,paddingTop:7,borderTopWidth:1,borderTopColor:finish.line}}>
          <Text style={{fontSize:11,color:finish.secondary,textAlign:"center",letterSpacing:0.8}}>Otras profesiones</Text>
          <View style={{flexDirection:"row",flexWrap:"wrap",justifyContent:"center",gap:sealGap}}>
            {secondarySeals.slice(0,5).map(seal=><Pressable key={seal.id} accessibilityRole="button" accessibilityLabel={"Información del sello "+seal.profession} onPress={()=>setInfo(seal.profession+"\nEspecialidades: "+(seal.specialties?.length?seal.specialties.join(", "):"No declaradas")+"\nExperiencia registrada: "+(seal.months===undefined?"No disponible":experienceLabel(seal.months))+".\n"+(seal.verified?"Acreditación verificada.":"Acreditación pendiente de verificación."))} style={{width:profilePortrait?JOBEEN_CONTROL.touchTarget:sealDiameter+4,height:profilePortrait?JOBEEN_CONTROL.touchTarget:sealDiameter+4,alignItems:"center",justifyContent:"center"}}>
              <View style={{width:sealDiameter,height:sealDiameter,borderRadius:sealDiameter/2,borderWidth:2,borderColor:seal.verified?finish.sealFill:finish.line,backgroundColor:finish.pendingFill,alignItems:"center",justifyContent:"center",elevation:4,shadowColor:finish.text,shadowOpacity:0.15,shadowRadius:5}}>
                <View style={{width:sealDiameter-8,height:sealDiameter-8,borderRadius:(sealDiameter-8)/2,borderWidth:1,borderColor:finish.line,alignItems:"center",justifyContent:"center",gap:0}}>
                  <ProfessionGlyph profession={seal.profession} fallback={seal.icon} size={Math.max(12,sealDiameter*0.48)} color={finish.text}/>
                </View>
              </View>
            </Pressable>)}
          </View>
          {secondarySeals.length>5&&<Pressable accessibilityRole="button" accessibilityLabel="Ver todas las profesiones secundarias" style={profilePortrait?{minHeight:JOBEEN_CONTROL.touchTarget,justifyContent:"center"}:undefined} onPress={()=>setInfo("Profesiones secundarias ("+secondarySeals.length+"):\n"+secondarySeals.map((seal,index)=>(index+1)+". "+seal.profession+"\n   Especialidades: "+(seal.specialties?.length?seal.specialties.join(", "):"No declaradas")+"\n   Experiencia: "+(seal.months===undefined?"No disponible":experienceLabel(seal.months))+(seal.verified?" · Acreditación verificada":" · Sin acreditación verificada")).join("\n\n"))}><Text style={{fontSize:11,color:finish.text,textAlign:"center",textDecorationLine:"underline"}}>Ver todas ({secondarySeals.length})</Text></Pressable>}
        </View>;
  return <View onLayout={e=>{const {width,height}=e.nativeEvent.layout;setArtSize(prev=>prev.width===width&&prev.height===height?prev:{width,height});}} style={[s.panel, { flex:1, padding:0, gap:0, borderRadius:profilePortrait?jcardSurfaceMetrics.radius:28, borderColor:finish.line, backgroundColor:finish.start, overflow:"hidden" }]}>
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
    {theme==="light"&&appearance==="original"&&<JobeenHoneycomb color={jobeen.bizBorder} compact={artSize.width>0&&artSize.width<360}/> }
    <View pointerEvents="none" style={[StyleSheet.absoluteFillObject,{borderRadius:25,borderWidth:1,borderColor:finish.line,margin:4,opacity:0.42}]}/>
    {profilePortrait&&identitySpace?<View onLayout={onProfileLayout} style={{flexShrink:0,paddingBottom:4}}>
      <View style={identitySpace}>
        <Pressable accessibilityRole="button" accessibilityLabel={fullDisplayName+(card.identityVerified?", persona verificada":", persona sin verificar")}
         onPress={()=>setInfo(card.identityVerified?"Identidad verificada por Jobin.":"Identidad sin verificar.")}
         style={{minHeight:JOBEEN_CONTROL.touchTarget,flexDirection:"row",alignItems:"center",justifyContent:"center",gap:4}}>
          <Text style={{flexShrink:1,textAlign:"center",fontSize:compactNameFont,fontWeight:"700",color:finish.text}}>{fullDisplayName}</Text>
          <View style={{width:19,alignItems:"center",transform:[{scale:0.72}]}}><IdentityBadge verified={card.identityVerified===true} ink={finish.text} contrast={finish.start}/></View>
        </Pressable>
      </View>
      <View style={{paddingHorizontal:12,alignItems:"center"}}>
        <Text style={{color:finish.secondary,fontSize:12,textAlign:"center"}}>@{card.handle}</Text>
        <Pressable accessibilityRole="button" accessibilityLabel={"Detalles de la profesión principal: "+primaryProfession}
         onPress={()=>setInfo("Profesión principal: "+primaryProfession+"\nEspecialidades: "+(card.primarySpecialties?.length?card.primarySpecialties.join(", "):"No declaradas")+"\nExperiencia en esta profesión: "+(primarySealMonths===undefined?"No disponible":experienceLabel(primarySealMonths)))}
         style={{minHeight:JOBEEN_CONTROL.touchTarget,justifyContent:"center",alignItems:"center",flexDirection:"row",gap:5,maxWidth:"100%"}}>
          <ProfessionGlyph profession={card.role} fallback={primarySeal?.icon??"briefcase-outline"} size={17} color={finish.text}/>
          <Text style={{flexShrink:1,textAlign:"center",fontSize:13,fontWeight:"600",color:finish.text}}>{primaryProfession}{!!card.primarySpecialties?.length?" · Especializado":""}</Text>
        </Pressable>
        <View style={{width:"100%",maxWidth:320}}><ProfileConnectionCountRow ink={finish.text} muted={finish.secondary} line={finish.line}/></View>
        {experienceAndAvailability}
        {(card.status==="ACTIVE"&&!!employerLink||theme!=="light"&&!!onShare)&&<View style={{flexDirection:"row",flexWrap:"wrap",justifyContent:"center",alignItems:"center",columnGap:8}}>
          {personalActions}
          {theme!=="light"&&onShare&&<Pressable accessibilityRole="button" accessibilityLabel="Compartir JCard personal"
           onPress={onShare} style={{width:JOBEEN_CONTROL.touchTarget,height:JOBEEN_CONTROL.touchTarget,alignItems:"center",justifyContent:"center"}}>
            <Ionicons name="share-social-outline" size={20} color={finish.text}/>
          </Pressable>}
        </View>}
        {secondaryProfessions}
      </View>
    </View>:
    <View style={{ padding:theme==="light"?12:jcardLayout.padding, gap:theme==="light"?5:8, flex:1, justifyContent:"space-between" }}>
      <View style={{ paddingTop:8, flexDirection:"row", alignItems:"flex-start", justifyContent:"space-between" }}>
        <Pressable disabled={!onEditPhoto} accessibilityRole={onEditPhoto?"button":undefined} accessibilityLabel={onEditPhoto?"Cambiar foto de JCard personal":undefined} onPress={event=>{event.stopPropagation();onEditPhoto?.();}} style={{width:theme==="light"?92:jcardLayout.avatar+8,height:theme==="light"?101:jcardLayout.avatar*1.1+8,justifyContent:"center",alignItems:"center",minWidth:44,minHeight:44}}>
          <View style={{width:theme==="light"?90:jcardLayout.avatar+10,height:theme==="light"?99:jcardLayout.avatar*1.1+10,borderRadius:14,alignItems:"center",justifyContent:"center",overflow:"hidden"}}><Avatar uri={personalAvatarUrl(card.avatar)} name={card.name} size={theme==="light"?80:jcardLayout.avatar} height={theme==="light"?88:jcardLayout.avatar*1.1} shape="portrait" framed={false}/></View>
        </Pressable>
        {!inlineIdentity&&onShare&&<Pressable accessibilityRole="button" accessibilityLabel="Compartir JCard personal" onPress={event=>{event.stopPropagation();onShare();}} style={{width:44,height:44,alignItems:"center",justifyContent:"center"}}><Ionicons name="share-social-outline" size={20} color={finish.text}/></Pressable>}
        {inlineIdentity&&<View style={{flex:1,minWidth:0,justifyContent:"center",paddingLeft:8,paddingTop:8}}><View style={{alignItems:"flex-start",minWidth:0}}>
          {lastNameLine&&<Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.72} style={{fontSize:nameFontSize,lineHeight:nameFontSize+4,fontWeight:"700",color:finish.text,maxWidth:"100%"}}>{firstNameLine}</Text>}
          <View style={{flexDirection:"row",alignItems:"center",gap:3,maxWidth:"100%",minWidth:0}}>
            <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.65} style={{fontSize:nameFontSize,lineHeight:nameFontSize+4,fontWeight:"700",color:finish.text,flexShrink:1}}>{lastNameLine??firstNameLine}</Text>
            <Pressable accessibilityRole="button" accessibilityLabel={card.identityVerified?"Persona verificada":"Persona sin verificar"} hitSlop={{top:6,bottom:6,right:6,left:0}} onPress={()=>setInfo(card.identityVerified?"Identidad verificada por Jobin.":"Identidad sin verificar.")} style={{width:17,height:19,alignItems:"center",justifyContent:"center",flexShrink:0}}><View style={{transform:[{scale:0.64}]}}><IdentityBadge verified={card.identityVerified===true} ink={finish.text} contrast={finish.start}/></View></Pressable>
          </View>
        </View><Text numberOfLines={1} style={{color:finish.secondary,fontSize:12,marginTop:2}}>@{card.handle}</Text>        {inlineIdentity&&<View style={{flexDirection:"row",alignItems:"center",gap:5,marginTop:3}}><Pressable accessibilityRole="button" accessibilityLabel="Detalles de la profesión principal" hitSlop={{top:6,bottom:6,right:4,left:0}} onPress={()=>setInfo("Profesión principal: "+primaryProfession+"\nEspecialidades: "+(card.primarySpecialties?.length?card.primarySpecialties.join(", "):"No declaradas"))} style={{flexDirection:"row",alignItems:"center",gap:5,flexShrink:1}}><ProfessionGlyph profession={card.role} fallback={primarySeal?.icon??"briefcase-outline"} size={17} color={finish.text}/><Text numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.8} style={{fontSize:13,fontWeight:"600",color:finish.text,flexShrink:1}}>{primaryProfession}{!!card.primarySpecialties?.length?" · Especializado":""}</Text></Pressable></View>}
</View>}

      </View>

      <View style={{flex:1,minHeight:0,justifyContent:"flex-start",gap:5,paddingTop:0,paddingBottom:profilePortrait?0:theme==="light"?18:4}}>
        {!inlineIdentity&&<View style={{gap:0,marginTop:0}}>
        <View style={{flexDirection:"row",alignItems:"center",gap:8}}>
          <View style={{flex:1,minWidth:0,flexDirection:"row",alignItems:"center",gap:4}}><Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.65} style={[s.h3,{color:finish.text,fontSize:Math.max(20,fs(expanded?22:22)),lineHeight:Math.max(23,fs(expanded?26:25)),flexShrink:1}]}>{card.name}</Text><Pressable accessibilityRole="button" accessibilityLabel={card.identityVerified?"Persona verificada":"Persona sin verificar"} hitSlop={{top:6,bottom:6,right:6,left:0}} onPress={()=>setInfo(card.identityVerified?"Identidad verificada por Jobin. Esta insignia no certifica licencias ni competencias profesionales.":"Identidad sin verificar. Para obtener la insignia se requerirá nombre legal, correo y teléfono confirmados, documento de identidad y validación de identidad.")} style={{width:19,height:19,alignItems:"center",justifyContent:"center",flexShrink:0}}><View style={{transform:[{scale:0.72}]}}><IdentityBadge verified={card.identityVerified===true} ink={finish.text} contrast={finish.start}/></View></Pressable></View>
          
        </View>
        <Text numberOfLines={1} style={{color:finish.secondary,fontSize:14,lineHeight:19,marginTop:0}}>@{card.handle}</Text>
        {typeof card.followers==="number"&&<Text style={{color:finish.secondary,fontSize:10}}>{card.followers.toLocaleString()} seguidores</Text>}
        </View>}
        <View style={{flex:1,minHeight:0,justifyContent:theme==="light"?"flex-start":"center",gap:4,paddingTop:profilePortrait?0:theme==="light"?12:0}}>
        {!inlineIdentity&&<View style={{flexDirection:"row",alignItems:"center",gap:7,width:"100%"}}>
          <Text textBreakStrategy="simple" android_hyphenationFrequency="none" style={[lineStyle,{fontWeight:"600",flexShrink:1,flexGrow:0}]}>{primaryProfession}{!!card.primarySpecialties?.length?" / Especializado":""}</Text>
          <Pressable accessibilityRole="button" accessibilityLabel="Detalles de la profesión principal" onPress={()=>setInfo("Profesión principal: "+primaryProfession+"\nEspecialidades: "+(card.primarySpecialties?.length?card.primarySpecialties.join(", "):"No declaradas")+"\nExperiencia en esta profesión: "+(primarySealMonths===undefined?"No disponible":experienceLabel(primarySealMonths))+".\n"+(primarySeal?.verified?"Acreditación verificada.":"Acreditación pendiente de verificación."))} style={{width:undefined,height:undefined,alignItems:"center",justifyContent:"center",padding:3,borderWidth:1,borderColor:finish.line,borderRadius:22,flexShrink:0}}>
            <ProfessionGlyph profession={card.role} fallback={primarySeal?.icon??"briefcase-outline"} size={19} color={finish.text}/>
          </Pressable>
        </View>}
        {experienceAndAvailability}
        {personalActions}
        </View>
      </View>
      <View style={{height:theme==="light"?76:(secondarySeals.length?166:92),borderTopWidth:1,borderTopColor:finish.line,paddingTop:theme==="light"?3:(secondarySeals.length?9:5),paddingBottom:theme==="light"?0:(secondarySeals.length?17:0),justifyContent:"space-evenly"}}>
        {theme==="light"?<View style={{minHeight:62,flexDirection:"row",alignItems:"center",justifyContent:"center",gap:8,paddingHorizontal:12}}><Text style={{fontSize:11,fontWeight:"700",letterSpacing:0.5,color:finish.secondary,textAlign:"center",minWidth:64}}>Idiomas</Text><View style={{width:1,height:24,backgroundColor:finish.line}}/>{card.languages.slice(0,2).map((language,index)=><View key={language.name+index} style={{flex:1,minWidth:0,alignItems:"center",justifyContent:"center"}}><Pressable accessibilityRole="button" accessibilityLabel={"Idioma "+language.name+", "+languageLabel(language.fluency)+". Ver detalles"} onPress={()=>setInfo(languageDetails(language.name,language.fluency))} style={{alignSelf:"center",maxWidth:"100%",minHeight:44,flexDirection:"row",alignItems:"center",justifyContent:"center",gap:4,paddingHorizontal:2}}><View style={{width:25,height:25,borderRadius:13,backgroundColor:jobeen.yellow,alignItems:"center",justifyContent:"center"}}><Text style={{fontSize:10,fontWeight:"800",color:jobeen.ink}}>{language.name.toLowerCase().startsWith("es")?"ES":language.name.toLowerCase().startsWith("in")||language.name.toLowerCase().startsWith("en")?"EN":language.name.slice(0,2).toUpperCase()}</Text></View><View style={{flexShrink:1,justifyContent:"center",alignItems:"flex-start",gap:1}}><Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75} style={{fontSize:10,color:finish.text}}>{language.name}</Text><Text numberOfLines={1} style={{fontSize:10,color:finish.text}}>{Math.round(language.fluency)}%</Text></View></Pressable></View>)}</View>:<View style={{minHeight:62,justifyContent:"center",gap:7}}>
          {<Text style={{fontSize:11,color:finish.secondary,textAlign:"center",letterSpacing:1.2}}>Idiomas</Text>}
          <View style={{flexDirection:"row",flexWrap:"wrap",justifyContent:"center",gap:sealGap}}>
            {card.languages.map((language,index)=><Pressable key={language.name+index} accessibilityRole="button" accessibilityLabel={"Idioma "+language.name+", "+languageLabel(language.fluency)+". Ver detalles"} onPress={()=>setInfo(languageDetails(language.name,language.fluency))} style={{alignItems:"center",justifyContent:"center",width:sealDiameter+4,height:sealDiameter+4,paddingVertical:0}}>
              <LanguageRing name={language.name} value={language.fluency} color={finish.text} track={finish.line} size={sealDiameter+4}/>
            </Pressable>)}
          </View>
        </View>}

        {secondaryProfessions}
      </View>
    </View>}
    <Modal visible={experienceOpen&&card.primaryExperienceMonths!==undefined} transparent animationType="fade" onRequestClose={()=>setExperienceOpen(false)}>
      <View style={{flex:1,backgroundColor:jcardCommon.scrim,justifyContent:"center",padding:24}}>
        <View style={{backgroundColor:jcardCommon.qrPaper,borderRadius:18,padding:20,gap:12}}>
          <Text style={{fontSize:17,fontWeight:"700",color:jcardCommon.qrInk}}>Experiencia profesional</Text>
          <Text style={{fontSize:12,color:jcardCommon.qrInk}}>La burbuja de la JCard muestra únicamente el tiempo del currículum correspondiente a la profesión principal.</Text>
          <View style={{flexDirection:"row",alignItems:"center",gap:9}}>
            <ProfessionGlyph profession={primaryProfession} fallback={primarySeal?.icon??"briefcase-outline"} size={22} color={jcardCommon.qrInk}/>
            <View style={{flex:1}}><Text numberOfLines={2} style={{fontWeight:"700",color:jcardCommon.qrInk}}>{primaryProfession}</Text><Text style={{fontSize:12,color:jcardCommon.qrInk}}>{card.primaryExperienceMonths===undefined?"No disponible":experienceLabel(card.primaryExperienceMonths)}</Text></View>
          </View>
          {!!card.secondaryProfessions?.length&&<><View style={{height:1,backgroundColor:finish.line,marginVertical:2}}/>
            <ScrollView style={{maxHeight:220}} contentContainerStyle={{gap:10}}>
              {card.secondaryProfessions?.map(profession=><View key={profession.code} style={{flexDirection:"row",alignItems:"center",gap:9}}>
                <View style={{width:28,height:28,borderRadius:14,borderWidth:1,borderColor:finish.line,alignItems:"center",justifyContent:"center"}}><ProfessionGlyph profession={profession.name} fallback={profession.icon} size={17} color={jcardCommon.qrInk}/></View>
                <Text numberOfLines={2} style={{flex:1,fontSize:12,color:jcardCommon.qrInk}}>{profession.name}</Text>
                <Text style={{fontSize:12,fontWeight:"600",color:jcardCommon.qrInk}}>{profession.months===undefined?"No disponible":experienceLabel(profession.months)}</Text>
              </View>)}
            </ScrollView></>}
          <Button title="Cerrar" onPress={()=>setExperienceOpen(false)}/>
        </View>
      </View>
    </Modal>
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
function BusinessAward({label,icon,level,finish,surface,onPress,compact=false}:{label:string;icon:React.ComponentProps<typeof Ionicons>["name"];level:number;finish:ReturnType<typeof jcardTokens>;surface:ReturnType<typeof businessInformationSurface>;onPress:()=>void;compact?:boolean}){
 const tone=level===3?jcardCommon.businessGold:level===2?jcardCommon.businessSilver:level===1?jcardCommon.businessBronze:BUSINESS_BADGE_NEUTRAL.border;
 const points=AWARD_POINTS;
 const path="M"+points.replaceAll(" "," L")+" Z";
 return <View style={{flex:1,minWidth:0,alignItems:"center",justifyContent:"center",marginHorizontal:compact?0:1}}><Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={label+": "+(level===0?"Sin acreditar":level===1?"Bronce":level===2?"Plata":"Oro")} style={{width:compact?50:"100%",maxWidth:"100%",alignItems:"center",justifyContent:"center",minHeight:compact?59:77,overflow:"visible"}}>
  <View style={{width:compact?43:"100%",height:compact?43:undefined,minHeight:compact?43:42,aspectRatio:1,alignItems:"center",justifyContent:"center",borderRadius:28,backgroundColor:jcardFloating.awardFill,shadowColor:jcardFloating.shadow,shadowOffset:{width:0,height:3},shadowOpacity:0.23,shadowRadius:5,elevation:4}}>
   <Svg width="100%" height="100%" viewBox="0 0 54 54" style={{position:"absolute"}}><Defs><LinearGradient id={"metal-"+label.replace(/[^a-zA-Z0-9]/g,"")} x1="0%" y1="0%" x2="100%" y2="100%"><Stop offset="0%" stopColor={level===3?BUSINESS_MEDAL_COLORS[0]:level===2?BUSINESS_MEDAL_COLORS[1]:level===1?BUSINESS_MEDAL_COLORS[2]:BUSINESS_MEDAL_COLORS[3]}/><Stop offset="24%" stopColor={level===3?BUSINESS_MEDAL_COLORS[4]:level===2?BUSINESS_MEDAL_COLORS[5]:level===1?BUSINESS_MEDAL_COLORS[6]:BUSINESS_MEDAL_COLORS[7]}/><Stop offset="53%" stopColor={level===3?BUSINESS_MEDAL_COLORS[8]:level===2?BUSINESS_MEDAL_COLORS[9]:level===1?BUSINESS_MEDAL_COLORS[10]:BUSINESS_MEDAL_COLORS[11]}/><Stop offset="77%" stopColor={level===3?BUSINESS_MEDAL_COLORS[12]:level===2?BUSINESS_MEDAL_COLORS[13]:level===1?BUSINESS_MEDAL_COLORS[14]:BUSINESS_MEDAL_COLORS[15]}/><Stop offset="100%" stopColor={level===3?BUSINESS_MEDAL_COLORS[16]:level===2?BUSINESS_MEDAL_COLORS[17]:level===1?BUSINESS_MEDAL_COLORS[18]:BUSINESS_MEDAL_COLORS[19]}/></LinearGradient></Defs><Path d={path} fill={"url(#metal-"+label.replace(/[^a-zA-Z0-9]/g,"")+")"} stroke={tone} strokeWidth="1.4"/><Circle cx="27" cy="27" r="21" fill="none" stroke={BUSINESS_MEDAL_COLORS[1]} strokeOpacity="0.65" strokeWidth="1.3"/><Circle cx="27" cy="27" r="19.2" fill={BUSINESS_BADGE_NEUTRAL.face} stroke={tone} strokeWidth="1.4"/><Path d="M 12 26 A 15 15 0 0 1 41 23" fill="none" stroke={BUSINESS_MEDAL_COLORS[1]} strokeOpacity="0.45" strokeWidth="2"/></Svg>
   <BusinessAwardGlyph label={label} icon={icon}/>
  </View>
  <Text numberOfLines={1} style={{fontSize:10,color:compact?jcardArtTokens("light").ink:(level===0?surface.pending:tone),letterSpacing:-1}}>{level===0?"☆☆☆":"★".repeat(level)+"☆".repeat(3-level)}</Text>
 </Pressable></View>;
}
/** Same medal art, thresholds and explanation in the card and About. */
export function BusinessAwards({business:b,theme,finish:providedFinish,standalone=false}:{business?:BusinessCardData;theme:ThemeName;finish?:ReturnType<typeof jcardTokens>;standalone?:boolean}){
 const t=jobeenTokens(theme);
 const finish=providedFinish??{...jcardTokens(theme,"base"),start:t.surface,end:t.surface,text:t.ink,secondary:t.ink2,line:t.line};
 const surface=businessInformationSurface(finish.start);
 const [selectedAward,setSelectedAward]=useState<{label:string;level:number}|null>(null);
 const voteLevel=(key:"service"|"prices"|"punctuality"|"professionalism"|"tenure")=>{const total=b?.excellenceReviewCount??0;const percent=total>0?100*(b?.excellenceVotes?.[key]??0)/total:0;return (b?.reviewCount??0)<20||!(b?.excellenceVotes?.[key]??0)?0:percent>63?3:percent>33?2:1;};
 const awards=[
  {label:"Atención al cliente",icon:"headset-outline" as const,level:voteLevel("service")},
  {label:"Precios competitivos",icon:"cash-outline" as const,level:voteLevel("prices")},
  {label:"Puntualidad",icon:"calendar-outline" as const,level:voteLevel("punctuality")},
  {label:"Profesionalismo",icon:"people-outline" as const,level:voteLevel("professionalism")},
  {label:"En el mercado",icon:"storefront-outline" as const,level:voteLevel("tenure")},
 ];

 if(standalone&&(!b||b.excellenceReviewCount===undefined||!b.excellenceVotes))return <Text style={{color:t.ink2,fontSize:12}}>Sellos no disponibles.</Text>;
 return <>
 <View style={{height:1,backgroundColor:finish.line,opacity:0.7,marginBottom:4}}/>
   <View style={{flexDirection:"row",alignItems:"center",justifyContent:"space-between",gap:5,height:64,flexShrink:0,paddingHorizontal:5,marginTop:0}}>
    {awards.map(a=><BusinessAward key={a.label} {...a} finish={finish} surface={surface} compact={standalone||theme==="light"} onPress={()=>setSelectedAward({label:a.label,level:a.level})}/>)}
   </View>
 <Modal visible={selectedAward!==null} transparent animationType="fade" onRequestClose={()=>setSelectedAward(null)}><View style={{flex:1,justifyContent:"center",padding:24,backgroundColor:jcardFloating.modalBackdrop}}><Pressable style={StyleSheet.absoluteFill} onPress={()=>setSelectedAward(null)} accessibilityLabel="Cerrar información"/><View style={{backgroundColor:finish.start,borderRadius:20,padding:22,borderWidth:1,borderColor:finish.line}}><View style={{flexDirection:"row",justifyContent:"space-between",alignItems:"center"}}><Text style={{fontSize:19,fontWeight:"800",color:finish.text,flex:1}}>{selectedAward?.label}</Text><Pressable onPress={()=>setSelectedAward(null)} accessibilityRole="button" accessibilityLabel="Cerrar"><Ionicons name="close-circle-outline" size={27} color={finish.text}/></Pressable></View><Text style={{fontSize:15,fontWeight:"700",color:finish.text,marginTop:12}}>{selectedAward?.level===3?"Oro":selectedAward?.level===2?"Plata":selectedAward?.level===1?"Bronce":"Sin color"}</Text><Text style={{fontSize:14,lineHeight:21,color:finish.secondary,marginTop:8}}>{selectedAward?.level===0?"Este negocio aún no reúne suficientes reseñas para obtener un sello de color. No significa que su servicio sea malo.":selectedAward?.level===1?"Bronce: los clientes han reconocido esta cualidad en sus reseñas.":selectedAward?.level===2?"Plata: una proporción importante de las reseñas reconoce esta cualidad.":"Oro: una proporción destacada de las reseñas reconoce esta cualidad."}</Text><Text style={{fontSize:12,lineHeight:18,color:finish.secondary,marginTop:12}}>Los sellos se calculan a partir de reseñas de usuarios y no son certificaciones profesionales de Jobin.</Text></View></View></Modal>
 </>;
}

const profileFaceStyles=StyleSheet.create({
 contactRow:{alignSelf:"flex-start",maxWidth:"100%",flexDirection:"row",alignItems:"center",minHeight:JOBEEN_CONTROL.touchTarget},
 contactIcon:{width:26,height:26,borderRadius:13,alignItems:"center",justifyContent:"center",flexShrink:0,marginRight:6},
});

function BusinessContactIcon({name,theme}:{name:"mail-outline"|"call-outline"|"location-outline";theme:ThemeName}){
 const colors=jobeenTokens(theme);
 return <View aria-hidden style={[profileFaceStyles.contactIcon,{backgroundColor:colors.yellow}]}>
  <Ionicons name={name} size={15} color={colors.onYellow}/>
 </View>;
}

function BusinessProfileLogo({uri,portrait,theme,onEdit}:{uri?:string|null;portrait:JCardProfilePortraitMetrics;theme:ThemeName;onEdit?:()=>void}){
 const [aspectRatio,setAspectRatio]=useState(1);
 const colors=jobeenTokens(theme);
 const {width,height,top,radius}=jcardBusinessLogoMetrics(portrait,aspectRatio);
 return <Pressable disabled={!onEdit} accessibilityRole={onEdit?"button":undefined} accessibilityLabel="Foto del negocio"
  onPress={event=>{event.stopPropagation();onEdit?.();}}
  style={{position:"absolute",top,right:portrait.inset,minWidth:JOBEEN_CONTROL.touchTarget,
   minHeight:JOBEEN_CONTROL.touchTarget,alignItems:"flex-end",zIndex:3}}>
   {uri?<Image source={{uri}} resizeMode="contain" style={{width,height,borderRadius:radius}}
    onLoad={({nativeEvent})=>{
     // Native returns a source size. React Native Web forwards the image load event.
     const browserImage=(nativeEvent as unknown as {target?:{naturalWidth:number;naturalHeight:number}}).target;
     const sourceWidth=nativeEvent.source?.width??browserImage?.naturalWidth;
     const sourceHeight=nativeEvent.source?.height??browserImage?.naturalHeight;
     if(sourceWidth&&sourceHeight)setAspectRatio(sourceWidth/sourceHeight);
    }}/>:<View style={{width,height,borderRadius:radius,backgroundColor:colors.cream,alignItems:"center",justifyContent:"center"}}>
    <Ionicons name="person-outline" size={27} color={colors.ink}/>
   </View>}
 </Pressable>;
}

export function BusinessFace({card,theme,appearance="original",contact,onShare,onSaveContact,canEditMedia=false,onEditMedia,visibility=DEFAULT_JCARD_VISIBILITY,awardsInAbout=false,profilePortrait,onProfileLayout}:{card:CardData;theme:ThemeName;appearance?:JCardPremiumBackgroundId;contact?:{email:string|null;phone:string|null};onShare?:()=>void;onSaveContact?:()=>void;canEditMedia?:boolean;onEditMedia?:(slot:"banner"|"avatar")=>void;visibility?:typeof DEFAULT_JCARD_VISIBILITY;awardsInAbout?:boolean;profilePortrait?:JCardProfilePortraitMetrics;onProfileLayout?:(event:LayoutChangeEvent)=>void}){
 const b=card.business;const jobeen=jcardArtTokens(theme);const premium=appearance==="original"?null:getPremiumBackground(appearance);const showDecorativeCurves=false;const finish={...jcardTokens(theme,jcardTier(b?.rating??null,b?.reviewCount??0)),start:premium?.base??jobeen.biz,end:premium?.base??jobeen.biz,text:premium?.ink??jobeen.ink,secondary:premium?.ink??jobeen.textSoft,line:premium?.line??jobeen.bizBorder,sealFill:jobeen.surface};
 const [showBusinessVerification,setShowBusinessVerification]=useState(false);
 const [artSize,setArtSize]=useState({width:0,height:0});
 const company=!!b?.name.trim();const businessName=Array.from((b?.name??"").trim()).slice(0,30).join("");const [businessNameWidth,setBusinessNameWidth]=useState(180);const nameFontSize=Math.max(14,Math.min(21,Math.floor(businessNameWidth/Math.max(8,theme==="light"?Math.ceil(businessName.length/2):businessName.length)*1.65)));const rating=displayedRating(b?.rating??null,b?.reviewCount??0);
 const reviewCount=b?.reviewCount??0;const ratingUnlocked=reviewCount>=10&&rating!==null;const year=Number(b?.opened);const years=Number.isInteger(year)&&year>1900&&year<=new Date().getFullYear()?new Date().getFullYear()-year:0;
 const category=b?.category?.trim()||(/hvac|aire acondicionado|climatiz|refrigeraci/i.test([card.role,...(b?.services??[])].join(" "))?"Climatización":b?.services?.[0]||"Servicios profesionales");
 const art=businessCategoryArt(category);
 const hvacCategory=/hvac|climatiz|aire acondicionado/i.test(category)&&!/refrigeraci/i.test(category);
 const refrigerationCategory=/refrigeraci/i.test(category)&&!/climatiz/i.test(category);
 const categoryIcon=hvacCategory?categoryGlyph("climate"):refrigerationCategory?categoryGlyph("refrigeration"):art.icon;
 const {fontScale}=useWindowDimensions();
 const profileNameSize=profilePortrait&&profilePortrait.cardWidth<jcardSurfaceMetrics.compactThreshold?14:15;
 const profileName=businessName||"Cargando negocio…";
 const identitySpace=profilePortrait?jcardProfileIdentitySpace(profilePortrait,profileName.length,profileNameSize,fontScale):undefined;
 const profilePadding=theme==="light"?10:14;
 const nameWidth=profilePortrait&&identitySpace
  ?profilePortrait.cardWidth-2*Math.max(profilePadding,identitySpace.paddingHorizontal)-20:0;
 const nameLineLength=Math.max(1,Math.floor(nameWidth/(profileNameSize*Math.max(1,fontScale)*0.55)));
 const displayedProfileName=company?wrapBusinessCardName(profileName,nameLineLength,true):profileName;
 const profileCategory=b?.category?.trim()||"Servicios profesionales";
 const businessContactInk=premium?finish.text:jobeen.ink;
 const businessIconInk=premium?finish.text:jobeen.ink;
 const contactRows=profilePortrait?<View style={{alignSelf:"center",width:"100%",maxWidth:320}}>
   {(visibility.business_show_email?(theme==="light"?[b?.email??b?.emailSecondary]:[b?.email,b?.emailSecondary]):[]).filter(Boolean).map((email,index)=>
     <Pressable key={index} accessibilityRole="link" accessibilityLabel={"Enviar correo a "+email}
      onPress={event=>{event.stopPropagation();void Linking.openURL("mailto:"+encodeURIComponent(email!)).catch(()=>{});}} style={profileFaceStyles.contactRow}>
       <BusinessContactIcon name="mail-outline" theme={theme}/>
       <Text style={{flexShrink:1,fontSize:12,color:businessContactInk}}>{email}</Text>
     </Pressable>)}
   {visibility.business_show_phone&&!!(b?.phone||b?.phoneSecondary)&&<View style={{flexDirection:"row",alignItems:"center"}}>
     <BusinessContactIcon name="call-outline" theme={theme}/>
     <View style={{flex:1,minWidth:0,flexDirection:"row",flexWrap:"wrap",columnGap:12}}>
       {[{number:b?.phone,label:b?.phoneLabel},{number:b?.phoneSecondary,label:b?.phoneSecondaryLabel}].filter(item=>item.number).map(({number,label},index)=>
         <Pressable key={index} accessibilityRole="link" accessibilityLabel={"Llamar al número "+number}
          onPress={event=>{event.stopPropagation();void Linking.openURL("tel:"+number!.replace(/[^+\d]/g,"")).catch(()=>{});}}
          style={{minWidth:JOBEEN_CONTROL.touchTarget,minHeight:JOBEEN_CONTROL.touchTarget,maxWidth:"100%",justifyContent:"center"}}>
           <Text style={{fontSize:12,color:businessContactInk}}>{label?label+" ":""}{number}</Text>
         </Pressable>)}
     </View>
     {theme==="light"&&<Pressable accessibilityRole="link" accessibilityLabel="Abrir WhatsApp del negocio"
      onPress={event=>{event.stopPropagation();void Linking.openURL("https://wa.me/"+(b?.phone||b?.phoneSecondary||"").replace(/\D/g,"")).catch(()=>{});}}
      style={{width:JOBEEN_CONTROL.touchTarget,height:JOBEEN_CONTROL.touchTarget,alignItems:"center",justifyContent:"center"}}>
       <Ionicons name="logo-whatsapp" size={19} color={businessIconInk}/>
     </Pressable>}
   </View>}
   {!!b?.location&&<Pressable accessibilityRole="link" accessibilityLabel={"Abrir ubicación en Google Maps: "+b.location}
    onPress={event=>{event.stopPropagation();void Linking.openURL("https://www.google.com/maps/search/?api=1&query="+encodeURIComponent(b.location!.trim())).catch(()=>Alert.alert("Google Maps","No se pudo abrir el mapa. Comprueba que tengas un navegador o Google Maps disponible."));}}
    style={profileFaceStyles.contactRow}>
     <BusinessContactIcon name="location-outline" theme={theme}/>
     <Text style={{flexShrink:1,fontSize:12,color:businessContactInk}}>{b.location}</Text>
   </Pressable>}
 </View>:<View style={{gap:theme==="light"?1:5,alignSelf:"stretch"}}>
     {(visibility.business_show_email?(theme==="light"?[b?.email??b?.emailSecondary]:[b?.email,b?.emailSecondary]):[]).filter(Boolean).map((email,i)=><Pressable key={"business-email"+i} accessibilityRole="link" accessibilityLabel={"Enviar correo a "+email} onPress={event=>{event.stopPropagation();void Linking.openURL("mailto:"+encodeURIComponent(email!)).catch(()=>{});}} style={{flexDirection:"row",alignItems:"center",gap:6,alignSelf:"flex-start",maxWidth:"100%",minHeight:44,paddingRight:5}}><View style={{width:theme==="light"?30:14,height:theme==="light"?30:14,borderRadius:15,backgroundColor:theme==="light"?jobeen.yellow:undefined,alignItems:"center",justifyContent:"center"}}><Ionicons name="mail-outline" size={14} color={businessIconInk}/></View><Text numberOfLines={1} ellipsizeMode="tail" style={{flexShrink:1,fontSize:11,color:businessContactInk}}>{email}</Text></Pressable>)}
     {visibility.business_show_phone&&!!(b?.phone||b?.phoneSecondary)&&<View style={{flexDirection:"row",alignItems:"center",gap:4,alignSelf:"stretch",minHeight:44}}><Pressable accessibilityRole="link" accessibilityLabel="Llamar al teléfono principal del negocio"
 onPress={event=>{event.stopPropagation();const primary=b?.phone||b?.phoneSecondary;if(primary)void Linking.openURL("tel:"+primary.replace(/[^+\d]/g,"")).catch(()=>{});}}
 style={{width:40,height:44,alignItems:"center",justifyContent:"center",flexShrink:0}}>
 <View style={{width:theme==="light"?30:14,height:theme==="light"?30:14,borderRadius:15,backgroundColor:theme==="light"?jobeen.yellow:undefined,alignItems:"center",justifyContent:"center"}}>
 <Ionicons name="call-outline" size={14} color={businessIconInk}/></View></Pressable>{[{number:b?.phone,label:b?.phoneLabel},{number:b?.phoneSecondary,label:b?.phoneSecondaryLabel}].filter(x=>!!x.number).map((item,i)=><View key={"business-phone"+i} style={{flex:1,minWidth:0,flexDirection:"row",alignItems:"center",gap:3}}>{i>0&&<View style={{height:16,width:1,backgroundColor:finish.line,marginHorizontal:2}}/>}<Pressable accessibilityRole="link" accessibilityLabel={"Llamar al número "+item.number} style={{alignSelf:"flex-start",maxWidth:"100%",minHeight:44,justifyContent:"center",paddingHorizontal:2}} onPress={event=>{event.stopPropagation();void Linking.openURL("tel:"+item.number!.replace(/[^+\d]/g,"")).catch(()=>{});}}><Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.84} style={{fontSize:10.5,color:businessContactInk}}>{item.label?item.label+" ":""}{item.number}</Text></Pressable></View>)}{theme==="light"&&!!(b?.phone||b?.phoneSecondary)&&<Pressable accessibilityRole="link" accessibilityLabel="Abrir WhatsApp del negocio" onPress={event=>{event.stopPropagation();void Linking.openURL("https://wa.me/"+(b?.phone||b?.phoneSecondary||"").replace(/\D/g,"")).catch(()=>{});}} style={{width:44,height:44,alignItems:"center",justifyContent:"center"}}><View style={{width:30,height:30,borderRadius:15,backgroundColor:jobeen.ink,alignItems:"center",justifyContent:"center"}}><Ionicons name="logo-whatsapp" size={17} color={jobeen.surface}/></View></Pressable>}</View>}
     {!!b?.location&&<Pressable accessibilityRole="link" accessibilityLabel={"Abrir ubicación en Google Maps: "+b.location} onPress={event=>{event.stopPropagation();void Linking.openURL("https://www.google.com/maps/search/?api=1&query="+encodeURIComponent(b.location!.trim())).catch(()=>Alert.alert("Google Maps","No se pudo abrir el mapa. Comprueba que tengas un navegador o Google Maps disponible."));}} style={{alignSelf:"flex-start",maxWidth:"100%",flexDirection:"row",alignItems:"center",gap:6,minHeight:44,paddingRight:3}}><View style={{width:theme==="light"?30:15,height:theme==="light"?30:15,borderRadius:15,backgroundColor:theme==="light"?jobeen.yellow:undefined,alignItems:"center",justifyContent:"center"}}><Ionicons name="location-outline" size={15} color={businessIconInk}/></View><Text numberOfLines={2} style={{flexShrink:1,flexGrow:0,fontSize:11,color:businessContactInk}}>{b.location}</Text></Pressable>}
   </View>;
 return <View onLayout={e=>{const {width,height}=e.nativeEvent.layout;setArtSize(prev=>prev.width===width&&prev.height===height?prev:{width,height});}} style={{flex:1,borderRadius:30,backgroundColor:finish.start,overflow:"hidden"}}>
  <Svg style={StyleSheet.absoluteFill} width="100%" height="100%" viewBox="0 0 400 650" preserveAspectRatio="none" pointerEvents="none">
   {showDecorativeCurves&&JCARD_LEFT_CURVES.map(({d,index:i})=><Path key={"left"+i} d={d} stroke={finish.text} strokeOpacity={0.12+(i%3)*0.018} strokeWidth={0.8} fill="none"/>)}
   {showDecorativeCurves&&JCARD_BOTTOM_CURVES.map(({d,index:i})=><Path key={"bottom"+i} d={d} stroke={finish.text} strokeOpacity={0.13+(i%4)*0.018} strokeWidth={0.8} fill="none"/>)}
   {showDecorativeCurves&&<Path d="M-20 420 C105 250 225 300 420 95" stroke={finish.text} strokeOpacity={0.12} strokeWidth="2" fill="none"/>}
  </Svg>

  {premium&&artSize.width>0&&<View pointerEvents="none" style={StyleSheet.absoluteFill}><JCardPremiumTexture id={appearance} width={artSize.width} height={artSize.height}/></View>}
  <View style={{flex:1,paddingHorizontal:0,paddingTop:0,paddingBottom:0,gap:0}}>
   <View style={{flex:1,marginTop:0,borderTopLeftRadius:26,borderTopRightRadius:26,backgroundColor:finish.start,overflow:"hidden",paddingHorizontal:profilePadding,paddingTop:profilePortrait?0:theme==="light"?14:16,paddingBottom:profilePortrait?0:theme==="light"?8:9,gap:theme==="light"?3:5,zIndex:2}}>
   {premium&&artSize.width>0&&<View pointerEvents="none" style={StyleSheet.absoluteFill}><JCardPremiumTexture id={appearance} width={artSize.width} height={artSize.height}/></View>}
   {theme==="light"&&appearance==="original"&&<JobeenHoneycomb color={jobeen.bizBorder} compact={artSize.width>0&&artSize.width<360}/>}

   {profilePortrait&&identitySpace?<View onLayout={onProfileLayout} style={{flexShrink:0,paddingBottom:8}}>
    <View style={{...identitySpace,paddingHorizontal:Math.max(0,identitySpace.paddingHorizontal-profilePadding)}}>
     <Pressable accessibilityRole="button" accessibilityLabel={profileName+", verificación de empresa"} onPress={()=>setShowBusinessVerification(true)}
      style={{minHeight:JOBEEN_CONTROL.touchTarget,flexDirection:"row",alignItems:"center",justifyContent:"center",gap:4}}>
       <Text textBreakStrategy="balanced" style={{flexShrink:1,textAlign:"center",fontSize:profileNameSize,fontWeight:"700",color:finish.text}}>{displayedProfileName}</Text>
       <Ionicons name={b?.licenseVerified?"checkmark-circle":"checkmark-circle-outline"} size={16}
        color={b?.licenseVerified?jcardCommon.verifiedBubble:jcardCommon.unverifiedBubble}/>
     </Pressable>
    </View>
    <View style={{alignItems:"center",gap:2,paddingHorizontal:2}}>
     <View style={{flexDirection:"row",alignItems:"center",justifyContent:"center",gap:4}}>
      <Ionicons name={categoryIcon} size={15} color={businessIconInk}/>
      <Text style={{flexShrink:1,textAlign:"center",fontSize:12,color:finish.secondary}}>{company?profileCategory:"JCard de negocio"}</Text>
     </View>
     <Text style={{fontSize:11,color:finish.secondary,textAlign:"center"}}>
      <Text style={{color:finish.text,fontWeight:"700"}}>
       <Text style={{color:jcardCommon.businessGold}}>★</Text> {ratingUnlocked?rating!.toFixed(1):"—"}
      </Text> · ({reviewCount} {reviewCount===1?"reseña":"reseñas"})
     </Text>
     {contactRows}
     {onSaveContact&&<Pressable accessibilityRole="button" accessibilityLabel="Guardar contacto del negocio" onPress={onSaveContact}
      style={{alignSelf:"center",width:JOBEEN_CONTROL.touchTarget,height:JOBEEN_CONTROL.touchTarget,alignItems:"center",justifyContent:"center"}}>
       <View style={{width:34,height:30,borderRadius:15,backgroundColor:jobeen.yellow,alignItems:"center",justifyContent:"center"}}>
        <Ionicons name="person-add-outline" size={16} color={jobeen.ink}/>
       </View>
     </Pressable>}
    </View>
   </View>:<>
   <View style={{flexDirection:"row",alignItems:"center",gap:9,marginTop:5,paddingRight:5}}>
    <Pressable disabled={!canEditMedia} accessibilityLabel="Foto del negocio" onPress={event=>{event.stopPropagation();onEditMedia?.("avatar");}} style={{width:64,height:70.4,borderRadius:14,backgroundColor:jobeen.surface,alignItems:"center",justifyContent:"center",overflow:"hidden",flexShrink:0}}>{b?.avatarUrl?<Image source={{uri:b.avatarUrl}} resizeMode="cover" style={{width:60,height:66,borderRadius:11}}/>:<Ionicons name="person-outline" size={27} color={businessIconInk}/>}</Pressable>
    <View style={{flex:1,minWidth:0,gap:3}}>
     <View style={{flexDirection:"row",alignItems:"center",gap:3}}><Text numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.7} style={{flexShrink:1,fontSize:15,lineHeight:18,fontWeight:"700",color:finish.text}}>{businessName?wrapBusinessCardName(businessName):"Cargando negocio…"}</Text><Pressable accessibilityRole="button" accessibilityLabel="Verificación de empresa" onPress={event=>{event.stopPropagation();setShowBusinessVerification(true);}} hitSlop={{top:7,bottom:7,right:6,left:0}} style={{width:18,height:20,alignItems:"center",justifyContent:"center",flexShrink:0}}><Ionicons name={b?.licenseVerified?"checkmark-circle":"checkmark-circle-outline"} size={16} color={b?.licenseVerified?jcardCommon.verifiedBubble:jcardCommon.unverifiedBubble}/></Pressable></View>
     <View style={{flexDirection:"row",alignItems:"center",gap:4}}><Ionicons name={categoryIcon} size={14} color={businessIconInk}/><Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8} style={{flexShrink:1,fontSize:12,color:finish.secondary}}>{company?category:"JCard de negocio"}</Text></View>
     <View style={{flexDirection:"row",alignItems:"center",gap:4}}><Text style={{fontSize:11,fontWeight:"700",color:finish.text}}><Text style={{color:jcardCommon.businessGold}}>★</Text> {ratingUnlocked?rating!.toFixed(1):"0.0"}</Text><Text numberOfLines={1} style={{fontSize:10,color:finish.secondary}}>· ({reviewCount} {reviewCount===1?"reseña":"reseñas"})</Text></View>
    </View>
   </View>

   {!!b?.services?.length&&<View style={{alignSelf:"stretch",paddingHorizontal:8,marginTop:3,marginBottom:1,paddingBottom:4,borderBottomWidth:1,borderBottomColor:finish.line,flexShrink:0}}><Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75} style={{fontSize:14,lineHeight:19,fontWeight:"500",color:finish.secondary}}>{b.services.filter(Boolean).join(" · ")}</Text></View>}
   <View style={{flex:1,minHeight:0,justifyContent:"space-evenly",paddingVertical:2,alignSelf:"stretch"}}>{contactRows}</View>
   {!awardsInAbout&&<BusinessAwards business={b} theme={theme} finish={finish}/>}
   </>}
   </View>
  </View>
 {!profilePortrait&&onSaveContact&&<Pressable accessibilityRole="button" accessibilityLabel="Guardar contacto del negocio" onPress={event=>{event.stopPropagation();onSaveContact();}} style={{position:"absolute",top:61,right:12,width:44,height:44,alignItems:"center",justifyContent:"center",zIndex:8}}><View style={{width:34,height:30,borderRadius:15,backgroundColor:jobeen.yellow,alignItems:"center",justifyContent:"center"}}>
   <Ionicons name="person-add-outline" size={16} color={jobeen.ink}/></View>
 </Pressable>}
 <Modal visible={showBusinessVerification} transparent animationType="fade" onRequestClose={()=>setShowBusinessVerification(false)}><View style={{flex:1,justifyContent:"center",padding:24,backgroundColor:jcardFloating.modalBackdrop}}><Pressable style={StyleSheet.absoluteFill} onPress={()=>setShowBusinessVerification(false)} accessibilityLabel="Cerrar información"/><View style={{backgroundColor:finish.start,borderRadius:20,padding:22,borderWidth:1,borderColor:finish.line}}><Text style={{fontSize:19,fontWeight:"800",color:finish.text}}>{b?.licenseVerified?"Empresa verificada":"Empresa sin verificar"}</Text><Text style={{fontSize:14,lineHeight:21,color:finish.secondary,marginTop:12}}>{b?.licenseVerified?"Esta empresa figura como verificada en Jobin. La insignia no garantiza la calidad del servicio ni sustituye la comprobación de licencias profesionales.":"Esta empresa todavía no figura como verificada en Jobin. La ausencia de la insignia no indica que sus servicios sean deficientes."}</Text><Pressable accessibilityRole="button" accessibilityLabel="Cerrar" onPress={()=>setShowBusinessVerification(false)} style={{minHeight:44,alignSelf:"flex-end",justifyContent:"center",marginTop:12}}><Text style={{fontSize:14,fontWeight:"700",color:finish.text}}>Cerrar</Text></Pressable></View></View></Modal>

 </View>;
}
export function JobinCard({card,previewTheme,onEditBusiness,onEditBusinessMedia,onEditPersonalPhoto,ownerId,showOwnerActions=false,initialSide="personal",employerLink,onDemoSaveContact,onActiveSideChange,ownerQuickActions,publicVisibility,publicScope,awardsInAbout=false,profileCoverScope,profileInset=0}:{card:CardData;previewTheme?:ThemeName;onEditBusiness?:()=>void;onEditBusinessMedia?:(slot:"banner"|"avatar")=>void;onEditPersonalPhoto?:()=>void;ownerId?:string;showOwnerActions?:boolean;initialSide?:"personal"|"business";employerLink?:{id:string;name:string;handle:string}|null;onDemoSaveContact?:()=>void;onActiveSideChange?:(side:"personal"|"business")=>void;ownerQuickActions?:{onPanel:()=>void;onLive:()=>void;liveLabel:string};publicVisibility?:JCardVisibility;publicScope?:MessageScope;awardsInAbout?:boolean;profileCoverScope?:MessageScope|null;profileInset?:number}){
 const {theme}=useTheme();const {colors}=useUi();const {width,fontScale}=useWindowDimensions();
 const [measuredCardWidth,setMeasuredCardWidth]=useState(0);
 const [contact,setContact]=useState<{email:string|null;phone:string|null;details?:PersonalContactDetails}>({email:null,phone:null});
 useFocusEffect(useCallback(()=>{
  let live=true;setContact({email:null,phone:null});
  if(!ownerId||publicVisibility?.personal_enabled===false)return()=>{live=false;};
  void(async()=>{try{const scope=await captureMessageScope(publicScope);const [value,details]=await Promise.all([loadPublicContact(ownerId,scope),loadVisiblePersonalContactDetails(ownerId,scope)]);await assertMessageScope(scope);if(live)setContact({...value,details});}catch{if(live)setContact({email:null,phone:null});}})();
  return()=>{live=false;setContact({email:null,phone:null});};
 },[ownerId,publicScope,publicVisibility?.personal_enabled]));
 const [appearance,setAppearance]=useState<JCardPremiumBackgroundId>("original");
 const [businessAppearance,setBusinessAppearance]=useState<JCardPremiumBackgroundId>("original");
 useFocusEffect(useCallback(()=>{
  let live=true;setAppearance("original");setBusinessAppearance("original");
  if(!ownerId||!showOwnerActions)return()=>{live=false;};
  void(async()=>{try{
   const scope=await captureMessageScope(publicScope);
   if(scope.owner!==ownerId||!live)return;
   const [personal,business]=await Promise.all([readJCardAppearance(ownerId,"personal",scope),readJCardAppearance(ownerId,"business",scope)]);
   await assertMessageScope(scope);
   if(live){setAppearance(personal);setBusinessAppearance(business);}
  }catch{/* Default appearance until verified. */}})();
  return()=>{live=false;setAppearance("original");setBusinessAppearance("original");};
 },[ownerId,showOwnerActions,publicScope]));
 const [loadedVisibility,setVisibility]=useState(DEFAULT_JCARD_VISIBILITY);
 const visibility=publicVisibility??loadedVisibility;
 useFocusEffect(useCallback(()=>{let live=true;if(ownerId&&!publicVisibility)void readJCardVisibility(ownerId).then(v=>{if(live)setVisibility(v);}).catch(()=>{});return()=>{live=false;};},[ownerId,publicVisibility]));
 const [back,setBack]=useState(initialSide==="business");
 const [shareSide,setShareSide]=useState<"personal"|"business"|null>(null);
  useEffect(()=>setBack(initialSide==="business"),[initialSide]);
 const canFlip=showOwnerActions||(visibility.personal_enabled&&visibility.business_enabled&&(!publicVisibility||!!card.business));
 const activeBusiness=!visibility.personal_enabled&&visibility.business_enabled;
 useEffect(()=>{onActiveSideChange?.(canFlip?(back?"business":"personal"):(activeBusiness?"business":"personal"));},[back,canFlip,activeBusiness,onActiveSideChange]);
 const cardTheme=previewTheme??theme;
 const cardColors=jobeenTokens(cardTheme);
 const surface=jcardSurfaceSize({screenWidth:width,measuredWidth:measuredCardWidth,fontScale,theme:cardTheme,
  profile:awardsInAbout,horizontalInset:awardsInAbout?profileInset:undefined});
 const profilePortrait=awardsInAbout?jcardProfilePortraitMetrics(surface.width):undefined;
 const showPersonal=showOwnerActions||visibility.personal_enabled;
 const showBusiness=showOwnerActions||visibility.business_enabled;
 const [personalHeight,setPersonalHeight]=useState(0);
 const [businessHeight,setBusinessHeight]=useState(0);
 const measurePersonal=useCallback((event:LayoutChangeEvent)=>setPersonalHeight(Math.ceil(event.nativeEvent.layout.height)+2),[]);
 const measureBusiness=useCallback((event:LayoutChangeEvent)=>setBusinessHeight(Math.ceil(event.nativeEvent.layout.height)),[]);
 // Measure the unshrunk content of both visible faces so wrapping cannot change the flip footprint.
 const cardHeight=profilePortrait?Math.max(surface.height,showPersonal?personalHeight:0,showBusiness?businessHeight:0):surface.height;
 useEffect(()=>{if(!canFlip)setBack(activeBusiness);},[canFlip,activeBusiness]);
 const savePersonal=()=>void presentJCardContact({name:card.name,phone:contact.details?.phone_primary||contact.details?.phone_secondary||contact.phone,email:contact.details?.email_primary||contact.details?.email_secondary||contact.email});
 const saveBusiness=()=>void presentJCardContact({name:card.business?.name?.trim()||card.name,phone:visibility.business_show_phone?(card.business?.phone||card.business?.phoneSecondary):null,email:visibility.business_show_email?(card.business?.email||card.business?.emailSecondary):null});
 const share=(side:"personal"|"business")=>setShareSide(side);
 const sideLink=(side:"personal"|"business")=>card.profileUrl+(card.profileUrl.includes("?")?"&":"?")+"card="+side;
 const sideLabel=(side:"personal"|"business")=>side==="business"?(card.business?.name?.trim()||card.name):card.name;
 return <>
  <JCardProfileLayers portrait={profilePortrait} cover={height=><JCardSharedCover target={ownerId} scope={profileCoverScope??publicScope} editable={showOwnerActions} height={height}/>}>
  <View pointerEvents="box-none" style={{width:"100%",paddingHorizontal:profilePortrait?profileInset:0}}>
  <View onLayout={event=>{
   const next=Math.round(event.nativeEvent.layout.width);
   if(next>0)setMeasuredCardWidth(previous=>previous!==next?next:previous);
  }} style={{width:"100%",maxWidth:jcardSurfaceMetrics.maxWidth,alignSelf:"center"}}>
   <BusinessCard3D height={cardHeight} topInset={profilePortrait?.overlap??0} enabled={canFlip} initialSide={initialSide} side={back?"business":"personal"}
     onSideChange={side=>setBack(side==="business")} shadowColor={jcardCommon.cardShadowColor}
     frontPortrait={profilePortrait&&(showOwnerActions||visibility.personal_enabled)?<Pressable disabled={!showOwnerActions||!onEditPersonalPhoto} accessibilityRole={showOwnerActions&&onEditPersonalPhoto?"button":undefined} accessibilityLabel="Foto de JCard personal" onPress={event=>{event.stopPropagation();onEditPersonalPhoto?.();}} style={{position:"absolute",top:0,left:profilePortrait.inset,width:profilePortrait.width,height:profilePortrait.height,borderRadius:profilePortrait.radius,overflow:"hidden",zIndex:3}}><Avatar uri={personalAvatarUrl(card.avatar)} name={card.name} size={profilePortrait.width} height={profilePortrait.height} shape="portrait" framed={false}/></Pressable>:undefined}
     backPortrait={profilePortrait&&(showOwnerActions||visibility.business_enabled)?
      <BusinessProfileLogo key={card.business?.avatarUrl} uri={card.business?.avatarUrl} portrait={profilePortrait} theme={cardTheme}
       onEdit={showOwnerActions&&onEditBusinessMedia?()=>onEditBusinessMedia("avatar"):undefined}/>:undefined}
     front={(showOwnerActions||visibility.personal_enabled)?<CardFace card={card} theme={cardTheme} profilePortrait={profilePortrait} onProfileLayout={measurePersonal} appearance={appearance} contact={contact} employerLink={employerLink} onEdit={()=>router.push("/professional")} onEditPhoto={showOwnerActions?onEditPersonalPhoto:undefined} onSaveContact={!profilePortrait&&!showOwnerActions?(onDemoSaveContact??(ownerId?savePersonal:undefined)):undefined} onShare={!showOwnerActions?()=>void share("personal"):undefined}/>:null}
     back={<View style={{height:cardHeight}}>{(showOwnerActions||visibility.business_enabled)&&<BusinessFace card={card} theme={cardTheme} appearance={businessAppearance} contact={contact} onSaveContact={!profilePortrait&&!showOwnerActions?(onDemoSaveContact??(ownerId?saveBusiness:undefined)):undefined} onShare={!showOwnerActions?()=>void share("business"):undefined} canEditMedia={showOwnerActions&&!!onEditBusinessMedia} onEditMedia={onEditBusinessMedia} onProfileLayout={measureBusiness} visibility={visibility} awardsInAbout={awardsInAbout} profilePortrait={profilePortrait}/>}</View>}
   />
   {showOwnerActions&&ownerQuickActions&&<View style={{flexDirection:"row",gap:8,paddingTop:10,alignItems:"stretch"}}>
     <Pressable accessibilityRole="button" accessibilityLabel="Panel" onPress={ownerQuickActions.onPanel} style={({pressed})=>({flex:1,minWidth:48,minHeight:JOBEEN_CONTROL.touchTarget,flexDirection:"row",alignItems:"center",justifyContent:"center",gap:5,paddingHorizontal:5,paddingVertical:10,borderRadius:JOBEEN_CONTROL.buttonRadius,backgroundColor:cardColors.ink,opacity:pressed?0.8:1})}>
       <Ionicons name="grid-outline" size={18} color={cardColors.surface}/><Text style={{flexShrink:1,textAlign:"center",color:cardColors.surface,fontWeight:"700"}}>Panel</Text>
     </Pressable>
     <Pressable accessibilityRole="button" accessibilityLabel={ownerQuickActions.liveLabel} onPress={ownerQuickActions.onLive} style={({pressed})=>({flex:1,minWidth:48,minHeight:JOBEEN_CONTROL.touchTarget,flexDirection:"row",alignItems:"center",justifyContent:"center",gap:5,paddingHorizontal:5,paddingVertical:10,borderRadius:JOBEEN_CONTROL.buttonRadius,backgroundColor:cardColors.yellow,opacity:pressed?0.8:1})}>
       <Ionicons name="radio-outline" size={18} color={cardColors.onYellow}/><Text style={{flexShrink:1,textAlign:"center",color:cardColors.onYellow,fontWeight:"700"}}>{ownerQuickActions.liveLabel}</Text>
     </Pressable>
     <Pressable accessibilityRole="button" accessibilityLabel={back?"Compartir JCard de negocio":"Compartir JCard personal"} onPress={()=>void share(back?"business":"personal")} style={({pressed})=>({width:JOBEEN_CONTROL.touchTarget,minHeight:JOBEEN_CONTROL.touchTarget,alignItems:"center",justifyContent:"center",borderRadius:JOBEEN_CONTROL.buttonRadius,borderWidth:1,borderColor:cardColors.outline,backgroundColor:cardColors.surface,opacity:pressed?0.8:1})}>
       <Ionicons name="share-social-outline" size={22} color={cardColors.ink}/>
     </Pressable>
    </View>}
    {showOwnerActions&&!ownerQuickActions&&<View style={{flexDirection:"row",gap:10,paddingTop:10}}>
    <Pressable accessibilityRole="button" accessibilityLabel={back?"Compartir JCard de negocio":"Compartir JCard personal"} onPress={()=>void share(back?"business":"personal")} style={{flex:1,flexDirection:"row",alignItems:"center",justifyContent:"center",gap:9,paddingVertical:13,borderRadius:12,backgroundColor:cardColors.ink}}>
      <Ionicons name="share-social-outline" size={20} color={cardColors.surface}/><Text style={{color:cardColors.surface,fontWeight:"700"}}>Compartir</Text>
    </Pressable>
    <Pressable accessibilityRole="button" accessibilityLabel="Editar JCard" onPress={()=>back?onEditBusiness?.():router.push("/professional")} style={{flex:1,flexDirection:"row",alignItems:"center",justifyContent:"center",gap:9,paddingVertical:13,borderRadius:12,borderWidth:1,borderColor:cardColors.yellow,backgroundColor:cardColors.cream}}>
      <Ionicons name="create-outline" size={20} color={cardColors.ink}/><Text style={{color:cardColors.ink,fontWeight:"700"}}>Editar JCard</Text>
    </Pressable>
   </View>}
  </View>
  </View>
  </JCardProfileLayers>
  <JCardShareSheet visible={shareSide!==null} onClose={()=>setShareSide(null)}
  label={sideLabel(shareSide??(back?"business":"personal"))}
  link={sideLink(shareSide??(back?"business":"personal"))} side={shareSide??(back?"business":"personal")} theme={cardTheme}/>
 </>;
}

