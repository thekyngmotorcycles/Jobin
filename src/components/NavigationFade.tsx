import { useId } from "react";
import { StyleSheet,View } from "react-native";
import Svg,{Defs,LinearGradient,Rect,Stop} from "react-native-svg";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../state/ThemeProvider";
import { NAVIGATION_ROW_HEIGHT } from "../theme/navigation";
export function NavigationFade(){
 const {colors}=useTheme();const inset=useSafeAreaInsets();const height=NAVIGATION_ROW_HEIGHT+inset.bottom+100;
 const center=(height-inset.bottom-NAVIGATION_ROW_HEIGHT/2)/height;
 const id="navigation"+useId().replace(/[^a-z0-9]/gi,"");
 return <View pointerEvents="none" testID="navigation-fade" style={{position:"absolute",left:0,right:0,bottom:0,height}}>
 <Svg width="100%" height="100%" style={StyleSheet.absoluteFill} accessible={false}>
  <Defs><LinearGradient id={id} x1="0%" y1="0%" x2="0%" y2="100%">
   <Stop offset="0" stopColor={colors.paper} stopOpacity={0}/>
   <Stop offset={center*.4} stopColor={colors.paper} stopOpacity={.035}/>
   <Stop offset={center} stopColor={colors.paper} stopOpacity={colors.navigationOpacity}/>
   <Stop offset="1" stopColor={colors.paper} stopOpacity={1}/>
  </LinearGradient></Defs><Rect width="100%" height="100%" fill={"url(#"+id+")"}/>
 </Svg></View>;
}
