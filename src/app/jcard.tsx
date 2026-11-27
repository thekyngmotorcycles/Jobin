import { ProfileCommunityActions } from "../components/ProfileCommunityActions";
import { ProfessionalTrustMark } from "../components/ProfessionalTrustMark";
import {useCallback,useEffect,useRef,useState} from "react";
import {Alert,Animated,Pressable,ScrollView,Text,View,useWindowDimensions,type NativeScrollEvent,type NativeSyntheticEvent} from "react-native";
import Svg,{Defs,LinearGradient,Rect,Stop} from "react-native-svg";
import {useSafeAreaInsets} from "react-native-safe-area-context";
import {useTabClearance} from "../theme/navigation";
import {SafeAreaView} from "react-native-safe-area-context";
import {useTheme} from "../state/ThemeProvider";
import {Ionicons} from "@expo/vector-icons";
import {JOBEEN_CONTROL} from "../theme/control-metrics";
import {NAVIGATION_ROW_HEIGHT} from "../theme/navigation";
import {jobeenTokens} from "../theme/jobeen";
import {ProfileIdentityHeader,ProfileSectionTabs,ProfileAboutSelector,ProfileBusinessAbout,ProfilePersonalLanguages,type ProfileSection} from "../components/ProfileSharedSections";
import {useReducedMotion} from "react-native-reanimated";
import {ProfilePublicPosts} from "../components/ProfileOwnedPosts";
import {router,Stack,useFocusEffect} from "expo-router";
import { approvedCV,cvRequests,requestCV } from "../lib/cv-access";
import {assertMessageScope,captureMessageScope,readMessageScope,type MessageScope} from "../lib/message-session";
import {identityVerified} from "../lib/identity-status";
import { useLocalSearchParams } from "expo-router";

