import { Text,View,type StyleProp,type ViewStyle } from "react-native";
import { useTheme } from "../state/ThemeProvider";
import { jobeenTokens } from "../theme/jobeen";

/** Jobeen script lettering; native cursive fallback until a licensed script font is bundled. */
export function JobinWordmark({width=112,style}:{width?:number;style?:StyleProp<ViewStyle>}){
 const {theme}=useTheme();const t=jobeenTokens(theme);
 return <View testID="jobin-wordmark" accessible accessibilityLabel="Jobeen" accessibilityRole="image" style={[{width,maxWidth:"100%",alignSelf:"center",alignItems:"center",justifyContent:"center"},style]}>
  <Text numberOfLines={1} adjustsFontSizeToFit style={{fontFamily:"cursive",fontStyle:"italic",fontWeight:"700",fontSize:width*0.29,color:t.ink}}>Jobeen</Text>
 </View>;
}
