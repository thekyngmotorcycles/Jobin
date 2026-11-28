import {Ionicons} from "@expo/vector-icons";
import {Animated,Image,Linking,Pressable,ScrollView,Text,View,useWindowDimensions} from "react-native";
import {useCallback,useEffect,useRef,useState} from "react";
import {BottomSheet} from "./social-ui";
import {languageProgress} from "../lib/profile-progress";
import {profileProgressColors} from "../theme/profile-progress";
import {useReducedMotion} from "react-native-reanimated";
import type {ReactNode,ComponentProps,Ref} from "react";
import {ProfileFollowCounts,type ProfileContactsHandle} from "./ProfileFollowCounts";
import {MediaThumbnail} from "./MediaThumbnail";
import {useTheme} from "../state/ThemeProvider";
import {jobeenTokens} from "../theme/jobeen";
import {useRoyalHiveTypography} from "../theme/ProfileTypographyScope";
import {JOBEEN_CONTROL} from "../theme/control-metrics";
import {jcardSurfaceMetrics} from "../theme/jcard";
import type {BusinessCardData,CardData} from "../lib/jcard";
import {LanguageRing, languageLabel} from "./LanguageRing";
import {BusinessAwards} from "./JobinCard";
import {readBusinessExcellence} from "../lib/jcard-cloud";
import {assertMessageScope,captureMessageScope,type MessageScope} from "../lib/message-session";
import {useFocusEffect} from "expo-router";
import {loadVisiblePersonalContactDetails,type PersonalContactDetails} from "../lib/jcard-contact";
import {personalProfileContactRows} from "../lib/jcard-profile-contacts";

export type ProfileSection="grid"|"jcards"|"cv"|"videos"|"live";
const tabs=[
 {id:"cv",label:"Acerca de"},
 {id:"grid",label:"Todo"},
 {id:"live",label:"En vivo"},
 {id:"videos",label:"Videos"},
 {id:"jcards",label:"JCards"}
] as const;
const visitorTabs=tabs.filter(tab=>tab.id!=="jcards");

/** Opaque full-width accordion sheet with one elevated, moving selection capsule. */
export function ProfileSectionTabs({section,onSelect,pinned=false,showPrivateJCards=false}:{section:ProfileSection;onSelect:(section:ProfileSection)=>void;pinned?:boolean;showPrivateJCards?:boolean}){
 const {theme}=useTheme();const jt=jobeenTokens(theme);
 const {width,fontScale}=useWindowDimensions();const reducedMotion=useReducedMotion();
 const {type:JOBEEN_TYPE,lineHeight:JOBEEN_LINE_HEIGHT,adaptive}=useRoyalHiveTypography();
 const [viewportWidth,setViewportWidth]=useState(width);
 const compact=viewportWidth<380;
 const scroller=useRef<ScrollView|null>(null);
 const [layouts,setLayouts]=useState<Partial<Record<ProfileSection,{x:number;width:number}>>>({});
 const position=useRef(new Animated.Value(0)).current;
 const pillWidth=useRef(new Animated.Value(0)).current;
 const initialized=useRef(false);
 const previousSection=useRef<ProfileSection|null>(null);
 const layout=layouts[section];
 const track=jt.surface;
 const active=jt.ink,activeInk=jt.surface;
 useEffect(()=>{
  if(!layout)return;
  const changed=previousSection.current!==section;
  if(!initialized.current||reducedMotion||!changed){
   position.setValue(layout.x);pillWidth.setValue(layout.width);initialized.current=true;
  }else{
   const transition=Animated.parallel([
    Animated.timing(position,{toValue:layout.x,duration:230,useNativeDriver:false}),
    Animated.timing(pillWidth,{toValue:layout.width,duration:230,useNativeDriver:false})
   ]);
   transition.start();
   previousSection.current=section;
   scroller.current?.scrollTo({x:Math.max(0,layout.x+layout.width/2-viewportWidth/2),animated:!reducedMotion});
   return()=>transition.stop();
  }
  previousSection.current=section;
  scroller.current?.scrollTo({x:Math.max(0,layout.x+layout.width/2-viewportWidth/2),animated:!reducedMotion});
 },[layout,section,viewportWidth,reducedMotion,position,pillWidth]);
 return <View style={{width:"100%",backgroundColor:jt.bg,zIndex:5,paddingHorizontal:compact?5:10,paddingTop:7,paddingBottom:8}}>
  <View style={{backgroundColor:track,borderColor:jt.line,borderWidth:1,borderRadius:28,shadowColor:jt.floatingCardShadow,shadowOffset:{width:0,height:pinned?4:3},shadowOpacity:theme==="light"?0.16:0.4,shadowRadius:7,elevation:5}}>
   <ScrollView horizontal showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="always"
    onLayout={event=>setViewportWidth(event.nativeEvent.layout.width)} ref={scroller} contentContainerStyle={{flexGrow:1,alignItems:"center",paddingHorizontal:3,paddingVertical:3}}>
    {!!layout&&<Animated.View pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={{position:"absolute",top:3,bottom:3,left:0,width:pillWidth,borderRadius:24,backgroundColor:active,transform:[{translateX:position}]}}/>}
    {(showPrivateJCards?tabs:visitorTabs).map(tab=>{
     const selected=section===tab.id;
     return <Pressable key={tab.id} accessibilityRole="tab" accessibilityLabel={tab.label}
       accessibilityState={{selected}} aria-selected={selected} onPress={()=>onSelect(tab.id)}
       onLayout={event=>{const {x,width}=event.nativeEvent.layout;setLayouts(current=>current[tab.id]?.x===x&&current[tab.id]?.width===width?current:{...current,[tab.id]:{x,width}});}}
       style={{minHeight:JOBEEN_CONTROL.touchTarget,minWidth:JOBEEN_CONTROL.touchTarget,flexGrow:1,flexShrink:0,
        paddingHorizontal:compact?3:7,alignItems:"center",justifyContent:"center",borderRadius:24,backgroundColor:!layout&&selected?active:undefined}}>
      <Text style={{fontSize:adaptive?JOBEEN_TYPE.segmented:compact&&fontScale<=1.15?JOBEEN_TYPE.input-2:JOBEEN_TYPE.input-1,...(adaptive?{lineHeight:JOBEEN_LINE_HEIGHT.segmented}:{}),fontWeight:adaptive&&!selected?"500":"600",color:selected?activeInk:jt.ink,textAlign:"center"}}>{tab.label}</Text>
     </Pressable>;
    })}
   </ScrollView>
  </View>
 </View>;
}