import { JobinCard } from "../components/JobinCard";
import {resolveProfileCardSide} from "../lib/jcard-profile-side";
import {useUi} from "../components/ui";
import {JCardLoadState} from "../components/JCardConnectionState";
import { loadPublicCard } from "../lib/professional-api";
import {readPublicBusinessCard} from "../lib/jcard-cloud";
import {readJCardVisibility,DEFAULT_JCARD_VISIBILITY} from "../lib/jcard-visibility";
import {isSavedJCard,removeSavedJCard,saveVisibleJCard,type SavedJCardSide} from "../lib/saved-jcards";
import type {BusinessCardData} from "../lib/jcard";
import {loadPublicContact,loadVisiblePersonalContactDetails} from "../lib/jcard-contact";
import {presentJCardContact,type JCardContact} from "../lib/jcard-save-contact";
export default function PublicJCard(){
 const {user,card}=useLocalSearchParams<{user?:string;card?:string}>();
 const {colors,s}=useUi();
 const {theme}=useTheme();const jt=jobeenTokens(theme);
 const insets=useSafeAreaInsets();const {contentBottom}=useTabClearance();
 const fadeHeight=NAVIGATION_ROW_HEIGHT+100;const fadeCenter=(fadeHeight-NAVIGATION_ROW_HEIGHT/2)/fadeHeight;
 const {height:screenHeight}=useWindowDimensions();
 const [profileMenuOpen,setProfileMenuOpen]=useState(false);
 const [requestedCardSide,setActiveCardSide]=useState<SavedJCardSide>(card==="business"?"business":"personal");
 const publicRevision=useRef(0);
 const [publicSnapshot,setPublicSnapshot]=useState<{target:string;scope:MessageScope;data:Awaited<ReturnType<typeof loadPublicCard>>;visibility:Awaited<ReturnType<typeof readJCardVisibility>>;business:BusinessCardData|null}|null>(null);
 const [publicLoading,setPublicLoading]=useState(true),[publicError,setPublicError]=useState(""),[publicRetry,setPublicRetry]=useState(0);
 const snapshot=publicSnapshot?.target===user?publicSnapshot:null;
 const publicScope=snapshot?.scope??null;
 const viewer=publicScope?.owner??"";
 const cardVisibility=snapshot?.visibility??{...DEFAULT_JCARD_VISIBILITY,personal_enabled:false,business_enabled:false};
 const cardVisibilityReady=!!snapshot;
 const publicBusiness=cardVisibility.business_enabled?snapshot?.business??null:null;
 const activeCardSide=resolveProfileCardSide(requestedCardSide,cardVisibility.personal_enabled,!!publicBusiness);
 const [cardSaved,setCardSaved]=useState(false);
 const [savingCard,setSavingCard]=useState(false);
 const sideIsPublic=activeCardSide==="personal"?cardVisibility.personal_enabled:cardVisibility.business_enabled&&!!publicBusiness;
 const contactTarget=useRef({snapshot,side:activeCardSide});
 contactTarget.current={snapshot,side:activeCardSide};
 const contactSaveGuard=useRef<object|null>(null);
 const saveVisibleContact=async()=>{
  const current=contactTarget.current,origin=current.snapshot,target=origin?.target;
  if(!origin||!target||target!==user||origin.scope.owner===target||!sideIsPublic||contactSaveGuard.current)return;
  const generation=publicRevision.current,operation={};
  contactSaveGuard.current=operation;
  const valid=()=>contactSaveGuard.current===operation&&publicRevision.current===generation&&contactTarget.current.snapshot===origin&&contactTarget.current.side===current.side;
  try{
   await captureMessageScope(origin.scope);
   const visibility=await readJCardVisibility(target,origin.scope);
   if(!valid())return;
   let contact:JCardContact;
   if(current.side==="business"){
    if(!visibility.business_enabled)throw Error("La JCard de negocio ya no está disponible.");
    const business=await readPublicBusinessCard(target,origin.scope);
    if(!business)throw Error("La JCard de negocio ya no está disponible.");
    contact={name:business.name,phone:visibility.business_show_phone?(business.phone||business.phoneSecondary):null,email:visibility.business_show_email?(business.email||business.emailSecondary):null};
   }else{
    if(!visibility.personal_enabled)throw Error("La JCard personal ya no está disponible.");
    const [base,details]=await Promise.all([loadPublicContact(target,origin.scope),loadVisiblePersonalContactDetails(target,origin.scope)]);
    contact={name:origin.data.name,phone:details.phone_primary||details.phone_secondary||base.phone,email:details.email_primary||details.email_secondary||base.email};
   }
   await assertMessageScope(origin.scope);
   if(valid())await presentJCardContact(contact);
  }catch(e){if(valid())Alert.alert("Guardar contacto",e instanceof Error?e.message:"No se pudo abrir el contacto.");}
  finally{if(contactSaveGuard.current===operation)contactSaveGuard.current=null;}
 };
 useEffect(()=>setActiveCardSide(card==="business"?"business":"personal"),[card,user,publicScope?.session]);
 useFocusEffect(useCallback(()=>{
  const generation=++publicRevision.current;
  setPublicSnapshot(null);setPublicLoading(true);setPublicError("");setProfileMenuOpen(false);
  void(async()=>{
   try{
    if(!user||!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(user))throw Error("Enlace de JCard inválido.");
    // Both required reads verify the same scope independently. Their concurrent
    // getUser checks share a flight; the local hint is never used to render.
    const scope=await readMessageScope();
    if(scope.owner===user){
     await captureMessageScope(scope);
     if(publicRevision.current===generation)router.replace({pathname:"/(tabs)/profile",params:card==="business"?{card:"business"}:{}});
     return;
    }
    const [data,visibility]=await Promise.all([loadPublicCard(user,scope),readJCardVisibility(user,scope)]);
    await assertMessageScope(scope);
    if(publicRevision.current!==generation)return;
    if(data.id!==user||(!visibility.personal_enabled&&!visibility.business_enabled))throw Error("El perfil no está disponible.");

    if(visibility.personal_enabled){
     setPublicSnapshot({target:user,scope,data,visibility:{...visibility,business_enabled:false},business:null});
     setPublicLoading(false);
    }
    if(!visibility.business_enabled)return;

    const business=await readPublicBusinessCard(user,scope).catch(cause=>{
     if(!visibility.personal_enabled)throw cause;
     return null;
    });
    await assertMessageScope(scope);
    if(publicRevision.current!==generation)return;
    if(!business){
     if(!visibility.personal_enabled)throw Error("El perfil no está disponible.");
     return;
    }
    setPublicSnapshot({target:user,scope,data,visibility,business});
   }catch(e){if(publicRevision.current===generation){setPublicSnapshot(null);setPublicError(e instanceof Error?e.message:"El perfil no está disponible.");}}
   finally{if(publicRevision.current===generation)setPublicLoading(false);}
  })();
  return()=>{publicRevision.current++;setPublicSnapshot(null);};
 },[user,card,publicRetry]));
 const resource={data:snapshot?.data??null,loading:publicLoading,error:publicError,reload:()=>setPublicRetry(v=>v+1)};
 const [section,setSection]=useState<ProfileSection>("grid");

 const profileScroll=useRef<ScrollView|null>(null);
 const profileScrollY=useRef(new Animated.Value(0)).current;
 const [tabOffset,setTabOffset]=useState(0);
 const [tabsPinned,setTabsPinned]=useState(false);
 const heroParallax=Animated.multiply(profileScrollY,0.5);
  const smoothHeroParallax=heroParallax.interpolate({inputRange:[0,320],outputRange:[0,320],extrapolate:"clamp"});
 const retreatStart=Math.max(1,tabOffset-NAVIGATION_ROW_HEIGHT);
 const retreatEnd=Math.max(retreatStart+1,tabOffset);
 const topHeaderOffset=profileScrollY.interpolate({
  inputRange:[0,retreatStart,retreatEnd],
  outputRange:[0,0,-NAVIGATION_ROW_HEIGHT],extrapolate:"clamp"
 });
 const topHeaderOpacity=profileScrollY.interpolate({
  inputRange:[0,retreatStart,retreatEnd],
  outputRange:[1,1,0],extrapolate:"clamp"
 });
 const reducedMotion=useReducedMotion();
 function selectSection(next:ProfileSection){
  setSection(next);
  if(tabOffset>0)profileScroll.current?.scrollTo({y:tabOffset,animated:!reducedMotion});
 }
 const [verifiedIdentity,setVerifiedIdentity]=useState(false);
 useEffect(()=>{
  setVerifiedIdentity(false);
  if(!user||!publicScope)return;
  let live=true;
  void identityVerified(user).then(async value=>{
   await assertMessageScope(publicScope);if(live)setVerifiedIdentity(value);
  }).catch(()=>{});
  return()=>{live=false;};
 },[user,publicScope]);
 const cvScope=useRef<MessageScope|null>(null),cvRevision=useRef(0),cvTarget=useRef("");
 const [cvStatus,setCvStatus]=useState("");
 const [cvRows,setCvRows]=useState<{company:string;role:string;from_year:number;to_year:number|null}[]>([]);
 const [cvMessage,setCvMessage]=useState("");
 const [cvOpen,setCvOpen]=useState(false);
 useFocusEffect(useCallback(()=>{
  cvRevision.current++;
  cvTarget.current=publicScope?user??"":"";
  cvScope.current=publicScope;
  setCvStatus("");setCvRows([]);setCvMessage("");setCvOpen(false);
  return()=>{cvRevision.current++;cvScope.current=null;cvTarget.current="";setCvRows([]);setCvOpen(false);};
 },[user,publicScope]));
 async function openCV(){
  const scope=cvScope.current,generation=++cvRevision.current;
  if(!scope||!user||cvTarget.current!==user||scope.owner!==viewer)return;
  setCvRows([]);setCvMessage("");setCvOpen(!cvOpen);
  if(cvOpen)return;
  try{
   const status=user===scope.owner?"approved":(await cvRequests(scope)).find(r=>r.owner_id===user&&r.requester_id===scope.owner)?.status??"";
   if(cvRevision.current!==generation||cvScope.current!==scope)return;
   setCvStatus(status);
   if(status!=="approved")return;
   const rows=await approvedCV(user,scope);
   if(cvRevision.current===generation&&cvScope.current===scope)setCvRows(rows);
  }catch(e){if(cvRevision.current===generation){setCvStatus("");setCvRows([]);setCvMessage(e instanceof Error?e.message:"No se pudo consultar el historial.");}}
 }
 async function sendCVRequest(){
  const scope=cvScope.current,generation=cvRevision.current;
  if(!scope||!user||cvTarget.current!==user||scope.owner!==viewer||cvStatus==="pending")return;
  try{await requestCV(user,scope);if(cvRevision.current===generation&&cvScope.current===scope){setCvStatus("pending");setCvMessage("Solicitud enviada.");}}
  catch(e){if(cvRevision.current===generation)setCvMessage(String(e));}
 }
 const savedScope=useRef<{scope:MessageScope;target:string;side:SavedJCardSide;generation:number}|null>(null),savedRevision=useRef(0),saveGuard=useRef(false);
 const [savedReady,setSavedReady]=useState(false);
 useFocusEffect(useCallback(()=>{
  const generation=++savedRevision.current;
  savedScope.current=null;setSavedReady(false);setCardSaved(false);setProfileMenuOpen(false);
  if(!user||!viewer||viewer===user||!cardVisibilityReady||!sideIsPublic)return;
  const origin=publicScope;
  if(!origin||origin.owner!==viewer)return;
  void(async()=>{
   try{
    const scope=origin;
    const saved=await isSavedJCard(user,activeCardSide,viewer,scope);
    await assertMessageScope(scope);
    if(savedRevision.current!==generation)return;
    savedScope.current={scope,target:user,side:activeCardSide,generation};setCardSaved(saved);setSavedReady(true);
   }catch{if(savedRevision.current===generation){setSavedReady(false);setCardSaved(false);}}
  })();
  return()=>{savedRevision.current++;savedScope.current=null;setSavedReady(false);setCardSaved(false);};
 },[user,viewer,publicScope,activeCardSide,cardVisibilityReady,sideIsPublic]));
 const toggleSaved=async()=>{
  const origin=savedScope.current;
  if(!origin||!savedReady||!user||origin.target!==user||origin.side!==activeCardSide||origin.scope.owner!==viewer||!cardVisibilityReady||!sideIsPublic||saveGuard.current)return;
  const valid=()=>savedScope.current===origin&&savedRevision.current===origin.generation;
  saveGuard.current=true;setSavingCard(true);
  try{
   await captureMessageScope(origin.scope);
   if(!valid())return;
   if(cardSaved)await removeSavedJCard(user,activeCardSide,viewer,origin.scope);
   else await saveVisibleJCard(user,activeCardSide,viewer,origin.scope);
   const saved=await isSavedJCard(user,activeCardSide,viewer,origin.scope);
   if(valid())setCardSaved(saved);
  }catch(e){if(valid()){savedScope.current=null;setSavedReady(false);setCardSaved(false);Alert.alert("Mis JCards",e instanceof Error?e.message:"No se pudo actualizar tu colección.");}}
  finally{saveGuard.current=false;setSavingCard(false);}
 };
 return <>
  <Stack.Screen options={{headerShown:false}}/>
  <SafeAreaView edges={["top","left","right"]} style={[s.screen,{backgroundColor:jt.bg}]}>
   <Animated.View pointerEvents={tabsPinned?"none":"box-none"}
    style={{position:"absolute",top:insets.top,left:0,right:0,zIndex:10,height:NAVIGATION_ROW_HEIGHT,
     flexDirection:"row",alignItems:"center",justifyContent:"space-between",paddingHorizontal:16,paddingVertical:8,
     transform:[{translateY:topHeaderOffset}],opacity:topHeaderOpacity}}>
    <View pointerEvents="none" style={{position:"absolute",top:0,left:0,right:0,height:fadeHeight}}>
     <Svg width="100%" height="100%" accessible={false}>
      <Defs><LinearGradient id="publicProfileTopFade" x1="0%" y1="0%" x2="0%" y2="100%">
       <Stop offset="0" stopColor={theme==="light"?jt.bg:colors.paper} stopOpacity={0.92}/>
       <Stop offset={1-fadeCenter} stopColor={theme==="light"?jt.bg:colors.paper} stopOpacity={0.72}/>
       <Stop offset={1-fadeCenter*.4} stopColor={theme==="light"?jt.bg:colors.paper} stopOpacity={.09}/>
       <Stop offset="1" stopColor={theme==="light"?jt.bg:colors.paper} stopOpacity={0}/>
      </LinearGradient>
      <LinearGradient id="publicProfileTopShade" x1="0%" y1="0%" x2="0%" y2="100%">
       <Stop offset="0" stopColor={jt.ink} stopOpacity={theme==="light"?.11:.08}/>
       <Stop offset=".55" stopColor={jt.ink} stopOpacity={0}/>
      </LinearGradient></Defs>
      <Rect width="100%" height="100%" fill="url(#publicProfileTopFade)"/>
      <Rect width="100%" height="100%" fill="url(#publicProfileTopShade)"/>
     </Svg>
    </View>
    <Pressable accessibilityRole="button" accessibilityLabel="Volver" onPress={()=>router.back()}
     style={{width:JOBEEN_CONTROL.touchTarget,height:JOBEEN_CONTROL.touchTarget,alignItems:"center",justifyContent:"center",opacity:.62}}>
     <Ionicons name="arrow-back" size={26} color={colors.ink}/>
    </Pressable>
    <View pointerEvents="none" style={{flex:1}}/>
    {!!resource.data&&<Pressable accessibilityRole="button" accessibilityLabel="Opciones del perfil"
     onPress={()=>setProfileMenuOpen(true)} style={{width:JOBEEN_CONTROL.touchTarget,height:JOBEEN_CONTROL.touchTarget,alignItems:"center",justifyContent:"center",borderRadius:22}}>
     <Ionicons name="ellipsis-horizontal" size={23} color={colors.ink}/>
    </Pressable>}
   </Animated.View>
   <Animated.ScrollView ref={profileScroll} stickyHeaderIndices={resource.data?[1]:undefined}
    scrollEventThrottle={16} showsVerticalScrollIndicator={false}
    style={{flex:1}} overScrollMode="never" bounces={false} alwaysBounceVertical={false}
    contentInsetAdjustmentBehavior="never" contentContainerStyle={{paddingBottom:contentBottom}}
    onScroll={Animated.event([{nativeEvent:{contentOffset:{y:profileScrollY}}}],{
     useNativeDriver:true,
     listener:(event:NativeSyntheticEvent<NativeScrollEvent>)=>{
      const pinned=tabOffset>0&&event.nativeEvent.contentOffset.y>=tabOffset-2;
      setTabsPinned(previous=>previous===pinned?previous:pinned);
     }
    })}>
   <Animated.View style={{paddingBottom:12,zIndex:0,transform:[{translateY:smoothHeroParallax}]}}>
    {resource.data?<ProfileIdentityHeader
     card={<JobinCard card={{...resource.data,identityVerified:verifiedIdentity,business:publicBusiness??undefined}} ownerId={resource.data.id} initialSide={publicBusiness&&(card==="business"||!cardVisibility.personal_enabled)?"business":"personal"} selectedSide={activeCardSide} onActiveSideChange={setActiveCardSide} awardsInAbout profileInset={16} publicVisibility={cardVisibility} publicScope={snapshot?.scope}/>}
     actionsInset={16} actions={<ProfileCommunityActions user={resource.data.id} name={cardVisibility.personal_enabled?resource.data.name:publicBusiness?.name??""} url={resource.data.profileUrl} menuOpen={profileMenuOpen} onMenuClose={()=>setProfileMenuOpen(false)}
      onToggleSaved={savedReady&&cardVisibilityReady&&sideIsPublic?()=>void toggleSaved():undefined}
      onSaveContact={cardVisibilityReady&&sideIsPublic?()=>void saveVisibleContact():undefined}
      savedJCard={cardSaved} savingJCard={savingCard} visibleCardSide={activeCardSide}/>}
     trust={<ProfessionalTrustMark worker={resource.data.id} inset={20}/>}
     profileUserId={resource.data.id} countsInCard expectedScope={publicScope}
    />:<JCardLoadState loading={resource.loading} error={resource.error} retry={resource.reload} profileInset={16}/>}
   </Animated.View>
   {!!resource.data&&<View onLayout={event=>setTabOffset(event.nativeEvent.layout.y)}
    style={{zIndex:3,backgroundColor:jt.bg,borderTopLeftRadius:18,borderTopRightRadius:18,width:"100%",maxWidth:1180,alignSelf:"center"}}>
    <ProfileSectionTabs section={section} onSelect={selectSection} pinned={tabsPinned}/>
   </View>}
   {!!resource.data&&<View style={{width:"100%",maxWidth:1180,alignSelf:"center",gap:14,paddingHorizontal:20,paddingTop:20,paddingBottom:20,minHeight:screenHeight,backgroundColor:jt.bg,zIndex:2}}>

    {section==="cv"&&<ProfileAboutSelector side={activeCardSide} onSelect={setActiveCardSide} personalAvailable={cardVisibility.personal_enabled} businessAvailable={!!publicBusiness}/>}
    {section==="cv"&&aboutSide==="business"&&cardVisibility.business_enabled&&publicBusiness&&<ProfileBusinessAbout business={publicBusiness} target={resource.data.id} scope={publicScope}/>}
    {section==="cv"&&aboutSide==="personal"&&cardVisibility.personal_enabled&&<View style={{marginVertical:4,gap:10}}>
      <ProfilePersonalLanguages languages={resource.data.languages}/>
      <Pressable accessibilityRole="button" accessibilityState={{expanded:cvOpen}} onPress={()=>void openCV()} style={{padding:14,minHeight:48,borderRadius:12,borderWidth:1,borderColor:colors.line}}>
       <Text style={{fontWeight:"700",color:colors.ink}}>Historial profesional {cvOpen?"▴":"▾"}</Text>
      </Pressable>
      {cvOpen&&cvTarget.current===user&&<View style={{gap:8,padding:12}}>
       {user!==viewer&&cvStatus!=="approved"?<>
        <Text style={{color:colors.ink}}>El currículum es privado. El propietario debe autorizar tu solicitud.</Text>
        <Pressable disabled={cvStatus==="pending"} accessibilityRole="button" onPress={()=>void sendCVRequest()}
         style={{minHeight:48,justifyContent:"center"}}>
         <Text style={{fontWeight:"700",color:colors.ink}}>{cvStatus==="pending"?"Solicitud pendiente":"Solicitar CV"}</Text>
        </Pressable>
       </>:<>
        {cvRows.length?cvRows.map((row,i)=><Text key={i} style={{color:colors.ink}}>{row.role} · {row.company} ({row.from_year}–{row.to_year??"Actualidad"})</Text>):
         <Text style={{color:colors.muted}}>No hay experiencias registradas o disponibles.</Text>}
       </>}
       {!!cvMessage&&<Text style={{color:colors.muted}}>{cvMessage}</Text>}
      </View>}
    </View>}
    {section==="live"&&<View style={{padding:14,gap:10,borderWidth:1,borderColor:colors.line,borderRadius:14}}>
     <Text style={{color:colors.ink,fontWeight:"700"}}>Transmisiones en vivo</Text>
     <Text style={{color:colors.muted}}>Consulta las transmisiones públicas de este perfil. Las emisiones de demostración no se mostrarán como directos reales.</Text>
    </View>}
    {(section==="grid"||section==="videos"||section==="live")&&
     <ProfilePublicPosts userId={resource.data.id} filter={section==="grid"?"all":section==="videos"?"videos":"live"}/>}
   </View>}
   </Animated.ScrollView>
  </SafeAreaView>
 </>;
}
