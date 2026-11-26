import {Ionicons} from "@expo/vector-icons";
import {Animated,Image,Pressable,ScrollView,Text,View,useWindowDimensions} from "react-native";
import {useCallback,useEffect,useRef,useState} from "react";
import {useReducedMotion} from "react-native-reanimated";
import type {ReactNode,ComponentProps,Ref} from "react";
import {ProfileFollowCounts,type ProfileContactsHandle} from "./ProfileFollowCounts";
import {MediaThumbnail} from "./MediaThumbnail";
import {useTheme} from "../state/ThemeProvider";
import {jobeenTokens} from "../theme/jobeen";
import {JOBEEN_TYPE} from "../theme/typography";
import {JOBEEN_CONTROL} from "../theme/control-metrics";
import {jcardSurfaceMetrics} from "../theme/jcard";
import type {BusinessCardData,CardData} from "../lib/jcard";
import {LanguageRing, languageLabel} from "./LanguageRing";
import {BusinessAwards} from "./JobinCard";
import {readBusinessExcellence} from "../lib/jcard-cloud";
import {assertMessageScope,captureMessageScope,type MessageScope} from "../lib/message-session";
import {useFocusEffect} from "expo-router";

export type ProfileSection="grid"|"jcards"|"cv"|"videos"|"live";
const tabs=[
 {id:"cv",label:"Acerca de"},
 {id:"grid",label:"Todo"},
 {id:"live",label:"En vivo"},
 {id:"videos",label:"Videos"},
 {id:"jcards",label:"JCards"}
] as const;
const visitorTabs=tabs.filter(tab=>tab.id!=="jcards");

/** Accessible horizontally scrollable tabs, pinned by the parent ScrollView. */
export function ProfileSectionTabs({section,onSelect,pinned=false,showPrivateJCards=false}:{section:ProfileSection;onSelect:(section:ProfileSection)=>void;pinned?:boolean;showPrivateJCards?:boolean}){
 const {theme}=useTheme();const jt=jobeenTokens(theme);
 const {width}=useWindowDimensions();const reducedMotion=useReducedMotion();
 const [viewportWidth,setViewportWidth]=useState(width);
 const compact=viewportWidth<380;
 const scroller=useRef<ScrollView|null>(null);
 const tabLayouts=useRef<Partial<Record<ProfileSection,{x:number;width:number}>>>({});
 const scrollToSection=useCallback((id:ProfileSection)=>{
  const layout=tabLayouts.current[id];
  if(layout)scroller.current?.scrollTo({x:Math.max(0,layout.x+layout.width/2-viewportWidth/2),animated:!reducedMotion});
 },[viewportWidth,reducedMotion]);
 useEffect(()=>{scrollToSection(section);},[section,scrollToSection]);
 return <View style={{backgroundColor:jt.bg,borderBottomWidth:1,borderBottomColor:jt.line,
  elevation:pinned?3:0,shadowColor:jt.ink,shadowOffset:{width:0,height:2},shadowOpacity:pinned?0.09:0,
  shadowRadius:pinned?5:0,zIndex:5}}>
  <ScrollView horizontal showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="always"
   onLayout={event=>setViewportWidth(event.nativeEvent.layout.width)} ref={scroller} contentContainerStyle={{flexGrow:1,alignItems:"center",paddingHorizontal:4,gap:compact?0:4}}>
   {(showPrivateJCards?tabs:visitorTabs).map(tab=>{
    const selected=section===tab.id;
    return <Pressable key={tab.id} accessibilityRole="tab" accessibilityLabel={tab.label}
      accessibilityState={{selected}} aria-selected={selected} onPress={()=>onSelect(tab.id)}
      onLayout={event=>{tabLayouts.current[tab.id]=event.nativeEvent.layout;if(selected)scrollToSection(tab.id);}}
      style={{minHeight:50,minWidth:compact?JOBEEN_CONTROL.touchTarget:54,flexGrow:1,flexShrink:0,
       paddingHorizontal:compact?4:9,alignItems:"center",justifyContent:"center",
       borderBottomWidth:3,borderBottomColor:selected?jt.yellow:jt.bg}}>
     <Text style={{fontSize:compact?JOBEEN_TYPE.input-1:JOBEEN_TYPE.input,fontWeight:selected?"700":"600",color:jt.ink,textAlign:"center"}}>{tab.label}</Text>
    </Pressable>;
   })}
  </ScrollView>
 </View>;
}


