import { useEffect,useMemo,useRef } from "react";
import { Animated,PanResponder } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../state/ThemeProvider";
import { useTabClearance } from "../theme/navigation";
import { ASSISTANT_SIZE,assistantBounds,clampAssistant,parseAssistantPosition,restoreAssistant,snapAssistant,type AssistantPosition } from "../lib/assistant-position";
const STORAGE_KEY="jobin.assistant.position.v1";
export function DraggableAssistant({width,height}:{width:number;height:number}){
 const {colors}=useTheme();const inset=useSafeAreaInsets();const {barHeight}=useTabClearance();
 const bounds=assistantBounds(width,height,inset,barHeight);const boundsRef=useRef(bounds);boundsRef.current=bounds;
 const saved=useRef<AssistantPosition>({edge:"right",fraction:.64});const interacted=useRef(false);
 const initial=restoreAssistant(saved.current,bounds);const current=useRef(initial);const start=useRef(initial);
 const animation=useRef(new Animated.ValueXY(initial)).current;const writes=useRef(Promise.resolve());
 useEffect(()=>{const id=animation.addListener(point=>{current.current=point;});return()=>animation.removeListener(id);},[animation]);
 useEffect(()=>{let mounted=true;void AsyncStorage.getItem(STORAGE_KEY).then(raw=>{const value=parseAssistantPosition(raw);if(mounted&&value&&!interacted.current){saved.current=value;const next=restoreAssistant(value,boundsRef.current);current.current=next;animation.setValue(next);}}).catch(()=>{});return()=>{mounted=false;animation.stopAnimation();};},[animation]);
 useEffect(()=>{const next=restoreAssistant(saved.current,boundsRef.current);current.current=next;animation.setValue(next);},[animation,bounds.minX,bounds.maxX,bounds.minY,bounds.maxY]);
 const pan=useMemo(()=>{
  function settle(){const next=snapAssistant(current.current,boundsRef.current);saved.current=next.saved;writes.current=writes.current.catch(()=>{}).then(()=>AsyncStorage.setItem(STORAGE_KEY,JSON.stringify(next.saved)));Animated.spring(animation,{toValue:next.point,stiffness:240,damping:25,mass:1,overshootClamping:true,useNativeDriver:false}).start();}
  return PanResponder.create({
   onStartShouldSetPanResponder:()=>false,
   onMoveShouldSetPanResponder:(_,gesture)=>Math.hypot(gesture.dx,gesture.dy)>5,
   onPanResponderGrant:()=>{interacted.current=true;start.current=current.current;animation.stopAnimation(point=>{start.current=clampAssistant(point,boundsRef.current);});},
   onPanResponderMove:(_,gesture)=>{const point=clampAssistant({x:start.current.x+gesture.dx,y:start.current.y+gesture.dy},boundsRef.current);current.current=point;animation.setValue(point);},
   onPanResponderRelease:settle,onPanResponderTerminate:settle,onPanResponderTerminationRequest:()=>false,
  });
 },[animation]);
 return <Animated.View {...pan.panHandlers} testID="home-ai-assistant" accessible accessibilityRole="button" accessibilityLabel="Asistente de IA (próximamente)" accessibilityHint="Arrastra para moverlo. Un toque todavía no realiza ninguna acción."
 style={{position:"absolute",left:0,top:0,width:ASSISTANT_SIZE,height:ASSISTANT_SIZE,borderRadius:ASSISTANT_SIZE/2,backgroundColor:colors.ink,alignItems:"center",justifyContent:"center",zIndex:50,elevation:5,transform:animation.getTranslateTransform()}}>
  <Ionicons name="sparkles-outline" size={25} color={colors.paper}/>
 </Animated.View>;
}
