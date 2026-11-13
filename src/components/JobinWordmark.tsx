import { Text,View,type StyleProp,type ViewStyle } from "react-native";
import Svg,{Path} from "react-native-svg";
import { useTheme } from "../state/ThemeProvider";
import { jobeenTokens } from "../theme/jobeen";

/** Jobeen wordmark shared by the application header and compact branded surfaces. */
export function JobinWordmark({width=112,style}:{width?:number;style?:StyleProp<ViewStyle>}){
 const {theme}=useTheme();const t=jobeenTokens(theme);
 const scale=width/112;
 const fontSize=34*scale;
 const hexSize=22*scale;
 const lettering={fontFamily:"cursive" as const,fontStyle:"italic" as const,fontWeight:"700" as const,fontSize,color:t.ink,lineHeight:fontSize*1.35};
 return <View testID="jobin-wordmark" accessible accessibilityLabel="Jobeen" accessibilityRole="image" style={[{width,maxWidth:"100%",alignSelf:"center",flexDirection:"row",alignItems:"center",justifyContent:"center"},style]}>
  <Svg width={hexSize} height={hexSize} viewBox="0 0 22 22" accessible={false}>
   <Path d="M11 1.5 19.2 6.2v9.6L11 20.5 2.8 15.8V6.2Z" fill={t.hexFront} stroke={t.ink} strokeWidth="1.5"/>
   <Path d="M11 1.5v9.5l8.2-4.8" fill="none" stroke={t.hexBack} strokeWidth="1.5"/>
  </Svg>
  <View style={{flexDirection:"row",alignItems:"baseline",marginLeft:3*scale,flexShrink:1}}>
   <Text style={lettering}>Job</Text>
   <View style={{justifyContent:"center"}}>
    <View pointerEvents="none" style={{position:"absolute",left:0,right:0,bottom:fontSize*.15,height:fontSize*.48,backgroundColor:t.yellow}}/>
    <Text style={lettering}>ee</Text>
   </View>
   <Text style={lettering}>n</Text>
  </View>
 </View>;
}