export type ProfileAboutSide="personal"|"business";

/** Separate from the rotating card: only switches the already-authorized About content. */
export function ProfileAboutSelector({side,onSelect,personalAvailable=true,businessAvailable=true}:{side:ProfileAboutSide;onSelect:(side:ProfileAboutSide)=>void;personalAvailable?:boolean;businessAvailable?:boolean}){
 const {theme}=useTheme(),jt=jobeenTokens(theme),reducedMotion=useReducedMotion();
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
   <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.85} style={{fontSize:JOBEEN_TYPE.input,fontWeight:side===option?"700":"600",color:side===option?jt.surface:jt.ink}}>{option==="personal"?"Personal":"Negocio"}</Text>
  </Pressable>)}
 </View>;
}

export function ProfilePersonalLanguages({languages}:{languages:CardData["languages"]}){
 const {theme}=useTheme(),jt=jobeenTokens(theme);
 if(!languages.length)return null;
 return <View style={{gap:8,padding:14,borderWidth:1,borderColor:jt.line,borderRadius:14,backgroundColor:jt.surface}}>
  <Text accessibilityRole="header" style={{fontSize:JOBEEN_TYPE.input,fontWeight:"700",color:jt.ink}}>Idiomas</Text>
  {languages.map(({name,fluency},index)=><View key={name+index} style={{flexDirection:"row",alignItems:"center",gap:8,minHeight:JOBEEN_CONTROL.touchTarget}}>
   <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
    <LanguageRing name={name} value={fluency} color={jt.ink} track={jt.line} size={32}/>
   </View>
   <Text style={{flex:1,fontSize:JOBEEN_TYPE.input,color:jt.ink}}>{name}</Text>
   <Text style={{flexShrink:1,textAlign:"right",color:jt.ink2}}>{languageLabel(fluency)} · {Math.round(fluency)}%</Text>
  </View>)}
 </View>;
}

/** Business fields come from the authorized face. Review aggregates load only here. */
export function ProfileBusinessAbout({business,onEdit,target,scope}:{business?:BusinessCardData|null;onEdit?:()=>void;target?:string;scope?:MessageScope|null}){
 const {theme}=useTheme(),jt=jobeenTokens(theme);
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
  {!!business?.name.trim()&&<Text style={{fontWeight:"700",fontSize:JOBEEN_TYPE.input,color:jt.ink}}>{business.name}</Text>}
  {!!business?.category?.trim()&&<Text style={{color:jt.ink2,fontSize:JOBEEN_TYPE.input}}>{business.category}</Text>}
  {services.length>0&&<View style={{gap:6}}><Text style={{color:jt.ink,fontWeight:"700"}}>Servicios</Text><View style={{flexDirection:"row",flexWrap:"wrap",gap:6}}>
   {services.map((service,index)=><View key={index} style={{maxWidth:"100%",paddingHorizontal:10,paddingVertical:7,borderRadius:14,borderWidth:1,borderColor:jt.line}}><Text style={{color:jt.ink}}>{service}</Text></View>)}
  </View></View>}
  {!business?.name.trim()&&!services.length&&<Text style={{color:jt.ink2}}>Información del negocio no disponible.</Text>}
  {!!business?.name.trim()&&<View style={{gap:8}}><Text style={{color:jt.ink,fontWeight:"700"}}>Sellos del negocio</Text>{awardLoading?<Text accessibilityLiveRegion="polite" style={{color:jt.ink2}}>Cargando sellos…</Text>:<BusinessAwards theme={theme} standalone business={aggregate?{...business,...aggregate,reviewCount:aggregate.excellenceReviewCount}:undefined}/>}</View>}
  {onEdit&&<Pressable accessibilityRole="button" onPress={onEdit} style={{minHeight:JOBEEN_CONTROL.touchTarget,justifyContent:"center",alignItems:"center",borderRadius:JOBEEN_CONTROL.buttonRadius,borderWidth:1,borderColor:jt.outline}}><Text style={{color:jt.ink,fontWeight:"700"}}>Editar negocio</Text></Pressable>}
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
