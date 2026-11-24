import {Pressable,View,Platform,useWindowDimensions} from "react-native";
import {router,usePathname} from "expo-router";
import {useSafeAreaInsets} from "react-native-safe-area-context";
import {Ionicons} from "@expo/vector-icons";
import {JobinTabIcon} from "./JobinTabIcon";
import {NavigationFade} from "./NavigationFade";
import {NAVIGATION_ROW_HEIGHT} from "../theme/navigation";
import {useVideoSectionNavigation} from "../state/VideoSectionNavigation";
import {useTheme} from "../state/ThemeProvider";

const items=[
 {id:"index",label:"Casa",path:"/(tabs)/index"},
 {id:"shop",label:"JShop",path:"/(tabs)/shop"},
 {id:"videos",label:"Videos",path:"/(tabs)/videos"},
 {id:"inbox",label:"Mensajes",path:"/(tabs)/inbox"},
 {id:"profile",label:"Perfil",path:"/(tabs)/profile"},
] as const;

/** The same five controls remain available when visiting public profiles outside Tabs. */
export function PersistentBottomTabs(){
 const {colors}=useTheme();const inset=useSafeAreaInsets();const {width}=useWindowDimensions();
 const pathname=usePathname();const {openVideos}=useVideoSectionNavigation();
 if(Platform.OS==="web"&&width>=1100)return null;
 const active=pathname.includes("/jshop/")?"shop":pathname==="/jcard"?"profile":pathname.includes("/post/")?"index":null;
 // Public profiles and stack pages retain a fixed bottom bar, independent of scroll.
 return <View pointerEvents="auto" accessibilityLabel="Navegación inferior"
  style={{position:"absolute",left:0,right:0,bottom:0,zIndex:50,
   height:NAVIGATION_ROW_HEIGHT+inset.bottom}}>
  <NavigationFade/>
  <View style={{flex:1,flexDirection:"row",paddingTop:3,paddingBottom:Math.max(7,inset.bottom+2)}}>
   {items.map(item=><Pressable key={item.id} accessibilityRole="tab" accessibilityLabel={item.label}
    accessibilityState={{selected:active===item.id}} onPress={()=>item.id==="videos"?openVideos():router.navigate(item.path)}
    style={{flex:1,minHeight:48,alignItems:"center",justifyContent:"center"}}>
    <JobinTabIcon name={item.id} focused={active===item.id}
     size={item.id==="videos"?(width<375?28:30)*1.15:(width<375?23:25)} color={colors.ink}/>
   </Pressable>)}
  </View>
 </View>;
}