export type ProfileAboutSide="personal"|"business";

/** Controlled selector: the profile uses the same authorized side for About and the rotating JCard. */
export function ProfileAboutSelector({side,onSelect,personalAvailable=true,businessAvailable=true}:{side:ProfileAboutSide;onSelect:(side:ProfileAboutSide)=>void;personalAvailable?:boolean;businessAvailable?:boolean}){
 const {theme}=useTheme(),jt=jobeenTokens(theme),reducedMotion=useReducedMotion();
 const {type:JOBEEN_TYPE,lineHeight:JOBEEN_LINE_HEIGHT,adaptive}=useRoyalHiveTypography();
 const [width,setWidth]=useState(0);
 const position=useRef(new Animated.Value(side==="business"?1:0)).current;
 const destination=side==="business"?1:0;
 useEffect(()=>{
  if(reducedMotion||!width){position.setValue(destination);return;}
  const transition=Animated.timing(position,{toValue:destination,duration:180,useNativeDriver:true});
  transition.start();return()=>transition.stop();
 },[destination,position,reducedMotion,width]);
 if(!personalAvailable||!businessAvailable)return null;
 const half=Math.max(0,(width-8)/2);
 return <View accessibilityRole="tablist" onLayout={event=>setWidth(Math.round(event.nativeEvent.layout.width))}
  style={{flexDirection:"row",padding:4,minHeight:JOBEEN_CONTROL.touchTarget+8,borderRadius:28,backgroundColor:jt.surface,borderWidth:1,borderColor:jt.line}}>
  {half>0&&<Animated.View pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants"
   style={{position:"absolute",left:4,top:4,bottom:4,width:half,borderRadius:24,backgroundColor:jt.ink,transform:[{translateX:position.interpolate({inputRange:[0,1],outputRange:[0,half]})}]}}/>}
  {(["personal","business"] as const).map(option=><Pressable key={option} accessibilityRole="tab" accessibilityState={{selected:side===option}}
   onPress={()=>onSelect(option)} style={{flex:1,minHeight:JOBEEN_CONTROL.touchTarget,alignItems:"center",justifyContent:"center",borderRadius:24,backgroundColor:half===0&&side===option?jt.ink:undefined}}>
   <Text numberOfLines={adaptive?undefined:1} adjustsFontSizeToFit={!adaptive} minimumFontScale={0.85} style={{fontSize:adaptive?JOBEEN_TYPE.segmented:JOBEEN_TYPE.input,...(adaptive?{lineHeight:JOBEEN_LINE_HEIGHT.segmented}:{}),fontWeight:adaptive?(side===option?"600":"500"):(side===option?"700":"600"),color:side===option?jt.surface:jt.ink}}>{option==="personal"?"Personal":"Negocio"}</Text>
  </Pressable>)}
 </View>;
}

