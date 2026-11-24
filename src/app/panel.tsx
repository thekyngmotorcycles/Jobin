import {router} from "expo-router";
import {Ionicons} from "@expo/vector-icons";
import {Text,View} from "react-native";
import {PageFrame,PageState,useUi} from "../components/ui";
import {SettingsMenuRow} from "../components/SettingsMenuRow";
import {loadWorkspace} from "../lib/professional-api";
import {panelAccess,panelSections,type PanelModuleId} from "../lib/panel-workspace";
import {useProfessionalData} from "../state/useProfessionalData";

/** Private administrative workspace. Preview modules never claim operational availability. */
export default function Panel(){
 const {s,colors}=useUi();
 const workspace=useProfessionalData(loadWorkspace,false,true);
 const access=panelAccess(workspace.data,workspace.scope);
 if(workspace.loading&&!access)return <PageFrame kind="management"><PageState kind="loading"/></PageFrame>;
 if(workspace.error)return <PageFrame kind="management"><PageState kind="error" message={workspace.error} actionLabel="Reintentar" onAction={workspace.reload}/></PageFrame>;
 if(!access)return <PageFrame kind="management"><PageState kind="info" message="No se pudo verificar tu perfil." actionLabel="Reintentar" onAction={workspace.reload}/></PageFrame>;
 function open(id:PanelModuleId){
  if(id==="company")router.push("/company");
  else if(id==="team")router.push("/employer-links");
  else if(id==="credentials")router.push("/credential-review");
  else if(id==="drafts")router.push({pathname:"/post/create",params:{view:"drafts"}});
  else router.push({pathname:"/panel-module",params:{module:id}});
 }
 return <PageFrame kind="management">
  <View style={[s.panel,{flexDirection:"row",alignItems:"center"}]}>
   <Ionicons name={access.company?"business-outline":"person-circle-outline"} size={28} color={colors.ink}/>
   <View style={{flex:1}}><Text style={s.h3}>{access.company?"Cuenta empresarial":"Cuenta personal"}</Text><Text style={s.muted}>{workspace.data?.card.name}</Text></View>
  </View>
  {panelSections(access).map(section=><View style={s.panel} key={section.title}>
   <Text accessibilityRole="header" style={s.h3}>{section.title}</Text>
   {section.items.map(item=><SettingsMenuRow key={item.id} title={item.title}
    icon={(item.icon==="handshake-outline"?"document-outline":item.icon) as keyof typeof Ionicons.glyphMap}
    value={item.ready?undefined:"En preparación"} onPress={()=>open(item.id)}/>)}
  </View>)}
 </PageFrame>;
}
