import {useEffect} from "react";
import {View} from "react-native";
import Svg,{Path,Polygon,Ellipse} from "react-native-svg";
import Animated,{cancelAnimation,interpolate,useAnimatedStyle,useReducedMotion,useSharedValue,withRepeat,withSequence,withTiming} from "react-native-reanimated";
import {jobeenTokens} from "../theme/jobeen";
import {useTheme} from "../state/ThemeProvider";

/**
 * A miniature geometric Jobeen bee: hexagonal body, two silver wings and
 * three restrained dark stripes. Intended only for JCard loading/offline states.
 * Offline is static, never a deceptive infinite spinner.
 */
export function JCardAbstractBee({size=42,mode="loading"}:{size?:number;mode?:"loading"|"offline"}){
 const {theme}=useTheme(),t=jobeenTokens(theme);
 const reducedMotion=useReducedMotion();
 const progress=useSharedValue(0);
 useEffect(()=>{
  if(mode!=="loading"||reducedMotion){cancelAnimation(progress);progress.value=0;return;}
  progress.value=withRepeat(withSequence(
   withTiming(1,{duration:660}),
   withTiming(0,{duration:730})
  ),-1,false);
  return()=>cancelAnimation(progress);
 },[mode,reducedMotion,progress]);
 const animatedStyle=useAnimatedStyle(()=>({
  opacity:mode==="loading"?interpolate(progress.value,[0,1],[0.7,1]):0.66,
  transform:[
   {translateX:mode==="loading"?interpolate(progress.value,[0,1],[-4,4]):0},
   {translateY:mode==="loading"?interpolate(progress.value,[0,1],[1,-2]):0}
  ]
 }));
 return <View pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants"
  style={{width:size+12,height:size+12,alignItems:"center",justifyContent:"center"}}>
  <Animated.View style={[{width:size,height:size},animatedStyle]}>
   <Svg width={size} height={size} viewBox="0 0 64 64" accessible={false}>
    <Path d="M22 24 C10 17 7 10 17 8 C27 6 31 18 32 24" stroke={t.silver} strokeWidth={2} fill={t.surface} strokeLinejoin="round"/>
    <Path d="M42 24 C54 17 57 10 47 8 C37 6 33 18 32 24" stroke={t.silver} strokeWidth={2} fill={t.surface} strokeLinejoin="round"/>
    <Polygon points="32,20 46,28 46,44 32,52 18,44 18,28" fill={t.yellow} stroke={t.ink} strokeWidth={1.6} strokeLinejoin="round"/>
    <Path d="M24 26 L24 46 M32 22 L32 50 M40 26 L40 46" stroke={t.ink} strokeWidth={2.1} strokeOpacity={0.62} strokeLinecap="round"/>
    <Ellipse cx="31.5" cy="19" rx="5.5" ry="4" fill={t.ink}/>
   </Svg>
  </Animated.View>
 </View>;
}
