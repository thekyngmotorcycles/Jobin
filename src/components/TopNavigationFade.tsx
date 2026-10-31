import { useId } from "react";
import { StyleSheet, View } from "react-native";
import Svg, { Defs, LinearGradient, Rect, Stop } from "react-native-svg";
import { useTheme } from "../state/ThemeProvider";

/** The same translucent fade treatment as the bottom navigation, rotated for the top. */
export function TopNavigationFade() {
 const { colors } = useTheme();
 const id = "topNavigation" + useId().replace(/[^a-z0-9]/gi, "");
 return <View pointerEvents="none" testID="top-navigation-fade" style={[StyleSheet.absoluteFill,{overflow:"hidden"}]}>
  <Svg width="100%" height="100%" style={StyleSheet.absoluteFill} accessible={false}>
   <Defs><LinearGradient id={id} x1="0%" y1="0%" x2="0%" y2="100%">
    <Stop offset="0" stopColor={colors.paper} stopOpacity={colors.navigationOpacity}/>
    <Stop offset=".55" stopColor={colors.paper} stopOpacity={colors.navigationOpacity}/>
    <Stop offset=".8" stopColor={colors.paper} stopOpacity={.035}/>
    <Stop offset="1" stopColor={colors.paper} stopOpacity={0}/>
   </LinearGradient></Defs>
   <Rect width="100%" height="100%" fill={"url(#"+id+")"}/>
  </Svg>
 </View>;
}
