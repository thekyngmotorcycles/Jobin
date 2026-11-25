import {memo,useCallback,useState} from "react";
import {StyleSheet,View,type DimensionValue} from "react-native";
import {LinearGradient} from "expo-linear-gradient";
import {useFocusEffect} from "expo-router";
import Animated,{cancelAnimation,Easing,useAnimatedStyle,useReducedMotion,useSharedValue,withRepeat,withTiming,type SharedValue} from "react-native-reanimated";
import {useTheme} from "../state/ThemeProvider";
import {jobeenTokens} from "../theme/jobeen";
import {JOBEEN_CONTROL} from "../theme/control-metrics";
import {useWindowDimensions} from "react-native";

// One clock per visible skeleton list. No loops per image, no media or network work.
const ShimmerBlock=memo(function ShimmerBlock({width,height,radius=7,clock,base,highlight,animated}:{width:DimensionValue;height:number;radius?:number;clock:SharedValue<number>;base:string;highlight:string;animated:boolean}){
 const [measured,setMeasured]=useState(0);
 const band=useAnimatedStyle(()=>({transform:[{translateX:(clock.value*2-1)*measured}]}));
 return <View onLayout={event=>{const w=Math.round(event.nativeEvent.layout.width);setMeasured(previous=>previous===w?previous:w);}} style={{width,height,borderRadius:radius,backgroundColor:base,overflow:"hidden"}}>
  {animated&&measured>0&&<Animated.View pointerEvents="none" style={[StyleSheet.absoluteFillObject,band]}>
   <LinearGradient colors={[base,highlight,base]} locations={[0,0.5,1]} start={{x:0,y:0.5}} end={{x:1,y:0.5}} style={StyleSheet.absoluteFill}/>
  </Animated.View>}
 </View>;
});
/** Shared dimensions for real JShop rows and their placeholders. */
export function jshopItemGeometry(width:number){
 return {imageSize:width<=350?90:width<=430?106:width>=800?124:112,gap:width<=350?9:12,minHeight:128,padding:9};
}
export function JShopListingSkeleton({withFavorite=true,count=3}:{withFavorite?:boolean;count?:number}){
 const {theme}=useTheme(),t=jobeenTokens(theme),{width}=useWindowDimensions();
 const {imageSize,gap,minHeight,padding}=jshopItemGeometry(width);
 const reducedMotion=useReducedMotion();
 const clock=useSharedValue(0);
 useFocusEffect(useCallback(()=>{
  cancelAnimation(clock);clock.value=0;
  if(reducedMotion)return;
  clock.value=withRepeat(withTiming(1,{duration:1500,easing:Easing.linear}),-1,false);
  return()=>{cancelAnimation(clock);clock.value=0;};
 },[clock,reducedMotion]));
 const palette={base:theme==="light"?"#E5E8EB":"#343941",highlight:theme==="light"?"#F7F8FA":"#4B515A",clock,animated:!reducedMotion};
 return <View accessibilityRole="progressbar" accessibilityLabel="Cargando artículos" accessibilityState={{busy:true}} style={{gap:10}}>
  <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={{gap:10}}>
   {Array.from({length:Math.max(1,Math.min(4,Math.floor(count)))},(_,i)=>
    <View key={i} style={{width:"100%",minHeight,padding,borderRadius:JOBEEN_CONTROL.cardRadius,backgroundColor:t.surface,borderWidth:1,borderColor:t.line,flexDirection:"row",alignItems:"flex-start",gap}}>
     <ShimmerBlock width={imageSize} height={imageSize} radius={15} {...palette}/>
     <View style={{flex:1,minWidth:0,gap:7,paddingTop:2}}>
      <ShimmerBlock width="90%" height={14} {...palette}/>
      <ShimmerBlock width="62%" height={12} {...palette}/>
      <ShimmerBlock width="48%" height={16} {...palette}/>
      <ShimmerBlock width="78%" height={10} {...palette}/>
      <ShimmerBlock width="56%" height={10} {...palette}/>
     </View>
     {withFavorite&&<ShimmerBlock width={JOBEEN_CONTROL.touchTarget} height={JOBEEN_CONTROL.touchTarget} radius={24} {...palette}/>}
    </View>)}
  </View>
 </View>;
}
