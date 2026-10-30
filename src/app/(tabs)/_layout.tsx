import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { View } from "react-native";
import { useUi } from "../../components/ui";
// Icon-only bar. Titles stay as accessibility labels so screen readers still name each tab.
const routes = [
 {name:"index",title:"Home",icon:"home",outline:"home-outline"},
 {name:"connect",title:"Meet People",icon:"people",outline:"people-outline"},
 {name:"create",title:"Subir",icon:"add",outline:"add"},
 {name:"inbox",title:"Inbox",icon:"mail",outline:"mail-outline"},
 {name:"profile",title:"Mi perfil",icon:"person-circle",outline:"person-circle-outline"}
] as const;
export default function TabLayout() {
 const {colors,fs}=useUi();
 const iconSize=fs(26);
 return <Tabs screenOptions={{headerShown:false,tabBarShowLabel:false,tabBarActiveTintColor:colors.ink,tabBarInactiveTintColor:colors.muted,
 tabBarStyle:{backgroundColor:colors.card,borderTopColor:colors.line}}}>
 {routes.map(route=><Tabs.Screen key={route.name} name={route.name} options={{title:route.title,tabBarAccessibilityLabel:route.title,
 tabBarIcon:({color,focused})=>route.name==="create"
  ?<View style={{backgroundColor:colors.ink,borderRadius:12,width:fs(48),height:fs(34),alignItems:"center",justifyContent:"center"}}>
    <Ionicons name="add" size={fs(26)} color={colors.inverse}/></View>
  :<View style={{backgroundColor:focused?colors.accent:"transparent",borderRadius:14,paddingHorizontal:fs(14),paddingVertical:fs(6)}}>
    <Ionicons name={focused?route.icon:route.outline} size={iconSize} color={color}/></View>}}/>)}
 </Tabs>;
}
