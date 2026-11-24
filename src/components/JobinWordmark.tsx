import { View,type StyleProp,type ViewStyle } from "react-native";
import Svg,{Path} from "react-native-svg";
import { useTheme } from "../state/ThemeProvider";
import {JOBIN_BRAND_NAME,JOBIN_BRAND_GOLD,JOBIN_WORDMARK_VIEWBOX,JOBIN_WORDMARK_ASPECT,JOBIN_WORDMARK_INK,JOBIN_WORDMARK_GOLD} from "../theme/brand-art";

/** Approved Jobin wordmark. Identical outlines in both themes; no device font fallback. */
export function JobinWordmark({width=112,style}:{width?:number;style?:StyleProp<ViewStyle>}){
 const {theme}=useTheme();
 return <View testID="jobin-wordmark" accessible accessibilityLabel={JOBIN_BRAND_NAME} accessibilityRole="image" style={[{width,maxWidth:"100%",aspectRatio:JOBIN_WORDMARK_ASPECT,alignSelf:"center"},style]}>
  <Svg width="100%" height="100%" viewBox={JOBIN_WORDMARK_VIEWBOX} preserveAspectRatio="xMidYMid meet" accessible={false}>
   <Path d={JOBIN_WORDMARK_INK} fill={theme==="dark"?"#FFFFFF":"#000000"} fillRule="evenodd"/>
   <Path d={JOBIN_WORDMARK_GOLD} fill={JOBIN_BRAND_GOLD} fillRule="evenodd"/>
  </Svg>
 </View>;
}
