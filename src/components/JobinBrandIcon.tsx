import { View,type StyleProp,type ViewStyle } from "react-native";
import Svg,{Path} from "react-native-svg";
import { useTheme } from "../state/ThemeProvider";
import {JOBIN_BRAND_NAME,JOBIN_BRAND_GOLD,JOBIN_BRAND_INK,JOBIN_ICON_VIEWBOX,JOBIN_ICON_INK,JOBIN_ICON_GOLD} from "../theme/brand-art";

/** Owner-approved icon; use the aligned-endpoint master, not the earlier hexagon. */
export function JobinBrandIcon({size=64,style}:{size?:number;style?:StyleProp<ViewStyle>}){
 const {theme}=useTheme();
 return <View accessible accessibilityRole="image" accessibilityLabel={JOBIN_BRAND_NAME} style={[{width:size,height:size},style]}>
  <Svg width="100%" height="100%" viewBox={JOBIN_ICON_VIEWBOX} preserveAspectRatio="xMidYMid meet" accessible={false}>
   <Path d={JOBIN_ICON_INK} fill={JOBIN_BRAND_INK[theme]} fillRule="evenodd"/>
   <Path d={JOBIN_ICON_GOLD} fill={JOBIN_BRAND_GOLD} fillRule="evenodd"/>
  </Svg>
 </View>;
}
