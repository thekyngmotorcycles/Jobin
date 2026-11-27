import {useEffect,useRef,useState} from "react";
import {useReducedMotion} from "react-native-reanimated";
import { Animated,Platform, Pressable, Text, View, useWindowDimensions } from "react-native";
import {BottomTabBar} from "@react-navigation/bottom-tabs";
import {useVideoSectionNavigation} from "../../state/VideoSectionNavigation";
import {useScrollNavigation} from "../../state/ScrollNavigation";
import { router, usePathname } from "expo-router";
import { JobinWordmark } from "../../components/JobinWordmark";
import { useJobinNotices } from "../../state/NoticeProvider";
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../../state/ThemeProvider";
import { NavigationFade } from "../../components/NavigationFade";
import { JobinTabIcon } from "../../components/JobinTabIcon";
import { NAVIGATION_ROW_HEIGHT,FLASH_NAV_HANDLE_HEIGHT,FlashNavigationClearance } from "../../theme/navigation";
const routes=[
 {name:"index",title:"Casa",icon:"home",outline:"home-outline"},
 {name:"shop",title:"JShop",icon:"storefront",outline:"storefront-outline"},
 {name:"videos",title:"Videos",icon:"play-circle",outline:"play-circle-outline"},
 {name:"inbox",title:"Mensajes",icon:"mail",outline:"mail-outline"},
 {name:"profile",title:"Perfil",icon:"person",outline:"person-outline"},
] as const;
export default function TabLayout(){
 const {colors}=useTheme();const inset=useSafeAreaInsets();const {unreadInbox}=useJobinNotices();
 const {progress,hidden}=useScrollNavigation();const {openVideos}=useVideoSectionNavigation();
 const {width}=useWindowDimensions();const desktop=Platform.OS==="web"&&width>=1100;const pathname=usePathname();
 // Home keeps its scroll accordion. Only mobile Flashes uses the manual immersive handle.
 const homeFeed=pathname==="/"||pathname==="/(tabs)";
 const flashMode=!desktop&&(pathname==="/videos"||pathname==="/(tabs)/videos");
 const [flashExpanded,setFlashExpanded]=useState(false);
 const reducedMotion=useReducedMotion();
 const flashOffset=useRef(new Animated.Value(1)).current;
 useEffect(()=>{if(!flashMode)setFlashExpanded(false);},[flashMode]);
 useEffect(()=>{flashOffset.stopAnimation();if(!flashMode){flashOffset.setValue(1);return;}
  const motion=Animated.timing(flashOffset,{toValue:flashExpanded?0:1,duration:reducedMotion?0:220,useNativeDriver:true});
  motion.start();return()=>motion.stop();
 },[flashExpanded,flashMode,flashOffset,reducedMotion]);
 const fullBar=NAVIGATION_ROW_HEIGHT+inset.bottom;
 const flashClearance=FLASH_NAV_HANDLE_HEIGHT+inset.bottom+(flashExpanded?NAVIGATION_ROW_HEIGHT:0);
 const nav=(name:string,title:string,icon:React.ComponentProps<typeof Ionicons>["name"])=> <Pressable key={name} accessibilityRole="link" onPress={()=>name==="/(tabs)/videos"?openVideos():router.push(name as never)} style={{flexDirection:"row",alignItems:"center",gap:13,paddingVertical:14,paddingHorizontal:16,borderRadius:12,backgroundColor:pathname===name?colors.line:colors.transparent}}><Ionicons name={icon} size={22} color={colors.ink}/><Text style={{fontSize:15,color:colors.ink,fontWeight:pathname===name?"700":"500"}}>{title}</Text></Pressable>;
 const tabs=<Tabs initialRouteName="streams" tabBar={props=>flashMode?<Animated.View key="flash-navigation" pointerEvents="box-none" style={{position:"absolute",bottom:0,left:0,right:0,zIndex:50,height:fullBar+FLASH_NAV_HANDLE_HEIGHT,transform:[{translateY:flashOffset.interpolate({inputRange:[0,1],outputRange:[0,NAVIGATION_ROW_HEIGHT]})}]}}>
  <Pressable accessibilityRole="button" accessibilityLabel={flashExpanded?"Contraer navegación":"Mostrar navegación"} accessibilityState={{expanded:flashExpanded}}
   onPress={()=>setFlashExpanded(value=>!value)} style={{position:"absolute",top:0,left:0,right:0,height:FLASH_NAV_HANDLE_HEIGHT,alignItems:"center",justifyContent:"center"}}>
   <View pointerEvents="none" style={{width:34,height:4,borderRadius:2,backgroundColor:colors.mediaNavigationHandle,shadowColor:colors.mediaShadow,shadowOpacity:1,shadowRadius:2,shadowOffset:{width:0,height:1}}}/>
  </Pressable>
  <Animated.View pointerEvents={flashExpanded?"auto":"none"} accessibilityElementsHidden={!flashExpanded} importantForAccessibility={flashExpanded?"auto":"no-hide-descendants"}
   style={{position:"absolute",left:0,right:0,bottom:0,height:fullBar,opacity:flashOffset.interpolate({inputRange:[0,1],outputRange:[1,0]})}}><BottomTabBar {...props}/></Animated.View>
 </Animated.View>:homeFeed?<Animated.View key="home-navigation" pointerEvents={hidden?"none":"auto"} style={{position:"absolute",bottom:0,left:0,right:0,zIndex:50,height:NAVIGATION_ROW_HEIGHT+inset.bottom,opacity:progress.interpolate({inputRange:[0,1],outputRange:[1,0]}),transform:[{translateY:progress.interpolate({inputRange:[0,1],outputRange:[0,NAVIGATION_ROW_HEIGHT+inset.bottom]})}]}}><BottomTabBar {...props}/></Animated.View>:<View key="fixed-navigation" pointerEvents="auto" style={{position:"absolute",bottom:0,left:0,right:0,zIndex:50,height:NAVIGATION_ROW_HEIGHT+inset.bottom}}><BottomTabBar {...props}/></View>} screenOptions={{
  headerShown:false,tabBarShowLabel:false,tabBarActiveTintColor:colors.ink,tabBarInactiveTintColor:colors.ink,
  tabBarHideOnKeyboard:true,tabBarItemStyle:{minHeight:48,justifyContent:"center",alignItems:"center",backgroundColor:colors.transparent},
  tabBarActiveBackgroundColor:colors.transparent,tabBarInactiveBackgroundColor:colors.transparent,
  tabBarBackground:()=> desktop?null:<NavigationFade profileOpaque={pathname==="/profile"||pathname==="/(tabs)/profile"}/>,
  tabBarStyle:{display:desktop?"none":"flex",position:"absolute",backgroundColor:colors.transparent,borderTopWidth:0,elevation:0,shadowOpacity:0,overflow:"visible",height:NAVIGATION_ROW_HEIGHT+inset.bottom,paddingTop:3,paddingBottom:Math.max(7,inset.bottom+2)},
  tabBarIconStyle:{height:48,width:48,alignItems:"center",justifyContent:"center"},
 }}>
  <Tabs.Screen name="create" options={{href:null}}/>
  <Tabs.Screen name="streams" options={{href:null}}/>
  {routes.map(route=><Tabs.Screen key={route.name} name={route.name} listeners={route.name==="videos"?{tabPress:event=>{event.preventDefault();openVideos();}}:undefined} options={{
   title:route.title,tabBarAccessibilityLabel:route.title,tabBarButtonTestID:"tab-"+route.name,
   tabBarIcon:({color,focused})=>{const selected=focused||(route.name==="videos"&&(pathname==="/streams"||pathname.endsWith("/streams")));return <View style={{width:48,height:48,alignItems:"center",justifyContent:"center"}}><JobinTabIcon name={route.name} focused={selected} size={route.name==="videos"?(width<375?28:30)*1.15:(width<375?23:25)} color={selected?colors.ink:color}/>{route.name==="inbox"&&unreadInbox>0&&<View style={{position:"absolute",top:-3,right:-4}}><Ionicons name="heart" size={12} color={colors.reaction}/></View>}</View>},
  }}/>)}
 </Tabs>;
 if(!desktop)return <FlashNavigationClearance.Provider value={flashMode?flashClearance:null}>{tabs}</FlashNavigationClearance.Provider>;
 return <View style={{flex:1,flexDirection:"row",backgroundColor:colors.paper}}><View style={{width:240,padding:18,borderRightWidth:1,borderColor:colors.line,gap:14}}><JobinWordmark width={150}/><View style={{marginTop:28}}>{nav("/(tabs)","Casa","home-outline")}{nav("/(tabs)/shop","JShop","storefront-outline")}{nav("/(tabs)/videos","Videos","play-circle-outline")}{nav("/(tabs)/inbox","Mensajes","mail-outline")}{nav("/(tabs)/profile","Mi JCard","person-outline")}</View></View><View style={{flex:1,minWidth:0,maxWidth:1050,alignSelf:"center"}}>{tabs}</View><View style={{width:260,padding:20,borderLeftWidth:1,borderColor:colors.line,gap:14}}><Text style={{fontSize:18,fontWeight:"700",color:colors.ink}}>Tu espacio profesional</Text><Text style={{fontSize:13,lineHeight:21,color:colors.muted}}>Explora profesionales, comparte tu trabajo y conecta con empresas.</Text>{nav("/(tabs)/profile","Ver mi JCard","id-card-outline")}{nav("/opportunities","Oportunidades","briefcase-outline")}{nav("/search","Buscar","search-outline")}<View style={{marginTop:20,borderTopWidth:1,borderColor:colors.line,paddingTop:18}}><Text style={{fontSize:12,color:colors.muted}}>Jobin Web · Versión de desarrollo</Text></View></View></View>;
}