/** Only manually published contact fields; no private profile or auth fallback. */
export function ProfilePersonalContact({target,scope}:{target:string;scope?:MessageScope|null}){
 const {theme}=useTheme(),jt=jobeenTokens(theme);
 const {type:JOBEEN_TYPE,lineHeight:JOBEEN_LINE_HEIGHT,adaptive}=useRoyalHiveTypography();
 const [loaded,setLoaded]=useState<{target:string;scope:MessageScope;details:PersonalContactDetails}|null>(null);
 useFocusEffect(useCallback(()=>{
  let active=true;setLoaded(null);
  if(!target||!scope)return()=>{active=false;};
  void(async()=>{try{
   const origin=await captureMessageScope(scope);if(!active)return;
   const details=await loadVisiblePersonalContactDetails(target,origin);
   await assertMessageScope(origin);
   if(active)setLoaded({target,scope:origin,details});
  }catch{/* Fail closed; do not substitute private contact information. */}})();
  return()=>{active=false;setLoaded(null);};
 },[target,scope?.owner,scope?.session]));
 const current=loaded&&loaded.target===target&&loaded.scope.owner===scope?.owner&&loaded.scope.session===scope?.session?loaded.details:null;
 const rows=current?personalProfileContactRows(current):[];
 if(!rows.length)return null;
 return <View style={{gap:6,padding:14,borderWidth:1,borderColor:jt.line,borderRadius:14,backgroundColor:jt.surface}}>
  <Text accessibilityRole="header" style={{fontSize:adaptive?JOBEEN_TYPE.sectionTitle:JOBEEN_TYPE.input,...(adaptive?{lineHeight:JOBEEN_LINE_HEIGHT.sectionTitle}:{}),fontWeight:adaptive?"600":"700",color:jt.ink}}>Información personal</Text>
  {rows.map(row=><Pressable key={row.key} accessibilityRole={row.uri?"link":undefined} accessibilityLabel={row.label+": "+row.value}
   disabled={!row.uri} onPress={()=>{if(row.uri)void Linking.openURL(row.uri).catch(()=>{});}}
   style={{flexDirection:"row",alignItems:"center",gap:10,minHeight:JOBEEN_CONTROL.touchTarget,paddingVertical:5}}>
   <Ionicons name={row.kind==="email"?"mail-outline":"call-outline"} size={21} color={jt.ink}/>
   <View style={{flex:1,minWidth:0,gap:2}}>
    <Text style={{color:jt.ink2,fontSize:adaptive?JOBEEN_TYPE.micro:11}}>{row.label}</Text>
    <Text selectable={!row.uri} style={{color:jt.ink,fontSize:JOBEEN_TYPE.body,...(adaptive?{lineHeight:JOBEEN_LINE_HEIGHT.body}:{})}}>{row.value}</Text>
   </View>
  </Pressable>)}
 </View>;
}

