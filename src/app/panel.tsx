import {router} from "expo-router";
import {Text,View} from "react-native";
import {PageFrame,PageState,useUi} from "../components/ui";
import {SettingsMenuRow} from "../components/SettingsMenuRow";
import {loadWorkspace} from "../lib/professional-api";
import {useProfessionalData} from "../state/useProfessionalData";

/** Private management entry; only real, existing destinations are exposed. */
export default function Panel(){
 const {s}=useUi();
 const workspace=useProfessionalData(loadWorkspace,false,true);
 const data=workspace.data;
 if(workspace.loading&&!data)return <PageFrame kind="management"><PageState kind="loading"/></PageFrame>;
 if(workspace.error)return <PageFrame kind="management"><PageState kind="error" message={workspace.error} actionLabel="Reintentar" onAction={workspace.reload}/></PageFrame>;
 if(!data||!workspace.scope||workspace.scope.owner!==data.card.id)return <PageFrame kind="management"><PageState kind="info" message="No se pudo verificar tu perfil." actionLabel="Reintentar" onAction={workspace.reload}/></PageFrame>;
 return <PageFrame kind="management">
  <View style={s.panel}>
   <Text accessibilityRole="header" style={s.h3}>Contenido</Text>
   <SettingsMenuRow title="Mis publicaciones" icon="grid-outline" onPress={()=>router.push({pathname:"/(tabs)/profile",params:{view:"grid"}})}/>
   <SettingsMenuRow title="Mis videos" icon="play-circle-outline" onPress={()=>router.push({pathname:"/(tabs)/profile",params:{view:"videos"}})}/>
   <SettingsMenuRow title="Mis transmisiones" icon="radio-outline" onPress={()=>router.push({pathname:"/live",params:{view:"studio"}})}/>
  </View>
  {(!!data.organization||!!data.reviewer)&&<View style={s.panel}>
   <Text accessibilityRole="header" style={s.h3}>Negocio</Text>
   {!!data.organization&&<SettingsMenuRow title="Mi empresa o institución" icon="business-outline" onPress={()=>router.push("/company")}/>}
   {!!data.reviewer&&<SettingsMenuRow title="Revisar acreditaciones" icon="shield-checkmark-outline" onPress={()=>router.push("/credential-review")}/>}
  </View>}
 </PageFrame>;
}
