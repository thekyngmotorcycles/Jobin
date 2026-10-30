import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { View } from "react-native";
import { useUi } from "../../components/ui";
// Floating pill nav. Icons: play (home), heart (connect), add (upload), mail (inbox), person (profile).
const routes = [
 {name:"index",title:"Home",icon:"play",outline:"play"},
 {name:"connect",title:"Meet People",icon:"heart",outline:"heart-outline"},
 {name:"create",title:"Subir",icon:"add-circle",outline:"add-circle-outline"},
 {name:"inbox",title:"Inbox",icon:"mail",outline:"mail-outline"},
 {name:"profile",title:"Mi perfil",icon:"person",outline:"person-outline"}
] as const;
export default function TabLayout() {
 const {colors,fs}=useUi();
 const iconSize=fs(20);
 return <Tabs screenOptions={{headerShown:false,tabBarShowLabel:false,tabBarActiveTintColor:colors.inverse,tabBarInactiveTintColor:colors.muted,
 tabBarStyle:{position:"absolute",bottom:fs(20),left:fs(20),right:fs(20),backgroundColor:colors.ink,borderRadius:fs(20),paddingVertical:fs(8),paddingHorizontal:fs(8),borderTopWidth:0,elevation:8,shadowColor:"#000",shadowOpacity:0.25,shadowRadius:fs(10),shadowOffset:{width:0,height:3},height:fs(52)},
 tabBarItemStyle:{gap:0}}}>
 {routes.map(route=><Tabs.Screen key={route.name} name={route.name} options={{title:route.title,tabBarAccessibilityLabel:route.title,
 tabBarIcon:({color,focused})=><View style={{backgroundColor:focused?colors.accent:"transparent",borderRadius:fs(10),width:fs(40),height:fs(40),alignItems:"center",justifyContent:"center"}}>
    <Ionicons name={focused?route.icon:route.outline} size={iconSize} color={color}/></View>}}/>)}
 </Tabs>;
}