export function ProfilePersonalLanguages({languages,own=false}:{languages:CardData["languages"];own?:boolean}){
 const {theme}=useTheme(),jt=jobeenTokens(theme);
 const {type:JOBEEN_TYPE,lineHeight:JOBEEN_LINE_HEIGHT,adaptive}=useRoyalHiveTypography();
 const [learning,setLearning]=useState<string|null>(null);
 const current=own?languages.find(l=>l.name===learning&&languageProgress(l.fluency)<100):undefined;
 if(!languages.length)return null;
 const {gold,blue}=profileProgressColors(theme);
 return <View style={{gap:12,padding:14,borderWidth:1,borderColor:jt.line,borderRadius:14,backgroundColor:jt.surface}}>
  <Text accessibilityRole="header" style={{fontSize:JOBEEN_TYPE.sectionTitle,lineHeight:JOBEEN_LINE_HEIGHT.sectionTitle,fontWeight:adaptive?"600":"700",color:jt.ink}}>Idiomas</Text>
  {languages.map(({name,fluency},index)=>{
   const percent=languageProgress(fluency),complete=percent===100,fill=complete?gold:blue;
   return <View key={name+index} style={{flexDirection:"row",alignItems:"flex-start",gap:9,minHeight:JOBEEN_CONTROL.touchTarget}}>
    <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
     <LanguageRing name={name} value={percent} color={jt.ink} track={jt.line} size={32} accentColor={complete?gold:blue}/>
    </View>
    <View style={{flex:1,minWidth:0,gap:6}}>
     <View style={{flexDirection:"row",alignItems:"center",gap:6}}>
      <Text style={{flex:1,minWidth:0,fontSize:JOBEEN_TYPE.body,...(adaptive?{lineHeight:JOBEEN_LINE_HEIGHT.body}:{}),fontWeight:"600",color:jt.ink}}>{name}</Text>
      {complete&&<Ionicons name="ribbon-outline" size={17} color={gold} accessibilityLabel="Nivel declarado completo"/>}
      <Text style={{fontWeight:adaptive?"600":"700",color:jt.ink,fontSize:JOBEEN_TYPE.body}}>{percent}%</Text>
     </View>
     <View accessible accessibilityRole="progressbar" accessibilityLabel={name+", dominio declarado"} accessibilityValue={{min:0,max:100,now:percent}} style={{height:8,borderRadius:8,overflow:"hidden",backgroundColor:jt.line}}>
      <View style={{height:"100%",width:`${percent}%`,backgroundColor:fill,borderRadius:8}}/>
     </View>
     <Text style={{fontSize:JOBEEN_TYPE.caption,...(adaptive?{lineHeight:JOBEEN_LINE_HEIGHT.caption}:{}),color:jt.ink2}}>{languageLabel(percent)} · Nivel declarado</Text>
     {own&&!complete&&<Pressable accessibilityRole="button" accessibilityLabel={"Seguir avanzando en "+name} onPress={()=>setLearning(name)} style={{minHeight:JOBEEN_CONTROL.touchTarget,flexDirection:"row",alignItems:"center",justifyContent:"flex-end",gap:4}}>
      <Text style={{fontSize:adaptive?JOBEEN_TYPE.action:JOBEEN_TYPE.secondary,...(adaptive?{lineHeight:JOBEEN_LINE_HEIGHT.action}:{}),fontWeight:adaptive?"500":"600",color:blue}}>Seguir avanzando</Text><Ionicons name="arrow-forward" size={16} color={blue}/>
     </Pressable>}
    </View>
   </View>;
  })}
  <BottomSheet visible={!!current} title={current?"Seguir avanzando · "+current.name:"Seguir avanzando"} onClose={()=>setLearning(null)}>
   {!!current&&<View style={{gap:12}}>
    <Text style={{color:jt.ink,fontWeight:"600"}}>Tu nivel declarado: {languageProgress(current.fluency)}%</Text>
    <Text style={{color:jt.ink2}}>Practica comprensión, conversación, lectura y vocabulario de tu profesión. Actualiza tu nivel en Mi perfil cuando hayas mejorado; completar la barra no acredita un certificado.</Text>
    <Text style={{color:jt.ink2}}>Los cursos de idiomas de JAcademy todavía no están disponibles.</Text>
   </View>}
  </BottomSheet>
 </View>;
}

