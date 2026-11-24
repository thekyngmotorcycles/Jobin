import { useEffect,useState } from "react";
import { Linking,Text,View } from "react-native";
import { router } from "expo-router";
import { useIsFocused } from "@react-navigation/native";
import { Button,Chips,Notice,PageState,useUi } from "./ui";
import {PANEL_MEDIA_FILTERS,PANEL_MEDIA_LABELS,panelMediaMatches,type PanelMediaFilter,type PanelScope} from "../lib/panel-workspace";
import { loadMyMedia,loadStudioLink,safetyMutation } from "../lib/safety-api";
import { useScopedProfessionalAction,useProfessionalData } from "../state/useProfessionalData";
const labels:Record<string,string>={pending:"Pendiente de procesamiento/proveedor",processing:"Procesando",moderating:"En moderación",live:"En vivo",published:"Publicado",held:"En revisión",blocked:"Contenido bloqueado",ended:"Finalizado",failed:"Procesamiento fallido"};
export function MyWorkMedia({kind,managementScope}:{kind?:"live"|"video";managementScope?:PanelScope}={}){
 const {s}=useUi();const resource=useProfessionalData(loadMyMedia,false,true);const focused=useIsFocused();const action=useScopedProfessionalAction(resource.reload,resource.scope);
 useEffect(()=>{if(!focused)return;const timer=setInterval(resource.reload,5000);return()=>clearInterval(timer);},[focused,resource.reload]);
 const [filter,setFilter]=useState<PanelMediaFilter>("all");
 const scopeMatches=!managementScope||(resource.scope?.owner===managementScope.owner&&resource.scope.session===managementScope.session);
 const items=scopeMatches?resource.data?.filter(m=>(!kind||m.kind===kind)&&(!managementScope||panelMediaMatches(m.status,filter))):undefined;
 if(managementScope){
  if(resource.error)return <PageState kind="error" message={resource.error} actionLabel="Reintentar" onAction={resource.reload}/>;
  if(resource.loading&&!items)return <PageState kind="loading"/>;
  if(!scopeMatches||!resource.data)return <PageState kind="info" message="No se pudo verificar el contenido de tu cuenta." actionLabel="Reintentar" onAction={resource.reload}/>;
 }
 return <View style={s.panel}><Text accessibilityRole="header" style={s.h3}>{managementScope?(kind==="live"?"Lives":"Videos y Flashes"):(kind==="live"?"Mis transmisiones":kind==="video"?"Mis videos":"Mis videos y lives")}</Text>
  {!!managementScope&&<Chips values={PANEL_MEDIA_FILTERS} value={filter} onChange={setFilter} label="Estado del contenido" getLabel={value=>PANEL_MEDIA_LABELS[value]}/>}
  {!!resource.error&&<Text style={s.muted}>{resource.error}</Text>}
  {!!action.notice&&<Notice text={action.notice} onClose={()=>action.setNotice("")}/>}
  {items?.map(m=><View key={m.id} style={{gap:8}}>
   <Text style={s.h3}>{m.title}</Text><Text style={s.tag}>{labels[m.status]??m.status}</Text>
   {m.studioReady&&<Button title="Abrir estudio privado de transmisión" busy={action.busy} onPress={()=>void action.run(async(scope,check)=>{const url=await loadStudioLink(m.id,scope);await check();await Linking.openURL(url);},"Estudio abierto. Solo se publica mientras exista supervisión activa.")}/>}
   {["live","published"].includes(m.status)&&<Button secondary title="Ver publicación" onPress={()=>router.push({pathname:"/work-media/[id]",params:{id:m.id}})}/>}
   {m.kind==="live"&&["pending","moderating","live"].includes(m.status)&&<Button secondary title="Finalizar solicitud o Live" busy={action.busy} onPress={()=>void action.run(scope=>safetyMutation("jobin_end_work_live",{media:m.id},scope),"Live finalizado.")}/>}
  </View>)}
  {!resource.loading&&!resource.error&&items?.length===0&&<Text style={s.muted}>{managementScope&&filter!=="all"?"No hay contenido con este estado.":"Todavía no hay solicitudes de publicación."}</Text>}
  <Text style={s.muted}>Un estado pendiente no significa que el contenido haya sido analizado o publicado.</Text>
 </View>;
}
