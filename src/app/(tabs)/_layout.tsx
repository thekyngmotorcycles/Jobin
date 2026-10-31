import { View } from "react-native";
import { useJobinNotices } from "../../state/NoticeProvider";
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../../state/ThemeProvider";
import { NavigationFade } from "../../components/NavigationFade";
import { NAVIGATION_ROW_HEIGHT } from "../../theme/navigation";
const routes=[
 {name:"index",title:"Home",icon:"home",outline:"home-outline"},
 {name:"streams",title:"Live",icon:"radio",outline:"radio-outline"},
 {name:"videos",title:"Videos",icon:"play-circle",outline:"play-circle-outline"},
 {name:"inbox",title:"Mensajes",icon:"mail",outline:"mail-outline"},
 {name:"profile",title:"Perfil",icon:"person",outline:"person-outline"},
] as const;
export default function TabLayout(){
 const {colors}=useTheme();const inset=useSafeAreaInsets();const {unreadInbox}=useJobinNotices();
 return <Tabs initialRouteName="videos" screenOptions={{
  headerShown:false,tabBarShowLabel:false,tabBarActiveTintColor:colors.navIcon,tabBarInactiveTintColor:colors.navIcon,
  tabBarHideOnKeyboard:true,tabBarBackground:()=> <NavigationFade/>,
  tabBarStyle:{position:"absolute",backgroundColor:colors.transparent,borderTopWidth:0,elevation:0,shadowOpacity:0,overflow:"visible",height:NAVIGATION_ROW_HEIGHT+inset.bottom,paddingTop:5,paddingBottom:Math.max(5,inset.bottom)},
  tabBarIconStyle:{height:28},
 }}>
  <Tabs.Screen name="create" options={{href:null}}/>
  {routes.map(route=><Tabs.Screen key={route.name} name={route.name} options={{
   title:route.title,tabBarAccessibilityLabel:route.title,tabBarButtonTestID:"tab-"+route.name,
   tabBarIcon:({color,focused})=><View><Ionicons name={focused?route.icon:route.outline} size={25} color={color}/>{route.name==="inbox"&&unreadInbox>0&&<View style={{position:"absolute",top:-3,right:-5}}><Ionicons name="heart" size={12} color={colors.reaction}/></View>}</View>,
  }}/>)}
 </Tabs>;
}
