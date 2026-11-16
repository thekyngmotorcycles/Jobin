import { ProfileCommunityActions } from "../components/ProfileCommunityActions";
import { ProfessionalTrustMark } from "../components/ProfessionalTrustMark";
import { useCallback,useEffect,useState } from "react";
import { Pressable,Text,View } from "react-native";
import {Ionicons} from "@expo/vector-icons";
import {PublicProfileAvatar} from "../components/PublicProfileAvatar";
import {loadPublishedMedia,type PublishedMedia} from "../lib/safety-api";
import {router} from "expo-router";
import { approvedCV,cvRequests,requestCV } from "../lib/cv-access";
import { requireSupabase } from "../lib/supabase";
import {identityVerified} from "../lib/identity-status";
import { useLocalSearchParams } from "expo-router";

import { JobinCard } from "../components/JobinCard";
import { Screen,useUi } from "../components/ui";
import { ProfessionalStatus } from "../components/ProfessionalStatus";
import { loadPublicCard } from "../lib/professional-api";
import { useProfessionalData } from "../state/useProfessionalData";
export default function PublicJCard(){
 const {user,card}=useLocalSearchParams<{user?:string;card?:string}>();
 const {colors}=useUi();
 const [viewer,setViewer]=useState("");
 const [section,setSection]=useState<"videos"|"live">("videos");
 const [media,setMedia]=useState<PublishedMedia[]>([]);
 useEffect(()=>{let live=true;void loadPublishedMedia().then(rows=>{if(live)setMedia(rows);}).catch(()=>{if(live)setMedia([]);});return()=>{live=false;};},[user]);
 const [verifiedIdentity,setVerifiedIdentity]=useState(false);
 useEffect(()=>{if(!user)return;let live=true;void identityVerified(user).then(v=>{if(live)setVerifiedIdentity(v);}).catch(()=>{if(live)setVerifiedIdentity(false);});return()=>{live=false;};},[user]);
 const [followerCount,setFollowerCount]=useState<number|null>(null);
 useEffect(()=>{if(!user)return;let live=true;void requireSupabase().from("profile_follows" as never).select("*",{count:"exact",head:true}).eq("followed_id",user).then(({count})=>{if(live)setFollowerCount(count??0);});return()=>{live=false;};},[user]);
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
 return <Screen demo={false} title="Perfil" subtitle="">
  {resource.data?<View style={{gap:14}}>
    <View style={{flexDirection:"row",alignItems:"center",gap:14,paddingVertical:8}}>
      <PublicProfileAvatar userId={resource.data.id} name={resource.data.name} size={72}/>
      <View style={{flex:1,gap:5}}><Text style={{fontSize:22,fontWeight:"700",color:colors.ink}} numberOfLines={2}>{resource.data.name}</Text>
        {!!resource.data.handle&&<Text style={{color:colors.muted,fontSize:14}}>@{resource.data.handle}</Text>}
        {!!resource.data.role&&<Text style={{color:colors.muted,fontSize:14}} numberOfLines={2}>{resource.data.role}</Text>}
        {followerCount!==null&&<Text style={{color:colors.muted,fontSize:13}}>{followerCount.toLocaleString("es")} seguidores</Text>}
      </View>
    </View>
    <ProfileCommunityActions user={resource.data.id} name={resource.data.name} url={resource.data.profileUrl}/>
    <JobinCard card={{...resource.data,identityVerified:verifiedIdentity}} ownerId={resource.data.id} initialSide={card==="business"?"business":"personal"}/>
    <View style={{marginVertical:4,gap:10}}>
      <Pressable accessibilityRole="button" accessibilityState={{expanded:cvOpen}} onPress={()=>void openCV()} style={{padding:14,borderRadius:12,borderWidth:1,borderColor:colors.line}}><Text style={{fontWeight:"700",color:colors.ink}}>Historial profesional {cvOpen?"▴":"▾"}</Text></Pressable>
      {cvOpen&&<View style={{gap:8,padding:12}}>{user!==viewer&&cvStatus!=="approved"?<><Text style={{color:colors.ink}}>El currículum es privado. El propietario debe autorizar tu solicitud.</Text><Pressable disabled={cvStatus==="pending"} onPress={()=>void requestCV(user!).then(()=>{setCvStatus("pending");setCvMessage("Solicitud enviada.");}).catch(e=>setCvMessage(String(e)))}><Text style={{fontWeight:"700",color:colors.ink}}>{cvStatus==="pending"?"Solicitud pendiente":"Solicitar CV"}</Text></Pressable></>:<>{cvRows.length?cvRows.map((row,i)=><Text key={i} style={{color:colors.ink}}>{row.role} · {row.company} ({row.from_year}–{row.to_year??"Actualidad"})</Text>):<Text style={{color:colors.muted}}>No hay experiencias registradas o disponibles.</Text>}</>}{!!cvMessage&&<Text style={{color:colors.muted}}>{cvMessage}</Text>}</View>}
    </View>
    <ProfessionalTrustMark worker={resource.data.id}/>
    <View style={{flexDirection:"row",borderBottomWidth:1,borderBottomColor:colors.line}}>
      {(["videos","live"] as const).map(tab=><Pressable key={tab} accessibilityRole="tab" accessibilityState={{selected:section===tab}} onPress={()=>setSection(tab)} style={{flex:1,alignItems:"center",paddingVertical:14,borderBottomWidth:section===tab?3:0,borderBottomColor:colors.ink}}>
        <Ionicons name={tab==="videos"?"play-outline":"radio-outline"} size={23} color={section===tab?colors.ink:colors.muted}/>
        <Text style={{color:section===tab?colors.ink:colors.muted,fontSize:12}}>{tab==="videos"?"Videos":"Streams"}</Text>
      </Pressable>)}
    </View>
    <View style={{flexDirection:"row",flexWrap:"wrap",paddingBottom:24}}>
      {media.filter(item=>item.creator_id===user&&item.kind===(section==="videos"?"video":"live")).map(item=><Pressable key={item.id} accessibilityRole="button" accessibilityLabel={"Ver "+item.title} onPress={()=>router.push({pathname:"/work-media/[id]",params:{id:item.id}})} style={{width:"33.33%",padding:2}}>
        <View style={{height:152,backgroundColor:colors.accent,borderRadius:9,justifyContent:"center",alignItems:"center",padding:8,gap:10}}>
          <Ionicons name={section==="videos"?"play-circle-outline":"radio-outline"} size={28} color={colors.ink}/>
          <Text style={{color:colors.ink,textAlign:"center",fontSize:12}} numberOfLines={3}>{item.title}</Text>
        </View>
      </Pressable>)}
      {!media.some(item=>item.creator_id===user&&item.kind===(section==="videos"?"video":"live"))&&<Text style={{color:colors.muted,paddingVertical:24,textAlign:"center",width:"100%"}}>Todavía no hay {section==="videos"?"videos":"streams"} publicados.</Text>}
    </View>
  </View>:<ProfessionalStatus loading={resource.loading} error={resource.error} retry={resource.reload}/>}
 </Screen>;
}
