import {memo,useEffect} from "react";
import {View} from "react-native";
import Svg,{Circle,Polygon} from "react-native-svg";
import Animated,{cancelAnimation,Easing,useAnimatedStyle,useReducedMotion,useSharedValue,withRepeat,withTiming,type SharedValue} from "react-native-reanimated";
import {jobeenTokens} from "../theme/jobeen";
import {useTheme} from "../state/ThemeProvider";

// Three six-tooth outlines, with equal pitch radii. Only the left driver
// meshes with the two right gears; those gears never mesh with one another.
const outline=Array.from({length:6},(_,tooth)=>
 ([-30,-18,-12,12,18] as const).map((offset,i)=>{
  const angle=(tooth*60+offset)*Math.PI/180;
  const radius=i===2||i===3?18:14.5;
  return (20+radius*Math.cos(angle)).toFixed(3)+","+(20+radius*Math.sin(angle)).toFixed(3);
 }).join(" ")
).join(" ");
const positions=[
 {x:30,y:42,direction:1,phase:0},
 {x:54,y:20,direction:-1,phase:2*Math.atan2(-22,24)*180/Math.PI+150},
 {x:54,y:64,direction:-1,phase:2*Math.atan2(22,24)*180/Math.PI+150},
] as const;
const Gear=memo(function Gear({position,size,color,progress}:{position:typeof positions[number];size:number;color:string;progress:SharedValue<number>}){
 const style=useAnimatedStyle(()=>({
  transform:[{rotate:(position.phase+position.direction*progress.value)+"deg"}],
 }));
 const unit=size/84,diameter=40*unit;
 return <Animated.View style={[{position:"absolute",left:(position.x-20)*unit,top:(position.y-20)*unit,width:diameter,height:diameter},style]}>
  <Svg width={diameter} height={diameter} viewBox="0 0 40 40" accessible={false}>
   <Polygon points={outline} stroke={color} strokeWidth={2.3} strokeLinejoin="round" fill="none"/>
   <Circle cx={20} cy={20} r={6.4} stroke={color} strokeWidth={2.3} fill="none"/>
  </Svg>
 </Animated.View>;
});

/** Shared Jobin indeterminate loader. Local vectors, one UI-thread clock,
 * no media requests, backgrounds or separate animation for every image.
 * Mount only while a meaningful operation is pending. Offline is static. */
export const JobinLoadingGears=memo(function JobinLoadingGears({size=36,mode="loading"}:{size?:number;mode?:"loading"|"offline"}){
 const {theme}=useTheme(),t=jobeenTokens(theme);
 const reducedMotion=useReducedMotion();
 const progress=useSharedValue(0);
 useEffect(()=>{
  cancelAnimation(progress);progress.value=0;
  if(mode!=="loading"||reducedMotion)return;
  progress.value=withRepeat(withTiming(360,{duration:3600,easing:Easing.linear}),-1,false);
  return()=>cancelAnimation(progress);
 },[mode,reducedMotion,progress]);
 return <View pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants"
  style={{width:size,height:size,alignSelf:"center",opacity:mode==="offline"?0.66:1}}>
  {positions.map(position=><Gear key={position.y} position={position} size={size} color={t.ink2} progress={progress}/>)}
 </View>;
});
