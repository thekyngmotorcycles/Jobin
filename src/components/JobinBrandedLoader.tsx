import {useEffect,useRef} from "react";
import {Animated,Easing,View} from "react-native";
import Svg,{Circle,Path} from "react-native-svg";
import {WORDMARK_XML} from "../theme/wordmark";

/** Brand loading indicator: static Jobin J and a rotating silver/gold arc. */
const J_PATH=WORDMARK_XML.match(/<path d=\\"(M517 11[\s\S]*?)\\"\/>/)?.[1]??"";
export function JobinBrandedLoader({size=64}:{size?:number}){
 const progress=useRef(new Animated.Value(0)).current;
 useEffect(()=>{
  const loop=Animated.loop(Animated.timing(progress,{toValue:1,duration:1400,easing:Easing.linear,useNativeDriver:true}));
  loop.start();return ()=>loop.stop();
 },[progress]);
 const rotate=progress.interpolate({inputRange:[0,1],outputRange:["0deg","360deg"]});
 return <View accessible accessibilityRole="progressbar" accessibilityLabel="Cargando" testID="jobin-branded-loader" style={{width:size,height:size,alignItems:"center",justifyContent:"center"}}>
  <Svg width={size*.6} height={size*.6} viewBox="0 0 530 540" accessible={false}><Path d={J_PATH} fill="#F5F5F5"/></Svg>
  <Animated.View pointerEvents="none" style={{position:"absolute",width:size,height:size,transform:[{rotate}]}}>
   <Svg width={size} height={size} viewBox="0 0 100 100" accessible={false}>
    <Circle cx="50" cy="50" r="44" stroke="#B9BEC6" strokeWidth="5" strokeLinecap="round" strokeDasharray="86 190" fill="none"/>
    <Circle cx="50" cy="50" r="44" stroke="#C6A45B" strokeWidth="5" strokeLinecap="round" strokeDasharray="32 244" strokeDashoffset="-88" fill="none"/>
   </Svg>
  </Animated.View>
 </View>;
}
