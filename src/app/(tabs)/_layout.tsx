import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useUi } from "../../components/ui";
// Icon-only tab bar with new icons: play (home), heart (connect), add-circle (upload), mail (inbox), person (profile)
const routes = [
 {name:"index",title:"Home",icon:"play"},
 {name:"connect",title:"Meet People",icon:"heart"},
 {name:"create",title:"Subir",icon:"add-circle"},
 {name:"inbox",title:"Inbox",icon:"mail"},
 {name:"profile",title:"Mi perfil",icon:"person"}
] as const;
export default function TabLayout() {
 const {colors,fs}=useUi();
 const iconSize=fs(26);
 return <Tabs screenOptions={{headerShown:false,tabBarShowLabel:false,tabBarActiveTintColor:colors.ink,tabBarInactiveTintColor:colors.muted,
 tabBarStyle:{backgroundColor:colors.card,borderTopColor:colors.line}}}>
 {routes.map(route=><Tabs.Screen key={route.name} name={route.name} options={{title:route.title,tabBarAccessibilityLabel:route.title,
 tabBarIcon:({color})=><Ionicons name={route.icon} size={iconSize} color={color}/>}}/>)}
 </Tabs>;
}
