import { View,type StyleProp,type ViewStyle } from "react-native";
import { SvgXml } from "react-native-svg";
import { useTheme } from "../state/ThemeProvider";
import { WORDMARK_ASPECT,WORDMARK_XML } from "../theme/wordmark";
export function JobinWordmark({width=112,style}:{width?:number;style?:StyleProp<ViewStyle>}){
 const {colors}=useTheme();
 return <View testID="jobin-wordmark" accessible accessibilityLabel="Jobin" accessibilityRole="image" style={[{width,maxWidth:"100%",aspectRatio:WORDMARK_ASPECT,alignSelf:"center",backgroundColor:colors.transparent},style]}>
  <SvgXml xml={WORDMARK_XML} width="100%" height="100%" color={colors.wordmark} accessible={false}/>
 </View>;
}
