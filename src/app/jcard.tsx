import { ProfileCommunityActions } from "../components/ProfileCommunityActions";
import { ProfessionalTrustMark } from "../components/ProfessionalTrustMark";
import {useCallback,useEffect,useRef,useState} from "react";
import {Pressable,ScrollView,Text,View} from "react-native";
import {ProfileIdentityHeader,ProfileSectionTabs,type ProfileSection} from "../components/ProfileSharedSections";
import {useReducedMotion} from "react-native-reanimated";
import {ProfilePublicPosts} from "../components/ProfileOwnedPosts";
import {router,Stack} from "expo-router";
import { approvedCV,cvRequests,requestCV } from "../lib/cv-access";
import { requireSupabase } from "../lib/supabase";
import {identityVerified} from "../lib/identity-status";
import { useLocalSearchParams } from "expo-router";

import { JobinCard } from "../components/JobinCard";
import { Screen,useUi } from "../components/ui";
import {JCardLoadState} from "../components/JCardConnectionState";
import { loadPublicCard } from "../lib/professional-api";
import { useProfessionalData } from "../state/useProfessionalData";
export default function PublicJCard(){
 const {user,card}=useLocalSearchParams<{user?:string;card?:string}>();
 const {colors}=useUi();
 const [viewer,setViewer]=useState("");
 const [section,setSection]=useState<ProfileSection>("home");
 const profileScroll=useRef<ScrollView|null>(null);
 const [tabOffset,setTabOffset]=useState(0);
 const [tabsPinned,setTabsPinned]=useState(false);
 const reducedMotion=useReducedMotion();
 function selectSection(next:ProfileSection){
  setSection(next);
  if(tabOffset>0)profileScroll.current?.scrollTo({y:tabOffset,animated:!reducedMotion});
 }
 const [verifiedIdentity,setVerifiedIdentity]=useState(false);
 useEffect(()=>{if(!user)return;let live=true;void identityVerified(user).then(v=>{if(live)setVerifiedIdentity(v);}).catch(()=>{if(live)setVerifiedIdentity(false);});return()=>{live=false;};},[user]);
 const [followerCount,setFollowerCount]=useState<number|null>(null);
 useEffect(()=>{if(!user)return;let live=true;void requireSupabase().from("profile_follows" as never).select("*",{count:"exact",head:true}).eq("followed_id",user).then(({count})=>{if(live)setFollowerCount(count??0);});return()=>{live=false;};},[user]);
 useEffect(()=>{if(user&&viewer&&user===viewer)router.replace("/(tabs)/profile");},[user,viewer]);
 const [cvStatus,setCvStatus]=useState("");
 const [cvRows,setCvRows]=useState<{company:string;role:string;from_year:number;to_year:number|null}[]>([]);
 const [cvMessage,setCvMessage]=useState("");
 const [cvOpen,setCvOpen]=useState(false);
 useEffect(()=>{let active=true;void requireSupabase().auth.getUser().then(({data})=>{if(active)setViewer(data.user?.id??"");});return()=>{active=false;};},[]);
 useEffect(()=>{if(!user||!viewer||user===viewer)return;let active=true;void cvRequests().then(rows=>{if(active)setCvStatus(rows.find(r=>r.owner_id===user&&r.requester_id===viewer)?.status??"");}).catch(()=>{});return()=>{active=false;};},[user,viewer]);
 async function openCV(){if(!user)return;setCvOpen(true);if(user===viewer||cvStatus==="approved"){try{setCvRows(await approvedCV(user));}catch(e){setCvMessage(e instanceof Error?e.message:"No se pudo consultar el historial.");}}}
 const resource=useProfessionalData(useCallback(()=>{
  if(!user||!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(user))return Promise.reject(new Error("Enlace de JCard inválido."));
  return loadPublicCard(user);
 },[user]));
 return <>
  <Stack.Screen options={{title:resource.data?.handle?`@${resource.data.handle.replace(/^@/,"")}`:resource.data?.name??"Perfil",headerBackTitle:"Volver"}}/>
  <Screen demo={false} title="" subtitle="" hideHeader hideFooter
   scrollRef={profileScroll} stickyHeaderIndices={resource.data?[1]:undefined}
   onScroll={event=>{
    const pinned=tabOffset>0&&event.nativeEvent.contentOffset.y>=tabOffset-2;
    setTabsPinned(previous=>previous===pinned?previous:pinned);
   }}>
   <View style={{gap:14}}>
    {resource.data?<ProfileIdentityHeader
     card={<JobinCard card={{...resource.data,identityVerified:verifiedIdentity}} ownerId={resource.data.id} initialSide={card==="business"?"business":"personal"}/>}
     actions={<ProfileCommunityActions user={resource.data.id} name={resource.data.name} url={resource.data.profileUrl}/>}
     trust={<ProfessionalTrustMark worker={resource.data.id}/>}
     profileUserId={resource.data.id}
    />:<JCardLoadState loading={resource.loading} error={resource.error} retry={resource.reload}/>}
   </View>
   {!!resource.data&&<View onLayout={event=>setTabOffset(event.nativeEvent.layout.y)}>
    <ProfileSectionTabs section={section} onSelect={selectSection} pinned={tabsPinned}/>
   </View>}
   {!!resource.data&&<View style={{gap:14}}>
    {section==="home"&&<ProfilePublicPosts userId={resource.data.id} filter="all" limit={6} heading="Trabajo reciente" onSeeAll={()=>selectSection("grid")}/>}
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
  </Screen>
 </>;
}