/** Business fields come from the authorized face. Review aggregates load only here. */
export function ProfileBusinessAbout({business,onEdit,target,scope}:{business?:BusinessCardData|null;onEdit?:()=>void;target?:string;scope?:MessageScope|null}){
 const {theme}=useTheme(),jt=jobeenTokens(theme);
 const {type:JOBEEN_TYPE,lineHeight:JOBEEN_LINE_HEIGHT,adaptive}=useRoyalHiveTypography();
 const [awardState,setAwardState]=useState<{target:string;scope:MessageScope;data:Awaited<ReturnType<typeof readBusinessExcellence>>}|null>(null);
 const [awardLoading,setAwardLoading]=useState(false);
 useFocusEffect(useCallback(()=>{
  let active=true;setAwardState(null);setAwardLoading(false);
  if(!target||!scope||!business?.name.trim())return()=>{active=false;};
  setAwardLoading(true);
  void(async()=>{try{
   const origin=await captureMessageScope(scope);if(!active)return;
   const data=await readBusinessExcellence(target,origin);await assertMessageScope(origin);
   if(active)setAwardState({target,scope:origin,data});
  }catch{/* Unavailable must not become zero medals. */}finally{if(active)setAwardLoading(false);}})();
  return()=>{active=false;setAwardState(null);setAwardLoading(false);};
 },[target,scope?.owner,scope?.session,business?.name]));
 const aggregate=awardState&&awardState.target===target&&awardState.scope.owner===scope?.owner&&awardState.scope.session===scope?.session?awardState.data:null;
 const services=business?.services?.map(service=>service.trim()).filter(Boolean)??[];
 return <View style={{gap:12,padding:14,borderWidth:1,borderColor:jt.line,borderRadius:14,backgroundColor:jt.surface}}>
  {!!business?.name.trim()&&<Text style={{fontWeight:adaptive?"600":"700",fontSize:adaptive?JOBEEN_TYPE.sectionTitle:JOBEEN_TYPE.input,...(adaptive?{lineHeight:JOBEEN_LINE_HEIGHT.sectionTitle}:{}),color:jt.ink}}>{business.name}</Text>}
  {!!business?.category?.trim()&&<Text style={{color:jt.ink2,fontSize:JOBEEN_TYPE.body,...(adaptive?{lineHeight:JOBEEN_LINE_HEIGHT.body}:{})}}>{business.category}</Text>}
  {services.length>0&&<View style={{gap:6}}><Text style={{color:jt.ink,fontWeight:adaptive?"600":"700",...(adaptive?{fontSize:JOBEEN_TYPE.sectionTitle,lineHeight:JOBEEN_LINE_HEIGHT.sectionTitle}:{})}}>Servicios</Text><View style={{flexDirection:"row",flexWrap:"wrap",gap:6}}>
   {services.map((service,index)=><View key={index} style={{maxWidth:"100%",paddingHorizontal:10,paddingVertical:7,borderRadius:14,borderWidth:1,borderColor:jt.line}}><Text style={{color:jt.ink,...(adaptive?{fontSize:JOBEEN_TYPE.body,lineHeight:JOBEEN_LINE_HEIGHT.body}:{})}}>{service}</Text></View>)}
  </View></View>}
  {!business?.name.trim()&&!services.length&&<Text style={{color:jt.ink2}}>Información del negocio no disponible.</Text>}
  {!!business?.name.trim()&&<View style={{gap:8}}><Text style={{color:jt.ink,fontWeight:adaptive?"600":"700",...(adaptive?{fontSize:JOBEEN_TYPE.sectionTitle,lineHeight:JOBEEN_LINE_HEIGHT.sectionTitle}:{})}}>Sellos del negocio</Text>{awardLoading?<Text accessibilityLiveRegion="polite" style={{color:jt.ink2}}>Cargando sellos…</Text>:<BusinessAwards theme={theme} standalone business={aggregate?{...business,...aggregate,reviewCount:aggregate.excellenceReviewCount}:undefined}/>}</View>}
  {onEdit&&<Pressable accessibilityRole="button" onPress={onEdit} style={{minHeight:JOBEEN_CONTROL.touchTarget,justifyContent:"center",alignItems:"center",borderRadius:JOBEEN_CONTROL.buttonRadius,borderWidth:1,borderColor:jt.outline}}><Text style={{color:jt.ink,fontWeight:adaptive?"500":"700",...(adaptive?{fontSize:JOBEEN_TYPE.action,lineHeight:JOBEEN_LINE_HEIGHT.action}:{})}}>Editar negocio</Text></Pressable>}
 </View>;
}

