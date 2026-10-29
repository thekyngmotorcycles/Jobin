import { Tabs } from "expo-router";
import { Text, View } from "react-native";
import { useTheme } from "../../state/ThemeProvider";
const routes=[
 {name:"index",title:"Home",icon:"⌂"},
 {name:"connect",title:"Meet People",icon:"♡"},
 {name:"create",title:"Subir",icon:"+"},
 {name:"inbox",title:"Inbox",icon:"✉"},
 {name:"profile",title:"Mi perfil",icon:"◉"}
];
export default function TabLayout() {
 const {colors}=useTheme();
 return <Tabs screenOptions={{headerShown:false,tabBarActiveTintColor:colors.ink,tabBarInactiveTintColor:colors.muted,
 tabBarStyle:{backgroundColor:colors.card,borderTopColor:colors.line},tabBarLabelStyle:{fontSize:10}}}>
 {routes.map(route=><Tabs.Screen key={route.name} name={route.name} options={{title:route.title,
 tabBarIcon:({color})=>route.name==="create"?<View style={{backgroundColor:colors.ink,borderRadius:10,width:44,height:30,alignItems:"center",justifyContent:"center"}}><Text style={{color:colors.inverse,fontSize:26,lineHeight:29}}>+</Text></View>:<Text style={{color,fontSize:24}}>{route.icon}</Text>}}/>)}
 </Tabs>;
}
