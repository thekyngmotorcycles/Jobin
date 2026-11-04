import { Platform, Pressable, Text, View, useWindowDimensions } from "react-native";
import { router, usePathname } from "expo-router";
import { JobinWordmark } from "../../components/JobinWordmark";
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
 {name:"shop",title:"JShop",icon:"storefront",outline:"storefront-outline"},
 {name:"inbox",title:"Mensajes",icon:"mail",outline:"mail-outline"},
 {name:"profile",title:"Perfil",icon:"person",outline:"person-outline"},
] as const;
export default function TabLayout(){
 const {colors}=useTheme();const inset=useSafeAreaInsets();const {unreadInbox}=useJobinNotices();
 const {width}=useWindowDimensions();const desktop=Platform.OS==="web"&&width>=1100;const pathname=usePathname();
 const nav=(name:string,title:string,icon:React.ComponentProps<typeof Ionicons>["name"])=> <Pressable key={name} accessibilityRole="link" onPress={()=>router.push(name as never)} style={{flexDirection:"row",alignItems:"center",gap:13,paddingVertical:14,paddingHorizontal:16,borderRadius:12,backgroundColor:pathname===name?colors.line:colors.transparent}}><Ionicons name={icon} size={22} color={colors.ink}/><Text style={{fontSize:15,color:colors.ink,fontWeight:pathname===name?"700":"500"}}>{title}</Text></Pressable>;
 const tabs=<Tabs initialRouteName="videos" screenOptions={{
  headerShown:false,tabBarShowLabel:false,tabBarActiveTintColor:colors.navIcon,tabBarInactiveTintColor:colors.navIcon,
  tabBarHideOnKeyboard:true,tabBarBackground:()=> desktop?null:<NavigationFade/>,
  tabBarStyle:{display:desktop?"none":"flex",position:"absolute",backgroundColor:colors.transparent,borderTopWidth:0,elevation:0,shadowOpacity:0,overflow:"visible",height:NAVIGATION_ROW_HEIGHT+inset.bottom,paddingTop:5,paddingBottom:Math.max(5,inset.bottom)},
  tabBarIconStyle:{height:28},
 }}>
  <Tabs.Screen name="create" options={{href:null}}/>
  {routes.map(route=><Tabs.Screen key={route.name} name={route.name} options={{
   title:route.title,tabBarAccessibilityLabel:route.title,tabBarButtonTestID:"tab-"+route.name,
   tabBarIcon:({color,focused})=><View><Ionicons name={focused?route.icon:route.outline} size={25} color={color}/>{route.name==="inbox"&&unreadInbox>0&&<View style={{position:"absolute",top:-3,right:-5}}><Ionicons name="heart" size={12} color={colors.reaction}/></View>}</View>,
  }}/>)}
 </Tabs>;
 if(!desktop)return tabs;
 return <View style={{flex:1,flexDirection:"row",backgroundColor:colors.paper}}><View style={{width:240,padding:18,borderRightWidth:1,borderColor:colors.line,gap:14}}><JobinWordmark width={150}/><View style={{marginTop:28}}>{nav("/(tabs)/videos","Para ti","play-circle-outline")}{nav("/(tabs)/index","Inicio","home-outline")}{nav("/(tabs)/streams","Live","radio-outline")}{nav("/(tabs)/shop","JShop","storefront-outline")}{nav("/(tabs)/inbox","Mensajes","mail-outline")}{nav("/(tabs)/profile","Mi JCard","person-outline")}</View></View><View style={{flex:1,minWidth:0,maxWidth:1050,alignSelf:"center"}}>{tabs}</View><View style={{width:260,padding:20,borderLeftWidth:1,borderColor:colors.line,gap:14}}><Text style={{fontSize:18,fontWeight:"700",color:colors.ink}}>Tu espacio profesional</Text><Text style={{fontSize:13,lineHeight:21,color:colors.muted}}>Explora profesionales, comparte tu trabajo y conecta con empresas.</Text>{nav("/(tabs)/profile","Ver mi JCard","id-card-outline")}{nav("/opportunities","Oportunidades","briefcase-outline")}{nav("/search","Buscar","search-outline")}<View style={{marginTop:20,borderTopWidth:1,borderColor:colors.line,paddingTop:18}}><Text style={{fontSize:12,color:colors.muted}}>Jobin Web · Versión de desarrollo</Text></View></View></View>;
}