export type ProfileTile={id:string;title:string;thumbnail?:string|null;views?:number|null;onPress?:()=>void;kind?:"photos"|"video"|"live"|"text";photoCount?:number;onOptions?:()=>void};
export function ProfileMediaGrid({items,emptyMessage}:{items:ProfileTile[];emptyMessage?:string}){
 const {theme}=useTheme();const jt=jobeenTokens(theme);
 return <View style={{position:"relative",flexDirection:"row",flexWrap:"wrap"}}>
  {items.map((item,index)=>{
   const typeIcon:ComponentProps<typeof Ionicons>["name"]|null=item.kind==="photos"?(item.photoCount??0)>1?"copy-outline":"image-outline":
    item.kind==="video"?"play-outline":item.kind==="live"?"radio-outline":item.kind==="text"?"document-text-outline":null;
   return <Pressable key={item.id} disabled={!item.onPress} accessibilityRole={item.onPress?"button":undefined}
     accessibilityLabel={item.title+(item.kind?" · "+item.kind:"")} onPress={item.onPress} style={{width:"33.33%",padding:1.5}}>
    <View style={{aspectRatio:0.82,borderRadius:7,overflow:"hidden",backgroundColor:[jt.videoTile1,jt.videoTile2,jt.videoTile3][index%3]}}>
     {item.kind==="text"?<View style={{flex:1,justifyContent:"center",padding:8}}>
       <Text numberOfLines={5} style={{color:jt.ink,fontSize:11,fontWeight:"500"}}>{item.title}</Text>
      </View>:item.kind==="photos"&&item.thumbnail?
       <Image source={{uri:item.thumbnail}} resizeMode="cover" accessibilityLabel={item.title} style={{width:"100%",height:"100%"}}/>:
       item.thumbnail?<MediaThumbnail uri={item.thumbnail} label={item.title}/>:
       <View style={{flex:1,alignItems:"center",justifyContent:"center",padding:8,gap:5}}>
        <Ionicons name={typeIcon??"image-outline"} size={26} color={jt.ink2}/>
        <Text numberOfLines={3} style={{color:jt.ink2,fontSize:10,textAlign:"center"}}>{item.title}</Text>
       </View>}
     {!!typeIcon&&<View style={{position:"absolute",right:5,top:5,alignItems:"center",justifyContent:"center",width:27,height:27,borderRadius:8,backgroundColor:jt.videoViewsOverlay}}>
       <Ionicons name={typeIcon} size={17} color={jt.videoViewsText}/>
      </View>}
     {item.onOptions&&<Pressable accessibilityRole="button" accessibilityLabel={"Opciones de "+item.title}
       onPress={event=>{event.stopPropagation();item.onOptions?.();}} style={{position:"absolute",bottom:4,right:4,width:44,height:44,alignItems:"center",justifyContent:"center"}}>
       <View style={{width:32,height:32,borderRadius:16,backgroundColor:jt.videoViewsOverlay,alignItems:"center",justifyContent:"center"}}>
        <Ionicons name="ellipsis-horizontal" size={20} color={jt.videoViewsText}/>
       </View>
      </Pressable>}
     {typeof item.views==="number"&&<View style={{position:"absolute",bottom:6,left:6,flexDirection:"row",alignItems:"center",gap:4,backgroundColor:jt.videoViewsOverlay,paddingHorizontal:6,paddingVertical:3,borderRadius:6}}>
       <Ionicons name="play" size={12} color={jt.videoViewsText}/>
       <Text style={{fontSize:12,fontWeight:"700",color:jt.videoViewsText}}>{new Intl.NumberFormat("es",{notation:"compact",maximumFractionDigits:1}).format(item.views)}</Text>
      </View>}
    </View>
   </Pressable>;
  })}
  {!items.length&&!!emptyMessage&&<Text style={{color:jt.ink2,textAlign:"center",paddingVertical:24,width:"100%"}}>{emptyMessage}</Text>}
 </View>;
}

/** Hero moves out of view while ProfileSectionTabs remain pinned. */
export function ProfileIdentityHeader({card,actions,trust,profileUserId,contactsMenuRef,countsInCard=false,expectedScope,actionsInset=0}:{
 card:ReactNode;actions?:ReactNode;trust?:ReactNode;profileUserId?:string;contactsMenuRef?:Ref<ProfileContactsHandle>;countsInCard?:boolean;expectedScope?:MessageScope|null;actionsInset?:number;
}){
 return <View style={{gap:actionsInset>0?10:14}}>
  {countsInCard&&profileUserId?<ProfileFollowCounts userId={profileUserId} contactsMenuRef={contactsMenuRef} expectedScope={expectedScope} countsInCard>{card}</ProfileFollowCounts>:<>{card}{!!profileUserId&&<ProfileFollowCounts userId={profileUserId} contactsMenuRef={contactsMenuRef}/>}</>}
  {actions&&actionsInset>0?<View style={{width:"100%",maxWidth:jcardSurfaceMetrics.maxWidth+2*actionsInset,alignSelf:"center",paddingHorizontal:actionsInset}}>{actions}</View>:actions}
  {trust}
 </View>;
}

/** Compatibility wrapper for non-sticky presentations. */
export function UserProfileContent({
 card,actions,trust,profileUserId,section,onSelect,children
}:{
 card:ReactNode;actions?:ReactNode;trust?:ReactNode;profileUserId?:string;
 section:ProfileSection;onSelect:(section:ProfileSection)=>void;children?:ReactNode;
}){
 return <View style={{gap:14}}>
  <ProfileIdentityHeader card={card} actions={actions} trust={trust} profileUserId={profileUserId}/>
  <ProfileSectionTabs section={section} onSelect={onSelect}/>
  {children}
 </View>;
}
