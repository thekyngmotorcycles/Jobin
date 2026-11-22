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
import {NAVIGATION_ROW_HEIGHT} from "../theme/navigation";
import {jobeenTokens} from "../theme/jobeen";
import {ProfileIdentityHeader,ProfileSectionTabs,type ProfileSection} from "../components/ProfileSharedSections";
import {useReducedMotion} from "react-native-reanimated";
import {ProfilePublicPosts} from "../components/ProfileOwnedPosts";
import {router,Stack,useFocusEffect} from "expo-router";
import { approvedCV,cvRequests,requestCV } from "../lib/cv-access";
import {assertMessageScope,captureMessageScope,type MessageScope} from "../lib/message-session";
import { requireSupabase } from "../lib/supabase";
import {identityVerified} from "../lib/identity-status";
import { useLocalSearchParams } from "expo-router";

import { JobinCard } from "../components/JobinCard";
import {useUi} from "../components/ui";
import {JCardLoadState} from "../components/JCardConnectionState";
import { loadPublicCard } from "../lib/professional-api";
import {readPublicBusinessCard} from "../lib/jcard-cloud";
import {readJCardVisibility,DEFAULT_JCARD_VISIBILITY} from "../lib/jcard-visibility";
import {isSavedJCard,removeSavedJCard,saveVisibleJCard,type SavedJCardSide} from "../lib/saved-jcards";
import type {BusinessCardData} from "../lib/jcard";
import { useProfessionalData } from "../state/useProfessionalData";
export default function PublicJCard(){
 const {user,card}=useLocalSearchParams<{user?:string;card?:string}>();
 const {colors,s}=useUi();
 const {theme}=useTheme();const jt=jobeenTokens(theme);
 const insets=useSafeAreaInsets();const {contentBottom}=useTabClearance();
 const fadeHeight=NAVIGATION_ROW_HEIGHT+100;const fadeCenter=(fadeHeight-NAVIGATION_ROW_HEIGHT/2)/fadeHeight;
 const {height:screenHeight}=useWindowDimensions();
 const [viewer,setViewer]=useState("");
 const [profileMenuOpen,setProfileMenuOpen]=useState(false);
 const [activeCardSide,setActiveCardSide]=useState<SavedJCardSide>(card==="business"?"business":"personal");
 const [cardVisibility,setCardVisibility]=useState(DEFAULT_JCARD_VISIBILITY);
 const [cardVisibilityReady,setCardVisibilityReady]=useState(false);
 const [cardSaved,setCardSaved]=useState(false);
 const [savingCard,setSavingCard]=useState(false);
 const sideIsPublic=activeCardSide==="personal"?cardVisibility.personal_enabled:cardVisibility.business_enabled;
 useEffect(()=>setActiveCardSide(card==="business"?"business":"personal"),[card,user]);
 useEffect(()=>{if(!user)return;let live=true;setCardVisibilityReady(false);
  void readJCardVisibility(user).then(v=>{if(live){setCardVisibility(v);setCardVisibilityReady(true);}}).catch(()=>{if(live)setCardVisibilityReady(false);});
  return()=>{live=false;};},[user]);
  const [publicBusiness,setPublicBusiness]=useState<BusinessCardData|null>(null);
  useEffect(()=>{if(!user)return;let active=true;setPublicBusiness(null);void readPublicBusinessCard(user).then(v=>{if(active)setPublicBusiness(v);}).catch(()=>{if(active)setPublicBusiness(null);});return()=>{active=false;};},[user]);
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
 useEffect(()=>{if(!user)return;let live=true;void identityVerified(user).then(v=>{if(live)setVerifiedIdentity(v);}).catch(()=>{if(live)setVerifiedIdentity(false);});return()=>{live=false;};},[user]);
 const [followerCount,setFollowerCount]=useState<number|null>(null);
 useEffect(()=>{if(!user)return;let live=true;void requireSupabase().from("profile_follows" as never).select("*",{count:"exact",head:true}).eq("followed_id",user).then(({count})=>{if(live)setFollowerCount(count??0);});return()=>{live=false;};},[user]);
 useEffect(()=>{if(user&&viewer&&user===viewer)router.replace({pathname:"/(tabs)/profile",params:card==="business"?{card:"business"}:{}});},[user,viewer,card]);
 const cvScope=useRef<MessageScope|null>(null),cvRevision=useRef(0),cvTarget=useRef("");
 const [cvStatus,setCvStatus]=useState("");
 const [cvRows,setCvRows]=useState<{company:string;role:string;from_year:number;to_year:number|null}[]>([]);
 const [cvMessage,setCvMessage]=useState("");
 const [cvOpen,setCvOpen]=useState(false);
 useFocusEffect(useCallback(()=>{
  const generation=++cvRevision.current;
  cvTarget.current=user??"";cvScope.current=null;setViewer("");setCvStatus("");setCvRows([]);setCvMessage("");setCvOpen(false);
  void(async()=>{try{
   const scope=await captureMessageScope();
   const requests=user&&user!==scope.owner?await cvRequests(scope):[];
   await assertMessageScope(scope);
   if(cvRevision.current!==generation)return;
   cvScope.current=scope;setViewer(scope.owner);
   setCvStatus(requests.find(r=>r.owner_id===user&&r.requester_id===scope.owner)?.status??"");
  }catch{if(cvRevision.current===generation){setViewer("");setCvRows([]);}}})();
  return()=>{cvRevision.current++;cvScope.current=null;cvTarget.current="";setCvRows([]);setCvOpen(false);};
 },[user]));
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
  const origin=cvScope.current;
  if(!origin||origin.owner!==viewer||cvTarget.current!==user)return;
  void(async()=>{
   try{
    const scope=await captureMessageScope(origin);
    const saved=await isSavedJCard(user,activeCardSide,viewer,scope);
    await assertMessageScope(scope);
    if(savedRevision.current!==generation||cvScope.current!==origin)return;
    savedScope.current={scope,target:user,side:activeCardSide,generation};setCardSaved(saved);setSavedReady(true);
   }catch{if(savedRevision.current===generation){setSavedReady(false);setCardSaved(false);}}
  })();
  return()=>{savedRevision.current++;savedScope.current=null;setSavedReady(false);setCardSaved(false);};
 },[user,viewer,activeCardSide,cardVisibilityReady,sideIsPublic]));
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
 const resource=useProfessionalData(useCallback(()=>{
  if(!user||!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(user))return Promise.reject(new Error("Enlace de JCard inválido."));
  return loadPublicCard(user);
 },[user]));
 return <>
  <Stack.Screen options={{headerShown:false}}/>
  <SafeAreaView edges={["top","left","right"]} style={[s.screen,{backgroundColor:jt.bg}]}>
   <Animated.View pointerEvents={tabsPinned?"none":"auto"}
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
     style={{width:44,height:44,alignItems:"center",justifyContent:"center",opacity:.62}}>
     <Ionicons name="arrow-back" size={26} color={colors.ink}/>
    </Pressable>
    <View style={{flex:1}}/>
    {!!resource.data&&<Pressable accessibilityRole="button" accessibilityLabel="Opciones del perfil"
     onPress={()=>setProfileMenuOpen(true)} style={{width:44,height:44,alignItems:"center",justifyContent:"center",borderRadius:22}}>
     <Ionicons name="ellipsis-horizontal" size={23} color={colors.ink}/>
    </Pressable>}
   </Animated.View>
   <Animated.ScrollView ref={profileScroll} stickyHeaderIndices={resource.data?[1]:undefined}
    scrollEventThrottle={16} showsVerticalScrollIndicator={false}
    style={{flex:1}} overScrollMode="never" bounces={false} alwaysBounceVertical={false}
    contentContainerStyle={{paddingTop:NAVIGATION_ROW_HEIGHT+12,paddingBottom:contentBottom,width:"100%",maxWidth:1180,alignSelf:"center"}}
    onScroll={Animated.event([{nativeEvent:{contentOffset:{y:profileScrollY}}}],{
     useNativeDriver:true,
     listener:(event:NativeSyntheticEvent<NativeScrollEvent>)=>{
      const pinned=tabOffset>0&&event.nativeEvent.contentOffset.y>=tabOffset-2;
      setTabsPinned(previous=>previous===pinned?previous:pinned);
     }
    })}>
   <Animated.View style={{gap:14,paddingHorizontal:20,paddingBottom:20,zIndex:0,transform:[{translateY:smoothHeroParallax}]}}>
    {resource.data?<ProfileIdentityHeader
     card={<JobinCard card={{...resource.data,identityVerified:verifiedIdentity,business:publicBusiness??undefined}} ownerId={resource.data.id} initialSide={card==="business"?"business":"personal"} onActiveSideChange={setActiveCardSide}/>}
     actions={<ProfileCommunityActions user={resource.data.id} name={resource.data.name} url={resource.data.profileUrl} menuOpen={profileMenuOpen} onMenuClose={()=>setProfileMenuOpen(false)}
      onToggleSaved={savedReady&&cardVisibilityReady&&sideIsPublic?()=>void toggleSaved():undefined}
      savedJCard={cardSaved} savingJCard={savingCard} visibleCardSide={activeCardSide}/>}
     trust={<ProfessionalTrustMark worker={resource.data.id}/>}
     profileUserId={resource.data.id}
    />:<JCardLoadState loading={resource.loading} error={resource.error} retry={resource.reload}/>}
   </Animated.View>
   {!!resource.data&&<View onLayout={event=>setTabOffset(event.nativeEvent.layout.y)}
    style={{zIndex:3,backgroundColor:jt.bg,borderTopLeftRadius:18,borderTopRightRadius:18}}>
    <ProfileSectionTabs section={section} onSelect={selectSection} pinned={tabsPinned}/>
   </View>}
   {!!resource.data&&<View style={{gap:14,paddingHorizontal:20,paddingTop:20,paddingBottom:20,minHeight:screenHeight,backgroundColor:jt.bg,zIndex:2}}>

    {section==="cv"&&<View style={{marginVertical:4,gap:10}}>
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
