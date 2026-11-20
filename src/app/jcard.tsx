import { ProfileCommunityActions } from "../components/ProfileCommunityActions";
import { ProfessionalTrustMark } from "../components/ProfessionalTrustMark";
import {useCallback,useEffect,useRef,useState} from "react";
import {Alert,Animated,Pressable,ScrollView,Text,View,useWindowDimensions,type NativeScrollEvent,type NativeSyntheticEvent} from "react-native";
import {SafeAreaView} from "react-native-safe-area-context";
import {useTheme} from "../state/ThemeProvider";
import {Ionicons} from "@expo/vector-icons";
import {NAVIGATION_ROW_HEIGHT} from "../theme/navigation";
import {jobeenTokens} from "../theme/jobeen";
import {ProfileIdentityHeader,ProfileSectionTabs,type ProfileSection} from "../components/ProfileSharedSections";
import {useReducedMotion} from "react-native-reanimated";
import {ProfilePublicPosts} from "../components/ProfileOwnedPosts";
import {router,Stack} from "expo-router";
import { approvedCV,cvRequests,requestCV } from "../lib/cv-access";
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
 useEffect(()=>{
  if(!user)return;
  let live=true;setCardVisibilityReady(false);
  void readJCardVisibility(user).then(v=>{
   if(live){setCardVisibility(v);setCardVisibilityReady(true);
    if(!v.personal_enabled&&v.business_enabled)setActiveCardSide("business");
    else if(!v.business_enabled&&v.personal_enabled)setActiveCardSide("personal");}
  }).catch(()=>{if(live)setCardVisibilityReady(false);});
  return()=>{live=false;};
 },[user]);
  const [publicBusiness,setPublicBusiness]=useState<BusinessCardData|null>(null);
  useEffect(()=>{if(!user)return;let active=true;setPublicBusiness(null);void readPublicBusinessCard(user).then(v=>{if(active)setPublicBusiness(v);}).catch(()=>{if(active)setPublicBusiness(null);});return()=>{active=false;};},[user]);
 const [section,setSection]=useState<ProfileSection>("grid");
 const profileScroll=useRef<ScrollView|null>(null);
 const profileScrollY=useRef(new Animated.Value(0)).current;
 const [tabOffset,setTabOffset]=useState(0);
 const [tabsPinned,setTabsPinned]=useState(false);
 const heroParallax=Animated.multiply(profileScrollY,0.5);
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
 const [cvStatus,setCvStatus]=useState("");
 const [cvRows,setCvRows]=useState<{company:string;role:string;from_year:number;to_year:number|null}[]>([]);
 const [cvMessage,setCvMessage]=useState("");
 const [cvOpen,setCvOpen]=useState(false);
 useEffect(()=>{let active=true;void requireSupabase().auth.getUser().then(({data})=>{if(active)setViewer(data.user?.id??"");});return()=>{active=false;};},[]);
 useEffect(()=>{if(!user||!viewer||user===viewer)return;let active=true;void cvRequests().then(rows=>{if(active)setCvStatus(rows.find(r=>r.owner_id===user&&r.requester_id===viewer)?.status??"");}).catch(()=>{});return()=>{active=false;};},[user,viewer]);
 async function openCV(){if(!user)return;setCvOpen(true);if(user===viewer||cvStatus==="approved"){try{setCvRows(await approvedCV(user));}catch(e){setCvMessage(e instanceof Error?e.message:"No se pudo consultar el historial.");}}}
 useEffect(()=>{
  if(!user||!viewer||viewer===user||!cardVisibilityReady||!sideIsPublic){setCardSaved(false);return;}
  let live=true;setCardSaved(false);
  void isSavedJCard(user,activeCardSide).then(saved=>{if(live)setCardSaved(saved);}).catch(()=>{if(live)setCardSaved(false);});
  return()=>{live=false;};
 },[user,viewer,activeCardSide,cardVisibilityReady,sideIsPublic]);
 const toggleSaved=async()=>{
  if(!user)return;
  if(!viewer){Alert.alert("Mis JCards","Inicia sesión para guardar tarjetas.");return;}
  if(!cardVisibilityReady||!sideIsPublic){Alert.alert("JCard no disponible","Su propietario ya no tiene esta tarjeta visible.");return;}
  if(savingCard)return;
  setSavingCard(true);
  try{
   if(cardSaved)await removeSavedJCard(user,activeCardSide);
   else await saveVisibleJCard(user,activeCardSide);
   setCardSaved(!cardSaved);
  }catch(e){Alert.alert("Mis JCards",e instanceof Error?e.message:"No se pudo actualizar tu colección.");}
  finally{setSavingCard(false);}
 };
 const resource=useProfessionalData(useCallback(()=>{
  if(!user||!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(user))return Promise.reject(new Error("Enlace de JCard inválido."));
  return loadPublicCard(user);
 },[user]));
 return <>
  <Stack.Screen options={{headerShown:false}}/>
  <SafeAreaView edges={["top","left","right"]} style={s.screen}>
   <Animated.View pointerEvents={tabsPinned?"none":"auto"}
    style={{position:"absolute",top:10,left:0,right:0,height:NAVIGATION_ROW_HEIGHT,zIndex:10,
     flexDirection:"row",alignItems:"center",gap:12,paddingHorizontal:12,
     backgroundColor:jt.bar,transform:[{translateY:topHeaderOffset}],opacity:topHeaderOpacity}}>
    <Pressable accessibilityRole="button" accessibilityLabel="Volver" onPress={()=>router.back()}
     style={{width:44,height:44,alignItems:"center",justifyContent:"center"}}>
     <Ionicons name="arrow-back" size={26} color={colors.ink}/>
    </Pressable>
    <Text numberOfLines={1} style={{color:colors.ink,fontSize:19,fontWeight:"700",flex:1}}>
     {resource.data?.handle?`@${resource.data.handle.replace(/^@/,"")}`:resource.data?.name??"Perfil"}
    </Text>
    {!!resource.data&&<Pressable accessibilityRole="button" accessibilityLabel="Opciones del perfil" onPress={()=>setProfileMenuOpen(true)}
     style={{width:44,height:44,alignItems:"center",justifyContent:"center"}}>
     <Ionicons name="ellipsis-horizontal" size={24} color={colors.ink}/>
    </Pressable>}
   </Animated.View>
   <Animated.ScrollView ref={profileScroll} stickyHeaderIndices={resource.data?[1]:undefined}
    scrollEventThrottle={16} showsVerticalScrollIndicator={false}
    contentContainerStyle={{paddingTop:NAVIGATION_ROW_HEIGHT+20,paddingBottom:0,width:"100%",maxWidth:1180,alignSelf:"center"}}
    onScroll={Animated.event([{nativeEvent:{contentOffset:{y:profileScrollY}}}],{
     useNativeDriver:true,
     listener:(event:NativeSyntheticEvent<NativeScrollEvent>)=>{
      const pinned=tabOffset>0&&event.nativeEvent.contentOffset.y>=tabOffset-2;
      setTabsPinned(previous=>previous===pinned?previous:pinned);
     }
    })}>
   <Animated.View style={{gap:14,paddingHorizontal:20,paddingBottom:20,zIndex:0,transform:[{translateY:heroParallax}]}}>
    {resource.data?<ProfileIdentityHeader
     card={<JobinCard card={{...resource.data,identityVerified:verifiedIdentity,business:publicBusiness??resource.data.business}} ownerId={resource.data.id} initialSide={card==="business"?"business":"personal"} onActiveSideChange={setActiveCardSide}/>} 
     actions={<ProfileCommunityActions user={resource.data.id} name={resource.data.name} url={resource.data.profileUrl} menuOpen={profileMenuOpen} onMenuClose={()=>setProfileMenuOpen(false)}
      onToggleSaved={cardVisibilityReady&&sideIsPublic?()=>void toggleSaved():undefined}
      savedJCard={cardSaved} savingJCard={savingCard} visibleCardSide={activeCardSide} businessName={publicBusiness?.name??resource.data.business?.name}/>} 
     trust={<ProfessionalTrustMark worker={resource.data.id}/>}
     profileUserId={resource.data.id}
    />:<JCardLoadState loading={resource.loading} error={resource.error} retry={resource.reload}/>}
   </Animated.View>
   {!!resource.data&&<View onLayout={event=>setTabOffset(event.nativeEvent.layout.y)}
    style={{zIndex:3,backgroundColor:jt.bg,borderTopLeftRadius:18,borderTopRightRadius:18}}>
    <ProfileSectionTabs section={section} onSelect={selectSection} pinned={tabsPinned}/>
   </View>}
   {!!resource.data&&<View style={{gap:14,paddingHorizontal:20,paddingTop:20,paddingBottom:40,minHeight:screenHeight,backgroundColor:jt.bg,zIndex:2}}>
    
    {section==="cv"&&<View style={{marginVertical:4,gap:10}}>
      <Pressable accessibilityRole="button" accessibilityState={{expanded:cvOpen}} onPress={()=>void openCV()} style={{padding:14,minHeight:48,borderRadius:12,borderWidth:1,borderColor:colors.line}}>
       <Text style={{fontWeight:"700",color:colors.ink}}>Historial profesional {cvOpen?"▴":"▾"}</Text>
      </Pressable>
      {cvOpen&&<View style={{gap:8,padding:12}}>
       {user!==viewer&&cvStatus!=="approved"?<>
        <Text style={{color:colors.ink}}>El currículum es privado. El propietario debe autorizar tu solicitud.</Text>
        <Pressable disabled={cvStatus==="pending"} accessibilityRole="button" onPress={()=>void requestCV(user!).then(()=>{setCvStatus("pending");setCvMessage("Solicitud enviada.");}).catch(e=>setCvMessage(String(e)))}
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
