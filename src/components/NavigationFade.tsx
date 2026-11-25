import { memo, useId } from "react";
import { StyleSheet,View } from "react-native";
import Svg,{Defs,LinearGradient,Rect,Stop} from "react-native-svg";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../state/ThemeProvider";
import { NAVIGATION_ROW_HEIGHT } from "../theme/navigation";
import { bottomNavigationFade } from "../theme/navigation-fade";
function Fade(){
 const {colors}=useTheme();const inset=useSafeAreaInsets();
 const {height,stops}=bottomNavigationFade(NAVIGATION_ROW_HEIGHT,inset.bottom,colors.navigationOpacity);
 const id="navigation"+useId().replace(/[^a-z0-9]/gi,"");
 return <View pointerEvents="none" testID="navigation-fade" style={{position:"absolute",left:0,right:0,bottom:0,height}}>
 <Svg width="100%" height="100%" style={StyleSheet.absoluteFill} accessible={false}>
  <Defs><LinearGradient id={id} x1="0%" y1="0%" x2="0%" y2="100%">
   {stops.map(({offset,opacity})=><Stop key={offset} offset={offset} stopColor={colors.paper} stopOpacity={opacity}/>)}
  </LinearGradient></Defs><Rect width="100%" height="100%" fill={"url(#"+id+")"}/>
 </Svg></View>;
}

export const NavigationFade=memo(Fade);
