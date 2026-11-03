import { ProfileCommunityActions } from "../components/ProfileCommunityActions";
import { ProfessionalTrustMark } from "../components/ProfessionalTrustMark";
import { useCallback,useEffect,useState } from "react";
import { Pressable,Text,View } from "react-native";
import { approvedCV,cvRequests,requestCV } from "../lib/cv-access";
import { requireSupabase } from "../lib/supabase";
import { useLocalSearchParams } from "expo-router";

import { JobinCard } from "../components/JobinCard";
import { Screen } from "../components/ui";
import { ProfessionalStatus } from "../components/ProfessionalStatus";
import { loadPublicCard } from "../lib/professional-api";
import { useProfessionalData } from "../state/useProfessionalData";
export default function PublicJCard(){
 const {user,card}=useLocalSearchParams<{user?:string;card?:string}>();
 const [viewer,setViewer]=useState("");
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
 return <Screen demo={false} title="JCard." subtitle="Identidad profesional pública.">
  {resource.data?<View><JobinCard card={resource.data} ownerId={resource.data.id} initialSide={card==="business"?"business":"personal"}/><View style={{marginVertical:12,gap:10}}><Pressable accessibilityRole="button" onPress={()=>void openCV()} style={{padding:14,borderRadius:12,borderWidth:1,borderColor:"#777"}}><Text style={{fontWeight:"700"}}>🎓 Historial profesional {cvOpen?"▴":"▾"}</Text></Pressable>{cvOpen&&<View style={{gap:8,padding:12}}>{user!==viewer&&cvStatus!=="approved"?<><Text>El currículum es privado. El propietario debe autorizar tu solicitud.</Text><Pressable disabled={cvStatus==="pending"} onPress={()=>void requestCV(user!).then(()=>{setCvStatus("pending");setCvMessage("Solicitud enviada.");}).catch(e=>setCvMessage(String(e)))}><Text style={{fontWeight:"700"}}>{cvStatus==="pending"?"Solicitud pendiente":"Solicitar CV"}</Text></Pressable></>:<>{cvRows.length?cvRows.map((row,i)=><Text key={i}>{row.role} · {row.company} ({row.from_year}–{row.to_year??"Actualidad"})</Text>):<Text>No hay experiencias registradas o disponibles.</Text>}</>}{!!cvMessage&&<Text>{cvMessage}</Text>}</View>}</View><ProfileCommunityActions user={resource.data.id} name={resource.data.name} url={resource.data.profileUrl}/><ProfessionalTrustMark worker={resource.data.id}/></View>:<ProfessionalStatus loading={resource.loading} error={resource.error} retry={resource.reload}/>}
 </Screen>;
}
