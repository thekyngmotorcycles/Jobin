import {useEffect,useRef,useState} from "react";
import {Animated,AppState,Text,View,type GestureResponderEvent} from "react-native";
import Svg,{Circle,Path,Rect} from "react-native-svg";
import {useReducedMotion} from "react-native-reanimated";
import type {VideoPlayer} from "expo-video";
import {useTheme} from "../state/ThemeProvider";
import {playbackFraction,playbackTime,seekPosition} from "../lib/video-progress";

export const FLASH_PROGRESS_HEIGHT=48;
export function PlaybackGlyph({paused}:{paused:boolean}){
 const {colors}=useTheme();const motion=useReducedMotion();const fade=useRef(new Animated.Value(1)).current;
 useEffect(()=>{fade.setValue(motion?1:.45);const a=Animated.timing(fade,{toValue:1,duration:motion?0:150,useNativeDriver:true});a.start();return()=>a.stop();},[paused,fade,motion]);
 return <Animated.View style={{opacity:fade}} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
  <Svg viewBox="0 0 64 64" width={60} height={60}>
   <Circle cx={32} cy={32} r={29} fill={colors.mediaSoftSurface} stroke={colors.mediaProgressActive} strokeWidth={1.5}/>
   {paused?<Path d="M24 18 Q21 17 21 22 L21 42 Q21 46 25 43 L45 34 Q49 32 44 29 Z" fill={colors.mediaProgressActive}/>:<><Rect x={21} y={19} width={8} height={26} rx={3} fill={colors.mediaProgressActive}/><Rect x={35} y={19} width={8} height={26} rx={3} fill={colors.mediaProgressActive}/></>}
  </Svg>
 </Animated.View>;
}
export function FlashProgress({player,clipId,active,bottom,onScrubbingChange}:{player:VideoPlayer;clipId:string;active:boolean;bottom:number;onScrubbingChange?:(id:string,dragging:boolean)=>void}){
 const {colors}=useTheme();const [width,setWidth]=useState(0);const [duration,setDuration]=useState(0);
 const [position,setPosition]=useState(0);const [preview,setPreview]=useState<number|null>(null);const dragging=useRef(false);
 useEffect(()=>{
  if(!active)return;
  let alive=true;
  const read=()=>{if(!alive)return;const d=player.duration;setDuration(Number.isFinite(d)&&d>0?d:0);if(!dragging.current)setPosition(player.currentTime);};
  player.timeUpdateEventInterval=.25;
  read();
  const time=player.addListener("timeUpdate",read);
  const status=player.addListener("statusChange",read);
  const app=AppState.addEventListener("change",state=>{if(state!=="active"){dragging.current=false;setPreview(null);onScrubbingChange?.(clipId,false);}});
  return()=>{alive=false;time.remove();status.remove();app.remove();if(dragging.current){dragging.current=false;onScrubbingChange?.(clipId,false);}try{player.timeUpdateEventInterval=0;}catch{/* Player may already be released. */}};
 },[active,player,clipId,onScrubbingChange]);
 const ready=active&&duration>0&&width>0;
 const display=preview??position;const progress=playbackFraction(display,duration);const interacting=preview!==null;
 function update(e:GestureResponderEvent){const next=seekPosition(e.nativeEvent.locationX,width,duration);setPreview(next);return next;}
 function finish(e?:GestureResponderEvent){if(!dragging.current)return;dragging.current=false;
  if(e&&ready&&AppState.currentState==="active"){const next=seekPosition(e.nativeEvent.locationX,width,duration);try{player.currentTime=next;setPosition(next);}catch{/* Released video cannot be sought. */}}
  setPreview(null);onScrubbingChange?.(clipId,false);
 }
 function adjust(delta:number){if(!ready||AppState.currentState!=="active")return;const next=Math.min(duration,Math.max(0,position+delta));try{player.currentTime=next;setPosition(next);}catch{/* Released video. */}}
 return <View style={{position:"absolute",left:12,right:12,bottom,height:FLASH_PROGRESS_HEIGHT,justifyContent:"flex-end",paddingBottom:8,zIndex:5}}
  onLayout={e=>setWidth(e.nativeEvent.layout.width)}
  accessible accessibilityRole="adjustable" accessibilityLabel="Posición de reproducción"
  accessibilityState={{disabled:!ready}} accessibilityValue={{min:0,max:Math.round(duration),now:Math.round(progress*duration),text:playbackTime(display)+" de "+playbackTime(duration)}}
  accessibilityActions={[{name:"increment",label:"Adelantar 5 segundos"},{name:"decrement",label:"Retroceder 5 segundos"}]}
  onAccessibilityAction={e=>{if(e.nativeEvent.actionName==="increment")adjust(5);if(e.nativeEvent.actionName==="decrement")adjust(-5);}}
  onStartShouldSetResponder={()=>ready} onMoveShouldSetResponder={()=>ready}
  onResponderGrant={e=>{dragging.current=true;onScrubbingChange?.(clipId,true);update(e);}}
  onResponderMove={e=>{if(dragging.current)update(e);}}
  onResponderRelease={e=>finish(e)} onResponderTerminate={()=>finish()} onResponderTerminationRequest={()=>false}>
  <View pointerEvents="none" style={{flex:1,justifyContent:"flex-end",gap:5}}>
   {interacting&&<Text style={{alignSelf:"center",paddingHorizontal:8,borderRadius:8,backgroundColor:colors.mediaCaption,color:colors.mediaText,fontSize:12,fontWeight:"700",fontVariant:["tabular-nums"]}}>{playbackTime(display)} / {playbackTime(duration)}</Text>}
   <View style={{height:interacting?5:3,borderRadius:3,backgroundColor:interacting?colors.mediaProgressTrackActive:colors.mediaProgressTrack}}>
    <View style={{height:"100%",width:`${progress*100}%`,borderRadius:3,backgroundColor:interacting?colors.mediaProgressActive:colors.mediaProgress}}/>
    {interacting&&<View style={{position:"absolute",left:`${progress*100}%`,top:-2,marginLeft:-4,width:9,height:9,borderRadius:5,backgroundColor:colors.mediaProgressActive}}/>}
   </View>
  </View>
 </View>;
}
